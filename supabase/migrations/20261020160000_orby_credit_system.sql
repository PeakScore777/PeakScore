-- Orby tutor credits: server-only accounting with atomic reservations.
create table if not exists public.orby_credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance between 0 and 30),
  daily_date date not null default (timezone('America/Bogota', now())::date),
  messages_today integer not null default 0 check (messages_today >= 0),
  images_today integer not null default 0 check (images_today >= 0),
  promo_status text not null default 'eligible' check (promo_status in ('eligible', 'blocked', 'review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orby_credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  delta integer not null,
  reason text not null check (reason in ('initial_grant', 'daily_refill', 'tutor_charge', 'tutor_refund', 'admin_adjustment')),
  has_image boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, request_id, reason)
);

alter table public.orby_credit_accounts enable row level security;
alter table public.orby_credit_ledger enable row level security;
revoke all on public.orby_credit_accounts from anon, authenticated;
revoke all on public.orby_credit_ledger from anon, authenticated;

create or replace function public.orby_reserve_credits(
  p_user_id uuid, p_request_id uuid, p_cost integer, p_has_image boolean
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_today date := timezone('America/Bogota', now())::date;
  v_confirmed_at timestamptz;
  v_account public.orby_credit_accounts%rowtype;
  v_inserted integer := 0;
  v_old_balance integer;
begin
  if p_user_id is null or p_request_id is null or p_cost not in (2, 3) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select u.email_confirmed_at into v_confirmed_at from auth.users u where u.id = p_user_id;
  if not found or v_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'email_unverified');
  end if;

  insert into public.orby_credit_accounts (user_id, balance, daily_date)
  values (p_user_id, 30, v_today) on conflict (user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    insert into public.orby_credit_ledger (user_id, request_id, delta, reason)
    values (p_user_id, p_request_id, 30, 'initial_grant')
    on conflict (user_id, request_id, reason) do nothing;
  end if;

  select * into v_account from public.orby_credit_accounts
  where user_id = p_user_id for update;

  if v_account.promo_status = 'blocked' then
    return jsonb_build_object('ok', false, 'code', 'promotional_access_blocked', 'balance', 0);
  end if;
  if v_account.promo_status = 'review' then
    return jsonb_build_object('ok', false, 'code', 'account_review', 'balance', v_account.balance);
  end if;

  if v_account.daily_date <> v_today then
    v_old_balance := v_account.balance;
    update public.orby_credit_accounts
      set balance = least(30, balance + 5), daily_date = v_today,
          messages_today = 0, images_today = 0, updated_at = now()
      where user_id = p_user_id returning * into v_account;
    insert into public.orby_credit_ledger (user_id, request_id, delta, reason)
    values (p_user_id, p_request_id, v_account.balance - v_old_balance, 'daily_refill')
    on conflict (user_id, request_id, reason) do nothing;
  end if;

  if v_account.messages_today >= 20 then
    return jsonb_build_object('ok', false, 'code', 'daily_message_limit', 'balance', v_account.balance);
  end if;
  if p_has_image and v_account.images_today >= 3 then
    return jsonb_build_object('ok', false, 'code', 'daily_image_limit', 'balance', v_account.balance);
  end if;
  if v_account.balance < p_cost then
    return jsonb_build_object('ok', false, 'code', 'insufficient_credits', 'balance', v_account.balance);
  end if;

  update public.orby_credit_accounts
    set balance = balance - p_cost, messages_today = messages_today + 1,
        images_today = images_today + case when p_has_image then 1 else 0 end,
        updated_at = now()
    where user_id = p_user_id returning * into v_account;

  insert into public.orby_credit_ledger (user_id, request_id, delta, reason, has_image)
  values (p_user_id, p_request_id, -p_cost, 'tutor_charge', coalesce(p_has_image, false));

  return jsonb_build_object('ok', true, 'balance', v_account.balance, 'cost', p_cost);
end;
$$;

create or replace function public.orby_refund_credits(p_user_id uuid, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_charge integer;
  v_has_image boolean;
  v_account public.orby_credit_accounts%rowtype;
begin
  select * into v_account
  from public.orby_credit_accounts
  where user_id = p_user_id
  for update;

  if not found then return jsonb_build_object('ok', false, 'code', 'account_not_found'); end if;

  select -l.delta, l.has_image into v_charge, v_has_image
  from public.orby_credit_ledger l
  where l.user_id = p_user_id and l.request_id = p_request_id
    and l.reason = 'tutor_charge' and l.delta < 0;

  if v_charge is null then return jsonb_build_object('ok', false, 'code', 'charge_not_found'); end if;

  if exists (select 1 from public.orby_credit_ledger l
    where l.user_id = p_user_id and l.request_id = p_request_id and l.reason = 'tutor_refund') then
    return jsonb_build_object('ok', true, 'already_refunded', true, 'balance', v_account.balance);
  end if;

  update public.orby_credit_accounts
    set balance = least(30, balance + v_charge),
        messages_today = greatest(0, messages_today - 1),
        images_today = greatest(0, images_today - case when v_has_image then 1 else 0 end),
        updated_at = now()
    where user_id = p_user_id returning * into v_account;

  insert into public.orby_credit_ledger (user_id, request_id, delta, reason, has_image)
  values (p_user_id, p_request_id, v_charge, 'tutor_refund', coalesce(v_has_image, false));

  return jsonb_build_object('ok', true, 'balance', v_account.balance);
end;
$$;


create or replace function public.orby_get_credits(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_confirmed_at timestamptz;
  v_today date := timezone('America/Bogota', now())::date;
  v_inserted integer := 0;
  v_old_balance integer;
  v_account public.orby_credit_accounts%rowtype;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select u.email_confirmed_at into v_confirmed_at
  from auth.users u where u.id = p_user_id;

  if not found or v_confirmed_at is null then
    return jsonb_build_object('ok', false, 'code', 'email_unverified');
  end if;

  insert into public.orby_credit_accounts (user_id, balance, daily_date)
  values (p_user_id, 30, v_today)
  on conflict (user_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    insert into public.orby_credit_ledger (user_id, request_id, delta, reason)
    values (p_user_id, gen_random_uuid(), 30, 'initial_grant');
  end if;

  select * into v_account
  from public.orby_credit_accounts
  where user_id = p_user_id for update;

  if v_account.promo_status = 'blocked' then
    return jsonb_build_object('ok', true, 'balance', 0, 'promoStatus', 'blocked');
  end if;

  if v_account.daily_date <> v_today then
    v_old_balance := v_account.balance;
    update public.orby_credit_accounts
    set balance = least(30, balance + 5),
        daily_date = v_today,
        messages_today = 0,
        images_today = 0,
        updated_at = now()
    where user_id = p_user_id
    returning * into v_account;

    insert into public.orby_credit_ledger (user_id, request_id, delta, reason)
    values (p_user_id, gen_random_uuid(), v_account.balance - v_old_balance, 'daily_refill');
  end if;

  return jsonb_build_object(
    'ok', true,
    'balance', v_account.balance,
    'promoStatus', v_account.promo_status,
    'messagesToday', v_account.messages_today,
    'imagesToday', v_account.images_today
  );
end;
$$;

revoke all on function public.orby_get_credits(uuid) from public, anon, authenticated;
grant execute on function public.orby_get_credits(uuid) to service_role;

revoke all on function public.orby_reserve_credits(uuid, uuid, integer, boolean) from public, anon, authenticated;
revoke all on function public.orby_refund_credits(uuid, uuid) from public, anon, authenticated;
grant execute on function public.orby_reserve_credits(uuid, uuid, integer, boolean) to service_role;
grant execute on function public.orby_refund_credits(uuid, uuid) to service_role;

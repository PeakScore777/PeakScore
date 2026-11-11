-- Daily Cloudflare Workers AI neuron budget for PeakScore Orby.
-- Service-role-only atomic reservation; fail closed when budget state is unavailable.

create table if not exists public.orby_cloudflare_neuron_budget (
  budget_date date primary key,
  neurons_reserved integer not null default 0 check (neurons_reserved >= 0),
  updated_at timestamptz not null default now()
);

alter table public.orby_cloudflare_neuron_budget enable row level security;
revoke all on table public.orby_cloudflare_neuron_budget from public, anon, authenticated;
grant select, insert, update on table public.orby_cloudflare_neuron_budget to service_role;

create or replace function public.orby_reserve_cloudflare_neuron_budget(
  p_neurons integer,
  p_daily_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reserved integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_neurons is null or p_daily_limit is null
     or p_neurons < 1 or p_daily_limit < 1
     or p_neurons > p_daily_limit then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_request');
  end if;

  insert into public.orby_cloudflare_neuron_budget as budget
    (budget_date, neurons_reserved, updated_at)
  values (v_today, p_neurons, now())
  on conflict (budget_date) do update
    set neurons_reserved = budget.neurons_reserved + excluded.neurons_reserved,
        updated_at = now()
    where budget.neurons_reserved + excluded.neurons_reserved <= p_daily_limit
  returning neurons_reserved into v_reserved;

  if v_reserved is null then
    return jsonb_build_object('allowed', false, 'reason', 'daily_limit');
  end if;

  return jsonb_build_object('allowed', true, 'reserved', v_reserved, 'daily_limit', p_daily_limit);
end;
$$;

revoke all on function public.orby_reserve_cloudflare_neuron_budget(integer, integer) from public, anon, authenticated;
grant execute on function public.orby_reserve_cloudflare_neuron_budget(integer, integer) to service_role;

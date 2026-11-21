-- PeakScore: economía, progreso, personajes e insignias
-- Primera versión funcional. No modifica ni elimina datos existentes.

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists coins integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists selected_character text not null default 'peaky-nova';

alter table public.profiles
  add constraint profiles_xp_nonnegative check (xp >= 0),
  add constraint profiles_coins_nonnegative check (coins >= 0),
  add constraint profiles_level_positive check (level >= 1);

create table if not exists public.characters (
  id text primary key,
  name text not null unique,
  description text not null,
  price_coins integer not null default 0,
  xp_bonus_percent integer not null default 0,
  coin_bonus_percent integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint characters_price_nonnegative check (price_coins >= 0),
  constraint characters_xp_bonus_range check (xp_bonus_percent between 0 and 25),
  constraint characters_coin_bonus_range check (coin_bonus_percent between 0 and 25)
);

create table if not exists public.user_characters (
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id text not null references public.characters(id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

create table if not exists public.badges (
  id text primary key,
  name text not null unique,
  description text not null,
  requirement_type text not null,
  requirement_target integer not null,
  icon text,
  created_at timestamptz not null default now(),
  constraint badges_target_positive check (requirement_target > 0),
  constraint badges_requirement_type_valid check (
    requirement_type in (
      'simulations_completed',
      'simple_completed',
      'complete_completed',
      'perfect_complete',
      'score_90',
      'streak_days'
    )
  )
);

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists idx_user_characters_user
  on public.user_characters(user_id);

create index if not exists idx_user_badges_user
  on public.user_badges(user_id);

insert into public.characters
  (id, name, description, price_coins, xp_bonus_percent, coin_bonus_percent)
values
  ('peaky-nova', 'Peaky Nova', 'El guardián del universo PeakScore.', 0, 0, 0),
  ('peaky-nox', 'Peaky Nox', 'La fuerza del multiverso oscuro.', 0, 0, 0),
  ('zyra', 'Zyra', 'Curiosidad, exploración y aprendizaje.', 500, 10, 0),
  ('orby', 'Orby', 'Tecnología, precisión e inteligencia.', 750, 0, 10)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_coins = excluded.price_coins,
  xp_bonus_percent = excluded.xp_bonus_percent,
  coin_bonus_percent = excluded.coin_bonus_percent,
  is_active = true;

insert into public.badges
  (id, name, description, requirement_type, requirement_target, icon)
values
  ('primer-paso', 'Primer paso', 'Completa tu primer simulacro.', 'simulations_completed', 1, '🎯'),
  ('aprendizaje-1', 'Aprendizaje I', 'Completa 5 simulacros simples.', 'simple_completed', 5, '📚'),
  ('aprendizaje-2', 'Aprendizaje II', 'Completa 20 simulacros simples.', 'simple_completed', 20, '🧠'),
  ('constante-1', 'Constante I', 'Completa 3 simulacros completos.', 'complete_completed', 3, '🔥'),
  ('constante-2', 'Constante II', 'Completa 10 simulacros completos.', 'complete_completed', 10, '⚡'),
  ('perfeccionista', 'Perfeccionista', 'Completa un simulacro completo con 100% de aciertos.', 'perfect_complete', 1, '💯')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  requirement_type = excluded.requirement_type,
  requirement_target = excluded.requirement_target,
  icon = excluded.icon;

-- Los usuarios existentes reciben únicamente los dos personajes iniciales.
insert into public.user_characters (user_id, character_id)
select p.id, c.id
from public.profiles p
cross join public.characters c
where c.id in ('peaky-nova', 'peaky-nox')
on conflict do nothing;

-- Normalizamos el progreso inicial de cuentas existentes que todavía no tenían economía.
update public.profiles
set xp = coalesce(xp, 0),
    coins = coalesce(coins, 0),
    level = greatest(coalesce(level, 1), 1),
    selected_character = case
      when selected_character in ('peaky-nova', 'peaky-nox') then selected_character
      else 'peaky-nova'
    end;

-- Nueva cuenta: perfil + Nova/Nox.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    target_score,
    average_score,
    streak,
    simulations,
    xp,
    coins,
    level,
    selected_character
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    500,
    0,
    0,
    0,
    0,
    0,
    1,
    'peaky-nova'
  );

  insert into public.user_characters (user_id, character_id)
  values
    (new.id, 'peaky-nova'),
    (new.id, 'peaky-nox')
  on conflict do nothing;

  return new;
end;
$function$;

-- Catálogos públicos; la posesión/recompensas nunca se escriben desde el cliente.
alter table public.characters enable row level security;
alter table public.badges enable row level security;
alter table public.user_characters enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "characters_select_active" on public.characters;
create policy "characters_select_active"
on public.characters
for select
to authenticated
using (is_active = true);

drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all"
on public.badges
for select
to authenticated
using (true);

drop policy if exists "user_characters_select_own" on public.user_characters;
create policy "user_characters_select_own"
on public.user_characters
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges
for select
to authenticated
using (user_id = auth.uid());

-- El usuario puede equipar únicamente un personaje que ya posee.
create or replace function public.equip_character(p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if not exists (
    select 1
    from public.user_characters
    where user_id = v_user_id
      and character_id = p_character_id
  ) then
    raise exception 'CHARACTER_NOT_UNLOCKED';
  end if;

  update public.profiles
  set selected_character = p_character_id
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'characterId', p_character_id
  );
end;
$function$;

-- Comprar/desbloquear personajes con monedas ganadas.
create or replace function public.purchase_character(p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_price integer;
  v_coins integer;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':character:' || p_character_id, 0)
  );

  if exists (
    select 1
    from public.user_characters
    where user_id = v_user_id
      and character_id = p_character_id
  ) then
    raise exception 'CHARACTER_ALREADY_UNLOCKED';
  end if;

  select price_coins
    into v_price
  from public.characters
  where id = p_character_id
    and is_active = true
  for update;

  if v_price is null then
    raise exception 'CHARACTER_NOT_FOUND';
  end if;

  select coins into v_coins
  from public.profiles
  where id = v_user_id
  for update;

  if v_coins < v_price then
    raise exception 'INSUFFICIENT_COINS';
  end if;

  update public.profiles
  set coins = coins - v_price
  where id = v_user_id;

  insert into public.user_characters (user_id, character_id)
  values (v_user_id, p_character_id);

  return jsonb_build_object(
    'success', true,
    'characterId', p_character_id,
    'price', v_price,
    'remainingCoins', v_coins - v_price
  );
end;
$function$;

grant execute on function public.equip_character(text) to authenticated;
grant execute on function public.purchase_character(text) to authenticated;

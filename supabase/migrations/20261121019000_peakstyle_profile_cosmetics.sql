-- PeakStyle profile customization and permanent PeakCoin cosmetics.
-- This migration depends on 20261121018000_community_founder_authority_and_moderation.sql.
-- It does not alter the existing character unlocks, selected_character or wallet schema.

alter table public.profiles
  add column if not exists profile_bio text not null default '',
  add column if not exists profile_pronouns text not null default '';

alter table public.profiles
  drop constraint if exists profiles_peakstyle_bio_length,
  drop constraint if exists profiles_peakstyle_pronouns_length,
  add constraint profiles_peakstyle_bio_length check (char_length(profile_bio) <= 160),
  add constraint profiles_peakstyle_pronouns_length check (char_length(profile_pronouns) <= 32);

create table if not exists public.community_profile_cosmetics (
  id text primary key,
  name text not null,
  description text not null default '',
  category text not null check (category in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme')),
  asset_path text,
  preview_path text,
  price_coins integer not null check (price_coins >= 0),
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary')),
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_limited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_profile_cosmetics_id_format
    check (id ~ '^[a-z][a-z0-9_-]{1,63}$')
);

create index if not exists community_profile_cosmetics_catalog_idx
  on public.community_profile_cosmetics (category, is_active, price_coins);

create table if not exists public.user_profile_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_id text not null references public.community_profile_cosmetics(id) on delete restrict,
  purchased_at timestamptz not null default now(),
  price_paid integer not null check (price_paid >= 0),
  primary key (user_id, cosmetic_id)
);

create index if not exists user_profile_cosmetics_inventory_idx
  on public.user_profile_cosmetics (user_id, purchased_at desc);

create table if not exists public.user_profile_cosmetic_equipment (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme')),
  cosmetic_id text not null references public.community_profile_cosmetics(id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot),
  constraint user_profile_cosmetic_equipment_ownership_fk
    foreign key (user_id, cosmetic_id)
    references public.user_profile_cosmetics(user_id, cosmetic_id)
    on delete cascade
);

create table if not exists private.peakcoin_cosmetic_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  cosmetic_id text not null references public.community_profile_cosmetics(id) on delete restrict,
  amount integer not null check (amount >= 0),
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (user_id, cosmetic_id)
);

alter table public.community_profile_cosmetics enable row level security;
alter table public.user_profile_cosmetics enable row level security;
alter table public.user_profile_cosmetic_equipment enable row level security;
alter table private.peakcoin_cosmetic_ledger enable row level security;

revoke all on public.community_profile_cosmetics from public, anon, authenticated, service_role;
revoke all on public.user_profile_cosmetics from public, anon, authenticated, service_role;
revoke all on public.user_profile_cosmetic_equipment from public, anon, authenticated, service_role;
revoke all on private.peakcoin_cosmetic_ledger from public, anon, authenticated, service_role;

grant select on public.community_profile_cosmetics to authenticated;
grant select on public.user_profile_cosmetics to authenticated;
grant select on public.user_profile_cosmetic_equipment to authenticated;

drop policy if exists community_profile_cosmetics_catalog_read on public.community_profile_cosmetics;
create policy community_profile_cosmetics_catalog_read
  on public.community_profile_cosmetics for select to authenticated
  using (is_active = true);

drop policy if exists user_profile_cosmetics_own_read on public.user_profile_cosmetics;
create policy user_profile_cosmetics_own_read
  on public.user_profile_cosmetics for select to authenticated
  using (user_id = (select auth.uid()));

-- Equipped cosmetic references are public presentation metadata. Ownership and
-- purchase prices remain private to the owning account.
drop policy if exists user_profile_cosmetic_equipment_public_read on public.user_profile_cosmetic_equipment;
create policy user_profile_cosmetic_equipment_public_read
  on public.user_profile_cosmetic_equipment for select to authenticated
  using (true);

insert into public.community_profile_cosmetics
  (id, name, description, category, asset_path, preview_path, price_coins, rarity, metadata)
values
  ('frame-pixel-aurora', 'Aurora Pixel', 'Marco poligonal con una estela cyan y verde.', 'avatar_frame', '/profile-cosmetics/frames/aurora-pixel.svg', '/profile-cosmetics/frames/aurora-pixel.svg', 450, 'rare', '{"accent":"#39D6F0","motion":"soft-glow"}'::jsonb),
  ('frame-legendary-forge', 'Forja legendaria', 'Borde metálico con reflejos cálidos y remaches arcade.', 'avatar_frame', '/profile-cosmetics/frames/legendary-forge.svg', '/profile-cosmetics/frames/legendary-forge.svg', 900, 'epic', '{"accent":"#F0B84A","motion":"forge-pulse"}'::jsonb),
  ('banner-celestial-rift', 'Grieta celestial', 'Paisaje de nebulosas y ruinas pixel art.', 'profile_banner', '/profile-cosmetics/banners/celestial-rift.svg', '/profile-cosmetics/banners/celestial-rift.svg', 650, 'rare', '{"motion":"parallax-drift"}'::jsonb),
  ('banner-emerald-circuit', 'Circuito esmeralda', 'Circuitos de energía verde sobre un bioma oscuro.', 'profile_banner', '/profile-cosmetics/banners/emerald-circuit.svg', '/profile-cosmetics/banners/emerald-circuit.svg', 700, 'rare', '{"motion":"scanline"}'::jsonb),
  ('effect-starfall', 'Lluvia estelar', 'Una lluvia de partículas cruza el perfil al abrirlo.', 'profile_effect', '/profile-cosmetics/effects/starfall.svg', '/profile-cosmetics/effects/starfall.svg', 1100, 'epic', '{"durationMs":1800,"reducedMotionFallback":"still","trigger":"profile-open"}'::jsonb),
  ('effect-pixel-burst', 'Explosión de píxeles', 'Un estallido arcade alrededor del retrato.', 'profile_effect', '/profile-cosmetics/effects/pixel-burst.svg', '/profile-cosmetics/effects/pixel-burst.svg', 950, 'epic', '{"durationMs":1400,"reducedMotionFallback":"still","trigger":"profile-open"}'::jsonb),
  ('plate-founder-tech', 'Founder Tech', 'Placa técnica con borde cyan para tu identidad.', 'nameplate', '/profile-cosmetics/nameplates/founder-tech.svg', '/profile-cosmetics/nameplates/founder-tech.svg', 500, 'rare', '{"accent":"#39D6F0"}'::jsonb),
  ('theme-midnight-arcade', 'Midnight Arcade', 'Paneles azul tinta con acentos cyan y verde.', 'profile_theme', null, null, 0, 'common', '{"primary":"#0B1020","surface":"#141D36","accent":"#39D6F0","highlight":"#7FE05C"}'::jsonb),
  ('theme-ember-vault', 'Ember Vault', 'Paneles carbón con detalles de oro y cobre.', 'profile_theme', null, null, 300, 'rare', '{"primary":"#100D12","surface":"#211820","accent":"#F0B84A","highlight":"#F07848"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  asset_path = excluded.asset_path,
  preview_path = excluded.preview_path,
  price_coins = excluded.price_coins,
  rarity = excluded.rarity,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = now();

create or replace function public.purchase_profile_cosmetic(p_cosmetic_id text)
returns table (success boolean, new_balance integer, owned_cosmetic_id text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_cosmetic public.community_profile_cosmetics%rowtype;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_cosmetic_id is null or char_length(p_cosmetic_id) > 64 then
    raise exception 'Invalid cosmetic id' using errcode = '22023';
  end if;

  select * into v_cosmetic
  from public.community_profile_cosmetics
  where id = p_cosmetic_id and is_active = true
  for share;
  if not found then
    raise exception 'Cosmetic not available' using errcode = 'P0002';
  end if;

  -- Serialize purchases per account so concurrent requests cannot charge twice.
  select coins into v_balance
  from public.profiles
  where id = v_user_id
  for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.user_profile_cosmetics
    where user_id = v_user_id and cosmetic_id = v_cosmetic.id
  ) then
    return query select false, v_balance, v_cosmetic.id;
    return;
  end if;

  if v_balance < v_cosmetic.price_coins then
    raise exception 'Insufficient PeakCoins' using errcode = 'P0001';
  end if;

  update public.profiles
  set coins = coins - v_cosmetic.price_coins
  where id = v_user_id
  returning coins into v_balance;

  insert into public.user_profile_cosmetics (user_id, cosmetic_id, price_paid)
  values (v_user_id, v_cosmetic.id, v_cosmetic.price_coins);

  insert into private.peakcoin_cosmetic_ledger
    (user_id, cosmetic_id, amount, balance_after)
  values
    (v_user_id, v_cosmetic.id, v_cosmetic.price_coins, v_balance);

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (
    v_user_id,
    v_user_id,
    'profile_cosmetic_purchased',
    jsonb_build_object('cosmetic_id', v_cosmetic.id, 'amount', v_cosmetic.price_coins, 'balance_after', v_balance)
  );

  return query select true, v_balance, v_cosmetic.id;
end;
$function$;

revoke all on function public.purchase_profile_cosmetic(text) from public, anon, authenticated;
grant execute on function public.purchase_profile_cosmetic(text) to authenticated;

create or replace function public.equip_profile_cosmetic(p_cosmetic_id text, p_slot text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_category text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_slot is null or p_slot not in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme') then
    raise exception 'Invalid cosmetic slot' using errcode = '22023';
  end if;
  if p_cosmetic_id is null then
    raise exception 'Invalid cosmetic id' using errcode = '22023';
  end if;

  select category into v_category
  from public.community_profile_cosmetics
  where id = p_cosmetic_id;

  if v_category is null then
    raise exception 'Cosmetic not available' using errcode = 'P0002';
  end if;
  if v_category <> p_slot then
    raise exception 'Cosmetic does not match equipment slot' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_profile_cosmetics
    where user_id = v_user_id and cosmetic_id = p_cosmetic_id
  ) then
    raise exception 'Cosmetic not owned' using errcode = '42501';
  end if;

  insert into public.user_profile_cosmetic_equipment (user_id, slot, cosmetic_id, updated_at)
  values (v_user_id, p_slot, p_cosmetic_id, now())
  on conflict (user_id, slot) do update
  set cosmetic_id = excluded.cosmetic_id,
      updated_at = excluded.updated_at;

  return true;
end;
$function$;

revoke all on function public.equip_profile_cosmetic(text, text) from public, anon, authenticated;
grant execute on function public.equip_profile_cosmetic(text, text) to authenticated;

create or replace function public.unequip_profile_cosmetic(p_slot text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_slot is null or p_slot not in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme') then
    raise exception 'Invalid cosmetic slot' using errcode = '22023';
  end if;

  delete from public.user_profile_cosmetic_equipment
  where user_id = v_user_id and slot = p_slot;
  return true;
end;
$function$;

revoke all on function public.unequip_profile_cosmetic(text) from public, anon, authenticated;
grant execute on function public.unequip_profile_cosmetic(text) to authenticated;

create or replace function public.update_my_peakstyle_profile(
  p_display_name text,
  p_bio text default '',
  p_pronouns text default ''
)
returns table (display_name text, profile_bio text, profile_pronouns text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_bio text := btrim(coalesce(p_bio, ''));
  v_pronouns text := btrim(coalesce(p_pronouns, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if char_length(v_display_name) < 2 or char_length(v_display_name) > 32 then
    raise exception 'Display name must contain between 2 and 32 characters' using errcode = '22023';
  end if;
  if char_length(v_bio) > 160 or char_length(v_pronouns) > 32 then
    raise exception 'Profile text exceeds the allowed length' using errcode = '22023';
  end if;
  if v_display_name ~ '[<>]' or v_bio ~ '[<>]' or v_pronouns ~ '[<>]' then
    raise exception 'HTML is not allowed in profile text' using errcode = '22023';
  end if;

  update public.profiles
  set full_name = v_display_name,
      profile_bio = v_bio,
      profile_pronouns = v_pronouns
  where id = v_user_id;

  return query
    select p.full_name, p.profile_bio, p.profile_pronouns
    from public.profiles p
    where p.id = v_user_id;
end;
$function$;

revoke all on function public.update_my_peakstyle_profile(text, text, text) from public, anon, authenticated;
grant execute on function public.update_my_peakstyle_profile(text, text, text) to authenticated;

create or replace function public.get_peakstyle_public_profile(p_user_id uuid)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  profile_bio text,
  profile_pronouns text,
  level integer,
  xp integer,
  selected_character text,
  equipped_cosmetics jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_user_id is null then
    raise exception 'Invalid profile id' using errcode = '22023';
  end if;
  if not private.is_community_enabled()
     or private.is_community_user_restricted(auth.uid()) then
    raise exception 'Community access is restricted' using errcode = '42501';
  end if;

  return query
    select
      profile.id,
      profile.full_name,
      profile.avatar_url,
      profile.profile_bio,
      profile.profile_pronouns,
      profile.level,
      profile.xp,
      profile.selected_character,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'slot', equipment.slot,
              'id', cosmetic.id,
              'name', cosmetic.name,
              'assetPath', cosmetic.asset_path,
              'metadata', cosmetic.metadata
            )
            order by equipment.slot
          )
          from public.user_profile_cosmetic_equipment equipment
          join public.community_profile_cosmetics cosmetic
            on cosmetic.id = equipment.cosmetic_id
          where equipment.user_id = profile.id
        ),
        '[]'::jsonb
      )
    from public.profiles profile
    where profile.id = p_user_id;
end;
$function$;

revoke all on function public.get_peakstyle_public_profile(uuid) from public, anon, authenticated;
grant execute on function public.get_peakstyle_public_profile(uuid) to authenticated;

comment on table public.user_profile_cosmetics is
  'Permanent PeakStyle cosmetic ownership purchased only with profiles.coins (PeakCoins).';
comment on table private.peakcoin_cosmetic_ledger is
  'Private transactional audit of PeakCoin cosmetic purchases.';

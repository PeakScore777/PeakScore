-- PeakScore Community authority boundary:
-- Founder owns irreversible/community-wide operations and role assignment.
-- Administrators may only kick or temporarily timeout ordinary members.
-- Moderators do not inherit administrator or founder capabilities.

create schema if not exists private;

create table if not exists private.community_founder_config (
  singleton boolean primary key default true check (singleton = true),
  founder_user_id uuid not null references public.profiles(id) on delete restrict,
  initialized_at timestamptz not null default clock_timestamp()
);

create table if not exists private.community_lifecycle (
  singleton boolean primary key default true check (singleton = true),
  is_enabled boolean not null default true,
  disabled_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp()
);

insert into private.community_lifecycle (singleton, is_enabled)
values (true, true)
on conflict (singleton) do nothing;

create table if not exists private.community_member_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('kick', 'timeout')),
  reason text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  revoked_at timestamptz,
  constraint community_member_restrictions_expiry_check
    check (
      (restriction_type = 'kick' and expires_at is null)
      or (restriction_type = 'timeout' and expires_at is not null)
    )
);

create unique index if not exists community_member_restrictions_one_active
  on private.community_member_restrictions (user_id)
  where revoked_at is null;

create index if not exists community_member_restrictions_active_lookup
  on private.community_member_restrictions (user_id, expires_at)
  where revoked_at is null;

create table if not exists private.community_security_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists community_security_audit_created_idx
  on private.community_security_audit (created_at desc);

alter table private.community_founder_config enable row level security;
alter table private.community_lifecycle enable row level security;
alter table private.community_member_restrictions enable row level security;
alter table private.community_security_audit enable row level security;

revoke all on private.community_founder_config from public, anon, authenticated, service_role;
revoke all on private.community_lifecycle from public, anon, authenticated, service_role;
revoke all on private.community_member_restrictions from public, anon, authenticated, service_role;
revoke all on private.community_security_audit from public, anon, authenticated, service_role;

-- Founder identity is bootstrapped once through a server-only service-role call.
-- The application route additionally requires COMMUNITY_FOUNDER_USER_ID to match
-- the signed-in user. ON CONFLICT DO NOTHING prevents identity replacement.
create or replace function public.bootstrap_community_founder(p_founder_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_existing_founder uuid;
  v_inserted_rows integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' or p_founder_user_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_founder_user_id) then
    raise exception 'Founder profile not found' using errcode = '22023';
  end if;

  insert into private.community_founder_config (singleton, founder_user_id)
  values (true, p_founder_user_id)
  on conflict (singleton) do nothing;
  get diagnostics v_inserted_rows = row_count;

  select founder_user_id
    into v_existing_founder
  from private.community_founder_config
  where singleton = true;

  if v_existing_founder is distinct from p_founder_user_id then
    return false;
  end if;

  insert into public.community_role_catalog
    (role_key, label, description, badge_color, display_as_badge)
  values
    ('fundador', 'Fundador', 'Propietario único de la comunidad PeakScore.', '#E9B949', true)
  on conflict (role_key) do update set
    label = excluded.label,
    description = excluded.description,
    badge_color = excluded.badge_color,
    display_as_badge = true;

  insert into public.community_member_roles (user_id, role_key, assigned_by)
  values (p_founder_user_id, 'fundador', p_founder_user_id)
  on conflict (user_id, role_key) do nothing;

  if v_inserted_rows > 0 then
    insert into private.community_security_audit
      (actor_user_id, target_user_id, action_key, details)
    values
      (p_founder_user_id, p_founder_user_id, 'founder_bootstrapped', jsonb_build_object('source', 'server_allowlist'));
  end if;

  return true;
end;
$function$;

revoke all on function public.bootstrap_community_founder(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_community_founder(uuid) to service_role;

create or replace function private.is_community_founder(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id is not null and exists (
    select 1
    from private.community_founder_config founder
    where founder.singleton = true
      and founder.founder_user_id = p_user_id
  );
$function$;

create or replace function private.is_community_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce((
    select lifecycle.is_enabled
    from private.community_lifecycle lifecycle
    where lifecycle.singleton = true
  ), false);
$function$;

create or replace function private.is_community_user_restricted(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id is not null and exists (
    select 1
    from private.community_member_restrictions restriction
    where restriction.user_id = p_user_id
      and restriction.revoked_at is null
      and (
        restriction.restriction_type = 'kick'
        or restriction.expires_at > now()
      )
  );
$function$;

revoke all on function private.is_community_founder(uuid) from public, anon, authenticated, service_role;
revoke all on function private.is_community_enabled() from public, anon, authenticated, service_role;
revoke all on function private.is_community_user_restricted(uuid) from public, anon, authenticated, service_role;

-- This RPC is callable by authenticated clients, but every action is checked
-- against the immutable founder identity stored in the private singleton.
create or replace function public.manage_community_member_role(
  p_target_user_id uuid,
  p_role_key text,
  p_action text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.is_community_founder(v_actor) then
    raise exception 'Only the founder can manage community roles' using errcode = '42501';
  end if;

  if p_target_user_id is null or p_target_user_id = v_actor
     and p_role_key = 'fundador' then
    raise exception 'Invalid role target' using errcode = '22023';
  end if;

  if p_role_key is null or p_role_key = 'fundador' then
    raise exception 'The founder role is immutable' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('grant', 'revoke') then
    raise exception 'Invalid role action' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;

  if not exists (select 1 from public.community_role_catalog role_catalog where role_catalog.role_key = p_role_key) then
    raise exception 'Unknown community role' using errcode = '22023';
  end if;

  if p_action = 'grant' then
    insert into public.community_member_roles (user_id, role_key, assigned_by)
    values (p_target_user_id, p_role_key, v_actor)
    on conflict (user_id, role_key) do nothing;
  else
    delete from public.community_member_roles
    where user_id = p_target_user_id
      and role_key = p_role_key;
  end if;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (
    v_actor,
    p_target_user_id,
    'role_' || p_action,
    jsonb_build_object('role_key', p_role_key)
  );

  return true;
end;
$function$;

revoke all on function public.manage_community_member_role(uuid, text, text) from public, anon, authenticated;
grant execute on function public.manage_community_member_role(uuid, text, text) to authenticated;

-- Administrators are allowed to kick or timeout ordinary members only.
-- They cannot act on the founder, admins, moderators or teachers.
create or replace function public.moderate_community_member(
  p_target_user_id uuid,
  p_action text,
  p_reason text default '',
  p_duration_minutes integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_is_founder boolean;
  v_is_admin boolean;
  v_restriction_id uuid;
begin
  if v_actor is null or p_target_user_id is null or p_target_user_id = v_actor then
    raise exception 'Invalid moderation target' using errcode = '22023';
  end if;

  v_is_founder := private.is_community_founder(v_actor);
  select exists (
    select 1 from public.community_member_roles role_assignment
    where role_assignment.user_id = v_actor
      and role_assignment.role_key = 'administrador'
  ) into v_is_admin;

  if not v_is_founder and not v_is_admin then
    raise exception 'Only the founder or an administrator can moderate members' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('kick', 'timeout') then
    raise exception 'Administrators may only kick or timeout members' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_reason, ''))) < 3
     or char_length(coalesce(p_reason, '')) > 500 then
    raise exception 'A moderation reason between 3 and 500 characters is required'
      using errcode = '22023';
  end if;

  if p_action = 'timeout'
     and (p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 40320) then
    raise exception 'Timeout duration must be between 1 minute and 28 days' using errcode = '22023';
  end if;

  if p_action = 'kick' and p_duration_minutes is not null then
    raise exception 'Kick does not accept a duration' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_target_user_id) then
    raise exception 'Target profile not found' using errcode = '22023';
  end if;

  if not v_is_founder and exists (
    select 1 from public.community_member_roles protected_role
    where protected_role.user_id = p_target_user_id
      and protected_role.role_key in ('fundador', 'administrador', 'moderador', 'profesor')
  ) then
    raise exception 'Administrators cannot moderate privileged community roles' using errcode = '42501';
  end if;

  update private.community_member_restrictions
  set revoked_at = clock_timestamp()
  where user_id = p_target_user_id
    and revoked_at is null;

  insert into private.community_member_restrictions
    (user_id, restriction_type, reason, created_by, expires_at)
  values (
    p_target_user_id,
    p_action,
    left(coalesce(p_reason, ''), 500),
    v_actor,
    case when p_action = 'timeout'
      then clock_timestamp() + make_interval(mins => p_duration_minutes)
      else null
    end
  )
  returning id into v_restriction_id;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (
    v_actor,
    p_target_user_id,
    'member_' || p_action,
    jsonb_build_object(
      'restriction_id', v_restriction_id,
      'duration_minutes', p_duration_minutes,
      'reason', left(coalesce(p_reason, ''), 500)
    )
  );

  return v_restriction_id;
end;
$function$;

revoke all on function public.moderate_community_member(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.moderate_community_member(uuid, text, text, integer) to authenticated;

-- A community deletion is a reversible soft-disable. Physical deletion of
-- channels, messages and evidence is intentionally not exposed as an RPC.
create or replace function public.set_community_lifecycle(p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.is_community_founder(v_actor) then
    raise exception 'Only the founder can change community lifecycle' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('disable', 'restore') then
    raise exception 'Invalid community lifecycle action' using errcode = '22023';
  end if;

  update private.community_lifecycle
  set is_enabled = (p_action = 'restore'),
      disabled_at = case when p_action = 'disable' then clock_timestamp() else null end,
      updated_by = v_actor,
      updated_at = clock_timestamp()
  where singleton = true;

  insert into private.community_security_audit
    (actor_user_id, target_user_id, action_key, details)
  values (v_actor, null, 'community_' || p_action, '{}'::jsonb);

  return true;
end;
$function$;

revoke all on function public.set_community_lifecycle(text) from public, anon, authenticated;
grant execute on function public.set_community_lifecycle(text) to authenticated;

-- RLS needs a safe current-user founder predicate. Do not expose the
-- parameterized helper to clients, otherwise callers could probe arbitrary IDs.
create or replace function private.is_current_user_community_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select private.is_community_founder(auth.uid());
$function$;

revoke all on function private.is_current_user_community_founder() from public, anon, authenticated, service_role;
grant execute on function private.is_current_user_community_founder() to authenticated;

-- The founder is not required to carry the administrator role to read the
-- private teacher channel. Explicit founder policies preserve that separation.
drop policy if exists community_channels_read_founder on public.community_channels;
create policy community_channels_read_founder
  on public.community_channels
  for select to authenticated
  using (
    private.is_current_user_community_founder()
    and is_archived = false
  );

drop policy if exists community_messages_read_founder on public.community_messages;
create policy community_messages_read_founder
  on public.community_messages
  for select to authenticated
  using (
    private.is_current_user_community_founder()
    and exists (
      select 1 from public.community_channels channel
      where channel.id = channel_id and channel.is_archived = false
    )
  );

drop policy if exists community_messages_insert_founder on public.community_messages;
create policy community_messages_insert_founder
  on public.community_messages
  for insert to authenticated
  with check (
    private.is_current_user_community_founder()
    and author_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels channel
      where channel.id = channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
    and (
      reply_to_message_id is null
      or private.can_reply_to_community_message(reply_to_message_id, channel_id)
    )
  );

create or replace function private.can_reply_to_community_message(
  p_parent_message_id uuid,
  p_channel_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null and exists (
    select 1
    from public.community_messages parent
    join public.community_channels channel on channel.id = parent.channel_id
    where parent.id = p_parent_message_id
      and parent.channel_id = p_channel_id
      and channel.is_archived = false
      and channel.is_read_only = false
      and (
        channel.is_private = false
        or private.is_current_user_community_founder()
        or exists (
          select 1
          from public.community_member_roles member_role
          where member_role.user_id = auth.uid()
            and member_role.role_key in ('profesor', 'moderador', 'administrador')
        )
      )
  );
$function$;

drop policy if exists community_reactions_read_founder on public.community_reactions;
create policy community_reactions_read_founder
  on public.community_reactions
  for select to authenticated
  using (
    private.is_current_user_community_founder()
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = message_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_reactions_insert_founder on public.community_reactions;
create policy community_reactions_insert_founder
  on public.community_reactions
  for insert to authenticated
  with check (
    private.is_current_user_community_founder()
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = message_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
  );

drop policy if exists community_comments_read_founder on public.community_message_comments;
create policy community_comments_read_founder
  on public.community_message_comments
  for select to authenticated
  using (
    private.is_current_user_community_founder()
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = message_id
        and channel.is_archived = false
    )
  );

drop policy if exists community_comments_insert_founder on public.community_message_comments;
create policy community_comments_insert_founder
  on public.community_message_comments
  for insert to authenticated
  with check (
    private.is_current_user_community_founder()
    and author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages message
      join public.community_channels channel on channel.id = message.channel_id
      where message.id = message_id
        and channel.is_archived = false
        and channel.is_read_only = false
    )
    and (
      parent_comment_id is null
      or exists (
        select 1
        from public.community_message_comments parent
        where parent.id = parent_comment_id
          and parent.message_id = message_id
          and parent.parent_comment_id is null
      )
    )
  );

-- Restrictive policies are ANDed with existing permissive RLS policies.
-- They apply to every route and direct Supabase request, not just the UI.
drop policy if exists community_lifecycle_guard_channels on public.community_channels;
create policy community_lifecycle_guard_channels
  on public.community_channels as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_messages on public.community_messages;
create policy community_lifecycle_guard_messages
  on public.community_messages as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_reactions on public.community_reactions;
create policy community_lifecycle_guard_reactions
  on public.community_reactions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_comments on public.community_message_comments;
create policy community_lifecycle_guard_comments
  on public.community_message_comments as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );

drop policy if exists community_lifecycle_guard_live_sessions on public.community_live_sessions;
create policy community_lifecycle_guard_live_sessions
  on public.community_live_sessions as restrictive
  for all to authenticated
  using (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  )
  with check (
    private.is_community_enabled()
    and not private.is_community_user_restricted((select auth.uid()))
  );



-- ============================================================================
-- PEAKSTYLE: permanent cosmetics owned with earned PeakCoins.
-- Existing profiles.coins remains the sole coin balance; existing character
-- unlocks and selected_character remain untouched.
-- ============================================================================

create table if not exists public.community_profile_cosmetics (
  id text primary key,
  name text not null,
  description text not null default '',
  category text not null check (category in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme','profile_badge')),
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
  amount integer not null check (amount > 0),
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
  on public.community_profile_cosmetics
  for select to authenticated
  using (is_active = true);

drop policy if exists user_profile_cosmetics_own_read on public.user_profile_cosmetics;
create policy user_profile_cosmetics_own_read
  on public.user_profile_cosmetics
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_profile_cosmetic_equipment_public_read on public.user_profile_cosmetic_equipment;
create policy user_profile_cosmetic_equipment_public_read
  on public.user_profile_cosmetic_equipment
  for select to authenticated
  using (true);

-- Catalogue is original PeakScore art. No paid-money pricing or external checkout.
insert into public.community_profile_cosmetics
  (id, name, description, category, asset_path, preview_path, price_coins, rarity, metadata)
values
  ('frame-pixel-aurora', 'Aurora Pixel', 'Un marco pixelado con una estela luminosa cyan.', 'avatar_frame', '/profile-cosmetics/frames/aurora-pixel.webp', '/profile-cosmetics/frames/aurora-pixel.webp', 450, 'rare', '{"accent":"#39D6F0","motion":"soft-glow"}'::jsonb),
  ('frame-legendary-forge', 'Forja legendaria', 'Borde metálico con brillo cálido y remaches arcade.', 'avatar_frame', '/profile-cosmetics/frames/legendary-forge.webp', '/profile-cosmetics/frames/legendary-forge.webp', 900, 'epic', '{"accent":"#F0B84A","motion":"forge-pulse"}'::jsonb),
  ('banner-celestial-rift', 'Grieta celestial', 'Paisaje de nebulosas y ruinas pixel art.', 'profile_banner', '/profile-cosmetics/banners/celestial-rift.webp', '/profile-cosmetics/banners/celestial-rift.webp', 650, 'rare', '{"motion":"parallax-drift"}'::jsonb),
  ('banner-emerald-circuit', 'Circuito esmeralda', 'Circuitos de energía verde sobre un bioma oscuro.', 'profile_banner', '/profile-cosmetics/banners/emerald-circuit.webp', '/profile-cosmetics/banners/emerald-circuit.webp', 700, 'rare', '{"motion":"scanline"}'::jsonb),
  ('effect-starfall', 'Lluvia estelar', 'Una lluvia breve de partículas cruza el perfil al abrirlo.', 'profile_effect', '/profile-cosmetics/effects/starfall.json', '/profile-cosmetics/effects/starfall-preview.webp', 1100, 'epic', '{"durationMs":1800,"reducedMotionFallback":"still","trigger":"profile-open"}'::jsonb),
  ('effect-pixel-burst', 'Explosión de píxeles', 'Un estallido arcade aparece alrededor del retrato.', 'profile_effect', '/profile-cosmetics/effects/pixel-burst.json', '/profile-cosmetics/effects/pixel-burst-preview.webp', 950, 'epic', '{"durationMs":1400,"reducedMotionFallback":"still","trigger":"profile-open"}'::jsonb),
  ('plate-founder-tech', 'Founder Tech', 'Placa técnica con borde cyan para vitrinas personales.', 'nameplate', '/profile-cosmetics/nameplates/founder-tech.webp', '/profile-cosmetics/nameplates/founder-tech.webp', 500, 'rare', '{"accent":"#39D6F0"}'::jsonb),
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

  if not private.is_community_enabled()
     or private.is_community_user_restricted(v_user_id) then
    raise exception 'Community access is restricted' using errcode = '42501';
  end if;

  select * into v_cosmetic
  from public.community_profile_cosmetics
  where id = p_cosmetic_id and is_active = true
  for share;

  if not found then
    raise exception 'Cosmetic not available' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.user_profile_cosmetics
    where user_id = v_user_id and cosmetic_id = v_cosmetic.id
  ) then
    select coins into v_balance from public.profiles where id = v_user_id;
    return query select false, coalesce(v_balance, 0), v_cosmetic.id;
    return;
  end if;

  update public.profiles
  set coins = coins - v_cosmetic.price_coins
  where id = v_user_id
    and coins >= v_cosmetic.price_coins
  returning coins into v_balance;

  if not found then
    raise exception 'Insufficient PeakCoins' using errcode = 'P0001';
  end if;

  insert into public.user_profile_cosmetics (user_id, cosmetic_id, price_paid)
  values (v_user_id, v_cosmetic.id, v_cosmetic.price_coins)
  on conflict (user_id, cosmetic_id) do nothing;

  insert into private.peakcoin_cosmetic_ledger
    (user_id, cosmetic_id, amount, balance_after)
  values
    (v_user_id, v_cosmetic.id, v_cosmetic.price_coins, v_balance)
  on conflict (user_id, cosmetic_id) do nothing;

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

  if not private.is_community_enabled()
     or private.is_community_user_restricted(v_user_id) then
    raise exception 'Community access is restricted' using errcode = '42501';
  end if;

  if p_slot not in ('avatar_frame','profile_banner','profile_effect','nameplate','profile_theme') then
    raise exception 'Invalid cosmetic slot' using errcode = '22023';
  end if;

  select category into v_category
  from public.community_profile_cosmetics
  where id = p_cosmetic_id and is_active = true;

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

  delete from public.user_profile_cosmetic_equipment
  where user_id = v_user_id and slot = p_slot;

  return true;
end;
$function$;

revoke all on function public.unequip_profile_cosmetic(text) from public, anon, authenticated;
grant execute on function public.unequip_profile_cosmetic(text) to authenticated;

create or replace function private.get_public_peakstyle_cosmetics(p_user_id uuid)
returns table (
  slot text,
  cosmetic_id text,
  name text,
  asset_path text,
  metadata jsonb
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    equipment.slot,
    cosmetic.id,
    cosmetic.name,
    cosmetic.asset_path,
    cosmetic.metadata
  from public.user_profile_cosmetic_equipment equipment
  join public.community_profile_cosmetics cosmetic on cosmetic.id = equipment.cosmetic_id
  where equipment.user_id = p_user_id
    and cosmetic.is_active = true;
$function$;

revoke all on function private.get_public_peakstyle_cosmetics(uuid) from public, anon, authenticated, service_role;
grant execute on function private.get_public_peakstyle_cosmetics(uuid) to authenticated;

-- The helpers are used only from RLS policies and SECURITY DEFINER functions.
-- Grant schema usage for policy expression resolution; function execution is
-- explicitly restricted to the authenticated role.
grant usage on schema private to authenticated;
grant execute on function private.is_community_enabled() to authenticated;
grant execute on function private.is_community_user_restricted(uuid) to authenticated;


-- SECURITY DEFINER message-edit RPCs bypass table RLS by design, so mirror
-- the global community lifecycle and timeout checks inside the function.
create or replace function public.edit_community_message(
  p_message_id uuid,
  p_body text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_edited_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.is_community_enabled()
     or private.is_community_user_restricted(v_user_id) then
    raise exception 'Community access is restricted' using errcode = '42501';
  end if;

  if p_body is null or char_length(btrim(p_body)) < 1 or char_length(btrim(p_body)) > 2000 then
    raise exception 'Message body must contain between 1 and 2000 characters'
      using errcode = '22023';
  end if;

  update public.community_messages message
  set body = btrim(p_body),
      edited_at = clock_timestamp()
  where message.id = p_message_id
    and message.author_id = v_user_id
    and exists (
      select 1
      from public.community_channels channel
      where channel.id = message.channel_id
        and channel.is_archived = false
        and channel.is_read_only = false
        and (
          channel.is_private = false
          or exists (
            select 1
            from public.community_member_roles member_role
            where member_role.user_id = v_user_id
              and member_role.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  returning message.edited_at into v_edited_at;

  if v_edited_at is null then
    raise exception 'Message not found or editing is not allowed'
      using errcode = '42501';
  end if;

  return v_edited_at;
end;
$function$;

revoke all on function public.edit_community_message(uuid, text)
  from public, anon, authenticated;
grant execute on function public.edit_community_message(uuid, text)
  to authenticated;

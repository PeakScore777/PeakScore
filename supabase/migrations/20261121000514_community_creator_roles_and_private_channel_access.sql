-- PeakScore Community: creator roles and private teacher-room access.
-- Institution-specific roles (e.g. "docente") are intentionally out of scope.

create table if not exists public.community_role_catalog (
  role_key text primary key,
  label text not null,
  description text not null default '',
  badge_color text not null default '#01C8EF',
  display_as_badge boolean not null default false,
  created_at timestamptz not null default now(),
  constraint community_role_catalog_key_format
    check (role_key ~ '^[a-z][a-z0-9_]{1,31}$'),
  constraint community_role_catalog_badge_color
    check (badge_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.community_member_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null references public.community_role_catalog(role_key) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (user_id, role_key)
);

create index if not exists community_member_roles_user_idx
  on public.community_member_roles (user_id, role_key);
create index if not exists community_member_roles_role_idx
  on public.community_member_roles (role_key, user_id);

alter table public.community_role_catalog enable row level security;
alter table public.community_member_roles enable row level security;

revoke all on public.community_role_catalog from anon, authenticated;
revoke all on public.community_member_roles from anon, authenticated;
grant select on public.community_role_catalog to authenticated;
grant select on public.community_member_roles to authenticated;

drop policy if exists community_role_catalog_read_authenticated on public.community_role_catalog;
create policy community_role_catalog_read_authenticated
  on public.community_role_catalog for select to authenticated
  using (true);

drop policy if exists community_member_roles_read_authenticated on public.community_member_roles;
create policy community_member_roles_read_authenticated
  on public.community_member_roles for select to authenticated
  using (true);

insert into public.community_role_catalog
  (role_key, label, description, badge_color, display_as_badge)
values
  ('profesor', 'Profesor PeakScore', 'Creador verificado de videos, cursos y materiales educativos dentro de PeakScore.', '#7FE05C', true),
  ('moderador', 'Moderador', 'Equipo autorizado para cuidar la convivencia de la comunidad.', '#01C8EF', true),
  ('administrador', 'Administrador', 'Equipo autorizado para administrar la comunidad.', '#E8B64A', false)
on conflict (role_key) do update set
  label = excluded.label,
  description = excluded.description,
  badge_color = excluded.badge_color,
  display_as_badge = excluded.display_as_badge;

alter table public.community_channels
  add column if not exists is_private boolean not null default false;

update public.community_channels
set is_private = true
where slug = 'sala-de-profesores';

-- Private channels are visible only to creator/management roles.
drop policy if exists community_channels_read_active on public.community_channels;
create policy community_channels_read_active
  on public.community_channels for select to authenticated
  using (
    is_archived = false
    and (
      is_private = false
      or exists (
        select 1
        from public.community_member_roles mr
        where mr.user_id = (select auth.uid())
          and mr.role_key in ('profesor', 'moderador', 'administrador')
      )
    )
  );

drop policy if exists community_messages_read_active_channel on public.community_messages;
create policy community_messages_read_active_channel
  on public.community_messages for select to authenticated
  using (
    exists (
      select 1
      from public.community_channels c
      where c.id = channel_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_messages_insert_as_self on public.community_messages;
create policy community_messages_insert_as_self
  on public.community_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_channels c
      where c.id = channel_id
        and c.is_archived = false
        and c.is_read_only = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read
  on public.community_reactions for select to authenticated
  using (
    exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_comments_read_active on public.community_message_comments;
create policy community_comments_read_active
  on public.community_message_comments for select to authenticated
  using (
    exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
  );

drop policy if exists community_comments_insert_as_self on public.community_message_comments;
create policy community_comments_insert_as_self
  on public.community_message_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id
        and c.is_archived = false
        and c.is_read_only = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
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

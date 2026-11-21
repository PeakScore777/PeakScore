-- PeakScore Community foundation
-- Global community channels, messages and reactions.
-- All public-facing access is authenticated and constrained by RLS.

create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null,
  position integer not null default 0,
  is_read_only boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  constraint community_channels_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  constraint community_channels_name_length check (char_length(btrim(name)) between 2 and 60),
  constraint community_channels_description_length check (char_length(description) <= 240),
  constraint community_channels_category_length check (char_length(btrim(category)) between 2 and 40),
  constraint community_channels_position_nonnegative check (position >= 0)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint community_messages_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  constraint community_reactions_allowed check (reaction in ('like', 'heart', 'laugh', 'wow', 'support')),
  constraint community_reactions_unique unique (message_id, user_id, reaction)
);

create index if not exists community_messages_channel_created_idx
  on public.community_messages (channel_id, created_at desc, id desc);
create index if not exists community_messages_author_created_idx
  on public.community_messages (author_id, created_at desc);
create index if not exists community_reactions_message_idx
  on public.community_reactions (message_id);

alter table public.community_channels enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_reactions enable row level security;

revoke all on public.community_channels from anon, authenticated;
revoke all on public.community_messages from anon, authenticated;
revoke all on public.community_reactions from anon, authenticated;

grant select on public.community_channels to authenticated;
grant select, insert, delete on public.community_messages to authenticated;
grant select, insert, delete on public.community_reactions to authenticated;

drop policy if exists community_channels_read_active on public.community_channels;
create policy community_channels_read_active
  on public.community_channels for select to authenticated
  using (is_archived = false);

drop policy if exists community_messages_read_active_channel on public.community_messages;
create policy community_messages_read_active_channel
  on public.community_messages for select to authenticated
  using (
    exists (
      select 1 from public.community_channels c
      where c.id = channel_id and c.is_archived = false
    )
  );

drop policy if exists community_messages_insert_as_self on public.community_messages;
create policy community_messages_insert_as_self
  on public.community_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.community_channels c
      where c.id = channel_id
        and c.is_archived = false
        and c.is_read_only = false
    )
  );

drop policy if exists community_messages_delete_own on public.community_messages;
create policy community_messages_delete_own
  on public.community_messages for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read
  on public.community_reactions for select to authenticated
  using (
    exists (
      select 1 from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id and c.is_archived = false
    )
  );

drop policy if exists community_reactions_insert_as_self on public.community_reactions;
create policy community_reactions_insert_as_self
  on public.community_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = message_id and c.is_archived = false
    )
  );

drop policy if exists community_reactions_delete_own on public.community_reactions;
create policy community_reactions_delete_own
  on public.community_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

insert into public.community_channels (slug, name, description, category, position)
values
  ('general', 'general', 'El punto de encuentro de toda la comunidad.', 'COMUNIDAD', 10),
  ('memes', 'memes', 'Humor, memes y momentos de PeakScore.', 'COMUNIDAD', 20),
  ('noticias', 'noticias', 'Novedades y anuncios oficiales de PeakScore.', 'COMUNIDAD', 30),
  ('logros-y-rankings', 'logros-y-rankings', 'Comparte tus avances y reconoce a otros estudiantes.', 'COMUNIDAD', 40),
  ('matematicas', 'matematicas', 'Dudas, ideas y recursos de matemáticas.', 'MATERIAS', 10),
  ('lectura-critica', 'lectura-critica', 'Lectura, interpretación y argumentación.', 'MATERIAS', 20),
  ('sociales', 'sociales', 'Historia, geografía y competencias ciudadanas.', 'MATERIAS', 30),
  ('ciencias-naturales', 'ciencias-naturales', 'Biología, química y física.', 'MATERIAS', 40),
  ('ingles', 'ingles', 'Practica y resuelve dudas de inglés.', 'MATERIAS', 50),
  ('sala-de-profesores', 'sala-de-profesores', 'Espacio de intercambio para profesores y creadores.', 'PROFESORES', 10),
  ('anuncios-de-clases', 'anuncios-de-clases', 'Publica avisos de clases y sesiones educativas.', 'PROFESORES', 20),
  ('eventos', 'eventos', 'Encuentros, actividades y eventos de la comunidad.', 'AULAS Y EVENTOS', 10)
on conflict (slug) do nothing;

-- PostgreSQL Changes powers the first version of live chat.
-- At larger scale, migrate message fan-out to private Realtime Broadcast channels.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_reactions'
  ) then
    alter publication supabase_realtime add table public.community_reactions;
  end if;
end
$$;

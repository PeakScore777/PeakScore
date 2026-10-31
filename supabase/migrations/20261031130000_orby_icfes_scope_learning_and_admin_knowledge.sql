-- Orby ICFES-only tutor: curated knowledge, private admin studio and per-student adaptation.
create table if not exists public.orby_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  original_name text,
  subject text not null check (subject in ('Matemáticas','Lectura Crítica','Sociales y Ciudadanas','Ciencias Naturales','Inglés')),
  topic text not null check (char_length(topic) between 1 and 180),
  storage_path text,
  page_count integer not null default 0 check (page_count >= 0 and page_count <= 200),
  chunk_count integer not null default 0 check (chunk_count >= 1 and chunk_count <= 300),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orby_knowledge_documents_status_subject_idx
  on public.orby_knowledge_documents (status, subject, created_at desc);

create table if not exists public.orby_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  subject text not null check (subject in ('Matemáticas','Lectura Crítica','Sociales y Ciudadanas','Ciencias Naturales','Inglés')),
  topic text not null,
  page_number integer not null default 1 check (page_number > 0),
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(content) between 40 and 2600),
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(topic,'')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(content,'')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists orby_knowledge_chunks_search_idx
  on public.orby_knowledge_chunks using gin (search_vector);
create index if not exists orby_knowledge_chunks_document_page_idx
  on public.orby_knowledge_chunks (document_id, page_number, chunk_index);

alter table public.orby_knowledge_documents enable row level security;
alter table public.orby_knowledge_chunks enable row level security;
revoke all on public.orby_knowledge_documents, public.orby_knowledge_chunks from public, anon, authenticated;
grant select, insert, update, delete on public.orby_knowledge_documents, public.orby_knowledge_chunks to service_role;

create or replace function public.orby_search_published_knowledge(
  p_query text,
  p_subject text default null,
  p_limit integer default 5
)
returns table (
  document_id uuid,
  title text,
  subject text,
  topic text,
  page_number integer,
  content text,
  rank real
)
language sql
stable
set search_path = ''
as $$
  with query_value as (
    select pg_catalog.websearch_to_tsquery('spanish'::pg_catalog.regconfig, pg_catalog.left(pg_catalog.coalesce(p_query,''), 800)) as value
  )
  select
    d.id,
    d.title,
    d.subject,
    d.topic,
    c.page_number,
    c.content,
    pg_catalog.ts_rank(c.search_vector, q.value)::real
  from public.orby_knowledge_chunks c
  join public.orby_knowledge_documents d on d.id = c.document_id
  cross join query_value q
  where d.status = 'published'
    and (p_subject is null or d.subject = p_subject)
    and pg_catalog.numnode(q.value) > 0
    and c.search_vector @@ q.value
  order by pg_catalog.ts_rank(c.search_vector, q.value) desc
  limit pg_catalog.greatest(1, pg_catalog.least(pg_catalog.coalesce(p_limit,5),8));
$$;

revoke all on function public.orby_search_published_knowledge(text,text,integer) from public, anon, authenticated;
grant execute on function public.orby_search_published_knowledge(text,text,integer) to service_role;

create table if not exists public.orby_student_learning_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid,
  subject text not null check (subject in ('Matemáticas','Lectura Crítica','Sociales y Ciudadanas','Ciencias Naturales','Inglés','Preparación Saber 11')),
  topic text not null check (char_length(topic) between 1 and 180),
  concept text not null check (char_length(concept) between 1 and 160),
  learning_state text not null check (learning_state in ('understands','needs_review','misconception','struggling')),
  misconception text check (misconception is null or char_length(misconception) <= 400),
  teaching_hint text check (teaching_hint is null or char_length(teaching_hint) <= 400),
  confidence numeric(3,2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create index if not exists orby_student_learning_signals_user_recent_idx
  on public.orby_student_learning_signals (user_id, created_at desc);
create index if not exists orby_student_learning_signals_user_subject_idx
  on public.orby_student_learning_signals (user_id, subject, learning_state, created_at desc);

alter table public.orby_student_learning_signals enable row level security;
revoke all on public.orby_student_learning_signals from public, anon, authenticated;
grant select, insert, delete on public.orby_student_learning_signals to service_role;

create table if not exists public.orby_admin_chat_messages (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orby_admin_chat_messages_owner_recent_idx
  on public.orby_admin_chat_messages (admin_user_id, created_at desc);

alter table public.orby_admin_chat_messages enable row level security;
revoke all on public.orby_admin_chat_messages from public, anon, authenticated;
grant select, insert, delete on public.orby_admin_chat_messages to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('orby-knowledge', 'orby-knowledge', false, 20971520, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array['application/pdf'];

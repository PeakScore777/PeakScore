-- Allow mixed-area Saber 11 resources in the private Orby knowledge library.
-- Documents that cover study routes, general theory or several subjects use the
-- neutral "Preparación Saber 11" classification instead of a false single area.

alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_subject_check;
alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_subject_check
  check (subject in (
    'Matemáticas',
    'Lectura Crítica',
    'Sociales y Ciudadanas',
    'Ciencias Naturales',
    'Inglés',
    'Preparación Saber 11'
  ));

alter table public.orby_knowledge_chunks
  drop constraint if exists orby_knowledge_chunks_subject_check;
alter table public.orby_knowledge_chunks
  add constraint orby_knowledge_chunks_subject_check
  check (subject in (
    'Matemáticas',
    'Lectura Crítica',
    'Sociales y Ciudadanas',
    'Ciencias Naturales',
    'Inglés',
    'Preparación Saber 11'
  ));

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
    select pg_catalog.websearch_to_tsquery(
      'spanish'::pg_catalog.regconfig,
      pg_catalog.left(coalesce(p_query, ''), 800)
    ) as value
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
    and (
      p_subject is null
      or d.subject = p_subject
      or d.subject = 'Preparación Saber 11'
    )
    and pg_catalog.numnode(q.value) > 0
    and c.search_vector @@ q.value
  order by pg_catalog.ts_rank(c.search_vector, q.value) desc
  limit greatest(1, least(coalesce(p_limit, 5), 8));
$$;

revoke all on function public.orby_search_published_knowledge(text, text, integer)
  from public, anon, authenticated;
grant execute on function public.orby_search_published_knowledge(text, text, integer)
  to service_role;

create or replace function public.orby_search_admin_knowledge(
  p_query text,
  p_subject text default null,
  p_limit integer default 6
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
    select pg_catalog.websearch_to_tsquery(
      'spanish'::pg_catalog.regconfig,
      pg_catalog.left(coalesce(p_query, ''), 800)
    ) as value
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
  where d.status in ('draft', 'published')
    and (
      p_subject is null
      or d.subject = p_subject
      or d.subject = 'Preparación Saber 11'
    )
    and pg_catalog.numnode(q.value) > 0
    and c.search_vector @@ q.value
  order by pg_catalog.ts_rank(c.search_vector, q.value) desc
  limit greatest(1, least(coalesce(p_limit, 6), 8));
$$;

revoke all on function public.orby_search_admin_knowledge(text, text, integer)
  from public, anon, authenticated;
grant execute on function public.orby_search_admin_knowledge(text, text, integer)
  to service_role;

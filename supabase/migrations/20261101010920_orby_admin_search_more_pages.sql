-- Let the private Orby Lab retrieve chunks by PDF filename/title as well as content.
-- This is limited to the authenticated admin search RPC; student search remains separate.

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
  ),
  query_terms as (
    select distinct lower(regexp_replace(token, '[^[:alnum:]áéíóúüñ]', '', 'g')) as term
    from pg_catalog.regexp_split_to_table(
      pg_catalog.left(coalesce(p_query, ''), 800),
      '\s+'
    ) as tokens(token)
    where pg_catalog.length(regexp_replace(token, '[^[:alnum:]áéíóúüñ]', '', 'g')) >= 4
      and lower(regexp_replace(token, '[^[:alnum:]áéíóúüñ]', '', 'g')) not in (
        'para', 'como', 'este', 'esta', 'sobre', 'entre', 'desde',
        'tiene', 'tengo', 'quiero', 'puedes', 'podrias', 'trata',
        'documento', 'archivo', 'material'
      )
  ),
  matches as (
    select
      d.id as document_id,
      d.title,
      d.subject,
      d.topic,
      c.page_number,
      c.content,
      (
        pg_catalog.ts_rank(c.search_vector, q.value)
        + 3 * pg_catalog.ts_rank(
            pg_catalog.to_tsvector('spanish'::pg_catalog.regconfig, coalesce(d.title, '')),
            q.value
          )
        + case when exists (
            select 1 from query_terms qt
            where d.title ilike '%' || qt.term || '%'
          ) then 0.5 else 0 end
      )::real as relevance
    from public.orby_knowledge_chunks c
    join public.orby_knowledge_documents d on d.id = c.document_id
    cross join query_value q
    where d.status in ('draft', 'published')
      and (
        p_subject is null
        or d.subject = p_subject
        or d.subject = 'Preparación Saber 11'
      )
      and (
        (pg_catalog.numnode(q.value) > 0 and (
          c.search_vector @@ q.value
          or pg_catalog.to_tsvector(
            'spanish'::pg_catalog.regconfig,
            coalesce(d.title, '')
          ) @@ q.value
        ))
        or exists (
          select 1 from query_terms qt
          where d.title ilike '%' || qt.term || '%'
        )
      )
  )
  select
    m.document_id,
    m.title,
    m.subject,
    m.topic,
    m.page_number,
    m.content,
    m.relevance as rank
  from matches m
  order by m.relevance desc, m.title, m.page_number
  limit greatest(1, least(coalesce(p_limit, 6), 12));
$$;

revoke all on function public.orby_search_admin_knowledge(text, text, integer)
  from public, anon, authenticated;
grant execute on function public.orby_search_admin_knowledge(text, text, integer)
  to service_role;

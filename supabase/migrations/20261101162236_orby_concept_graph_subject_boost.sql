-- Search the normalized concept graph directly, instead of relying only
-- on chunk similarity. Every result retains its document and page evidence.
create or replace function public.orby_search_knowledge_concepts(
  p_query text,
  p_subject text default null,
  p_visibility text default 'published',
  p_limit integer default 24
)
returns table (
  document_id uuid,
  title text,
  subject text,
  topic text,
  concept_name text,
  area text,
  parent_concept text,
  aliases text[],
  evidence_pages integer[],
  confidence numeric,
  importance smallint,
  evidence_summary text,
  rank real
)
language sql
stable
set search_path = ''
as $$
  with query_value as (
    select pg_catalog.websearch_to_tsquery(
      'spanish'::pg_catalog.regconfig,
      pg_catalog.left(coalesce(p_query, ''), 1200)
    ) as value
  ),
  eligible as (
    select d.id, d.title, d.subject, d.topic
    from public.orby_knowledge_documents d
    where
      (p_visibility = 'admin' and d.status in ('draft','published'))
      or (p_visibility = 'published' and d.status = 'published')
  ),
  indexed as (
    select
      c.document_id,
      c.concept_name,
      c.area,
      c.parent_concept,
      c.aliases,
      c.evidence_pages,
      c.confidence,
      c.importance,
      c.evidence_summary,
      pg_catalog.to_tsvector(
        'spanish'::pg_catalog.regconfig,
        concat_ws(' ',
          c.concept_name,
          c.area,
          c.parent_concept,
          pg_catalog.array_to_string(c.aliases, ' '),
          c.evidence_summary
        )
      ) as search_vector
    from public.orby_knowledge_document_concepts c
    join eligible e on e.id = c.document_id
    where cardinality(c.evidence_pages) > 0
  ),
  ranked as (
    select
      i.*,
      case
        when pg_catalog.numnode(q.value) > 0
          then pg_catalog.ts_rank_cd(i.search_vector, q.value)
        else 0::real
      end as lexical_rank,
      case
        when lower(i.concept_name) = lower(pg_catalog.btrim(p_query)) then 1
        when exists (
          select 1
          from unnest(coalesce(i.aliases, '{}'::text[])) as alias(value)
          where lower(alias.value) = lower(pg_catalog.btrim(p_query))
        ) then 1
        else 0
      end as exact_match
    from indexed i
    cross join query_value q
    where
      (
        pg_catalog.numnode(q.value) > 0
        and i.search_vector @@ q.value
      )
      or lower(i.concept_name) like '%' || lower(pg_catalog.btrim(p_query)) || '%'
      or lower(coalesce(i.parent_concept,'')) like '%' || lower(pg_catalog.btrim(p_query)) || '%'
      or exists (
        select 1
        from unnest(coalesce(i.aliases, '{}'::text[])) as alias(value)
        where lower(alias.value) like '%' || lower(pg_catalog.btrim(p_query)) || '%'
      )
  )
  select
    e.id,
    e.title,
    e.subject,
    e.topic,
    r.concept_name,
    r.area,
    r.parent_concept,
    coalesce(r.aliases, '{}'::text[]),
    r.evidence_pages,
    r.confidence,
    r.importance,
    coalesce(r.evidence_summary, ''),
    (
      r.lexical_rank
      + (r.exact_match * 2.0)
      + (greatest(1, least(5, r.importance)) * 0.04)
      + (greatest(0, least(1, r.confidence)) * 0.03)
      + case
          when p_subject is not null and p_subject <> ''
            and lower(coalesce(e.subject,'')) like '%' || lower(p_subject) || '%'
            then 0.18
          else 0
        end
    )::real
  from ranked r
  join eligible e on e.id = r.document_id
  order by 13 desc, e.title asc, r.concept_name asc
  limit greatest(1, least(coalesce(p_limit, 24), 60));
$$;

revoke all on function public.orby_search_knowledge_concepts(text,text,text,integer) from public, anon, authenticated;
grant execute on function public.orby_search_knowledge_concepts(text,text,text,integer) to service_role;

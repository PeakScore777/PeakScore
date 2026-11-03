create or replace function public.orby_list_knowledge_embedding_models(
  p_visibility text default 'published',
  p_subject text default null
)
returns table (embedding_model text)
language sql
stable
set search_path = ''
as $$
  select distinct c.embedding_model
  from public.orby_knowledge_chunks c
  join public.orby_knowledge_documents d on d.id = c.document_id
  where c.embedding is not null
    and c.embedding_model is not null
    and (
      (p_visibility = 'admin' and d.status in ('draft', 'published'))
      or (p_visibility = 'published' and d.status = 'published')
    )
    and (p_subject is null or d.subject = p_subject)
  order by c.embedding_model
  limit 4;
$$;

revoke all on function public.orby_list_knowledge_embedding_models(text, text) from public, anon, authenticated;
grant execute on function public.orby_list_knowledge_embedding_models(text, text) to service_role;

-- Model-aware Orby hybrid search.
-- Each query vector is compared only with document vectors from the same embedding model.
-- Lexical retrieval remains model-agnostic and always participates in the ranking.

create or replace function public.orby_search_knowledge_hybrid_v2(
  p_query text,
  p_embedding extensions.vector(768) default null,
  p_subject text default null,
  p_limit integer default 8,
  p_visibility text default 'published',
  p_embedding_model text default null
)
returns table (
  document_id uuid,
  title text,
  subject text,
  topic text,
  page_number integer,
  content text,
  rank real,
  profile_summary text,
  profile_concepts jsonb,
  profile_competencies jsonb,
  profile_topics jsonb
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
    select d.id, d.title, d.subject, d.topic, d.created_at,
      p.summary, p.concepts, p.competencies, p.topics, p.search_text
    from public.orby_knowledge_documents d
    left join public.orby_knowledge_profiles p on p.document_id = d.id
    where (
      (p_visibility = 'admin' and d.status in ('draft', 'published'))
      or (p_visibility = 'published' and d.status = 'published')
    )
    and (p_subject is null or d.subject = p_subject)
  ),
  lexical as (
    select c.id as chunk_id,
      row_number() over (
        order by
          pg_catalog.ts_rank_cd(c.search_vector, q.value) desc,
          case when e.title ilike '%' || left(coalesce(p_query, ''), 80) || '%' then 1 else 0 end desc,
          c.page_number asc
      ) as lexical_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id = c.document_id
    cross join query_value q
    where pg_catalog.numnode(q.value) > 0
      and (
        c.search_vector @@ q.value
        or pg_catalog.to_tsvector(
          'spanish'::pg_catalog.regconfig,
          coalesce(e.title, '') || ' ' || coalesce(e.search_text, '')
        ) @@ q.value
      )
    order by pg_catalog.ts_rank_cd(c.search_vector, q.value) desc
    limit greatest(16, least(coalesce(p_limit, 8), 16) * 8)
  ),
  semantic as (
    select c.id as chunk_id,
      row_number() over (
        order by c.embedding OPERATOR(extensions.<=>) p_embedding
      ) as semantic_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id = c.document_id
    where p_embedding is not null
      and c.embedding is not null
      and p_embedding_model is not null
      and c.embedding_model = p_embedding_model
    order by c.embedding OPERATOR(extensions.<=>) p_embedding
    limit greatest(16, least(coalesce(p_limit, 8), 16) * 8)
  ),
  candidates as (
    select chunk_id, lexical_position::integer as lexical_position, null::integer as semantic_position
    from lexical
    union all
    select chunk_id, null::integer, semantic_position::integer
    from semantic
  ),
  fused as (
    select chunk_id,
      min(lexical_position) as lexical_position,
      min(semantic_position) as semantic_position,
      (
        coalesce(1.0 / (60 + min(lexical_position)), 0)
        + coalesce(1.25 / (60 + min(semantic_position)), 0)
      )::real as fused_rank
    from candidates
    group by chunk_id
  )
  select
    e.id,
    e.title,
    e.subject,
    e.topic,
    c.page_number,
    c.content,
    f.fused_rank,
    coalesce(e.summary, ''),
    coalesce(e.concepts, '[]'::jsonb),
    coalesce(e.competencies, '[]'::jsonb),
    coalesce(e.topics, '[]'::jsonb)
  from fused f
  join public.orby_knowledge_chunks c on c.id = f.chunk_id
  join eligible e on e.id = c.document_id
  order by f.fused_rank desc, c.page_number asc
  limit greatest(1, least(coalesce(p_limit, 8), 16));
$$;

revoke all on function public.orby_search_knowledge_hybrid_v2(text, extensions.vector, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.orby_search_knowledge_hybrid_v2(text, extensions.vector, text, integer, text, text) to service_role;

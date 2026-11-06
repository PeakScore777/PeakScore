-- Filter by indexed profile areas because uploaded documents use a generic
-- container subject ("Preparación Saber 11") instead of a single ICFES area.
-- Keep model discovery and hybrid retrieval aligned with the profile taxonomy.
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
  left join public.orby_knowledge_profiles p on p.document_id = d.id
  where c.embedding is not null
    and c.embedding_model is not null
    and (
      (p_visibility = 'admin' and d.status in ('draft', 'published'))
      or (p_visibility = 'published' and d.status = 'published')
    )
    and (
      p_subject is null
      or d.subject = p_subject
      or exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(coalesce(p.areas, '[]'::jsonb)) as area(value)
        where lower(btrim(area.value)) = lower(btrim(p_subject))
      )
    )
  order by c.embedding_model
  limit 4;
$$;

create or replace function public.orby_search_knowledge_hybrid_multi_v3(
  p_query text,
  p_embeddings jsonb default '[]'::jsonb,
  p_subject text default null,
  p_limit integer default 8,
  p_visibility text default 'published'
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
    select d.id, d.title, d.subject, d.topic,
      p.summary, p.concepts, p.competencies, p.topics, p.search_text
    from public.orby_knowledge_documents d
    left join public.orby_knowledge_profiles p on p.document_id = d.id
    where (
      (p_visibility = 'admin' and d.status in ('draft', 'published'))
      or (p_visibility = 'published' and d.status = 'published')
    )
    and (
      p_subject is null
      or d.subject = p_subject
      or exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(coalesce(p.areas, '[]'::jsonb)) as area(value)
        where lower(btrim(area.value)) = lower(btrim(p_subject))
      )
    )
  ),
  embedding_inputs as (
    select
      item.value ->> 'model' as model,
      ((item.value -> 'values')::text)::extensions.vector(768) as embedding
    from pg_catalog.jsonb_array_elements(
      case when jsonb_typeof(p_embeddings) = 'array' then p_embeddings else '[]'::jsonb end
    ) as item(value)
    where length(coalesce(item.value ->> 'model', '')) between 1 and 100
      and jsonb_typeof(item.value -> 'values') = 'array'
      and jsonb_array_length(item.value -> 'values') = 768
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
  semantic_ranked as (
    select
      c.id as chunk_id,
      q.model,
      row_number() over (
        partition by q.model
        order by c.embedding OPERATOR(extensions.<=>) q.embedding
      ) as semantic_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id = c.document_id
    join embedding_inputs q on q.model = c.embedding_model
    where c.embedding is not null
  ),
  semantic as (
    select chunk_id, min(semantic_position)::integer as semantic_position
    from semantic_ranked
    where semantic_position <= greatest(16, least(coalesce(p_limit, 8), 16) * 8)
    group by chunk_id
  ),
  candidates as (
    select chunk_id, lexical_position::integer as lexical_position, null::integer as semantic_position
    from lexical
    union all
    select chunk_id, null::integer, semantic_position
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

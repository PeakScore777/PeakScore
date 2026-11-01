-- Orby shared academic knowledge graph + semantic retrieval.
-- Embeddings enrich retrieval; full-text search remains available as a resilient fallback.

create extension if not exists vector with schema extensions;

alter table public.orby_knowledge_chunks
  add column if not exists embedding extensions.vector(768),
  add column if not exists embedding_model text,
  add column if not exists embedded_at timestamptz;

create index if not exists orby_knowledge_chunks_embedding_hnsw_idx
  on public.orby_knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

alter table public.orby_knowledge_documents
  add column if not exists embedded_chunk_count integer not null default 0,
  add column if not exists knowledge_profile_status text not null default 'pending'
    check (knowledge_profile_status in ('pending','ready','failed')),
  add column if not exists concept_count integer not null default 0;

create table if not exists public.orby_knowledge_profiles (
  document_id uuid primary key references public.orby_knowledge_documents(id) on delete cascade,
  summary text not null default '',
  areas jsonb not null default '[]'::jsonb,
  topics jsonb not null default '[]'::jsonb,
  concepts jsonb not null default '[]'::jsonb,
  competencies jsonb not null default '[]'::jsonb,
  study_strategies jsonb not null default '[]'::jsonb,
  gaps_observed jsonb not null default '[]'::jsonb,
  keywords text[] not null default '{}'::text[],
  search_text text not null default '',
  profile_model text,
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orby_knowledge_profiles_search_idx
  on public.orby_knowledge_profiles
  using gin (to_tsvector('spanish'::regconfig, coalesce(search_text,'')));

create table if not exists public.orby_knowledge_document_concepts (
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  concept_key text not null,
  concept_name text not null,
  area text not null default 'Transversal',
  evidence_pages integer[] not null default '{}'::integer[],
  confidence numeric(3,2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  evidence_summary text not null default '',
  primary key (document_id, concept_key)
);

create index if not exists orby_knowledge_concepts_key_idx
  on public.orby_knowledge_document_concepts (concept_key, document_id);
create index if not exists orby_knowledge_concepts_area_idx
  on public.orby_knowledge_document_concepts (area, concept_key);

alter table public.orby_knowledge_profiles enable row level security;
alter table public.orby_knowledge_document_concepts enable row level security;
revoke all on public.orby_knowledge_profiles, public.orby_knowledge_document_concepts from public, anon, authenticated;
grant select, insert, update, delete on public.orby_knowledge_profiles, public.orby_knowledge_document_concepts to service_role;

create or replace function public.orby_save_chunk_embeddings(
  p_document_id uuid,
  p_embeddings jsonb,
  p_model text default 'gemini-embedding-001'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer := 0;
begin
  if jsonb_typeof(coalesce(p_embeddings, '[]'::jsonb)) <> 'array' then
    raise exception 'Embeddings payload must be an array';
  end if;

  update public.orby_knowledge_chunks c
  set embedding = ((item.value -> 'values')::text)::extensions.vector(768),
      embedding_model = left(coalesce(p_model, 'gemini-embedding-001'), 100),
      embedded_at = now()
  from jsonb_array_elements(p_embeddings) as item(value)
  where c.document_id = p_document_id
    and c.chunk_index = (item.value ->> 'chunk_index')::integer
    and jsonb_typeof(item.value -> 'values') = 'array'
    and jsonb_array_length(item.value -> 'values') = 768;

  get diagnostics affected = row_count;

  update public.orby_knowledge_documents d
  set embedded_chunk_count = (
    select count(*)::integer
    from public.orby_knowledge_chunks c
    where c.document_id = d.id and c.embedding is not null
  ),
  updated_at = now()
  where d.id = p_document_id;

  return affected;
end;
$$;

revoke all on function public.orby_save_chunk_embeddings(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_chunk_embeddings(uuid,jsonb,text) to service_role;

create or replace function public.orby_save_knowledge_profile(
  p_document_id uuid,
  p_profile jsonb,
  p_model text default 'gemini-3.1-flash-lite'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_concepts integer := 0;
  profile_search_text text;
begin
  if jsonb_typeof(coalesce(p_profile, '{}'::jsonb)) <> 'object' then
    raise exception 'Knowledge profile must be a JSON object';
  end if;

  profile_search_text := concat_ws(
    E'\n',
    coalesce(p_profile ->> 'summary',''),
    coalesce(p_profile ->> 'search_text',''),
    coalesce((select string_agg(value, ' ') from jsonb_array_elements_text(coalesce(p_profile -> 'topics','[]'::jsonb))), ''),
    coalesce((select string_agg(value, ' ') from jsonb_array_elements_text(coalesce(p_profile -> 'keywords','[]'::jsonb))), ''),
    coalesce((select string_agg(value ->> 'name', ' ') from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as value), ''),
    coalesce((select string_agg(value ->> 'name', ' ') from jsonb_array_elements(coalesce(p_profile -> 'competencies','[]'::jsonb)) as value), '')
  );

  insert into public.orby_knowledge_profiles (
    document_id, summary, areas, topics, concepts, competencies,
    study_strategies, gaps_observed, keywords, search_text, profile_model, generated_at, updated_at
  )
  values (
    p_document_id,
    left(coalesce(p_profile ->> 'summary',''), 5000),
    case when jsonb_typeof(p_profile -> 'areas')='array' then p_profile -> 'areas' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'topics')='array' then p_profile -> 'topics' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'concepts')='array' then p_profile -> 'concepts' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'competencies')='array' then p_profile -> 'competencies' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'study_strategies')='array' then p_profile -> 'study_strategies' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'gaps_observed')='array' then p_profile -> 'gaps_observed' else '[]'::jsonb end,
    case when jsonb_typeof(p_profile -> 'keywords')='array' then array(select jsonb_array_elements_text(p_profile -> 'keywords')) else '{}'::text[] end,
    left(profile_search_text, 20000),
    left(coalesce(p_model,'gemini-3.1-flash-lite'), 100),
    now(),
    now()
  )
  on conflict (document_id) do update set
    summary=excluded.summary,
    areas=excluded.areas,
    topics=excluded.topics,
    concepts=excluded.concepts,
    competencies=excluded.competencies,
    study_strategies=excluded.study_strategies,
    gaps_observed=excluded.gaps_observed,
    keywords=excluded.keywords,
    search_text=excluded.search_text,
    profile_model=excluded.profile_model,
    generated_at=excluded.generated_at,
    updated_at=now();

  delete from public.orby_knowledge_document_concepts where document_id=p_document_id;

  insert into public.orby_knowledge_document_concepts (
    document_id, concept_key, concept_name, area, evidence_pages, confidence, evidence_summary
  )
  select
    p_document_id,
    left(trim(both '-' from regexp_replace(lower(coalesce(item.value ->> 'name','')), '[^a-z0-9]+', '-', 'g')), 120),
    left(coalesce(item.value ->> 'name',''), 180),
    left(coalesce(item.value ->> 'area','Transversal'), 80),
    case when jsonb_typeof(item.value -> 'evidence_pages')='array'
      then array(select value::integer from jsonb_array_elements_text(item.value -> 'evidence_pages') value where value ~ '^[0-9]{1,3}$' limit 50)
      else '{}'::integer[] end,
    greatest(0, least(1, coalesce((item.value ->> 'confidence')::numeric, 0.70))),
    left(coalesce(item.value ->> 'evidence',''), 1000)
  from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as item(value)
  where length(trim(coalesce(item.value ->> 'name',''))) between 2 and 180
  on conflict (document_id, concept_key) do update set
    concept_name=excluded.concept_name,
    area=excluded.area,
    evidence_pages=excluded.evidence_pages,
    confidence=excluded.confidence,
    evidence_summary=excluded.evidence_summary;

  get diagnostics saved_concepts = row_count;

  update public.orby_knowledge_documents
  set knowledge_profile_status='ready', concept_count=saved_concepts, updated_at=now()
  where id=p_document_id;

  return saved_concepts;
end;
$$;

revoke all on function public.orby_save_knowledge_profile(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_knowledge_profile(uuid,jsonb,text) to service_role;

create or replace function public.orby_search_knowledge_hybrid(
  p_query text,
  p_embedding extensions.vector(768) default null,
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
    select pg_catalog.websearch_to_tsquery('spanish'::pg_catalog.regconfig, pg_catalog.left(coalesce(p_query,''), 1200)) as value
  ),
  eligible as (
    select d.id, d.title, d.subject, d.topic, d.created_at,
      p.summary, p.concepts, p.competencies, p.topics, p.search_text
    from public.orby_knowledge_documents d
    left join public.orby_knowledge_profiles p on p.document_id=d.id
    where (p_visibility='admin' and d.status in ('draft','published'))
       or (p_visibility='published' and d.status='published')
  ),
  lexical as (
    select c.id as chunk_id,
      row_number() over (
        order by
          pg_catalog.ts_rank_cd(c.search_vector, q.value) desc,
          case when e.title ilike '%' || left(coalesce(p_query,''), 80) || '%' then 1 else 0 end desc,
          c.page_number asc
      ) as lexical_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id=c.document_id
    cross join query_value q
    where pg_catalog.numnode(q.value)>0
      and (
        c.search_vector @@ q.value
        or pg_catalog.to_tsvector('spanish'::pg_catalog.regconfig, coalesce(e.title,'') || ' ' || coalesce(e.search_text,'')) @@ q.value
      )
    order by pg_catalog.ts_rank_cd(c.search_vector, q.value) desc
    limit greatest(16, least(coalesce(p_limit,8),16)*8)
  ),
  semantic as (
    select c.id as chunk_id,
      row_number() over (order by c.embedding <=> p_embedding) as semantic_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id=c.document_id
    where p_embedding is not null and c.embedding is not null
    order by c.embedding <=> p_embedding
    limit greatest(16, least(coalesce(p_limit,8),16)*8)
  ),
  candidates as (
    select chunk_id, lexical_position::integer as lexical_position, null::integer as semantic_position from lexical
    union all
    select chunk_id, null::integer, semantic_position::integer from semantic
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
    coalesce(e.summary,''),
    coalesce(e.concepts,'[]'::jsonb),
    coalesce(e.competencies,'[]'::jsonb),
    coalesce(e.topics,'[]'::jsonb)
  from fused f
  join public.orby_knowledge_chunks c on c.id=f.chunk_id
  join eligible e on e.id=c.document_id
  order by f.fused_rank desc, c.page_number asc
  limit greatest(1, least(coalesce(p_limit,8),16));
$$;

revoke all on function public.orby_search_knowledge_hybrid(text,extensions.vector,text,integer,text) from public, anon, authenticated;
grant execute on function public.orby_search_knowledge_hybrid(text,extensions.vector,text,integer,text) to service_role;

create or replace function public.orby_get_related_knowledge(
  p_document_ids uuid[],
  p_visibility text default 'published',
  p_limit integer default 6
)
returns table (
  document_id uuid,
  title text,
  subject text,
  summary text,
  shared_concepts jsonb,
  areas jsonb,
  topics jsonb
)
language sql
stable
set search_path = ''
as $$
  with seeds as (
    select distinct concept_key, concept_name
    from public.orby_knowledge_document_concepts
    where document_id = any(coalesce(p_document_ids, '{}'::uuid[]))
  ),
  related as (
    select
      d.id,
      d.title,
      d.subject,
      p.summary,
      pg_catalog.jsonb_agg(distinct pg_catalog.to_jsonb(s.concept_name)) as shared_concepts,
      p.areas,
      p.topics,
      count(distinct s.concept_key) as overlap_count,
      max(d.created_at) as created_at
    from seeds s
    join public.orby_knowledge_document_concepts c on c.concept_key=s.concept_key
    join public.orby_knowledge_documents d on d.id=c.document_id
    join public.orby_knowledge_profiles p on p.document_id=d.id
    where not (d.id = any(coalesce(p_document_ids, '{}'::uuid[])))
      and ((p_visibility='admin' and d.status in ('draft','published')) or (p_visibility='published' and d.status='published'))
    group by d.id,d.title,d.subject,p.summary,p.areas,p.topics
  )
  select id,title,subject,summary,shared_concepts,areas,topics
  from related
  order by overlap_count desc, created_at desc
  limit greatest(1, least(coalesce(p_limit,6),10));
$$;

revoke all on function public.orby_get_related_knowledge(uuid[],text,integer) from public, anon, authenticated;
grant execute on function public.orby_get_related_knowledge(uuid[],text,integer) to service_role;

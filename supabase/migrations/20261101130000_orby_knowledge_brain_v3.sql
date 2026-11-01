-- Orby Knowledge Brain v3:
-- structured teaching maps, concept details, cross-document prerequisite links,
-- subject-scoped diverse retrieval and per-student concept mastery aggregation.

alter table public.orby_knowledge_profiles
  add column if not exists learning_map jsonb not null default '[]'::jsonb,
  add column if not exists teaching_guides jsonb not null default '[]'::jsonb,
  add column if not exists exercise_blueprints jsonb not null default '[]'::jsonb,
  add column if not exists common_misconceptions jsonb not null default '[]'::jsonb,
  add column if not exists coverage_audit jsonb not null default '{}'::jsonb;

alter table public.orby_knowledge_documents
  add column if not exists primary_topic_count integer not null default 0,
  add column if not exists subtopic_count integer not null default 0,
  add column if not exists coverage_score numeric(5,2) not null default 0
    check (coverage_score >= 0 and coverage_score <= 100);

create or replace function public.orby_normalize_concept_key(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    trim(both '-' from regexp_replace(
      translate(lower(coalesce(p_value,'')), 'áéíóúüñ', 'aeiouun'),
      '[^a-z0-9]+',
      '-',
      'g'
    )),
    120
  );
$$;

revoke all on function public.orby_normalize_concept_key(text) from public, anon, authenticated;
grant execute on function public.orby_normalize_concept_key(text) to service_role;

create table if not exists public.orby_knowledge_concept_details (
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  concept_key text not null,
  concept_type text not null default 'subtopic'
    check (concept_type in ('main_topic','subtopic','definition','process','law','formula','method','skill','term','event')),
  definition text not null default '',
  learning_objectives text[] not null default '{}'::text[],
  prerequisite_concepts text[] not null default '{}'::text[],
  misconceptions text[] not null default '{}'::text[],
  practice_skills text[] not null default '{}'::text[],
  applications text[] not null default '{}'::text[],
  evidence_pages integer[] not null default '{}'::integer[],
  confidence numeric(3,2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  evidence_summary text not null default '',
  updated_at timestamptz not null default now(),
  primary key (document_id, concept_key)
);

create index if not exists orby_knowledge_concept_details_key_idx
  on public.orby_knowledge_concept_details (concept_key, document_id);
create index if not exists orby_knowledge_concept_details_prerequisite_idx
  on public.orby_knowledge_concept_details using gin (prerequisite_concepts);

create table if not exists public.orby_knowledge_concept_relations (
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  source_concept_key text not null,
  target_concept_key text not null,
  relation_type text not null
    check (relation_type in ('prerequisite','part_of','related','contrasts_with','applies_to')),
  evidence_pages integer[] not null default '{}'::integer[],
  confidence numeric(3,2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  rationale text not null default '',
  created_at timestamptz not null default now(),
  primary key (document_id, source_concept_key, target_concept_key, relation_type),
  check (source_concept_key <> target_concept_key)
);

create index if not exists orby_knowledge_relations_source_idx
  on public.orby_knowledge_concept_relations (source_concept_key, relation_type);
create index if not exists orby_knowledge_relations_target_idx
  on public.orby_knowledge_concept_relations (target_concept_key, relation_type);

alter table public.orby_knowledge_concept_details enable row level security;
alter table public.orby_knowledge_concept_relations enable row level security;
revoke all on public.orby_knowledge_concept_details, public.orby_knowledge_concept_relations
  from public, anon, authenticated;
grant select, insert, update, delete on public.orby_knowledge_concept_details,
  public.orby_knowledge_concept_relations to service_role;

create or replace function public.orby_save_knowledge_profile_v3(
  p_document_id uuid,
  p_profile jsonb,
  p_model text default 'gemini-3.1-flash-lite'
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_concepts integer := 0;
  primary_topics integer := 0;
  subtopics integer := 0;
  coverage numeric(5,2) := 0;
begin
  if jsonb_typeof(coalesce(p_profile, '{}'::jsonb)) <> 'object' then
    raise exception 'Knowledge profile must be a JSON object';
  end if;

  -- Reuse the established, tested profile writer. Everything below executes
  -- in the same PostgreSQL transaction, so details/edges cannot partially save.
  saved_concepts := public.orby_save_knowledge_profile(p_document_id, p_profile, p_model);

  update public.orby_knowledge_profiles
  set learning_map = case when jsonb_typeof(p_profile -> 'learning_map')='array' then p_profile -> 'learning_map' else '[]'::jsonb end,
      teaching_guides = case when jsonb_typeof(p_profile -> 'teaching_guides')='array' then p_profile -> 'teaching_guides' else '[]'::jsonb end,
      exercise_blueprints = case when jsonb_typeof(p_profile -> 'exercise_blueprints')='array' then p_profile -> 'exercise_blueprints' else '[]'::jsonb end,
      common_misconceptions = case when jsonb_typeof(p_profile -> 'common_misconceptions')='array' then p_profile -> 'common_misconceptions' else '[]'::jsonb end,
      coverage_audit = case when jsonb_typeof(p_profile -> 'coverage_audit')='object' then p_profile -> 'coverage_audit' else '{}'::jsonb end,
      profile_version = 3,
      search_text = left(
        coalesce(search_text,'') || E'\n'
        || coalesce((select string_agg(value ->> 'name',' ') from jsonb_array_elements(coalesce(p_profile -> 'learning_map','[]'::jsonb)) value),'')
        || ' ' || coalesce((select string_agg(value ->> 'concept',' ') from jsonb_array_elements(coalesce(p_profile -> 'teaching_guides','[]'::jsonb)) value),'')
        || ' ' || coalesce((select string_agg(value ->> 'concept',' ') from jsonb_array_elements(coalesce(p_profile -> 'exercise_blueprints','[]'::jsonb)) value),''),
        30000
      ),
      updated_at = now()
  where document_id = p_document_id;

  delete from public.orby_knowledge_concept_details where document_id=p_document_id;
  delete from public.orby_knowledge_concept_relations where document_id=p_document_id;

  with raw_concepts as (
    select item
    from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) item
    where jsonb_typeof(item)='object'
      and length(trim(coalesce(item ->> 'name',''))) between 2 and 180
  ),
  deduplicated as (
    select
      public.orby_normalize_concept_key(item ->> 'name') as concept_key,
      (array_agg(item order by
        case when item ->> 'concept_type'='main_topic' then 0 else 1 end,
        greatest(1, least(5, coalesce(nullif(item ->> 'importance','')::smallint,3))) desc
      ))[1] as item,
      array(
        select distinct page.value::integer
        from raw_concepts r
        cross join lateral jsonb_array_elements_text(coalesce(r.item -> 'evidence_pages','[]'::jsonb)) page(value)
        where public.orby_normalize_concept_key(r.item ->> 'name') =
              public.orby_normalize_concept_key((array_agg(item))[1] ->> 'name')
          and page.value ~ '^[0-9]{1,3}$'
        order by page.value::integer
        limit 50
      ) as evidence_pages
    from raw_concepts
    group by public.orby_normalize_concept_key(item ->> 'name')
  )
  insert into public.orby_knowledge_concept_details (
    document_id, concept_key, concept_type, definition, learning_objectives,
    prerequisite_concepts, misconceptions, practice_skills, applications,
    evidence_pages, confidence, evidence_summary, updated_at
  )
  select
    p_document_id,
    concept_key,
    case when item ->> 'concept_type' in ('main_topic','subtopic','definition','process','law','formula','method','skill','term','event')
      then item ->> 'concept_type' else 'subtopic' end,
    left(coalesce(item ->> 'definition',''), 1200),
    case when jsonb_typeof(item -> 'learning_objectives')='array'
      then array(select distinct left(trim(value),180) from jsonb_array_elements_text(item -> 'learning_objectives') value where length(trim(value)) between 2 and 180 limit 12)
      else '{}'::text[] end,
    case when jsonb_typeof(item -> 'prerequisites')='array'
      then array(select distinct left(trim(value),180) from jsonb_array_elements_text(item -> 'prerequisites') value where length(trim(value)) between 2 and 180 limit 12)
      else '{}'::text[] end,
    case when jsonb_typeof(item -> 'misconceptions')='array'
      then array(select distinct left(trim(value),220) from jsonb_array_elements_text(item -> 'misconceptions') value where length(trim(value)) between 2 and 220 limit 10)
      else '{}'::text[] end,
    case when jsonb_typeof(item -> 'practice_skills')='array'
      then array(select distinct left(trim(value),180) from jsonb_array_elements_text(item -> 'practice_skills') value where length(trim(value)) between 2 and 180 limit 12)
      else '{}'::text[] end,
    case when jsonb_typeof(item -> 'applications')='array'
      then array(select distinct left(trim(value),180) from jsonb_array_elements_text(item -> 'applications') value where length(trim(value)) between 2 and 180 limit 10)
      else '{}'::text[] end,
    evidence_pages,
    greatest(0, least(1, coalesce(nullif(item ->> 'confidence','')::numeric,0.70))),
    left(coalesce(item ->> 'evidence',''),1000),
    now()
  from deduplicated
  where concept_key <> ''
  on conflict (document_id,concept_key) do update set
    concept_type=excluded.concept_type,
    definition=excluded.definition,
    learning_objectives=excluded.learning_objectives,
    prerequisite_concepts=excluded.prerequisite_concepts,
    misconceptions=excluded.misconceptions,
    practice_skills=excluded.practice_skills,
    applications=excluded.applications,
    evidence_pages=excluded.evidence_pages,
    confidence=excluded.confidence,
    evidence_summary=excluded.evidence_summary,
    updated_at=now();

  -- Convert parent, prerequisite and explicit relation declarations into a graph.
  with concept_items as (
    select item,
      public.orby_normalize_concept_key(item ->> 'name') as source_key,
      case when jsonb_typeof(item -> 'evidence_pages')='array'
        then array(select value::integer from jsonb_array_elements_text(item -> 'evidence_pages') value where value ~ '^[0-9]{1,3}$' limit 50)
        else '{}'::integer[] end as pages
    from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) item
    where jsonb_typeof(item)='object' and length(trim(coalesce(item ->> 'name',''))) between 2 and 180
  ),
  edges as (
    select source_key, public.orby_normalize_concept_key(parent.value) as target_key,
      'part_of'::text as relation_type, pages,
      greatest(0,least(1,coalesce(nullif(item ->> 'confidence','')::numeric,0.70))) as confidence,
      'Relación jerárquica declarada en el mapa conceptual del documento.'::text as rationale
    from concept_items
    cross join lateral (select nullif(trim(item ->> 'parent_concept'),'') as value) parent
    where parent.value is not null
    union all
    select ci.source_key, public.orby_normalize_concept_key(req.value), 'prerequisite', ci.pages,
      greatest(0,least(1,coalesce(nullif(ci.item ->> 'confidence','')::numeric,0.70))),
      'Prerrequisito de aprendizaje propuesto y asociado al concepto.'
    from concept_items ci
    cross join lateral jsonb_array_elements_text(coalesce(ci.item -> 'prerequisites','[]'::jsonb)) req(value)
    where length(trim(req.value)) between 2 and 180
    union all
    select ci.source_key, public.orby_normalize_concept_key(rel.value), 'related', ci.pages,
      greatest(0,least(1,coalesce(nullif(ci.item ->> 'confidence','')::numeric,0.70))),
      'Conexión académica relacionada propuesta en el perfil.'
    from concept_items ci
    cross join lateral jsonb_array_elements_text(coalesce(ci.item -> 'related_concepts','[]'::jsonb)) rel(value)
    where length(trim(rel.value)) between 2 and 180
  )
  insert into public.orby_knowledge_concept_relations (
    document_id, source_concept_key, target_concept_key, relation_type,
    evidence_pages, confidence, rationale
  )
  select distinct p_document_id, source_key, target_key, relation_type,
    pages, confidence, rationale
  from edges
  where source_key <> '' and target_key <> '' and source_key <> target_key
  on conflict (document_id,source_concept_key,target_concept_key,relation_type) do update set
    evidence_pages=excluded.evidence_pages,
    confidence=excluded.confidence,
    rationale=excluded.rationale;

  select
    count(*) filter (where coalesce(item ->> 'concept_type','')='main_topic')::integer,
    count(*) filter (where coalesce(item ->> 'concept_type','')<>'main_topic')::integer
  into primary_topics, subtopics
  from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) item;

  coverage := greatest(0,least(100,coalesce(nullif(p_profile #>> '{coverage_audit,coverage_score}','')::numeric,0)));

  update public.orby_knowledge_documents
  set knowledge_profile_status='ready',
      knowledge_profile_version=3,
      concept_count=saved_concepts,
      primary_topic_count=primary_topics,
      subtopic_count=subtopics,
      coverage_score=coverage,
      updated_at=now()
  where id=p_document_id;

  return saved_concepts;
end;
$$;

revoke all on function public.orby_save_knowledge_profile_v3(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_knowledge_profile_v3(uuid,jsonb,text) to service_role;

create or replace function public.orby_get_student_learning_mastery(p_user_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with grouped as (
    select
      public.orby_normalize_concept_key(concept) as concept_key,
      subject,
      max(topic) as topic,
      max(concept) as concept,
      count(*)::integer as signal_count,
      count(*) filter (where learning_state='understands')::integer as understands_count,
      count(*) filter (where learning_state='needs_review')::integer as review_count,
      count(*) filter (where learning_state='struggling')::integer as struggling_count,
      count(*) filter (where learning_state='misconception')::integer as misconception_count,
      sum(
        (case learning_state
          when 'understands' then 1.0
          when 'needs_review' then 0.0
          when 'struggling' then -0.65
          when 'misconception' then -1.0
          else 0.0 end)
        * greatest(0.1,confidence)
        * exp(-extract(epoch from (now()-created_at))/86400.0/45.0)
      ) / nullif(sum(
        greatest(0.1,confidence)
        * exp(-extract(epoch from (now()-created_at))/86400.0/45.0)
      ),0) as weighted_state,
      (array_agg(misconception order by created_at desc) filter (where misconception is not null))[1] as latest_misconception,
      (array_agg(teaching_hint order by created_at desc) filter (where teaching_hint is not null))[1] as latest_teaching_hint,
      max(created_at) as last_seen,
      avg(confidence)::numeric(3,2) as average_confidence
    from public.orby_student_learning_signals
    where user_id=p_user_id and created_at >= now()-interval '180 days'
    group by public.orby_normalize_concept_key(concept),subject
  ),
  scored as (
    select *,
      greatest(0,least(100,round(50 + 50*coalesce(weighted_state,0))))::integer as mastery_score
    from grouped
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'subject',subject,
      'topic',topic,
      'concept',concept,
      'signal_count',signal_count,
      'understands_count',understands_count,
      'review_count',review_count,
      'struggling_count',struggling_count,
      'misconception_count',misconception_count,
      'mastery_score',mastery_score,
      'mastery_level',case
        when signal_count < 3 then 'early_evidence'
        when understands_count >= 3 and mastery_score >= 80 and misconception_count=0 then 'consolidated'
        when mastery_score >= 65 then 'progressing'
        when mastery_score >= 40 then 'needs_review'
        else 'needs_support'
      end,
      'misconception',latest_misconception,
      'teaching_hint',latest_teaching_hint,
      'last_seen',last_seen,
      'confidence',average_confidence
    )
    order by mastery_score asc,last_seen desc
  ),'[]'::jsonb)
  from scored;
$$;

revoke all on function public.orby_get_student_learning_mastery(uuid) from public, anon, authenticated;
grant execute on function public.orby_get_student_learning_mastery(uuid) to service_role;

create or replace function public.orby_get_related_knowledge_v3(
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
  topics jsonb,
  relation_reasons jsonb
)
language sql
stable
set search_path = ''
as $$
  with seed_keys as (
    select distinct c.concept_key
    from public.orby_knowledge_document_concepts c
    where c.document_id=any(coalesce(p_document_ids,'{}'::uuid[]))
  ),
  graph_keys as (
    select r.target_concept_key as concept_key
    from public.orby_knowledge_concept_relations r
    join seed_keys s on s.concept_key=r.source_concept_key
    union
    select r.source_concept_key
    from public.orby_knowledge_concept_relations r
    join seed_keys s on s.concept_key=r.target_concept_key
  ),
  all_keys as (
    select concept_key from seed_keys
    union
    select concept_key from graph_keys
  ),
  related as (
    select
      d.id,d.title,d.subject,p.summary,p.areas,p.topics,
      jsonb_agg(distinct to_jsonb(c.concept_name)) as shared_concepts,
      jsonb_agg(distinct to_jsonb(k.concept_key)) as relation_reasons,
      count(distinct c.concept_key) as overlap_count,
      max(d.created_at) as created_at
    from all_keys k
    join public.orby_knowledge_document_concepts c on c.concept_key=k.concept_key
    join public.orby_knowledge_documents d on d.id=c.document_id
    join public.orby_knowledge_profiles p on p.document_id=d.id
    where not (d.id=any(coalesce(p_document_ids,'{}'::uuid[])))
      and ((p_visibility='admin' and d.status in ('draft','published'))
        or (p_visibility='published' and d.status='published'))
    group by d.id,d.title,d.subject,p.summary,p.areas,p.topics
  )
  select id,title,subject,summary,shared_concepts,areas,topics,relation_reasons
  from related
  order by overlap_count desc,created_at desc
  limit greatest(1,least(coalesce(p_limit,6),10));
$$;

revoke all on function public.orby_get_related_knowledge_v3(uuid[],text,integer) from public, anon, authenticated;
grant execute on function public.orby_get_related_knowledge_v3(uuid[],text,integer) to service_role;

-- Subject is a real retrieval constraint, not merely a hint.
-- Preserve the hybrid RPC return contract while diversifying results by document.
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
    select pg_catalog.websearch_to_tsquery('spanish'::pg_catalog.regconfig, pg_catalog.left(coalesce(p_query,''),1200)) as value
  ),
  eligible as (
    select d.id,d.title,d.subject,d.topic,d.created_at,
      p.summary,p.concepts,p.competencies,p.topics,p.search_text
    from public.orby_knowledge_documents d
    left join public.orby_knowledge_profiles p on p.document_id=d.id
    where ((p_visibility='admin' and d.status in ('draft','published'))
      or (p_visibility='published' and d.status='published'))
      and (p_subject is null or d.subject=p_subject)
  ),
  lexical as (
    select c.id as chunk_id,
      row_number() over (order by
        pg_catalog.ts_rank_cd(c.search_vector,q.value) desc,
        case when e.title ilike '%'||left(coalesce(p_query,''),80)||'%' then 1 else 0 end desc,
        c.page_number asc
      ) as lexical_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id=c.document_id
    cross join query_value q
    where pg_catalog.numnode(q.value)>0 and (
      c.search_vector @@ q.value
      or pg_catalog.to_tsvector('spanish'::pg_catalog.regconfig,coalesce(e.title,'')||' '||coalesce(e.search_text,'')) @@ q.value
    )
    order by pg_catalog.ts_rank_cd(c.search_vector,q.value) desc
    limit greatest(16,least(coalesce(p_limit,8),16)*8)
  ),
  semantic as (
    select c.id as chunk_id,
      row_number() over (order by c.embedding OPERATOR(extensions.<=>) p_embedding) as semantic_position
    from public.orby_knowledge_chunks c
    join eligible e on e.id=c.document_id
    where p_embedding is not null and c.embedding is not null
    order by c.embedding OPERATOR(extensions.<=>) p_embedding
    limit greatest(16,least(coalesce(p_limit,8),16)*8)
  ),
  candidates as (
    select chunk_id,lexical_position::integer as lexical_position,null::integer as semantic_position from lexical
    union all
    select chunk_id,null::integer,semantic_position::integer from semantic
  ),
  fused as (
    select chunk_id,min(lexical_position) as lexical_position,min(semantic_position) as semantic_position,
      (coalesce(1.0/(60+min(lexical_position)),0)
      +coalesce(1.25/(60+min(semantic_position)),0))::real as fused_rank
    from candidates group by chunk_id
  ),
  ranked as (
    select e.id,e.title,e.subject,e.topic,c.page_number,c.content,f.fused_rank,
      e.summary,e.concepts,e.competencies,e.topics,
      row_number() over (partition by e.id order by f.fused_rank desc,c.page_number asc) as document_position
    from fused f
    join public.orby_knowledge_chunks c on c.id=f.chunk_id
    join eligible e on e.id=c.document_id
  )
  select id,title,subject,topic,page_number,content,fused_rank,coalesce(summary,''),
    coalesce(concepts,'[]'::jsonb),coalesce(competencies,'[]'::jsonb),coalesce(topics,'[]'::jsonb)
  from ranked
  where document_position <= greatest(2,ceil(greatest(1,least(coalesce(p_limit,8),16))::numeric/3)::integer)
  order by fused_rank desc,page_number asc
  limit greatest(1,least(coalesce(p_limit,8),16));
$$;

revoke all on function public.orby_search_knowledge_hybrid(text,extensions.vector,text,integer,text) from public,anon,authenticated;
grant execute on function public.orby_search_knowledge_hybrid(text,extensions.vector,text,integer,text) to service_role;

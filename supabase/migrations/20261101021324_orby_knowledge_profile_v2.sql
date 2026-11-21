-- Orby knowledge profile v2: granular concepts, evidence, hierarchy and stronger cross-document links.
alter table public.orby_knowledge_documents
  add column if not exists knowledge_profile_version integer not null default 1;

alter table public.orby_knowledge_profiles
  add column if not exists profile_version integer not null default 1;

alter table public.orby_knowledge_document_concepts
  add column if not exists parent_concept text,
  add column if not exists parent_key text,
  add column if not exists aliases text[] not null default '{}'::text[],
  add column if not exists importance smallint not null default 3
    check (importance between 1 and 5);

create index if not exists orby_knowledge_concepts_parent_idx
  on public.orby_knowledge_document_concepts (parent_key, document_id)
  where parent_key is not null;

create index if not exists orby_knowledge_concepts_aliases_idx
  on public.orby_knowledge_document_concepts using gin (aliases);

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
    coalesce((select string_agg(value ->> 'parent_concept', ' ') from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as value), ''),
    coalesce((select string_agg(value ->> 'name', ' ') from jsonb_array_elements(coalesce(p_profile -> 'competencies','[]'::jsonb)) as value), '')
  );

  insert into public.orby_knowledge_profiles (
    document_id, summary, areas, topics, concepts, competencies,
    study_strategies, gaps_observed, keywords, search_text, profile_model, profile_version, generated_at, updated_at
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
    left(profile_search_text, 30000),
    left(coalesce(p_model,'gemini-3.1-flash-lite'), 100),
    2,
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
    profile_version=2,
    generated_at=excluded.generated_at,
    updated_at=now();

  delete from public.orby_knowledge_document_concepts where document_id=p_document_id;

  insert into public.orby_knowledge_document_concepts (
    document_id, concept_key, concept_name, area, evidence_pages, confidence,
    evidence_summary, parent_concept, parent_key, aliases, importance
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
    left(coalesce(item.value ->> 'evidence',''), 1000),
    nullif(left(trim(coalesce(item.value ->> 'parent_concept','')), 180), ''),
    nullif(left(trim(both '-' from regexp_replace(lower(coalesce(item.value ->> 'parent_concept','')), '[^a-z0-9]+', '-', 'g')), 120), ''),
    case when jsonb_typeof(item.value -> 'aliases')='array'
      then array(
        select distinct left(trim(alias), 100)
        from jsonb_array_elements_text(item.value -> 'aliases') alias
        where length(trim(alias)) between 2 and 100
        limit 8
      )
      else '{}'::text[] end,
    greatest(1, least(5, coalesce((item.value ->> 'importance')::smallint, 3)))
  from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as item(value)
  where length(trim(coalesce(item.value ->> 'name',''))) between 2 and 180
  on conflict (document_id, concept_key) do update set
    concept_name=excluded.concept_name,
    area=excluded.area,
    evidence_pages=excluded.evidence_pages,
    confidence=excluded.confidence,
    evidence_summary=excluded.evidence_summary,
    parent_concept=excluded.parent_concept,
    parent_key=excluded.parent_key,
    aliases=excluded.aliases,
    importance=excluded.importance;

  get diagnostics saved_concepts = row_count;

  update public.orby_knowledge_documents
  set knowledge_profile_status='ready',
      knowledge_profile_version=2,
      concept_count=saved_concepts,
      updated_at=now()
  where id=p_document_id;

  return saved_concepts;
end;
$$;

revoke all on function public.orby_save_knowledge_profile(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_knowledge_profile(uuid,jsonb,text) to service_role;

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
  with seed_ids as (
    select distinct unnest(coalesce(p_document_ids, '{}'::uuid[])) as id
  ),
  seed_terms as (
    select distinct c.concept_key as term, 'Concepto: ' || c.concept_name as label, 'concept'::text as kind
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id=c.document_id
    union
    select distinct regexp_replace(lower(alias), '[^a-z0-9]+', '-', 'g'), 'Alias: ' || alias, 'alias'::text
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id=c.document_id
    cross join lateral unnest(c.aliases) alias
    where length(trim(alias)) >= 3
    union
    select distinct c.parent_key, 'Familia: ' || c.parent_concept, 'family'::text
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id=c.document_id
    where c.parent_key is not null and length(c.parent_key) >= 4
  ),
  candidate_terms as (
    select distinct c.document_id, c.concept_key as term, 'Concepto: ' || c.concept_name as label, 'concept'::text as kind
    from public.orby_knowledge_document_concepts c
    union
    select distinct c.document_id, regexp_replace(lower(alias), '[^a-z0-9]+', '-', 'g'), 'Alias: ' || alias, 'alias'::text
    from public.orby_knowledge_document_concepts c
    cross join lateral unnest(c.aliases) alias
    where length(trim(alias)) >= 3
    union
    select distinct c.document_id, c.parent_key, 'Familia: ' || c.parent_concept, 'family'::text
    from public.orby_knowledge_document_concepts c
    where c.parent_key is not null and length(c.parent_key) >= 4
  ),
  concept_matches as (
    select
      c.document_id,
      pg_catalog.jsonb_agg(distinct pg_catalog.to_jsonb(s.label)) as labels,
      count(distinct s.term) filter (where s.kind='concept') as direct_count,
      count(distinct s.term) filter (where s.kind='alias') as alias_count,
      count(distinct s.term) filter (where s.kind='family') as family_count
    from seed_terms s
    join candidate_terms c on c.term=s.term
    where not (c.document_id = any(coalesce(p_document_ids, '{}'::uuid[])))
    group by c.document_id
  ),
  seed_topics as (
    select distinct
      regexp_replace(lower(trim(topic)), '[^a-z0-9]+', '-', 'g') as topic_key,
      trim(topic) as topic
    from public.orby_knowledge_profiles p
    join seed_ids s on s.id=p.document_id
    cross join lateral jsonb_array_elements_text(coalesce(p.topics,'[]'::jsonb)) topic
    where length(trim(topic)) >= 7
  ),
  candidate_topics as (
    select
      p.document_id,
      regexp_replace(lower(trim(topic)), '[^a-z0-9]+', '-', 'g') as topic_key,
      trim(topic) as topic
    from public.orby_knowledge_profiles p
    cross join lateral jsonb_array_elements_text(coalesce(p.topics,'[]'::jsonb)) topic
    where length(trim(topic)) >= 7
  ),
  topic_matches as (
    select
      c.document_id,
      pg_catalog.jsonb_agg(distinct pg_catalog.to_jsonb('Tema: ' || s.topic)) as labels,
      count(distinct s.topic_key) as topic_count
    from seed_topics s
    join candidate_topics c on c.topic_key=s.topic_key
    where not (c.document_id = any(coalesce(p_document_ids, '{}'::uuid[])))
    group by c.document_id
  ),
  eligible as (
    select d.id,d.title,d.subject,d.created_at,p.summary,p.areas,p.topics
    from public.orby_knowledge_documents d
    join public.orby_knowledge_profiles p on p.document_id=d.id
    where (p_visibility='admin' and d.status in ('draft','published'))
       or (p_visibility='published' and d.status='published')
  ),
  related as (
    select
      e.id,
      e.title,
      e.subject,
      e.summary,
      coalesce(cm.labels,'[]'::jsonb) || coalesce(tm.labels,'[]'::jsonb) as shared_labels,
      e.areas,
      e.topics,
      (coalesce(cm.direct_count,0)*5
       + coalesce(cm.alias_count,0)*3
       + coalesce(cm.family_count,0)*2
       + coalesce(tm.topic_count,0)) as relevance,
      e.created_at
    from eligible e
    left join concept_matches cm on cm.document_id=e.id
    left join topic_matches tm on tm.document_id=e.id
    where cm.document_id is not null or tm.document_id is not null
  )
  select
    id,title,subject,summary,shared_labels,areas,topics
  from related
  order by relevance desc,created_at desc
  limit greatest(1, least(coalesce(p_limit,6),10));
$$;

revoke all on function public.orby_get_related_knowledge(uuid[],text,integer) from public, anon, authenticated;
grant execute on function public.orby_get_related_knowledge(uuid[],text,integer) to service_role;

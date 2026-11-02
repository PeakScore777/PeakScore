-- Pipeline v7: one concept per academic area + normalized label.
-- A concept appearing under multiple headings retains merged evidence and the
-- most descriptive parent heading. Same-name concepts across different areas
-- remain distinct. Existing source documents and vectors are preserved.

create or replace function public.orby_save_knowledge_profile(
  p_document_id uuid,
  p_profile jsonb,
  p_model text default 'gemini-3.1-flash-lite'
)
returns integer
language plpgsql
set search_path = ''
as $function$
declare
  saved_concepts integer := 0;
  profile_search_text text;
begin
  if jsonb_typeof(coalesce(p_profile, '{}'::jsonb)) <> 'object' then
    raise exception 'Knowledge profile must be a JSON object';
  end if;

  profile_search_text := concat_ws(
    E'\\n',
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
    study_strategies, gaps_observed, keywords, search_text, profile_model,
    profile_version, generated_at, updated_at
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

  delete from public.orby_knowledge_document_concepts
  where document_id=p_document_id;

  -- Mathematical suffixes such as |X| are treated as notational aliases.
  -- Parent headings are metadata, not part of the concept's unique identity.
  with raw_concepts as (
    select
      md5(concat_ws(
        '|',
        trim(both '-' from regexp_replace(
          translate(lower(coalesce(item ->> 'area','Transversal')), 'áéíóúüñ', 'aeiouun'),
          '[^a-z0-9]+', '-', 'g'
        )),
        trim(both '-' from regexp_replace(
          translate(
            lower(regexp_replace(coalesce(item ->> 'name',''), '\\|[^|]{1,32}\\|', ' ', 'g')),
            'áéíóúüñ', 'aeiouun'
          ),
          '[^a-z0-9]+', '-', 'g'
        ))
      )) as concept_key,
      item
    from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as source(item)
    where length(trim(coalesce(item ->> 'name',''))) between 2 and 180
  ),
  chosen_names as (
    select r.concept_key,
      (array_agg(
        left(coalesce(r.item ->> 'name',''), 180)
        order by length(trim(coalesce(r.item ->> 'name',''))) desc,
                 greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc,
                 left(coalesce(r.item ->> 'name',''), 180) asc
      ))[1] as concept_name
    from raw_concepts r
    group by r.concept_key
  ),
  deduplicated as (
    select
      r.concept_key,
      n.concept_name,
      (array_agg(
        left(coalesce(r.item ->> 'area','Transversal'), 80)
        order by greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc
      ))[1] as area,
      array(
        select distinct page.value::integer
        from raw_concepts r2
        cross join lateral jsonb_array_elements_text(coalesce(r2.item -> 'evidence_pages','[]'::jsonb)) as page(value)
        where r2.concept_key = r.concept_key
          and page.value ~ '^[0-9]{1,3}$'
        order by page.value::integer
        limit 50
      ) as evidence_pages,
      max(greatest(0, least(1, coalesce(nullif(r.item ->> 'confidence','')::numeric, 0.70)))) as confidence,
      left(string_agg(distinct nullif(trim(r.item ->> 'evidence'), ''), ' · '), 1000) as evidence_summary,
      (array_agg(
        nullif(left(trim(coalesce(r.item ->> 'parent_concept','')), 180), '')
        order by length(trim(coalesce(r.item ->> 'parent_concept',''))) desc,
                 greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc
      ))[1] as parent_concept,
      (array_agg(
        nullif(left(trim(both '-' from regexp_replace(
          translate(lower(coalesce(r.item ->> 'parent_concept','')), 'áéíóúüñ', 'aeiouun'),
          '[^a-z0-9]+', '-', 'g'
        )), 120), '')
        order by length(trim(coalesce(r.item ->> 'parent_concept',''))) desc,
                 greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc
      ))[1] as parent_key,
      array(
        select distinct left(trim(candidate.alias), 100)
        from (
          select jsonb_array_elements_text(coalesce(r2.item -> 'aliases','[]'::jsonb)) as alias
          from raw_concepts r2
          where r2.concept_key = r.concept_key
          union all
          select r2.item ->> 'name' as alias
          from raw_concepts r2
          where r2.concept_key = r.concept_key
        ) as candidate
        where length(trim(candidate.alias)) between 2 and 100
          and trim(candidate.alias) <> n.concept_name
        order by left(trim(candidate.alias), 100)
        limit 12
      ) as aliases,
      max(greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3)))) as importance
    from raw_concepts r
    join chosen_names n on n.concept_key = r.concept_key
    group by r.concept_key, n.concept_name
  )
  insert into public.orby_knowledge_document_concepts (
    document_id, concept_key, concept_name, area, evidence_pages, confidence,
    evidence_summary, parent_concept, parent_key, aliases, importance
  )
  select
    p_document_id, concept_key, concept_name, area, evidence_pages, confidence,
    coalesce(evidence_summary, ''),
    parent_concept, parent_key, aliases, importance
  from deduplicated
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
$function$;

revoke all on function public.orby_save_knowledge_profile(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_knowledge_profile(uuid,jsonb,text) to service_role;

-- Re-run only in-progress documents with the corrected identity/dedup rules.
-- PDFs, page text, and already valid embeddings remain untouched.
with active_jobs as (
  select id, document_id
  from public.orby_knowledge_jobs
  where pipeline_version < 7
    and status in ('queued','running','retrying')
)
delete from public.orby_knowledge_job_batches b
using active_jobs a
where b.job_id = a.id;

update public.orby_knowledge_document_pages p
set visual_status = 'pending',
    coverage_score = 0,
    visual_summary = '',
    ocr_text = '',
    unresolved_items = '[]'::jsonb,
    pedagogical_artifacts = '{}'::jsonb,
    concept_count = 0,
    question_pattern_count = 0,
    review_attempts = 0,
    last_reviewed_at = null,
    updated_at = now()
where exists (
  select 1 from public.orby_knowledge_jobs j
  where j.document_id = p.document_id
    and j.pipeline_version < 7
    and j.status in ('queued','running','retrying')
);

update public.orby_knowledge_jobs j
set pipeline_version = 7,
    stage = case
      when d.embedded_chunk_count < d.chunk_count then 'embeddings'
      else 'profile'
    end,
    status = 'queued',
    total_batches = greatest(1, ceil(d.page_count::numeric / 4)::integer),
    next_batch_index = 0,
    attempt_count = 0,
    max_attempts = 10,
    available_at = now(),
    locked_by = null,
    locked_at = null,
    lease_expires_at = null,
    last_error = null,
    updated_at = now()
from public.orby_knowledge_documents d
where d.id = j.document_id
  and j.pipeline_version < 7
  and j.status in ('queued','running','retrying');

update public.orby_knowledge_documents d
set knowledge_pipeline_version = 0,
    knowledge_profile_status = 'pending',
    concept_count = 0,
    visual_pages_reviewed = 0,
    coverage_percent = 0,
    next_review_at = null,
    ingestion_status = 'processing',
    updated_at = now()
where exists (
  select 1 from public.orby_knowledge_jobs j
  where j.document_id = d.id
    and j.pipeline_version = 7
    and j.status = 'queued'
);


-- Concepts are distinct by academic area + parent family + normalized name.
-- Same-name concepts remain separate when their academic context differs.
create or replace function public.orby_save_knowledge_profile(
  p_document_id uuid,
  p_profile jsonb,
  p_model text default 'gemini-3.1-flash-lite'
)
returns integer
language plpgsql
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
    2, now(), now()
  )
  on conflict (document_id) do update set
    summary=excluded.summary, areas=excluded.areas, topics=excluded.topics,
    concepts=excluded.concepts, competencies=excluded.competencies,
    study_strategies=excluded.study_strategies, gaps_observed=excluded.gaps_observed,
    keywords=excluded.keywords, search_text=excluded.search_text,
    profile_model=excluded.profile_model, profile_version=2,
    generated_at=excluded.generated_at, updated_at=now();

  delete from public.orby_knowledge_document_concepts
  where document_id=p_document_id;

  with raw_concepts as (
    select
      md5(concat_ws(
        '|',
        trim(both '-' from regexp_replace(lower(coalesce(item ->> 'area','Transversal')), '[^a-z0-9]+', '-', 'g')),
        trim(both '-' from regexp_replace(lower(coalesce(item ->> 'parent_concept','')), '[^a-z0-9]+', '-', 'g')),
        trim(both '-' from regexp_replace(lower(coalesce(item ->> 'name','')), '[^a-z0-9]+', '-', 'g'))
      )) as concept_key,
      item
    from jsonb_array_elements(coalesce(p_profile -> 'concepts','[]'::jsonb)) as source(item)
    where length(trim(coalesce(item ->> 'name',''))) between 2 and 180
  ),
  deduplicated as (
    select
      r.concept_key,
      (array_agg(left(coalesce(r.item ->> 'name',''), 180)
        order by greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc,
                 left(coalesce(r.item ->> 'name',''), 180) asc))[1] as concept_name,
      (array_agg(left(coalesce(r.item ->> 'area','Transversal'), 80)
        order by greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc))[1] as area,
      array(
        select distinct page.value::integer
        from raw_concepts r2
        cross join lateral jsonb_array_elements_text(coalesce(r2.item -> 'evidence_pages','[]'::jsonb)) as page(value)
        where r2.concept_key = r.concept_key and page.value ~ '^[0-9]{1,3}$'
        order by page.value::integer limit 50
      ) as evidence_pages,
      max(greatest(0, least(1, coalesce(nullif(r.item ->> 'confidence','')::numeric, 0.70)))) as confidence,
      left(string_agg(distinct nullif(trim(r.item ->> 'evidence'), ''), ' · '), 1000) as evidence_summary,
      (array_agg(nullif(left(trim(coalesce(r.item ->> 'parent_concept','')), 180), '')
        order by greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc))[1] as parent_concept,
      (array_agg(nullif(left(trim(both '-' from regexp_replace(lower(coalesce(r.item ->> 'parent_concept','')), '[^a-z0-9]+', '-', 'g')), 120), '')
        order by greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3))) desc))[1] as parent_key,
      array(
        select distinct left(trim(alias.value), 100)
        from raw_concepts r2
        cross join lateral jsonb_array_elements_text(coalesce(r2.item -> 'aliases','[]'::jsonb)) as alias(value)
        where r2.concept_key = r.concept_key and length(trim(alias.value)) between 2 and 100
        order by left(trim(alias.value), 100) limit 8
      ) as aliases,
      max(greatest(1, least(5, coalesce(nullif(r.item ->> 'importance','')::smallint, 3)))) as importance
    from raw_concepts r
    group by r.concept_key
  )
  insert into public.orby_knowledge_document_concepts (
    document_id, concept_key, concept_name, area, evidence_pages, confidence,
    evidence_summary, parent_concept, parent_key, aliases, importance
  )
  select p_document_id, concept_key, concept_name, area, evidence_pages, confidence,
         coalesce(evidence_summary, ''), parent_concept, parent_key, aliases, importance
  from deduplicated
  on conflict (document_id, concept_key) do update set
    concept_name=excluded.concept_name, area=excluded.area,
    evidence_pages=excluded.evidence_pages, confidence=excluded.confidence,
    evidence_summary=excluded.evidence_summary, parent_concept=excluded.parent_concept,
    parent_key=excluded.parent_key, aliases=excluded.aliases, importance=excluded.importance;

  get diagnostics saved_concepts = row_count;

  update public.orby_knowledge_documents
  set knowledge_profile_status='ready', knowledge_profile_version=2,
      concept_count=saved_concepts, updated_at=now()
  where id=p_document_id;

  return saved_concepts;
end;
$$;

revoke all on function public.orby_save_knowledge_profile(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_knowledge_profile(uuid,jsonb,text) to service_role;

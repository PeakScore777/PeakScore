-- Search the normalized concept graph directly, instead of relying only
-- on chunk similarity. Every result retains its document and page evidence.
-- Keep related-document context inside the academic areas represented by
-- the seed documents. Concept aliases and topic labels can be shared across
-- subjects, so they must not independently pull unrelated-area material.
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
as $orby$
  with seed_ids as (
    select distinct unnest(coalesce(p_document_ids, '{}'::uuid[])) as id
  ),
  seed_areas as (
    select distinct lower(btrim(area.value)) as area
    from public.orby_knowledge_profiles p
    join seed_ids s on s.id = p.document_id
    cross join lateral pg_catalog.jsonb_array_elements_text(coalesce(p.areas, '[]'::jsonb)) as area(value)
    where length(btrim(area.value)) > 1
  ),
  seed_terms as (
    select distinct c.concept_key as term, 'Concepto: ' || c.concept_name as label, 'concept'::text as kind
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id = c.document_id
    union
    select distinct regexp_replace(lower(alias), '[^a-z0-9]+', '-', 'g'), 'Alias: ' || alias, 'alias'::text
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id = c.document_id
    cross join lateral unnest(c.aliases) alias
    where length(trim(alias)) >= 3
    union
    select distinct c.parent_key, 'Familia: ' || c.parent_concept, 'family'::text
    from public.orby_knowledge_document_concepts c
    join seed_ids s on s.id = c.document_id
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
    select c.document_id,
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
    select distinct regexp_replace(lower(trim(topic)), '[^a-z0-9]+', '-', 'g') as topic_key,
      trim(topic) as topic
    from public.orby_knowledge_profiles p
    join seed_ids s on s.id=p.document_id
    cross join lateral pg_catalog.jsonb_array_elements_text(coalesce(p.topics,'[]'::jsonb)) topic
    where length(trim(topic)) >= 7
  ),
  candidate_topics as (
    select p.document_id, regexp_replace(lower(trim(topic)), '[^a-z0-9]+', '-', 'g') as topic_key,
      trim(topic) as topic
    from public.orby_knowledge_profiles p
    cross join lateral pg_catalog.jsonb_array_elements_text(coalesce(p.topics,'[]'::jsonb)) topic
    where length(trim(topic)) >= 7
  ),
  topic_matches as (
    select c.document_id,
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
    where (
      (p_visibility='admin' and d.status in ('draft','published'))
      or (p_visibility='published' and d.status='published')
    )
    and exists (
      select 1
      from seed_areas sa
      where sa.area = any (
        array(
          select lower(btrim(candidate_area.value))
          from pg_catalog.jsonb_array_elements_text(coalesce(p.areas, '[]'::jsonb)) as candidate_area(value)
        )
      )
    )
  ),
  related as (
    select e.id,e.title,e.subject,e.summary,
      coalesce(cm.labels,'[]'::jsonb) || coalesce(tm.labels,'[]'::jsonb) as shared_labels,
      e.areas,e.topics,
      (coalesce(cm.direct_count,0)*5 + coalesce(cm.alias_count,0)*3
        + coalesce(cm.family_count,0)*2 + coalesce(tm.topic_count,0)) as relevance,
      e.created_at
    from eligible e
    left join concept_matches cm on cm.document_id=e.id
    left join topic_matches tm on tm.document_id=e.id
    where cm.document_id is not null or tm.document_id is not null
  )
  select id,title,subject,summary,shared_labels,areas,topics
  from related
  order by relevance desc,created_at desc
  limit greatest(1, least(coalesce(p_limit,6),10));
$orby$;

revoke all on function public.orby_get_related_knowledge(uuid[],text,integer) from public, anon, authenticated;
grant execute on function public.orby_get_related_knowledge(uuid[],text,integer) to service_role;

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
    left join public.orby_knowledge_profiles p on p.document_id = d.id
    where (
      (p_visibility = 'admin' and d.status in ('draft','published'))
      or (p_visibility = 'published' and d.status = 'published')
    )
    and (
      p_subject is null
      or d.subject = p_subject
      or exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(coalesce(p.areas, '[]'::jsonb)) as area(value)
        where lower(btrim(area.value)) = any (
          case lower(btrim(p_subject))
            when 'matemáticas' then array['matemáticas','matematicas','álgebra','algebra','aritmética','aritmetica','geometría','geometria','estadística','estadistica','probabilidad','razonamiento cuantitativo','razonamiento lógico','razonamiento logico','física/matemáticas']
            when 'lectura crítica' then array['lectura crítica','lectura critica','lenguaje','literatura','humanidades','análisis textual','analisis textual','análisis de la imagen','analisis de la imagen']
            when 'sociales y ciudadanas' then array['sociales y ciudadanas','ciencias sociales','ciencias sociales y competencias ciudadanas','competencias ciudadanas','historia','historia de colombia','historia/política','historia/politica','geografía','geografia','economía','economia','economía y política','economia y politica','ciencias políticas','ciencias politicas','ética y ciudadanía','etica y ciudadania','ética y política','etica y politica','constitución política de colombia','constitucion politica de colombia','constitución política','constitucion politica','derecho constitucional','derechos humanos','antropología','antropologia','filosofía','filosofia','psicología','psicologia']
            when 'ciencias naturales' then array['ciencias naturales','física','fisica','química','quimica','biología','biologia','biología celular','biologia celular','biología molecular','biologia molecular','genética','genetica','ecología','ecologia','ciencias ambientales','bioquímica','bioquimica','microbiología','microbiologia','fisiología','fisiologia','química orgánica','quimica organica','estequiometría','estequiometria','electromagnetismo','cinemática','cinematica','mecánica clásica','mecanica clasica','termodinámica','termodinamica','electricidad','óptica','optica']
            when 'inglés' then array['inglés','ingles','english language']
            else array[lower(btrim(p_subject))]
          end
        )
      )
    )
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

-- Search both Spanish-stemmed text and language-neutral English terms.
-- This is important for ICFES English materials whose source chunks are written in English.
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
as $function$
  with query_value as (
    select
      pg_catalog.websearch_to_tsquery(
        'spanish'::pg_catalog.regconfig,
        pg_catalog.left(coalesce(p_query, ''), 1200)
      ) as spanish_query,
      pg_catalog.websearch_to_tsquery(
        'simple'::pg_catalog.regconfig,
        pg_catalog.left(coalesce(p_query, ''), 1200)
      ) as literal_query
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
        where lower(btrim(area.value)) = any (
          case lower(btrim(p_subject))
            when 'matemáticas' then array['matemáticas','matematicas','álgebra','algebra','aritmética','aritmetica','geometría','geometria','estadística','estadistica','probabilidad','razonamiento cuantitativo','razonamiento lógico','razonamiento logico','física/matemáticas']
            when 'lectura crítica' then array['lectura crítica','lectura critica','lenguaje','literatura','humanidades','análisis textual','analisis textual','análisis de la imagen','analisis de la imagen']
            when 'sociales y ciudadanas' then array['sociales y ciudadanas','ciencias sociales','ciencias sociales y competencias ciudadanas','competencias ciudadanas','historia','historia de colombia','historia/política','historia/politica','geografía','geografia','economía','economia','economía y política','economia y politica','ciencias políticas','ciencias politicas','ética y ciudadanía','etica y ciudadania','ética y política','etica y politica','constitución política de colombia','constitucion politica de colombia','constitución política','constitucion politica','derecho constitucional','derechos humanos','antropología','antropologia','filosofía','filosofia','psicología','psicologia']
            when 'ciencias naturales' then array['ciencias naturales','física','fisica','química','quimica','biología','biologia','biología celular','biologia celular','biología molecular','biologia molecular','biología vegetal','biologia vegetal','biología animal','biologia animal','genética','genetica','genética de poblaciones','genetica de poblaciones','ecología','ecologia','ciencias ambientales','fisicoquímica biológica','fisicoquimica biologica','bioquímica','bioquimica','citología','citologia','microbiología','microbiologia','fisiología','fisiologia','fisiología humana','fisiologia humana','fisiología vegetal','fisiologia vegetal','metabolismo','salud','química orgánica','quimica organica','química inorgánica','quimica inorganica','estequiometría','estequiometria','electromagnetismo','cinemática','cinematica','mecánica clásica','mecanica clasica','mecánica de fluidos','mecanica de fluidos','acústica','acustica','óptica','optica','termodinámica','termodinamica','electricidad','electricidad y magnetismo','electrostática','electrostatica','estática','estatica','estática de fluidos','estatica de fluidos','eventos ondulatorios','movimiento ondulatorio','componente celular']
            when 'inglés' then array['inglés','ingles','english language']
            else array[lower(btrim(p_subject))]
          end
        )
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
  lexical_scored as (
    select
      c.id as chunk_id,
      (
        coalesce(pg_catalog.ts_rank_cd(c.search_vector, q.spanish_query), 0)
        + coalesce(pg_catalog.ts_rank_cd(
            pg_catalog.to_tsvector('simple'::pg_catalog.regconfig, coalesce(c.content, '')),
            q.literal_query
          ), 0)
        + case when c.content ilike '%' || left(coalesce(p_query, ''), 80) || '%' then 4.0 else 0 end
        + case when e.title ilike '%' || left(coalesce(p_query, ''), 80) || '%' then 0.15 else 0 end
      )::real as lexical_score,
      c.page_number
    from public.orby_knowledge_chunks c
    join eligible e on e.id = c.document_id
    cross join query_value q
    where (
      (pg_catalog.numnode(q.spanish_query) > 0 and c.search_vector @@ q.spanish_query)
      or (
        pg_catalog.numnode(q.literal_query) > 0
        and pg_catalog.to_tsvector(
          'simple'::pg_catalog.regconfig,
          coalesce(c.content, '') || ' ' || coalesce(e.title, '') || ' ' || coalesce(e.search_text, '')
        ) @@ q.literal_query
      )
    )
  ),
  lexical as (
    select chunk_id,
      row_number() over (order by lexical_score desc, page_number asc) as lexical_position
    from lexical_scored
    order by lexical_score desc, page_number asc
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
$function$;

create or replace function public.orby_search_knowledge_hybrid_multi_v3(
 p_query text,p_embeddings jsonb default '[]'::jsonb,p_subject text default null,p_limit integer default 8,p_visibility text default 'published'
) returns table(document_id uuid,title text,subject text,topic text,page_number integer,content text,rank real,profile_summary text,profile_concepts jsonb,profile_competencies jsonb,profile_topics jsonb)
language sql stable set search_path=''
as $function$
with q as (
 select
  pg_catalog.websearch_to_tsquery('spanish'::pg_catalog.regconfig,left(coalesce(p_query,''),1200)) spanish_query,
  pg_catalog.websearch_to_tsquery('simple'::pg_catalog.regconfig,regexp_replace(left(coalesce(p_query,''),1200),'[[:space:]]+',' OR ','g')) literal_query,
  regexp_split_to_array(lower(trim(coalesce(p_query,''))),'[[:space:][:punct:]]+') query_terms
), eligible as (
 select d.id,d.title,d.subject,d.topic,p.summary,p.concepts,p.competencies,p.topics,p.search_text
 from public.orby_knowledge_documents d left join public.orby_knowledge_profiles p on p.document_id=d.id
 where ((p_visibility='admin' and d.status in ('draft','published')) or (p_visibility='published' and d.status='published'))
 and (p_subject is null or d.subject=p_subject or exists(select 1 from jsonb_array_elements_text(coalesce(p.areas,'[]'::jsonb)) a where lower(btrim(a))=lower(btrim(p_subject))))
), emb as (
 select x.value->>'model' model,((x.value->'values')::text)::extensions.vector(768) vector
 from jsonb_array_elements(case when jsonb_typeof(p_embeddings)='array' then p_embeddings else '[]'::jsonb end) x(value)
 where length(coalesce(x.value->>'model','')) between 1 and 100 and jsonb_typeof(x.value->'values')='array' and jsonb_array_length(x.value->'values')=768
), lex as (
 select c.id cid,c.page_number,
  (coalesce(ts_rank_cd(c.search_vector,q.spanish_query),0)
  +coalesce(ts_rank_cd(to_tsvector('simple'::regconfig,coalesce(c.content,'')),q.literal_query),0)
  +case when c.content ilike '%'||left(coalesce(p_query,''),80)||'%' then 4 else 0 end
  +case when e.title ilike '%'||left(coalesce(p_query,''),80)||'%' then .15 else 0 end)::real score
 from public.orby_knowledge_chunks c join eligible e on e.id=c.document_id cross join q
 where (numnode(q.spanish_query)>0 and c.search_vector@@q.spanish_query)
    or (numnode(q.literal_query)>0 and to_tsvector('simple'::regconfig,coalesce(c.content,'')||' '||coalesce(e.title,'')||' '||coalesce(e.search_text,''))@@q.literal_query)
), lexical as (
 select cid,row_number() over(order by score desc,page_number) pos from lex order by score desc,page_number limit greatest(16,least(coalesce(p_limit,8),16)*8)
), semrank as (
 select c.id cid,x.model,row_number() over(partition by x.model order by c.embedding OPERATOR(extensions.<=>) x.vector) pos
 from public.orby_knowledge_chunks c join eligible e on e.id=c.document_id join emb x on x.model=c.embedding_model where c.embedding is not null
), semantic as (
 select cid,min(pos)::int pos from semrank where pos<=greatest(16,least(coalesce(p_limit,8),16)*8) group by cid
), candidates as (
 select cid,pos lexpos,null::int sempos from lexical union all select cid,null::int,pos from semantic
), fused as (
 select cid,min(lexpos) lexpos,min(sempos) sempos,
 (coalesce(1.0/(60+min(lexpos)),0)+coalesce(1.25/(60+min(sempos)),0))::real score from candidates group by cid
)
select e.id,e.title,e.subject,e.topic,c.page_number,c.content,f.score,coalesce(e.summary,''),coalesce(e.concepts,'[]'::jsonb),coalesce(e.competencies,'[]'::jsonb),coalesce(e.topics,'[]'::jsonb)
from fused f join public.orby_knowledge_chunks c on c.id=f.cid join eligible e on e.id=c.document_id
order by f.score desc,c.page_number limit greatest(1,least(coalesce(p_limit,8),16));
$function$;

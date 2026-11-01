-- Orby knowledge pipeline v4: multimodal page coverage, pedagogical memory and paced review.

alter table public.orby_knowledge_profiles
  add column if not exists pedagogical_knowledge jsonb not null default '{}'::jsonb;

alter table public.orby_knowledge_documents
  add column if not exists source_sha256 text,
  add column if not exists ingestion_status text not null default 'queued',
  add column if not exists coverage_percent numeric(5,2) not null default 0,
  add column if not exists visual_pages_total integer not null default 0,
  add column if not exists visual_pages_reviewed integer not null default 0,
  add column if not exists auto_review_date date,
  add column if not exists auto_review_count smallint not null default 0,
  add column if not exists next_review_at timestamptz;

alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_ingestion_status_check;
alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_ingestion_status_check
  check (ingestion_status in ('queued','processing','completed','attention_required','failed'));

alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_coverage_percent_check;
alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_coverage_percent_check
  check (coverage_percent >= 0 and coverage_percent <= 100);

alter table public.orby_knowledge_documents
  drop constraint if exists orby_knowledge_documents_auto_review_count_check;
alter table public.orby_knowledge_documents
  add constraint orby_knowledge_documents_auto_review_count_check
  check (auto_review_count between 0 and 10);

create table if not exists public.orby_knowledge_document_pages (
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  text_char_count integer not null default 0 check (text_char_count >= 0),
  has_selectable_text boolean not null default false,
  visual_status text not null default 'pending'
    check (visual_status in ('pending','reviewed','needs_review','failed')),
  coverage_score numeric(4,3) not null default 0
    check (coverage_score >= 0 and coverage_score <= 1),
  concept_count integer not null default 0 check (concept_count >= 0),
  question_pattern_count integer not null default 0 check (question_pattern_count >= 0),
  visual_summary text not null default '',
  unresolved_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(unresolved_items) = 'array'),
  ocr_text text not null default '',
  review_attempts smallint not null default 0 check (review_attempts between 0 and 100),
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (document_id, page_number)
);

create index if not exists orby_knowledge_pages_review_idx
  on public.orby_knowledge_document_pages (document_id, visual_status, page_number);

alter table public.orby_knowledge_document_pages enable row level security;
revoke all on public.orby_knowledge_document_pages from public, anon, authenticated;
grant select, insert, update, delete on public.orby_knowledge_document_pages to service_role;

-- Backfill a page manifest for documents already in the Lab. Existing vectors
-- are retained; v4 will only enrich their teaching and visual understanding.
insert into public.orby_knowledge_document_pages (
  document_id, page_number, text_char_count, has_selectable_text, visual_status
)
select
  d.id,
  page_no,
  coalesce(sum(length(c.content)), 0)::integer,
  coalesce(bool_or(c.chunk_index is not null), false),
  'pending'
from public.orby_knowledge_documents d
cross join lateral generate_series(1, greatest(d.page_count, 0)) as page_no
left join public.orby_knowledge_chunks c
  on c.document_id = d.id and c.page_number = page_no
group by d.id, page_no
on conflict (document_id, page_number) do nothing;

update public.orby_knowledge_documents d
set visual_pages_total = d.page_count,
    visual_pages_reviewed = coalesce((
      select count(*) from public.orby_knowledge_document_pages p
      where p.document_id = d.id and p.visual_status = 'reviewed'
    ), 0),
    ingestion_status = case
      when exists (select 1 from public.orby_knowledge_jobs j where j.document_id = d.id and j.status in ('queued','running','retrying'))
        then 'processing'
      when d.knowledge_profile_status = 'ready' and d.knowledge_pipeline_version >= 3
        then 'completed'
      else 'queued'
    end,
    coverage_percent = case when d.page_count > 0
      then round(100.0 * coalesce((
        select count(*) from public.orby_knowledge_document_pages p
        where p.document_id = d.id and p.visual_status = 'reviewed'
      ), 0) / d.page_count, 2)
      else 0 end;

-- V4 analyses pages, not arbitrary text chunk pairs. All previous vector
-- embeddings remain untouched. Old resumable jobs restart at the visual/profile
-- stage because v4 adds evidence-backed teaching, question-pattern and page review.
delete from public.orby_knowledge_job_batches b
using public.orby_knowledge_jobs j
where b.job_id = j.id
  and j.pipeline_version < 4
  and j.status in ('queued','running','retrying');

update public.orby_knowledge_jobs j
set pipeline_version = 4,
    stage = 'profile',
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
  and j.pipeline_version < 4
  and j.status in ('queued','running','retrying');

update public.orby_knowledge_documents d
set ingestion_status = 'processing',
    visual_pages_total = d.page_count,
    next_review_at = null
where exists (
  select 1 from public.orby_knowledge_jobs j
  where j.document_id = d.id and j.pipeline_version = 4
    and j.status in ('queued','running','retrying')
);

create or replace function public.orby_reserve_knowledge_ai_cycle(
  p_document_id uuid,
  p_daily_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer;
  v_next timestamptz;
begin
  update public.orby_knowledge_documents
  set auto_review_count = case
        when auto_review_date = current_date then auto_review_count + 1
        else 1
      end,
      auto_review_date = current_date,
      next_review_at = now() + interval '5 minutes',
      ingestion_status = case
        when ingestion_status in ('queued','attention_required') then 'processing'
        else ingestion_status
      end,
      updated_at = now()
  where id = p_document_id
    and (
      auto_review_date is distinct from current_date
      or auto_review_count < greatest(1, least(10, coalesce(p_daily_limit, 10)))
    )
  returning auto_review_count, next_review_at into v_count, v_next;

  if not found then
    select auto_review_count, next_review_at into v_count, v_next
    from public.orby_knowledge_documents
    where id = p_document_id;
    return jsonb_build_object(
      'allowed', false,
      'cycles_used', coalesce(v_count, 0),
      'next_available_at', date_trunc('day', now()) + interval '1 day'
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'cycles_used', v_count,
    'next_available_at', v_next
  );
end;
$function$;

revoke all on function public.orby_reserve_knowledge_ai_cycle(uuid, integer) from public, anon, authenticated;
grant execute on function public.orby_reserve_knowledge_ai_cycle(uuid, integer) to service_role;

create or replace function public.orby_claim_knowledge_job(
  p_worker_id uuid,
  p_lease_seconds integer default 240
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
begin
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

  with candidate as (
    select j.id
    from public.orby_knowledge_jobs j
    join public.orby_knowledge_documents d on d.id = j.document_id
    where j.attempt_count < j.max_attempts
      and j.available_at <= now()
      and (d.auto_review_date is distinct from current_date or d.auto_review_count < 10)
      and (
        j.status in ('queued','retrying')
        or (j.status = 'running' and j.lease_expires_at < now())
      )
    order by j.available_at asc, j.created_at asc
    for update of j skip locked
    limit 1
  )
  update public.orby_knowledge_jobs j
  set status = 'running',
      locked_by = p_worker_id,
      locked_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(60, least(600, coalesce(p_lease_seconds, 240)))),
      updated_at = now()
  from candidate
  where j.id = candidate.id
  returning j.* into v_job;

  if not found then return null; end if;
  return to_jsonb(v_job);
end;
$function$;

create or replace function public.orby_release_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_stage text,
  p_next_batch_index integer,
  p_embedded_chunk_count integer,
  p_total_batches integer
)
returns boolean
language plpgsql
set search_path = ''
as $function$
begin
  if p_stage not in ('embeddings','profile','finalize') then
    raise exception 'invalid_job_stage';
  end if;

  update public.orby_knowledge_jobs
  set stage = p_stage,
      status = 'queued',
      next_batch_index = greatest(0, coalesce(p_next_batch_index, 0)),
      embedded_chunk_count = greatest(0, coalesce(p_embedded_chunk_count, 0)),
      total_batches = greatest(0, coalesce(p_total_batches, 0)),
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      available_at = now() + interval '5 minutes',
      last_error = null,
      updated_at = now()
  where id = p_job_id and locked_by = p_worker_id and status = 'running';

  if not found then return false; end if;

  update public.orby_knowledge_documents
  set next_review_at = now() + interval '5 minutes',
      updated_at = now()
  where id = (select document_id from public.orby_knowledge_jobs where id = p_job_id);

  return true;
end;
$function$;

update cron.job
set schedule = '*/5 * * * *'
where jobname = 'orby-knowledge-worker';

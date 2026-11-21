-- Reserve a manually requested queue item for the manual lane until that
-- single batch is completed. Then return it to the shared queue so Autopilot
-- can continue automatically. Automatic-review handoffs remain auto-only.

alter table public.orby_knowledge_jobs
  add column if not exists manual_priority boolean not null default false;

create or replace function public.orby_claim_knowledge_job(
  p_worker_id uuid,
  p_lease_seconds integer,
  p_count_toward_auto_budget boolean
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_lease_expires_at timestamptz;
  v_cycles smallint;
  v_window_started_at timestamptz;
  v_start_new_window boolean := false;
begin
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

  v_lease_expires_at := v_now + make_interval(secs => greatest(60, least(600, coalesce(p_lease_seconds, 240))));

  if p_count_toward_auto_budget then
    select ai_cycles_used, ai_cycle_window_started_at
    into v_cycles, v_window_started_at
    from public.orby_knowledge_automation_settings
    where id = 1
    for update;
    if not found then raise exception 'knowledge_automation_settings_missing'; end if;

    v_start_new_window := v_window_started_at is null
      or v_window_started_at <= v_now - interval '7 hours';
    if v_start_new_window then v_cycles := 0; end if;
    if coalesce(v_cycles, 0) >= 100 then return null; end if;
  end if;

  select j.*
  into v_job
  from public.orby_knowledge_jobs j
  join public.orby_knowledge_documents d on d.id = j.document_id
  where j.attempt_count < j.max_attempts
    and j.available_at <= v_now
    and (
      j.status in ('queued','retrying')
      or (j.status = 'running' and j.lease_expires_at < v_now)
    )
    and (d.worker_lock_owner is null or d.worker_lock_expires_at is null or d.worker_lock_expires_at < v_now)
    and (
      (p_count_toward_auto_budget and j.manual_priority = false)
      or (not p_count_toward_auto_budget and j.manual_priority = true and j.automatic_review_pending = false)
    )
  order by
    case when p_count_toward_auto_budget and j.automatic_review_pending then 0 else 1 end,
    j.available_at asc,
    j.created_at asc
  for update of j, d skip locked
  limit 1;

  if not found then return null; end if;

  update public.orby_knowledge_documents
  set worker_lock_owner = p_worker_id,
      worker_lock_expires_at = v_lease_expires_at,
      auto_review_count = case
        when p_count_toward_auto_budget and auto_review_date is distinct from v_today then 1
        when p_count_toward_auto_budget then least(10, auto_review_count + 1)
        else auto_review_count
      end,
      auto_review_date = case when p_count_toward_auto_budget then v_today else auto_review_date end,
      next_review_at = case when p_count_toward_auto_budget then v_now + interval '3 minutes' else next_review_at end,
      ingestion_status = case
        when ingestion_status in ('queued','attention_required') then 'processing'
        else ingestion_status
      end,
      updated_at = v_now
  where id = v_job.document_id
    and (worker_lock_owner is null or worker_lock_expires_at is null or worker_lock_expires_at < v_now);

  if not found then return null; end if;

  update public.orby_knowledge_jobs
  set status = 'running',
      locked_by = p_worker_id,
      locked_at = v_now,
      lease_expires_at = v_lease_expires_at,
      updated_at = v_now
  where id = v_job.id
    and (
      status in ('queued','retrying')
      or (status = 'running' and lease_expires_at < v_now)
    )
  returning * into v_job;

  if not found then
    update public.orby_knowledge_documents
    set worker_lock_owner = null, worker_lock_expires_at = null, updated_at = now()
    where id = v_job.document_id and worker_lock_owner = p_worker_id;
    return null;
  end if;

  if p_count_toward_auto_budget then
    update public.orby_knowledge_automation_settings
    set ai_cycles_used = case when v_start_new_window then 1 else ai_cycles_used + 1 end,
        ai_cycle_window_started_at = case when v_start_new_window then v_now else ai_cycle_window_started_at end,
        ai_cycle_date = v_today,
        updated_at = v_now
    where id = 1;
  end if;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_claim_knowledge_job(uuid, integer, boolean) from public, anon, authenticated;
grant execute on function public.orby_claim_knowledge_job(uuid, integer, boolean) to service_role;

create or replace function public.orby_promote_next_manual_knowledge_job()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_job_id uuid;
begin
  select j.id
  into v_job_id
  from public.orby_knowledge_jobs j
  join public.orby_knowledge_documents d on d.id = j.document_id
  where j.status in ('queued', 'retrying')
    and j.attempt_count < j.max_attempts
    and coalesce(j.automatic_review_pending, false) = false
    and (d.worker_lock_owner is null or d.worker_lock_expires_at is null or d.worker_lock_expires_at < now())
  order by j.created_at asc, j.id asc
  for update of j, d skip locked
  limit 1;

  if not found then return null; end if;

  update public.orby_knowledge_jobs
  set available_at = now(),
      manual_priority = true,
      updated_at = now()
  where id = v_job_id
    and status in ('queued', 'retrying')
    and attempt_count < max_attempts
    and coalesce(automatic_review_pending, false) = false;

  if not found then return null; end if;
  return v_job_id;
end;
$function$;

revoke all on function public.orby_promote_next_manual_knowledge_job() from public, anon, authenticated;
grant execute on function public.orby_promote_next_manual_knowledge_job() to service_role;

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
declare
  v_document_id uuid;
begin
  if p_stage not in ('embeddings','profile','finalize') then raise exception 'invalid_job_stage'; end if;

  update public.orby_knowledge_jobs
  set stage = p_stage,
      status = 'queued',
      next_batch_index = greatest(0, coalesce(p_next_batch_index, 0)),
      embedded_chunk_count = greatest(0, coalesce(p_embedded_chunk_count, 0)),
      total_batches = greatest(0, coalesce(p_total_batches, 0)),
      manual_priority = false,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      available_at = now(),
      last_error = null,
      updated_at = now()
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  returning document_id into v_document_id;

  if not found then return false; end if;

  update public.orby_knowledge_documents
  set worker_lock_owner = null,
      worker_lock_expires_at = null,
      next_review_at = now() + interval '3 minutes',
      updated_at = now()
  where id = v_document_id and worker_lock_owner = p_worker_id;

  return true;
end;
$function$;

revoke all on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) to service_role;

create or replace function public.orby_fail_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_error text
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
  v_attempt integer;
  v_status text;
  v_delay_seconds integer;
begin
  select * into v_job
  from public.orby_knowledge_jobs
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  for update;

  if not found then return null; end if;

  v_attempt := v_job.attempt_count + 1;
  v_status := case when v_attempt >= v_job.max_attempts then 'failed' else 'retrying' end;
  v_delay_seconds := least(3600, (30 * power(2, greatest(0, v_attempt - 1)))::integer);

  update public.orby_knowledge_jobs
  set status = v_status,
      attempt_count = v_attempt,
      available_at = now() + make_interval(secs => v_delay_seconds),
      manual_priority = false,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'unknown_error'), 1000),
      updated_at = now()
  where id = p_job_id
  returning * into v_job;

  update public.orby_knowledge_documents
  set worker_lock_owner = null,
      worker_lock_expires_at = null,
      updated_at = now()
  where id = v_job.document_id and worker_lock_owner = p_worker_id;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_fail_knowledge_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.orby_fail_knowledge_job(uuid, uuid, text) to service_role;

-- A manual completion that needs the automatic final-review lane relinquishes
-- manual priority and releases its document lease for the automatic worker.
create or replace function public.orby_complete_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_publish_if_ready boolean,
  p_require_automatic_review boolean
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
  v_published boolean := false;
begin
  if p_job_id is null or p_worker_id is null then raise exception 'job_and_worker_required'; end if;

  select *
  into v_job
  from public.orby_knowledge_jobs
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  for update;

  if not found then
    return jsonb_build_object('completed', false, 'published', false, 'awaiting_automatic_review', false);
  end if;

  if coalesce(p_require_automatic_review, false) then
    update public.orby_knowledge_jobs
    set status = 'queued',
        stage = 'finalize',
        automatic_review_pending = true,
        manual_priority = false,
        locked_by = null,
        locked_at = null,
        lease_expires_at = null,
        available_at = now(),
        last_error = null,
        completed_at = null,
        updated_at = now()
    where id = p_job_id and locked_by = p_worker_id and status = 'running';

    if not found then raise exception 'knowledge_job_handoff_race'; end if;

    update public.orby_knowledge_documents
    set worker_lock_owner = null,
        worker_lock_expires_at = null,
        updated_at = now()
    where id = v_job.document_id and worker_lock_owner = p_worker_id;

    return jsonb_build_object('completed', true, 'published', false, 'awaiting_automatic_review', true);
  end if;

  if coalesce(p_publish_if_ready, false) then
    update public.orby_knowledge_documents
    set status = 'published', updated_at = now()
    where id = v_job.document_id
      and status = 'draft'
      and chunk_count > 0
      and embedded_chunk_count >= chunk_count
      and knowledge_profile_status = 'ready'
      and knowledge_profile_version >= 2
      and knowledge_pipeline_version >= 7
      and concept_count > 0
      and ingestion_status = 'completed'
      and coverage_percent >= 95
      and visual_pages_total > 0
      and visual_pages_reviewed >= ceil(visual_pages_total * 0.95);
    v_published := found;
  end if;

  update public.orby_knowledge_jobs
  set status = 'completed',
      stage = 'finalize',
      automatic_review_pending = false,
      manual_priority = false,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id and locked_by = p_worker_id and status = 'running';

  if not found then raise exception 'knowledge_job_completion_race'; end if;

  update public.orby_knowledge_documents
  set worker_lock_owner = null,
      worker_lock_expires_at = null,
      updated_at = now()
  where id = v_job.document_id and worker_lock_owner = p_worker_id;

  return jsonb_build_object('completed', true, 'published', v_published, 'awaiting_automatic_review', false);
end;
$function$;

revoke all on function public.orby_complete_knowledge_job(uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.orby_complete_knowledge_job(uuid, uuid, boolean, boolean) to service_role;

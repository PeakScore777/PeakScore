-- Orby Autopilot: 100 automatic cycles per rolling seven-hour window.
-- One worker cycle is scheduled every three minutes. Manual runs remain unlimited.
-- Preserve the existing cycle counter, window start, and enabled/paused state.

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
  v_cycles smallint;
  v_window_started_at timestamptz;
  v_start_new_window boolean := false;
begin
  if p_worker_id is null then
    raise exception 'worker_id_required';
  end if;

  if p_count_toward_auto_budget then
    -- Serialize automatic claims and start a fresh window only after seven hours.
    select ai_cycles_used, ai_cycle_window_started_at
    into v_cycles, v_window_started_at
    from public.orby_knowledge_automation_settings
    where id = 1
    for update;

    if not found then
      raise exception 'knowledge_automation_settings_missing';
    end if;

    v_start_new_window := v_window_started_at is null
      or v_window_started_at <= v_now - interval '7 hours';

    if v_start_new_window then
      v_cycles := 0;
    end if;

    if coalesce(v_cycles, 0) >= 100 then
      return null;
    end if;
  end if;

  with candidate as (
    select j.id
    from public.orby_knowledge_jobs j
    where j.attempt_count < j.max_attempts
      and j.available_at <= v_now
      and (
        j.status in ('queued','retrying')
        or (j.status = 'running' and j.lease_expires_at < v_now)
      )
    order by j.available_at asc, j.created_at asc
    for update skip locked
    limit 1
  )
  update public.orby_knowledge_jobs j
  set status = 'running',
      locked_by = p_worker_id,
      locked_at = v_now,
      lease_expires_at = v_now + make_interval(secs => greatest(60, least(600, coalesce(p_lease_seconds, 240)))),
      updated_at = v_now
  from candidate
  where j.id = candidate.id
  returning j.* into v_job;

  if not found then
    return null;
  end if;

  if p_count_toward_auto_budget then
    update public.orby_knowledge_automation_settings
    set ai_cycles_used = case
          when v_start_new_window then 1
          else ai_cycles_used + 1
        end,
        ai_cycle_window_started_at = case
          when v_start_new_window then v_now
          else ai_cycle_window_started_at
        end,
        ai_cycle_date = v_today,
        updated_at = v_now
    where id = 1;

    update public.orby_knowledge_documents
    set auto_review_count = case
          when auto_review_date is distinct from v_today then 1
          else least(10, auto_review_count + 1)
        end,
        auto_review_date = v_today,
        next_review_at = v_now + interval '3 minutes',
        ingestion_status = case
          when ingestion_status in ('queued','attention_required') then 'processing'
          else ingestion_status
        end,
        updated_at = v_now
    where id = v_job.document_id;
  else
    -- Manual runs remain unlimited and do not consume automatic review counts.
    update public.orby_knowledge_documents
    set ingestion_status = case
          when ingestion_status in ('queued','attention_required') then 'processing'
          else ingestion_status
        end,
        updated_at = v_now
    where id = v_job.document_id;
  end if;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_claim_knowledge_job(uuid, integer, boolean) from public, anon, authenticated;
grant execute on function public.orby_claim_knowledge_job(uuid, integer, boolean) to service_role;

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
      available_at = now() + interval '3 minutes',
      last_error = null,
      updated_at = now()
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  returning document_id into v_document_id;

  if not found then
    return false;
  end if;

  update public.orby_knowledge_documents
  set next_review_at = now() + interval '3 minutes',
      updated_at = now()
  where id = v_document_id;

  return true;
end;
$function$;

revoke all on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) to service_role;

-- Use the supported pg_cron function; do not write directly to cron.job.
do $$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'orby-knowledge-worker';

  if v_job_id is null then
    raise exception 'orby-knowledge-worker cron job is missing';
  end if;

  perform cron.alter_job(
    job_id := v_job_id,
    schedule := '*/3 * * * *'
  );
end
$$;

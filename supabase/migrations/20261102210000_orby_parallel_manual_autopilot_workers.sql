-- Run the administrator's manual worker and the automatic Autopilot in
-- independent lanes while sharing one document queue and one knowledge index.
-- A document may only have one live worker at a time.
-- Quality-ready manual completions are handed to the automatic lane for a final
-- publication gate. Preserve the current automatic budget and enabled state.

alter table public.orby_knowledge_automation_settings
  add column if not exists automatic_worker_lock_owner uuid,
  add column if not exists automatic_worker_lock_expires_at timestamptz,
  add column if not exists manual_worker_lock_owner uuid,
  add column if not exists manual_worker_lock_expires_at timestamptz;

alter table public.orby_knowledge_jobs
  add column if not exists automatic_review_pending boolean not null default false;

create or replace function public.orby_acquire_knowledge_worker_lane(
  p_worker_id uuid,
  p_lease_seconds integer,
  p_worker_lane text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

  if p_worker_lane = 'automatic' then
    update public.orby_knowledge_automation_settings
    set automatic_worker_lock_owner = p_worker_id,
        automatic_worker_lock_expires_at = now() + make_interval(secs => greatest(60, least(900, coalesce(p_lease_seconds, 600)))),
        updated_at = now()
    where id = 1 and (
      automatic_worker_lock_owner is null
      or automatic_worker_lock_expires_at is null
      or automatic_worker_lock_expires_at < now()
      or automatic_worker_lock_owner = p_worker_id
    );
  elsif p_worker_lane = 'manual' then
    update public.orby_knowledge_automation_settings
    set manual_worker_lock_owner = p_worker_id,
        manual_worker_lock_expires_at = now() + make_interval(secs => greatest(60, least(900, coalesce(p_lease_seconds, 600)))),
        updated_at = now()
    where id = 1 and (
      manual_worker_lock_owner is null
      or manual_worker_lock_expires_at is null
      or manual_worker_lock_expires_at < now()
      or manual_worker_lock_owner = p_worker_id
    );
  else
    raise exception 'invalid_worker_lane';
  end if;

  return found;
end;
$function$;

revoke all on function public.orby_acquire_knowledge_worker_lane(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.orby_acquire_knowledge_worker_lane(uuid, integer, text) to service_role;

create or replace function public.orby_release_knowledge_worker_lane(
  p_worker_id uuid,
  p_worker_lane text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

  if p_worker_lane = 'automatic' then
    update public.orby_knowledge_automation_settings
    set automatic_worker_lock_owner = null,
        automatic_worker_lock_expires_at = null,
        updated_at = now()
    where id = 1 and automatic_worker_lock_owner = p_worker_id;
  elsif p_worker_lane = 'manual' then
    update public.orby_knowledge_automation_settings
    set manual_worker_lock_owner = null,
        manual_worker_lock_expires_at = null,
        updated_at = now()
    where id = 1 and manual_worker_lock_owner = p_worker_id;
  else
    raise exception 'invalid_worker_lane';
  end if;

  return found;
end;
$function$;

revoke all on function public.orby_release_knowledge_worker_lane(uuid, text) from public, anon, authenticated;
grant execute on function public.orby_release_knowledge_worker_lane(uuid, text) to service_role;

-- Keep the rolling 100-cycle / seven-hour automatic budget. Manual claims bypass
-- that budget and cannot steal a final-review handoff reserved for Autopilot.
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
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

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

  with candidate as (
    select j.id
    from public.orby_knowledge_jobs j
    join public.orby_knowledge_documents d on d.id = j.document_id
    where j.attempt_count < j.max_attempts
      and j.available_at <= v_now
      and (
        j.status in ('queued','retrying')
        or (j.status = 'running' and j.lease_expires_at < v_now)
      )
      and (
        p_count_toward_auto_budget
        or coalesce(j.automatic_review_pending, false) = false
      )
      and not exists (
        select 1
        from public.orby_knowledge_jobs active
        where active.document_id = j.document_id
          and active.id <> j.id
          and active.status = 'running'
          and (active.lease_expires_at is null or active.lease_expires_at >= v_now)
      )
    order by j.available_at asc, j.created_at asc
    for update of j, d skip locked
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

  if not found then return null; end if;

  if p_count_toward_auto_budget then
    update public.orby_knowledge_automation_settings
    set ai_cycles_used = case when v_start_new_window then 1 else ai_cycles_used + 1 end,
        ai_cycle_window_started_at = case when v_start_new_window then v_now else ai_cycle_window_started_at end,
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
        locked_by = null,
        locked_at = null,
        lease_expires_at = null,
        available_at = now(),
        last_error = null,
        completed_at = null,
        updated_at = now()
    where id = p_job_id and locked_by = p_worker_id and status = 'running';

    if not found then raise exception 'knowledge_job_handoff_race'; end if;

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
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id and locked_by = p_worker_id and status = 'running';

  if not found then raise exception 'knowledge_job_completion_race'; end if;

  return jsonb_build_object('completed', true, 'published', v_published, 'awaiting_automatic_review', false);
end;
$function$;

revoke all on function public.orby_complete_knowledge_job(uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.orby_complete_knowledge_job(uuid, uuid, boolean, boolean) to service_role;

create or replace function public.orby_complete_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_publish_if_ready boolean
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select public.orby_complete_knowledge_job(p_job_id, p_worker_id, p_publish_if_ready, false);
$function$;

revoke all on function public.orby_complete_knowledge_job(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.orby_complete_knowledge_job(uuid, uuid, boolean) to service_role;

create or replace function public.orby_promote_next_manual_knowledge_job()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_job_id uuid;
begin
  select id
  into v_job_id
  from public.orby_knowledge_jobs
  where status in ('queued', 'retrying')
    and attempt_count < max_attempts
    and coalesce(automatic_review_pending, false) = false
  order by created_at asc, id asc
  for update skip locked
  limit 1;

  if not found then return null; end if;

  update public.orby_knowledge_jobs
  set available_at = now(), updated_at = now()
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

-- Orby Autopilot: automatic startup and a separate 10-cycle / 7-hour budget.
-- Manual administrator runs keep bypassing this budget.

alter table public.orby_knowledge_automation_settings
  add column if not exists ai_cycle_window_started_at timestamptz;

-- New settings rows should start enabled. Existing administrators can still pause
-- the worker through the Orby Lab control; this migration enables it once.
alter table public.orby_knowledge_automation_settings
  alter column enabled set default true;

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
    -- Serialize automatic claims. A new 7-hour window begins on the first
    -- successful automatic claim after the previous window expires.
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

    if coalesce(v_cycles, 0) >= 10 then
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
        next_review_at = v_now + interval '5 minutes',
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

-- Start Autopilot automatically when this migration is applied. The seven-hour
-- window is initialized by the first successful automatic cycle, not by deploy.
update public.orby_knowledge_automation_settings
set enabled = true,
    ai_cycles_used = 0,
    ai_cycle_window_started_at = null,
    ai_cycle_date = (now() at time zone 'America/Bogota')::date,
    updated_at = now()
where id = 1;

-- Separate the five-minute automatic AI budget from unlimited administrator runs.
-- Keep the legacy two-argument function intact for older deployments on main.
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
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_cycles smallint;
begin
  if p_worker_id is null then
    raise exception 'worker_id_required';
  end if;

  if p_count_toward_auto_budget then
    -- Serialize only automatic claims against the ten-cycle daily ceiling.
    select ai_cycles_used into v_cycles
    from public.orby_knowledge_automation_settings
    where id = 1
    for update;

    if not found then
      raise exception 'knowledge_automation_settings_missing';
    end if;

    update public.orby_knowledge_automation_settings
    set ai_cycles_used = case when ai_cycle_date is distinct from v_today then 0 else ai_cycles_used end,
        ai_cycle_date = v_today,
        updated_at = now()
    where id = 1
    returning ai_cycles_used into v_cycles;

    if coalesce(v_cycles, 0) >= 10 then
      return null;
    end if;
  end if;

  with candidate as (
    select j.id
    from public.orby_knowledge_jobs j
    where j.attempt_count < j.max_attempts
      and j.available_at <= now()
      and (
        j.status in ('queued','retrying')
        or (j.status = 'running' and j.lease_expires_at < now())
      )
    order by j.available_at asc, j.created_at asc
    for update skip locked
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

  if not found then
    return null;
  end if;

  if p_count_toward_auto_budget then
    update public.orby_knowledge_automation_settings
    set ai_cycles_used = ai_cycles_used + 1,
        ai_cycle_date = v_today,
        updated_at = now()
    where id = 1;

    update public.orby_knowledge_documents
    set auto_review_count = case
          when auto_review_date is distinct from v_today then 1
          else least(10, auto_review_count + 1)
        end,
        auto_review_date = v_today,
        next_review_at = now() + interval '5 minutes',
        ingestion_status = case
          when ingestion_status in ('queued','attention_required') then 'processing'
          else ingestion_status
        end,
        updated_at = now()
    where id = v_job.document_id;
  else
    -- Manual runs are unlimited by the automatic budget and are not recorded
    -- as automatic review cycles on the document.
    update public.orby_knowledge_documents
    set ingestion_status = case
          when ingestion_status in ('queued','attention_required') then 'processing'
          else ingestion_status
        end,
        updated_at = now()
    where id = v_job.document_id;
  end if;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_claim_knowledge_job(uuid, integer, boolean) from public, anon, authenticated;
grant execute on function public.orby_claim_knowledge_job(uuid, integer, boolean) to service_role;

-- The currently recorded cycles were administrator-triggered while Autopilot
-- was paused; remove those legacy manual runs from today's automatic-only UI.
update public.orby_knowledge_automation_settings
set ai_cycles_used = 0,
    ai_cycle_date = (now() at time zone 'America/Bogota')::date,
    last_tick_at = null,
    updated_at = now()
where id = 1
  and enabled = false
  and ai_cycle_date = (now() at time zone 'America/Bogota')::date;

update public.orby_knowledge_documents
set auto_review_count = 0,
    auto_review_date = (now() at time zone 'America/Bogota')::date,
    updated_at = now()
where auto_review_date = (now() at time zone 'America/Bogota')::date
  and exists (
    select 1
    from public.orby_knowledge_automation_settings
    where id = 1 and enabled = false
  );

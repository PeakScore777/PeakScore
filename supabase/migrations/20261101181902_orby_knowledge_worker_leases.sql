
-- Queue leases count failures, not successful one-minute processing slices.
create or replace function public.orby_claim_knowledge_job(
  p_worker_id uuid,
  p_lease_seconds integer default 240
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
begin
  if p_worker_id is null then
    raise exception 'worker_id_required';
  end if;

  with candidate as (
    select j.id
    from public.orby_knowledge_jobs as j
    where j.attempt_count < j.max_attempts
      and j.available_at <= now()
      and (
        j.status in ('queued', 'retrying')
        or (j.status = 'running' and j.lease_expires_at < now())
      )
    order by j.available_at asc, j.created_at asc
    for update skip locked
    limit 1
  )
  update public.orby_knowledge_jobs as j
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

revoke all on function public.orby_claim_knowledge_job(uuid, integer) from public, anon, authenticated;
grant execute on function public.orby_claim_knowledge_job(uuid, integer) to service_role;

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
security invoker
set search_path = ''
as $function$
begin
  if p_stage not in ('embeddings', 'profile', 'finalize') then
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
      available_at = now(),
      last_error = null,
      updated_at = now()
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running';

  return found;
end;
$function$;

revoke all on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.orby_release_knowledge_job(uuid, uuid, text, integer, integer, integer) to service_role;

create or replace function public.orby_complete_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.orby_knowledge_jobs
  set status = 'completed',
      stage = 'finalize',
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running';

  return found;
end;
$function$;

revoke all on function public.orby_complete_knowledge_job(uuid, uuid) from public, anon, authenticated;
grant execute on function public.orby_complete_knowledge_job(uuid, uuid) to service_role;

create or replace function public.orby_fail_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_error text
)
returns jsonb
language plpgsql
security invoker
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
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running'
  for update;

  if not found then return null; end if;

  v_attempt := v_job.attempt_count + 1;
  v_status := case when v_attempt >= v_job.max_attempts then 'failed' else 'retrying' end;
  v_delay_seconds := least(3600, (30 * power(2, greatest(0, v_attempt - 1)))::integer);

  update public.orby_knowledge_jobs
  set status = v_status,
      attempt_count = v_attempt,
      available_at = now() + make_interval(secs => v_delay_seconds),
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'unknown_error'), 1000),
      updated_at = now()
  where id = p_job_id
  returning * into v_job;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_fail_knowledge_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.orby_fail_knowledge_job(uuid, uuid, text) to service_role;

create or replace function public.orby_invalidate_knowledge_pipeline_on_chunk_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_document_id uuid;
begin
  v_document_id := case when TG_OP = 'DELETE' then OLD.document_id else NEW.document_id end;
  update public.orby_knowledge_documents
  set knowledge_pipeline_version = 0,
      updated_at = now()
  where id = v_document_id
    and knowledge_pipeline_version > 0;

  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;
$function$;

revoke all on function public.orby_invalidate_knowledge_pipeline_on_chunk_change() from public, anon, authenticated;

drop trigger if exists orby_knowledge_chunks_invalidate_pipeline on public.orby_knowledge_chunks;
create trigger orby_knowledge_chunks_invalidate_pipeline
after insert or update of content, page_number, chunk_index or delete
on public.orby_knowledge_chunks
for each row execute function public.orby_invalidate_knowledge_pipeline_on_chunk_change();

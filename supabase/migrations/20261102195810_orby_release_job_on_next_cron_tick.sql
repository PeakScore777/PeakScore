-- The cron job is the cadence controller (every three minutes).
-- Re-queued work becomes immediately eligible for the next cron tick; an extra
-- three-minute available_at delay here would effectively double the interval.

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
      available_at = now(),
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

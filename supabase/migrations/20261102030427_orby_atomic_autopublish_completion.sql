-- Complete the worker lease and publish an eligible automatic draft atomically.
-- If any quality check fails, the job can still finish but the document stays draft.

drop function if exists public.orby_complete_knowledge_job(uuid, uuid);

create function public.orby_complete_knowledge_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_publish_if_ready boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_job public.orby_knowledge_jobs%rowtype;
  v_published boolean := false;
begin
  if p_job_id is null or p_worker_id is null then
    raise exception 'job_and_worker_required';
  end if;

  select *
  into v_job
  from public.orby_knowledge_jobs
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running'
  for update;

  if not found then
    return jsonb_build_object('completed', false, 'published', false);
  end if;

  if coalesce(p_publish_if_ready, false) then
    update public.orby_knowledge_documents
    set status = 'published',
        updated_at = now()
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
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running';

  if not found then
    raise exception 'knowledge_job_completion_race';
  end if;

  return jsonb_build_object(
    'completed', true,
    'published', v_published
  );
end;
$function$;

revoke all on function public.orby_complete_knowledge_job(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.orby_complete_knowledge_job(uuid, uuid, boolean) to service_role;

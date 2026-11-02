-- If a manual request is interrupted after reserving a queue item, the next
-- manual click must resume that same priority item before reserving another.

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
  order by
    case when coalesce(j.manual_priority, false) then 0 else 1 end,
    j.created_at asc,
    j.id asc
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

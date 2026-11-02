-- Promote the oldest eligible manual queue item using the database clock.
-- This avoids transient claim failures caused by Vercel/Postgres clock skew.

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
  order by created_at asc, id asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.orby_knowledge_jobs
  set available_at = now(),
      updated_at = now()
  where id = v_job_id
    and status in ('queued', 'retrying')
    and attempt_count < max_attempts;

  if not found then
    return null;
  end if;

  return v_job_id;
end;
$function$;

revoke all on function public.orby_promote_next_manual_knowledge_job() from public, anon, authenticated;
grant execute on function public.orby_promote_next_manual_knowledge_job() to service_role;

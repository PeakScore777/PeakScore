
alter table public.orby_knowledge_automation_settings
  add column if not exists worker_lock_owner uuid,
  add column if not exists worker_lock_expires_at timestamptz;

create or replace function public.orby_acquire_knowledge_worker_lock(
  p_worker_id uuid,
  p_lease_seconds integer default 600
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_worker_id is null then raise exception 'worker_id_required'; end if;

  update public.orby_knowledge_automation_settings
  set worker_lock_owner = p_worker_id,
      worker_lock_expires_at = now() + make_interval(secs => greatest(60, least(900, coalesce(p_lease_seconds, 600)))),
      updated_at = now()
  where id = 1
    and (
      worker_lock_owner is null
      or worker_lock_expires_at is null
      or worker_lock_expires_at < now()
      or worker_lock_owner = p_worker_id
    );

  return found;
end;
$function$;

revoke all on function public.orby_acquire_knowledge_worker_lock(uuid, integer) from public, anon, authenticated;
grant execute on function public.orby_acquire_knowledge_worker_lock(uuid, integer) to service_role;

create or replace function public.orby_release_knowledge_worker_lock(p_worker_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.orby_knowledge_automation_settings
  set worker_lock_owner = null,
      worker_lock_expires_at = null,
      updated_at = now()
  where id = 1 and worker_lock_owner = p_worker_id;
  return found;
end;
$function$;

revoke all on function public.orby_release_knowledge_worker_lock(uuid) from public, anon, authenticated;
grant execute on function public.orby_release_knowledge_worker_lock(uuid) to service_role;

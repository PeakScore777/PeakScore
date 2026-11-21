create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

alter table public.orby_knowledge_documents
  add column if not exists knowledge_pipeline_version integer not null default 0;

create table if not exists public.orby_knowledge_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.orby_knowledge_documents(id) on delete cascade,
  pipeline_version integer not null check (pipeline_version >= 1),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  stage text not null default 'embeddings'
    check (stage in ('embeddings', 'profile', 'finalize')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'retrying', 'completed', 'failed')),
  total_batches integer not null default 0 check (total_batches >= 0),
  next_batch_index integer not null default 0 check (next_batch_index >= 0),
  embedded_chunk_count integer not null default 0 check (embedded_chunk_count >= 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 8 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_by uuid,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (document_id, pipeline_version, content_hash)
);

create index if not exists orby_knowledge_jobs_ready_idx
  on public.orby_knowledge_jobs (available_at, created_at)
  where status in ('queued', 'retrying');

create index if not exists orby_knowledge_jobs_lease_idx
  on public.orby_knowledge_jobs (lease_expires_at)
  where status = 'running';

create table if not exists public.orby_knowledge_job_batches (
  job_id uuid not null references public.orby_knowledge_jobs(id) on delete cascade,
  batch_index integer not null check (batch_index >= 0),
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  primary key (job_id, batch_index)
);

create table if not exists public.orby_knowledge_automation_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  last_tick_at timestamptz,
  last_job_started_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.orby_knowledge_automation_settings (id, enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.orby_knowledge_jobs enable row level security;
alter table public.orby_knowledge_job_batches enable row level security;
alter table public.orby_knowledge_automation_settings enable row level security;

revoke all on public.orby_knowledge_jobs from public, anon, authenticated;
revoke all on public.orby_knowledge_job_batches from public, anon, authenticated;
revoke all on public.orby_knowledge_automation_settings from public, anon, authenticated;

grant select, insert, update, delete on public.orby_knowledge_jobs to service_role;
grant select, insert, update, delete on public.orby_knowledge_job_batches to service_role;
grant select, insert, update, delete on public.orby_knowledge_automation_settings to service_role;

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
      attempt_count = j.attempt_count + 1,
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

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_claim_knowledge_job(uuid, integer) from public, anon, authenticated;
grant execute on function public.orby_claim_knowledge_job(uuid, integer) to service_role;

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
  v_status text;
  v_delay_seconds integer;
begin
  select * into v_job
  from public.orby_knowledge_jobs
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running'
  for update;

  if not found then
    return null;
  end if;

  v_status := case when v_job.attempt_count >= v_job.max_attempts then 'failed' else 'retrying' end;
  v_delay_seconds := least(3600, (30 * power(2, greatest(0, v_job.attempt_count - 1)))::integer);

  update public.orby_knowledge_jobs
  set status = v_status,
      available_at = now() + make_interval(secs => v_delay_seconds),
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'unknown_error'), 1000),
      updated_at = now()
  where id = p_job_id
  returning * into v_job;

  if v_job.status = 'failed' then
    update public.orby_knowledge_documents
    set knowledge_profile_status = case
          when knowledge_profile_version >= 2 then knowledge_profile_status
          else 'failed'
        end,
        updated_at = now()
    where id = v_job.document_id;
  end if;

  return to_jsonb(v_job);
end;
$function$;

revoke all on function public.orby_fail_knowledge_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.orby_fail_knowledge_job(uuid, uuid, text) to service_role;

do $schedule$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'orby-knowledge-worker';

  perform cron.schedule(
    'orby-knowledge-worker',
    '* * * * *',
    $command$
      do $tick$
      declare
        v_enabled boolean;
        v_url text;
        v_secret text;
      begin
        select enabled into v_enabled
        from public.orby_knowledge_automation_settings
        where id = 1;

        if not coalesce(v_enabled, false) then
          return;
        end if;

        select decrypted_secret into v_url
        from vault.decrypted_secrets
        where name = 'orby_knowledge_worker_url'
        limit 1;

        select decrypted_secret into v_secret
        from vault.decrypted_secrets
        where name = 'orby_knowledge_cron_secret'
        limit 1;

        if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
          raise warning 'Orby automation is enabled but its Vault URL/secret is not configured.';
          return;
        end if;

        perform net.http_post(
          url := rtrim(v_url, '/') || '/api/cron/orby-knowledge',
          body := jsonb_build_object('source', 'supabase-cron'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_secret
          ),
          timeout_milliseconds := 240000
        );
      end
      $tick$;
    $command$
  );
end;
$schedule$;

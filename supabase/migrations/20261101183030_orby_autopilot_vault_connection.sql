
create or replace function public.orby_knowledge_autopilot_is_configured()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select count(distinct name) = 3
  from vault.decrypted_secrets
  where name in (
    'orby_knowledge_worker_url',
    'orby_knowledge_cron_secret',
    'orby_knowledge_vercel_bypass'
  );
$function$;

revoke all on function public.orby_knowledge_autopilot_is_configured() from public, anon, authenticated;
grant execute on function public.orby_knowledge_autopilot_is_configured() to service_role;

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
        v_bypass text;
      begin
        select enabled into v_enabled
        from public.orby_knowledge_automation_settings
        where id = 1;

        if not coalesce(v_enabled, false) then return; end if;

        select decrypted_secret into v_url
        from vault.decrypted_secrets
        where name = 'orby_knowledge_worker_url' limit 1;

        select decrypted_secret into v_secret
        from vault.decrypted_secrets
        where name = 'orby_knowledge_cron_secret' limit 1;

        select decrypted_secret into v_bypass
        from vault.decrypted_secrets
        where name = 'orby_knowledge_vercel_bypass' limit 1;

        if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' or coalesce(v_bypass, '') = '' then
          raise warning 'Orby automation is enabled but its Vault connection is incomplete.';
          return;
        end if;

        perform net.http_post(
          url := rtrim(v_url, '/') || '/api/cron/orby-knowledge',
          body := jsonb_build_object('source', 'supabase-cron'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_secret,
            'x-vercel-protection-bypass', v_bypass
          ),
          timeout_milliseconds := 240000
        );
      end
      $tick$;
    $command$
  );
end;
$schedule$;

do $$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'orby-knowledge-worker';

  if v_job_id is null then
    raise exception 'orby-knowledge-worker cron job is missing';
  end if;

  perform cron.alter_job(
    job_id := v_job_id,
    schedule := '*/5 * * * *',
    active := true
  );
end
$$;

-- Global daily hard cap for all Cloudflare Workers AI inference initiated by PeakScore.
-- Reservations happen before provider calls and are intentionally not refunded after failures.
create table if not exists public.orby_provider_daily_neuron_usage (
  usage_date date not null,
  provider text not null,
  neurons_used integer not null default 0 check (neurons_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (usage_date, provider)
);

alter table public.orby_provider_daily_neuron_usage enable row level security;
revoke all on public.orby_provider_daily_neuron_usage from anon, authenticated;
grant all on public.orby_provider_daily_neuron_usage to service_role;

create or replace function public.orby_reserve_cloudflare_neuron_budget(
  p_neurons integer,
  p_daily_limit integer default 8000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date := (now() at time zone 'UTC')::date;
  v_used integer;
begin
  if p_neurons is null or p_neurons < 1 or p_neurons > 8000
    or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 8000 then
    raise exception 'invalid_neuron_budget_request';
  end if;

  delete from public.orby_provider_daily_neuron_usage
  where usage_date < v_date - 7;

  insert into public.orby_provider_daily_neuron_usage (usage_date, provider, neurons_used)
  values (v_date, 'cloudflare_workers_ai', p_neurons)
  on conflict (usage_date, provider) do update
    set neurons_used = public.orby_provider_daily_neuron_usage.neurons_used + excluded.neurons_used,
        updated_at = now()
    where public.orby_provider_daily_neuron_usage.neurons_used + excluded.neurons_used <= p_daily_limit
  returning neurons_used into v_used;

  if v_used is null then
    select neurons_used into v_used
    from public.orby_provider_daily_neuron_usage
    where usage_date = v_date and provider = 'cloudflare_workers_ai';
    return jsonb_build_object(
      'allowed', false,
      'used', coalesce(v_used, 0),
      'remaining', 0,
      'daily_limit', p_daily_limit
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', v_used,
    'remaining', greatest(0, p_daily_limit - v_used),
    'daily_limit', p_daily_limit
  );
end;
$$;

revoke all on function public.orby_reserve_cloudflare_neuron_budget(integer, integer) from public, anon, authenticated;
grant execute on function public.orby_reserve_cloudflare_neuron_budget(integer, integer) to service_role;

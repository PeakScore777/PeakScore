-- PeakScore: server-only audit trail for owner-admin tools.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  target_user_id uuid,
  event_type text not null check (
    event_type in (
      'profile_statistics_update',
      'account_ban_requested',
      'account_ban_applied',
      'account_unban_requested',
      'account_unban_applied',
      'account_moderation_failed'
    )
  ),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_actor_created_idx
  on public.admin_audit_logs (actor_user_id, created_at desc);

create index if not exists admin_audit_logs_target_created_idx
  on public.admin_audit_logs (target_user_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

revoke all on table public.admin_audit_logs from anon, authenticated;
grant all on table public.admin_audit_logs to service_role;

comment on table public.admin_audit_logs is
  'Server-only audit history for canonical PeakScore owner-admin actions. No direct anon/authenticated access.';

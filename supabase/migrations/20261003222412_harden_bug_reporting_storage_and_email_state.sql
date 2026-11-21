alter table public.bug_reports
  add column if not exists screenshot_path text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_error text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-report-screenshots',
  'bug-report-screenshots',
  false,
  5242880,
  array['image/png','image/jpeg','image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp']::text[];

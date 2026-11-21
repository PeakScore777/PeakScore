-- Verified PeakScore creator applications.
-- Only server-side routes using service_role may read/write this table.
-- Role assignment and review-state transition happen atomically in one RPC.

create table if not exists public.community_professor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  professional_title text not null,
  subject_areas text[] not null,
  teaching_experience_years smallint not null default 0,
  biography text not null,
  portfolio_url text,
  intro_video_url text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_professor_application_title_length
    check (char_length(btrim(professional_title)) between 3 and 80),
  constraint community_professor_application_biography_length
    check (char_length(btrim(biography)) between 80 and 1200),
  constraint community_professor_application_experience
    check (teaching_experience_years between 0 and 50),
  constraint community_professor_application_subjects_count
    check (cardinality(subject_areas) between 1 and 6),
  constraint community_professor_application_subjects_allowed
    check (subject_areas <@ array[
      'Matemáticas','Lectura crítica','Sociales',
      'Ciencias naturales','Inglés','Preparación ICFES'
    ]::text[]),
  constraint community_professor_application_status
    check (status in ('pending','approved','rejected','changes_requested')),
  constraint community_professor_application_review_note_length
    check (review_note is null or char_length(review_note) <= 1000),
  constraint community_professor_application_portfolio_url
    check (portfolio_url is null or (portfolio_url ~ '^https://[^[:space:]]+$' and char_length(portfolio_url) <= 500)),
  constraint community_professor_application_intro_url
    check (intro_video_url is null or (intro_video_url ~ '^https://[^[:space:]]+$' and char_length(intro_video_url) <= 500))
);

create index if not exists community_professor_applications_status_submitted_idx
  on public.community_professor_applications (status, submitted_at asc);
create index if not exists community_professor_applications_user_submitted_idx
  on public.community_professor_applications (user_id, submitted_at desc);
create unique index if not exists community_professor_applications_one_active_per_user_uidx
  on public.community_professor_applications (user_id)
  where status in ('pending','approved');

alter table public.community_professor_applications enable row level security;
revoke all on public.community_professor_applications from public, anon, authenticated, service_role;
grant all on public.community_professor_applications to service_role;

drop policy if exists community_professor_applications_deny_client
  on public.community_professor_applications;
create policy community_professor_applications_deny_client
  on public.community_professor_applications
  for all to public
  using (false)
  with check (false);

create or replace function public.review_community_professor_application(
  p_application_id uuid,
  p_admin_id uuid,
  p_action text,
  p_review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.community_professor_applications%rowtype;
  v_next_status text;
  v_note text;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = p_admin_id
      and p.role = 'admin'
  ) then
    raise exception 'Administrator authorization required'
      using errcode = '42501';
  end if;

  if p_action not in ('approve','reject','request_changes') then
    raise exception 'Invalid review action'
      using errcode = '22023';
  end if;

  v_note := nullif(btrim(coalesce(p_review_note, '')), '');

  if p_action in ('reject','request_changes')
     and (v_note is null or char_length(v_note) < 10 or char_length(v_note) > 1000) then
    raise exception 'A review note of 10 to 1000 characters is required'
      using errcode = '22023';
  end if;

  v_next_status := case p_action
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    else 'changes_requested'
  end;

  select *
  into v_application
  from public.community_professor_applications a
  where a.id = p_application_id
    and a.status = 'pending'
  for update;

  if not found then
    raise exception 'Application not found or already reviewed'
      using errcode = 'P0002';
  end if;

  update public.community_professor_applications
  set status = v_next_status,
      reviewed_at = now(),
      reviewed_by = p_admin_id,
      review_note = v_note,
      updated_at = now()
  where id = p_application_id;

  if p_action = 'approve' then
    insert into public.community_member_roles (user_id, role_key, assigned_by)
    values (v_application.user_id, 'profesor', p_admin_id)
    on conflict (user_id, role_key) do nothing;
  end if;

  return jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'user_id', v_application.user_id,
    'status', v_next_status,
    'role_assigned', p_action = 'approve'
  );
end;
$$;

revoke all on function public.review_community_professor_application(uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.review_community_professor_application(uuid,uuid,text,text)
  to service_role;

comment on table public.community_professor_applications is
  'Private applications for the verified Profesor PeakScore creator role. Application and review data are server-only.';
comment on function public.review_community_professor_application(uuid,uuid,text,text) is
  'Atomically reviews a pending creator application and assigns the profesor community role only after admin approval.';

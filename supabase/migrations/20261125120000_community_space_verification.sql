-- Community verification lifecycle.
-- Adds a founder-reviewed verification state for independent PreICFES communities.
-- This migration is committed for review; do not apply until the Supabase migration
-- ledger has been reconciled and the community migration suite passes.

begin;

alter table public.community_spaces
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verification_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verification_reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_note text;

alter table public.community_spaces
  drop constraint if exists community_spaces_verification_status_check;
alter table public.community_spaces
  add constraint community_spaces_verification_status_check
  check (verification_status in ('unverified','pending','verified','rejected'));

alter table public.community_spaces
  drop constraint if exists community_spaces_verification_note_length;
alter table public.community_spaces
  add constraint community_spaces_verification_note_length
  check (verification_note is null or char_length(verification_note) <= 500);

update public.community_spaces
set verification_status = 'verified',
    verification_reviewed_at = coalesce(verification_reviewed_at, now()),
    verification_note = coalesce(verification_note, 'Comunidad oficial de PeakScore.')
where space_type = 'global';

create index if not exists community_spaces_verification_queue_idx
  on public.community_spaces (verification_status, verification_requested_at desc)
  where space_type = 'preicfes' and is_enabled = true;

create or replace function public.request_community_space_verification(p_space_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_space public.community_spaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_space
  from public.community_spaces
  where id = p_space_id and space_type = 'preicfes' and is_enabled = true
  for update;

  if not found then
    raise exception 'Community space not found' using errcode = '22023';
  end if;

  if v_space.owner_id <> auth.uid()
     and not exists (
       select 1
       from public.community_space_members member
       where member.space_id = p_space_id
         and member.user_id = auth.uid()
     ) then
    raise exception 'Only a community member can request verification' using errcode = '42501';
  end if;

  if v_space.verification_status = 'verified' then
    raise exception 'This community is already verified' using errcode = '22023';
  end if;
  if v_space.verification_status = 'pending' then
    return true;
  end if;

  update public.community_spaces
  set verification_status = 'pending',
      verification_requested_by = auth.uid(),
      verification_requested_at = now(),
      verification_reviewed_by = null,
      verification_reviewed_at = null,
      verification_note = null,
      updated_at = now()
  where id = p_space_id;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (
    auth.uid(),
    'community_verification_requested',
    jsonb_build_object('space_id', p_space_id)
  );

  return true;
end;
$function$;

revoke all on function public.request_community_space_verification(uuid) from public, anon;
grant execute on function public.request_community_space_verification(uuid) to authenticated;

create or replace function public.review_community_space_verification(
  p_space_id uuid,
  p_decision text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_space public.community_spaces%rowtype;
  v_status text;
begin
  if auth.uid() is null or not private.is_community_founder() then
    raise exception 'Only the founder can review community verification' using errcode = '42501';
  end if;

  if p_decision not in ('verify','reject','revoke') then
    raise exception 'Invalid verification decision' using errcode = '22023';
  end if;
  if p_note is not null and char_length(btrim(p_note)) > 500 then
    raise exception 'Verification note is too long' using errcode = '22023';
  end if;

  select * into v_space
  from public.community_spaces
  where id = p_space_id and is_enabled = true
  for update;

  if not found then
    raise exception 'Community space not found' using errcode = '22023';
  end if;
  if v_space.space_type = 'global' and p_decision <> 'verify' then
    raise exception 'The official PeakScore community cannot be unverified' using errcode = '42501';
  end if;
  if p_decision = 'verify' and v_space.space_type <> 'preicfes' and v_space.space_type <> 'global' then
    raise exception 'Only supported community spaces can be verified' using errcode = '22023';
  end if;

  v_status := case p_decision
    when 'verify' then 'verified'
    when 'reject' then 'rejected'
    else 'unverified'
  end;

  update public.community_spaces
  set verification_status = v_status,
      verification_reviewed_by = auth.uid(),
      verification_reviewed_at = now(),
      verification_note = nullif(btrim(p_note), ''),
      updated_at = now()
  where id = p_space_id;

  insert into private.community_security_audit (actor_user_id, action_key, details)
  values (
    auth.uid(),
    'community_verification_' || p_decision,
    jsonb_build_object(
      'space_id', p_space_id,
      'previous_status', v_space.verification_status,
      'new_status', v_status,
      'note', nullif(btrim(p_note), '')
    )
  );

  return true;
end;
$function$;

revoke all on function public.review_community_space_verification(uuid,text,text) from public, anon;
grant execute on function public.review_community_space_verification(uuid,text,text) to authenticated;

commit;

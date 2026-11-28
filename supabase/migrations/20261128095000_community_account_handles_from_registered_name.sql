-- Use the name captured at account registration for the stable community @handle.
-- The editable community display_name must never be the primary source of account identity.

alter table public.community_member_profiles
  add column if not exists account_name text;

with source_names as (
  select
    member.user_id,
    coalesce(
      nullif(btrim(profile.full_name), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'user_name'), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'preferred_username'), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'username'), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'nickname'), ''),
      'Miembro'
    ) as registered_name
  from public.community_member_profiles as member
  join auth.users as auth_user on auth_user.id = member.user_id
  left join public.profiles as profile on profile.id = member.user_id
  where member.account_name is null or btrim(member.account_name) = ''
),
normalized_names as (
  select
    user_id,
    left(
      coalesce(
        nullif(
          trim(both '-' from regexp_replace(
            translate(registered_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
            '[^A-Za-z0-9]+',
            '-',
            'g'
          )),
          ''
        ),
        'Miembro'
      ),
      24
    ) as base_handle
  from source_names
),
ranked_names as (
  select
    user_id,
    case
      when count(*) over (partition by lower(base_handle)) > 1
        then base_handle || '-' || right(replace(user_id::text, '-', ''), 6)
      else base_handle
    end as generated_handle
  from normalized_names
)
update public.community_member_profiles as member
set account_name = ranked_names.generated_handle
from ranked_names
where member.user_id = ranked_names.user_id
  and (member.account_name is null or btrim(member.account_name) = '');

-- Existing handles are case-insensitively unique.
create unique index if not exists community_member_profiles_account_name_lower_uidx
  on public.community_member_profiles (lower(account_name));

comment on column public.community_member_profiles.account_name is
  'Stable public @handle derived from the name used at account registration; separate from editable display_name.';

-- Auth trigger: create the registered-name handle for new users, without making
-- Auth signup depend on a client-side profile write.
create or replace function public.handle_new_community_member_account_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_candidate text;
  v_base_handle text;
  v_account_name text;
  v_display_name text;
  v_user_suffix text;
begin
  v_candidate := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
    'Miembro'
  );

  v_base_handle := left(
    coalesce(
      nullif(
        trim(both '-' from regexp_replace(
          translate(v_candidate, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
          '[^A-Za-z0-9]+',
          '-',
          'g'
        )),
        ''
      ),
      'Miembro'
    ),
    24
  );

  v_user_suffix := right(replace(new.id::text, '-', ''), 6);
  v_account_name := v_base_handle;
  v_display_name := left(v_candidate, 32);

  -- Serialize handle allocation for identical registered names.
  perform pg_advisory_xact_lock(hashtext(lower(v_base_handle)));

  if exists (
    select 1
    from public.community_member_profiles as existing
    where lower(existing.account_name) = lower(v_account_name)
      and existing.user_id <> new.id
  ) then
    v_account_name := v_base_handle || '-' || v_user_suffix;
  end if;

  if exists (
    select 1
    from public.community_member_profiles as existing
    where lower(existing.account_name) = lower(v_account_name)
      and existing.user_id <> new.id
  ) then
    v_account_name := left(v_base_handle, 18) || '-' ||
      right(replace(new.id::text, '-', ''), 12);
  end if;

  insert into public.community_member_profiles (user_id, display_name, account_name)
  values (new.id, coalesce(nullif(v_display_name, ''), 'Miembro'), v_account_name)
  on conflict (user_id) do update
    set account_name = coalesce(
      nullif(btrim(public.community_member_profiles.account_name), ''),
      excluded.account_name
    );

  return new;
end;
$function$;

revoke all on function public.handle_new_community_member_account_name()
  from public, anon, authenticated;

drop trigger if exists sync_community_member_account_name on auth.users;
create trigger sync_community_member_account_name
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.handle_new_community_member_account_name();

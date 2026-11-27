-- Stable public @handles for every community member, preloaded with the roster.
alter table public.community_member_profiles
  add column if not exists account_name text;

update public.community_member_profiles as member
set account_name =
  left(
    coalesce(
      nullif(trim(both '-' from lower(regexp_replace(
        coalesce(
          nullif(btrim(auth_user.raw_user_meta_data ->> 'user_name'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'preferred_username'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'username'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'nickname'), ''),
          nullif(btrim(member.display_name), ''),
          'miembro'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      ))), ''),
      'miembro'
    ),
    24
  ) || '-' || right(replace(member.user_id::text, '-', ''), 6)
from auth.users as auth_user
where auth_user.id = member.user_id
  and (member.account_name is null or btrim(member.account_name) = '');

update public.community_member_profiles
set account_name = 'miembro-' || right(replace(user_id::text, '-', ''), 6)
where account_name is null or btrim(account_name) = '';

alter table public.community_member_profiles
  alter column account_name set not null;

create unique index if not exists community_member_profiles_account_name_lower_uidx
  on public.community_member_profiles (lower(account_name));

comment on column public.community_member_profiles.account_name is
  'Stable public @handle, separate from editable community display_name.';

create or replace function public.handle_new_community_member_account_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_candidate text;
  v_slug text;
  v_display_name text;
  v_account_name text;
begin
  v_candidate := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    'miembro'
  );
  v_slug := trim(both '-' from lower(regexp_replace(v_candidate, '[^a-zA-Z0-9]+', '-', 'g')));
  if v_slug = '' then v_slug := 'miembro'; end if;
  v_account_name := left(v_slug, 24) || '-' || right(replace(new.id::text, '-', ''), 6);
  v_display_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    v_candidate,
    'Miembro'
  ), 32);

  insert into public.community_member_profiles (user_id, display_name, account_name)
  values (new.id, v_display_name, v_account_name)
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

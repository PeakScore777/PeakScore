-- Ensure every existing Auth account has a community identity and public handle,
-- including accounts created before the community profile trigger was installed.
insert into public.community_member_profiles (user_id, display_name, account_name)
select
  auth_user.id,
  left(coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
    'Miembro'
  ), 32),
  left(
    coalesce(
      nullif(trim(both '-' from lower(regexp_replace(
        coalesce(
          nullif(btrim(auth_user.raw_user_meta_data ->> 'user_name'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'preferred_username'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'username'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'nickname'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
          'miembro'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      ))), ''),
      'miembro'
    ),
    24
  ) || '-' || right(replace(auth_user.id::text, '-', ''), 6)
from auth.users as auth_user
left join public.community_member_profiles as member
  on member.user_id = auth_user.id
where member.user_id is null
on conflict (user_id) do nothing;

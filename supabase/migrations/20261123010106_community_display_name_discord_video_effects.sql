-- Match the persisted display-name effect catalogue to the seven animated styles.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_effect_check;

update public.community_member_profiles
set display_name_effect = 'plain'
where display_name_effect not in ('plain','gradient','neon','toon','pop','gummy','prism');

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_effect_check
    check (display_name_effect in ('plain','gradient','neon','toon','pop','gummy','prism'));

comment on column public.community_member_profiles.display_name_effect is
  'Discord-video-aligned animated display-name effects: plain, gradient, neon, toon, pop, gummy and prism.';

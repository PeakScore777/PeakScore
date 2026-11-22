-- Persistent Discord-inspired display name cosmetics.
alter table public.community_member_profiles
  add column if not exists display_name_effect text not null default 'plain',
  add column if not exists display_name_color text not null default 'default';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_effect_check,
  drop constraint if exists community_member_profiles_display_name_color_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_effect_check
    check (display_name_effect in ('plain','gradient','neon','cartoon','pop','jelly','prism')),
  add constraint community_member_profiles_display_name_color_check
    check (display_name_color in ('default','pink','green','blue','purple','magenta','red','gold','rainbow','aurora','fire'));

comment on column public.community_member_profiles.display_name_effect is
  'Display name visual effect preset shown in community identity and message surfaces.';
comment on column public.community_member_profiles.display_name_color is
  'Display name color preset shown in community identity and message surfaces.';

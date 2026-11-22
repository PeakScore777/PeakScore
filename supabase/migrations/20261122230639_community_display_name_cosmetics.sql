-- Community display-name effects, color presets and two-stop custom gradient storage.
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
    check (display_name_color in ('default','pink','green','blue','purple','magenta','red','gold','custom-gradient'));

alter table public.community_member_profiles
  add column if not exists display_name_gradient_start text not null default '#B86BFF',
  add column if not exists display_name_gradient_end text not null default '#4E9BFF';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_gradient_start_check,
  drop constraint if exists community_member_profiles_display_name_gradient_end_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_gradient_start_check
    check (display_name_gradient_start ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint community_member_profiles_display_name_gradient_end_check
    check (display_name_gradient_end ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.community_member_profiles.display_name_effect is
  'Display-name effect preset shown in community identity and message surfaces.';
comment on column public.community_member_profiles.display_name_color is
  'Display-name color preset, including a user-defined two-stop gradient.';
comment on column public.community_member_profiles.display_name_gradient_start is
  'First user-selected color stop for a custom display-name gradient.';
comment on column public.community_member_profiles.display_name_gradient_end is
  'Second user-selected color stop for a custom display-name gradient.';

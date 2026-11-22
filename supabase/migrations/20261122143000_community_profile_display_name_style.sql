-- Keep nameplate and display-name typography as separate community profile settings.
alter table public.community_member_profiles
  add column if not exists display_name_style text not null default 'classic';

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_style_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_style_check
  check (display_name_style in ('classic', 'gta', 'pixel'));

comment on column public.community_member_profiles.display_name_style is
  'First-party display-name typography preset. Independent from the community nameplate (plate_style).';

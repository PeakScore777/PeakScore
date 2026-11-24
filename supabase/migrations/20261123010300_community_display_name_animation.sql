-- Create the persisted display-name entrance preset before the Motion Atelier migrations.
alter table public.community_member_profiles
  add column if not exists display_name_animation text not null default 'none';

comment on column public.community_member_profiles.display_name_animation is
  'Persisted community display-name entrance animation preset.';

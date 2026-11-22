-- Store five independently selectable color stops for the Discord-style Prism name effect.
alter table public.community_member_profiles
  add column if not exists display_name_prism_colors text[] not null
    default ARRAY['#FFBD62','#FFF27D','#71E7C0','#79BAFF','#D19AFF']::text[];

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_prism_colors_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_prism_colors_check
  check (
    cardinality(display_name_prism_colors) = 5
    and array_to_string(display_name_prism_colors, ',') ~ '^#[0-9A-Fa-f]{6}(,#[0-9A-Fa-f]{6}){4}$'
  );

comment on column public.community_member_profiles.display_name_prism_colors is
  'Five independently selected color stops used by the display-name Prism effect.';

-- Expand the saved display-name solid swatches.
-- The UI uses preset ids; the API and database accept the same finite allowlist.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_color_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_color_check
  check (display_name_color in (
    'default',
    'pink',
    'coral',
    'salmon',
    'red',
    'crimson',
    'orange',
    'peach',
    'amber',
    'gold',
    'yellow',
    'lime',
    'green',
    'emerald',
    'mint',
    'teal',
    'cyan',
    'ice',
    'sky',
    'blue',
    'indigo',
    'periwinkle',
    'violet',
    'purple',
    'lavender',
    'orchid',
    'plum',
    'magenta',
    'fuchsia',
    'silver',
    'custom-gradient'
  ));

comment on column public.community_member_profiles.display_name_color is
  'Selected display-name solid palette preset, automatic contrast, or the legacy custom-gradient identifier.';

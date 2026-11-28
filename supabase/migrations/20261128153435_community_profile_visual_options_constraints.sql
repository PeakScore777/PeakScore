-- Keep database validation aligned with the profile editor/API allowlists.
-- The UI supports an expanded display-name palette and the gradient-flow effect.

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_color_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_color_check
  check (
    display_name_color = any (array[
      'default',
      'pink',
      'green',
      'blue',
      'purple',
      'magenta',
      'red',
      'gold',
      'coral',
      'salmon',
      'orange',
      'amber',
      'yellow',
      'lime',
      'emerald',
      'mint',
      'teal',
      'cyan',
      'sky',
      'ice',
      'indigo',
      'violet',
      'lavender',
      'fuchsia',
      'plum',
      'crimson',
      'peach',
      'periwinkle',
      'orchid',
      'silver',
      'white',
      'gray',
      'brown',
      'black',
      'charcoal',
      'graphite',
      'slate',
      'navy',
      'midnight',
      'cream',
      'custom-gradient'
    ]::text[])
  );

alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_effect_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_effect_check
  check (
    display_name_effect = any (array[
      'plain',
      'gradient',
      'gradient-flow',
      'neon',
      'toon',
      'pop',
      'gummy',
      'prism',
      'chromaflow'
    ]::text[])
  );

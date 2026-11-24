-- Add the platform-inspired open font alternatives and persist the Chromaflow finish.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_style_check,
  drop constraint if exists community_member_profiles_display_name_effect_check;

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_style_check
  check (display_name_style in (
    'classic',
    'tempo',
    'sakura',
    'jellybean',
    'modern',
    'medieval',
    '8bit',
    'vampyre',
    'monkey-bars',
    'mainframe',
    'headbang',
    'journal',
    'display',
    'editorial',
    'elegant',
    'geometric',
    'retro',
    'handwritten',
    'signature',
    'techno',
    'rounded',
    'stencil',
    'discord-display',
    'creator-sans',
    'stream-mono',
    'street-block',
    'action-condensed',
    'cyber-racer',
    'epic-rpg'
  )),
  add constraint community_member_profiles_display_name_effect_check
  check (display_name_effect in (
    'plain',
    'gradient',
    'neon',
    'toon',
    'pop',
    'gummy',
    'prism',
    'chromaflow'
  ));

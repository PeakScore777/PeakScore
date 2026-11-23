-- Expand the display-name catalogue beyond Discord's baseline while keeping
-- the selected font/effect persisted and validated at the database boundary.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_style_check,
  drop constraint if exists community_member_profiles_display_name_effect_check;

update public.community_member_profiles
set display_name_style = 'classic'
where display_name_style not in (
  'classic','tempo','sakura','jellybean','modern','medieval','8bit','vampyre',
  'monkey-bars','mainframe','headbang','journal','display','editorial','elegant',
  'geometric','retro','handwritten','signature','techno','rounded','stencil'
);

update public.community_member_profiles
set display_name_effect = 'plain'
where display_name_effect not in (
  'plain','gradient','neon','toon','pop','gummy','prism','metallic','outline',
  'shadow','aurora','fire','ice','glitch','holographic'
);

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_style_check
    check (display_name_style in (
      'classic','tempo','sakura','jellybean','modern','medieval','8bit','vampyre',
      'monkey-bars','mainframe','headbang','journal','display','editorial','elegant',
      'geometric','retro','handwritten','signature','techno','rounded','stencil'
    )),
  add constraint community_member_profiles_display_name_effect_check
    check (display_name_effect in (
      'plain','gradient','neon','toon','pop','gummy','prism','metallic','outline',
      'shadow','aurora','fire','ice','glitch','holographic'
    ));

comment on column public.community_member_profiles.display_name_style is
  'PeakScore display-name font catalogue. Fonts are self-hosted through next/font and may extend beyond the Discord-inspired baseline.';
comment on column public.community_member_profiles.display_name_effect is
  'PeakScore display-name finish catalogue: solid, gradient, neon, toon, pop, gummy, prism, metallic, outline, shadow, aurora, fire, ice, glitch, holographic.';

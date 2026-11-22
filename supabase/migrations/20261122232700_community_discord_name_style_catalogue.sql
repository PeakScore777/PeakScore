-- Align persisted display-name styles with Discord's documented customization catalogue.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_style_check,
  drop constraint if exists community_member_profiles_display_name_effect_check;

update public.community_member_profiles
set display_name_style = case display_name_style
  when 'rounded' then 'jellybean'
  when 'serif' then 'medieval'
  when 'display' then 'headbang'
  when 'slab' then 'medieval'
  when 'condensed' then 'tempo'
  when 'mono' then 'mainframe'
  when 'pixel' then '8bit'
  when 'gothic' then 'vampyre'
  when 'script' then 'journal'
  when 'playful' then 'monkey-bars'
  when 'bold' then 'headbang'
  else 'classic'
end
where display_name_style not in ('classic','tempo','sakura','jellybean','modern','medieval','8bit','vampyre','monkey-bars','mainframe','headbang','journal');

update public.community_member_profiles
set display_name_effect = case display_name_effect
  when 'cartoon' then 'toon'
  when 'jelly' then 'gummy'
  else 'plain'
end
where display_name_effect not in ('plain','gradient','neon','toon','pop','gummy','prism');

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_style_check
    check (display_name_style in ('classic','tempo','sakura','jellybean','modern','medieval','8bit','vampyre','monkey-bars','mainframe','headbang','journal')),
  add constraint community_member_profiles_display_name_effect_check
    check (display_name_effect in ('plain','gradient','neon','toon','pop','gummy','prism'));

comment on column public.community_member_profiles.display_name_style is
  'Discord-inspired display-name font preset identifier. Font rendering uses PeakScore local and system-safe font stacks.';
comment on column public.community_member_profiles.display_name_effect is
  'Display-name effect preset: solid, gradient, neon, toon, pop, gummy or prism.';

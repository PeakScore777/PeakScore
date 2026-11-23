-- Curate display-name finishes around legible, premium materials.
alter table public.community_member_profiles
  drop constraint if exists community_member_profiles_display_name_effect_check;

update public.community_member_profiles
set display_name_effect = case
  when display_name_effect = 'metallic' then 'satin'
  when display_name_effect in ('outline','shadow','fire','ice','glitch','holographic') then 'plain'
  else display_name_effect
end
where display_name_effect not in (
  'plain','gradient','neon','toon','pop','gummy','prism','satin','pearl','ink','aurora'
);

alter table public.community_member_profiles
  add constraint community_member_profiles_display_name_effect_check
    check (display_name_effect in (
      'plain','gradient','neon','toon','pop','gummy','prism','satin','pearl','ink','aurora'
    ));

comment on column public.community_member_profiles.display_name_effect is
  'Curated PeakScore display-name finishes: solid, two-colour gradient, restrained neon, toon, pop, gummy, five-colour prism, satin metal, pearl and ink.';

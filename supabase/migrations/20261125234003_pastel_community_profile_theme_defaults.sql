-- New community profiles start with a soft pastel green theme.
-- Existing member-selected themes remain untouched.
alter table public.community_member_profiles
  alter column card_color set default '#B7D7C3',
  alter column theme_color_secondary set default '#8FB9A6';

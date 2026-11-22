-- New community profiles start with the platform's green theme.
-- Existing member-selected colors remain unchanged.
alter table public.community_member_profiles
  alter column card_color set default '#2E8B57';

-- Use a warm beige banner as the default for newly created community profiles.
-- Existing user-selected banner colors are intentionally preserved.
alter table public.community_member_profiles
  alter column card_color set default '#B89C78';

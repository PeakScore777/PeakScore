-- Remove the legacy per-account image-count quota.
-- Orby is now a live AI tutor; the old chat upload quota must not restrict
-- the number of generated/attached lesson illustrations a student can keep.
drop trigger if exists enforce_orby_image_quota_before_insert
  on public.orby_image_assets;

drop function if exists public.enforce_orby_image_quota();

comment on table public.orby_image_assets is
  'Private Orby lesson image assets. No per-account image-count quota; storage and provider safety limits still apply.';

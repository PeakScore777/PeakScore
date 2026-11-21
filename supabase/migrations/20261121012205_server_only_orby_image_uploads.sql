-- Force Orby image writes through the server-side raster sanitizer.
-- Per-user reads and deletes remain available through RLS.
drop policy if exists "Users upload their own Orby image objects" on storage.objects;

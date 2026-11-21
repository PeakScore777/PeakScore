-- pg_net is non-relocatable. Recreate it under extensions to remove it from public.
-- The queue was verified empty before applying; Orby's cron continues calling net.http_post.
create schema if not exists extensions;
drop extension if exists pg_net;
create extension pg_net with schema extensions;

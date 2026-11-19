-- The Archivo Oculto shelf catalog is read server-side with supabaseAdmin.
-- Keep this grant explicit so the catalog can load published passage metadata.
grant select on table public.game_reading_passages to service_role;

-- Admin-managed artwork displayed in the two framed paintings inside Archivo Oculto.
create table if not exists public.archivo_oculto_wall_frames (
  id uuid primary key default gen_random_uuid(),
  slot text not null unique check (slot in ('left','right')),
  title text not null check (char_length(title) between 2 and 120),
  image_url text not null,
  storage_path text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.archivo_oculto_wall_frames enable row level security;
grant select, insert, update, delete on public.archivo_oculto_wall_frames to authenticated;

drop policy if exists "students read active archivo oculto wall frames" on public.archivo_oculto_wall_frames;
create policy "students read active archivo oculto wall frames"
  on public.archivo_oculto_wall_frames for select to authenticated
  using (is_active = true);

drop policy if exists "admins manage archivo oculto wall frames" on public.archivo_oculto_wall_frames;
create policy "admins manage archivo oculto wall frames"
  on public.archivo_oculto_wall_frames for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

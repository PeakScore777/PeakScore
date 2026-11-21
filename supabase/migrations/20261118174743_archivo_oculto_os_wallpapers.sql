-- Admin-managed desktop and lock-screen imagery for Archivo Oculto PEAK OS.
create table if not exists public.archivo_oculto_os_wallpapers (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('desktop','lock')),
  title text not null check (char_length(title) between 2 and 120),
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archivo_oculto_os_wallpapers_storage_path_unique unique(storage_path)
);

create index if not exists archivo_oculto_os_wallpapers_active_idx
  on public.archivo_oculto_os_wallpapers(slot, is_active, sort_order);

alter table public.archivo_oculto_os_wallpapers enable row level security;
grant select, insert, update, delete on public.archivo_oculto_os_wallpapers to authenticated;

drop policy if exists "students read active archivo oculto os wallpapers" on public.archivo_oculto_os_wallpapers;
create policy "students read active archivo oculto os wallpapers"
  on public.archivo_oculto_os_wallpapers for select to authenticated
  using (is_active = true);

drop policy if exists "admins manage archivo oculto os wallpapers" on public.archivo_oculto_os_wallpapers;
create policy "admins manage archivo oculto os wallpapers"
  on public.archivo_oculto_os_wallpapers for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

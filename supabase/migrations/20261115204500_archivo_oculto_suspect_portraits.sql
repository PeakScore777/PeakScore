-- Suspect portraits and dossiers for each published Archivo Oculto reading.
create table if not exists public.game_reading_suspects (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.game_reading_passages(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  role text not null check (char_length(role) between 2 and 140),
  description text not null default '',
  motive text not null default '',
  alibi text not null default '',
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (passage_id, name)
);

create index if not exists game_reading_suspects_passage_order_idx
  on public.game_reading_suspects(passage_id, display_order);

alter table public.game_reading_suspects enable row level security;
grant select, insert, update, delete on public.game_reading_suspects to authenticated;

drop policy if exists "students read suspects for published readings" on public.game_reading_suspects;
create policy "students read suspects for published readings"
  on public.game_reading_suspects for select to authenticated
  using (exists (
    select 1 from public.game_reading_passages p
    where p.id = passage_id and p.status = 'published'
  ));

drop policy if exists "admins manage reading suspects" on public.game_reading_suspects;
create policy "admins manage reading suspects"
  on public.game_reading_suspects for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

insert into public.game_reading_suspects
  (passage_id, name, role, description, motive, alibi, display_order)
select p.id, s.name, s.role, s.description, s.motive, s.alibi, s.display_order
from public.game_reading_passages p
cross join (values
  ('Inés Salcedo','Archivista de Planeación','Custodiaba el archivador y organizó la carpeta para la audiencia.','Discutió con el autor del informe por la inclusión de nombres de familias; afirma que buscaba proteger datos personales.','Una compañera la vio salir a las 6:18 p. m., pero no pudo confirmar si llevaba la carpeta habitual.',1),
  ('Mateo Rincón','Vigilante del turno de la tarde','Registró la apertura de la puerta lateral a las 6:32 p. m. durante una falla de cámara.','El inventario indica que vigilancia recibió una copia de la llave del archivador; él sostiene que fue devuelta, pero no encuentra el comprobante.','Afirma que el técnico de alarmas nunca llegó y que solo revisó el sensor desde el pasillo.',2),
  ('Vera Pardo','Periodista de una emisora comunitaria','Investigaba la transparencia de la audiencia y publicó una fotografía de una tabla de mediciones.','La tabla le dio una primicia periodística, aunque niega haber retirado páginas del archivador.','El registro de visitantes muestra que salió de Planeación a las 5:58 p. m.; dice que recibió la imagen de una fuente anónima después.',3),
  ('Tomás Leal','Ingeniero del estudio hídrico','Participó en el informe y cuestionó las mediciones de la quebrada La Honda.','Tenía interés en que se corrigieran las cifras antes de la audiencia y conservaba una copia digital de trabajo.','Afirmó salir a las 5:05 p. m.; un archivo se modificó a las 6:47, pero sostiene que pudo ser una actualización automática.',4)
) as s(name,role,description,motive,alibi,display_order)
where p.game_key = 'archivo-oculto'
  and p.title = 'El último testigo'
on conflict (passage_id, name) do update
set role = excluded.role,
    description = excluded.description,
    motive = excluded.motive,
    alibi = excluded.alibi,
    display_order = excluded.display_order,
    updated_at = now();

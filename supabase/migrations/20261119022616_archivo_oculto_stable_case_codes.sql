create sequence if not exists public.archivo_oculto_case_code_seq start with 1;

alter table public.game_reading_passages
  add column if not exists case_code text;

with numbered as (
  select
    id,
    lpad(row_number() over (order by created_at asc, id asc)::text, 3, '0') as code
  from public.game_reading_passages
  where game_key = 'archivo-oculto'
    and case_code is null
)
update public.game_reading_passages as passage
set case_code = numbered.code
from numbered
where passage.id = numbered.id;

select setval(
  'public.archivo_oculto_case_code_seq',
  greatest(
    coalesce((
      select max(case_code::integer)
      from public.game_reading_passages
      where game_key = 'archivo-oculto'
        and case_code ~ '^[0-9]+$'
    ), 1),
    1
  ),
  exists (
    select 1
    from public.game_reading_passages
    where game_key = 'archivo-oculto'
      and case_code ~ '^[0-9]+$'
  )
);

alter table public.game_reading_passages
  alter column case_code set default lpad(nextval('public.archivo_oculto_case_code_seq')::text, 3, '0'),
  alter column case_code set not null;

create unique index if not exists game_reading_passages_game_case_code_uidx
  on public.game_reading_passages (game_key, case_code);

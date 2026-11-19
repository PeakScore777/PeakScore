alter table public.game_reading_passages
  alter column case_code drop default,
  alter column case_code drop not null;

create or replace function public.assign_archivo_oculto_case_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.game_key = 'archivo-oculto' and new.case_code is null then
    new.case_code := pg_catalog.lpad(
      pg_catalog.nextval('public.archivo_oculto_case_code_seq'::regclass)::text,
      3,
      '0'
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists game_reading_passages_assign_archivo_case_code
  on public.game_reading_passages;

create trigger game_reading_passages_assign_archivo_case_code
  before insert on public.game_reading_passages
  for each row
  execute function public.assign_archivo_oculto_case_code();

revoke all on function public.assign_archivo_oculto_case_code() from public, anon, authenticated;

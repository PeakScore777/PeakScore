drop policy if exists "Users can update safe profile fields" on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.prevent_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.id <> old.id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at
     or new.average_score is distinct from old.average_score
     or new.streak is distinct from old.streak
     or new.simulations is distinct from old.simulations
     or new.target_score is distinct from old.target_score then
    if auth.uid() = old.id then
      raise exception 'No tienes permiso para modificar campos protegidos del perfil';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists prevent_profile_privilege_changes on public.profiles;

create trigger prevent_profile_privilege_changes
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_changes();

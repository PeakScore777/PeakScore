drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update safe profile fields"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and id = (select p.id from public.profiles p where p.id = auth.uid())
  and email = (select p.email from public.profiles p where p.id = auth.uid())
  and created_at = (select p.created_at from public.profiles p where p.id = auth.uid())
  and average_score = (select p.average_score from public.profiles p where p.id = auth.uid())
  and streak = (select p.streak from public.profiles p where p.id = auth.uid())
  and simulations = (select p.simulations from public.profiles p where p.id = auth.uid())
);

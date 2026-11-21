revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;

revoke all on table public.user_roles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.user_roles from authenticated;

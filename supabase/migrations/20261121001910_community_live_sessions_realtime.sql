do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_live_sessions'
  ) then
    alter publication supabase_realtime add table public.community_live_sessions;
  end if;
end
$$;

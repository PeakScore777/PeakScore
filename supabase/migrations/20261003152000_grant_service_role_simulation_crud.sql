-- The API uses the server-side Supabase service role to create and
-- manage user-owned normal simulations. Direct client writes remain
-- blocked for anon/authenticated and RLS continues to scope user reads.

grant select, insert, update, delete
on table
  public.simulations,
  public.simulation_questions,
  public.simulation_attempts,
  public.simulation_answers
to service_role;

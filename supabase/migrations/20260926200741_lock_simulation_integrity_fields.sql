drop policy if exists "Users can update their own simulation answers" on public.simulation_answers;

drop policy if exists "authenticated_can_update_simulations" on public.simulations;

drop policy if exists "authenticated_can_delete_simulation_questions" on public.simulation_questions;
drop policy if exists "authenticated_can_insert_simulation_questions" on public.simulation_questions;

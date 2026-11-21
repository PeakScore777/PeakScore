alter function public.delete_user_simulation(uuid) set search_path = '';
alter function public.finish_simulation_atomic(uuid, uuid, jsonb) set search_path = '';
alter function public.get_subject_performance_for_attempts(uuid[]) set search_path = '';
alter function public.update_user_streak() set search_path = '';

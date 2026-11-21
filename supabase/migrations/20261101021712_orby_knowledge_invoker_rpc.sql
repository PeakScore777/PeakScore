-- Keep Orby knowledge write RPCs invoker-scoped; service_role already has required privileges.
alter function public.orby_save_chunk_embeddings(uuid,jsonb,text) security invoker;
alter function public.orby_save_knowledge_profile(uuid,jsonb,text) security invoker;
revoke all on function public.orby_save_chunk_embeddings(uuid,jsonb,text) from public, anon, authenticated;
revoke all on function public.orby_save_knowledge_profile(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.orby_save_chunk_embeddings(uuid,jsonb,text) to service_role;
grant execute on function public.orby_save_knowledge_profile(uuid,jsonb,text) to service_role;

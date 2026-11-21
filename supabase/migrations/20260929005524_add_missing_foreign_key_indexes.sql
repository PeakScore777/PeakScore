create index if not exists idx_reference_analyses_reference_source_id on public.reference_analyses(reference_source_id);
create index if not exists idx_reference_analyses_subject_id on public.reference_analyses(subject_id);
create index if not exists idx_reference_analyses_user_id on public.reference_analyses(user_id);
create index if not exists idx_reference_set_questions_reference_question_id on public.reference_set_questions(reference_question_id);
create index if not exists idx_reference_sets_created_by on public.reference_sets(created_by);
create index if not exists idx_reference_sources_uploaded_by on public.reference_sources(uploaded_by);
create index if not exists idx_student_progress_subject_id on public.student_progress(subject_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

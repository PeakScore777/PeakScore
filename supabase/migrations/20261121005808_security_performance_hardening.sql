-- PeakScore security, abuse and query-planning hardening.
-- Date: 2026-11-20
-- Safe to re-run: indexes use IF NOT EXISTS and function/policy changes are repeatable.

-- 1) Server-enforced hourly request budgets for endpoints that accept uploads
-- or consume free AI quota. The browser cannot choose these values.
create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_count integer;
  v_bucket text := trim(coalesce(p_bucket, ''));
  v_limit integer;
  v_window_seconds integer;
begin
  if v_user_id is null then
    return false;
  end if;

  case v_bucket
    when 'generate-questions' then
      v_limit := 10;
      v_window_seconds := 3600;
    when 'generate-question-batch' then
      v_limit := 3;
      v_window_seconds := 3600;
    when 'import-pdf' then
      v_limit := 2;
      v_window_seconds := 3600;
    when 'create-simulation' then
      v_limit := 20;
      v_window_seconds := 3600;
    when 'institution-register' then
      v_limit := 2;
      v_window_seconds := 3600;
    when 'community-professor-application' then
      v_limit := 2;
      v_window_seconds := 3600;
    when 'admin-game-image' then
      v_limit := 20;
      v_window_seconds := 3600;
    when 'bug-report' then
      v_limit := 5;
      v_window_seconds := 3600;
    when 'orby-image-save' then
      v_limit := 30;
      v_window_seconds := 3600;
    when 'orby-generate-image' then
      v_limit := 8;
      v_window_seconds := 3600;
    else
      return false;
  end case;

  insert into public.api_rate_limits (
    user_id, bucket, window_started_at, request_count
  )
  values (v_user_id, v_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
  set
    window_started_at = case
      when public.api_rate_limits.window_started_at
        <= v_now - make_interval(secs => v_window_seconds)
        then v_now
      else public.api_rate_limits.window_started_at
    end,
    request_count = case
      when public.api_rate_limits.window_started_at
        <= v_now - make_interval(secs => v_window_seconds)
        then 1
      else public.api_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= v_limit;
end;
$function$;

-- 2) Revoke direct browser execution of the reward-granting SECURITY DEFINER
-- function. finish_simulation_atomic is its only database caller and runs as
-- postgres; students must only reach rewards through validated simulation finish.
revoke all on function public.grant_simulation_rewards(uuid, uuid, uuid, integer)
  from public, anon, authenticated;

-- 3) Evaluate auth.uid() once per statement rather than once per candidate row.
-- Only rewrite policies that use an unwrapped auth.uid() expression; policies
-- already using (SELECT auth.uid()) are left untouched.
do $policy_hardening$
declare
  p record;
  v_using text;
  v_check text;
  v_roles text;
  v_command text;
  v_create text;
begin
  for p in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (
          qual is not null
          and lower(qual) like '%auth.uid()%'
          and lower(qual) not like '%select auth.uid()%'
        )
        or
        (
          with_check is not null
          and lower(with_check) like '%auth.uid()%'
          and lower(with_check) not like '%select auth.uid()%'
        )
      )
  loop
    v_using := p.qual;
    v_check := p.with_check;

    if v_using is not null then
      v_using := replace(v_using, 'auth.uid()', '(select auth.uid())');
    end if;
    if v_check is not null then
      v_check := replace(v_check, 'auth.uid()', '(select auth.uid())');
    end if;

    select string_agg(
      case when role_name = 'public' then 'public' else quote_ident(role_name) end,
      ', '
    )
    into v_roles
    from unnest(p.roles) as r(role_name);

    v_command := p.cmd;

    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);

    v_create := format(
      'create policy %I on %I.%I as %s for %s to %s',
      p.policyname,
      p.schemaname,
      p.tablename,
      lower(p.permissive),
      v_command,
      coalesce(v_roles, 'public')
    );

    if v_using is not null then
      v_create := v_create || format(' using (%s)', v_using);
    end if;
    if v_check is not null then
      v_create := v_create || format(' with check (%s)', v_check);
    end if;

    execute v_create;
  end loop;
end;
$policy_hardening$;

-- 4) Cover foreign-key lookups identified by the Supabase performance advisor.
create index if not exists idx_bug_reports_resolved_by_fk
  on public.bug_reports (resolved_by);
create index if not exists idx_community_member_roles_assigned_by_fk
  on public.community_member_roles (assigned_by);
create index if not exists idx_community_message_comments_author_id_fk
  on public.community_message_comments (author_id);
create index if not exists idx_community_professor_applications_reviewed_by_fk
  on public.community_professor_applications (reviewed_by);
create index if not exists idx_community_reactions_user_id_fk
  on public.community_reactions (user_id);
create index if not exists idx_english_question_sets_created_by_fk
  on public.english_question_sets (created_by);
create index if not exists idx_english_question_sets_reviewed_by_fk
  on public.english_question_sets (reviewed_by);
create index if not exists idx_game_chest_cycle_claims_session_id_fk
  on public.game_chest_cycle_claims (session_id);
create index if not exists idx_institution_verification_documents_request_id_fk
  on public.institution_verification_documents (verification_request_id);
create index if not exists idx_institution_verification_requests_representative_user_id_fk
  on public.institution_verification_requests (representative_user_id);
create index if not exists idx_institution_verification_requests_reviewed_by_fk
  on public.institution_verification_requests (reviewed_by);
create index if not exists idx_lesson_media_assets_updated_by_fk
  on public.lesson_media_assets (updated_by);
create index if not exists idx_lesson_questions_updated_by_fk
  on public.lesson_questions (updated_by);
create index if not exists idx_orby_knowledge_documents_uploaded_by_fk
  on public.orby_knowledge_documents (uploaded_by);
create index if not exists idx_orby_voice_turn_receipts_user_id_fk
  on public.orby_voice_turn_receipts (user_id);
create index if not exists idx_user_badges_badge_id_fk
  on public.user_badges (badge_id);
create index if not exists idx_user_characters_character_id_fk
  on public.user_characters (character_id);

-- 5) Remove one redundant, standalone unique index; the primary key already
-- provides the same uniqueness guarantee for (conversation_id,user_id,turn_id).
drop index if exists public.orby_voice_turn_receipts_turn_unique;

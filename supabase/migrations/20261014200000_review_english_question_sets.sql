-- Admin-reviewed activation for English question groups.
-- Generated questions stay inactive until the complete stimulus group is approved.
create or replace function public.review_english_question_set_atomic(
  p_stimulus_id uuid,
  p_activate boolean
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_stimulus public.question_stimuli%rowtype;
  v_part integer;
  v_expected_format text;
  v_count integer;
  v_min_position integer;
  v_max_position integer;
  v_distinct_positions integer;
  v_distinct_parts integer;
  v_marker_count integer;
  v_answer_count integer;
begin
  if p_stimulus_id is null or p_activate is null then
    raise exception 'INVALID_REVIEW_PAYLOAD';
  end if;

  select *
    into v_stimulus
  from public.question_stimuli
  where id = p_stimulus_id
  for update;

  if not found then
    raise exception 'ENGLISH_STIMULUS_NOT_FOUND';
  end if;

  select
    count(*),
    min(stimulus_position),
    max(stimulus_position),
    count(distinct stimulus_position),
    count(distinct english_part),
    min(english_part)
  into
    v_count,
    v_min_position,
    v_max_position,
    v_distinct_positions,
    v_distinct_parts,
    v_part
  from public.questions
  where stimulus_id = p_stimulus_id;

  if v_count <> v_stimulus.expected_question_count
     or v_min_position <> 1
     or v_max_position <> v_stimulus.expected_question_count
     or v_distinct_positions <> v_stimulus.expected_question_count
     or v_distinct_parts <> 1
     or v_part not between 1 and 7 then
    raise exception 'INCOMPLETE_ENGLISH_SET';
  end if;

  v_expected_format := case v_part
    when 1 then 'english_matching'
    when 2 then 'english_notice'
    when 3 then 'english_conversation'
    when 4 then 'english_grammar_cloze'
    when 5 then 'english_literal_reading'
    when 6 then 'english_inferential_reading'
    when 7 then 'english_lexical_cloze'
  end;

  if v_stimulus.stimulus_type is distinct from case
      when v_part = 1 then 'word_bank'
      when v_part = 2 then 'notice'
      when v_part = 3 then 'conversation'
      when v_part in (4, 7) then 'cloze_text'
      else 'reading_text'
    end
    or exists (
      select 1
      from public.questions q
      where q.stimulus_id = p_stimulus_id
        and (
          q.question_format is distinct from v_expected_format
          or q.english_part is distinct from v_part
          or q.is_active = true
          and q.question_metadata->>'review_status' = 'rejected'
        )
    ) then
    raise exception 'INVALID_ENGLISH_SET_FORMAT';
  end if;

  if v_part = 1 then
    if v_count <> 5
       or jsonb_typeof(v_stimulus.options_json) is distinct from 'array'
       or jsonb_array_length(v_stimulus.options_json) <> 7 then
      raise exception 'INVALID_ENGLISH_PART_1_SET';
    end if;

    select count(distinct q.correct_answer)
      into v_answer_count
    from public.questions q
    where q.stimulus_id = p_stimulus_id;

    if v_answer_count <> 5
       or exists (
         select 1
         from jsonb_array_elements(v_stimulus.options_json) with ordinality item(opt, ord)
         where jsonb_typeof(item.opt) is distinct from 'object'
            or upper(item.opt->>'key') is distinct from chr(64 + item.ord::integer)
            or char_length(trim(coalesce(item.opt->>'text', ''))) = 0
       )
       or exists (
         select 1
         from public.questions q
         where q.stimulus_id = p_stimulus_id
           and not exists (
             select 1
             from jsonb_array_elements(v_stimulus.options_json) item(opt)
             where upper(item.opt->>'key') = q.correct_answer
           )
       ) then
      raise exception 'INVALID_ENGLISH_PART_1_ANSWERS';
    end if;
  else
    if exists (
      select 1
      from public.questions q
      where q.stimulus_id = p_stimulus_id
        and (
          jsonb_typeof(q.options_json) is distinct from 'array'
          or jsonb_array_length(q.options_json) <> case when v_part in (2, 3, 4, 5) then 3 else 4 end
          or not exists (
            select 1
            from jsonb_array_elements(q.options_json) with ordinality item(opt, ord)
            where upper(item.opt->>'key') = q.correct_answer
              and upper(item.opt->>'key') = chr(64 + item.ord::integer)
              and char_length(trim(coalesce(item.opt->>'text', ''))) > 0
          )
        )
    ) then
      raise exception 'INVALID_ENGLISH_ITEM_OPTIONS';
    end if;
  end if;

  if v_part in (4, 7) then
    select count(*) into v_marker_count
        from regexp_matches(v_stimulus.content, '\[\[[0-9]+\]\]', 'g') as marker;

    if v_marker_count <> v_count then
      raise exception 'INVALID_ENGLISH_CLOZE_MARKERS';
    end if;

    if exists (
      select 1
      from public.questions q
      where q.stimulus_id = p_stimulus_id
        and not exists (
          select 1
          from regexp_matches(
            v_stimulus.content,
            '\\[\\[' || q.stimulus_position::text || '\\]\\]',
            'g'
          ) as marker
        )
    ) then
      raise exception 'INVALID_ENGLISH_CLOZE_POSITIONS';
    end if;
  end if;

  update public.questions
  set is_active = p_activate,
      question_metadata = question_metadata || jsonb_build_object(
        'review_status',
        case when p_activate then 'approved' else 'pending' end
      )
  where stimulus_id = p_stimulus_id;

  return jsonb_build_object(
    'success', true,
    'stimulus_id', p_stimulus_id,
    'active', p_activate,
    'question_count', v_count
  );
end;
$function$;

revoke all on function public.review_english_question_set_atomic(uuid, boolean) from public, anon, authenticated;
grant execute on function public.review_english_question_set_atomic(uuid, boolean) to service_role;

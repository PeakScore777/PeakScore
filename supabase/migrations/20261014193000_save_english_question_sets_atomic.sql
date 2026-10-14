-- Atomically publish complete English stimulus groups and their scored items.
-- Only the server's service_role may execute this function.
create or replace function public.save_english_question_sets_atomic(
  p_subject_id uuid,
  p_session integer,
  p_sets jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_subject_name text;
  v_set jsonb;
  v_stimulus jsonb;
  v_questions jsonb;
  v_question jsonb;
  v_options jsonb;
  v_stimulus_id uuid;
  v_question_ids uuid[];
  v_saved_sets jsonb := '[]'::jsonb;
  v_part integer;
  v_expected_format text;
  v_expected_stimulus_type text;
  v_content text;
  v_position integer;
  v_expected_options integer;
  v_option_count integer;
  v_key_count integer;
  v_marker_count integer;
  v_question_count integer;
  v_correct text;
  v_option_text text;
  v_option_key text;
  v_option jsonb;
  v_ordinal bigint;
  v_question_id uuid;
  v_difficulty text;
begin
  if p_subject_id is null or p_session <> 2
     or p_sets is null or jsonb_typeof(p_sets) <> 'array'
     or jsonb_array_length(p_sets) < 1 then
    raise exception 'INVALID_ENGLISH_SET_PAYLOAD';
  end if;

  select s.name
    into v_subject_name
  from public.subjects s
  where s.id = p_subject_id;

  if v_subject_name is null or lower(trim(v_subject_name)) not in ('inglés', 'ingles') then
    raise exception 'INVALID_ENGLISH_SUBJECT';
  end if;

  for v_set in select value from jsonb_array_elements(p_sets)
  loop
    v_stimulus := v_set->'stimulus';
    v_questions := v_set->'questions';

    if jsonb_typeof(v_stimulus) is distinct from 'object'
       or jsonb_typeof(v_questions) is distinct from 'array'
       or jsonb_array_length(v_questions) < 1 then
      raise exception 'INVALID_ENGLISH_STIMULUS_SET';
    end if;

    v_part := (v_questions->0->>'english_part')::integer;
    v_content := v_stimulus->>'content';
    v_question_count := jsonb_array_length(v_questions);

    if v_part is null or v_part not between 1 and 7
       or v_content is null
       or char_length(trim(v_content)) < 1
       or char_length(v_content) > 20000 then
      raise exception 'INVALID_ENGLISH_STIMULUS';
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

    v_expected_stimulus_type := case
      when v_part = 1 then 'word_bank'
      when v_part = 2 then 'notice'
      when v_part = 3 then 'conversation'
      when v_part in (4, 7) then 'cloze_text'
      else 'reading_text'
    end;

    if v_stimulus->>'stimulus_type' is distinct from v_expected_stimulus_type then
      raise exception 'INVALID_ENGLISH_STIMULUS_TYPE';
    end if;

    v_options := v_stimulus->'options_json';

    if v_part = 1 then
      v_expected_options := 7;
      if jsonb_typeof(v_options) is distinct from 'array'
         or jsonb_array_length(v_options) <> 7
         or v_question_count <> 5 then
        raise exception 'INVALID_ENGLISH_PART_1_SET';
      end if;
    else
      v_expected_options := case when v_part in (2, 3, 4, 5) then 3 else 4 end;
      if v_part in (2, 3) and v_question_count <> 1 then
        raise exception 'INVALID_ENGLISH_SINGLE_ITEM_STIMULUS';
      end if;
      if v_part in (4, 7) then
        select count(*) into v_marker_count
        from regexp_matches(v_content, '\[\[[0-9]+\]\]', 'g') as marker;

        if v_marker_count = 0 or v_marker_count <> v_question_count then
          raise exception 'INVALID_ENGLISH_CLOZE_MARKERS';
        end if;
      end if;
    end if;

    -- Validate the shared word bank, including ordered keys and non-empty text.
    if v_part = 1 then
      select count(*), count(distinct upper(item.opt->>'key'))
        into v_option_count, v_key_count
      from jsonb_array_elements(v_options) with ordinality as item(opt, ord)
      where jsonb_typeof(item.opt) = 'object'
        and upper(item.opt->>'key') = chr(64 + item.ord::integer)
        and char_length(trim(coalesce(item.opt->>'text', ''))) > 0
        and char_length(item.opt->>'text') <= 1000;

      if v_option_count <> 7 or v_key_count <> 7 then
        raise exception 'INVALID_ENGLISH_WORD_BANK';
      end if;
    end if;

    insert into public.question_stimuli (
      stimulus_type, content, expected_question_count, options_json, image_url, image_alt, metadata
    )
    values (
      v_expected_stimulus_type,
      v_content,
      v_question_count,
      case when v_part = 1 then v_options else null end,
      nullif(v_stimulus->>'image_url', ''),
      nullif(v_stimulus->>'image_alt', ''),
      case
        when jsonb_typeof(v_stimulus->'metadata') = 'object'
          then v_stimulus->'metadata'
        else '{}'::jsonb
      end
    )
    returning id into v_stimulus_id;

    v_question_ids := array[]::uuid[];

    for v_question in select value from jsonb_array_elements(v_questions)
    loop
      v_position := (v_question->>'stimulus_position')::integer;
      v_correct := upper(trim(v_question->>'correct_answer'));
      v_difficulty := coalesce(v_question->>'difficulty', 'Media');
      v_options := v_question->'options_json';

      if (v_question->>'english_part')::integer <> v_part
         or v_question->>'question_format' is distinct from v_expected_format
         or v_position is null
         or v_position < 1
         or char_length(trim(coalesce(v_question->>'question', ''))) < 1
         or char_length(v_question->>'question') > 10000
         or char_length(trim(coalesce(v_question->>'explanation', ''))) < 1
         or v_difficulty not in ('Fácil', 'Media', 'Difícil')
         or v_correct is null then
        raise exception 'INVALID_ENGLISH_QUESTION';
      end if;

      if v_part = 1 then
        if v_options is not null
           and jsonb_typeof(v_options) is distinct from 'null' then
          raise exception 'PART_1_USES_SHARED_WORD_BANK';
        end if;

        if not exists (
          select 1
          from jsonb_array_elements(v_stimulus->'options_json') item(opt)
          where upper(item.opt->>'key') = v_correct
        ) then
          raise exception 'INVALID_ENGLISH_CORRECT_ANSWER';
        end if;
      else
        if jsonb_typeof(v_options) is distinct from 'array'
           or jsonb_array_length(v_options) <> v_expected_options then
          raise exception 'INVALID_ENGLISH_OPTIONS_COUNT';
        end if;

        select count(*), count(distinct upper(item.opt->>'key'))
          into v_option_count, v_key_count
        from jsonb_array_elements(v_options) with ordinality as item(opt, ord)
        where jsonb_typeof(item.opt) = 'object'
          and upper(item.opt->>'key') = chr(64 + item.ord::integer)
          and char_length(trim(coalesce(item.opt->>'text', ''))) > 0
          and char_length(item.opt->>'text') <= 5000;

        if v_option_count <> v_expected_options or v_key_count <> v_expected_options then
          raise exception 'INVALID_ENGLISH_OPTIONS';
        end if;

        if not exists (
          select 1
          from jsonb_array_elements(v_options) item(opt)
          where upper(item.opt->>'key') = v_correct
        ) then
          raise exception 'INVALID_ENGLISH_CORRECT_ANSWER';
        end if;
      end if;

      if v_part in (4, 7) and not exists (
        select 1
        from regexp_matches(v_content, '\[\[' || v_position::text || '\]\]', 'g') as marker;
      ) then
        raise exception 'INVALID_ENGLISH_CLOZE_POSITION';
      end if;

      insert into public.questions (
        subject, subject_id, session, component, competence, difficulty,
        question, option_a, option_b, option_c, option_d, correct_answer,
        explanation, context_text, requires_visual, visual_type,
        visual_description, visual_data, chart_data, source, is_active,
        question_format, english_part, stimulus_id, stimulus_position,
        options_json, question_metadata
      )
      values (
        v_subject_name, p_subject_id, p_session,
        'Inglés - Parte ' || v_part::text,
        nullif(trim(v_question->>'skill'), ''),
        v_difficulty,
        trim(v_question->>'question'),
        '', '', '', '',
        v_correct,
        trim(v_question->>'explanation'),
        null,
        false, null, null, null, null,
        'AI_GENERATED', false,
        v_expected_format, v_part, v_stimulus_id, v_position,
        case when v_part = 1 then null else v_options end,
        (
          case
            when jsonb_typeof(v_question->'question_metadata') = 'object'
              then v_question->'question_metadata'
            else '{}'::jsonb
          end
        ) || jsonb_build_object('review_status', 'pending')
      )
      returning id into v_question_id;

      v_question_ids := array_append(v_question_ids, v_question_id);
    end loop;

    if (
      select count(distinct (q->>'stimulus_position')::integer)
      from jsonb_array_elements(v_questions) q
    ) <> v_question_count
    or (
      select min((q->>'stimulus_position')::integer)
      from jsonb_array_elements(v_questions) q
    ) <> 1
    or (
      select max((q->>'stimulus_position')::integer)
      from jsonb_array_elements(v_questions) q
    ) <> v_question_count then
      raise exception 'INVALID_ENGLISH_STIMULUS_POSITIONS';
    end if;

    v_saved_sets := v_saved_sets || jsonb_build_array(
      jsonb_build_object(
        'stimulus_id', v_stimulus_id,
        'question_ids', to_jsonb(v_question_ids),
        'english_part', v_part,
        'question_count', v_question_count
      )
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'sets', v_saved_sets,
    'question_count', (
      select coalesce(sum((item->>'question_count')::integer), 0)
      from jsonb_array_elements(v_saved_sets) item
    )
  );
end;
$function$;

revoke all on function public.save_english_question_sets_atomic(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_english_question_sets_atomic(uuid, integer, jsonb) to service_role;

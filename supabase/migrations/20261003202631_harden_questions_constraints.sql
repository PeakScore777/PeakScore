update public.questions
set difficulty = 'Media'
where difficulty = 'medium';

alter table public.questions
  drop constraint if exists questions_subject_not_blank,
  drop constraint if exists questions_question_not_blank,
  drop constraint if exists questions_options_not_blank,
  drop constraint if exists questions_session_valid,
  drop constraint if exists questions_difficulty_valid,
  drop constraint if exists questions_correct_answer_valid,
  drop constraint if exists questions_year_valid,
  drop constraint if exists questions_question_number_valid,
  drop constraint if exists questions_text_lengths;

alter table public.questions
  add constraint questions_subject_not_blank
    check (char_length(btrim(subject)) between 1 and 100),
  add constraint questions_question_not_blank
    check (char_length(btrim(question)) between 1 and 10000),
  add constraint questions_options_not_blank
    check (
      char_length(btrim(option_a)) between 1 and 5000
      and char_length(btrim(option_b)) between 1 and 5000
      and char_length(btrim(option_c)) between 1 and 5000
      and char_length(btrim(option_d)) between 1 and 5000
    ),
  add constraint questions_session_valid
    check (session in (1, 2)),
  add constraint questions_difficulty_valid
    check (
      difficulty is null
      or difficulty in ('Fácil', 'Media', 'Difícil')
    ),
  add constraint questions_correct_answer_valid
    check (correct_answer in ('A', 'B', 'C', 'D')),
  add constraint questions_year_valid
    check (
      year is null
      or (year between 1900 and extract(year from now())::integer + 1)
    ),
  add constraint questions_question_number_valid
    check (
      question_number is null
      or question_number >= 1
    ),
  add constraint questions_text_lengths
    check (
      (context_text is null or char_length(context_text) <= 20000)
      and (explanation is null or char_length(explanation) <= 20000)
      and (image_url is null or char_length(image_url) <= 2048)
      and (source is null or char_length(source) <= 500)
      and (component is null or char_length(component) <= 200)
      and (competence is null or char_length(competence) <= 200)
      and (visual_type is null or char_length(visual_type) <= 100)
      and (visual_description is null or char_length(visual_description) <= 5000)
    );

-- Additive foundation for the seven ICFES English question formats.
-- This migration intentionally preserves the legacy A-D columns and constraints.
-- Do not treat the new fields as enabled for simulation grading until the
-- generator, progress RPC, finish RPC, and UI have been updated and tested.

create table if not exists public.question_stimuli (
  id uuid primary key default gen_random_uuid(),
  stimulus_type text not null
    check (stimulus_type in (
      'word_bank',
      'notice',
      'conversation',
      'reading_text',
      'cloze_text'
    )),
  content text not null
    check (char_length(btrim(content)) between 1 and 20000),
  options_json jsonb,
  image_url text,
  image_alt text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_stimuli_options_array
    check (options_json is null or jsonb_typeof(options_json) = 'array')
);

alter table public.questions
  add column if not exists question_format text not null
    default 'legacy_multiple_choice',
  add column if not exists english_part smallint,
  add column if not exists stimulus_id uuid,
  add column if not exists stimulus_position smallint,
  add column if not exists options_json jsonb,
  add column if not exists question_metadata jsonb not null
    default '{}'::jsonb;

-- Legacy questions still require four non-empty choices. Structured English
-- items use options_json, while Part 1 uses the shared stimulus word bank.
alter table public.questions
  drop constraint if exists questions_options_not_blank;

alter table public.questions
  add constraint questions_options_not_blank
  check (
    (
      question_format = 'legacy_multiple_choice'
      and char_length(btrim(option_a)) between 1 and 5000
      and char_length(btrim(option_b)) between 1 and 5000
      and char_length(btrim(option_c)) between 1 and 5000
      and char_length(btrim(option_d)) between 1 and 5000
    )
    or (
      question_format = 'english_matching'
      and english_part = 1
      and options_json is null
      and stimulus_id is not null
    )
    or (
      question_format in (
        'english_notice',
        'english_conversation',
        'english_grammar_cloze',
        'english_literal_reading',
        'english_inferential_reading',
        'english_lexical_cloze'
      )
      and options_json is not null
      and jsonb_typeof(options_json) = 'array'
      and jsonb_array_length(options_json) between 3 and 4
    )
  );

alter table public.questions
  add constraint questions_question_format_allowed
    check (question_format in (
      'legacy_multiple_choice',
      'english_matching',
      'english_notice',
      'english_conversation',
      'english_grammar_cloze',
      'english_literal_reading',
      'english_inferential_reading',
      'english_lexical_cloze'
    )),
  add constraint questions_english_part_range
    check (english_part is null or english_part between 1 and 7),
  add constraint questions_english_format_part_consistency
    check (
      (question_format = 'legacy_multiple_choice' and english_part is null)
      or
      (question_format = 'english_matching' and english_part = 1)
      or
      (question_format = 'english_notice' and english_part = 2)
      or
      (question_format = 'english_conversation' and english_part = 3)
      or
      (question_format = 'english_grammar_cloze' and english_part = 4)
      or
      (question_format = 'english_literal_reading' and english_part = 5)
      or
      (question_format = 'english_inferential_reading' and english_part = 6)
      or
      (question_format = 'english_lexical_cloze' and english_part = 7)
    ),
  add constraint questions_options_json_array
    check (options_json is null or jsonb_typeof(options_json) = 'array'),
  add constraint questions_question_metadata_object
    check (jsonb_typeof(question_metadata) = 'object'),
  add constraint questions_english_requires_stimulus
    check (
      question_format = 'legacy_multiple_choice'
      or stimulus_id is not null
    ),
  add constraint questions_stimulus_position_valid
    check (
      (question_format = 'legacy_multiple_choice' and stimulus_position is null)
      or
      (
        question_format <> 'legacy_multiple_choice'
        and stimulus_position is not null
        and stimulus_position >= 1
      )
    );

-- Preserve A-D for every legacy/non-Part-1 question. The seven-option
-- matching bank in English Part 1 may use A-G.
alter table public.questions
  drop constraint if exists questions_correct_answer_valid;

alter table public.questions
  add constraint questions_correct_answer_valid
  check (
    correct_answer in ('A', 'B', 'C', 'D')
    or (english_part = 1 and correct_answer in ('E', 'F', 'G'))
  );

alter table public.questions
  add constraint questions_stimulus_id_fkey
  foreign key (stimulus_id)
  references public.question_stimuli(id)
  on delete set null;

create index if not exists questions_stimulus_id_idx
  on public.questions(stimulus_id)
  where stimulus_id is not null;

create index if not exists questions_english_part_format_idx
  on public.questions(english_part, question_format)
  where english_part is not null;

create unique index if not exists questions_stimulus_position_unique_idx
  on public.questions(stimulus_id, stimulus_position)
  where stimulus_id is not null and stimulus_position is not null;

alter table public.question_stimuli enable row level security;

-- A stimulus is readable only when attached to an active question visible
-- through the existing questions RLS policies. Writes remain server-side.
create policy question_stimuli_select_for_visible_questions
  on public.question_stimuli
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.questions q
      where q.stimulus_id = question_stimuli.id
        and q.is_active = true
    )
  );

create policy question_stimuli_service_role_all
  on public.question_stimuli
  for all
  to service_role
  using (true)
  with check (true);

-- Explicit privileges: RLS is not a substitute for SQL grants.
revoke all on table public.question_stimuli from anon, authenticated;
grant select on table public.question_stimuli to authenticated;
grant all on table public.question_stimuli to service_role;

comment on table public.question_stimuli is
  'Shared passages, notices, conversations, and word banks used by grouped questions.';

comment on column public.questions.question_format is
  'Rendering and validation format; legacy_multiple_choice preserves the existing A-D flow.';

comment on column public.questions.english_part is
  'ICFES English part number (1-7); null for legacy or non-English questions.';

comment on column public.questions.options_json is
  'Optional ordered options for formats that do not fit the legacy option_a-option_d columns.';

comment on column public.questions.stimulus_position is
  'One-based order of the item inside its shared stimulus group.';

-- PeakScore: base aditiva para los siete formatos de Inglés.
-- Mantiene las columnas option_a..option_d para compatibilidad con simulacros existentes.
-- Esta migración no inserta preguntas ni cambia los RPC de guardado/finalización.

create table if not exists public.question_stimuli (
  id uuid primary key default gen_random_uuid(),
  subject text not null default 'Inglés',
  stimulus_type text not null check (
    stimulus_type in ('word_bank', 'notice', 'conversation', 'reading_text', 'cloze_text')
  ),
  content text not null check (char_length(btrim(content)) between 1 and 20000),
  options jsonb,
  image_url text,
  image_alt text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_stimuli_options_array check (
    options is null or jsonb_typeof(options) = 'array'
  ),
  constraint question_stimuli_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

alter table public.questions
  add column if not exists question_format text not null default 'legacy_multiple_choice',
  add column if not exists english_part smallint,
  add column if not exists stimulus_id uuid,
  add column if not exists options_json jsonb;

alter table public.questions
  add constraint questions_question_format_check
  check (question_format in (
    'legacy_multiple_choice',
    'english_matching',
    'english_notice',
    'english_conversation',
    'english_grammar_cloze',
    'english_literal_reading',
    'english_inferential_reading',
    'english_lexical_cloze'
  ));

alter table public.questions
  add constraint questions_english_part_check
  check (english_part is null or english_part between 1 and 7);

alter table public.questions
  add constraint questions_english_format_part_check
  check (
    (english_part is null and question_format = 'legacy_multiple_choice')
    or
    (english_part = 1 and question_format = 'english_matching')
    or
    (english_part = 2 and question_format = 'english_notice')
    or
    (english_part = 3 and question_format = 'english_conversation')
    or
    (english_part = 4 and question_format = 'english_grammar_cloze')
    or
    (english_part = 5 and question_format = 'english_literal_reading')
    or
    (english_part = 6 and question_format = 'english_inferential_reading')
    or
    (english_part = 7 and question_format = 'english_lexical_cloze')
  );

alter table public.questions
  add constraint questions_options_json_array_check
  check (options_json is null or jsonb_typeof(options_json) = 'array');

alter table public.questions
  add constraint questions_stimulus_id_fkey
  foreign key (stimulus_id) references public.question_stimuli(id) on delete restrict;

-- El esquema previo solo admitía A-D. Se amplía el dominio para permitir
-- el banco A-G de la Parte 1; los formatos legacy continúan usando A-D.
alter table public.questions
  drop constraint if exists questions_correct_answer_check;

alter table public.questions
  add constraint questions_correct_answer_check
  check (correct_answer in ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

create index if not exists questions_english_part_active_idx
  on public.questions (english_part, is_active)
  where english_part is not null;

create index if not exists questions_stimulus_id_idx
  on public.questions (stimulus_id)
  where stimulus_id is not null;

create index if not exists question_stimuli_subject_type_idx
  on public.question_stimuli (subject, stimulus_type);

alter table public.question_stimuli enable row level security;

-- Los estímulos solo se pueden leer si existe al menos una pregunta asociada
-- visible para el usuario según las políticas ya vigentes de public.questions.
create policy "Read stimuli linked to visible questions"
  on public.question_stimuli
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.questions q
      where q.stimulus_id = question_stimuli.id
    )
  );

revoke all on public.question_stimuli from anon, authenticated;
grant select on public.question_stimuli to authenticated;

comment on table public.question_stimuli is
  'Estímulos compartidos por ítems de Inglés y otros formatos de lectura.';
comment on column public.questions.question_format is
  'Formato de interacción; legacy_multiple_choice conserva el renderizado existente.';
comment on column public.questions.english_part is
  'Parte ICFES de Inglés (1-7); NULL para preguntas legacy/no inglesas.';
comment on column public.questions.options_json is
  'Opciones dinámicas en JSON para formatos con 3, 4 o 7 alternativas.';

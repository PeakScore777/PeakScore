ALTER TABLE public.english_question_sets
  ADD COLUMN IF NOT EXISTS example_prompt text,
  ADD COLUMN IF NOT EXISTS example_options jsonb,
  ADD COLUMN IF NOT EXISTS example_answer text;
ALTER TABLE public.english_question_sets
  ADD CONSTRAINT english_question_sets_example_answer_valid
  CHECK (example_answer IS NULL OR example_answer = ANY (ARRAY['A','B','C','D','E','F','G','H']::text[]));
ALTER TABLE public.english_question_sets
  ADD CONSTRAINT english_question_sets_example_options_array
  CHECK (example_options IS NULL OR jsonb_typeof(example_options) = 'array');

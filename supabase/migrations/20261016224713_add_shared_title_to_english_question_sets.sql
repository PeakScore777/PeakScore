ALTER TABLE public.english_question_sets
ADD COLUMN IF NOT EXISTS shared_title text;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'english_question_sets_shared_title_length'
      AND conrelid = 'public.english_question_sets'::regclass
  ) THEN
    ALTER TABLE public.english_question_sets
      ADD CONSTRAINT english_question_sets_shared_title_length
      CHECK (shared_title IS NULL OR char_length(shared_title) <= 200);
  END IF;
END
$migration$;

COMMENT ON COLUMN public.english_question_sets.shared_title
IS 'Optional title for a shared English reading passage, displayed separately from the passage body.';

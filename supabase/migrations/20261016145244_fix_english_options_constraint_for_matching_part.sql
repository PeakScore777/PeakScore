ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS questions_english_options_valid;

ALTER TABLE public.questions
ADD CONSTRAINT questions_english_options_valid
CHECK (
  english_options IS NULL
  OR CASE
    WHEN jsonb_typeof(english_options) <> 'array' THEN false
    WHEN english_part = 1 THEN jsonb_array_length(english_options) = 0
    WHEN english_part = 2 THEN jsonb_array_length(english_options) = 3
    ELSE jsonb_array_length(english_options) BETWEEN 3 AND 4
  END
);

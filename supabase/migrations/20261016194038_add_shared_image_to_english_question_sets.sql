-- Store a single uploaded passage image for English Part 4 cloze sets.
ALTER TABLE public.english_question_sets
  ADD COLUMN IF NOT EXISTS shared_image_url text;

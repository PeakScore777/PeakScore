CREATE UNIQUE INDEX IF NOT EXISTS questions_english_set_position_unique_idx ON public.questions (english_set_id, english_position) WHERE english_set_id IS NOT NULL AND english_position IS NOT NULL;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_correct_answer_valid;
ALTER TABLE public.questions ADD CONSTRAINT questions_correct_answer_valid CHECK (
  CASE
    WHEN english_part = 1 THEN correct_answer = ANY (ARRAY['A','B','C','D','E','F','G']::bpchar[])
    WHEN english_part IN (2,3,4,5) THEN correct_answer = ANY (ARRAY['A','B','C']::bpchar[])
    WHEN english_part IN (6,7) THEN correct_answer = ANY (ARRAY['A','B','C','D']::bpchar[])
    ELSE correct_answer = ANY (ARRAY['A','B','C','D']::bpchar[])
  END
);

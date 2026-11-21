ALTER TABLE public.english_question_sets
  ADD COLUMN IF NOT EXISTS booklet_format text NOT NULL DEFAULT 'saber11_2026';

ALTER TABLE public.english_question_sets
  DROP CONSTRAINT IF EXISTS english_question_sets_booklet_format_check;

ALTER TABLE public.english_question_sets
  ADD CONSTRAINT english_question_sets_booklet_format_check
  CHECK (booklet_format IN ('saber11_2026', 'historical', 'custom_review'));

COMMENT ON COLUMN public.english_question_sets.booklet_format IS
'Question-numbering profile: saber11_2026 = Part 4 without B and Part 7A/7B; historical = Part 4A/4B and one Part 7A; custom_review = legacy draft with numbering requiring manual correction.';

UPDATE public.english_question_sets
SET booklet_format = 'historical'
WHERE part = 4 AND title ~* '^4B\s*[·—-]';

UPDATE public.english_question_sets
SET booklet_format = 'custom_review'
WHERE part = 7 AND title ~* '^7A\s*[·—-]' AND title ILIKE '%Book Exchange%';

UPDATE public.english_question_sets
SET booklet_format = 'saber11_2026',
    title = regexp_replace(title, '^4A\s*[·—-]\s*', '', 'i')
WHERE part = 4 AND title ~* '^4A\s*[·—-]';

UPDATE public.english_question_sets
SET booklet_format = 'saber11_2026'
WHERE part IN (1, 2, 3, 5, 6)
   OR (part = 7 AND title ~* '^7B\s*[·—-]');

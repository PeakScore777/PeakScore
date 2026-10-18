-- PeakScore: intro inicial y preferencias de ruta.
-- Los perfiles que ya existían antes de desplegar la cinemática se marcan
-- como completados para que el nuevo flujo no interrumpa a usuarios actuales.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS intro_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS school_grade text,
  ADD COLUMN IF NOT EXISTS icfes_experience text,
  ADD COLUMN IF NOT EXISTS learning_goal text,
  ADD COLUMN IF NOT EXISTS math_confidence text;

UPDATE public.profiles
SET intro_completed_at = now()
WHERE intro_completed_at IS NULL;

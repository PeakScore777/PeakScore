update public.game_questions
set options=jsonb_set(
  options,
  '{3}',
  to_jsonb('Presentar la fotografía como prueba definitiva que permite reemplazar los testimonios escritos.'::text),
  false
)
where id='300171d4-4834-4e94-ac6d-c9f2b3b172d7';

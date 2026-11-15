alter table public.game_questions
  add column if not exists display_order integer;

create index if not exists game_questions_archivo_reading_order_idx
  on public.game_questions (game_key, status, passage_id, display_order, created_at);

update public.game_questions q
set display_order = case
  when q.clue like 'Al comparar el registro de equipajes%' then 1
  when q.clue like 'En la fotografía de la estación ferroviaria%' then 2
  when q.clue like 'Julián Herrera afirmó en su declaración%' then 3
  when q.clue like 'En el texto El caso de las 9:17%' then 4
  when q.clue like 'Al finalizar la investigación%' then 5
  else q.display_order
end
where q.passage_id in (
  select p.id from public.game_reading_passages p
  where p.game_key = 'archivo-oculto' and p.title = 'El caso de las 9:17'
)
and q.display_order is null;

update public.game_questions q
set clue = 'Julián Herrera declaró que después de las 9:30 p. m. no hubo movimientos en la zona de equipajes. Sin embargo, el registro anota un traslado a las 9:40 p. m., firmado por M. Rojas. ¿Qué procedimiento permitiría evaluar mejor la confiabilidad de su declaración?'
where q.passage_id in (
  select p.id from public.game_reading_passages p
  where p.game_key = 'archivo-oculto' and p.title = 'El caso de las 9:17'
)
and q.clue like 'Julián Herrera afirmó en su declaración%';

update public.game_questions q
set clue = 'El texto presenta la desaparición del registro, expone la declaración del encargado y luego contrasta documentos y fotografías. ¿Con qué propósito organiza así la información?'
where q.passage_id in (
  select p.id from public.game_reading_passages p
  where p.game_key = 'archivo-oculto' and p.title = 'El caso de las 9:17'
)
and q.clue like 'En el texto El caso de las 9:17%';

update public.game_questions q
set clue = 'La fotografía muestra el reloj a las 9:17 p. m.; el registro anota un traslado a las 9:40 p. m. y Herrera niega movimientos después de las 9:30 p. m. ¿Qué conclusión integra mejor estas tres evidencias?'
where q.passage_id in (
  select p.id from public.game_reading_passages p
  where p.game_key = 'archivo-oculto' and p.title = 'El caso de las 9:17'
)
and q.clue like 'Al finalizar la investigación%';

update public.game_reading_passages p
set content_blocks = jsonb_set(
  p.content_blocks,
  '{2,text}',
  to_jsonb(replace(
    p.content_blocks->2->>'text',
    'No obstante, un empleado de mantenimiento aseguró haber visto movimiento de maletas poco después de las 9:40 de la noche.',
    'Los investigadores consultaron también el libro de equipajes, un documento distinto del registro de pasajeros desaparecido. Allí aparece una anotación de traslado a las 9:40 p. m. Además, un empleado de mantenimiento aseguró haber visto movimiento de maletas poco después de las 9:30 de la noche.'
  )),
  false
)
where p.game_key = 'archivo-oculto'
  and p.title = 'El caso de las 9:17'
  and p.content_blocks->2->>'text' like '%poco después de las 9:40 de la noche%';

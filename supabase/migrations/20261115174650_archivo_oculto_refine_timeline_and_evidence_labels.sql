update public.game_reading_passages
set content_blocks=jsonb_set(
  content_blocks,
  '{2,text}',
  to_jsonb('Al principio, la declaración del encargado parecía ofrecer una explicación: según Herrera, la zona había quedado cerrada antes de las 9:30 p. m. Sin embargo, un empleado de mantenimiento afirmó haber visto movimiento de maletas poco después de esa hora. Los investigadores consultaron también el libro de equipajes, un documento distinto del registro de pasajeros desaparecido. Allí encontraron la entrada 4589, que anota un traslado de equipaje a las 9:40 p. m. y registra a M. Rojas en la columna «Responsable». La observación del empleado y el asiento del libro son compatibles y apuntan a que hubo actividad después del cierre; ambos ponen en duda la declaración de Herrera. Sin embargo, no permiten asegurar que se refieran al mismo traslado ni identificar por sí solos a quien movió el equipaje. La investigación pasó entonces de buscar el libro desaparecido a comparar la confiabilidad de cada fuente.'::text),
  false
)
where id='cc29ff13-30bc-4fee-9033-6669b1c78041';

update public.game_reading_passages
set source_label='Caso ficticio · Recreación para práctica · PeakScore'
where id='cc29ff13-30bc-4fee-9033-6669b1c78041';

update public.game_questions
set options=jsonb_set(
  options,
  '{1}',
  to_jsonb('La imagen ofrece una pista visual, pero no permite comprobar la hora real de la toma ni la exactitud del reloj.'::text),
  false
),
explanation='La imagen permite observar la estación, las personas y el reloj que parece señalar las 9:17 p. m. Sin embargo, como es una recreación visual del caso y no una fotografía histórica original, funciona como una pista narrativa para el ejercicio, no como prueba auténtica de la hora del acontecimiento. Incluso dentro del caso, la hora visible no demuestra por sí sola cuándo se tomó la imagen ni que el reloj estuviera bien ajustado. Por eso debe contrastarse con las demás fuentes.'
where id='ed91caea-2bbd-4129-b6b1-8faaad953ebc';
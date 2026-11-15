update public.game_reading_passages
set reading_type='Expediente narrativo',
    source_label='Caso ficticio · Evidencias recreadas para práctica de Lectura Crítica · PeakScore',
    content_blocks=jsonb_set(
      jsonb_set(
        content_blocks,
        '{1,alt}',
        to_jsonb('Recreación visual de la fotografía de una estación ferroviaria ficticia. El reloj parece marcar las 9:17 p. m.'::text),
        false
      ),
      '{1,caption}',
      to_jsonb('Recreación visual de una fotografía del caso ficticio. El reloj parece marcar las 9:17 p. m.; la fecha y la hora de la toma deben verificarse dentro del expediente.'::text),
      false
    )
where id='cc29ff13-30bc-4fee-9033-6669b1c78041';

update public.game_evidence_assets
set description='Recreación visual de un libro de equipajes ficticio, fechado el 21 de abril de 1934. La entrada 4589 registra un traslado a las 21:40 y anota a M. Rojas en la columna «Responsable»; no demuestra por sí sola quién movió el equipaje.'
where id='a2cb343b-08fe-4d13-b850-76065a8312d3';

update public.game_evidence_assets
set description='Recreación visual de una declaración ficticia, fechada el 22/04/1934 y atribuida a Julián Herrera. Afirma que cerró el acceso antes de las 9:30 p. m. y que después no hubo ingresos ni movimientos de equipaje.'
where id='9b15694c-92c2-4189-8067-7cceb2daba40';

update public.game_questions
set clue='En la fotografía recreada de la estación, el reloj parece marcar las 9:17 p. m. Teniendo en cuenta las limitaciones de las fotografías como fuentes de información, ¿cuál interpretación resulta más adecuada?',
    explanation='La imagen permite observar la estación, las personas y el reloj que parece señalar las 9:17 p. m. Sin embargo, como es una recreación visual del caso y no una fotografía histórica original, funciona como una pista narrativa para el ejercicio, no como prueba auténtica de la hora del acontecimiento. Incluso dentro del caso, la hora visible no demuestra por sí sola cuándo se tomó la imagen ni que el reloj estuviera bien ajustado. Por eso debe contrastarse con las demás fuentes.',
    hint='Distingue entre lo que la imagen representa y lo que realmente puede demostrar. ¿Una hora dibujada en un reloj basta para fijar el momento de un acontecimiento?'
where id='ed91caea-2bbd-4129-b6b1-8faaad953ebc';
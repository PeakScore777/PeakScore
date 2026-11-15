-- Keep the question order aligned with the evidence the student sees on each spread.
update public.game_questions q
set display_order = case
  when q.clue like 'En la fotografía de la estación ferroviaria%' then 1
  when q.clue like 'Al comparar el registro de equipajes%' then 2
  when q.clue like 'Julián Herrera declaró que después%' then 3
  when q.clue like 'El texto presenta la desaparición del registro%' then 4
  when q.clue like 'La fotografía muestra el reloj a las 9:17%' then 5
  else q.display_order
end
where q.passage_id in (
  select p.id from public.game_reading_passages p
  where p.game_key='archivo-oculto' and p.title='El caso de las 9:17'
);

update public.game_evidence_assets e
set display_after_paragraph = 3
where e.title='Declaración del encargado'
  and e.passage_id in (
    select p.id from public.game_reading_passages p
    where p.game_key='archivo-oculto' and p.title='El caso de las 9:17'
  );

-- Expand the source-evaluation theory and add a separate method paragraph.
-- The last paragraph applies those criteria to the three pieces of evidence.
update public.game_reading_passages p
set content_blocks =
  jsonb_set(
    jsonb_insert(
      jsonb_set(p.content_blocks,'{4,text}',to_jsonb($p4$El caso demuestra que reconstruir un acontecimiento histórico exige comparar fuentes y no depender de una sola versión. La fotografía aporta información visual; el testimonio, una perspectiva personal; y los documentos, datos que pueden contrastarse. Cada fuente tiene posibilidades y límites. Por eso, la investigación no consiste en decidir rápidamente quién miente, sino en establecer qué evidencias respaldan cada afirmación y cuáles aún necesitan verificarse. Para valorar su confiabilidad también es necesario examinar la procedencia: quién produjo cada documento, cuándo lo hizo, con qué propósito y si se conserva el original. La fecha escrita en una hoja no garantiza por sí sola que se haya elaborado ese mismo día, igual que una firma permite reconocer al declarante, pero no demuestra automáticamente la exactitud de su recuerdo.$p4$::text),false),
      '{5}',
      jsonb_build_object('type','paragraph','text',$p4b$El contraste debe considerar coincidencias y diferencias sin convertir una sospecha en una acusación. Un registro puede dejar constancia de una operación sin identificar a la persona que la ejecutó; un testimonio puede describir lo que alguien recuerda, aunque su memoria sea incompleta; una fotografía muestra lo que quedó dentro del encuadre, pero no necesariamente lo ocurrido antes o después. Por eso se deben buscar fuentes independientes, revisar fechas, firmas y condiciones de conservación, y distinguir entre un hecho observado, una inferencia razonable y una hipótesis que aún requiere pruebas. Esa distinción es fundamental para construir una explicación sustentada.$p4b$::text),
      false
    ),
    '{6,text}',
    to_jsonb($p5$Para evaluar el expediente conviene distinguir entre lo que cada fuente muestra y lo que permite concluir. La fotografía registra la apariencia del lugar y la hora visible en el reloj; el libro de equipajes deja constancia de un traslado; la declaración recoge la versión del encargado. Al contrastarlas se puede reconocer una inconsistencia, pero no identificar automáticamente a quien movió la maleta ni a quien hizo desaparecer el libro de pasajeros. Una conclusión responsable debe señalar qué está respaldado y qué sigue siendo una hipótesis pendiente de verificación. En este caso, las 9:17 funcionan como un indicio visual y no como certificación de la hora del hecho; la anotación de las 21:40 contradice la afirmación de que no hubo movimientos después de las 21:30. Antes de atribuir responsabilidades, habría que comprobar el original del registro, la firma, el reloj y el origen de la fotografía, además de contrastar otros testimonios. Hasta entonces, la desaparición del libro de pasajeros sigue siendo un misterio abierto.$p5$::text),
    false
  )
where p.game_key='archivo-oculto'
  and p.title='El caso de las 9:17'
  and jsonb_array_length(p.content_blocks)=6
  and p.content_blocks->4->>'text' like 'El caso demuestra que reconstruir%'
  and p.content_blocks->5->>'text' like 'Para evaluar el expediente conviene distinguir%';

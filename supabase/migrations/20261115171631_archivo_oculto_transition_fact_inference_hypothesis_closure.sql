-- Add the transition before the signed statement, label the source-analysis
-- framework, and close the reading with an evidence-based open question.
update public.game_reading_passages p
set content_blocks = jsonb_insert(
  jsonb_insert(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          p.content_blocks,
          '{4,text}',
          to_jsonb($p4$El caso demuestra que reconstruir un acontecimiento histórico exige comparar fuentes y no depender de una sola versión. La fotografía aporta información visual; el testimonio, una perspectiva personal; y los documentos, datos que pueden contrastarse. Cada fuente tiene posibilidades y límites. Para valorar su confiabilidad también es necesario examinar su procedencia: quién produjo cada documento, cuándo lo hizo, con qué propósito y si se conserva el original. La fecha escrita en una hoja no garantiza por sí sola que se haya elaborado ese mismo día, igual que una firma permite reconocer al declarante, pero no demuestra automáticamente la exactitud de su recuerdo.$p4$::text),
          false
        ),
        '{5,text}',
        to_jsonb($p4b$Al analizar una investigación conviene separar tres niveles. Un hecho es un dato que una fuente registra directamente; por ejemplo, el libro de equipajes contiene una anotación de traslado a las 9:40 p. m. Una inferencia es una interpretación razonable que relaciona varios datos; por ejemplo, esa anotación contradice la afirmación de que no hubo movimientos después de las 9:30. Una hipótesis es una explicación posible que todavía necesita pruebas; por ejemplo, suponer quién realizó el traslado o quién hizo desaparecer el registro de pasajeros. Confundir estos niveles lleva a presentar sospechas como si fueran certezas.$p4b$::text),
        false
      ),
      '{6,text}',
      to_jsonb($p5$Al reunir las tres evidencias se reconoce una inconsistencia: el reloj de la fotografía marca las 9:17 p. m., el libro de equipajes registra un traslado a las 9:40 y la declaración de Herrera niega movimientos después de las 9:30. Sin embargo, ninguna de estas fuentes demuestra por sí sola quién movió la maleta ni quién hizo desaparecer el libro de pasajeros. Antes de atribuir responsabilidades habría que comprobar el original del registro, la firma, el funcionamiento del reloj, el origen de la fotografía y otros testimonios. El expediente termina con una contradicción documentada, no con un culpable demostrado. La investigación queda abierta: ¿qué prueba solicitarías primero para avanzar sin convertir una sospecha en una conclusión?$p5$::text),
      false
    ),
    '{3}',
    jsonb_build_object(
      'type','paragraph',
      'text',$transition$Para comprobar si la versión del encargado coincide con los registros, los investigadores recuperaron una declaración escrita y firmada por él al día siguiente. Este documento permite examinar con más detalle qué afirmó, cuándo lo declaró y cómo se relaciona su versión con la anotación de las 9:40 p. m. que aparece en el libro de equipajes.$transition$::text
    ),
    false
  ),
  '{6}',
  jsonb_build_object('type','subheading','text','HECHO, INFERENCIA E HIPÓTESIS'),
  false
)
where p.game_key = 'archivo-oculto'
  and p.title = 'El caso de las 9:17'
  and jsonb_array_length(p.content_blocks) = 7
  and p.content_blocks->3->>'text' like 'Sin embargo, la fotografía tampoco%'
  and p.content_blocks->4->>'text' like 'El caso demuestra que reconstruir%';

update public.game_evidence_assets e
set display_after_paragraph = 4
where e.title = 'Declaración del encargado'
  and e.passage_id in (
    select p.id
    from public.game_reading_passages p
    where p.game_key = 'archivo-oculto'
      and p.title = 'El caso de las 9:17'
  );

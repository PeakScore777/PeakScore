-- Correct the timeline and distinguish corroborating sources from the statement they challenge.
update public.game_reading_passages p
set content_blocks = jsonb_build_array(
  jsonb_build_object('type','paragraph','text',$p1$El 21 de abril de 1934, una pequeña estación ferroviaria fue escenario de un misterio que nunca quedó completamente esclarecido: la desaparición del libro de registro de pasajeros. El encargado, Julián Herrera, declaró que había cerrado la zona de equipajes antes de las 9:30 p. m. y que después de esa hora no hubo ingresos ni movimientos de equipaje. Sin embargo, entre los documentos recuperados apareció una fotografía de la estación en la que el reloj parece marcar las 9:17 p. m. y varias personas se encuentran cerca de esa zona. La imagen abrió nuevas preguntas: ¿se tomó realmente esa noche?, ¿el reloj funcionaba correctamente?, ¿qué ocurrió después del cierre?$p1$::text),
  jsonb_build_object('type','image','url','https://avmywztnsrnyjhvbaiio.supabase.co/storage/v1/object/public/question-images/archivo-oculto/a72e2869-97d5-4dcc-9636-4afabc229879/9d880ca6-5726-4f25-bc61-63e30b562e29.png','alt','Fotografía recuperada de la estación ferroviaria. El reloj parece marcar las 9:17 p. m. y varias personas aparecen cerca de la zona de equipajes.','caption','Fotografía recuperada en el expediente. El reloj parece marcar las 9:17 p. m.; la fecha y la hora de la toma todavía deben verificarse.','layout','float'),
  jsonb_build_object('type','paragraph','text',$p2$Al principio, la declaración del encargado parecía ofrecer una explicación: según Herrera, la zona había quedado cerrada antes de las 9:30 p. m. Los investigadores consultaron también el libro de equipajes, un documento distinto del registro de pasajeros desaparecido. Allí encontraron la entrada 4589, que anota un traslado de equipaje a las 9:40 p. m. y registra a M. Rojas en la columna «Responsable». Además, un empleado de mantenimiento afirmó haber visto movimiento de maletas poco después de las 9:30. El asiento del libro y el recuerdo del empleado son compatibles y apuntan a que hubo actividad después del cierre; ambos ponen en duda la declaración de Herrera. Sin embargo, no permiten asegurar que se refieran al mismo traslado ni identificar por sí solos a quien movió el equipaje. La investigación pasó entonces de buscar el libro desaparecido a comparar la confiabilidad de cada fuente.$p2$::text),
  jsonb_build_object('type','paragraph','text',$p3$Para revisar esa diferencia, los investigadores recuperaron una declaración escrita y firmada por Herrera el 22 de abril, al día siguiente de la desaparición. En ella explica cómo cerró la zona y sostiene que después no hubo ingresos ni movimientos de equipaje. El documento permite examinar exactamente qué afirmó, cuándo lo declaró y si su versión coincide con el registro y con lo que observó el empleado de mantenimiento.$p3$::text),
  jsonb_build_object('type','paragraph','text',$p4$La fotografía tampoco debe considerarse una prueba definitiva. El reloj parece señalar las 9:17 p. m., pero la imagen no demuestra por sí sola cuándo fue tomada ni que el reloj estuviera bien ajustado. En fotografías antiguas podían aparecer relojes adelantados o atrasados y fechas anotadas posteriormente en los documentos. La imagen aporta pistas sobre el lugar, los objetos y las personas que aparecen dentro del encuadre, pero no permite confirmar lo ocurrido antes o después ni identificar a quien manipuló el equipaje. La hora visible debe contrastarse con otras fuentes antes de usarla para reconstruir la secuencia.$p4$::text),
  jsonb_build_object('type','paragraph','text',$p5$El caso demuestra que reconstruir un acontecimiento histórico exige comparar fuentes y no depender de una sola versión. La fotografía aporta información visual; el testimonio, una perspectiva personal; y los documentos, datos que pueden contrastarse. Cada fuente tiene posibilidades y límites. Para valorar su confiabilidad también es necesario examinar su procedencia: quién produjo cada documento, cuándo lo hizo, con qué propósito y si se conserva el original. La fecha escrita en una hoja no garantiza por sí sola que se haya elaborado ese mismo día, igual que una firma permite reconocer al declarante, pero no demuestra automáticamente la exactitud de su recuerdo.$p5$::text),
  jsonb_build_object('type','subheading','text','HECHO, INFERENCIA E HIPÓTESIS'),
  jsonb_build_object('type','paragraph','text',$p6$Un hecho es un dato que una fuente registra directamente: el libro contiene una entrada a las 9:40 p. m. y el empleado afirma haber visto movimiento de maletas poco después de las 9:30. Una inferencia relaciona esos datos: ambos son compatibles con actividad posterior al cierre y entran en tensión con la declaración de Herrera. Una hipótesis es una explicación posible que aún requiere pruebas, como suponer que M. Rojas realizó personalmente el traslado o que alguien utilizó un acceso distinto. La columna «Responsable» no demuestra por sí sola quién movió el equipaje, y la coincidencia entre el registro y el testimonio no prueba que ambos describan exactamente el mismo movimiento. En el expediente presentado, la observación del empleado solo aparece relatada en el texto; no se reproduce una declaración escrita suya. Confundir estos niveles lleva a presentar sospechas como certezas.$p6$::text),
  jsonb_build_object('type','paragraph','text',$p7$Al reunir las fuentes, el registro de las 9:40 p. m. y el recuerdo del empleado se respaldan mutuamente en un punto: hubo actividad después de las 9:30. Esa coincidencia entra en tensión con la declaración de Herrera. La fotografía aporta otra pista, pero no fija la hora del traslado ni demuestra que se tomara exactamente cuando ocurrió. Ninguna de las fuentes identifica por sí sola a quien movió el equipaje ni a quien hizo desaparecer el libro de pasajeros. Para avanzar habría que revisar los documentos originales, comprobar la procedencia de la fotografía y obtener una declaración directa del empleado de mantenimiento. El expediente no ofrece todavía un culpable: deja una pregunta abierta, ¿qué prueba permitiría establecer quién realizó el traslado sin confundir el nombre anotado como responsable con la persona que movió la maleta?$p7$::text)
)
where p.game_key='archivo-oculto'
  and p.title='El caso de las 9:17'
  and p.id='cc29ff13-30bc-4fee-9033-6669b1c78041';

update public.game_evidence_assets
set description='Libro ferroviario del 21 de abril de 1934. La entrada 4589 registra un traslado a las 21:40 y anota a M. Rojas en la columna «Responsable»; no demuestra por sí sola quién movió el equipaje.'
where id='a2cb343b-08fe-4d13-b850-76065a8312d3';

update public.game_evidence_assets
set description='Declaración firmada por Julián Herrera el 22/04/1934. Afirma que cerró el acceso antes de las 9:30 p. m. y que después no hubo ingresos ni movimientos de equipaje.'
where id='9b15694c-92c2-4189-8067-7cceb2daba40';

update public.game_questions
set clue='El libro de equipajes registra un traslado a las 9:40 p. m. y un empleado de mantenimiento afirma haber visto movimiento de maletas poco después de las 9:30. Ambos datos son compatibles, pero contrastan con la declaración de Julián Herrera, quien aseguró que después de las 9:30 no hubo ingresos ni movimientos de equipaje. ¿Qué conclusión está mejor respaldada por el expediente?',
    options=jsonb_build_array(
      'El registro demuestra que Julián Herrera realizó personalmente el traslado de la maleta.',
      'El testimonio del empleado identifica a M. Rojas como la persona que movió el equipaje.',
      'El registro y el testimonio del empleado se respaldan en que hubo actividad después de las 9:30; esto pone en duda la versión de Herrera, pero no identifica por sí solo a quien movió el equipaje.',
      'La fotografía confirma que el traslado se realizó exactamente a las 9:40 p. m.'
    ),
    answer=2,
    explanation='El libro consigna un traslado a las 9:40 p. m. y el empleado recuerda haber visto movimiento de maletas poco después de las 9:30. Son datos compatibles que apuntan a actividad después del cierre y ponen en duda la declaración de Herrera. Sin embargo, el registro solo anota a M. Rojas en la columna «Responsable» y el empleado no identifica a quien vio; por eso, todavía no se puede afirmar quién movió el equipaje.',
    hint='Primero identifica qué dos fuentes coinciden en que hubo actividad después de las 9:30. Después pregúntate si esas fuentes permiten reconocer a la persona que movió la maleta.'
where id='b6f82fb1-b066-43dc-baa8-5febfccaaf04';

update public.game_questions
set clue='En su declaración firmada, Herrera sostuvo que después de las 9:30 p. m. no hubo ingresos ni movimientos de equipaje. Sin embargo, el libro registra un traslado a las 9:40 y un empleado afirma haber visto movimiento de maletas poco después de las 9:30. ¿Qué procedimiento permitiría evaluar con mayor rigor la confiabilidad de la declaración?',
    options=jsonb_build_array(
      'Aceptar la declaración porque fue firmada por el encargado oficial de la estación.',
      'Descartar el testimonio porque cualquier contradicción demuestra que una persona está mintiendo.',
      'Comparar la declaración con el libro original, entrevistar por separado al empleado y verificar la autenticidad y procedencia de los documentos.',
      'Considerar que M. Rojas realizó el traslado porque su nombre aparece en la columna «Responsable».'
    ),
    answer=2,
    explanation='El registro y el relato del empleado son compatibles entre sí, pero entran en tensión con lo que declaró Herrera. Para evaluar la confiabilidad de cada fuente hay que revisar el libro y la declaración originales, verificar su autenticidad, ampliar el testimonio del empleado y buscar información independiente. La diferencia entre las fuentes genera una pregunta que debe investigarse; no demuestra automáticamente que alguien mienta ni identifica a quien movió la maleta.',
    hint='No basta con que un documento tenga una firma. Piensa qué comprobaciones independientes permitirían contrastar las tres versiones.'
where id='8d3d1232-712d-485d-b144-edf6962b31ca';

update public.game_questions
set clue='El texto presenta la desaparición del registro, expone la versión del encargado y luego incorpora el libro de equipajes, la observación de un empleado y una fotografía. ¿Con qué propósito organiza así la información?',
    explanation='El texto presenta primero el misterio y luego incorpora fuentes que pueden confirmarse o ponerse en tensión unas con otras. El registro y el empleado coinciden en que hubo actividad después de las 9:30, mientras la declaración de Herrera afirma lo contrario. La fotografía añade una pista visual que también tiene límites. El propósito es guiar al lector para que compare las fuentes y construya una conclusión sustentada, sin recibir una acusación anticipada.'
where id='300171d4-4834-4e94-ac6d-c9f2b3b172d7';

update public.game_questions
set clue='El expediente reúne cuatro fuentes: una fotografía cuyo reloj parece marcar las 9:17 p. m.; un libro de equipajes que registra un traslado a las 9:40; un empleado que afirma haber visto movimiento de maletas poco después de las 9:30; y la declaración de Herrera, que niega ingresos y movimientos después del cierre. ¿Qué conclusión integra mejor la información sin exceder lo que las fuentes permiten afirmar?',
    options=jsonb_build_array(
      'Julián Herrera es responsable de la desaparición del registro porque su declaración está en tensión con otras fuentes.',
      'El traslado ocurrió exactamente a las 9:17 p. m., pues la fotografía constituye la evidencia visual más cercana al acontecimiento.',
      'El registro y el empleado se respaldan en que hubo actividad después de las 9:30, lo que pone en duda la declaración de Herrera; la fotografía aporta contexto, pero hacen falta verificaciones para establecer quién realizó el traslado.',
      'El libro de equipajes debe considerarse falso porque contradice la declaración firmada por el encargado de la estación.'
    ),
    answer=2,
    explanation='El registro de las 9:40 y el relato del empleado coinciden en señalar actividad después del cierre. Ese punto entra en tensión con la declaración de Herrera. La fotografía aporta una pista temporal, pero no demuestra cuándo se tomó ni fija la hora del traslado. Además, el nombre de M. Rojas en la columna «Responsable» no prueba por sí solo quién movió el equipaje. La conclusión rigurosa reconoce la inconsistencia y señala qué debe verificarse antes de atribuir responsabilidades.',
    hint='Integra las cuatro fuentes, pero distingue lo que se respalda entre sí de lo que aún no puede demostrarse.'
where id='0c26f400-2fe9-42a7-a5c0-75a1a813f124';
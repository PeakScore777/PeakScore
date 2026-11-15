-- Archivo Oculto · Expediente 002: El último testigo.
-- Original fictional reading and five ICFES-style Critical Reading questions.
-- Idempotent by passage title and question display order.

do $migration$
declare
  v_passage_id uuid;
begin
  select id into v_passage_id
  from public.game_reading_passages
  where game_key = 'archivo-oculto'
    and title = 'El último testigo'
  order by created_at desc
  limit 1;

  if v_passage_id is null then
    insert into public.game_reading_passages (
      game_key, title, reading_type, source_label, content_blocks, status
    ) values (
      'archivo-oculto',
      'El último testigo',
      'Crónica de investigación · Lectura crítica',
      'Expediente ficticio de práctica · PeakScore',
      jsonb_build_array(
        jsonb_build_object(
          'type','subheading',
          'text','EL DOCUMENTO QUE NADIE ADMITE HABER VISTO'
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p1$A las 7:30 de la mañana del jueves, el municipio ficticio de San Jerónimo del Río debía iniciar una audiencia pública sobre la construcción de una represa. Antes de la reunión, la Secretaría de Planeación tenía que presentar el informe original de impacto hídrico: un documento de 86 páginas que reunía mediciones del caudal, mapas de las zonas inundables y observaciones de las comunidades ribereñas. A las 6:50, cuando la funcionaria encargada abrió el archivador, encontró la carpeta, pero no el informe firmado. En su lugar había una copia incompleta, sin las páginas donde aparecían las mediciones de la quebrada La Honda. La audiencia se aplazó y el alcalde pidió revisar quién había tenido acceso al archivo durante la tarde anterior. No faltaba dinero ni otro documento. Alguien había retirado precisamente las páginas que podían cambiar la discusión sobre la represa.$p1$
        ),
        jsonb_build_object(
          'type','subheading',
          'text','CUATRO PERSONAS, CUATRO VERSIONES'
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p2$La primera persona fue Inés Salcedo, archivista de Planeación. Tenía la llave del mueble y había organizado la carpeta para la audiencia. Dijo que terminó de revisar el informe a las 6:10 p. m. y que lo dejó completo en el segundo cajón. Reconoció que había discutido con el profesor que elaboró el estudio porque este se negó a retirar del documento los nombres de algunas familias. Inés sostuvo que su preocupación era proteger datos personales, no ocultar resultados. Una compañera confirmó que la vio salir del edificio a las 6:18, aunque no podía asegurar si llevaba la carpeta que acostumbraba transportar.$p2$
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p3$El segundo fue Mateo Rincón, vigilante del turno de la tarde. Su registro de novedades indica que abrió la puerta lateral a las 6:32 para permitir el ingreso de un técnico que debía revisar una alarma. Mateo aseguró que el técnico nunca llegó y que abrió la puerta solo para comprobar el sensor desde el pasillo. También afirmó que no tenía llave del archivador. Sin embargo, el inventario de seguridad mostraba que una copia de la llave del mueble había sido entregada a vigilancia tres meses antes, aunque no estaba claro si seguía en poder del turno actual. Mateo dijo que esa copia se había devuelto, pero no encontró el comprobante.$p3$
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p4$La tercera fue Vera Pardo, periodista de una emisora comunitaria. Llevaba dos semanas solicitando el informe y había publicado una nota en la que cuestionaba la transparencia de la audiencia. A las 7:12 p. m. envió un correo a la emisora con el asunto «Las cifras que no quieren mostrar». El mensaje incluía una fotografía de una tabla de mediciones, pero no el documento completo. Vera dijo que recibió esa imagen de una fuente anónima después de salir de Planeación, a las 6:05. El registro de visitantes confirma que entró al edificio a las 5:20 y salió a las 5:58; no registra un segundo ingreso. La periodista reconoció que publicar la tabla podía darle una primicia, pero negó haber retirado páginas del archivador.$p4$
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p5$El cuarto fue Tomás Leal, ingeniero que participó en el estudio hídrico. Había advertido que algunas mediciones de La Honda no coincidían con las cifras resumidas en la presentación del proyecto. Según él, pidió corregirlas antes de la audiencia y por eso discutió con la oficina de Planeación. Tomás afirmó que entregó el informe firmado a las 4:40 p. m. y que se marchó a las 5:05. Una fotografía tomada durante una reunión vecinal lo muestra en otro barrio a las 6:25, pero la imagen no permite establecer cuánto tiempo permaneció allí ni quién la tomó. En su computador se encontró un archivo llamado «tabla_final», modificado a las 6:47 p. m.; Tomás explicó que era una copia de trabajo guardada en una carpeta sincronizada y que la hora podía corresponder a una actualización automática.$p5$
        ),
        jsonb_build_object(
          'type','subheading',
          'text','LO QUE DICEN LOS REGISTROS'
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p6$La revisión técnica encontró tres datos adicionales. Primero, el sistema de impresión registró un trabajo de 12 páginas a las 6:41 p. m. desde el equipo PL-02, ubicado en la oficina contigua al archivo. El registro identifica el equipo, pero no a la persona que lo utilizó: varios funcionarios compartían esa estación y el sistema no exigía iniciar sesión para imprimir. Segundo, la cámara del pasillo dejó de grabar entre las 6:28 y las 6:53 por una falla de alimentación eléctrica. El informe de mantenimiento confirma el corte, aunque no establece quién lo provocó. Tercero, en la papelera de reciclaje del equipo PL-02 apareció una hoja con una parte de la tabla de La Honda. El fragmento coincide con la fotografía enviada por Vera, pero no contiene fecha, firma ni marcas que permitan saber si fue impreso antes o después de que el informe desapareciera.$p6$
        ),
        jsonb_build_object(
          'type','subheading',
          'text','UNA CONCLUSIÓN NO ES UNA ACUSACIÓN'
        ),
        jsonb_build_object(
          'type','paragraph',
          'text',$p7$Las cuatro personas tenían razones para interesarse por el informe y cada versión deja una pregunta sin resolver. Inés tenía acceso habitual al archivador, pero que una persona tenga llave no demuestra que la haya usado para retirar las páginas. Mateo abrió una puerta durante el intervalo sin cámara, aunque el registro no prueba que entrara al archivo. Vera publicó una tabla antes de la audiencia, pero la fotografía pudo llegarle por otra vía. Tomás cuestionó las mediciones y conservaba una copia de trabajo, pero la hora de modificación no equivale necesariamente a la hora en que alguien abrió el archivo. El trabajo de impresión y la hoja recuperada permiten relacionar una tabla con el equipo PL-02; no identifican a quien la imprimió ni demuestran que esa persona retirara el original. Por ahora, la explicación más responsable no consiste en escoger al sospechoso con el motivo más llamativo, sino en determinar qué evidencia independiente permitiría reconstruir el recorrido de las páginas. Una investigación rigurosa separa el hecho comprobable, la inferencia que conecta varios datos y la hipótesis que todavía necesita verificación.$p7$
        )
      ),
      'published'
    )
    returning id into v_passage_id;
  end if;

  if not exists (
    select 1 from public.game_questions
    where passage_id = v_passage_id and game_key = 'archivo-oculto'
      and status = 'published'
  ) then
    insert into public.game_questions (
      game_key, subject, topic, difficulty, clue, options, answer,
      explanation, hint, status, passage_id, competency, competency_short, display_order
    ) values
    (
      'archivo-oculto','Lectura Crítica','Inferencia y tesis','media',
      '¿Cuál es el problema central que organiza la crónica?',
      jsonb_build_array(
        'Determinar cuál de los cuatro personajes tenía el cargo más alto en Planeación.',
        'Reconstruir la desaparición parcial de un informe mediante versiones y registros que aportan indicios, pero no identifican todavía a una persona responsable.',
        'Demostrar que la construcción de la represa debe cancelarse por completo.',
        'Explicar por qué los periodistas deben recibir todos los documentos antes de una audiencia.'
      ),
      1,
      'La crónica no presenta una acusación cerrada ni busca decidir el futuro de la represa. Su eje es la reconstrucción de la desaparición del informe a partir de fuentes incompletas y contradictorias. El último apartado insiste en que los indicios disponibles todavía no identifican a quien retiró las páginas.',
      'Distingue el tema general de la investigación de las opiniones particulares de los sospechosos.',
      'published',v_passage_id,
      'Comprender cómo se articulan las partes de un texto para darle sentido global',
      'Sentido global',1
    ),
    (
      'archivo-oculto','Lectura Crítica','Relación entre fuentes','media',
      '¿Qué relación puede establecerse entre la fotografía enviada por Vera y la hoja encontrada en la papelera del equipo PL-02?',
      jsonb_build_array(
        'La coincidencia demuestra que Vera imprimió personalmente la hoja y retiró el informe.',
        'La hoja prueba que Tomás entregó la tabla a la periodista antes de salir de Planeación.',
        'La coincidencia permite relacionar ambos elementos con la misma tabla, pero no establece quién la imprimió ni cómo llegó la imagen a Vera.',
        'La fotografía y la hoja son fuentes independientes que confirman la hora exacta de desaparición del informe.'
      ),
      2,
      'El texto afirma que el fragmento de la papelera coincide con la fotografía, de modo que ambos contienen parte de la misma tabla. Sin embargo, la hoja no tiene fecha, firma ni marcas de autoría. La coincidencia relaciona el contenido, pero no demuestra quién produjo cada elemento ni cómo circuló la información.',
      'Una coincidencia de contenido no equivale a una identificación de autoría.',
      'published',v_passage_id,
      'Comprender cómo se articulan las partes de un texto para darle sentido global',
      'Relación de fuentes',2
    ),
    (
      'archivo-oculto','Lectura Crítica','Inferencia y evidencia','dificil',
      'A partir de la información disponible, ¿cuál es la inferencia más sólida sobre el registro de impresión de las 6:41 p. m.?',
      jsonb_build_array(
        'Mateo utilizó el equipo PL-02 porque abrió la puerta lateral nueve minutos antes.',
        'Inés imprimió las páginas porque era la persona encargada del archivo.',
        'Vera imprimió la tabla para preparar el correo que envió a las 7:12 p. m.',
        'Desde el equipo PL-02 se imprimieron doce páginas durante el intervalo investigado, pero el registro no permite atribuir el trabajo a un usuario específico.'
      ),
      3,
      'El registro identifica el equipo y la hora del trabajo, no a la persona que lo ejecutó. Como varios funcionarios compartían la estación y no se exigía iniciar sesión, atribuir la impresión a Mateo, Inés o Vera excedería la evidencia. La opción correcta conserva exactamente el alcance del dato.',
      'Lee con cuidado qué identifica el registro: equipo, hora o persona.',
      'published',v_passage_id,
      'Identificar y entender los contenidos locales',
      'Alcance de la evidencia',3
    ),
    (
      'archivo-oculto','Lectura Crítica','Evaluación de hipótesis','dificil',
      'Un investigador propone que Mateo retiró las páginas aprovechando el corte de la cámara. ¿Qué dato debilita de manera más directa la certeza de esa hipótesis?',
      jsonb_build_array(
        'El registro confirma que Mateo abrió la puerta lateral a las 6:32, pero no demuestra que entrara al archivo ni que tuviera la llave del archivador en ese momento.',
        'Vera había publicado críticas a la audiencia pública antes de la desaparición.',
        'Tomás conservaba un archivo digital con una tabla de mediciones.',
        'Inés había discutido con el autor del informe sobre la protección de datos personales.'
      ),
      0,
      'La hipótesis atribuye a Mateo una acción concreta: entrar al archivo y retirar páginas. El registro solo confirma que abrió la puerta lateral; el texto aclara que no prueba su ingreso al archivo y que tampoco se conoce si la copia de la llave seguía bajo control del turno. Los otros datos describen motivos o circunstancias de personas distintas, pero no verifican ni refutan directamente el acceso de Mateo.',
      'Separa el hecho registrado (abrir una puerta) de la acción que la hipótesis le atribuye (retirar páginas).',
      'published',v_passage_id,
      'Reflexionar a partir de un texto y evaluar su contenido',
      'Evaluación de hipótesis',4
    ),
    (
      'archivo-oculto','Lectura Crítica','Valoración de información','dificil',
      '¿Qué nueva evidencia sería más útil para establecer quién retiró las páginas del archivador?',
      jsonb_build_array(
        'Una encuesta a habitantes del municipio sobre su opinión acerca de la represa.',
        'Un registro verificable de entrega y devolución de llaves, contrastado con accesos individualizados al archivo durante el intervalo de la desaparición.',
        'Una segunda entrevista a Vera sobre el impacto periodístico de la fotografía.',
        'Una lista de las personas que habían expresado desacuerdo con la construcción de la represa.'
      ),
      1,
      'La pregunta busca identificar a quien tuvo acceso efectivo al archivador durante el intervalo relevante. Un registro confiable de llaves y accesos individualizados permitiría contrastar las versiones con acciones verificables. Las opiniones sobre la represa o el interés periodístico pueden sugerir motivos, pero no establecen quién retiró el documento.',
      'Prioriza una evidencia que permita comprobar acceso y oportunidad, no solo motivo.',
      'published',v_passage_id,
      'Reflexionar a partir de un texto y evaluar su contenido',
      'Evaluación de evidencia',5
    );
  end if;
end
$migration$;

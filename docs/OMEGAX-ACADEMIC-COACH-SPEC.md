# OmegaX — Academic Coach and Learning Workspace

**Actualización:** 2026-11-08  
**Rama de trabajo:** `feat/founder-intro`  
**Estado:** especificación viva para continuar desde la implementación existente. No implica que todos los módulos descritos estén terminados.

## 1. Visión

OmegaX debe sentirse como una profesora particular y una entrenadora de aprendizaje: conversa, escucha, explica, construye una pizarra, observa el desempeño, propone una práctica dirigida y vuelve a comprobar si el estudiante mejoró.

La referencia de producto para el ciclo de práctica oral es el patrón pedagógico que populariza Stimuler: **hablar → feedback inmediato y concreto → práctica enfocada en los errores**. PeakScore debe desarrollar una experiencia propia, integrada con sus áreas ICFES, su pizarra y su biblioteca; no copiar marca, interfaz ni contenido de terceros.

El objetivo no es responder más texto, sino generar aprendizaje observable.

## 2. Ciclo docente común

1. **Detectar la intención:** materia, competencia, tema, objetivo, nivel, pregunta y contexto.
2. **Comprobar el punto de partida:** una pregunta corta, un ejemplo o la respuesta del estudiante. No asumir dominio por historial aislado.
3. **Explicar/modelar:** explicar la idea con lenguaje adecuado y mostrar en la pizarra solo los elementos que ayudan.
4. **Guiar una práctica:** una tarea pequeña, con pista progresiva si hace falta.
5. **Dar feedback basado en evidencia:** reconocer una fortaleza y seleccionar como máximo dos mejoras prioritarias, citando lo que el estudiante realmente hizo.
6. **Reintentar:** proponer un ejercicio breve que practique esas mejoras, no repetir el mismo problema mecánicamente.
7. **Actualizar la hipótesis de aprendizaje:** guardar una señal solo si hay evidencia suficiente; permitir que nueva evidencia corrija la anterior.

Las señales son orientativas, no diagnósticos infalibles. No presentar un porcentaje o un nivel como medición oficial sin una evaluación validada.

## 3. Inglés general: ruta MCER A1–C2

La ruta general de inglés ofrece seis metas didácticas:

| Nivel | Enfoque de aprendizaje |
|---|---|
| A1 | Frases muy sencillas, datos personales, necesidades cotidianas y apoyo con modelos |
| A2 | Intercambios rutinarios, descripciones breves y situaciones familiares |
| B1 | Experiencias, planes, razones y opiniones conectadas |
| B2 | Argumentación sostenida, interacción espontánea, precisión y matices de registro |
| C1 | Discurso flexible, cohesión compleja, inferencias y adaptación académica/profesional |
| C2 | Matices explícitos e implícitos, ironía, tono, estilo, idiomaticidad y reformulación precisa |

### Habilidades que debe cubrir la ruta completa

- Speaking e interacción: conversación libre, temas guiados, roleplays y exposición breve.
- Listening: comprensión global, detalle, intención, acentos y seguimiento de instrucciones, siempre que la fuente de audio sea real.
- Reading: idea principal, inferencia, referencia, tono, propósito, estructura y vocabulario contextual.
- Writing: oración, párrafo, cohesión, registro, revisión y reformulación.
- Grammar and vocabulary: gramática aplicada al mensaje, colocaciones, formación de palabras y precisión semántica.
- Mediation: explicar, resumir o reformular una idea para otra persona.

No limitar C2 a vocabulario rebuscado: debe atender precisión, matiz y naturalidad.

### Evaluación honesta

La selección A1–C2 de English Studio es una **meta elegida**, no un certificado ni una clasificación automática del nivel real. La estimación de nivel deberá construirse con evidencia de varias habilidades y sesiones. La transcripción automática permite analizar texto, pero por sí sola no demuestra pronunciación, fonemas, acento o entonación.

## 4. Inglés general y prueba Inglés Saber 11 son rutas distintas

- English Studio desarrolla el inglés general y permite escoger A1–C2.
- La preparación Saber 11 debe trabajar el marco y formato del ICFES, sus siete partes y el banco manual autorizado existente.
- No presentar C1 o C2 como niveles oficiales de desempeño de Saber 11.
- No generar automáticamente preguntas dentro del banco manual ni presentar ejercicios originales como preguntas oficiales.
- Se pueden crear ejemplos pedagógicos originales y prácticas conversacionales en English Studio, siempre claramente separados de los simulacros oficiales o del banco curado.

Cuando el estudiante cambia de English Studio a la preparación de Inglés ICFES, OmegaX debe explicar en español colombiano y usar inglés en los fragmentos, instrucciones o ejercicios que correspondan al objetivo.

## 5. Método visual de OmegaX por área ICFES

Cada pizarra debe representar el razonamiento de la materia, no una plantilla estética común.

### Matemáticas
Datos e incógnita → representación → estrategia → operaciones línea por línea → gráfica/tabla con ejes y unidades → comprobación e interpretación. No saltar directamente al resultado.

### Lectura Crítica
Texto breve suministrado → situación comunicativa → tesis/idea → evidencia exacta → conectores/referentes → inferencia → contraste de opciones. No inventar citas ni copiar texto innecesariamente.

### Sociales y Ciudadanas
Actores → tiempo y territorio → fuentes/perspectivas → causas y consecuencias → instituciones, derechos o principios pertinentes → conclusión respaldada. Usar líneas de tiempo, mapas causales, tablas de perspectivas y mapas conceptuales cuando aclaren la relación.

### Ciencias Naturales
Fenómeno → sistema/modelo → estructuras o variables → mecanismo → observaciones y datos → explicación → límites de la evidencia. Usar células, sistemas, moléculas, circuitos, ADN, gráficas y secuencias de procesos con precisión científica.

### Inglés
Contexto comunicativo → frase/pista → elemento señalado → patrón gramatical o léxico → reformulación → ejemplo nuevo. Usar tablas de conectores, orden de palabras, estructuras de preguntas, líneas de tiempo verbal, mapas semánticos y anotación de lectura cuando ayuden.

En todas las materias: narrar lo que aparece, explicar por qué es relevante, conservar elementos previos y retirar solo el foco al cambiar de objetivo.

## 6. Arquitectura ya existente que debe reutilizarse

- `components/aprender/LessonAITutor.tsx`: chat, voz, roleplay de OmegaX, feedback, persistencia de materiales y pizarra.
- `components/aprender/OmegaXEnglishStudio.tsx`: retos de speaking de 60 segundos, repetición guiada, grabación, transcripción, roleplays y feedback.
- `components/aprender/OrbyBoard.tsx`: renderer educativo progresivo y visuales tipados.
- `lib/ai/orby-board.ts`: contratos y sanitización de visuales.
- `lib/ai/orby-board-actions.ts`: acciones incrementales, secuencia, foco, borrado selectivo y validación.
- `lib/ai/orby-live-tools.ts`: herramientas de voz y pizarra.
- `lib/ai/orby-scope.ts`: perfiles de razonamiento, errores frecuentes y prioridades visuales para las cinco áreas ICFES.
- `app/api/orby/realtime-session/route.ts`: sesión Live, filtros, alcance, voz y guías pedagógicas.
- `app/api/lesson-tutor/route.ts`: tutor de respaldo por turnos, filtros, recuperación y contrato de pizarra.

No crear un segundo tutor ni duplicar sesión/proveedor. Conservar el flag de English Studio restringido a `assistantName === "OmegaX"`; Orby sigue siendo el tutor especializado de Ciencias Naturales.

## 7. Estado real a 2026-11-08

### Implementado en la rama
- English Studio ya tenía speaking de 60 segundos, repetición guiada, grabación local, transcripción, roleplays con llamada OmegaX y feedback por chat.
- El selector ahora ofrece A1, A2, B1, B2, C1 y C2, con descriptores y guía de coaching por nivel.
- Los roleplays construyen instrucciones adaptadas al nivel, con correcciones limitadas y reintento; la voz continúa siendo la sesión OmegaX ya existente.
- El feedback del tutor ahora pide evidencia textual, fortalezas, hasta dos mejoras prioritarias, versión corregida, modelo, mini-reto y reintento.
- Live y fallback tienen directivas explícitas para el método visual en las cinco áreas y para la ruta CEFR A1–C2.
- Se separó la ruta de inglés general de la preparación de Inglés Saber 11 y se preservó el límite del banco manual.
- Se añadieron regresiones estáticas para selector A1–C2, feedback con reintento, directivas de pizarra y separación de las dos rutas.

### Parcial / pendiente
- Los descriptores y prompts CEFR orientan el modelo; aún no son una evaluación calibrada de las cuatro habilidades ni una certificación.
- English Studio UI actual está más desarrollado para speaking, repetición y roleplay. Listening, reading y writing necesitan actividades y registro de progreso propios.
- La pizarra ya tiene visuales avanzados y foco de piezas, pero no todos los subelementos pueden señalarse de forma independiente. No están habilitados todavía targets individuales para aristas/flechas, enlaces moleculares, cables eléctricos, puntos de gráficas/vectores ni todos los elementos internos de neuronas.
- El karaoke de voz es aproximado por duración de reproducción; no es alineación fonética palabra a palabra.
- Las nuevas pruebas se añadieron, pero su ejecución, TypeScript, ESLint, build y QA real de Chrome/micrófono aún deben confirmarse para el HEAD actual.

## 8. Siguiente orden de implementación

1. Verificar en runtime el selector A1–C2 y los roleplays; comprobar que el nivel seleccionado llega al prompt Live y al fallback.
2. Crear una pequeña evaluación inicial no certificadora por habilidad (reading/listening/writing/speaking), con consentimiento y resultados explicables.
3. Añadir actividades dedicadas de listening, reading y writing, reutilizando los endpoints y cuotas gratuitas existentes.
4. Guardar progreso por habilidad y nivel objetivo sin etiquetar permanentemente al estudiante; mantener señales reversibles y basadas en evidencia.
5. Cerrar el ciclo de feedback: error concreto → explicación breve → mini-reto → reintento → comparación de la misma habilidad.
6. Ampliar foco de pizarra a subelementos de visuales solo cuando cada renderer tenga ID y geometría estables. No aceptar coordenadas inventadas.
7. Ejecutar suite, TypeScript, ESLint, build y QA en Chrome con micrófono, interrupción, pausa/reanudación y fallback.

## 9. Límites no negociables

- Mantener servicios y modelos dentro de cuotas gratuitas reales; sin fallback facturable ni cambios silenciosos de proveedor.
- No añadir llamadas de IA por decoración o duplicar generación para subtítulos/animaciones.
- Respetar filtros de seguridad, alcance ICFES, privacidad, protección contra prompt injection y límites de cuota.
- No reconstruir material de Orby ICFES Lab eliminado intencionalmente.
- No cambiar `main`, no hacer merge/rebase, no desplegar ni aplicar migraciones remotas en esta fase.
- No declarar una prueba aprobada por el mero hecho de que exista como caso de regresión.


### Adaptación reciente de los retos por nivel
Los temas de speaking de 60 segundos y las frases modelo de repetición ya se seleccionan desde bancos separados por cada nivel A1–C2. El audio de referencia pronuncia la frase activa. El selector reinicia los índices al cambiar de meta y se desactiva mientras haya una grabación, transcripción o audio pendiente. Esto adapta el estímulo visible; no constituye por sí mismo una evaluación calibrada del MCER.


## 2026-11-08 — English Studio amplía cuatro habilidades (siguiente iteración)

### Actividades nuevas implementadas en la UI
- **Listening Lab:** dos ejercicios por nivel A1–C2, con guion corto, pregunta de comprensión, pistas y clave de evidencia para el feedback. El audio se reproduce con `SpeechSynthesisUtterance` del navegador en inglés; el estudiante responde y puede revelar la transcripción después. No se presenta como una grabación de hablante nativo.
- **Reading Lab:** dos textos originales por nivel A1–C2, pregunta de comprensión y evidencia textual para justificar la respuesta.
- **Writing Lab:** dos consignas por nivel A1–C2, extensión orientativa y checklist de revisión. Incluye editor de texto, conteo de palabras y borrado/reinicio.
- Cada actividad tiene botón para cambiar tarea y envía el contexto junto con la respuesta al feedback de OmegaX.
- Las respuestas de listening/reading/writing se guardan como notas de estudio; los audios/transcripciones de speaking/pronunciation siguen en grabaciones.
- Al cambiar de nivel o actividad se reinician los estados correspondientes; la reproducción de listening se detiene al cambiar de tarea/nivel.

### Evaluación del feedback
- Listening: idea principal, detalles, inferencia, confusiones entre datos y soporte del guion. Aceptar paráfrasis válidas.
- Reading: comprensión global/detallada, inferencia y evidencia del pasaje. Aceptar paráfrasis y no exigir repetición literal.
- Writing: cumplimiento de tarea, organización, cohesión, gramática, vocabulario y registro. Priorizar dos patrones y preservar la intención del alumno.
- El texto del estudiante se marca explícitamente como contenido no confiable, no instrucciones.

### Límites conocidos
- El listening usa TTS del navegador sobre guiones originales. No hay todavía biblioteca de audios grabados con voces/acento variados ni medición acústica.
- Las actividades actuales son un primer banco pequeño: dos por habilidad y nivel; no reemplazan el curso completo ni un diagnóstico MCER validado.
- Existe un primer registro de señales por destreza y un panel de observaciones; todavía no hay tendencias temporales deduplicadas, revisión espaciada, rúbrica MCER calibrada ni informes de progreso.
- Pruebas nuevas añadidas al archivo estático; ejecutar suite, TypeScript, ESLint, build y QA Chrome antes de declarar listo.

### Siguiente trabajo recomendado
1. Probar visualmente los cinco modos y seis niveles, incluida pausa/reproducción y cambio de actividad.
2. Expandir listening con grabaciones originales reales solo si se dispone de material autorizado/gratuito; mantener TTS como fallback honesto.
3. Añadir una rúbrica consistente y no certificadora por habilidad, que cite evidencia y no genere puntajes ficticios.
4. Guardar progreso por habilidad con consentimiento y señales reversibles; usar el historial para elegir el siguiente ejercicio.
5. Llevar estrategias del tutor al tablero: pronunciación/estructura, evidencia textual, esquema de ideas, organización de párrafos y corrección progresiva.

- Protección de estado: el selector de nivel se desactiva mientras haya grabación/transcripción o respuesta escrita sin guardar; la tarjeta activa no reinicia la tarea al pulsarla. Cambiar de nivel/tarea detiene el TTS de listening y reinicia el estado asociado.


## 2026-11-08 — memoria adaptativa segmentada por destreza

### Implementación en la rama
- Se reutiliza `public.orby_student_learning_signals`; no se creó tabla nueva ni migración. La señal conserva `subject`, `topic`, `concept`, `learning_state`, `misconception`, `teaching_hint`, `confidence` y `created_at`.
- English Studio pasa el modo exacto (`speaking`, `pronunciation`, `listening`, `reading`, `writing`) desde la tarjeta al callback de feedback, al composer del tutor y a `/api/lesson-tutor`. La cola de mensajes conserva el modo durante hidratación/espera.
- El servidor normaliza la destreza con una allowlist y solo la acepta cuando `assistantName === "OmegaX"`. Las señales se etiquetan en `topic` como `English Studio · <Skill> · <topic>` y `subject = "Inglés"`; el esquema existente acepta esos valores sin migración.
- El feedback por habilidad aumenta el límite de mensaje de 1.200 a 7.000 caracteres únicamente cuando llega una destreza válida. Esto evita truncar pasajes, criterios y respuestas escritas. Los mensajes normales mantienen el límite original.
- Al generar feedback de una habilidad, la recuperación se fuerza en el camino académico y filtra señales por `user_id`, materia Inglés y prefijo de la habilidad concreta. No mezcla Reading con Listening, por ejemplo. El historial resultante se inyecta como evidencia parcial y no como diagnóstico definitivo.
- Las señales solo se guardan cuando el estado es permitido, existe concepto y `confidence >= 0.8`. No se generan puntajes de habilidad ni se certifica nivel MCER.
- El panel Progreso muestra cinco tarjetas independientes con número de observaciones, distribución de señales «understands»/por reforzar, últimas observaciones y conceptos. La barra explica que es una proporción de señales guardadas, no dominio real ni calificación.
- `/api/orby/learning` continúa filtrando por `user_id` del usuario autenticado al consultar mediante `supabaseAdmin`; no se expone el acceso directo a la tabla desde el navegador.

### Estado comprobado en Supabase (2026-11-08)
- Proyecto PeakScore activo; la tabla `orby_student_learning_signals` existe y tiene RLS habilitado.
- Consulta de comprobación: 0 señales en total y 0 etiquetas en Speaking, Pronunciation, Listening, Reading y Writing. No hay historial de aprendizaje previo que mostrar todavía; las tarjetas aparecerán cuando existan señales válidas.
- La consulta a `pg_policies` devolvió 0 políticas para esta tabla. Por tanto, se conserva el patrón server-side con service role y filtro explícito `user_id`; no se debe añadir acceso directo desde el cliente. No se creó política ni se cambió el esquema.

### Límites actuales
- La memoria depende de que el modelo devuelva `learningSignal` con evidencia y confianza >= 0.8; si no hay evidencia suficiente, no se guarda nada. Esta prudencia puede dejar destrezas vacías durante varias sesiones.
- Las señales son append-only en este flujo; no se consolidan aún en una tendencia temporal deduplicada ni se ponderan por recencia/consistencia. El panel muestra observaciones, no un diagnóstico.
- El modo de speaking/pronunciation se persiste cuando el estudiante solicita feedback desde English Studio; los roleplays Live sin solicitar feedback todavía no generan automáticamente señales por destreza.
- Suite, TypeScript, ESLint, build y QA real siguen pendientes. El check de Vercel continúa bloqueado por `build-rate-limit`.


### Aislamiento de búsquedas y coste
- Corrección de arquitectura: `learningSkill` activa únicamente la recuperación de `orby_student_learning_signals` de esa destreza. No fuerza por sí sola búsqueda vectorial, grafo conceptual ni recuperación de material del Lab. La recuperación académica normal sigue funcionando solo cuando su detector independiente lo solicita.
- Cuando una consulta académica normal también requiere material, el subject de recuperación para una skill de English Studio se fija a Inglés, nunca a otra materia.
- Esta separación evita búsquedas vectoriales innecesarias para corregir una práctica de Listening/Writing y respeta que la memoria personal no es el material académico del Lab.
- Auditoría estática actual: 257 pruebas nombradas, sin duplicados; todavía no ejecutadas.

- Para las solicitudes con skill válida, el selector del tutor utiliza el prompt pedagógico completo (incluye memoria previa y rúbrica de la destreza), sin activar por ello la búsqueda vectorial/graph. El prompt conversacional ligero queda para turnos que no requieren memoria de habilidad ni recuperación académica.

- Después de responder un feedback con skill válida, el cliente vuelve a consultar `/api/orby/learning` para actualizar las tarjetas de progreso inmediatamente; no genera otra respuesta de IA. Si el refresco falla, conserva la respuesta y muestra un aviso no bloqueante.

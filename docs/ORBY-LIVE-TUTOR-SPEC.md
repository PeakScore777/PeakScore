# Orby Live Tutor — especificación de experiencia, sincronización y calidad

**Fecha:** 2026-11-07  
**Estado:** especificación de producto y criterios de aceptación; no implica que las animaciones descritas ya estén implementadas.  
**Referencia visual obligatoria:** video aportado por el propietario el 2026-11-07 (tutor explicando y desarrollando un esquema biológico sobre una pizarra).

## 1. Visión del producto

Orby debe sentirse como un profesor particular que explica en voz alta y construye una pizarra mientras enseña. La voz y el tablero son dos partes de una misma clase: no son una respuesta de audio acompañada por una imagen decorativa.

La experiencia de referencia muestra a un tutor que desarrolla un dibujo/diagrama sobre una superficie de escritura, añadiendo elementos y anotaciones mientras explica. En PeakScore, la representación puede ser digital y limpia, pero debe conservar esa sensación de construcción en directo.

## 2. Comportamiento obligatorio

1. **Hablar y dibujar en paralelo:** la explicación oral debe avanzar mientras aparecen trazos, flechas, rótulos, fórmulas, ejes, conexiones y etapas.
2. **Construcción progresiva:** no mostrar siempre el diagrama completo de golpe. Dividir la explicación en pasos visuales pequeños y acumulativos.
3. **Trazos visibles:** cuando corresponda, líneas y curvas deben dibujarse progresivamente; nodos, etiquetas y fórmulas deben aparecer en el momento pedagógico adecuado. No fingir escritura manual con un simple fade-in de toda la tarjeta.
4. **Narración sincronizada:** cada paso del tablero debe corresponder con la parte de la explicación que se está pronunciando. No revelar resultados o respuestas antes de explicarlos.
5. **Tablero acumulativo:** las actualizaciones posteriores deben conservar lo que ya se explicó, salvo que Orby borre o reinicie explícitamente el tablero.
6. **Interrupciones naturales:** si el estudiante interrumpe, detener o invalidar la animación y el audio del turno anterior; responder la nueva pregunta y continuar desde el contexto válido, sin mezclar dibujos antiguos.
7. **Repetir y aclarar:** si el estudiante pide repetir, ampliar o corregir, Orby debe poder resaltar, rehacer o añadir al elemento pertinente sin reiniciar toda la clase.
8. **Cierre de clase:** dejar el tablero final legible y completo, con una síntesis breve y sin animaciones pendientes.
9. **Accesibilidad y control:** respetar prefers-reduced-motion, permitir pausar/detener voz, mantener contraste, texto legible y controles accesibles. La información no puede depender únicamente del color o del movimiento.
10. **Degradación honesta:** si el proveedor no entrega audio o actualizaciones visuales, informar o degradar con claridad; nunca simular sincronización que no ocurrió.

## 3. Secuencia pedagógica por respuesta

- **Fase 0 — Comprender:** identificar pregunta, área, tema, nivel y objetivo. Determinar si realmente hace falta una pizarra; saludos y respuestas breves no deben forzar dibujos.
- **Fase 1 — Planificar:** crear una secuencia corta de escenas/acciones. Cada acción debe tener contenido, orden, relación con la explicación y, cuando sea posible, una referencia temporal o de segmento de voz.
- **Fase 2 — Presentar:** mostrar título y primer elemento. La voz introduce el concepto antes o al mismo tiempo que aparece.
- **Fase 3 — Desarrollar:** agregar trazos, conexiones, etiquetas, operaciones y ejemplos en orden. La pizarra conserva las acciones previas.
- **Fase 4 — Comprobar:** revisar consistencia conceptual, unidades, cálculos, nombres, flechas, secuencias y etiquetas antes de presentar cada acción.
- **Fase 5 — Cerrar:** mostrar resultado y resumen; dejar una pregunta de comprobación cuando sea útil.

No usar pausas artificiales largas para esperar dibujos. La primera voz y el primer elemento útil deben llegar pronto; la animación debe ser fluida y no bloquear audio, micrófono ni controles.

## 4. Lenguaje visual y materias

- **Matemáticas:** desarrollar operaciones línea por línea; indicar qué representa cada símbolo; construir gráficas desde ejes a puntos y curvas; mostrar vectores desde origen hasta componentes.
- **Ciencias Naturales:** dibujar células, organelos, ADN, neuronas, sistemas y procesos fisiológicos con etiquetas y relaciones correctas; respetar secuencias biológicas.
- **Química:** construir moléculas mostrando átomos y enlaces; distinguir elementos, cargas y tipos de enlace; no inventar estructuras químicas.
- **Física:** diagramar fuerzas, circuitos, movimiento, energía y ondas; mantener magnitudes, unidades y direcciones coherentes.
- **Sociales y Ciudadanas:** construir líneas de tiempo, mapas conceptuales, relaciones causa-consecuencia y tablas comparativas sin presentar interpretaciones discutibles como hechos.
- **Lectura Crítica:** subrayar o destacar fragmentos, tesis, argumentos, inferencias y relaciones textuales; no inventar citas del texto del estudiante.
- **Inglés:** destacar vocabulario, estructura gramatical y pistas contextuales. El banco de preguntas sigue siendo curado manualmente; esta especificación no autoriza generación automática de preguntas del banco.

Los diagramas son apoyos explicativos originales y no deben copiar material protegido del Icfes.

## 5. Contrato técnico recomendado

La salida visual debe ser una **secuencia de acciones tipadas**, no únicamente un snapshot final. Cada acción debería incluir:
- id estable y único dentro del turno;
- sequence monotónico;
- tipo de acción (trazo, línea, flecha, nodo, etiqueta, fórmula, punto, resaltado, borrado o paso);
- datos tipados y validados;
- dependsOn opcional para ordenar dependencias;
- vínculo a un segmento/fragmento de narración cuando el proveedor lo permita;
- duración sugerida acotada, sin permitir que el modelo bloquee la interfaz.

El cliente debe:
- procesar acciones de forma incremental;
- rechazar duplicados y secuencias antiguas;
- conservar el tablero acumulativo;
- cancelar acciones pendientes al cambiar de turno;
- sincronizar por eventos/segmentos reales si están disponibles;
- no inferir tiempos exactos de voz a partir de texto cuando no exista alineación;
- renderizar una versión estática final accesible si las animaciones están desactivadas.

El contrato actual de OrbyBoard (bloques + hasta cuatro visuales tipados) es una buena base de contenido, pero un objeto completo reemplazado en cada actualización no garantiza por sí mismo el efecto de escritura en directo. La transición de snapshots a acciones incrementales debe ser compatible y gradual, sin romper persistencia ni fallback.

## 6. Criterios de aceptación medibles

- La voz comienza sin esperar a que termine de construirse el tablero.
- La primera acción visual útil aparece durante la explicación, no solo al final.
- En una lección de varios pasos se observan al menos tres actualizaciones acumulativas cuando el contenido lo justifica.
- Los trazos/relaciones aparecen progresivamente y en el orden explicado.
- No hay saltos hacia atrás, duplicados, parpadeos ni pérdida de elementos previos.
- Una interrupción invalida el audio y las acciones pendientes del turno anterior.
- La nueva respuesta no reutiliza acciones del turno anterior por error.
- Live y fallback mantienen la misma semántica de tablero y una degradación entendible.
- El tablero final puede leerse sin movimiento y funciona con movimiento reducido.
- Los diagramas superan validaciones de estructura y reglas específicas del dominio.
- No se agregan proveedores de pago ni llamadas de IA adicionales por defecto.

## 7. Pruebas obligatorias antes de declarar listo

1. Biología: construir una célula y etiquetar componentes mientras se explican.
2. Matemáticas: resolver una operación y construir una gráfica por etapas.
3. Física: dibujar un vector y explicar sus componentes.
4. Química: construir una molécula y validar enlaces/valencias con reglas disponibles.
5. Sociales: desarrollar una línea de tiempo con orden cronológico.
6. Lectura crítica: destacar tesis y evidencias de un texto suministrado.
7. Inglés: mostrar pistas gramaticales/contextuales sin alterar el banco manual.
8. Interrumpir durante el dibujo y hacer una pregunta diferente.
9. Pedir “repite esa parte” y comprobar que Orby retome el punto correcto.
10. Desconectar Live y verificar el fallback por turnos.
11. Activar movimiento reducido y verificar que el tablero siga siendo comprensible.
12. Agotar cuota gratuita y verificar que no haya fallback facturable.

Registrar por prueba: primera palabra audible, primer audio, primera acción visual, separación entre narración y acción, duración total, errores de validación, cancelación por interrupción y resultado final.

## 8. Estado real auditado el 2026-11-07

- Live puede enviar varias actualizaciones acumulativas mediante render_orby_teaching_board; el cliente sanitiza cada tablero y actualiza el mensaje activo.
- La ruta fallback ahora solicita board versión 2 con bloques y visuales tipados.
- El componente OrbyBoard.tsx renderiza los visuales como SVG estático. En el código inspeccionado no se encontró un motor de trazos progresivos ni un contrato de acciones visuales enlazadas a segmentos de audio.
- Por tanto, **la experiencia del video todavía no está demostrada ni completa**. Actualizar snapshots mientras se habla no equivale a dibujar cada trazo sincronizado con la voz.
- No se han ejecutado en esta revisión pruebas de navegador, micrófono, TypeScript, ESLint, build ni CI. No afirmar que están aprobadas.

## 9. Restricciones y prioridades

- Mantener servicios y modelos estrictamente gratuitos dentro de cuotas reales. Sin API de pago, créditos facturables ni fallback silencioso.
- No reconstruir materiales del Orby ICFES Lab eliminados intencionalmente.
- No modificar main, no desplegar y no aplicar migraciones remotas sin autorización.
- Prioridad: diseñar e implementar primero una capa de acciones incrementales con cancelación por generación; después enlazar eventos de tablero con la narración real disponible y probar en Chrome.

## Addendum — spatial teaching canvas v2

A board v2 may include the optional property:

```ts
layout: {
  aspectRatio: "16:9";
  elements: Array<{
    id: string;
    sequence: number;
    kind: "block" | "visual";
    index: number;
    x: number; y: number; width: number; height: number;
  }>;
}
```

Invariants:
- Each block and each visual is referenced exactly once by zero-based index.
- Element IDs are stable, unique ASCII identifiers (1–24 characters).
- Sequence is a strictly increasing positive integer (maximum 1000); gaps are valid after erase, and surviving stages must never be renumbered.
- All normalized rectangles remain inside 0–100; the renderer places them on one responsive 16:9 paper canvas.
- New v2 tutor output should include layout. Legacy v1 and v2 without layout remain valid and use the old renderer.
- Every snapshot remains complete and cumulative; it carries existing layout elements plus any appended stages.
- The class canvas is one continuous, pure-white sheet: no dotted pattern, graph-paper grid, texture, panels or card-like containers. Text, handwriting, freehand strokes and accurate supporting visuals are placed directly on that sheet.
- Spatial order is not exact audio alignment. Use actual provider speech-segment metadata if available; never guess timestamps.

The implementation is backward-compatible with the current JSONB teaching_board persistence. Client sanitizer budget (18 KB) remains below the existing RPC limit (24 KB); no database migration is needed for the optional field.

## Addendum — incremental teacher actions v1 (2026-11-08)

The first compatible implementation of incremental teaching actions is now present on `feat/founder-intro`:

- `append-block` writes one sanitized heading, text, formula, step or callout into a new region of the active spatial v2 board.
- `append-strokes` adds 1–5 new strokes to the existing single sketch stage. Previous stroke IDs are retained by the board; the model sends only newly added ink.
- Each append action is bound to the `turnGeneration` returned by the active accepted board snapshot, a unique `actionId`, an increasing `sequence`, and optional dependencies on previously accepted actions.
- Every teacher board action, including legacy `focus`, `erase` and `replace`, must now carry the active `turnGeneration`. A stale action from an interrupted or previous student turn is rejected.
- Duplicate IDs, repeated/decreasing sequences, missing/self dependencies, stale generations, invalid geometry, unsupported blocks and excessive stroke batches are rejected before changing the board.
- An action can update the provisional snapshot while input preflight is still pending only when session and activity generations match and the snapshot is still within its 15-second validity window. The board remains hidden until the input passes preflight.
- New writing/drawing clears an old temporary focus halo. The existing serial SVG pen timeline, teacher-only operations, legacy v1/v2 rendering, message association and persisted final board remain in place.

### Explicit non-goals / limitations
- This version does not add phoneme-level or timestamp-level synchronization. Action sequence is ordered with the teaching events; exact alignment must not be claimed without reliable provider speech-segment metadata.
- The model is instructed to interleave writing and drawing, but the client cannot force Gemini Live to emit an action at every spoken phrase.
- Actions remain on the same assistant turn/message; they do not create parallel messages or independent board layers.
- No student drawing/editing tools, paid providers, extra model calls, new dependencies, database migration or remote deployment are introduced.

### Required acceptance checks still pending
- Run the Orby test suite, TypeScript, ESLint and production build on the exact final SHA.
- In Chrome with a real microphone, verify at least three append operations while Live audio continues, then interrupt mid-stroke and confirm no stale action is rendered.
- Verify the resulting final board survives history reload and that Live fallback preserves the same board semantics.
- Reproduce the biology sequence from the reference video (cell outline → nucleus/DNA → internal structures → mitochondrion → ATP relation) and inspect timing, pen continuity, spacing and legibility.

Do not claim video-level acceptance until those runtime checks pass. Keep the implementation on `feat/founder-intro`; do not merge, deploy or apply remote migrations as part of this phase.

## Addendum — teacher focus for spatial layout elements

The existing teacher-only `focus` operation may target exactly one of:
- `strokeId`: an existing freehand stroke (legacy behavior).
- `elementId`: an existing spatial stage in `layout.elements[]`.

A spatial element focus is temporary, non-destructive and adds no ink. It must reference an ID from the active complete snapshot. The renderer shows an outer focus halo, pauses it on voice interruption, and keeps a static indication for reduced-motion users. `erase` and `replace` remain stroke-specific. Student drawing/editing controls remain absent.

### Sequence, erasure and pen-start invariants

- Spatial \`sequence\` values are strictly increasing positive integers (maximum 1000), not required to be contiguous. Gaps are valid after a stage is erased; surviving IDs, positions and sequence values must never be renumbered.
- A layout still contains at most 12 visible elements and references every current block and visual exactly once.
- When erasing the last stroke removes a sketch visual, remove that visual's layout element, shift only subsequent visual array indexes, and preserve all remaining element IDs/positions/sequences.
- The first sketch strokes wait for their spatial stage lead-in. Later cumulative snapshots append new strokes to the existing SVG pen queue without restarting the stage delay.


## Addendum — exact reference-video experience and all-five-subject visual teaching (2026-11-08)

### Product reference
The owner-provided 42.7-second video is the visual source of truth. Match its teaching behaviour and visual language rather than adding a generic "AI whiteboard" look.

- One continuous, plain-white sheet. No dot pattern, graph-paper texture, grids, beige paper, card collections, floating panels or decorative boxes.
- Handwritten-looking headings, labels, underlines, symbols, arrows, brackets and annotations live directly on the sheet.
- The main sketch is large and central; notes and labels are composed around it without overlapping or hiding the drawing.
- The teacher constructs the explanation progressively: outline → internal structures → relationships/arrows → labels/emphasis → conclusion. The same sheet and prior ink stay visible.
- The pen movement should feel continuous and intentional. Avoid isolated dots, sudden complete diagrams, duplicated paths, jumps, or unrelated decorative doodles.
- Typed diagrams/tables may be used when they improve mathematical or scientific accuracy, but must remain integrated into the same white sheet and must not replace the teacher's hand-drawn explanation by default.
- Caption treatment: polished, readable spoken subtitles in Spanish Colombian, with the current word visibly highlighted as Orby says it. The line should advance naturally and retain a short recent context, not display a long paragraph in a tiny scroll box.

### Visual-first rule for Saber 11
For roughly 90% of substantive teaching explanations, Orby should use a meaningful visual action. This is a pedagogical target, not a requirement to draw irrelevant artwork for greetings or one-word confirmations. A visual can be a handwritten annotation, underline, arrow, diagram, graph, map, timeline, comparison, argument structure, equation, table, or experiment setup; it does not always need to be a biological illustration.

Every new substantive question should be answered in the voice and developed on the sheet in parallel. The voice must not wait for the board tool or Lab lookup to finish. The model should decide what representation actually expresses the concept and explain each element while it appears.

### Five subject-specific visual grammars

**Mathematics**
- Build equations and transformations line by line; align equal signs and label the reason for important steps.
- Draw number lines, geometric constructions, coordinate axes, functions, tables and statistical plots when relevant.
- Keep units, scale, axis labels, signs, ratios, domains and data consistent. Draw the representation the question uses (table, chart, diagram, symbolic expression), then connect it to the result.
- Show modelling, execution and justification; do not turn every answer into a bare formula card.

**Critical Reading**
- Treat the passage, image, graph or cartoon as the object being examined.
- Underline the thesis, evidence, connectors, assumptions, conclusion and relevant phrases; use arrows/brackets to show how claims and evidence relate.
- Build argument maps, paragraph structures, point-of-view comparisons, inference chains and text/visual relationships directly on the sheet.
- Do not invent or draw content that was not supplied by the source passage. Distinguish what the text states from what can be inferred or evaluated.

**Social Studies and Citizenship**
- Use annotated maps, timelines, actor/institution diagrams, causal chains, historical change/continuity, economic flows and perspective comparisons.
- Label locations, dates, actors, interests, rights, responsibilities and institutional relationships accurately.
- Draw contrasting perspectives and their evidence; do not replace analysis with the tutor's personal political opinion.

**Natural Sciences**
- Use appropriate diagrams for cells, organelles, DNA, inheritance, ecosystems, body systems, cycles, molecules, reactions, forces, motion, energy, waves, circuits, experiments and evidence.
- Show mechanisms in order and label structures while speaking about them. For experiments, distinguish independent, dependent and controlled variables, hypothesis, evidence and conclusion.
- Preserve scientific constraints already established in the Orby specification: cell-type differences, correct DNA pairing, separate stages of meiosis, action potential versus synaptic transmission, actin-myosin mechanics, correct molecular bonds and reaction balancing.
- Use units, arrows, energy/matter flows and causal relationships where they clarify a process.

**English**
- Preserve the seven-part Saber 11 structure and manually managed question bank. Do not generate or alter the English question bank with AI without explicit authorization.
- Visuals can include vocabulary maps, context-clue highlighting, dialogue turns, speaker intention, grammar roles, verb timelines, cloze blanks, reference links in a paragraph and reading-inference markings.
- Keep the source example in English while explaining the reasoning in Colombian Spanish when useful. Label which English test part and skill is being practised.

### Curriculum source hierarchy and topic coverage
- The current Icfes 2026-2 Orientation Guide and the five official Saber 11 reference frameworks define the tested competencies, evidence and assessment formats.
- MEN Basic Learning Rights and competency standards supply school-grade prerequisites.
- Published Orby Lab documents add the project's own material, teaching methods, worked examples and misconceptions. Only retrieved, published and relevant evidence may be attributed to the Lab.
- Reputable public sources (official bodies, universities, scientific institutions and peer-reviewed research) are used selectively for external verification, current facts or requests for references. Do not web-search every elementary definition: it would add latency and is not a substitute for teaching.
- Create original teaching examples and diagrams. Do not reproduce Icfes protected questions or rebuild deleted Lab material. Distinguish core Saber 11 content from school prerequisites and optional advanced enrichment.

### Orby Lab integration — current implementation and desired contract
- The Live client already exposes `search_orby_learning_knowledge`; the authenticated `/api/orby/knowledge-search` endpoint queries only `visibility: "published"` fragments, the published concept graph and related published documents.
- The current route may add public web research only when the query asks for sources, current information or external verification.
- The server lesson directive already says to start the spoken explanation immediately and call the Lab lookup in parallel for a new substantive academic question. The tool declaration had contradicted it by calling retrieval optional and discouraging calls on every question; the declaration was aligned on 2026-11-08.
- Intended contract: one non-blocking published-Lab lookup for each new substantive ICFES topic, plus at most one follow-up lookup when the first result reveals a specific unresolved prerequisite or materially important claim. The existing per-turn cap remains two tool calls.
- The Live generation must continue while retrieval runs. Use the result only after it arrives, add only information that materially helps, and never repeat the full explanation.
- If no relevant published document exists, retrieval fails or a free quota is exhausted, continue from reliable academic knowledge and disclose the limitation when needed. Never claim the Lab contains material that was not actually returned.
- This tool integration is retrieval, not model training or autonomous learning. Do not describe Orby as having learned a document unless the documented ingestion/publishing workflow actually processed and published it.

### Spoken captions — word-highlight requirement and technical limit
- Required visual behaviour: a stable subtitle line follows Orby's spoken explanation, with one active word highlighted as it is spoken. The highlight must not run ahead of the audible voice, jump back as text grows, or keep highlighting after interruption.
- The current client reads Gemini Live `outputTranscription.text` and separately schedules PCM audio chunks using Web Audio. It currently renders a plain transcript; it does not yet have active-word karaoke highlighting.
- The official Gemini Live transcription documentation states that Live streaming does not provide word-level timestamps; it provides utterance-level transcription. Gemini 3.5 Transcribe's non-streaming audio-file mode can return word-level timestamps, but those timestamps are not supported by its Live streaming mode and can reduce transcription accuracy. See:
  - https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
  - https://ai.google.dev/gemini-api/docs/transcribe
  - https://ai.google.dev/gemini-api/docs/models/gemini-3.5-transcribe
- Therefore, do not claim exact word alignment from the current Live transcript. The correct implementation path is to investigate a free, quota-safe timing source that is compatible with Live playback. A playback-duration heuristic may be prototyped only if explicitly described and tested as approximate; it must never be represented as precise phonetic alignment.
- Do not add a paid transcription provider, silently switch providers, or buffer the whole answer for a second transcription pass without first proving cost, latency, free quota, privacy and interruption behaviour.
- The karaoke state must be invalidated on barge-in and session-generation change, and must follow actual scheduled playback time rather than the arrival time of transcript text.

### Natural, low-latency conversation
- Target: the first useful spoken response should begin as soon as the tutor understands the question, ideally within approximately one second after the end-of-utterance boundary. This is a performance target to measure, not a guarantee.
- The first sentence should answer the core question while the Lab lookup and first visual action run in parallel.
- Record p50 and p95 for end-of-utterance → first audio chunk received, end-of-utterance → first audio scheduled, and end-of-utterance → first visible board action. Also measure interruption-stop latency and time to resume listening.
- Keep the existing free-quota safeguards, output validation and voice safety filters. Improve latency without removing validation gates that prevent unsafe or off-scope speech.
- An interruption must stop the previous voice and invalidate its pending drawing, captions and tool actions immediately. A follow-up question should become the new active generation without waiting for old playback to finish.

### Acceptance scenario
Ask: "Explícame cómo funciona la célula". Orby starts speaking immediately, writes a heading on a smooth white sheet, draws the cell outline, adds nucleus and DNA, labels each structure, adds mitochondrion and ATP relation, and explains each step. The subtitles highlight the currently spoken word. Interrupt during the mitochondrion drawing with "¿y para qué sirve el ATP?"; Orby stops the old explanation, responds naturally, continues from the ATP question, and no stale cell action or subtitle word appears afterwards.

Repeat visual QA across the five ICFES areas using a graph/equation (Math), highlighted source argument (Critical Reading), annotated historical/political map or perspectives (Social Studies), mechanism/experiment (Natural Sciences), and contextual text/grammar/vocabulary marking (English).

Do not mark the experience as video-level complete until the Chrome/microphone tests, word-highlight validation, all-five-subject visual QA and voice-latency measurements pass.


## Addendum — rendimiento conversacional y presupuestos gratuitos (2026-11-08)

### Comportamiento de respuesta
- Meta: primera frase útil idealmente en menos de 1 s desde el fin de habla del estudiante; esto es un objetivo que hay que medir, no una promesa.
- Live debe mantener una sesión persistente entre preguntas; no crear una sesión/tóken nuevo para cada mensaje.
- Avisar si no llega ningún avance en 5 s y recuperar la misma pregunta por el tutor de texto cuando Live lleve 15 s sin texto/audio/herramienta. Cualquier evento válido reinicia el watchdog.
- Un 429 no es automáticamente cuota diaria agotada. Distinguir límite RPM/TPM temporal de RPD real. No devolver Retry-After de una hora por un error temporal.
- El respaldo de voz nunca debe acumular esperas de minutos ni descartar silenciosamente la explicación completa. Si la voz no se puede generar, dejar el texto entero visible y mantener la conversación disponible.

### Presupuesto gratuito del stack
- Gemini 3.8 Live (`gemini-3.8-live`) y Gemini 3.8 Flash-Lite TTS (`gemini-3.8-flash-lite-tts`) aparecen con nivel gratuito en Gemini Developer API. Las cuotas de Gemini se miden por RPM/TPM/RPD por proyecto; se comparten entre todos los alumnos que usan el proyecto. RPD se restablece a medianoche del Pacífico. Los límites efectivos deben verificarse en Google AI Studio y no son un número universal garantizado.
- Cloudflare Workers AI concede 10.000 neuronas/día gratis para el proyecto; las inferencias del tutor, embeddings y Whisper comparten ese presupuesto. El límite se reinicia a las 00:00 UTC.
- Claude Free en claude.ai tiene límites por sesión de usuario, reinicio cada 5 horas y variación según demanda; no es cuota API para PeakScore. La API de Claude/Console requiere créditos prepagados (salvo créditos especiales de otros planes/contratos). No usar como fallback gratuito.
- Mantener únicamente proveedores confirmados como gratuitos en el plan concreto que realmente se está usando. No configurar proveedores con facturación activa, no hacer fallback silencioso a modalidad pagada ni actualizar a Workers Paid.
- No prometer días enteros de voz o un número fijo de turnos hasta observar los límites y el uso del proyecto.

### Presupuesto de llamadas en el cliente
- Live: conexión persistente, máximo seis inicios de sesión por usuario por minuto.
- TTS secundario: endpoint de máximo 900 caracteres y 20 peticiones por usuario por minuto; el cliente forma fragmentos de hasta 880 caracteres y reduce requests de fallback.
- TTS throttle: un único reintento si Retry-After <= 2 s; si la pausa excede ese valor, conserva la respuesta escrita y permite una pregunta nueva.
- Orby Lab: una consulta NON_BLOCKING por nuevo tema y una segunda solo por necesidad concreta; máximo dos llamadas por turno.

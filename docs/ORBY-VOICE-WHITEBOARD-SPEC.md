# Orby Voice + Live Whiteboard — especificación funcional

**Estado:** contrato de producto y criterios de aceptación. No implica que todas las fases estén implementadas o validadas en navegador.

## Objetivo

Cuando un estudiante abra una llamada o active la conversación por voz desde el chat de IA de PeakScore, Orby debe sentirse como un tutor humano que explica hablando y construye una pizarra al mismo tiempo. La explicación oral, los subtítulos y el tablero forman una sola experiencia; no son tres respuestas separadas.

## Experiencia del estudiante

1. El estudiante inicia una llamada desde el chat y conserva el mismo hilo de conversación.
2. En el escenario de voz ve a Orby, el estado de conexión/micrófono, subtítulos legibles y el tablero de enseñanza.
3. A medida que Orby explica, la transcripción de salida se refleja en subtítulos sin esperar al final del turno.
4. Mientras desarrolla una idea, Orby añade títulos, pasos, fórmulas, etiquetas, flechas, diagramas, gráficas y otros apoyos adecuados al tema.
5. El tablero se construye progresivamente. No debe aparecer como una imagen completa al final si el proveedor puede emitir actualizaciones intermedias.
6. Al volver al chat, el estudiante encuentra la misma respuesta, el mismo tablero y la continuidad de la conversación; no se duplica el turno.
7. El estudiante puede interrumpir, preguntar o pedir que repita. Se detiene el audio y se descartan actualizaciones tardías del turno anterior; la nueva explicación comienza sin mezclar subtítulos ni tablero antiguos.
8. Los subtítulos de Orby permanecen visibles durante toda la llamada; no hay un interruptor para desactivarlos. El tablero y la ilustración educativa permanecen disponibles junto con la explicación.

## Distribución de pantalla

- **Llamada:** controles de voz + estado de Orby + panel de subtítulos + tablero visible en el mismo escenario con scroll vertical en pantallas pequeñas.
- **Chat durante llamada:** la respuesta incremental aparece en la burbuja del turno activo y la pizarra se muestra debajo de esa respuesta. El acceso flotante a la llamada no debe tapar el contenido esencial.
- **Solo chat:** las respuestas visuales mantienen el tablero debajo del texto de Orby.
- **Subtítulos:** etiqueta clara «Orby · Subtítulos en vivo», contraste alto, saltos de línea conservados y presencia permanente durante la llamada. No se ofrece control para desactivarlos.

## Contrato de eventos y datos

- La transcripción visible proviene de serverContent.outputTranscription del proveedor Live, después de las validaciones de idioma, alcance académico y seguridad ya existentes.
- La pizarra proviene de render_orby_teaching_board y pasa por sanitizeOrbyBoard; nunca se renderiza HTML/SVG arbitrario enviado por el modelo.
- Cada actualización de pizarra debe ser un snapshot acumulativo coherente del turno actual. Debe conservar lo ya enseñado y añadir/modificar la etapa actual deliberadamente.
- Los mensajes, subtítulos y tablero deben usar el mismo identificador de turno/asistente.
- Al interrumpir o cambiar de generación se invalidan los eventos tardíos por sessionGeneration y activityGeneration.
- No introducir otra petición de IA para producir subtítulos o animaciones. No introducir servicios pagados ni fallback que pueda facturar.

## Reglas pedagógicas

- Español colombiano claro, nivel Saber 11 y área/tema de la pregunta.
- El tablero aclara lo que se está diciendo; no debe contradecir la narración ni inventar cifras, fórmulas, relaciones, nombres o secuencias.
- Matemáticas: operaciones y fórmulas por pasos, ejes/unidades explícitos cuando apliquen.
- Ciencias: estructuras y procesos correctos, etiquetas legibles y secuencias canónicas.
- Sociales/Lectura: líneas de tiempo, mapas conceptuales o tablas solo cuando ayuden y con datos fundamentados.
- Inglés: explicar el ejercicio en español cuando corresponda y respetar el banco manual existente; no generar automáticamente preguntas de banco.
- No enseñar programación ni promocionar otros preICFES.

## Criterios de aceptación (QA manual y automatizado)

- [ ] Al iniciar una llamada desde el chat, aparece el escenario de voz con subtítulos y área de pizarra.
- [ ] En un turno con tablero, la primera actualización se muestra sin esperar a turnComplete.
- [ ] Dos o más snapshots acumulativos actualizan el tablero sin perder bloques/etapas previas.
- [ ] El texto de subtítulos crece con la transcripción de salida y no muestra el texto del estudiante como si fuera Orby.
- [ ] Los subtítulos permanecen visibles durante voz Live, interrupciones, reanudación y cambios de turno.
- [ ] Al volver al chat, el mismo mensaje contiene texto y tablero, sin duplicación.
- [ ] Una interrupción cancela el audio anterior y descarta transcripciones/tableros tardíos.
- [ ] Si no hay visual pertinente, Orby habla sin mostrar una pizarra vacía o inventada.
- [ ] Si Live no ofrece transcripción, la UI indica que los subtítulos no están disponibles; no inventa texto ni confunde la pregunta del estudiante con la respuesta.
- [ ] En móvil y escritorio, el escenario permite leer subtítulos y tablero sin solapamientos.
- [ ] Fallback por turnos conserva su aviso de modo degradado y no promete voz en vivo si no está disponible.
- [ ] Se verifican cuota gratuita, filtros ICFES y ausencia de rutas de facturación.

## Estado implementado al 2026-11-07

- Implementado en código: el escenario de llamada renderiza el tablero del mensaje de voz activo; subtítulos visibles desde la transcripción incremental Live; control mostrar/ocultar; el chat ya muestra tablero dentro del mismo mensaje; sanitización y filtros existentes se conservan.
- Implementado en presentación: revelación progresiva de bloques y trazos SVG recién montados, con respeto a prefers-reduced-motion.
- Parcial: el proveedor entrega fragmentos de transcripción, pero no hay alineación palabra-a-palabra garantizada entre audio y subtítulo; las actualizaciones de tablero no tienen timestamps de narración asociados.
- Pendiente: probar dos o más snapshots reales en llamada, verificar continuidad en chat, probar interrupciones y responsive en Chrome con micrófono, y comprobar el fallback.
- No se debe declarar listo para Pull hasta completar QA real y ejecutar Node tests, TypeScript, ESLint y build.

## Sincronización incremental por frase — 2026-11-07

- El contrato Live de `render_orby_teaching_board` expone `spokenCue` opcional: una frase corta exacta que Orby debe pronunciar antes de revelar esa instantánea acumulativa.
- El cliente conserva snapshots pendientes por `sessionGeneration` y `activityGeneration`; los revela únicamente cuando la transcripción de salida validada contiene la frase, y descarta snapshots caducados o de turnos anteriores.
- Las actualizaciones sin `spokenCue` mantienen el comportamiento inmediato para compatibilidad y primera pizarra.
- Esto sincroniza por coincidencia de frase validada, no por timestamps ni alineación palabra-a-palabra del audio. La sincronía exacta del video aún requiere eventos de voz alineados por el proveedor y QA real.
- Añadida regresión estática; Node tests, TypeScript, ESLint, build y Chrome/micrófono siguen pendientes de ejecución.

## Rectificación de sincronización — revisión de continuidad

La sección anterior «Sincronización incremental por frase» conserva el diseño exploratorio histórico de `spokenCue`. **No representa el contrato actual de la rama** y no debe usarse como instrucción para reintroducir coincidencia de frases:

- La herramienta Live actual no declara `spokenCue`; cada snapshot acumulativo válido se publica inmediatamente tras validación.
- El cliente no alinea snapshots mediante `normalizedSpokenReply.includes` ni mantiene una cola de frases habladas.
- No se debe inventar un timestamp ni usar coincidencia textual como sustituto de alineación de audio.
- La sincronización exacta solo se implementará si el proveedor expone un identificador/segmento de narración o metadatos temporales fiables. Mientras tanto, la clase utiliza el orden de eventos pedagógicos y se describe como sincronización aproximada.
- La pausa, cancelación por generación, validación académica y persistencia idempotente existentes deben conservarse durante cualquier evolución.

La especificación de aceptación vigente para esta transición es `docs/ORBY-LIVE-TUTOR-SPEC.md`.

## Actualización — composición espacial del tutor

La primera fase del lienzo espacial queda implementada en la rama:
- El modelo Live puede devolver un `layout` opcional para tableros v2: canvas 16:9, etapas ordenadas y coordenadas para texto/visual.
- El renderer coloca los elementos sobre una hoja punteada y conserva la vista legacy cuando el layout falta.
- Los prompts de Live y tutor escrito piden un título/idea arriba, notas a la izquierda, dibujo central y callouts a la derecha.
- Los snapshots siguen siendo completos y acumulativos; los IDs y sequence existentes deben preservarse.
- La persistencia actual JSONB es compatible, sin migración.

La coincidencia de frases/timestamps sigue descartada como método artificial de sincronización. El orden visual no es sincronización palabra-a-palabra. Solo usar segmentos/tiempos reales que proporcione Live.

La entrega espacial y sus regresiones se describen en la bitácora diaria y en `ORBY-LIVE-TUTOR-SPEC.md`. La siguiente capa pendiente es la cola de acciones incrementales por generación, con cancelación segura durante interrupciones.

## Addendum — señalar elementos completos de la pizarra

Orby puede usar `apply_orby_board_action` con `focus` para señalar un trazo existente (`strokeId`) o una etapa espacial completa (`elementId`). La acción requiere un único ID válido que ya exista en la pizarra activa. El halo no escribe ni altera contenido; se congela al interrumpir la clase y respeta movimiento reducido. Borrado y reemplazo siguen limitados a trazos.

### Rectificación del orden y borrado espacial

El orden de las etapas del canvas es estrictamente creciente, no necesariamente consecutivo. Se permiten huecos después de borrar una etapa para conservar los números de secuencia originales. Si \`erase\` elimina la última tinta del sketch, se elimina esa etapa y se ajustan referencias de índice posteriores sin renumerar los elementos que permanecen. El primer trazo espera el retraso de su etapa; los snapshots acumulativos siguientes continúan la cola existente.


## Hito siguiente — clase continua con objetivos encadenados (2026-11-08)

La pizarra debe conservar el contexto de una clase mientras OmegaX cambia la atención entre partes. La secuencia demostrativa es: dibujar un átomo, señalar un electrón identificado, explicar, retirar el foco, señalar el núcleo, comparar y dibujar una relación adicional. El tablero no debe borrarse ni reconstruirse entre pasos.

Reglas de interacción:
- Reutilizar IDs del snapshot actual; cada objetivo debe pertenecer al visual que se está explicando.
- `clear-focus` limpia el señalador, nunca el contenido.
- Acciones encadenadas con orden explícito, confirmación individual, idempotencia y cancelación por generación al interrumpir.
- La pausa/reanudación continúa desde el último paso confirmado; no repetir audio ni animaciones ya completadas.
- Para partes todavía no direccionables (p. ej., flechas, enlaces, cables o puntos), usar foco del visual completo hasta implementar geometría/IDs propios.
- La animación visual puede seguir el orden de eventos, pero no debe presentarse como sincronía fonética exacta sin metadatos temporales del proveedor.

Este hito es una especificación pendiente, no una función terminada. Requiere regresiones automatizadas y QA manual de voz, micrófono, interrupciones y responsive.


## Addendum — pizarra de OmegaX para English Studio y todas las áreas (2026-11-08)

English Studio dispone de selector A1–C2 y sus prompts piden adaptar complejidad y feedback al nivel objetivo. En una explicación de inglés, la pizarra debe enseñar el elemento lingüístico: orden de palabras, parte de la frase, corrección, patrón, tiempo verbal, conectores, vocabulario, referencia o evidencia textual. El objetivo es que el alumno vuelva a producir una versión mejorada.

Las mismas reglas de atención se extienden a las cinco áreas ICFES con sus representaciones propias: operaciones/gráficas; texto/evidencias; cronologías/perspectivas; modelos/mecanismos/datos; estructuras y pistas del idioma.

El nivel CEFR seleccionado no es certificación ni nivel oficial de Inglés Saber 11. La ruta de examen mantiene las siete partes y el banco manual autorizado. No asignar puntuación de pronunciación desde transcripciones.

QA pendiente: probar A1, A2, B1, B2, C1 y C2 con explicaciones gramaticales que generen pizarra, roleplay, interrupción, reintento, fallback y persistencia en Chrome.

## Aula Live visual — 2026-11-10

- El escenario de llamada adopta una composición de lienzo claro y continuo: título manuscrito resaltado en la parte superior, pizarra alineada a la izquierda, subtítulos centrados en la franja inferior y controles repartidos en los extremos inferiores.
- Los subtítulos de salida de Gemini Live son permanentes. La transcripción de entrada puede mostrarse identificada separadamente como «Tu voz»; nunca se confunde con la voz de Orby.
- La barra inferior muestra la identidad visual de Orby, acceso al chat, guardado de apuntes, micrófono y salida de llamada. Los controles mantienen etiquetas accesibles y objetivos táctiles.
- Se añadió la herramienta Live `generate_orby_teaching_image` para solicitar ilustraciones PNG solo cuando las primitivas SVG y el banco visual no basten. La solicitud se ejecuta en paralelo con la enseñanza y la imagen se adjunta al mensaje activo del mismo turno.
- La ruta reutiliza Cloudflare Workers AI con Flux Schnell, autenticación de sesión, alcance Saber 11, límite de tres imágenes diarias, presupuesto gratuito y salida cerrada ante cuota agotada. El cliente limita a una ilustración por intervención, descarta respuestas de generaciones antiguas y nunca cambia a otro proveedor.
- SVG sigue siendo el medio obligatorio para geometría, fórmulas, gráficas y diagramas que requieren precisión. PNG es un recurso ilustrativo complementario; no sustituye la explicación ni constituye evidencia exacta.
- El video de referencia indica Kimi-K2 y ElevenLabs como servicios de Studdy, pero no identifica el proveedor de imágenes ni sus endpoints. PeakScore mantiene Gemini Live y no incorpora Kimi-K2 o ElevenLabs en esta fase.
- Validación pendiente: ejecutar las 305 pruebas más la nueva regresión visual, TypeScript, ESLint y build; después probar audio, tool call, cuota agotada, interrupción y responsive en Chrome real.

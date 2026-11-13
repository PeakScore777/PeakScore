# OmegaX — plan maestro de sincronización, aula y paridad funcional con Studdy

**Fecha de creación:** 13 de noviembre de 2026 (Colombia, UTC-5)  
**Proyecto:** PeakScore  
**Repositorio:** `PeakScore777/PeakScore`  
**Rama de trabajo:** `feat/founder-intro`  
**Rama protegida por alcance:** `main` (no modificar ni desplegar desde este plan)  
**Último HEAD consultado al crear este documento:** `c5167bd26b076ea8f48ecd8156b03b74585e41ce`  
**Estado:** plan vivo; se actualizará después de cada cambio de código, prueba o decisión técnica.

> **Regla de honestidad:** una función solo pasa a “Completada” cuando existe evidencia verificable del código y de las pruebas que correspondan. Un test estático o un build verde no certifican por sí solos que la experiencia funcione en Chrome con voz real.

---

## 0. Objetivo del proyecto

Convertir OmegaX en un profesor particular digital que dirige una clase completa, visual, interactiva y pedagógicamente sólida. No debe sentirse como un chatbot acompañado de una pizarra decorativa.

La experiencia debe combinar:

- La estructura de aula, el ritmo de escritura, la pizarra continua, los subtítulos, el panel lateral y los controles de Studdy.
- La profundidad de las ilustraciones, capas, etiquetas, flechas, mecanismos y explicaciones visuales del método de referencia Studley.
- La enseñanza alineada con competencias y evidencias de Saber 11, con preguntas originales y explicaciones rigurosas.
- Una sincronización robusta entre audio, transcripción, subtítulos, escritura, dibujos, foco de cámara e interacción del estudiante.
- Continuidad real: si el estudiante pregunta, interrumpe, pausa, responde o vuelve a la clase, OmegaX debe conservar el contexto y continuar desde el punto correcto.

La meta no es copiar marca, código, personajes ni recursos protegidos de Studdy. Se replican patrones funcionales y de interacción mediante una implementación propia.


## 0.1. Identidad oficial del producto — corrección obligatoria (2026-11-13)

**OmegaX es el tutor principal de estudio y aula conversacional de PeakScore.** Todo lo que en este plan se describe como la experiencia principal de tutoría, voz, pizarra, subtítulos, cámara, ritmo de clase, chat y paridad funcional con Studdy pertenece a OmegaX.

**Orby es exclusivamente el tutor de Ciencias Naturales dentro de los niveles/capítulos gamificados de PeakScore.** Orby no es el nombre del aula general ni del tutor principal.

Reglas de nomenclatura:
- UI, textos visibles, prompts de identidad, documentos activos y comunicación del producto: usar **OmegaX** para el tutor principal.
- Usar **Orby** únicamente al hablar del tutor de Ciencias Naturales de los niveles.
- No renombrar rutas, tablas, endpoints, columnas, funciones, imports, componentes históricos ni claves internas `orby_*` como parte de esta corrección: son identificadores técnicos heredados y cambiarlos aquí pondría en riesgo compatibilidad, datos y comportamiento.
- Los nombres técnicos históricos se pueden mantener internamente, pero nunca deben hacer que OmegaX se presente al estudiante como Orby.
- No se rediseña ni se altera el comportamiento actual del aula: esta corrección es de identidad, contexto, documentación y textos visibles.

## 1. Referencias y documentos que gobiernan el trabajo

Antes de cambiar un subsistema, leer y respetar sus especificaciones existentes. Este documento centraliza el orden y el registro de cambios; no reemplaza estas fuentes:

- `docs/ORBY-STUDDY-STUDLEY-CONTINUITY-2026-11-12.md` — continuidad técnica y hallazgos recientes.
- `docs/OMEGAX-STUDDY-2026-11-12.md` — experiencia de entrada, inicio, aula, controles, herramientas y criterios de aceptación.
- `docs/ORBY-STUDDY-PARITY-AUDIT-2026-11-10.md` — auditoría acumulada de paridad visual y funcional.
- `docs/ORBY-LIVE-TUTOR-SPEC.md` — contrato de aula Live, acciones de pizarra, foco, cola y cancelación.
- `docs/ORBY-VOICE-WHITEBOARD-SPEC.md` — límites reales de sincronización y composición del tablero.
- `docs/ORBY-VOICE-AUDIT.md` — incidencias de voz, telemetría y validación manual.
- `docs/ORBY-BOARD-ICFES-PEDAGOGY-SPEC.md` — método didáctico y adaptación a las cinco pruebas Saber 11.
- `docs/ORBY-IMPLEMENTATION-AUDIT.md` — arquitectura, validación semántica, currículo y pruebas pendientes.

Si dos notas históricas se contradicen, prevalece el comportamiento vigente del código comprobado y la aclaración más reciente del usuario. Registrar la decisión aquí; no resucitar flujos retirados.

## 2. Alcance funcional observado en la referencia

La grabación de Studdy revisada el 13/11/2026 muestra una clase construida por etapas, no un documento que aparece completo:

1. Preparación del tema y entrada al aula sin navegar a una página de carga innecesaria.
2. Hoja/pizarra limpia y continua.
3. Título manuscrito en la parte superior, resaltado y escrito progresivamente.
4. Introducción breve del objetivo y de la idea central.
5. Explicación que alterna narración, teoría breve, anotaciones y ejemplos.
6. Ilustraciones que aparecen cuando son necesarias, con trazos progresivos, etiquetas y partes explicadas.
7. Preguntas que invitan al estudiante a pensar y responder; la explicación continúa según su respuesta.
8. Conservación de lo escrito anteriormente; cada etapa agrega información en lugar de reemplazar toda la hoja.
9. Cámara/foco que acompaña el elemento que se explica, sin alejarse innecesariamente a toda la pizarra.
10. Subtítulos centrados y legibles, vinculados al discurso actual y sin acumular transcripciones antiguas.
11. Panel lateral de conversación/historial, sin convertir la clase en un chat convencional.
12. Controles accesibles para pausar, reanudar, volumen, teclado/chat, micrófono y salir.
13. Ritmo natural: pausas, tiempo de lectura, tiempo para responder y transiciones proporcionadas a la complejidad del contenido.

La velocidad exacta, los tiempos de cada etapa y las proporciones deben medirse sobre los videos originales y compararse en navegador. No inventar milisegundos universales: deben depender de longitud del texto, complejidad visual, audio y respuesta del alumno.

## 3. Arquitectura y archivos principales identificados

### Orquestación, sesión y controles
- `components/aprender/LessonAITutor.tsx`: ciclo de clase, Gemini Live, audio, transcripciones, subtítulos, interrupciones, snapshots, pausa/reanudación, controles, panel lateral y persistencia.
- `components/aprender/OrbyWorkspacePage.tsx`: espacio de estudio.
- `components/layout/GlobalOrbyClassroomLauncher.tsx`: acceso global.
- `app/orby/page.tsx` y `app/layout.tsx`: montaje/ruta y layout global.

### Pizarra, texto y visuales
- `components/aprender/OrbyBoard.tsx`: composición espacial, teoría, visuales, cámara y animaciones.
- `components/aprender/OrbyBoardTitle.tsx`: título manuscrito y resaltado.
- `lib/ai/orby-board.ts`: tipos, límites y sanitización de snapshots.
- `lib/ai/orby-board-actions.ts`: acciones acumulativas, foco, borrado y actualización.
- `lib/ai/orby-visual-bank.ts`: visuales canónicos de respaldo.
- `lib/ai/orby-live-tools.ts`: instrucciones y contratos de herramientas Gemini Live.
- `lib/ai/orby-class-start.ts`: inicio y secuencia pedagógica.

### Voz, subtítulos y proveedores
- `lib/ai/orby-subtitle-timing.ts`: segmentación y avance karaoke aproximado.
- `lib/ai/orby-speech-chunks.ts`: fragmentación de texto/voz.
- `lib/ai/orby-tts-audio.ts`: utilidades de audio TTS.
- `app/api/orby/realtime-session/route.ts`: configuración de sesión Live.
- `app/api/orby/realtime-turn/route.ts`: persistencia idempotente de turnos.
- `app/api/lesson-tutor/route.ts`: fallback escrito/por turnos.
- `app/api/orby/generate-image/route.ts`: ilustración raster complementaria.

### Pruebas y estilos
- `tests/orby-request-filter.test.mjs`: suite extensa de regresiones Orby.
- `app/globals.css`: estilos globales y responsive del aula.
- `package.json`: scripts reales de test, lint y build.

Esta lista orienta la auditoría; no significa que deban reescribirse todos estos archivos. Antes de editar, rastrear consumidores, contratos, efectos, estado y pruebas relacionadas.

## 4. Estado inicial verificado el 13/11/2026

### Ya existe en el código (no equivale a aceptación completa)
- Aula Live con Gemini, transcripción de salida y reproducción de chunks mediante Web Audio.
- Pizarra acumulativa con bloques, visuales tipados, layout espacial y acciones de foco.
- Título manuscrito y animaciones de revelado/escritura.
- Animación de teoría y trazos de visuales.
- Subtítulos centrados y karaoke calculado a partir del reloj de reproducción de Web Audio y una distribución estimada de palabras.
- Cola de snapshots con `spokenCue` cuando el modelo proporciona una frase exacta.
- Interrupción/generación, cancelación de herramientas, pausa/reanudación y persistencia de turnos.
- Panel lateral y controles de clase.
- Inicio integrado en la home, sin pantalla de carga separada, según la bitácora del 12/11.
- Contratos de visuales Saber 11 y fallback visual por turnos.

### Brechas confirmadas o pendientes
- El karaoke actual no es alineación fonética real. Distribuye el tiempo del audio entre palabras usando una estimación; no afirmar sincronía palabra-a-palabra perfecta.
- Si el proveedor no entrega una frase de cue que coincida con la transcripción, la escena debe esperar de forma segura al final del turno; no se debe adivinar el momento con un timeout.
- La animación de título/teoría necesita QA visual de velocidad, longitud, saltos de línea, fórmulas, lápiz y movimiento reducido.
- Las escenas deben coincidir con lo que se está explicando; verificar que no se adelante contenido, que no falten etapas y que los snapshots acumulativos no dupliquen tinta.
- Pausa/reanudación debe congelar y restaurar en un único reloj el audio y todas las animaciones. No basta con suspender AudioContext si algún timer/RAF/cola continúa por fuera.
- Las interrupciones deben detener audio, subtítulos y animaciones pendientes, descartar resultados antiguos y preservar lo ya confirmado.
- La interacción pedagógica necesita QA real: tiempo de espera, respuestas, corrección, repregunta y continuidad sin reiniciar la lección.
- La cámara debe enfocar el elemento activo y permitir exploración manual cuando corresponda.
- No se ha certificado todavía paridad audiovisual completa con una sesión real en Chrome.

### Límite de sincronización que debe respetarse
Gemini Live entrega audio y transcripción en eventos separados. El flujo utilizado no garantiza timestamps fonéticos por palabra. Por tanto:
- Usar el reloj real de AudioContext para alinear la interfaz con el audio programado.
- Usar `spokenCue` literal solo cuando coincida con la transcripción observada.
- Cuando haya timestamps/segmentos fiables del proveedor, diseñar un adaptador de alineación real y probarlo.
- Cuando no existan, etiquetar la sincronización como aproximada y elegir una degradación segura; no fingir precisión ni mostrar una escena antes de tiempo.
- No añadir un proveedor de pago para resolver este problema sin autorización explícita.

## 5. Plan de implementación por fases

Cada tarea debe ejecutarse en cambios pequeños, con pruebas nuevas o actualizadas y una actualización de este documento después de cada cambio. Una fase no se cierra porque se haya modificado el código: debe cumplir sus criterios de aceptación.

### Fase 0 — Línea base y control de calidad
**Prioridad:** P0 — antes de cambios de comportamiento adicionales.

Objetivos:
- Confirmar HEAD, scripts, suite, TypeScript, ESLint, build y workflows.
- Distinguir regresiones nuevas de fallos previos.
- Mantener una rama de trabajo única y no tocar `main`.

Trabajo:
1. Consultar el HEAD y los últimos workflows de GitHub Actions.
2. Ejecutar `npm run test:orby`, TypeScript, ESLint y build de producción mediante CI o entorno de ejecución disponible.
3. Registrar resultados por SHA y enlace al workflow.
4. Repetir manualmente los pasos que no se cubren en CI.
5. No afirmar que la voz o la pizarra funcionan solo porque compile.

Criterios de aceptación:
- [ ] SHA exacto identificado.
- [ ] Suite Orby aprobada.
- [ ] TypeScript aprobado.
- [ ] ESLint aprobado.
- [ ] Build de producción aprobado.
- [ ] Fallos y advertencias registrados.
- [ ] Estado de despliegue/Preview comprobado sin intentar una acción facturable.

### Fase 1 — Sincronización maestra de la clase
**Prioridad:** P0 — primera fase funcional.

Objetivo:
Que audio, subtítulos, teoría, trazos, ilustraciones y foco pertenezcan a una sola línea temporal controlada por la generación activa.

Trabajo:
1. Dibujar el ciclo completo de eventos desde la respuesta Live hasta el render y persistencia.
2. Identificar todos los relojes independientes: AudioContext, RAF, timers, CSS animations, colas de snapshots, colas de acciones y estados React.
3. Definir un contrato de evento común con generación/turn ID, secuencia monotónica, instante de inicio, duración cuando sea conocida, cue literal opcional, tipo de evento y estado cancelable.
4. El audio programado en Web Audio será la referencia temporal disponible; no utilizar `Date.now()` para simular alineación fonética.
5. Asegurar que las actualizaciones de transcripción acumulada no hagan retroceder el subtítulo ni cambien de generación.
6. Los snapshots con cue exacto solo se publican al alcanzar el cue; los no coincidentes esperan el cierre de turno.
7. Al finalizar el audio, liberar los elementos pendientes del mismo turno de forma ordenada.
8. Al interrumpir, invalidar inmediatamente toda cola perteneciente a la generación anterior.
9. Al pausar, congelar audio y animaciones en el mismo instante; al reanudar, continuar desde los offsets confirmados.
10. Mantener fallback seguro cuando falten metadatos, audio o cues.

Archivos principales:
- `LessonAITutor.tsx`
- `orby-subtitle-timing.ts`
- `orby-speech-chunks.ts`
- `orby-live-tools.ts`
- `OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

Pruebas:
- Audio con varios chunks y transcripción parcial/creciente.
- Cue exacto, cue que no coincide, cue que llega tarde y cue ausente.
- Transcripción repetida, vacía o que se amplía.
- Interrupción durante audio y durante animación.
- Pausa y reanudación repetidas.
- Audio que termina con snapshots pendientes.
- Respuesta antigua que llega después de una pregunta nueva.
- Sin doble reproducción ni duplicación de subtítulos.

Aceptación:
- [ ] Ninguna etapa futura aparece antes de su cue.
- [ ] Ningún evento de generación antigua altera la clase nueva.
- [ ] Pausa congela audio y animación.
- [ ] Reanudar no repite ni salta segmentos confirmados.
- [ ] Subtítulos no retroceden ni acumulan turnos anteriores.
- [ ] La sincronización se describe con precisión según los metadatos reales disponibles.
- [ ] Pruebas, TypeScript, ESLint y build pasan.

### Fase 2 — Motor de escritura manuscrita y teoría
**Prioridad:** P0.

Objetivo:
Que título, teoría, fórmulas y anotaciones se escriban con un ritmo natural y coherente con la clase.

Trabajo:
1. Revisar título de una línea, títulos largos, múltiples líneas, acentos, símbolos, fórmulas y cambios de tamaño.
2. Alinear el cursor/lápiz con el progreso real de revelado; no dejar el lápiz al final mientras aparecen caracteres por separado.
3. Comprobar que el resaltador amarillo se dibuja después o junto al título, sin taparlo.
4. Ajustar velocidad en función de longitud, ancho, número de líneas y densidad; evitar un único tiempo fijo.
5. Separar velocidad de lectura y velocidad de escritura: el estudiante debe poder leer antes de que el contenido desaparezca o cambie.
6. Para teoría, revelar una idea por etapa y mantener la tinta anterior.
7. No animar fórmulas/etiquetas como texto plano si el renderer matemático necesita renderizado atómico.
8. Congelar la animación durante pausa y respetar `prefers-reduced-motion`.
9. Evitar solapamientos entre lápiz, texto, etiquetas, subtítulos y controles.
10. Comparar la cadencia visual con los videos de referencia en Chrome.

Archivos principales:
- `OrbyBoardTitle.tsx`
- `OrbyBoard.tsx`
- `app/globals.css`
- pruebas de tablero en `tests/orby-request-filter.test.mjs`

Pruebas:
- Título corto/largo, multilínea y con caracteres especiales.
- Bloques cortos/largos, listas, ecuaciones y texto mixto.
- Cambio de tamaño de viewport durante escritura.
- Pausa/reanudación a mitad de un trazo.
- Movimiento reducido.
- Snapshot nuevo que agrega teoría sin borrar el contenido previo.

Aceptación:
- [ ] El lápiz sigue la escritura y no se teletransporta.
- [ ] El título termina completo y el resaltado no tapa letras.
- [ ] El ritmo varía razonablemente según contenido.
- [ ] Teoría y voz no se contradicen ni revelan etapas futuras.
- [ ] No hay saltos, solapamientos o pérdida de contenido.
- [ ] La animación responde a pausa, reanudación e interrupción.

### Fase 3 — Dibujo, ilustraciones y dirección de cámara
**Prioridad:** P1.

Objetivo:
Que las imágenes enseñen mecanismos y relaciones, no sean decoración ni tarjetas aisladas.

Trabajo:
1. Auditar los tipos visuales aceptados por sanitizador y renderer y asegurar que el prompt use solo esos contratos.
2. Priorizar SVG/diagramas tipados para gráficas, geometría, circuitos, estructuras y relaciones que requieran precisión.
3. Usar imágenes raster solo cuando aporten detalle orgánico que no pueda expresarse adecuadamente con primitivas; mantenerlas como complemento.
4. Hacer que el dibujo aparezca por etapas: contorno, partes internas, etiquetas, flechas, énfasis y explicación.
5. Las etiquetas deben renderizarse como texto real de interfaz, no depender de texto generado dentro de una imagen.
6. Cada flecha, estructura o parte debe describirse cuando aparece; no revelar todas las etiquetas de una sola vez.
7. Usar IDs estables para trazos y subelementos; nunca regenerar IDs de tinta que ya está visible.
8. Asegurar snapshots completos y acumulativos; un nuevo paso no debe borrar ni duplicar lo anterior.
9. Auditar `focus`, `clear-focus`, targets internos y geometría; no inventar IDs/posiciones.
10. La cámara centra la etapa activa, conserva contexto y permite exploración manual en pausa.
11. Cancelar generación raster y acciones visuales antiguas después de interrupción.
12. Verificar persistencia/rehidratación de imágenes y trazos sin asumir que ya funciona.

Archivos principales:
- `OrbyBoard.tsx`
- `orby-board.ts`
- `orby-board-actions.ts`
- `orby-visual-bank.ts`
- `orby-live-tools.ts`
- `app/api/orby/generate-image/route.ts`

Pruebas:
- Diagramas sencillos y complejos.
- Visuales con etiquetas, flechas, foco y subtargets.
- Snapshot acumulativo con IDs estables.
- Interrupción durante generación de imagen.
- Cuota agotada y error del proveedor.
- Rehidratación después de guardar/recargar.
- Zoom, foco, arrastre y responsive.

Aceptación:
- [ ] Dibujo conceptualmente correcto y legible.
- [ ] Se dibuja por etapas relacionadas con la narración.
- [ ] Etiquetas y flechas aparecen en el orden pedagógico.
- [ ] El foco apunta al elemento real.
- [ ] No se duplica tinta ni se pierde el tablero previo.
- [ ] Cuota agotada no dispara proveedores de pago.

### Fase 4 — Método pedagógico e interacción humana
**Prioridad:** P1.

Objetivo:
Que Orby explique, pregunte, escuche, diagnostique y adapte la siguiente explicación.

Secuencia didáctica flexible:
1. Enunciar el tema y la idea central.
2. Conectar con un ejemplo o intuición.
3. Presentar teoría en fragmentos breves.
4. Dibujar o escribir la representación cuando aporte comprensión.
5. Explicar cada elemento mientras se revela.
6. Hacer preguntas breves y naturales en momentos de comprobación.
7. Dejar tiempo real para pensar y responder.
8. Interpretar la respuesta y corregir el razonamiento, no solo indicar si está bien/mal.
9. Retomar el hilo exacto de la explicación.
10. Aplicar el concepto a un contexto nuevo tipo Saber 11.
11. Cerrar con síntesis y una comprobación breve.

Trabajo:
- Diseñar estados pedagógicos explícitos: explicación, ejemplo, pregunta, espera, respuesta, retroalimentación, repregunta, síntesis.
- Definir transiciones válidas y evitar que el modelo salte de una pregunta a un tema nuevo sin escuchar.
- Ajustar tiempo de espera por complejidad; no interrumpir al alumno ni dejar pausas incómodas sin estado visible.
- Recordar la pregunta pendiente y la respuesta del estudiante.
- Reconocer errores y explicar por qué un distractor parece atractivo.
- Alternar teoría, dibujo, ejemplo, analogía y pregunta; no forzar siempre la misma plantilla.
- Mantener español colombiano claro y nivel de 10.º/11.º.
- Adaptar las representaciones a Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.
- Crear preguntas y ejemplos originales; no copiar preguntas protegidas del ICFES ni presentar material propio como oficial.
- No convertir Orby en tutor de programación: su alcance de enseñanza es preparación académica Saber 11, salvo rutas de producto explícitamente separadas que ya existan.

Archivos a revisar:
- `orby-class-start.ts`
- `orby-live-tools.ts`
- `orby-board.ts`
- `orby-request-filter.ts`
- `orby-scope.ts`
- rutas Live y fallback
- `ORBY-BOARD-ICFES-PEDAGOGY-SPEC.md`

Aceptación:
- [ ] Hace preguntas naturales y relevantes.
- [ ] Espera la respuesta antes de continuar cuando la actividad lo exige.
- [ ] Corrige con explicación y conserva contexto.
- [ ] No repite la lección completa tras una interrupción.
- [ ] Cada una de las cinco áreas tiene representaciones adecuadas.
- [ ] La explicación y el tablero contienen los mismos conceptos y resultados.

### Fase 5 — Aula, navegación, chat y controles
**Prioridad:** P1.

Objetivo:
Eliminar fricciones de uso y garantizar que todos los controles hagan exactamente lo que anuncian.

Trabajo:
- Verificar home y preparación inline: el formulario y fondo permanecen visibles, el botón muestra preparación y no existe navegación a una pantalla de carga separada.
- La clase solo se monta cuando el handshake real de sesión está listo; no iniciar audio/clase antes de cargar los recursos imprescindibles.
- Verificar drawer lateral, historial y chat; no reactivar el chat genérico antiguo dentro del aula.
- Enter envía en el compositor, Shift+Enter conserva salto de línea y Escape cierra cuando corresponda.
- El texto del compositor no se pierde al cerrar accidentalmente.
- Controles: pausa, reanudar, volumen del tutor, teclado/historial, compositor, micrófono, conexión y salir.
- El micrófono nunca se solicita ni activa automáticamente; permiso solo tras acción explícita.
- La denegación de micrófono no bloquea la clase escrita.
- Salir solicita confirmación, termina la sesión de forma controlada y no borra historial/notas persistidas.
- Verificar foco de teclado, etiquetas ARIA, targets táctiles, z-index, overflow y responsive.
- Asegurar una sola instancia global del tutor y excluir landing, login, registro y simulacros cuando así lo define la especificación.

Archivos principales:
- `LessonAITutor.tsx`
- `OrbyWorkspacePage.tsx`
- `GlobalOrbyClassroomLauncher.tsx`
- `app/layout.tsx`
- `app/globals.css`

Aceptación:
- [ ] Home no desaparece durante la preparación.
- [ ] Aula no comienza antes de estar lista.
- [ ] Controles visibles y funcionales.
- [ ] Chat lateral no sustituye la pizarra.
- [ ] Micrófono con consentimiento explícito.
- [ ] Pausa/salida no pierden contexto ni persistencia.
- [ ] Responsive comprobado en escritorio y móvil.

### Fase 6 — Persistencia, recuperación y resiliencia
**Prioridad:** P1.

Objetivo:
Que una clase no se rompa por red, proveedor, recarga o respuestas tardías.

Trabajo:
- Auditar IDs de conversación, turnos, idempotencia, guardado y restauración.
- Verificar que cada turno solo se persiste cuando termina y que no se guarda dos veces.
- Confirmar que el board y la transcripción pertenecen al mismo turno.
- Probar desconexión Live, reconexión, fallback por turnos y vuelta a Live sin duplicar voces.
- Mantener el tema y adjuntos si falla la preparación.
- Manejar errores de micrófono, audio bloqueado, contexto suspendido, timeout y cuota.
- Descartar resultados de herramientas de generaciones antiguas.
- Verificar que los estados de error tengan acción clara y no dejen una clase vacía o congelada.
- No reconstruir material de Orby ICFES Lab que el usuario eliminó intencionalmente; usar solo documentos/materiales actuales publicados y disponibles.

Aceptación:
- [ ] Sin duplicados de turnos ni audio.
- [ ] Reconexión conserva contexto.
- [ ] Fallback no pierde la pizarra ni el tema.
- [ ] Cuota agotada comunica el límite y no cambia a un proveedor de pago.
- [ ] Recarga/restauración preserva lo que el producto promete guardar.

### Fase 7 — Validación académica y calidad de respuestas
**Prioridad:** P2.

Objetivo:
Reducir errores de contenido y contradicciones entre narración, pizarra, unidades, etiquetas y respuesta.

Trabajo:
- Validadores deterministas para errores recurrentes de alto impacto.
- Coherencia explicación-tablero: nombres, fases, valores, unidades, orden y relaciones.
- Casos adversariales y casos correctos que no deben alterarse.
- Separar hechos, modelos simplificados, hipótesis y ejemplos ilustrativos.
- Recuperar solo el material pertinente disponible; no asumir cobertura por el mero conteo de conceptos.
- Medir cobertura real por competencia/tema con evidencia de material publicado.
- No añadir una segunda llamada costosa por defecto ni juez de pago.

Aceptación:
- [ ] Pruebas de exactitud por área.
- [ ] Contradicciones detectables y bloqueadas cuando exista regla verificable.
- [ ] Incertidumbre explícita cuando no haya datos suficientes.
- [ ] No se inventan citas, datos o preguntas oficiales.

### Fase 8 — QA audiovisual integral y comparación con Studdy
**Prioridad:** P0 de cierre; se ejecuta después de las fases funcionales.

Protocolo:
1. Abrir PeakScore en Chrome con una cuenta de prueba.
2. Iniciar una clase con un tema Saber 11 de complejidad media.
3. Grabar pantalla y audio del sistema/micrófono con tiempos visibles.
4. Comparar: home, preparación, handshake, título, teoría, escritura, ilustración, preguntas, respuestas, subtítulos, drawer, controles y salida.
5. Repetir con una interrupción en mitad de explicación.
6. Repetir con pausa/reanudación en mitad de escritura.
7. Repetir con micrófono denegado y solo chat escrito.
8. Repetir con error/cuota de imagen agotada.
9. Probar escritorio y móvil.
10. Revisar consola, red, errores, audio y logs del servidor.
11. Documentar diferencias concretas y corregirlas por tandas.

Matriz de aceptación:
- [ ] No hay errores de consola atribuibles a Orby.
- [ ] No hay doble voz, voz solapada ni subtítulos de un turno anterior.
- [ ] No se revela contenido antes de explicarlo.
- [ ] La clase no comienza antes de completar la preparación.
- [ ] La escritura se ve progresiva, legible y natural.
- [ ] Los dibujos se entienden y se explican por partes.
- [ ] La cámara acompaña el elemento activo.
- [ ] El estudiante puede intervenir sin romper la clase.
- [ ] La pausa/reanudación continúa desde el punto correcto.
- [ ] El historial y el tablero se conservan según lo prometido.
- [ ] La comparación audiovisual queda documentada con grabaciones.

## 6. Reglas de producto, seguridad y costo

1. Trabajar solo en `feat/founder-intro`; no modificar `main` ni producción como parte de este plan.
2. No introducir proveedores, modelos, APIs o fallbacks que puedan generar cargos sin autorización explícita.
3. Respetar cuotas gratuitas reales; cuando se agoten, detener o degradar con un mensaje claro.
4. No falsear consentimientos ni enviar datos a proveedores sin autorización válida.
5. No solicitar micrófono al entrar; solo tras una acción explícita del estudiante.
6. Mantener Orby dentro del alcance académico Saber 11.
7. No reconstruir el material de Orby ICFES Lab eliminado intencionalmente.
8. No usar preguntas oficiales protegidas ni afirmar que material original es oficial.
9. No borrar historial, apuntes ni datos persistidos al salir de una clase.
10. No cambiar políticas de RLS, migraciones remotas, secretos o cuotas sin auditoría y autorización.
11. No usar CSS como parche para ocultar un fallo de estado o sincronización.
12. No considerar “build verde” equivalente a “producto correcto”.

## 7. Definición de terminado por cambio

Cada cambio individual debe documentarse con:

- Fecha y hora local.
- Objetivo y síntoma observado.
- Hipótesis técnica y evidencia.
- Archivos exactos modificados.
- Qué se cambió y qué se decidió no cambiar.
- Pruebas añadidas/actualizadas.
- Resultado de tests, TypeScript, ESLint y build.
- Enlace al commit y al workflow.
- QA manual realizado o pendiente.
- Riesgos/limitaciones restantes.
- Estado: **Pendiente**, **En progreso**, **Implementado sin validar**, **Validado por CI**, **Validado manualmente** o **Bloqueado**.

No usar “Completado” si falta una validación obligatoria de la fase.

## 8. Bitácora de cambios — actualizar después de cada cambio

### 2026-11-13 — Cambio 001: evitar revelado anticipado de snapshots sin cue coincidente

**Estado:** Implementado; regresión aprobada en CI; validación manual pendiente.  
**Archivos modificados:**
- `components/aprender/LessonAITutor.tsx`
- `tests/orby-request-filter.test.mjs`

**Problema confirmado:** la cola de snapshots tenía un fallback temporal de 2,5 segundos. Si la frase `spokenCue` no coincidía con la transcripción Live, el snapshot podía publicarse antes de que Orby explicara esa etapa.

**Cambio realizado:**
- Eliminado el fallback de 2,5 segundos.
- Un snapshot se publica cuando el índice del subtítulo alcanza el cue exacto o cuando termina el turno de audio.
- Si el cue no coincide, el snapshot permanece pendiente hasta el final del turno; se prioriza no revelar contenido futuro.
- Actualizada la regresión para exigir ausencia del timeout y conservar la cola hasta terminar el audio.

**Commits:**
- Código: `de370f0bd48d89e0673609ef6f083c9efb85d6ed`
- Prueba: `c5167bd26b076ea8f48ecd8156b03b74585e41ce`

**Validación observada:**
- Workflow del commit de código `43476838386`: falló en la suite de regresión porque la prueba todavía esperaba el fallback eliminado; TypeScript, ESLint y build no se ejecutaron en ese intento.
- Workflow del commit de prueba `43476864814`: regresiones Orby aprobadas, TypeScript aprobado, ESLint aprobado y build Next.js de producción aprobado en los pasos reportados.
- En la última consulta, GitHub Actions todavía mostraba el run como `in_progress` pese a que todos los pasos del job ya figuraban completados; consultar el resultado final antes de declarar el workflow cerrado.
- No se ejecutó una sesión manual de Chrome/Gemini Live para validar el comportamiento acústico y visual.

**Pendiente de QA:**
- Probar cue exacto, cue no coincidente y cue ausente en una clase real.
- Confirmar que el snapshot pendiente aparece al terminar el turno y no se pierde si hay varias etapas.
- Interrumpir la clase antes del final y comprobar que no se publique contenido de la generación anterior.
- Pausar/reanudar durante el turno y verificar que la cola conserva el orden.

**Riesgo aceptado:** cuando no hay coincidencia literal, una etapa puede aparecer al final del turno en vez de en el instante exacto de su explicación. Es preferible a adelantar contenido. La mejora posterior requiere timestamps/segmentos fiables o un contrato de cue verificable, no un timeout arbitrario.

---

## 9. Próximo cambio obligatorio

**Cambio 002 — Auditoría y corrección del ciclo único de pausa/reanudación.**

Antes de tocar el renderer, rastrear todos los mecanismos que avanzan durante una clase:
- AudioContext y fuentes programadas.
- Reloj de subtítulos.
- requestAnimationFrame de karaoke.
- Animación de bloques y trazos.
- Cola de snapshots por spokenCue.
- Cola de acciones de pizarra y foco.
- Temporizadores de espera/fin de turno.
- Estado de generación activa.

Entregable:
1. Diagrama del ciclo actual y lista de relojes.
2. Identificación de cuáles se suspenden, cuáles continúan y cuáles se reinician.
3. Prueba de regresión que demuestre pausa exacta y reanudación sin salto ni repetición.
4. Cambio mínimo en el código para unificar el comportamiento.
5. Actualización de esta bitácora con commit y CI.

No comenzar el cambio 003 hasta tener evidencia suficiente del cambio 002 y sus resultados.

---

## 10. Estado global de fases

| Fase | Estado |
|---|---|
| 0. Línea base y control de calidad | En progreso |
| 1. Sincronización maestra | En progreso; cambio 001 aplicado |
| 2. Escritura manuscrita y teoría | Implementada parcialmente; QA pendiente |
| 3. Dibujos y cámara | Implementada parcialmente; QA pendiente |
| 4. Método pedagógico | Parcial; QA real pendiente |
| 5. Aula y controles | Implementada parcialmente; QA responsive pendiente |
| 6. Persistencia y resiliencia | Parcial; QA de extremo a extremo pendiente |
| 7. Validación académica | Pendiente de ampliación |
| 8. QA audiovisual integral | Pendiente |

**Última actualización:** 13 de noviembre de 2026.  
**Regla de actualización:** añadir una entrada a la bitácora inmediatamente después de cada cambio de código y actualizar el estado de la fase correspondiente. No sobrescribir entradas anteriores; conservar el historial.


### 2026-11-13 — Cambio 002A: pausar/reanudar el título manuscrito

**Estado:** Implementado; pendiente de pruebas automatizadas y QA manual.  
**Archivo modificado:** `components/aprender/OrbyBoardTitle.tsx`

**Problema confirmado:** el título avanzaba mediante `setInterval` independiente del reloj de la clase. Suspender AudioContext y poner la pizarra en pausa no detenía ese intervalo; el título podía seguir escribiéndose mientras el estudiante había pausado la explicación.

**Cambio realizado:**
- Añadida la prop `paused` al componente del título.
- El intervalo se limpia al pausar y conserva el número exacto de caracteres ya revelados.
- Al reanudar, continúa desde el carácter guardado; no reinicia ni salta el título.
- La finalización se notifica una sola vez por texto, incluso si se pausa justo al terminar.
- Se conserva el comportamiento de movimiento reducido y el espacio no separable entre palabras.

**Commits:**
- Implementación inicial: `a700510a58b0b4c0590bde8d3b4db8e967ba5ee2`
- Corrección de escape del espacio no separable: `a2f80d39d331f90c308ce2d47de9bcb06c94950c`

**Validación:** todavía no ejecutada para estos commits. La suite, TypeScript, ESLint y build deben confirmar el cambio. QA manual pendiente: pausar a mitad del título, esperar varios segundos y reanudar; verificar que ni los caracteres ni el lápiz avanzan durante la pausa.

**Cableado realizado:** `LessonAITutor.tsx` pasa `paused={voiceTeachingPaused}` al título. La validación automatizada de ese cableado está incluida en el cambio 002B.


### 2026-11-13 — Cambio 002B: unificar pausa/reanudación del reloj de aula

**Estado:** Implementado; regresiones aprobadas en el primer workflow de CI; TypeScript/ESLint/build del HEAD final todavía pendientes de resultado. QA manual en Chrome pendiente.  
**Archivos modificados:**
- `components/aprender/LessonAITutor.tsx`
- `tests/orby-request-filter.test.mjs`
- `components/aprender/OrbyBoardTitle.tsx` (cambio 002A y correcciones de lint incluidas en esta misma línea de trabajo)

**Hallazgos confirmados antes de editar:**
1. `toggleVoiceTeachingPause()` suspendía AudioContext y cambiaba `drawingActive`, pero no detenía el intervalo del título.
2. El karaoke seguía ejecutando `requestAnimationFrame` mientras la clase estaba pausada; el AudioContext suspendido mantenía su tiempo congelado, pero el ciclo continuaba consumiendo frames.
3. `flushPendingOrbyTeachingBoard()` publicaba snapshots acumulativos cada 90 ms con `setTimeout`, sin comprobar la pausa. Una secuencia ya encolada podía seguir mostrando etapas futuras después de pulsar pausa.
4. Los snapshots con `spokenCue` podían recibir una llamada de flush desde otras rutas mientras la clase estaba pausada.

**Cambios realizados:**
- Se añadió un guard de transición para evitar dobles clics/races mientras AudioContext se suspende o reanuda.
- Al pausar, el flag compartido se cambia antes del `await audioContext.suspend()`, se detiene el renderer y se cancela el timeout de la cola de snapshots.
- La cola conserva el callback del siguiente snapshot y su índice; al reanudar programa ese mismo callback, sin adelantar el índice ni reiniciar la secuencia.
- Si la suspensión de AudioContext falla, se revierte el flag, se restaura el renderer y se intenta continuar la cola en vez de dejar la clase bloqueada en estado pausado.
- Los snapshots con cue no se publican durante la pausa.
- El efecto de karaoke no monta/continúa su ciclo RAF mientras `voiceTeachingPaused` está activo y vuelve a sincronizarse al cambiar el estado.
- El título recibe `paused={voiceTeachingPaused}`; el componente conserva el número de caracteres, limpia el intervalo al pausar y reanuda desde el punto alcanzado.
- Se añadieron regresiones para el título, la cola de snapshots, el callback de reanudación, el guard de cues y el ciclo de karaoke.

**Commits:**
- `a700510a58b0b4c0590bde8d3b4db8e967ba5ee2` — primer cambio del título.
- `a2f80d39d331f90c308ce2d47de9bcb06c94950c` — ajuste de espacio no separable.
- `4a25e56017c768abc03a7044277fd73df968bb15` — corregir actualización de estado en reduced motion.
- `35c9b5eaccb5991d432662542bb48fa06ae994bf` — retirar reset de estado síncrono dentro del efecto.
- `2713017f9394779d2c1494ca827e0c228881f594` — pausa común, cola y karaoke.
- `f3e58c54647a945b028225bafb0e515b1ff330a9` — pruebas de regresión.

**Incidencias de validación encontradas y tratadas:**
- Los primeros workflows de título fallaron en ESLint por `react-hooks/set-state-in-effect` al completar movimiento reducido. Se movió la actualización visual al callback asíncrono y se eliminó el reset síncrono innecesario. No ocultar ni desactivar la regla.
- El workflow del commit `2713017` reportó la suite Orby aprobada; TypeScript seguía ejecutándose en la última consulta.
- El workflow del HEAD `f3e58c5` estaba en cola/ejecución cuando se actualizó esta entrada. Verificar su conclusión final antes de cerrar el cambio.

**QA manual obligatorio aún pendiente:**
- Pausar el título a mitad de escritura, esperar 3–5 segundos y reanudar: no debe avanzar mientras está pausado y debe continuar del carácter correcto.
- Pausar durante una secuencia de varios snapshots: no debe aparecer ninguna etapa nueva durante la pausa; al reanudar debe aparecer la siguiente, sin perder ni duplicar.
- Pausar cuando un cue ya está alcanzado y verificar que el flush no publica durante la pausa.
- Pausar durante una animación SVG y durante el karaoke; ambos deben quedarse congelados y continuar sin saltos.
- Interrumpir mientras está pausada: no deben reproducirse ni publicarse eventos de la generación anterior.
- Comprobar el estado del micrófono: la pausa detiene la enseñanza de salida, no debe apagar ni pedir permiso de micrófono inesperadamente.

**Límite:** la pausa de audio, RAF, título y cola ya tiene control explícito en código; los SVG usan su reloj interno y el renderer existente pausa SMIL/CSS mediante `drawingActive`. Aún no hay prueba E2E real en navegador que demuestre que todos los tipos de visual y animaciones CSS quedan congelados exactamente en el mismo frame. No declarar pausa perfecta hasta el QA manual.



### 2026-11-13 — Cambio 003: congelar todas las animaciones SVG y CSS de la pizarra

**Estado:** Implementado en código y con regresiones añadidas; CI en ejecución. QA manual en Chrome pendiente.  
**Archivos modificados:**
- `components/aprender/OrbyBoard.tsx`
- `app/globals.css`
- `tests/orby-request-filter.test.mjs`

**Problema confirmado:** el estado `drawingActive` ya pausaba algunos trazos y animaciones CSS de clases conocidas, pero no todos los tipos de visual tenían el mismo contrato. Los diagramas y elementos de enfoque contienen animaciones SMIL propias; etapas espaciales, etiquetas, vectores, moléculas y otras visualizaciones podían tener animaciones CSS independientes. Una regla dirigida solo a unas pocas clases no garantizaba congelar todo el tablero.

**Cambios realizados:**
- El componente principal de la pizarra ahora sincroniza el reloj de cada SVG descendiente mediante `pauseAnimations()` y `unpauseAnimations()`.
- Se añadió un `MutationObserver` sobre el tablero para aplicar el estado también a SVG que se monten después, mientras llegan snapshots incrementales.
- Los errores de API del reloj SVG se manejan sin romper el render; las reglas CSS mantienen la degradación visual.
- Se añadieron reglas para pausar todas las animaciones CSS de los descendientes del tablero, incluidos `::before` y `::after`, cuando `data-orby-drawing-active="false"`.
- Se conservaron las reglas específicas existentes y el comportamiento de movimiento reducido.
- Se añadieron pruebas de regresión para los relojes SVG, la observación de nodos añadidos y el selector CSS global de pausa.

**Commits:**
- `f0a2c309b85a55e27231017e5665efaec536b641` — control de relojes SVG y MutationObserver.
- `b7030400ad98d40fce9c95e0aaf36089c7abe1c8` — pausa global de animaciones CSS.
- `5bd3acee7d84e3539ca2331da84b086d88d239e8` — regresiones de la pizarra.

**Validación:** GitHub Actions creó workflows para los commits de implementación y CSS; al registrar esta entrada ambos estaban en ejecución/cola. Consultar el workflow del HEAD de pruebas para el resultado final de Orby tests, TypeScript, ESLint y build. No declarar CI aprobado antes de ver todos los pasos.

**QA manual obligatorio:**
- Pausar una ilustración de tipo sketch a mitad de trazo: la tinta y el lápiz deben congelarse.
- Pausar un diagrama con flechas, etiquetas y foco: el reloj SMIL debe detenerse.
- Pausar visuales de grafo, vectores, molécula, circuito, célula, ADN y sistema orgánico.
- Añadir un snapshot mientras la clase está pausada y verificar que el SVG recién montado también queda congelado.
- Reanudar y verificar continuidad, sin reinicio ni salto.
- Probar impresión/PDF y `prefers-reduced-motion` para confirmar que los nuevos selectores no alteran esas rutas.
- Verificar que el zoom y el desplazamiento manual siguen funcionando durante la pausa.

**Límite:** los tests actuales verifican contratos de código, no el reloj real de Chrome. La API SMIL y la pausa CSS deben comprobarse en navegador con grabación; no afirmar todavía sincronía perfecta de todos los frames.


### 2026-11-13 — Cambio 004: sincronizar cámara y foco con las etapas reveladas

**Estado:** Implementado en código y con pruebas de regresión añadidas; CI pendiente de completar. QA visual en navegador pendiente.  
**Archivos modificados:**
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

**Problema confirmado:** el foco de una etapa espacial podía existir desde el primer render aunque la entrada visual de esa etapa todavía no hubiera terminado. En trazos manuales, el marcador de foco también se montaba antes de que la tinta alcanzara el punto indicado. La cámara no tenía una sincronización explícita con la disponibilidad real del objetivo.

**Cambios realizados:**
- El foco de un trazo se mantiene oculto hasta que el reloj SVG supera el final del trazo correspondiente. Se consulta el tiempo de la propia línea de tiempo SVG mediante `getCurrentTime()`, por lo que la espera se congela con la pausa de la clase.
- Las etapas espaciales notifican que terminaron su animación de entrada mediante `animationend` y el atributo `data-orby-focus-ready`.
- La cámara busca el objetivo del profesor y solo lo desplaza al área visible cuando está disponible. El desplazamiento usa `block: "nearest"` e `inline: "nearest"` para evitar saltos innecesarios.
- El seguimiento se cancela y limpia al cambiar el objetivo, pausar o desmontar el tablero; una pausa no ejecuta un seguimiento nuevo.
- En `prefers-reduced-motion`, donde no se emite el evento de entrada porque la animación está deshabilitada, el objetivo se marca listo sin esperar un evento inexistente.
- Se añadieron regresiones para verificar el orden de dibujo/foco, la disponibilidad de etapa, el seguimiento de cámara y el camino de movimiento reducido.

- **Ajuste de sincronización:** en etapas de texto, el evento de entrada del contenedor (240 ms) no equivale a que haya terminado la escritura del contenido. La cámara ahora espera el evento `orby-board-text-write` del elemento `.orby-board-write-ink`; para etapas visuales conserva el evento de entrada del contenedor. Se agregó una aserción para impedir que el foco adelante la escritura.

**Commits:**
- `00a4c23779d4aeafe5cabd3f4269b4114e1b8ea0` — sincronización inicial de cámara y foco.
- `380265aa376b01f53d871baf46fcffb9c8edcce9` — pruebas de regresión.
- `5b277f22dcb9bc331ee716e105ab3d95c5a844db` — compatibilidad de cámara con movimiento reducido.
- `28827437814ba55ed29954b2b263861146c7eea2` — prueba de movimiento reducido.

**QA manual obligatorio:**
- En una composición de varias hojas, pedir foco sobre una etapa que todavía no entró: la cámara debe esperar y desplazarse una sola vez.
- En un sketch, enfocar un punto intermedio: el indicador no debe aparecer antes de que la tinta llegue al punto.
- Pausar antes de completar el trazo y comprobar que el foco no aparece mientras está pausado; reanudar y comprobar que aparece al terminar.
- Cambiar rápidamente el objetivo y comprobar que no queda un scroll pendiente hacia el objetivo anterior.
- Verificar que el desplazamiento manual, zoom, teclado y navegación de páginas siguen funcionando.
- Activar `prefers-reduced-motion` y comprobar que el foco no se queda esperando un `animationend` que no ocurrirá.
- Comprobar el caso de una sola hoja y las clases sin foco explícito.

**Límite:** las pruebas de regresión inspeccionan contratos del código; no sustituyen la comprobación de scroll, eventos de animación y reloj SVG en Chrome. No afirmar todavía que la cámara tiene seguimiento cinematográfico o que todos los cambios de foco se ven perfectos sin QA visual.


### 2026-11-13 — Cambio 005: ritmo natural de escritura del título

**Estado:** Implementado en código y prueba de regresión añadida; CI del commit en curso.  
**Archivos modificados:**
- `components/aprender/OrbyBoardTitle.tsx`
- `tests/orby-request-filter.test.mjs`

**Problema observado en el código:** el título se revelaba con un intervalo uniforme por carácter. Aunque la velocidad media era aceptable, las palabras y los signos de puntuación no tenían pausas propias, lo que daba una sensación mecánica.

**Cambios realizados:**
- Se sustituyó el intervalo fijo por una secuencia de temporizadores de un carácter, conservando el progreso exacto entre renders.
- Se añaden pausas más largas después de punto, interrogación, exclamación y puntos suspensivos; pausas medias después de coma, punto y coma y dos puntos; y una pausa breve entre palabras.
- La pausa de clase detiene la secuencia sin reiniciar ni saltar caracteres al reanudar.
- Se limpian los temporizadores al desmontar o cambiar el texto para evitar escrituras duplicadas o callbacks tardíos.
- Se añadió una prueba que comprueba el ritmo por puntuación, continuidad al pausar y limpieza del temporizador.

**Validación:** la prueba de regresión se añadió; falta confirmar el workflow más reciente, incluyendo TypeScript, ESLint y build. No se afirma todavía que el ritmo sea idéntico al vídeo de referencia: requiere ajuste visual/auditivo en navegador.

- **Corrección de lint del cambio 005:** el arreglo de escritura por temporizadores dejó de depender de un array de caracteres recreado en cada render. Se memoizó por texto con `useMemo`, manteniendo el mismo comportamiento y evitando una dependencia inestable en el efecto.

**Fuera de alcance de este cambio:** no se modificó aún el ritmo de los párrafos de teoría, fórmulas, dibujos ni voz. Esos elementos deben coordinarse en cambios separados para evitar alterar la sincronización de subtítulos y audio.


### 2026-11-13 — Corrección de identidad: OmegaX vs. Orby

**Estado:** nomenclatura de producto corregida en este documento maestro. Revisión de documentos y superficies de UI en curso.

- Tutor principal, aula Studdy, chat, voz, pizarra, subtítulos, cámara y ritmo: **OmegaX**.
- Tutor de Ciencias Naturales exclusivo de niveles/capítulos: **Orby**.
- Se conserva la implementación y los identificadores técnicos existentes para no romper rutas, APIs, persistencia, imports ni datos.
- Esta corrección no cambia el diseño, los flujos, el motor Gemini Live, los estilos, las animaciones ni la lógica pedagógica ya implementada.
- La documentación histórica no se borra ni se reescribe como si el nombre hubiera sido siempre OmegaX: se etiqueta como archivo histórico y se añade esta correspondencia oficial.



### 2026-11-13 — Corrección de identidad en código: OmegaX principal / Orby CN

**Estado:** cambios implementados y pruebas añadidas; CI pendiente. No se modificó el diseño ni el motor de clase.  
**Archivos modificados:**
- `components/aprender/LessonAITutor.tsx`
- `components/layout/GlobalOrbyClassroomLauncher.tsx`
- `components/aprender/OrbyBoard.tsx`
- `tests/orby-request-filter.test.mjs`

**Hallazgo:** el aula principal ya recibía `assistantName="OmegaX"` en varias rutas, pero había textos visibles y vocabulario de reconocimiento de voz que todavía mencionaban Orby. Además, el launcher global de niveles pasaba OmegaX incluso en el Santuario de la Materia, donde debe conservarse Orby como tutor de Ciencias Naturales.

**Cambios realizados:**
- El nombre que usa la UI de conversación ahora deriva de `assistantName`, en lugar de quedar fijo.
- El aula general mantiene OmegaX como identidad predeterminada.
- El launcher global asigna Orby únicamente en rutas `/aprender/santuario-de-la-materia`; en el resto mantiene OmegaX.
- El vocabulario de reconocimiento de voz se adapta al tutor activo: OmegaX en el aula general y Orby en el nivel de Ciencias Naturales.
- El botón de abrir/cerrar chat usa el nombre dinámico correcto.
- Los textos alternativos de visuales de pizarra usan una descripción neutral para no atribuir incorrectamente el tablero a uno u otro tutor.
- Se añadieron pruebas de regresión para la identidad del aula principal y la excepción de Orby en CN.

**Compatibilidad deliberada:** se mantienen nombres técnicos heredados como `OrbyWorkspacePage`, `OrbyBoard`, `orby_*`, `/orby`, tablas y migraciones. Renombrarlos no es necesario para corregir la identidad del producto y podría romper imports, enlaces, datos o contratos API. No se cambió la lógica funcional ni visual de esos módulos.

**Documentación:** las especificaciones históricas de aula/pizarra se etiquetaron como documentos históricos cuya experiencia principal corresponde a OmegaX. El documento maestro ya define la identidad oficial.

- **Ajuste de regresión de identidad:** una prueba histórica todavía exigía literalmente «Cerrar chat con Orby». Se actualizó para validar el nombre dinámico (`assistantLabel`), que permite OmegaX en el aula general y Orby en el nivel de CN sin duplicar componentes.

**Validación pendiente:** confirmar regresiones, TypeScript, ESLint y build en el workflow del HEAD actual; después realizar QA manual de las dos rutas para confirmar que el nombre hablado, el vocabulario de voz y las etiquetas accesibles coinciden con el tutor correcto.

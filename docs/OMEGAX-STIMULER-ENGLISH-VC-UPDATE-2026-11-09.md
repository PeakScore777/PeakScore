# Iteración 2026-11-09 — English Studio Stimuler + Orby VC

**Rama:** `feat/founder-intro`  
**Objetivo:** convertir English Studio en un entrenador de inglés centrado en ejercicios orales y Orby VC en una clase conversacional continua con pizarra.  
**Estado de esta revisión:** investigación y diagnóstico de implementación; no declarar funciones terminadas ni QA real.

## 1. Referencias revisadas

### Studdy — vídeos aportados
Se inspeccionaron visualmente `studdy.mp4` (47,6 s) y `studdy (2).mp4` (309,1 s), junto con el vídeo reciente de PeakScore.

Patrones observados:
- El aula es el espacio de trabajo principal; la pizarra ocupa la mayor parte del viewport.
- La explicación y los diagramas permanecen visibles y se amplían progresivamente.
- El tutor puede señalar partes de un diagrama sin borrar el contenido.
- La voz es una conversación continua y el alumno puede intervenir para pedir aclaraciones.
- Los controles de voz son compactos y secundarios frente a la pizarra.
- La clase conserva el contexto durante una sesión larga.

No inferir proveedores, frameworks ni arquitectura privada de Studdy a partir de la interfaz. No reutilizar marca, textos ni ilustraciones propietarias.

### Stimuler — investigación pública
La propuesta pública de Stimuler presenta un ciclo simple: hablar sobre un tema durante un tiempo, recibir feedback y repetir. También ofrece conversaciones por temas y pruebas de speaking. Su producto Premium anuncia análisis más detallados y métricas; no se debe asumir que todas las funciones avanzadas son gratuitas.

Fuentes consultadas:
- https://stimuler.tech/es
- https://stimuler.tech/
- https://stimuler.tech/premium
- https://stimuler.tech/blog/speak-vs-stimuler-2026

## 2. Diagnóstico de English Studio actual

Archivo: `components/aprender/OmegaXEnglishStudio.tsx`.

Hallazgos:
- Hay cinco laboratorios visibles (Speaking, Pronunciation, Listening, Reading, Writing), una tarjeta de roleplay, otro selector de escenarios y paneles de explicación. La cantidad de decisiones iniciales compite con la actividad principal.
- Speaking graba hasta 60 segundos, luego transcribe y solicita feedback por separado.
- Pronunciation usa una frase modelo y ofrece iniciar una llamada con OmegaX, pero la práctica principal compara texto reconocido.
- El propio componente reconoce que una transcripción no permite puntuar fonemas ni acento.
- El porcentaje de coincidencia de palabras no es una puntuación fonética y no debe presentarse como tal.
- La voz del navegador para Listening no es una grabación nativa.
- El diseño actual tiene varias acciones de cambio de tema, repetir, guardar, grabar, transcribir y analizar distribuidas en la misma vista.

### Dirección UX obligatoria
Reorganizar la experiencia en una ruta guiada con una sola decisión principal:
1. **Practicar ahora**: una actividad oral recomendada según nivel y objetivo.
2. **Hablar**: un único control principal para iniciar/detener la práctica o llamada.
3. **Tu resultado**: feedback breve y priorizado, con opción clara de volver a intentarlo.

Las actividades adicionales (Listening, Reading, Writing, gramática, vocabulario y preparación Saber 11) deben estar agrupadas como rutas secundarias, no como seis tarjetas equivalentes al entrar.

Después de cada intervención oral, mostrar:
- puntuación global solo si hay evidencia acústica válida;
- pronunciación, fluidez, gramática, vocabulario, coherencia y ritmo por separado cuando el motor pueda medirlos;
- fragmento detectado, forma recomendada y explicación sencilla;
- botón para escuchar el modelo con voz disponible y botón para repetir el mismo objetivo;
- historial de intentos para comparar progreso.

**Regla de honestidad:** nunca calcular una puntuación de pronunciación a partir de la transcripción Whisper o del porcentaje de coincidencia de palabras. Si solo hay STT, mostrar correcciones de contenido/gramática y explicar que la pronunciación no pudo medirse. No inventar porcentajes fonéticos.

## 3. Currículo general de inglés que debe alimentar las actividades

El currículo debe ser una malla etiquetada por CEFR (Pre-A1, A1, A2, B1, B2, C1, C2), función comunicativa, estructura, vocabulario, habilidad y evidencia observable. El nivel CEFR es una guía de práctica, no una certificación ni un nivel oficial de Inglés Saber 11.

### Gramática y estructuras
- Sustantivos, pronombres, artículos, determinantes, cuantificadores y posesivos.
- Verbo *be*, *have*, auxiliares *do/does/did*, imperativos y orden de palabras.
- Presente simple y continuo; pasado simple y continuo; futuro con *will*, *be going to* y presente continuo.
- Present perfect, present perfect continuous, past perfect y past perfect continuous.
- Formas futuras avanzadas: future continuous y future perfect.
- Verbos modales: can/could, may/might, must, have to, should, ought to, would, needn't.
- Condicionales zero, first, second, third y mixed; *wish* / *if only*.
- Voz pasiva en tiempos frecuentes y estructuras causativas.
- Discurso directo e indirecto; cambios de tiempo, pronombres y referencias temporales.
- Gerundios e infinitivos; verb patterns; phrasal verbs.
- Comparativos, superlativos, intensificadores y estructuras de igualdad.
- Adverbios, adjetivos, preposiciones de tiempo/lugar/movimiento y dependencias verbo-preposición.
- Oraciones relativas definitorias/no definitorias, cláusulas nominales, subordinación y elipsis.
- Preguntas directas/indirectas, question tags, respuestas cortas y auxiliares.
- Concordancia, artículos cero, sustantivos contables/no contables y formación de palabras.
- Puntuación, mayúsculas, ortografía y registro formal/informal.

### Conectores y cohesión
- Adición: and, also, moreover, furthermore, in addition.
- Contraste: but, however, although, even though, whereas, while, nevertheless, despite, in spite of.
- Causa y resultado: because, since, as, so, therefore, thus, consequently, due to, owing to.
- Secuencia: first, next, then, afterwards, meanwhile, eventually, finally.
- Ejemplificación: for example, for instance, such as.
- Comparación: similarly, likewise, compared with, in the same way.
- Condición y concesión: if, unless, provided that, as long as, even if.
- Propósito: to, in order to, so that.
- Reformulación y conclusión: in other words, that is, overall, in conclusion, to sum up.
- Referencia, sustitución, pronombres, cadenas léxicas y cohesión entre párrafos.

### Vocabulario y funciones comunicativas
- Identidad, familia, rutinas, escuela, hogar, ciudad, transporte, comida, salud y ocio.
- Viajes, compras, servicios, direcciones, tecnología, medios y medioambiente.
- Educación, trabajo, ciudadanía, cultura, ciencia, sociedad y temas globales.
- Colocaciones, expresiones frecuentes, phrasal verbs, idioms apropiados al nivel, falsos cognados y formación de palabras.
- Presentarse, describir, narrar, comparar, pedir/aclarar información, expresar opinión, justificar, sugerir, acordar/discrepar, especular, resumir y argumentar.
- Pronunciación segmental: vocales, consonantes, pares mínimos, terminaciones -s/-es y -ed, grupos consonánticos.
- Prosodia: sílaba tónica, acento de palabra, ritmo, reducción, linking, entonación y pausas.

### Listening, Reading, Writing y Speaking
- Listening: idea general, detalle, propósito, actitud, inferencia, intención y reconocimiento de paráfrasis.
- Reading: localizar información, referencias, vocabulario en contexto, idea principal, inferencia, propósito, tono y cohesión.
- Writing: oración, párrafo, correo, descripción, narración, opinión, argumento, conectores, revisión y adecuación al destinatario.
- Speaking: inteligibilidad, respuesta pertinente, fluidez, desarrollo, interacción, precisión gramatical, rango léxico, pronunciación y prosodia.

### Inglés Saber 11
Mantener una ruta específica para el examen, sin confundirla con CEFR completo:
- Parte 1: conocimiento lexical y relación palabra-imagen/contexto.
- Parte 2: avisos y situaciones comunicativas.
- Parte 3: conversaciones y selección de respuesta adecuada.
- Parte 4: texto con espacios / estructura gramatical y lexical.
- Parte 5: comprensión de lectura con selección de respuesta.
- Parte 6: completar texto mediante cohesión y gramática.
- Parte 7: lectura de textos más extensos e inferencia/comprensión.
Los ejercicios deben ser originales y alineados al formato/competencias, sin copiar material protegido. Preservar la estructura y ponderaciones de la guía ICFES vigente que ya esté documentada en `docs/ORBY-BOARD-ICFES-PEDAGOGY-SPEC.md`.

## 4. Orby VC — contrato de experiencia

No es una grabadora ni un chat que envía transcripciones. La interacción esperada es una llamada de voz bidireccional:
- micrófono abierto durante la clase con detección de turnos;
- respuesta de voz en streaming;
- barge-in: al detectar voz del estudiante, detener audio/TTS y cancelar la respuesta vigente;
- conservar contexto de clase, objetivo y pizarra;
- continuar desde el punto interrumpido sin repetir audio ni duplicar trazos;
- controles compactos: silenciar micrófono, pausar/reanudar, terminar llamada;
- estado de conexión/reconexión y aviso de permisos;
- texto/transcripción opcional como apoyo accesible, nunca como interfaz principal.

### Pizarra
Reutilizar el contrato actual de `lib/ai/orby-board.ts`, `lib/ai/orby-live-tools.ts` y `components/aprender/OrbyBoard.tsx`:
- snapshots acumulativos e IDs estables;
- acciones incrementales y foco sobre elementos existentes;
- conservar tinta y diagramas mientras se explica;
- visuales del banco curado por asignatura, tema y concepto;
- recuperar la pizarra al reabrir una clase;
- no generar una imagen aleatoria en cada turno.

El banco visual requiere metadatos: subject, topic, concept, asset type, source, license, alt text, version y tags. Priorizar recursos propios/originales y recursos abiertos con licencias verificadas. No usar ilustraciones de Studdy ni inferir que sus imágenes provienen de un generador específico.

## 5. Diagnóstico del bloqueo de Cloudflare y Gemini

### Cloudflare Workers AI
Archivos:
- `lib/ai/provider-free-tier.ts`
- `lib/ai/cloudflare-workers-ai.ts`

El módulo exige:
- `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED=true`
- `CLOUDFLARE_ACCOUNT_ID` con formato válido
- `CLOUDFLARE_API_TOKEN`

La variable de confirmación es una declaración operativa; el código no puede verificar el plan real de la cuenta a partir de la API token. No se debe establecer automáticamente ni ocultar el aviso si no se ha verificado el dashboard.

Cloudflare publica una asignación de 10.000 Neurons diarios sin coste en Workers Free; al superar el límite, la inferencia falla. Algunos modelos requieren Workers Paid. Verificar que el modelo usado está disponible en Workers Free y que el proyecto está realmente en ese plan antes de confirmar la variable.

Fuentes oficiales:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/
- https://developers.cloudflare.com/workers/platform/limits/

### Gemini Live
Archivo: `app/api/orby/realtime-session/route.ts`.

La ruta bloquea la sesión si no se cumplen ambas condiciones:
- `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true`
- `PEAKSCORE_GEMINI_DATA_USE_APPROVED=true`

Además, producción exige `ORBY_GEMINI_LIVE_ENABLED=true`. La llave `GEMINI_API_KEY` por sí sola no activa Live. La aprobación de plan y la aprobación de tratamiento de datos son decisiones separadas. No retirar estos controles ni marcar consentimiento en nombre del usuario.

### Alternativa Cloudflare Voice
La documentación de Cloudflare Agents describe audio WebSocket bidireccional, streaming de TTS, STT continuo e interrupción/cancelación del audio cuando habla el usuario. Sin embargo, no se debe asumir que todo el stack de voz es gratis: comprobar coste/cuota exacta de cada modelo STT/TTS en Workers AI antes de integrarlo. El módulo actual comenta explícitamente que no exporta TTS Cloudflare porque las rutas de síntesis evaluadas son metered.

Fuentes:
- https://developers.cloudflare.com/agents/agent-class/communication-channels/voice/
- https://developers.cloudflare.com/agents/examples/voice-agent/
- https://developers.cloudflare.com/ai-gateway/usage/websockets-api/realtime-api/

## 6. Orden de implementación y aceptación

### P0 — habilitación segura y diagnóstico
- Verificar cuenta/modelos/cuota Cloudflare desde dashboard; configurar variable solo tras verificación.
- Decidir explícitamente si se aprueba el uso de datos del Free Tier de Gemini. No inferir consentimiento.
- Eliminar mensajes ambiguos: diferenciar configuración pendiente, proveedor no habilitado, cuota agotada, rate limit y fallo temporal.
- Verificar que ningún error activa proveedor alternativo de pago.

### P1 — llamada real
- Probar apertura de sesión, micrófono, audio entrante/saliente, interrupción, cancelación, reanudación, reconexión y cierre.
- El audio debe empezar sin esperar una transcripción final o una grabación.
- Las transcripciones se conservan como subtítulos opcionales.
- No duplicar respuestas ni reproducir audio antiguo tras un barge-in.

### P2 — English Studio
- Simplificar la pantalla inicial a una actividad recomendada.
- Construir ejercicios de pronunciación con modelo de audio, intento del estudiante, análisis acústico válido, feedback accionable y repetición.
- No mostrar porcentaje fonético si solo se dispone de STT.
- Agregar evaluación multidimensional y ruta de práctica adaptativa.
- Cubrir niveles Pre-A1–C2 y ruta Saber 11 de siete partes.

### P3 — QA
- Unit tests para evaluación, estados de proveedor, barge-in y cancelación.
- TypeScript, ESLint y build.
- QA manual en Chrome con micrófono real, auriculares, interrupciones, ruido, reconexión y viewport móvil.
- No afirmar clase en vivo lista hasta validar audio real extremo a extremo.

## 7. Restricciones permanentes
- Trabajar únicamente en `feat/founder-intro`; no tocar `main`, no hacer merge ni despliegue sin autorización.
- No usar modelos, servicios, créditos de inferencia ni fallbacks que puedan generar cargos.
- Si se agota una cuota gratuita, pausar/degradar con mensaje claro.
- No reconstruir material de Orby ICFES Lab eliminado intencionalmente.
- No aplicar migraciones remotas sin autorización.
- No declarar pruebas manuales que no se hayan ejecutado.

## 8. Entrega aplicada — English Studio y rutas de aprendizaje (2026-11-09)

### English Studio
- Se redujo la pantalla principal a tres rutas visibles: Speaking, Pronunciation y Saber 11. El alumno entra directamente desde el catálogo mediante `/orby?view=english`; el tutor de estudio queda como destino independiente en `/orby`.
- Speaking y Pronunciation inician una sesión Gemini Live real. El flujo de English Studio no se degrada automáticamente a grabar, transcribir y reproducir. Si Live no conecta, se muestra el error real y la pregunta no se presenta como una llamada activa.
- En la sesión Live de OmegaX, la transcripción de salida y la configuración de voz usan `en-US`; fuera de English Studio se conserva `es-US`. La habilidad y la consigna se incluyen en el prompt de la sesión.
- El selector A1–C2 se etiqueta como meta de aprendizaje general MCER. La ruta ICFES presenta por separado los niveles de desempeño Pre A1, A1, A2 y B1 de la guía 2026-2.

### Ruta Saber 11
- Se documentaron las siete partes y sus pesos oficiales: 11 %, 11 %, 11 %, 18 %, 16 %, 11 % y 22 %.
- Parte 1 ya usa cinco descripciones, siete palabras A–G y dos distractores sobrantes; cada palabra se puede asignar una sola vez.
- Partes 2 y 3 usan un aviso y una conversación, respectivamente, con tres alternativas.
- Parte 4 usa un texto de completar espacios con tres opciones por espacio; Parte 5 usa lectura literal sobre un pasaje; Parte 6 usa inferencia con cuatro alternativas; Parte 7 integra gramática y léxico en un texto con cuatro alternativas.
- Hay prácticas originales por parte y retroalimentación/guardado del resultado. Esto todavía NO es un simulacro completo de 55 preguntas ni un banco exhaustivo; no se reutiliza material protegido del Icfes.

### Navegación y diseño
- El catálogo se rehizo con dos entradas prioritarias (Tutor de estudio y English Studio) y las rutas de cursos interactivas separadas.
- Se conservó el mapa desplegable de aprendizaje de inglés: bases, tiempos, estructuras, oraciones complejas, conectores, vocabulario, pronunciación y habilidades.
- El workspace acepta una vista inicial `chat` o `english` para abrir directamente la experiencia elegida.

### Diagnóstico de proveedor
- Se agregó `GET /api/admin/ai-provider-status`, restringido al propietario de Orby y de solo lectura. Consulta las suscripciones de Cloudflare sin ejecutar inferencia y sin devolver valores secretos.
- La respuesta no afirma por sí sola que Workers AI esté en plan Free: la suscripción mostrada no es evidencia suficiente y se conserva la confirmación manual en el Dashboard.
- La ruta de tutor distingue confirmación operativa pendiente de cuenta pagada; el cliente del proveedor diferencia cuota diaria, rate limit, autenticación y modelos que requieren Workers Paid.

### Validación y bloqueos
- Se añadieron/actualizaron regresiones estáticas para llamadas Live, rutas directas, separación MCER/ICFES, pesos y formato de Parte 1.
- El estado combinado del commit `0a2699de2670bbe0551367b980527f83644bb86a` solo reporta el check de Vercel en fallo por `build-rate-limit`. No se ha podido acreditar build, TypeScript ni ESLint aprobados en ese HEAD.
- Pendiente: correr `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build` cuando el límite de CI permita la ejecución; revisar JSX/visual en Chrome escritorio y móvil; probar audio real, interrupción, reconexión y permisos en un preview con los guards autorizados.
- No se ha probado con estudiantes. No se desplegó a Production ni se tocó `main`.


## 9. Ampliación de destrezas y cierre de UX (2026-11-09)

- Se restauraron los bancos de actividades originales de Listening, Reading y Writing, con actividades por cada nivel MCER A1–C2. English Studio tiene seis destinos directos: Speaking, Pronunciation, Listening, Reading, Writing y Saber 11.
- Listening usa síntesis de voz local del navegador para reproducir el guion y permite revelar la transcripción después de escuchar; la grabación del estudiante no se envía al proveedor para esa actividad.
- Reading presenta un pasaje, pregunta y evidencia esperada. Writing incluye propósito, extensión objetivo, checklist y contador de palabras. Las respuestas se envían a OmegaX con el contexto de la destreza y la clave pedagógica.
- Los prompts iniciales de Speaking/Pronunciation se acortaron para que el historial no muestre un bloque de instrucciones interno. Se amplió el límite de mensajes generados por voz a 3.600 caracteres y el de feedback de destrezas a 7.000, igual al límite aplicado en el servidor; el chat general conserva 1.200.
- Si Gemini Live no conecta, el error permanece visible al volver al chat. English Studio no inicia grabación/transcripción como reemplazo silencioso.
- Los resultados de prácticas Saber 11 se guardan como notas de aprendizaje.
- Aún falta ejecutar la batería de pruebas, TypeScript, lint y build: Vercel sigue reportando `build-rate-limit`, y el entorno local de esta sesión no pudo clonar GitHub por falta de resolución DNS.



## 10. Dirección de producto ampliada — plataforma educativa escalable (2026-11-09)

### Visión
PeakScore deja de organizarse como una colección de herramientas aisladas y evoluciona hacia una plataforma de aprendizaje por rutas. La primera vertical es Inglés (formación general + preparación Saber 11); la arquitectura de navegación y currículo debe permitir incorporar después otras materias, carreras, orientación universitaria y rutas profesionales sin rehacer la experiencia.

### Principio de diseño
Tomar como referencia patrones funcionales observables de Studdy, Stimuler y Duolingo —aula centrada en contenido, práctica oral con ciclo intento-feedback-reintento, progresión por unidades, objetivos diarios, revisión espaciada y feedback accionable—, pero construir identidad visual, componentes, textos, ilustraciones y flujos originales. No clonar píxel por píxel ni reutilizar marca, assets, textos o pantallas propietarias.

### Arquitectura de información propuesta
1. **Inicio / Hoy:** una única recomendación principal («Continúa donde quedaste» o «Tu práctica de hoy»), objetivo diario, progreso semanal y acceso claro a la ruta activa. Evitar seis tarjetas con igual jerarquía.
2. **Aprender inglés:** ruta guiada por nivel Pre-A1–C2, organizada en unidades → lecciones → microhabilidades → práctica. Cada lección declara objetivo, requisito previo, explicación breve, ejemplos, práctica guiada, reto y criterio de dominio.
3. **Practicar:** speaking, pronunciación, listening, reading, writing, gramática y vocabulario. Cada modo mantiene un patrón consistente: consigna → intento → feedback basado en evidencia → corrección/práctica focalizada → reintento → progreso guardado.
4. **Inglés Saber 11:** ruta separada de la ruta MCER, con diagnóstico, siete partes, práctica por formato, estrategia de examen, simulacros progresivos y revisión de errores. El avance general de inglés puede alimentar vocabulario/gramática, pero el progreso ICFES se mide aparte.
5. **Mi progreso:** nivel estimado no certificador, mapa de habilidades, fortalezas, brechas, historial de intentos, errores recurrentes, racha y plan de repaso. No mostrar métricas acústicas si el proveedor solo entrega transcripción.
6. **Biblioteca:** palabras, frases, reglas, errores guardados, flashcards y clases/notas. Todo con etiquetas de nivel, habilidad y tema.
7. **Expansión futura:** catálogo de rutas/campos de aprendizaje con el mismo patrón de navegación (materia/carrera/universidad → ruta → módulo → lección → práctica → evidencia/progreso). No mezclar carreras ni admisiones universitarias dentro del currículo de inglés.

### Modelo curricular común
Cada unidad de contenido debe poder etiquetarse con: domain, subject, track, level_framework, level, unit, lesson, skill, topic, prerequisites, learning_objectives, activity_types, assessment_evidence, mastery_rule, review_schedule y content_version.

- Inglés general: MCER Pre-A1, A1, A2, B1, B2, C1 y C2; las progresiones se diseñan por objetivos comunicativos y evidencias, no por una lista plana de temas gramaticales.
- Inglés Saber 11: estructura de siete partes y competencias del examen vigente, con banco original y trazabilidad por parte/dificultad/competencia. Nunca presentar MCER como equivalencia oficial directa del resultado ICFES.
- Gamificación: XP, rachas, metas y recompensas refuerzan la práctica, pero no sustituyen dominio ni evaluación.

### Diseño visual y navegación
- Una sola acción primaria por pantalla; máximo una ruta recomendada visible al entrar.
- Jerarquía estable: breadcrumb/ruta, título, objetivo, progreso, contenido y acción principal.
- Estados vacíos que indiquen qué hacer; estados de carga/error/éxito consistentes; nunca botones decorativos.
- Responsive y accesible: teclado, contraste, foco, subtítulos, transcripción opcional y prefers-reduced-motion.
- En clase tipo Studdy, el contenido/pizarra es el protagonista; subtítulos legibles y sincronizados con el audio disponible; controles compactos persistentes (micrófono, pausa/reanudar, repetir, finalizar). No prometer sincronía fonética palabra-a-palabra si solo hay estimación temporal.
- En práctica oral tipo Stimuler, el CTA «Hablar» debe ser inequívoco; feedback separado por dimensiones y respaldado por datos realmente medidos. Pronunciación, fluidez acústica, ritmo y entonación requieren señales de audio apropiadas; STT por sí solo no las demuestra.
- En progresión tipo Duolingo, usar unidades cortas, objetivos visibles, desbloqueo por dominio, repaso espaciado y recuperación de errores; evitar confeti, vidas o rachas que castiguen al estudiante o distraigan del aprendizaje.

### Orden de implementación
P0. Auditar y estabilizar la navegación actual; definir el mapa de pantallas y eliminar decisiones duplicadas en la entrada a English Studio.
P1. Diseñar y construir el «Hoy» y el mapa de ruta general de Inglés con progreso real y reanudación.
P2. Unificar la plantilla de actividad (consigna → intento → feedback → reintento) para las cinco habilidades y añadir gramática/vocabulario como módulos explícitos.
P3. Completar diagnóstico de nivel y recomendación adaptativa con criterios transparentes; implementar repaso espaciado.
P4. Fortalecer Saber 11 por separado: siete partes, banco original amplio, práctica cronometrada y simulacro completo validado contra la guía vigente.
P5. Añadir subtítulos/controles y QA extremo a extremo del aula Orby; después incorporar assets visuales educativos curados con licencia y persistencia.
P6. Generalizar el modelo de rutas para otras materias, carreras y orientación universitaria, sin desarrollar esas verticales antes de estabilizar Inglés.

### Criterios de aceptación de producto
- Un estudiante nuevo sabe qué hacer en menos de 10 segundos sin leer instrucciones largas.
- Puede identificar nivel/ruta, objetivo de la lección, duración aproximada, cómo avanzar y dónde revisar errores.
- Puede abandonar y reanudar sin perder progreso.
- Cada actividad explica por qué una respuesta es correcta/incorrecta y ofrece práctica sobre el error.
- El tablero y el tutor no compiten con la navegación ni tapan subtítulos/controles.
- Las métricas distinguen datos observados, estimaciones y dimensiones no disponibles.
- La ruta general MCER y Saber 11 permanecen conectadas pedagógicamente, pero con progreso y evaluaciones diferenciadas.

### Estado de ejecución
Esta sección registra la dirección acordada y el orden de trabajo; no declara implementado el rediseño completo. El commit cf6ce6f modifica pruebas de recuperación de Live/chat, no entrega por sí solo el nuevo diseño de producto. El CI asociado a ese SHA no devuelve ejecuciones y el estado combinado consultado muestra Vercel failure por build-rate-limit; no atribuirlo a un fallo de código sin logs. Mantener feat/founder-intro, coste cero, sin despliegue, sin cambios a main y sin migraciones remotas no autorizadas.

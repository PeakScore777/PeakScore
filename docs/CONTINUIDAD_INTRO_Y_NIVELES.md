# PeakScore — continuidad de introducción y construcción de niveles

> Documento de continuidad del proyecto. Actualizarlo cuando cambien decisiones importantes.
> Rama de trabajo actual: `feat/founder-intro`.
> Repositorio: https://github.com/PeakScore777/PeakScore
> Fecha de esta nota: 2026-10-18.

## Objetivo acordado

Dejar la escena de prueba de la introducción como está por ahora y avanzar a construir los niveles de aprendizaje en **la misma rama `feat/founder-intro`**. Después de implementar y probar los niveles, revisar el conjunto y pasar los cambios a `main` mediante una integración controlada. No reconstruir PeakScore desde cero ni reemplazar su arquitectura actual.

## Trabajo de introducción que ya existe en la rama

Se trabajó sobre estos archivos:

- `app/intro/page.tsx`: página contenedora de la introducción.
- `app/intro/IntroExperience.tsx`: experiencia de introducción interactiva.
- `app/api/onboarding/intro/route.ts`: endpoint para guardar las respuestas del onboarding.
- `app/dashboard/page.tsx`: lógica de redirección relacionada con la introducción.
- `supabase/migrations/20261018130000_add_intro_onboarding_to_profiles.sql`: migración para las columnas de onboarding.
- `app/intro-test/page.tsx`: escena de prueba visual/local. Se modificó y se decidió **dejarla quieta por ahora**; no pulirla más hasta retomar esa tarea.

La migración añade a `public.profiles`:

- `intro_completed_at timestamptz`
- `school_grade text`
- `icfes_experience text`
- `learning_goal text`
- `math_confidence text`

La migración marca como completados los perfiles existentes en el momento de ejecutarla, para no interrumpir a usuarios antiguos. El usuario confirmó que ejecutó la migración en Supabase con éxito. Antes de desplegar o integrar el flujo real, verificar el comportamiento de creación de perfiles nuevos y la redirección: el onboarding debe aparecer solo a cuentas nuevas elegibles, y no debe bloquear a usuarios existentes.

## Activos de audio

El usuario agregó y confirmó localmente estos archivos:

- `public/audio/intro/peakscore-intro.wav`
- `public/audio/intro/peakscore-typing.wav`

Se añadieron a Git con el mensaje `Add intro music and typing sound`. El intento de push inicial fue rechazado porque la rama remota tenía cambios más recientes; el usuario mostró luego el estado de GitHub y continuó trabajando en la rama. Confirmar siempre la versión remota y sincronizar con `git pull --rebase origin feat/founder-intro` antes de nuevos pushes, si el árbol local no tiene conflictos.

Activos visuales que ya aparecen en `public/characters/intro/`:

- `founder-saludo.gif`
- `founder-static.gif`
- `nova-static-intro.gif`

Los GIF deben conservar su orientación original. Nova es la nueva aventurera/usuario y mira hacia Founder. No presentar a Nova como guía que dice «yo soy Nova». Founder es quien recibe y orienta a Nova.

## Decisiones visuales y de interacción

- Inspiración de presentación: onboarding narrativo tipo videojuego retro, similar en sensación a Gamecode; crear diseño propio, no copiar literalmente sus recursos.
- Fondo negro puro; tipografía pixel en toda la experiencia.
- Mantener personajes separados, mirándose entre sí y sin fondos añadidos que hagan más visibles los artefactos verdes que dejó Sprite Lab en algunos píxeles del GIF.
- En la experiencia real no mostrar el título «escena de prueba», controles de audio con etiquetas ON/OFF, puntos decorativos genéricos, líneas amarillas de pie ni botón «salir de la prueba».
- El botón para continuar debe ser texto pixel sin recuadro grande, al estilo de una opción de juego.
- El control para silenciar música puede estar discreto en la esquina superior izquierda de la escena de prueba. La interfaz definitiva debe revisarse por separado.
- El texto se revela progresivamente con un efecto de escritura y un sonido de teclado discreto. Mientras se escribe, el control de avance debe permanecer deshabilitado/bloqueado; solo habilitarlo al terminar. Evitar un botón «mostrar texto» durante la animación.
- La escena de prueba no debe persistir las respuestas; es para inspección visual y ajuste antes de integrar el flujo definitivo.
- Mantener la música y el sonido de escritura como controles/activos separados. Silenciar la música no debería implicar que el usuario pierda el control del sonido de escritura, salvo que se decida expresamente después.

## Lógica del onboarding que debe respetarse

Preguntas previstas en la escena de prueba:

1. **¿En qué etapa estás?** Grado 10, Grado 11, Ya me gradué, Otra situación.
2. **¿Qué experiencia tienes con el ICFES?** Las opciones dependen de la etapa.
3. **¿Qué quieres conseguir primero?** Fortalecer mis bases, Mejorar en lo que me cuesta, Subir mi puntaje, Practicar y medir mi nivel.
4. Mostrar una recomendación inicial coherente, no preguntar al final cómo se siente con Matemáticas.

Reglas de coherencia:

- Un estudiante de grado 10 no debe recibir la opción de haber presentado ya Saber 11 como si fuera lo normal. Para décimo, ofrecer empezar desde cero o haber practicado con simulacros.
- En grado 11 puede estar empezando, haber practicado o haber presentado el examen.
- Para personas graduadas u otra situación se puede ofrecer que lo presentaron una vez o varias veces, además de otras experiencias pertinentes.
- No inferir dominio académico solo por haber presentado el examen o hecho simulacros.
- La recomendación es una orientación inicial; más adelante debe validarse y ajustarse con el diagnóstico real, las respuestas y el progreso del estudiante.

Nombres provisionales de rutas presentes en la prueba (no se consideran nombres finales de los niveles):

- Campamento Base / Campamento de Exploración
- Ruta de Refuerzo
- Ascenso al Puntaje / Despegue Saber 11
- Zona de Exploración
- Segundo Ascenso / Ruta de Reintento

## Construcción de niveles: siguiente trabajo

Construir los niveles en `feat/founder-intro`, reutilizando el sistema, componentes, autenticación y base de datos que ya tiene PeakScore. Antes de cambiar una tabla o crear rutas nuevas, inspeccionar el código y el esquema existente para no inventar nombres, duplicar funcionalidad o romper el banco de preguntas y los simulacros.

Contexto de diseño/progresión ya conversado:

- Las materias del producto son Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés.
- La estructura conceptual propuesta contempla 5 niveles por materia; cada nivel completado puede otorgar +25 XP.
- No permitir volver a farmear XP repitiendo un nivel ya recompensado.
- El XP competitivo de rango corresponde a la temporada actual; el XP histórico no determina por sí solo el rango competitivo actual.
- La temporada se planteó con una duración de dos meses.
- Usar nombres temáticos/narrativos para las rutas, no nombres genéricos como «Nivel 1», «Nivel 2», etc. Los nombres definitivos deben corresponder al contenido real y a la dificultad.
- Diseñar las rutas a partir del marco real de Saber 11: competencias, componentes y progresión pedagógica. No crear preguntas o afirmar cobertura oficial sin contrastar el material disponible.
- Los simulacros simples y completos, el banco de preguntas y el dashboard ya existen en el proyecto; no reemplazarlos por un sistema paralelo.

Antes de implementar la progresión, definir y documentar: contenido de cada nivel, objetivo de aprendizaje, prerrequisitos, actividad/práctica, criterio de finalización, feedback, XP y protección contra recompensas duplicadas. Separar la definición curricular de la lógica de presentación cuando la arquitectura actual lo permita.

## Verificación y futura integración a main

1. Trabajar en `feat/founder-intro` y no hacer commits de desarrollo directamente en `main`.
2. Sincronizar con el remoto antes de empezar si hay commits remotos nuevos.
3. Inspeccionar las rutas, componentes, migraciones y esquema existentes antes de añadir niveles.
4. Ejecutar `npm run build` después de cambios relevantes. El usuario reportó previamente que el build de su versión anterior pasó, pero eso no verifica automáticamente los commits posteriores de esta rama.
5. Ejecutar `npm run lint` y registrar/atender errores; el usuario había informado que lint mostraba muchos errores pendientes.
6. Probar onboarding con cuentas nuevas y existentes, responsive, reproducción de audio, avance del diálogo y persistencia de respuestas.
7. Probar niveles, finalización, XP, bloqueo de repetición de recompensas y compatibilidad con simulacros/banco de preguntas.
8. Revisar diferencias con `main`, abrir/revisar un pull request y resolver conflictos antes de integrar.
9. Solo después de validar la experiencia completa, integrar los cambios a `main`. No dar por desplegado algo que solo existe en la rama de desarrollo.

## Comandos locales de referencia

Desde `C:\Users\hogar\Desktop\PeakScore`:

```powershell
git status
git switch feat/founder-intro
git pull --rebase origin feat/founder-intro
npm run build
```

No ejecutar un rebase si hay cambios locales sin guardar; primero revisar `git status` y proteger el trabajo existente.

## Estado al crear esta nota

- El usuario pidió dejar `/intro-test` tal cual por ahora.
- La siguiente prioridad acordada es construir los niveles en la misma rama.
- La integración a `main` queda para después de construir y probar.
- Esta nota documenta decisiones y contexto; no es una certificación de que el código actual haya superado pruebas de extremo a extremo.


## Actualización de continuidad — Orby Voice y recuperación de embeddings (2026-11-02)

La prioridad actual pasó temporalmente de los niveles a estabilizar Orby Voice y la indexación de conocimiento. Mantener todos estos cambios en `feat/founder-intro`.

### Voz
- Gemini Live continúa como motor de conversación realtime.
- El chat debe mostrar la transcripción progresiva y el audio debe comenzar durante la respuesta, no después de recibir el turno completo.
- La cola no puede aceptar/procesar el siguiente turno como respuesta lista hasta que termine el audio actual.
- Si Live devuelve texto pero ningún fragmento de audio, usar la voz del navegador.
- Si Live se desconecta en una respuesta filtrada, reproducir la respuesta segura con voz alternativa; no dejarla solo escrita.
- La voz del navegador tiene cancelación y watchdog para no bloquear el envío de mensajes.
- Aún falta probar físicamente con micrófono, Chrome/Edge, interrupciones, latencia y fallos reales de proveedor.

### Biblioteca y embeddings
- El error visible fue `429 RESOURCE_EXHAUSTED` de Gemini `embed_content_free_tier`, con la indexación detenida en 80/110 vectores.
- Se añadió respaldo Cloudflare EmbeddingGemma con 768 dimensiones. Las columnas `embedding_model` evitan comparar vectores de modelos diferentes.
- La nueva migración `20261102230000_orby_model_aware_embedding_search.sql` añade un listado de modelos indexados y una búsqueda híbrida multi-modelo.
- Al agotar las cuotas gratuitas de todos los motores de embeddings, el worker deja el trabajo programado para el reinicio diario en vez de gastar reintentos en bucle.
- Antes de probar búsqueda semántica, aplicar esta migración a Supabase desde la rama de desarrollo. No modificar ni reconstruir el material eliminado intencionalmente de Orby ICFES Lab.

### Validación pendiente
1. `git switch feat/founder-intro` y `git pull origin feat/founder-intro`.
2. Aplicar la migración `supabase/migrations/20261102230000_orby_model_aware_embedding_search.sql`.
3. Ejecutar `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npm run build`.
4. Probar una conversación de voz hablada y otra escrita dentro del modo de voz; confirmar audio progresivo, una sola respuesta, historial y recuperación ante desconexión.
5. Comprobar que el documento que tenía 80/110 vectores continúa desde los que faltan y conserva los vectores ya guardados.

No subir a `main` ni habilitar para estudiantes antes de estas comprobaciones.


### Últimos ajustes de robustez de voz
- El motor de respaldo de texto de Cloudflare usa `@cf/google/gemma-4-26b-a4b-it` para aprovechar mejor el cupo gratuito que Llama 3.3 70B.
- El capturador de micrófono envía paquetes PCM de 40 ms (16 kHz, mono) en lugar de 100 ms.
- El watchdog se renueva mientras Live envía fragmentos de audio/transcripción y solo cambia al respaldo cuando deja de llegar actividad.
- Si Live termina sin texto utilizable, se reenvía la misma pregunta al tutor filtrado; si se desconecta antes de la transcripción final, se usa la transcripción provisional y se agrega al historial solo si ese turno aún no tenía mensaje del alumno.
- Las cancelaciones voluntarias de voz ya no se interpretan como finalización normal ni reactivan el micrófono.
- Se añadió prueba de regresión para eco de la voz alternativa y paquetes PCM de 40 ms.


### Orby Voice: español, rechazos fluidos y sincronización (2026-11-02)
- Mantener Gemini Live como voz principal y los filtros de PeakScore como autoridad. La IA no decide si una solicitud de programación puede enseñarse: el preflight local produce una respuesta canónica.
- El reconocimiento recibe `languageCodes: ["es-ES"]`, `mode: "SMART"` y vocabulario que incluye “Oye Orby”, “Hey Orby”, “Orby AI”, PeakScore, Saber 11 e ICFES. Es una pista de idioma, no una garantía; por eso se mantiene el filtro local.
- La síntesis nativa Live declara `speechConfig.languageCode: "es"`. El prompt de sesión exige español colombiano, alfabeto latino y pedir repetición cuando la frase no se entienda.
- El filtro Unicode `containsUnsupportedSpanishScript` bloquea devanagari/hindi y otros alfabetos no latinos en historial, transcripción provisional/final de entrada y transcripción de salida. Los fragmentos provisionales no españoles se ocultan; los finales se reemplazan por una petición de repetir en español.
- La reproducción de audio Live solo se permite después de validar la transcripción española. Para saludos y rechazos deterministas, la interfaz conserva la respuesta aprobada exacta. Si Gemini añade una presentación, cambia la frase o cambia de idioma, el audio se descarta y se usa voz alternativa para ese texto canónico.
- El fallback de voz determina si hubo audio válido usando el bloqueo/validación del turno, no solo el contador histórico de chunks. Esto corrige el caso donde se canceló el primer audio y no se activó la voz alternativa.
- La ruta escrita también rechaza una respuesta del modelo en una escritura no española. Los prompts de voz y de tutor recuerdan ortografía, puntuación, tildes y que no deben repetir el branding/rechazo en cada turno.
- La negativa de programación es ahora breve y redirige a una materia ICFES, evitando el “Soy Orby…” repetido después de cada mención de Python.
- **Validación pendiente en PC:** hacer pull de `feat/founder-intro`; correr `npm run test:orby`, `npx tsc --noEmit`, `npm run lint`, `npm run build`; después probar “Oye Orby”, “Enséñame Python”, insistir con “Python”, interrumpir la voz y confirmar que hay una única burbuja por turno y una única reproducción. No desplegar a `main` antes de esas pruebas.


### Ajustes posteriores: fallback sin mensaje y voz canónica
- El ASR de salida de Live se configura con `languageCodes: ["es"]` y `mode: "SMART"`; la voz nativa usa `speechConfig.languageCode: "es"`. El ASR de entrada usa `es-ES` y vocabulario ICFES/PeakScore.
- Si se detecta interim en otra escritura y no llega la transcripción final, el watchdog crea un solo turno `Audio no reconocido.` y pide repetir en español. No deja el chat vacío ni persiste texto Hindi.
- Para respuestas deterministas de filtros, la burbuja conserva el texto canónico. La transcripción de la voz nativa debe corresponder a esa frase; si el modelo se presenta otra vez, reformula o cambia de idioma, el audio se detiene y se usa lectura alternativa del texto aprobado.
- El fallback de voz ahora se decide con el estado de validación y bloqueo de audio, además del contador de chunks, para no quedarse solo en texto después de cancelar audio inválido.

### Continuidad PeakScore — entrega de aprendizaje e inglés 2026-11-09

- HEAD de trabajo en `feat/founder-intro`: `0a2699de2670bbe0551367b980527f83644bb86a` al cerrar esta nota. Los commits de esta tanda abarcan `c3771f4`, `b6e04dd`, `325a1be`, `b6e04dd` y actualizaciones posteriores de catálogo, diagnóstico, ejercicios ICFES y tests.
- Archivos centrales: `components/aprender/OmegaXEnglishStudio.tsx`, `components/aprender/LessonAITutor.tsx`, `components/aprender/LearningCatalog.tsx`, `components/aprender/OrbyWorkspacePage.tsx`, `lib/ai/cloudflare-workers-ai.ts`, `app/api/lesson-tutor/route.ts`, `app/api/admin/ai-provider-status/route.ts`.
- English Studio abre directamente con `/orby?view=english`. Speaking y Pronunciation exigen conexión Gemini Live y no inician automáticamente push-to-talk. La configuración Live de OmegaX usa locale inglés mientras la práctica está activa.
- MCER A1–C2 y niveles ICFES Pre A1/A1/A2/B1 se presentan como escalas distintas.
- Saber 11 incluye siete partes con pesos de la guía 2026-2 y ejercicios originales. Parte 1 implementa cinco definiciones + siete opciones con dos distractores; partes 4–7 practican huecos/lectura con varios ítems. No se afirma que sea un simulacro completo de 55 preguntas.
- Se añadió endpoint de diagnóstico administrativo Cloudflare de solo lectura. No cambia variables ni confirma automáticamente el plan Free; no ejecuta inferencia.
- QA no cerrado: el check Vercel del último HEAD falló con `build-rate-limit`; aún no existe evidencia de build, TypeScript, ESLint o tests aprobados sobre el HEAD final. Al reanudarse, correr `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npm run build`, corregir lo que aparezca y revisar manualmente Live, permisos, barge-in y responsive.
- Restricciones: continuar únicamente en `feat/founder-intro`; no tocar `main`, no desplegar Production, no aplicar migraciones remotas. No eliminar ni reconstruir el material de Orby ICFES Lab que el usuario borró intencionalmente.


### Continuidad adicional — destrezas de inglés y validación final (2026-11-09)

- English Studio ya no queda reducido a Speaking/Pronunciation/Saber 11: se restauraron los bancos A1–C2 y paneles prácticos de Listening, Reading y Writing. Navegación final: seis rutas (Speaking, Pronunciation, Listening, Reading, Writing, Saber 11).
- Listening reproduce texto de práctica con Web Speech API local; Reading muestra pasaje, pregunta y evidencia; Writing muestra consigna, extensión objetivo, checklist y contador de palabras.
- Las consignas Live de Speaking/Pronunciation se redujeron para que el chat no muestre instrucciones largas. El límite cliente permite 3.600 caracteres a directivas Live y 7.000 a feedback de destrezas; el endpoint ya aceptaba 7.000 para `learningSkill`.
- Los resultados ICFES se guardan como notas. Feedback por parte ahora muestra respuesta elegida y correcta y permite reintentar.
- HEAD antes de la última actualización documental: `16c6de314adf539f55ad8e7eb23243882bddeacc`. El check de Vercel del HEAD anterior continúa fallando por `build-rate-limit`; no se ha acreditado ejecución exitosa de pruebas o build en el HEAD final. La sesión no pudo clonar GitHub para correr tests localmente (DNS externo no disponible).
- QA manual pendiente: probar los seis destinos en navegador, síntesis local de audio, dictado/ASR Live, interrupción de voz, errores de consentimiento/cuota, teclas y responsive. No hay pruebas con estudiantes.


### Entrega de banco visual y cierre de English Studio — 2026-11-09

**Banco visual reusable para la pizarra Live**
- Nuevo módulo `lib/ai/orby-visual-bank.ts` con 25 recursos allowlisted organizados por Biología, Química, Física, Matemáticas, Sociales y Lectura/Inglés.
- El catálogo incluye célula vegetal/animal, ADN, fotosíntesis, mitosis, Punnett, neurona, circulación, agua, átomo, estados de materia, pH, circuito, vectores, movimiento, funciones, Pitágoras, probabilidad, poder público, oferta/demanda, timeline, comunicación, conectores y estructura textual.
- `render_orby_teaching_board` acepta hasta dos claves exactas por snapshot mediante `visualBankKeys`. `LessonAITutor` expande solo claves permitidas y luego ejecuta `sanitizeOrbyBoard`; no se aceptan SVG, HTML ni URL del modelo.
- El runtime evita duplicados por el título canónico de la primitiva. Si llega un snapshot textual v1, lo promueve a v2 al insertar una figura; los snapshots espaciales v2 se convierten a v3 cuando necesitan una hoja visual adicional, preservando la primera página. Las hojas existentes de v3 mantienen sus posiciones.
- Se corrigió un bug de mayúsculas en la lista permitida de la neurona: el sanitizador compara minúsculas, por lo que `nodos de ranvier` debe estar normalizado también en la allowlist.
- Las figuras son primitivas vectoriales curadas, no imágenes raster externas ni assets propietarios de Studdy. El banco aún no cubre todos los temas del currículo; se agregan entradas revisadas con pruebas del sanitizador.

**English Studio**
- Seis rutas visibles: Speaking, Pronunciation, Listening, Reading, Writing y Saber 11.
- Speaking incluye 24 temas A1–C2 y 22 situaciones de roleplay. Pronunciation usa práctica Live y una consigna orientada a escuchar el audio, corregir y repetir; no se promete análisis fonético de laboratorio.
- Listening, Reading y Writing recuperaron ejercicios por cada nivel A1–C2. Listening sintetiza el audio localmente y revela la transcripción bajo demanda; Reading pide evidencia; Writing incluye extensión y checklist.
- La ruta Saber 11 mantiene las siete partes con ejercicios originales. La Parte 1 es 5 descripciones/7 opciones; Partes 4–7 tienen varios ítems por texto. No es todavía un simulacro integral de 55 preguntas.
- El nivel MCER se muestra como meta de práctica general y separado del desempeño ICFES Pre A1/A1/A2/B1.

**Estado de QA y proveedores**
- El workflow de GitHub Actions ya ejecutó los tests hasta 288 casos; los commits anteriores tuvieron fallos en casos recién añadidos del banco visual y uno de ellos en el nombre de neurona. El HEAD actual de trabajo es `69e6efe7e59787b3e368f0bb8bcce78045f1e75b`; su ejecución CI estaba en curso al registrar esta nota. No declarar TS, ESLint ni build aprobados hasta verlos completados.
- No se ha validado micrófono, interrupción, reconexión y render visual extremo a extremo en Chrome real; tampoco se ha probado con estudiantes.
- Cloudflare mantiene su confirmación Free y los controles de privacidad/coste. El endpoint administrativo es de solo lectura; no habilita billing ni confirma planes automáticamente.
- Gemini Live sigue bloqueado hasta verificar el entorno y la atestación expresa de privacidad para el nivel gratuito. No se activó consentimiento ni se sustituyó por un proveedor facturable.
- Seguir únicamente en `feat/founder-intro`. No tocar `main`, no Production deploy, no migrations, no reconstruir material borrado de Orby ICFES Lab.



### Corrección de alcance y avance UX de OmegaX — 2026-11-09

- OmegaX es el tutor IA general de PeakScore, no un personaje. La colección se mantiene con sus personajes ya existentes (Nova, Nox, Zyra y Orby). No crear lore, carta, bioma, habilidad de personaje, inventario ni precio para OmegaX.
- Los tres archivos de personajes que se habían modificado por error fueron restaurados al contenido exacto del commit base bb5f24c9e7bbc75aaf5c66407f339faf262371e6: lib/characters/lore.ts, components/perfil/CharacterCards.tsx y app/perfil/personajes/page.tsx.
- Corrección del estado de la pizarra: components/aprender/OrbyBoard.tsx ya implementa zoom 60–200 %, ajuste, movimiento manual, teclado y navegación entre hojas. No reconstruirlo; falta QA manual en dispositivos.
- Se actualizó components/aprender/LearningCatalog.tsx con tarjetas educativas coloridas, dos destinos principales claros (tutor general y English Studio) y rutas interactivas. components/aprender/OmegaXEnglishStudio.tsx ahora presenta Speaking, Pronunciation, Listening, Reading, Writing y Saber 11 como tarjetas de navegación responsivas.
- La investigación de producto y los videos aportados siguen siendo referencias de comportamiento: Studdy = clase visual acumulativa e interrumpible; Stimuler = hablar → feedback → práctica del error. No copiar pantallas ni asumir APIs privadas.
- Los cambios de UI aún requieren TypeScript, ESLint, pruebas y revisión visual real en anchos móvil/tablet/desktop. Mantener coste cero, no tocar main, no desplegar ni aplicar migraciones remotas.


### Selector de área en el inicio tema-primero — 2026-11-09

- `LessonAITutor.tsx` añade cinco tarjetas opcionales para elegir materia antes de una clase con OmegaX. La selección manual prevalece sobre la detección automática desde el tema; si no hay selección, se usa la detección o el contexto general previo.
- El estudiante sigue escribiendo el tema como campo obligatorio y solo solicita micrófono/Live después de pulsar «Comenzar clase». Los ejemplos de tema se mantienen como accesos rápidos.
- Se añadió regresión estática para las cinco materias y la prioridad de selección explícita en `tests/orby-request-filter.test.mjs`.
- CI anterior `42686204558` para `6c6f1aa`: tests 288/288, TypeScript, ESLint y build Next.js aprobados. CI actual para el selector opcional sigue en ejecución; no darlo por aprobado hasta su resultado final.


## Reto oral cronometrado — 2026-11-09

- En English Studio, Speaking ahora solicita una llamada Live real y, solo después de confirmar que el socket está listo, inicia un reto de 60 segundos con contador visible en la cabecera del aula.
- «Terminar reto» detiene la llamada antes del límite. Al llegar a cero el flujo termina automáticamente. Si la llamada se desconecta, el reto se cierra con estado de interrupción y no se simula una sesión completa.
- Al terminar, se construye una solicitud de feedback con las intervenciones de estudiante disponibles en los mensajes de la sesión y el texto parcial reconocido que siga pendiente. La respuesta se solicita en el chat mediante el tutor; no se inventa un score acústico.
- La evaluación se limita a cumplimiento de consigna, gramática observable, vocabulario, coherencia y desarrollo de ideas, con evidencia textual. La transcripción ASR puede tener errores y no sirve para afirmar medición de fonemas, acento, entonación, ritmo, pausas o fluidez acústica.
- Pronunciation queda separado del cronómetro Speaking: conserva su flujo de escuchar → repetir → recibir corrección → reintentar, sin presentar la transcripción como análisis fonético.
- Los callbacks pasan skill, nivel y consigna a la clase Live; el cierre conserva el tema y la evidencia de la práctica para evaluación posterior. La llamada solo empieza el reto cuando está realmente conectada.
- Tests añadidos para inicio posterior a conexión, timeout, finalización manual, envío de evidencia textual y ausencia de métricas acústicas inventadas. Estado de CI a actualizar cuando finalice el workflow del commit 22fb692.

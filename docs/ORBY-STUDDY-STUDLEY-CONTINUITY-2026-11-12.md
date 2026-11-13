# Orby: continuidad de aula Studdy + método visual Studley

> **Corrección oficial de identidad (2026-11-13):** este documento conserva su nombre y contenido como registro histórico/técnico. La experiencia de tutor principal, aula en vivo, voz, pizarra y paridad con Studdy descrita aquí corresponde a **OmegaX**, no a Orby. **Orby** queda reservado exclusivamente al tutor de Ciencias Naturales de los niveles/capítulos. Los identificadores técnicos heredados `orby_*`, rutas y nombres de componentes se conservan para no romper compatibilidad.

**Fecha de trabajo:** 12 de noviembre de 2026 (Colombia, UTC-5)  
**Repositorio:** `PeakScore777/PeakScore`  
**Rama:** `feat/founder-intro`  
**Base auditada:** `9addc0d99a68e9101e5f1d69acdd685dd23f1440`  
**Estado al iniciar esta continuidad:** CI rojo por una prueba obsoleta; aula aún no validada manualmente en navegador.

---

## Objetivo del trabajo

La experiencia principal debe ser una **clase particular dentro de un aula digital**, no un chatbot con una pizarra decorativa.

Combinar dos referencias:

- **Studdy:** estructura del aula, hoja blanca continua, título manuscrito, escritura progresiva, ritmo de explicación, subtítulos, panel lateral de conversación y controles siempre visibles.
- **Studley:** profundidad didáctica de los dibujos, despiece de estructuras internas, capas, etiquetas, flechas y explicación de cada parte mientras aparece.

La voz, los subtítulos, la escritura y los dibujos deben pertenecer a la misma clase y conservar el tema seleccionado.

No copiar logos, nombres, personajes ni recursos protegidos. Replicar patrones de interacción y composición.

## Referencias audiovisuales del proyecto

Videos de Studdy:
- `studdy.mp4`
- `studdy (2).mp4`
- `studdy (3).mp4`
- `studdy (4).mp4`
- `studdy (5).mp4`

Grabaciones de PeakScore:
- `20261112-0120-19.4296963.mp4`
- `20261112-0108-56.2597001.mp4`
- `20261112-0014-38.6819806.mp4`
- `Grabación de pantalla 2026-11-07 165008.mp4`

Hallazgos de las grabaciones propias:
1. El título no queda integrado correctamente en la hoja y puede quedar demasiado arriba o tapado visualmente por la navegación.
2. El título actual anterior a esta corrección se revelaba carácter por carácter; el lápiz quedaba al final del texto y no recorría la escritura.
3. La teoría ya tenía una máscara de revelado CSS, pero no un cursor de lápiz que acompañara el trazo.
4. Los controles inferiores no se perciben con la claridad de la referencia; su existencia en JSX/CSS no demuestra que estén visibles en pantalla.
5. El tablero puede concentrar la información en bloques pequeños o visuales tipo tarjeta.
6. La clase debe mantener el contenido anterior y añadir progresivamente la siguiente idea, sin reemplazar la hoja completa.
7. Los subtítulos deben acompañar el fragmento hablado actual y no acumular transcripciones antiguas.

## Arquitectura confirmada en el código

### Aula y flujo
- `components/aprender/LessonAITutor.tsx`: flujo de clase, estado de voz, tema activo, mensajes, interrupciones, subtítulos, controles y panel lateral.
- `components/aprender/OrbyWorkspacePage.tsx`: página del espacio de estudio.
- `components/layout/GlobalNavbar.tsx`: navegación global.
- `components/layout/GlobalOrbyTutor.tsx`: tutor flotante global; evitar duplicarlo dentro del espacio de clase.

### Pizarra y dibujo
- `components/aprender/OrbyBoard.tsx`: render de bloques, animación de escritura y visuales.
- `components/aprender/OrbyBoardTitle.tsx`: título manuscrito.
- `lib/ai/orby-board.ts`: tipos, sanitización y disposición.
- `lib/ai/orby-board-actions.ts`: acciones acumulativas de la pizarra.
- `lib/ai/orby-visual-bank.ts`: banco de visuales canónicos.
- `lib/ai/orby-live-tools.ts`: herramientas disponibles para Gemini Live.
- `lib/ai/orby-class-start.ts`: prompt de inicio y secuencia pedagógica.

### Imagen y proveedor
- `app/api/orby/generate-image/route.ts`: endpoint de generación raster.
- `lib/ai/cloudflare-workers-ai.ts`: llamadas a Cloudflare Workers AI y control de cuota.
- `app/api/orby/realtime-session/route.ts`: sesión Live y herramientas.
- `lib/ai/orby-request-filter.ts` y `lib/ai/orby-scope.ts`: alcance académico y filtros.

### Pruebas
- `tests/orby-request-filter.test.mjs`
- `package.json`

## Incidencia de CI confirmada

Último workflow auditado:
- Run: https://github.com/PeakScore777/PeakScore/actions/runs/43135824335
- Job: `Orby tests, TypeScript, ESLint and production build`
- Job ID: `130910799927`
- Resultado: 369/370 pruebas aprobadas; falló la prueba 49.
- TypeScript, ESLint y build se omitieron porque la suite falló primero.

La prueba 49 exigía que el arranque de voz ejecutara inmediatamente `setWorkspaceMode("chat")`. El código real conserva el aula cuando `workspace === true` y solo devuelve a chat al tutor general cuando `workspace === false`:

```ts
stopRealtimeVoice();
if (!workspace) setWorkspaceMode("chat");
setVoiceStatus(workspace ? "La clase sigue abierta; continuamos por escrito" : "Seguimos por chat de texto");
```

Ese comportamiento es intencional: un fallo de micrófono o conexión no debe expulsar al estudiante de la clase ni hacerle perder el tema. La prueba debe comprobar el comportamiento real, no imponer el flujo antiguo.

## Cambios de código preparados en esta continuidad

### 1. Título con movimiento real del cursor
Archivo: `components/aprender/OrbyBoardTitle.tsx`

Se reemplaza el efecto de máquina de escribir por una revelación continua de tinta:
- El texto se revela de izquierda a derecha con una máscara.
- El lápiz se desplaza por el ancho del título durante el mismo intervalo.
- El resaltador amarillo acompaña la escritura.
- El callback de inicio oral espera a que termine la animación.
- `prefers-reduced-motion` muestra el título completo sin retraso.

Esto mejora el comportamiento frente al simple revelado carácter por carácter, pero todavía debe compararse visualmente con el video original en navegador. En títulos de varias líneas hay que comprobar que el recorrido del lápiz no resulte engañoso.

### 2. Teoría con lápiz acompañando el revelado
Archivo: `components/aprender/OrbyBoard.tsx`

Se mantiene el orden y el contenido de cada bloque, pero:
- El texto se revela con una máscara continua.
- Se incorpora un SVG de lápiz que recorre el bloque.
- El tiempo se calcula según la longitud del texto.
- La animación del texto y del lápiz comparten el estado de pausa/reanudación de la clase.

La animación debe probarse con bloques cortos, largos y de varias líneas; el lápiz no debe tapar letras, etiquetas o fórmulas.

### 3. Navbar durante la clase
Archivo: `app/globals.css`

El selector anterior solo ocultaba el header global cuando encontraba `.orby-live-class-layout`. La sesión alternativa de voz por turnos no contiene ese wrapper. El selector nuevo detecta el panel de tutor en modo `fixed`, que corresponde a la clase a pantalla completa, para cubrir ambos modos de voz.

El header global está confirmado como hijo directo de `body` en `app/layout.tsx`.

### 4. Prueba de regresión
Archivo: `tests/orby-request-filter.test.mjs`

Se actualiza la prueba 49 para exigir que:
- el intento de voz pueda cancelarse;
- la clase siga abierta cuando `workspace` es verdadero;
- el tutor general conserve su retorno a chat cuando `workspace` es falso;
- permanezcan las verificaciones de timeout y propiedad del arranque.

No se debe modificar la prueba para hacerla pasar si el código real no cumple ese contrato.

## Distinción importante: chat antiguo, panel lateral y voz por turnos

No borrar indiscriminadamente todo lo que contenga la palabra chat.

- El **chat genérico anterior** es la superficie normal del tutor en `workspaceMode === "chat"`. No debe reaparecer dentro de una clase Live ni sustituir la experiencia de profesor/pizarra.
- El **drawer lateral de clase** (`orby-live-chat-panel`) es parte de la referencia Studdy. Debe conservarse: muestra el historial/transcripción de la clase y se superpone desde la izquierda sin reemplazar la hoja.
- `OmegaXFreeVoiceTurn` es una interfaz distinta de voz por turnos. En el código auditado se llama desde el flujo de roleplay oral de Inglés (`startOmegaXEnglishRoleplay`), no desde `startWorkspaceClass`. No eliminarla a ciegas: comprobar el alcance y mantener separada la práctica de Inglés si sigue siendo necesaria.
- El flujo normal de clase (`startWorkspaceClass`) entra a Gemini Live y pone `cloudflareVoiceMode(false)`. Si Gemini Live falla, debe conservar la clase y ofrecer reintento explícito; no cambiar silenciosamente a voz por turnos ni a un proveedor de pago.

## Controles que deben validarse

Durante la clase deben ser visibles y funcionales:
- avatar/identidad del profesor;
- abrir/cerrar panel lateral de clase;
- pausar/reanudar explicación;
- silenciar/activar audio de salida del profesor;
- abrir teclado/compositor;
- enviar pregunta;
- activar/silenciar micrófono del estudiante;
- estado de conexión;
- menú superior;
- botón rojo para finalizar/salir de la clase.

El botón de salida debe finalizar la sesión activa y devolver al selector de tema. No borrar el historial persistido ni notas guardadas.

Los controles inferiores ya existen en el JSX del flujo Gemini Live. Las reglas CSS están repartidas entre `app/globals.css` y un bloque de estilos dentro de `LessonAITutor.tsx`; comprobar cascada, tamaño real, flex, overflow y z-index antes de añadir nuevos overrides.

## Motor de imágenes: estado real y tareas

El endpoint actual:
- usa `generateWithCloudflareImage`;
- declara el modelo `@cf/black-forest-labs/flux-1-schnell`;
- solicita cuatro pasos de inferencia;
- para Orby restringe la generación raster a Ciencias Naturales;
- devuelve una imagen JPEG en data URL;
- maneja cuota agotada y rate limit sin fallback a proveedor de pago.

Tareas pendientes:
1. Auditar tamaño, MIME real, validación y errores del resultado del modelo.
2. Comprobar cancelación de solicitudes obsoletas.
3. Comprobar si la imagen se persiste en historial y se conserva al recargar; no asumirlo.
4. Asegurar que el visual se inserta en la misma pizarra y turno didáctico.
5. Usar el raster solo cuando aporte más que los visuales vectoriales o sketch.
6. Evitar texto generado dentro de la imagen; las etiquetas deben renderizarse como texto de interfaz.
7. No añadir proveedores, créditos ni fallbacks que puedan generar cargos.

## Reglas de producto que no cambian

- Solo modelos/servicios con modalidad gratuita real y dentro de sus cuotas.
- Si se agota una cuota, detener esa capacidad y avisar; conservar tema y progreso.
- No introducir APIs de pago, créditos facturables ni fallback silencioso.
- No cambiar plan de Cloudflare, facturación, secretos ni configuración de producción.
- No tocar `main`.
- El material de Orby ICFES Lab fue eliminado intencionalmente: no reconstruirlo ni usar conteos antiguos.
- Orby debe enseñar dentro del alcance Saber 11, en español colombiano natural, con material original.
- No usar la generación raster para reemplazar la explicación ni el dibujo progresivo.

## Plan de validación obligatorio

### A. CI
1. Incorporar la prueba 49 corregida.
2. Ejecutar `npm run test:orby`.
3. Ejecutar TypeScript, ESLint y build de producción.
4. Leer el primer error real y corregirlo; no cambiar aserciones sin contrastarlas con el comportamiento.
5. No declarar build aprobado hasta ver el resultado del workflow.

### B. Navegador local
Probar en localhost:
- escritorio: 1918×950;
- móvil: 407×817.

Grabar y verificar:
1. entrar al espacio de estudio;
2. elegir tema y comenzar clase;
3. título completo y lápiz recorriéndolo;
4. primera idea y primer dibujo sin espera vacía excesiva;
5. teoría escrita progresivamente con cursor;
6. abrir/cerrar drawer lateral;
7. pausa, audio, teclado, micrófono;
8. menú y salida;
9. fallo de conexión y reintento;
10. salir y volver a iniciar otra clase.

### C. Casos pedagógicos
- mitosis: célula madre, fases conectadas, cromosomas, separación y células hijas;
- estructura interna de una célula y sus organelos;
- ADN y replicación;
- Matemáticas: fórmula y gráfica;
- Sociales o Lectura Crítica: relación conceptual o secuencia histórica.

En cada caso comprobar precisión, tamaño, etiquetas, conexiones, orden de trazos, continuidad de la hoja y correspondencia con la explicación oral.

## Criterios de cierre

- [ ] Aula a pantalla completa sin navegación global superpuesta.
- [ ] Título en la posición correcta, completo y con lápiz/resaltador progresivos.
- [ ] Teoría escrita con lápiz y sincronizada por etapas.
- [ ] Dibujo principal amplio y científicamente correcto.
- [ ] Estructuras internas explicadas a medida que se dibujan.
- [ ] Una sola hoja acumulativa, sin mosaicos de tarjetas innecesarias.
- [ ] Subtítulos breves y sincronizados con la voz actual.
- [ ] Controles inferiores visibles y funcionales en escritorio y móvil.
- [ ] Drawer lateral funcional, con historial y compositor.
- [ ] Chat genérico antiguo no sustituye ni interrumpe el aula.
- [ ] Tema conservado tras interrupción, error de voz y reintento.
- [ ] Salir vuelve al selector sin borrar datos persistidos.
- [ ] Motor de imágenes validado y sin proveedores de pago.
- [ ] Tests, TypeScript, ESLint y build aprobados.
- [ ] Grabación de navegador confirma el resultado.

## Bitácora de esta actualización

- Se confirmó HEAD remoto `9addc0d99a68e9101e5f1d69acdd685dd23f1440`.
- Se confirmó el fallo 49 del workflow 43135824335: prueba obsoleta exige volver al chat genérico al fallar la voz.
- Se corrigió el contrato de esa prueba para conservar el aula durante recuperación de voz.
- Se reemplazó el título mecanografiado por revelado de tinta con lápiz que recorre el título y resaltador sincronizado.
- Se añadió el mismo cursor de lápiz al texto de los bloques de la pizarra; la animación comparte la pausa/reanudación.
- Se amplió el selector CSS del navbar para cubrir el panel de aula a pantalla completa, independientemente del wrapper de voz.
- Se añadió un documento de continuidad para que la siguiente sesión pueda retomar sin reconstruir contexto.
- El workflow posterior al primer parche detectó seis pruebas con expectativas antiguas; se están actualizando para comprobar el contrato nuevo sin eliminar cobertura.
- El primer lint detectó dos errores y cinco avisos: setState síncrono en el efecto del título, let innecesario y referencias sin uso. Se limpiaron; falta verificar el siguiente workflow.
- CI posterior detectó dos pruebas que protegen la continuidad de hojas y la cámara docente; se restauró el observador de hojas y se conectó PageUp/PageDown a navegación accesible sin añadir botones de paginación.
- CI final y validación manual quedan pendientes hasta completar el workflow y probar localhost.
- No se modificó `main`, producción, proveedores, facturación ni secretos.

## Actualización de seguimiento — 12 de noviembre de 2026

### Cambios verificados en esta continuación

- Se compararon las grabaciones del 11 de noviembre: Studdy mantiene una hoja blanca acumulativa con título manuscrito, esquema central, idea principal, resaltados/anotaciones y pregunta progresiva. La grabación de PeakScore mostraba el lienzo vacío durante largos tramos y una salida de depuración; la diferencia es funcional, no solo estética.
- Se corrigió el error de ESLint en `components/aprender/OrbyBoard.tsx`: el efecto de rasterización ya no limpia estado de React de forma síncrona. El render decide si el PNG corresponde al SVG actual por `signature`, por lo que una imagen anterior no se muestra como si perteneciera a la nueva.
- Se reforzó `buildOrbyOpeningBoard` en `components/aprender/LessonAITutor.tsx`: si la primera frase validada llega antes que la herramienta de dibujo de Gemini, el respaldo incorpora el visual curado exacto cuando el tema existe en el banco (por ejemplo, `biology.mitosis`). Para temas sin correspondencia curada se mantiene texto y no se inventa una ilustración.
- Se añadió una prueba de regresión para el visual canónico del tablero inicial.

### Commits y validación

- `050d32580f387e1c9e11aaec61f92525777fb0ee` — corrección de actualización de estado en el efecto de rasterización.
- `03ad2078a6b76fd96d307106138aa174bd8fa794` — visual curado en el respaldo de apertura.
- `dee6e9b3b561aed202c12c77cb1865c8c21b61e8` — prueba de regresión para el respaldo visual.
- GitHub Actions, ejecución `43244833876`: **377/377 pruebas aprobadas**, TypeScript aprobado, ESLint aprobado y build de producción aprobado.
- Vercel Preview para `dee6e9b3b561aed202c12c77cb1865c8c21b61e8`: estado **READY** — https://peak-score-i2c0rjkcj-peak-score.vercel.app
- El commit anterior con 376 pruebas también pasó CI y su preview; la revisión actual incluye la prueba número 377.

### Pendiente obligatorio — no declarar equivalencia visual

La nueva versión todavía necesita una prueba manual real en Chrome, escritorio 1918×950 y móvil 407×817. Abrir el preview y grabar una clase de Mitosis, estructura celular y un tema de Matemáticas. Comprobar título/lápiz, primera frase, ilustración canónica, revelado progresivo de teoría, subtítulos, pausa/reanudación, drawer, controles y recuperación tras interrupción. La compilación y las pruebas automatizadas no sustituyen esa inspección visual y de audio. La URL del preview está READY, pero en esta continuación no se pudo ejecutar una sesión interactiva de navegador, por lo que no se declara validación manual.

### Límites preservados

- No se modificó `main`, ni configuración de producción, secretos, facturación o proveedores.
- No se incorporaron APIs ni fallbacks de pago; se conserva la política de cuotas gratuitas y pausa con aviso al agotarse.
- No reconstruir el material eliminado intencionalmente de Orby ICFES Lab ni usar conteos antiguos.

## Seguimiento correctivo — grabación 12/11/2026

### Hallazgos directos del vídeo nuevo

- El aula ya está abierta aproximadamente en 8.6 s; el cuadro nativo de permiso de Chrome aparece aproximadamente en 12.9 s. El vídeo no permite demostrar por sí solo si hubo clic en el micrófono justo antes. En el código, `startWorkspaceClass` y `beginWorkspaceClass` preparan el aula en silencio y no llaman a `getUserMedia`; la solicitud de audio vive en `startRealtimeVoice`, invocada desde el control explícito del micrófono. Se corrigió el texto de consentimiento para indicar que Chrome pide permiso solo al pulsar el micrófono y el estado inicial deja el micrófono silenciado.
- El encabezado mostraba una franja amarilla vacía porque una capa `::before` estaba visible antes de que se revelara el texto. Se ocultó esa capa en el título de clase; el marcador `::after` solo se dibuja al completar la escritura.
- El lápiz ya era SVG, pero se veía como un icono diminuto y su posición no dependía del progreso real del texto. Se amplió a 38 px y se liga su posición al número de caracteres revelados; el texto se revela carácter por carácter.
- La pizarra usaba un retardo de 135 ms entre elementos, lo que hacía que teoría y dibujo parecieran simultáneos. Se elevó a 820 ms por etapa espacial.
- El fallback de apertura y el handler Live inyectaban automáticamente miniaturas del banco visual (incluida la escena de mitosis simplificada) cuando el modelo no dibujaba. Se eliminó esa sustitución para Live y se retiró `visualBankKeys` del esquema de la herramienta en tiempo real. Live debe construir una escena SVG/sketch propia; si no puede, omite el dibujo en lugar de enseñar un mosaico genérico.
- Los subtítulos se redujeron a ventanas de 10 palabras y se recuperó tipografía más legible (14–16 px) en lugar del estilo de 12 px que los hacía diminutos.

### Validación de esta revisión

- Rama: `feat/founder-intro`; `main` y producción no se modificaron.
- GitHub Actions run `43248381617`: **380/380 pruebas aprobadas**, TypeScript, ESLint y build Next.js aprobados.
- Vercel Preview del commit `fad41026e4e7df5b565ef3857fd75b4c84e8032d`: **READY** — https://peak-score-bzwjvudyc-peak-score.vercel.app
- La validación manual en Chrome con una clase real y audio sigue pendiente; no declarar equivalencia visual con Studdy hasta grabar y revisar esa ejecución.

### Proveedores de generación de imágenes — decisión de coste

No se añadió un proveedor de imágenes. Stability AI anuncia 25 créditos de bienvenida para nuevas cuentas, pero las generaciones posteriores consumen créditos comprados; Hugging Face Inference Providers no incluye créditos mensuales para cuentas Free según su documentación de precios actual. No son una base de producción gratuita y sostenible. Mantener el presupuesto estricto: no introducir API facturable, saldo prepago ni fallback que pueda cobrar. La ruta actual es generar escenas SVG/sketch con Gemini Live dentro de su cuota gratuita y degradar sin imagen si no puede producir una escena válida.


## Implementación inicial — retirar el chat como puerta de entrada (12/11/2026)

### Cambios aplicados en `feat/founder-intro`

- Se cambió `OrbyWorkspacePage.tsx`: el espacio de estudio ya no monta OmegaX en `initialView="chat"`; ahora monta Orby con el lanzador dedicado de clase.
- Se añadió un lanzador de clase dentro de `LessonAITutor.tsx`, pero aislado del render conversacional: tema, área opcional y consentimiento explícito para el procesamiento de audio/texto en Gemini Live gratuito.
- El botón «Comenzar clase» invoca directamente `startWorkspaceClass()` desde el gesto del usuario, preservando la activación del navegador para el contexto de audio. No se usa un efecto automático posterior al montaje.
- Al iniciar, el flujo existente abre el aula Live; al salir, `finishVoiceCall()` regresa al lanzador, limpia el estado efímero y conserva la conversación Live persistida en servidor.
- El aula mantiene hoja/pizarra, dibujo acumulativo, subtítulos, drawer de transcripción, pausa, audio, teclado, micrófono y salida.
- Se eliminó el archivo duplicado temporal `OrbyStuddyClassroom.tsx`; el lanzador vive junto al estado/controlador de clase para que el inicio ocurra en el gesto real.
- Se añadió una prueba estática para impedir que el espacio de estudio vuelva a usar el chat OmegaX como pantalla inicial.

### Alcance que aún no se debe exagerar

- Esta fase retira el chat genérico del camino principal de `/aprender`; no significa que toda la lógica histórica de chat haya sido borrada del componente grande, porque partes compartidas aún soportan el panel lateral de transcripción y otras experiencias.
- La arquitectura Live, la pizarra y los controles se reutilizan como base. Aún falta extraer el aula a un componente autónomo y retirar físicamente las ramas de chat que ya no pertenecen al producto de clase.
- No se ha ejecutado CI tras estos commits ni QA manual en localhost/Chrome. TypeScript, ESLint, tests y build están pendientes de resultado.
- No se modificó `main`, no se desplegó, no se aplicaron migraciones remotas ni se cambiaron proveedores, cuotas, secretos o facturación.

- Ajuste adicional: mientras `classLauncher` está activo, cualquier estado distinto de `workspaceMode === "voice"` mantiene visible el lanzador; así la superficie de chat antigua no puede aparecer durante transiciones de inicio o salida.
- La prueba estática también verifica este guard. El estado de Vercel consultado continúa mostrando `build-rate-limit`; no hay una ejecución de GitHub Actions disponible para los commits recientes. No declarar validación automatizada.


## Continuidad incremental — inicio de sesión 12/11/2026 (revisión de Studdy y primer parche)

### Fuente de verdad y alcance confirmado
- Repositorio: `PeakScore777/PeakScore`; rama de trabajo: `feat/founder-intro`. No modificar `main`.
- Se leyó `docs/OMEGAX-STUDDY-2026-11-12.md` (especificación principal, 27.7 KB) y se revisó la grabación de Studdy compartida en esta conversación mediante fotogramas.
- La home de Studdy y el aula son dos superficies distintas: home con degradado pastel celeste/rosa y selector de intención; aula con hoja marfil/blanca, título manuscrito arriba a la izquierda, dibujo/teoría acumulativos y controles compactos en los bordes.
- El título de referencia usa un lápiz gráfico blanco/negro delineado, inclinado y situado junto al extremo del texto. No es un emoji ni un lápiz amarillo/rosado.
- La grabación también confirma controles superiores (menú, opciones, descarga/salida), controles inferiores (avatar, transcripción, pausa, audio, teclado y micrófono), subtítulos discretos y confirmación al terminar.
- No inferir arquitectura interna de Studdy ni copiar marca, textos o ilustraciones propietarias.

### Auditoría inicial del código remoto
- `components/aprender/OrbyWorkspacePage.tsx` monta `LessonAITutor` en modo `workspace`, `accent="orby"` y `classLauncher`; la home principal está integrada dentro de `LessonAITutor.tsx`, no en `OmegaXStudyHome.tsx`. No asumir que el componente alternativo `OmegaXStudyHome.tsx` sea el que se muestra.
- `components/aprender/LessonAITutor.tsx` contiene el flujo `startWorkspaceClass()` / `beginWorkspaceClass()`, que entra a `workspaceMode="voice"` y mantiene Gemini Live como motor de la clase. La home ya tiene Enter para enviar (sin Shift), así que no cambiarlo sin una nueva evidencia.
- La home ya incluye herramientas laterales: English Studio, Flashcards, Cuestionarios, Apuntes, Resúmenes, Grabaciones, Temas guardados, Progreso y Archivos.
- El aula ya renderiza `OrbyBoardTitle` y `OrbyBoard`, pero el documento de especificación registra que el tablero real no estaba dibujando correctamente en la grabación de OmegaX. La mera existencia de estos componentes no demuestra que el contrato de acciones de Gemini Live esté produciendo contenido visual.
- `OrbyBoard.tsx` tiene visuales SVG/sketch/diagramas y resaltado rojo. Debe auditarse el flujo real de datos y su renderer antes de rediseñar el componente o inventar visuales.
- `GlobalOrbyClassroomLauncher.tsx` ya excluye landing, login, registro y simulacros; no añadir un segundo launcher ni duplicar instancias.

### Cambio aplicado en esta sesión
- Archivo: `components/aprender/OrbyBoardTitle.tsx`.
- Commit: `a4f1aa092f8ddfce86bbf20c2027320ed7e507fb`.
- Se ralentizó la escritura progresiva del título: duración adaptativa de 2.8 a 6.2 segundos, calculada por longitud (78 ms por carácter antes de aplicar límites), y se elevó el intervalo mínimo a 48 ms.
- Se redibujó el SVG del lápiz para que sea blanco con contorno negro, punta y detalle interior negros, en lugar del cuerpo amarillo y pieza rosada anterior. Conserva su desplazamiento ligado al progreso del título.
- Este parche es exclusivamente de fidelidad del título/lápiz. No afirma que la animación ya coincida exactamente con Studdy hasta verla en navegador.
- No se ha ejecutado CI, TypeScript, ESLint, build ni QA manual después del commit. No declarar el cambio validado.

### Próxima secuencia obligatoria
1. Auditar el contrato de Gemini Live: herramientas de pizarra, respuestas `toolCall`, sanitización, secuencia de acciones, persistencia y actualización de `activeVoiceAssistantMessage.board`. Determinar por qué una clase puede comenzar sin dibujo.
2. Revisar `buildOrbyOpeningBoard`, el fallback de apertura y la selección del primer visual; evitar depender de que Gemini emita una acción visual opcional. No insertar mosaicos genéricos ni imágenes decorativas.
3. Comparar la composición de `OrbyBoard.tsx` con la referencia: hoja blanca acumulativa, texto completo y legible, ilustración relevante, conexiones/flechas/anotaciones y espacio en blanco intencional. Eliminar etiquetas internas como «Nueva explicación» del contenido visible.
4. Revisar subtítulos y controles con fotogramas de navegador, no solo JSX/CSS. Corregir únicamente hallazgos comprobados.
5. Revisar el flujo de inicio y la home Studdy integrada en `LessonAITutor.tsx`; preservar Enter para enviar, selección Tema/Preparación/Tarea, área opcional y herramientas laterales funcionales.
6. Mantener Gemini Live durante la clase. Eliminar el consentimiento artificial de prueba ya retirado, pero conservar solicitud de micrófono solo tras acción explícita.
7. Mantener el presupuesto estricto: servicios gratuitos dentro de cuota; si se agota, informar/pausar. No proveedores ni fallbacks facturables.
8. Tras cada parche, actualizar esta bitácora con archivos, commit, pruebas ejecutadas, resultado y pendientes. Si no se ejecutó una prueba, decirlo explícitamente.

### Reglas para la próxima sesión
- Retomar desde el HEAD actual de `feat/founder-intro`, no desde un SHA antiguo de la bitácora.
- Antes de editar, volver a leer el archivo remoto y su SHA; no sobrescribir cambios concurrentes.
- Hacer cambios pequeños, rastreables y verificados. No reescribir masivamente `LessonAITutor.tsx`.
- No borrar herramientas laterales ni rutas excluidas.
- No confundir el panel lateral de transcripción de clase con el chat genérico antiguo.
- No afirmar que Gemini Live dibuja hasta verificar una clase real y el tablero actualizado.


### Auditoría de flujo Live — hallazgos adicionales (12/11/2026, después del parche de título)

- `lib/ai/orby-live-tools.ts` declara `render_orby_teaching_board` como herramienta `NON_BLOCKING`. Su descripción exige que Gemini hable una frase inicial antes de la primera llamada visual y que envíe snapshots acumulativos con `spokenCue` literal. Por diseño puede existir un intervalo inicial con pizarra vacía mientras se completa la primera frase; debemos revisar la cola/revelado del cliente y medir cuánto dura, sin volver a bloquear la voz.
- El contrato de herramienta es extenso y detallado: escenas SVG/vectoriales, sketch y visuales tipados; no se deben simplificar las instrucciones sin revisar validación y pruebas. No solicitar `visualBankKeys` para Gemini Live.
- `lib/ai/orby-board-actions.ts` valida generación, identidad, secuencia y dependencias de acciones incrementales. Hay que comprobar cómo interactúan estas acciones con los snapshots completos de `render_orby_teaching_board`; no confundir el flujo de acciones incrementales con el render de snapshots.
- Hallazgo concreto del texto visible «Nueva explicación»: `buildOrbyContinuationBoard()` en `LessonAITutor.tsx` añade un bloque `step` con `label: "Nueva explicación"`. Si el fallback se muestra en el tablero, esa etiqueta interna se renderiza al estudiante y no corresponde a una anotación de profesor. Auditar quién invoca este fallback y cambiarlo por contenido semántico real o no añadir ese bloque, según el contexto; no ocultar el problema solo con CSS.
- **Bloqueo de privacidad por resolver, no eludir:** aunque la casilla de consentimiento ya no aparece en la home, `app/api/orby/realtime-session/route.ts` todavía devuelve `requiresFreeTierDataUseConsent: true` y rechaza el POST con HTTP 428 si `freeTierDataUseAccepted` no es true. El cliente `startRealtimeVoice()` también falla en preflight si no recibe esa aceptación. `lib/ai/provider-free-tier.ts` distingue correctamente confirmación de nivel sin coste de autorización de uso de datos. No eliminar el control del servidor ni enviar audio/texto a Gemini sin resolver de forma válida la divulgación/aceptación exigida por el nivel gratuito. El objetivo de producto sigue siendo quitar una casilla/modal innecesario de pruebas, pero no se debe falsear consentimiento ni ignorar condiciones del proveedor. Diseñar con el responsable una forma válida y clara antes de cambiar este gate.
- `finishVoiceCall()` limpia `voiceFreeTierConsentChecked` y devuelve al lanzador de tema; verificar si esta variable y su persistencia local son restos de la casilla eliminada, separándolas del gate real de privacidad si ya no tienen propósito.

### Próxima auditoría técnica prioritaria
1. Seguir `render_orby_teaching_board` desde `event.toolCall` hasta sanitización, cola por `spokenCue`, actualización del mensaje Live activo y persistencia. Identificar con líneas exactas por qué el tablero queda vacío en la grabación.
2. Seguir `buildOrbyOpeningBoard` y `buildOrbyContinuationBoard`, localizar los call sites y confirmar si el fallback «Nueva explicación» se muestra en la clase normal.
3. Revisar el tamaño/legibilidad real del layout espacial, y si los bloques/visuales del snapshot pasan el layout renderer. No hacer que un título o un párrafo de respaldo parezca una clase completa.
4. Resolver el gate de privacidad de Gemini Free Tier de forma transparente y compatible con las condiciones del proveedor; no saltarlo por conveniencia.
5. Probar el commit del lápiz y el documento de continuidad con CI. Registrar SHA, workflow y resultado; aún no hay evidencia de ejecución de pruebas tras `a4f1aa0`.


## Actualización de continuidad — transición profesional de inicio (12/11/2026)

### Requisito de producto reafirmado
El usuario reportó que al pulsar «Comenzar» la implementación entraba al aula casi instantáneamente y terminaba de cargar la clase dentro del tablero. Esto contradice la sección 1 del documento principal `OMEGAX-STUDDY-2026-11-12.md`: tras enviar el tema debe existir una transición inmersiva, sin textos técnicos, y el aula solo debe aparecer cuando la sesión esté lista.

### Auditoría de causa
- `startWorkspaceClass()` ocultaba el lanzador antes de iniciar la preparación.
- `beginWorkspaceClass()` montaba `workspaceMode="voice"` inmediatamente, antes de completar la conexión Live.
- El tablero podía renderizar el estado de preparación dentro del aula, haciendo que la carga de la sesión ocurriera ya dentro de la clase.
- `startRealtimeVoice()` ya espera el handshake real `setupComplete` antes de resolver; se usa ese punto como condición para entrar al aula, no la mera emisión de un token ni el inicio de la petición.

### Cambio aplicado
- Rama: `feat/founder-intro`.
- `components/aprender/LessonAITutor.tsx`:
  - El lanzador de estudio permanece visible mientras se establece la sesión Live.
  - `classPreparing` presenta una capa de transición a pantalla completa sobre la home.
  - No se cambia a `workspaceMode="voice"` antes de completar `startRealtimeVoice()` y recibir el handshake de sesión.
  - Después de la conexión se mantiene una pausa visual mínima de 520 ms para evitar que conexiones muy rápidas hagan desaparecer la transición en un solo frame; luego se oculta el lanzador y se monta el aula.
  - Si la conexión falla, la transición se retira y el usuario permanece en el lanzador para corregir/reintentar, en vez de caer dentro de un aula sin sesión.
  - La captura del micrófono sigue desactivada en el inicio; se mantiene el control explícito de micrófono dentro del aula.
- `app/globals.css`:
  - Nueva transición inmersiva pastel, con órbitas y barra de progreso animadas, sin textos de infraestructura ni estado técnico.
  - Respeta `prefers-reduced-motion`.
- Commits:
  - `8e97c805e6b69807f02532e59b1df02a0de28602` — mantener el lanzador y preparar Live antes de montar el aula.
  - `e5c42d07d4cc756c0edc696e814f7dcabaaf2311` — conservar el lanzador si falla el handshake.
  - `09ddbb7046b0efc49971e976bdfef68d70d4b828` — estilo de transición inmersiva.
- No se tocó `main`, producción, proveedores, facturación ni secretos.

### Validación y límites
- Se comprobó en código que el flujo Live tiene una promesa de `setupComplete` y que `startRealtimeVoice()` espera ese handshake.
- No hay todavía una ejecución de GitHub Actions asociada al commit de CSS `09ddbb7` (la consulta de runs asociados devolvió lista vacía).
- No se ejecutaron tests, TypeScript, ESLint ni build en esta sesión. No declarar la transición validada hasta correr CI.
- No se ejecutó una prueba de navegador ni grabación de escritorio/móvil. Verificar que la home permanezca visible durante toda la preparación, que el overlay se vea correctamente, que no haya flash del aula y que el aula aparezca tras la conexión.
- Confirmar caso de error de red, rechazo/timeout del handshake y reintento desde la home.
- El gate de privacidad de Gemini Free Tier no se ha modificado; no omitir divulgaciones ni falsear aceptación.


### Ajuste de robustez posterior
- Commit `9082dc126e88a2bb3a09cd7056f6fb0de0edb1c2`: `beginWorkspaceClass()` ahora espera a que termine `toggleVoiceMode()` antes de liberar `classStartInFlightRef`. Esto mantiene bloqueados los envíos duplicados durante toda la negociación Live, no solo durante la preparación síncrona inicial.

### Prueba de regresión y CI detectado
- Commit `1068a07aee8029dd437d604a7b8b6fa7333c872d`: se retiró de la prueba una aserción textual obsoleta que esperaba una frase de consentimiento de micrófono que ya no existe en la UI; se reemplazó por comprobaciones del flujo real: el inicio no captura micrófono, la clase inicia en modo salida, y la captura solo se solicita en la acción explícita del control.
- Se añadió prueba estática para proteger la transición: el lanzador no se oculta al iniciar, `classPreparing` se activa, la sesión Live se espera antes de ocultar el lanzador y el overlay inmersivo está presente.
- Vercel intentó construir el commit `8e97c805e6b69807f02532e59b1df02a0de28602` y falló antes de TypeScript/ESLint/build porque `tests/orby-request-filter.test.mjs:7090` contenía la aserción textual obsoleta. Se documenta como fallo de prueba preexistente en el commit de arranque, no como un fallo demostrado del parche de transición.
- No hay todavía un deployment asociado a los commits posteriores `e5c42d0`, `09ddbb7`, `0bd7e3e`, `1068a07` o `9082dc1` en la consulta realizada. No declarar CI aprobado.
- Próximo paso: esperar/consultar el Preview de los commits actuales, corregir cualquier fallo nuevo con la causa real y validar en navegador que la transición se vea antes del aula y que el handshake determine el momento exacto de entrada.


### Actualización final del requisito principal
- Se amplió la sección 1 de `docs/OMEGAX-STUDDY-2026-11-12.md` para dejar inequívoco que la home permanece visible bajo una transición inmersiva a pantalla completa mientras se negocia la sesión, que el tablero no se monta antes del handshake real, y que ante fallo se conserva el tema en la home para reintentar.
- Commit de especificación: `143b80b6a9f62a898a4cadeac18bf357953ae139`.
- Commit de la bitácora de esta actualización: `2c16ca86c036e2157d7b2da727569d9a78b13c46`.
- La implementación actual espera la promesa `setupComplete` que ya existe dentro de `startRealtimeVoice()`; el estado de transición permanece activo hasta que ese await resuelve y luego aplica 520 ms de permanencia visual antes de entrar al aula.
- Pendiente: el valor de 520 ms es un mínimo de transición, no una simulación del progreso del servidor. La duración total depende del handshake real. Validar en navegador con conexión rápida y lenta, y comprobar que no exista un flash del tablero ni un bloqueo del launcher.


### Prueba estática: limpieza de expectativas heredadas
- Se encontraron tres aserciones antiguas en `tests/orby-request-filter.test.mjs` que exigían una frase de interfaz de permiso de micrófono que ya no está en el producto.
- Se actualizaron los tests para comprobar el comportamiento actual (inicio Live sin captura de entrada, control explícito para activar micrófono, sin overlay/checkbox antiguo) en vez de obligar a restaurar el texto o la interfaz eliminados.
- Commits de actualización de pruebas: `1068a07aee8029dd437d604a7b8b6fa7333c872d`, `ba6b5c3dabcd792064a653e5e087cdc5823ad5b1`, `797502f809106d523d61daa6a4237c5dfbb6bec2`.
- Se añadió el test `el inicio de clase muestra la transición inmersiva antes de montar el aula`.
- **No se han ejecutado estas pruebas localmente ni en CI**; las aserciones están actualizadas, pero su resultado sigue pendiente.

### Bloqueo actual de Preview
- Se intentó crear un deployment Preview del SHA `797502f809106d523d61daa6a4237c5dfbb6bec2` desde la integración Vercel.
- Vercel respondió HTTP 402: límite del recurso `api-deployments-free-per-day` superado (más de 100 despliegues; reintento en 24 horas).
- No se cambió el plan, facturación ni configuración del proyecto. No usar un fallback que genere cargos.
- El último deployment visible en Vercel sigue siendo el commit anterior `8e97c805e6b69807f02532e59b1df02a0de28602`, en estado ERROR por una aserción obsoleta de micrófono en la suite de pruebas. Esa aserción se actualizó después, pero todavía no existe un build nuevo que confirme el resultado.
- Para validar: ejecutar `npm run test:orby`, `npm run lint` y `npm run build` cuando haya entorno local disponible; revisar también el siguiente Preview cuando el límite Vercel se restablezca. No hacer deploy de producción.


## Siguiente avance — tablero pedagógico y mitosis (12/11/2026)

### Auditoría de flujo real
- Se siguió el flujo de apertura desde `handleGeminiLiveEvent()` hasta `publishOrbyTranscriptBoardFallback()`, y el flujo de herramientas desde `event.toolCall` hasta `handleOrbyLiveTeachingBoardTool()`, cola por `spokenCue` y `publishOrbyTeachingBoardSnapshot()`.
- Hallazgo: el fallback local de la primera frase creaba una hoja con texto y `visuals: []`. Si Gemini Live tardaba en emitir `render_orby_teaching_board`, la primera hoja visible podía quedarse sin dibujo.
- Hallazgo: `buildOrbyContinuationBoard()` etiquetaba los fragmentos del fallback como `step` con el rótulo literal `Nueva explicación`, un metadato interno que podía aparecer en el tablero.
- Hallazgo visual: el renderer previo de `cell-division` representaba mitosis como cuatro tarjetas en cuadrícula, aunque las instrucciones de Live ya pedían una sola escena integrada y conectada.

### Cambios aplicados
- `components/aprender/LessonAITutor.tsx`:
  - Si el tema solicitado es mitosis/división celular mitótica, el fallback de la primera frase ahora incluye siempre un visual tipado `cell-division` con profase, metafase, anafase, telofase/citocinesis y detalles científicos breves.
  - El texto de apertura y el visual se ubican en una composición 16:9 de dos columnas; la función de reflujo coloca el dibujo a la derecha y mantiene la teoría a la izquierda.
  - Se corrigió el matcher de tema para usar límites de palabra reales (`\bmitosis\b`).
  - Los fragmentos posteriores del fallback ahora son bloques `text`, no pasos con la etiqueta interna «Nueva explicación».
- `components/aprender/OrbyBoard.tsx`:
  - El renderer de mitosis ahora dibuja una única secuencia SVG horizontal conectada por flechas: profase, metafase, anafase y telofase/citocinesis.
  - La escena incluye cromosomas condensados, alineación ecuatorial, separación de cromátidas y resultado de dos células hijas con la misma información genética.
  - El renderer de meiosis conserva su ruta anterior; el cambio integrado se limita a mitosis.
- `tests/orby-request-filter.test.mjs`:
  - Se añadieron aserciones para el visual de mitosis obligatorio en el fallback de apertura.
  - Se añadió una prueba estática para impedir que el renderer de mitosis vuelva a una cuadrícula de cuatro tarjetas.
  - Se comprueba que el fallback de continuación no emita «Nueva explicación».
- Commits:
  - `1145b6c1efa7a9becc0072f1728404e2607243a0` — asegurar diagrama de mitosis en la primera hoja y retirar etiqueta interna.
  - `5ab2137a02a7113f4e8ab6a8b01acf579fb38abf` — corregir detección de tema mitosis.
  - `3cfa536ac85139dc22af38994dbb2b7076fc2fee` — dibujar mitosis como secuencia integrada.
  - `73f84537a861e3de209e8c9b6d2e4347840def85` — añadir cobertura de fallback de mitosis.
  - `cbce7c6dcfd5366c2dedd4351307c4f1b89099fb` — probar composición integrada sin tarjetas.

### Validación y límites
- Se revisaron las fuentes y el contrato de sanitización: las cuatro fases usan nombres canónicos y detalles no vacíos; el snapshot es acumulativo y su composición espacial asigna la teoría a la izquierda y el dibujo a la derecha.
- Las pruebas añadidas son estáticas; no se han ejecutado `npm run test:orby`, ESLint, TypeScript ni `next build`.
- No se ha grabado una sesión real de Gemini Live para confirmar el dibujo en sincronía con la voz. La escena fallback garantiza contenido visual al publicar la primera frase completa, pero no sustituye la validación de la escena incremental que emite Live.
- El despliegue Preview continúa bloqueado por el límite diario de Vercel comunicado en la actualización anterior. No se cambió el plan ni se intentó una ruta de despliegue facturable.

### Próxima tarea concreta
1. Revisar el contrato de herramientas de Gemini Live para mitosis y garantizar que la escena integrada generada por Live use una única ilustración, no cuatro miniaturas.
2. Auditar el espacio real de la pizarra: escala del SVG, altura útil, tamaño de texto, lectura en escritorio/móvil y relación entre teoría y dibujo.
3. Resolver el gate de privacidad del nivel gratuito con un flujo legítimo; no falsear aceptación ni enviar datos al proveedor sin autorización válida.
4. Ejecutar suite, lint y build cuando el entorno/Preview vuelva a estar disponible y hacer una grabación comparativa con Studdy.


## Iteración — home Studdy y preparación dentro del botón (12/11/2026)

### Requisito más reciente del usuario
La referencia de Studdy debe replicarse también en la composición de la página principal. Al pulsar Inicio, no debe aparecer una pantalla de carga separada ni un overlay que tape la home. El formulario y el fondo permanecen en su lugar; el botón azul muestra el spinner y el texto “Preparando tu lección…” aparece dentro del compositor. Este requisito actualiza y reemplaza cualquier nota anterior que pidiera transición inmersiva a pantalla completa.

### Cambios aplicados en `feat/founder-intro`
- `components/aprender/LessonAITutor.tsx`:
  - Eliminada la capa fija de transición a pantalla completa; la preparación ahora se refleja dentro del botón Inicio y del compositor existente.
  - Ajustada la cabecera: menú circular y marca OmegaX a la izquierda; acceso al panel y perfil a la derecha.
  - Rehecho el drawer con el patrón de Studdy: panel blanco anclado a la izquierda, cierre explícito, Nuevo tablero, Tableros recientes y acceso a herramientas.
  - El compositor conserva las tres modalidades, el selector opcional de área, el adjunto de imagen y la URL de referencia.
  - El archivo de imagen seleccionado se conserva a través de la inicialización de la conversación y se envía al primer turno Gemini Live como `inlineData`; se limpia después de enviarlo correctamente.
  - La URL se añade al prompt inicial como referencia y se instruye al modelo para que no afirme haberla leído si no puede acceder. **No se implementó todavía una extracción/descarga server-side del contenido de cualquier URL.**
  - Añadido “Escanear material” al drawer; abre el selector de cámara trasera del dispositivo y prepara la fotografía con el mismo procesador de imágenes.
- `app/globals.css`:
  - Estilos de botones compactos para Agregar archivo/Agregar URL, texto de preparación integrado, animación del spinner y ajustes responsive para pantallas pequeñas.
- `components/aprender/OrbyBoard.tsx`:
  - En `publishOrbyTranscriptBoardFallback()` se vacía la cola de snapshots inmediatamente después de encolarlos. Esto permite revelar una frase si el reloj de audio ya ha cruzado su `spokenCue`, en lugar de dejarla pendiente hasta otro tick.
  - Corregidas comparaciones TypeScript inalcanzables dentro de la rama de meiosis, después del retorno temprano de mitosis. La corrección conserva el flujo visual de meiosis.
- `tests/orby-request-filter.test.mjs`:
  - La prueba de inicio ahora exige preparación inline y prohíbe el overlay a pantalla completa.
  - Se conserva la prueba del sincronismo entre la teoría fallback y el reloj de audio.

### Commits de esta iteración
- `e21b0066ad24bea4deeb56d0fbe1423a8e1764e4` — home Studdy y carga integrada en Inicio.
- `e90ffca0e5bc4810d0ff34ca8f3d131b9e0e271a` — drawer y liberación de snapshots de respaldo.
- `bbebf8b5cda60064b4f46d4201ac9df0475bf0a6` — estilos del compositor y responsive.
- `578d2696663e3e92beb76f9ef7d953999af62be1` — pruebas alineadas con el flujo inline.
- `a28fc762594fcebcc234fbef54c293790164db72` — texto del drawer.
- `7dd6d4ba850e8dd65b22dc5b1aa86fde3207c779` — retirada de un setter de consentimiento inexistente al salir de clase.
- `2a00ce39fd355bd62dbd712ebef51ac68dd981da` y `f0e076b4555f2a0aa21b5d6b1f746432a4214a8e` — corrección TypeScript de la rama de meiosis.
- `4934627eeabaa7de154e224bb54aaff8e3beb5ce` — escáner desde la cámara en el drawer.

### Validación
- GitHub Actions, commit `4934627eeabaa7de154e224bb54aaff8e3beb5ce`, workflow [43341695009](https://github.com/PeakScore777/PeakScore/actions/runs/43341695009): **success**.
- `npm run test:orby`: 355 tests, 355 pass, 0 fail.
- TypeScript: success.
- ESLint: success.
- Next.js production build: success.
- No se modificó `main`, no se creó un deployment de producción ni se añadieron proveedores de IA o servicios de pago.

### Pendientes y límites verificados
1. No se ejecutó una comparación visual en navegador ni una grabación nueva de Gemini Live. CI valida pruebas y compilación, no fidelidad visual en ejecución. La vista Preview no se creó en esta iteración; la bitácora anterior ya registra el bloqueo diario de despliegues Vercel.
2. “Agregar URL” pasa el enlace como referencia en el prompt de Live; todavía no descarga ni extrae automáticamente el contenido de la página. No afirmar que el contenido de la URL fue leído sin una recuperación real.
3. “Todo el historial” continúa dirigiendo a Apuntes/notas guardados, no a un historial navegable de sesiones Live; no reactivar la conversación antigua que las pruebas excluyen.
4. Validar en navegador que el spinner queda alineado dentro del botón, que el texto de preparación no desplaza el compositor y que la home permanece visible durante toda la negociación Live.
5. Probar en un dispositivo móvil el selector de cámara trasera y la ruta de adjuntar una fotografía al primer turno Live.
6. Hacer una grabación del aula completa para comparar título manuscrito, lápiz, revelado del tablero, dibujos, subtítulos, controles, chat lateral, pausa y reanudación con el video Studdy. No marcar esa paridad como terminada solo porque CI esté en verde.
7. El gate de privacidad de Gemini Free Tier no se modificó. Mantener la revisión separada y no falsear aceptación ni enviar datos sin autorización válida.

**Último commit funcional validado:** `4934627eeabaa7de154e224bb54aaff8e3beb5ce`. Los commits posteriores actualizaron la especificación y esta bitácora; el HEAD actual de `feat/founder-intro` debe consultarse en GitHub antes de la siguiente edición.

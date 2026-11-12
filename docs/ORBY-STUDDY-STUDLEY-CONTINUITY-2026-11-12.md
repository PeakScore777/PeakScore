# Orby: continuidad de aula Studdy + método visual Studley
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

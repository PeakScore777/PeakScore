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

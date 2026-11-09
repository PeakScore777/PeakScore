# OmegaX / Orby — revisión visual de los videos Studdy y siguiente iteración
**Fecha:** 2026-11-09  
**Rama:** `feat/founder-intro`  
**Base revisada:** HEAD `f1a73cde59268ab99afbac2004108799d70d3c48`  
**Alcance:** inspección visual de los dos MP4 aportados en esta sesión. No se afirma transcripción ni validación acústica del audio.

## 1. Material observado
- `studdy.mp4`: 47.6 s. Muestra entrada al espacio de estudio, una clase ya abierta con pizarra manuscrita, explicación biológica, diagramas, controles compactos de voz y salida de la clase.
- `studdy (2).mp4`: 309.1 s. Muestra la página pública y el acceso al aula, después una sesión extensa de biología: título persistente, pregunta/explicación a la izquierda, ilustraciones y diagramas que se agregan progresivamente, señalamiento de partes y continuidad del contenido entre etapas.

La inspección fue por fotogramas. No inferir proveedores, frameworks ni arquitectura interna de Studdy a partir de la interfaz. No copiar marca, textos ni ilustraciones propietarias.

## 2. Patrones funcionales que debemos igualar o superar
1. **Aula como espacio de trabajo:** la pizarra es el foco principal; los controles de voz son discretos y no compiten con el contenido.
2. **Explicación acumulativa:** las notas y dibujos anteriores permanecen mientras el profesor añade el siguiente concepto.
3. **Composición legible:** texto breve, ilustración central, etiquetas y relaciones claras; no convertir la pizarra en una sucesión de tarjetas inconexas.
4. **Señalamiento pedagógico:** destacar la parte exacta que se está explicando y retirar el foco sin borrar la tinta.
5. **Clase larga:** la sesión puede continuar por varias zonas/hojas sin perder contexto.
6. **Interacción natural:** el estudiante debe poder interrumpir, pedir aclaración, solicitar repetición y volver a la explicación.
7. **Entrada simple:** comenzar por qué quiere aprender/resolver el estudiante y conservar el contexto al entrar a clase.

## 3. Estado verificado de PeakScore en HEAD
- Pizarra espacial v2 y multipágina v3 (2–4 hojas 16:9).
- Navegación accesible entre hojas, marcador de hoja visible sincronizado con scroll, teclado y `prefers-reduced-motion`.
- Contrato de snapshots acumulativos con IDs/sequence/page estables.
- Visuales tipados y sketch manuscrito con animación de tinta; acciones incrementales `append-block`, `append-strokes`, `focus`, `clear-focus`, `erase` y `replace`.
- Live y tutor escrito conocen el contrato v3.
- Persistencia atómica/idempotente para tutor escrito y voz, con migración SQL v3 añadida en `20261109030000_orby_multipage_board_v3_persistence.sql`.
- GitHub Actions run `42557118786` para HEAD `f1a73cde`: éxito en el job “Orby tests, TypeScript, ESLint and production build”.
- El estado de Vercel para el mismo SHA sigue indicando rate limit de despliegue; no tratarlo como build fallido del código ni intentar eludirlo con facturación.

## 4. Diferencias y límites que siguen abiertos
- **Zoom/pan:** el canvas multipágina actual se desplaza verticalmente y tiene navegación por hojas; no es todavía un lienzo con zoom y desplazamiento libre.
- **Coreografía docente:** existen acciones incrementales y foco, pero falta QA real de una secuencia larga encadenada durante voz.
- **Sincronización voz-tinta:** se ordenan eventos y se anima el trazo; no hay timestamps fonéticos exactos garantizados por el proveedor. No prometer sincronía palabra a palabra.
- **Continuidad tras recarga:** el SQL está en la rama, pero no se ha aplicado al Supabase remoto ni se ha verificado una sesión v3 recuperada del historial.
- **Gemini Live:** continúa detrás de los controles explícitos de plan gratuito y aprobación de uso de datos. No activar variables por inferencia.
- **Experiencia real:** CI no sustituye Chrome con micrófono, interrupciones, pausas, reconexiones, teclado y viewport móvil.

## 5. Siguiente orden de trabajo
### P0 — cerrar persistencia v3 sin riesgo
1. Confirmar con el responsable el entorno Supabase destino y aplicar la migración solo con autorización.
2. Verificar las dos RPC, permisos/service role, idempotencia y lectura de `teaching_board`.
3. Guardar una conversación escrita y una de voz con 2–4 hojas; cerrar y reabrir el historial para comprobar restauración completa.
4. Mantener fallback textual honesto si el esquema remoto todavía no está actualizado.

### P1 — navegación espacial de nivel aula
1. Añadir controles discretos de zoom (ajustar, acercar, alejar y restablecer) sin alterar el layout ni las coordenadas guardadas.
2. Añadir desplazamiento/pan accesible que no secuestre scroll vertical ni interfiera con selección de texto, botones o lápiz.
3. Mantener hojas 16:9 y navegación existente; definir límites de zoom, gesto táctil, rueda/trackpad y estado inicial responsive.
4. Respetar `prefers-reduced-motion`, teclado y controles etiquetados; excluir controles de impresión.
5. Probar que el cambio de escala no altera IDs, foco, orden de trazos ni detección de hoja activa.

### P2 — clase continua
1. QA del ciclo `focus → explicar → clear-focus → focus → append` en el mismo tablero.
2. Confirmar pausa/reanudación, interrupción, nueva pregunta, respuesta tardía y cancelación por generación.
3. Comprobar que el audio no espera las herramientas no bloqueantes y que no se duplica ningún fragmento.
4. Validar tutor Live y fallback por turnos con el mismo contrato pedagógico.

### P3 — pulido del aula
- Mantener controles de voz compactos y persistentes sin tapar la pizarra.
- Mejorar la entrada de estudio y el contexto materia/tema/nivel.
- Añadir recursos de clase (anotaciones, resúmenes, tarjetas y grabaciones) solo con flujos reales, persistencia y pruebas; no colocar botones decorativos sin acción.

## 6. Restricciones de seguridad y operación
- No modificar `main`, no hacer merge ni despliegue desde esta iteración.
- No activar Gemini Live ni consentimientos de datos sin confirmación explícita del responsable.
- No introducir proveedores, APIs, modelos, créditos de inferencia ni fallbacks que puedan generar cargos. Mantener solo planes gratuitos confirmados; al agotar cuota, pausar/degradar con aviso.
- No aplicar migraciones remotas sin autorización y verificación del proyecto destino.
- No afirmar QA real de audio, navegador o persistencia remota hasta ejecutar esas pruebas.

## 7. Criterio de aceptación de la siguiente entrega
La clase debe poder abrirse en varias hojas, acercarse/alejarse y desplazarse sin romper la navegación; Orby debe añadir contenido a la misma clase, señalar y retirar foco sin borrar, tolerar interrupciones, y al reabrir el historial recuperar la pizarra completa. Todo ello debe pasar tests Orby, TypeScript, ESLint, build y QA manual autorizado en Chrome.


## 8. Primera implementación de navegación espacial — 2026-11-09

Commits de implementación en `feat/founder-intro`:
- `58591ced`: controles de zoom y desplazamiento de la pizarra.
- `6da8392`: estilos de controles y protección del arrastre sobre elementos interactivos.

### Implementado
- Zoom con límites entre 60 % y 200 %, en pasos de 10 %.
- Botones accesibles para acercar, alejar y volver al 100 %.
- Preservación aproximada del centro visible al cambiar el zoom.
- Modo explícito `Mover pizarra` para arrastrar con puntero, sin convertir cada interacción normal con la pizarra en un gesto de movimiento.
- Arrastre con botón central también disponible.
- Desplazamiento de la región mediante flechas y PageUp/PageDown cuando recibe foco.
- `IntersectionObserver` de las hojas ahora usa la región de scroll como root; mantiene el indicador correcto dentro del nuevo viewport.
- Controles fuera de impresión y estilos de foco visibles. El CSS de impresión fuerza ancho de hoja al 100 %.

### Límites que se mantienen
- No es todavía un infinite canvas: sigue siendo una secuencia vertical de 2–4 hojas 16:9, sin coordenadas ilimitadas.
- La vista se escala cambiando el ancho del contenido; no se altera el modelo espacial guardado ni las posiciones de bloques/visuales.
- El comportamiento táctil de arrastre se activa únicamente con el modo de movimiento para no impedir el scroll normal ni la selección de texto.
- Falta verificar visualmente en Chrome el ajuste en pantallas pequeñas, rueda/trackpad, zoom alto, foco de teclado y exportación PDF. CI debe confirmar tests, TypeScript, ESLint y build antes de considerar cerrado el hito.

### Estado
- Código y prueba estática añadidos a la rama.
- QA de interacción real aún pendiente.
- No se aplicó SQL remoto, no se cambió `main`, no hubo despliegue ni cambios a proveedores, privacidad o cuotas.


## 9. Revisión complementaria de tecnología y estado HEAD — 2026-11-09

### HEAD real consultado
- Rama: `feat/founder-intro`.
- HEAD consultado: `42f6eb017c1a69464cd9733c711f692e983e9223` — `fix(orby): enforce streaming final-word highlight guard`.
- Padre: `24f1a522a09a6da9ea38fc1c2705ea28dca2ebc1`, commit documental sobre el mismo guard.
- El último cambio de código limita el karaoke a la penúltima palabra mientras Live sigue generando y libera la palabra final cuando `responseComplete` es verdadero. Conserva `AudioContext.currentTime` como reloj; no agrega temporizadores ni servicios.
- La consulta de GitHub Actions para el SHA actual no devolvió ejecuciones asociadas. La validación verde documentada de 272/272 tests + TypeScript + ESLint + build corresponde al commit anterior `5d090884d7b62c9693d6fd7269e562c02f1db219`; no extrapolarla al HEAD posterior sin CI.
- No se encontró evidencia de cambios en `main`; esta iteración permanece en la rama de trabajo.

### Revisión de la implementación que ya existe
- `lib/ai/orby-board.ts` ya define un lenguaje visual tipado: bloques de explicación, diagramas de nodos/aristas, gráficas, vectores, tablas, moléculas, circuitos, células, ADN, cuadros de Punnett, división celular, sistemas orgánicos, neuronas, procesos fisiológicos, líneas de tiempo, sketches y anotaciones.
- `lib/ai/orby-live-tools.ts` declara `render_orby_teaching_board` como herramienta no bloqueante y pide snapshots acumulativos, IDs estables, actualizaciones por transición pedagógica y preservación de tinta.
- `components/aprender/OrbyBoard.tsx` renderiza visuales SVG y animación progresiva; el foco del profesor puede señalar un objetivo sin modificar ni borrar la tinta.
- `package.json` incluye `@google/genai` y `@napi-rs/canvas`, pero no incluye Rough.js, Excalidraw, tldraw ni un SDK de generación de imágenes. No instalar dependencias sin una decisión y un caso de prueba.
- La base implementada es más avanzada que una pizarra de texto simple; el trabajo de mayor valor ahora es mejorar la calidad/variedad de las ilustraciones, la coreografía visual, el layout y el QA real, no reescribir desde cero.

### Investigación de tecnologías para imágenes y pizarra
1. **Rough.js (MIT):** biblioteca pequeña para dibujar líneas, curvas, círculos, polígonos y paths SVG/Canvas con apariencia hecha a mano. Candidato para una capa visual de estilo, si las pruebas muestran una mejora frente a los sketches SVG existentes. Fuente: https://roughjs.com/ y https://github.com/rough-stuff/rough.
2. **Excalidraw (MIT):** pizarra infinita de estilo manuscrito con exportación PNG/SVG y formato JSON abierto. Es una referencia viable para edición manual o importación/exportación, pero su editor completo no debe reemplazar el renderer pedagógico sin demostrar que conserva el contrato incremental, IDs, foco docente, snapshots y accesibilidad. Fuente: https://github.com/excalidraw/excalidraw.
3. **tldraw:** SDK React con cámara, zoom/pan, shapes y API de edición programática, pero su SDK es comercialmente licenciado para producción; no cumple la restricción actual de solo herramientas libres sin coste/licencia comercial. No adoptar. Fuentes: https://tldraw.dev/faq y https://tldraw.dev/community/license.
4. **PubChem PUG REST / Imaging Services:** servicio público del NIH que entrega imágenes PNG 2D/3D y registros químicos; candidato concreto para estructuras moleculares verificables. Debe implementarse con caché, límites, atribución y manejo de fallos, sin bloquear voz. Fuentes: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest y https://pubchem.ncbi.nlm.nih.gov/docs/imaging-services.
5. **Recursos abiertos curados:** para anatomía, biología, geografía, historia y física, priorizar recursos con licencia y procedencia explícitas (p. ej., repositorios educativos abiertos y Wikimedia Commons), guardando metadatos de fuente/licencia y evitando reutilizar imágenes propietarias de Studdy.
6. **Generación de imágenes Gemini:** el catálogo oficial consultado indica que los modelos actuales de generación de imágenes no tienen Free Tier de API. Por la restricción de coste cero, no usarlos ni introducirlos como fallback. Fuente: https://ai.google.dev/gemini-api/docs/pricing.
7. **Kokoro 82M:** modelo TTS de pesos abiertos Apache-2.0. Solo candidato experimental para una voz local/fallback; validar primero español colombiano, naturalidad, streaming, memoria y latencia en hardware objetivo. No usar una API alojada de pago. Fuente: https://huggingface.co/hexgrad/Kokoro-82M.

### Voz: arquitectura recomendada y límites
- Mantener Gemini Live como conversación nativa de baja latencia y audio bidireccional, con herramientas no bloqueantes para construir la pizarra. La documentación oficial confirma audio de entrada/salida, transcripción y tool use: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api.
- LiveKit es una capa opcional de transporte/orquestación WebRTC, no un modelo de voz ni una fuente de inferencia gratuita. No añadirlo mientras el flujo WebSocket actual cubra la necesidad; reconsiderar solo si pruebas reales muestran problemas de reconexión, latencia o escalado. Fuentes: https://docs.livekit.io/intro/about/ y https://docs.livekit.io/agents/.
- La tabla oficial de precios de Gemini muestra Free Tier para Live, pero advierte que el contenido del Free Tier puede usarse para mejorar productos. La aprobación de privacidad y la confirmación de ausencia de facturación siguen siendo gates obligatorios. No activar flags ni enviar audio si no están aprobados: https://ai.google.dev/gemini-api/docs/pricing.
- La voz y el tablero deben seguir siendo desacoplados: el audio no espera el render de la pizarra; los eventos visuales deben ser acumulativos, cancelables por generación e idempotentes.
- El karaoke actual es una estimación basada en texto y horizonte de PCM, no alineación fonética exacta. No prometer sincronía palabra-a-palabra sin timestamps reales del proveedor.

### Sobre el audio de los videos de referencia
- Se verificó que ambos MP4 contienen pista de audio y se inspeccionó su duración/estructura de archivo.
- En esta revisión no se obtuvo una transcripción fiable ni una escucha acústica verificable de las pistas. Por rigor, no se hacen afirmaciones sobre timbre, acento, prosodia, naturalidad, pausas o latencia audible de la voz de Studdy. Esa comparación queda explícitamente pendiente de una escucha/transcripción real; no inventar observaciones.

### Prioridades técnicas resultantes
- P0: registrar CI del HEAD actual y conservar el guard de última palabra; no declarar aprobado un SHA sin workflow asociado.
- P1: ejecutar QA Chrome real de voz + pizarra, con micrófono, interrupción, reanudación, pérdida de red y clase de varias páginas.
- P1: crear un catálogo de ilustraciones científicas con esquema tipado, procedencia/licencia, caché y fallback SVG; comenzar por célula, mitosis/meiosis, neurona, sistemas, moléculas y circuitos.
- P2: prototipar Rough.js en una rama aislada o test de renderer y compararlo con el sketch actual antes de añadir dependencia.
- P2: investigar Excalidraw solo para edición manual/authoring, no para sustituir el tablero Live.
- P3: benchmark Kokoro local en español colombiano en el hardware mínimo real; no activar fallback de voz todavía.

### Restricciones preservadas
- Solo servicios/modelos con uso gratuito real confirmado; sin APIs facturables, créditos de inferencia ni fallbacks silenciosos de pago.
- No activar Gemini Live, Free Tier ni aprobación de datos por inferencia; el gate de privacidad permanece.
- No desplegar, no modificar `main`, no fusionar, no aplicar migraciones remotas y no cambiar secretos/variables.
- El audio de Studdy no se declara analizado acústicamente hasta contar con evidencia real.


## 10. Segunda pasada audiovisual y precisión del análisis — 2026-11-09

### Revisión visual de los dos MP4
Se generaron hojas de contacto con 12 fotogramas distribuidos temporalmente por archivo (no solo el primer frame):
- `studdy.mp4` (47.63 s, 1918×952, 30 fps): inicio/entrada al espacio de estudio, transición a una pizarra de biología ya construida y controles compactos. En los fotogramas disponibles se observa contenido manuscrito y diagramas; no se puede concluir el orden exacto de cada animación solo con esta muestra.
- `studdy (2).mp4` (309.07 s, 1918×952, 30 fps): página de producto/entrada al aula y sesión extensa. Se observa título persistente, explicación en texto manuscrito, diagramas biológicos (división celular, cromosoma y representación de células), etiquetas y adiciones progresivas a la misma composición. La pizarra conserva material anterior en lugar de sustituir toda la hoja en cada paso.
- El patrón diferencial más importante no es «poner imágenes»: es **composición didáctica acumulativa**. Cada visual se integra con título, texto breve, etiquetas y relación con el punto que se está explicando. La clase mantiene continuidad visual.

### Revisión técnica de las pistas de audio (sin fingir escucha)
- Ambas pistas se pudieron extraer como PCM mono a 16 kHz para inspección técnica.
- `studdy.mp4`: duración 47.63 s; volumen medio medido −40.3 dBFS y pico −12.9 dBFS. Con umbral de silencio de −38 dB y duración mínima de 250 ms, FFmpeg marcó silencio desde 0 a 42.93 s y un tramo final desde 44.73 a 46.78 s. La pista tiene actividad audible concentrada en una fracción muy pequeña del clip.
- `studdy (2).mp4`: duración 309.07 s; volumen medio −31.8 dBFS y pico −9.2 dBFS. El detector identificó numerosos tramos silenciosos (180 eventos de inicio/fin a −38 dB/250 ms), por lo que no es correcto interpretar el clip completo como narración continua.
- Estos son indicadores de nivel/pausas, **no una evaluación perceptiva**. En este entorno no se obtuvo reproducción/escucha humana verificable ni transcripción alineada. Por tanto, siguen pendientes timbre, acento, español, prosodia, naturalidad, pronunciación, velocidad, latencia percibida, interrupciones y sincronía voz-lápiz. No declarar que «la voz de Studdy suena X» hasta completar esa prueba.
- Próximo paso de audio: reproducir los dos archivos con escucha real y anotar segmentos con timestamp; después transcribirlos con timestamps y comparar velocidad de habla, pausas, turn-taking y relación temporal con las acciones del tablero. No utilizar ASR como sustituto de evaluación de naturalidad.

### Implicaciones para Orby
1. Mantener el motor de voz y la pizarra desacoplados; la voz nunca debe esperar a que termine un render visual.
2. Emitir etapas pequeñas con intención pedagógica: título → explicación breve → diagrama → etiquetas/flechas → foco del profesor → retirada de foco.
3. Mantener el dibujo acumulativo, pero permitir correcciones localizadas sin regenerar el tablero entero.
4. Crear una biblioteca propia de ilustraciones educativas originales/abiertas, con metadatos de licencia y fuente. Priorizar diagramas científicos exactos sobre imágenes generativas decorativas.
5. Comparar cada clase en una matriz de calidad: precisión académica, legibilidad, progresión de tinta, composición, continuidad, latencia visual, sincronía semántica, interrupción y recuperación.
6. No asumir que Studdy usa una tecnología concreta. La interfaz no revela su stack privado.

### Estado de Git y alcance
- HEAD de la rama al iniciar esta segunda pasada: `4387558599831225aaf2aa4e11cce592f02edb82` (commit documental de investigación).
- El código funcional más reciente inspeccionado antes de esos commits documentales permanece en `42f6eb017c1a69464cd9733c711f692e983e9223`; los commits `83d1526` y `4387558` solo ampliaron documentación.
- Esta pasada actualiza documentación y métricas de inspección; no cambia lógica de producto, modelos, proveedores, cuotas, migraciones ni configuración.
- Sin cambios en `main`, sin merge, sin despliegue y sin migraciones remotas.


## 11. Recursos visuales complementarios — verificación de licencias

- **Bioicons:** biblioteca útil para SVG científicos (biología, genética, fisiología, laboratorio y química). No tratar todo el catálogo como una licencia única: cada icono tiene su propia licencia y atribución. Registrar autor, URL, licencia y modificaciones por asset; filtrar por CC0/MIT cuando se quiera reducir fricción. Fuente: https://bioicons.com/ y https://github.com/duerrsimon/bioicons.
- **KaTeX (MIT):** candidato para fórmulas matemáticas rápidas, consistentes y accesibles; complementa el renderer de bloques, no sustituye la geometría de gráficas/diagramas. Fuente: https://github.com/KaTeX/KaTeX.
- **MathJax:** alternativa robusta cuando se requiera mayor cobertura de TeX/MathML y salida SVG; evitar cargar ambos motores si uno cubre los requisitos. Fuente: https://docs.mathjax.org/en/latest/output/index.html.
- **PhET:** sus simulaciones regulares ahora indican CC BY-NC 4.0 y definen uso comercial incluyendo productos por suscripción, publicidad o ventaja comercial. Por ello no asumir que se pueden incrustar en PeakScore sin licencia comercial; usarlas solo tras revisión legal/permiso o como referencia pedagógica interna. Fuente: https://phet.colorado.edu/en/licensing/.
- **Wikimedia Commons:** útil para imágenes reales y recursos históricos/científicos, pero cada archivo tiene su propia licencia y requisitos de atribución; guardar procedencia individual. Fuente: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en.
- **Kokoro en entorno local:** la documentación de Google AI Edge lista un bundle Kokoro-82M con locale español y voces `ef_dora`, `em_alex`, `em_santa`, además de un bundle cuantizado de ~295 MB para GPU. Esto confirma cobertura general de español, no calidad específica colombiana. Debe medirse en el dispositivo mínimo y no usarse como voz de producción hasta evaluar pronunciación, prosodia, streaming, RAM y GPU. Fuente: https://developers.google.cn/edge/mediapipe/solutions/audio/text_to_speech/index.
- **Rough.js:** se mantiene como experimento de estilo para la geometría SVG actual, no como generador de ilustraciones científicas. Puede hacer que trazos y formas parezcan dibujados a mano, pero no resuelve exactitud anatómica ni diseño de lecciones. Fuente: https://github.com/rough-stuff/rough.

### Decisión de arquitectura visual
No adoptar un editor externo como reemplazo del tablero. Mantener el contrato tipado v3 y construir un **pipeline híbrido**:
1. SVG nativo y primitives tipadas para diagramas que deben ser exactos y animables.
2. KaTeX para ecuaciones.
3. Assets científicos curados (Bioicons/Wikimedia) con licencia por archivo y caché.
4. PubChem para moléculas identificadas por compuesto.
5. Rough.js opcional solo como acabado para ciertos trazos; comparar render y peso antes de instalar.
6. Simulaciones propias sencillas cuando el concepto requiera movimiento; no incrustar PhET hasta resolver licencia de uso en producto.

La generación por IA de imágenes no debe ser la ruta predeterminada: es más difícil controlar exactitud, texto, consistencia y coste.


## 12. Corrección del flujo «tema primero → comenzar → clase» — 2026-11-09

### Comparación precisa de los videos aportados
- Los archivos `studdy.mp4` (47.6 s) y `studdy (2).mp4` (309.1 s) corresponden a Studdy; `20261109-1504-39.0147767.mp4` (32.7 s) corresponde a la grabación actual de PeakScore.
- En la referencia larga de Studdy, el alumno define primero qué quiere estudiar y pulsa el CTA para comenzar. Luego entra al aula; aparece el tema como título de clase y empieza la explicación hablada mientras se construye la pizarra. El contenido visual se compone con texto/escritura y diagramas ilustrativos separados, que se conservan mientras progresa la clase.
- La observación del menú contextual «Copiar imagen» es compatible con que el puntero alcance un recurso de imagen independiente (por ejemplo, un elemento `img` PNG/WebP/SVG), pero no demuestra el origen del asset. Puede ser un asset pre-curado, render exportado, imagen generada anteriormente o recurso creado por un servicio de imagen. No demuestra que Studdy tenga un banco de imágenes ni permite identificar un proveedor.
- Para PeakScore, la decisión de UX es clara aunque la arquitectura interna de Studdy siga sin verificarse: **pedir el tema antes de iniciar el micrófono**, y solo después de pulsar comenzar iniciar la llamada Live, colocar el título en la pizarra y hablar.

### Diagnóstico de la grabación PeakScore (32.7 s)
- La pantalla sí muestra «¿Qué quieres aprender hoy?», pero el CTA «Iniciar clase en vivo» abre directamente la sesión sin capturar el tema. El contexto enviado al tutor se mantiene genérico (`Estudio y aprendizaje`), por lo que el inicio no es equivalente al flujo de Studdy.
- Después del clic, el estado muestra «No pudimos conectar la llamada» y el mensaje del backend: faltan confirmación del plan Free Tier y aprobación expresa del tratamiento de datos de ese nivel. El endpoint devuelve `GEMINI_FREE_TIER_NOT_CONFIRMED`; no se envió audio ni texto al proveedor. No es un error de permisos del micrófono y no se debe eludir la puerta de coste/privacidad.
- Mantener el error visible y permitir reintentar o volver para cambiar el tema. No convertir una conexión bloqueada en una falsa clase ni abrir un fallback de pago.

### Implementación en `feat/founder-intro`
- Nuevo `lib/ai/orby-class-start.ts`: normaliza el tema del alumno (160 caracteres, controles eliminados) y construye el primer turno oral para pedir que Orby escriba el título en la pizarra y explique el primer concepto paso a paso.
- `components/aprender/LessonAITutor.tsx`: pantalla inicial con campo obligatorio «¿Qué tema quieres estudiar?», botón «Comenzar clase» y sugerencias que rellenan el campo (no envían preguntas al chat).
- Al comenzar, se limpia la conversación anterior, el tema se fija en un ref de sesión y se utiliza en creación/recuperación de conversación, emisión y reconexión del token Live, contexto pedagógico, persistencia y cabecera de la clase.
- Tras establecerse Live, se envía el primer turno con el tema para iniciar la narración y la primera pizarra. Si Live falla, no se envía el turno y se mantiene la pantalla con el motivo, reintento y opción «Cambiar tema».
- Al abrir una conversación guardada se restaura el tema asociado.
- Se añadieron pruebas para normalización, construcción del prompt y contrato del flujo tema-primero.
- No se modificó la puerta de Gemini Free Tier / privacidad.

### Banco de imágenes: hipótesis y realidad del repositorio
- No afirmamos que Studdy tenga un banco interno. La opción «Copiar imagen» solo sugiere un recurso de imagen separado.
- PeakScore ya tiene generación de imágenes con Cloudflare Workers AI, modelo `@cf/black-forest-labs/flux-1-schnell`, con hasta 3 solicitudes diarias por usuario en el endpoint `app/api/orby/generate-image/route.ts`. Actualmente la imagen aparece como apoyo dentro del chat; todavía no forma parte de una escena persistente de `OrbyBoard`.
- La dirección prevista es un catálogo de assets propios por materia/concepto (asset reusable + procedencia/licencia + alt text + caché) combinado con los renderizadores tipados para texto, títulos, fórmulas, etiquetas, flechas y escritura. Los assets deben ser seleccionados por ID aprobado, no por URL arbitraria generada por el modelo.
- La generación FLUX ya existente se mantendrá como apoyo ocasional y sujeta a la puerta de coste/cuota. No se introduce un nuevo proveedor ni una API adicional en esta entrega.
- No convertir texto crítico (fórmulas, valores, nombres de órganos, bases nitrogenadas, etiquetas) en imagen generativa; mantenerlo en DOM/SVG verificable.

### Próxima secuencia
1. Confirmar env vars de Gemini Free Tier y aprobación de datos con el responsable; no activarlas por inferencia. El flujo visual puede probarse, pero el inicio real de Live seguirá bloqueado hasta esa confirmación.
2. Validar en Chrome el tema-primero, permisos, conexión, envío del primer turno, primera pizarra, interrupción y reintento/cambio de tema.
3. Crear especificación y migración local (sin aplicarla en remoto) para el catálogo reutilizable de assets visuales, incluyendo storage privado, licencias, alt text, caché y referencias por ID.
4. Añadir un renderer de asset independiente a la pizarra y probarlo con 3 imágenes originales/abiertas (célula, mitosis, molécula), manteniendo texto y escritura vectorial separados.
5. CI validado en HEAD `bbb596cc24a88bbfdb7b2dbff594db91929c44c4`: GitHub Actions run `42644545760` terminó con éxito; 277/277 pruebas Orby, TypeScript, ESLint y build de producción Next.js aprobados.

### Límites preservados
- No se creó cuenta ni clave nueva, no se alteraron secrets, billing, proveedores, flags ni cuotas.
- No se desplegó, no se cambió `main`, no se fusionó ninguna rama y no se aplicaron migraciones remotas.
- La inspección de Studdy se limita a videos aportados y fuentes públicas; no se inspeccionaron APIs privadas, bundles, tokens ni assets protegidos.


### Validación final de la corrección — 2026-11-09
- HEAD: `bbb596cc24a88bbfdb7b2dbff594db91929c44c4` — `fix(orby): preserve existing voice reset invariant`.
- GitHub Actions run `42644545760`: **success**.
- Regresiones Orby: 277 aprobadas, 0 fallidas.
- TypeScript: aprobado.
- ESLint: aprobado.
- Next.js production build: aprobado.
- El test fallido inicial protegía el orden de resets previo; se movió el reset del tema sin alterar el orden de refs de voz. El conjunto completo volvió a pasar.
- Este CI no valida todavía permisos de micrófono/voz real en Chrome ni el consentimiento/configuración de Gemini Free Tier; esas comprobaciones son manuales y siguen bloqueadas por las puertas explícitas de privacidad/coste.

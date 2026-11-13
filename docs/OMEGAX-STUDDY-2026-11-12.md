# Especificación de experiencia Studdy para OmegaX
**Fecha:** 12 de noviembre de 2026  
**Proyecto:** PeakScore  
**Rama:** `feat/founder-intro`

> **Principio rector:** OmegaX no es un chatbot con una pizarra al lado. Debe sentirse como un profesor que dirige una clase visual de principio a fin, mantiene el hilo pedagógico, escribe y dibuja en el tablero e invita al estudiante a participar.

## 1. Flujo de entrada
1. El estudiante entra a la página principal de estudio.
2. Elige el modo Tema, Preparación para exámenes o Tarea y escribe qué quiere aprender.
3. Puede iniciar con el botón o con Enter. Shift+Enter conserva la posibilidad de escribir varias líneas.
4. Al pulsar Inicio, **la misma home permanece visible**. No se navega a otra página, no se muestra una pantalla de carga independiente y no se cubre el formulario con un overlay a pantalla completa.
5. El botón azul Inicio cambia de estado dentro del mismo formulario: mantiene su posición y forma, sustituye el texto por un spinner y desactiva envíos duplicados. En la zona inferior izquierda del compositor aparece “Preparando tu lección…”, como en la referencia de Studdy.
6. El tema escrito, la modalidad, el área opcional, la fotografía adjunta y la URL de referencia se conservan durante la preparación. El estudiante sigue viendo el fondo y la composición de la home.
7. La home se mantiene hasta que el handshake real `setupComplete` de Gemini Live confirma que la sesión está lista. Solo entonces se oculta el lanzador y se monta el tablero/aula; una pausa mínima puede evitar un cambio imperceptible en conexiones muy rápidas.
8. Si la preparación falla, se detiene el spinner, se conserva el tema y los materiales en la home, se muestra un error accionable y se permite reintentar. Nunca se deja al estudiante en un aula sin sesión.
9. No se muestran mensajes de infraestructura como “iniciando servidor” o “obteniendo token”. El texto de espera permitido es breve y orientado al estudiante, por ejemplo “Preparando tu lección…”.
10. El inicio no activa ni solicita el micrófono. La captura de voz continúa siendo una acción explícita dentro del aula.

## 2. Apertura de la clase
1. La clase abre en un tablero visual, nunca en una conversación de chat.
2. El título se escribe progresivamente con animación manuscrita.
3. Un lápiz animado acompaña el trazo; no usar el emoji genérico ✏️.
4. El título queda resaltado en amarillo como en la referencia.
5. OmegaX presenta brevemente el objetivo y los contenidos de la clase.

## 3. Enseñanza visual
La explicación debe variar según el tema, no usar siempre una plantilla:
- A veces comienza con un dibujo y una narración que desarrolla la idea como una historia.
- Otras veces comienza narrando y escribiendo puntos clave, para después dibujar, diagramar o dar ejemplos.
- Puede señalar, subrayar, conectar, encerrar y resaltar palabras o conceptos importantes con trazos animados. El usuario solicita círculos azules para enfatizar conceptos.
- Los textos, subtítulos, dibujos y trazos aparecen progresivamente y sincronizados con la explicación.
- El tablero conserva lo ya explicado; no sustituirlo continuamente por una diapositiva nueva.

## 4. Interacción pedagógica
- OmegaX hace preguntas al estudiante durante la clase y fomenta su participación sin volver la sesión un interrogatorio.
- Mantiene el hilo de la explicación, recuerda la pregunta que hizo y la respuesta del estudiante.
- Después de una intervención, retoma exactamente el punto pedagógico correcto, sin reiniciar ni repetir innecesariamente.
- Evita monotonía alternando narración, puntos clave, dibujos, ejemplos y preguntas.

## 5. Chat lateral
- El control de chat se encuentra a la derecha y tiene una animación premium.
- Al pulsarlo abre una burbuja/panel flotante integrado con el tablero.
- Enter envía el mensaje; no obliga a pulsar el botón.
- Si está vacío y el usuario hace clic fuera, se cierra.
- No perder texto escrito por cerrar accidentalmente ni perder el contexto de la clase.
- El chat es una vía alternativa de intervención, no debe convertir el aula en una interfaz convencional de mensajería.

## 6. Pausa y reanudación
- Hay un botón de pausa visible.
- Pausar congela el avance de la explicación y las animaciones de clase que correspondan.
- Reanudar continúa exactamente desde el mismo punto, conservando tablero, estado y contexto. No reiniciar ni saltar pasos.

## 7. Audio y micrófono
- Incluir control de volumen/silencio durante la clase.
- El micrófono es opcional y nunca se activa automáticamente.
- No pedir permiso de micrófono al entrar. Solicitarlo solo después de que el estudiante pulse explícitamente el control de voz.
- Si el estudiante utiliza solo el chat, no pedir permiso durante la clase.
- Si el permiso se deniega, el chat debe seguir disponible y la clase no debe bloquearse.

## 8. Salida de clase
- El botón de salir está en la parte superior.
- Al pulsarlo aparece una confirmación visual integrada con la pregunta de si está seguro.
- Cancelar vuelve a la misma clase sin perder estado; confirmar termina la sesión de forma controlada.

## 9. Herramientas laterales que deben conservarse
- Flashcards.
- English Studio / herramientas de inglés.
- Escáner desde la cámara del teléfono para fotografiar una página, ejercicio o material y pedir a OmegaX que lo analice y explique dentro del contexto de la clase.
- Apuntes, recursos, cuestionarios y otras herramientas existentes que se validen en la auditoría.
- No dejar botones decorativos: cada herramienta debe abrir y completar su función.

## 10. Integración global
OmegaX debe estar disponible en las páginas internas de PeakScore con contexto de la página actual. Excluir:
- landing / página pública;
- login;
- registro;
- simulacros.

Evitar instancias duplicadas, superposición de launchers y sistemas paralelos.

## 11. Fidelidad visual a Studdy
Los videos compartidos el 12/11/2026 son la referencia visual y de comportamiento. Comparar directamente:
- composición, proporciones y fondo del tablero;
- paleta, tipografía, contraste y controles;
- título manuscrito, resaltado amarillo y lápiz animado;
- escritura progresiva, subtítulos y teoría;
- dibujos, diagramas, flechas y círculos de énfasis;
- ritmo, transiciones y microinteracciones;
- chat flotante y animación de apertura/cierre;
- pausa, volumen, micrófono y confirmación de salida;
- estados de carga, error y reanudación.

No sustituir rasgos de Studdy por emojis genéricos, tarjetas de chatbot o controles improvisados. El objetivo es reproducir con la mayor fidelidad posible la experiencia mostrada, no crear una interpretación libre.

## 12. Archivos de referencia localizados
Repositorio: `PeakScore777/PeakScore`; rama: `feat/founder-intro`.

- `components/aprender/LessonAITutor.tsx`: orquestación de clase y herramientas.
- `components/aprender/OrbyBoard.tsx`: tablero y trazos visuales.
- `components/aprender/OrbyBoardTitle.tsx`: título manuscrito y lápiz.
- `components/aprender/OrbyWorkspacePage.tsx`: montaje del espacio dedicado.
- `components/aprender/OmegaXStudyHome.tsx`: home alternativo; verificar uso antes de tocarlo.
- `components/layout/GlobalOrbyClassroomLauncher.tsx`: launcher global.
- `app/orby/page.tsx`: ruta dedicada y autenticación.
- `app/layout.tsx`: montaje global.
- `app/dashboard/layout.tsx`: protección del área privada.

Estos son puntos de auditoría, no una lista de archivos que deban reemplazarse todos. Verificar dependencias y usos antes de modificar.

## 13. Restricciones y criterios de aceptación
- No introducir proveedores, modelos, APIs ni fallbacks que puedan generar cargos. Respetar el uso exclusivo de servicios gratuitos; si se agota una cuota gratuita, informar o pausar de forma segura.
- No pedir permiso de micrófono sin acción explícita.
- No eliminar las herramientas existentes ni modificar las rutas excluidas.
- Probar el flujo completo, no solo que compile.
- Comparar visualmente cada etapa con los videos de referencia.

Checklist:
- [ ] Tema se envía con botón o Enter.
- [ ] Carga inmersiva sin texto técnico visible.
- [ ] Entrada a tablero, título manuscrito, lápiz animado y resaltado amarillo.
- [ ] Introducción del objetivo de clase.
- [ ] Explicación alterna narración, puntos clave, dibujos y ejemplos.
- [ ] Énfasis visual animado y preguntas al estudiante.
- [ ] Continuidad pedagógica tras las respuestas.
- [ ] Chat lateral premium, Enter para enviar y cierre exterior cuando está vacío.
- [ ] Pausa/reanudación exacta.
- [ ] Volumen funcional y micrófono solo con consentimiento explícito.
- [ ] Salida con confirmación.
- [ ] Flashcards, inglés y escáner accesibles y funcionales.
- [ ] OmegaX global salvo landing, login, registro y simulacros.
- [ ] Sin servicios ni fallbacks de pago.
- [ ] Validación visual contra los videos.

## 14. Método de implementación
1. Auditar el flujo real y las dependencias en `feat/founder-intro`.
2. Comparar home, carga, tablero, animaciones, chat, controles, herramientas y launcher con los videos.
3. Separar lo reutilizable de la lógica heredada que contradiga el objetivo.
4. Implementar cambios pequeños, coherentes y verificables; no reescrituras masivas a ciegas.
5. Probar funcionalidad, accesibilidad, continuidad y apariencia en el navegador.
6. No declarar terminado un cambio solo porque compila.

**Prioridad:** fidelidad a Studdy, continuidad de la clase y conservación de las herramientas de PeakScore.


## 15. Hallazgos de la comparación inicial (12/11/2026)

- Los videos muestran un tablero blanco muy despejado, controles compactos en los bordes, título manuscrito con resaltado amarillo, dibujos progresivos y subtítulos discretos en la zona inferior.
- En el video compartido, el énfasis ovalado alrededor de la palabra clave se ve **rojo**, mientras que la descripción escrita del usuario pide un círculo **azul**. No unificar ese color hasta confirmar cuál referencia prevalece.
- En el video compartido, el panel de conversación se despliega desde el **lado izquierdo** y el acceso se ve en la zona inferior izquierda; la descripción escrita habla de un botón de chat a la **derecha**. Confirmar antes de moverlo.
- El código actual ya contiene una animación de título con lápiz SVG propio en `OrbyBoardTitle.tsx`, tablero con dibujo progresivo en `OrbyBoard.tsx`, y controles de pausa/volumen/micrófono en `LessonAITutor.tsx`. Se deben auditar y perfeccionar, no reemplazar sin necesidad.
- El inicio de clase actual configura primero el aula y solicita la captura del micrófono solo desde acciones explícitas de micrófono/grabación. Mantener este comportamiento y probarlo en navegador.
- La pausa actual suspende el `AudioContext` y detiene los trazos del tablero; todavía debe verificarse que también congele las respuestas y actualizaciones entrantes del motor de clase, y que al reanudar continúe exactamente desde el mismo estado.
- La integración global ya se monta desde `app/layout.tsx` mediante `GlobalOrbyClassroomLauncher`, con exclusiones de landing, autenticación y simulacros. Revisar el comportamiento real por ruta antes de añadir otro launcher.

Estos hallazgos son una auditoría inicial, no criterios de cierre. La validación final debe hacerse en navegador comparando el resultado con los videos.


## 16. Correcciones obligatorias tras revisar la grabación real de OmegaX (12/11/2026)

**Evidencia revisada:** captura de referencia del lápiz de Studdy enviada por el usuario y grabación de pantalla de OmegaX de 26,4 segundos (30 fps), compartidas el 12/11/2026. Esta sección registra defectos observados en la implementación actual; no son preferencias opcionales.

### 16.1 Título y lápiz: reproducir la referencia exacta
La captura de Studdy muestra el título manuscrito negro, con trazo fluido y natural. El lápiz es un **objeto gráfico negro delineado**, inclinado y colocado al final del texto como si estuviera escribiendo la última letra. Tiene cuerpo y punta reconocibles, con un pequeño detalle interior; no es un emoji ni un icono genérico separado.

Corregir:
- El título debe escribirse letra a letra con una animación manuscrita fluida, legible y pausada.
- La velocidad actual es demasiado rápida: ralentizarla sustancialmente para que el estudiante perciba cómo se escribe el título. Sin saltos, apariciones instantáneas ni aceleraciones bruscas.
- El lápiz debe desplazarse junto al extremo del trazo, acompañando la escritura y terminando en la posición final del título.
- Dibujar el lápiz como SVG/vector propio o animación equivalente de alta calidad, con proporciones, inclinación, contorno negro y punta semejantes a la imagen de referencia. Prohibido usar `✏️`, un emoji, o un icono Lucide como sustituto.
- Mantener el resaltado amarillo característico del título, sin tapar el trazo manuscrito.
- Ajustar la animación a la longitud del título y a una duración mínima legible; el título no debe terminar en una fracción de segundo.
- Evitar que el lápiz se superponga incorrectamente, quede flotando o aparezca antes/después de la escritura.

### 16.2 Distribución del tablero: teoría y visuales deben formar una sola clase
En la grabación actual, el texto teórico aparece arrinconado y cortado en el extremo izquierdo, mientras aparece un rótulo separado «Nueva explicación: cuerpo.» en el lado derecho. El tablero queda casi vacío y la teoría no se integra con imágenes o dibujos explicativos.

Corregir:
- Eliminar la distribución rota en la que la teoría queda aislada a un lado y un rótulo o contenido inconexo aparece al otro.
- No mostrar «Nueva explicación», «Nueva explicación: cuerpo» ni etiquetas internas de planificación/segmentación al estudiante. Son metadatos de generación, no contenido pedagógico.
- Organizar el tablero como una composición didáctica coherente: título arriba; explicación, puntos clave, dibujo/diagrama y ejemplos colocados juntos y relacionados; espacio en blanco intencional, no vacío accidental.
- El texto debe ocupar un ancho legible, respetar márgenes y saltos de línea y no quedar cortado por contenedores, columnas o límites del canvas.
- Cuando la explicación requiera un dibujo, imagen, esquema, secuencia o analogía visual, incorporarlo al tablero y conectarlo con el texto mediante trazos, flechas, círculos y anotaciones.
- Las imágenes y diagramas no deben ser decoraciones sin relación: deben explicar el concepto que OmegaX está narrando en ese momento.
- La composición debe adaptarse a escritorio y móvil sin perder legibilidad ni desplazar la teoría fuera del área útil.

### 16.3 Subtítulos: rediseñar, no maquillar
En la grabación, los subtítulos aparecen como una cápsula blanca genérica centrada en la parte inferior, separada de la explicación y visualmente ajena a Studdy. Además, no transmiten el ritmo de una clase narrada.

Corregir:
- Rehacer su presentación para acercarla al estilo de subtítulos de Studdy que aparece en los videos de referencia: discretos, limpios, integrados en el escenario y con jerarquía tipográfica cuidada.
- Sin cápsula de chat genérica, borde/sombra de tarjeta innecesarios ni apariencia de mensaje enviado.
- Sin competir con el tablero, dibujos, teoría o controles.
- Sin recortar palabras, mostrar fragmentos aislados o saltar de forma brusca entre segmentos.
- Sincronizar el texto con el audio y la explicación. Mantener una línea o bloque breve y legible, con actualización suave y ritmo natural.
- Diferenciar visualmente los subtítulos de la clase de los mensajes del chat lateral.
- Comprobar la presentación en resoluciones de escritorio y móvil.

### 16.4 Calidad ortográfica y redacción de la clase
El usuario reporta errores ortográficos y de redacción en las explicaciones. La grabación muestra texto que se revela progresivamente, pero debe validarse la oración completa, no solo el fragmento visible en cada instante.

Corregir:
- Todo texto visible debe estar en español natural, con tildes, puntuación, concordancia y terminología científica correctas.
- Validar cada bloque completo antes de animar su escritura; no iniciar el trazo de una frase incompleta o mal formada.
- Evitar palabras cortadas por el ancho del tablero, líneas truncadas, duplicaciones, fragmentos fuera de orden y frases que terminan sin completar la idea.
- Mantener vocabulario adecuado al nivel Saber 11, explicando términos técnicos cuando aparezcan.
- Implementar una revisión de calidad de salida antes de presentar el contenido. No alterar el rigor científico ni inventar correcciones cuando exista ambigüedad: reformular con claridad o pedir contexto.
- Probar la revisión con temas reales y respuestas largas, no solo con el ejemplo de mitosis.

### 16.5 «Nueva explicación» no debe aparecer como contenido de la clase
En la grabación, a partir de aproximadamente el segundo 12 aparece en el lado derecho el texto «Nueva explicación: cuerpo.» y permanece visible durante el resto del clip. Rompe la inmersión y parece una etiqueta de depuración o un cambio interno de segmento.

Corregir:
- Rastrear el origen de ese texto en el modelo de datos del tablero, el prompt, el renderer y/o el estado de secciones.
- No renderizar etiquetas internas como «Nueva explicación», «nuevo bloque», «cuerpo», nombres de sección, identificadores de acción o instrucciones del generador.
- Si hay una transición pedagógica real, expresarla con una frase natural del profesor y continuidad narrativa, no con una etiqueta técnica.
- El cambio de una parte de la explicación a otra no debe borrar, reiniciar ni desorganizar lo ya escrito.

### 16.6 La explicación no puede ser una definición corta sin enseñanza
En la grabación del tema «mitosis», OmegaX se limita a presentar una definición breve. No desarrolla el proceso, no construye un esquema de fases, no usa imágenes explicativas y no plantea una pregunta significativa al estudiante. Eso no satisface la experiencia solicitada.

Corregir:
- Tratar el tema como una clase guiada, no como una consulta de definición.
- Desarrollar la idea paso a paso: contexto, explicación intuitiva, conceptos clave, proceso o mecanismo, representación visual, ejemplo y comprobación de comprensión, según corresponda al tema.
- Para mitosis, por ejemplo, explicar por qué se divide la célula, qué se duplica antes, qué ocurre durante las fases y cómo se obtienen dos células hijas; representar visualmente el proceso de forma secuencial. No limitarse a una oración definitoria.
- Introducir preguntas breves y oportunas al estudiante durante la explicación, esperar su respuesta y usarla para decidir cómo continuar.
- Si el estudiante responde mal, orientar con pistas y razonamiento; no dar simplemente la respuesta y seguir como si nada.
- Si responde bien, reconocerlo y profundizar o avanzar. No hacer preguntas artificiales sin relación con el hilo.
- Conservar la continuidad de la clase y el estado del tablero al interactuar.
- La duración y profundidad deben corresponder al tema solicitado; no convertir cada tema en una respuesta de dos frases ni alargar con relleno.

### 16.7 Criterios de aceptación específicos de esta revisión
- [ ] Título manuscrito a velocidad legible, con lápiz vectorial negro que sigue la punta del trazo; cero emojis.
- [ ] Resaltado amarillo integrado sin ocultar el texto.
- [ ] Teoría completa, bien distribuida, sin recortes y relacionada con el dibujo/diagrama.
- [ ] Ninguna etiqueta «Nueva explicación» ni metadato interno visible.
- [ ] Subtítulos rediseñados según Studdy, no cápsulas genéricas de chat.
- [ ] Ortografía, gramática, puntuación y continuidad revisadas antes de mostrar texto.
- [ ] Explicación sustantiva y visual, no una definición aislada.
- [ ] Interacción real: pregunta pertinente, espera respuesta, adapta la explicación y retoma el hilo.
- [ ] El ejemplo de mitosis incluye representación secuencial del proceso y comprensión guiada.
- [ ] Comparación visual grabada lado a lado con Studdy, incluyendo título, lápiz, tablero, teoría, dibujos y subtítulos.



## 17. Correcciones obligatorias tras la captura de la página inicial (12/11/2026)

**Evidencia revisada:** captura de pantalla de la página de entrada de OmegaX enviada el 12/11/2026. Estos defectos se suman a los registrados en la sección 16 y deben resolverse antes de considerar fiel la experiencia.

### 17.1 Rediseñar la página principal de OmegaX para igualar Studdy
La página actual muestra un fondo degradado celeste/rosado, el encabezado centrado «¿Qué quieres aprender hoy?», tres botones de intención, un textarea grande, selector de área, una casilla de consentimiento de Gemini Live y un botón ancho «Comenzar». El usuario indica expresamente que este diseño no corresponde a la referencia de Studdy.

Corregir:
- Rediseñar la página inicial completa tomando los videos de Studdy compartidos en esta conversación como referencia visual principal. No limitarse a cambiar colores, bordes o textos: reproducir estructura, proporciones, alineación, jerarquía, tipografía, espacios, controles, estados y microanimaciones.
- Revisar fotograma por fotograma la pantalla de inicio de Studdy en los videos ya compartidos; no inventar un nuevo layout basándose solo en la captura actual.
- Mantener la acción central sencilla: el estudiante escribe el tema y comienza con el botón o Enter.
- La selección de tema/modo y área debe presentarse exactamente con la jerarquía y tratamiento visual de la referencia; no añadir tarjetas o selectores que Studdy no utiliza.
- El estado de carga posterior al envío debe ser inmersivo y visual, sin textos técnicos de backend o proveedor.
- No considerar terminado el rediseño por conseguir una pantalla “bonita”: debe compararse lado a lado con Studdy y corregirse hasta igualar su composición y comportamiento.

### 17.2 Eliminar la casilla de consentimiento de prueba de Gemini Live
La captura muestra una casilla obligatoria con el texto: «La clase usa Gemini Live para procesar audio y texto. Acepto este tratamiento y entiendo que, si no hay cuota gratuita, no se usará un servicio de pago». El usuario aclara que Gemini se está usando actualmente como prueba de desarrollo mediante una API gratuita para construir y validar el producto, no como flujo de consentimiento de un producto ya lanzado a producción.

Corregir:
- Eliminar de la página de inicio esa casilla, su texto y cualquier validación que obligue a marcarla para comenzar una clase.
- El inicio de clase no debe depender de `voiceFreeTierConsentChecked` ni de una aceptación visual por sesión una vez retirada esa casilla.
- Limpiar el estado, referencias y mensajes de interfaz que existan exclusivamente para esa casilla, sin eliminar por accidente los controles reales de micrófono ni el control de costes del servidor.
- No sustituirla por otra casilla, modal o aviso equivalente que vuelva a interrumpir el inicio de la clase.
- La gestión de claves, cuotas y límites de la API gratuita corresponde a la configuración interna de desarrollo/servidor, no a una casilla artificial que el estudiante tenga que aceptar en cada sesión.
- Mantener la restricción de no introducir servicios de pago ni fallbacks facturables. Si la cuota gratuita de desarrollo se agota, gestionar el error internamente y mostrar un estado de fallo comprensible, sin cambiar a un proveedor de pago.

**Distinción importante:** quitar la casilla de consentimiento de prueba de Gemini Live no significa activar el micrófono sin permiso. El navegador solo debe solicitar acceso al micrófono después de que el estudiante pulse explícitamente el control para hablar. Si utiliza el chat escrito, no solicitar permiso de micrófono.

### 17.3 Gemini Live debe ser el motor de la clase
El usuario especifica que la experiencia de clase debe utilizar **Gemini Live**. No sustituirlo silenciosamente por un chat convencional, una respuesta de texto aislada, voz por turnos o un proveedor alternativo.

Corregir y verificar:
- La sesión de clase se debe iniciar y mantener con Gemini Live como motor conversacional/voz en tiempo real durante esta etapa de desarrollo.
- La generación de la explicación, las intervenciones del profesor, las preguntas al estudiante y la continuidad de la conversación deben pertenecer a la misma sesión de clase.
- El tablero debe recibir acciones/contenido pedagógico estructurado y mostrarlo de forma visual, sincronizado con la narración de Gemini Live.
- El chat escrito debe integrarse en el contexto de esa misma clase, no iniciar un tutor paralelo que pierda el hilo.
- No confundir “usar Gemini Live” con simplemente reproducir audio mientras un chatbot independiente escribe en el tablero: la clase debe mantener estado, contexto y coordinación entre voz, conversación y pizarra.
- No cambiar a un servicio de pago cuando se agote la cuota gratuita. Durante desarrollo, informar el fallo de cuota y permitir reintentar cuando haya disponibilidad.

### 17.4 El tablero tiene que dibujar y mostrar contenido real
El usuario informa que OmegaX tampoco está dibujando el tablero. Un tablero que solo muestra un título, texto parcial, subtítulos o una superficie blanca vacía no es la experiencia solicitada.

Corregir:
- Investigar por qué la clase puede iniciar sin que se representen acciones visuales en `OrbyBoard`.
- Confirmar el contrato de datos entre Gemini Live, las herramientas de pizarra, el estado de la clase y el componente `OrbyBoard`.
- La clase debe producir y renderizar contenido de pizarra real: trazos, dibujos, esquemas, diagramas, flechas, círculos, etiquetas, relaciones y pasos secuenciales cuando el tema lo requiera.
- No depender de que el modelo emita espontáneamente una estructura visual opcional. La planificación pedagógica de la clase debe decidir qué elementos visuales hacen falta y garantizar que se representen.
- Si una acción de dibujo llega incompleta o inválida, validarla y recuperarla; no dejar la pizarra vacía ni presentar una falsa sensación de clase terminada.
- El contenido del tablero debe corresponder al fragmento que Gemini Live está explicando en ese momento.
- La pizarra debe conservar lo ya dibujado y actualizarse incrementalmente, sin borrar el contenido previo por cada intervención.
- Incluir pruebas con temas que necesariamente requieran diagramas. Mitosis debe dibujar una secuencia de división celular con sus etapas y dos células hijas; no basta con escribir una definición.
- Verificar que el resultado funcione en escritorio y móvil y que no haya recortes, escalas erróneas ni contenido fuera del canvas.

### 17.5 Criterios de aceptación de esta sección
- [ ] La página inicial ha sido rediseñada y comparada lado a lado con Studdy; no conserva el layout actual por simple retoque.
- [ ] El estudiante puede escribir un tema y comenzar con Enter o el botón, sin marcar ninguna casilla de consentimiento de prueba.
- [ ] Se eliminaron el checkbox, su texto y su bloqueo del inicio; se conservaron los controles internos de coste/cuota.
- [ ] Gemini Live es el motor real de la clase durante el desarrollo; no se sustituye por chat independiente ni por otro proveedor.
- [ ] El micrófono solo solicita permiso después de una acción explícita del estudiante.
- [ ] El tablero dibuja y muestra esquemas/diagramas reales sincronizados con la explicación.
- [ ] Mitosis genera un dibujo secuencial legible de las fases y el resultado, además de la explicación oral y preguntas.
- [ ] La pizarra conserva el estado y no queda vacía cuando el modelo omite una acción visual.
- [ ] Si se agota la cuota gratuita, se informa el fallo sin recurrir a servicios de pago.


### 17.6 Estado de implementación registrado el 12/11/2026
- Se retiró del flujo de inicio de `LessonAITutor.tsx` la casilla de consentimiento de desarrollo, el texto de aviso asociado, la validación que bloqueaba el botón y el estado persistido en `sessionStorage`. Commit: `99ef026356ff8c4626326be3a5ace7dd181f4111`.
- El flujo `beginWorkspaceClass()` ya inicia la clase llamando a `toggleVoiceMode(true, false, false)`: se solicita el inicio de Gemini Live con aceptación interna del flujo de desarrollo y sin capturar el micrófono al entrar. La captura de micrófono debe continuar condicionada a la acción explícita del estudiante.
- Este commit solo elimina el consentimiento de prueba de la interfaz y su bloqueo; **no** rediseña todavía la home para igualarla a Studdy, ni corrige por sí mismo el renderer del tablero, el título, los subtítulos o la pedagogía. Esas tareas siguen pendientes y deben validarse visualmente.

## 18. Ajustes técnicos del aula OmegaX — 13/11/2026

### 18.1 Secuencia manuscrita del título
- Se ajustó `OrbyBoardTitle` para que la escritura no termine en uno o dos segundos: la duración objetivo es de 360 ms por carácter, con mínimo de 3,6 s y máximo de 9 s.
- Se conserva el dibujo SVG del lápiz siguiendo el avance de los caracteres y las pausas adicionales después de signos de puntuación.
- El resaltado amarillo comienza cuando termina la escritura y dura 1,1 s. El título conserva el resaltado al completar la animación.
- Commit: `b1d055eca59c68a24d8e36815e121a98fea29b63`.

### 18.2 Subtítulos sobre la pizarra
- Se retiró la caja negra del estilo local de `LessonAITutor.tsx` y se dejó el texto centrado, sin fondo, borde, relleno ni sombra de tarjeta.
- Se corrigió también la regla clara que volvía a pintar el contenedor de subtítulos con fondo blanco.
- `app/globals.css` conserva el override responsive para escritorio y móvil, con el texto integrado sobre la pizarra.
- Commits: `62a39cba2f65f95cc76fcda502b8a3892196a83f` y `0e7e18e3681a562e0d1148ef8039b95ee5f09f8d`.

### 18.3 Escaneo con cámara en vivo
- El botón de escaneo abre un visor con vista previa y solicita `getUserMedia` únicamente después del clic explícito del estudiante.
- Se prioriza la cámara trasera mediante `facingMode: environment`, con dimensiones limitadas para evitar imágenes excesivamente pesadas.
- La captura se convierte a JPEG mediante canvas, limita la dimensión mayor a 2200 px y aplica compresión antes de pasar por el flujo existente `handleAttachment` / `prepareTutorImage`.
- Al cerrar el modal o escoger una imagen alternativa, se detienen las pistas de la cámara y se libera la vista previa.
- Si el navegador no soporta cámara, no existe dispositivo o el permiso es denegado, el usuario puede seleccionar una foto desde el equipo. Se conserva el input de archivo con `capture="environment"` como compatibilidad móvil.
- Se eliminó el input duplicado que compartía el mismo ref de cámara.
- Commits: `0e7e18e3681a562e0d1148ef8039b95ee5f09f8d` y `88e19c7055283481e7e5ebd0334c2f4aa0a64fe2`.

### 18.4 Pruebas y verificación
- Se actualizaron las aserciones para validar subtítulos sin tarjeta oscura, duración de escritura/resaltado y captura con cámara, liberación de pistas y selector alternativo.
- Commits de pruebas: `ba11d3637a18ff792568362ff5c536c44983d6e9` y `0b4535ceed8ccd1b3313af9764189c6d2a3cdaa9`.
- **No se ha podido ejecutar localmente** `npm run test:orby`, ESLint ni `next build` desde esta sesión.
- La comprobación automática de Vercel en el último commit devolvió `build-rate-limit` (límite de builds). Ese resultado no equivale a un error de compilación y tampoco confirma que el build haya pasado.
- No se ha desplegado ni promovido a producción. Todos los cambios de este registro están en `feat/founder-intro`; no se ha modificado `main`.

### 18.5 Pendientes que siguen abiertos
- Comparar visualmente el ritmo de escritura, el trazo del lápiz, el resaltado y los subtítulos contra los vídeos de referencia; los tiempos ahora están ajustados en código, pero requieren validación visual en navegador.
- Validar visualmente en navegador la nueva secuencia de mitosis en dos filas (commits `8249d5aa3874e1afcab38d80354d669e8fe93d53`, `31deeda09ccec74f7b83b5ad3025b8ab2260c757` y `acdfabb8b17ae96a01f5b04e0871045afda51504`); la prueba estática se actualizó en `c3d6227fdde7cbdfdde2f51c6d87ba0a41fe9b74`.
- Corregir y probar el layout espacial de los bloques y dibujos en la pizarra; la función de compatibilidad actual no realiza reflow ni evita solapamientos.
- Ejecutar la batería real de pruebas, lint y build cuando el entorno de CI/build permita hacerlo, corregir cualquier fallo y comprobar escritorio y móvil.
- Confirmar en una sesión real que la foto capturada llega a Gemini Live y que OmegaX analiza el material dentro del contexto de la clase, sin abrir un tutor paralelo.

### 18.6 Mitosis: secuencia visual ampliada
- Se reemplazó el diagrama horizontal comprimido de 420×180 por una composición en dos filas con cuatro etapas conectadas en orden.
- Cada etapa dispone de un SVG de 180×112, nombre, número, dibujo y explicación completa, sin recortar el detalle a 48 caracteres.
- El diseño usa conectores horizontales en escritorio y flechas verticales en móvil; la transición entre filas también queda marcada.
- Profase muestra cromosomas condensándose, metafase su alineación ecuatorial, anafase la separación de cromátidas hacia polos opuestos y telofase/citocinesis dos células hijas con cromosomas ya separados.
- Los diagramas se etiquetan con texto accesible y el resultado final explica que las células hijas conservan la misma información genética.
- La secuencia usa las fases ya validadas por `sanitizeOrbyBoard`; no inventa ni completa etapas que no hayan llegado en el snapshot.
- Commits: `8249d5aa3874e1afcab38d80354d669e8fe93d53`, `31deeda09ccec74f7b83b5ad3025b8ab2260c757` y `acdfabb8b17ae96a01f5b04e0871045afda51504`. Prueba asociada: `c3d6227fdde7cbdfdde2f51c6d87ba0a41fe9b74`.


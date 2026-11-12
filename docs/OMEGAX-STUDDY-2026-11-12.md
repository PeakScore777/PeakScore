# Especificación de experiencia Studdy para OmegaX
**Fecha:** 12 de noviembre de 2026  
**Proyecto:** PeakScore  
**Rama:** `feat/founder-intro`

> **Principio rector:** OmegaX no es un chatbot con una pizarra al lado. Debe sentirse como un profesor que dirige una clase visual de principio a fin, mantiene el hilo pedagógico, escribe y dibuja en el tablero e invita al estudiante a participar.

## 1. Flujo de entrada
1. El estudiante entra a la página principal de estudio.
2. Elige el modo Tema, Preparación para exámenes o Tarea y escribe qué quiere aprender.
3. Puede iniciar con el botón o con Enter. Shift+Enter conserva la posibilidad de escribir varias líneas.
4. Al enviar, aparece una transición de carga inmersiva, con estética de juego.
5. No se muestran mensajes técnicos como “preparando la clase”, “iniciando servidor” o “conectando con Gemini”. La espera debe ser discreta y visual.
6. Cuando la sesión está lista, se entra directamente al aula.

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


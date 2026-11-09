# OmegaX — dirección de diseño del espacio de estudio

**Fecha:** 2026-11-08  
**Rama:** `feat/founder-intro`  
**Estado:** primera iteración de UX aplicada; QA visual y de voz en navegador pendiente.

## Referencias y criterio

Las capturas de Studdy y Studley se usan como referencias de calidad de producto, no como plantillas para copiar. La dirección adoptada para PeakScore combina:

- La claridad editorial de Studdy: superficie de trabajo limpia, tipografía legible, pizarra protagonista y pocas distracciones.
- La organización de Studley: herramientas separadas, navegación fácil de entender, actividades con un objetivo concreto y biblioteca personal.
- La identidad educativa de PeakScore: superficies blancas y fondos claros para lectura, tarjetas de colores vivos y diferenciados por propósito (verde, celeste, amarillo y coral), acciones fáciles de reconocer e iconografía lineal coherente. La paleta debe dar energía sin perder contraste ni convertir cada bloque en una alerta. No usar morado/azul genérico como tema dominante.

No se copian nombres, marcas, ilustraciones, textos comerciales ni pantallas propietarias.

## Sistema visual

1. **Tipografía:** sans serif del sistema en el espacio de estudio. Las fuentes pixel permanecen en los juegos y escenas que realmente requieren ese lenguaje; no deben dominar el tutor ni los formularios de aprendizaje.
2. **Iconografía:** componentes Lucide de trazo consistente, tamaños y alineación comunes. Evitar emojis ornamentales y símbolos genéricos usados como sustitutos de iconografía.
3. **Color:** base clara y superficies blancas; verde para avance y acción educativa principal, celeste para conversación/escucha, amarillo para práctica/atención y coral para lectura/errores. Los tonos se aplican a tarjetas, iconos y estados de selección con contraste WCAG; no usar un único color para todas las destrezas ni llenar el fondo de gradientes.
4. **Composición:** títulos claros, descripciones breves, tarjetas con bordes discretos y espacio suficiente. Evitar gradientes llamativos sin función, etiquetas técnicas innecesarias y exceso de microtipografía.
5. **Pizarra:** hoja blanca continua, con tinta y bloques pedagógicos incrementales. El dibujo debe acompañar la explicación, no llenar la pantalla de tarjetas decorativas.

## Llamada de voz de OmegaX

La experiencia principal debe ser una llamada bidireccional:

- El estudiante pulsa **Iniciar llamada** y concede permiso al micrófono.
- En Live, el cliente transmite audio de micrófono continuamente por el canal en tiempo real; el modelo devuelve audio y puede escuchar interrupciones.
- La primera explicación debe comenzar con conocimiento fiable sin esperar una búsqueda opcional de material.
- La pizarra se construye mientras el profesor habla.
- El alumno puede silenciar el micrófono, volver al chat, activar subtítulos o salir de la clase.
- Los subtítulos del profesor quedan desactivados al iniciar; se habilitan voluntariamente como apoyo de accesibilidad.
- La transcripción de entrada no se muestra como burbuja, tarea ni paso obligatorio.

### Reconocimiento interno y privacidad

Gemini Live mantiene la transcripción de audio de entrada en el protocolo interno porque la implementación actual la usa para validar el turno, aplicar filtros de seguridad, evitar respuestas fuera de contexto y guardar el historial. Esto no significa que el producto exija transcribir ni que el estudiante tenga que revisar o enviar texto. La interfaz oculta ese texto por defecto y prioriza audio.

La aplicación no debe desactivar filtros de seguridad para ganar velocidad. La salida de audio se reproduce después de que el texto asociado supera las validaciones de idioma, identidad, alcance académico y contenido. Esta barrera puede añadir algo de latencia; no se debe prometer latencia cero.

### Degradación transparente

Si Live no está habilitado, no tiene cuota gratuita disponible o falla, PeakScore no debe fingir que sigue en llamada a tiempo real. El modo por turnos existente puede utilizarse únicamente si su proveedor está habilitado y dentro de cuota, con un aviso claro de que la respuesta puede tardar más. No existe fallback pagado ni cambio silencioso de proveedor.

## English Studio A1–C2

- Speaking y Pronunciation deben abrir una llamada de voz con nivel y tarea seleccionados.
- OmegaX mantiene la conversación en inglés natural, adaptada al CEFR elegido, con feedback breve y una oportunidad de reintento.
- El alumno no debe grabar, esperar una transcripción ni pulsar enviar entre cada respuesta de la llamada.
- Las herramientas de grabación, reconocimiento de texto y revisión se conservan como opción secundaria, cerrada inicialmente.
- Listening, Reading y Writing conservan sus flujos propios: reproducir/escuchar, leer o escribir según corresponda. No convertir esas destrezas en speaking forzado.
- A1–C2 describe la ruta de práctica del MCER, no una certificación oficial ni una calificación Saber 11.
- No atribuir evaluación fonética, acento o entonación a texto reconocido. Dar feedback acústico solo cuando el audio y el modelo realmente permitan observarlo.

## Iteración aplicada en esta rama

- `OmegaXEnglishStudio.tsx`: tarjeta de llamada directa para Speaking/Pronunciation, prompt contextual por nivel y habilidad, grabación/transcripción relegada a una sección opcional.
- `LessonAITutor.tsx`: burbuja visible de transcripción del estudiante retirada; subtítulos de respuesta desactivados por defecto; iconografía semántica en lugar de estrellas/cuadernos genéricos.
- `LessonAITutor.tsx`: tipografía de interfaz del espacio de estudio migrada de pixel-font a sans serif del sistema. Las fuentes de estética pixel siguen disponibles para juegos.
- `tests/orby-request-filter.test.mjs`: regresiones estáticas para la llamada de inglés y el contrato audio-first sin transcripción visible.

## Validación pendiente

- GitHub Actions: tests, TypeScript, ESLint, auditoría y build para el HEAD de esta iteración.
- Chrome real: inicio de llamada, permiso de micrófono, primera frase del tutor, conversación bidireccional y barge-in.
- Comprobar que no se muestran transcripciones del estudiante, que los subtítulos opcionales funcionan y que se puede salir/silenciar sin dejar el micrófono abierto.
- English Studio: verificar Speaking y Pronunciation en A1, B1, B2, C1 y C2; revisar turnos y feedback con audio real.
- Probar cuota agotada / proveedor deshabilitado. El resultado debe ser un aviso y una pausa/degradación explícita, nunca uso facturable.
- No se ha probado con estudiantes.

**Límites de esta entrega:** se ajustó el tutor y English Studio; esto no declara terminado el rediseño de toda la plataforma. No se modificó `main`, no se desplegó, no se tocaron migraciones remotas ni se cambiaron las puertas de coste/privacidad.


## Actualización de implementación — 2026-11-09

### Entrada e historial
- Al entrar al workspace, la lista del historial se carga en el lateral sin abrir el último chat.
- El alumno debe seleccionar manualmente una conversación anterior; si no selecciona una, permanece en la pantalla de selección de tema.
- El botón «Nueva clase» limpia el estado de la conversación previa. El tema queda fijado antes de empezar y pasa al prompt inicial de la clase.
- La sesión Live se valida antes de persistir la conversación, evitando chats vacíos creados por un rechazo del proveedor.

### Aula y audio
- La superficie es una hoja blanca continua y plana, sin panel central de diagnóstico «No pudimos conectar la llamada», estados de proveedor o alertas de privacidad de Gemini como protagonista.
- Live continúa siendo opcional. Cuando no está habilitado, se activa voz por turnos: el alumno pulsa «Hablar», se transcribe el audio, OmegaX responde y el navegador lee la respuesta localmente. Esta modalidad no es dúplex ni admite interrumpir el audio como Live; no debe rotularse como llamada manos libres.
- La voz local elige es-CO o una voz en-* disponible en el equipo. La calidad y disponibilidad dependen del navegador/sistema operativo. Si no hay síntesis local, la respuesta permanece visible en texto.
- La transcripción a Cloudflare Whisper recibe language=en durante English Studio y language=es en clases en español.

### English Studio inspirado en Stimuler
- Speaking es la actividad principal: reto de 60 segundos, análisis de transcripción en inglés, feedback con mejoras accionables y reintento.
- Más de 20 escenarios conversacionales complementan la práctica libre; la rutina de 10 minutos incluye hablar, recibir feedback y volver a practicar.
- La rúbrica 0–5 solo valora dimensiones respaldadas por evidencia. La transcripción no autoriza a atribuir puntuación fonética, pausas o entonación.
- Listening, Reading y Writing se mantienen como laboratorios de apoyo; Pronunciation solo se evalúa acústicamente cuando existe señal suficiente.

### Lateral y flashcards
- La navegación lateral se separa en Aprender, Mi biblioteca y Seguimiento.
- Flashcards filtra el conjunto por todas, por repasar, familiares y dominadas, muestra el porcentaje dominado y permite una tarjeta aleatoria.

### QA pendiente
- CI observado: 282/282 regresiones, TypeScript y ESLint aprobaron en la última corrida visible; producción Next.js seguía en build al escribir esta nota.
- Pruebas manuales pendientes en Chrome: permiso/denegación del micrófono, transcripción en español/inglés, síntesis local, interrupción/detención, fallback por cuota agotada y reconexión Live solo tras consentimiento válido.
- No se ha probado con estudiantes. No desplegar ni cambiar main como parte de esta iteración.

## Actualización posterior — navegación directa y English Studio Live-first (2026-11-09)

- El catálogo ahora separa explícitamente `Tutor de estudio` y `English Studio`; este último abre directamente `/orby?view=english` y no exige localizar la opción en la barra lateral.
- English Studio se redujo a Speaking, Pronunciation y Saber 11. Speaking/Pronunciation solicitan Gemini Live bidireccional; si no se establece una sesión, se conserva el error real y no se inicia el modo de grabación/transcripción de manera silenciosa.
- La configuración de idioma de entrada/salida de la sesión Live de OmegaX cambia a `en-US` durante English Studio y vuelve a `es-US` en el resto de clases.
- A1–C2 es una meta de curso general MCER. Saber 11 expone por separado Pre A1, A1, A2 y B1, de acuerdo con la guía 2026-2.
- La ruta de inglés incluye mapa de contenidos general y prácticas originales por las siete partes. La Parte 1 es matching 5×7; las Partes 4–7 incluyen varios huecos/preguntas sobre textos. No se declara una prueba completa de 55 ítems.
- El comportamiento anterior descrito en este documento como fallback automático a voz por turnos queda superado para English Studio y para el inicio de clase Live. La recuperación tras caída de una llamada ya establecida puede conservar el turno en el chat escrito; no debe rotularse como manos libres.
- QA de audio real en Chrome, navegación móvil/teclado y build actual siguen pendientes. No se ha probado con estudiantes ni se ha desplegado a Production.


## Aclaración posterior — destrezas generales restauradas (2026-11-09)

La reducción inicial a tres rutas se amplió antes de cerrar la entrega: las destrezas generales de English Studio no se limitan a speaking/pronunciation. Ahora hay seis accesos: Speaking, Pronunciation, Listening, Reading, Writing y Saber 11. Listening, Reading y Writing reutilizan los bancos originales por nivel A1–C2. Listening reproduce el guion con síntesis local y revela la transcripción bajo demanda; Reading presenta pasajes y evidencia; Writing incluye consigna, extensión y checklist. El MCER sigue siendo una meta de curso general y no una escala oficial de Saber 11.

Los mensajes generados para feedback de destrezas admiten hasta 7.000 caracteres en el cliente, igual que la API. Las instrucciones internas de llamadas Live quedan reducidas a una consigna legible para no llenar el historial. Ante un fallo de conexión, la explicación del error queda visible; no se activa push-to-talk automáticamente.



## 10. Corrección de alcance: OmegaX no pertenece a Personajes (2026-11-09)

- **OmegaX es el tutor de IA general de PeakScore**, una capacidad transversal de la plataforma educativa. Es independiente del catálogo, la colección, la tienda y la historia de los personajes.
- No crear una ficha de personaje, carta, bioma, lore, habilidad coleccionable ni entrada de inventario para OmegaX.
- La colección de personajes conserva únicamente los personajes ya definidos en el producto (actualmente Nova, Nox, Zyra y Orby, según el estado de esta rama). No modificar sus nombres, identidades, cartas, precios ni historias como parte del trabajo de Studdy/Stimuler.
- La marca visible del tutor en las experiencias educativas es **OmegaX**. Los identificadores técnicos heredados como `orby` pueden seguir existiendo en rutas, tablas, componentes o contratos por compatibilidad; eso no convierte a OmegaX en un personaje ni autoriza renombrar esos identificadores sin una auditoría específica.
- El trabajo activo solicitado continúa siendo la experiencia de aprendizaje inspirada en patrones funcionales de Studdy y Stimuler: catálogo/entrada de estudio, aula en vivo con pizarra persistente e interrumpible, English Studio y práctica oral con feedback real. La dirección visual tipo Duolingo se refiere a paleta, tarjetas, jerarquía visual y claridad educativa, no a copiar rutas curriculares.
- Esta nota corrige la interpretación errónea añadida en el apartado anterior. No se deben repetir cambios en `lib/characters/lore.ts`, `components/perfil/CharacterCards.tsx` o `app/perfil/personajes/page.tsx` para renombrar o introducir OmegaX como personaje.


## 11. Implementación visual: catálogo y rutas de inglés (2026-11-09)

- components/aprender/LearningCatalog.tsx: el catálogo de /aprender pasa a una jerarquía de tres niveles: encabezado educativo, dos espacios principales (tutor OmegaX y English Studio) y rutas interactivas. Las dos entradas principales usan tarjetas amplias, con propósito, capacidades y CTA visibles. Los cursos conservan sus rutas y recursos existentes.
- La paleta ahora es educativa y colorida: verde para tutor/acción de aprendizaje, celeste para English Studio y tarjetas claras para los cursos. Se evita la composición beige neutra anterior. No se copia ningún asset, texto ni pantalla de Duolingo.
- components/aprender/OmegaXEnglishStudio.tsx: las seis destrezas se presentan como tarjetas de navegación, no como una hilera de chips: Speaking, Pronunciation, Listening, Reading, Writing y Saber 11. Cada tarjeta declara en una línea qué se hace. El layout cambia de dos columnas en móvil a tres en tablet y seis en pantallas amplias.
- Esto es una primera pasada de jerarquía y descubribilidad, no la entrega final del producto. No se declara terminado el diagnóstico adaptativo, el mapa curricular visual, el seguimiento de progreso ni el QA responsive real.
- Estado de validación: cambios guardados en feat/founder-intro; TypeScript, ESLint, tests y comprobación visual en dispositivos aún pendientes para estos commits.


## 12. Materia opcional en el inicio de clase (2026-11-09)

- El inicio tema-primero ahora permite elegir explícitamente una de las cinco áreas: Ciencias Naturales, Matemáticas, Lectura Crítica, Sociales y Ciudadanas o Inglés. La selección es opcional; sin ella, OmegaX intenta inferir el área desde el tema escrito.
- La selección manual tiene prioridad sobre la detección automática para asignar el contexto académico de la sesión y la conversación guardada. El tema sigue siendo obligatorio antes de iniciar Live.
- La selección se presenta como tarjetas responsivas y de color diferenciado, con estados accesibles `aria-pressed`. No abre la sesión ni solicita el micrófono hasta pulsar «Comenzar clase».
- Prueba de regresión añadida para las cinco áreas y la prioridad de la selección explícita. Pendiente CI completo del commit de esta iteración y QA visual en navegador real.


## Reto oral cronometrado — 2026-11-09

- En English Studio, Speaking ahora solicita una llamada Live real y, solo después de confirmar que el socket está listo, inicia un reto de 60 segundos con contador visible en la cabecera del aula.
- «Terminar reto» detiene la llamada antes del límite. Al llegar a cero el flujo termina automáticamente. Si la llamada se desconecta, el reto se cierra con estado de interrupción y no se simula una sesión completa.
- Al terminar, se construye una solicitud de feedback con las intervenciones de estudiante disponibles en los mensajes de la sesión y el texto parcial reconocido que siga pendiente. La respuesta se solicita en el chat mediante el tutor; no se inventa un score acústico.
- La evaluación se limita a cumplimiento de consigna, gramática observable, vocabulario, coherencia y desarrollo de ideas, con evidencia textual. La transcripción ASR puede tener errores y no sirve para afirmar medición de fonemas, acento, entonación, ritmo, pausas o fluidez acústica.
- Pronunciation queda separado del cronómetro Speaking: conserva su flujo de escuchar → repetir → recibir corrección → reintentar, sin presentar la transcripción como análisis fonético.
- Los callbacks pasan skill, nivel y consigna a la clase Live; el cierre conserva el tema y la evidencia de la práctica para evaluación posterior. La llamada solo empieza el reto cuando está realmente conectada.
- Tests añadidos para inicio posterior a conexión, timeout, finalización manual, envío de evidencia textual y ausencia de métricas acústicas inventadas. Estado de CI a actualizar cuando finalice el workflow del commit 22fb692.

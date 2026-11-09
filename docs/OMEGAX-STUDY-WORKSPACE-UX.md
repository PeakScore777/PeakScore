# OmegaX — dirección de diseño del espacio de estudio

**Fecha:** 2026-11-08  
**Rama:** `feat/founder-intro`  
**Estado:** primera iteración de UX aplicada; QA visual y de voz en navegador pendiente.

## Referencias y criterio

Las capturas de Studdy y Studley se usan como referencias de calidad de producto, no como plantillas para copiar. La dirección adoptada para PeakScore combina:

- La claridad editorial de Studdy: superficie de trabajo limpia, tipografía legible, pizarra protagonista y pocas distracciones.
- La organización de Studley: herramientas separadas, navegación fácil de entender, actividades con un objetivo concreto y biblioteca personal.
- La identidad propia de PeakScore: neutros cálidos, blanco para lectura, naranja para acciones y una iconografía Lucide lineal coherente.

No se copian nombres, marcas, ilustraciones, textos comerciales ni pantallas propietarias.

## Sistema visual

1. **Tipografía:** sans serif del sistema en el espacio de estudio. Las fuentes pixel permanecen en los juegos y escenas que realmente requieren ese lenguaje; no deben dominar el tutor ni los formularios de aprendizaje.
2. **Iconografía:** componentes Lucide de trazo consistente, tamaños y alineación comunes. Evitar emojis ornamentales y símbolos genéricos usados como sustitutos de iconografía.
3. **Color:** blanco y marfil para superficies de lectura; grises para jerarquía; naranja PeakScore para acción y foco. Los colores de estado se reservan para mensajes semánticos.
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
- CI observado: 277/277 regresiones, TypeScript y ESLint aprobaron en la última corrida visible; producción Next.js seguía en build al escribir esta nota.
- Pruebas manuales pendientes en Chrome: permiso/denegación del micrófono, transcripción en español/inglés, síntesis local, interrupción/detención, fallback por cuota agotada y reconexión Live solo tras consentimiento válido.
- No se ha probado con estudiantes. No desplegar ni cambiar main como parte de esta iteración.

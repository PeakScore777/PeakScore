# Orby — evolución a tutor continuo con pizarra

Fecha de auditoría: 2026-11-07  
Rama objetivo: `feat/founder-intro`  
Estado: diagnóstico inicial; no desplegar ni integrar en `main`.

## Objetivo de producto

Orby debe sentirse como una tutora que acompaña una sesión de estudio: conversación de voz fluida, interrupciones naturales, contexto persistente y un tablero didáctico que se actualiza mientras explica. La interfaz no debe exigir al estudiante enviar una pregunta nueva para cada intervención.

La persistencia puede seguir guardando intercambios atómicos. Eso es una decisión de almacenamiento, no el modelo de interacción de la experiencia.

## Hallazgos confirmados en el código actual

1. La experiencia escrita vive en `components/aprender/LessonAITutor.tsx`; el contenido del asistente se representa como texto enriquecido. El tipo `Message` todavía no contiene un modelo de escena/pizarra.
2. La voz en tiempo real usa Gemini Live y un flujo de audio continuo en el navegador, con detección de actividad, interrupciones y reanudación. No equivale a una experiencia de chat estrictamente por turnos mientras Live está conectado.
3. Si Live falla o no está disponible, `activateTurnBasedVoiceFallback` desconecta el micrófono y cambia explícitamente a una ruta de voz por turnos. El propio código actual anuncia ese cambio en el estado de voz.
4. En producción, `app/api/orby/realtime-session/route.ts` bloquea Gemini Live si `ORBY_GEMINI_LIVE_ENABLED` no es `true`. El comentario de seguridad indica que la activación está retenida por la revisión de privacidad del uso de datos del nivel gratuito de Google. No se debe activar ese consentimiento ni cambiar el proveedor sin decisión explícita del responsable.
5. La generación de imágenes usa Cloudflare Workers AI con límite diario de 3 imágenes y manejo explícito de cuota gratuita agotada. Es útil como recurso visual puntual, pero no es una pizarra: no permite que el tutor dibuje y modifique figuras, etiquetas, flechas o pasos de manera sincronizada.
6. El tutor escrito devuelve JSON con `reply`, `checkQuestion` y `learningSignal`. No hay contrato estructurado de escena visual en la respuesta.
7. La última ejecución CI consultada para el commit `19af230506d66c94315ddb2430f373dcaac4add6` terminó correctamente: pruebas Orby, TypeScript, ESLint y build de producción.

## Arquitectura objetivo

### A. Motor de pizarra local (sin inferencia de imagen)

- Definir un contrato JSON pequeño y versionado para escenas: título, bloques de texto, formas geométricas, flechas, etiquetas, ecuaciones y gráficas.
- Validar estrictamente tipos, longitudes, cantidades máximas, coordenadas y colores permitidos en servidor y cliente.
- Renderizar la escena con SVG/HTML en el navegador. No ejecutar código ni HTML generado por el modelo.
- Actualizar escenas por operaciones acotadas (añadir, resaltar, mover, sustituir o limpiar elementos), conservando una instantánea para reanudación.
- Soportar una salida de texto si el modelo no entrega una escena válida.

### B. Contrato pedagógico

- Añadir un campo opcional `board` a la salida del tutor escrito.
- Pedir una escena solo cuando ayude a explicar; no generar dibujos para saludos, confirmaciones o respuestas puntuales.
- Mantener el texto como explicación principal y usar la pizarra como apoyo visual verificable.
- En Matemáticas y Ciencias Naturales, comprobar fórmulas, unidades, secuencias y etiquetas; no inventar datos en gráficas.
- Mantener el alcance exclusivo de Saber 11 y los filtros actuales.

### C. Voz continua y sincronización

- Mantener el micrófono abierto mientras la sesión Live esté activa; aceptar intervención, interrupción y reanudación sin obligar a tocar enviar.
- Vincular cada escena con el identificador de generación de voz para descartar anotaciones atrasadas tras una interrupción.
- Permitir que la pizarra avance por etapas sincronizadas con la explicación, sin bloquear la conversación por renderizado.
- El guardado de mensajes puede continuar por intercambio atómico e idempotente.

### D. Cuotas y privacidad

- No añadir proveedor ni fallback que pueda generar cargos.
- Respetar límites de Cloudflare y de cualquier servicio gratuito; al agotarse, informar y degradar a explicación escrita.
- No activar Gemini Live en producción ni cambiar su configuración de privacidad como parte de esta implementación.
- Antes de usar voz Live públicamente, el responsable debe decidir explícitamente si acepta las condiciones de tratamiento de datos del nivel gratuito de Google y comprobar la configuración de cuenta.

## Secuencia de implementación y aceptación

1. Contrato de escena, validador y renderizador SVG seguro; pruebas unitarias de payload inválido, límites y geometrías.
2. Integrar `board` en tutor escrito y mostrar una pizarra junto a la explicación; pruebas para respuestas sin escena y escenas malformadas.
3. Enviar escenas incrementales desde voz y asociarlas a generaciones; pruebas de interrupción, salida atrasada, reanudación y persistencia.
4. Pruebas reales en Chrome: conversación de varios minutos, interrupción en mitad de explicación, preguntas de seguimiento, cambio de tema, pérdida de red, cuota agotada y permisos de micrófono.
5. CI completa antes de solicitar Pull. No desplegar automáticamente.

## Restricciones de alcance

- No reconstruir material del Orby ICFES Lab que fue eliminado intencionalmente.
- No modificar `main`, no desplegar y no pedir Pull hasta que el responsable revise el resultado.
- No afirmar que la experiencia está terminada por pasar pruebas estáticas; la voz continua requiere prueba real con micrófono y navegador.


## Avance implementado — primera versión de pizarra

- Se añadió `lib/ai/orby-board.ts` con contrato versionado y sanitizador estricto.
- Se añadió `components/aprender/OrbyBoard.tsx`, que renderiza bloques tipados como texto, fórmulas, pasos y llamadas de atención. No interpreta HTML, SVG ni código del modelo.
- `/api/lesson-tutor` acepta la pizarra opcional, valida el objeto en servidor y solo devuelve el campo si pasa el esquema. También valida la escena recuperada tras el reintento de respuesta incompleta.
- `LessonAITutor` incorpora la pizarra al mensaje del asistente y la muestra debajo de la explicación. Las respuestas antiguas y las respuestas sin escena siguen funcionando sin cambios.
- Se añadió una prueba para escenas válidas, tipos desconocidos, versión incorrecta, exceso de bloques y renderizado sin HTML inseguro.

### Límites pendientes de esta entrega

- La pizarra todavía no se persiste al recargar el historial; el esquema actual de mensajes guarda texto y metadatos de adjunto, no escenas. No se añadió una migración de base de datos en esta fase.
- La pizarra está integrada con el tutor escrito y la ruta de voz alternativa que usa `/api/lesson-tutor`; todavía no se sincroniza con eventos de Gemini Live en tiempo real.
- No se activó Gemini Live en producción ni se cambió ninguna condición de privacidad o cuota.
- CI se encuentra en ejecución para el commit de esta integración. No se declara validada hasta que finalice.

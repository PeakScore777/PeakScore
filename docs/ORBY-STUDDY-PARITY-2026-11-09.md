# Orby — paridad visual y funcional con Studdy
**Fecha de trabajo:** 9 de noviembre de 2026 (America/Bogota)  
**Rama:** `feat/founder-intro`  
**Repositorio:** `PeakScore777/PeakScore`  
**Objetivo:** llevar la clase de Orby a una experiencia de tutoría por voz y pizarra comparable con el video de referencia de Studdy, sin sustituir Gemini Live ni introducir servicios que puedan facturar.

> Este documento es el registro de trabajo del día. Se actualiza en cada bloque de cambios y conserva explícitamente qué está implementado, qué está validado por CI y qué requiere prueba manual. No representa una afirmación de paridad visual total con Studdy.

## Reglas que no se negocian
- Trabajar únicamente en `feat/founder-intro`; no modificar `main`, no desplegar ni abrir Pull Request como parte de esta tarea.
- Mantener Gemini Live como motor de voz/razonamiento durante esta fase.
- No agregar Kimi-K2, ElevenLabs ni proveedores alternativos de pago.
- Las imágenes siguen utilizando la ruta existente de Cloudflare Workers AI / Flux Schnell, cuota diaria y guardas de coste; al agotarse, no hay fallback pagado.
- El material de Orby ICFES Lab fue eliminado intencionalmente. No reconstruirlo, inferirlo ni usar conteos antiguos.
- No introducir emojis en la interfaz ni permitir que el tutor enseñe programación o contenido ajeno a Saber 11.
- La salida de Live, los subtítulos y el tablero deben pertenecer al mismo turno; eventos de una generación interrumpida no deben contaminar la siguiente.

## Referencia visual observada
Del video de Studdy se toma el patrón de interacción, no sus marcas ni sus activos:
- Lienzo de clase claro, amplio y con predominio del contenido.
- Escritura manuscrita y jerarquía didáctica sencilla.
- Título resaltado, trazos de tinta y anotaciones de distintos colores.
- Subtítulos de voz legibles durante la explicación.
- Barra inferior discreta, con identidad del tutor y controles de micrófono/salida.
- Apoyos visuales insertados dentro de la lección, no como una respuesta separada.

El video/nota aportados identifican Kimi-K2 y ElevenLabs en el stack de Studdy, pero no revelan el proveedor o endpoint de generación de imágenes. PeakScore no copia endpoints ni credenciales desconocidas.

## Arquitectura de PeakScore
1. **Gemini Live:** audio bidireccional, transcripción de entrada/salida, barge-in y llamadas a herramientas.
2. **Pizarra segura:** `render_orby_teaching_board` y `apply_orby_board_action`; JSON tipado, sanitizador y render SVG/React. Nunca se interpreta HTML/SVG arbitrario generado por el modelo.
3. **Banco visual:** primitivas aprobadas para recursos científicos/educativos canónicos.
4. **Ilustración raster opcional:** `generate_orby_teaching_image` solicita una sola ilustración PNG por intervención académica validada, a través de `/api/orby/generate-image` y Cloudflare Flux Schnell. El límite API actual es de tres imágenes por usuario/día.
5. **Presentación:** pizarra, ilustración y subtítulos se asocian al mensaje activo de Orby.
6. **Persistencia:** texto y pizarra se guardan mediante el RPC idempotente existente. La imagen PNG generada aún no se persiste en el historial al momento de este registro; aparece en el turno activo y se pierde al recargar. Esto queda registrado como pendiente, no como funcionalidad terminada.

## Registro de movimientos — 9 de noviembre de 2026

### Movimiento 1 — auditoría del estado y de la referencia
- Confirmada la rama de trabajo `feat/founder-intro`.
- Revisados `LessonAITutor.tsx`, `OrbyBoard.tsx`, `orby-live-tools.ts`, estilos globales, ruta de imágenes, ruta de persistencia y pruebas Orby.
- Revisado el video aportado y documentadas las señales de diseño descritas arriba.
- Confirmado que existe el avatar `public/images/orby/orby-avatar.png`.
- Confirmado que la ruta de imágenes impone autenticación, alcance ICFES, máximo de tres imágenes diarias y errores de cuota sin fallback de pago.

### Movimiento 2 — integración de herramienta PNG en Gemini Live
- Añadida la declaración `generate_orby_teaching_image` a `lib/ai/orby-live-tools.ts`.
- Añadido el manejador `handleOrbyLiveImageTool` en `LessonAITutor.tsx`.
- La herramienta exige turno académico validado, filtra prompt, permite una imagen por intervención y aborta solicitudes anteriores cuando comienza una actividad nueva.
- La imagen se anexa al mismo mensaje activo y se representa junto con la pizarra.
- El flujo reutiliza `/api/orby/generate-image`; no crea proveedor ni fallback nuevo.
- Commit: `2ad86a9b` (declaración) y `c1cdf8ae` (manejador/render).

### Movimiento 3 — composición visual de la clase
- Barra inferior reordenada con avatar de Orby, acceso al chat, guardado de apuntes, micrófono y botón de terminar.
- Título del tema resaltado con estilo manuscrito.
- Estilos de lienzo claro, tipografía, subtítulos y controles agregados al final de `app/globals.css`.
- Commit: `b876616c` (controles), `e018530c` (título), `78ee1414` (composición CSS).

### Movimiento 4 — regresiones y contrato
- Añadida prueba de integración estática para la herramienta Live de imagen, límite por turno, ruta de cuota y renderizado.
- Actualizado el contrato de subtítulos para que sean permanentes durante la llamada; el estudiante no se presenta como la voz de Orby.
- Ajustadas dos expectativas antiguas de pruebas: el límite entre manejador de pizarra y manejador de imagen; subtítulos permanentes en lugar de una preferencia de ocultación.
- Commits: `7c9a6fc6`, `f49fc708`, `88880325`.

### Movimiento 5 — correcciones de TypeScript detectadas por CI
- Quitada una referencia a un setter de subtítulos ya inexistente.
- Eliminadas comparaciones imposibles de `learningView` contra `english` en un panel cuyo tipo no permite ese valor.
- Envueltos los handlers de voz para no pasar el MouseEvent a una función que espera boolean.
- Conservados literales de tipos para `role` en el historial de voz.
- Definido un límite de longitud del prompt antes de llamar al modelo de análisis de Cloudflare.
- Commits: `aaac2836`, `263c24ae`, `0a82d7bb`.

### Movimiento 6 — resultado de CI
- GitHub Actions run [42737267121](https://github.com/PeakScore777/PeakScore/actions/runs/42737267121), commit `0a82d7bb47df3e15c5d8cf9ad7015a59f4f20c14): **306/306 pruebas Orby aprobadas**.
- TypeScript `npx tsc --noEmit`: aprobado.
- ESLint `npm run lint`: aprobado.
- Build `npx next build`: aprobado.
- La auditoría de dependencias completó sin fallo.
- Esta validación corresponde al código de aplicación hasta el commit `0a82d7bb`; los commits posteriores del mismo bloque solo actualizaron documentos y dispararon ejecuciones adicionales.
- El resultado de CI no prueba micrófono real, reproducción de audio, generación de imagen de proveedor ni diseño responsive en navegador.

## Pendientes prioritarios
1. Mostrar un estado de generación de ilustración en la misma hoja mientras Flux trabaja y un mensaje de cuota agotada sin dejar un hueco vacío.
2. Reforzar continuidad de la pizarra: foco/spotlight inequívoco, acciones incrementales, estados de espera y cancelación limpios al interrumpir.
3. Revisar la persistencia de ilustraciones generadas en el historial. Hoy solo se conserva texto/pizarra; no guardar base64 crudo en Postgres. Diseñar uso de storage privado y referencias firmadas respetando los límites existentes, o declarar claramente la limitación.
4. Revisar diseño en escritorio y móvil: canvas, subtítulos, barra inferior, scroll, controles y superposición con chat.
5. Añadir regresiones de fallos de imagen, aborto por barge-in, límite de imágenes por turno y ausencia de salida atrasada.
6. Ejecutar CI completo después de cada bloque. Probar en navegador con micrófono y cuota real solo con autorización/entorno de prueba apropiado.

## Estado al abrir este registro
- Integración Live de PNG: implementada en rama.
- Lienzo y barra inferior: primera iteración visual implementada.
- Subtítulos: permanentes por contrato y prueba.
- Pruebas/TypeScript/ESLint/build: aprobados en run [42737267121](https://github.com/PeakScore777/PeakScore/actions/runs/42737267121).
- Imagen generada persistida en historial: pendiente.
- QA manual de Chrome/micrófono: pendiente.
- `main` / despliegue / PR: sin cambios.

## Movimientos adicionales — persistencia y continuidad de imágenes (9 de noviembre)

### Movimiento 7 — optimización local antes de Storage
- Añadido `lib/ai/orby-image-upload.ts`.
- Convierte el PNG/JPEG de Flux a WebP desde el navegador, limita el borde mayor a 1440 px y prueba calidades descendentes hasta quedar por debajo del límite existente de 1 MB.
- No envía la imagen a un segundo modelo ni proveedor; toda la compresión es local.
- Commit: `b1167cd7`.

### Movimiento 8 — almacenamiento privado y URLs firmadas
- La ruta `GET /api/orby/images?path=...` valida que el path pertenezca al usuario autenticado, comprueba metadata y redirige a una URL firmada de 10 minutos.
- La pantalla de historial usa una ruta del mismo origen; no guarda URLs firmadas caducables ni base64 en la base de datos.
- Commits: `c3742920`.

### Movimiento 9 — vinculación a un turno de voz específico
- Nueva ruta `POST /api/orby/realtime-turn/image`, que verifica sesión, UUID de conversación/turno y prefijo de path antes de invocar la RPC.
- Nueva migración `20261110010000_orby_voice_image_persistence.sql`: agrega `generated_image_path` y `voice_turn_id`, conserva el RPC idempotente de voz y define `orby_attach_voice_turn_image` con acceso exclusivo a `service_role`.
- Se incluye `voice_turn_id` también cuando la llamada no tiene pizarra: el guardado usa `orby_save_voice_turn_with_board(..., p_teaching_board: null)` y conserva fallback al RPC legacy si la migración todavía no existe.
- La imagen se puede adjuntar tanto si termina antes de guardar el turno como si termina después. Se conserva el path al reintentar un guardado fallido y se evita que una subida tardía se vincule a un turno posterior.
- Commits: `83fa3401` (migración inicial), `5a4a8921` (endpoint), `c98ecbbd` (guardar turn ID sin pizarra), `43c5bf16` (reintentos), `d73093fb` (corrección de comillas de delimitación SQL).

### Movimiento 10 — historial compatible por etapas
- El endpoint de mensajes pide primero `teaching_board` + `generated_image_path`.
- Si falta solo `generated_image_path`, vuelve a consultar con `teaching_board` para no perder las pizarras actuales.
- Si también falta `teaching_board`, cae al historial textual anterior y entrega campos opcionales nulos.
- Commit: `dee371aa`.

### Movimiento 11 — estados visuales de generación
- La clase muestra un estado de carga no bloqueante: «Orby está preparando una ilustración» y explica que la clase continúa mientras se crea el apoyo visual.
- La imagen aparece con una revelación corta; respeta `prefers-reduced-motion`.
- Commit: `a445f5e6`.

### Movimiento 12 — pruebas de almacenamiento y fallback
- Añadida regresión que comprueba conversión WebP bajo 1 MB, llamada de subida, cancelación/turn generation, asociación con el ID del turno, URL firmada, ruta de historial y migración.
- Actualizado el test de compatibilidad histórica para cubrir ambas columnas opcionales, en vez de acoplarse al nombre anterior del helper.
- Commits: `30ac1c1f`, `7dace362`.
- El primer CI del nuevo test detectó que el test histórico seguía esperando el antiguo helper `isMissingTeachingBoardColumn`; la expectativa fue adaptada a la nueva función genérica `isMissingColumn`. Esa ejecución fallida no representa un fallo de la ruta en producción.

## Dependencias operativas de la persistencia PNG
- **Importante:** la migración `20261110010000_orby_voice_image_persistence.sql` ya está en GitHub, pero no se ha aplicado a Supabase remoto desde esta tarea.
- Hasta aplicar la migración, el guardado del turno mantiene su fallback y la imagen puede verse en la sesión actual, pero no puede quedar asociada de forma persistente al historial. La subida al bucket privado conserva el límite de 20 activos por cuenta y el máximo de 1 MB por objeto.
- Una vez aplicada la migración, los nuevos turnos Live guardan el `voice_turn_id`, y el endpoint de asociación escribe solamente la ruta privada de la imagen en el mensaje del asistente.
- No ejecutar la migración en remoto sin revisión/autorización. No almacenar base64 en `orby_messages`.

## Validación de este bloque
- La nueva ejecución de CI para el commit `7dace362` está en curso al escribir este registro: [GitHub Actions run 42738365834](https://github.com/PeakScore777/PeakScore/actions/runs/42738365834).
- El resultado todavía debe confirmar tests, TypeScript, ESLint y build antes de declarar este bloque aprobado.
- QA manual pendiente: llamada Gemini Live real, generación Flux, subida WebP, interrupción durante la subida, imagen visible tras recargar historial y comprobación responsive en Chrome.

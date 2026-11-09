# PeakScore — rutas de voz y revisión visual Studdy
**Fecha:** 2026-11-09  
**Rama:** `feat/founder-intro`  
**Estado:** investigación verificada y decisión de arquitectura; no equivale a QA runtime ni a integración desplegada.

## 1. Revisión de los videos adjuntos

Se inspeccionaron los dos videos de Studdy completos mediante muestreo visual distribuido por toda su duración (47.6 s y 309.1 s). La grabación larga muestra:

- Aula de trabajo despejada, con una hoja blanca amplia y controles mínimos en la parte inferior.
- La explicación escrita se revela por etapas y conserva lo ya escrito mientras se agregan nuevos fragmentos.
- Los diagramas e ilustraciones aparecen junto al texto cuando la explicación llega a ellos; no se ve una lámina completa obligatoria al inicio.
- Se observan recursos visuales de biología (célula, división celular, cromosomas) colocados como imágenes independientes dentro de la hoja.
- En varios momentos aparece un pequeño patrón de puntos durante la transición. El video por sí solo no permite determinar si es un placeholder, una animación de carga, una generación visual o una descarga desde un banco.
- La hoja mantiene el foco del contenido y se desplaza/actualiza para acompañar la clase. La evidencia visual no permite afirmar que exista una cámara virtual con seguimiento continuo ni identificar la API privada que usa Studdy.
- El video corto muestra un inicio simple con intención de aprendizaje y acceso al aula sin un dashboard saturado.

**Conclusión:** debemos reproducir el comportamiento pedagógico observable (revelado progresivo, assets independientes, foco, conservación y desplazamiento), no afirmar que conocemos el proveedor interno de Studdy. No se ha validado acústicamente el audio de los MP4 ni se ha identificado una voz/proveedor por escucha.

## 2. Banco visual existente en PeakScore

Ya existe `lib/ai/orby-visual-bank.ts`, con entradas tipadas por materia, tema, etiquetas y visual estructurado. También existe `expandOrbyVisualBankSnapshot` y el renderer `components/aprender/OrbyBoard.tsx`.

Esto significa que el banco no debe reconstruirse desde cero. Hay que ampliarlo y conectarlo con el plan de clase:

1. Catálogo por materia → tema → concepto → visual.
2. Cada recurso con ID estable, fuente/licencia, texto alternativo, etiquetas, nivel y versión.
3. Selección determinista por tema y etapa de explicación; el tutor solicita un ID del banco, no una imagen arbitraria.
4. Mostrar placeholder discreto solo mientras el recurso real carga; al terminar, revelar el recurso con transición corta.
5. Permitir enfocar partes identificables (organelos, flechas, nodos, regiones) con círculo, subrayado, flecha o resaltado, sin alterar el recurso base.
6. Mantener recursos previos y agregar nuevos elementos sin reconstruir toda la pizarra.
7. No descargar imágenes de Studdy ni copiar ilustraciones protegidas. Usar assets propios, de dominio público o con licencia compatible, y registrar procedencia.

La muestra de Studdy no prueba por sí sola que use un banco interno o una API concreta; el banco existente de PeakScore es una decisión arquitectónica verificable.

## 3. Hallazgo crítico: Gemini API no es opción para el alumnado menor de 18

Las condiciones oficiales adicionales de Gemini API vigentes desde el 23 de marzo de 2026 exigen que el usuario de la API sea mayor de 18 y prohíben usar esos servicios como parte de aplicaciones dirigidas a menores de 18 o probablemente accesibles por ellos. PeakScore prepara estudiantes de grados 10 y 11, por lo que no debemos habilitar Gemini Live para las clases estudiantiles ni interpretar una cuenta gratuita del desarrollador como permiso para ese uso.

La ruta `app/api/orby/realtime-session/route.ts` ya contiene una barrera `GEMINI_NOT_PERMITTED_FOR_STUDENT_AUDIENCE` y permite únicamente testers adultos verificados para QA interno. **No quitar ni eludir esa barrera.** Un consentimiento de datos o la confirmación de Free Tier no resuelven la restricción de edad.

Fuente oficial: https://ai.google.dev/gemini-api/terms (vigente desde 2026-03-23).

## 4. Ruta alternativa más prometedora: Cloudflare Agents Voice

La documentación oficial de Cloudflare (actualizada 2026-10-29) presenta `agents/voice`, paquete `agents` desde v0.23.0, con:

- `withVoice`: agente completo STT → LLM → TTS.
- `WorkersAIFluxSTT`: transcripción continua por llamada y detección de fin de intervención.
- `WorkersAITTS`: salida de voz sintetizada.
- Audio del micrófono por WebSocket durante la llamada y audio de respuesta de vuelta.
- Streaming TTS por fragmentos de frase.
- Interrupción: la voz del estudiante durante la reproducción aborta la respuesta actual; el transcriptor continúa escuchando.
- `onInterrupt`, `AbortSignal`, `onTurn`, hooks de pipeline y persistencia de conversación.

Esta arquitectura puede sentirse como una clase continua y admitir interrupciones, aunque **no es speech-to-speech nativo** como Gemini Live: es una canalización STT + LLM + TTS. La voz y latencia dependen de los modelos y del streaming. No prometer la misma naturalidad o latencia de Gemini Live sin pruebas.

La asignación gratuita oficial de Workers AI es de **10,000 Neurons por día**, reiniciada a las 00:00 UTC. Workers AI está disponible en Workers Free; exceder la asignación en Workers Free hace que las operaciones fallen y no debe provocar upgrade automático. Mantener además el presupuesto interno PeakScore más conservador si está configurado. No activar modelos de catálogo que exijan Workers Paid o cobro por unidad.

Fuentes oficiales:
- https://developers.cloudflare.com/agents/agent-class/communication-channels/voice/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/

## 5. Qué puede y qué no puede hacer Cloudflare Voice

**Sí puede aportar:** audio continuo por WebSocket, detección de intervención, respuesta hablada en streaming, interrupción/cancelación y hooks para validar el texto antes de hablar.

**No aporta por sí solo:** un modelo de voz nativo con prosodia conversacional comparable a Gemini Live; sincronización fonética palabra a palabra; pizarra o cámara automática; evaluación acústica calibrada de pronunciación.

La pizarra se coordina desde el agente de PeakScore: el LLM produce eventos docentes tipados (añadir texto, seleccionar visual del banco, enfocar ID, subrayar/circular, desplazar a sección, comprobar comprensión). Los eventos deben tener ID, secuencia, generación y referencias válidas al snapshot. La voz y la pizarra se sincronizan por hitos docentes, no por falsa alineación palabra-a-palabra.

## 6. Decisión por producto

### Tutor de estudio / clase en vivo
- No usar Gemini API Free Tier para estudiantes de PeakScore por la restricción de edad.
- Prototipar Cloudflare Agents Voice con modelos que estén efectivamente disponibles en Workers Free y dentro del presupuesto diario.
- Reutilizar `LessonAITutor`, `OrbyBoard`, `orby-live-tools` y el banco visual existente; no crear un segundo tutor paralelo.
- Adaptar la ruta de voz para que las interrupciones aborten el turno actual, el audio deje de reproducirse y la pizarra conserve el checkpoint.
- Mantener una interfaz de llamada real: micrófono activo, indicador de escucha, control de silenciar/salir, respuesta de voz y pizarra amplia; no exponer transcripciones como requisito visual.
- Si se agota la cuota, detener la llamada con aviso claro. Nunca cambiar a plan pagado ni proveedor facturable.

### English Studio
- Cloudflare STT puede ser una ruta de transcripción continua, pero la evaluación de pronunciación requiere audio original y análisis acústico real, no solo el texto transcrito.
- Mantener actividades separadas de Speaking, Pronunciation, Listening, Reading y Writing.
- Feedback: fragmento pronunciado → evidencia detectada → sonido/rasgo que necesita práctica → modelo de pronunciación audible → reintento.
- No asignar puntuaciones de fonemas, acento o entonación si el proveedor solo entrega transcripción.
- Inglés Saber 11 permanece separado, con sus siete partes, práctica original y banco manual.

## 7. Diseño de la pizarra y movimiento de cámara

La referencia observable sugiere una hoja blanca con contenido que se agrega progresivamente y recursos visuales colocados en el punto de explicación. Para PeakScore:

- Lienzo plano y limpio, sin tarjetas decorativas ni paneles técnicos.
- Tinta manuscrita/estilo docente para encabezados y anotaciones, con tipografía de lectura clara para explicaciones largas.
- Círculo, subrayado, flecha y foco animado alrededor del elemento que el profesor menciona.
- Desplazamiento vertical suave cuando se agrega contenido debajo; mantener el contexto anterior parcialmente visible.
- Zoom al bloque activo solo si el alumno puede recuperar fácilmente la vista general; respetar controles manuales y reducir movimiento si `prefers-reduced-motion`.
- El desplazamiento debe depender de eventos explícitos del plan de clase y del espacio visible, no de cada token de texto.
- No simular cámara/zoom si no existe evento de tablero validado.

## 8. Siguiente implementación y validación

1. Hacer spike aislado de Cloudflare Agents Voice en rama de trabajo, sin tocar Gemini ni el fallback actual.
2. Confirmar los modelos STT, LLM y TTS concretos, su precio por unidad/neurona y disponibilidad Free. Rechazar modelos que requieran Workers Paid.
3. Integrar autenticación Supabase y límites por usuario/sesión; no exponer credenciales de Cloudflare al navegador.
4. Adaptar el agente para los eventos de pizarra existentes y cancelación de generación/audio en interrupciones.
5. Probar Chrome: primera respuesta audible, interrupción en mitad de frase, pregunta intercalada, reanudación, pérdida de red, denegación de micrófono y cuota agotada.
6. Medir tiempo hasta primer audio, latencia de respuesta y coste en Neurons por sesión de 10 minutos.
7. Para English Studio, probar primero STT continuo y conservar el audio de forma efímera solo si el diseño de privacidad lo autoriza; medir pronunciación con una fuente acústica apropiada.
8. Actualizar `PEAKSCORE_CONTEXT.md`, `PEAKSCORE_CHANGELOG.md` y esta auditoría cuando haya código y pruebas reales.

**No declarar integración terminada:** este documento registra investigación y una decisión de arquitectura. No añade paquetes, endpoints, workers, migraciones, secretos ni despliegues.

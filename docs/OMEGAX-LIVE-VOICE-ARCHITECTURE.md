# OmegaX — arquitectura de voz en directo y decisión de proveedores

Fecha de revisión: 2026-11-09  
Rama revisada: `feat/founder-intro`  
Alcance: investigación y plan de implementación; no se ha desplegado ni habilitado ningún proveedor nuevo.

## Decisión ejecutiva

- **OmegaX** es el nombre visible del tutor en PeakScore.
- La ruta actual de Cloudflare en Next.js NO es una clase en directo: graba un segmento, lo convierte a WAV, lo envía a transcripción + generación de texto y reproduce la respuesta con `window.speechSynthesis`. La ruta limita cada intervención a 60 s y la interfaz bloquea mientras procesa. Sirve como nota de voz por turnos, no como experiencia comparable a Studdy.
- La siguiente ruta que merece una prueba técnica es **Cloudflare Agents Voice** (`agents/voice`) desplegada como Worker separado, con Durable Objects, WebSocket de audio continuo, STT continuo, respuesta en streaming, TTS por frases y cancelación al detectar interrupción. La integración oficial ofrece `withVoice`, `useVoiceAgent`, `WorkersAIFluxSTT` y `WorkersAITTS`.
- Gemini Live no debe habilitarse para sesiones estudiantiles de PeakScore mientras siga vigente la restricción de los términos de Gemini API: prohíben utilizar el servicio en un API Client dirigido a menores de 18 años o al que sea probable que accedan. Que Saber 11 se pueda presentar a cualquier edad no cambia el público objetivo real de PeakScore (incluye estudiantes de 10.º y 11.º). No se sorteará la restricción mediante allowlists ficticias, ocultación del proveedor o filtros de respuesta.
- La marca conversacional puede ser OmegaX y el modelo no necesita mencionar espontáneamente el proveedor. Eso no sustituye la transparencia en política de privacidad, consentimiento y avisos de tratamiento de audio/datos.

## Evidencia del repositorio

### Ruta de voz segmentada actual

- `app/api/orby/cloudflare-voice-turn/route.ts`: POST recibe un WAV ya grabado; comprueba duración de hasta 60 s; usa `transcribeWithCloudflare` y `generateWithCloudflareTutor`; devuelve texto y transcripción. No devuelve audio sintetizado.
- `components/aprender/OmegaXFreeVoiceTurn.tsx`: usa `MediaRecorder`, convierte el blob a WAV, hace una petición por intervención y reproduce con `SpeechSynthesisUtterance`. No mantiene un canal de audio continuo ni TTS de servidor.
- `lib/ai/cloudflare-workers-ai.ts`: Whisper Large v3 Turbo para transcripción; Gemma 4 para tutor; no exporta TTS. El comentario explica que el TTS no se habilitó porque no se había confirmado una ruta gratuita.
- `app/api/orby/audio/transcribe/route.ts`: transcripción Cloudflare separada, útil para el estudio de inglés, pero una transcripción textual por sí sola no es una evaluación fonética completa.
- `components/aprender/OrbyBoard.tsx` y `lib/ai/orby-board-actions.ts`: ya existen pizarra SVG progresiva, trazos animados, foco docente, círculos/subrayados, secuencias idempotentes, multipágina, zoom y desplazamiento. La capa visual no debe reconstruirse: hay que conectarla al flujo de voz streaming y sincronizar acciones con el audio.

### Gemini Live existente

- `app/api/orby/realtime-session/route.ts` crea sesiones con Google GenAI y aplica una comprobación de acceso que limita Gemini Free a probadores adultos verificados; bloquea al resto de usuarios estudiantiles. También exige confirmación de cuota gratuita y consentimiento de uso de datos.
- La ruta no se debe abrir a estudiantes simplemente cambiando el nombre visible del asistente a OmegaX. El nombre de marca no modifica los términos del proveedor.

### Banco visual

- `lib/ai/orby-visual-bank.ts` contiene un banco local tipado de esquemas didácticos (por ejemplo, célula, ADN, molécula de agua, átomo y procesos). `LessonAITutor.tsx` ya importa `expandOrbyVisualBankSnapshot`.
- `app/api/orby/generate-image/route.ts` genera imágenes adicionales con Flux Schnell bajo cuota limitada; no es un banco curado ni debe sustituirlo.
- Diseño objetivo: mostrar primero un indicador de carga discreto, después revelar la ilustración del concepto; sincronizar la explicación con puntero, círculo, subrayado y zoom/scroll de pizarra. Evitar imágenes generadas cuando ya exista un recurso curado correcto.

## Arquitectura propuesta para la prueba Cloudflare Agents Voice

1. Worker independiente bajo `cloudflare/omegax-voice/`, sin mover Next.js ni alterar producción.
2. `withVoice(Agent)` + Durable Object; cliente React mediante `useVoiceAgent` o `VoiceClient`.
3. Audio del navegador por WebSocket en PCM 16 kHz mono. Mantener la llamada abierta, recibir transcripción provisional y detectar fin de intervención en servidor.
4. STT continuo: `WorkersAIFluxSTT` (el proveedor documenta flujo continuo e interrupciones).
5. LLM de respuesta: reutilizar el tutor de PeakScore con el filtro ICFES del servidor, historial acotado, cancelación por `AbortSignal` y salida incremental. No exponer claves de proveedor al navegador.
6. TTS streaming: `WorkersAITTS` con `@cf/deepgram/aura-1`, voz elegida tras prueba de español colombiano. Debe compararse naturalidad, pronunciación, prosodia, tiempo a primer audio y calidad con la voz del navegador.
7. Interrupción: el habla del estudiante durante reproducción aborta la generación/TTS actual; se conserva el último checkpoint válido de texto y pizarra y se atiende la nueva pregunta.
8. Pizarra: transmitir eventos estructurados versionados (`actionId`, `sequence`, `turnGeneration`, IDs de elemento y foco) desde el mismo turno que genera el texto. El cliente anima trazos y acciones, pero el servidor valida el contenido. Nunca ejecutar instrucciones arbitrarias desde el modelo.
9. Sesión y datos: autenticación de un solo uso entre Next.js y Worker, autorización por usuario/conversación, límites de duración, rate limit y cierre explícito. No persistir audio crudo por defecto; almacenar texto y checkpoints necesarios con política clara.
10. Fallback: si el Worker o la cuota fallan, ofrecer chat escrito o modo de transcripción; nunca cambiar a proveedor facturable silenciosamente.

## Coste y cuota: condición de aceptación

Cloudflare publica una asignación gratuita de 10.000 Neurons por día en Workers AI, con reinicio a las 00:00 UTC. La tabla de precios actualizada indica que Aura-1 consume 1.363,64 Neurons por cada 1.000 caracteres sintetizados (equivalente a $0,015/1.000 caracteres como precio unitario); Flux STT por WebSocket consume 700 Neurons/minuto y Whisper Large v3 Turbo 46,63 Neurons/minuto. Por tanto, 10.000 Neurons permiten como máximo unos 7.333 caracteres de Aura-1 si no se consume absolutamente nada en STT ni LLM; una clase de 10 minutos no puede darse por garantizada gratuitamente sin medir su consumo total. La documentación también indica que Durable Objects forman parte de Workers Paid desde $5/mes, así que el Worker propuesto no es automáticamente coste cero. La implementación debe:
- usar solo la asignación gratuita disponible;
- contabilizar STT, LLM y TTS conjuntamente con un límite diario conservador;
- reservar presupuesto antes de cada inferencia;
- detener la llamada antes de superar el saldo gratuito;
- no activar Workers Paid, AI Gateway credits, claves de terceros ni facturación por fallback;
- no desplegar Durable Objects ni activar el diseño Agents hasta verificar si el entorno requiere Workers Paid (la documentación de Workers indica un mínimo de $5/mes para Workers Paid y uso de Durable Objects); si requiere pago, detener esa ruta y buscar una arquitectura compatible con Free.
- La clase continua Agents Voice es técnicamente prometedora, pero con los precios actuales de Aura-1 y Flux no se puede afirmar que una llamada de 10 minutos quepa en la cuota diaria gratuita. Hay que medir y hacer prueba de consumo antes de prometerla.

La cifra interna de 8.000 Neurons ya usada por PeakScore no debe asumirse suficiente para la voz completa: hay que estimar y medir el coste real de cada componente. Aura-1 tiene precio unitario publicado por caracteres y consume parte de la asignación de Neurons; la voz completa puede agotar el cupo antes que el flujo actual.

## Inglés: pronunciación

Cloudflare Whisper puede transcribir inglés, detectar omisiones y comparar la frase reconocida con el texto objetivo. Eso permite feedback de inteligibilidad y palabras detectadas, pero no basta para afirmar que mide con precisión fonemas, acento, ritmo o entonación. Para una evaluación fonética real se necesita un proveedor/modelo que entregue alineación fonética, timestamps o puntuaciones de pronunciación. No presentar una simple transcripción como una calificación de pronunciación.

## Pruebas de aceptación antes de conectar al alumnado

- Conversación continua de 10 minutos sin reiniciar la sesión.
- Tiempo a primera respuesta hablada y estabilidad de audio.
- Interrumpir al tutor en 10 puntos distintos; comprobar cancelación inmediata y que no reaparece audio antiguo.
- Preguntar mientras dibuja; conservar la pizarra y atender la pregunta.
- Prueba de trazos, círculo, subrayado, foco, desplazamiento y zoom en una clase larga.
- Español colombiano, nombres propios, fórmulas, cifras y términos ICFES.
- Filtros: programación, temas fuera de Saber 11, promoción de otros preICFES, emojis y atribuciones falsas.
- Persistencia de conversación y checkpoint al recargar.
- Cuota: comprobar reserva, agotamiento, reinicio UTC y bloqueo de cualquier ruta facturable.
- Prueba en Chrome de escritorio y móvil; medir latencia, CPU, memoria y desconexiones.

## Estado real al cerrar esta revisión

- Investigación oficial realizada; Cloudflare Agents Voice es técnicamente compatible con el patrón de clase continua e interrupciones.
- Repositorio inspeccionado en `feat/founder-intro`; se confirma que la voz Cloudflare actual es por turnos, no full-duplex.
- No se ha añadido `agents`, no se ha creado el Worker, no se ha desplegado nada y no se ha ejecutado una prueba de audio real.
- No se ha cambiado `main`, no se han modificado secretos, configuración remota, cuotas ni planes.
- Siguiente paso de implementación: construir el Worker aislado, validar su coste real y después integrar el cliente en la vista actual de OmegaX.


## Corrección de costes — 2026-11-09

- La tabla oficial de Workers AI expresa también Neurons por modelo: Aura-1 = 1.363,64 Neurons/1.000 caracteres; Flux WebSocket STT = 700 Neurons/minuto; Whisper Large v3 Turbo = 46,63 Neurons/minuto.
- La asignación gratuita de 10.000 Neurons/día no hace que Aura-1 sea ilimitado: solo alcanzaría para ~7.333 caracteres de voz si no se utilizara ningún otro modelo.
- Cloudflare Workers Paid cuesta desde $5/mes y la documentación indica que Durable Objects se facturan bajo Workers Paid. No desplegar Agents Voice hasta resolver si la arquitectura requiere plan pagado.
- Conclusión: Agents Voice sí soporta el patrón técnico de conversación continua e interrupciones, pero aún no hay una ruta demostrada que cumpla el requisito estricto de coste cero para clases largas. No se promete una clase de 10 minutos gratis hasta medirla y comprobar costes de infraestructura.


## Decisión operativa de OmegaX y Schedules — 2026-11-09

- El aula de OmegaX usa la integración Gemini Live ya existente para la sesión bidireccional (con acceso sujeto a las restricciones de proveedor descritas en la auditoría). English Studio se enruta por separado al flujo de voz Cloudflare para transcripción y feedback textual; no se debe describir esa ruta como evaluación fonética acústica completa.
- Se deja de tratar Cloudflare Agents Voice como reemplazo inmediato del aula Gemini Live. Sigue siendo una alternativa experimental, pero sus costes de TTS y Durable Objects no cumplen aún la condición demostrada de coste cero.
- La operación recurrente del conocimiento se programa en Vercel Schedules cada 15 minutos, con jitter 15 y endpoint protegido. Schedules solo despierta el worker cuando toca; no mantiene un proceso ni una llamada de voz abierta continuamente.
- El estado de cola/embeddings, flags Preview, build fail y pendiente de despliegue quedan registrados en docs/OMEGAX-STUDDY-REFERENCE-AUDIT.md §10.14 y en el contexto/changelog.

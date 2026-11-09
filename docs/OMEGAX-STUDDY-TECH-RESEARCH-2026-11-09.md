# Investigación técnica de Studdy: imágenes, voz y economía freemium

**Fecha de revisión:** 2026-11-09  
**Rama de PeakScore:** `feat/founder-intro`  
**HEAD al iniciar esta investigación:** `0500c31d9efda3b586f0c1a8c0310e4c0310b9ea`  
**Objetivo:** identificar patrones técnicos plausibles en Studdy sin afirmar proveedores no publicados ni copiar activos propietarios.

## 1. Conclusión ejecutiva

No existe evidencia pública suficiente para afirmar qué API/modelo exacto usa Studdy para voz o imágenes. Su política de privacidad vigente (actualizada el 8 de noviembre de 2026) confirma que maneja voz, dibujos de pizarra, archivos e imágenes, pero describe a terceros únicamente como proveedores de hosting, nube y servicios tecnológicos; no identifica a Google, OpenAI, ElevenLabs, Cartesia ni otro proveedor concreto.

La observación del menú contextual del video sí es útil: si al hacer clic derecho sobre una ilustración aparece la opción nativa **«Copiar imagen»**, el objeto bajo el puntero probablemente es una imagen del DOM (por ejemplo, `<img>` con PNG/WebP/SVG o un recurso equivalente), no necesariamente un trazo pintado dentro de un canvas. Esto **no revela cómo se creó** ese archivo.

La hipótesis que mejor explica la experiencia observada es una arquitectura desacoplada:
1. un modelo docente genera el contenido de la explicación y una escena estructurada;
2. una capa visual coloca imágenes/ilustraciones junto a texto manuscrito, etiquetas y anotaciones;
3. un sistema de voz reproduce la narración, probablemente mediante TTS por fragmentos o un motor speech-to-speech;
4. los eventos visuales y de audio se coordinan por etapas semánticas.

Esta hipótesis es una inferencia de diseño a partir del video, no una declaración sobre la implementación privada de Studdy.

## 2. Qué se puede confirmar sobre Studdy

### 2.1 Producto y oferta gratuita

- La web actual del Whiteboard Tutor dice que la primera lección es gratis. No anuncia públicamente que las lecciones de pizarra sean ilimitadas y gratuitas.
- La ficha pública de la app móvil describe una oferta distinta: cinco escaneos diarios en el plan gratuito y tutoría por chat ilimitada; las lecciones 1:1, videos y funciones extra aparecen dentro de Studdy Plus.
- Por tanto, que un estudiante pueda iniciar una clase sin pagar **no prueba que la inferencia sea gratis**. Una primera lección puede ser un coste de adquisición financiado por suscripciones posteriores. También pueden limitar duración, número de escenas, frecuencia, tamaño de carga o usuarios elegibles; esos límites pueden variar por producto y país.
- Es perfectamente posible que una startup pague por alguna inferencia de usuarios gratuitos, amortizando ese coste con conversión a planes de pago. También puede combinar modelos económicos, caché y recursos pre-generados. No se puede determinar cuál de estas estrategias aplica Studdy.

### 2.2 Tecnología y proveedores públicos

- Y Combinator describe Studdy como un tutor multilingüe que emplea tecnologías avanzadas de reconocimiento de voz, texto e imágenes. Es una descripción de capacidades, no nombres de API.
- La política de privacidad recoge texto, archivos, fotos, videos, interacción de voz y dibujos de pizarra. Para proveedores externos, la política usa categorías genéricas y no publica una lista de modelos/proveedores.
- No se encontró documentación oficial pública que identifique el TTS, STT, LLM, generador de imágenes, proveedor de WebRTC o framework de pizarra de la versión web actual.
- Directorios y reseñas de terceros que etiquetan el modelo como «propietario» o «single model» no constituyen evidencia técnica fiable para determinar proveedores.

**Veredicto:** no declarar que Studdy usa Gemini Live, GPT Realtime, ElevenLabs, Cartesia, Imagen o GPT Image sin una fuente directa de Studdy.

## 3. La pista «Copiar imagen»: qué revela y qué no

### Lo que sí sugiere
- En navegadores habituales, «Copiar imagen» aparece cuando el clic contextual alcanza un recurso de imagen. Puede ser un PNG, JPEG, WebP o SVG servido por URL, data URI u otra representación compatible.
- Es consistente con que las ilustraciones del tablero sean objetos separados de la escritura y el texto. En los fotogramas del video, los diagramas de célula, división celular y cromosoma persisten mientras la explicación escrita progresa; eso es compatible con un asset visual insertado y reutilizado.
- La interfaz podría combinar texto con tipografía manuscrita, imágenes de diagramas, etiquetas HTML/SVG y controles de foco. El tablero puede sentirse como una pizarra continua sin que cada píxel sea un dibujo vectorial en un único canvas.

### Lo que no demuestra
- No identifica al proveedor de generación de imágenes.
- No demuestra que la imagen sea generada en tiempo real: puede venir de una biblioteca, una plantilla, una búsqueda interna, un archivo subido, un SVG construido por código o una imagen generada previamente.
- No demuestra que todo el tablero sea una imagen única. El texto y las imágenes pueden ser capas independientes.
- Tampoco descarta que la imagen haya sido generada con IA y luego guardada como PNG/WebP.

### Lectura visual de los MP4 aportados
- En la grabación larga se observan ilustraciones biológicas coloridas integradas a la clase: división celular, representaciones de células, cromosoma y personajes/estructuras. Aparecen con etiquetas y se conservan entre actualizaciones.
- La escritura y las imágenes no parecen tener necesariamente el mismo mecanismo de renderizado: la parte textual tiene apariencia manuscrita, mientras que varias ilustraciones parecen recursos gráficos autónomos.
- La decisión técnica de PeakScore no debe ser «convertir toda la pizarra en imágenes». Lo adecuado es admitir assets ilustrativos junto al tablero tipado y mantener texto, fórmulas y etiquetas como capas exactas y accesibles.

## 4. Arquitecturas posibles para las imágenes

### A. Modelo de imagen que genera un asset por concepto
Un modelo de imagen recibe un prompt didáctico y devuelve un PNG/WebP que el frontend muestra como imagen. Es una explicación plausible para el menú contextual y el estilo de algunas ilustraciones. El texto de fórmulas y etiquetas críticas debería añadirse después mediante SVG/DOM, porque el generador no debe ser la fuente de verdad de datos científicos.

**Ejemplo público de arquitectura (no Studdy):** el artículo de ingeniería de 9io, publicado el 29 de septiembre de 2026, documenta una versión de su propio tutor que separa un modelo de voz GPT-Live de un modelo docente de backend; este devuelve escenas JSON validadas y usa `gpt-image-2` para producir imágenes. Es un ejemplo real de arquitectura de voz + escenas + imágenes, pero no identifica el stack de Studdy.

### B. Biblioteca de imágenes/diagramas pre-curados
Los diagramas se recuperan de un catálogo o almacenamiento, por concepto/materia, y se insertan como imágenes normales. Esto reduce latencia y coste y permite repetir la misma ilustración sin regenerarla. Puede convivir con assets generados.

### C. Render de diagrama → SVG/PNG
Un modelo de lenguaje emite un esquema de nodos, relaciones y geometría; un renderer determinista lo convierte a SVG/PNG. El navegador puede permitir copiarlo como imagen si se carga como recurso `img`. Es especialmente adecuado para moléculas, circuitos, gráficas, célula y procesos, donde la corrección debe ser verificable.

### D. Híbrido recomendado para PeakScore
1. Renderizadores tipados propios (SVG) para fórmulas, ejes, flechas, etiquetas y relaciones exactas.
2. Assets científicos curados con atribución/licencia por archivo.
3. Imágenes generadas solamente como ilustración de apoyo, nunca como fuente de verdad de una fórmula o etiqueta.
4. Caché por concepto + versión de prompt/modelo + hash del asset.
5. Capacidad de insertar una imagen como recurso independiente junto a bloques de texto y dibujos incrementales.
6. Permitir copiar/abrir el recurso sin que una imagen de fondo sustituya la interacción de la pizarra.

## 5. Modelos de imagen investigados y coste/licencia

### GPT Image
- El artículo de 9io usa `gpt-image-2` en su propia arquitectura; eso prueba que es una opción técnica viable para un tutor visual, no que Studdy lo utilice.
- La ficha de OpenAI del modelo `gpt-image-2` indica que el nivel Free no está soportado para ese modelo. No es candidato para una ruta de producción con coste cero.
- Es un modelo generativo de imagen, no un renderer científico determinista. Aunque produzca un bonito diagrama, fórmulas, letras pequeñas, número de cromosomas y etiquetas de anatomía requieren validación/overlay.

### Gemini Image / Nano Banana
- La tabla oficial consultada para Gemini 3.1 Flash Image / Nano Banana 2 y Gemini 3 Pro Image muestra que el nivel gratuito no está disponible para generación de imágenes mediante API.
- No crear una API key ni habilitar facturación para esta función bajo la política actual de PeakScore.

### FLUX.1 Schnell
- El repositorio oficial de Black Forest Labs lista FLUX.1 [schnell] con licencia Apache-2.0; el modelo de 12B parámetros puede generar en 1–4 pasos.
- Es una opción de pesos abiertos para generación local o infraestructura GPU propia; no significa inferencia en nube gratis. El hardware mínimo es un condicionante fuerte. No es razonable prometer inferencia local fluida en los equipos modestos de los estudiantes.
- FLUX.1 [dev] y varios derivados tienen licencia no comercial; no mezclarlos con Schnell ni asumir que todo FLUX es comercialmente utilizable.

### Decisión de imagen
No crear una cuenta nueva ni integrar una API de generación de imágenes. Por ahora, construir un pipeline que acepte recursos de imagen con procedencia/licencia, y mejorar SVG tipado. Considerar un modelo local de pesos abiertos solo cuando exista una GPU/entorno real de generación y se haya comprobado su licencia.

## 6. Arquitecturas posibles para voz

### Hipótesis 1 — LLM + TTS por fragmentos (muy plausible para narración de clase)
1. El tutor produce texto docente breve y ordenado.
2. Se divide en fragmentos semánticos.
3. Un motor TTS convierte cada fragmento a audio, preferiblemente con streaming.
4. Los eventos de pizarra se emiten para el mismo fragmento o transición.
5. El cliente reproduce cada audio, permite interrumpir/cancelar y conserva el orden.

Ventajas: voz más uniforme, texto exacto, mejor control de pronunciación/pausas y una sincronización didáctica más manejable. Desventaja: hay que coordinar turnos, STT/VAD y cancelación; no es un único flujo speech-to-speech.

### Hipótesis 2 — speech-to-speech en tiempo real + herramientas de escena
Un modelo recibe audio, responde con audio y llama herramientas para construir la escena. La voz puede ser más conversacional y las interrupciones más naturales. La pizarra se mantiene desacoplada como herramienta no bloqueante. Es la arquitectura que hoy utiliza Orby para Live.

### Hipótesis 3 — voz en tiempo real delegada a un modelo docente
El modelo de voz conversa y delega razonamiento/uso de herramientas en un backend. El backend genera JSON validado y recursos visuales. El artículo técnico de 9io demuestra este patrón en un producto diferente y describe sus riesgos: latencia durante handoffs, eventos de fin de texto que no coinciden con fin del audio, exceso de visuales y respuestas duplicadas.

### Qué podría explicar la voz de Studdy
La observación del responsable del proyecto —la voz del video no parece Gemini Live— es una hipótesis razonable para investigar. Una voz consistente, de narración larga y con prosodia controlada encaja con TTS, pero no basta para nombrar proveedor. Posibles familias técnicas incluyen ElevenLabs, Cartesia, Google TTS u otro TTS neural, o un modelo speech-to-speech distinto de Gemini. Ninguna está confirmada para Studdy.

No se ha realizado una escucha perceptiva verificable de las pistas del MP4 en esta revisión; no se atribuye acento, timbre o proveedor.

## 7. APIs de voz y política de coste cero para PeakScore

### Gemini 3.8 Live — ya integrado en Orby
- El repositorio usa `gemini-3.8-live` en `app/api/orby/realtime-session/route.ts` y el SDK `@google/genai`.
- La tabla oficial actual indica nivel gratuito para Gemini 3.8 Live, con uso de contenido para mejorar productos de Google en ese nivel.
- El código ya exige confirmación explícita del nivel gratuito y aprobación de tratamiento de datos; producción también necesita el flag de activación existente. Mantener estas puertas cerradas hasta que el responsable apruebe el tratamiento de datos y confirme la cuenta/cuota real.

### Gemini 3.8 Flash-Lite TTS — ya integrado en Orby
- `app/api/orby/voice-speech/route.ts` usa `gemini-3.8-flash-lite-tts`, configuración de voz compartida y el mismo `GEMINI_API_KEY`.
- La tabla oficial actual muestra nivel gratuito para Gemini 3.8 Flash-Lite TTS y declara que el contenido del Free Tier se puede usar para mejorar productos de Google.
- El endpoint ya comprueba la puerta de nivel gratuito/privacidad, autentica al usuario, limita solicitudes y responde con un error claro si se agota cuota. No activa un proveedor pagado.
- Esto ofrece una vía de comparar TTS separado con la voz Live **sin crear una cuenta nueva ni añadir API**. No garantiza que su voz suene igual que Studdy ni que la cuota alcance para producción.

### ElevenLabs — interesante como referencia, no aprobado para PeakScore
- La página de desarrolladores anuncia 10.000 créditos gratuitos al mes y acceso a sus APIs.
- Sin embargo, su documentación legal indica que el plan gratuito no incluye licencia comercial; los outputs del plan gratuito son solo para uso no comercial y requieren atribución.
- Su política de uso también prohíbe usar servicios/output para investigar o desarrollar productos competidores. Por ese motivo no debemos usar su free tier para crear/testear un tutor de PeakScore sin autorización escrita y licencia adecuada, aunque ofrezca créditos gratis.
- Se conoce un caso público separado: Brilliant declara que eligió ElevenLabs para la voz de su tutor Koji después de probar proveedores. Esto confirma su uso en otro producto educativo, no en Studdy.

### Cartesia — interesante técnicamente, pero Free no sirve para producción comercial
- El plan Free anuncia 20K créditos mensuales para TTS y STT.
- Su página de precios coloca la licencia de uso comercial como beneficio de Pro, desde US$5/mes. El texto de Cartesia presenta Free como evaluación/uso personal.
- Por nuestra restricción de no introducir APIs pagadas, no seleccionarla para producción. No hacer pruebas con contenido de estudiantes ni activar claves sin una decisión explícita.

### Google Cloud Text-to-Speech
- Tiene cuotas gratuitas para determinadas voces, pero exige habilitar facturación; la propia documentación dice que se cobrará si el uso supera la cuota gratuita. No cumple la política actual de evitar cualquier riesgo de cargo automático.

### Google AI Edge / MediaPipe TTS local
- Ofrece síntesis local con modelos de pesos abiertos, incluyendo Kokoro-82M y PocketTTS 100M; se puede producir PCM directamente en dispositivo y transmitir chunks.
- Kokoro-82M tiene bundle cuantizado GPU de aproximadamente 295 MB y locale español; PocketTTS 100M para CPU ronda 760 MB y contiene locale español de España, no una variante colombiana específica.
- No requiere API externa ni facturación, pero hay que evaluar latencia, memoria, calidad, acento colombiano y compatibilidad en los equipos objetivo. Es una prueba local futura, no un reemplazo inmediato.

## 8. Estado real del código PeakScore revisado

La investigación se contrastó con la rama GitHub `feat/founder-intro`:

- `app/api/orby/realtime-session/route.ts`: usa Gemini Live nativo `gemini-3.8-live`; solicita audio, usa voz preconfigurada y comprueba las puertas de coste/privacidad.
- `app/api/orby/voice-speech/route.ts`: usa Gemini TTS `gemini-3.8-flash-lite-tts`; comparte `GEMINI_API_KEY`, limita texto/solicitudes y rechaza si no se confirmó Free Tier y privacidad.
- `app/api/orby/audio/transcribe/route.ts`: usa Cloudflare Workers AI como único proveedor de transcripción y se bloquea si la cuota gratuita no está confirmada; no hace cascada a otro proveedor.
- `lib/ai/orby-voice-config.ts`: voz configurada por defecto `Despina` y una guía de voz latinoamericana con pronunciación colombiana ligera.
- `components/aprender/LessonAITutor.tsx`: controla audio Live, reproducción, interrupciones, persistencia y fallback textual. También cancela la voz del navegador al cerrar/reiniciar.
- `lib/ai/orby-board.ts`, `lib/ai/orby-live-tools.ts`, `components/aprender/OrbyBoard.tsx`: contrato tipado, herramientas progresivas no bloqueantes y renderer SVG con snapshots acumulativos. El tablero no tiene aún un pipeline general de imágenes externas curadas/generadas como un tipo de asset independiente.

Nota: `package.json` contiene `openai`, pero la mera presencia de ese SDK no demuestra que la llamada de voz de Orby lo use. La ruta de sesión Live revisada instancia `GoogleGenAI` y usa Gemini.

## 9. Decisión técnica para Orby

### No cambiar todavía el proveedor principal
Mantener Gemini Live para la conversación manos libres porque ya está conectado, admite audio bidireccional y herramientas, y tiene una ruta Free Tier documentada con guardas de privacidad existentes.

### Ejecutar una comparación controlada de voz con el TTS que ya existe
Sin nueva API:
1. Grabar una frase común de 30–45 segundos en español colombiano con Live y con `gemini-3.8-flash-lite-tts`.
2. Comparar naturalidad, pausas, pronunciación de nombres científicos, fórmulas, velocidad, consistencia de voz y latencia de inicio.
3. Probar fragmentos de 1–2 frases, cola de reproducción, cancelación al interrumpir, evitar audio duplicado y recuperación de errores.
4. Registrar resultados de manera objetiva; no escoger un motor solo por un clip de demostración.

### Evolución de la arquitectura de clase
Explorar una modalidad docente con texto/escena como fuente de verdad y audio TTS fragmentado para narración extensa; conservar Gemini Live como modo conversacional e interrupciones. Los dos modos deben reutilizar el mismo contrato de tablero y estado de clase, con una cancelación unificada. No construir un segundo tutor independiente.

### Imágenes
Crear un registro interno de assets con `assetId`, URL de Storage propia, MIME, ancho/alto, texto alternativo, materia, concepto, fuente/licencia/atribución, hash y versión. La escena del tutor referencia `assetId`, nunca una URL arbitraria enviada por el modelo. El renderer coloca el recurso en la hoja y superpone etiquetas mediante SVG/DOM para mantener exactitud. Primero validar la infraestructura de storage y el presupuesto, después generar o curar contenido.

## 10. Nuevas cuentas / claves que se necesitan ahora

**Ninguna.** No se requiere crear cuentas ni claves nuevas para la comparación inicial, porque Orby ya dispone del endpoint de Gemini Flash-Lite TTS y del endpoint de Gemini Live bajo la misma configuración de Gemini. No se integró ElevenLabs, Cartesia, GPT Image, Nano Banana ni FLUX como servicio.

Antes de solicitar cualquier cuenta/API futura, se notificará:
- proveedor y función exacta;
- plan gratuito real y cuota vigente;
- licencia de uso comercial;
- si exige tarjeta o billing;
- datos que recibe y condiciones de privacidad;
- mecanismo técnico que bloquea consumo cuando se agota el nivel gratuito.

No se permitirá un fallback silencioso hacia un plan de pago. Si la cuota gratuita se agota, la función debe degradar o pausarse con un mensaje claro.

## 11. Restricciones y tareas pendientes

- No inferir proveedores privados de Studdy.
- No inspeccionar endpoints privados, tokens, bundles internos ni intentar eludir protecciones del servicio.
- No usar imágenes, textos o diseños propietarios de Studdy; tomar solo patrones funcionales generales.
- No crear cuentas nuevas, no modificar secretos, no habilitar billing, no tocar producción ni desplegar.
- No modificar `main`, no fusionar ramas ni aplicar migraciones remotas.

### Próximos pasos priorizados
1. Implementar comparación de voz Live vs Gemini Flash-Lite TTS con un guion educativo idéntico y métricas.
2. Diseñar el contrato `image-asset` del tablero con IDs curados, metadatos de licencia, caché, límites y URLs de Storage seguras; primero tests de sanitización y accesibilidad.
3. Crear 3 prototipos originales de imagen/asset (célula, mitosis y molécula) para probar integración en la pizarra existente sin generación externa.
4. Evaluar Kokoro/MediaPipe local en el equipo mínimo antes de decidir si merece un modo sin API.
5. Ejecutar CI del HEAD actual y QA manual de audio/interrupciones en Chrome después de cambios funcionales.

## 12. Fuentes principales

### Studdy — fuentes oficiales
- Web de Whiteboard Tutor y oferta de primera lección gratis: https://studdyai.com/
- Política de privacidad (actualizada 2026-11-08): https://studdyai.com/privacy-policy
- Términos: https://studdyai.com/terms-of-service
- App Store, descripción de plan Free y Plus: https://apps.apple.com/us/app/studdy-ai-tutor-math-solver/id6450114499
- Perfil público de Y Combinator: https://www.ycombinator.com/companies/studdy

### Arquitecturas de voz/imagen — referencias comparativas, no Studdy
- 9io Engineering, «What we learned building a voice tutor that draws while it talks» (2026-09-29): https://9io.ai/blog/voice-tutor-that-draws-realtime-speech
- Brilliant + ElevenLabs, caso público del tutor Koji (2026-05-29, actualizado 2026-10-28): https://elevenlabs.io/blog/brilliant-launches-personal-tutor-powered-by-elevenlabs

### APIs, modelos, precios y licencias
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini image generation: https://ai.google.dev/gemini-api/docs/image-generation
- OpenAI GPT Image 2 model: https://developers.openai.com/api/docs/models/gpt-image-2
- FLUX official repository and licenses: https://github.com/black-forest-labs/flux
- ElevenLabs free-plan use and commercial restrictions: https://elevenlabs.io/docs/es/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform
- ElevenLabs Terms: https://elevenlabs.io/terms-of-use
- Cartesia pricing: https://www.cartesia.ai/pricing
- Cartesia Sonic: https://www.cartesia.ai/sonic
- Google AI Edge MediaPipe TTS: https://developers.google.com/edge/mediapipe/solutions/audio/text_to_speech

**Última actualización:** 2026-11-09. La investigación no cambia código, proveedores, variables, datos de usuarios, facturación ni despliegues.

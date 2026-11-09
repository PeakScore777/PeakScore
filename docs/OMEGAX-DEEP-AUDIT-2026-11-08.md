# Auditoría profunda OmegaX / Orby — 2026-11-08

**Rama inspeccionada:** `feat/founder-intro`  
**Commit que añadió este informe:** `590f33f06592a118e07d5af6aec054ee4692bad7`. El SHA `99537c472b42fbea3e88cdc152f5b1010b202610` corresponde al `base_commit` reportado para `main` en la comparación consultada; no debe citarse como HEAD de `feat/founder-intro`.  
**Alcance:** revisión estática cruzada de tests, componentes, rutas API, filtros, proveedor, pizarra, English Studio, memoria de aprendizaje, documentación y estado de CI.  
**Importante:** la auditoría comenzó como revisión estática y derivó en correcciones de runtime y validaciones remotas de GitHub Actions. No se modificó `main`, no se aplicaron migraciones remotas de Supabase ni se desplegó producción. CI no sustituye QA manual de navegador.

## 1. Resumen ejecutivo

Se contaron **257 declaraciones `test()`** en `tests/orby-request-filter.test.mjs`. El archivo de salida de terminal aportado contiene **cuatro marcadores de prueba fallida**. El propio archivo no incluye el resumen TAP completo, por lo que no se infiere cuántas pasaron ni se inventa un porcentaje.

Los cuatro fallos no tienen la misma causa:

- **Los cuatro son fallos de aserciones estáticas demasiado literales**, no cuatro defectos funcionales demostrados.
- El cuarto fallo también es de comparación textual: el fallback sí contiene la salvaguarda MCER/ICFES, pero comienza con `El MCER...` y la expresión regular exige `el MCER...` con distinción de mayúsculas.

No se deben “arreglar” estas pruebas añadiendo cadenas artificiales al producto. Se deben actualizar para verificar el contrato semántico y el forwarding funcional sin exigir JSX exacto ni capitalización accidental. Con la evidencia de estos cuatro fallos no se confirma una regresión funcional del tutor; sí permanecen riesgos independientes descritos más abajo.

## 2. Los cuatro fallos de test: causa y corrección correcta

### 2.1 Etapas SVG — falsa alarma de la expresión regular

**Prueba:** `las etapas SVG inician sus trazos cuando llega su etapa espacial, no antes`  
**Ubicación observada:** test alrededor de la línea 5244.

La prueba exige literalmente:

`<Diagram visual={visual} startDelayMs={startDelayMs}/>`

El renderer actual sí pasa el retraso espacial, pero también pasa `focus={visualFocus}`:

`<Diagram visual={visual} startDelayMs={startDelayMs} focus={visualFocus}/>`

El retraso se usa dentro de Diagram para las apariciones de nodos y conexiones. La aserción falla por exigir que no existan props adicionales, no porque se haya eliminado `startDelayMs`.

**Corrección:** actualizar la prueba para aceptar y verificar el prop adicional, o comprobar explícitamente el forwarding de `startDelayMs` sin depender del orden exacto ni del cierre literal del JSX. Conservar pruebas de valores límite del helper y de estilos SVG. No quitar `focus` del componente.

### 2.2 English Studio — texto de speaking

**Prueba:** `OmegaX English Studio reuses the existing free transcription route and owner-scoped learning library`  
**Ubicación observada:** línea 5402.

La prueba busca `60-second speaking`, pero la interfaz actual usa el texto localizado `Speaking · 60 segundos`. El límite funcional sí está en el código: el temporizador limita la grabación a 60 segundos y detiene MediaRecorder al alcanzar ese máximo. También se conserva la ruta `/api/orby/audio/transcribe`.

**Corrección:** comprobar el texto de UI real y, sobre todo, el límite funcional (`Math.min(60, ...)` y parada al alcanzar 60 s). No introducir una frase inglesa artificial solo para satisfacer el test.

### 2.3 English Studio — aviso de certificación

**Prueba:** `OmegaX English Studio recorre los seis niveles CEFR A1-C2 con guías didácticas`  
**Ubicación observada:** línea 5482.

La prueba exige `no certificación oficial`. El texto actual expresa la misma salvaguarda con una redacción más clara: el nivel seleccionado es una meta de práctica y no es una certificación ni un nivel oficial de desempeño de Saber 11.

**Corrección:** comprobar el significado de la advertencia, no una frase rígida. Mantener visible la aclaración junto al selector A1–C2. No presentar el nivel elegido como diagnóstico certificado.

### 2.4 Live y fallback — diferencia real de instrucciones

**Prueba:** `Live y fallback enseñan inglés CEFR en pizarra y diferencian las cinco áreas ICFES`  
**Ubicación observada:** línea 5503.

La ruta Live y el fallback contienen la separación entre MCER A1–C2 e Inglés Saber 11. El fallback incluye literalmente `El MCER A1–C2 es una ruta general de aprendizaje...`; la prueba falla porque su regex `/el MCER A1–C2 es una ruta general de aprendizaje/` es sensible a mayúsculas y espera `el` en minúscula.

**Corrección:** hacer la regex case-insensitive (`/i`) o comprobar la frase sin depender de capitalización. No hace falta cambiar el prompt pedagógico por este fallo.

## 3. English Studio: estado funcional y límites comprobados

- El selector incluye A1, A2, B1, B2, C1 y C2, con descriptores y guías diferenciadas.
- Speaking tiene grabación local con tope de 60 segundos.
- Pronunciation usa frase modelo, grabación y transcripción; una transcripción textual no permite puntuar fonemas, acento ni entonación.
- Listening reproduce guiones de texto mediante `SpeechSynthesisUtterance` del navegador. No es todavía audio grabado de hablantes ni evaluación de comprensión de audio natural.
- Reading y Writing tienen tareas guiadas por nivel.
- La transcripción usa la ruta existente de Cloudflare Workers AI; el código declara ese proveedor como único proveedor de transcripción y aplica rate limit.
- Las actividades y bancos actuales son una base inicial. No equivalen a un curso completo ni a una evaluación MCER calibrada.
- La UI ya comunica que el nivel elegido es una meta didáctica, no una certificación.

**Riesgo de producto:** no anunciar todavía “dominio A1–C2 medido” ni “evaluación completa de las cuatro habilidades”. La descripción honesta es English Studio con prácticas guiadas A1–C2 y feedback basado en texto/evidencia disponible.

## 4. Arquitectura y calidad académica

### 4.1 Rutas y proveedores

- `app/api/lesson-tutor/route.ts`: tutor por turnos; autentica usuario, valida payload, verifica propiedad de conversación por `user_id`, aplica filtros, recupera contexto y genera mediante Cloudflare Workers AI.
- `app/api/orby/realtime-session/route.ts`: crea sesión Gemini Live con token efímero; filtra historial y metadatos, limita contexto y aplica reglas de alcance/idioma.
- `app/api/orby/realtime-turn/route.ts`: persiste turnos de voz con contrato idempotente.
- `app/api/orby/audio/transcribe/route.ts`: transcripción por el proveedor Cloudflare declarado.
- La ruta textual documenta explícitamente que no debe cambiar silenciosamente a otro proveedor cuando se agote la cuota gratuita. La ruta Live clasifica agotamiento de cuota y responde con error controlado; no debe interpretarse como autorización para usar una ruta facturable.

**Pendiente de verificación operacional:** la presencia de manejo de cuota en código no demuestra que las credenciales de Google/Cloudflare estén configuradas en modo gratuito ni que sus cuotas reales estén disponibles. Verificar configuración y comportamiento de agotamiento en entorno de prueba, sin provocar consumo ni activar billing.

### 4.2 Filtros y seguridad

- Hay preflight, filtros de alcance Saber 11, idioma, programación, promoción de otros preICFES, atribución falsa del creador e intentos de prompt injection.
- El historial previo se vuelve a filtrar antes de incorporarse a Live/fallback.
- La ruta de conversación verifica que el identificador pertenezca al usuario autenticado.
- El registro de eventos de seguridad falla de forma controlada y no debe filtrar secretos en logs.
- La protección final de salida no equivale a verificación académica semántica.

**Brecha alta:** la auditoría existente registra `qualityStatus = "not_required"` y `reviewMs = 0`. Las defensas finales son principalmente estructurales/deterministas y no existe un verificador semántico general que compruebe hechos, cálculos, unidades, cronologías y consistencia entre la explicación y el tablero. No introducir un segundo modelo pagado para resolverlo: priorizar validadores deterministas pequeños y casos de alto impacto.

### 4.3 Cobertura curricular de las cinco áreas

La función `buildIcfesPedagogyInstruction` y los perfiles de `lib/ai/orby-scope.ts` dan una base compartida a Live/fallback. Sin embargo, la auditoría previa reconoce que la matriz curricular estructurada no está integrada de manera verificable con la recuperación del conocimiento para las cinco áreas.

**Pendiente:** medir área → competencia → componente → tema → evidencia publicada recuperable. No reconstruir el contenido del Orby ICFES Lab eliminado intencionalmente.

## 5. Pizarra, voz y experiencia en vivo

- `OrbyBoard.tsx` ya soporta composición espacial, bloques y visuales tipados, foco, sketch y animaciones SVG.
- El test de etapas SVG falla por una expresión regular obsoleta; el forwarding del retraso a Diagram sí existe.
- La herramienta Live solicita snapshots acumulativos y operaciones incrementales con generación, secuencia e IDs.
- El cliente debe invalidar acciones antiguas tras interrupciones.
- La sincronización actual es por orden/eventos de contenido y no por alineación exacta palabra-a-palabra o timestamps fiables del audio.
- La pizarra puede seguir actualizándose mientras se reproduce audio, pero eso no certifica sincronía exacta con cada palabra.
- La aceptación real exige probar Chrome/micrófono, snapshots acumulativos, interrupciones durante dibujo/voz, retorno al chat y fallback.

**Brecha alta de QA:** no hay evidencia de una sesión real completa en navegador que demuestre la coreografía voz + pizarra en las cinco áreas. No declarar el objetivo de Studdy/Studley terminado solo por las animaciones o los tests estáticos.

## 6. Memoria adaptativa y persistencia

- English Studio separa señales por usuario, materia y destreza; la recuperación de señales de una destreza no debe mezclarse con otra.
- El código usa filtros de propietario y confianza para guardar señales.
- La consulta previa de Supabase registró cero señales existentes. Eso es estado vacío, no error ni motivo para inventar aprendizaje.
- La auditoría previa indicó que las señales no están consolidadas por repetición/recencia y que Live no guarda automáticamente cada evento oral.
- La migración de idempotencia de voz debe verificarse en entorno de prueba antes de afirmar que la persistencia activa está lista.
- No aplicar migraciones remotas ni cambiar RLS en esta fase de auditoría.

## 7. CI, build y estado de rama

- El workflow `.github/workflows/peakscore-checks.yml` define npm ci, auditoría de dependencias, `npm run test:orby`, TypeScript, ESLint y build de Next.
- El status consultado para el commit de referencia reporta Vercel `failure` con destino `build-rate-limit`. Ese estado no demuestra un error de compilación ni que el build haya terminado.
- La consulta de workflow runs asociadas no devolvió ejecuciones; por tanto no hay evidencia de CI verde.
- El historial de auditoría documenta restricciones de Vercel para previews y una preview READY antigua que no contiene los cambios recientes de English Studio. No presentarla como versión actual.
- El archivo de tests contiene 257 declaraciones, pero no es evidencia de que se hayan ejecutado todas.
- La comparación de ramas devuelve estado divergente, pero la respuesta del conector presentó contadores incompatibles con los registros previos. No utilizar esos números para decidir rebase/merge; refrescar refs y comparar SHAs exactos antes de cualquier integración.

## 8. Plan de corrección ordenado

1. Corregir las cuatro expectativas estáticas obsoletas sin alterar la UI ni los prompts que ya expresan el contrato correcto.
2. Resolver la contradicción de recuperación del Lab en el prompt Live: una sola política, opcional y coherente con la disponibilidad real del material.
3. Ejecutar de nuevo `npm run test:orby` y conservar la salida completa TAP, no solo los fragmentos de fallo.
4. Ejecutar `npx tsc --noEmit`.
5. Ejecutar `npm run lint`.
6. Ejecutar build únicamente cuando CI/preview esté disponible, sin provocar despliegues repetidos ni consumir cuota innecesaria.
7. QA manual de English Studio: micrófono, 60 s, permisos denegados, transcripción, guardar/recuperar y cinco destrezas.
8. QA de Live: sesión, audio, subtítulos, tablero acumulativo, interrupciones y fallback.
9. Revisar cuotas gratuitas y degradación controlada con una prueba que no consuma deliberadamente la cuota productiva.
10. Actualizar la documentación con resultados y SHA exactos. Solo después considerar merge; `main` permanece intacta.

## 9. Restricciones preservadas

- No modificar `main`.
- No desplegar ni intentar previews repetidos mientras el límite de Vercel esté activo.
- No aplicar migraciones remotas.
- No añadir proveedores, modelos, APIs, dependencias ni llamadas facturables.
- Si se agota una cuota gratuita, pausar/degradar con aviso claro; nunca cambiar silenciosamente a pago.
- No reconstruir material eliminado intencionalmente del Orby ICFES Lab.
- Mantener a Orby como tutor especializado en Ciencias Naturales y a OmegaX como asistente general de estudio.

**Resultado de esta tanda:** auditoría estática ampliada y cuatro fallos clasificados. No se afirma que el código esté corregido ni que tests, TypeScript, ESLint, build o QA de navegador estén aprobados.


## Addendum de precisión — revisión posterior del mismo HEAD

### Reclasificación de los cuatro fallos

Una inspección línea por línea de las cuatro aserciones y del código actual corrige la clasificación anterior:

1. **SVG / Diagram:** el test exige el JSX sin props adicionales; el componente actual pasa también `focus={visualFocus}`. El retraso `startDelayMs` sí se transmite.
2. **Speaking:** el test busca la cadena exacta `60-second speaking`; la UI muestra `Speaking · 60 segundos` y `Your 60-second challenge`. El temporizador corta la grabación al llegar a 60 s.
3. **Aviso de certificación:** el test busca `no certificación oficial`; la UI expresa la misma salvaguarda con la frase “no es una certificación ni un nivel oficial de desempeño de Saber 11”.
4. **MCER en fallback:** el contenido sí está presente. La regex de la prueba es sensible a mayúsculas y espera `el MCER...`, mientras que el prompt empieza con `El MCER...`.

Por tanto, los cuatro fallos visibles son falsos positivos de pruebas estáticas literales. Esto no demuestra que toda la suite esté verde ni que no existan otros defectos.

### Calidad del conjunto de pruebas

- El archivo contiene 257 declaraciones `test()`, 0 nombres duplicados y aproximadamente 2.297 aserciones.
- Un análisis heurístico del archivo identifica 128 pruebas centradas en lectura/assert de fuentes y otras 35 que mezclan inspección de fuente con ejecución de lógica. Esta proporción hace que la suite sea sensible a refactors de JSX, wording y organización interna.
- Mantener los tests estáticos para contratos críticos, pero mover validaciones de comportamiento a módulos puros ejecutables y pruebas de integración: sanitización, ownership, cuotas, idempotencia, secuencia/cancelación de acciones y paridad Live/fallback.
- La salida de terminal adjunta se encuentra truncada y no conserva el resumen TAP final. No es correcto inferir el total de aprobadas a partir de ella.

### Revisión de recuperación Live — falsa alarma descartada

Una lectura contextual más precisa de `app/api/orby/realtime-session/route.ts` y del esquema `ORBY_LIVE_KNOWLEDGE_TOOLS` aclara que las dos reglas hablan de herramientas distintas:

- `USO SELECTIVO DE INTERNET` regula la búsqueda pública externa: solo cuando el estudiante pide fuentes, actualidad o verificación.
- `ORBY LAB Y CONOCIMIENTO` regula la búsqueda interna de fragmentos privados publicados en el Lab: una llamada no bloqueante ante una pregunta académica nueva y sustantiva, con un máximo de dos por turno cuando el segundo resultado pueda resolver una necesidad pendiente.

No existe contradicción semántica entre web pública y recuperación privada interna. **Se descarta el hallazgo anterior** y no se cambia ese prompt. Se mantienen las reglas de no bloquear voz, no afirmar que se recuperó material antes de recibir resultado y continuar enseñando con conocimiento fiable cuando la búsqueda no devuelve contenido. El material eliminado intencionalmente del Lab no se reconstruye.

### CI y referencia de rama

- El workflow real es `.github/workflows/peakscore-checks.yml`: instala con `npm ci`, ejecuta auditoría de dependencias, `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npx next build`.
- La consulta de estado sobre SHA `99537c4...` devolvió Vercel `build-rate-limit`, pero ese SHA aparece como `base_commit` de `main` en la comparación. No atribuir ese estado a la rama de trabajo.
- La consulta de workflow runs asociadas a ese SHA no devolvió ejecuciones. No hay evidencia suficiente para declarar CI verde para el HEAD actual de `feat/founder-intro`.
- La comparación entre refs reportó `diverged`; los contadores del conector no se usan para planear un merge. Antes de integrar, obtener SHAs exactos de ambas refs y comparar el rango correcto.

### Riesgo de coste — verificación operacional pendiente

El tutor por turnos y la transcripción usan Cloudflare Workers AI; el código detiene/degrada ante cuota y no cambia silenciosamente de proveedor. Gemini Live y algunos procesos de embeddings/perfil documental usan Gemini API con comentarios de uso de AI Studio/free tier y manejo de cuota. El código fija el modelo Live y no acepta un override arbitrario, pero **no puede demostrar por sí solo que el proyecto Google tenga la facturación deshabilitada**. Verificar la configuración del proyecto y las cuotas en consola sin activar billing ni provocar consumo deliberado. Mantener el requisito: si no se puede garantizar cuota gratuita, desactivar la ruta afectada y mostrar aviso.

**Estado del addendum:** auditoría estática; no se modificó código de runtime, `main`, Supabase remoto ni despliegues.

## Addendum — ejecución real de CI y nuevas correcciones (2026-11-08)

### Primera ejecución de GitHub Actions

- Run: [42536069416](https://github.com/PeakScore777/PeakScore/actions/runs/42536069416)
- SHA: `794968c3fd9b94bee0ae451c513a1b4f30c43fe6`.
- Resultado: `npm run test:orby` falló con **260 pruebas: 251 aprobadas y 9 fallidas**. TypeScript, ESLint y build quedaron omitidos por el orden del workflow.
- El paso de auditoría de dependencias terminó correctamente. La causa global de fallo fue el conjunto de tests, no Vercel.

### Clasificación de las nueve fallas

Las nueve fueron aserciones que no reflejaban los contratos actuales; no se demostró una regresión funcional en esos nueve puntos:

1. El test de rutas gratuitas todavía exigía la comprobación directa `process.env.GEMINI_API_KEY`; se cambió a exigir `isGeminiFreeTierConfigured()`.
2. El test de estado de Autopilot esperaba que una API key activara la disponibilidad; se cambió a la puerta de plan gratuito.
3. El test de `clear-focus` invocaba `sanitizeOrbyBoard` en `orby-board-actions.ts`, módulo que no exporta esa función. La sanitización de tablero pertenece a `orby-board.ts`; se corrigió la referencia del test.
4. El test de movimiento reducido omitía `!important` presente en la regla CSS real.
5. El test del lápiz esperaba un `animateMotion` anterior a la incorporación de `calcMode`, `keyPoints`, `keyTimes` y `keySplines`; se actualizó al contrato vigente.
6. El test del lienzo espacial omitía `elementId={element.id}` al comprobar el render de cada visual.
7. El test de propagación de retraso espacial esperaba que `Molecule`, `Circuit` y `Cell` no recibieran el prop adicional `focus`; se actualizó para verificar que el foco interno también se propaga.
8. El test de English Studio dependía de una frase informativa retirada y de una descripción textual antigua del proveedor. Se cambió a verificar que la transcripción se utiliza y que la ruta consulta el guard de Cloudflare.
9. El test de la guía C2 esperaba una secuencia literal abreviada; el texto vigente incluye explícitamente significados implícitos, matices semánticos, ironía, tono, estilo e idiomaticidad.

La salida completa confirmó además que los tests 258, 259 y 260 añadidos para sanitización y puertas de plan gratuito sí pasaron en esa ejecución.

### Segunda ejecución

- SHA sometido a CI: `5f0bbfe3c81cfe060b8b4e31ebe64bc5225c0502`.
- Run: [42536456444](https://github.com/PeakScore777/PeakScore/actions/runs/42536456444).
- Estado al redactar esta actualización: en curso; no se da por aprobada la suite.

### Controles de coste incorporados en esta fase

Se agregó `lib/ai/provider-free-tier.ts` como módulo `server-only`. Los proveedores de inferencia ahora requieren dos condiciones: credenciales existentes y una confirmación explícita de cuenta sin coste:

- `PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED`
- `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED`
- `PEAKSCORE_GROQ_FREE_TIER_CONFIRMED`
- `PEAKSCORE_LLM7_FREE_TIER_CONFIRMED`

Todos quedan en `false` en `.env.example`. Son declaraciones operativas, no una detección automática del plan comercial. No activar un flag hasta comprobar la consola de la cuenta correspondiente. La falta de confirmación bloquea la solicitud antes de llamar al proveedor.

Rutas y procesos protegidos:
- Router de Groq, Gemini y LLM7; la selección de fallbacks filtra cualquier proveedor no confirmado.
- Cloudflare Workers AI, incluyendo tutor textual, imágenes, análisis, embeddings y transcripción.
- Gemini Live, TTS, análisis visual, embeddings/perfiles y Files API de lectura de PDFs.
- Worker, reanudación de cola, automatización administrativa y cron de indexación.
- Cliente OpenAI legado sustituido por un export de compatibilidad que lanza `OPENAI_PROVIDER_DISABLED`; no construye el SDK ni puede generar una solicitud OpenAI.
- `LLM7_BASE_URL` ya no puede redirigir el token a un host alternativo; el endpoint se fija en el origen aprobado.

Límite de esta protección: el código no puede consultar ni certificar automáticamente el plan de facturación del proveedor. La confirmación debe hacerse manualmente en la consola de cada cuenta. Hasta entonces el comportamiento correcto es fallar cerrado.

### Riesgo de retirada — embeddinggemma-300m

La implementación usa `@cf/google/embeddinggemma-300m`, con salida validada de 768 dimensiones. La documentación oficial de Cloudflare marca el modelo como planned deprecation para **20 de noviembre de 2026** y advierte que desde esa fecha responderá `410 Gone` (`5028`). Cloudflare menciona `@cf/google/embeddinggemma-2` como reemplazo “available soon”:

- Modelo y fecha: https://developers.cloudflare.com/workers-ai/models/embeddinggemma-300m/
- Aviso de retirada y reemplazo: https://developers.cloudflare.com/changelog/product/workers-ai/

La base de datos y las funciones de búsqueda usan `extensions.vector(768)`; no se debe cambiar de forma aislada a un embedding de dimensión distinta ni mezclar modelos en el mismo espacio vectorial. Plan seguro: verificar que `embeddinggemma-2` esté disponible, confirmar experimentalmente que devuelve 768 dimensiones, comprobar compatibilidad de búsqueda y después decidir si se reindexan los documentos. Si el reemplazo no está listo para la fecha de retirada, usar el proveedor de embeddings ya soportado y confirmado como gratuito, o degradar temporalmente a búsqueda léxica; nunca enviar peticiones a un modelo retirado ni crear facturación como fallback.

### Restricciones y estado de esta tanda

- Solo `feat/founder-intro`; `main` no se ha modificado.
- Sin despliegue y sin migraciones remotas de Supabase.
- No se añadieron proveedores de pago, modelos nuevos ni dependencias.
- No se afirma que TypeScript, ESLint, build o QA de navegador estén aprobados. La segunda CI debe terminar antes de cerrar el lote.


## Addendum — cierre de la primera fase correctiva (2026-11-08)

### Defectos de runtime corregidos

- `lib/ai/orby-board-actions.ts`: se corrigió el sanitizador de la etiqueta de foco. Las expresiones con escapes duplicados podían alterar letras, acentos y contenido académico en etiquetas. Se centralizó el saneamiento de la etiqueta con el helper correcto y se añadió una regresión que conserva texto español, siglas y fórmulas, además de retirar etiquetas/controles inseguros.
- `components/aprender/OrbyBoard.tsx`: TypeScript no podía estrechar el foco opcional al leerlo repetidamente desde `board.teacherFocus`. Se captura una sola vez en `teacherFocus` y se deriva el foco de sketch/visual desde ese valor.
- `components/aprender/OmegaXEnglishStudio.tsx`: el cronómetro de speaking ahora inicia en `MediaRecorder.onstart`, no al pedir permiso de micrófono. Usa `performance.now()` para medir duración monotónica y evita que el tiempo de permisos se compute como tiempo hablado.
- `app/api/import.pdf/route.ts`: se encontró un cliente Gemini directo que no pasaba por el router. Se eliminó la construcción del cliente a nivel de módulo, se hizo lazy, se aplicó `isGeminiFreeTierConfigured()` antes de las llamadas y se movió el bloqueo después de autenticación y verificación de rol admin, antes del rate limit y de procesar el documento. La regresión comprueba que el cliente no se construye a nivel superior y que la puerta precede a cualquier operación de importación.

### Protección de coste y privacidad aplicada a todas las rutas de inferencia localizadas

- `lib/ai/provider-free-tier.ts` es `server-only`. Gemini, Groq, LLM7 y Cloudflare requieren credenciales más confirmación operativa de plan sin coste. Las flags están apagadas por defecto en `.env.example`.
- Gemini requiere además `PEAKSCORE_GEMINI_DATA_USE_APPROVED=true`, separada de la confirmación de no coste. La Free Tier de Gemini declara que el contenido puede usarse para mejorar productos; no se debe activar sin una decisión explícita de privacidad. Esta flag representa aprobación del operador y no sustituye una política/consentimiento legal con los estudiantes.
- Se protegieron router y fallbacks, tutor, embeddings/perfiles, visión, Live, TTS, Gemini Files, transcripción, worker/cola/cron y automatización administrativa.
- El cliente OpenAI legado ahora lanza `OPENAI_PROVIDER_DISABLED` y no instancia SDK ni envía solicitudes.
- `LLM7_BASE_URL` dejó de aceptar overrides; el host se fija para evitar redirección del token.
- El panel de conocimiento ya no confunde “no hay credenciales” con “hay claves pero no hay proveedor habilitado”. Comunica que los flags son atestaciones operativas y que la cuota restante no se consulta automáticamente.
- Este mecanismo falla cerrado, pero no consulta por sí mismo el nivel de facturación de una cuenta. Solo activar cada flag tras comprobar la consola real del proveedor. Sin esa verificación, el servicio permanece deshabilitado.

### Estado de validación automatizada

- Run [42536897095](https://github.com/PeakScore777/PeakScore/actions/runs/42536897095), SHA `c31e7c11c5766ab4120fab400ae081a47141f5ce`: **éxito completo** de npm ci, auditoría de dependencias, 260/260 tests, TypeScript, ESLint y `next build`.
- Run [42537054107](https://github.com/PeakScore777/PeakScore/actions/runs/42537054107), SHA `4a7e21230deb385b94860848cf6bc4d71e7712b9`: **éxito completo** de npm ci, auditoría de dependencias, tests, TypeScript, ESLint y `next build). Este SHA incluye la puerta de uso gratuito/datos en la importación de PDFs y la prueba correspondiente.
- Después de ese build verde se ajustó el endpoint PDF para autenticar/verificar rol admin antes de devolver el estado del proveedor. El SHA `a0c859d8d88cf749a55f86bfab30e8697dc351f2` quedó validado por run [42537169406](https://github.com/PeakScore777/PeakScore/actions/runs/42537169406), con tests, TypeScript, ESLint y `next build` aprobados.
- El commit documental `5fa9fc8df55aac393c3d2ae244fc49b1eb80ee20` (este informe, la bitácora Live y el changelog) también pasó el pipeline completo: run [42537279655](https://github.com/PeakScore777/PeakScore/actions/runs/42537279655).
- El pipeline pasó por fallos reales de TS y ESLint durante la iteración; ambos se corrigieron y la ejecución `c31e7c11` verificó tests/TS/ESLint/build íntegros.

### Riesgos abiertos que no se deben ocultar

1. **Gemini/Cloudflare/Groq/LLM7:** verificar manualmente nivel de facturación y cuota real. No basta con que la documentación del modelo anuncie una cuota gratuita. Mantener flags en `false` si no se puede certificar el plan.
2. **Privacidad Gemini Free:** no activar `PEAKSCORE_GEMINI_DATA_USE_APPROVED` sin evaluar que el proveedor pueda usar contenido para mejorar sus productos y documentar la decisión institucional. Si no se aprueba, Gemini permanece bloqueado.
3. **Retirada de EmbeddingGemma:** Cloudflare anuncia que `@cf/google/embeddinggemma-300m` dejará de responder el **20 de noviembre de 2026** con 410 Gone. El índice actual es de 768 dimensiones; no cambiar a un embedding de dimensión diferente ni mezclar vectores. Confirmar reemplazo y dimensiones, probar búsqueda y planear reindexación; hasta entonces degradar a búsqueda léxica si el vector service se retira.
4. **QA manual:** no se ha probado la clase Live de extremo a extremo con Chrome, micrófono, interrupción durante voz/trazo, reanudación, transcripción real y reducción de movimiento. Tampoco se ha validado listening con hablantes reales, ni pronunciación acústica: la transcripción no puntúa fonemas.
5. **Cobertura académica:** 260 tests dan regresiones técnicas, no certifican exactitud pedagógica, completitud curricular ni desempeño con estudiantes. No se han hecho pruebas con estudiantes.
6. **Supabase:** no se aplicaron migraciones ni se modificaron RLS. La auditoría de memoria sigue dependiendo de probar persistencia con usuarios reales/aislados en un entorno de prueba.

**Estado de esta fase:** rutas principales de inferencia localizadas y protegidas con puertas de coste/privacidad; el SHA `a0c859d` y el commit documental `5fa9fc8` pasaron 260 tests, TypeScript, ESLint, auditoría de dependencias y build. Siguen pendientes las verificaciones operacionales y el QA manual descritos arriba. Sin cambios a `main`, sin despliegues y sin migraciones remotas.


## Addendum — evolución UX audio-first (2026-11-08)

### Cambios aplicados a la interfaz y English Studio

- `components/aprender/LessonAITutor.tsx`: se retiró la burbuja del alumno «Tú · transcribiendo» del aula en vivo. Se conserva el reconocimiento de entrada dentro del protocolo Live para validación del turno, controles de seguridad y persistencia; no es visible ni se exige al estudiante que revise/envíe una transcripción.
- Los subtítulos de salida del profesor quedan desactivados por defecto y pueden activarse manualmente. La clase sigue exponiendo la pizarra y los controles de micrófono/salida.
- El aula de estudio reemplaza la tipografía Silkscreen por una sans serif de sistema; la estética pixel queda para los juegos. La estrella genérica pasa a iconografía BrainCircuit; los estados de progreso/apuntes usan GraduationCap y NotebookPen.
- `components/aprender/OmegaXEnglishStudio.tsx`: Speaking y Pronunciation muestran primero una acción de llamada, con prompt que conserva la habilidad y nivel CEFR A1–C2. La grabación/transcripción anterior se conserva en una sección opcional, cerrada inicialmente; Listening, Reading y Writing siguen siendo tareas de sus respectivas destrezas.
- La interacción Live existente continúa siendo bidireccional por audio. No se relajaron los filtros de idioma, identidad, alcance académico o seguridad para reproducir audio antes de validar la salida. Por ello no se promete latencia cero.
- Si Gemini Live no está habilitado, falla o no dispone de cuota, el modo por turnos puede tardar más; debe comunicarse explícitamente. No se agrega fallback facturable ni se cambian las puertas de proveedor.

### Pruebas y límites

- Se añadieron dos casos estáticos a `tests/orby-request-filter.test.mjs`; el archivo contiene ahora 262 declaraciones `test()`. Este recuento no afirma que la suite se haya ejecutado.
- GitHub Actions debe validar el HEAD que contiene estos cambios antes de declararlos aprobados.
- QA manual pendiente: Chrome, permisos, micrófono, primera respuesta hablada, interrupciones, subtítulos optativos, cierre de llamada, roleplays reales de speaking y pronunciation para diferentes niveles CEFR.
- No se han realizado pruebas con estudiantes. Las pruebas estáticas no validan pronunciación, calidad pedagógica ni latencia percibida.
- No hay cambios a `main`, despliegue, migraciones remotas ni variables/flags/secrets de proveedores.

La especificación de referencia visual y comportamiento queda en `docs/OMEGAX-STUDY-WORKSPACE-UX.md`.

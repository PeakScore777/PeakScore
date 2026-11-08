# Auditoría profunda OmegaX / Orby — 2026-11-08

**Rama inspeccionada:** `feat/founder-intro`  
**Commit que añadió este informe:** `590f33f06592a118e07d5af6aec054ee4692bad7`. El SHA `99537c472b42fbea3e88cdc152f5b1010b202610` corresponde al `base_commit` reportado para `main` en la comparación consultada; no debe citarse como HEAD de `feat/founder-intro`.  
**Alcance:** revisión estática cruzada de tests, componentes, rutas API, filtros, proveedor, pizarra, English Studio, memoria de aprendizaje, documentación y estado de CI.  
**Importante:** esta auditoría no equivale a ejecutar localmente el repositorio ni a QA en navegador. No se modificó código de runtime, `main`, Supabase remoto ni despliegues.

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

### Hallazgo funcional adicional — política contradictoria de recuperación Live

En `app/api/orby/realtime-session/route.ts`, la instrucción de uso selectivo de Internet dice que la búsqueda se reserva para solicitudes de fuentes, actualidad o verificación externa. Sin embargo, la instrucción siguiente ordena activar `search_orby_learning_knowledge` ante cada pregunta académica nueva y sustantiva. Son reglas incompatibles.

**Impacto:** Gemini Live puede seguir invocando recuperación para preguntas ordinarias, pese a que la política del proyecto y la documentación dicen que la recuperación es opcional. Esto puede añadir latencia, consumir cuota gratuita y crear ruido cuando el material publicado no está disponible.

**Prioridad:** alta. Unificar la instrucción: enseñar primero con conocimiento fiable; consultar solo si existe material publicado relevante y la recuperación está habilitada, o cuando el estudiante pida fuentes/actualidad/verificación. La búsqueda nunca debe bloquear voz ni clase. No reconstruir el Lab eliminado.

### CI y referencia de rama

- El workflow real es `.github/workflows/peakscore-checks.yml`: instala con `npm ci`, ejecuta auditoría de dependencias, `npm run test:orby`, `npx tsc --noEmit`, `npm run lint` y `npx next build`.
- La consulta de estado sobre SHA `99537c4...` devolvió Vercel `build-rate-limit`, pero ese SHA aparece como `base_commit` de `main` en la comparación. No atribuir ese estado a la rama de trabajo.
- La consulta de workflow runs asociadas a ese SHA no devolvió ejecuciones. No hay evidencia suficiente para declarar CI verde para el HEAD actual de `feat/founder-intro`.
- La comparación entre refs reportó `diverged`; los contadores del conector no se usan para planear un merge. Antes de integrar, obtener SHAs exactos de ambas refs y comparar el rango correcto.

### Riesgo de coste — verificación operacional pendiente

El tutor por turnos y la transcripción usan Cloudflare Workers AI; el código detiene/degrada ante cuota y no cambia silenciosamente de proveedor. Gemini Live y algunos procesos de embeddings/perfil documental usan Gemini API con comentarios de uso de AI Studio/free tier y manejo de cuota. El código fija el modelo Live y no acepta un override arbitrario, pero **no puede demostrar por sí solo que el proyecto Google tenga la facturación deshabilitada**. Verificar la configuración del proyecto y las cuotas en consola sin activar billing ni provocar consumo deliberado. Mantener el requisito: si no se puede garantizar cuota gratuita, desactivar la ruta afectada y mostrar aviso.

**Estado del addendum:** auditoría estática; no se modificó código de runtime, `main`, Supabase remoto ni despliegues.
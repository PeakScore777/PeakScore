# PeakScore — Plan de simulacros tipo ICFES
> Documento de continuidad del proyecto. Actualizarlo cuando se cambien decisiones, arquitectura, alcance o estado de implementación.

**Última actualización:** 2026-10-16  
**Repositorio:** `PeakScore777/PeakScore`  
**Rama de referencia:** `main`  
**Regla principal:** continuar sobre la arquitectura existente; no reconstruir PeakScore desde cero. No afirmar que algo funciona sin ejecutar las pruebas pertinentes.

## Objetivo
Construir una experiencia de simulacro fiel a Saber 11: cuadernillo digital continuo que se recorre verticalmente como un documento, hoja de respuestas independiente por sesión, guardado robusto, entrega definitiva, resultados detallados y explicaciones educativas con IA. Diseñar una calificación técnicamente honesta que no invente descuentos fijos por pregunta ni se presente como puntaje oficial del ICFES sin calibración.

## Referencia ICFES y conteos
- Sesión 1: **120 preguntas puntuables** de Matemáticas (25), Lectura Crítica (41), Sociales y Ciudadanas (25), Ciencias Naturales (29). El cuadernillo estándar tiene 143 preguntas incluyendo cuestionarios auxiliares.
- Sesión 2: **134 preguntas puntuables** de Matemáticas (25), Sociales y Ciudadanas (25), Ciencias Naturales (29), Inglés (55). El cuadernillo estándar tiene 159 preguntas incluyendo cuestionarios auxiliares.
- Los cuestionarios auxiliares no deben contarse como preguntas puntuables.
- El ICFES publica puntajes por prueba en escala 0–100 y un puntaje global 0–500. La metodología oficial usa Teoría de Respuesta al Ítem (TRI), modelo logístico de tres parámetros (3PL), con parámetros de dificultad, discriminación y pseudoazar. El puntaje no se obtiene simplemente como porcentaje correcto ni restando una cantidad fija por error.
- Fórmula global oficial documentada: índice global = (3×Lectura Crítica + 3×Matemáticas + 3×Ciencias Naturales + 3×Sociales y Ciudadanas + Inglés)/13; puntaje global = índice × 5, con redondeo según la metodología oficial. No usar esto para fingir equivalencia oficial si los puntajes por prueba no están calibrados.
- Fuente primaria: https://www.icfes.gov.co/wp-content/uploads/2026/03/17-marzo-guia-de-orientacion-saber-11-2026-2.pdf
- Metodología / boletín ICFES: https://www.icfes.gov.co/wp-content/uploads/2024/11/Boletin-1-como-se-generan-los-puntajes-en-las-pruebas.pdf
- Guía de orientación: https://www.icfes.gov.co/evaluaciones-icfes/saber-11/guia-de-orientacion-examen-saber-11/

## UX deseada
1. **Cuadernillo tipo documento:** una superficie continua y desplazable verticalmente, no una pregunta aislada con navegación obligatoria “1 >, 2 >”. Respetar instrucciones, pasajes compartidos, bloques, tablas, imágenes y opciones; conservar numeración del cuadernillo.
2. **Hoja de respuestas:** una tabla independiente para cada sesión. Mostrar número y opciones; permitir cambiar la selección y saltar a una pregunta desde la hoja. Estado visual para respondida/sin responder. Persistir la selección.
3. **Interacción sincronizada:** responder en el cuadernillo actualiza la hoja de respuestas, y navegar desde la hoja lleva a la pregunta correcta.
4. **Guardado:** guardar en servidor con intento asociado, recuperar progreso, validar ownership y estado. LocalStorage solo como respaldo de UX, no como fuente de verdad de la nota.
5. **Entrega:** pantalla de confirmación que advierta cuántas preguntas quedan sin responder. Tras confirmación, envío transaccional e idempotente; intento cerrado y respuestas inmutables.
6. **Resultados:** total, correctas, incorrectas y omitidas; desglose por materia y por pregunta; mostrar respuesta del estudiante y clave validada; explicación y refuerzo recomendado. No revelar clave antes de entregar.
7. **Anotaciones:** conservar y mejorar subrayado/marcador donde sea útil, sin perder su vínculo al bloque de texto/pregunta.
8. **Accesibilidad/responsividad:** teclado, contraste, móvil y escritorio; no depender solo del color para indicar estado.

## Motor de calificación — reglas obligatorias
- La clave correcta debe permanecer del lado servidor. El cliente nunca calcula ni envía el resultado oficial.
- En primera fase, informar conteos exactos y porcentaje bruto (claramente identificado como porcentaje de aciertos), sin traducirlo arbitrariamente a puntaje ICFES.
- No asignar penalizaciones manuales fijas por etiquetas “fácil/media/difícil”. Una pregunta fácil incorrecta no tiene una resta universal de 20 puntos; el efecto de un ítem depende del modelo calibrado y del patrón completo de respuestas.
- En fase posterior, investigar, implementar y validar estimación TRI con parámetros de ítem (a, b, c), tamaño/calidad de muestra, incertidumbre, calibración, anclaje y comparabilidad. No ajustar parámetros de preguntas solo por intuición o por una dificultad introducida manualmente.
- Etiquetar cualquier estimación propia como **“Estimación PeakScore”**, explicar su limitación y no llamarla puntaje oficial.
- Puntaje global estimado solo cuando las escalas por prueba sean defendibles y documentadas.

## Explicaciones con IA
- La IA explica después de que el servidor valide el resultado; no define la clave, no califica por su cuenta y no puede cambiar el intento.
- Entrada mínima: enunciado, contexto compartido, opciones, respuesta elegida, clave correcta y explicación/fuente aprobada.
- Salida: por qué la clave es correcta, por qué la elegida no lo es, concepto evaluado y consejo breve.
- Controlar coste, límites de uso, fallos/reintentos y no exponer claves a usuarios antes de entregar.

## Inglés — estructura de referencia de cuadernillo Calendario A 2026
- Parte 1: 5 descripciones y banco compartido de 8 palabras A–H; una palabra se usa como ejemplo, quedan 5 respuestas puntuables y 2 distractores. La letra de ejemplo no puede ser respuesta puntuable.
- Parte 2: 5 avisos; seleccionar dónde se puede ver cada aviso; opciones A–C e imagen/aviso requerido.
- Parte 3: 7 conversaciones, opciones A–C.
- Parte 4A: preguntas 97–104, cloze de 8 espacios, opciones A–C.
- Parte 4B: preguntas 105–112, cloze de 8 espacios, opciones A–C.
- Parte 5: 7 preguntas de comprensión literal, opciones A–C.
- Parte 6: 5 preguntas de inferencia, opciones A–D.
- Parte 7: verificar siempre el cuadernillo fuente vigente; se ha solicitado conservar 7A y 7B como conjuntos separados donde el cuadernillo Calendario A 2026 así lo presenta.
- No inferir numeración solo por el número de parte: comprobar el orden real del booklet y el mapeo del editor/banco/simulacro.
- Fuente base: PDF proporcionado en conversaciones previas: `SEGUNDA SESIÓN 2026 CALENDARIO A (1)(5).pdf` y `COMPENDIO INGLÉS 2026(4).pdf`. La versión exacta debe verificarse en los archivos disponibles antes de cambiar estructura.

## Arquitectura existente identificada (auditar antes de editar)
- `app/simulacros/[id]/page.tsx`: página cliente de examen; carga preguntas, gestiona respuestas, temporizador, anotaciones, progreso local/servidor y entrega. Archivo extenso (~1.889 líneas); no reescribir entero.
- `app/api/simulations/[id]/questions/route.ts`: carga simulación/preguntas; define `PUBLIC_QUESTION_FIELDS` y carga metadatos de conjuntos de inglés.
- `app/api/simulations/[id]/progress/route.ts`: recuperación y guardado de intento/respuestas.
- `app/api/simulations/[id]/finish/route.ts`: valida respuestas y delega calificación a RPC `finish_simulation_atomic`; la clave se consulta del lado servidor.
- `lib/services/question.service.ts`: tipo `Question`, actualmente incluye metadatos ingleses.
- `app/dashboard/question-bank/english/page.tsx`: página del banco por conjuntos de inglés.
- `app/dashboard/question-bank/new/EnglishManualEditor.tsx`: editor manual por partes de inglés.
- `package.json`: Next.js 16, React 19, TypeScript, Supabase; scripts `npm run build`, `npm run lint`.
- Los hashes deben consultarse de nuevo antes de editar, porque la rama puede cambiar.

## Hallazgos de auditoría inicial (2026-10-16)
- La página de simulacro ya contiene progreso local/servidor, anotaciones y entrega. Debe adaptarse cuidadosamente; no eliminar esas funciones.
- La ruta de preguntas excluye `correct_answer` y `explanation` del conjunto de campos públicos, lo cual es una protección que debe preservarse.
- La ruta de finalización delega a `finish_simulation_atomic`; auditar la función SQL y su idempotencia antes de tocar scoring.
- En `app/dashboard/question-bank/english/page.tsx` se detectó una numeración probablemente invertida: `(displayPart === 1 ? 85 : 80) + i`. Verificar y corregir para que Parte 1 empiece en 80 y Parte 2 en 85 según el cuadernillo objetivo.
- El editor manual y los checks de Supabase tienen restricciones específicas por parte; no cambiar constraints ni limpiar borradores sin inspección previa y respaldo.
- No asumir que cambios previos compilan: ejecutar build/lint y pruebas de flujo en local.

## Plan de trabajo por fases
### Fase 0 — Auditoría y seguridad (primero)
- Leer la página completa del simulacro, las tres rutas API y el SQL/RPC de `finish_simulation_atomic`.
- Verificar el esquema real de tablas de simulaciones, intentos y respuestas en Supabase.
- Trazar cómo se ordenan las preguntas, cómo se agrupan pasajes compartidos y cómo se asignan los números.
- Crear lista de hallazgos y pruebas de regresión. No ejecutar migraciones destructivas ni borrar datos del usuario.

### Fase 1 — Cuadernillo continuo
- Renderizar todas las preguntas de la sesión como documento desplazable, agrupando contexto común una sola vez cuando corresponde.
- Mantener controles de respuesta inline junto a cada pregunta.
- Preservar temporizador, anotaciones, navegación, recuperación de progreso y diseño responsive.
- Verificar que la ordenación no se altere entre API, UI, guardado y resultados.

### Fase 2 — Hoja de respuestas por sesión
- Componente reutilizable con 120/134 casillas en simulacros completos (excluyendo auxiliares).
- Estados: sin responder, respondida, pregunta actual; saltos por click.
- Para simulacros cortos, cantidad real de preguntas; no forzar 120/134.

### Fase 3 — Envío y resultados
- Confirmación con conteo de omisiones.
- Envío atómico e idempotente en servidor.
- Mostrar resultados por materia y pregunta, clave y explicación solo tras finalizar.
- No aceptar respuesta duplicada, pregunta ajena al intento, ni cambios después de completar.

### Fase 4 — Calificación
- Confirmar fórmula y salida real de RPC.
- Mantener score bruto verificable y separar cualquier estimación de escala.
- Diseñar pipeline de calibración antes de introducir TRI en producción.

### Fase 5 — Explicaciones IA y analítica
- Endpoint protegido, límites por plan, registro de errores/costes, caché por pregunta/respuesta cuando proceda.
- Recomendaciones de refuerzo derivadas de errores por competencia, con límites de confianza.

## Criterios de aceptación
- [ ] El cuadernillo se recorre verticalmente como documento; no fuerza una pregunta por pantalla.
- [ ] Pasajes, instrucciones e imágenes aparecen en el lugar correcto y no se duplican incorrectamente.
- [ ] La numeración coincide con el cuadernillo fuente.
- [ ] La hoja de respuestas muestra todas las preguntas puntuables de la sesión y navega a ellas.
- [ ] Selecciones y omisiones se guardan y recuperan correctamente.
- [ ] El servidor calcula el resultado con clave privada; no existe scoring confiado al cliente.
- [ ] El intento queda cerrado al entregar; repetir la solicitud no duplica ni cambia el resultado.
- [ ] Resultados desglosados por pregunta/materia coinciden con la clave.
- [ ] La IA solo explica resultados verificados y no cambia la calificación.
- [ ] `npm run build` y `npm run lint` se ejecutan y se documenta cualquier fallo.
- [ ] Pruebas manuales en simulacro corto, Inglés y sesión completa.

## Instrucción para continuar en otro chat
1. Leer este documento completo.
2. Revisar GitHub `PeakScore777/PeakScore` en `main` y Supabase del proyecto antes de asumir estado.
3. Recuperar hashes y contenido actual de cada archivo citado.
4. Empezar por Fase 0, informar hallazgos concretos y después aplicar cambios pequeños.
5. No rehacer arquitectura, no inventar rutas/tablas, no borrar preguntas/datos, no afirmar pruebas no ejecutadas.
6. Después de cada cambio, verificar diff y ejecutar las pruebas que permita el entorno. Actualizar este documento con hashes, cambios, pruebas y pendientes.

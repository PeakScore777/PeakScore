# PeakScore — Inglés ICFES: estado de implementación

Fecha: 14 de octubre de 2026  
Rama: `feat/english-seven-parts-foundation`

## Objetivo

Preparar PeakScore para representar las siete partes de Inglés sin reemplazar la arquitectura actual ni romper las preguntas legacy de opción múltiple A–D.

## Cambios en esta rama

- `lib/types/english-assessment.ts`: tipos compartidos para partes 1–7, formatos, opciones A–G, estímulos y validación del conjunto completo (incluye cinco descripciones únicas para el banco A–G y marcadores cloze).
- `lib/services/english-question-generator.ts`: prompt y parser estructurado para generar conjuntos por parte y rechazar cantidades, opciones, claves o estímulos que no cumplan el contrato.
- `supabase/migrations/20261014180000_add_english_assessment_contract.sql`: tabla `question_stimuli` con `expected_question_count` y columnas aditivas en `questions` (`question_format`, `english_part`, `stimulus_id`, `stimulus_position`, `options_json`, `question_metadata`). Conserva las columnas legacy y permite opciones estructuradas sin fingir cuatro opciones para formatos de tres opciones o Parte 1.
- `supabase/migrations/20261014190000_validate_format_aware_answers.sql`: valida respuestas contra las opciones del ítem o banco compartido, preservando las comprobaciones existentes de propiedad, intento, pertenencia al simulacro y calificación.
- `supabase/migrations/20261014193000_save_english_question_sets_atomic.sql`: publica estímulos y todos sus ítems dentro de una única transacción, inicialmente inactivos; solo `service_role` puede ejecutar el RPC.
- `supabase/migrations/20261014200000_review_english_question_sets.sql`: activa o desactiva un conjunto completo tras validar cantidades, posiciones, formato y claves.
- `app/api/simulations/[id]/progress/route.ts` y `app/api/simulations/[id]/finish/route.ts`: aceptan letras A–G en la validación superficial; la validación autoritativa corresponde a PostgreSQL.
- `app/api/simulations/[id]/questions/route.ts`: incluye campos de formato y carga estímulos asociados solo a las preguntas incluidas en el simulacro.
- `app/api/simulations/route.ts`: en prácticas de Inglés, selecciona conjuntos completos del banco y no corta grupos de matching, lectura o cloze; las demás materias mantienen la selección existente.
- `lib/services/question.service.ts`: amplía el tipo `Question` con metadatos y opciones estructuradas opcionales.
- `app/simulacros/[id]/page.tsx`: muestra opciones dinámicas y usa el contenido del estímulo como contexto alternativo.
- `app/dashboard/question-bank/new/page.tsx` y `app/dashboard/question-bank/page.tsx`: el generador muestra la selección de parte, previsualiza tres, cuatro o siete opciones y el banco muestra estímulos compartidos. Los ítems generados quedan pendientes de revisión y el administrador puede aprobar el conjunto completo. El editor manual legacy bloquea nuevas preguntas de Inglés para evitar saltarse la estructura.
- `app/api/admin/question-bank/english-stimuli/[id]/review/route.ts`: endpoint protegido para aprobar un conjunto completo tras comprobar el rol de administrador.

## Decisiones de compatibilidad

- Las preguntas antiguas continúan usando `option_a`–`option_d`.
- Las opciones estructuradas usan objetos `{ "key": "A", "text": "..." }`.
- La Parte 1 usa el banco compartido del estímulo, por lo que puede ofrecer A–G.
- La API no decide si E–G son válidas para una pregunta concreta: esa decisión se valida en la base de datos.
- Los estímulos no deben ser accesibles sin autenticación; las escrituras se reservan al servicio de servidor.
- Se eliminó la migración inicial redundante `20261014000000_add_english_seven_parts_foundation.sql`; no se debe recrear ni aplicar.

## Estado de aplicación

**Estos cambios están en GitHub en la rama indicada. No se han aplicado las migraciones a Supabase, no se han generado preguntas de Inglés reales y no se ha integrado a producción.** No se ha ejecutado TypeScript/ESLint/build en un entorno local en esta sesión. No desplegar ni aplicar migraciones antes de probarlas en una base separada.

## Validaciones pendientes antes de integrar

1. Revisar el diff completo de las cuatro migraciones y ejecutar las cuatro primero en una base de prueba.
2. Ejecutar ESLint y TypeScript/build con el entorno local del proyecto.
3. Probar preguntas legacy A–D: cargar, guardar progreso, recuperar, finalizar y calificar.
4. Probar pregunta estructurada con 3 opciones, con 4 opciones y un banco compartido A–G.
5. Confirmar que una letra que no exista en las opciones de la pregunta sea rechazada por ambos RPC.
6. Confirmar que el usuario no pueda acceder a estímulos de preguntas fuera de su simulacro, y que las escrituras de estímulos no se permitan al cliente.
7. La ruta de generación ya tiene una rama específica para Inglés, con selección de parte, validación estructural, control de similitud y guardado atómico. Falta ejecutarla en un entorno de prueba contra las migraciones.
8. La guía oficial Saber 11 2026-2 ya se revisó: confirma 55 preguntas de Inglés, siete partes, los porcentajes aproximados y las estructuras/opciones. No publica un número entero exacto por parte; no fijar una distribución interna como si fuera oficial.
9. Implementar el ensamblaje del simulacro completo desde el banco con una blueprint versionada y selección por conjuntos; la página de simulacro completo todavía es un aviso/placeholder.
10. Solo después de pasar las pruebas, generar preguntas originales, revisar sus respuestas y explicaciones, y conectar Inglés al simulacro completo.
11. La función de IA que explica respuestas incorrectas queda expresamente para una fase posterior, manual y separada.

## Hallazgos y correcciones de esta ronda

- Se detectaron dos bloques de validación SQL del guardado de conjuntos que tenían un `IF` sin excepción: uno para el banco de siete palabras/cinco descripciones y otro para el número de opciones individuales. Se añadieron las excepciones explícitas; antes de esto, esos casos inválidos podían continuar más allá de la validación prevista.
- La restricción de longitud de `options_json` ahora usa `CASE` para no llamar a `jsonb_array_length` cuando el valor no es un arreglo.
- La finalización de simulacros ahora rechaza respuestas repetidas para dos descripciones de la misma Parte 1/estímulo, además de la protección visual de la interfaz.
- La migración de respuestas ya admite A–G en las rutas de progreso/finalización; aun así, falta ejecutar pruebas integrales de guardado, recuperación y calificación.
- No se encontraron ejecuciones de GitHub Actions para la rama de trabajo. Vercel no ha confirmado build satisfactorio y las migraciones siguen sin aplicarse a Supabase.

## Correcciones adicionales de auditoría

- Se protegieron las validaciones JSON de opciones para no llamar a `jsonb_array_length` o `jsonb_array_elements` sobre valores que no sean arreglos, tanto al guardar conjuntos como al aprobarlos.
- La revisión editorial sigue limitada a `service_role`; el endpoint comprueba la sesión y el rol `admin` antes de invocarla.
- La selección del simulacro filtra preguntas activas y exige conjuntos completos según `expected_question_count`. Todavía debe probarse con grupos reales y con las RPC de progreso/finalización.
- Se confirmó mediante lectura del esquema de producción que la restricción actual de `questions.correct_answer` es A–D. La migración de la rama la amplía únicamente para admitir E–G en la Parte 1; esto no se ha aplicado a Supabase.
- No se ha ejecutado un build local desde esta sesión; el estado de Vercel consultado continúa pendiente.

## Advertencias de auditoría

- La rama ya incluye una ruta de generación estructurada para Inglés, pero todavía no se ha ejecutado ni probado contra las migraciones; no afirmar que funciona en producción.
- La migración de funciones SQL conserva el algoritmo de calificación previo; se debe revisar y probar en base de prueba antes de aplicarla a producción.
- La lista de opciones de la interfaz supone que las opciones estructuradas están ordenadas por clave A, B, C…; la validación de generación debe exigir ese orden.
- En la interfaz del simulacro se añadió una protección para Parte 1: una palabra del banco A–G no puede seleccionarse en otra descripción del mismo estímulo si ya está asignada. Falta probar el comportamiento con progreso guardado y recuperación de intento.
- No afirmar que Inglés está listo para producción hasta completar las pruebas anteriores.


## Continuación de auditoría — 14 de octubre de 2026

- Investigación de fuente primaria: se revisó la [Guía de orientación Saber 11 2026-2 del ICFES](https://www.icfes.gov.co/wp-content/uploads/2026/03/17-marzo-guia-de-orientacion-saber-11-2026-2.pdf), sección Inglés, pp. 63–65. Confirma 55 preguntas en el cuadernillo estándar, siete partes, pesos aproximados 11/11/11/18/16/11/22, Parte 1 con siete palabras A–G y cinco descripciones, Partes 2–5 con tres opciones y Partes 6–7 con cuatro.
- Se corrigió la regla del generador: únicamente Parte 1 exige múltiplos de cinco. Partes 4–7 admiten cantidades variables repartidas entre estímulos completos; se aplican límites editoriales por estímulo, no presentados como conteo oficial del ICFES.
- Se corrigió el formulario del banco para que no rechace cantidades que no sean múltiplos de cinco en lectura/cloze.
- Imágenes: fase posterior al texto estructurado y su revisión. Prioridad: avisos/señales originales para Parte 2; ilustraciones para conversaciones solo si mejoran la comprensión. Cada recurso debe tener texto alternativo, ruta/URL real verificada y estar enlazado al estímulo. Aún no se han generado ni almacenado imágenes.
- Sigue sin confirmarse build/TypeScript/ESLint ni prueba real de las migraciones. No se aplicaron migraciones a producción ni se guardaron preguntas nuevas en Supabase.

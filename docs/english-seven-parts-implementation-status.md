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
8. Confirmar el formato y las cantidades exactas de cada parte con la guía oficial vigente antes de generar el banco de preguntas.
9. Implementar el ensamblaje del simulacro completo desde el banco con una blueprint versionada y selección por conjuntos; la página de simulacro completo todavía es un aviso/placeholder.
10. Solo después de pasar las pruebas, generar preguntas originales, revisar sus respuestas y explicaciones, y conectar Inglés al simulacro completo.
11. La función de IA que explica respuestas incorrectas queda expresamente para una fase posterior, manual y separada.

## Advertencias de auditoría

- La rama ya incluye una ruta de generación estructurada para Inglés, pero todavía no se ha ejecutado ni probado contra las migraciones; no afirmar que funciona en producción.
- La migración de funciones SQL conserva el algoritmo de calificación previo; se debe revisar y probar en base de prueba antes de aplicarla a producción.
- La lista de opciones de la interfaz supone que las opciones estructuradas están ordenadas por clave A, B, C…; la validación de generación debe exigir ese orden.
- No afirmar que Inglés está listo para producción hasta completar las pruebas anteriores.

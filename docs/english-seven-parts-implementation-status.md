# PeakScore — Inglés ICFES: estado de implementación

Fecha: 14 de octubre de 2026  
Rama: `feat/english-seven-parts-foundation`

## Objetivo

Preparar PeakScore para representar las siete partes de Inglés sin reemplazar la arquitectura actual ni romper las preguntas legacy de opción múltiple A–D.

## Cambios en esta rama

- `lib/types/english-assessment.ts`: tipos compartidos para partes 1–7, formatos, opciones A–G, estímulos y validaciones de estructura.
- `supabase/migrations/20261014180000_add_english_assessment_contract.sql`: tabla `question_stimuli` y columnas aditivas en `questions` (`question_format`, `english_part`, `stimulus_id`, `options_json`, `answer_schema`, `correct_answer_data`, `question_metadata`). Conserva las columnas legacy.
- `supabase/migrations/20261014190000_validate_format_aware_answers.sql`: sustituye las funciones atómicas de guardado/finalización preservando las comprobaciones existentes de usuario, propiedad, intento, relación pregunta-simulacro y calificación; valida la respuesta contra las opciones estructuradas cuando existen.
- `app/api/simulations/[id]/progress/route.ts` y `app/api/simulations/[id]/finish/route.ts`: aceptan letras A–G en la validación superficial; la validación autoritativa corresponde a PostgreSQL.
- `app/api/simulations/[id]/questions/route.ts`: incluye campos de formato y carga estímulos asociados solo a las preguntas incluidas en el simulacro.
- `lib/services/question.service.ts`: amplía el tipo `Question` con metadatos y opciones estructuradas opcionales.
- `app/simulacros/[id]/page.tsx`: muestra opciones dinámicas y usa el contenido del estímulo como contexto alternativo.

## Decisiones de compatibilidad

- Las preguntas antiguas continúan usando `option_a`–`option_d`.
- Las opciones estructuradas usan objetos `{ "key": "A", "text": "..." }`.
- La Parte 1 usa el banco compartido del estímulo, por lo que puede ofrecer A–G.
- La API no decide si E–G son válidas para una pregunta concreta: esa decisión se valida en la base de datos.
- Los estímulos no deben ser accesibles sin autenticación; las escrituras se reservan al servicio de servidor.
- Se eliminó la migración inicial redundante `20261014000000_add_english_seven_parts_foundation.sql`; no se debe recrear ni aplicar.

## Estado de aplicación

**Estos cambios están en GitHub en la rama indicada. No se han aplicado las migraciones a Supabase de producción, no se han creado preguntas de Inglés y no se ha integrado a producción.** Vercel reporta un estado de preview pendiente para un commit de la rama; no se ha confirmado un despliegue completado. No mezclar ni desplegar el código nuevo antes de aplicar las migraciones en un entorno de prueba y verificar compatibilidad.

## Validaciones pendientes antes de integrar

1. Revisar el diff completo de las dos migraciones y ejecutar ambas primero en una base de prueba.
2. Ejecutar ESLint y TypeScript/build con el entorno local del proyecto.
3. Probar preguntas legacy A–D: cargar, guardar progreso, recuperar, finalizar y calificar.
4. Probar pregunta estructurada con 3 opciones, con 4 opciones y un banco compartido A–G.
5. Confirmar que una letra que no exista en las opciones de la pregunta sea rechazada por ambos RPC.
6. Confirmar que el usuario no pueda acceder a estímulos de preguntas fuera de su simulacro, y que las escrituras de estímulos no se permitan al cliente.
7. Adaptar `app/api/generate-questions/route.ts` para producir los formatos y persistir los metadatos nuevos. Todavía no está implementado.
8. Confirmar el formato exacto y las cantidades actuales por parte contra la guía oficial vigente antes de generar el banco de preguntas.
9. Solo después de pasar las pruebas, crear preguntas originales, revisar sus respuestas y explicaciones, y conectar Inglés al simulacro completo.

## Advertencias de auditoría

- El generador sigue siendo una tarea pendiente: estos cambios no producen preguntas nuevas por sí solos.
- La migración de funciones SQL conserva el algoritmo de calificación previo; se debe revisar y probar en base de prueba antes de aplicarla a producción.
- La lista de opciones de la interfaz supone que las opciones estructuradas están ordenadas por clave A, B, C…; la validación de generación debe exigir ese orden.
- No afirmar que Inglés está listo para producción hasta completar las pruebas anteriores.

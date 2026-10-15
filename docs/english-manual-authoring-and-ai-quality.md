# PeakScore — creación manual de Inglés y mejora de generación IA

Rama de trabajo: `feat/english-seven-parts-foundation`

## Decisión de producto

- Inglés se crea manualmente, por conjuntos vinculados a un estímulo compartido.
- La generación por IA queda reservada para Matemáticas, Lectura Crítica, Sociales y Ciudadanas, y Ciencias Naturales.
- No se reconstruye el banco ni se cambia el flujo de las preguntas legacy A–D de las demás materias.

## Cambios incluidos

1. `app/dashboard/question-bank/new/EnglishManualEditor.tsx`
   - Selector de las siete partes.
   - Estímulo compartido.
   - Parte 1: siete opciones A–G y cinco descripciones con respuestas distintas.
   - Partes 2 y 3: una pregunta por aviso/conversación y tres opciones.
   - Partes 4 y 7: marcadores cloze consecutivos `[[1]]`, `[[2]]`, etc.
   - Partes 5 y 6: preguntas vinculadas a una lectura; tres opciones en Parte 5 y cuatro en Parte 6.
   - Validación de campos, opciones y respuestas antes de enviar.
   - Los conjuntos se guardan inactivos y pendientes de revisión.
2. `app/api/admin/question-bank/english-stimuli/manual/route.ts`
   - Verifica sesión y rol admin en servidor.
   - Valida la estructura recibida y guarda el conjunto mediante la función atómica.
   - Nunca confía en que las validaciones del navegador sean suficientes.
3. `app/dashboard/question-bank/new/page.tsx`
   - Si el administrador selecciona Inglés en el formulario manual, abre el editor estructurado.
   - El formulario manual legacy de otras materias se conserva.
   - Inglés ya no aparece en el selector del generador IA ni en la generación masiva.
4. `app/api/generate-questions/route.ts`
   - Rechaza solicitudes IA de Inglés y dirige al flujo manual.
6. `app/dashboard/question-bank/batch/page.tsx` y `app/api/generate-question-batch/route.ts`
   - Excluyen Inglés de la generación masiva tanto en la interfaz como en el servidor.
   - Añade comprobaciones pedagógicas al prompt para las cuatro materias que siguen usando IA: diversidad real, distractores plausibles, evidencia textual, control de sesgos y verificación matemática/científica.
5. `supabase/migrations/20261014210000_restrict_direct_simulation_reward_grants.sql`
   - Corrección de permisos preparada en la rama; todavía no aplicada a producción.

## Dependencia de base de datos

El editor estructurado necesita las cuatro migraciones de Inglés ya presentes en esta rama:
- `20261014180000_add_english_assessment_contract.sql`
- `20261014190000_validate_format_aware_answers.sql`
- `20261014193000_save_english_question_sets_atomic.sql`
- `20261014200000_review_english_question_sets.sql`

La base de producción todavía no las tiene aplicadas. Por tanto, el formulario y la ruta están preparados en código, pero el guardado real del conjunto manual no funcionará hasta activar y validar ese esquema y sus RPC. No afirmar que ya se guardaron preguntas.

## Validación pendiente

- Ejecutar lint y build desde el entorno local del proyecto.
- Probar creación manual para cada una de las siete partes.
- Verificar que los conjuntos permanezcan inactivos hasta aprobarlos.
- Probar el renderizado, guardado de progreso y calificación de simulacros con cada formato.
- Regresión de preguntas legacy y simulacros existentes.
- Aplicar migraciones a Supabase solo después de revisar respaldo/recuperación y confirmar que las migraciones estén listas.

## Límites

Los cambios de código de esta rama no significan que producción esté desplegada o migrada. El contenido manual necesita revisión editorial humana antes de activar las preguntas.

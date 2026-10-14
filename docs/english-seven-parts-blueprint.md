# PeakScore — Blueprint técnico de Inglés ICFES (7 partes)

Fecha: 14 de octubre de 2026  
Rama de trabajo: `feat/english-seven-parts-foundation`  
Respaldo previo: `backup/english-foundation-2026-10-14`

## 1. Fuente oficial y límites

Base de referencia: Guía de orientación Saber 11.° 2026-2 publicada por el ICFES.

La guía describe siete partes y estos porcentajes aproximados: Parte 1 11 %, Parte 2 11 %, Parte 3 11 %, Parte 4 18 %, Parte 5 16 %, Parte 6 11 % y Parte 7 22 %. La prueba estándar contiene 55 preguntas de Inglés. La tabla oficial citada no fija una cantidad entera exacta por parte; por eso PeakScore no debe etiquetar una distribución interna redondeada como si fuera el número oficial exacto. El blueprint del simulacro completo debe versionarse y probarse contra los grupos de preguntas disponibles.

## 2. Formato funcional de cada parte

| Parte | Habilidad | Estructura del estímulo | Estructura de cada ítem | Opciones |
|---|---|---|---|---|
| 1 | Conocimiento lexical | Banco compartido de siete palabras, letras A–G | Una descripción por ítem; cinco descripciones por conjunto | Las siete palabras del estímulo; dos no se usan |
| 2 | Conocimiento pragmático | Aviso/señal; puede ser texto o imagen con texto alternativo | Elegir el lugar donde podría aparecer el aviso | A–C |
| 3 | Conocimiento comunicativo | Conversación breve entre interlocutores | Elegir la intervención que completa o responde adecuadamente | A–C |
| 4 | Conocimiento gramatical en contexto | Texto compartido con marcadores de espacios en blanco | Un ítem puntuable por espacio; el contexto debe conservar el texto completo | A–C |
| 5 | Comprensión literal | Texto de lectura compartido | Pregunta sobre información explícita; respuesta mediante paráfrasis | A–C |
| 6 | Comprensión inferencial | Texto de lectura compartido | Pregunta sobre intención del autor o aspectos generales/particulares que requieren inferencia | A–D |
| 7 | Conocimiento gramatical y lexical | Texto compartido con marcadores de espacios en blanco | Un ítem puntuable por espacio, combinando gramática y vocabulario en contexto | A–D |

Los porcentajes y descripciones se derivan de la guía oficial. La cantidad de ítems por grupo y los tamaños de los conjuntos de lectura/cloze deben quedar como datos de contenido versionados, no como constantes inventadas en el renderizador.

## 3. Modelo del banco de preguntas

### Estímulo compartido

`question_stimuli` representa el texto o recurso común a uno o varios ítems:

- `id`: UUID persistente.
- `stimulus_type`: `word_bank`, `notice`, `conversation`, `reading_text` o `cloze_text`.
- `content`: instrucciones y/o contenido textual del estímulo. En cloze, contiene marcadores explícitos de espacios, por ejemplo `[[1]]`, `[[2]]`.
- `options_json`: banco compartido de siete palabras A–G para Parte 1; nulo en los demás formatos salvo una necesidad validada.
- `image_url`, `image_alt`: recurso visual opcional. No se debe inventar una imagen ni confiar en que un generador de texto produzca el visual final.
- `metadata`: metadatos acotados, no la clave de respuesta.

### Ítem puntuable

Cada pregunta es un registro individual en `questions`, para mantener compatible el motor de simulacros y las respuestas por pregunta:

- `question_format`: uno de los siete formatos de Inglés o `legacy_multiple_choice`.
- `english_part`: entero 1–7; nulo para preguntas legacy y materias no inglesas.
- `stimulus_id`: referencia al estímulo compartido.
- `stimulus_position`: posición del ítem dentro de ese estímulo/conjunto.
- `question`: descripción, pregunta o instrucción específica del ítem.
- `options_json`: opciones individuales ordenadas para Partes 2–7. Cada elemento usa `{ key, text }`.
- `correct_answer`: letra de la respuesta correcta. A–G solo se permite en Parte 1; las demás partes usan las letras que correspondan a su número de opciones.
- `explanation`: explicación editorial de la respuesta, independiente de la función futura de tutoría por IA.
- `question_metadata`: habilidad, tipo de tarea, nivel MCER estimado si fue revisado, número de espacio, revisión editorial y otros metadatos no sensibles.

Se conservan `option_a`–`option_d` para no romper preguntas y materias actuales. Las preguntas legacy siguen usando el camino A–D. No se debe leer `correct_answer_data` ni `answer_schema` como claves paralelas si el formato sigue siendo selección múltiple de única respuesta; mantener una sola fuente de verdad para la calificación.

## 4. Reglas de agrupación y generación

La generación de Inglés debe producir conjuntos completos, no preguntas aisladas sin contexto:

- Parte 1: un estímulo/banco A–G y cinco descripciones vinculadas por `stimulus_id`; las respuestas correctas deben ser letras A–G y no se debe repetir una palabra correcta si el conjunto de descripciones no lo permite.
- Parte 2: cada aviso tiene su propio estímulo visual/textual y un ítem con tres opciones de lugares.
- Parte 3: una conversación breve y un ítem con tres intervenciones posibles.
- Parte 4: un texto cloze con marcadores de espacios y un ítem por espacio, cada uno con tres opciones.
- Parte 5: un texto de lectura y un conjunto de preguntas literales, cada una con tres opciones.
- Parte 6: un texto de lectura y preguntas inferenciales, cada una con cuatro opciones.
- Parte 7: un texto cloze y un ítem por espacio, cada uno con cuatro opciones.

Un conjunto se guarda de manera consistente: primero se crea el estímulo y después todos los ítems que lo referencian; si falla la escritura de algún ítem, el conjunto no debe quedar parcialmente publicado. La creación/edición del banco debe validar el conjunto completo antes de marcar sus preguntas como activas.

## 5. Cómo deben usarlo los simulacros

- El banco de preguntas es la fuente de contenido. El simulacro completo no debe pedirle al modelo que invente preguntas durante el intento.
- El generador de simulacros selecciona preguntas activas del banco y registra sus IDs en `simulation_questions`, respetando el orden y la blueprint de la sesión.
- Para Partes 1, 4 y 7, la selección debe tener en cuenta el grupo de estímulo; seleccionar al azar una sola pregunta de un conjunto cloze/matching puede dejar el contexto incompleto o duplicar estímulos sin sentido.
- Para Partes 5 y 6, conservar las preguntas vinculadas al mismo texto cuando la selección del conjunto así lo requiera.
- Los objetivos por parte son configurables y versionados. Los porcentajes oficiales sirven como referencia de balance; los tamaños de grupos pueden obligar a resolver el reparto de forma controlada, sin afirmar que un redondeo de plataforma sea el reparto oficial exacto.
- Los simulacros simples existentes no se deben cambiar de comportamiento hasta que la ruta actual de creación haya sido auditada y las preguntas nuevas superen pruebas de regresión.
- La puntuación sigue siendo calculada en servidor comparando la respuesta guardada con la clave del registro de pregunta. Nunca enviar la clave correcta al cliente.

## 6. Presentación en banco y simulacro

- El banco debe identificar claramente la parte, el tipo de estímulo, el contenido compartido y los ítems que pertenecen al conjunto.
- En el simulacro de una pregunta por pantalla, mostrar el estímulo completo en cada ítem asociado, para que el estudiante no pierda el contexto al navegar. Para cloze, resaltar el marcador del espacio correspondiente.
- Parte 1 muestra las siete palabras etiquetadas A–G junto a la descripción actual; no se deben convertir esas palabras en cuatro opciones tradicionales.
- Parte 2 debe admitir un aviso en texto o imagen accesible con texto alternativo.
- Parte 3 presenta los turnos de conversación de forma legible.
- Partes 4 y 7 mantienen el texto con el espacio actual destacado y muestran las opciones propias de ese espacio.
- Partes 5 y 6 muestran el texto de lectura y la pregunta concreta con su número de opciones correcto.
- La interfaz nunca muestra `correct_answer` ni metadatos de respuesta durante el intento.

## 7. Tutoría por IA: fuera de esta fase

La futura función de IA que explique preguntas falladas se implementará en una fase separada, manual y explícita. En esta etapa solo se conserva la explicación editorial de cada pregunta y se prepara el contenido estructurado para que más adelante la IA pueda recibir la pregunta, el estímulo, las opciones, la respuesta del estudiante y la explicación autorizada. No crear ahora un chat automático, consumo de tokens ni llamadas adicionales a proveedores.

## 8. Orden seguro de implementación

1. Revisar el diff de la rama y conservar el respaldo sin modificarlo.
2. Corregir y simplificar el contrato de datos antes de aplicar cualquier migración: una sola clave de respuesta, agrupación explícita y restricciones coherentes.
3. Implementar validación de conjuntos de estímulos e ítems.
4. Adaptar el generador existente solo en la ruta de Inglés, preservando la generación legacy de las otras materias.
5. Adaptar la lectura/renderizado del banco de preguntas y del simulacro.
6. Implementar selección de simulacro desde el banco por grupos y blueprint versionada, sin generación en tiempo de examen.
7. Ejecutar pruebas en entorno de desarrollo: preguntas legacy A–D, Parte 1 A–G, Partes 2–5 A–C, Partes 6–7 A–D, persistencia, recuperación, finalización, calificación, estímulos compartidos y selección de grupos.
8. Solo después de pruebas satisfactorias, crear preguntas originales revisadas y activar Inglés en una rama de integración.

## 9. Límites actuales

Este documento es la especificación de trabajo. No significa que el generador, el banco, la selección de simulacros o la interfaz estén completos. Las migraciones no deben aplicarse a producción antes de revisar su SQL y probarlas en una base separada. La tutoría por IA está expresamente fuera de alcance en esta fase.

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const VALID_SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
] as const;

const VALID_DIFFICULTIES = [
  "Fácil",
  "Media",
  "Difícil",
] as const;

type Subject = (typeof VALID_SUBJECTS)[number];

function isValidSubject(value: unknown): value is Subject {
  return (
    typeof value === "string" &&
    VALID_SUBJECTS.includes(value as Subject)
  );
}

function isValidDifficulty(value: unknown): boolean {
  return (
    typeof value === "string" &&
    VALID_DIFFICULTIES.includes(
      value as (typeof VALID_DIFFICULTIES)[number]
    )
  );
}

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. CREAR CLIENTE SUPABASE
    // =========================================================

    const supabase = await createClient();

    // =========================================================
    // 2. VERIFICAR USUARIO
    // =========================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // 3. RECIBIR FORMULARIO
    // =========================================================

    const formData = await req.formData();

    const file = formData.get("file");
    const subject = formData.get("subject");
    const session = formData.get("session");

    // =========================================================
    // 4. VALIDAR ARCHIVO
    // =========================================================

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No se recibió un archivo válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "El archivo debe ser un PDF.",
        },
        {
          status: 400,
        }
      );
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "El PDF no puede superar los 20 MB.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // 5. VALIDAR MATERIA
    // =========================================================

    if (!isValidSubject(subject)) {
      return NextResponse.json(
        {
          error: "Materia no válida.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // 6. VALIDAR SESIÓN
    // =========================================================

    if (session !== "1" && session !== "2") {
      return NextResponse.json(
        {
          error: "Sesión no válida.",
        },
        {
          status: 400,
        }
      );
    }

    const sessionNumber = Number(session);

    // =========================================================
    // 7. VALIDAR GEMINI
    // =========================================================

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "No está configurada la GEMINI_API_KEY en .env.local",
        },
        {
          status: 500,
        }
      );
    }

    console.log("");
    console.log("=================================");
    console.log("IMPORTANDO PDF COMO REFERENCIA");
    console.log("Usuario:", user.id);
    console.log("Archivo:", file.name);
    console.log(
      "Tamaño:",
      `${(file.size / 1024 / 1024).toFixed(2)} MB`
    );
    console.log("Materia seleccionada:", subject);
    console.log("Sesión:", session);
    console.log("=================================");

    // =========================================================
    // 8. CONVERTIR PDF A BASE64
    // =========================================================

    const arrayBuffer = await file.arrayBuffer();

    const base64Pdf = Buffer.from(arrayBuffer).toString(
      "base64"
    );

    // =========================================================
    // 9. GUARDAR FUENTE DE REFERENCIA
    // =========================================================

    const storagePath =
      `reference-pdfs/${user.id}/${Date.now()}-${file.name}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("reference-pdfs")
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "ERROR SUBIENDO PDF:",
        uploadError
      );

      throw new Error(
        `No se pudo guardar el PDF: ${uploadError.message}`
      );
    }

    // =========================================================
    // 10. CREAR reference_sources
    // =========================================================

    const {
      data: referenceSource,
      error: referenceSourceError,
    } = await supabase
      .from("reference_sources")
      .insert({
        file_name: file.name,
        storage_path: storagePath,
        subject,
        session: sessionNumber,
        uploaded_by: user.id,
        status: "processing",
        total_questions: 0,
      })
      .select("*")
      .single();

    if (referenceSourceError || !referenceSource) {
      console.error(
        "ERROR CREANDO reference_sources:",
        referenceSourceError
      );

      await supabase.storage
        .from("reference-pdfs")
        .remove([storagePath]);

      throw new Error(
        referenceSourceError?.message ||
          "No se pudo crear la fuente de referencia."
      );
    }

    const referenceSourceId =
      referenceSource.id;

    console.log(
      "Reference source creado:",
      referenceSourceId
    );

    // =========================================================
    // 11. PROMPT DE ANÁLISIS
    // =========================================================

    const prompt = `
Eres el sistema de análisis pedagógico de PeakScore.

PeakScore es una plataforma educativa para preparación del ICFES.

Este PDF NO debe convertirse directamente en contenido público de
PeakScore.

El PDF es una FUENTE DE REFERENCIA.

Tu trabajo consiste en estudiar las preguntas existentes para identificar
sus características pedagógicas y estructurales.

IMPORTANTE:

NO debes crear preguntas nuevas.

NO debes modificar las preguntas.

NO debes inventar preguntas.

Debes analizar las preguntas que realmente aparecen en el PDF.

La materia indicada por el administrador es:

"${subject}"

La sesión es:

"${session}"

La materia indicada sirve como referencia administrativa, pero debes
clasificar cada pregunta según su materia REAL.


==================================================
MATERIAS PERMITIDAS
==================================================

- Matemáticas
- Lectura Crítica
- Sociales y Ciudadanas
- Ciencias Naturales
- Inglés


==================================================
OBJETIVO DEL ANÁLISIS
==================================================

Para cada pregunta debes identificar, cuando sea posible:

- área / materia
- tema
- componente
- competencia
- habilidad
- dificultad
- tipo de razonamiento
- tipo de estructura
- tipo de contexto
- estrategia de distractores
- complejidad de información
- si requiere información visual
- descripción visual
- contexto asociado
- características pedagógicas


NO te limites a describir superficialmente la pregunta.

Queremos entender QUÉ hace que esa pregunta evalúe determinada
habilidad y tenga determinado nivel de dificultad.


==================================================
IMPORTANTE SOBRE LAS PREGUNTAS
==================================================

Extrae únicamente preguntas que realmente existan en el PDF.

No inventes preguntas.

No combines preguntas.

No inventes opciones.

No inventes respuestas.

Cada pregunta debe conservar su contenido original.


==================================================
CONTEXTO
==================================================

Si una pregunta pertenece a un texto, caso, situación, lectura,
tabla, gráfica o contexto:

Conserva el contexto completo que sea necesario para comprender
la pregunta.

Si varias preguntas utilizan el mismo contexto, repite el mismo
context_text en cada una.

Si no existe contexto:

context_text = null


==================================================
ELEMENTOS VISUALES
==================================================

Analiza:

- imágenes
- mapas
- gráficas
- tablas
- diagramas
- caricaturas
- esquemas
- figuras
- infografías

Si la pregunta necesita información visual:

requires_visual = true

y:

visual_description = descripción del elemento visual.

Si no necesita información visual:

requires_visual = false

visual_description = null


==================================================
DIFICULTAD
==================================================

Clasifica únicamente como:

"Fácil"
"Media"
"Difícil"

La dificultad debe analizarse según:

- cantidad de información
- pasos de razonamiento
- complejidad conceptual
- necesidad de inferencia
- operaciones necesarias
- posibles errores
- complejidad de distractores
- relación entre contexto y pregunta


==================================================
RAZONAMIENTO
==================================================

Identifica el tipo de razonamiento predominante.

Ejemplos:

- interpretación
- inferencia
- comparación
- cálculo
- modelación
- análisis
- evaluación
- argumentación
- resolución de problemas
- identificación
- aplicación
- razonamiento proporcional
- razonamiento probabilístico

No inventes una categoría si no corresponde.


==================================================
ESTRUCTURA
==================================================

Describe cómo está construida la pregunta.

Por ejemplo:

- selección múltiple con contexto
- selección múltiple directa
- problema cuantitativo
- interpretación de gráfica
- análisis de texto
- situación problema
- experimento
- caso ciudadano
- comparación de información
- completar información

La descripción debe ser útil posteriormente para GENERAR preguntas
NUEVAS, pero no debe convertirse en una instrucción para copiar
la pregunta original.


==================================================
DISTRACTORES
==================================================

Analiza cómo funcionan las opciones incorrectas.

Por ejemplo:

- error de cálculo
- confusión conceptual
- interpretación parcial
- lectura superficial
- inversión de relación
- uso incorrecto de una fórmula
- conclusión que parece plausible
- confusión entre conceptos

No copies las opciones como estrategia.

Describe el patrón pedagógico.


==================================================
ANÁLISIS GENERAL
==================================================

Después de analizar todas las preguntas, genera perfiles generales:

difficulty_profile:
Patrones de dificultad encontrados.

topic_profile:
Temas y distribución aproximada.

competence_profile:
Competencias y habilidades evaluadas.

reasoning_profile:
Tipos de razonamiento predominantes.

structure_profile:
Estructuras de preguntas utilizadas.

context_profile:
Tipos de contexto utilizados.

generation_guidelines:
Reglas pedagógicas generales que deberían seguirse para crear
preguntas NUEVAS inspiradas en las características del PDF.

MUY IMPORTANTE:

generation_guidelines NO debe indicar cómo copiar o parafrasear
preguntas existentes.

Debe describir características pedagógicas generales.

Ejemplo:

"Las preguntas difíciles suelen requerir combinar dos fuentes de
información y justificar una inferencia."

NO:

"Copiar la estructura de la pregunta 14 cambiando los números."


==================================================
REGLA FUNDAMENTAL
==================================================

Las preguntas del PDF son REFERENCIAS PEDAGÓGICAS.

NO son contenido para copiar.

Posteriormente otra etapa del sistema utilizará estos análisis para
crear preguntas completamente nuevas.

Por lo tanto:

NO propongas modificaciones de las preguntas.

NO propongas paráfrasis.

NO propongas sustituciones de nombres.

NO propongas cambios de números.

NO generes preguntas nuevas.


==================================================
FORMATO DE RESPUESTA
==================================================

Devuelve EXCLUSIVAMENTE JSON válido.

Usa exactamente esta estructura:

{
  "analysis": {
    "summary": "Resumen general del material",
    "difficulty_profile": "Perfil de dificultad",
    "topic_profile": "Perfil de temas",
    "competence_profile": "Perfil de competencias",
    "reasoning_profile": "Perfil de razonamiento",
    "structure_profile": "Perfil estructural",
    "context_profile": "Perfil de contextos",
    "generation_guidelines": "Reglas pedagógicas generales para futuras generaciones"
  },
  "questions": [
    {
      "question_number": 1,
      "subject": "Matemáticas",
      "topic": "Probabilidad",
      "component": "Componente",
      "competence": "Competencia",
      "skill": "Habilidad",
      "difficulty": "Difícil",
      "reasoning_type": "Razonamiento probabilístico",
      "structure_type": "Situación problema",
      "context_type": "Contexto cotidiano",
      "distractor_strategy": "Errores conceptuales plausibles",
      "information_complexity": "Alta",
      "context_text": "Contexto completo o null",
      "question_text": "Pregunta original completa",
      "requires_visual": false,
      "visual_description": null,
      "analysis_notes": "Características pedagógicas de la pregunta"
    }
  ]
}

Analiza TODO el PDF antes de responder.
`;

    // =========================================================
    // 12. ENVIAR PDF A GEMINI
    // =========================================================

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf,
          },
        },
        {
          text: prompt,
        },
      ],

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: "object",

          properties: {
            analysis: {
              type: "object",

              properties: {
                summary: {
                  type: "string",
                },

                difficulty_profile: {
                  type: "string",
                },

                topic_profile: {
                  type: "string",
                },

                competence_profile: {
                  type: "string",
                },

                reasoning_profile: {
                  type: "string",
                },

                structure_profile: {
                  type: "string",
                },

                context_profile: {
                  type: "string",
                },

                generation_guidelines: {
                  type: "string",
                },
              },

              required: [
                "summary",
                "difficulty_profile",
                "topic_profile",
                "competence_profile",
                "reasoning_profile",
                "structure_profile",
                "context_profile",
                "generation_guidelines",
              ],
            },

            questions: {
              type: "array",

              items: {
                type: "object",

                properties: {
                  question_number: {
                    type: "number",
                    nullable: true,
                  },

                  subject: {
                    type: "string",
                    enum: [
                      "Matemáticas",
                      "Lectura Crítica",
                      "Sociales y Ciudadanas",
                      "Ciencias Naturales",
                      "Inglés",
                    ],
                  },

                  topic: {
                    type: "string",
                  },

                  component: {
                    type: "string",
                  },

                  competence: {
                    type: "string",
                  },

                  skill: {
                    type: "string",
                  },

                  difficulty: {
                    type: "string",
                    enum: [
                      "Fácil",
                      "Media",
                      "Difícil",
                    ],
                  },

                  reasoning_type: {
                    type: "string",
                  },

                  structure_type: {
                    type: "string",
                  },

                  context_type: {
                    type: "string",
                  },

                  distractor_strategy: {
                    type: "string",
                  },

                  information_complexity: {
                    type: "string",
                  },

                  context_text: {
                    type: "string",
                    nullable: true,
                  },

                  question_text: {
                    type: "string",
                  },

                  requires_visual: {
                    type: "boolean",
                  },

                  visual_description: {
                    type: "string",
                    nullable: true,
                  },

                  analysis_notes: {
                    type: "string",
                  },
                },

                required: [
                  "question_number",
                  "subject",
                  "topic",
                  "component",
                  "competence",
                  "skill",
                  "difficulty",
                  "reasoning_type",
                  "structure_type",
                  "context_type",
                  "distractor_strategy",
                  "information_complexity",
                  "context_text",
                  "question_text",
                  "requires_visual",
                  "visual_description",
                  "analysis_notes",
                ],
              },
            },
          },

          required: [
            "analysis",
            "questions",
          ],
        },
      },
    });

    // =========================================================
    // 13. OBTENER RESPUESTA
    // =========================================================

    const text = response.text;

    if (!text) {
      throw new Error(
        "Gemini no devolvió ninguna respuesta."
      );
    }

    console.log(
      "Respuesta de Gemini recibida correctamente."
    );

    // =========================================================
    // 14. PARSEAR JSON
    // =========================================================

    let result: any;

    try {
      result = JSON.parse(text);
    } catch {
      console.error(
        "RESPUESTA NO VÁLIDA DE GEMINI:"
      );

      console.error(text);

      throw new Error(
        "Gemini devolvió una respuesta que no es JSON válido."
      );
    }

    // =========================================================
    // 15. VALIDAR RESPUESTA
    // =========================================================

    if (
      !result ||
      typeof result !== "object" ||
      !result.analysis ||
      !Array.isArray(result.questions)
    ) {
      throw new Error(
        "Gemini no devolvió un análisis de referencia válido."
      );
    }

    console.log(
      `Gemini analizó ${result.questions.length} preguntas.`
    );

    // =========================================================
    // 16. VALIDAR PREGUNTAS DE REFERENCIA
    // =========================================================

    let invalidQuestions = 0;

    const validQuestions =
      result.questions.filter(
        (question: any) => {
          if (
            !question ||
            typeof question !== "object"
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            !isValidSubject(
              question.subject
            )
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.question_text !==
              "string" ||
            !question.question_text.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.topic !==
              "string" ||
            !question.topic.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.component !==
              "string" ||
            !question.component.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.competence !==
              "string" ||
            !question.competence.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.skill !==
              "string" ||
            !question.skill.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            !isValidDifficulty(
              question.difficulty
            )
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.reasoning_type !==
              "string" ||
            !question.reasoning_type.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.structure_type !==
              "string" ||
            !question.structure_type.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.context_type !==
              "string" ||
            !question.context_type.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.distractor_strategy !==
              "string" ||
            !question.distractor_strategy.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.information_complexity !==
              "string" ||
            !question.information_complexity.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.requires_visual !==
            "boolean"
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            question.requires_visual === true &&
            (
              typeof question.visual_description !==
                "string" ||
              !question.visual_description.trim()
            )
          ) {
            invalidQuestions++;
            return false;
          }

          if (
            typeof question.analysis_notes !==
              "string" ||
            !question.analysis_notes.trim()
          ) {
            invalidQuestions++;
            return false;
          }

          return true;
        }
      );

    console.log(
      `Preguntas válidas de referencia: ${validQuestions.length}`
    );

    console.log(
      `Preguntas inválidas: ${invalidQuestions}`
    );

    // =========================================================
    // 17. GUARDAR ANÁLISIS GENERAL
    // =========================================================

    const analysis = result.analysis;

    const {
      data: savedAnalysis,
      error: analysisError,
    } = await supabase
      .from("reference_analyses")
      .insert({
        reference_source_id:
          referenceSourceId,

        subject,

        summary:
          typeof analysis.summary === "string"
            ? analysis.summary.trim()
            : null,

        difficulty_profile:
          typeof analysis.difficulty_profile ===
          "string"
            ? analysis.difficulty_profile.trim()
            : null,

        topic_profile:
          typeof analysis.topic_profile ===
          "string"
            ? analysis.topic_profile.trim()
            : null,

        competence_profile:
          typeof analysis.competence_profile ===
          "string"
            ? analysis.competence_profile.trim()
            : null,

        reasoning_profile:
          typeof analysis.reasoning_profile ===
          "string"
            ? analysis.reasoning_profile.trim()
            : null,

        structure_profile:
          typeof analysis.structure_profile ===
          "string"
            ? analysis.structure_profile.trim()
            : null,

        context_profile:
          typeof analysis.context_profile ===
          "string"
            ? analysis.context_profile.trim()
            : null,

        generation_guidelines:
          typeof analysis.generation_guidelines ===
          "string"
            ? analysis.generation_guidelines.trim()
            : null,
      })
      .select("*")
      .single();

    if (analysisError || !savedAnalysis) {
      console.error(
        "ERROR GUARDANDO ANÁLISIS:",
        analysisError
      );

      throw new Error(
        analysisError?.message ||
          "No se pudo guardar el análisis de referencia."
      );
    }

    console.log(
      "Análisis general guardado:",
      savedAnalysis.id
    );

    // =========================================================
    // 18. PREPARAR PREGUNTAS DE REFERENCIA
    // =========================================================

    const referenceQuestionRows =
      validQuestions.map(
        (question: any) => ({
          reference_source_id:
            referenceSourceId,

          question_number:
            typeof question.question_number ===
            "number"
              ? question.question_number
              : null,

          subject:
            question.subject,

          topic:
            question.topic.trim(),

          component:
            question.component.trim(),

          competence:
            question.competence.trim(),

          skill:
            question.skill.trim(),

          difficulty:
            question.difficulty,

          reasoning_type:
            question.reasoning_type.trim(),

          structure_type:
            question.structure_type.trim(),

          context_type:
            question.context_type.trim(),

          distractor_strategy:
            question.distractor_strategy.trim(),

          information_complexity:
            question.information_complexity.trim(),

          context_text:
            typeof question.context_text ===
              "string" &&
            question.context_text.trim()
              ? question.context_text.trim()
              : null,

          question_text:
            question.question_text.trim(),

          requires_visual:
            question.requires_visual,

          visual_description:
            typeof question.visual_description ===
              "string" &&
            question.visual_description.trim()
              ? question.visual_description.trim()
              : null,

          analysis_notes:
            question.analysis_notes.trim(),
        })
      );

    // =========================================================
    // 19. INSERTAR PREGUNTAS DE REFERENCIA
    // =========================================================

    let insertedReferenceQuestions: any[] = [];

    if (
      referenceQuestionRows.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("reference_questions")
        .insert(referenceQuestionRows)
        .select("*");

      if (error) {
        console.error(
          "ERROR INSERTANDO reference_questions:",
          error
        );

        throw new Error(
          `No se pudieron guardar las preguntas de referencia: ${error.message}`
        );
      }

      insertedReferenceQuestions =
        data ?? [];
    }

    // =========================================================
    // 20. ACTUALIZAR reference_sources
    // =========================================================

    const {
      error: updateSourceError,
    } = await supabase
      .from("reference_sources")
      .update({
        status: "completed",
        total_questions:
          insertedReferenceQuestions.length,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        referenceSourceId
      );

    if (updateSourceError) {
      console.error(
        "ERROR ACTUALIZANDO reference_sources:",
        updateSourceError
      );

      throw new Error(
        `No se pudo actualizar la fuente de referencia: ${updateSourceError.message}`
      );
    }

    // =========================================================
    // 21. ESTADÍSTICAS
    // =========================================================

    const subjectCounts: Record<
      string,
      number
    > = {};

    const difficultyCounts: Record<
      string,
      number
    > = {};

    const visualQuestions =
      insertedReferenceQuestions.filter(
        (question) =>
          question.requires_visual === true
      ).length;

    for (
      const question of insertedReferenceQuestions
    ) {
      subjectCounts[
        question.subject
      ] =
        (subjectCounts[
          question.subject
        ] || 0) + 1;

      difficultyCounts[
        question.difficulty
      ] =
        (difficultyCounts[
          question.difficulty
        ] || 0) + 1;
    }

    // =========================================================
    // 22. LOG FINAL
    // =========================================================

    console.log("");

    console.log(
      "================================="
    );

    console.log(
      "ANÁLISIS DE REFERENCIA FINALIZADO"
    );

    console.log(
      "================================="
    );

    console.log(
      "Reference source:",
      referenceSourceId
    );

    console.log(
      "Análisis:",
      savedAnalysis.id
    );

    console.log(
      "Preguntas analizadas:",
      result.questions.length
    );

    console.log(
      "Preguntas válidas:",
      validQuestions.length
    );

    console.log(
      "Preguntas guardadas:",
      insertedReferenceQuestions.length
    );

    console.log(
      "Preguntas inválidas:",
      invalidQuestions
    );

    console.log(
      "Preguntas visuales:",
      visualQuestions
    );

    console.log(
      "Por materia:",
      subjectCounts
    );

    console.log(
      "Por dificultad:",
      difficultyCounts
    );

    console.log(
      "================================="
    );

    console.log("");

    // =========================================================
    // 23. RESPUESTA
    // =========================================================

    return NextResponse.json({
      success: true,

      message:
        "PDF analizado correctamente como material de referencia.",

      reference_source_id:
        referenceSourceId,

      reference_analysis_id:
        savedAnalysis.id,

      file_name:
        file.name,

      subject,

      session,

      analyzed:
        result.questions.length,

      valid:
        validQuestions.length,

      invalid:
        invalidQuestions,

      saved:
        insertedReferenceQuestions.length,

      visual_questions:
        visualQuestions,

      subject_counts:
        subjectCounts,

      difficulty_counts:
        difficultyCounts,

      // IMPORTANTE:
      // Estas NO son preguntas del banco de PeakScore.
      // Son preguntas almacenadas únicamente como referencia.
      reference_questions:
        insertedReferenceQuestions,
    });
  } catch (error) {
    console.error("");

    console.error(
      "================================="
    );

    console.error(
      "IMPORT PDF REFERENCE ERROR"
    );

    console.error(
      "================================="
    );

    console.error(error);

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al analizar el PDF.",
      },
      {
        status: 500,
      }
    );
  }
}
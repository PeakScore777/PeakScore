import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PUBLIC_QUESTION_FIELDS =
  "id, subject, subject_id, session, component, competence, difficulty, context_text, question, option_a, option_b, option_c, option_d, image_url, requires_visual, visual_type, visual_description, visual_data, chart_data, year, source, question_number, is_active, created_at, updated_at";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { success: false, error: "Configuración del servidor incompleta." },
      { status: 500 }
    );
  }

  const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });


    const { id: simulationId } = await context.params;

    if (!simulationId) {
      return NextResponse.json(
        { success: false, error: "ID del simulacro no válido." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const { data: simulation, error: simulationError } =
      await supabase
        .from("simulations")
        .select(
          "id, title, type, total_questions, created_at, description, subject, duration, difficulty, color, created_by"
        )
        .eq("id", simulationId)
        .maybeSingle();

    if (simulationError) {
      console.error("[PeakScore] Error verificando simulacro:", simulationError);
      return NextResponse.json(
        { success: false, error: "No fue posible obtener el simulacro." },
        { status: 500 }
      );
    }

    if (!simulation) {
      return NextResponse.json(
        { success: false, error: "El simulacro no existe." },
        { status: 404 }
      );
    }

    if (simulation.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "No tienes acceso a este simulacro." },
        { status: 403 }
      );
    }

    const { data: relations, error: relationsError } =
      await supabase
        .from("simulation_questions")
        .select("question_id, question_order")
        .eq("simulation_id", simulationId)
        .order("question_order", { ascending: true });

    if (relationsError) {
      console.error("[PeakScore] Error obteniendo relaciones:", relationsError);
      return NextResponse.json(
        { success: false, error: "No fue posible obtener las preguntas." },
        { status: 500 }
      );
    }

    if (!relations?.length) {
      return NextResponse.json(
        { success: false, error: "Este simulacro no tiene preguntas." },
        { status: 409 }
      );
    }

    const questionIds = relations.map((relation) => relation.question_id);

    const { data: questions, error: questionsError } =
      await supabase
        .from("questions")
        .select(PUBLIC_QUESTION_FIELDS)
        .in("id", questionIds);

    if (questionsError) {
      console.error("[PeakScore] Error obteniendo preguntas:", questionsError);
      return NextResponse.json(
        { success: false, error: "No fue posible obtener las preguntas." },
        { status: 500 }
      );
    }

    if (!questions || questions.length !== questionIds.length) {
      return NextResponse.json(
        { success: false, error: "Las preguntas del simulacro no pudieron verificarse." },
        { status: 409 }
      );
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const orderedQuestions = relations
      .map((relation) => questionMap.get(relation.question_id))
      .filter(Boolean);

    if (orderedQuestions.length !== relations.length) {
      return NextResponse.json(
        { success: false, error: "Las preguntas del simulacro no pudieron ordenarse." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      simulation: {
        id: simulation.id,
        title: simulation.title,
        type: simulation.type,
        total_questions: simulation.total_questions,
        created_at: simulation.created_at,
        description: simulation.description,
        subject: simulation.subject,
        duration: simulation.duration,
        difficulty: simulation.difficulty,
        color: simulation.color,
      },
      questions: orderedQuestions,
    });
  } catch (error) {
    console.error("[PeakScore] ERROR OBTENIENDO EXAMEN:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

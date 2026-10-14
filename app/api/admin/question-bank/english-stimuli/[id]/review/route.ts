import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stimulusId } = await context.params;

    if (!UUID_RE.test(stimulusId)) {
      return NextResponse.json(
        { success: false, error: "El identificador del estímulo no es válido." },
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: "No se pudieron verificar tus permisos." },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "No tienes permisos para revisar preguntas." },
        { status: 403 }
      );
    }

    let body: { active?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

    if (typeof body?.active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Debes indicar si el conjunto queda activo." },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "La configuración interna está incompleta." },
        { status: 500 }
      );
    }

    const adminSupabase = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await adminSupabase.rpc(
      "review_english_question_set_atomic",
      {
        p_stimulus_id: stimulusId,
        p_activate: body.active,
      }
    );

    if (error || !data?.success) {
      const message = error?.message ?? "";
      const isValidationError = [
        "INVALID_REVIEW_PAYLOAD",
        "ENGLISH_STIMULUS_NOT_FOUND",
        "INCOMPLETE_ENGLISH_SET",
        "INVALID_ENGLISH_SET_FORMAT",
        "INVALID_ENGLISH_SINGLE_ITEM_SET",
        "INVALID_ENGLISH_PART_1_SET",
        "INVALID_ENGLISH_PART_1_ANSWERS",
        "INVALID_ENGLISH_ITEM_OPTIONS",
        "INVALID_ENGLISH_CLOZE_MARKERS",
        "INVALID_ENGLISH_CLOZE_POSITIONS",
      ].some((code) => message.includes(code));

      console.error("[PeakScore] No se pudo cambiar el estado editorial del conjunto.", {
        code: error?.code ?? "UNKNOWN",
        validationError: isValidationError,
      });

      return NextResponse.json(
        {
          success: false,
          error: isValidationError
            ? "El conjunto está incompleto o no supera las validaciones. No se activó ninguna pregunta."
            : "No fue posible actualizar el estado editorial del conjunto.",
        },
        { status: isValidationError ? 400 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        active: data.active,
        question_count: data.question_count,
        stimulus_id: stimulusId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PeakScore] Error interno revisando conjunto de Inglés.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

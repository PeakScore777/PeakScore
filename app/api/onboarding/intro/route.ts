import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = {
  school_grade: ["decimo", "undecimo", "graduado", "otro"],
  icfes_experience: [
    "principiante",
    "simulacros",
    "presentado_una_vez",
    "presentado_varias_veces",
  ],
  learning_goal: [
    "fundamentos",
    "reforzar_debilidades",
    "mejorar_puntaje",
    "practicar",
  ],
  math_confidence: ["baja", "media", "alta", "no_seguro"],
} as const;

type OnboardingAnswers = {
  school_grade: (typeof ALLOWED.school_grade)[number];
  icfes_experience: (typeof ALLOWED.icfes_experience)[number];
  learning_goal: (typeof ALLOWED.learning_goal)[number];
  math_confidence: (typeof ALLOWED.math_confidence)[number];
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para continuar." },
        { status: 401 },
      );
    }

    const payload: unknown = await request.json().catch(() => null);

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        { error: "La información enviada no es válida." },
        { status: 400 },
      );
    }

    const body = payload as Record<string, unknown>;
    const updates: Record<string, string> = {
      intro_completed_at: new Date().toISOString(),
    };

    if (body.skip === true) {
      // Saltar la introducción también evita volver a mostrarla en cada login.
    } else {
      for (const key of Object.keys(ALLOWED) as Array<keyof OnboardingAnswers>) {
        const value = body[key];

        if (
          typeof value !== "string" ||
          !(ALLOWED[key] as readonly string[]).includes(value)
        ) {
          return NextResponse.json(
            { error: "Completa todas las respuestas antes de continuar." },
            { status: 400 },
          );
        }

        updates[key] = value;
      }
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Intro profile update failed:", updateError.message);
      return NextResponse.json(
        { error: "No pudimos guardar tu progreso. Inténtalo de nuevo." },
        { status: 500 },
      );
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "No encontramos tu perfil. Vuelve a iniciar sesión." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al guardar la introducción." },
      { status: 500 },
    );
  }
}

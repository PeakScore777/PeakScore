import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SettingsBody = {
  fullName?: unknown;
};

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para editar tu perfil." },
        { status: 401 },
      );
    }

    const {
      data: assurance,
      error: assuranceError,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      return NextResponse.json(
        { error: "No se pudo comprobar la autenticación de la cuenta." },
        { status: 503 },
      );
    }

    if (
      assurance.nextLevel === "aal2" &&
      assurance.currentLevel !== "aal2"
    ) {
      return NextResponse.json(
        { error: "Completa la autenticación en dos pasos antes de cambiar la configuración.", mfaRequired: true },
        { status: 403 },
      );
    }

    let body: SettingsBody;

    try {
      body = (await request.json()) as SettingsBody;
    } catch {
      return NextResponse.json(
        { error: "La solicitud no tiene un formato válido." },
        { status: 400 },
      );
    }

    if (typeof body.fullName !== "string") {
      return NextResponse.json(
        { error: "Escribe un nombre válido." },
        { status: 400 },
      );
    }

    const fullName = body.fullName.trim();

    if (fullName.length < 2 || fullName.length > 70) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 2 y 70 caracteres." },
        { status: 400 },
      );
    }

    // Se actualiza exclusivamente el nombre del usuario autenticado.
    // Este endpoint nunca acepta un id de usuario enviado por el cliente.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (profileError) {
      console.error("[ProfileSettings] No se pudo actualizar el nombre.", {
        code: profileError.code ?? "UNKNOWN",
      });

      return NextResponse.json(
        { error: "No se pudo guardar el nombre. Inténtalo de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      fullName,
    });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error interno al guardar el perfil." },
      { status: 500 },
    );
  }
}

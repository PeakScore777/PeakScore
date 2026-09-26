import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID del simulacro no válido.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /* =========================================
       USUARIO AUTENTICADO
    ========================================= */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    /* =========================================
       ELIMINAR SIMULACRO
       La función SQL verifica que sea del usuario
       y elimina sus datos relacionados.
    ========================================= */

    const { error } = await supabase.rpc(
      "delete_user_simulation",
      {
        p_simulation_id: id,
      }
    );

    if (error) {
      console.error("[PeakScore] Error eliminando simulacro.", { errorCode: error.code ?? "UNKNOWN" });

      return NextResponse.json(
        {
          success: false,
          error:
            "No fue posible eliminar el simulacro.",
        },
        { status: 500 }
      );
    }

    console.log(
      `[PeakScore] Simulacro eliminado: ${id}`
    );

    return NextResponse.json({
      success: true,
      message:
        "Simulacro eliminado correctamente.",
    });
  } catch (error) {
    console.error("[PeakScore] Error interno eliminando simulacro.", { errorName: error instanceof Error ? error.name : "UnknownError" });

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
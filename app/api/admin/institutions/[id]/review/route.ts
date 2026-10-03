import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ReviewAction =
  | "start_review"
  | "approve"
  | "request_changes"
  | "reject";

const ALLOWED_ACTIONS: ReviewAction[] = [
  "start_review",
  "approve",
  "request_changes",
  "reject",
];

const TRANSITIONS: Record<
  ReviewAction,
  {
    from: string;
    to: string;
  }
> = {
  start_review: {
    from: "pending",
    to: "under_review",
  },
  approve: {
    from: "under_review",
    to: "approved",
  },
  request_changes: {
    from: "under_review",
    to: "changes_requested",
  },
  reject: {
    from: "under_review",
    to: "rejected",
  },
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        {
          error: "Identificador de solicitud inválido.",
        },
        { status: 400 }
      );
    }

    /*
     * Protección básica contra solicitudes cross-origin.
     */
    const origin = request.headers.get("origin");

    if (origin) {
      const requestOrigin = new URL(request.url).origin;

      if (origin !== requestOrigin) {
        return NextResponse.json(
          {
            error: "Origen no autorizado.",
          },
          { status: 403 }
        );
      }
    }

    /*
     * Autenticación mediante la sesión normal de Supabase.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    /*
     * Autorización:
     * solamente profiles.role = admin puede revisar instituciones.
     */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error verificando rol administrativo.", {
        userId: user.id,
        errorCode: profileError.code ?? "UNKNOWN",
      });

      return NextResponse.json(
        {
          error: "No fue posible verificar los permisos.",
        },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error: "No tienes permisos para realizar esta acción.",
        },
        { status: 403 }
      );
    }

    /*
     * Leer acción.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Solicitud inválida.",
        },
        { status: 400 }
      );
    }

    const action =
      typeof body === "object" &&
      body !== null &&
      "action" in body &&
      typeof body.action === "string"
        ? body.action
        : null;

    if (!action || !ALLOWED_ACTIONS.includes(action as ReviewAction)) {
      return NextResponse.json(
        {
          error: "Acción de revisión no válida.",
        },
        { status: 400 }
      );
    }

    const reviewAction = action as ReviewAction;
    const transition = TRANSITIONS[reviewAction];

    /*
     * Obtener estado actual.
     */
    const { data: currentRequest, error: requestError } =
      await supabaseAdmin
        .from("institution_verification_requests")
        .select("id, verification_status")
        .eq("id", id)
        .maybeSingle();

    if (requestError) {
      console.error("Error consultando solicitud institucional.", {
        userId: user.id,
        requestId: id,
        errorCode: requestError.code ?? "UNKNOWN",
      });

      return NextResponse.json(
        {
          error: "No fue posible consultar la solicitud.",
        },
        { status: 500 }
      );
    }

    if (!currentRequest) {
      return NextResponse.json(
        {
          error: "La solicitud no existe.",
        },
        { status: 404 }
      );
    }

    /*
     * Impedir transiciones arbitrarias.
     */
    if (currentRequest.verification_status !== transition.from) {
      return NextResponse.json(
        {
          error: `La solicitud está en estado "${currentRequest.verification_status}" y no puede realizar esta acción.`,
        },
        { status: 409 }
      );
    }

    /*
     * Actualización exclusivamente desde servidor
     * utilizando service_role.
     */
    const { data: updatedRequest, error: updateError } =
      await supabaseAdmin
        .from("institution_verification_requests")
        .update({
          verification_status: transition.to,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("verification_status", transition.from)
        .select(
          "id, institution_id, verification_status, reviewed_at, reviewed_by"
        )
        .maybeSingle();

    if (updateError) {
      console.error("Error actualizando solicitud institucional.", {
        userId: user.id,
        requestId: id,
        errorCode: updateError.code ?? "UNKNOWN",
      });

      return NextResponse.json(
        {
          error: "No fue posible actualizar la solicitud.",
        },
        { status: 500 }
      );
    }

    /*
     * Si otra operación cambió el estado entre la lectura
     * y el UPDATE, no sobrescribimos nada.
     */
    if (!updatedRequest) {
      return NextResponse.json(
        {
          error:
            "La solicitud cambió de estado antes de completar esta operación. Recarga la página.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error inesperado revisando institución.", {
      error:
        error instanceof Error ? error.name : "UNKNOWN_ERROR",
    });

    return NextResponse.json(
      {
        error: "Ocurrió un error inesperado.",
      },
      { status: 500 }
    );
  }
}
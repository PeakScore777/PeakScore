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

const MAX_REASON_LENGTH = 1000;
const MIN_REASON_LENGTH = 10;

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeReason(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_REASON_LENGTH);
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
          error:
            "Identificador de solicitud inválido.",
        },
        { status: 400 }
      );
    }

    /*
     * Protección básica contra solicitudes
     * provenientes de otro origen.
     */
    const origin = request.headers.get("origin");

    if (origin) {
      const requestOrigin = new URL(
        request.url
      ).origin;

      if (origin !== requestOrigin) {
        return NextResponse.json(
          {
            error:
              "Origen no autorizado.",
          },
          { status: 403 }
        );
      }
    }

    /*
     * Autenticación mediante la sesión normal
     * de Supabase.
     */
    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    /*
     * Autorización:
     * solamente profiles.role = admin.
     */
    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Error verificando rol administrativo.",
        {
          userId: user.id,
          errorCode:
            profileError.code ??
            "UNKNOWN",
        }
      );

      return NextResponse.json(
        {
          error:
            "No fue posible verificar los permisos.",
        },
        { status: 500 }
      );
    }

    if (
      profile?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para realizar esta acción.",
        },
        { status: 403 }
      );
    }

    /*
     * Leer body.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Solicitud inválida.",
        },
        { status: 400 }
      );
    }

    /*
     * Extraer action y reason de forma segura.
     */
    const action =
      typeof body === "object" &&
      body !== null &&
      "action" in body &&
      typeof body.action === "string"
        ? body.action
        : null;

    const reason =
      typeof body === "object" &&
      body !== null &&
      "reason" in body
        ? normalizeReason(
            body.reason
          )
        : "";

    /*
     * Validar acción.
     */
    if (
      !action ||
      !ALLOWED_ACTIONS.includes(
        action as ReviewAction
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Acción de revisión no válida.",
        },
        { status: 400 }
      );
    }

    const reviewAction =
      action as ReviewAction;

    const transition =
      TRANSITIONS[reviewAction];

    /*
     * Las acciones que comunican una decisión
     * al solicitante deben tener un motivo.
     */
    if (
      reviewAction ===
        "request_changes" ||
      reviewAction === "reject"
    ) {
      if (
        reason.length <
        MIN_REASON_LENGTH
      ) {
        return NextResponse.json(
          {
            error:
              "Debes proporcionar un motivo de al menos 10 caracteres.",
          },
          { status: 400 }
        );
      }

      if (
        reason.length >
        MAX_REASON_LENGTH
      ) {
        return NextResponse.json(
          {
            error:
              "El motivo no puede superar los 1000 caracteres.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Obtener estado actual.
     */
    const {
      data: currentRequest,
      error: requestError,
    } =
      await supabaseAdmin
        .from(
          "institution_verification_requests"
        )
        .select(
          "id, verification_status"
        )
        .eq("id", id)
        .maybeSingle();

    if (requestError) {
      console.error(
        "Error consultando solicitud institucional.",
        {
          userId: user.id,
          requestId: id,
          errorCode:
            requestError.code ??
            "UNKNOWN",
        }
      );

      return NextResponse.json(
        {
          error:
            "No fue posible consultar la solicitud.",
        },
        { status: 500 }
      );
    }

    if (!currentRequest) {
      return NextResponse.json(
        {
          error:
            "La solicitud no existe.",
        },
        { status: 404 }
      );
    }

    /*
     * Impedir transiciones no permitidas.
     */
    if (
      currentRequest.verification_status !==
      transition.from
    ) {
      return NextResponse.json(
        {
          error: `La solicitud está en estado "${currentRequest.verification_status}" y no puede realizar esta acción.`,
        },
        { status: 409 }
      );
    }

    const now =
      new Date().toISOString();

    /*
     * Preparar actualización.
     *
     * reviewer_message se guarda solamente
     * para acciones que requieren comunicar
     * un motivo al solicitante.
     */
    const updatePayload = {
      verification_status:
        transition.to,

      reviewed_at: now,

      reviewed_by: user.id,

      updated_at: now,

      ...(reviewAction ===
        "request_changes" ||
      reviewAction === "reject"
        ? {
            reviewer_message:
              reason,
          }
        : {}),
    };

    /*
     * UPDATE server-side mediante
     * service_role.
     *
     * El estado anterior forma parte del filtro
     * para evitar sobrescribir una revisión
     * concurrente.
     */
    const {
      data: updatedRequest,
      error: updateError,
    } =
      await supabaseAdmin
        .from(
          "institution_verification_requests"
        )
        .update(updatePayload)
        .eq("id", id)
        .eq(
          "verification_status",
          transition.from
        )
        .select(
          `
            id,
            institution_id,
            verification_status,
            reviewed_at,
            reviewed_by,
            reviewer_message
          `
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "Error actualizando solicitud institucional.",
        {
          userId: user.id,
          requestId: id,
          errorCode:
            updateError.code ??
            "UNKNOWN",
        }
      );

      return NextResponse.json(
        {
          error:
            "No fue posible actualizar la solicitud.",
        },
        { status: 500 }
      );
    }

    /*
     * Si otra revisión modificó el estado primero,
     * no sobrescribimos nada.
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
    console.error(
      "Error inesperado revisando institución.",
      {
        error:
          error instanceof Error
            ? error.name
            : "UNKNOWN_ERROR",
      }
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado.",
      },
      { status: 500 }
    );
  }
}
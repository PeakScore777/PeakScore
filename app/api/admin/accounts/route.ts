import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isCanonicalAdmin } from "@/lib/auth/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BAN_DURATIONS = ["24h", "168h", "720h", "876000h"] as const;
type BanDuration = (typeof BAN_DURATIONS)[number];
type AccountAction = "ban" | "unban";

async function authorizeAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
      user: null,
      supabase,
    };
  }

  const { data: currentProfile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return {
      response: NextResponse.json(
        { error: "No se pudieron comprobar los permisos." },
        { status: 500 },
      ),
      user: null,
      supabase,
    };
  }

  if (!isCanonicalAdmin(user.id, currentProfile?.role)) {
    return {
      response: NextResponse.json(
        { error: "No tienes permiso para moderar cuentas." },
        { status: 403 },
      ),
      user: null,
      supabase,
    };
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    return {
      response: NextResponse.json(
        { error: "No se pudo comprobar la seguridad de la sesión." },
        { status: 503 },
      ),
      user: null,
      supabase,
    };
  }

  if (assurance.currentLevel !== "aal2") {
    return {
      response: NextResponse.json(
        {
          error: "La moderación de cuentas requiere autenticación en dos pasos.",
          mfaRequired: true,
          settingsUrl: "/perfil/configuracion",
        },
        { status: 403 },
      ),
      user: null,
      supabase,
    };
  }

  return { response: null, user, supabase };
}

async function getTarget(targetUserId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (profileError) {
    return { error: "No se pudo cargar el perfil de la cuenta.", status: 500 as const };
  }

  if (!profile) {
    return { error: "No se encontró esa cuenta.", status: 404 as const };
  }

  const { data: authResult, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(targetUserId);

  if (authError || !authResult.user) {
    return { error: "No se pudo consultar el estado de autenticación de la cuenta.", status: 500 as const };
  }

  const bannedUntil = authResult.user.banned_until ?? null;
  const isBanned =
    Boolean(bannedUntil) &&
    new Date(bannedUntil as string).getTime() > Date.now();

  return {
    userId: targetUserId,
    isAdmin: profile.role === "admin",
    isBanned,
    bannedUntil,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;

    const targetUserId =
      new URL(request.url).searchParams.get("userId")?.trim() ?? "";

    if (!UUID_PATTERN.test(targetUserId)) {
      return NextResponse.json(
        { error: "El identificador de la cuenta no es válido." },
        { status: 400 },
      );
    }

    const target = await getTarget(targetUserId);
    if ("error" in target) {
      return NextResponse.json(
        { error: target.error },
        { status: target.status },
      );
    }

    return NextResponse.json(target);
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al consultar la cuenta." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response || !auth.user) {
      return auth.response ?? NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "La solicitud no tiene un formato válido." },
        { status: 400 },
      );
    }

    const targetUserId = body.userId;
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const requestedDuration = body.duration;

    if (
      typeof targetUserId !== "string" ||
      !UUID_PATTERN.test(targetUserId) ||
      (action !== "ban" && action !== "unban")
    ) {
      return NextResponse.json(
        { error: "La acción o el identificador de la cuenta no es válido." },
        { status: 400 },
      );
    }

    if (reason.length < 5 || reason.length > 500) {
      return NextResponse.json(
        { error: "Indica un motivo de entre 5 y 500 caracteres para dejar constancia." },
        { status: 400 },
      );
    }

    let duration: BanDuration = "720h";
    if (action === "ban") {
      if (
        typeof requestedDuration !== "string" ||
        !BAN_DURATIONS.includes(requestedDuration as BanDuration)
      ) {
        return NextResponse.json(
          { error: "Elige una duración de bloqueo válida." },
          { status: 400 },
        );
      }
      duration = requestedDuration as BanDuration;
    }

    if (targetUserId === auth.user.id) {
      return NextResponse.json(
        { error: "No puedes bloquear tu propia cuenta administradora." },
        { status: 409 },
      );
    }

    const { data: targetProfile, error: targetProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", targetUserId)
        .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json(
        { error: "No se pudo consultar la cuenta que quieres moderar." },
        { status: 500 },
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: "No se encontró esa cuenta." },
        { status: 404 },
      );
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json(
        { error: "La moderación automática de cuentas administradoras está bloqueada." },
        { status: 409 },
      );
    }

    const requestEvent = action === "ban"
      ? "account_ban_requested"
      : "account_unban_requested";

    const { data: audit, error: auditError } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        actor_user_id: auth.user.id,
        target_user_id: targetUserId,
        event_type: requestEvent,
        reason,
        metadata: {
          duration: action === "ban" ? duration : null,
          status: "requested",
        },
      })
      .select("id")
      .single();

    if (auditError || !audit) {
      console.error("[AdminAccounts] No se pudo crear la auditoría previa.", {
        code: auditError?.code ?? "UNKNOWN",
      });
      return NextResponse.json(
        { error: "No se pudo registrar la auditoría. No se ha cambiado el estado de la cuenta." },
        { status: 503 },
      );
    }

    const { error: moderationError } =
      await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { ban_duration: action === "ban" ? duration : "none" },
      );

    if (moderationError) {
      await supabaseAdmin
        .from("admin_audit_logs")
        .update({
          event_type: "account_moderation_failed",
          metadata: {
            duration: action === "ban" ? duration : null,
            requestedAction: action,
            status: "failed",
            errorCode: moderationError.code ?? "UNKNOWN",
          },
        })
        .eq("id", audit.id);

      console.error("[AdminAccounts] La acción de moderación falló.", {
        code: moderationError.code ?? "UNKNOWN",
      });

      return NextResponse.json(
        { error: "Supabase no pudo actualizar el estado de la cuenta." },
        { status: 502 },
      );
    }

    const { data: finalAudit, error: finalAuditError } = await supabaseAdmin
      .from("admin_audit_logs")
      .update({
        event_type: action === "ban" ? "account_ban_applied" : "account_unban_applied",
        metadata: {
          duration: action === "ban" ? duration : null,
          status: "applied",
        },
      })
      .eq("id", audit.id)
      .select("id")
      .maybeSingle();

    if (finalAuditError || !finalAudit) {
      console.error("[AdminAccounts] La acción se aplicó, pero no se pudo finalizar su auditoría.", {
        code: finalAuditError?.code ?? "UNKNOWN",
      });
    }

    const target = await getTarget(targetUserId);
    return NextResponse.json({
      success: true,
      action,
      ...(target && !("error" in target) ? target : {}),
      auditWarning: Boolean(finalAuditError || !finalAudit),
    });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al moderar la cuenta." },
      { status: 500 },
    );
  }
}

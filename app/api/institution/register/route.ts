import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 32 * 1024;

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const ALLOWED_INSTITUTION_TYPES = new Set([
  "publica",
  "privada",
  "mixta",
  "otro",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
const NIT_REGEX = /^\d{6,15}(-\d)?$/;
const DOCUMENT_REGEX = /^\d{5,15}$/;

function json(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value, 254).toLowerCase();
}

function normalizeDigits(value: unknown): string {
  if (typeof value !== "string") return "";

  return value.replace(/\D/g, "").slice(0, 15);
}

function normalizeNit(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\s+/g, "")
    .replace(/[^\d-]/g, "")
    .slice(0, 20);
}

function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  // Algunos clientes/proxies pueden omitir Origin.
  // La autenticación y todas las validaciones posteriores siguen siendo obligatorias.
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);

    const allowedOrigins = new Set<string>();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (siteUrl) {
      try {
        allowedOrigins.add(new URL(siteUrl).origin);
      } catch {
        // Ignorar una variable mal configurada.
      }
    }

    const host = request.headers.get("host");

    if (host) {
      const protocol =
        request.headers.get("x-forwarded-proto") === "http"
          ? "http"
          : "https";

      allowedOrigins.add(`${protocol}://${host}`);
    }

    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");

    return allowedOrigins.has(originUrl.origin);
  } catch {
    return false;
  }
}

async function verifyTurnstile(
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token) {
    return false;
  }

  const body = new URLSearchParams();

  body.set("secret", secret);
  body.set("response", token);

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as {
      success?: boolean;
    };

    return result.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    /*
     * ---------------------------------------------------------
     * 1. Protección básica de método/origen
     * ---------------------------------------------------------
     */

    if (!isValidOrigin(request)) {
      return json(
        {
          error: "Solicitud no válida.",
        },
        403
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json(
        {
          error: "El formato de la solicitud no es válido.",
        },
        415
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") ?? "0"
    );

    if (contentLength > MAX_BODY_SIZE) {
      return json(
        {
          error: "La solicitud es demasiado grande.",
        },
        413
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Autenticación REAL
     * ---------------------------------------------------------
     */

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return json(
        {
          error:
            "Debes iniciar sesión antes de registrar una institución.",
        },
        401
      );
    }

    /*
     * Una institución no se puede registrar desde una cuenta
     * cuyo correo todavía no haya sido verificado.
     */

    if (!user.email_confirmed_at) {
      return json(
        {
          error:
            "Debes verificar tu correo electrónico antes de continuar.",
        },
        403
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Parseo seguro del body
     * ---------------------------------------------------------
     */

    let body: Record<string, unknown>;

    try {
      const rawBody = await request.text();

      if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
        return json(
          {
            error: "La solicitud es demasiado grande.",
          },
          413
        );
      }

      const parsed = JSON.parse(rawBody);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return json(
          {
            error: "Los datos enviados no son válidos.",
          },
          400
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return json(
        {
          error: "No se pudo procesar la solicitud.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Turnstile
     * ---------------------------------------------------------
     */

    const captchaToken = normalizeText(body.captchaToken, 4096);

    const remoteIp =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;

    const captchaValid = await verifyTurnstile(
      captchaToken,
      remoteIp
    );

    if (!captchaValid) {
      return json(
        {
          error:
            "No se pudo validar la protección de seguridad.",
        },
        403
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Rate limit
     * ---------------------------------------------------------
     */

    const { data: allowed, error: rateLimitError } =
      await supabase.rpc("consume_api_rate_limit", {
        p_bucket: "institution-register",
        p_limit: 2,
        p_window_seconds: 3600,
      });

    if (rateLimitError || allowed !== true) {
      return json(
        {
          error:
            "Has alcanzado el límite temporal de solicitudes. Intenta nuevamente más tarde.",
        },
        429
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Normalización de datos
     * ---------------------------------------------------------
     */

    const institutionName = normalizeText(
      body.institutionName,
      150
    );

    const nit = normalizeNit(body.nit);

    const institutionType = normalizeText(
      body.institutionType,
      30
    ).toLowerCase();

    const department = normalizeDigits(body.department);

    const city = normalizeText(body.city, 100);

    const address = normalizeText(body.address, 200);

    const institutionalEmail = normalizeEmail(
      body.institutionalEmail
    );

    const institutionalPhone = normalizeText(
      body.institutionalPhone,
      30
    );

    const rectorName = normalizeText(body.rectorName, 150);

    /*
     * Por diseño PeakScore solamente acepta C.C.
     * para el representante institucional en este flujo.
     */

    const documentType = "CC";

    const documentNumber = normalizeDigits(
      body.documentNumber
    );

    const rectorEmail = normalizeEmail(body.rectorEmail);

    const rectorPhone = normalizeText(body.rectorPhone, 30);

    const termsAccepted = body.termsAccepted === true;
    const privacyAccepted = body.privacyAccepted === true;

    /*
     * Marketing es opcional.
     * No se utiliza para autorizar el registro.
     */

    const marketingAccepted =
      body.marketingAccepted === true;

    /*
     * ---------------------------------------------------------
     * 7. Validaciones estrictas
     * ---------------------------------------------------------
     */

    if (
      institutionName.length < 3 ||
      rectorName.length < 3 ||
      city.length < 2 ||
      address.length < 5
    ) {
      return json(
        {
          error:
            "Faltan datos obligatorios o algunos datos no son válidos.",
        },
        400
      );
    }

    if (!NIT_REGEX.test(nit)) {
      return json(
        {
          error: "El NIT de la institución no es válido.",
        },
        400
      );
    }

    if (!/^\d{2}$/.test(department)) {
      return json(
        {
          error: "El departamento seleccionado no es válido.",
        },
        400
      );
    }

    if (!ALLOWED_INSTITUTION_TYPES.has(institutionType)) {
      return json(
        {
          error: "El tipo de institución no es válido.",
        },
        400
      );
    }

    if (!EMAIL_REGEX.test(institutionalEmail)) {
      return json(
        {
          error:
            "El correo institucional no es válido.",
        },
        400
      );
    }

    if (!EMAIL_REGEX.test(rectorEmail)) {
      return json(
        {
          error:
            "El correo del rector no es válido.",
        },
        400
      );
    }

    if (!PHONE_REGEX.test(institutionalPhone)) {
      return json(
        {
          error:
            "El teléfono institucional no es válido.",
        },
        400
      );
    }

    if (!PHONE_REGEX.test(rectorPhone)) {
      return json(
        {
          error:
            "El teléfono del rector no es válido.",
        },
        400
      );
    }

    if (documentType !== "CC") {
      return json(
        {
          error:
            "El tipo de documento del representante no es válido.",
        },
        400
      );
    }

    if (!DOCUMENT_REGEX.test(documentNumber)) {
      return json(
        {
          error:
            "El número de C.C. no es válido.",
        },
        400
      );
    }

    if (!termsAccepted || !privacyAccepted) {
      return json(
        {
          error:
            "Debes aceptar los términos y el aviso de privacidad.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Versión legal
     * ---------------------------------------------------------
     */

    const privacyNoticeVersion =
      process.env.PEAKSCORE_PRIVACY_NOTICE_VERSION;

    if (!privacyNoticeVersion) {
      console.error(
        "[InstitutionRegister] Privacy notice version is not configured."
      );

      return json(
        {
          error:
            "El registro institucional no está disponible temporalmente.",
        },
        503
      );
    }

    /*
     * ---------------------------------------------------------
     * 9. Evitar solicitudes activas del mismo usuario
     * ---------------------------------------------------------
     */

    const { data: existingByUser, error: existingUserError } =
      await supabaseAdmin
        .from("institution_verification_requests")
        .select("id, verification_status")
        .eq("representative_user_id", user.id)
        .in("verification_status", ["pending", "under_review"])
        .limit(1);

    if (existingUserError) {
      console.error(
        "[InstitutionRegister] Existing request lookup failed:",
        existingUserError.message
      );

      return json(
        {
          error:
            "No fue posible validar el estado de tu solicitud.",
        },
        500
      );
    }

    if (existingByUser && existingByUser.length > 0) {
      return json(
        {
          error:
            "Ya tienes una solicitud institucional en proceso.",
        },
        409
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Evitar duplicados activos por NIT
     * ---------------------------------------------------------
     */

    const { data: existingByNit, error: existingNitError } =
      await supabaseAdmin
        .from("institution_verification_requests")
        .select("id, verification_status")
        .eq("institution_nit", nit)
        .in("verification_status", ["pending", "under_review"])
        .limit(1);

    if (existingNitError) {
      console.error(
        "[InstitutionRegister] NIT lookup failed:",
        existingNitError.message
      );

      return json(
        {
          error:
            "No fue posible validar la institución.",
        },
        500
      );
    }

    if (existingByNit && existingByNit.length > 0) {
      return json(
        {
          error:
            "Ya existe una solicitud de verificación activa para este NIT.",
        },
        409
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. Crear institución
     * ---------------------------------------------------------
     *
     * IMPORTANTE:
     * code queda NULL hasta que el administrador apruebe
     * la institución.
     */

    const { data: institution, error: institutionError } =
      await supabaseAdmin
        .from("institutions")
        .insert({
          name: institutionName,
          code: null,
        })
        .select("id")
        .single();

    if (institutionError || !institution) {
      /*
       * Si el NIT ya produjo una carrera concurrente y terminó
       * provocando otro conflicto posterior, no exponemos
       * detalles internos de PostgreSQL.
       */

      console.error(
        "[InstitutionRegister] Institution creation failed:",
        institutionError?.message ?? "unknown error"
      );

      return json(
        {
          error:
            "No fue posible crear la solicitud institucional.",
        },
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * 12. Crear solicitud de verificación
     * ---------------------------------------------------------
     */

    const { data: verificationRequest, error: requestError } =
      await supabaseAdmin
        .from("institution_verification_requests")
        .insert({
          institution_id: institution.id,
          representative_user_id: user.id,
          representative_full_name: rectorName,
          representative_document_type: documentType,
          representative_document_number: documentNumber,
          representative_role: "rector",
          institutional_email: institutionalEmail,
          contact_phone: institutionalPhone,
          institution_name: institutionName,
          institution_nit: nit,
          institution_type: institutionType,
          institution_address: address,
          institution_city: city,
          verification_status: "pending",
          terms_accepted_at: new Date().toISOString(),
          privacy_notice_version: privacyNoticeVersion,
        })
        .select("id, verification_status")
        .single();

    if (requestError || !verificationRequest) {
      /*
       * Rollback compensatorio:
       * como Supabase REST no está usando aquí una transacción
       * multi-operación, eliminamos la institución recién creada
       * si la segunda operación falla.
       */

      await supabaseAdmin
        .from("institutions")
        .delete()
        .eq("id", institution.id);

      console.error(
        "[InstitutionRegister] Verification request creation failed:",
        requestError?.message ?? "unknown error"
      );

      return json(
        {
          error:
            "No fue posible registrar la solicitud institucional.",
        },
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * 13. Respuesta segura
     * ---------------------------------------------------------
     *
     * No devolvemos:
     * - NIT
     * - C.C.
     * - teléfonos
     * - correos
     * - datos internos
     * - mensajes de PostgreSQL
     */

    return json({
      success: true,
      status: "pending",
      requestId: verificationRequest.id,
    });
  } catch (error) {
    console.error(
      "[InstitutionRegister] Unexpected server error:",
      error instanceof Error ? error.message : "unknown error"
    );

    return json(
      {
        error:
          "Ocurrió un error inesperado al procesar la solicitud.",
      },
      500
    );
  }
}
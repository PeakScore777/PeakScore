import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 32 * 1024;

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const ALLOWED_INSTITUTION_TYPES = new Set([
  "official",
  "private",
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

function normalizeText(
  value: unknown,
  maxLength: number
): string {
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

  /*
   * El header Origin puede no estar presente en algunas
   * solicitudes no-browser. Para el flujo web institucional,
   * cuando exista, debe corresponder al propio sitio.
   */
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);

    const allowedOrigins = new Set<string>();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL;

    if (siteUrl) {
      try {
        allowedOrigins.add(
          new URL(siteUrl).origin
        );
      } catch {
        // Ignorar una variable mal configurada.
      }
    }

    const host = request.headers.get("host");

    if (host) {
      const protocol =
        request.headers.get("x-forwarded-proto") ===
        "http"
          ? "http"
          : "https";

      allowedOrigins.add(
        `${protocol}://${host}`
      );
    }

    allowedOrigins.add(
      "http://localhost:3000"
    );

    allowedOrigins.add(
      "http://127.0.0.1:3000"
    );

    return allowedOrigins.has(
      originUrl.origin
    );
  } catch {
    return false;
  }
}

async function verifyTurnstile(
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  const secret =
    process.env.TURNSTILE_SECRET_KEY;

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
    const response = await fetch(
      TURNSTILE_VERIFY_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return false;
    }

    const result =
      (await response.json()) as {
        success?: boolean;
      };

    return result.success === true;
  } catch {
    return false;
  }
}

/*
 * ---------------------------------------------------------
 * Rate limit público
 * ---------------------------------------------------------
 *
 * No usamos auth.uid() porque el registro institucional
 * es público.
 *
 * La clave se genera exclusivamente en el servidor:
 * - IP de Cloudflare cuando está disponible.
 * - fallback de infraestructura para desarrollo/preview.
 * - User-Agent como factor adicional.
 *
 * El valor final siempre se transforma en SHA-256.
 */
async function createPublicRateLimitKey(
  request: Request
): Promise<string> {
  const cloudflareIp =
    request.headers.get(
      "cf-connecting-ip"
    );

  const forwardedIp =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ?? null;

  const remoteIp =
    cloudflareIp ??
    forwardedIp ??
    "unknown-ip";

  const userAgent =
    request.headers.get("user-agent") ??
    "unknown-user-agent";

  const rawKey = [
    remoteIp,
    userAgent,
  ].join("|");

  const encoded =
    new TextEncoder().encode(rawKey);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

async function consumePublicRateLimit(
  request: Request
): Promise<boolean> {
  const rateKey =
    await createPublicRateLimitKey(
      request
    );

  const {
    data: allowed,
    error,
  } =
    await supabaseAdmin.rpc(
      "consume_public_institution_registration_rate_limit",
      {
        p_rate_key: rateKey,
      }
    );

  if (error) {
    console.error(
      "[InstitutionRegister] Public rate limit failed."
    );

    return false;
  }

  return allowed === true;
}

export async function POST(
  request: Request
) {
  try {
    /*
     * ---------------------------------------------------------
     * 1. Protección básica de método/origen
     * ---------------------------------------------------------
     */

    if (!isValidOrigin(request)) {
      return json(
        {
          error:
            "Solicitud no válida.",
        },
        403
      );
    }

    const contentType =
      request.headers.get(
        "content-type"
      ) ?? "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return json(
        {
          error:
            "El formato de la solicitud no es válido.",
        },
        415
      );
    }

    const contentLength = Number(
      request.headers.get(
        "content-length"
      ) ?? "0"
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_BODY_SIZE
    ) {
      return json(
        {
          error:
            "La solicitud es demasiado grande.",
        },
        413
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Parseo seguro del body
     * ---------------------------------------------------------
     */

    let body: Record<
      string,
      unknown
    >;

    try {
      const rawBody =
        await request.text();

      if (
        new TextEncoder().encode(
          rawBody
        ).byteLength >
        MAX_BODY_SIZE
      ) {
        return json(
          {
            error:
              "La solicitud es demasiado grande.",
          },
          413
        );
      }

      const parsed =
        JSON.parse(rawBody);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return json(
          {
            error:
              "Los datos enviados no son válidos.",
          },
          400
        );
      }

      body =
        parsed as Record<
          string,
          unknown
        >;
    } catch {
      return json(
        {
          error:
            "No se pudo procesar la solicitud.",
        },
        400
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Turnstile
     * ---------------------------------------------------------
     */

    const captchaToken =
      normalizeText(
        body.captchaToken,
        4096
      );

    /*
     * Para producción detrás de Cloudflare
     * priorizamos cf-connecting-ip.
     *
     * En desarrollo/preview puede no existir,
     * por lo que dejamos el fallback habitual
     * de infraestructura.
     */
    const remoteIp =
      request.headers.get(
        "cf-connecting-ip"
      ) ??
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ??
      null;

    const captchaValid =
      await verifyTurnstile(
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
     * 4. Rate limit público
     * ---------------------------------------------------------
     */

    const rateLimitAllowed =
      await consumePublicRateLimit(
        request
      );

    if (!rateLimitAllowed) {
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
     * 5. Normalización de datos
     * ---------------------------------------------------------
     */

    const institutionName =
      normalizeText(
        body.institutionName,
        150
      );

    const nit =
      normalizeNit(body.nit);

    const institutionType =
      normalizeText(
        body.institutionType,
        30
      ).toLowerCase();

    const department =
      normalizeDigits(
        body.department
      );

    const city =
      normalizeText(
        body.city,
        100
      );

    const address =
      normalizeText(
        body.address,
        200
      );

    const institutionalEmail =
      normalizeEmail(
        body.institutionalEmail
      );

    const institutionalPhone =
      normalizeText(
        body.institutionalPhone,
        30
      );

    const rectorName =
      normalizeText(
        body.rectorName,
        150
      );

    /*
     * Por diseño PeakScore solamente acepta C.C.
     * para el representante institucional en este flujo.
     *
     * No confiamos en el valor enviado por el navegador.
     */
    const documentType =
      "CC";

    const documentNumber =
      normalizeDigits(
        body.documentNumber
      );

    /*
     * Estos datos se reciben y validan ahora porque
     * forman parte del formulario institucional.
     *
     * Todavía no se persisten porque la tabla actual
     * no tiene una columna específica para ellos.
     *
     * La migración de esos campos se hará después,
     * antes de implementar los correos al rector.
     */
    const rectorEmail =
      normalizeEmail(
        body.rectorEmail
      );

    const rectorPhone =
      normalizeText(
        body.rectorPhone,
        30
      );

    const termsAccepted =
      body.termsAccepted === true;

    const privacyAccepted =
      body.privacyAccepted === true;

    /*
     * ---------------------------------------------------------
     * 6. Validaciones estrictas
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
          error:
            "El NIT de la institución no es válido.",
        },
        400
      );
    }

    if (!/^\d{2}$/.test(department)) {
      return json(
        {
          error:
            "El departamento seleccionado no es válido.",
        },
        400
      );
    }

    if (
      !ALLOWED_INSTITUTION_TYPES.has(
        institutionType
      )
    ) {
      return json(
        {
          error:
            "El tipo de institución no es válido.",
        },
        400
      );
    }

    if (
      !EMAIL_REGEX.test(
        institutionalEmail
      )
    ) {
      return json(
        {
          error:
            "El correo institucional no es válido.",
        },
        400
      );
    }

    if (
      !EMAIL_REGEX.test(
        rectorEmail
      )
    ) {
      return json(
        {
          error:
            "El correo del rector no es válido.",
        },
        400
      );
    }

    if (
      !PHONE_REGEX.test(
        institutionalPhone
      )
    ) {
      return json(
        {
          error:
            "El teléfono institucional no es válido.",
        },
        400
      );
    }

    if (
      !PHONE_REGEX.test(
        rectorPhone
      )
    ) {
      return json(
        {
          error:
            "El teléfono del rector no es válido.",
        },
        400
      );
    }

    if (
      documentType !== "CC"
    ) {
      return json(
        {
          error:
            "El tipo de documento del representante no es válido.",
        },
        400
      );
    }

    if (
      !DOCUMENT_REGEX.test(
        documentNumber
      )
    ) {
      return json(
        {
          error:
            "El número de C.C. no es válido.",
        },
        400
      );
    }

    if (
      !termsAccepted ||
      !privacyAccepted
    ) {
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
     * 7. Versión legal
     * ---------------------------------------------------------
     */

    const privacyNoticeVersion =
      process.env
        .PEAKSCORE_PRIVACY_NOTICE_VERSION;

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
     * 8. Evitar solicitudes activas duplicadas por NIT
     * ---------------------------------------------------------
     *
     * No podemos utilizar representative_user_id aquí
     * porque el flujo inicial es público y no requiere cuenta.
     */

    const {
      data: existingByNit,
      error: existingNitError,
    } =
      await supabaseAdmin
        .from(
          "institution_verification_requests"
        )
        .select(
          "id, verification_status"
        )
        .eq(
          "institution_nit",
          nit
        )
        .in(
          "verification_status",
          [
            "pending",
            "under_review",
          ]
        )
        .limit(1);

    if (existingNitError) {
      console.error(
        "[InstitutionRegister] NIT lookup failed."
      );

      return json(
        {
          error:
            "No fue posible validar la institución.",
        },
        500
      );
    }

    if (
      existingByNit &&
      existingByNit.length > 0
    ) {
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
     * 9. Crear institución
     * ---------------------------------------------------------
     *
     * IMPORTANTE:
     * code queda NULL hasta que PeakScore apruebe
     * y active la institución.
     */

    const {
      data: institution,
      error: institutionError,
    } =
      await supabaseAdmin
        .from("institutions")
        .insert({
          name: institutionName,
          code: null,
        })
        .select("id")
        .single();

    if (
      institutionError ||
      !institution
    ) {
      console.error(
        "[InstitutionRegister] Institution creation failed."
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
     * 10. Crear solicitud de verificación
     * ---------------------------------------------------------
     *
     * representative_user_id = NULL
     * porque todavía NO existe una cuenta asociada.
     */

    const {
      data: verificationRequest,
      error: requestError,
    } =
      await supabaseAdmin
        .from(
          "institution_verification_requests"
        )
        .insert({
          institution_id:
            institution.id,

          representative_user_id:
            null,

          representative_full_name:
            rectorName,

          representative_document_type:
            documentType,

          representative_document_number:
            documentNumber,

          representative_role:
            "rector",

          institutional_email:
            institutionalEmail,

          contact_phone:
            institutionalPhone,

          institution_name:
            institutionName,

          institution_nit:
            nit,

          institution_type:
            institutionType,

          institution_address:
            address,

          institution_city:
            city,

          verification_status:
            "pending",

          terms_accepted_at:
            new Date().toISOString(),

          privacy_notice_version:
            privacyNoticeVersion,
        })
        .select(
          "id, verification_status"
        )
        .single();

    if (
      requestError ||
      !verificationRequest
    ) {
      /*
       * Rollback compensatorio.
       *
       * La arquitectura definitiva podrá migrar
       * a una operación atómica de PostgreSQL.
       */
      await supabaseAdmin
        .from("institutions")
        .delete()
        .eq(
          "id",
          institution.id
        );

      console.error(
        "[InstitutionRegister] Verification request creation failed."
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
     * 11. Respuesta segura
     * ---------------------------------------------------------
     *
     * No devolvemos datos personales.
     * Solamente el estado y el identificador interno
     * de la solicitud.
     */

    return json({
      success: true,
      status: "pending",
      requestId:
        verificationRequest.id,
    });
  } catch (error) {
    console.error(
      "[InstitutionRegister] Unexpected server error:",
      error instanceof Error
        ? error.message
        : "unknown error"
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
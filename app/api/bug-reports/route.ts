import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeRasterImage } from "@/lib/security/sanitize-raster-image";
import { consumeUserRateLimit, getContentLengthError, isSameOriginMutation } from "@/lib/security/request-guards";

export const runtime = "nodejs";

const MAX_DESCRIPTION = 1000;
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_SCREENSHOT_BYTES + 256 * 1024;

function response(
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

function cleanText(
  value: FormDataEntryValue | null,
  maxLength: number
) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFC")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  /*
   * ============================================================
   * 1. AUTENTICACIÓN
   * ============================================================
   */

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response(
      {
        success: false,
        error:
          "Debes iniciar sesión para enviar un reporte.",
      },
      401
    );
  }

  if (!isSameOriginMutation(request)) {
    return response({ success: false, error: "La solicitud no es válida." }, 403);
  }

  const sizeError = getContentLengthError(request, MAX_REQUEST_BYTES);
  if (sizeError) {
    return response({ success: false, error: sizeError.message }, sizeError.status);
  }

  const limit = await consumeUserRateLimit(supabase, "bug-report");
  if (limit.unavailable) {
    return response({ success: false, error: "La protección de reportes no está disponible." }, 503);
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Has enviado demasiados reportes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
    );
  }

  /*
   * ============================================================
   * 2. LEER FORM DATA
   * ============================================================
   */

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return response(
      {
        success: false,
        error: "El formato del reporte no es válido.",
      },
      400
    );
  }

  /*
   * ============================================================
   * 3. VALIDAR DESCRIPCIÓN
   * ============================================================
   */

  const description = cleanText(
    formData.get("description"),
    MAX_DESCRIPTION
  );

  if (description.length < 10) {
    return response(
      {
        success: false,
        error:
          "Describe el problema con un poco más de detalle.",
      },
      400
    );
  }

  /*
   * ============================================================
   * 4. DATOS ADICIONALES
   * ============================================================
   */

  const pageUrlRaw = cleanText(
    formData.get("pageUrl"),
    1000
  );

  const pageUrl =
    pageUrlRaw ||
    request.headers.get("referer") ||
    null;

  const userAgent =
    request.headers.get("user-agent") || null;

  const title =
    cleanText(formData.get("title"), 160) ||
    `Reporte de bug - ${description.slice(0, 120)}`;

  /*
   * ============================================================
   * 5. CAPTURA DE PANTALLA
   * ============================================================
   */

  const screenshotEntry = formData.get("screenshot");

  const screenshot =
    screenshotEntry instanceof File &&
    screenshotEntry.size > 0
      ? screenshotEntry
      : null;

  if (screenshot && screenshot.size > MAX_SCREENSHOT_BYTES) {
    return response(
      { success: false, error: "La captura no puede superar los 5 MB." },
      413,
    );
  }

  let sanitizedScreenshot: Awaited<ReturnType<typeof sanitizeRasterImage>> | null = null;
  if (screenshot) {
    try {
      sanitizedScreenshot = await sanitizeRasterImage(
        new Uint8Array(await screenshot.arrayBuffer()),
        screenshot.type,
        MAX_SCREENSHOT_BYTES,
      );
    } catch {
      return response(
        { success: false, error: "La captura no es válida o supera los límites de seguridad." },
        415,
      );
    }
  }

  /*
   * ============================================================
   * 6. GUARDAR REPORTE EN SUPABASE
   * ============================================================
   */

  const { data: report, error: insertError } =
    await supabaseAdmin
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title,
        description,
        severity: "medium",
        page_url: pageUrl,
        user_agent: userAgent,
      })
      .select(
        `
          id,
          user_id,
          title,
          description,
          severity,
          status,
          page_url,
          created_at
        `
      )
      .single();

  if (insertError || !report) {
    console.error("[BugReport] Error guardando reporte:", {
      code: insertError?.code,
      message: insertError?.message,
    });

    return response(
      {
        success: false,
        error:
          "No pudimos guardar el reporte. Inténtalo nuevamente.",
      },
      500
    );
  }

  /*
   * ============================================================
   * 7. SUBIR CAPTURA SI EXISTE
   * ============================================================
   */

  if (screenshot) {
    try {
      if (!sanitizedScreenshot) {
        throw new Error("Screenshot sanitization was skipped.");
      }

      const storagePath =
        `${user.id}/${report.id}-${crypto.randomUUID()}.${sanitizedScreenshot.extension}`;

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("bug-report-screenshots")
          .upload(
            storagePath,
            sanitizedScreenshot.buffer,
            {
              contentType: sanitizedScreenshot.contentType,
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "[BugReport] Error subiendo captura:",
          {
            reportId: report.id,
            error: uploadError.message,
          }
        );
      } else {
        await supabaseAdmin
          .from("bug_reports")
          .update({
            screenshot_path: storagePath,
          })
          .eq("id", report.id);
      }
    } catch (error) {
      console.error(
        "[BugReport] Error procesando captura:",
        error
      );
    }
  }

  /*
   * ============================================================
   * 8. RESPUESTA
   * ============================================================
   */

  return response(
    {
      success: true,
      reportId: report.id,
      message:
        "Tu reporte fue recibido correctamente.",
    },
    201
  );
}
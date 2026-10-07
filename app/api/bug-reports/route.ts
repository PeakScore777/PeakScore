import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_DESCRIPTION = 1000;
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

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

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .slice(-80);
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

  if (screenshot) {
    if (!ALLOWED_IMAGE_TYPES.has(screenshot.type)) {
      return response(
        {
          success: false,
          error:
            "La captura debe ser PNG, JPG o WEBP.",
        },
        400
      );
    }

    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      return response(
        {
          success: false,
          error:
            "La captura no puede superar los 5 MB.",
        },
        413
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
      const extension =
        screenshot.type === "image/png"
          ? "png"
          : screenshot.type === "image/webp"
            ? "webp"
            : "jpg";

      const safeName =
        sanitizeFileName(screenshot.name) ||
        `captura.${extension}`;

      const storagePath =
        `${user.id}/${report.id}-${safeName}`;

      const bytes =
        await screenshot.arrayBuffer();

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("bug-report-screenshots")
          .upload(
            storagePath,
            Buffer.from(bytes),
            {
              contentType: screenshot.type,
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
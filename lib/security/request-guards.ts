import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitBucket =
  | "admin-game-image"
  | "bug-report"
  | "orby-image-save"
  | "orby-generate-image"
  | "english-question-image";

export type RateLimitResult =
  | { allowed: true; unavailable: false }
  | { allowed: false; unavailable: false }
  | { allowed: false; unavailable: true };

/**
 * Database-backed rate limiter. It fails closed: an unavailable limiter must
 * never silently turn an expensive or storage-writing endpoint into an open one.
 */
export async function consumeUserRateLimit(
  supabase: SupabaseClient,
  bucket: RateLimitBucket,
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_bucket: bucket,
    // The database owns the actual per-bucket limit and ignores these values.
    p_limit: 1,
    p_window_seconds: 3600,
  });

  if (error) {
    console.error("[Security] Rate-limit check unavailable.", {
      bucket,
      code: error.code,
    });
    return { allowed: false, unavailable: true };
  }

  return data === true
    ? { allowed: true, unavailable: false }
    : { allowed: false, unavailable: false };
}

export function getContentLengthError(
  request: Request,
  maxBytes: number,
): { status: 400 | 413; message: string } | null {
  const header = request.headers.get("content-length");
  if (header === null) return null;

  if (!/^\d+$/.test(header)) {
    return { status: 400, message: "El tamaño de la solicitud no es válido." };
  }

  const bytes = Number(header);
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    return { status: 400, message: "El tamaño de la solicitud no es válido." };
  }

  if (bytes > maxBytes) {
    return { status: 413, message: "La solicitud supera el tamaño máximo permitido." };
  }

  return null;
}

/**
 * Mutating file endpoints are used only by the browser app. Reject cross-origin
 * requests to reduce CSRF risk, including attacks launched from hostile sites.
 */
export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}


/**
 * Read a request body with a hard byte ceiling, including chunked requests that
 * omit Content-Length. The limit is enforced while streaming, before the body
 * can be buffered by JSON or multipart parsers.
 */
export async function readBodyBytesWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) return null;
  if (getContentLengthError(request, maxBytes)) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    try { await reader.cancel(); } catch { /* stream already closed */ }
    return null;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Read bounded UTF-8 JSON/text safely. Invalid UTF-8 fails closed.
 */
export async function readBodyWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<string | null> {
  const bytes = await readBodyBytesWithinLimit(request, maxBytes);
  if (bytes === null) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

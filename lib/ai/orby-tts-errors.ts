export type GeminiProviderFailureKind = "quota_exhausted" | "rate_limited" | "provider_error";
export type GeminiTtsFailureKind = GeminiProviderFailureKind;

type ProviderErrorLike = {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  error?: unknown;
};

function readProviderMessage(error: ProviderErrorLike): string {
  const nested = error.error && typeof error.error === "object"
    ? (error.error as { message?: unknown }).message
    : "";
  return [error.message, nested]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .slice(0, 1200);
}

/**
 * Gemini can return HTTP 429 for both exhausted quota and temporary
 * request-rate throttling. A 429 by itself is not proof that free quota ended.
 */
export function classifyGeminiProviderFailure(error: unknown): GeminiProviderFailureKind {
  if (!error || typeof error !== "object") return "provider_error";
  const detail = error as ProviderErrorLike;
  const code = typeof detail.code === "string" ? detail.code.toUpperCase() : "";
  const message = readProviderMessage(detail);
  const status = typeof detail.status === "number" ? detail.status : Number(detail.status);
  if (
    code === "RESOURCE_EXHAUSTED"
    || code === "QUOTA_EXCEEDED"
    || /RESOURCE_EXHAUSTED|QUOTA_EXCEEDED|quota exceeded|quota has been exceeded|free[- ]tier.{0,30}quota|limit: 0|daily quota/i.test(message)
  ) {
    return "quota_exhausted";
  }
  if (
    status === 429
    || code === "TOO_MANY_REQUESTS"
    || code === "RATE_LIMITED"
    || /too many requests|rate limit|requests per minute|per minute/i.test(message)
  ) {
    return "rate_limited";
  }
  return "provider_error";
}

/** @deprecated Use classifyGeminiProviderFailure for Live and TTS responses. */
export function classifyGeminiTtsFailure(error: unknown): GeminiTtsFailureKind {
  return classifyGeminiProviderFailure(error);
}

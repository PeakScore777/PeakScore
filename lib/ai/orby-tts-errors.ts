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
  const normalizedMessage = message.toLowerCase();
  const explicitMinuteThrottle = /(?:requests?|tokens?|input tokens?|output tokens?).{0,50}(?:per minute|\/minute|per_minute|rpm|tpm)|(?:per minute|\/minute|per_minute|rpm|tpm).{0,50}(?:requests?|tokens?)|too many requests|rate limit|retry[- ]after/i.test(normalizedMessage);
  const explicitDailyQuota = /daily quota|quota per day|requests per day|tokens per day|per_day|daily limit|limit: 0|free[- ]tier.{0,30}quota|quota exceeded|quota has been exceeded/i.test(normalizedMessage);

  // Google uses RESOURCE_EXHAUSTED for both daily quota exhaustion and
  // short rolling-window throttles. Prefer the explicit quota dimension;
  // a 429 or generic RESOURCE_EXHAUSTED response alone is not a daily lockout.
  if (code === "QUOTA_EXCEEDED" || (explicitDailyQuota && !explicitMinuteThrottle)) {
    return "quota_exhausted";
  }
  if (
    explicitMinuteThrottle
    || status === 429
    || code === "RESOURCE_EXHAUSTED"
    || code === "TOO_MANY_REQUESTS"
    || code === "RATE_LIMITED"
  ) {
    return "rate_limited";
  }
  return "provider_error";
}

/** @deprecated Use classifyGeminiProviderFailure for Live and TTS responses. */
export function classifyGeminiTtsFailure(error: unknown): GeminiTtsFailureKind {
  return classifyGeminiProviderFailure(error);
}

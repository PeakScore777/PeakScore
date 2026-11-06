export type GeminiTtsFailureKind = "quota_exhausted" | "rate_limited" | "provider_error";

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
 * request-rate throttling. Do not label every 429 as a depleted free quota.
 */
export function classifyGeminiTtsFailure(error: unknown): GeminiTtsFailureKind {
  if (!error || typeof error !== "object") return "provider_error";
  const detail = error as ProviderErrorLike;
  const code = typeof detail.code === "string" ? detail.code.toUpperCase() : "";
  const message = readProviderMessage(detail);
  if (
    code === "RESOURCE_EXHAUSTED"
    || /RESOURCE_EXHAUSTED|quota exceeded|quota has been exceeded|free[- ]tier.{0,30}quota|limit: 0|daily quota/i.test(message)
  ) {
    return "quota_exhausted";
  }
  if (detail.status === 429 || /too many requests|rate limit|requests per minute|per minute/i.test(message)) {
    return "rate_limited";
  }
  return "provider_error";
}

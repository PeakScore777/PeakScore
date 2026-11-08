import "server-only";

/**
 * Explicit cost-safety gates for external inference providers.
 *
 * These flags are operator attestations, not account-plan introspection:
 * set them only after verifying each account is on its no-charge tier.
 * Missing flags fail closed, so an API key alone never enables inference.
 */
type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

export function isGeminiFreeTierConfigured(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED === "true"
    && Boolean(env.GEMINI_API_KEY?.trim());
}

export function isGroqFreeTierConfigured(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_GROQ_FREE_TIER_CONFIRMED === "true"
    && Boolean(env.GROQ_API_KEY?.trim());
}

export function isLLM7FreeTierConfigured(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_LLM7_FREE_TIER_CONFIRMED === "true"
    && env.LLM7_ENABLED === "true"
    && Boolean(env.LLM7_API_KEY?.trim())
    && Boolean(env.LLM7_MODEL?.trim());
}

export function isCloudflareWorkersAIFreeTierConfigured(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED === "true"
    && /^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "")
    && Boolean(env.CLOUDFLARE_API_TOKEN?.trim());
}


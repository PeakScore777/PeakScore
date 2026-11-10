import "server-only";

/**
 * Explicit cost-safety gates for external inference providers.
 *
 * These flags are operator attestations, not account-plan introspection:
 * set them only after verifying each account is on its no-charge tier.
 * Gemini also requires explicit approval for Free Tier data use.
 * Missing flags fail closed, so an API key alone never enables inference.
 */
type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

/** Google AI Studio Free Tier data use is separate from account billing. */
export function isGeminiDataUseApproved(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_GEMINI_DATA_USE_APPROVED === "true";
}

export function isGeminiFreeTierConfirmed(env: ProviderEnvironment = process.env): boolean {
  return env.PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED === "true";
}

export function hasGeminiApiKey(env: ProviderEnvironment = process.env): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim());
}

/** Return an actionable, environment-specific error while keeping the free-tier gate fail-closed. */
export function getGeminiFreeTierConfigurationError(env: ProviderEnvironment = process.env): {
  code: "GEMINI_API_KEY_NOT_CONFIGURED" | "GEMINI_FREE_TIER_NOT_CONFIRMED";
  error: string;
} | null {
  if (!hasGeminiApiKey(env)) {
    return {
      code: "GEMINI_API_KEY_NOT_CONFIGURED",
      error: env.NODE_ENV === "development"
        ? "Falta GEMINI_API_KEY en tu entorno local. Configúrala en .env.local y reinicia npm run dev. No se ha enviado audio ni texto."
        : "Falta GEMINI_API_KEY en este deployment. Configúrala en las variables del entorno Preview de feat/founder-intro y vuelve a desplegar. No se ha enviado audio ni texto.",
    };
  }
  if (!isGeminiFreeTierConfirmed(env)) {
    return {
      code: "GEMINI_FREE_TIER_NOT_CONFIRMED",
      error: env.NODE_ENV === "development"
        ? "Gemini Live está bloqueado en desarrollo local porque falta PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true en .env.local. Añádelo solo después de verificar que la cuenta usa una cuota realmente sin coste; reinicia npm run dev. No se intentará una ruta facturable."
        : "Este deployment no recibió PEAKSCORE_GEMINI_FREE_TIER_CONFIRMED=true. Configura esa variable en el entorno Preview de feat/founder-intro solo después de verificar la cuota sin coste y vuelve a desplegar. No se intentará una ruta facturable.",
    };
  }
  return null;
}

/** This flag now confirms only the no-charge model tier; user data consent is per session. */
export function isGeminiFreeTierConfigured(env: ProviderEnvironment = process.env): boolean {
  return isGeminiFreeTierConfirmed(env) && hasGeminiApiKey(env);
}

export function isGeminiFreeTierDataUseAccepted(value: unknown): boolean {
  return value === true;
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


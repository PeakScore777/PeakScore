import "server-only";

import type OpenAI from "openai";

/**
 * Legacy OpenAI client intentionally disabled.
 *
 * PeakScore's current inference policy allows only providers whose no-charge
 * account tier has been explicitly confirmed. OpenAI API usage is not part of
 * that approved provider set. Keep this compatibility export so stale imports
 * fail explicitly rather than silently producing billable requests.
 */
const disabledOpenAIClient = new Proxy(Object.create(null) as OpenAI, {
  get() {
    throw new Error("OPENAI_PROVIDER_DISABLED: OpenAI API is not an approved free-tier provider for PeakScore.");
  },
});

export const openai = disabledOpenAIClient;

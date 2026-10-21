import "server-only";

import { GoogleGenAI } from "@google/genai";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

export function validateTutorImage(mimeType: unknown, base64: unknown):
  | { ok: true; mimeType: string; base64: string }
  | { ok: false; error: string } {
  if (typeof mimeType !== "string" || !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return { ok: false, error: "Adjunta una imagen JPG, PNG o WebP. Los PDF no están permitidos." };
  }
  if (typeof base64 !== "string" || !base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { ok: false, error: "La imagen adjunta no tiene un formato válido." };
  }
  const estimatedBytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (estimatedBytes <= 0 || estimatedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, error: "La imagen debe pesar máximo 1 MB." };
  }
  return { ok: true, mimeType, base64 };
}

/**
 * Vision requests go directly to Gemini. Never send image requests to the
 * text-only Groq fallback, because that could produce a fabricated analysis.
 */
export async function generateTutorVision(prompt: string, mimeType: string, base64: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_TUTOR_VISION_NOT_CONFIGURED");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        httpOptions: { timeout: 60000 },
      },
    });
    const text = typeof result.text === "string" ? result.text.trim() : "";
    if (!text) throw new Error("GEMINI_TUTOR_VISION_EMPTY_RESPONSE");
    return text;
  } catch (error) {
    if (error instanceof Error && error.message === "GEMINI_TUTOR_VISION_NOT_CONFIGURED") throw error;
    console.error("[Orby Tutor] Falló el análisis visual de Gemini.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("GEMINI_TUTOR_VISION_UNAVAILABLE");
  }
}

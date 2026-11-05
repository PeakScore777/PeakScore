import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cloudflare's hosted Deepgram Aura-2 TTS is priced per character, outside
 * the confirmed free Workers AI neuron allowance. Keep this endpoint
 * fail-closed until PeakScore approves a genuinely free output-voice provider.
 */
export async function POST() {
  return NextResponse.json({
    error: "La voz alternativa de salida está pausada: el proveedor disponible cobra por caracteres y no está incluido en una cuota gratuita confirmada. Orby conservará la respuesta por escrito y no generará cargos.",
    code: "FREE_TIER_TTS_NOT_AVAILABLE",
  }, {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

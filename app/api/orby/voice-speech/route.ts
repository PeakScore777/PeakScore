import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deepgram Aura-2 TTS has unit pricing. Workers AI Free includes a shared
 * daily neuron allowance, but this account's plan and remaining allocation
 * are not verified here. Keep this endpoint fail-closed to avoid unexpected
 * billing until a safe free-only quota can be guaranteed.
 */
export async function POST() {
  return NextResponse.json({
    error: "La voz alternativa de salida está pausada: el proveedor tiene precio por uso y no se ha podido verificar una cuota gratuita disponible para PeakScore. Orby conservará la respuesta por escrito.",
    code: "FREE_TIER_TTS_NOT_AVAILABLE",
  }, {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

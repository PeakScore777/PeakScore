import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * El Archivo Oculto is a desktop-only practice experience.
 * It intentionally does not award EXP, PeakCoins, or other account currency.
 * Keep this endpoint disabled so legacy clients cannot claim old rewards.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Este juego no entrega EXP ni PeakCoins." },
    { status: 410 },
  );
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 604800;

// Compact GLB conversion of Poly Haven's Magnifying Glass 01, dedicated CC0.
// Served same-origin to avoid WebGL cross-origin failures in the cursor overlay.
const MAGNIFIER_MODEL_URL =
  "https://cdn.jsdelivr.net/gh/Papyszoo/CC0-Public-Domain-Models@main/packs/polyhaven-decorative-props/models/magnifying_glass_01/magnifying_glass_01.glb";

export async function GET() {
  try {
    const upstream = await fetch(MAGNIFIER_MODEL_URL, {
      headers: { Accept: "model/gltf-binary, application/octet-stream, */*" },
      next: { revalidate: 604800 },
    });

    if (!upstream.ok) {
      return new NextResponse("Magnifying-glass model unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      return new NextResponse("Invalid magnifying-glass model response", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const model = await upstream.arrayBuffer();
    if (model.byteLength < 1000 || model.byteLength > 4 * 1024 * 1024) {
      return new NextResponse("Magnifying-glass model size is invalid", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(model, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": 'inline; filename="magnifying_glass_01.glb"',
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.warn("Caso Cero: unable to proxy the CC0 magnifying-glass model.", error);
    return new NextResponse("Unable to load magnifying-glass model", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

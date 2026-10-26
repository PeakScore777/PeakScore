import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 604800;

// Poly Haven's Workshop HDRI (CC0); served same-origin so RGBELoader can read it
// without browser CORS issues. The 1K file is used to keep this decorative scene light.
const WORKSHOP_HDRI_URL =
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/workshop_1k.hdr";

export async function GET() {
  try {
    const upstream = await fetch(WORKSHOP_HDRI_URL, {
      headers: { Accept: "application/octet-stream, */*" },
      next: { revalidate: 604800 },
    });

    if (!upstream.ok) {
      return new NextResponse("Workshop HDRI temporarily unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      return new NextResponse("Invalid HDRI response", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'inline; filename="workshop_1k.hdr"',
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Unable to fetch workshop HDRI", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

// Allowlisted source images only; user input never becomes an upstream URL.
const EVIDENCE_IMAGES: Record<string, string> = {
  river:
    "https://images.pexels.com/photos/10010640/pexels-photo-10010640.jpeg?auto=compress&cs=tinysrgb&w=1200",
  samples:
    "https://images.pexels.com/photos/20806050/pexels-photo-20806050.jpeg?auto=compress&cs=tinysrgb&w=1200",
  laboratory:
    "https://images.pexels.com/photos/8850985/pexels-photo-8850985.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { key } = await context.params;
  const source = EVIDENCE_IMAGES[key];

  if (!source) {
    return new NextResponse("Evidence image not found", { status: 404 });
  }

  try {
    const upstream = await fetch(source, {
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8" },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new NextResponse("Evidence image source unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Invalid evidence image response", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Unable to fetch evidence image", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

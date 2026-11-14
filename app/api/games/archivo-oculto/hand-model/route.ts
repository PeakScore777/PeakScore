export const runtime = "nodejs";
export const revalidate = 86400;

const MODEL_URL = "https://files.innerscene.com/library/posable-anatomical-right-hand-f6098b4f/c28ad5ff8fafd424275f/hand-posable.glb";

export async function GET() {
  try {
    const upstream = await fetch(MODEL_URL, {
      headers: { Accept: "model/gltf-binary, application/octet-stream" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "El modelo 3D de la mano no está disponible." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const buffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isGlb = bytes.length >= 12
      && bytes[0] === 0x67
      && bytes[1] === 0x6c
      && bytes[2] === 0x54
      && bytes[3] === 0x46;

    if (!isGlb) {
      return Response.json(
        { error: "La fuente devolvió un archivo 3D inválido." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo descargar el modelo 3D de la mano." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

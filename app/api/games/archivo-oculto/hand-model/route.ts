export const runtime = "nodejs";
export const revalidate = 86400;

const MODEL_URL = "https://files.innerscene.com/library/posable-anatomical-right-hand-f6098b4f/c28ad5ff8fafd424275f/hand-posable.glb";

export async function GET() {
  try {
    const upstream = await fetch(MODEL_URL, {
      headers: { Accept: "model/gltf-binary, application/octet-stream" },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "El modelo 3D no está disponible temporalmente." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const model = await upstream.arrayBuffer();
    if (model.byteLength < 12) {
      return Response.json(
        { error: "El archivo del modelo 3D está incompleto." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return new Response(model, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": String(model.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo obtener el modelo 3D." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

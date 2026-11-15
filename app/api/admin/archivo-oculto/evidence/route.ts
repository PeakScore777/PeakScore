import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type EvidenceInput = {
  title?: unknown;
  description?: unknown;
  tag?: unknown;
  imageUrl?: unknown;
  storagePath?: unknown;
};

type AdminContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string } | null;
  response: NextResponse | null;
};

async function adminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { supabase, user: null, response: NextResponse.json({ error: "No tienes permisos para administrar evidencias." }, { status: 403 }) };
  }

  return { supabase, user: { id: user.id }, response: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length <= maxLength ? cleaned : null;
}

function validNewImage(imageUrl: unknown, storagePath: unknown, userId: string): boolean {
  if (typeof imageUrl !== "string" || typeof storagePath !== "string") return false;
  if (!storagePath.startsWith("archivo-oculto/" + userId + "/")) return false;
  if (!/\.(jpg|png|webp)$/i.test(storagePath)) return false;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return false;

  try {
    const base = new URL(baseUrl);
    const candidate = new URL(imageUrl);
    const expectedPath = "/storage/v1/object/public/question-images/" + storagePath;
    return candidate.origin === base.origin && candidate.pathname === expectedPath;
  } catch {
    return false;
  }
}

function readFields(body: EvidenceInput) {
  const title = cleanText(body.title, 120);
  const description = cleanText(body.description ?? "", 500);
  const tag = cleanText(body.tag ?? "EVIDENCIA", 40);

  if (!title || title.length < 3 || description === null || !tag || tag.length < 2) {
    return null;
  }

  return { title, description, tag };
}

export async function GET() {
  const { supabase, response } = await adminContext();
  if (response) return response;

  const { data, error } = await supabase
    .from("game_evidence_assets")
    .select("id,title,description,tag,image_url,storage_path,created_at,updated_at")
    .eq("game_key", "archivo-oculto")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[archivo-oculto-evidence] Read failed:", error.message);
    return NextResponse.json({ error: "No se pudo cargar la galería de evidencias." }, { status: 500 });
  }

  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await adminContext();
  if (response || !user) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isRecord(body)) return NextResponse.json({ error: "Datos de evidencia inválidos." }, { status: 400 });
  const fields = readFields(body);
  if (!fields || !validNewImage(body.imageUrl, body.storagePath, user.id)) {
    return NextResponse.json({ error: "Completa el título y sube una fotografía válida desde el editor." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("game_evidence_assets")
    .insert({
      game_key: "archivo-oculto",
      ...fields,
      image_url: body.imageUrl,
      storage_path: body.storagePath,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id,title,description,tag,image_url,storage_path,created_at,updated_at")
    .single();

  if (error || !data) {
    console.error("[archivo-oculto-evidence] Create failed:", error?.message);
    return NextResponse.json({ error: "No se pudo guardar la evidencia." }, { status: 500 });
  }

  return NextResponse.json({ asset: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user, response } = await adminContext();
  if (response || !user) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Selecciona una evidencia válida." }, { status: 400 });
  }

  const fields = readFields(body);
  if (!fields) return NextResponse.json({ error: "Revisa el título, descripción y etiqueta." }, { status: 400 });

  const update: Record<string, unknown> = {
    ...fields,
    updated_at: new Date().toISOString(),
  };

  const hasImageUrl = body.imageUrl !== undefined;
  const hasStoragePath = body.storagePath !== undefined;
  if (hasImageUrl !== hasStoragePath) {
    return NextResponse.json({ error: "La fotografía nueva está incompleta." }, { status: 400 });
  }
  if (hasImageUrl && hasStoragePath) {
    if (!validNewImage(body.imageUrl, body.storagePath, user.id)) {
      return NextResponse.json({ error: "La fotografía nueva no pertenece a una carga válida de este administrador." }, { status: 400 });
    }
    update.image_url = body.imageUrl;
    update.storage_path = body.storagePath;
  }

  const { data, error } = await supabase
    .from("game_evidence_assets")
    .update(update)
    .eq("id", body.id)
    .eq("game_key", "archivo-oculto")
    .select("id,title,description,tag,image_url,storage_path,created_at,updated_at")
    .maybeSingle();

  if (error || !data) {
    console.error("[archivo-oculto-evidence] Update failed:", error?.message);
    return NextResponse.json({ error: "No se pudo actualizar la evidencia." }, { status: 500 });
  }

  return NextResponse.json({ asset: data });
}

export async function DELETE(request: Request) {
  const { supabase, response } = await adminContext();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Selecciona una evidencia válida." }, { status: 400 });
  }

  const { error } = await supabase
    .from("game_evidence_assets")
    .delete()
    .eq("id", body.id)
    .eq("game_key", "archivo-oculto");

  if (error) {
    console.error("[archivo-oculto-evidence] Delete failed:", error.message);
    return NextResponse.json({ error: "No se pudo eliminar la evidencia." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

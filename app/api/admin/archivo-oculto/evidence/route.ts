import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type EvidenceInput = {
  title?: unknown;
  description?: unknown;
  tag?: unknown;
  imageUrl?: unknown;
  storagePath?: unknown;
  passageId?: unknown;
  displayAfterParagraph?: unknown;
  layout?: unknown;
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
    .select("id,title,description,tag,image_url,storage_path,passage_id,display_after_paragraph,layout,created_at,updated_at")
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
  const passageId = body.passageId === null || body.passageId === "" || body.passageId === undefined
    ? null
    : typeof body.passageId === "string" ? body.passageId : undefined;
  const displayAfterParagraph = Number(body.displayAfterParagraph ?? 1);
  const layout = body.layout === "wide" ? "wide" : body.layout === "float" || body.layout === undefined ? "float" : null;

  if (!fields || !validNewImage(body.imageUrl, body.storagePath, user.id)
    || passageId === undefined || !Number.isInteger(displayAfterParagraph)
    || displayAfterParagraph < 0 || displayAfterParagraph > 30 || !layout) {
    return NextResponse.json({ error: "Revisa el título, la fotografía, la posición en la lectura y su presentación." }, { status: 400 });
  }

  if (passageId) {
    const { data: passage } = await supabase.from("game_reading_passages")
      .select("id").eq("id", passageId).eq("game_key", "archivo-oculto").maybeSingle();
    if (!passage) return NextResponse.json({ error: "La lectura seleccionada no existe o no está disponible." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("game_evidence_assets")
    .insert({
      game_key: "archivo-oculto",
      ...fields,
      image_url: body.imageUrl,
      storage_path: body.storagePath,
      passage_id: passageId,
      display_after_paragraph: displayAfterParagraph,
      layout,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select("id,title,description,tag,image_url,storage_path,passage_id,display_after_paragraph,layout,created_at,updated_at")
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

  const { data: previousAsset, error: previousAssetError } = await supabase
    .from("game_evidence_assets")
    .select("storage_path")
    .eq("id", body.id)
    .eq("game_key", "archivo-oculto")
    .maybeSingle();

  if (previousAssetError || !previousAsset) {
    return NextResponse.json({ error: "La evidencia que intentas editar ya no existe." }, { status: 404 });
  }

  const fields = readFields(body);
  const passageId = body.passageId === null || body.passageId === "" || body.passageId === undefined
    ? null
    : typeof body.passageId === "string" ? body.passageId : undefined;
  const displayAfterParagraph = Number(body.displayAfterParagraph ?? 1);
  const layout = body.layout === "wide" ? "wide" : body.layout === "float" || body.layout === undefined ? "float" : null;
  if (!fields || passageId === undefined || !Number.isInteger(displayAfterParagraph)
    || displayAfterParagraph < 0 || displayAfterParagraph > 30 || !layout) {
    return NextResponse.json({ error: "Revisa el título, descripción, lectura y posición de la fotografía." }, { status: 400 });
  }

  if (passageId) {
    const { data: passage } = await supabase.from("game_reading_passages")
      .select("id").eq("id", passageId).eq("game_key", "archivo-oculto").maybeSingle();
    if (!passage) return NextResponse.json({ error: "La lectura seleccionada no existe o no está disponible." }, { status: 404 });
  }

  const update: Record<string, unknown> = {
    ...fields,
    passage_id: passageId,
    display_after_paragraph: displayAfterParagraph,
    layout,
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
    .select("id,title,description,tag,image_url,storage_path,passage_id,display_after_paragraph,layout,created_at,updated_at")
    .maybeSingle();

  if (error || !data) {
    console.error("[archivo-oculto-evidence] Update failed:", error?.message);
    return NextResponse.json({ error: "No se pudo actualizar la evidencia." }, { status: 500 });
  }

  if (hasImageUrl && previousAsset.storage_path && previousAsset.storage_path !== data.storage_path) {
    const { data: stillReferenced, error: referenceError } = await supabase
      .from("game_evidence_assets")
      .select("id")
      .eq("storage_path", previousAsset.storage_path)
      .limit(1);

    if (!referenceError && !stillReferenced?.length) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from("question-images")
        .remove([previousAsset.storage_path]);
      if (cleanupError) {
        console.warn("[archivo-oculto-evidence] Old photo cleanup failed:", cleanupError.message);
      }
    }
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

  const { data: asset, error: readError } = await supabase
    .from("game_evidence_assets")
    .select("storage_path")
    .eq("id", body.id)
    .eq("game_key", "archivo-oculto")
    .maybeSingle();

  if (readError || !asset) {
    return NextResponse.json({ error: "La evidencia que intentas eliminar ya no existe." }, { status: 404 });
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

  if (asset.storage_path) {
    const { data: stillReferenced, error: referenceError } = await supabase
      .from("game_evidence_assets")
      .select("id")
      .eq("storage_path", asset.storage_path)
      .limit(1);

    if (!referenceError && !stillReferenced?.length) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from("question-images")
        .remove([asset.storage_path]);
      if (cleanupError) {
        console.warn("[archivo-oculto-evidence] Deleted photo cleanup failed:", cleanupError.message);
      }
    }
  }

  return NextResponse.json({ success: true });
}

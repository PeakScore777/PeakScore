import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractPdfPages } from "@/lib/pdf/extractPdfPages";
import { ICFES_SUBJECTS, type IcfesSubject } from "@/lib/ai/orby-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "orby-knowledge";
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_CHUNKS = 300;
const MAX_CHUNK_CHARS = 2100;

type ChunkDraft = { subject: IcfesSubject; topic: string; page_number: number; chunk_index: number; content: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function getAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return { user: null };
  return { user };
}

function splitText(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\r/g, "").replace(/[\t ]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) chunks.push(current), current = "";
      for (let i = 0; i < paragraph.length; i += maxChars) chunks.push(paragraph.slice(i, i + maxChars).trim());
      continue;
    }
    const candidate = current ? current + "\n\n" + paragraph : paragraph;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = paragraph;
    } else current = candidate;
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function GET() {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const { data, error } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("id,title,original_name,subject,topic,page_count,chunk_count,status,created_at,updated_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[Orby Knowledge] List failed.", { code: error.code });
    return jsonError("No se pudo cargar la biblioteca de Orby.", 503);
  }
  return NextResponse.json({ documents: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);

  try {
    const limitResult = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id, p_bucket: "orby_admin_knowledge_upload", p_max_requests: 8, p_window_seconds: 86400,
    });
    if (limitResult.error || !limitResult.data || typeof limitResult.data !== "object") return jsonError("El control de carga no está disponible.", 503);
    if (!(limitResult.data as { allowed?: boolean }).allowed) return jsonError("Alcanzaste el límite diario de cargas. Inténtalo mañana.", 429);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Selecciona un archivo PDF.", 400);
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return jsonError("Solo se admiten documentos PDF.", 415);
    if (file.size < 1 || file.size > MAX_PDF_BYTES) return jsonError("El PDF debe pesar como máximo 20 MB.", 413);

    const subject = form.get("subject");
    if (typeof subject !== "string" || !ICFES_SUBJECTS.includes(subject as IcfesSubject)) return jsonError("Selecciona una de las cinco áreas de Saber 11.", 400);
    const title = String(form.get("title") ?? file.name.replace(/\.pdf$/i, "")).trim().slice(0, 180);
    const topic = String(form.get("topic") ?? "").trim().slice(0, 180);
    if (!title || !topic) return jsonError("Indica un título y un tema para clasificar el documento.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    let extracted: Awaited<ReturnType<typeof extractPdfPages>>;
    try {
      extracted = await extractPdfPages(buffer);
    } catch (error) {
      console.error("[Orby Knowledge] PDF extraction failed.", { name: error instanceof Error ? error.name : "Unknown" });
      return jsonError("No se pudo leer este PDF. Comprueba que no esté dañado o protegido.", 422);
    }
    if (!extracted.hasExtractableText) return jsonError("El PDF parece escaneado o no contiene texto seleccionable. Convierte el documento a PDF con texto antes de cargarlo.", 422);

    const drafts: Omit<ChunkDraft, "chunk_index">[] = [];
    for (const page of extracted.pages) {
      for (const content of splitText(page.text, MAX_CHUNK_CHARS)) {
        if (content.length >= 40) drafts.push({ subject: subject as IcfesSubject, topic, page_number: page.pageNumber, content });
        if (drafts.length > MAX_CHUNKS) return jsonError("El documento supera el máximo de 300 fragmentos. Divide el material en archivos más pequeños.", 413);
      }
    }
    if (!drafts.length) return jsonError("No se pudo extraer suficiente texto útil del PDF.", 422);

    const id = crypto.randomUUID();
    const extensionPath = user.id + "/" + id + ".pdf";
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(extensionPath, buffer, {
      contentType: "application/pdf", cacheControl: "3600", upsert: false,
    });
    if (uploadError) {
      console.error("[Orby Knowledge] Private PDF upload failed.", { message: uploadError.message });
      return jsonError("No se pudo almacenar el documento privado.", 503);
    }

    const { data: document, error: documentError } = await supabaseAdmin.from("orby_knowledge_documents").insert({
      id, uploaded_by: user.id, title, original_name: file.name.slice(0, 180), subject, topic,
      storage_path: extensionPath, page_count: extracted.totalPages, chunk_count: drafts.length, status: "draft",
    }).select("id,title,subject,topic,page_count,chunk_count,status,created_at").single();
    if (documentError || !document) {
      await supabaseAdmin.storage.from(BUCKET).remove([extensionPath]);
      console.error("[Orby Knowledge] Document record failed.", { code: documentError?.code });
      return jsonError("No se pudo registrar el documento.", 503);
    }

    const chunks = drafts.map((item, chunk_index) => ({ ...item, document_id: id, chunk_index }));
    const { error: chunkError } = await supabaseAdmin.from("orby_knowledge_chunks").insert(chunks);
    if (chunkError) {
      await supabaseAdmin.from("orby_knowledge_documents").delete().eq("id", id);
      await supabaseAdmin.storage.from(BUCKET).remove([extensionPath]);
      console.error("[Orby Knowledge] Chunk indexing failed.", { code: chunkError.code });
      return jsonError("No se pudo indexar el contenido. El documento no se publicó.", 503);
    }

    return NextResponse.json({ document, message: "Material analizado y guardado como borrador. Revísalo antes de publicarlo para Orby." }, {
      status: 201, headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return jsonError("No se pudo procesar el documento.", 500);
  }
}

export async function PATCH(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === "string" ? body.id : "";
  const status = body?.status;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !["published","archived","draft"].includes(status)) {
    return jsonError("La solicitud de publicación no es válida.", 400);
  }
  const { data: existing, error: lookupError } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("id,chunk_count").eq("id", id).maybeSingle();
  if (lookupError || !existing) return jsonError("No se encontró el documento.", 404);
  if (status === "published" && existing.chunk_count < 1) return jsonError("No se puede publicar un documento sin contenido indexado.", 409);
  const { data, error } = await supabaseAdmin.from("orby_knowledge_documents").update({
    status, updated_at: new Date().toISOString(),
  }).eq("id", id).select("id,status,updated_at").single();
  if (error) return jsonError("No se pudo cambiar el estado del documento.", 503);
  return NextResponse.json({ document: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const { user } = await getAdmin();
  if (!user) return jsonError("Acceso reservado al administrador.", 403);
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return jsonError("Documento no válido.", 400);
  const { data: document, error: lookupError } = await supabaseAdmin.from("orby_knowledge_documents")
    .select("storage_path").eq("id", id).maybeSingle();
  if (lookupError || !document) return jsonError("No se encontró el documento.", 404);
  if (document.storage_path) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([document.storage_path]);
    if (removeError) return jsonError("No se pudo eliminar el archivo privado.", 503);
  }
  const { error } = await supabaseAdmin.from("orby_knowledge_documents").delete().eq("id", id);
  if (error) return jsonError("No se pudo eliminar el documento.", 503);
  return NextResponse.json({ deleted: true });
}

import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enrichOrbyKnowledgeDocument } from "@/lib/ai/orby-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const body = await request.json().catch(() => ({}));
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";
  if (documentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
    return jsonError("El identificador del documento no es válido.", 400);
  }

  let query = supabaseAdmin.from("orby_knowledge_documents")
    .select("id,title,chunk_count,embedded_chunk_count,knowledge_profile_status")
    .order("created_at", { ascending: false })
    .limit(documentId ? 1 : 20);

  if (documentId) query = query.eq("id", documentId);

  const { data: allDocuments, error } = await query;
  if (error) {
    console.error("[Orby Knowledge Enrichment] Document lookup failed.", { code: error.code });
    return jsonError("No se pudieron consultar los documentos pendientes de enriquecimiento.", 503);
  }
  if (documentId && !allDocuments?.length) return jsonError("No se encontró el documento solicitado.", 404);
  const documents = documentId
    ? allDocuments ?? []
    : (allDocuments ?? []).filter((item) =>
        item.knowledge_profile_status !== "ready"
        || Number(item.embedded_chunk_count ?? 0) < Number(item.chunk_count ?? 0)
      );

  const results: Array<{ id: string; title: string; embedded: number; concepts: number; success: boolean; reason?: string }> = [];
  for (const document of documents ?? []) {
    try {
      const { data: chunks, error: chunksError } = await supabaseAdmin.from("orby_knowledge_chunks")
        .select("chunk_index,page_number,content")
        .eq("document_id", document.id)
        .order("page_number", { ascending: true })
        .order("chunk_index", { ascending: true })
        .limit(300);
      if (chunksError) throw new Error("chunk_read_" + chunksError.code);
      if (!chunks?.length) throw new Error("no_extracted_chunks");

      const result = await enrichOrbyKnowledgeDocument(
        { id: document.id, title: document.title },
        chunks
      );
      results.push({
        id: document.id,
        title: document.title,
        embedded: result.embedded,
        concepts: result.concepts,
        success: true,
      });
    } catch (error) {
      await supabaseAdmin.from("orby_knowledge_documents")
        .update({ knowledge_profile_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", document.id);
      console.error("[Orby Knowledge Enrichment] Document enrichment failed.", {
        documentId: document.id,
        name: error instanceof Error ? error.name : "UnknownError",
      });
      results.push({
        id: document.id,
        title: document.title,
        embedded: 0,
        concepts: 0,
        success: false,
        reason: "No se pudo completar el enriquecimiento. El texto y el índice anterior se conservaron.",
      });
    }
  }

  return NextResponse.json({
    results,
    succeeded: results.filter((item) => item.success).length,
    failed: results.filter((item) => !item.success).length,
    message: results.length
      ? "Terminó el proceso de enriquecimiento de la biblioteca."
      : "Todos los documentos ya tienen un perfil académico y su índice semántico actualizado.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

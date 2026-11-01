import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  enqueueOrbyKnowledgeDocument,
  loadOrbyKnowledgeChunks,
} from "@/lib/ai/orby-knowledge-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    .select("id,title")
    .order("created_at", { ascending: true })
    .limit(documentId ? 1 : 100);

  if (documentId) query = query.eq("id", documentId);
  else query = query.in("status", ["draft", "published"]);

  const { data: documents, error } = await query;
  if (error) return jsonError("No se pudieron consultar los documentos de la biblioteca.", 503);
  if (documentId && !documents?.length) return jsonError("No se encontró el documento solicitado.", 404);

  const results: Array<{
    id: string;
    title: string;
    jobId?: string;
    state?: string;
    success: boolean;
    alreadyCurrent?: boolean;
    reason?: string;
  }> = [];

  for (const document of documents ?? []) {
    try {
      const chunks = await loadOrbyKnowledgeChunks(document.id);
      if (!chunks.length) throw new Error("El documento no tiene fragmentos para procesar.");
      const result = await enqueueOrbyKnowledgeDocument(document.id, chunks, { retryFailed: true });
      results.push({
        id: document.id,
        title: document.title,
        jobId: result.job.id,
        state: result.job.status,
        success: true,
        alreadyCurrent: result.alreadyCurrent,
      });
    } catch (error) {
      results.push({
        id: document.id,
        title: document.title,
        success: false,
        reason: error instanceof Error ? error.message.slice(0, 350) : "No se pudo programar la tarea.",
      });
    }
  }

  const queued = results.filter((item) => item.success && !item.alreadyCurrent).length;
  const alreadyCurrent = results.filter((item) => item.success && item.alreadyCurrent).length;
  const failed = results.filter((item) => !item.success).length;

  return NextResponse.json({
    results,
    queued,
    alreadyCurrent,
    failed,
    message: queued
      ? "Se añadieron " + queued + " documento(s) a la cola. El motor automático continuará por lotes."
      : alreadyCurrent
        ? "El conocimiento ya está actualizado; no se repitieron llamadas de IA."
        : "No había documentos nuevos para procesar.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

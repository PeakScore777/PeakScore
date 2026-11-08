import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enqueueNextPendingOrbyKnowledgeDocument } from "@/lib/ai/orby-knowledge-queue";
import { processNextOrbyKnowledgeJob } from "@/lib/ai/orby-knowledge-worker";
import { resumeOrbyJobsWaitingForEmbeddingProvider } from "@/lib/ai/orby-knowledge-queue";
import { isGeminiFreeTierConfigured, isCloudflareWorkersAIFreeTierConfigured } from "@/lib/ai/provider-free-tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const workerId = randomUUID();
  const { data: acquired, error: lockError } = await supabaseAdmin.rpc("orby_acquire_knowledge_worker_lane", {
    p_worker_id: workerId,
    p_lease_seconds: 600,
    p_worker_lane: "manual",
  });
  if (lockError) {
    console.error("[Orby Manual Worker] Lock failed.", { code: lockError.code });
    return jsonError("No se pudo comprobar si Orby está ocupado.", 503);
  }
  if (!acquired) return jsonError("Ya hay otra ejecución manual en curso. El Autopilot puede trabajar en paralelo.", 409);

  try {
    const resumed = await resumeOrbyJobsWaitingForEmbeddingProvider();
    const hasEmbeddingProvider = isGeminiFreeTierConfigured() || isCloudflareWorkersAIFreeTierConfigured();
    const queued = hasEmbeddingProvider
      ? await enqueueNextPendingOrbyKnowledgeDocument()
      : false;

    // The database promotes the oldest eligible queued job using its own clock.
    // This avoids a Vercel/Postgres clock-skew race at the instant we claim it.
    // Manual runs bypass the automatic seven-hour budget but still respect retries.
    const { data: promotedJobId, error: promoteError } = await supabaseAdmin.rpc(
      "orby_promote_next_manual_knowledge_job"
    );
    if (promoteError) throw new Error("No se pudo preparar la siguiente tarea manual: " + promoteError.code);

    const result = await processNextOrbyKnowledgeJob({ origin: "manual" });
    return NextResponse.json({
      ...result,
      queuedPendingDocument: queued,
      resumedProviderWaitJobs: resumed,
      message: result.state === "idle"
        ? promotedJobId
          ? "La tarea se preparó para ejecución manual, pero el trabajador no pudo reclamarla en este intento. El presupuesto automático no afecta esta ejecución; vuelve a intentarlo."
          : result.message || "No hay tareas pendientes. Los documentos ya están al día."
        : result.message ?? "Se procesó una etapa de la cola.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Orby Manual Worker] Run failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 350) : "unknown",
    });
    return jsonError("No se pudo procesar el siguiente lote de Orby.", 500);
  } finally {
    const { error } = await supabaseAdmin.rpc("orby_release_knowledge_worker_lane", {
      p_worker_id: workerId,
      p_worker_lane: "manual",
    });
    if (error) console.error("[Orby Manual Worker] Lock release failed.", { code: error.code });
  }
}

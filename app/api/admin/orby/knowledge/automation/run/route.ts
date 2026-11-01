import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enqueueNextPendingOrbyKnowledgeDocument } from "@/lib/ai/orby-knowledge-queue";
import { processNextOrbyKnowledgeJob } from "@/lib/ai/orby-knowledge-worker";

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
  const { data: acquired, error: lockError } = await supabaseAdmin.rpc("orby_acquire_knowledge_worker_lock", {
    p_worker_id: workerId,
    p_lease_seconds: 600,
  });
  if (lockError) {
    console.error("[Orby Manual Worker] Lock failed.", { code: lockError.code });
    return jsonError("No se pudo comprobar si Orby está ocupado.", 503);
  }
  if (!acquired) return jsonError("Orby ya está procesando otro lote. Espera a que termine y vuelve a intentarlo.", 409);

  try {
    const queued = await enqueueNextPendingOrbyKnowledgeDocument();

    // A manual admin action means "run now", not "wait for the next
    // five-minute autopilot slot". Promote only the oldest queued job while
    // holding the global worker lock; the worker still enforces the shared
    // daily AI-cycle limit and all document/publication checks.
    const { data: nextQueuedJob, error: queuedJobError } = await supabaseAdmin
      .from("orby_knowledge_jobs")
      .select("id")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (queuedJobError) throw new Error("No se pudo consultar la siguiente tarea de la cola.");

    if (nextQueuedJob?.id) {
      const readyAt = new Date().toISOString();
      const { error: promoteError } = await supabaseAdmin
        .from("orby_knowledge_jobs")
        .update({ available_at: readyAt, updated_at: readyAt })
        .eq("id", nextQueuedJob.id)
        .eq("status", "queued");
      if (promoteError) throw new Error("No se pudo adelantar la tarea manual.");
    }

    const result = await processNextOrbyKnowledgeJob({ origin: "manual" });
    const now = new Date().toISOString();
    await supabaseAdmin.from("orby_knowledge_automation_settings")
      .update({
        last_tick_at: now,
        ...(result.state !== "idle" ? { last_job_started_at: now } : {}),
        updated_at: now,
      })
      .eq("id", 1);

    return NextResponse.json({
      ...result,
      queuedPendingDocument: queued,
      message: result.state === "idle"
        ? nextQueuedJob
          ? "El documento continúa en cola; comprueba si se alcanzó el límite diario de 10 ciclos IA."
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
    const { error } = await supabaseAdmin.rpc("orby_release_knowledge_worker_lock", {
      p_worker_id: workerId,
    });
    if (error) console.error("[Orby Manual Worker] Lock release failed.", { code: error.code });
  }
}

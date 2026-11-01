import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enqueueNextPendingOrbyKnowledgeDocument } from "@/lib/ai/orby-knowledge-queue";
import { processNextOrbyKnowledgeJob } from "@/lib/ai/orby-knowledge-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!expected || !authorization.startsWith("Bearer ")) return false;

  const supplied = Buffer.from(authorization.slice(7));
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("orby_knowledge_automation_settings")
    .select("enabled")
    .eq("id", 1)
    .maybeSingle();
  if (settingsError) {
    console.error("[Orby Autopilot] Settings lookup failed.", { code: settingsError.code });
    return NextResponse.json({ error: "No se pudo consultar el estado del motor." }, { status: 503 });
  }

  const tickAt = new Date().toISOString();
  await supabaseAdmin.from("orby_knowledge_automation_settings")
    .update({ last_tick_at: tickAt, updated_at: tickAt })
    .eq("id", 1);

  if (!settings?.enabled) {
    return NextResponse.json({ state: "disabled", message: "El motor automático está pausado." }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const workerLockOwner = randomUUID();
  const { data: acquired, error: lockError } = await supabaseAdmin.rpc("orby_acquire_knowledge_worker_lock", {
    p_worker_id: workerLockOwner,
    p_lease_seconds: 600,
  });
  if (lockError) {
    console.error("[Orby Autopilot] Global lock check failed.", { code: lockError.code });
    return NextResponse.json({ error: "No se pudo comprobar el bloqueo del trabajador." }, { status: 503 });
  }
  if (!acquired) {
    return NextResponse.json({ state: "busy", message: "Orby ya está procesando otra tarea." }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    await enqueueNextPendingOrbyKnowledgeDocument();
    const result = await processNextOrbyKnowledgeJob();
    if (result.state !== "idle") {
      await supabaseAdmin.from("orby_knowledge_automation_settings")
        .update({ last_job_started_at: tickAt, updated_at: tickAt })
        .eq("id", 1);
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Orby Autopilot] Tick failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 350) : "unknown",
    });
    return NextResponse.json({ state: "failed", error: "Falló el ciclo automático de Orby." }, { status: 500 });
  } finally {
    const { error: releaseError } = await supabaseAdmin.rpc("orby_release_knowledge_worker_lock", {
      p_worker_id: workerLockOwner,
    });
    if (releaseError) {
      console.error("[Orby Autopilot] Global worker lock release failed.", { code: releaseError.code });
    }
  }
}

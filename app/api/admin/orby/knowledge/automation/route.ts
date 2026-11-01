import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const [settingsResult, queued, running, retrying, failed, completed, recent] = await Promise.all([
    supabaseAdmin.from("orby_knowledge_automation_settings")
      .select("enabled,last_tick_at,last_job_started_at,updated_at")
      .eq("id", 1).maybeSingle(),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "retrying"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("orby_knowledge_jobs")
      .select("id,document_id,status,stage,next_batch_index,total_batches,attempt_count,last_error,updated_at,completed_at")
      .order("updated_at", { ascending: false }).limit(8),
  ]);

  if (settingsResult.error || !settingsResult.data) return jsonError("No se pudo consultar la configuración del motor.", 503);
  if ([queued, running, retrying, failed, completed].some((result) => result.error) || recent.error) {
    return jsonError("No se pudo consultar el estado de la cola de Orby.", 503);
  }

  return NextResponse.json({
    settings: settingsResult.data,
    counts: {
      queued: queued.count ?? 0,
      running: running.count ?? 0,
      retrying: retrying.count ?? 0,
      failed: failed.count ?? 0,
      completed: completed.count ?? 0,
    },
    recent: recent.data ?? [],
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return jsonError("Indica si deseas activar o pausar el motor.", 400);

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from("orby_knowledge_automation_settings")
    .update({ enabled: body.enabled, updated_at: now })
    .eq("id", 1)
    .select("enabled,last_tick_at,last_job_started_at,updated_at")
    .single();

  if (error || !data) return jsonError("No se pudo actualizar el motor automático.", 503);
  return NextResponse.json({
    settings: data,
    message: data.enabled
      ? "Motor activado. Orby procesará solo tareas pendientes, una etapa por ciclo."
      : "Motor pausado. Las tareas guardadas se conservan y podrán continuar al reactivarlo.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

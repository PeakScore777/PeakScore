import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

function normalizeProfileIdentity(value: unknown): string {
  return (typeof value === "string" ? value : "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const [settingsResult, queued, running, retrying, failed, completed, recent, workerConfiguration] = await Promise.all([
    supabaseAdmin.from("orby_knowledge_automation_settings")
      .select("enabled,last_tick_at,last_job_started_at,ai_cycle_date,ai_cycles_used,updated_at")
      .eq("id", 1).maybeSingle(),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "retrying"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabaseAdmin.from("orby_knowledge_jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("orby_knowledge_jobs")
      .select("id,document_id,status,stage,next_batch_index,total_batches,attempt_count,last_error,updated_at,completed_at")
      .order("updated_at", { ascending: false }).limit(20),
    supabaseAdmin.rpc("orby_knowledge_autopilot_is_configured"),
  ]);

  if (settingsResult.error || !settingsResult.data) return jsonError("No se pudo consultar la configuración del motor.", 503);
  if ([queued, running, retrying, failed, completed].some((result) => result.error) || recent.error) {
    return jsonError("No se pudo consultar el estado de la cola de Orby.", 503);
  }

  const recentJobs = recent.data ?? [];
  const documentIds = [...new Set(recentJobs.map((job) => job.document_id))];
  const { data: recentDocuments, error: recentDocumentsError } = documentIds.length
    ? await supabaseAdmin.from("orby_knowledge_documents")
        .select("id,title,embedded_chunk_count,chunk_count,ingestion_status,coverage_percent,visual_pages_total,visual_pages_reviewed,auto_review_count,next_review_at,concept_count")
        .in("id", documentIds)
    : { data: [], error: null };
  if (recentDocumentsError) return jsonError("No se pudo consultar el avance de los documentos.", 503);
  const documentById = new Map((recentDocuments ?? []).map((document) => [document.id, document]));
  const { data: savedBatches, error: savedBatchesError } = recentJobs.length
    ? await supabaseAdmin.from("orby_knowledge_job_batches")
        .select("job_id,batch_index,result")
        .in("job_id", recentJobs.map((job) => job.id))
        .order("batch_index", { ascending: true })
    : { data: [], error: null };
  if (savedBatchesError) return jsonError("No se pudieron consultar los resultados parciales del perfil.", 503);

  const profileStats = new Map<string, {
    stored_profile_batches: number;
    detected_concept_count: number;
    detected_topic_count: number;
    detected_competency_count: number;
    teaching_method_count: number;
    worked_example_count: number;
    question_pattern_count: number;
    question_solution_count: number;
    solving_method_count: number;
    study_path_count: number;
    exercise_blueprint_count: number;
    visual_element_count: number;
    detected_areas: string[];
    concept_preview: Array<{ name: string; area: string; parent_concept: string; evidence_pages: number[] }>;
    question_pattern_preview: Array<{ archetype: string; stimulus_type: string; task: string; evidence_pages: number[] }>;
    question_solution_preview: Array<{
      question_number: number | null;
      area: string;
      skill: string;
      problem_summary: string;
      candidate_option: string | null;
      answer_basis: string;
      answer_key_comparison: string;
      reasoning_steps: string[];
      confidence: number;
      evidence_pages: number[];
    }>;
    teaching_method_preview: Array<{ concept: string; student_level_zero: string; evidence_pages: number[] }>;
  }>();

  for (const job of recentJobs) {
    const rows = (savedBatches ?? []).filter((row) => row.job_id === job.id);
    const concepts = new Map<string, { name: string; area: string; parent_concept: string; evidence_pages: number[] }>();
    const topics = new Set<string>();
    const competencies = new Set<string>();
    const areas = new Set<string>();
    const teachingMethods = new Map<string, { concept: string; student_level_zero: string; evidence_pages: number[] }>();
    const workedExamples = new Set<string>();
    const questionPatterns = new Map<string, { archetype: string; stimulus_type: string; task: string; evidence_pages: number[] }>();
    const questionSolutions = new Map<string, {
      question_number: number | null;
      area: string;
      skill: string;
      problem_summary: string;
      candidate_option: string | null;
      answer_basis: string;
      confidence: number;
      evidence_pages: number[];
    }>();
    const solvingMethods = new Set<string>();
    const studyPaths = new Set<string>();
    const exerciseBlueprints = new Set<string>();
    const visualElements = new Set<string>();

    for (const row of rows) {
      const result = row.result && typeof row.result === "object" ? row.result as Record<string, unknown> : {};
      if (Array.isArray(result.topics)) {
        for (const topic of result.topics) if (typeof topic === "string" && topic.trim()) topics.add(normalizeProfileIdentity(topic));
      }
      if (Array.isArray(result.areas)) {
        for (const area of result.areas) if (typeof area === "string" && area.trim()) areas.add(area.trim());
      }
      if (Array.isArray(result.competencies)) {
        for (const competency of result.competencies) {
          if (competency && typeof competency === "object" && "name" in competency && typeof competency.name === "string") {
            competencies.add(normalizeProfileIdentity(competency.name));
          }
        }
      }
      const pedagogy = result.pedagogical_knowledge && typeof result.pedagogical_knowledge === "object"
        ? result.pedagogical_knowledge as Record<string, unknown>
        : {};
      if (Array.isArray(pedagogy.teaching_methods)) {
        for (const method of pedagogy.teaching_methods) {
          if (!method || typeof method !== "object") continue;
          const item = method as Record<string, unknown>;
          const concept = typeof item.concept === "string" ? item.concept.trim() : "";
          const explanation = typeof item.student_level_zero === "string" ? item.student_level_zero.trim() : "";
          if (!concept || !explanation) continue;
          const key = normalizeProfileIdentity(concept);
          teachingMethods.set(key, {
            concept,
            student_level_zero: explanation,
            evidence_pages: Array.isArray(item.evidence_pages) ? item.evidence_pages.filter((page: unknown): page is number => typeof page === "number") : [],
          });
        }
      }
      if (Array.isArray(pedagogy.worked_examples)) {
        for (const item of pedagogy.worked_examples) {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          if (typeof value.topic === "string") workedExamples.add(normalizeProfileIdentity(value.topic + "|" + String(value.problem_summary ?? "")));
        }
      }
      if (Array.isArray(pedagogy.question_patterns)) {
        for (const pattern of pedagogy.question_patterns) {
          if (!pattern || typeof pattern !== "object") continue;
          const item = pattern as Record<string, unknown>;
          const archetype = typeof item.archetype === "string" ? item.archetype.trim() : "";
          const stimulus = typeof item.stimulus_type === "string" ? item.stimulus_type.trim() : "";
          const task = typeof item.task === "string" ? item.task.trim() : "";
          if (!archetype || !task) continue;
          const key = normalizeProfileIdentity(archetype + "|" + stimulus + "|" + task);
          questionPatterns.set(key, {
            archetype,
            stimulus_type: stimulus,
            task,
            evidence_pages: Array.isArray(item.evidence_pages) ? item.evidence_pages.filter((page: unknown): page is number => typeof page === "number") : [],
          });
        }
      }
      if (Array.isArray(pedagogy.question_solutions)) {
        for (const solution of pedagogy.question_solutions) {
          if (!solution || typeof solution !== "object") continue;
          const item = solution as Record<string, unknown>;
          const summary = typeof item.problem_summary === "string" ? item.problem_summary.trim() : "";
          const area = typeof item.area === "string" ? item.area.trim() : "";
          const skill = typeof item.skill === "string" ? item.skill.trim() : "";
          const basis = typeof item.answer_basis === "string" ? item.answer_basis : "insufficient_information";
          const pages = Array.isArray(item.evidence_pages)
            ? item.evidence_pages.filter((page: unknown): page is number => typeof page === "number" && Number.isInteger(page) && page > 0)
            : [];
          if (!summary || !area || !pages.length) continue;
          const number = Number.isInteger(Number(item.question_number)) && Number(item.question_number) > 0
            ? Number(item.question_number)
            : null;
          const option = ["A","B","C","D","E","F","G","H"].includes(String(item.candidate_option).toUpperCase())
            ? String(item.candidate_option).toUpperCase()
            : null;
          const confidence = Number.isFinite(Number(item.confidence))
            ? Math.max(0, Math.min(1, Number(item.confidence)))
            : 0;
          const key = normalizeProfileIdentity(area + "|" + skill + "|" + String(number ?? "") + "|" + summary);
          questionSolutions.set(key, {
            question_number: number,
            area,
            skill,
            problem_summary: summary.slice(0, 300),
            candidate_option: option,
            answer_basis: basis,
            answer_key_comparison: ["matches","conflicts","not_available","not_applicable"].includes(String(item.answer_key_comparison))
              ? String(item.answer_key_comparison)
              : "not_available",
            reasoning_steps: Array.isArray(item.reasoning_steps)
              ? item.reasoning_steps.filter((step: unknown): step is string => typeof step === "string" && step.trim().length > 0).slice(0, 5).map((step) => step.trim().slice(0, 220))
              : [],
            confidence,
            evidence_pages: [...new Set(pages)].slice(0, 8),
          });
        }
      }
      if (Array.isArray(pedagogy.solving_methods)) {
        for (const item of pedagogy.solving_methods) {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          if (typeof value.name === "string") solvingMethods.add(normalizeProfileIdentity(value.name));
        }
      }
      if (Array.isArray(pedagogy.study_paths)) {
        for (const item of pedagogy.study_paths) {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          if (typeof value.goal === "string") studyPaths.add(normalizeProfileIdentity(value.goal));
        }
      }
      if (Array.isArray(pedagogy.exercise_blueprints)) {
        for (const item of pedagogy.exercise_blueprints) {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          if (typeof value.topic === "string" && typeof value.pattern === "string") exerciseBlueprints.add(normalizeProfileIdentity(value.topic + "|" + value.pattern));
        }
      }
      if (Array.isArray(pedagogy.visual_elements)) {
        for (const item of pedagogy.visual_elements) {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          if (typeof value.element_type === "string" && typeof value.description === "string") visualElements.add(normalizeProfileIdentity(value.element_type + "|" + value.description));
        }
      }

      if (Array.isArray(result.concepts)) {
        for (const concept of result.concepts) {
          if (!concept || typeof concept !== "object" || !("name" in concept) || typeof concept.name !== "string") continue;
          const name = concept.name.trim();
          if (!name) continue;
          const area = "area" in concept && typeof concept.area === "string" ? concept.area.trim() : "Transversal";
          const parent = "parent_concept" in concept && typeof concept.parent_concept === "string" ? concept.parent_concept.trim() : "";
          const key = [normalizeProfileIdentity(area), normalizeProfileIdentity(parent), normalizeProfileIdentity(name)].join("|");
          const pages = "evidence_pages" in concept && Array.isArray(concept.evidence_pages)
            ? concept.evidence_pages.filter((page: unknown): page is number => typeof page === "number" && Number.isInteger(page) && page > 0).slice(0, 10)
            : [];
          const existing = concepts.get(key);
          concepts.set(key, {
            name,
            area,
            parent_concept: parent,
            evidence_pages: [...new Set([...(existing?.evidence_pages ?? []), ...pages])].slice(0, 10),
          });
          areas.add(area);
        }
      }
    }

    profileStats.set(job.id, {
      stored_profile_batches: rows.length,
      detected_concept_count: concepts.size,
      detected_topic_count: topics.size,
      detected_competency_count: competencies.size,
      teaching_method_count: teachingMethods.size,
      worked_example_count: workedExamples.size,
      question_pattern_count: questionPatterns.size,
      question_solution_count: questionSolutions.size,
      solving_method_count: solvingMethods.size,
      study_path_count: studyPaths.size,
      exercise_blueprint_count: exerciseBlueprints.size,
      visual_element_count: visualElements.size,
      detected_areas: [...areas].slice(0, 12),
      concept_preview: [...concepts.values()].slice(0, 8),
      question_pattern_preview: [...questionPatterns.values()].slice(0, 5),
      question_solution_preview: [...questionSolutions.values()].slice(0, 5),
      teaching_method_preview: [...teachingMethods.values()].slice(0, 5),
    });
  }

  const recentWithDocuments = recentJobs.map((job) => {
    const document = documentById.get(job.document_id);
    const stats = profileStats.get(job.id);
    return {
      ...job,
      document_title: document?.title ?? "Documento eliminado",
      embedded_chunk_count: document?.embedded_chunk_count ?? 0,
      chunk_count: document?.chunk_count ?? 0,
      ingestion_status: document?.ingestion_status ?? "queued",
      coverage_percent: document?.coverage_percent ?? 0,
      visual_pages_total: document?.visual_pages_total ?? 0,
      visual_pages_reviewed: document?.visual_pages_reviewed ?? 0,
      auto_review_count: document?.auto_review_count ?? 0,
      next_review_at: document?.next_review_at ?? null,
      concept_count: document?.concept_count ?? 0,
      stored_profile_batches: stats?.stored_profile_batches ?? 0,
      detected_concept_count: stats?.detected_concept_count ?? 0,
      detected_topic_count: stats?.detected_topic_count ?? 0,
      detected_competency_count: stats?.detected_competency_count ?? 0,
      teaching_method_count: stats?.teaching_method_count ?? 0,
      worked_example_count: stats?.worked_example_count ?? 0,
      question_pattern_count: stats?.question_pattern_count ?? 0,
      question_solution_count: stats?.question_solution_count ?? 0,
      solving_method_count: stats?.solving_method_count ?? 0,
      study_path_count: stats?.study_path_count ?? 0,
      exercise_blueprint_count: stats?.exercise_blueprint_count ?? 0,
      visual_element_count: stats?.visual_element_count ?? 0,
      detected_areas: stats?.detected_areas ?? [],
      concept_preview: stats?.concept_preview ?? [],
      question_pattern_preview: stats?.question_pattern_preview ?? [],
      question_solution_preview: stats?.question_solution_preview ?? [],
      teaching_method_preview: stats?.teaching_method_preview ?? [],
    };
  });

  return NextResponse.json({
    settings: settingsResult.data,
    configured: Boolean(process.env.CRON_SECRET) && workerConfiguration.data === true,
    counts: {
      queued: queued.count ?? 0,
      running: running.count ?? 0,
      retrying: retrying.count ?? 0,
      failed: failed.count ?? 0,
      completed: completed.count ?? 0,
    },
    recent: recentWithDocuments,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getOrbyOwner();
  if (!owner) return jsonError("Acceso reservado al administrador.", 403);

  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return jsonError("Indica si deseas activar o pausar el motor.", 400);

  if (body.enabled && !process.env.CRON_SECRET) return jsonError("Falta configurar CRON_SECRET en el entorno Preview de Vercel.", 409);
  const workerConfiguration = await supabaseAdmin.rpc("orby_knowledge_autopilot_is_configured");
  if (body.enabled && (workerConfiguration.error || workerConfiguration.data !== true)) {
    return jsonError("Faltan los tres secretos del trabajador en Supabase Vault: URL del preview, secreto de cron y bypass de SSO.", 409);
  }

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

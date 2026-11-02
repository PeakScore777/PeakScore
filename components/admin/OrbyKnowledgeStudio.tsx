"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Bot, Check, LoaderCircle, MessageSquare, Plus, Send, ShieldCheck, Sparkles, Trash2, UploadCloud, Play } from "lucide-react";
import { clearOrbyPendingDocumentId, getOrbyPendingDocumentId, uploadOrbyPdfResumable } from "@/lib/supabase/orby-resumable-upload";

type KnowledgeDocument = {
  id: string; title: string; original_name: string; subject: string; topic: string;
  page_count: number; chunk_count: number; status: "draft" | "published" | "archived"; created_at: string;
  embedded_chunk_count: number; knowledge_profile_status: "pending" | "ready" | "failed"; knowledge_profile_version: number; knowledge_pipeline_version: number; concept_count: number;
  ingestion_status: "queued" | "processing" | "completed" | "attention_required" | "failed";
  coverage_percent: number; visual_pages_total: number; visual_pages_reviewed: number; auto_review_count: number; next_review_at: string | null;
};
type Source = { documentId: string; title: string; subject: string; topic: string; page: number };
type ChatMessage = { id?: string; role: "user" | "assistant"; content: string; sources?: Source[]; verification?: "not_required" | "passed" | "corrected" | "unverified"; created_at?: string };
type AutomationStatus = {
  settings: { enabled: boolean; last_tick_at: string | null; last_job_started_at: string | null; ai_cycles_used: number; ai_cycle_date: string | null; ai_cycle_window_started_at: string | null };
  workers: { automaticBusy: boolean; manualBusy: boolean };
  configured: boolean;
  counts: { queued: number; running: number; retrying: number; failed: number; completed: number };
  recent: Array<{
    id: string;
    document_id: string;
    document_title: string;
    embedded_chunk_count: number;
    chunk_count: number;
    ingestion_status: string;
    coverage_percent: number;
    visual_pages_total: number;
    visual_pages_reviewed: number;
    auto_review_count: number;
    next_review_at: string | null;
    concept_count: number;
    status: string;
    stage: string;
    automatic_review_pending: boolean;
    next_batch_index: number;
    total_batches: number;
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
    competency_preview: Array<{ name: string; area: string; evidence_pages: number[]; provenance: "source" | "pedagogical_inference"; question_count: number | null }>;
    concept_preview: Array<{ name: string; area: string; parent_concept: string; evidence_pages: number[] }>;
    question_pattern_preview: Array<{ archetype: string; stimulus_type: string; task: string; provenance: "source" | "pedagogical_inference"; evidence_pages: number[] }>;
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
    teaching_method_preview: Array<{ concept: string; student_level_zero: string; provenance: "source" | "pedagogical_inference"; evidence_pages: number[] }>;
    attempt_count: number;
    last_error: string | null;
    updated_at: string;
  }>;
};

function publicationBlockReason(document: KnowledgeDocument): string | null {
  if (document.ingestion_status === "attention_required") return "Orby detectó páginas que no pudo verificar con suficiente confianza. Revisa el detalle antes de publicar.";
  if (document.ingestion_status !== "completed") return "Orby todavía está leyendo y verificando todas las páginas.";
  if (document.coverage_percent < 95 || document.visual_pages_reviewed < Math.ceil(document.visual_pages_total * 0.95)) return "La cobertura visual todavía es inferior al 95%.";
  if (document.chunk_count < 1) return "El documento todavía no tiene fragmentos indexados.";
  if (document.embedded_chunk_count < document.chunk_count) return "Faltan embeddings: " + document.embedded_chunk_count + "/" + document.chunk_count + ".";
  if (document.knowledge_profile_status !== "ready") return "El perfil académico todavía no terminó o necesita reintento.";
  if (document.knowledge_profile_version < 2) return "Falta completar el perfil académico v2.";
  if (document.knowledge_pipeline_version < 7) return "Falta finalizar el perfil académico del motor v6.";
  if (document.concept_count < 1) return "El perfil todavía no tiene conceptos académicos indexados.";
  return null;
}

function isReadyForPublication(document: KnowledgeDocument): boolean {
  return publicationBlockReason(document) === null;
}

function isCurrentKnowledgePipeline(document: KnowledgeDocument): boolean {
  return document.chunk_count > 0
    && document.embedded_chunk_count >= document.chunk_count
    && document.knowledge_profile_status === "ready"
    && document.knowledge_profile_version >= 2
    && document.knowledge_pipeline_version >= 7
    && document.ingestion_status === "completed"
    && document.coverage_percent >= 95
    && document.visual_pages_reviewed >= Math.ceil(document.visual_pages_total * 0.95)
    && document.concept_count > 0;
}

function formatAdminReply(content: string): string {
  const normalized = content
    .replace(/\\([\\\x60*_{}\[\]()#+.!|>~-])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .trim();

  const output: string[] = [];
  let tableRows: string[][] = [];
  const flushTable = () => {
    if (!tableRows.length) return;
    if (tableRows.length === 1) {
      output.push(tableRows[0].join(" · "));
    } else {
      const headers = tableRows[0];
      for (const row of tableRows.slice(1)) {
        const cells = row.map((cell, index) => headers[index]
          ? headers[index] + ": " + cell
          : cell
        ).filter(Boolean);
        if (cells.length) output.push("• " + cells.join(" · "));
      }
    }
    tableRows = [];
  };

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushTable();
      output.push("");
      continue;
    }
    if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)) continue;
    const isTableRow = line.includes("|");
    if (isTableRow) {
      const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
      if (cells.length >= 2) {
        tableRows.push(cells);
        continue;
      }
    }
    flushTable();
    output.push(line.replace(/(^|\n)\s*[-*]\s+/g, "$1• "));
  }
  flushTable();
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}


export default function OrbyKnowledgeStudio() {
  const [documents,setDocuments] = useState<KnowledgeDocument[]>([]);
  const [messages,setMessages] = useState<ChatMessage[]>([]);
  const [hasOlderMessages,setHasOlderMessages] = useState(false);
  const [loadingOlder,setLoadingOlder] = useState(false);
  const [file,setFile] = useState<File|null>(null);
  const [draft,setDraft] = useState("");
  const [loading,setLoading] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [uploadProgress,setUploadProgress] = useState(0);
  const [enrichingDocument,setEnrichingDocument] = useState<string|null>(null);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [automation,setAutomation] = useState<AutomationStatus|null>(null);
  const [changingAutomation,setChangingAutomation] = useState(false);
  const [manualProcessing,setManualProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement|null>(null);
  const messagesContainerRef = useRef<HTMLDivElement|null>(null);
  const preserveScrollRef = useRef<{height:number;top:number}|null>(null);

  async function loadAll(isActive: () => boolean = () => true) {
    type EndpointResult = {
      payload: Record<string, unknown> | null;
      error: string | null;
    };

    async function requestJson(path: string, label: string): Promise<EndpointResult> {
      try {
        const response = await fetch(path, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
        if (!response.ok) {
          const apiMessage = typeof payload?.error === "string" ? payload.error : "El servidor respondió HTTP " + response.status + ".";
          return { payload, error: label + " (" + path + "): " + apiMessage };
        }
        return { payload, error: null };
      } catch (cause) {
        const rawMessage = cause instanceof Error ? cause.message : "Error de red desconocido.";
        const detail = /failed to fetch|networkerror|load failed/i.test(rawMessage)
          ? "El navegador no pudo alcanzar esta ruta. Comprueba que el servidor Next.js siga activo y que la URL no esté bloqueada por la red o la política CSP."
          : rawMessage;
        return { payload: null, error: label + " (" + path + "): " + detail };
      }
    }

    const [docsResult, chatResult, automationResult] = await Promise.all([
      requestJson("/api/admin/orby/knowledge", "Biblioteca"),
      requestJson("/api/admin/orby/chat", "Chat privado"),
      requestJson("/api/admin/orby/knowledge/automation", "Autopilot"),
    ]);

    if (!isActive()) return;

    const failures = [docsResult.error, chatResult.error, automationResult.error].filter(
      (value): value is string => Boolean(value)
    );

    if (docsResult.payload && Array.isArray(docsResult.payload.documents)) {
      setDocuments(docsResult.payload.documents as KnowledgeDocument[]);
    }
    if (chatResult.payload && Array.isArray(chatResult.payload.messages)) {
      setMessages(chatResult.payload.messages as ChatMessage[]);
      setHasOlderMessages(Boolean(chatResult.payload.hasMore));
    }
    if (automationResult.payload) {
      setAutomation(automationResult.payload as unknown as AutomationStatus);
    }

    setError(failures.length
      ? "No se pudo completar la carga del laboratorio:\\n" + failures.join("\\n")
      : "");
  }

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => loadAll(() => !cancelled)).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el laboratorio.");
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      fetch("/api/admin/orby/knowledge/automation", { credentials: "same-origin", cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return null;
          return response.json();
        })
        .then((payload) => {
          if (payload) setAutomation(payload as AutomationStatus);
        })
        .catch(() => undefined);
      fetch("/api/admin/orby/knowledge", { credentials: "same-origin", cache: "no-store" })
        .then(async (response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (payload && Array.isArray(payload.documents)) setDocuments(payload.documents);
        })
        .catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function toggleAutomation() {
    if (!automation || changingAutomation) return;
    setChangingAutomation(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/orby/knowledge/automation", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !automation.settings.enabled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el motor automático.");
      setAutomation((current) => current ? { ...current, settings: payload.settings } : current);
      setNotice(payload.message || "Se actualizó el motor automático.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el motor automático.");
    } finally {
      setChangingAutomation(false);
    }
  }

  useEffect(()=>{
    const container = messagesContainerRef.current;
    if (!container) return;

    const preserved = preserveScrollRef.current;
    if (preserved) {
      container.scrollTop = container.scrollHeight - preserved.height + preserved.top;
      preserveScrollRef.current = null;
      return;
    }

    // Scroll only the message list, never the whole document/page.
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  },[messages]);

  async function loadOlderMessages() {
    if (loadingOlder || !hasOlderMessages || messages.length === 0) return;
    const container = messagesContainerRef.current;
    const oldest = messages[0];
    if (!container || !oldest.created_at || !oldest.id) return;

    setLoadingOlder(true);
    setError("");
    try {
      const params = new URLSearchParams({
        before: oldest.created_at,
        beforeId: oldest.id,
      });
      const response = await fetch("/api/admin/orby/chat?" + params.toString(), {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar el historial anterior.");

      const older = Array.isArray(payload.messages) ? payload.messages as ChatMessage[] : [];
      preserveScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
      setMessages(current => [...older, ...current]);
      setHasOlderMessages(Boolean(payload.hasMore));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el historial anterior.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function uploadDocument(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (file.size < 1 || file.size > 50_000_000) {
      setError("El PDF debe pesar como máximo 50 MB.");
      return;
    }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecciona un archivo PDF válido.");
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const signResponse = await fetch("/api/admin/orby/knowledge/upload-url", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          documentId: getOrbyPendingDocumentId(file),
          size: file.size,
          contentType: file.type,
        }),
      });
      const signed = await signResponse.json().catch(() => ({}));
      if (!signResponse.ok || !signed.path || !signed.token || !signed.documentId || !signed.tusEndpoint || !signed.bucketName) {
        throw new Error(signed.error || "No se pudo preparar la subida privada.");
      }

      setUploadProgress(0);
      const uploaded = await uploadOrbyPdfResumable({
        endpoint: signed.tusEndpoint,
        token: signed.token,
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        bucketName: signed.bucketName,
        objectName: signed.path,
        file,
        onProgress: (uploadedBytes, totalBytes) => {
          setUploadProgress(totalBytes > 0 ? Math.min(100, Math.round(uploadedBytes * 100 / totalBytes)) : 0);
        },
      });

      const finalizeResponse = await fetch("/api/admin/orby/knowledge", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploaded.documentId,
          fileName: file.name,
        }),
      });
      const payload = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok) {
        throw new Error(payload.error || "El PDF se subió, pero no se pudo registrar en la biblioteca.");
      }

      clearOrbyPendingDocumentId(file);
      setFile(null);
      setUploadProgress(0);
      const input = document.getElementById("orby-knowledge-file") as HTMLInputElement | null;
      if (input) input.value = "";

      // The upload action also starts one real worker cycle. If another
      // document is older in the shared FIFO queue, it continues first.
      const kickoffResponse = await fetch("/api/admin/orby/knowledge/automation/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const kickoff = await kickoffResponse.json().catch(() => ({}));
      const uploadMessage = payload.message || "PDF guardado y añadido a la cola de Orby.";
      if (kickoffResponse.ok && kickoff.state === "failed") {
        setError(kickoff.message || "El PDF quedó guardado, pero el primer ciclo requiere reintento.");
        setNotice(uploadMessage);
      } else if (kickoffResponse.ok && kickoff.state !== "idle") {
        setNotice(uploadMessage + " Primer ciclo iniciado: " + (kickoff.message || "Orby comenzó el procesamiento de la cola."));
      } else if (kickoffResponse.status === 409) {
        setNotice(uploadMessage + " Orby ya está ocupado; el documento quedó en cola y continuará cuando se libere el trabajador.");
      } else {
        setNotice(uploadMessage + " El documento quedó en cola; continuará cuando el trabajador esté disponible.");
      }
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el material.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function runKnowledgeBatch() {
    if (manualProcessing) return;
    setManualProcessing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/orby/knowledge/automation/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo ejecutar el siguiente lote.");
      if (payload.state === "failed") {
        setError(payload.message || "El lote falló y quedó programado para reintento.");
      } else {
        setNotice(payload.message || "Se ejecutó una etapa del motor de conocimiento.");
      }
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el siguiente lote.");
    } finally {
      setManualProcessing(false);
    }
  }

  async function enrichKnowledge(doc?: KnowledgeDocument) {
    setEnrichingDocument(doc?.id ?? "all");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/orby/knowledge/enrich", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc ? { documentId: doc.id } : {}),
      });
      const payload = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo añadir el documento a la cola.");
      if (Number(payload.failed ?? 0) > 0) {
        const failures = Array.isArray(payload.results)
          ? payload.results.filter((item: { success?: boolean }) => item?.success === false)
          : [];
        setError(failures.slice(0, 3).map((item: { title?: string; reason?: string }) =>
          (item.title || "Documento") + ": " + (item.reason || "No se pudo programar.")
        ).join(" "));
      }
      setNotice(payload.message || "Tarea añadida a la cola de Orby.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo programar el documento.");
    } finally {
      setEnrichingDocument(null);
    }
  }

  async function changeStatus(doc:KnowledgeDocument,status:"published"|"archived"|"draft") {
    setError("");setNotice("");
    try{
      const response=await fetch("/api/admin/orby/knowledge",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:doc.id,status})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||"No se pudo cambiar el estado.");
      setNotice(status==="published"?"Material publicado. Orby ya puede consultarlo en las respuestas de los estudiantes.":status==="archived"?"Material archivado: deja de aparecer en las consultas públicas.":"Material devuelto a borrador.");
      await loadAll();
    }catch(e){setError(e instanceof Error?e.message:"No se pudo cambiar el documento.");}
  }

  async function deleteDocument(doc:KnowledgeDocument) {
    if(!window.confirm("¿Eliminar este documento y sus fragmentos indexados?"))return;
    setError("");
    try{
      const response=await fetch("/api/admin/orby/knowledge",{method:"DELETE",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:doc.id})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||"No se pudo eliminar el documento.");
      setDocuments(current=>current.filter(item=>item.id!==doc.id));
      setNotice("Documento eliminado de la biblioteca.");
    }catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar.");}
  }

  async function sendMessage(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message=draft.trim();if(!message||loading)return;
    setDraft("");setError("");
    setMessages(current=>[...current,{role:"user",content:message}]);
    setLoading(true);
    try{
      const response=await fetch("/api/admin/orby/chat",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||"No se pudo consultar a Orby.");
      const persisted = Array.isArray(payload.messages) ? payload.messages as ChatMessage[] : null;
      setMessages(current => [
        ...current.slice(0, -1),
        ...(persisted ?? [
          {role:"user" as const,content:message},
          {role:"assistant" as const,content:payload.reply,sources:Array.isArray(payload.sources)?payload.sources:[],verification:payload.verification},
        ]),
      ]);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el mensaje.");setDraft(message);}
    finally{setLoading(false);}
  }

  return <main className="min-h-screen bg-[#090c10] px-4 py-6 text-white sm:px-8 sm:py-9">
    <div className="mx-auto max-w-[1440px]">
      <Link href="/dashboard/admin" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Panel de administración</Link>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-orange-400">PEAKSCORE / ADMIN STUDIO</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Orby ICFES Lab</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Biblioteca curada, conversación privada y control del conocimiento académico que llega al alumnado.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300"><ShieldCheck className="h-3.5 w-3.5"/> Sesión de administrador verificada</span>
      </header>
      {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {notice&&<div role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#11161c] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">01 / KNOWLEDGE BASE</p><h2 className="mt-2 text-xl font-semibold">Material de referencia</h2><p className="mt-1 text-xs text-slate-400">PDFs privados · clasificación transversal automática · publicación manual</p></div><BookOpen className="h-6 w-6 text-orange-400"/></div>
          <form onSubmit={uploadDocument} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="block text-xs font-semibold text-slate-300">Archivo PDF (máximo 50 MB · carga reanudable)</label>
            <label htmlFor="orby-knowledge-file" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-4 transition hover:border-orange-400/45 hover:bg-orange-500/[0.04]"><UploadCloud className="h-5 w-5 shrink-0 text-orange-400"/><span className="min-w-0"><span className="block truncate text-xs font-medium text-white">{file?file.name:"Seleccionar documento PDF"}</span><span className="mt-1 block text-[10px] text-slate-500">{file?(file.size/1024/1024).toFixed(2)+" MB":"PDF de hasta 50 MB. Orby analiza texto, imágenes, tablas y páginas escaneadas."}</span></span><input id="orby-knowledge-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
            <div className="rounded-lg border border-orange-500/15 bg-orange-500/[0.05] px-3 py-3">
              <p className="text-xs font-semibold text-orange-200">Clasificación automática</p>
              <p className="mt-1 text-[10px] leading-5 text-slate-400">Orby guardará el PDF como material transversal de preparación Saber 11. El título se toma del nombre del archivo; no necesitas asignar materia ni tema.</p>
            </div>
            <button disabled={!file||uploading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-[#1a1008] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">{uploading?<><LoaderCircle className="h-4 w-4 animate-spin"/> Subiendo PDF… {uploadProgress}%</>:<><Plus className="h-4 w-4"/> Subir a Orby y aprender</>}</button>
          </form>
          <section className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">03 / AUTONOMOUS KNOWLEDGE</p>
                <h3 className="mt-1 text-sm font-semibold">Orby Autopilot</h3>
                <p className="mt-1 max-w-lg text-[10px] leading-5 text-slate-400">El Autopilot ejecuta un ciclo cada tres minutos (máximo 100 por ventana móvil de 7 horas) y procesa un lote de cuatro páginas visuales por ciclo. El trabajador manual y el automático funcionan en carriles independientes y pueden avanzar a la vez en documentos distintos; comparten la misma cola, embeddings, conceptos y biblioteca, y nunca reclaman simultáneamente el mismo documento. Al pulsar el botón manual, el lote elegido queda reservado para ti; al terminar, vuelve a la cola compartida y el Autopilot puede continuar con la actualización. Si completas manualmente un borrador apto, el Autopilot hace además la validación final y lo publica solo si supera todos los controles. Tus ejecuciones manuales son ilimitadas y no consumen el presupuesto automático. Puedes pausar el carril automático sin detener el manual.</p>
              </div>
              <span className={automation?.settings.enabled ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300" : "rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-bold text-slate-400"}>{automation?.settings.enabled ? "MOTOR ACTIVO" : "MOTOR PAUSADO"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-semibold">
              <span className={automation?.workers.automaticBusy ? "rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300" : "rounded-md bg-white/[.04] px-2 py-1 text-slate-500"}>{automation?.workers.automaticBusy ? "AUTOPILOT TRABAJANDO" : "AUTOPILOT DISPONIBLE"}</span>
              <span className={automation?.workers.manualBusy ? "rounded-md bg-orange-500/10 px-2 py-1 text-orange-200" : "rounded-md bg-white/[.04] px-2 py-1 text-slate-500"}>{automation?.workers.manualBusy ? "MANUAL TRABAJANDO" : "MANUAL DISPONIBLE"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">En cola</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.counts.queued ?? "—"}</p></div>
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">Procesando</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.counts.running ?? "—"}</p></div>
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">Reintentos</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.counts.retrying ?? "—"}</p></div>
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">Con error</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.counts.failed ?? "—"}</p></div>
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">Completados</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.counts.completed ?? "—"}</p></div>
              <div className="rounded-lg bg-white/[.035] p-2"><p className="text-[9px] text-slate-500">Presupuesto del motor · 7 h</p><p className="mt-1 text-lg font-semibold tabular-nums">{automation?.settings.ai_cycles_used ?? "—"}/100</p><p className="mt-1 text-[8px] text-slate-500">Consumo de ejecuciones, no porcentaje de aprendizaje.</p><p className="mt-1 text-[8px] text-slate-500">{automation?.settings.ai_cycle_window_started_at ? "Reinicio: " + new Date(new Date(automation.settings.ai_cycle_window_started_at).getTime() + 7 * 60 * 60 * 1000).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}) : "La ventana inicia con el primer ciclo."}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[9px] text-slate-500">{automation?.settings.last_tick_at ? "Última revisión: " + new Date(automation.settings.last_tick_at).toLocaleString("es-CO") : "Aún no se registra una revisión automática."}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={manualProcessing} onClick={()=>void runKnowledgeBatch()} className="inline-flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-[10px] font-bold text-orange-200 transition hover:bg-orange-400/15 disabled:cursor-not-allowed disabled:opacity-40">
                  {manualProcessing?<LoaderCircle className="h-3.5 w-3.5 animate-spin"/>:<Play className="h-3.5 w-3.5"/>}
                  {manualProcessing ? "Procesando lote…" : "Procesar un lote ahora"}
                </button>
                <button type="button" disabled={!automation?.configured || changingAutomation} onClick={()=>void toggleAutomation()} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-[10px] font-bold text-[#1a1008] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-35">
                  {changingAutomation && <LoaderCircle className="h-3.5 w-3.5 animate-spin"/>}
                  {automation?.settings.enabled ? "Pausar motor" : "Reanudar motor"}
                </button>
              </div>
            </div>
            {!automation?.configured && <p className="mt-2 text-[9px] leading-4 text-amber-300">Falta conectar el trabajador protegido: CRON_SECRET en Preview de Vercel y URL, secreto de cron y bypass de SSO en Supabase Vault. La subida puede iniciar el primer lote; la continuación desatendida espera esa conexión.</p>}
            {automation?.recent?.[0] && <div className="mt-2 space-y-1 text-[9px] text-slate-500"><p className="truncate">Último documento de la cola: <span className="font-semibold text-slate-300">{automation.recent[0].document_title}</span></p><p>Estado: {automation.recent[0].status} · Etapa: {automation.recent[0].stage === "embeddings" ? "embeddings" : automation.recent[0].stage === "profile" ? "perfilado académico" : automation.recent[0].stage === "finalize" ? "consolidación" : automation.recent[0].stage} · {automation.recent[0].next_batch_index}/{automation.recent[0].total_batches} lotes de perfil{automation.recent[0].automatic_review_pending ? " · revisión automática final pendiente" : ""}</p><p>Vectores del documento: {automation.recent[0].embedded_chunk_count}/{automation.recent[0].chunk_count}</p></div>}
          </section>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Biblioteca ({documents.length})</h3><span className="text-[10px] text-slate-500">Solo documentos publicados alimentan el chat estudiantil</span></div>{documents.some(doc=>doc.knowledge_profile_status!=="ready"||doc.knowledge_profile_version<2||doc.knowledge_pipeline_version<7||doc.embedded_chunk_count<doc.chunk_count)&&<button type="button" disabled={enrichingDocument!==null} onClick={()=>void enrichKnowledge()} className="inline-flex items-center gap-2 rounded-lg border border-orange-400/25 bg-orange-400/10 px-3 py-2 text-[10px] font-semibold text-orange-200 transition hover:bg-orange-400/15 disabled:opacity-50">{enrichingDocument==="all"?<LoaderCircle className="h-3.5 w-3.5 animate-spin"/>:<Sparkles className="h-3.5 w-3.5"/>}{enrichingDocument==="all"?"Añadiendo a la cola…":"Encolar pendientes"}</button>}</div>
          <div className="mt-3 space-y-2">
            {documents.map(doc=><article key={doc.id} className="rounded-xl border border-white/[.08] bg-black/15 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-white">{doc.title}</p><span className={doc.status==="published"?"rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300":doc.status==="archived"?"rounded-full bg-slate-500/15 px-2 py-1 text-[9px] font-bold text-slate-400":"rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300"}>{doc.status==="published"?"PUBLICADO":doc.status==="archived"?"ARCHIVADO":"BORRADOR"}</span></div><p className="mt-1 text-[10px] text-slate-500">{doc.subject} · {doc.page_count} páginas · {doc.chunk_count} fragmentos</p>
              <p className="mt-1 text-[9px] text-slate-500">Lectura visual: {doc.visual_pages_reviewed}/{doc.visual_pages_total} páginas · Revisiones automáticas del documento hoy: {doc.auto_review_count}{doc.next_review_at && doc.ingestion_status!=="completed" ? " · Próxima revisión: " + new Date(doc.next_review_at).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}) : ""}</p><p className="mt-1 text-[10px] text-slate-500">{doc.ingestion_status==="completed"?<span className="text-emerald-300">Motor v7 completado · {doc.concept_count} conceptos · {doc.coverage_percent.toFixed(1)}% cobertura · {doc.embedded_chunk_count}/{doc.chunk_count} vectores</span>:doc.ingestion_status==="attention_required"?<span className="text-amber-300">Atención requerida · {doc.visual_pages_reviewed}/{doc.visual_pages_total} páginas verificadas · {doc.concept_count} conceptos</span>:<span className={doc.knowledge_profile_status==="failed"?"text-rose-300":"text-amber-300"}>{doc.knowledge_profile_status==="failed"?"Enriquecimiento pendiente de reintento":"Aprendizaje multimodal en curso"} · {doc.visual_pages_reviewed}/{doc.visual_pages_total} páginas · {doc.coverage_percent.toFixed(1)}% · {doc.embedded_chunk_count??0}/{doc.chunk_count} vectores</span>}</p></div><button type="button" onClick={()=>void deleteDocument(doc)} aria-label={"Eliminar "+doc.title} className="rounded-md p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
              {automation?.recent.find(job=>job.document_id===doc.id) && (() => {
                const job = automation.recent.find(item=>item.document_id===doc.id)!;
                return <div className="mt-3 rounded-lg border border-white/[.07] bg-white/[.025] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold text-slate-200">Aprendizaje detectado</p>
                    <span className={job.stored_profile_batches>0?"text-[9px] font-semibold text-emerald-300":"text-[9px] text-slate-500"}>{job.stored_profile_batches>0?"Resultados parciales guardados":"Esperando el primer análisis académico"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Vectores</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.embedded_chunk_count}/{job.chunk_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Páginas verificadas</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.visual_pages_reviewed}/{job.visual_pages_total}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Conceptos únicos</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.detected_concept_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Temas / competencias</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.detected_topic_count} / {job.detected_competency_count}</p></div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Métodos docentes</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.teaching_method_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Ejemplos trabajados</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.worked_example_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Patrones de pregunta</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.question_pattern_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Preguntas analizadas</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.question_solution_count}</p></div>
                    <div className="rounded-md bg-black/20 px-2 py-1.5"><p className="text-[9px] text-slate-500">Rutas de estudio</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-white">{job.study_path_count}</p></div>
                  </div>
                  {job.detected_areas.length>0 && <p className="mt-2 text-[9px] leading-4 text-slate-400">Áreas detectadas: {job.detected_areas.join(" · ")}</p>}
                  {job.competency_preview.length>0 && <div className="mt-2 border-t border-white/[.07] pt-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">Competencias y distribución de preguntas</p>
                    {job.competency_preview.slice(0,5).map((competency,index)=><p key={index} className="text-[9px] leading-4 text-slate-400">• {competency.name} · {competency.area}{competency.question_count!==null?" · "+competency.question_count+" preguntas":""} · {competency.provenance==="source"?"tabla del documento":"inferencia didáctica"} · p. {competency.evidence_pages.join(", ")}</p>)}
                  </div>}
                  {job.concept_preview.length>0 && <div className="mt-2 border-t border-white/[.07] pt-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">Conceptos identificados</p>
                    <div className="flex flex-wrap gap-1.5">{job.concept_preview.slice(0,6).map((concept,index)=><span key={index} title={(concept.parent_concept?concept.parent_concept+" · ":"")+concept.area+(concept.evidence_pages.length?" · p. "+concept.evidence_pages.join(", "):"")} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[9px] text-slate-300">{concept.name}</span>)}</div>
                  </div>}
                  {job.question_pattern_preview.length>0 && <div className="mt-2 border-t border-white/[.07] pt-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">Patrones de pregunta</p>
                    {job.question_pattern_preview.slice(0,3).map((pattern,index)=><p key={index} className="text-[9px] leading-4 text-slate-400">• {pattern.archetype} · {pattern.stimulus_type} · {pattern.task} · {pattern.provenance==="source"?"presente en la fuente":"inferencia didáctica"} · p. {pattern.evidence_pages.join(", ")}</p>)}
                  </div>}
                  {job.question_solution_preview.length>0 && <div className="mt-2 border-t border-white/[.07] pt-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">Métodos de resolución analizados</p>
                    {job.question_solution_preview.slice(0,3).map((solution,index)=><div key={index} className="mb-2 text-[9px] leading-4 text-slate-400"><p>• {solution.area}{solution.skill?" · "+solution.skill:""}: {solution.problem_summary}{solution.candidate_option?" · Candidata "+solution.candidate_option+" (no verificada)":""} · confianza {Math.round(solution.confidence*100)}% · p. {solution.evidence_pages.join(", ")}</p>{solution.reasoning_steps.length>0&&<p className="mt-1 pl-3 text-slate-500">Razonamiento: {solution.reasoning_steps.join(" → ")}</p>}<p className="pl-3 text-slate-500">Comparación con clave: {solution.answer_key_comparison==="matches"?"coincide":solution.answer_key_comparison==="conflicts"?"no coincide":solution.answer_key_comparison==="not_applicable"?"no aplica":"no disponible"} · base: {solution.answer_basis==="explicit_key"?"clave visible":solution.answer_basis==="independent_reasoning"?"razonamiento independiente":"evidencia insuficiente"}</p></div>)}
                    <p className="mt-1 text-[9px] text-slate-500">Las letras candidatas no son claves oficiales; requieren verificación independiente.</p>
                  </div>}
                  {job.teaching_method_preview.length>0 && <div className="mt-2 border-t border-white/[.07] pt-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">Cómo enseñarlo desde cero</p>
                    {job.teaching_method_preview.slice(0,3).map((method,index)=><p key={index} className="text-[9px] leading-4 text-slate-400">• {method.concept}: {method.student_level_zero} · {method.provenance==="source"?"fuente":"propuesta didáctica"} · p. {method.evidence_pages.join(", ")}</p>)}
                  </div>}
                  {job.stored_profile_batches===0 && <p className="mt-2 text-[9px] leading-4 text-slate-500">El perfilado académico empezará después del lote de embeddings; todavía no hay conceptos o métodos de enseñanza guardados.</p>}
                  {job.last_error && <p role="alert" className="mt-2 rounded-md border border-rose-500/20 bg-rose-500/[.06] px-2.5 py-2 text-[9px] leading-4 text-rose-300">Último bloqueo: {job.last_error} · Orby conservará los lotes guardados e intentará continuar.</p>}
                  <p className="mt-2 text-[9px] text-amber-300">Resultados provisionales con páginas de evidencia. No alimentan al alumnado hasta completar la lectura multimodal, el perfil y la publicación manual.</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">Los vectores permiten buscar fragmentos; los conceptos, temas y competencias describen lo que el perfil académico identificó en el documento.</p>
                </div>;
              })()}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={enrichingDocument!==null||isCurrentKnowledgePipeline(doc)} onClick={()=>void enrichKnowledge(doc)} title={isCurrentKnowledgePipeline(doc)?"El conocimiento ya está actualizado.":"Añadir el documento a la cola incremental."} className="inline-flex items-center gap-1.5 rounded-md border border-orange-400/25 bg-orange-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-orange-200 transition hover:bg-orange-400/15 disabled:cursor-not-allowed disabled:opacity-45">{enrichingDocument===doc.id?<LoaderCircle className="h-3 w-3 animate-spin"/>:<Sparkles className="h-3 w-3"/>}{enrichingDocument===doc.id?"Añadiendo a la cola…":isCurrentKnowledgePipeline(doc)?"Cobertura actualizada":doc.knowledge_profile_status==="ready"&&doc.embedded_chunk_count>=doc.chunk_count?"Encolar reprocesamiento":"Encolar conocimiento"}</button>{doc.status!=="published"?<button type="button" disabled={!isReadyForPublication(doc)} title={publicationBlockReason(doc) ?? "Publicar este material para el chat estudiantil."} onClick={()=>void changeStatus(doc,"published")} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-35"><Check className="h-3.5 w-3.5"/> {isReadyForPublication(doc)?"Publicar para Orby":"Completa enriquecimiento"}</button>:<button type="button" onClick={()=>void changeStatus(doc,"archived")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-amber-400/30 hover:text-amber-200">Archivar</button>}<button type="button" onClick={()=>void changeStatus(doc,"draft")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition hover:text-white">Volver a borrador</button></div>
              {doc.status!=="published" && !isReadyForPublication(doc) && <p className="mt-2 text-[9px] leading-4 text-amber-300">{publicationBlockReason(doc)} Cuando se complete, el botón «Publicar para Orby» se habilitará.</p>}
            </article>)}
            {documents.length===0&&<div className="rounded-xl border border-dashed border-white/10 p-8 text-center"><p className="text-xs font-semibold text-slate-300">La biblioteca está vacía</p><p className="mt-1 text-[10px] text-slate-500">Carga tu primer material para empezar a construir el conocimiento curado de Orby.</p></div>}
          </div>
        </section>
        <section className="flex h-[min(78vh,900px)] min-h-[620px] max-h-[900px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11161c]">
          <header className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">02 / PRIVATE SESSION</p><h2 className="mt-2 text-xl font-semibold">Habla con Orby</h2><p className="mt-1 text-xs text-slate-400">Solo visible para administradores autenticados.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-300"><Bot className="h-5 w-5"/></div></header>
          <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {hasOlderMessages&&<div className="sticky top-0 z-10 flex justify-center pb-1"><button type="button" onClick={()=>void loadOlderMessages()} disabled={loadingOlder} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11161c]/95 px-3 py-2 text-[10px] font-semibold text-slate-300 shadow-lg transition hover:border-orange-400/35 hover:text-white disabled:opacity-50">{loadingOlder&&<LoaderCircle className="h-3 w-3 animate-spin"/>}{loadingOlder?"Cargando mensajes…":"Cargar mensajes anteriores"}</button></div>}
            {messages.length===0&&<div className="flex min-h-[380px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300"><MessageSquare className="h-6 w-6"/></div><h3 className="mt-4 text-sm font-semibold">Laboratorio privado listo</h3><p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">Puedes revisar competencias, pedir síntesis de un documento o diseñar material didáctico original. Publica los PDFs desde la biblioteca cuando los hayas revisado.</p></div>}
            {messages.map((message,index)=><article key={message.id??index} className={message.role==="user"?"ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-orange-500 px-4 py-3 text-sm text-[#17100a]":"max-w-[95%] rounded-2xl rounded-tl-sm border border-white/10 bg-[#0c1117] px-4 py-3 text-sm text-slate-200"}><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[9px] font-bold uppercase tracking-[.14em] opacity-65">{message.role==="user"?"Administrador":"Orby · ICFES Lab"}</p>{message.role==="assistant"&&message.verification==="passed"&&<span className="text-[9px] font-semibold text-emerald-300">Fuentes verificadas</span>}{message.role==="assistant"&&message.verification==="corrected"&&<span className="text-[9px] font-semibold text-sky-300">Referencias corregidas</span>}{message.role==="assistant"&&message.verification==="unverified"&&<span className="text-[9px] font-semibold text-amber-300">Borrador · verificación parcial</span>}</div><div className="whitespace-pre-wrap text-[12px] leading-6">{message.role === "assistant" ? formatAdminReply(message.content) : message.content}</div>{message.sources&&message.sources.length>0&&<div className="mt-3 border-t border-white/10 pt-2"><p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-orange-300">Fuentes consultadas</p>{message.sources.map((source,i)=><p key={i} className="text-[10px] leading-5 text-slate-400">{source.title} · {source.subject} · p. {source.page}</p>)}</div>}</article>)}
            {loading&&<div className="flex items-center gap-2 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin text-orange-400"/> Orby está revisando el material…</div>}
            <div ref={messagesEndRef}/>
          </div>
          <form onSubmit={sendMessage} className="border-t border-white/10 p-3 sm:p-4"><div className="flex items-end gap-2"><textarea rows={2} maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Revisa una competencia, compara materiales o prepara un recurso original…" className="min-h-12 max-h-32 flex-1 resize-y rounded-xl border border-white/10 bg-[#0b1015] px-3 py-3 text-xs leading-5 text-white outline-none placeholder:text-slate-500 focus:border-orange-400/45"/><button disabled={!draft.trim()||loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-[#17100a] transition hover:bg-orange-400 disabled:opacity-35" aria-label="Enviar mensaje"><Send className="h-4 w-4"/></button></div></form>
        </section>
      </div>
      <p className="mt-5 text-[10px] leading-5 text-slate-500">Los documentos se guardan como borradores; su publicación es manual. Orby utiliza fragmentos académicos para fundamentar sus respuestas; el origen del material no se muestra a los estudiantes. Esta biblioteca no reentrena los pesos del modelo.</p>
    </div>
  </main>;
}

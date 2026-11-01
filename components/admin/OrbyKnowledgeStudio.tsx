"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Bot, Check, LoaderCircle, MessageSquare, Plus, Send, ShieldCheck, Sparkles, Trash2, UploadCloud } from "lucide-react";

type KnowledgeDocument = {
  id: string; title: string; original_name: string; subject: string; topic: string;
  page_count: number; chunk_count: number; status: "draft" | "published" | "archived"; created_at: string;
  embedded_chunk_count: number; knowledge_profile_status: "pending" | "ready" | "failed"; knowledge_profile_version: number; concept_count: number;
};
type Source = { documentId: string; title: string; subject: string; topic: string; page: number };
type ChatMessage = { id?: string; role: "user" | "assistant"; content: string; sources?: Source[]; verification?: "not_required" | "passed" | "corrected" | "unverified"; created_at?: string };

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
    const isTableRow = line.includes("|")
      && (line.startsWith("|") || line.endsWith("|") || line.split("|").length >= 3);
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
  const [enrichingDocument,setEnrichingDocument] = useState<string|null>(null);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement|null>(null);
  const messagesContainerRef = useRef<HTMLDivElement|null>(null);
  const preserveScrollRef = useRef<{height:number;top:number}|null>(null);

  async function loadAll(isActive: () => boolean = () => true) {
    const [docsResponse,chatResponse] = await Promise.all([
      fetch("/api/admin/orby/knowledge",{credentials:"same-origin",cache:"no-store"}),
      fetch("/api/admin/orby/chat",{credentials:"same-origin",cache:"no-store"}),
    ]);
    const docsPayload = await docsResponse.json().catch(()=>({}));
    const chatPayload = await chatResponse.json().catch(()=>({}));
    if(!docsResponse.ok) throw new Error(docsPayload.error||"No se pudo cargar la biblioteca.");
    if(!chatResponse.ok) throw new Error(chatPayload.error||"No se pudo cargar el chat privado.");
    if (!isActive()) return;
    setDocuments(Array.isArray(docsPayload.documents)?docsPayload.documents:[]);
    setMessages(Array.isArray(chatPayload.messages)?chatPayload.messages:[]);
    setHasOlderMessages(Boolean(chatPayload.hasMore));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => loadAll(() => !cancelled)).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el laboratorio.");
    });
    return () => { cancelled = true; };
  }, []);
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
    if(!file) return;
    setUploading(true);setError("");setNotice("");
    try {
      const form = new FormData();
      form.set("file",file);
      const response=await fetch("/api/admin/orby/knowledge",{method:"POST",credentials:"same-origin",body:form});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(payload.error||"No se pudo analizar el PDF.");
      setNotice(payload.message||"Documento cargado como borrador.");
      setFile(null);
      const input=document.getElementById("orby-knowledge-file") as HTMLInputElement|null;if(input)input.value="";
      await loadAll();
    } catch(e){setError(e instanceof Error?e.message:"No se pudo cargar el material.");}
    finally{setUploading(false);}
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
      if (!response.ok) throw new Error(payload.error || "No se pudo enriquecer el conocimiento.");
      const successCount = Number(payload.succeeded ?? 0);
      const failureCount = Number(payload.failed ?? 0);
      setNotice((payload.message || "Terminó el enriquecimiento de la biblioteca.") + " Correctos: " + successCount + "; pendientes o con error: " + failureCount + ".");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enriquecer el documento.");
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
            <label className="block text-xs font-semibold text-slate-300">Archivo PDF (máximo 20 MB)</label>
            <label htmlFor="orby-knowledge-file" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-4 transition hover:border-orange-400/45 hover:bg-orange-500/[0.04]"><UploadCloud className="h-5 w-5 shrink-0 text-orange-400"/><span className="min-w-0"><span className="block truncate text-xs font-medium text-white">{file?file.name:"Seleccionar documento PDF"}</span><span className="mt-1 block text-[10px] text-slate-500">{file?(file.size/1024/1024).toFixed(2)+" MB":"PDF de hasta 20 MB con texto seleccionable. Los PDF escaneados no se admiten."}</span></span><input id="orby-knowledge-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
            <div className="rounded-lg border border-orange-500/15 bg-orange-500/[0.05] px-3 py-3">
              <p className="text-xs font-semibold text-orange-200">Clasificación automática</p>
              <p className="mt-1 text-[10px] leading-5 text-slate-400">Orby guardará el PDF como material transversal de preparación Saber 11. El título se toma del nombre del archivo; no necesitas asignar materia ni tema.</p>
            </div>
            <button disabled={!file||uploading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-[#1a1008] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">{uploading?<><LoaderCircle className="h-4 w-4 animate-spin"/> Analizando PDF…</>:<><Plus className="h-4 w-4"/> Cargar y analizar material</>}</button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Biblioteca ({documents.length})</h3><span className="text-[10px] text-slate-500">Solo documentos publicados alimentan el chat estudiantil</span></div>{documents.some(doc=>doc.knowledge_profile_status!=="ready"||doc.knowledge_profile_version<2||doc.embedded_chunk_count<doc.chunk_count)&&<button type="button" disabled={enrichingDocument!==null} onClick={()=>void enrichKnowledge()} className="inline-flex items-center gap-2 rounded-lg border border-orange-400/25 bg-orange-400/10 px-3 py-2 text-[10px] font-semibold text-orange-200 transition hover:bg-orange-400/15 disabled:opacity-50">{enrichingDocument==="all"?<LoaderCircle className="h-3.5 w-3.5 animate-spin"/>:<Sparkles className="h-3.5 w-3.5"/>}{enrichingDocument==="all"?"Enriqueciendo biblioteca…":"Actualizar conocimiento v2"}</button>}</div>
          <div className="mt-3 space-y-2">
            {documents.map(doc=><article key={doc.id} className="rounded-xl border border-white/[.08] bg-black/15 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-white">{doc.title}</p><span className={doc.status==="published"?"rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300":doc.status==="archived"?"rounded-full bg-slate-500/15 px-2 py-1 text-[9px] font-bold text-slate-400":"rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300"}>{doc.status==="published"?"PUBLICADO":doc.status==="archived"?"ARCHIVADO":"BORRADOR"}</span></div><p className="mt-1 text-[10px] text-slate-500">{doc.subject} · {doc.page_count} páginas · {doc.chunk_count} fragmentos</p><p className="mt-1 text-[10px] text-slate-500">{doc.knowledge_profile_status==="ready"&&doc.knowledge_profile_version>=2&&doc.embedded_chunk_count>=doc.chunk_count?<span className="text-emerald-300">Conocimiento v{doc.knowledge_profile_version} listo · {doc.concept_count} conceptos · {doc.embedded_chunk_count}/{doc.chunk_count} vectores</span>:<span className={doc.knowledge_profile_status==="failed"?"text-rose-300":"text-amber-300"}>{doc.knowledge_profile_status==="failed"?"Enriquecimiento pendiente de reintento":"Conocimiento pendiente"} · {doc.embedded_chunk_count??0}/{doc.chunk_count} vectores</span>}</p></div><button type="button" onClick={()=>void deleteDocument(doc)} aria-label={"Eliminar "+doc.title} className="rounded-md p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(doc.knowledge_profile_status!=="ready" || doc.knowledge_profile_version<2 || doc.embedded_chunk_count<doc.chunk_count)&&<button type="button" disabled={enrichingDocument!==null} onClick={()=>void enrichKnowledge(doc)} className="inline-flex items-center gap-1.5 rounded-md border border-orange-400/25 bg-orange-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-orange-200 transition hover:bg-orange-400/15 disabled:opacity-50">{enrichingDocument===doc.id?<LoaderCircle className="h-3 w-3 animate-spin"/>:<Sparkles className="h-3 w-3"/>}{enrichingDocument===doc.id?"Enriqueciendo…":doc.knowledge_profile_version<2?"Actualizar conocimiento v2":"Generar conocimiento"}</button>}{doc.status!=="published"?<button type="button" onClick={()=>void changeStatus(doc,"published")} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"><Check className="h-3.5 w-3.5"/> Publicar para Orby</button>:<button type="button" onClick={()=>void changeStatus(doc,"archived")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-amber-400/30 hover:text-amber-200">Archivar</button>}<button type="button" onClick={()=>void changeStatus(doc,"draft")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition hover:text-white">Volver a borrador</button></div>
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

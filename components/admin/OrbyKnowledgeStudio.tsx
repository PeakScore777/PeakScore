"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Bot, Check, FileUp, LoaderCircle, MessageSquare, Plus, Send, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

type KnowledgeDocument = {
  id: string; title: string; original_name: string; subject: string; topic: string;
  page_count: number; chunk_count: number; status: "draft" | "published" | "archived"; created_at: string;
};
type Source = { documentId: string; title: string; subject: string; topic: string; page: number };
type ChatMessage = { id?: string; role: "user" | "assistant"; content: string; sources?: Source[]; created_at?: string };

const SUBJECTS = ["Matemáticas","Lectura Crítica","Sociales y Ciudadanas","Ciencias Naturales","Inglés"];

export default function OrbyKnowledgeStudio() {
  const [documents,setDocuments] = useState<KnowledgeDocument[]>([]);
  const [messages,setMessages] = useState<ChatMessage[]>([]);
  const [subject,setSubject] = useState("Ciencias Naturales");
  const [title,setTitle] = useState("");
  const [topic,setTopic] = useState("");
  const [file,setFile] = useState<File|null>(null);
  const [draft,setDraft] = useState("");
  const [loading,setLoading] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement|null>(null);

  async function loadAll() {
    const [docsResponse,chatResponse] = await Promise.all([
      fetch("/api/admin/orby/knowledge",{credentials:"same-origin",cache:"no-store"}),
      fetch("/api/admin/orby/chat",{credentials:"same-origin",cache:"no-store"}),
    ]);
    const docsPayload = await docsResponse.json().catch(()=>({}));
    const chatPayload = await chatResponse.json().catch(()=>({}));
    if(!docsResponse.ok) throw new Error(docsPayload.error||"No se pudo cargar la biblioteca.");
    if(!chatResponse.ok) throw new Error(chatPayload.error||"No se pudo cargar el chat privado.");
    setDocuments(Array.isArray(docsPayload.documents)?docsPayload.documents:[]);
    setMessages(Array.isArray(chatPayload.messages)?chatPayload.messages:[]);
  }

  useEffect(()=>{ void loadAll().catch(e=>setError(e instanceof Error?e.message:"No se pudo cargar el laboratorio.")); },[]);
  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth",block:"end"}); },[messages,loading]);

  async function uploadDocument(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!file||!title.trim()||!topic.trim()) return;
    setUploading(true);setError("");setNotice("");
    try {
      const form = new FormData();
      form.set("file",file);form.set("title",title);form.set("topic",topic);form.set("subject",subject);
      const response=await fetch("/api/admin/orby/knowledge",{method:"POST",credentials:"same-origin",body:form});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(payload.error||"No se pudo analizar el PDF.");
      setNotice(payload.message||"Documento cargado como borrador.");
      setFile(null);setTitle("");setTopic("");
      const input=document.getElementById("orby-knowledge-file") as HTMLInputElement|null;if(input)input.value="";
      await loadAll();
    } catch(e){setError(e instanceof Error?e.message:"No se pudo cargar el material.");}
    finally{setUploading(false);}
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
      setMessages(current=>[...current,{role:"assistant",content:payload.reply,sources:Array.isArray(payload.sources)?payload.sources:[]}]);
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
          <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">01 / KNOWLEDGE BASE</p><h2 className="mt-2 text-xl font-semibold">Material de referencia</h2><p className="mt-1 text-xs text-slate-400">PDFs privados · extracción de texto · publicación manual</p></div><BookOpen className="h-6 w-6 text-orange-400"/></div>
          <form onSubmit={uploadDocument} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="block text-xs font-semibold text-slate-300">Archivo PDF (máximo 20 MB)</label>
            <label htmlFor="orby-knowledge-file" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-4 transition hover:border-orange-400/45 hover:bg-orange-500/[0.04]"><UploadCloud className="h-5 w-5 shrink-0 text-orange-400"/><span className="min-w-0"><span className="block truncate text-xs font-medium text-white">{file?file.name:"Seleccionar documento PDF"}</span><span className="mt-1 block text-[10px] text-slate-500">{file?(file.size/1024/1024).toFixed(2)+" MB":"Solo texto seleccionable. Los PDF escaneados se rechazan."}</span></span><input id="orby-knowledge-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-slate-300">Área<select value={subject} onChange={e=>setSubject(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-[#0b1015] px-3 text-xs text-white outline-none focus:border-orange-400/50">{SUBJECTS.map(item=><option key={item}>{item}</option>)}</select></label><label className="text-[11px] font-semibold text-slate-300">Tema o componente<input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={180} placeholder="Ej. Lectura de gráficas" className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-[#0b1015] px-3 text-xs text-white outline-none focus:border-orange-400/50"/></label></div>
            <label className="block text-[11px] font-semibold text-slate-300">Título del material<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={180} placeholder="Ej. Guía de competencias de Ciencias Naturales" className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-[#0b1015] px-3 text-xs text-white outline-none focus:border-orange-400/50"/></label>
            <button disabled={!file||!title.trim()||!topic.trim()||uploading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-bold text-[#1a1008] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">{uploading?<><LoaderCircle className="h-4 w-4 animate-spin"/> Analizando PDF…</>:<><Plus className="h-4 w-4"/> Cargar y analizar material</>}</button>
          </form>
          <div className="mt-6 flex items-center justify-between"><h3 className="text-sm font-semibold">Biblioteca ({documents.length})</h3><span className="text-[10px] text-slate-500">Solo documentos publicados alimentan el chat estudiantil</span></div>
          <div className="mt-3 space-y-2">
            {documents.map(doc=><article key={doc.id} className="rounded-xl border border-white/[.08] bg-black/15 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-white">{doc.title}</p><span className={doc.status==="published"?"rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300":doc.status==="archived"?"rounded-full bg-slate-500/15 px-2 py-1 text-[9px] font-bold text-slate-400":"rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300"}>{doc.status==="published"?"PUBLICADO":doc.status==="archived"?"ARCHIVADO":"BORRADOR"}</span></div><p className="mt-1 text-[10px] text-slate-500">{doc.subject} · {doc.topic} · {doc.page_count} páginas · {doc.chunk_count} fragmentos</p></div><button type="button" onClick={()=>void deleteDocument(doc)} aria-label={"Eliminar "+doc.title} className="rounded-md p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
              <div className="mt-3 flex flex-wrap gap-2">{doc.status!=="published"?<button type="button" onClick={()=>void changeStatus(doc,"published")} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"><Check className="h-3.5 w-3.5"/> Publicar para Orby</button>:<button type="button" onClick={()=>void changeStatus(doc,"archived")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-amber-400/30 hover:text-amber-200">Archivar</button>}<button type="button" onClick={()=>void changeStatus(doc,"draft")} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition hover:text-white">Volver a borrador</button></div>
            </article>)}
            {documents.length===0&&<div className="rounded-xl border border-dashed border-white/10 p-8 text-center"><p className="text-xs font-semibold text-slate-300">La biblioteca está vacía</p><p className="mt-1 text-[10px] text-slate-500">Carga tu primer material para empezar a construir el conocimiento curado de Orby.</p></div>}
          </div>
        </section>
        <section className="flex min-h-[720px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11161c]">
          <header className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-400">02 / PRIVATE SESSION</p><h2 className="mt-2 text-xl font-semibold">Habla con Orby</h2><p className="mt-1 text-xs text-slate-400">Solo visible para administradores autenticados.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-300"><Bot className="h-5 w-5"/></div></header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.length===0&&<div className="flex min-h-[380px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300"><MessageSquare className="h-6 w-6"/></div><h3 className="mt-4 text-sm font-semibold">Laboratorio privado listo</h3><p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">Puedes revisar competencias, pedir síntesis de un documento o diseñar material didáctico original. Publica los PDFs desde la biblioteca cuando los hayas revisado.</p></div>}
            {messages.map((message,index)=><article key={message.id??index} className={message.role==="user"?"ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-orange-500 px-4 py-3 text-sm text-[#17100a]":"max-w-[95%] rounded-2xl rounded-tl-sm border border-white/10 bg-[#0c1117] px-4 py-3 text-sm text-slate-200"}><p className="mb-2 text-[9px] font-bold uppercase tracking-[.14em] opacity-65">{message.role==="user"?"Administrador":"Orby · ICFES Lab"}</p><div className="whitespace-pre-wrap text-[12px] leading-6">{message.content}</div>{message.sources&&message.sources.length>0&&<div className="mt-3 border-t border-white/10 pt-2"><p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-orange-300">Fuentes consultadas</p>{message.sources.map((source,i)=><p key={i} className="text-[10px] leading-5 text-slate-400">{source.title} · {source.subject} · p. {source.page}</p>)}</div>}</article>)}
            {loading&&<div className="flex items-center gap-2 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin text-orange-400"/> Orby está revisando el material…</div>}
            <div ref={messagesEndRef}/>
          </div>
          <form onSubmit={sendMessage} className="border-t border-white/10 p-3 sm:p-4"><div className="flex items-end gap-2"><textarea rows={2} maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Revisa una competencia, compara materiales o prepara un recurso original…" className="min-h-12 max-h-32 flex-1 resize-y rounded-xl border border-white/10 bg-[#0b1015] px-3 py-3 text-xs leading-5 text-white outline-none placeholder:text-slate-500 focus:border-orange-400/45"/><button disabled={!draft.trim()||loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-[#17100a] transition hover:bg-orange-400 disabled:opacity-35" aria-label="Enviar mensaje"><Send className="h-4 w-4"/></button></div></form>
        </section>
      </div>
      <p className="mt-5 text-[10px] leading-5 text-slate-500">Los documentos se guardan como borradores; la publicación es manual. Orby consulta fragmentos relevantes y cita el documento y la página. Esto no reentrena los pesos del modelo.</p>
    </div>
  </main>;
}

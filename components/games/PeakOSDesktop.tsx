"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Clock3, FileText, Folder, HardDrive, Mail, MessageSquare, Minus, Monitor, Search, ShieldAlert, X } from "lucide-react";

type AppId = "files" | "mail" | "messages" | "case" | "timeline";
type WindowState = { id: AppId; title: string; x: number; y: number; minimized: boolean };
type CaseEvidence = { code: string; title: string; detail: string; source: string; scope: string; suspect: string };
type CaseTimelineEntry = { time: string; event: string; source: string; record: "Registro" | "Declaración" | "Testimonio" | "Hallazgo"; suspect: string };


const APP_META: Record<AppId, { title: string; icon: typeof Folder }> = {
  files: { title: "Explorador", icon: Folder },
  mail: { title: "Correo", icon: Mail },
  messages: { title: "Mensajería", icon: MessageSquare },
  case: { title: "Centro de seguridad", icon: ShieldAlert },
  timeline: { title: "Cronología forense", icon: Clock3 },
};

export default function PeakOSDesktop({ caseTitle, evidence = [], timeline = [], onClose }: { caseTitle: string; evidence?: CaseEvidence[]; timeline?: CaseTimelineEntry[]; onClose: () => void }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [active, setActive] = useState<AppId | null>(null);
  const [fileQuery, setFileQuery] = useState("");
  const [timelineQuery, setTimelineQuery] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<CaseEvidence | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<CaseEvidence | null>(null);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => { window.clearInterval(interval); window.removeEventListener("keydown", escape); };
  }, [onClose]);
  const files = useMemo(() => evidence.map(item => ({ name: `${item.code}_${item.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`, type: "Ficha de evidencia", size: "Expediente", item })), [evidence]);
  const open = (id: AppId) => {
    setWindows(current => {
      const found = current.find(w => w.id === id);
      if (found) return current.map(w => w.id === id ? { ...w, minimized: false } : w);
      return [...current, { id, title: APP_META[id].title, x: Math.max(12, Math.min(window.innerWidth - 360, Math.round((window.innerWidth - 790) / 2) + current.length * 28)), y: Math.max(48, Math.min(window.innerHeight - 360, Math.round((window.innerHeight - 590) / 2) + current.length * 24)), minimized: false }];
    });
    setActive(id);
  };
  const close = (id: AppId) => {
    setWindows(current => current.filter(w => w.id !== id));
    setActive(current => current === id ? (windows.filter(w => w.id !== id && !w.minimized).at(-1)?.id ?? null) : current);
  };
  const drag = (id: AppId, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX, startY = event.clientY;
    const windowState = windows.find(w => w.id === id);
    if (!windowState) return;
    const originX = windowState.x, originY = windowState.y;
    setActive(id);
    const move = (e: PointerEvent) => {
      const x = Math.max(0, Math.min(window.innerWidth - 280, originX + e.clientX - startX));
      const y = Math.max(36, Math.min(window.innerHeight - 100, originY + e.clientY - startY));
      setWindows(current => current.map(w => w.id === id ? { ...w, x, y } : w));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  return <div className="fixed inset-0 z-[160] overflow-hidden bg-[#080b09] text-[#18221f]" role="dialog" aria-modal="true" aria-label="PEAK OS">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(70,85,70,.26),transparent_68%)]" />
    <div className="absolute inset-[2.2vh_2vw] overflow-hidden rounded-[24px] border-[12px] border-[#202722] shadow-[0_0_0_2px_#667064,0_30px_100px_rgba(0,0,0,.85),inset_0_0_22px_rgba(0,0,0,.7)]">
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 22% 15%,rgba(109,145,119,.42),transparent 38%),linear-gradient(135deg,#253c34,#142720 58%,#0c1715)" }} />
    <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
    <div className="absolute left-5 top-5 flex flex-col gap-5">
      {(["files","mail","messages","case","timeline"] as AppId[]).map(id => { const Icon = APP_META[id].icon; return <button key={id} onDoubleClick={() => open(id)} onClick={() => setActive(id)} onKeyDown={e => { if (e.key === "Enter") open(id); }} className="group flex w-[92px] flex-col items-center gap-2 rounded-lg p-2 text-center text-[11px] font-semibold text-[#edf2df] hover:bg-white/10" title="Doble clic para abrir"><span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-[#d6ddc9] text-[#263a31] shadow-[0_5px_12px_rgba(0,0,0,.3)]"><Icon size={24}/></span><span className="drop-shadow">{APP_META[id].title}</span></button>; })}
    </div>
    <div className="absolute right-6 top-5 rounded border border-[#d8c8a2]/35 bg-black/25 px-4 py-3 text-right text-[#e9e1cb] backdrop-blur-sm">
      <div className="font-mono text-[10px] tracking-[.22em] text-[#c7b88f]">PEAK SYSTEMS · SECURE TERMINAL</div>
      <div className="mt-1 text-sm font-semibold">Estación de investigación</div>
      <div className="mt-1 text-[10px] text-[#c8d0bd]">CASO ACTIVO / {caseTitle.toUpperCase()}</div>
    </div>
    {windows.filter(w => !w.minimized).map(w => <section key={w.id} onPointerDown={() => setActive(w.id)} className="absolute flex flex-col overflow-hidden rounded-md border border-[#dce2d2] bg-[#e8eadf] shadow-[0_24px_80px_rgba(0,0,0,.55)]" style={{ left: w.x, top: w.y, width: "min(790px, calc(100vw - 36px))", height: "min(590px, calc(100vh - 112px))", minWidth: "320px", minHeight: "280px", maxWidth: "calc(100vw - 36px)", maxHeight: "calc(100vh - 80px)", resize: "both", zIndex: active === w.id ? 30 : 20 }}>
      <div onPointerDown={e => drag(w.id,e)} className="flex h-10 shrink-0 cursor-move items-center justify-between bg-gradient-to-r from-[#263e35] to-[#486653] px-3 text-white">
        <div className="flex items-center gap-2 text-xs font-bold"><Monitor size={15}/>{w.title} <span className="font-normal text-white/65">— {caseTitle}</span></div>
        <div className="flex gap-1"><button onClick={() => setWindows(c => c.map(x => x.id === w.id ? {...x,minimized:true}:x))} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label="Minimizar"><Minus size={14}/></button><button onClick={() => close(w.id)} className="grid h-7 w-8 place-items-center hover:bg-red-500" aria-label="Cerrar"><X size={14}/></button></div>
      </div>
      <div className="flex h-8 shrink-0 items-center gap-5 border-b border-[#c8cbbd] bg-[#f4f4ed] px-4 text-[11px] text-[#4d574e]"><span>Archivo</span><span>Edición</span><span>Ver</span><span>Herramientas</span><span>Ayuda</span></div>
      {w.id === "files" && <div className="flex min-h-0 flex-1 text-xs"><aside className="w-48 shrink-0 border-r border-[#c8cbbd] bg-[#dfe4d8] p-4"><p className="mb-3 font-bold uppercase tracking-wider text-[9px] text-[#697468]">Ubicaciones</p><p className="mb-3 flex items-center gap-2"><HardDrive size={14}/> Este equipo</p><p className="mb-3 flex items-center gap-2"><Folder size={14}/> Expediente actual</p><p className="flex items-center gap-2"><Archive size={14}/> Archivo histórico</p></aside><div className="min-w-0 flex-1 p-5"><label className="mb-4 flex items-center gap-2 border border-[#c8cbbd] bg-white px-3 py-2 text-[#667066]"><Search size={14}/><span className="sr-only">Buscar archivos</span><input value={fileQuery} onChange={e => setFileQuery(e.target.value)} placeholder={`Buscar en ${caseTitle}…`} className="min-w-0 flex-1 bg-transparent text-xs text-[#303b34] outline-none placeholder:text-[#92998f]"/></label><div className="grid grid-cols-[1fr_1fr_90px] border-b border-[#c8cbbd] pb-2 text-[10px] font-bold text-[#697468]"><span>Nombre</span><span>Tipo</span><span>Tamaño</span></div>{files.filter(f => f.name.toLowerCase().includes(fileQuery.toLowerCase())).map(f=><button type="button" key={f.name} onDoubleClick={() => setPreviewEvidence(f.item)} onClick={() => setSelectedEvidence(f.item)} className={`grid w-full grid-cols-[1fr_1fr_90px] items-center border-b border-[#d7d9cf] py-3 text-left text-[#303b34] hover:bg-[#dce5d7] focus:bg-[#dce5d7] focus:outline-none ${selectedEvidence?.code===f.item.code&&selectedEvidence?.suspect===f.item.suspect?"bg-[#dce5d7]":""}`}><span className="flex items-center gap-2"><FileText size={15} className="text-[#647d65]"/>{f.name}</span><span>{f.type}</span><span>{f.size}</span></button> )}{files.filter(f => f.name.toLowerCase().includes(fileQuery.toLowerCase())).length === 0 && <p className="py-8 text-center text-xs text-[#7b8378]">No se encontraron archivos con ese nombre.</p>}<p className="mt-5 text-[10px] text-[#7b8378]">Selecciona un archivo para ver sus datos. Haz doble clic para abrir la vista previa confidencial.</p></div></div>}
      {w.id === "mail" && <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#f4f4ed] p-8 text-center"><Mail size={32} className="text-[#74836f]"/><h3 className="mt-4 text-sm font-bold text-[#39483d]">Sin correspondencia indexada</h3><p className="mt-2 max-w-sm text-xs leading-6 text-[#727c70]">Este expediente todavía no tiene correos digitales cargados. No mostraremos mensajes inventados como si fueran pruebas.</p></div>}
      {w.id === "messages" && <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#f3f4ed] p-8 text-center"><MessageSquare size={32} className="text-[#74836f]"/><h3 className="mt-4 text-sm font-bold text-[#39483d]">Canal sin mensajes</h3><p className="mt-2 max-w-sm text-xs leading-6 text-[#727c70]">Las conversaciones aparecerán aquí cuando estén definidas para este libro. No se han simulado remitentes ni conversaciones.</p></div>}
      {w.id === "timeline" && <div className="min-h-0 flex-1 overflow-auto bg-[#f1f0e7] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c8cbbd] pb-4">
          <div><p className="font-mono text-[9px] tracking-[.18em] text-[#78816f]">SECUENCIA DOCUMENTAL</p><h3 className="mt-1 text-lg font-bold text-[#354238]">Cronología forense</h3><p className="mt-1 text-[11px] text-[#6c7569]">{caseTitle} · {timeline.length} registros disponibles</p></div>
          <label className="flex min-w-[190px] items-center gap-2 border border-[#c8cbbd] bg-white px-3 py-2 text-[#667066]"><Search size={13}/><span className="sr-only">Filtrar cronología</span><input value={timelineQuery} onChange={e => setTimelineQuery(e.target.value)} placeholder="Filtrar hechos…" className="min-w-0 flex-1 bg-transparent text-xs text-[#303b34] outline-none placeholder:text-[#92998f]"/></label>
        </div>
        {timeline.length ? <div className="mt-5 space-y-6">{Array.from(new Set(timeline.map(item => item.suspect))).map(suspect => {
          const entries = timeline.filter(item => item.suspect === suspect && [item.time,item.event,item.source,item.record].join(" ").toLowerCase().includes(timelineQuery.toLowerCase()));
          if (!entries.length) return null;
          return <section key={suspect}><div className="mb-3 flex items-center gap-2"><span className="h-px flex-1 bg-[#c7cbbb]"/><h4 className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#526650]">{suspect}</h4><span className="h-px flex-1 bg-[#c7cbbb]"/></div><div className="relative ml-3 border-l border-[#a9b39f] pl-5">{entries.map((item,index) => <article key={suspect+item.time+item.event} className="relative pb-5 last:pb-0"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#f1f0e7] bg-[#657d62] ring-1 ring-[#82927c]"/><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><time className="font-mono text-[11px] font-bold text-[#8c493a]">{item.time}</time><span className="border border-[#c7cbbb] bg-[#e4e8dc] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#566451]">{item.record}</span></div><p className="mt-1 text-xs leading-6 text-[#354238]">{item.event}</p><p className="mt-1 text-[10px] leading-5 text-[#7a806f]">FUENTE: {item.source}</p></article>)}</div></section>;
        })}{!timeline.some(item => [item.time,item.event,item.source,item.record].join(" ").toLowerCase().includes(timelineQuery.toLowerCase())) && <p className="py-10 text-center text-xs text-[#78816f]">No hay eventos que coincidan con ese filtro.</p>}</div> : <p className="mt-6 border border-[#d2c6ad] bg-[#f3eddf] p-4 text-xs leading-6 text-[#5c574b]">Este expediente todavía no tiene una cronología digital asociada. No se mostrarán eventos inventados.</p>}
        <p className="mt-6 border-t border-[#d0d2c6] pt-3 text-[9px] leading-5 text-[#7a806f]">Las horas y fuentes se presentan tal como aparecen en el expediente. Una declaración no equivale a un hecho verificado.</p>
      </div>}
      {w.id === "case" && <div className="min-h-0 flex-1 overflow-auto p-6"><div className="flex items-center gap-3 border-b border-[#c8cbbd] pb-4"><ShieldAlert size={25} className="text-[#8b6542]"/><div><p className="text-[10px] uppercase tracking-widest text-[#76806f]">Archivo de investigación</p><h3 className="font-bold">{caseTitle}</h3></div></div><div className="mt-4 flex items-center justify-between text-[10px] text-[#697468]"><span>{evidence.length} registros documentados</span><span>FUENTE Y ALCANCE</span></div>{evidence.length ? <div className="mt-3 space-y-3">{evidence.map(item=><article key={item.suspect+item.code} className="border border-[#c8cbbd] bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-bold text-[#55715d]">{item.code} · {item.suspect}</span><span className="text-[9px] uppercase tracking-wider text-[#8b7654]">Ficha</span></div><h4 className="mt-2 text-sm font-bold text-[#303b34]">{item.title}</h4><p className="mt-2 text-xs leading-6 text-[#48544a]">{item.detail}</p><p className="mt-3 text-[10px] text-[#64745f]">FUENTE: {item.source}</p><p className="mt-1 border-l-2 border-[#b69a6b] bg-[#f3f0e7] px-3 py-2 text-[10px] leading-5 text-[#6d6657]">ALCANCE: {item.scope}</p></article>)}</div> : <p className="mt-6 border border-[#d2c6ad] bg-[#f3eddf] p-4 text-xs leading-6 text-[#5c574b]">Este libro aún no tiene fichas digitales de evidencia asociadas. El contenido de la lectura física sigue siendo la fuente principal.</p>}</div>}
    </section>)}
    {previewEvidence && <div className="absolute inset-0 z-[70] grid place-items-center bg-black/65 p-6 backdrop-blur-sm"><article className="relative max-h-[86%] w-full max-w-[760px] overflow-auto border border-[#b79b6b] bg-[#eee8d8] p-7 text-[#34382f] shadow-[0_25px_90px_rgba(0,0,0,.75)]"><button type="button" onClick={() => setPreviewEvidence(null)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center border border-[#9b8c70] hover:bg-[#ded6c4]" aria-label="Cerrar vista previa"><X size={16}/></button><div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden opacity-[.07]"><span className="-rotate-[28deg] whitespace-nowrap border-[5px] border-[#8b332d] px-8 py-3 text-5xl font-black tracking-[.2em] text-[#8b332d]">CONFIDENCIAL</span></div><div className="relative border-b-2 border-[#827354] pb-4"><div className="flex items-center justify-between font-mono text-[9px] tracking-[.18em] text-[#786c55]"><span>PEAKSCORE · ARCHIVO DE INVESTIGACIÓN</span><span>USO INTERNO</span></div><h2 className="mt-5 font-serif text-2xl font-bold">{previewEvidence.title}</h2><p className="mt-1 font-mono text-xs text-[#7b6749]">{previewEvidence.code} · {previewEvidence.suspect}</p></div><div className="relative mt-6 space-y-5"><section><p className="font-mono text-[9px] font-bold tracking-[.2em] text-[#887452]">REGISTRO DOCUMENTAL</p><p className="mt-2 text-sm leading-7">{previewEvidence.detail}</p></section><section className="grid gap-4 border-y border-[#c4b99f] py-4 sm:grid-cols-2"><div><p className="font-mono text-[9px] font-bold tracking-widest text-[#887452]">FUENTE</p><p className="mt-1 text-xs leading-6">{previewEvidence.source}</p></div><div><p className="font-mono text-[9px] font-bold tracking-widest text-[#887452]">ALCANCE Y LIMITACIONES</p><p className="mt-1 text-xs leading-6">{previewEvidence.scope}</p></div></section><div className="flex items-center justify-between gap-4 font-mono text-[9px] text-[#81745d]"><span>DOCUMENTO DERIVADO DEL EXPEDIENTE ACTIVO</span><span>PS · {previewEvidence.code}</span></div></div></article></div>}
    <div className="absolute bottom-0 left-0 right-0 z-50 flex h-12 items-center gap-2 border-t border-white/20 bg-[#d9dfd0] px-2 shadow-[0_-4px_18px_rgba(0,0,0,.2)]"><button onClick={onClose} className="flex h-9 items-center gap-2 rounded border border-[#9da995] bg-gradient-to-b from-[#f6f7ef] to-[#c8d2c2] px-3 text-xs font-black text-[#304136] shadow-sm"><Monitor size={16}/> PEAK</button><div className="mx-1 h-7 w-px bg-[#aab3a4]"/>{windows.map(w=><button key={w.id} onClick={()=>{setWindows(c=>c.map(x=>x.id===w.id?{...x,minimized:!x.minimized}:x));setActive(w.id)}} className={`flex h-8 max-w-44 items-center gap-2 truncate border px-3 text-[11px] ${active===w.id&&!w.minimized?"border-[#83917e] bg-[#c3cdbd]":"border-transparent bg-[#e8eadf]"}`}><span className="truncate">{w.title}</span></button>)}<div className="ml-auto flex items-center gap-3 px-3 text-[10px] text-[#344238]"><span>ES · COL</span><span className="font-mono text-xs font-bold">{clock}</span><button onClick={onClose} aria-label="Cerrar PEAK OS" className="rounded border border-[#8e9b88] px-2 py-1 hover:bg-white">SALIR</button></div></div>
    <div className="absolute bottom-16 left-5 text-[9px] font-mono tracking-[.2em] text-white/40">PEAK OS 1.0 · ENTORNO DE INVESTIGACIÓN · ESC PARA VOLVER</div>
    <div className="pointer-events-none absolute inset-0 z-[80] opacity-[.055]" style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,.9) 0px,rgba(0,0,0,.9) 1px,transparent 2px,transparent 4px)" }} />
    </div>
  </div>;
}

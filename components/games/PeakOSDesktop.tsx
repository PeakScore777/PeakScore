"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Clock3, FileText, Folder, HardDrive, Mail, MessageSquare, Minus, Monitor, Search, ShieldAlert, X, Power, ChevronDown } from "lucide-react";

type AppId = "files" | "mail" | "messages" | "case" | "timeline";
type WindowState = { id: AppId; title: string; x: number; y: number; width: number; height: number; minimized: boolean; maximized: boolean };
type CaseEvidence = { code: string; title: string; detail: string; source: string; scope: string; suspect: string };
type CaseTimelineEntry = { time: string; event: string; source: string; record: "Registro" | "Declaración" | "Testimonio" | "Hallazgo"; suspect: string };
type CaseRecord = { id: string; record_type: "timeline" | "email" | "message"; occurred_at: string; title: string; body: string; source: string; sender: string; recipient: string; subject: string; suspect_id: string | null; suspect_name: string; evidence_asset_id: string | null; evidence_code: string; evidence_title: string; evidence_description: string; evidence_url: string; document_reference: string; page_number: string; seal: string; signature_note: string; classification: string; display_order: number };


const APP_META: Record<AppId, { title: string; icon: typeof Folder }> = {
  files: { title: "Explorador", icon: Folder },
  mail: { title: "Correo", icon: Mail },
  messages: { title: "Mensajería", icon: MessageSquare },
  case: { title: "Centro de seguridad", icon: ShieldAlert },
  timeline: { title: "Cronología forense", icon: Clock3 },
};

export default function PeakOSDesktop({ caseTitle, passageId, evidence = [], timeline = [], onClose }: { caseTitle: string; passageId: string; evidence?: CaseEvidence[]; timeline?: CaseTimelineEntry[]; onClose: () => void }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [active, setActive] = useState<AppId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [fileFolder, setFileFolder] = useState("Todos");
  const [fileSort, setFileSort] = useState<"name" | "person" | "code">("name");
  const [fileView, setFileView] = useState<"list" | "grid">("list");
  const [fileHistory, setFileHistory] = useState<string[]>(["Todos"]);
  const [fileHistoryIndex, setFileHistoryIndex] = useState(0);
  const [selectedSuspect, setSelectedSuspect] = useState("Todos");
  const [timelineQuery, setTimelineQuery] = useState("");
  const [timelinePerson, setTimelinePerson] = useState("Todos");
  const [caseRecords, setCaseRecords] = useState<CaseRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CaseRecord | null>(null);
  const [mailQuery, setMailQuery] = useState("");
  const [mailFilter, setMailFilter] = useState<"all" | "linked" | "referenced">("all");
  const [messageQuery, setMessageQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [linkedEvidencePreview, setLinkedEvidencePreview] = useState<CaseRecord | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<CaseEvidence | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<CaseEvidence | null>(null);
  const openRef = useRef<((id: AppId) => void) | null>(null);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // Cerrar primero la capa superior; no minimizar ni cerrar la ventana que está debajo.
        if (linkedEvidencePreview) { setLinkedEvidencePreview(null); return; }
        if (previewEvidence) { setPreviewEvidence(null); return; }
        if (startMenuOpen) { setStartMenuOpen(false); return; }
        if (active) {
          setWindows(current => current.map(item => item.id === active ? { ...item, minimized: true } : item));
          setActive(null);
          return;
        }
        onClose();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const shortcuts: Record<string, AppId> = { e: "files", m: "mail", t: "timeline" };
      const target = event.key.toLowerCase() === "m" && event.shiftKey ? "messages" : shortcuts[event.key.toLowerCase()];
      if (target) { event.preventDefault(); setStartMenuOpen(false); openRef.current?.(target); }
    };
    window.addEventListener("keydown", keyboard);
    return () => { window.clearInterval(interval); window.removeEventListener("keydown", keyboard); };
  }, [onClose, startMenuOpen, active, linkedEvidencePreview, previewEvidence]);
  const files = useMemo(() => evidence.map(item => ({ name: `${item.code}_${item.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`, type: "Ficha de evidencia", size: "Expediente", item })), [evidence]);
  const suspectFolders = useMemo(() => ["Todos", ...Array.from(new Set(files.map(file => file.item.suspect))).sort((a,b)=>a.localeCompare(b,"es"))], [files]);
  const navigateFiles = (folder: string) => {
    setFileFolder(folder);
    setFileHistory(current => [...current.slice(0, fileHistoryIndex + 1), folder]);
    setFileHistoryIndex(index => index + 1);
    setSelectedEvidence(null);
    setPreviewEvidence(null);
  };
  const moveFileHistory = (direction: -1 | 1) => {
    const next = fileHistoryIndex + direction;
    if (next < 0 || next >= fileHistory.length) return;
    setFileHistoryIndex(next);
    setFileFolder(fileHistory[next]);
    setSelectedEvidence(null);
    setPreviewEvidence(null);
  };
  const handleExplorerKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && ["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName)) return;
    if (event.key === "Backspace") { event.preventDefault(); moveFileHistory(-1); return; }
    if (event.key === "Escape" && previewEvidence) { event.preventDefault(); setPreviewEvidence(null); return; }
    if (event.key === "Enter" && selectedEvidence) { event.preventDefault(); setPreviewEvidence(selectedEvidence); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = filteredFiles.findIndex(file => file.item.code === selectedEvidence?.code && file.item.suspect === selectedEvidence?.suspect);
      const next = event.key === "ArrowDown" ? Math.min(filteredFiles.length - 1, current < 0 ? 0 : current + 1) : Math.max(0, current < 0 ? 0 : current - 1);
      if (filteredFiles[next]) setSelectedEvidence(filteredFiles[next].item);
    }
  };
  const filteredFiles = useMemo(() => {
    const query = fileQuery.trim().toLocaleLowerCase("es");
    return files.filter(file => (fileFolder === "Todos" || file.item.suspect === fileFolder)
      && (!query || [file.name, file.item.suspect, file.item.code, file.item.title, file.item.source, file.item.detail].some(value => value.toLocaleLowerCase("es").includes(query))))
      .sort((a,b)=>fileSort==="person"?a.item.suspect.localeCompare(b.item.suspect,"es"):fileSort==="code"?a.item.code.localeCompare(b.item.code,"es"):a.item.title.localeCompare(b.item.title,"es"));
  }, [files, fileQuery, fileFolder, fileSort]);
  useEffect(() => {
    const controller = new AbortController();
    setRecordsLoading(true);
    setRecordsError("");
    fetch("/api/games/archivo-oculto/records?passageId=" + encodeURIComponent(passageId), { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los registros."); return data; })
      .then(data => setCaseRecords(Array.isArray(data.records) ? data.records as CaseRecord[] : []))
      .catch(error => { if (error instanceof Error && error.name !== "AbortError") setRecordsError(error.message || "Error de carga."); })
      .finally(() => { if (!controller.signal.aborted) setRecordsLoading(false); });
    return () => controller.abort();
  }, [passageId]);
  const storedTimeline = useMemo(() => caseRecords.filter(record => record.record_type === "timeline"), [caseRecords]);
  const storedEmails = useMemo(() => caseRecords.filter(record => record.record_type === "email"), [caseRecords]);
  const filteredEmails = useMemo(() => {
    const query = mailQuery.trim().toLocaleLowerCase("es");
    return storedEmails.filter(record => {
      const matchesFilter = mailFilter === "all" || (mailFilter === "linked" ? Boolean(record.evidence_asset_id || record.evidence_code) : Boolean(record.document_reference));
      const matchesQuery = !query || [record.subject, record.title, record.sender, record.recipient, record.body, record.evidence_code].some(value => (value || "").toLocaleLowerCase("es").includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [storedEmails, mailQuery, mailFilter]);
  const storedMessages = useMemo(() => caseRecords.filter(record => record.record_type === "message"), [caseRecords]);
  const filteredMessages = useMemo(() => {
    const query = messageQuery.trim().toLocaleLowerCase("es");
    return storedMessages.filter(record => !query || [record.title, record.sender, record.recipient, record.body, record.evidence_code, record.document_reference].some(value => (value || "").toLocaleLowerCase("es").includes(query)));
  }, [storedMessages, messageQuery]);
  const messageThreads = useMemo(() => {
    const groups = new Map<string, CaseRecord[]>();
    for (const record of filteredMessages) {
      const key = [record.sender || "Remitente desconocido", record.recipient || "Destinatario desconocido"].sort((a,b)=>a.localeCompare(b,"es")).join(" ↔ ");
      const list = groups.get(key) || [];
      list.push(record);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).map(([key, records]) => ({ key, records: records.sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at,"es")), latest: records[records.length-1] })).sort((a,b)=>b.latest.occurred_at.localeCompare(a.latest.occurred_at,"es"));
  }, [filteredMessages]);
  const allTimeline = useMemo(() => {
    const merged = [
      ...timeline.map(item => ({ id: item.suspect + item.time + item.event, time: item.time, event: item.event, source: item.source, record: item.record, suspect: item.suspect, evidenceCode: "", evidenceTitle: "", evidenceDescription: "", evidenceUrl: "", priority: 0 })),
      ...storedTimeline.map(item => ({ id: item.id, time: item.occurred_at, event: item.body, source: item.source, record: "Registro" as const, suspect: item.suspect_name || "Expediente", evidenceCode: item.evidence_code, evidenceTitle: item.evidence_title, evidenceDescription: item.evidence_description, evidenceUrl: item.evidence_url, priority: 1 }))
    ];
    const unique = new Map<string, typeof merged[number]>();
    for (const item of merged) {
      const key = [item.suspect.trim().toLocaleLowerCase("es"), item.time.trim().toLocaleLowerCase("es")].join("|");
      const previous = unique.get(key);
      if (!previous || item.priority > previous.priority) unique.set(key, item);
    }
    return Array.from(unique.values()).sort((a,b)=>a.time.localeCompare(b.time,"es"));
  }, [timeline, storedTimeline]);
  const timelinePeople = useMemo(() => ["Todos", ...Array.from(new Set(allTimeline.map(item=>item.suspect))).sort((a,b)=>a.localeCompare(b,"es"))], [allTimeline]);
  const filteredTimeline = useMemo(() => {
    const query = timelineQuery.trim().toLocaleLowerCase("es");
    return allTimeline.filter(item => (timelinePerson === "Todos" || item.suspect === timelinePerson)
      && [item.time,item.event,item.source,item.record,item.suspect].join(" ").toLocaleLowerCase("es").includes(query));
  }, [allTimeline, timelineQuery, timelinePerson]);

  const open = (id: AppId) => {
    setWindows(current => {
      const found = current.find(w => w.id === id);
      if (found) return current.map(w => w.id === id ? { ...w, minimized: false } : w);
      const width = Math.min(860, Math.max(340, window.innerWidth - 48));
      const height = Math.min(640, Math.max(320, window.innerHeight - 112));
      const offset = (current.length % 5) * 26;
      return [...current, { id, title: APP_META[id].title, x: Math.max(8, Math.round((window.innerWidth - width) / 2) + offset), y: Math.max(54, Math.round((window.innerHeight - height) / 2) + offset), width, height, minimized: false, maximized: false }];
    });
    setActive(id);
  };
  openRef.current = open;
  const close = (id: AppId) => {
    setWindows(current => {
      const next = current.filter(w => w.id !== id);
      setActive(activeId => activeId === id ? (next.filter(w => !w.minimized).at(-1)?.id ?? null) : activeId);
      return next;
    });
  };
  const toggleMaximize = (id: AppId) => {
    setWindows(current => current.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
    setActive(id);
  };
  const drag = (id: AppId, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const windowState = windows.find(w => w.id === id);
    if (!windowState || windowState.maximized) return;
    const startX = event.clientX, startY = event.clientY;
    const originX = windowState.x, originY = windowState.y, pointerId = event.pointerId;
    setActive(id);
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const x = Math.max(0, Math.min(Math.max(0, window.innerWidth - 280), originX + e.clientX - startX));
      const y = Math.max(46, Math.min(Math.max(46, window.innerHeight - 96), originY + e.clientY - startY));
      setWindows(current => current.map(w => w.id === id ? { ...w, x, y } : w));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return <div className="fixed inset-0 z-[160] overflow-hidden bg-[#111713] text-[#20271f]" role="dialog" aria-modal="true" aria-label="PEAK Archive Workstation">
    <div className="absolute inset-0" style={{background:"linear-gradient(132deg,#17281f 0%,#102019 55%,#0b1712 100%)"}}/>
    <div className="pointer-events-none absolute inset-0 opacity-[.045]" style={{backgroundImage:"linear-gradient(90deg,transparent 49.8%,rgba(210,205,174,.6) 50%,transparent 50.2%),linear-gradient(transparent 49.8%,rgba(210,205,174,.6) 50%,transparent 50.2%)",backgroundSize:"84px 84px"}}/>
    <header className="absolute left-0 right-0 top-0 z-10 flex h-[46px] items-center border-b border-[#9b9c7d]/50 bg-[#d9d9c8] px-4 text-[#263329] shadow-[0_2px_12px_rgba(0,0,0,.25)]">
      <div className="flex min-w-0 items-center gap-3"><span className="font-serif text-[15px] font-black tracking-[.1em] text-[#263b2d]">PEAK</span><span className="hidden h-5 w-px bg-[#9ba18f] sm:block"/><span className="hidden font-mono text-[9px] tracking-[.15em] text-[#53604f] sm:block">FIELDSTATION / ARCHIVE DIVISION</span></div>
      <nav className="ml-5 hidden h-full items-center gap-1 md:flex">
        <button onClick={()=>setStartMenuOpen(v=>!v)} className="flex h-full items-center gap-1 border-b-2 border-transparent px-3 text-[10px] hover:border-[#7e8c70] hover:bg-[#cbd0c0]">Inicio <ChevronDown size={11}/></button>
        <button onClick={()=>open("files")} className="h-full border-b-2 border-transparent px-3 text-[10px] hover:border-[#7e8c70] hover:bg-[#cbd0c0]">Archivo</button>
        <button onClick={()=>open("timeline")} className="h-full border-b-2 border-transparent px-3 text-[10px] hover:border-[#7e8c70] hover:bg-[#cbd0c0]">Cronología</button>
        <button onClick={()=>open("case")} className="h-full border-b-2 border-transparent px-3 text-[10px] hover:border-[#7e8c70] hover:bg-[#cbd0c0]">Ayuda del caso</button>
      </nav>
      <div className="ml-auto flex items-center gap-3 font-mono text-[9px]"><span className="hidden text-[#63705e] sm:inline">ESTACIÓN 01</span><span className="border-l border-[#aeb3a2] pl-3 font-bold text-[#344b3b]">{clock}</span><button onClick={onClose} aria-label="Cerrar estación" className="ml-1 grid h-6 w-7 place-items-center border border-[#899381] bg-[#e8e8dc] hover:bg-[#cbd1c2]"><X size={13}/></button></div>
    </header>
    <main className="absolute inset-x-0 bottom-[48px] top-[46px] overflow-hidden">
      <div className="absolute inset-0 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
        <div className="mx-auto grid min-h-full max-w-[1380px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#a9b38e]/20 pb-5">
              <div><p className="font-mono text-[9px] tracking-[.22em] text-[#c1ad78]">PEAK FIELDSTATION · ARCHIVE DIVISION</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#e7e6d6] sm:text-4xl">{caseTitle}</h1><p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#aab49e]">Tu mesa de investigación. Abre una herramienta para revisar documentos, comunicaciones y hechos del expediente.</p></div>
              <span className="border border-[#a5a47c]/35 bg-[#d9d9c8]/[.06] px-3 py-2 font-mono text-[9px] tracking-[.14em] text-[#c7c7a7]">SESIÓN LOCAL · ACTIVA</span>
            </div>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg text-[#e0e2d0]">Herramientas del expediente</h2><span className="font-mono text-[8px] tracking-widest text-[#89977d]">SELECCIONA PARA ABRIR</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(["files","mail","messages","timeline","case"] as AppId[]).map(id=>{const Icon=APP_META[id].icon;const descriptions:Record<AppId,string>={files:"Consulta las fichas y documentos disponibles.",mail:"Revisa los correos incorporados al caso.",messages:"Lee conversaciones y sus participantes.",timeline:"Ordena los hechos por hora y persona.",case:"Comprueba fuentes, límites y datos del caso."};return <button key={id} onClick={()=>open(id)} className="group flex min-h-[112px] items-start gap-4 border border-[#a9b38e]/25 bg-[#dce2d3]/[.055] p-4 text-left text-[#e4e6d7] transition-colors hover:border-[#c1ad78]/60 hover:bg-[#dce2d3]/[.10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d3c28f]">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-[#b7c0a8]/50 bg-[#d8ddca] text-[#344b3a]"><Icon size={20} strokeWidth={1.7}/></span><span className="min-w-0"><span className="block text-[13px] font-semibold">{APP_META[id].title}</span><span className="mt-1 block text-[10px] leading-5 text-[#aab49e]">{descriptions[id]}</span><span className="mt-2 block font-mono text-[8px] tracking-wider text-[#c1ad78]">ABRIR HERRAMIENTA →</span></span>
              </button>})}
            </div>
            <div className="mt-7 border border-[#a9b38e]/25 bg-[#dce2d3]/[.045] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[8px] tracking-[.2em] text-[#c1ad78]">ESTADO DEL EXPEDIENTE</p><h3 className="mt-1 font-serif text-xl text-[#e5e4d2]">{evidence.length} evidencias · {allTimeline.length} eventos</h3><p className="mt-1 text-[10px] text-[#aab49e]">Los datos se muestran según los registros disponibles, sin inventar comunicaciones.</p></div><button onClick={()=>open("files")} className="border border-[#b7c0a8]/45 bg-[#d8ddca] px-4 py-2.5 text-[10px] font-bold text-[#344b3a] hover:bg-[#edf0df]">VER DOCUMENTOS</button></div>
              {recordsLoading&&<p className="mt-3 text-[10px] text-[#b8c2a9]">Consultando registros del expediente…</p>}
              {recordsError&&<p role="status" className="mt-3 text-[10px] text-[#e2b49a]">No se pudo consultar la base de datos: {recordsError}</p>}
            </div>
          </section>
          <aside className="flex flex-col border border-[#aeb397]/25 bg-[#09150f]/55 p-5 text-[#dce0ce]">
            <p className="font-mono text-[8px] tracking-[.2em] text-[#c3b27d]">DATOS DE LA ESTACIÓN</p><div className="mt-4 border-b border-white/10 pb-4"><p className="font-serif text-xl">{caseTitle}</p><p className="mt-2 font-mono text-[8px] tracking-wider text-[#87957f]">ID · {passageId.slice(0,8).toUpperCase()}</p></div>
            <dl className="mt-4 space-y-4 text-[11px]"><div className="flex items-center justify-between"><dt className="text-[#9eaa94]">Documentos</dt><dd className="font-mono text-[#e4e6d7]">{String(evidence.length).padStart(2,"0")}</dd></div><div className="flex items-center justify-between"><dt className="text-[#9eaa94]">Eventos</dt><dd className="font-mono text-[#e4e6d7]">{String(allTimeline.length).padStart(2,"0")}</dd></div><div className="flex items-center justify-between"><dt className="text-[#9eaa94]">Correos</dt><dd className="font-mono text-[#e4e6d7]">{String(storedEmails.length).padStart(2,"0")}</dd></div><div className="flex items-center justify-between"><dt className="text-[#9eaa94]">Mensajes</dt><dd className="font-mono text-[#e4e6d7]">{String(storedMessages.length).padStart(2,"0")}</dd></div></dl>
            <div className="mt-auto border-t border-white/10 pt-4"><p className="font-mono text-[8px] tracking-widest text-[#c3b27d]">AYUDA RÁPIDA</p><p className="mt-2 text-[10px] leading-5 text-[#aab49e]">Doble clic en un icono para abrir. Usa la barra inferior para volver a una ventana. Pulsa ESC para minimizar la ventana activa.</p></div>
          </aside>
        </div>
      </div>
    </main>
    {windows.filter(w => !w.minimized).map((w, index) => <section key={w.id} onPointerDown={() => setActive(w.id)} className="absolute flex flex-col overflow-hidden rounded-sm border border-[#9aaa8d] bg-[#dce2d3] shadow-[0_24px_80px_rgba(0,0,0,.55)]" style={w.maximized ? { left: 8, top: 50, width: "calc(100% - 16px)", height: "calc(100% - 106px)", zIndex: active === w.id ? 40 : 20 + index } : { left: w.x, top: w.y, width: w.width, height: w.height, minWidth: "320px", minHeight: "280px", maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 96px)", zIndex: active === w.id ? 40 : 20 + index }}>
      <div onDoubleClick={() => toggleMaximize(w.id)} onPointerDown={e => drag(w.id,e)} className="flex h-10 shrink-0 cursor-move items-center justify-between bg-gradient-to-r from-[#142b20] via-[#244332] to-[#314d37] px-3 text-white touch-none">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold"><Monitor size={15}/><span className="truncate">{w.title}</span><span className="hidden truncate font-normal text-white/65 sm:inline">— {caseTitle}</span></div>
        <div className="flex shrink-0 gap-1"><button onPointerDown={e=>e.stopPropagation()} onClick={() => setWindows(c => c.map(x => x.id === w.id ? {...x,minimized:true}:x))} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label="Minimizar"><Minus size={14}/></button><button onPointerDown={e=>e.stopPropagation()} onClick={() => toggleMaximize(w.id)} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label={w.maximized?"Restaurar":"Maximizar"}><span className="text-sm leading-none">{w.maximized?"❐":"□"}</span></button><button onPointerDown={e=>e.stopPropagation()} onClick={() => close(w.id)} className="grid h-7 w-8 place-items-center hover:bg-[#8b4a3d]" aria-label="Cerrar"><X size={14}/></button></div>
      </div>
      <div className="flex h-8 shrink-0 items-center gap-5 border-b border-[#aebca4] bg-[#d5ddce] px-4 text-[11px] text-[#4d574e]"><span>Archivo</span><span>Edición</span><span>Ver</span><span>Herramientas</span><span>Ayuda</span></div>
      {w.id === "files" && <div onKeyDown={handleExplorerKeys} tabIndex={0} aria-label="Explorador de archivos. Usa flechas para seleccionar, Enter para abrir y retroceso para volver." className="flex min-h-0 flex-1 flex-col bg-[#dfe6d8] text-xs outline-none">
        <div className="flex shrink-0 items-center justify-between border-b border-[#b4c2ac] bg-[#cbd8c7] px-4 py-3"><div><p className="font-mono text-[9px] tracking-[.16em] text-[#78816f]">UNIDAD LOCAL / EXPEDIENTES</p><p className="mt-1 text-sm font-bold text-[#2c4432]">{caseTitle}</p></div><div className="text-right"><p className="font-mono text-[9px] text-[#78816f]">ÍNDICE DOCUMENTAL</p><p className="mt-1 font-serif text-xl text-[#425b45]">{String(evidence.length).padStart(2,"0")}</p></div></div>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-44 shrink-0 border-r border-[#b4c2ac] bg-[#d4dfd0] p-4 sm:block"><p className="mb-3 font-mono text-[9px] font-bold tracking-widest text-[#71806f]">UBICACIONES</p><div className="mb-2 flex items-center gap-2 rounded bg-[#c7d9c0] px-2 py-2 text-[#35483a]"><HardDrive size={14}/> Este equipo</div><div className="mb-2 flex items-center gap-2 px-2 py-2 text-[#486149]"><Folder size={14}/> Expediente actual</div><div className="mb-2 flex items-center gap-2 px-2 py-2 text-[#486149]"><Archive size={14}/> Evidencias</div><div className="mt-5 border-t border-[#b4c2ac] pt-3"><p className="mb-2 font-mono text-[8px] tracking-widest text-[#899182]">CARPETAS POR PERSONA</p><div className="space-y-1">{suspectFolders.map(name=><button key={name} type="button" onClick={()=>navigateFiles(name)} className={`flex w-full items-center gap-2 px-2 py-2 text-left text-[10px] transition ${fileFolder===name?"bg-[#c7d9c0] font-semibold text-[#2d4933]":"text-[#596d56] hover:bg-[#dce6d5]"}`}><Folder size={12}/><span className="min-w-0 flex-1 truncate">{name==="Todos"?"Todos los registros":name}</span><span className="font-mono text-[8px]">{name==="Todos"?files.length:files.filter(file=>file.item.suspect===name).length}</span></button>)}</div></div><div className="mt-7 border-t border-[#b4c2ac] pt-3"><p className="font-mono text-[8px] tracking-widest text-[#899182]">ESTADO DE ÍNDICE</p><p className="mt-2 text-[10px] leading-5 text-[#596d56]">Registros disponibles: {evidence.length}</p><p className="text-[10px] leading-5 text-[#596d56]">Sincronización: local</p></div></aside>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex border border-[#b4c2ac] bg-[#edf1e8] p-0.5" role="group" aria-label="Modo de vista"><button type="button" aria-pressed={fileView==="list"} onClick={()=>setFileView("list")} className={fileView==="list"?"bg-[#c7d9c0] px-2.5 py-1.5 text-[10px] font-bold text-[#2d4933]":"px-2.5 py-1.5 text-[10px] text-[#667564]"}>Lista</button><button type="button" aria-pressed={fileView==="grid"} onClick={()=>setFileView("grid")} className={fileView==="grid"?"bg-[#c7d9c0] px-2.5 py-1.5 text-[10px] font-bold text-[#2d4933]":"px-2.5 py-1.5 text-[10px] text-[#667564]"}>Iconos</button></div>
              <button type="button" disabled={fileHistoryIndex===0} onClick={()=>moveFileHistory(-1)} className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-xs text-[#405840] disabled:opacity-35" aria-label="Volver a carpeta anterior">←</button>
              <button type="button" disabled={fileHistoryIndex>=fileHistory.length-1} onClick={()=>moveFileHistory(1)} className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-xs text-[#405840] disabled:opacity-35" aria-label="Avanzar a carpeta siguiente">→</button>
              <div className="min-w-0 flex-1 border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 font-mono text-[10px] text-[#50644d]">EXPEDIENTE / {fileFolder==="Todos"?"TODOS LOS REGISTROS":fileFolder.toLocaleUpperCase("es")}</div>
              <label className="flex min-w-[170px] flex-1 items-center gap-2 border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-[#667066] shadow-sm"><Search size={14}/><span className="sr-only">Buscar archivos</span><input value={fileQuery} onChange={e => setFileQuery(e.target.value)} placeholder="Buscar en este expediente…" className="min-w-0 flex-1 bg-transparent text-xs text-[#26392c] outline-none placeholder:text-[#92998f]"/></label>
              <select aria-label="Ordenar documentos" value={fileSort} onChange={e=>setFileSort(e.target.value as "name"|"person"|"code")} className="border border-[#b4c2ac] bg-[#edf1e8] px-2 py-2 text-[10px] text-[#405840]"><option value="name">Orden: nombre</option><option value="person">Orden: persona</option><option value="code">Orden: código</option></select>
            </div>
            <div className="mb-3 flex items-center justify-between text-[9px] text-[#64785f]"><span>{filteredFiles.length} documentos encontrados</span><button type="button" onClick={()=>{setFileQuery("");navigateFiles("Todos");}} className="underline decoration-[#a6b49e] underline-offset-2 hover:text-[#2c4432]">Limpiar filtros</button></div>
            {fileView==="list" && <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(70px,.8fr)] border-b border-[#b4c2ac] pb-2 font-mono text-[9px] font-bold tracking-wider text-[#697468] sm:grid-cols-[minmax(0,1.5fr)_minmax(90px,.8fr)_70px]"><span>DOCUMENTO</span><span>CLASIFICACIÓN</span><span className="hidden sm:block">ESTADO</span></div>}
            <div className={["min-h-0 flex-1 overflow-auto",fileView==="grid"?"grid auto-rows-max grid-cols-2 content-start gap-2 p-1 sm:grid-cols-3 xl:grid-cols-4":"flex flex-col"].join(" ")}>{filteredFiles.map(f=><button type="button" key={f.item.code+"-"+f.item.suspect} onClick={() => setSelectedEvidence(f.item)} onDoubleClick={() => setPreviewEvidence(f.item)} onKeyDown={event => { if(event.key==="Enter"){event.preventDefault();setPreviewEvidence(f.item);} }} className={["text-left text-[#26392c] transition hover:bg-[#d0dfca] focus:bg-[#e1e8dc] focus:outline-none",fileView==="grid"?"flex min-h-[116px] flex-col items-start justify-between border border-[#c3d0bd] bg-[#e8eee3] p-3":"grid w-full grid-cols-[minmax(0,1.5fr)_minmax(70px,.8fr)] items-center border-b border-[#c3d0bd] px-2 py-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(90px,.8fr)_70px]",selectedEvidence?.code===f.item.code&&selectedEvidence?.suspect===f.item.suspect?"bg-[#c7d9c0] ring-inset ring-1 ring-[#829a78]":""].join(" ")}><span className={["flex min-w-0 items-center gap-2",fileView==="grid"?"w-full flex-col items-start gap-3":""].join(" ")}><span className={["grid shrink-0 place-items-center text-[#647d65]",fileView==="grid"?"h-10 w-10 border border-[#b9c7b2] bg-[#dce5d6]":"h-7 w-7"].join(" ")}><FileText size={fileView==="grid"?22:15}/></span><span className="min-w-0 w-full"><span className="block truncate font-semibold">{f.item.title}</span><span className="mt-0.5 block truncate font-mono text-[9px] text-[#879080]">{f.item.code} · {f.item.suspect}</span></span></span>{fileView==="list"?<><span className="truncate text-[10px] text-[#596d56]">{f.type}</span><span className="hidden font-mono text-[9px] text-[#61775e] sm:block">INDEXADO</span></>:<span className="mt-2 border border-[#c0cdb8] px-2 py-1 font-mono text-[8px] text-[#65765f]">{f.type}</span>}</button>)
            {filteredFiles.length===0 && <div className="grid h-full min-h-32 place-items-center px-5 text-center"><div><Folder size={24} className="mx-auto mb-3 text-[#8a9981]"/><p className="text-xs font-semibold text-[#4c6249]">{files.length===0?"Todavía no hay fichas documentales para este expediente.":"No encontramos documentos con esos filtros."}</p><p className="mt-2 max-w-xs text-[10px] leading-5 text-[#7d8878]">{files.length===0?"Cuando el expediente tenga evidencias registradas, aparecerán aquí. Los archivos originales solo se mostrarán si están adjuntos.":"Prueba otra búsqueda o vuelve a Todos los registros."}</p></div></div>}</div>
            <div className="mt-3 flex shrink-0 items-center justify-between border-t border-[#bdcbb7] pt-3 text-[9px] text-[#64785f]"><span>{files.length} registros · Fuente del expediente</span><span>Un clic: detalles · Enter o doble clic: abrir</span></div>
          </div>
          <aside className="hidden w-[245px] shrink-0 border-l border-[#b4c2ac] bg-[#dce5d6] p-4 lg:block">{selectedEvidence ? <><p className="font-mono text-[9px] tracking-[.16em] text-[#7b806e]">VISTA DE DETALLE</p><div className="my-4 grid h-12 w-12 place-items-center border border-[#b9c4b1] bg-[#d9e0d3] text-[#55715d]"><FileText size={22}/></div><h4 className="text-sm font-bold leading-5 text-[#2e4934]">{selectedEvidence.title}</h4><p className="mt-2 font-mono text-[9px] text-[#78816f]">{selectedEvidence.code} · {selectedEvidence.suspect}</p><div className="my-4 h-px bg-[#c8cbbd]"/><p className="font-mono text-[8px] tracking-widest text-[#617b59]">FUENTE</p><p className="mt-1 text-[10px] leading-5 text-[#5c6659]">{selectedEvidence.source}</p><p className="mt-4 font-mono text-[8px] tracking-widest text-[#617b59]">ALCANCE</p><p className="mt-1 line-clamp-5 text-[10px] leading-5 text-[#5c6659]">{selectedEvidence.scope}</p><button type="button" onClick={() => setPreviewEvidence(selectedEvidence)} className="mt-5 w-full border border-[#667e66] bg-[#354d3c] px-3 py-2.5 font-mono text-[9px] tracking-wider text-[#f0eddf] transition hover:bg-[#49634d]">ABRIR DOCUMENTO ↗</button></> : <div className="flex h-full flex-col items-center justify-center text-center"><div className="grid h-12 w-12 place-items-center rounded-full border border-[#c6cbbd] text-[#8a9683]"><FileText size={20}/></div><p className="mt-4 text-xs font-semibold text-[#486149]">Sin documento seleccionado</p><p className="mt-2 text-[10px] leading-5 text-[#858d7d]">Selecciona un registro para consultar su ficha.</p></div>}</aside>
        </div></div>}
      {w.id === "mail" && <div className="flex min-h-0 flex-1 flex-col bg-[#e0e7da] text-[#2c4432]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#b4c2ac] bg-[#e3e9dd] px-4 py-3">
          <div><p className="font-mono text-[9px] tracking-[.18em] text-[#7b846f]">CORRESPONDENCIA DIGITAL</p><h3 className="mt-1 text-sm font-bold">Correo del expediente</h3><p className="mt-1 text-[10px] text-[#7c8576]">{caseTitle} · {filteredEmails.length} de {storedEmails.length} mensajes</p></div>
          <label className="flex min-w-[170px] flex-1 items-center gap-2 border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 sm:max-w-[280px]"><Search size={13}/><span className="sr-only">Buscar correo</span><input value={mailQuery} onChange={e=>setMailQuery(e.target.value)} placeholder="Buscar asunto, remitente…" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#92998f]"/></label>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#b4c2ac] bg-[#d4dfd0] px-3 py-2">
          {([{id:"all",label:"Todos"},{id:"linked",label:"Con evidencia"},{id:"referenced",label:"Con radicado"}] as const).map(tab=><button key={tab.id} onClick={()=>setMailFilter(tab.id)} className={`border px-3 py-1.5 text-[10px] transition ${mailFilter===tab.id?"border-[#718d70] bg-[#c1d2ba] font-bold text-[#2d4933]":"border-transparent text-[#61735d] hover:bg-[#e1e8dc]"}`}>{tab.label}</button>)}
        </div>
        {recordsLoading?<p className="p-8 text-center text-xs text-[#596d56]">Consultando archivo…</p>:recordsError?<p role="alert" className="p-8 text-center text-xs text-[#8b493d]">{recordsError}</p>:<div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-full flex-col border-r border-[#b4c2ac] md:w-[48%]">
            <div className="flex items-center justify-between border-b border-[#c2d0bb] px-4 py-2 font-mono text-[8px] tracking-wider text-[#778174]"><span>MENSAJES INDEXADOS</span><span>{filteredEmails.length.toString().padStart(2,"0")}</span></div>
            <div className="min-h-0 flex-1 overflow-auto divide-y divide-[#c2d0bb]">
              {filteredEmails.map(record=><button key={record.id} onClick={()=>setSelectedRecord(record)} className={`block w-full border-l-2 px-4 py-3 text-left transition hover:bg-[#dce7d8] ${selectedRecord?.id===record.id?"border-[#526f50] bg-[#c7d9c0]":"border-transparent"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="truncate text-[10px] font-semibold text-[#304936]">{record.sender||"Remitente no registrado"}</span><span className="shrink-0 font-mono text-[8px] text-[#7b846f]">{record.occurred_at}</span></div>
                <p className="mt-1 truncate text-xs font-bold text-[#2e4934]">{record.subject||record.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#667264]">{record.body}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{record.evidence_code&&<span className="border border-[#b4c5a9] bg-[#e5ecdf] px-1.5 py-0.5 font-mono text-[8px] text-[#587052]">{record.evidence_code}</span>}{record.document_reference&&<span className="border border-[#c3c9b6] px-1.5 py-0.5 font-mono text-[8px] text-[#6b725f]">{record.document_reference}</span>}</div>
              </button>)}
              {!filteredEmails.length&&<div className="grid min-h-40 place-items-center p-6 text-center"><div><Mail size={24} className="mx-auto text-[#82917a]"/><p className="mt-3 text-xs font-semibold text-[#486149]">No hay correos en esta vista</p><p className="mt-1 text-[10px] leading-5 text-[#858d7d]">Prueba otro filtro o cambia la búsqueda. No se generan mensajes ficticios.</p></div></div>}
            </div>
          </div>
          <div className="hidden min-w-0 flex-1 flex-col bg-[#e9eee4] md:flex">
            {selectedRecord?.record_type==="email"?<div className="min-h-0 flex-1 overflow-auto p-5 lg:p-7">
              <div className="flex items-start justify-between gap-3 border-b border-[#c5d0be] pb-4"><div><p className="font-mono text-[8px] tracking-[.18em] text-[#7b846f]">LECTURA DE MENSAJE</p><h4 className="mt-2 text-base font-bold leading-6 text-[#2c4432]">{selectedRecord.subject||selectedRecord.title}</h4></div><span className="border border-[#a9bb9e] bg-[#dce6d5] px-2 py-1 font-mono text-[8px] text-[#526650]">{selectedRecord.classification||"RESERVADO"}</span></div>
              <dl className="mt-4 grid grid-cols-[58px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[10px]"><dt className="text-[#7b846f]">DE</dt><dd className="break-words text-[#344b38]">{selectedRecord.sender||"No registrado"}</dd><dt className="text-[#7b846f]">PARA</dt><dd className="break-words text-[#344b38]">{selectedRecord.recipient||"No registrado"}</dd><dt className="text-[#7b846f]">FECHA</dt><dd className="text-[#344b38]">{selectedRecord.occurred_at}</dd></dl>
              <div className="my-5 h-px bg-[#c5d0be]"/><p className="whitespace-pre-wrap text-xs leading-7 text-[#344b38]">{selectedRecord.body}</p>
              <div className="mt-6 border-t border-[#c5d0be] pt-4"><p className="font-mono text-[8px] tracking-[.16em] text-[#7b846f]">TRAZABILIDAD DOCUMENTAL</p><p className="mt-2 text-[10px] text-[#596d56]">FUENTE: {selectedRecord.source||"No especificada"}</p><p className="mt-1 font-mono text-[9px] text-[#7a806f]">{selectedRecord.document_reference||"SIN RADICADO"} · {selectedRecord.page_number||"FOLIO NO ASIGNADO"}</p>{selectedRecord.evidence_asset_id&&<button onClick={()=>setLinkedEvidencePreview(selectedRecord)} className="mt-4 border border-[#718d70] bg-[#dce6d5] px-3 py-2 font-mono text-[9px] tracking-wider text-[#526650] hover:bg-[#c7d9c0]">ABRIR DOCUMENTO ADJUNTO ↗</button>}</div>
            </div>:<div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><Mail size={30} className="text-[#87977f]"/><h4 className="mt-4 text-sm font-bold text-[#39483d]">Selecciona un correo</h4><p className="mt-2 max-w-xs text-[10px] leading-5 text-[#727c70]">El contenido completo, los participantes y las referencias aparecerán aquí.</p></div>}
          </div>
        </div>}
      </div>}
      {w.id === "messages" && <div className="flex min-h-0 flex-1 flex-col bg-[#dfe8da] text-[#29412f]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#afc2aa] bg-[#d4e0d0] px-4 py-3">
          <div><p className="font-mono text-[9px] tracking-[.18em] text-[#6d806b]">RED DE COMUNICACIONES</p><h3 className="mt-1 text-sm font-bold">Mensajería del expediente</h3><p className="mt-1 text-[10px] text-[#71816e]">{caseTitle} · {messageThreads.length} conversaciones · {filteredMessages.length} mensajes</p></div>
          <label className="flex min-w-[170px] flex-1 items-center gap-2 border border-[#afc2aa] bg-[#edf2e9] px-3 py-2 sm:max-w-[280px]"><Search size={13}/><span className="sr-only">Buscar conversaciones</span><input value={messageQuery} onChange={e=>setMessageQuery(e.target.value)} placeholder="Buscar contacto o mensaje…" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#899686]"/></label>
        </div>
        {recordsLoading?<p className="p-8 text-center text-xs text-[#596d56]">Consultando comunicaciones…</p>:recordsError?<p role="alert" className="p-8 text-center text-xs text-[#8b493d]">{recordsError}</p>:<div className="flex min-h-0 flex-1">
          <aside className="flex w-full min-h-0 flex-col border-r border-[#b5c7b0] bg-[#e5ecdf] sm:w-[42%] lg:w-[34%]">
            <div className="flex items-center justify-between border-b border-[#c4d2bf] px-4 py-2 font-mono text-[8px] tracking-wider text-[#7a8975]"><span>CONVERSACIONES</span><span>{messageThreads.length.toString().padStart(2,"0")}</span></div>
            <div className="min-h-0 flex-1 overflow-auto divide-y divide-[#c8d5c2]">
              {messageThreads.map(thread=><button key={thread.key} onClick={()=>{setSelectedConversation(thread.key);setSelectedRecord(thread.latest);}} className={`block w-full border-l-[3px] px-4 py-3 text-left transition hover:bg-[#dce8d7] ${selectedConversation===thread.key?"border-[#476d49] bg-[#cfdfc9]":"border-transparent"}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-bold text-[#304b35]">{thread.key}</span><span className="shrink-0 font-mono text-[8px] text-[#7b8975]">{thread.latest.occurred_at}</span></div>
                <p className="mt-1 truncate text-[10px] text-[#526b50]">{thread.latest.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#71806d]">{thread.latest.body}</p>
                <div className="mt-2 flex items-center justify-between"><span className="font-mono text-[8px] text-[#72866d]">{thread.records.length} {thread.records.length===1?"MENSAJE":"MENSAJES"}</span>{thread.latest.evidence_code&&<span className="border border-[#b5c8ac] bg-[#edf3e8] px-1.5 py-0.5 font-mono text-[8px] text-[#567451]">{thread.latest.evidence_code}</span>}</div>
              </button>)}
              {!messageThreads.length&&<div className="grid min-h-40 place-items-center p-6 text-center"><div><MessageSquare size={24} className="mx-auto text-[#82947d]"/><p className="mt-3 text-xs font-semibold text-[#486149]">No hay conversaciones registradas</p><p className="mt-1 text-[10px] leading-5 text-[#858d7d]">Los mensajes incorporados al expediente aparecerán aquí. No se crean conversaciones ficticias.</p></div></div>}
            </div>
          </aside>
          <section className="hidden min-w-0 flex-1 flex-col bg-[#edf1e8] sm:flex">
            {selectedConversation&&messageThreads.find(thread=>thread.key===selectedConversation)?<><div className="shrink-0 border-b border-[#c5d2bf] bg-[#e2eadd] px-5 py-4"><p className="font-mono text-[8px] tracking-[.18em] text-[#7b8a75]">HILO DE COMUNICACIÓN</p><h4 className="mt-1 text-sm font-bold text-[#304b35]">{selectedConversation}</h4><p className="mt-1 text-[9px] text-[#788875]">{messageThreads.find(thread=>thread.key===selectedConversation)?.records.length} registros · orden cronológico</p></div>
              <div className="min-h-0 flex-1 overflow-auto px-4 py-5 lg:px-6">{messageThreads.find(thread=>thread.key===selectedConversation)?.records.map((record,index)=><article key={record.id} className="mb-4 max-w-[88%]"><div className="mb-1 flex flex-wrap items-center gap-2 text-[9px] text-[#758572]"><span className="font-semibold text-[#496347]">{record.sender||"Remitente no registrado"}</span><time className="font-mono">{record.occurred_at}</time></div><div className="border border-[#c2d1bc] bg-[#e1eadc] px-4 py-3 shadow-[0_1px_2px_rgba(40,65,45,.06)]"><p className="text-[11px] font-bold text-[#304b35]">{record.title}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[#405840]">{record.body}</p>{record.source&&<p className="mt-3 border-t border-[#c6d4c0] pt-2 text-[9px] text-[#71816e]">FUENTE: {record.source}</p>}<div className="mt-2 flex flex-wrap gap-2">{record.evidence_code&&<span className="font-mono text-[8px] text-[#597853]">EVIDENCIA: {record.evidence_code}</span>}{record.document_reference&&<span className="font-mono text-[8px] text-[#7a806f]">RADICADO: {record.document_reference}</span>}</div>{record.evidence_asset_id&&<button onClick={()=>setLinkedEvidencePreview(record)} className="mt-3 border border-[#8ba384] bg-[#d7e4d1] px-3 py-1.5 font-mono text-[8px] tracking-wider text-[#496847] hover:bg-[#c8dbc0]">CONSULTAR ADJUNTO ↗</button>}</div></article>)}</div>
            </>:<div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageSquare size={30} className="text-[#87977f]"/><h4 className="mt-4 text-sm font-bold text-[#39483d]">Selecciona una conversación</h4><p className="mt-2 max-w-xs text-[10px] leading-5 text-[#727c70]">El historial, sus participantes y las referencias documentales se mostrarán en este panel.</p></div>}
          </section>
        </div>}
      </div>}
      {w.id === "timeline" && <div className="min-h-0 flex-1 overflow-auto bg-[#e0e7da] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#b4c2ac] pb-4">
          <div><p className="font-mono text-[9px] tracking-[.18em] text-[#78816f]">SECUENCIA DOCUMENTAL</p><h3 className="mt-1 text-lg font-bold text-[#2c4432]">Cronología forense</h3><p className="mt-1 text-[11px] text-[#6c7569]">{caseTitle} · {filteredTimeline.length} de {allTimeline.length} eventos</p></div>
          <div className="flex flex-wrap gap-2"><label className="flex min-w-[190px] items-center gap-2 border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-[#667066]"><Search size={13}/><span className="sr-only">Filtrar cronología</span><input value={timelineQuery} onChange={e=>setTimelineQuery(e.target.value)} placeholder="Buscar hecho, fuente…" className="min-w-0 flex-1 bg-transparent text-xs text-[#26392c] outline-none placeholder:text-[#92998f]"/></label><select value={timelinePerson} onChange={e=>setTimelinePerson(e.target.value)} className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-[10px] text-[#405840] outline-none"><option value="Todos">Todas las personas</option>{timelinePeople.filter(name=>name!=="Todos").map(name=><option key={name} value={name}>{name}</option>)}</select></div>
        </div>
        {recordsLoading&&<p className="mt-4 text-[10px] text-[#71816e]">Consultando registros adicionales del expediente…</p>}
        {filteredTimeline.length ? <div className="mt-5 space-y-6">{timelinePeople.filter(person=>person!=="Todos"&&(timelinePerson==="Todos"||timelinePerson===person)).map(person=>{
          const entries=filteredTimeline.filter(item=>item.suspect===person);
          if(!entries.length)return null;
          return <section key={person}><div className="mb-3 flex items-center gap-2"><span className="h-px flex-1 bg-[#c7cbbb]"/><h4 className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#526650]">{person}</h4><span className="h-px flex-1 bg-[#c7cbbb]"/></div><div className="relative ml-3 border-l border-[#a9b39f] pl-5">{entries.map(item=><article key={item.id} className="relative pb-5 last:pb-0"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#f1f0e7] bg-[#567b50] ring-1 ring-[#82927c]"/><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><time className="font-mono text-[11px] font-bold text-[#56764f]">{item.time}</time><span className="border border-[#b7c7af] bg-[#cbd8c7] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#566451]">{item.record}</span></div><p className="mt-1 text-xs leading-6 text-[#2c4432]">{item.event}</p><p className="mt-1 text-[10px] leading-5 text-[#7a806f]">FUENTE: {item.source}</p>{item.evidenceCode&&<button onClick={()=>{const linked=evidence.find(file=>file.code===item.evidenceCode);if(linked)setPreviewEvidence(linked);else {const record=storedTimeline.find(entry=>entry.id===item.id);if(record?.evidence_asset_id)setLinkedEvidencePreview(record);}}} className="mt-2 border border-[#718d70] px-2 py-1 font-mono text-[9px] text-[#526650] hover:bg-[#d0dfca]">ABRIR EVIDENCIA {item.evidenceCode} ↗</button>}</article>)}</div></section>;
        })}</div>:<p className="mt-8 border border-dashed border-[#a9bb9e] p-8 text-center text-xs text-[#78816f]">{allTimeline.length?"No hay eventos que coincidan con los filtros.":"Este expediente todavía no tiene una cronología digital asociada. La lectura física sigue siendo la fuente principal."}</p>}
        {recordsError&&<p role="alert" className="mt-4 text-[10px] text-[#8b493d]">{recordsError}</p>}
        <p className="mt-6 border-t border-[#bdcbb7] pt-3 text-[9px] leading-5 text-[#7a806f]">Las horas y fuentes se presentan tal como aparecen en el expediente. Una declaración no equivale a un hecho verificado.</p>
      </div>}
      {w.id === "case" && <div className="min-h-0 flex-1 overflow-auto p-6"><div className="flex items-center gap-3 border-b border-[#b4c2ac] pb-4"><ShieldAlert size={25} className="text-[#54744f]"/><div><p className="text-[10px] uppercase tracking-widest text-[#76806f]">Archivo de investigación</p><h3 className="font-bold">{caseTitle}</h3></div></div><div className="mt-4 flex items-center justify-between text-[10px] text-[#697468]"><span>{evidence.length} registros documentados</span><span>FUENTE Y ALCANCE</span></div>{evidence.length ? <div className="mt-3 space-y-3">{evidence.map(item=><article key={item.suspect+item.code} className="border border-[#b4c2ac] bg-[#edf1e8] p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-bold text-[#55715d]">{item.code} · {item.suspect}</span><span className="text-[9px] uppercase tracking-wider text-[#617b59]">Ficha</span></div><h4 className="mt-2 text-sm font-bold text-[#26392c]">{item.title}</h4><p className="mt-2 text-xs leading-6 text-[#48544a]">{item.detail}</p><p className="mt-3 text-[10px] text-[#64745f]">FUENTE: {item.source}</p><p className="mt-1 border-l-2 border-[#819a72] bg-[#dce6d5] px-3 py-2 text-[10px] leading-5 text-[#6d6657]">ALCANCE: {item.scope}</p></article>)}</div> : <p className="mt-6 border border-[#a9bb9e] bg-[#dce6d5] p-4 text-xs leading-6 text-[#5c574b]">Este libro aún no tiene fichas digitales de evidencia asociadas. El contenido de la lectura física sigue siendo la fuente principal.</p>}</div>}
    </section>)}
    {linkedEvidencePreview && <div className="absolute inset-0 z-[75] grid place-items-center overflow-auto bg-[#020704]/80 p-4 backdrop-blur-md"><article className="relative my-auto max-h-[92%] w-full max-w-[860px] overflow-auto border border-[#b7a276] bg-[#e8e3d3] text-[#30382e] shadow-[0_30px_110px_rgba(0,0,0,.8)]"><div className="pointer-events-none absolute inset-0 opacity-[.13]" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0px,transparent 27px,rgba(95,83,58,.18) 28px),radial-gradient(#8c8064 .55px,transparent .7px)",backgroundSize:"100% 28px,5px 5px"}}/><div className="pointer-events-none absolute right-8 top-24 rotate-[14deg] border-[5px] border-[#873b32]/45 px-4 py-2 font-mono text-2xl font-black tracking-[.18em] text-[#873b32]/45">{linkedEvidencePreview.seal||"CONFIDENCIAL"}</div><button type="button" onClick={()=>setLinkedEvidencePreview(null)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-[#91846b] bg-[#f1eddf]/90 hover:bg-white" aria-label="Cerrar documento"><X size={16}/></button><header className="relative border-b-2 border-[#847454] px-7 pb-5 pt-7 sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] tracking-[.17em] text-[#746b56]"><span>PEAK SYSTEMS · ARCHIVE DIVISION</span><span>{linkedEvidencePreview.classification||"RESERVADO"}</span></div><div className="mt-6 flex items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-[.2em] text-[#8b7652]">DOCUMENTO DE INVESTIGACIÓN</p><h2 className="mt-2 max-w-[600px] font-serif text-2xl font-bold sm:text-3xl">{linkedEvidencePreview.evidence_title||linkedEvidencePreview.title}</h2><p className="mt-2 font-mono text-[10px] text-[#766a52]">{linkedEvidencePreview.document_reference||linkedEvidencePreview.evidence_code||"SIN RADICADO"} · {linkedEvidencePreview.page_number||"FOLIO NO ASIGNADO"}</p></div><span className="hidden border border-[#9d8e6e] px-3 py-2 font-mono text-[9px] tracking-widest text-[#806d4d] sm:inline">COPIA DE CONSULTA</span></div></header><div className="relative grid gap-6 px-7 py-7 sm:grid-cols-[minmax(0,1fr)_190px] sm:px-10"><div className="min-w-0"><p className="font-mono text-[9px] font-bold tracking-[.2em] text-[#897653]">DESCRIPCIÓN DEL REGISTRO</p><p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-8">{linkedEvidencePreview.evidence_description||linkedEvidencePreview.body}</p>{linkedEvidencePreview.evidence_url&&<figure className="mt-6 border border-[#b9ad92] bg-[#d8d2c1] p-2"><img src={linkedEvidencePreview.evidence_url} alt={linkedEvidencePreview.evidence_title||"Fotografía de evidencia"} className="max-h-[46vh] w-full object-contain"/><figcaption className="mt-2 font-mono text-[8px] tracking-wider text-[#776c55]">IMAGEN ASOCIADA AL REGISTRO · NO ALTERAR EL ORIGINAL</figcaption></figure>}<div className="mt-7 border-t border-[#bdb39c] pt-4"><p className="font-mono text-[9px] font-bold tracking-[.18em] text-[#897653]">PROCEDENCIA</p><p className="mt-2 text-xs leading-6">{linkedEvidencePreview.source||"Fuente no consignada"}</p><p className="mt-3 text-[10px] leading-5 text-[#776e5b]">La ficha es una representación digital del registro incorporado al expediente. No certifica por sí sola la autenticidad material del documento original.</p></div></div><aside className="space-y-4 border-t border-[#bdb39c] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><div><p className="font-mono text-[8px] tracking-widest text-[#897653]">CÓDIGO</p><p className="mt-1 font-mono text-sm font-bold">{linkedEvidencePreview.evidence_code||"S/C"}</p></div><div><p className="font-mono text-[8px] tracking-widest text-[#897653]">PERSONA RELACIONADA</p><p className="mt-1 text-xs">{linkedEvidencePreview.suspect_name||"No especificada"}</p></div><div><p className="font-mono text-[8px] tracking-widest text-[#897653]">NOTA DE FIRMA</p><p className="mt-1 text-[10px] leading-5">{linkedEvidencePreview.signature_note||"No se ha consignado una nota de autenticación."}</p></div><div className="border border-[#b9ad92] bg-[#e1dac8] p-3"><p className="font-mono text-[8px] tracking-widest text-[#897653]">ESTADO DE CONSULTA</p><p className="mt-2 text-[10px] leading-5">Copia digital de consulta. Contrastar con la fuente primaria.</p></div></aside></div><footer className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#bdb39c] px-7 py-4 font-mono text-[8px] tracking-wider text-[#766c56] sm:px-10"><span>PEAKSCORE · EXPEDIENTE {caseTitle}</span><span>DOCUMENTO DE USO INTERNO · NO DISTRIBUIR</span></footer></article></div>}
    {previewEvidence && <div className="absolute inset-0 z-[70] grid place-items-center overflow-auto bg-[#020704]/80 p-4 backdrop-blur-md"><article className="relative my-auto max-h-[92%] w-full max-w-[860px] overflow-auto border border-[#b7a276] bg-[#e8e3d3] text-[#30382e] shadow-[0_30px_110px_rgba(0,0,0,.8)]"><div className="pointer-events-none absolute inset-0 opacity-[.13]" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0px,transparent 27px,rgba(95,83,58,.18) 28px),radial-gradient(#8c8064 .55px,transparent .7px)",backgroundSize:"100% 28px,5px 5px"}}/><div className="pointer-events-none absolute right-8 top-24 rotate-[14deg] border-[5px] border-[#873b32]/45 px-4 py-2 font-mono text-2xl font-black tracking-[.18em] text-[#873b32]/45">CONFIDENCIAL</div><button type="button" onClick={() => setPreviewEvidence(null)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-[#91846b] bg-[#f1eddf]/90 hover:bg-white" aria-label="Cerrar documento"><X size={16}/></button><header className="relative border-b-2 border-[#847454] px-7 pb-5 pt-7 sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] tracking-[.17em] text-[#746b56]"><span>PEAK SYSTEMS · ARCHIVE DIVISION</span><span>USO INTERNO</span></div><div className="mt-6"><p className="font-mono text-[9px] tracking-[.2em] text-[#8b7652]">DOCUMENTO DE INVESTIGACIÓN</p><h2 className="mt-2 max-w-[600px] font-serif text-2xl font-bold sm:text-3xl">{previewEvidence.title}</h2><p className="mt-2 font-mono text-[10px] text-[#766a52]">{previewEvidence.code} · {previewEvidence.suspect}</p></div></header><div className="relative grid gap-6 px-7 py-7 sm:grid-cols-[minmax(0,1fr)_190px] sm:px-10"><div><p className="font-mono text-[9px] font-bold tracking-[.2em] text-[#897653]">REGISTRO DOCUMENTAL</p><p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-8">{previewEvidence.detail}</p><div className="mt-7 border-t border-[#bdb39c] pt-4"><p className="font-mono text-[9px] font-bold tracking-[.18em] text-[#897653]">PROCEDENCIA</p><p className="mt-2 text-xs leading-6">{previewEvidence.source}</p><p className="mt-3 text-[10px] leading-5 text-[#776e5b]">{previewEvidence.scope}</p></div></div><aside className="space-y-4 border-t border-[#bdb39c] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><div><p className="font-mono text-[8px] tracking-widest text-[#897653]">CÓDIGO</p><p className="mt-1 font-mono text-sm font-bold">{previewEvidence.code}</p></div><div><p className="font-mono text-[8px] tracking-widest text-[#897653]">PERSONA RELACIONADA</p><p className="mt-1 text-xs">{previewEvidence.suspect}</p></div><div className="border border-[#b9ad92] bg-[#e1dac8] p-3"><p className="font-mono text-[8px] tracking-widest text-[#897653]">ESTADO DE CONSULTA</p><p className="mt-2 text-[10px] leading-5">Ficha digital derivada del expediente. Contrastar con la fuente primaria.</p></div></aside></div><footer className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#bdb39c] px-7 py-4 font-mono text-[8px] tracking-wider text-[#766c56] sm:px-10"><span>PEAKSCORE · EXPEDIENTE {caseTitle}</span><span>DOCUMENTO DE USO INTERNO · NO DISTRIBUIR</span></footer></article></div>}
    <footer className="absolute bottom-0 left-0 right-0 z-50 flex h-[48px] items-center gap-2 border-t border-[#f3f1df] bg-[#d4d7c8] px-2 text-[#29372d] shadow-[0_-3px_12px_rgba(0,0,0,.25)]">
      <button onClick={()=>setStartMenuOpen(v=>!v)} className="flex h-8 shrink-0 items-center gap-2 border border-[#7e8878] bg-gradient-to-b from-[#f1f0e4] to-[#c2c9b9] px-3 text-[10px] font-bold shadow-[inset_1px_1px_0_white,1px_1px_0_#8c9484] hover:brightness-105"><Monitor size={15}/> INICIO</button>
      <div className="mx-1 h-7 w-px bg-[#9ca392]"/>
      {windows.map(w=><button key={w.id} aria-pressed={active===w.id&&!w.minimized} onClick={()=>{const isCurrent=active===w.id&&!w.minimized;if(isCurrent){setWindows(c=>c.map(x=>x.id===w.id?{...x,minimized:true}:x));setActive(null);}else{setWindows(c=>c.map(x=>x.id===w.id?{...x,minimized:false}:x));setActive(w.id);}}} className={`flex h-8 max-w-48 min-w-0 items-center gap-2 border px-3 text-[10px] ${active===w.id&&!w.minimized?"border-[#7c8775] bg-[#b9c2b1] shadow-[inset_1px_1px_2px_rgba(0,0,0,.18)]":"border-[#a8ae9e] bg-[#e1e2d7] hover:bg-[#cbd1c3]"}`}><span className="truncate">{w.title}</span></button>)}
      <div className="ml-auto flex h-8 items-center gap-3 border border-[#a8ae9e] bg-[#e3e4d9] px-3 font-mono text-[9px]"><span className="hidden text-[#687461] sm:inline">ES-COL</span><span className="font-bold">{clock}</span></div>
    </footer>
    {startMenuOpen&&<div className="absolute bottom-[54px] left-2 z-[90] w-[min(340px,calc(100vw-16px))] border border-[#78866f] bg-[#e0e4d6] text-[#2d3d30] shadow-[0_18px_55px_rgba(0,0,0,.55)]">
      <div className="bg-[#193326] px-4 py-3 text-[#e4e6d7]"><p className="font-mono text-[8px] tracking-[.2em] text-[#c1ad78]">PEAK FIELDSTATION</p><p className="mt-1 font-serif text-lg">{caseTitle}</p></div>
      <div className="grid grid-cols-2 gap-1 p-2">{(["files","mail","messages","timeline","case"] as AppId[]).map(id=>{const Icon=APP_META[id].icon;return <button key={id} onClick={()=>{setStartMenuOpen(false);open(id)}} className="flex items-center gap-2 px-3 py-3 text-left text-[10px] hover:bg-[#cbd8c4]"><Icon size={16}/><span>{APP_META[id].title}</span></button>})}</div>
      <div className="flex items-center justify-between border-t border-[#b6c0ad] px-3 py-2"><button onClick={()=>{setStartMenuOpen(false);onClose()}} className="flex items-center gap-2 px-2 py-1.5 text-[10px] hover:bg-[#cbd8c4]"><Power size={14}/> Volver al juego</button><span className="font-mono text-[8px] text-[#77816f]">ESC · CERRAR MENÚ</span></div>
    </div>}
    <div className="pointer-events-none absolute inset-0 z-[80] opacity-[.035]" style={{backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,.9) 0px,rgba(0,0,0,.9) 1px,transparent 2px,transparent 4px)"}}/>
  </div>;
}

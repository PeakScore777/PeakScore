"use client";

import { useMemo, useState } from "react";
import { Archive, FileText, Folder, HardDrive, Mail, MessageSquare, Minus, Monitor, Search, ShieldAlert, X } from "lucide-react";

type AppId = "files" | "mail" | "messages" | "case";
type WindowState = { id: AppId; title: string; x: number; y: number; minimized: boolean };

const APP_META: Record<AppId, { title: string; icon: typeof Folder }> = {
  files: { title: "Explorador", icon: Folder },
  mail: { title: "Correo", icon: Mail },
  messages: { title: "Mensajería", icon: MessageSquare },
  case: { title: "Centro de seguridad", icon: ShieldAlert },
};

export default function PeakOSDesktop({ caseTitle, onClose }: { caseTitle: string; onClose: () => void }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [active, setActive] = useState<AppId | null>(null);
  const [selectedMail, setSelectedMail] = useState(0);
  const [clock] = useState(() => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  const messages = useMemo(() => [
    { from: "Coordinación de archivo", time: "08:42", subject: "Acceso al expediente", body: `Se habilitó el acceso digital al caso «${caseTitle}». Consulta los documentos disponibles y contrasta cada dato con el libro físico. No compartas credenciales ni archivos fuera del sistema.` },
    { from: "Mesa de vigilancia", time: "09:16", subject: "Registro pendiente de revisión", body: "Hay un registro pendiente de cotejo. La hora anotada no demuestra por sí sola quién estuvo en el lugar. Revisa la fuente original antes de sacar conclusiones." },
  ], [caseTitle]);
  const files = useMemo(() => [
    { name: "00_LEEME_PRIMERO.txt", type: "Documento de sistema", size: "2 KB" },
    { name: "Registro_de_novedades.pdf", type: "Documento", size: "418 KB" },
    { name: "Correspondencia", type: "Carpeta", size: "—" },
    { name: "Evidencias_en_revision", type: "Carpeta", size: "—" },
  ], []);
  const open = (id: AppId) => {
    setWindows(current => {
      const found = current.find(w => w.id === id);
      if (found) return current.map(w => w.id === id ? { ...w, minimized: false } : w);
      return [...current, { id, title: APP_META[id].title, x: 110 + current.length * 34, y: 58 + current.length * 28, minimized: false }];
    });
    setActive(id);
  };
  const close = (id: AppId) => {
    setWindows(current => current.filter(w => w.id !== id));
    setActive(current => current === id ? null : current);
  };
  const drag = (id: AppId, event: React.PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget.parentElement;
    if (!el) return;
    const startX = event.clientX, startY = event.clientY;
    const rect = el.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      el.style.left = `${Math.max(0, Math.min(window.innerWidth - 280, rect.left + e.clientX - startX))}px`;
      el.style.top = `${Math.max(36, Math.min(window.innerHeight - 100, rect.top + e.clientY - startY))}px`;
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    setActive(id);
  };

  return <div className="fixed inset-0 z-[160] overflow-hidden bg-[#101b19] text-[#18221f]" role="dialog" aria-modal="true" aria-label="PEAK OS">
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 22% 15%,rgba(109,145,119,.42),transparent 38%),linear-gradient(135deg,#253c34,#142720 58%,#0c1715)" }} />
    <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
    <div className="absolute left-5 top-5 flex flex-col gap-5">
      {(["files","mail","messages","case"] as AppId[]).map(id => { const Icon = APP_META[id].icon; return <button key={id} onDoubleClick={() => open(id)} onClick={() => setActive(id)} className="group flex w-[92px] flex-col items-center gap-2 rounded-lg p-2 text-center text-[11px] font-semibold text-[#edf2df] hover:bg-white/10" title="Doble clic para abrir"><span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-[#d6ddc9] text-[#263a31] shadow-[0_5px_12px_rgba(0,0,0,.3)]"><Icon size={24}/></span><span className="drop-shadow">{APP_META[id].title}</span></button>; })}
    </div>
    <div className="absolute right-6 top-5 rounded border border-[#d8c8a2]/35 bg-black/25 px-4 py-3 text-right text-[#e9e1cb] backdrop-blur-sm">
      <div className="font-mono text-[10px] tracking-[.22em] text-[#c7b88f]">PEAK SYSTEMS · SECURE TERMINAL</div>
      <div className="mt-1 text-sm font-semibold">Estación de investigación</div>
      <div className="mt-1 text-[10px] text-[#c8d0bd]">CASO ACTIVO / {caseTitle.toUpperCase()}</div>
    </div>
    {windows.filter(w => !w.minimized).map(w => <section key={w.id} onPointerDown={() => setActive(w.id)} className="absolute flex h-[min(590px,calc(100%-112px))] w-[min(790px,calc(100%-36px))] flex-col overflow-hidden rounded-md border border-[#dce2d2] bg-[#e8eadf] shadow-[0_24px_80px_rgba(0,0,0,.55)]" style={{ left: w.x, top: w.y, zIndex: active === w.id ? 30 : 20 }}>
      <div onPointerDown={e => drag(w.id,e)} className="flex h-10 shrink-0 cursor-move items-center justify-between bg-gradient-to-r from-[#263e35] to-[#486653] px-3 text-white">
        <div className="flex items-center gap-2 text-xs font-bold"><Monitor size={15}/>{w.title} <span className="font-normal text-white/65">— {caseTitle}</span></div>
        <div className="flex gap-1"><button onClick={() => setWindows(c => c.map(x => x.id === w.id ? {...x,minimized:true}:x))} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label="Minimizar"><Minus size={14}/></button><button onClick={() => close(w.id)} className="grid h-7 w-8 place-items-center hover:bg-red-500" aria-label="Cerrar"><X size={14}/></button></div>
      </div>
      <div className="flex h-8 shrink-0 items-center gap-5 border-b border-[#c8cbbd] bg-[#f4f4ed] px-4 text-[11px] text-[#4d574e]"><span>Archivo</span><span>Edición</span><span>Ver</span><span>Herramientas</span><span>Ayuda</span></div>
      {w.id === "files" && <div className="flex min-h-0 flex-1 text-xs"><aside className="w-48 shrink-0 border-r border-[#c8cbbd] bg-[#dfe4d8] p-4"><p className="mb-3 font-bold uppercase tracking-wider text-[9px] text-[#697468]">Ubicaciones</p><p className="mb-3 flex items-center gap-2"><HardDrive size={14}/> Este equipo</p><p className="mb-3 flex items-center gap-2"><Folder size={14}/> Expediente actual</p><p className="flex items-center gap-2"><Archive size={14}/> Archivo histórico</p></aside><div className="min-w-0 flex-1 p-5"><div className="mb-4 flex items-center gap-2 border border-[#c8cbbd] bg-white px-3 py-2 text-[#667066]"><Search size={14}/> Expedientes / {caseTitle}</div><div className="grid grid-cols-[1fr_1fr_90px] border-b border-[#c8cbbd] pb-2 text-[10px] font-bold text-[#697468]"><span>Nombre</span><span>Tipo</span><span>Tamaño</span></div>{files.map(f=><div key={f.name} className="grid grid-cols-[1fr_1fr_90px] items-center border-b border-[#d7d9cf] py-3 text-[#303b34]"><span className="flex items-center gap-2"><FileText size={15} className="text-[#647d65]"/>{f.name}</span><span>{f.type}</span><span>{f.size}</span></div>)}<p className="mt-5 text-[10px] text-[#7b8378]">Los elementos marcados como pendientes requieren cotejo con las fuentes del libro. No se han añadido pruebas externas al expediente.</p></div></div>}
      {w.id === "mail" && <div className="flex min-h-0 flex-1"><aside className="w-[42%] shrink-0 border-r border-[#c8cbbd] bg-[#f4f4ed]">{messages.map((m,i)=><button key={m.subject} onClick={()=>setSelectedMail(i)} className={`block w-full border-b border-[#d6d8ce] p-4 text-left ${selectedMail===i?"bg-[#dce5d7]":"hover:bg-[#e9ede4]"}`}><div className="text-[10px] font-bold text-[#3e5a49]">{m.from}</div><div className="mt-1 text-xs font-semibold">{m.subject}</div><div className="mt-1 text-[10px] text-[#737c71]">{m.time}</div></button>)}</aside><article className="min-w-0 flex-1 p-6"><div className="text-[10px] uppercase tracking-widest text-[#75806f]">Bandeja de entrada · {messages.length} mensajes</div><h3 className="mt-3 text-lg font-bold">{messages[selectedMail].subject}</h3><p className="mt-1 text-[11px] text-[#748071]">De: {messages[selectedMail].from} · {messages[selectedMail].time}</p><div className="my-5 h-px bg-[#c8cbbd]"/><p className="max-w-xl whitespace-pre-line text-sm leading-7 text-[#344139]">{messages[selectedMail].body}</p><div className="mt-8 border-l-2 border-[#9b8356] bg-[#dfe4d8] p-3 text-[11px] leading-5 text-[#596456]">PROTOCOLO: contrasta los mensajes con el material del expediente. Una notificación no constituye prueba por sí sola.</div></article></div>}
      {w.id === "messages" && <div className="flex min-h-0 flex-1 flex-col bg-[#f3f4ed]"><div className="border-b border-[#c8cbbd] p-4 text-xs font-bold">Canal interno · Archivo central</div><div className="flex-1 space-y-4 overflow-auto p-5 text-xs"><div className="max-w-[78%] rounded-lg border border-[#d2d6c9] bg-white p-3"><p className="mb-1 text-[10px] font-bold text-[#55715d]">MESA DE ARCHIVO · 09:16</p>Recuerda verificar la procedencia de cada documento. Si una hora no coincide, registra la discrepancia; no la corrijas por intuición.</div><div className="ml-auto max-w-[78%] rounded-lg bg-[#dce8d8] p-3"><p className="mb-1 text-[10px] font-bold text-[#55715d]">TÚ · AHORA</p>Estoy revisando el expediente {caseTitle}.</div><div className="max-w-[78%] rounded-lg border border-[#d2d6c9] bg-white p-3"><p className="mb-1 text-[10px] font-bold text-[#55715d]">MESA DE ARCHIVO · 09:18</p>De acuerdo. Deja constancia de qué fuente respalda cada hallazgo y qué aspecto sigue sin verificarse.</div></div><div className="border-t border-[#c8cbbd] p-3"><div className="border border-[#c8cbbd] bg-white px-3 py-3 text-[11px] text-[#8a9187]">Canal de consulta de demostración · mensajería no conectada</div></div></div>}
      {w.id === "case" && <div className="flex min-h-0 flex-1 flex-col p-6"><div className="flex items-center gap-3 border-b border-[#c8cbbd] pb-4"><ShieldAlert size={25} className="text-[#8b6542]"/><div><p className="text-[10px] uppercase tracking-widest text-[#76806f]">Terminal protegida</p><h3 className="font-bold">{caseTitle}</h3></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="border border-[#c8cbbd] bg-white p-4"><p className="text-[9px] uppercase tracking-widest text-[#778174]">Estado del sistema</p><p className="mt-2 text-sm font-bold text-[#45634c]">EN LÍNEA</p></div><div className="border border-[#c8cbbd] bg-white p-4"><p className="text-[9px] uppercase tracking-widest text-[#778174]">Nivel de acceso</p><p className="mt-2 text-sm font-bold">INVESTIGADOR</p></div></div><div className="mt-5 border border-[#d2c6ad] bg-[#f3eddf] p-4 text-xs leading-6 text-[#5c574b]">Este terminal es una interfaz de investigación del juego. Los documentos y mensajes se deben completar con datos verificados del expediente. Los registros de demostración están identificados como tales.</div></div>}
    </section>)}
    <div className="absolute bottom-0 left-0 right-0 z-50 flex h-12 items-center gap-2 border-t border-white/20 bg-[#d9dfd0] px-2 shadow-[0_-4px_18px_rgba(0,0,0,.2)]"><button onClick={onClose} className="flex h-9 items-center gap-2 rounded border border-[#9da995] bg-gradient-to-b from-[#f6f7ef] to-[#c8d2c2] px-3 text-xs font-black text-[#304136] shadow-sm"><Monitor size={16}/> PEAK</button><div className="mx-1 h-7 w-px bg-[#aab3a4]"/>{windows.map(w=><button key={w.id} onClick={()=>{setWindows(c=>c.map(x=>x.id===w.id?{...x,minimized:!x.minimized}:x));setActive(w.id)}} className={`flex h-8 max-w-44 items-center gap-2 truncate border px-3 text-[11px] ${active===w.id&&!w.minimized?"border-[#83917e] bg-[#c3cdbd]":"border-transparent bg-[#e8eadf]"}`}><span className="truncate">{w.title}</span></button>)}<div className="ml-auto flex items-center gap-3 px-3 text-[10px] text-[#344238]"><span>ES · COL</span><span className="font-mono text-xs font-bold">{clock}</span><button onClick={onClose} aria-label="Cerrar PEAK OS" className="rounded border border-[#8e9b88] px-2 py-1 hover:bg-white">SALIR</button></div></div>
    <div className="absolute bottom-16 left-5 text-[9px] font-mono tracking-[.2em] text-white/40">PEAK OS 1.0 · ENTORNO DE INVESTIGACIÓN</div>
  </div>;
}

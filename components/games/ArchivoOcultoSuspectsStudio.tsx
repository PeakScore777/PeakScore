"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImagePlus, Save, Trash2, UserPlus, RefreshCw } from "lucide-react";

type Reading={id:string;title:string};
type Suspect={id:string;passage_id:string;name:string;role:string;description:string;motive:string;alibi:string;image_url:string|null;display_order:number};
const input="w-full border border-[#8b7048] bg-[#f4e4c5] px-3 py-2.5 text-sm text-[#28190e] outline-none focus:border-[#8e241b]";
const label="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-[#70502d]";
const tab="border border-[#73512d] bg-[#21150d] px-4 py-2 font-serif text-xs text-[#e8d4b3] hover:bg-[#382313]";

export default function ArchivoOcultoSuspectsStudio({initialPassageId=""}:{initialPassageId?:string}) {
 const [readings,setReadings]=useState<Reading[]>([]),[suspects,setSuspects]=useState<Suspect[]>([]);
 const [passageId,setPassageId]=useState(initialPassageId),[selectedId,setSelectedId]=useState<string|null>(null);
 const [draft,setDraft]=useState({name:"",role:"",description:"",motive:"",alibi:"",display_order:1});
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const selected=useMemo(()=>suspects.find(s=>s.id===selectedId)??null,[suspects,selectedId]);
 const filtered=useMemo(()=>suspects.filter(s=>!passageId||s.passage_id===passageId),[suspects,passageId]);
 const load=useCallback(async()=>{
  const r=await fetch("/api/admin/archivo-oculto/suspects",{credentials:"same-origin",cache:"no-store"}),d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error??"No se pudieron cargar los sospechosos.");
  setReadings(d.readings??[]);setSuspects(d.suspects??[]);
  if(!passageId&&d.readings?.length)setPassageId(d.readings[0].id);
 },[passageId]);
 useEffect(()=>{let live=true;void load().catch(e=>{if(live)setError(e instanceof Error?e.message:"Error de carga.");}).finally(()=>{if(live)setLoading(false);});return()=>{live=false};},[load]);
 useEffect(()=>()=>{if(preview.startsWith("blob:"))URL.revokeObjectURL(preview)},[preview]);
 const reset=()=>{setSelectedId(null);setDraft({name:"",role:"",description:"",motive:"",alibi:"",display_order:filtered.length+1});setFile(null);setPreview("");setError("");setNotice("");};
 const choose=(s:Suspect)=>{setSelectedId(s.id);setPassageId(s.passage_id);setDraft({name:s.name,role:s.role,description:s.description,motive:s.motive,alibi:s.alibi,display_order:s.display_order});setFile(null);setPreview("");setError("");setNotice("");};
 const change=(k:keyof typeof draft,v:string|number)=>setDraft(d=>({...d,[k]:v}));
 const save=async()=>{
  if(!passageId||draft.name.trim().length<2||draft.role.trim().length<2){setError("Selecciona una lectura e indica nombre y profesión.");return;}
  setSaving(true);setError("");setNotice("");
  try{
   let imageUrl:string|undefined;
   if(file){const form=new FormData();form.set("file",file);const up=await fetch("/api/admin/game-content/upload",{method:"POST",body:form,credentials:"same-origin"});const ud=await up.json();if(!up.ok)throw new Error(ud.error??"No se pudo subir el retrato.");imageUrl=ud.url;}
   const payload={...draft,passageId,...(imageUrl?{imageUrl}:{})};
   const r=await fetch("/api/admin/archivo-oculto/suspects",{method:selectedId?"PATCH":"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(selectedId?{...payload,id:selectedId}:payload)});
   const d=await r.json();if(!r.ok)throw new Error(d.error??"No se pudo guardar la ficha.");
   setSelectedId(d.suspect.id);setFile(null);setPreview("");setNotice("Ficha guardada correctamente.");await load();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}finally{setSaving(false);}
 };
 const remove=async()=>{if(!selectedId||!window.confirm("¿Eliminar esta ficha?"))return;setSaving(true);try{const r=await fetch("/api/admin/archivo-oculto/suspects",{method:"DELETE",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedId})});const d=await r.json();if(!r.ok)throw new Error(d.error??"No se pudo eliminar.");reset();await load();setNotice("Ficha eliminada.");}catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar.");}finally{setSaving(false);}};
 const image=preview||selected?.image_url||"";
 return <main className="min-h-screen bg-[#160f09] px-4 py-7 text-[#f1dfbd] sm:px-8"><div className="mx-auto max-w-[1500px]">
  <header className="mb-5 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Link href="/dashboard/admin/games/archivo-oculto/evidencias" className="grid h-9 w-9 place-items-center border border-[#76532f] bg-[#27170e] text-[#e7c28b]"><ArrowLeft className="h-4 w-4"/></Link><div className="border-2 border-[#b58a50] bg-[#d7bc8c] px-3 py-1.5 text-[#27170f]"><p className="font-serif text-[9px] font-black uppercase tracking-[.2em]">El Archivo</p><p className="font-serif text-lg font-black leading-none">OCULTO</p></div></div>
  <nav aria-label="Secciones del archivo" className="flex flex-wrap gap-2"><Link href="/dashboard/admin/games" className={tab}>Expediente</Link><Link href="/dashboard/admin/games/archivo-oculto/evidencias" className={tab}>Evidencias</Link><span aria-current="page" className="border border-[#c2382c] bg-gradient-to-b from-[#9f1e1c] to-[#5b100f] px-4 py-2 font-serif text-xs font-bold text-[#fff0d6]">Sospechosos</span><Link href="/dashboard/admin/games" className={tab}>Lecturas</Link></nav></header>
  <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#b8905c]">PeakScore · Administración · Archivo Oculto</p><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="font-serif text-3xl font-black">Registro de sospechosos</h1><button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 border border-[#9b7546] px-3 py-2 text-xs"><RefreshCw className="h-3.5 w-3.5"/>Actualizar</button></div>
  <section className="mb-5 border border-[#8b693e] bg-[#2a1c11] p-4"><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-[#d0ad76]">Expediente / lectura</label><select className={input} value={passageId} onChange={e=>{setPassageId(e.target.value);reset();}}><option value="">Selecciona una lectura</option>{readings.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select><p className="mt-2 text-xs text-[#c6ad86]">Cada ficha pertenece a una lectura publicada de Archivo Oculto.</p></section>
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)]">
   <section className="border border-[#8b693e] bg-[#24180f] p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-serif text-xl font-bold">Personas vinculadas</h2><p className="text-xs text-[#bca27a]">{filtered.length} perfiles registrados</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 border border-[#a7804e] bg-[#5a2a19] px-3 py-2 text-xs font-bold"><UserPlus className="h-4 w-4"/>Nuevo sospechoso</button></div>
    {loading?<p className="py-10 text-center text-sm text-[#bca27a]">Cargando registros...</p>:filtered.length?<div className="grid gap-3 sm:grid-cols-2">{filtered.map(s=><button key={s.id} type="button" onClick={()=>choose(s)} className={"flex gap-3 border p-3 text-left transition "+(selectedId===s.id?"border-[#d3a765] bg-[#49301c]":"border-[#715333] bg-[#17110c] hover:bg-[#382516]")}><div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[#392817]">{s.image_url?<Image src={s.image_url} alt={s.name} fill unoptimized className="object-cover"/>:<div className="grid h-full place-items-center text-[#b99763]"><ImagePlus/></div>}</div><span><strong className="block font-serif text-base">{s.name}</strong><span className="block text-xs text-[#d1b58a]">{s.role}</span><span className="mt-2 block text-[10px] text-[#a58b67]">{s.image_url?"Retrato vinculado":"Sin retrato"}</span></span></button>)}</div>:<p className="border border-dashed border-[#705333] py-12 text-center text-sm text-[#bca27a]">No hay sospechosos en esta lectura. Crea la primera ficha.</p>}</section>
   <section className="border border-[#9b7546] bg-[#ead5ae] p-5 text-[#2b1b0e]"><h2 className="mb-4 font-serif text-2xl font-black">{selectedId?"Editar ficha":"Nueva ficha de sospechoso"}</h2>
    <label className={label}>Retrato (JPG, PNG o WebP · máximo 10 MB)</label><label className="mb-4 flex cursor-pointer items-center gap-4 border border-[#a88b60] bg-[#f5e7cc] p-3"><div className="relative grid h-28 w-24 shrink-0 place-items-center overflow-hidden bg-[#d4bd95] text-[#76542e]">{image?<Image src={image} alt="Vista previa" fill unoptimized className="object-cover"/>:<ImagePlus className="h-8 w-8"/>}</div><span><strong className="block text-sm">Subir / reemplazar retrato</strong><span className="text-xs text-[#775d3a]">Selecciona la fotografía del personaje.</span></span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0]??null;if(f.size>10*1024*1024){setError("La imagen supera 10 MB.");return;}setFile(f);setPreview(f?URL.createObjectURL(f):"");}}/></label>
    <label className={label}>Nombre completo</label><input className={input} maxLength={100} value={draft.name} onChange={e=>change("name",e.target.value)} placeholder="Ej. Inés Salcedo"/>
    <label className={label+" mt-3"}>Profesión / cargo</label><input className={input} maxLength={140} value={draft.role} onChange={e=>change("role",e.target.value)} placeholder="Ej. Archivista de Planeación"/>
    <label className={label+" mt-3"}>Descripción</label><textarea className={input} rows={3} maxLength={1500} value={draft.description} onChange={e=>change("description",e.target.value)} placeholder="Apariencia, función y relación con el expediente..."/>
    <label className={label+" mt-3"}>Motivo</label><textarea className={input} rows={3} maxLength={1500} value={draft.motive} onChange={e=>change("motive",e.target.value)} placeholder="¿Qué podría motivarle?"/>
    <label className={label+" mt-3"}>Coartada</label><textarea className={input} rows={3} maxLength={1500} value={draft.alibi} onChange={e=>change("alibi",e.target.value)} placeholder="¿Qué afirma que estaba haciendo?"/>
    <label className={label+" mt-3"}>Orden de aparición</label><input className={input} type="number" min={0} max={99} value={draft.display_order} onChange={e=>change("display_order",Number(e.target.value))}/>
    {error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}{notice&&<p role="status" className="mt-3 text-sm text-green-800">{notice}</p>}
    <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={()=>void save()} className="inline-flex flex-1 items-center justify-center gap-2 border border-[#7f241b] bg-[#8e211a] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving?"Guardando...":"Guardar ficha"}</button>{selectedId&&<button type="button" disabled={saving} onClick={()=>void remove()} className="inline-flex items-center gap-2 border border-red-900 px-3 py-3 text-xs text-red-900"><Trash2 className="h-4 w-4"/>Eliminar</button>}</div>
   </section>
  </div>
 </div></main>;
}

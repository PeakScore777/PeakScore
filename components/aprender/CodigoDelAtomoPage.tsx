"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Plus } from "lucide-react";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";

const qs = [
 { competency:"Uso comprensivo del conocimiento científico", context:"El escáner identifica X con 6 protones, 6 neutrones y 6 electrones; Y con 6 protones, 8 neutrones y 6 electrones; y Z con 7 protones, 7 neutrones y 7 electrones.", prompt:"¿Cuál interpretación describe correctamente los datos?", key:"A", options:[["A","X e Y son isótopos del mismo elemento; Z pertenece a otro elemento."],["B","X y Z son el mismo elemento porque tienen igual número de neutrones."],["C","Y es un ion porque tiene más neutrones que protones."],["D","Los tres son el mismo elemento porque son átomos neutros."]], explanation:"X e Y tienen seis protones y por tanto son el mismo elemento, pero difieren en neutrones: son isótopos. Z tiene siete protones, así que corresponde a otro elemento. Los iones se distinguen por su número de electrones, no por tener más neutrones que protones.", recap:"El número de protones define el elemento. Los isótopos tienen el mismo número de protones y distinto número de neutrones." },
 { competency:"Explicación de fenómenos", context:"Un átomo neutro de magnesio tiene número atómico 12. Durante un proceso pierde dos electrones, mientras su núcleo permanece sin cambios.", prompt:"¿Qué descripción corresponde a la partícula resultante?", key:"B", options:[["A","Es otro elemento porque perdió dos partículas del núcleo."],["B","Es un ion con carga +2: conserva 12 protones y ahora tiene 10 electrones."],["C","Es un isótopo porque cambió su número de electrones."],["D","Tiene carga −2 porque perder electrones lo vuelve negativo."]], explanation:"El magnesio tiene 12 protones. Al perder dos electrones queda con 12 cargas positivas y 10 negativas: su carga neta es +2. Sigue siendo magnesio porque el número de protones no cambió.", recap:"Átomo neutro: protones = electrones. Perder electrones produce un catión positivo; ganarlos produce un anión negativo." },
 { competency:"Indagación y evaluación de evidencia", context:"Dos modelos predicen espectros distintos para un elemento excitado. El modelo I predice una banda continua; el modelo II predice líneas en longitudes de onda específicas. El equipo observa varias líneas brillantes separadas.", prompt:"¿Qué conclusión está mejor respaldada por la evidencia?", key:"B", options:[["A","El modelo I queda confirmado porque todos los elementos contienen electrones."],["B","El patrón observado es compatible con el modelo II, aunque se necesitan más pruebas para evaluar el modelo completo."],["C","El resultado demuestra que los electrones recorren órbitas planetarias clásicas."],["D","Todos los elementos deben emitir exactamente las mismas líneas."]], explanation:"Las líneas discretas son compatibles con fotones emitidos en transiciones entre estados energéticos específicos. La evidencia favorece la predicción del modelo II, pero no demuestra todos sus aspectos ni implica órbitas planetarias clásicas.", recap:"Los modelos científicos se comparan con predicciones y datos. Una observación puede apoyar un modelo sin probar por sí sola toda la teoría." }
] as const;

const notes = [
 ["Número atómico (Z)","Es el número de protones del núcleo y define la identidad del elemento."],
 ["Número másico (A)","A = protones + neutrones. Por tanto, neutrones = A − Z."],
 ["Átomos e iones","En un átomo neutro, protones = electrones. Perder electrones da carga positiva; ganarlos, negativa."],
 ["Isótopos","Tienen el mismo número de protones y diferente número de neutrones."]
];

function ImageUploadSlot({ assetKey, title, description, compact=false }: { assetKey:string; title:string; description:string; compact?:boolean }) {
 const [preview,setPreview] = useState<string|null>(null);
 const [pendingFile,setPendingFile] = useState<File|null>(null);
 const [isAdmin,setIsAdmin] = useState(false);
 const [loading,setLoading] = useState(true);
 const [saving,setSaving] = useState(false);
 const [removing,setRemoving] = useState(false);
 const [error,setError] = useState<string|null>(null);
 const [notice,setNotice] = useState<string|null>(null);
 const [storagePath,setStoragePath] = useState<string|null>(null);
 const fileInputRef = useRef<HTMLInputElement|null>(null);

 useEffect(() => {
  let active = true;
  async function loadAsset() {
   try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const { data: asset, error: assetError } = await supabase.from("lesson_media_assets").select("public_url,storage_path").eq("asset_key", assetKey).maybeSingle();
    if (assetError) throw assetError;
    let admin = false;
    if (user) {
     const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
     if (profileError) throw profileError;
     admin = profile?.role === "admin";
    }
    if (!active) return;
    setIsAdmin(admin);
    if (asset?.public_url) setPreview(asset.public_url);
    if (asset?.storage_path) setStoragePath(asset.storage_path);
   } catch (e) {
    if (active) setError(e instanceof Error ? e.message : "No se pudo cargar la imagen guardada. Verifica la configuración de Supabase.");
   } finally {
    if (active) setLoading(false);
   }
  }
  void loadAsset();
  return () => { active = false; };
 }, [assetKey]);

 async function verifyAdmin() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Inicia sesión con la cuenta administradora.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== "admin") throw new Error("Solo el administrador puede gestionar estas imágenes.");
  return user;
 }

 function selectFile(file?: File) {
  if (!file) return;
  setError(null);
  setNotice(null);
  if (!isAdmin) { setError("Solo el administrador puede cambiar imágenes."); return; }
  if (!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)) { setError("Usa una imagen PNG, JPG, WebP o GIF."); return; }
  if (file.size > 8 * 1024 * 1024) { setError("La imagen debe pesar máximo 8 MB."); return; }
  if (preview && pendingFile) URL.revokeObjectURL(preview);
  setPendingFile(file);
  setPreview(URL.createObjectURL(file));
  setNotice("Vista previa lista. Pulsa el chulo verde para guardar y publicar.");
 }

 async function saveImage() {
  if (!pendingFile || saving || removing) return;
  setError(null);
  setNotice(null);
  setSaving(true);
  let uploadedPath: string | null = null;
  try {
   const user = await verifyAdmin();
   const extension = pendingFile.name.split(".").pop()?.toLowerCase() || "png";
   const safeExtension = /^[a-z0-9]{1,8}$/.test(extension) ? extension : "png";
   const path = assetKey + "/" + crypto.randomUUID() + "." + safeExtension;
   const { error: uploadError } = await supabase.storage.from("lesson-atom-media").upload(path, pendingFile, { upsert:false, contentType:pendingFile.type, cacheControl:"3600" });
   if (uploadError) throw new Error("No se pudo subir el archivo a Supabase Storage: " + uploadError.message);
   uploadedPath = path;
   const { data: urlData } = supabase.storage.from("lesson-atom-media").getPublicUrl(path);
   const { error: saveError } = await supabase.from("lesson_media_assets").upsert({
    asset_key:assetKey, public_url:urlData.publicUrl, storage_path:path, updated_by:user.id, updated_at:new Date().toISOString()
   }, { onConflict:"asset_key" });
   if (saveError) throw new Error("La imagen se subió, pero no se pudo guardar su referencia en la base de datos: " + saveError.message);
   const previousPath = storagePath;
   if (preview && pendingFile) URL.revokeObjectURL(preview);
   setPreview(urlData.publicUrl);
   setStoragePath(path);
   setPendingFile(null);
   setNotice("Imagen guardada y publicada para todos los usuarios.");
   if (previousPath && previousPath !== path) {
    const { error: cleanupError } = await supabase.storage.from("lesson-atom-media").remove([previousPath]);
    if (cleanupError) console.warn("Imagen anterior pendiente de limpieza:", cleanupError.message);
   }
  } catch (e) {
   if (uploadedPath) {
    const { error: cleanupError } = await supabase.storage.from("lesson-atom-media").remove([uploadedPath]);
    if (cleanupError) console.warn("No se pudo limpiar la subida incompleta:", cleanupError.message);
   }
   setError(e instanceof Error ? e.message : "No se pudo guardar la imagen. Comprueba las políticas de Supabase.");
  } finally {
   setSaving(false);
  }
 }

 async function removeImage() {
  if (saving || removing || !preview) return;
  setError(null);
  setNotice(null);
  setRemoving(true);
  try {
   await verifyAdmin();
   if (pendingFile) {
    URL.revokeObjectURL(preview);
    setPendingFile(null);
    const { data: asset, error: assetError } = await supabase.from("lesson_media_assets").select("public_url").eq("asset_key", assetKey).maybeSingle();
    if (assetError) throw assetError;
    setPreview(asset?.public_url ?? null);
    setNotice("Se descartó la selección; la imagen publicada no cambió.");
    return;
   }
   const { error: deleteError } = await supabase.from("lesson_media_assets").delete().eq("asset_key", assetKey);
   if (deleteError) throw new Error("No se pudo quitar la imagen de la lección: " + deleteError.message);
   setPreview(null);
   setStoragePath(null);
   setNotice("Imagen eliminada para todos los usuarios.");
   if (storagePath) {
    const { error: storageError } = await supabase.storage.from("lesson-atom-media").remove([storagePath]);
    if (storageError) setError("La imagen ya no se muestra a los usuarios, pero el archivo antiguo requiere limpieza en Supabase Storage: " + storageError.message);
   }
  } catch (e) {
   setError(e instanceof Error ? e.message : "No se pudo eliminar la imagen.");
  } finally {
   setRemoving(false);
  }
 }

 return <div className={"relative flex " + (compact?"min-h-[144px]":"min-h-[260px]") + " w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border " + (isAdmin?"border-dashed border-cyan-300/45":"border-solid border-[#21405e]") + " bg-[#06111e] p-3 text-center transition"}>
  {preview ? <img src={preview} alt={description} className={"w-full object-contain " + (compact?"max-h-32":"max-h-[340px]")} /> : <><Plus className={(compact?"h-7 w-7":"h-9 w-9") + " text-cyan-200"}/><span className="pixel-font text-[9px] text-cyan-100">{isAdmin?"AÑADIR IMAGEN":"IMAGEN EN PREPARACIÓN"}</span><span className="text-xs text-slate-400">{description}</span></>}
  {isAdmin && <div className="relative z-20 flex items-center justify-center gap-2">
   <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={saving||removing} title={preview?"Cambiar imagen":"Subir imagen"} aria-label={preview?"Cambiar imagen":"Subir imagen"} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/70 bg-cyan-400/10 text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-50"><Plus className="h-6 w-6"/></button>
   <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={"Seleccionar imagen: " + title} className="hidden" disabled={saving||removing} onChange={e=>{selectFile(e.currentTarget.files?.[0]);e.currentTarget.value="";}}/>
   <button type="button" onClick={()=>void saveImage()} disabled={!pendingFile||saving||removing} title="Guardar imagen" aria-label="Guardar imagen" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-400 text-emerald-950 shadow-[0_0_12px_rgba(74,222,128,0.25)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"><Check className="h-6 w-6 stroke-[3]"/></button>
   {preview && <button type="button" onClick={()=>void removeImage()} disabled={saving||removing} title={pendingFile?"Descartar selección":"Quitar imagen publicada"} aria-label={pendingFile?"Descartar selección":"Quitar imagen publicada"} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300/60 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50">{removing?<span className="text-xs">…</span>:<span className="text-lg leading-none">×</span>}</button>}
  </div>}
  {isAdmin && pendingFile && <span className="text-[10px] font-bold text-emerald-300">Lista para guardar</span>}
  <span className="text-[10px] text-cyan-200">{saving?"Guardando en Supabase…":removing?"Quitando imagen…":loading?"Cargando…":pendingFile?"Pendiente de guardar":preview?title:(isAdmin?"Solo admin puede subir":"Visible para todos")}</span>
  {notice&&<p className="relative z-20 text-[10px] text-emerald-300">{notice}</p>}
  {error&&<p role="alert" className="relative z-20 break-words text-[10px] text-rose-300">{error}</p>}
 </div>;
}
export default function CodigoDelAtomoPage() {
 const [practice,setPractice] = useState(false);
 const [examples,setExamples] = useState(false);
 const [index,setIndex] = useState(0);
 const [choice,setChoice] = useState<string|null>(null);
 const [checked,setChecked] = useState(false);
 const [score,setScore] = useState(0);
 const [done,setDone] = useState(false);
 const [tutorOpen,setTutorOpen] = useState(false);
 const [reward,setReward] = useState(false);
 const q=qs[index];
 const correct=choice===q.key;
 function sound(file:string,volume=.2){ if(typeof window!=="undefined"){const a=new Audio("/sounds/"+file);a.volume=volume;void a.play().catch(()=>{});} }
 function check(){if(!choice||checked)return;setChecked(true);if(correct)setScore(s=>s+1);}
 function next(){if(index<qs.length-1){sound("navigation.mp3",.16);setIndex(i=>i+1);setChoice(null);setChecked(false);return;}setDone(true);if(score===qs.length){setReward(true);sound("level-win.mp3",.25);}else sound("game-over.wav",.3);}
 function restart(){setIndex(0);setChoice(null);setChecked(false);setScore(0);setDone(false);setReward(false);}
 return <main className="min-h-screen bg-[#05070b] text-[#f0f4fa]">
 {!practice && !examples ? (
 <div className="grid min-h-screen lg:grid-cols-[276px_minmax(0,1fr)]">
  <aside className="hidden border-r border-[#20334b] bg-[#080f1b] lg:flex lg:flex-col">
   
   <div className="px-4 pt-4"><Link href="/aprender/santuario-de-la-materia" className="flex items-center gap-3 rounded-lg border border-[#263c55] px-3 py-3 text-xs text-slate-200"><ArrowLeft className="h-4 w-4"/> Volver al capítulo</Link><p className="pixel-font mt-6 text-[9px] text-cyan-300">CAPÍTULO 04:</p><h2 className="pixel-font mt-2 text-[11px] leading-5 text-white">El código del átomo</h2>
   <nav className="mt-4 space-y-1">{[["11.","Dentro del átomo",true],["12.","Las pistas de los elementos",false],["13.","Número atómico y másico",false],["14.","Isótopos e iones",false],["15.","Configuración electrónica",false],["16.","La tabla periódica",false],["17.","Tendencias periódicas",false],["18.","Desafío final",false]].map(([n,label,active])=><div key={String(n)} className={`flex items-center gap-3 border-b border-[#1c2b3e] px-3 py-3 text-xs ${active?"border border-cyan-400/70 bg-cyan-400/10 text-cyan-100 shadow-[inset_4px_0_0_#22d3ee]":"text-slate-300"}`}><span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-600 bg-[#0b1523]">{active?"▣":"♙"}</span>{n} {label}</div>)}</nav></div>
   <div className="mt-auto border-t border-[#20334b] bg-[#0b1523] p-4"><p className="pixel-font text-[9px] text-cyan-200">PROGRESO DEL CAPÍTULO</p><div className="mt-3 h-2 rounded-full border border-[#284663] bg-[#050b13]"><div className="h-full w-[12%] rounded-full bg-cyan-400"/></div><p className="mt-2 text-center text-[11px] text-slate-300">1 / 8 lecciones</p><div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-[11px] text-slate-300"><p>◉ Teoría completada <span className="float-right">12%</span></p><p>⬡ Preguntas acertadas <span className="float-right">0 / 3</span></p><p>★ Recompensa final </p></div></div>
  </aside>
  <div className="min-w-0 pb-20">
   <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between gap-3 border-b border-[#20334b] bg-[#070d17]/95 px-4 backdrop-blur sm:px-6"><div className="flex min-w-0 items-center gap-3 text-xs text-slate-300"><Link href="/aprender/santuario-de-la-materia" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#29405a]"><ArrowLeft className="h-4 w-4"/></Link><span className="hidden sm:inline">Santuario de la Materia</span><span>›</span><span className="hidden sm:inline">Capítulo 04</span><span>›</span><strong className="text-cyan-200">Lección 11</strong></div></header>
   <div className="mx-auto grid max-w-[1600px] gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_316px]"><div className="min-w-0">
    <section className="relative flex min-h-[166px] items-center overflow-hidden rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-7" style={{backgroundImage:"linear-gradient(90deg,rgba(3,9,20,.96),rgba(3,9,20,.72) 55%,rgba(3,9,20,.12)),url('/images/aprender/santuario/codigo-atomo.png')",backgroundSize:"cover",backgroundPosition:"center"}}><div className="max-w-[650px]"><span className="pixel-font rounded border border-cyan-400 px-2 py-1 text-[8px] text-cyan-200">LECCIÓN 11 DE 8</span><h1 className="pixel-font mt-3 text-2xl text-white sm:text-3xl">Dentro del átomo</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-100">Descubre qué es un átomo, cómo se descubrieron sus componentes y por qué su estructura explica las propiedades de los elementos.</p></div></section>
    <nav className="mt-2 grid grid-cols-4 rounded-xl border border-[#21405e] bg-[#071321] p-1 text-center text-[11px] sm:text-sm"><button onClick={()=>{setExamples(false);setPractice(false)}} className="rounded-lg border border-cyan-300 bg-cyan-500/30 px-2 py-3 font-bold text-white">▤ Teoría</button><button onClick={()=>{setPractice(false);setExamples(true)}} className="rounded-lg px-2 py-3 text-slate-300">☷ Ejemplos</button><button onClick={()=>{setExamples(false);setPractice(false);document.getElementById("puntos-clave")?.scrollIntoView({behavior:"smooth"})}} className="rounded-lg px-2 py-3 text-slate-300">♧ Puntos clave</button><button onClick={()=>{setExamples(false);setPractice(true)}} className="rounded-lg px-2 py-3 text-slate-300">◎ Práctica</button></nav>
    <div className="mt-3 space-y-3">
     <section className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)] lg:items-center"><div><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">1</span>¿Qué es un átomo?</h2><p className="mt-3 text-sm leading-6 text-slate-200">Un átomo es la unidad más pequeña de un elemento químico que conserva su identidad. Su estructura incluye un núcleo con protones y neutrones, rodeado por una región electrónica en la que se encuentran los electrones. Los átomos pueden enlazarse para formar moléculas y redes cristalinas.</p></div><ImageUploadSlot assetKey="codigo-atomo/atom-overview" title="Imagen 01" description="Átomo con protón, neutrón y electrón señalados."/></div></section>
     <section className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">2</span>Modelo del átomo a lo largo del tiempo</h2><p className="ml-12 mt-2 text-xs leading-5 text-slate-300">Los modelos científicos se construyen con observaciones y experimentos; cada modelo explicó evidencias y también tuvo limitaciones.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Dalton","1803","Propuso que la materia está formada por átomos indivisibles."],["Thomson","1897","Identificó el electrón mediante experimentos con rayos catódicos."],["Rutherford","1911","Propuso un núcleo pequeño, denso y positivo."],["Bohr","1913","Introdujo niveles de energía cuantizados."],["Modelo cuántico","1926 en adelante","Describe electrones mediante estados cuánticos y orbitales."]].map(m=><div key={m[0]} className="rounded-lg border border-[#14517a] bg-[#071a2d] p-3"><div className="flex items-center gap-2"><div className="w-24 shrink-0"><ImageUploadSlot compact assetKey={`codigo-atomo/model-${String(m[0]).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`} title={m[0]} description={"Miniatura del modelo "+m[0]+"."}/></div><div><h3 className="text-xs font-bold text-white">{m[0]}</h3><p className="mt-1 text-[10px] text-slate-400">({m[1]})</p></div></div><p className="mt-3 text-[11px] leading-4 text-slate-300">{m[2]}</p></div>)}</div><p className="mt-2 text-center text-[10px] text-cyan-200">Cada círculo «+» es un espacio para añadir la miniatura del modelo correspondiente.</p></section>
     <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]"><section className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">3</span>Las tres partículas fundamentales</h2><div className="mt-3 grid gap-2 sm:grid-cols-3">{[["Protón (p⁺)","Carga relativa: +1","Masa aproximada: 1 u","Determina la identidad del elemento."],["Neutrón (n⁰)","Carga relativa: 0","Masa aproximada: 1 u","Contribuye a la masa del núcleo."],["Electrón (e⁻)","Carga relativa: −1","Masa muy pequeña","Participa en los enlaces químicos."]].map(p=><div key={p[0]} className="rounded-lg border border-[#14517a] bg-[#081b2e] p-3"><div className="flex items-center gap-2"><div className="w-16 shrink-0"><ImageUploadSlot compact assetKey={`codigo-atomo/particle-${String(p[0]).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`} title={p[0]} description={"Imagen de "+p[0]+"."}/></div><h3 className="text-xs font-bold text-white">{p[0]}</h3></div><p className="mt-2 text-[10px] leading-4 text-cyan-100">{p[1]}<br/>{p[2]}</p><p className="mt-3 border border-[#244563] bg-[#0a263e] p-2 text-[10px] leading-4 text-slate-300">{p[3]}</p></div>)}</div></section><section className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">4</span>Tamaño y masa</h2><ImageUploadSlot assetKey="codigo-atomo/size-and-mass" title="Imagen 04" description="Núcleo y región electrónica, con etiquetas."/><p className="mt-3 text-xs leading-5 text-slate-300">Casi toda la masa está concentrada en el núcleo; la región electrónica ocupa la mayor parte del volumen del átomo.</p></section></div>
     <section className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="pixel-font text-sm text-cyan-100">5. Número atómico, número másico, isótopos e iones</h2><p className="mt-3 text-sm leading-6 text-slate-300">El número atómico Z equivale al número de protones. El número másico A es la suma de protones y neutrones: A = Z + N. Los isótopos son átomos del mismo elemento con distinto número de neutrones. Los iones se forman al ganar o perder electrones.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="border border-cyan-300/25 bg-[#0a1a2a] p-4"><p className="text-center font-mono text-lg text-cyan-100">A = Z + N</p><p className="mt-2 text-xs text-slate-300">Si Z = 11 y A = 23, el átomo tiene 11 protones y 12 neutrones.</p></div><ImageUploadSlot assetKey="codigo-atomo/isotopes-ions" title="Imagen 05" description="Comparación visual de isótopos e iones."/></div></section>
     <section id="puntos-clave" className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4"><h2 className="pixel-font text-sm text-amber-300">★ Puntos clave</h2><ul className="mt-3 grid gap-3 text-xs leading-5 text-slate-200 sm:grid-cols-2"><li>✓ El número de protones determina el elemento.</li><li>✓ En un átomo neutro, protones y electrones son iguales.</li><li>✓ Los isótopos tienen igual número de protones y distinto número de neutrones.</li><li>✓ Los iones tienen diferente número de protones y electrones.</li><li>✓ Los modelos científicos se evalúan mediante evidencias.</li></ul></section>
     <div className="flex justify-end pb-4"><button onClick={()=>setPractice(true)} className="rounded-lg border border-cyan-300 bg-cyan-500/30 px-5 py-3 text-sm font-bold text-white">Siguiente sección · Ejemplos resueltos <ArrowRight className="ml-2 inline h-4 w-4"/></button></div>
    </div></div>
    <aside className="hidden space-y-3 xl:block"><section className="rounded-xl border border-[#21405e] bg-[#071321] p-3"><div className="flex gap-3"><div className="w-[95px] shrink-0"><ImageUploadSlot compact assetKey="codigo-atomo/founder" title="Founder" description="Añadir imagen del Founder."/></div><p className="self-center rounded-lg border border-[#29415c] bg-[#101d30] p-3 text-xs leading-5 text-slate-200">Aunque es muy pequeño, el átomo es la base de todo lo que existe. ¡Vamos a descubrir sus secretos!</p></div><button onClick={()=>setTutorOpen(true)} className="mt-3 w-full rounded-lg border border-fuchsia-300 bg-gradient-to-b from-fuchsia-500 to-violet-700 px-3 py-4 text-sm font-extrabold text-white">🤖 Pregunta a la IA</button></section><section className="rounded-xl border border-[#21405e] bg-[#071321] p-3"><h2 className="pixel-font text-[10px] text-cyan-100">EN ESTA LECCIÓN</h2><div className="mt-3 space-y-1">{["¿Qué es un átomo?","Modelos del átomo","Protones, neutrones y electrones","Tamaño y masa del átomo","¿Por qué importa conocer el átomo?"].map((s,i)=><button key={s} onClick={()=>document.getElementById("puntos-clave")?.scrollIntoView({behavior:"smooth"})} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-[#12243a]"><span className="flex h-7 w-7 items-center justify-center rounded-md border border-fuchsia-400/40 bg-fuchsia-400/10">{i+1}</span>{s}</button>)}</div></section><section className="rounded-xl border border-[#21405e] bg-[#071321] p-4"><h2 className="pixel-font text-[10px] text-amber-300">⭐ PUNTOS CLAVE</h2><ul className="mt-3 space-y-3 text-xs leading-5 text-slate-300">{["El número de protones determina el elemento.","En un átomo neutro, electrones = protones.","Los isótopos tienen diferente número de neutrones.","Los iones ganan o pierden electrones.","Los modelos científicos se evalúan mediante evidencias."].map(s=><li key={s} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300"/>{s}</li>)}</ul></section></aside>
   </div>
  </div>
  <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic="El código del átomo" stage="theory" context="Estoy estudiando la estructura atómica, partículas subatómicas, número atómico, isótopos e iones."/>
  <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/95"><div className="mx-auto flex min-h-[58px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7"><div><p className="pixel-font text-[8px] text-slate-100">NIVEL 4 · EL CÓDIGO DEL ÁTOMO</p><span className="mt-1 inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-200">★ 60 XP</span></div><button onClick={()=>{sound("navigation.mp3",.16);setPractice(true)}} className="border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Iniciar desafío <ArrowRight className="ml-1 inline h-4 w-4"/></button></div></footer>
 </div>
 ) : examples ? (
 <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-7"><p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">SANTUARIO DE LA MATERIA · EJEMPLOS RESUELTOS</p><h1 className="mt-3 text-2xl font-extrabold text-white">Aprende a descifrar la estructura atómica</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Estos ejercicios están desarrollados paso a paso y son distintos de las preguntas de práctica.</p><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo resuelto 1 · Número másico</p><h2 className="mt-3 text-lg font-bold text-white">Un átomo tiene 17 protones y 18 neutrones. ¿Cuál es su número másico y qué elemento es?</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> El número másico suma protones y neutrones: A = Z + N.</p><p><strong className="text-cyan-200">Paso 2.</strong> Sustituimos: A = 17 + 18 = 35.</p><p><strong className="text-cyan-200">Paso 3.</strong> El elemento con 17 protones es cloro; el número másico 35 identifica al cloro-35.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> cloro-35, con número másico 35.</div></div></section><section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo resuelto 2 · Formación de un ion</p><h2 className="mt-3 text-lg font-bold text-white">Un átomo neutro tiene 12 protones y 12 electrones. Pierde 2 electrones. ¿Qué carga adquiere?</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> Cada protón aporta +1 y cada electrón −1.</p><p><strong className="text-cyan-200">Paso 2.</strong> Después de perder 2 electrones quedan 12 protones y 10 electrones.</p><p><strong className="text-cyan-200">Paso 3.</strong> La carga neta es 12 − 10 = +2. El núcleo no cambió, así que sigue siendo magnesio.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> se forma un catión Mg²⁺ de carga +2.</div></div></section></div><div className="mt-6 flex flex-wrap justify-between gap-3"><button onClick={()=>{setExamples(false);setPractice(false)}} className="border border-[#344a66] bg-[#111c2d] px-4 py-3 text-sm font-bold text-slate-100"><ArrowLeft className="mr-2 inline h-4 w-4"/> Volver a teoría</button><button onClick={()=>{setExamples(false);setPractice(true)}} className="border border-cyan-300 bg-cyan-500/30 px-5 py-3 text-sm font-bold text-white">Ir a práctica <ArrowRight className="ml-2 inline h-4 w-4"/></button></div></div>
 ) : (
 <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-7"><p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">DESAFÍO DEL SANTUARIO · PREGUNTA {index+1} DE 3</p><h1 className="mt-3 text-2xl font-extrabold text-white">Descifra el código del átomo</h1><div className="mt-5 grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><aside className="border border-[#2f465f] bg-[#121e30] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Repaso estratégico</p>{notes.map(n=><section key={n[0]} className="mt-4 border-t border-white/10 pt-4 first:border-0 first:pt-0"><h2 className="text-sm font-bold text-white">{n[0]}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{n[1]}</p></section>)}</aside><section className="overflow-hidden border border-[#35506d] bg-[#0d1422]"><div className="border-b border-[#293d56] bg-[#121d30] p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">{q.competency}</p><p className="mt-4 border-l-[3px] border-cyan-300 bg-[#0b1524] px-4 py-4 text-sm leading-7 text-slate-100">{q.context}</p><div className="mt-4 border border-[#31485e] bg-[#0c1a29] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Puntos clave de la teoría</p><p className="mt-2 text-sm leading-6 text-slate-200">{q.recap}</p></div><h2 className="mt-5 text-lg font-extrabold leading-8 text-white sm:text-xl">{q.prompt}</h2><p className="mt-2 text-xs text-slate-400">Selecciona la opción mejor respaldada por los datos.</p></div><div className="space-y-3 p-5 sm:p-7">{q.options.map(([label,text])=>{const active=choice===label;const right=checked&&label===q.key;const wrong=checked&&active&&!correct;const style=right?"border-emerald-300 bg-emerald-300/10":wrong?"border-rose-400 bg-rose-400/10":active?"border-cyan-300 bg-cyan-300/10":"border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60";return <button key={label} disabled={checked} onClick={()=>setChoice(label)} className={`flex w-full items-start gap-3 border p-4 text-left transition ${style}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#425977] bg-[#0a1220] text-xs font-extrabold text-white">{label}</span><span className="pt-1 text-sm font-medium leading-6 text-slate-100">{text}</span>{right&&<CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-300"/>}</button>})}{checked&&<div className={`border p-4 ${correct?"border-emerald-300/50 bg-emerald-300/[.08]":"border-amber-300/50 bg-amber-300/[.07]"}`}><p className="font-bold text-white">{correct?"Correcto: interpretación respaldada.":"Revisemos el concepto."}</p><p className="mt-2 text-sm leading-7 text-slate-200">{q.explanation}</p></div>}<div className="flex justify-end border-t border-[#293d56] pt-5">{!checked?<button disabled={!choice} onClick={check} className="border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] disabled:opacity-40">Comprobar respuesta <ArrowRight className="ml-2 inline h-4 w-4"/></button>:<button onClick={next} className="border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-sm font-bold text-cyan-100">{index===2?"Ver resultado":"Siguiente pregunta"} <ArrowRight className="ml-2 inline h-4 w-4"/></button>}</div></div></section></div></div>)}
 {done&&!reward&&<div className="game-over-overlay fixed inset-0 z-40 flex items-center justify-center px-4 py-8"><div className="w-full max-w-4xl text-center"><div className="pixel-font text-5xl font-black text-white sm:text-8xl" style={{textShadow:"5px 5px 0 #155e75, 9px 9px 0 #0b1220"}}>GAME <span className="inline-block align-middle"><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova" width={100} height={100}/></span> OVER</div><p className="pixel-font mt-5 text-xs font-bold text-white sm:text-base">PLAY AGAIN?</p><p className="mt-5 font-extrabold text-white [text-shadow:0_2px_6px_#000]">No lograste acertar las tres preguntas de este desafío.</p><p className="mt-3 font-extrabold text-white [text-shadow:0_2px_6px_#000]">Acertaste <strong className="text-cyan-300">{score} de 3</strong> preguntas.</p><p className="mt-4 font-bold text-white [text-shadow:0_2px_6px_#000]">Repasa los puntos clave y vuelve a intentarlo. Cada error te ayuda a comprender mejor.</p><div className="mt-7 flex flex-col items-center gap-3"><button onClick={restart} className="game-over-choice game-over-choice-yes">▶ YES <span className="game-over-choice-detail">REPETIR PRÁCTICA</span></button><button onClick={()=>{setPractice(false);setDone(false)}} className="game-over-choice">NO <span className="game-over-choice-detail">REPASAR TEORÍA</span></button></div><p className="pixel-font mt-8 text-[10px] text-white">PEAKSCORE · CONTINÚA LA AVENTURA</p></div></div>}
 {practice&&!done&&<LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={`El código del átomo: pregunta ${index+1} de 3`} stage="practice" question={q.prompt} context={`Situación: ${q.context}\nOpciones: ${q.options.map(o=>o.join(") ")).join("\n")}\nExplicación: ${q.explanation}`}/>}
 <XpRewardAnimation open={reward&&done} xp={60} nextLabel="CONTINUAR" onContinue={()=>{setReward(false);window.location.href="/aprender/santuario-de-la-materia"}}/>
 {!(done&&!reward)&&<footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] shadow-[0_-8px_24px_rgba(0,0,0,.18)]"><div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7"><div><p className="pixel-font text-[8px] text-slate-100">NIVEL 4{practice?` · PREGUNTA ${index+1}/3`:" · EL CÓDIGO DEL ÁTOMO"}</p><span className="mt-1 inline-flex items-center gap-1.5 border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-0.5 text-[9px] font-bold text-emerald-200"><Image src="/peaky/homepage/xp.webp" alt="" width={17} height={17}/> 60 XP</span></div>{practice&&!done&&<button onClick={()=>setTutorOpen(o=>!o)} className="inline-flex min-h-9 items-center gap-1.5 border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 font-bold text-[#251300] shadow-[3px_3px_0_#9a4e00]"><span>🤖</span><span className="pixel-font text-[8px]">AI</span></button>}{practice?<button onClick={()=>setPractice(false)} className="border border-white/10 bg-[#1a2235] px-3 py-2 text-xs font-semibold text-slate-200"><ArrowLeft className="mr-1 inline h-4 w-4"/> Volver a teoría</button>:<button onClick={()=>{sound("navigation.mp3",.16);setPractice(true)}} className="border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Iniciar desafío <ArrowRight className="ml-1 inline h-4 w-4"/></button>}</div></footer>}
 <style jsx global>{`.game-over-overlay{background:linear-gradient(180deg,rgba(2,5,13,.35),rgba(2,5,13,.65)),url("/images/game-over-lab.png") center/cover no-repeat,#020308!important}.game-over-choice{font-family:var(--font-press-start),"Press Start 2P",monospace;font-size:10px;font-weight:800;color:#a5f3fc;padding:.7rem;text-shadow:0 2px 6px #000}.game-over-choice-detail{font-family:Arial,sans-serif;font-size:14px;font-weight:800;color:#e2e8f0;margin-left:.5rem;text-shadow:0 2px 6px #000}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`}</style>
 </main>;
}

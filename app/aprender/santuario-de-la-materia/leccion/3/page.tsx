"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Lightbulb, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";

type Question = {
  difficulty: "Fácil" | "Media" | "Difícil";
  competency: string;
  context: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
 {difficulty:"Fácil",competency:"Uso comprensivo del conocimiento científico",context:"Nova recibe una muestra transparente formada por agua y sal disuelta. Después de evaporar parte del agua, aparecen cristales de sal.",prompt:"¿Cómo se clasifica mejor la muestra inicial?",options:[{label:"A",text:"Sustancia pura, porque se ve uniforme."},{label:"B",text:"Mezcla homogénea, porque contiene más de una sustancia y presenta una sola fase visible."},{label:"C",text:"Mezcla heterogénea, porque toda mezcla debe mostrar sus componentes."},{label:"D",text:"Elemento químico, porque la sal no se ve."}],answer:"B",explanation:"Una disolución de sal en agua es una mezcla homogénea: contiene varias sustancias distribuidas uniformemente y no se distinguen fases a simple vista. La apariencia uniforme no la convierte en sustancia pura."},
 {difficulty:"Media",competency:"Explicación de fenómenos",context:"En un laboratorio hay una mezcla de limaduras de hierro, arena y sal. Se desea recuperar por separado los tres componentes sin transformar químicamente las sustancias.",prompt:"¿Qué secuencia aprovecha correctamente sus propiedades físicas?",options:[{label:"A",text:"Filtración, luego imantación y finalmente combustión."},{label:"B",text:"Imantación para retirar el hierro, añadir agua para disolver la sal, filtrar la arena y evaporar el agua."},{label:"C",text:"Evaporar primero toda la mezcla y después separar los componentes por color."},{label:"D",text:"Calentar hasta que el hierro y la arena se conviertan en gas."}],answer:"B",explanation:"La imantación separa el hierro por su respuesta al imán. La sal se disuelve en agua y la arena no; la filtración retiene la arena y la evaporación permite recuperar la sal disuelta."},
 {difficulty:"Media",competency:"Indagación y evaluación de evidencia",context:"Un estudiante afirma que una mezcla de agua y alcohol puede separarse mediante filtración porque ambos líquidos atraviesan el papel de filtro.",prompt:"¿Cuál procedimiento sería más adecuado para separar los componentes?",options:[{label:"A",text:"Filtrar varias veces, porque el papel retiene el alcohol."},{label:"B",text:"Usar decantación, porque todos los líquidos forman capas separadas."},{label:"C",text:"Aplicar destilación, aprovechando sus diferentes temperaturas de ebullición y controlando el montaje."},{label:"D",text:"Usar un imán, porque uno de los líquidos debe ser magnético."}],answer:"C",explanation:"El agua y el alcohol son miscibles, así que no se separan por filtración ni por decantación simple. La destilación aprovecha la diferencia de volatilidad/temperatura de ebullición para enriquecer el vapor en uno de los componentes."}
];
const retryQuestions: Question[] = [
 {difficulty:"Media",competency:"Indagación y evaluación de evidencia",context:"Una mezcla contiene agua, arena y sal disuelta. Se quiere recuperar la arena seca y también obtener la sal.",prompt:"¿Qué plan permite lograr ambos objetivos?",options:[{label:"A",text:"Filtrar para retener la arena, secarla y evaporar el filtrado para recuperar la sal."},{label:"B",text:"Evaporar toda la mezcla y asumir que la arena desaparecerá."},{label:"C",text:"Usar únicamente un imán, porque la sal y la arena son metales."},{label:"D",text:"Filtrar el agua con sal y afirmar que la sal queda retenida en el papel."}],answer:"A",explanation:"La arena es insoluble y queda retenida en el filtro. La sal disuelta atraviesa el filtro junto con el agua; al evaporar el disolvente, la sal puede cristalizar."},
 {difficulty:"Media",competency:"Uso comprensivo del conocimiento científico",context:"Dos líquidos forman una sola fase al mezclarse. Sus temperaturas de ebullición son diferentes y no reaccionan químicamente entre sí.",prompt:"¿Qué método es el más pertinente para separar y recoger sus componentes?",options:[{label:"A",text:"Tamizado por tamaño de partícula."},{label:"B",text:"Destilación, recogiendo el vapor condensado."},{label:"C",text:"Filtración con papel poroso."},{label:"D",text:"Decantación por diferencia de densidad, aunque sean miscibles."}],answer:"B",explanation:"La destilación separa componentes miscibles aprovechando diferencias de volatilidad. El vapor se conduce a un condensador y se recoge como líquido."},
 {difficulty:"Media",competency:"Explicación de fenómenos",context:"Una tinta negra se coloca sobre papel de cromatografía. Al subir el disolvente, aparecen bandas de distintos colores a diferentes alturas.",prompt:"¿Qué explica mejor el resultado?",options:[{label:"A",text:"La tinta se transformó necesariamente en sustancias nuevas."},{label:"B",text:"Todos los pigmentos viajan exactamente igual, pero el papel cambia sus colores."},{label:"C",text:"Los componentes interactúan de forma diferente con el papel y el disolvente, por lo que avanzan distancias distintas."},{label:"D",text:"La cromatografía separa solo materiales magnéticos."}],answer:"C",explanation:"La cromatografía aprovecha diferencias de afinidad entre la fase estacionaria (papel) y la fase móvil (disolvente). Por eso, los componentes de una mezcla pueden desplazarse a distintas velocidades."}
];
const separationMethods = [
  {
    "id": "tamizado",
    "title": "Tamizado",
    "description": "Separa sólidos con tamaños de partícula diferentes usando una malla: las partículas pequeñas atraviesan los orificios y las grandes quedan retenidas.",
    "example": "separar grava de arena con un tamiz adecuado.",
    "limit": "no separa sustancias disueltas ni partículas de tamaño parecido al de la malla."
  },
  {
    "id": "imantacion",
    "title": "Imantación o separación magnética",
    "description": "Un imán atrae componentes ferromagnéticos, como hierro, níquel o ciertos aceros, mientras los no magnéticos permanecen en la mezcla.",
    "example": "retirar limaduras de hierro de arena y sal antes de añadir agua.",
    "limit": "no todos los metales son atraídos por un imán; aluminio y cobre no se separan así en condiciones escolares comunes."
  },
  {
    "id": "filtracion",
    "title": "Filtración",
    "description": "Un medio poroso retiene partículas sólidas insolubles y permite que el líquido pase como filtrado.",
    "example": "separar arena del agua con papel de filtro.",
    "limit": "la sal disuelta pasa junto con el agua; para recuperarla se necesita otra técnica."
  },
  {
    "id": "decantacion",
    "title": "Decantación",
    "description": "Después de dejar reposar la muestra, se separa una fase de otra por diferencia de densidad, cuando son inmiscibles o un sólido ha sedimentado.",
    "example": "separar agua y aceite con un embudo de decantación.",
    "limit": "no funciona bien para líquidos miscibles como agua y alcohol."
  },
  {
    "id": "sedimentacion",
    "title": "Sedimentación",
    "description": "Se deja que partículas más densas que el fluido se depositen por gravedad en el fondo del recipiente.",
    "example": "dejar reposar agua con barro antes de retirar el líquido superior.",
    "limit": "puede ser lenta y no elimina partículas muy finas o disueltas."
  },
  {
    "id": "centrifugacion",
    "title": "Centrifugación",
    "description": "La rotación acelera la separación de componentes con distinta densidad efectiva, concentrando los más densos hacia el exterior o el fondo del tubo.",
    "example": "separar componentes de una suspensión en un equipo apropiado.",
    "limit": "requiere equipo adecuado y no separa solutos disueltos como la sal del agua."
  },
  {
    "id": "evaporacion",
    "title": "Evaporación",
    "description": "Se evapora el disolvente para recuperar un soluto sólido no volátil que estaba disuelto.",
    "example": "obtener sal de una disolución de agua salada.",
    "limit": "el disolvente suele perderse y el calentamiento puede dañar sustancias sensibles al calor."
  },
  {
    "id": "cristalizacion",
    "title": "Cristalización",
    "description": "Se forman cristales al enfriar una disolución o retirar parte del disolvente; en condiciones adecuadas permite recuperar y purificar un sólido.",
    "example": "obtener cristales de una disolución concentrada de una sal.",
    "limit": "depende de la solubilidad, temperatura, pureza y velocidad de formación de los cristales."
  },
  {
    "id": "destilacion-simple",
    "title": "Destilación simple",
    "description": "Se vaporiza un componente y se condensa el vapor para recuperarlo, aprovechando una diferencia suficiente de volatilidad o separando un líquido de solutos no volátiles.",
    "example": "recuperar agua de una disolución salina mediante condensación del vapor.",
    "limit": "no es la mejor opción para separar líquidos con puntos de ebullición muy cercanos."
  },
  {
    "id": "destilacion-fraccionada",
    "title": "Destilación fraccionada",
    "description": "Una columna produce repetidos procesos de vaporización y condensación para separar líquidos miscibles con puntos de ebullición relativamente cercanos.",
    "example": "separar componentes de una mezcla de líquidos miscibles en un laboratorio equipado.",
    "limit": "requiere control de temperatura y un montaje adecuado; una sola pasada no garantiza pureza total."
  },
  {
    "id": "cromatografia",
    "title": "Cromatografía",
    "description": "Separa componentes porque interactúan de manera distinta con una fase estacionaria y una fase móvil; por eso avanzan a velocidades diferentes.",
    "example": "separar los pigmentos de una tinta en papel.",
    "limit": "las bandas sugieren componentes distintos, pero identificarlos exige compararlos con referencias."
  },
  {
    "id": "extraccion",
    "title": "Extracción con disolvente",
    "description": "Transfiere preferentemente un componente a un disolvente en el que es más soluble que en la otra fase; luego se separan las fases.",
    "example": "extraer un compuesto soluble con un disolvente selectivo apropiado.",
    "limit": "el disolvente debe elegirse con cuidado; puede requerir separación posterior y medidas de seguridad."
  }
] as const;

function ImageUploadSlot({ assetKey, title, description, compact=false, large=false }: { assetKey:string; title:string; description:string; compact?:boolean; large?:boolean }) {
 const [imageUrl,setImageUrl] = useState<string|null>(null);
 const [isAdmin,setIsAdmin] = useState(false);
 const [loading,setLoading] = useState(true);
 const [saving,setSaving] = useState(false);
 const [error,setError] = useState<string|null>(null);
 const [notice,setNotice] = useState<string|null>(null);
 const fileInputRef = useRef<HTMLInputElement|null>(null);

 useEffect(() => {
  let active = true;
  async function loadAsset() {
   try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    let admin = false;
    if (user) {
     const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
     if (profileError) throw profileError;
     admin = profile?.role === "admin";
    }
    if (active) setIsAdmin(admin);
   } catch (e) {
    if (active) setError(e instanceof Error ? e.message : "No se pudo verificar la sesión.");
   }
   try {
    const { data: asset, error: assetError } = await supabase.from("lesson_media_assets").select("public_url").eq("asset_key", assetKey).maybeSingle();
    if (assetError) throw assetError;
    if (active && asset?.public_url) setImageUrl(asset.public_url);
   } catch (e) {
    if (active) setError(e instanceof Error ? e.message : "No se pudo cargar la imagen compartida.");
   } finally {
    if (active) setLoading(false);
   }
  }
  void loadAsset();
  return () => { active = false; };
 }, [assetKey]);

 async function uploadSelectedFile(file?: File) {
  if (!file || saving) return;
  setError(null);
  setNotice(null);
  if (!isAdmin) { setError("Solo el administrador puede cambiar las imágenes."); return; }
  if (!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)) {
   setError("Formato no válido. Usa PNG, JPG, WebP o GIF."); return;
  }
  if (file.size > 8 * 1024 * 1024) {
   setError("La imagen debe pesar máximo 8 MB."); return;
  }

  setSaving(true);
  let uploadedPath: string | null = null;
  try {
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   if (authError) throw authError;
   if (!user) throw new Error("Inicia sesión con la cuenta administradora.");
   const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
   if (profileError) throw profileError;
   if (profile?.role !== "admin") throw new Error("Solo el administrador puede gestionar estas imágenes.");

   const previousUrl = imageUrl;
   const { data: previousAsset, error: previousAssetError } = await supabase.from("lesson_media_assets").select("storage_path").eq("asset_key", assetKey).maybeSingle();
   if (previousAssetError) throw previousAssetError;

   const extension = file.name.split(".").pop()?.toLowerCase() || "png";
   const safeExtension = /^[a-z0-9]{1,8}$/.test(extension) ? extension : "png";
   const path = assetKey + "/" + crypto.randomUUID() + "." + safeExtension;
   const { error: uploadError } = await supabase.storage.from("lesson-atom-media").upload(path, file, {
    upsert:false, contentType:file.type, cacheControl:"3600"
   });
   if (uploadError) throw new Error("No se pudo subir a Supabase Storage: " + uploadError.message);
   uploadedPath = path;
   const { data: urlData } = supabase.storage.from("lesson-atom-media").getPublicUrl(path);

   const { error: saveError } = await supabase.from("lesson_media_assets").upsert({
    asset_key:assetKey,
    public_url:urlData.publicUrl,
    storage_path:path,
    updated_by:user.id,
    updated_at:new Date().toISOString()
   }, { onConflict:"asset_key" });
   if (saveError) throw new Error("El archivo se subió, pero no se pudo guardar en la base de datos: " + saveError.message);

   setImageUrl(urlData.publicUrl);
   setNotice("Imagen guardada automáticamente y publicada para todos los usuarios.");
   uploadedPath = null;

   const previousPath = previousAsset?.storage_path;
   if (previousPath && previousPath !== path) {
    const { error: cleanupError } = await supabase.storage.from("lesson-atom-media").remove([previousPath]);
    if (cleanupError) console.warn("La imagen anterior requiere limpieza:", cleanupError.message);
   }
   void previousUrl;
  } catch (e) {
   if (uploadedPath) {
    const { error: cleanupError } = await supabase.storage.from("lesson-atom-media").remove([uploadedPath]);
    if (cleanupError) console.warn("No se pudo limpiar la subida incompleta:", cleanupError.message);
   }
   setError(e instanceof Error ? e.message : "No se pudo guardar la imagen. Revisa las políticas de Supabase.");
  } finally {
   setSaving(false);
  }
 }

 const picker = <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={"Seleccionar imagen para " + title} className="hidden" disabled={!isAdmin || saving} onChange={e=>{void uploadSelectedFile(e.currentTarget.files?.[0]);e.currentTarget.value="";}} />;

 return <div className={"relative flex " + (large ? (imageUrl ? "min-h-0" : "min-h-[260px]") : compact ? "min-h-[144px]" : "min-h-[260px]") + " w-full flex-col items-center justify-center gap-2 overflow-hidden bg-transparent text-center"}>
  {picker}
  {imageUrl ? (
   isAdmin ? <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={saving} title="Pulsa la imagen para cambiarla" aria-label={"Cambiar imagen de " + title} className="group relative flex w-full items-center justify-center bg-transparent disabled:cursor-wait">
    <img src={imageUrl} alt={description} className={"w-full object-contain " + (large ? "max-h-[1000px] sm:max-h-[1150px] xl:max-h-[1300px]" : compact ? "max-h-36" : "max-h-[520px]")}/>
    {saving && <span className="absolute inset-x-1 bottom-1 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-cyan-100">Guardando imagen…</span>}
   </button> : <img src={imageUrl} alt={description} className={"w-full object-contain " + (large ? "max-h-[960px] sm:max-h-[1100px] xl:max-h-[1250px]" : compact ? "max-h-32" : "max-h-[340px]")}/>
  ) : isAdmin ? (
   <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={saving||loading} className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 bg-transparent px-2 py-4 text-cyan-100 transition hover:bg-cyan-400/[0.03] disabled:cursor-wait disabled:opacity-60" title={"Añadir imagen de " + title}>
    {saving ? <span className="animate-pulse text-sm">Subiendo…</span> : <><Plus className={(compact?"h-7 w-7":"h-9 w-9") + " text-cyan-200"}/><span className="pixel-font text-[9px] leading-tight">AÑADIR IMAGEN</span></>}
    <span className="text-[10px] text-cyan-200">{saving?"Guardando automáticamente en Supabase": "Solo admin · pulsa para subir"}</span>
   </button>
  ) : (
   <div className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 bg-transparent px-2 py-4">
    <span className="pixel-font text-[9px] text-cyan-100">{loading?"CARGANDO IMAGEN":"IMAGEN EN PREPARACIÓN"}</span>
   </div>
  )}
  {saving && imageUrl && <span className="text-[10px] font-bold text-cyan-200">Guardando automáticamente en Supabase…</span>}
  {notice && <p role="status" className="text-[10px] text-emerald-300">{notice}</p>}
  {error && <p role="alert" className="max-w-full break-words text-[10px] text-rose-300">{error}</p>}
 </div>;
}

export default function LaboratorioDeLasMezclasPage() {
  const [stage, setStage] = useState<"theory" | "examples" | "practice">("theory");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const activeQuestions = attempt === 0 ? questions : retryQuestions;
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lost, setLost] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  function playSound(file: "navigation.mp3" | "level-win.mp3" | "game-over.wav", volume = 0.22) {
    if (typeof window === "undefined") return;
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = volume;
    void audio.play().catch(() => {});
  }

  useEffect(() => {
    if (finished && lost) playSound("game-over.wav", 0.3);
    if (finished && !lost && rewardOpen) playSound("level-win.mp3", 0.25);
  }, [finished, lost, rewardOpen]);
  const question = activeQuestions[index];
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrect((n) => n + 1);
  }

  function nextQuestion() {
    if (index < activeQuestions.length - 1) {
      playSound("navigation.mp3", 0.16);
      setIndex((n) => n + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setFinished(true);
      const finalCorrect = correct;
      if (finalCorrect === activeQuestions.length) setRewardOpen(true);
      else setLost(true);
    }
  }

  function restart() {
    playSound("navigation.mp3", 0.16);
    setAttempt((n) => n + 1);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrect(0);
    setFinished(false);
    setLost(false);
    setRewardOpen(false);
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#05070b] pb-28 text-[#f0f4fa]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101725]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[58px] max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Santuario de la Materia</Link>
          <span className="pixel-font text-[8px] text-cyan-200">NIVEL 3 · QUÍMICA</span>
        </div>
      </header>

      {stage === "theory" ? (
        <div className="mx-auto max-w-[1600px] px-3 pt-4 sm:px-5 sm:pt-5">
          <section className="relative grid min-h-[220px] items-center gap-4 overflow-hidden rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:min-h-[260px] sm:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)] sm:p-7" style={{backgroundImage:"linear-gradient(90deg,rgba(3,9,20,.96),rgba(3,9,20,.84)),radial-gradient(circle at 85% 20%,rgba(34,211,238,.22),transparent 30%)",backgroundSize:"cover",backgroundPosition:"center"}}>
            <div className="relative z-10 max-w-[780px]"><span className="pixel-font rounded border border-cyan-400 px-2 py-1 text-[8px] text-cyan-200">CAPÍTULO 03 · QUÍMICA</span><h1 className="pixel-font mt-4 text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">El laboratorio de las mezclas</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">Acompaña a Nova a identificar qué contiene cada muestra y a separar sus componentes usando propiedades físicas, procedimientos de laboratorio y evidencia verificable.</p><p className="mt-3 text-xs leading-5 text-cyan-100/80">La imagen del capítulo se administra aquí: solo la cuenta administradora puede cargarla o cambiarla y queda publicada desde Supabase para todos los usuarios.</p></div>
            <div className="relative min-w-0 rounded-lg border border-cyan-300/20 bg-[#050d18]/55 p-2"><ImageUploadSlot assetKey="laboratorio-mezclas/encabezado" title="imagen del encabezado del capítulo 3" description="Ilustración principal del capítulo El laboratorio de las mezclas, con frascos y Nova separando componentes" large /></div>
          </section>
          
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <LessonNotesSelection sourceTitle="Nivel 3: El laboratorio de las mezclas" sourcePath="/aprender/santuario-de-la-materia/leccion/3">
                <section className="overflow-hidden rounded-xl border border-[#21405e] bg-[#071321]/95">
                  <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen(v => !v)} className="flex w-full items-center justify-between bg-[#111d2d] px-4 py-3 text-left text-sm font-semibold text-slate-200">Historia: el archivo de muestras <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${historyOpen?"rotate-180":""}`} /></button>
                  {historyOpen && <div className="space-y-4 px-5 py-5 text-sm leading-7 text-slate-300"><p>En una sala oculta del Santuario, Nova encuentra frascos sin etiqueta: arena con sal, agua turbia, una disolución azul y una tinta que parece tener un solo color. El registro indica que cada muestra contiene pistas, pero ninguna se puede identificar solo por su apariencia.</p><p>Para recuperar los materiales, Nova debe decidir qué propiedad física aprovechar: tamaño de partícula, solubilidad, densidad, magnetismo, volatilidad o afinidad con un disolvente. Cada método tiene límites y debe elegirse según la mezcla real.</p><p className="border-l-2 border-cyan-300/70 bg-cyan-300/[.045] px-4 py-3 text-cyan-100">Tu misión: clasificar las muestras, seleccionar un método de separación y justificar por qué funcionaría sin confundir una mezcla con una sustancia pura.</p></div>}
                </section>
                <section className="mt-3 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="pixel-font text-sm leading-6 text-white sm:text-base">La mesa de separación de Nova</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">Cada técnica aprovecha una propiedad física y tiene límites concretos. Todas las tarjetas cuentan con su propio espacio de imagen: pulsa el + para cargar la ilustración correspondiente. Solo la cuenta administradora puede cambiar imágenes; se guardan en Supabase y se muestran a los demás usuarios.</p></div><span className="rounded border border-cyan-300/30 px-2 py-1 text-[10px] font-bold text-cyan-100">12 MÉTODOS</span></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{separationMethods.map((method) => <article key={method.id} className="min-w-0 overflow-hidden rounded-lg border border-[#14517a] bg-[#071a2d]"><div className="border-b border-cyan-200/10 bg-[#06101d] px-3 pt-2"><ImageUploadSlot assetKey={`laboratorio-mezclas/metodos/${method.id}`} title={`ilustración de ${method.title}`} description={`${method.title}: ${method.description}`} compact /></div><div className="p-3"><h3 className="text-sm font-bold text-cyan-100">{method.title}</h3><p className="mt-1 text-xs leading-5 text-slate-300">{method.description}</p><p className="mt-2 border-l-2 border-cyan-300/50 pl-2 text-xs leading-5 text-slate-400"><strong className="text-slate-200">Ejemplo:</strong> {method.example}</p><p className="mt-2 text-xs leading-5 text-amber-100/90"><strong>Límite:</strong> {method.limit}</p></div></article>)}</div>
                </section>
                <article className="mt-3 grid gap-3 lg:grid-cols-2">
                  <section id="sustancias-mezclas" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">1. Sustancias puras y mezclas</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una sustancia pura tiene composición definida y propiedades características bajo condiciones especificadas. Puede ser un elemento, como cobre, o un compuesto, como agua pura. Una mezcla contiene dos o más sustancias reunidas físicamente; su composición puede variar y sus componentes pueden separarse por métodos físicos adecuados.</p><p className="mt-3 text-sm leading-7 text-slate-300">La apariencia no basta para distinguirlas. El agua con sal puede verse uniforme y seguir siendo una mezcla. Para identificarla, se puede evaporar parte del disolvente y observar la cristalización de la sal. La prueba debe interpretarse junto con otras propiedades y controles.</p></section>
                  <section id="tipos-mezcla" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">2. Mezclas homogéneas y heterogéneas</h2><p className="mt-3 text-sm leading-7 text-slate-300">En una mezcla homogénea, la composición es uniforme a escala de observación y se distingue una sola fase, como agua con sal disuelta. En una mezcla heterogénea, la composición no es uniforme y pueden distinguirse fases, como agua y aceite o agua con arena sedimentada.</p><p className="mt-3 text-sm leading-7 text-slate-300">No confundas fase con componente: una mezcla puede tener varios componentes y una sola fase. También puede presentar más de una fase aunque algunos componentes no se distingan a simple vista. La clasificación depende de la distribución y las propiedades de la muestra, no solo del color.</p></section>
                  <section id="disoluciones" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">3. Disoluciones: soluto y disolvente</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una disolución es una mezcla homogénea. El disolvente es el componente que disuelve y suele estar en mayor proporción; el soluto es el que se dispersa en él. Al disolver sal en agua, los iones se distribuyen entre las moléculas de agua: no desaparecen, aunque ya no se vean como cristales.</p><p className="mt-3 text-sm leading-7 text-slate-300">La solubilidad expresa cuánto soluto puede disolverse en una cantidad determinada de disolvente bajo condiciones definidas, especialmente temperatura y, para gases, presión. Añadir más soluto no garantiza que se disuelva: una disolución saturada ha alcanzado el límite de solubilidad en esas condiciones.</p><div className="mt-4 rounded-lg border border-cyan-200/20 bg-[#101725] p-4"><p className="text-sm font-bold text-cyan-100">Idea importante</p><p className="mt-2 text-sm leading-6 text-slate-300">Disolver no significa destruir una sustancia. Si se evapora el disolvente sin descomponer el soluto, este puede recuperarse como sólido.</p></div></section>
                  <section id="metodos-separacion" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">4. Cómo escoger el método de separación</h2><p className="mt-3 text-sm leading-7 text-slate-300">Relaciona la técnica con la propiedad que produce la diferencia observable. Tamaño de partícula: tamizado. Magnetismo: imantación. Sólido insoluble en un fluido: filtración. Fases que se separan por densidad: sedimentación y decantación; si necesitas acelerar la sedimentación, centrifugación. Soluto sólido disuelto: evaporación o cristalización. Diferencia de volatilidad: destilación simple o fraccionada. Afinidad diferencial: cromatografía. Diferente solubilidad entre líquidos inmiscibles: extracción con disolvente.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="font-bold text-cyan-100">Si hay varios sólidos</h3><p className="mt-1 text-sm leading-6 text-slate-300">Retira primero componentes separables de forma selectiva, como hierro con un imán o sólidos de distinto tamaño con un tamiz. Evita añadir agua antes de recuperar los componentes que podrían perderse o alterarse.</p></div><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="font-bold text-cyan-100">Si hay un sólido disuelto</h3><p className="mt-1 text-sm leading-6 text-slate-300">Filtrar no retiene iones o moléculas disueltos. Para recuperar un sólido no volátil, evapora el disolvente o favorece la cristalización; si también necesitas recuperar el disolvente, considera la destilación.</p></div><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="font-bold text-cyan-100">Si hay dos líquidos</h3><p className="mt-1 text-sm leading-6 text-slate-300">Si son inmiscibles, la decantación puede separarlos. Si son miscibles, se aprovecha la volatilidad mediante destilación; la columna fraccionada ayuda cuando los puntos de ebullición son cercanos.</p></div><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="font-bold text-cyan-100">Si observas bandas</h3><p className="mt-1 text-sm leading-6 text-slate-300">La cromatografía muestra afinidades diferentes entre fases. No concluyas automáticamente la identidad de cada banda sin patrones de referencia o datos adicionales.</p></div></div></section>
                  <section id="elegir-metodo" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">5. Elegir una secuencia de separación</h2><p className="mt-3 text-sm leading-7 text-slate-300">Cuando una mezcla contiene varios componentes, normalmente se necesita más de una etapa. Conviene retirar primero los componentes que se pueden separar selectivamente y evitar pasos que contaminen o pierdan el material que se desea recuperar.</p><p className="mt-3 text-sm leading-7 text-slate-300">Ejemplo: para separar hierro, arena y sal, usa primero un imán para retirar el hierro. Añade agua al resto para disolver la sal; filtra para retener la arena y evapora el filtrado para recuperar cristales de sal. La secuencia funciona porque cada paso aprovecha una propiedad distinta.</p></section>
                  <section id="concentracion" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="text-xl font-bold text-cyan-200">6. Concentración y solubilidad</h2><p className="mt-3 text-sm leading-7 text-slate-300">La concentración relaciona la cantidad de soluto con una cantidad definida de disolución o disolvente. Si se añade más soluto sin cambiar el volumen de forma importante, la disolución se concentra; si se añade disolvente, se diluye. En cálculos sencillos de concentración masa/volumen se usa <strong className="text-white">C = m/V</strong>, cuidando que las unidades sean compatibles.</p><p className="mt-3 text-sm leading-7 text-slate-300">La solubilidad no es lo mismo que la rapidez de disolución. Triturar un sólido o agitar puede acelerar cuánto tarda en disolverse, pero no necesariamente cambia la cantidad máxima que puede disolverse a una temperatura dada. La temperatura sí modifica la solubilidad de muchas sustancias, aunque no todas responden igual.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="text-sm font-bold text-cyan-100">Más soluto</h3><p className="mt-1 text-xs leading-5 text-slate-300">Aumenta la concentración si las demás condiciones se mantienen.</p></div><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="text-sm font-bold text-cyan-100">Más disolvente</h3><p className="mt-1 text-xs leading-5 text-slate-300">Diluir reduce la concentración de la disolución.</p></div><div className="border border-[#21405e] bg-[#0a1928] p-3"><h3 className="text-sm font-bold text-cyan-100">Saturación</h3><p className="mt-1 text-xs leading-5 text-slate-300">El exceso de soluto puede permanecer sin disolverse.</p></div></div></section>
                  <section id="evidencia" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5 lg:col-span-2"><h2 className="text-xl font-bold text-cyan-200">7. Del procedimiento a la evidencia</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una separación bien planeada empieza con una pregunta, define qué componente se desea recuperar y elige la propiedad física que permitirá aislarlo. Durante el procedimiento se registran cantidades, observaciones, pérdidas de material y condiciones como temperatura o tiempo.</p><p className="mt-3 text-sm leading-7 text-slate-300">En preguntas tipo Saber 11, distingue lo observado de lo inferido. Si después de filtrar el agua sigue salada, eso no demuestra que la filtración haya fallado: el filtro retiene partículas sólidas insolubles, no iones disueltos. Una conclusión científica debe ser compatible con el método empleado y con todos los datos disponibles.</p><div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4"><p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave para Saber 11</p><p className="mt-2 text-sm leading-7 text-slate-300">No elijas el método por costumbre: identifica primero los componentes, sus fases y la propiedad física que los diferencia. Si hay varios componentes, justifica cada etapa de la secuencia.</p></div></section>
                </article>
                <section id="puntos-clave" className="mt-3 scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321] p-4 sm:p-5"><h2 className="pixel-font text-sm text-amber-200">PUNTOS CLAVE</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300 sm:grid-cols-2"><li>• Una mezcla contiene varios componentes; puede ser homogénea o heterogénea.</li><li>• Soluto y disolvente forman una disolución homogénea.</li><li>• Cada método aprovecha una propiedad física concreta.</li><li>• Filtrar no separa un soluto disuelto del disolvente.</li><li>• Una mezcla compleja puede requerir una secuencia de métodos.</li><li>• Las conclusiones deben ajustarse a las observaciones y los límites del procedimiento.</li></ul></section>
              </LessonNotesSelection>
              <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5"><Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-10 items-center gap-2 border border-white/15 bg-[#26364a] px-4 py-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link><button type="button" onClick={() => {setStage("examples");window.scrollTo({top:0,behavior:"smooth"});}} className="inline-flex min-h-10 items-center gap-2 border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-100">Ver ejemplos resueltos <ArrowRight className="h-4 w-4" /></button></div>
            </div>
            <aside className="hidden space-y-3 xl:block"><section className="sticky top-20 rounded-xl border border-[#21405e] bg-[#071321] p-4"><h2 className="pixel-font text-[9px] text-cyan-200">MISIÓN DE NOVA</h2><p className="mt-2 text-xs leading-5 text-slate-300">Observa, compara y separa usando evidencia.</p><button type="button" onClick={() => setTutorOpen(true)} className="mt-3 w-full rounded-md bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-2 text-xs font-bold text-white">Pregunta a la IA</button><h3 className="pixel-font mt-5 text-[9px] text-cyan-200">EN ESTA LECCIÓN</h3><ol className="mt-3 space-y-2 text-xs text-slate-300">{["Sustancias y mezclas","Tipos de mezcla","Disoluciones","Métodos de separación","Secuencias","Concentración","Evidencia"].map((label,i)=><li key={label}><button type="button" onClick={() => document.getElementById(["sustancias-mezclas","tipos-mezcla","disoluciones","metodos-separacion","elegir-metodo","concentracion","evidencia"][i])?.scrollIntoView({behavior:"smooth",block:"start"})} className="text-left hover:text-cyan-100"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center border border-fuchsia-400/50 text-[9px] text-fuchsia-200">{i+1}</span>{label}</button></li>)}</ol></section></aside>
          </div>
        </div>
      ) : stage === "examples" ? (
        <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-6 sm:px-7">
          <section className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-7">
            <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">CAPÍTULO 03 · LABORATORIO</p>
            <h1 className="pixel-font mt-3 text-xl leading-8 text-white sm:text-2xl">Preguntas tipo Saber 11 resueltas</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">Estas preguntas son originales de PeakScore y practican competencias habituales de Ciencias Naturales: interpretar evidencia, elegir procedimientos, evaluar afirmaciones y justificar conclusiones. En cada solución aplicamos un método de lectura que puedes repetir en el examen.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="border border-cyan-200/20 bg-cyan-300/[.05] p-3"><p className="text-xs font-extrabold text-cyan-100">1. Identifica el objetivo</p><p className="mt-1 text-xs leading-5 text-slate-300">¿Qué componentes se quieren separar o qué conclusión se solicita?</p></div>
              <div className="border border-cyan-200/20 bg-cyan-300/[.05] p-3"><p className="text-xs font-extrabold text-cyan-100">2. Busca la propiedad</p><p className="mt-1 text-xs leading-5 text-slate-300">Tamaño, solubilidad, magnetismo, densidad, miscibilidad o volatilidad.</p></div>
              <div className="border border-cyan-200/20 bg-cyan-300/[.05] p-3"><p className="text-xs font-extrabold text-cyan-100">3. Descarta por evidencia</p><p className="mt-1 text-xs leading-5 text-slate-300">Elimina técnicas incompatibles con el estado físico o las propiedades descritas.</p></div>
            </div>
          </section>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 1 · Procedimientos</p><span className="border border-emerald-300/30 px-2 py-1 text-[9px] font-bold text-emerald-200">NIVEL MEDIO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">¿Cómo recuperar ambos componentes?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una muestra contiene arena y cloruro de sodio. Se agrega agua y se agita hasta que la sal se disuelve. Se necesita recuperar la arena y la sal sin transformarlas químicamente. ¿Cuál secuencia es la más adecuada?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> Filtrar y desechar tanto el residuo como el filtrado.</li><li><strong className="text-cyan-100">B.</strong> Filtrar para retener la arena y luego evaporar el agua del filtrado.</li><li><strong className="text-cyan-100">C.</strong> Usar un imán para separar la arena de la sal disuelta.</li><li><strong className="text-cyan-100">D.</strong> Tamizar la disolución y recoger la sal en la malla.</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: B</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Método profesional:</strong> subraya el objetivo doble: recuperar arena y sal. La arena es insoluble, por eso queda en el filtro; la sal disuelta atraviesa el filtro con el agua. Después, evaporar el disolvente permite recuperar la sal sólida.</p><p className="mt-2 text-sm leading-6 text-slate-300"><strong>Por qué caen los distractores:</strong> A pierde los materiales; C atribuye magnetismo a componentes que no se describen como magnéticos; D usa una malla que no retiene partículas de sal disuelta.</p></div>
            </article>
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 2 · Interpretación de evidencia</p><span className="border border-amber-300/30 px-2 py-1 text-[9px] font-bold text-amber-200">NIVEL MEDIO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">Elegir el método sin confundir fases</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Al mezclar agua y aceite, el recipiente presenta dos capas después de reposar. Un estudiante propone filtrar la mezcla. ¿Qué evaluación está mejor sustentada?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> Es correcto: el filtro retiene selectivamente el aceite disuelto.</li><li><strong className="text-cyan-100">B.</strong> Es incorrecto: ambos son líquidos inmiscibles; la decantación permite separar las fases.</li><li><strong className="text-cyan-100">C.</strong> Es correcto: el agua se convierte en vapor al atravesar el filtro.</li><li><strong className="text-cyan-100">D.</strong> Es incorrecto: solo la imantación puede separar dos líquidos.</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: B</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Método profesional:</strong> usa la evidencia clave “dos capas”: hay dos fases líquidas que no se mezclan uniformemente. Se deja reposar y se separan por decantación, aprovechando la posición de las fases y su diferencia de densidad.</p><p className="mt-2 text-sm leading-6 text-slate-300"><strong>Trampa típica:</strong> la filtración separa un sólido insoluble de un fluido, no dos líquidos miscibles o inmiscibles por sí sola.</p></div>
            </article>
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 3 · Diseño experimental</p><span className="border border-amber-300/30 px-2 py-1 text-[9px] font-bold text-amber-200">NIVEL MEDIO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">Separar dos líquidos miscibles</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una muestra contiene dos líquidos que forman una sola fase y tienen temperaturas de ebullición diferentes. Se desea recoger por separado al menos una fracción. ¿Qué procedimiento es más pertinente?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> Decantación, porque toda diferencia de densidad forma capas.</li><li><strong className="text-cyan-100">B.</strong> Filtración, porque el papel separa líquidos con distinto punto de ebullición.</li><li><strong className="text-cyan-100">C.</strong> Destilación, controlando el calentamiento y condensando el vapor.</li><li><strong className="text-cyan-100">D.</strong> Tamizado, porque las moléculas tienen tamaños diferentes.</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: C</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Método profesional:</strong> identifica que forman una sola fase: no hay capas para decantar. La destilación aprovecha diferencias de volatilidad; el vapor se conduce a un condensador y se recoge como líquido. Si sus puntos de ebullición son cercanos, suele requerirse destilación fraccionada.</p><p className="mt-2 text-sm leading-6 text-slate-300"><strong>Por qué no A:</strong> la diferencia de densidad no basta para decantar líquidos que se mezclan uniformemente.</p></div>
            </article>
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 4 · Análisis de resultados</p><span className="border border-rose-300/30 px-2 py-1 text-[9px] font-bold text-rose-200">NIVEL ALTO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">¿Qué permite concluir una cromatografía?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una mancha de tinta se deposita sobre papel. Al subir el disolvente, aparecen cuatro bandas de color a diferentes alturas. ¿Cuál conclusión se ajusta mejor a la evidencia?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> La tinta es una sustancia pura que cambia de color por el papel.</li><li><strong className="text-cyan-100">B.</strong> La tinta contiene componentes que se desplazan de manera diferente; identificarlos exige referencias.</li><li><strong className="text-cyan-100">C.</strong> Cada banda demuestra que ocurrió una reacción química.</li><li><strong className="text-cyan-100">D.</strong> La tinta contiene exactamente cuatro elementos químicos.</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: B</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Método profesional:</strong> separa observación de inferencia. La observación es que aparecen bandas distintas; esto apoya que la tinta contiene componentes con diferente afinidad por el papel y el disolvente. No basta para identificar sus nombres ni para afirmar que son elementos.</p><p className="mt-2 text-sm leading-6 text-slate-300"><strong>Clave Saber 11:</strong> la mejor conclusión no debe afirmar más de lo que los datos permiten.</p></div>
            </article>
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 5 · Cálculo e interpretación</p><span className="border border-rose-300/30 px-2 py-1 text-[9px] font-bold text-rose-200">NIVEL ALTO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">Calcular concentración masa/volumen</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Se disuelven 12 g de un soluto y el volumen final de la disolución es 300 mL. ¿Cuál es la concentración expresada en g/mL?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> 0,004 g/mL</li><li><strong className="text-cyan-100">B.</strong> 0,04 g/mL</li><li><strong className="text-cyan-100">C.</strong> 4 g/mL</li><li><strong className="text-cyan-100">D.</strong> 25 g/mL</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: B</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Resolución paso a paso:</strong> escribe la relación C = masa de soluto / volumen final. Sustituye C = 12 g / 300 mL = 0,04 g/mL. Comprueba la escala: 300 mL contienen 12 g, así que cada mililitro contiene 0,04 g.</p><p className="mt-2 text-sm leading-6 text-slate-300"><strong>Error frecuente:</strong> invertir la división o usar el volumen de agua añadido en vez del volumen final de la disolución.</p></div>
            </article>
            <article className="rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">Pregunta 6 · Selección de técnica</p><span className="border border-amber-300/30 px-2 py-1 text-[9px] font-bold text-amber-200">NIVEL MEDIO</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-white">Recuperar un sólido disuelto</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una disolución contiene un sólido no volátil disuelto en agua. Se quiere obtener el sólido y no es necesario recuperar el agua. ¿Qué técnica responde directamente al objetivo?</p>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-200"><li><strong className="text-cyan-100">A.</strong> Evaporación controlada del disolvente.</li><li><strong className="text-cyan-100">B.</strong> Filtración de la disolución transparente.</li><li><strong className="text-cyan-100">C.</strong> Sedimentación de las moléculas de soluto disueltas.</li><li><strong className="text-cyan-100">D.</strong> Imantación sin evidencia de propiedades magnéticas.</li></ol>
              <div className="mt-4 border-l-2 border-emerald-300 bg-emerald-300/[.06] p-4"><p className="font-extrabold text-emerald-200">Respuesta correcta: A</p><p className="mt-2 text-sm leading-6 text-slate-200"><strong>Método profesional:</strong> la disolución es homogénea y el soluto está a escala molecular o iónica, por lo que no queda retenido en un filtro común. Como solo se necesita el sólido, se elimina el agua por evaporación; si se buscan cristales más ordenados o una purificación, puede usarse cristalización.</p></div>
            </article>
          </div>
          <section className="mt-5 rounded-xl border border-cyan-200/20 bg-[#071321] p-5 sm:p-6">
            <h2 className="pixel-font text-sm text-cyan-100">CÓMO TRASLADAR EL MÉTODO A LOS EJERCICIOS</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">Cuando resuelvas el desafío, no memorices únicamente el nombre de cada técnica. Primero determina qué componentes hay, después qué propiedad los diferencia y finalmente si el procedimiento conserva o recupera los materiales solicitados. En preguntas de evidencia, elige la conclusión más prudente: una observación permite apoyar una idea, pero no demostrar algo que no se midió.</p>
          </section>
          <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5"><button type="button" onClick={() => {setStage("theory");window.scrollTo({top:0,behavior:"smooth"});}} className="inline-flex min-h-10 items-center gap-2 border border-white/15 bg-[#26364a] px-4 py-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver a teoría</button><button type="button" onClick={() => {setStage("practice");window.scrollTo({top:0,behavior:"smooth"});}} className="inline-flex min-h-10 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-sm font-extrabold text-[#09200a]">Ejercicios del desafío <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      )      ) : (
        <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-7 sm:px-7">
          <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Desafío del laboratorio · Pregunta {index + 1} de {activeQuestions.length}</p>
          {!finished ? (
            <section className="mt-5 border border-[#35506d] bg-[#0d1422]">
              <div className="border-b border-cyan-200/15 bg-gradient-to-br from-[#15243a] via-[#111b2c] to-[#101725] px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-cyan-200">{question.competency}</p><span className="border border-amber-200/30 bg-amber-200/[.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100">Dificultad · {question.difficulty}</span></div><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Situación problema</p>
                <p className="mt-2 border-l-[3px] border-cyan-300 bg-[#0b1422]/90 px-5 py-5 text-sm leading-7 text-slate-100 shadow-inner sm:text-[15px] sm:leading-8">{question.context}</p>
                <div className="mt-5 rounded-sm border border-cyan-200/25 bg-gradient-to-r from-cyan-300/[.08] to-[#0c1a29] p-4 sm:p-5">
                  <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center border border-amber-200/30 bg-amber-200/[.08] text-amber-100">01</span><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-cyan-100">Repaso estratégico</p><p className="mt-1 text-xs text-slate-400">Conceptos esenciales para resolver la pregunta</p></div></div>{index === 0 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Solubilidad selectiva:</strong> la sal se disuelve en agua, pero la arena no; esa diferencia permite separarlas.</p><p><strong className="text-cyan-100">Filtración:</strong> retiene arena insoluble; la sal disuelta pasa con el agua y se recupera después por evaporación.</p></div> : index === 1 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Miscibilidad:</strong> agua y aceite forman dos fases porque no se mezclan uniformemente.</p><p><strong className="text-cyan-100">Decantación:</strong> deja reposar la muestra y separa las fases aprovechando su diferencia de densidad.</p></div> : <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Cromatografía:</strong> los pigmentos avanzan distancias distintas por su diferente afinidad con el papel y el disolvente.</p><p><strong className="text-cyan-100">Evidencia:</strong> varias bandas sugieren varios componentes, pero identificarlos exige compararlos con referencias.</p></div>}
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Analiza la evidencia</p><h2 className="mt-2 text-xl font-extrabold leading-8 text-white sm:text-2xl sm:leading-9">{question.prompt}</h2><p className="mt-2 text-xs leading-5 text-slate-400">Selecciona la opción mejor sustentada. Dos ideas pueden parecer plausibles, pero solo una explica todos los datos.</p>
              </div>
              <div className="space-y-3 p-5 sm:p-7">
                {question.options.map((option) => {
                  const active = selected === option.label;
                  const right = checked && option.label === question.answer;
                  const wrong = checked && active && !isCorrect;
                  return <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`group flex w-full items-start gap-3 border p-4 text-left transition duration-150 sm:p-5 ${right ? "border-emerald-300 bg-emerald-300/10" : wrong ? "border-rose-400 bg-rose-400/10" : active ? "border-cyan-300 bg-cyan-300/10" : "border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold ${active ? "border-cyan-300 bg-cyan-300 text-[#06131b]" : "border-[#425977] bg-[#0a1220] text-slate-200"}`}>{option.label}</span>
                    <span className="pt-1 text-sm leading-6 text-slate-100">{option.text}</span>
                    {right && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-300" />}
                  </button>;
                })}
                {checked && <div aria-live="polite" className={`border p-4 ${isCorrect ? "border-emerald-300/50 bg-emerald-300/[.08]" : "border-amber-300/50 bg-amber-300/[.07]"}`}>
                  <p className="font-bold text-white">{isCorrect ? "Correcto: interpretación respaldada." : "Revisemos el razonamiento."}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{question.explanation}</p>
                </div>}
                <div className="flex justify-end border-t border-[#293d56] pt-5">
                  {!checked ? <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center gap-2 border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-sm font-bold text-cyan-100">{index === activeQuestions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>}
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-5 border border-cyan-200/25 bg-[#101725] p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-white">Desafío completado</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">Respondiste correctamente <strong className="text-cyan-100">{correct} de {activeQuestions.length}</strong> preguntas. Repasa las explicaciones y vuelve a intentarlo si quieres fortalecer tu comprensión.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={restart} className="inline-flex min-h-10 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-4 py-2 text-sm font-bold text-cyan-100">Repetir práctica <ArrowRight className="h-4 w-4" /></button>
                <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-10 items-center gap-2 border border-white/15 bg-[#26364a] px-4 py-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
              </div>
            </section>
          )}
        </div>
      )}

      <LessonAITutor
        open={tutorOpen}
        onOpenChange={setTutorOpen}
        subject="Ciencias Naturales"
        topic="Capítulo 3: El laboratorio de las mezclas. Sustancias puras, mezclas homogéneas y heterogéneas, disoluciones, solubilidad, métodos de separación, secuencias, concentración y análisis de evidencia."
        stage={stage === "practice" ? "practice" : "theory"}
        question={stage === "practice" && !finished ? question.prompt : ""}
        context={stage === "practice" && !finished
          ? "Situación: " + question.context + "\nOpciones: " + question.options.map((o) => o.label + ") " + o.text).join("\n") + "\nExplicación: " + question.explanation
          : "Ayuda al estudiante a comprender el capítulo 3 de PeakScore. Explica con rigor y ejemplos originales las técnicas de separación de mezclas (tamizado, imantación, filtración, decantación, sedimentación, centrifugación, evaporación, cristalización, destilación simple y fraccionada, cromatografía y extracción con disolvente). Pídele que identifique primero los componentes y la propiedad física que los diferencia. Si pregunta por una respuesta de un ejercicio, razona paso a paso y explica por qué los distractores no funcionan. No inventes datos que no aparezcan en el enunciado."}
      />
      {finished && lost && <div className="game-over-overlay fixed inset-x-0 bottom-0 top-[68px] z-40 flex items-center justify-center overflow-y-auto px-5 py-8 text-center" role="dialog" aria-modal="true" aria-labelledby="level3-gameover-title">
        <div className="game-over-content relative z-10 flex w-full max-w-6xl flex-col items-center text-center"><div aria-hidden="true" className="game-over-pixels pointer-events-none absolute inset-0" /><div aria-hidden="true" className="game-over-crystal-glow pointer-events-none absolute inset-0" />
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-3"><h2 id="level3-gameover-title" className="pixel-font game-over-title">GAME</h2><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova derrotado en pixel art" width={112} height={112} className="game-over-nova h-24 w-24 object-contain sm:h-36 sm:w-36 lg:h-40 lg:w-40"/><span className="pixel-font game-over-title">OVER</span></div>
          <p className="pixel-font mt-5 text-xs text-white sm:text-sm">PLAY AGAIN?</p><p className="game-over-copy mt-4 max-w-3xl text-sm font-extrabold leading-8 text-white sm:text-lg">No completaste el desafío con todas las respuestas correctas.</p><p className="game-over-copy mt-2 text-sm font-extrabold text-white sm:text-lg">Acertaste <strong className="text-cyan-300">{correct} de {activeQuestions.length}</strong> preguntas.</p><p className="game-over-copy mt-3 max-w-3xl text-sm font-bold leading-7 text-white sm:text-base sm:leading-8">Revisa los métodos de separación y vuelve a intentarlo. Cada distractor representa una idea que vale la pena comprender.</p>
          <div className="mt-6 flex w-full max-w-xl flex-col gap-2"><button type="button" onClick={restart} className="game-over-choice game-over-choice-yes"><span aria-hidden="true" className="game-over-cursor">▶</span><span>YES</span><span className="game-over-choice-detail">REPETIR CON PREGUNTAS NUEVAS</span></button><button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setStage("theory"); setFinished(false); setLost(false); setRewardOpen(false); }} className="game-over-choice game-over-choice-no"><span className="game-over-cursor game-over-cursor-hidden" aria-hidden="true">▶</span><span>NO</span><span className="game-over-choice-detail">REPASAR TEORÍA</span></button></div>
          <p className="pixel-font mt-7 text-[9px] tracking-[.1em] text-white/75 sm:mt-9 sm:text-[11px]">PEAKSCORE · CONTINÚA LA AVENTURA</p>
        </div>
      </div>}
      <XpRewardAnimation open={rewardOpen && finished && !lost} xp={60} nextLabel="SIGUIENTE NIVEL" onContinue={() => { setRewardOpen(false); window.location.href = "/aprender/santuario-de-la-materia"; }} />
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] backdrop-blur">
        <div className="mx-auto flex min-h-[62px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-7">
          <div><p className="pixel-font text-[8px] text-slate-100">NIVEL 3</p><p className="mt-1 text-[10px] text-slate-400">{stage === "theory" ? "Teoría" : stage === "examples" ? "Ejemplos resueltos" : finished ? "Práctica finalizada" : `Pregunta ${index + 1} / ${activeQuestions.length}` }</p></div>
          <div className="flex flex-1 justify-center">{stage === "practice" && !finished && <button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setTutorOpen((v) => !v); }} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 font-bold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:bg-[#ffb84d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:min-h-10 sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">AI</span></button>}</div>
          {stage === "theory" ? <button type="button" onClick={() => setStage("examples")} className="inline-flex min-h-9 items-center gap-2 border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-xs font-bold text-cyan-100">Ejemplos <ArrowRight className="h-4 w-4" /></button> : stage === "examples" ? <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Ejercicios <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-4 py-2 text-xs font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver a teoría</button>}
        </div>
      </footer>
      <style jsx global>{`
        .game-over-overlay { position: fixed; top: 68px; right: 0; bottom: 0; left: 0; z-index: 40; min-height: calc(100dvh - 68px); padding: clamp(1rem, 3vh, 2.5rem) clamp(1rem, 4vw, 3rem); background: linear-gradient(180deg, rgba(2,5,13,.32) 0%, rgba(2,5,13,.50) 48%, rgba(0,0,0,.78) 100%), url("/images/aprender/santuario/game-over-laboratorio.png") center center / cover no-repeat, #020308 !important; isolation: isolate; }
        .game-over-content { animation: game-over-enter 520ms cubic-bezier(.2,.8,.2,1) both; }
        .game-over-pixels { z-index:-2; opacity:.28; background-image: radial-gradient(circle, rgba(255,40,74,.95) 0 2px, transparent 2.8px), radial-gradient(circle, rgba(44,187,255,.8) 0 1.5px, transparent 2.4px), linear-gradient(155deg, transparent 0 42%, rgba(125,16,43,.13) 42.2% 42.7%, transparent 43% 100%); background-size:83px 91px,127px 113px,100% 100%; animation:game-over-pixel-drift 8s linear infinite; }
        .game-over-crystal-glow { z-index:-1; background:radial-gradient(ellipse at 12% 72%,rgba(255,20,58,.23),transparent 28%),radial-gradient(ellipse at 88% 72%,rgba(255,20,58,.24),transparent 29%),radial-gradient(ellipse at 50% 12%,rgba(18,113,196,.14),transparent 35%); animation:game-over-crystal-pulse 3.6s ease-in-out infinite; }
        .game-over-heading { display:flex; align-items:center; gap:.3rem; filter:drop-shadow(0 0 22px rgba(20,210,255,.2)); }
        .game-over-title { color:#f8fafc; font-size:clamp(2.7rem,9.8vw,8rem); line-height:1.12; letter-spacing:-.065em; text-shadow:5px 5px 0 #155e75,9px 9px 0 #0b1220,0 0 30px rgba(34,211,238,.32); }
        .game-over-nova { image-rendering:pixelated; filter:drop-shadow(0 0 20px rgba(132,204,22,.42)); animation:game-over-nova-idle 2.2s steps(2,end) infinite; }
        .game-over-choice { position:relative; display:flex; width:100%; min-height:42px; align-items:center; justify-content:center; gap:.65rem; padding:.7rem .9rem; color:#e2e8f0; background:transparent; border:0; font-family:var(--font-press-start),"Press Start 2P",monospace; font-size:10px; letter-spacing:.04em; text-align:center; transition:color 140ms ease,transform 140ms ease,text-shadow 140ms ease; }
        .game-over-choice:hover,.game-over-choice:focus-visible { color:#a5f3fc; transform:translateX(3px); outline:none; text-shadow:0 0 14px rgba(34,211,238,.4); }
        .game-over-choice-yes { color:#a5f3fc; } .game-over-cursor { color:#22d3ee; font-size:11px; } .game-over-cursor-hidden { opacity:0; }
        .game-over-choice-detail { margin-left:.2rem; color:#94a3b8; font-family:Arial,Helvetica,sans-serif; font-size:clamp(13px,1.1vw,16px); font-weight:700; letter-spacing:.02em; }
        .game-over-copy { font-family:var(--font-press-start),"Press Start 2P",monospace !important; font-size:clamp(9px,1vw,13px) !important; font-weight:900 !important; line-height:2.15 !important; color:#fff !important; text-shadow:1px 1px 0 #080d18,2px 2px 0 rgba(0,0,0,.96),0 0 5px rgba(0,0,0,.95); }
        @keyframes game-over-enter { from {opacity:0;transform:translateY(10px) scale(.97)} to {opacity:1;transform:translateY(0) scale(1)} }
        @keyframes game-over-pixel-drift { from {background-position:8px 12px,42px 57px,center} to {background-position:91px 103px,-85px 170px,center} }
        @keyframes game-over-crystal-pulse { 0%,100% {opacity:.72;transform:scale(1)} 50% {opacity:1;transform:scale(1.025)} }
        @keyframes game-over-nova-idle { 0%,100% {transform:translateY(0)} 50% {transform:translateY(-3px)} }
        @media(max-width:640px) { .game-over-title {letter-spacing:-.075em;font-size:clamp(2.2rem,10.5vw,4.8rem)} .game-over-content {padding-top:1rem;padding-bottom:1rem} .game-over-choice {min-height:62px;font-size:12px;flex-wrap:wrap} .game-over-choice-detail {flex-basis:100%;margin-left:0;font-size:13px} }
        @media(prefers-reduced-motion:reduce) { .game-over-content,.game-over-pixels,.game-over-nova {animation:none!important} }
      `}</style>
    </main>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Lightbulb, Plus } from "lucide-react";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";
import { supabase } from "@/lib/supabase/client";

type Question = {
  difficulty: "Media" | "Difícil";
  competency: string;
  context: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    difficulty: "Media",
    competency: "Explicación de fenómenos",
    context: "En el Santuario, Nova coloca una pequeña cantidad de hielo en un recipiente cerrado y lo deja calentarse. El hielo se convierte en agua líquida. No se observa ninguna otra sustancia y el sistema se mantiene a presión aproximadamente constante.",
    prompt: "¿Cuál explicación describe mejor lo ocurrido a nivel de partículas?",
    options: [
      { label: "A", text: "Las moléculas de agua se destruyeron y luego aparecieron moléculas nuevas." },
      { label: "B", text: "Las moléculas siguen siendo H₂O, pero cambia su organización y aumenta su capacidad de desplazarse unas respecto de otras." },
      { label: "C", text: "Las partículas dejaron de interactuar por completo al pasar a líquido." },
      { label: "D", text: "El agua líquida contiene necesariamente más masa que el hielo original." },
    ],
    answer: "B",
    explanation: "La fusión es un cambio físico: las moléculas siguen siendo H₂O. Al absorber energía, el sistema puede reorganizar sus partículas y permitir mayor movilidad relativa. Las interacciones no desaparecen en el líquido, y el cambio de estado no crea masa de la nada."
  },
  {
    difficulty: "Media",
    competency: "Uso comprensivo del conocimiento científico",
    context: "Dos recipientes rígidos contienen la misma cantidad de una sustancia gaseosa a la misma temperatura. El recipiente A tiene un volumen de 2 L y el recipiente B un volumen de 4 L. Se supone comportamiento aproximadamente ideal y se comparan en equilibrio térmico.",
    prompt: "¿Qué afirmación es coherente con el modelo de gas ideal?",
    options: [
      { label: "A", text: "En el recipiente A, la presión será aproximadamente el doble que en B." },
      { label: "B", text: "En el recipiente B, las partículas dejan de moverse porque tienen más espacio." },
      { label: "C", text: "Ambos recipientes deben tener exactamente la misma presión porque contienen la misma sustancia." },
      { label: "D", text: "La temperatura se duplica automáticamente al duplicar el volumen." },
    ],
    answer: "A",
    explanation: "Para una cantidad fija de gas ideal a temperatura constante, la presión es inversamente proporcional al volumen (ley de Boyle). Reducir el volumen de 4 L a 2 L duplica aproximadamente la presión. La sustancia y la temperatura no bastan para fijar la presión si cambia el volumen."
  },
  {
    difficulty: "Difícil",
    competency: "Indagación y evaluación de evidencia",
    context: "Un equipo calienta una sustancia pura a presión constante y registra estos datos: de 20 °C a 60 °C, la muestra permanece sólida; entre 60 °C y 60 °C durante varios minutos, parte del sólido se transforma en líquido mientras continúa el calentamiento; después, la temperatura vuelve a aumentar.",
    prompt: "¿Cuál interpretación explica mejor la meseta de temperatura alrededor de 60 °C?",
    options: [
      { label: "A", text: "El termómetro dejó de funcionar necesariamente, porque al suministrar energía la temperatura siempre debe subir." },
      { label: "B", text: "La sustancia dejó de recibir energía durante el cambio de estado." },
      { label: "C", text: "La energía transferida durante la meseta se utiliza principalmente en el cambio de estado, en vez de elevar la temperatura." },
      { label: "D", text: "La muestra se convirtió obligatoriamente en una sustancia química diferente." },
    ],
    answer: "C",
    explanation: "Durante el cambio de estado de una sustancia pura a presión constante, la energía transferida puede emplearse en modificar la organización y las interacciones entre partículas. Por eso la temperatura permanece aproximadamente constante mientras coexisten las fases. La meseta no demuestra por sí sola una falla del instrumento ni una reacción química."
  }
];

const retryQuestions: Question[] = [
  {
    difficulty: "Media", competency: "Explicación de fenómenos",
    context: "En el Santuario, una muestra de una sustancia pura pasa de líquido a gas al recibir energía. El equipo mantiene la presión aproximadamente constante y no detecta productos nuevos.",
    prompt: "¿Cuál interpretación está mejor respaldada por el modelo de partículas?",
    options: [
      { label: "A", text: "Las partículas dejan de tener cualquier interacción al convertirse en gas." },
      { label: "B", text: "La sustancia necesariamente se descompuso porque cambió de estado." },
      { label: "C", text: "Las partículas ganan movilidad y se separan más, pero la identidad química de la sustancia se conserva." },
      { label: "D", text: "La masa de la muestra aumenta porque el gas ocupa más espacio." }
    ], answer: "C",
    explanation: "La vaporización es un cambio físico. Las partículas tienen mayor libertad de movimiento y suelen estar más separadas, pero eso no implica que desaparezcan todas las interacciones ni que se forme otra sustancia."
  },
  {
    difficulty: "Media", competency: "Uso comprensivo del conocimiento científico",
    context: "Una jeringa sellada contiene una cantidad fija de gas. A temperatura constante, el volumen disminuye de 6 L a 3 L y no hay fugas.",
    prompt: "Según el modelo de gas ideal, ¿qué cambio se espera en la presión absoluta?",
    options: [
      { label: "A", text: "Se duplica aproximadamente, porque las partículas chocan más frecuentemente con las paredes." },
      { label: "B", text: "Se reduce a la mitad, porque hay menos espacio para que las partículas se muevan." },
      { label: "C", text: "Permanece idéntica, ya que la temperatura no cambió." },
      { label: "D", text: "Se vuelve cero, porque las partículas ya no pueden desplazarse." }
    ], answer: "A",
    explanation: "Para una cantidad fija de gas ideal a temperatura constante, P₁V₁ = P₂V₂. Si el volumen se reduce a la mitad, la presión absoluta se duplica aproximadamente."
  },
  {
    difficulty: "Difícil", competency: "Indagación y evaluación de evidencia",
    context: "Al calentar una sustancia pura a presión constante, un equipo registra que la temperatura aumenta de 18 °C a 48 °C, se mantiene alrededor de 48 °C mientras coexisten dos fases y después vuelve a aumentar.",
    prompt: "¿Qué conclusión se puede extraer con mayor rigor de estos datos?",
    options: [
      { label: "A", text: "El equipo demuestra que el termómetro se dañó justo cuando apareció la segunda fase." },
      { label: "B", text: "La temperatura constante demuestra que dejó de transferirse energía al sistema." },
      { label: "C", text: "La sustancia cambió su composición química porque coexistieron dos fases." },
      { label: "D", text: "La meseta es compatible con energía transferida al cambio de fase, sin un aumento apreciable de temperatura durante ese intervalo." }
    ], answer: "D",
    explanation: "Durante un cambio de estado de una sustancia pura a presión constante, la energía transferida puede emplearse en transformar la fase. La meseta por sí sola no demuestra una falla del instrumento ni una reacción química."
  }
];

function ImageUploadSlot({ assetKey, title, description, compact=false }: { assetKey:string; title:string; description:string; compact?:boolean }) {
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

 return <div className={"relative flex " + (compact?"min-h-[144px]":"min-h-[260px]") + " w-full flex-col items-center justify-center gap-2 overflow-hidden bg-transparent text-center"}>
  {picker}
  {imageUrl ? (
   isAdmin ? <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={saving} title="Pulsa la imagen para cambiarla" aria-label={"Cambiar imagen de " + title} className="group relative flex w-full items-center justify-center bg-transparent disabled:cursor-wait">
    <img src={imageUrl} alt={description} className={"w-full object-contain " + (compact?"max-h-36":"max-h-[520px]")}/>
    {saving && <span className="absolute inset-x-1 bottom-1 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-cyan-100">Guardando imagen…</span>}
   </button> : <img src={imageUrl} alt={description} className={"w-full object-contain " + (compact?"max-h-32":"max-h-[340px]")}/>
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

export default function CuandoLaMateriaCambiaPage() {
  const [stage, setStage] = useState<"theory" | "practice">("theory");
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
          <span className="pixel-font text-[8px] text-cyan-200">NIVEL 2 · QUÍMICA</span>
        </div>
      </header>

      {stage === "theory" ? (
        <div className="mx-auto max-w-[1600px] px-3 pt-4 sm:px-5 sm:pt-5">
          <section className="relative flex min-h-[180px] items-center overflow-hidden rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:min-h-[210px] sm:p-7" style={{backgroundImage:"linear-gradient(90deg,rgba(3,9,20,.96),rgba(3,9,20,.72) 55%,rgba(3,9,20,.12)),url('/images/aprender/santuario/cuando-la-materia-cambia.png')",backgroundSize:"cover",backgroundPosition:"center"}}>
            <div className="max-w-[720px]"><span className="pixel-font rounded border border-cyan-400 px-2 py-1 text-[8px] text-cyan-200">CAPÍTULO 02 · QUÍMICA</span><h1 className="pixel-font mt-4 text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">Cuando la materia cambia</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">Explora cómo la organización y el movimiento de las partículas explican los estados sólido, líquido y gaseoso; interpreta los cambios de estado con evidencia sobre energía, temperatura y presión.</p></div>
          </section>
          <nav aria-label="Secciones de la lección" className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-[#21405e] bg-[#071321] p-1 text-center sm:grid-cols-4">
            <button type="button" onClick={() => window.scrollTo({top:0,behavior:"smooth"})} className="rounded-lg border border-cyan-300 bg-cyan-500/30 px-2 py-3 text-xs font-bold text-white sm:text-sm">Teoría</button>
            <button type="button" onClick={() => document.getElementById("ejemplos-resueltos")?.scrollIntoView({behavior:"smooth",block:"start"})} className="rounded-lg px-2 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white sm:text-sm">Ejemplos</button>
            <button type="button" onClick={() => document.getElementById("puntos-clave")?.scrollIntoView({behavior:"smooth",block:"start"})} className="rounded-lg px-2 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white sm:text-sm">Puntos clave</button>
            <button type="button" onClick={() => { setTutorOpen(false); setStage("practice"); }} className="rounded-lg px-2 py-3 text-xs font-semibold text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-100 sm:text-sm">Ejercicios</button>
          </nav>
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_316px]">
            <div className="min-w-0">
          <LessonNotesSelection sourceTitle="Nivel 2: Cuando la materia cambia" sourcePath="/aprender/santuario-de-la-materia/leccion/2">
            <section className="mt-8 overflow-hidden border border-white/[.09] bg-[#0b101b]">
              <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((v) => !v)} className="flex w-full items-center justify-between bg-[#131824] px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/[.04]">
                Historia: el registro de Nova
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
              </button>
              {historyOpen && <div className="space-y-4 px-5 py-5 text-sm leading-7 text-slate-300">
                <p>Una corriente de aire recorre la cámara y hace vibrar los cristales. Junto a una columna, Nova descubre un recipiente con hielo y un registro de temperatura. La superficie empieza a humedecerse y, poco después, aparece agua líquida.</p>
                <p>«Si el cristal cambió de forma, ¿significa que dejó de ser la misma sustancia?», se pregunta. El registro no habla de magia: indica que la muestra recibió energía. Para resolver el misterio, Nova debe conectar lo que puede observar con un modelo de lo que sucede a escala de partículas.</p>
                <p className="border-l-2 border-cyan-300/70 bg-cyan-300/[.045] px-4 py-3 text-cyan-100">Tu misión: explicar los estados de la materia usando evidencia, no solo la apariencia de los cristales.</p>
              </div>}
            </section>

            <section id="modelos-particulas" className="mt-3 scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
              <h2 className="pixel-font text-sm leading-6 text-white sm:text-base">El laboratorio de los estados</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Compara los tres modelos. La imagen ayuda a visualizar el comportamiento, pero la explicación científica depende también de las propiedades observadas y de las condiciones del sistema.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[#14517a] bg-[#071a2d] p-3"><h3 className="text-sm font-bold text-cyan-100">Sólido</h3><ImageUploadSlot assetKey="cuando-la-materia-cambia/estado-solido" title="Estado sólido" description="Modelo de partículas en un sólido: próximas y organizadas, vibrando alrededor de posiciones."/><p className="text-xs leading-5 text-slate-300">Conserva forma y volumen definidos; sus partículas vibran, pero no se desplazan libremente unas entre otras.</p></div>
                <div className="rounded-lg border border-[#14517a] bg-[#071a2d] p-3"><h3 className="text-sm font-bold text-cyan-100">Líquido</h3><ImageUploadSlot assetKey="cuando-la-materia-cambia/estado-liquido" title="Estado líquido" description="Modelo de partículas de un líquido, próximas pero capaces de reorganizarse y deslizarse."/><p className="text-xs leading-5 text-slate-300">Mantiene un volumen aproximadamente definido y adopta la forma del recipiente.</p></div>
                <div className="rounded-lg border border-[#14517a] bg-[#071a2d] p-3"><h3 className="text-sm font-bold text-cyan-100">Gas</h3><ImageUploadSlot assetKey="cuando-la-materia-cambia/estado-gaseoso" title="Estado gaseoso" description="Modelo de partículas de un gas, muy separadas y con movimiento libre y desordenado."/><p className="text-xs leading-5 text-slate-300">Se expande para ocupar el recipiente y puede comprimirse con facilidad.</p></div>
              </div>
              <p className="mt-3 border-l-2 border-cyan-300 bg-cyan-300/[.045] px-3 py-2 text-xs leading-5 text-cyan-100">Solo el administrador puede subir o reemplazar las ilustraciones. Al guardarlas en Supabase, se publican para todos los usuarios.</p>
            </section>

            <article className="mt-3 grid gap-3 lg:grid-cols-2">
              <section id="estado-general" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                <h2 className="text-xl font-bold text-cyan-200">1. ¿Qué significa que la materia tenga distintos estados?</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">La materia está constituida por partículas —átomos, moléculas o iones— que interactúan entre sí. El estado físico que observamos depende de las condiciones del sistema, como la temperatura y la presión, y de la naturaleza de las partículas y de sus interacciones. En condiciones habituales estudiamos los estados sólido, líquido y gaseoso.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">No basta con decir que un sólido es «duro» o que un gas «no se ve». Estas descripciones no explican por qué se comportan de manera diferente. Para comprenderlo, debemos relacionar las propiedades macroscópicas —forma, volumen y compresibilidad— con la organización y el movimiento microscópico de sus partículas.</p>
              </section>

              <section id="solidos" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                <h2 className="text-xl font-bold text-cyan-200">2. Sólidos: estructura y estabilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un sólido, las partículas suelen permanecer próximas y sus interacciones limitan su desplazamiento. Vibran alrededor de posiciones de equilibrio y, por eso, el material conserva normalmente su forma y volumen. En sólidos cristalinos existe un patrón de organización que se repite; en sólidos amorfos, como ciertos vidrios, no hay el mismo orden de largo alcance.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La estabilidad de un sólido no significa que sus partículas estén inmóviles. Si aumenta la temperatura, suele aumentar la amplitud de sus vibraciones. Cuando las condiciones permiten la fusión, la estructura deja de mantener el orden rígido característico del sólido y las partículas pueden reorganizarse con mayor libertad.</p>
              </section>

              <section id="liquidos" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                <h2 className="text-xl font-bold text-cyan-200">3. Líquidos: proximidad con movilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un líquido, las partículas continúan estando próximas, pero pueden cambiar de vecinas y desplazarse unas respecto de otras. Las interacciones siguen siendo importantes: por eso los líquidos mantienen un volumen aproximadamente definido y muestran poca compresibilidad en comparación con los gases. Sin embargo, no conservan una forma propia y adoptan la del recipiente.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La fluidez no significa que las partículas estén separadas como en un gas. La diferencia clave es que, en el líquido, la distancia entre partículas continúa siendo relativamente pequeña y las interacciones permiten tanto cohesión como movimiento.</p>
              </section>

              <section id="gases" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                <h2 className="text-xl font-bold text-cyan-200">4. Gases: movimiento y compresibilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un gas, las partículas están mucho más separadas que en un sólido o un líquido y se desplazan de forma continua y desordenada. Chocan entre sí y contra las paredes del recipiente. La presión se relaciona con esos choques; la temperatura, en el modelo cinético, con la energía cinética media de las partículas.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">Como hay mucho espacio disponible entre las partículas, un gas puede comprimirse de manera considerable. Si la cantidad de gas y la temperatura se mantienen constantes, reducir el volumen aumenta la frecuencia de los choques contra las paredes y, por tanto, la presión. Esta relación se conoce como ley de Boyle para un gas ideal o para sistemas que se aproximan a ese comportamiento.</p>
                <div className="mt-4 border border-cyan-200/20 bg-[#101725] p-4">
                  <p className="text-sm font-bold text-cyan-100">Conexión matemática</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">A temperatura constante y para una cantidad fija de gas ideal: P₁V₁ = P₂V₂. Si el volumen se reduce a la mitad, la presión absoluta se duplica aproximadamente. Esta predicción solo es válida bajo las condiciones asumidas; los gases reales pueden desviarse del modelo, especialmente a presiones altas o temperaturas cercanas a la condensación.</p>
                </div>
              </section>

              <section id="comparacion-estados" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5 lg:col-span-2">
                <h2 className="text-xl font-bold text-cyan-200">5. Comparación de los tres estados</h2>
                <div className="mt-4 overflow-x-auto border border-[#344a66] bg-[#0b1320] p-3 sm:p-4">
                  <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                    <thead><tr><th className="border border-[#405873] bg-[#1a2b40] px-3 py-3 text-cyan-100">Propiedad</th><th className="border border-[#405873] bg-[#1a2b40] px-3 py-3 text-cyan-100">Sólido</th><th className="border border-[#405873] bg-[#1a2b40] px-3 py-3 text-cyan-100">Líquido</th><th className="border border-[#405873] bg-[#1a2b40] px-3 py-3 text-cyan-100">Gas</th></tr></thead>
                    <tbody>
                      <tr className="bg-[#0c1624]"><td className="border border-[#293d56] px-3 py-3">Forma</td><td className="border border-[#293d56] px-3 py-3">Propia</td><td className="border border-[#293d56] px-3 py-3">Adopta el recipiente</td><td className="border border-[#293d56] px-3 py-3">Ocupa el recipiente</td></tr>
                      <tr className="bg-[#101c2c]"><td className="border border-[#293d56] px-3 py-3">Volumen</td><td className="border border-[#293d56] px-3 py-3">Definido</td><td className="border border-[#293d56] px-3 py-3">Aproximadamente definido</td><td className="border border-[#293d56] px-3 py-3">Variable</td></tr>
                      <tr className="bg-[#0c1624]"><td className="border border-[#293d56] px-3 py-3">Compresibilidad</td><td className="border border-[#293d56] px-3 py-3">Muy baja</td><td className="border border-[#293d56] px-3 py-3">Baja</td><td className="border border-[#293d56] px-3 py-3">Alta</td></tr>
                      <tr className="bg-[#101c2c]"><td className="border border-[#293d56] px-3 py-3">Movimiento</td><td className="border border-[#293d56] px-3 py-3">Vibración y movimientos locales</td><td className="border border-[#293d56] px-3 py-3">Desplazamiento relativo</td><td className="border border-[#293d56] px-3 py-3">Movimiento libre y desordenado</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">Es un modelo general: las propiedades reales dependen de la sustancia y de las condiciones. Por ejemplo, un sólido amorfo no tiene la misma estructura microscópica que un cristal, aunque ambos conserven su forma.</p>
              </section>

              <section id="energia-cambios" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5">
                <h2 className="text-xl font-bold text-cyan-200">6. Temperatura, energía y cambios de estado</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">La temperatura no es lo mismo que el calor. La temperatura caracteriza el estado térmico; el calor es energía transferida entre sistemas por una diferencia de temperatura. Cuando una muestra recibe energía, puede aumentar su temperatura o experimentar un cambio de estado, según las condiciones.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">Durante la fusión de una sustancia pura a presión constante, la temperatura puede permanecer aproximadamente estable mientras coexisten sólido y líquido. La energía transferida se utiliza en el cambio de estado y en la reorganización de las partículas, no simplemente en aumentar su energía cinética media. Más adelante, la curva de calentamiento permitirá estudiar este fenómeno cuantitativamente.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La fusión y la solidificación, la vaporización y la condensación, y la sublimación y la deposición son pares de transformaciones opuestas. En estos procesos físicos la composición química de la sustancia se conserva, aunque cambien el estado y las propiedades macroscópicas.</p>
              </section>

              <section id="ejemplos-resueltos" className="scroll-mt-24 rounded-xl border border-cyan-200/25 bg-[#0a1929] p-4 sm:p-5 lg:col-span-2"><h2 className="pixel-font text-sm leading-6 text-white">Ejemplos resueltos</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-[#14517a] bg-[#071321] p-4"><p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Ejemplo 1 · Cambio de estado</p><p className="mt-2 text-sm leading-6 text-slate-200">Una muestra de hielo se calienta hasta convertirse en agua líquida. No se detecta otra sustancia.</p><p className="mt-3 text-sm font-bold text-white">Razonamiento</p><p className="mt-1 text-sm leading-6 text-slate-300">La fusión es un cambio físico: las moléculas siguen siendo H₂O. La energía transferida permite reorganizar las partículas; no implica que se destruyan y vuelvan a formarse.</p></div><div className="rounded-lg border border-[#14517a] bg-[#071321] p-4"><p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Ejemplo 2 · Presión y volumen</p><p className="mt-2 text-sm leading-6 text-slate-200">Un gas ideal ocupa 4 L a 100 kPa. A temperatura constante se comprime hasta 2 L. ¿Cuál es la presión final?</p><p className="mt-3 text-sm font-bold text-white">Solución</p><p className="mt-1 text-sm leading-6 text-slate-300">P₁V₁ = P₂V₂; entonces P₂ = (100 kPa × 4 L) / 2 L = <strong className="text-cyan-100">200 kPa</strong>. Al reducir el volumen a la mitad, la presión se duplica aproximadamente, bajo las condiciones del modelo.</p></div></div></section><section id="evidencia-cientifica" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5 lg:col-span-2">
                <h2 className="text-xl font-bold text-cyan-200">7. Del modelo a la evidencia experimental</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">Una explicación científica debe conectar un modelo con observaciones. Si un gas se comprime y su temperatura se mantiene aproximadamente constante, el aumento de presión concuerda con el modelo cinético y con la ley de Boyle. Si un sólido se funde y se obtiene el mismo compuesto en estado líquido, la observación es compatible con un cambio físico. Ninguna de estas conclusiones debe ampliarse más allá de los datos disponibles.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">En Saber 11 pueden pedirte identificar variables, predecir qué ocurriría al modificar una condición, interpretar una tabla o evaluar cuál conclusión está respaldada. Antes de responder, determina qué se mantuvo constante, qué variable cambió y si la evidencia distingue realmente entre las explicaciones posibles.</p>
                <div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave para Saber 11</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">No afirmes que las partículas se destruyen, que la materia desaparece o que se formó una sustancia nueva solo porque cambió la apariencia. Usa el modelo de partículas y la evidencia experimental para justificar la explicación.</p>
                </div>
              </section>

              <section className="border border-cyan-200/20 bg-cyan-200/[.035] p-5">
                <h2 className="text-lg font-bold text-cyan-100">Antes de entrar al desafío</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">Debes poder explicar por qué un sólido conserva su forma, por qué un líquido fluye, por qué un gas se comprime y cómo la energía se relaciona con los cambios de estado. No memorices únicamente la tabla: relaciona cada propiedad con el movimiento y las interacciones de las partículas.</p>
              </section>
            </article>
          </LessonNotesSelection>
            </div>
            <aside className="space-y-3 xl:sticky xl:top-[76px] xl:self-start">
              <section className="overflow-hidden rounded-xl border border-[#21405e] bg-[#071321] p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-2xl">🔬</div><div><p className="pixel-font text-[9px] text-cyan-200">MISIÓN DE NOVA</p><p className="mt-1 text-xs leading-5 text-slate-200">Observa, compara y explica usando evidencia.</p></div></div><button type="button" onClick={() => setTutorOpen((v) => !v)} className="mt-3 w-full rounded-lg border border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-3 text-xs font-extrabold text-white transition hover:brightness-110">Pregunta a la IA</button>{tutorOpen && <div className="mt-3"><LessonAITutor subject="Ciencias Naturales" topic="Nivel 2: estados de la materia, modelo cinético-molecular y cambios de estado" stage="theory" open={tutorOpen} onOpenChange={setTutorOpen} /></div>}</section>
              <section className="rounded-xl border border-[#21405e] bg-[#071321] p-4"><h2 className="pixel-font text-[9px] text-cyan-200">EN ESTA LECCIÓN</h2><div className="mt-3 space-y-2 text-xs">{[["1","Estados de la materia","estado-general"],["2","Sólidos","solidos"],["3","Líquidos","liquidos"],["4","Gases","gases"],["5","Comparación","comparacion-estados"],["6","Temperatura y cambios","energia-cambios"],["7","Ejemplos resueltos","ejemplos-resueltos"],["8","Evidencia científica","evidencia-cientifica"]].map(([number,label,id]) => <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"})} className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-slate-200 transition hover:bg-cyan-300/[.07] hover:text-cyan-100"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-fuchsia-400/50 bg-fuchsia-500/10 text-[10px] font-bold text-white">{number}</span><span>{label}</span></button>)}</div></section>
              <section id="puntos-clave" className="scroll-mt-24 rounded-xl border border-[#21405e] bg-[#071321] p-4"><h2 className="pixel-font text-[9px] text-amber-300">PUNTOS CLAVE</h2><ul className="mt-3 space-y-3 text-xs leading-5 text-slate-200"><li className="flex gap-2"><span className="text-cyan-300">◉</span><span>El estado depende del movimiento, la organización y las interacciones de las partículas.</span></li><li className="flex gap-2"><span className="text-cyan-300">◉</span><span>Sólido: forma y volumen definidos; líquido: volumen definido y forma variable; gas: se expande y se comprime.</span></li><li className="flex gap-2"><span className="text-cyan-300">◉</span><span>Temperatura y calor no son lo mismo: el calor es energía transferida.</span></li><li className="flex gap-2"><span className="text-cyan-300">◉</span><span>Un cambio de estado suele ser físico: no prueba que se haya formado otra sustancia.</span></li><li className="flex gap-2"><span className="text-cyan-300">◉</span><span>Para un gas ideal a temperatura constante: P₁V₁ = P₂V₂.</span></li></ul></section>
            </aside>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 bg-[#26364a] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-[#33465e]"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
            <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-11 items-center justify-center gap-2 border border-emerald-300/60 bg-[#75df55] px-5 py-3 text-sm font-extrabold text-[#09200a] shadow-[0_2px_0_#3a9a2b] hover:bg-[#8ced6d]">Iniciar desafío · 3 preguntas <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[980px] px-4 pb-24 pt-7 sm:px-7">
          <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Desafío del Santuario · Pregunta {index + 1} de {activeQuestions.length}</p>
          {!finished ? (
            <section className="mt-5 border border-[#35506d] bg-[#0d1422]">
              <div className="border-b border-[#293d56] bg-[#121d30] px-5 py-4">
                <p className="text-xs font-semibold text-cyan-200">{question.competency} · {question.difficulty}</p>
                <p className="mt-4 border-l-[3px] border-cyan-300 bg-[#15243a] px-4 py-4 text-sm leading-7 text-slate-100">{question.context}</p>
                <div className="mt-5 border border-cyan-200/20 bg-[#0c1a29] p-4">
                  <p className="pixel-font text-[8px] leading-5 text-cyan-200">PUNTOS CLAVE DE LA TEORÍA</p>
                  {index === 0 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Modelo de partículas:</strong> en el sólido, las partículas vibran alrededor de posiciones; en el líquido siguen próximas, pero pueden desplazarse unas respecto de otras.</p><p><strong className="text-cyan-100">Cambio físico:</strong> durante la fusión se conserva la identidad de las moléculas de agua. Cambiar de estado no demuestra que haya nacido una sustancia nueva.</p></div> : index === 1 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Ley de Boyle:</strong> para una cantidad fija de gas ideal a temperatura constante, P₁V₁ = P₂V₂.</p><p><strong className="text-cyan-100">Interpretación:</strong> al reducir el volumen, aumentan los choques de las partículas contra las paredes y sube la presión; la temperatura constante no implica presión constante.</p></div> : <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Temperatura y calor:</strong> la temperatura describe el estado térmico; el calor es energía transferida por una diferencia de temperatura.</p><p><strong className="text-cyan-100">Meseta térmica:</strong> durante el cambio de estado de una sustancia pura a presión constante, la energía transferida puede emplearse en transformar la fase sin elevar la temperatura.</p></div>}
                </div>
                <h2 className="mt-5 text-lg font-bold leading-8 text-white sm:text-xl">{question.prompt}</h2>
              </div>
              <div className="space-y-3 p-5 sm:p-7">
                {question.options.map((option) => {
                  const active = selected === option.label;
                  const right = checked && option.label === question.answer;
                  const wrong = checked && active && !isCorrect;
                  return <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`flex w-full items-start gap-3 border p-4 text-left transition ${right ? "border-emerald-300 bg-emerald-300/10" : wrong ? "border-rose-400 bg-rose-400/10" : active ? "border-cyan-300 bg-cyan-300/10" : "border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60"}`}>
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
          {!finished && <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={`Nivel 2: estados de la materia, modelo cinético-molecular y cambios de estado`} stage="practice" question={question.prompt} context={`Situación: ${question.context}\nOpciones: ${question.options.map((o) => `${o.label}) ${o.text}`).join("\n")}\nExplicación: ${question.explanation}`} />}
        </div>
      )}

      {finished && lost && <div className="game-over-overlay fixed inset-x-0 bottom-0 top-[68px] z-40 flex items-center justify-center overflow-y-auto px-5 py-8 text-center" role="dialog" aria-modal="true" aria-labelledby="level2-gameover-title">
        <div className="game-over-content relative z-10 flex w-full max-w-6xl flex-col items-center text-center"><div aria-hidden="true" className="game-over-pixels pointer-events-none absolute inset-0" /><div aria-hidden="true" className="game-over-crystal-glow pointer-events-none absolute inset-0" />
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-3"><h2 id="level2-gameover-title" className="pixel-font game-over-title">GAME</h2><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova derrotado en pixel art" width={112} height={112} className="game-over-nova h-24 w-24 object-contain sm:h-36 sm:w-36 lg:h-40 lg:w-40"/><span className="pixel-font game-over-title">OVER</span></div>
          <p className="pixel-font mt-5 text-xs text-white sm:text-sm">PLAY AGAIN?</p><p className="game-over-copy mt-4 max-w-3xl text-sm leading-8 text-white sm:text-lg">No lograste acertar las tres preguntas de este desafío.</p><p className="game-over-copy mt-2 text-sm font-medium text-white sm:text-lg">Acertaste <strong className="text-cyan-300">{correct} de {activeQuestions.length}</strong> preguntas.</p><p className="game-over-copy mt-3 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base sm:leading-8">Revisa los puntos clave de la teoría y vuelve a intentarlo. Cada distractor representa una idea que vale la pena comprender.</p>
          <div className="mt-6 flex w-full max-w-xl flex-col gap-2"><button type="button" onClick={restart} className="game-over-choice game-over-choice-yes"><span aria-hidden="true" className="game-over-cursor">▶</span><span>YES</span><span className="game-over-choice-detail">REPETIR CON PREGUNTAS NUEVAS</span></button><button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setStage("theory"); setFinished(false); setLost(false); setRewardOpen(false); }} className="game-over-choice game-over-choice-no"><span className="game-over-cursor game-over-cursor-hidden" aria-hidden="true">▶</span><span>NO</span><span className="game-over-choice-detail">REPASAR TEORÍA</span></button></div>
          <p className="pixel-font mt-7 text-[9px] tracking-[.1em] text-white/75 sm:mt-9 sm:text-[11px]">PEAKSCORE · CONTINÚA LA AVENTURA</p>
        </div>
      </div>}
      <XpRewardAnimation open={rewardOpen && finished && !lost} xp={60} nextLabel="SIGUIENTE NIVEL" onContinue={() => { setRewardOpen(false); window.location.href = "/aprender/santuario-de-la-materia"; }} />
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] backdrop-blur">
        <div className="mx-auto flex min-h-[62px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-7">
          <div><p className="pixel-font text-[8px] text-slate-100">NIVEL 2</p><p className="mt-1 text-[10px] text-slate-400">{stage === "theory" ? "Teoría" : finished ? "Práctica finalizada" : `Pregunta ${index + 1} / ${questions.length}`}</p></div>
          <div className="flex flex-1 justify-center">{stage === "practice" && !finished && <button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setTutorOpen((v) => !v); }} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 font-bold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:bg-[#ffb84d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:min-h-10 sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">AI</span></button>}</div>
          {stage === "theory" ? <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Ir a la práctica <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-4 py-2 text-xs font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver a teoría</button>}
        </div>
      </footer>
      <style jsx global>{`
        .game-over-overlay { position: fixed; top: 68px; right: 0; bottom: 0; left: 0; z-index: 40; min-height: calc(100dvh - 68px); padding: clamp(1rem, 3vh, 2.5rem) clamp(1rem, 4vw, 3rem); background: linear-gradient(180deg, rgba(2,5,13,.32) 0%, rgba(2,5,13,.50) 48%, rgba(0,0,0,.78) 100%), url("/images/game-over-bg.png") center center / cover no-repeat, #020308 !important; isolation: isolate; }
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
        .game-over-copy { font-family:var(--font-press-start),"Press Start 2P",monospace !important; font-size:clamp(9px,1vw,13px) !important; line-height:2.15 !important; text-shadow:0 2px 8px rgba(0,0,0,.95); }
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

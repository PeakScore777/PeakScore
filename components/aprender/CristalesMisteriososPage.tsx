"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus } from "lucide-react";

const questions = [
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "Nova compara dos piezas del mismo cristal a temperatura constante. La pieza A tiene una masa de 18 g y un volumen de 6 cm³; la pieza B tiene una masa de 36 g y un volumen de 12 cm³.",
    prompt: "¿Qué conclusión está mejor respaldada por los datos?",
    options: [
      ["A", "La pieza B tiene necesariamente mayor densidad porque su masa es mayor."],
      ["B", "Ambas piezas tienen densidad de 3 g/cm³, aunque sus masas y volúmenes sean distintos."],
      ["C", "La densidad es una propiedad extensiva porque depende del tamaño de la pieza."],
      ["D", "No se puede comparar la densidad sin conocer primero el color de las piezas."]
    ],
    answer: "B",
    explanation: "La densidad se calcula como ρ = m/V. Para A: 18 g ÷ 6 cm³ = 3 g/cm³. Para B: 36 g ÷ 12 cm³ = 3 g/cm³. La masa y el volumen se duplican, pero su razón permanece constante. Por eso la densidad es intensiva para una muestra homogénea en las mismas condiciones."
  },
  {
    competency: "Explicación de fenómenos",
    context: "Una muestra de agua pura se enfría hasta formar hielo. El sistema está cerrado y no hay pérdida de material. En el proceso, la muestra cambia de estado, pero no se detectan sustancias nuevas.",
    prompt: "¿Cuál interpretación es científicamente más adecuada?",
    options: [
      ["A", "Es un cambio químico porque el hielo tiene forma distinta del agua líquida."],
      ["B", "Es un cambio físico: las moléculas siguen siendo H₂O, aunque cambian su organización y movilidad."],
      ["C", "La masa desaparece porque el sólido ocupa un volumen diferente."],
      ["D", "Las moléculas de agua se convierten en átomos de hidrógeno y oxígeno."]
    ],
    answer: "B",
    explanation: "La congelación es un cambio físico. Las moléculas siguen siendo H₂O; cambia la organización microscópica y el movimiento de las partículas. En un sistema cerrado se conserva la masa. Una diferencia de forma o estado, por sí sola, no demuestra que se haya producido una sustancia nueva."
  },
  {
    competency: "Indagación y evaluación de evidencia",
    context: "El equipo recibe un sólido cristalino desconocido. Quiere decidir si es una sustancia pura o una mezcla. Solo ha observado que es transparente, brillante y quebradizo.",
    prompt: "¿Qué plan produciría evidencia más confiable para clasificar la muestra?",
    options: [
      ["A", "Clasificarla como pura porque tiene un aspecto uniforme."],
      ["B", "Probarla con la lengua y comparar su sabor con sustancias conocidas."],
      ["C", "Tomar una muestra segura, registrar propiedades medibles y realizar pruebas controladas de composición o separación apropiadas."],
      ["D", "Romperla en fragmentos; si todos se ven iguales, queda demostrado que es pura."]
    ],
    answer: "C",
    explanation: "El aspecto uniforme no basta: una mezcla homogénea también puede parecer uniforme. Una indagación válida formula un procedimiento reproducible, controla variables, registra mediciones y emplea métodos apropiados y seguros. Por ejemplo, se puede estudiar el comportamiento de fusión o separar componentes mediante una técnica adecuada, sin probar ni tocar sustancias desconocidas."
  },
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "Un laboratorio debe elegir un material con densidad menor que 3,0 g/cm³ y punto de fusión superior a 600 °C. La ficha de A indica 2,7 g/cm³ y 660 °C; la de B, 7,9 g/cm³ y 1.538 °C. Las mediciones se hicieron en condiciones comparables.",
    prompt: "¿Qué decisión satisface simultáneamente los dos criterios?",
    options: [
      ["A", "Elegir A, porque cumple ambos límites de la ficha."],
      ["B", "Elegir B, porque una temperatura de fusión más alta basta aunque falle la densidad."],
      ["C", "Elegir cualquiera, porque densidad y fusión son propiedades extensivas."],
      ["D", "No se puede comparar, porque ambas propiedades dependen solo de la masa de la muestra."]
    ],
    answer: "A",
    explanation: "Evalúa cada condición por separado y luego en conjunto. A tiene una densidad inferior a 3,0 g/cm³ y funde por encima de 600 °C. B cumple el criterio térmico, pero su densidad supera el límite. En una pregunta con varias restricciones, la respuesta debe cumplirlas todas."
  },
  {
    competency: "Indagación y evaluación de evidencia",
    context: "A presión constante, la temperatura de la muestra A permanece cerca de 78 °C durante la ebullición; en la muestra B aumenta gradualmente de 71 °C a 83 °C. El termómetro se verificó y el procedimiento fue igual para ambas.",
    prompt: "¿Cuál conclusión es más prudente a partir del registro?",
    options: [
      ["A", "A muestra un comportamiento más compatible con una sustancia pura durante la ebullición; se requieren pruebas adicionales para confirmar su composición."],
      ["B", "A es necesariamente un elemento químico porque la temperatura no cambió."],
      ["C", "B es una sustancia pura porque su temperatura cambia continuamente."],
      ["D", "Las dos muestras tienen idéntica composición porque ambas hierven."]
    ],
    answer: "A",
    explanation: "Bajo presión constante, una sustancia pura suele hervir a una temperatura característica; una mezcla puede hacerlo en un intervalo. El patrón de A es compatible con ese modelo, pero una sola observación no demuestra por sí sola que sea pura ni identifica sus componentes."
  }
];

const retryQuestions = [
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "Un laboratorio compara tres materiales homogéneos y debe escoger uno con densidad menor que 3 g/cm³, punto de fusión superior a 600 °C y punto de ebullición superior a 2.000 °C. Los datos son: A (2,70; 660; 2.470), B (7,87; 1.538; 2.862) y C (0,79; −114; 78), en las unidades indicadas.",
    prompt: "¿Qué muestra cumple simultáneamente las tres condiciones?",
    options: [
      ["A", "La muestra A, porque satisface cada límite indicado."],
      ["B", "La muestra B, porque sus temperaturas son las más altas."],
      ["C", "La muestra C, porque tiene la menor densidad."],
      ["D", "Las tres, porque al menos una propiedad de cada una coincide."]
    ],
    answer: "A",
    explanation: "La muestra A tiene densidad inferior a 3 g/cm³ y sus dos temperaturas superan los límites. B incumple la condición de densidad; C incumple los límites de temperatura. En preguntas con restricciones múltiples, verifica todos los criterios para una misma muestra."
  },
  {
    competency: "Indagación y evaluación de evidencia",
    context: "Nova repite tres veces una medición del punto de fusión de una muestra: obtiene 81,0 °C, 81,2 °C y 80,9 °C. En el cuaderno solo figura que el sólido es blanco y cristalino.",
    prompt: "¿Cuál es la conclusión más rigurosa con estos datos?",
    options: [
      ["A", "La muestra es pura sin ninguna duda porque sus mediciones son parecidas."],
      ["B", "Los resultados muestran una transición reproducible cerca de 81 °C, pero se requieren referencias y otras pruebas para identificar la composición."],
      ["C", "El color blanco demuestra que todos los cristales contienen la misma sustancia."],
      ["D", "Las pequeñas diferencias prueban que ocurrió una reacción química."]
    ],
    answer: "B",
    explanation: "Las mediciones próximas apoyan que el resultado es reproducible dentro de la variación observada. Sin embargo, ni el color ni un único intervalo identifican por sí solos la sustancia o prueban su pureza. Se requieren referencias fiables, condiciones controladas y evidencias complementarias."
  },
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "Para comparar la densidad de dos piezas, una estudiante mide la masa en una balanza y el volumen mediante un procedimiento adecuado. P tiene 45 g y 15 cm³; Q tiene 30 g y 10 cm³.",
    prompt: "¿Qué interpretación relaciona correctamente ambas mediciones?",
    options: [
      ["A", "P tiene mayor densidad porque tiene más masa."],
      ["B", "Q tiene mayor densidad porque su volumen es menor."],
      ["C", "Ambas tienen densidad de 3 g/cm³, aunque sus masas y volúmenes son distintos."],
      ["D", "La densidad es 0,33 g/cm³ en P y 0,33 g/cm³ en Q."]
    ],
    answer: "C",
    explanation: "Para P, ρ = 45/15 = 3 g/cm³; para Q, ρ = 30/10 = 3 g/cm³. La densidad es una propiedad intensiva: si composición y condiciones son comparables, masa y volumen pueden cambiar en la misma proporción y la razón se conserva. Tener la misma densidad no demuestra por sí solo que dos muestras sean idénticas."
  }
] as const;

const notes = [
  ["Materia y sistema", "La materia tiene masa y ocupa espacio. Un sistema material es la porción del universo que se delimita para estudiarla; el entorno es lo que queda fuera."],
  ["Propiedades extensivas e intensivas", "Masa y volumen dependen de la cantidad de muestra. Densidad y temperatura no dependen directamente de ella, aunque sí pueden variar con las condiciones."],
  ["Densidad", "ρ = m/V. Usa unidades coherentes y compara muestras bajo condiciones equivalentes. La densidad no es lo mismo que masa, peso o tamaño."],
  ["Sustancias y mezclas", "Una sustancia pura tiene composición definida; una mezcla contiene dos o más sustancias. La uniformidad visual no demuestra pureza."]
] as const;

function ImageUploadSlot({ assetKey, title, description, compact = false }: { assetKey: string; title: string; description: string; compact?: boolean }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Formato no válido. Usa PNG, JPG, WebP o GIF."); return;
    }
    if (file.size > 8 * 1024 * 1024) { setError("La imagen debe pesar máximo 8 MB."); return; }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Inicia sesión con la cuenta administradora.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== "admin") throw new Error("Solo el administrador puede gestionar estas imágenes.");

      const { data: previousAsset, error: previousAssetError } = await supabase.from("lesson_media_assets").select("storage_path").eq("asset_key", assetKey).maybeSingle();
      if (previousAssetError) throw previousAssetError;
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const safeExtension = /^[a-z0-9]{1,8}$/.test(extension) ? extension : "png";
      const path = assetKey + "/" + crypto.randomUUID() + "." + safeExtension;
      const { error: uploadError } = await supabase.storage.from("lesson-atom-media").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw new Error("No se pudo subir a Supabase Storage: " + uploadError.message);
      uploadedPath = path;
      const { data: urlData } = supabase.storage.from("lesson-atom-media").getPublicUrl(path);
      const { error: saveError } = await supabase.from("lesson_media_assets").upsert({
        asset_key: assetKey, public_url: urlData.publicUrl, storage_path: path, updated_by: user.id, updated_at: new Date().toISOString()
      }, { onConflict: "asset_key" });
      if (saveError) throw new Error("El archivo se subió, pero no se pudo guardar en la base de datos: " + saveError.message);
      setImageUrl(urlData.publicUrl);
      setNotice("Imagen guardada en Supabase y compartida con todos los usuarios.");
      uploadedPath = null;
      const previousPath = previousAsset?.storage_path;
      if (previousPath && previousPath !== path) {
        const { error: cleanupError } = await supabase.storage.from("lesson-atom-media").remove([previousPath]);
        if (cleanupError) console.warn("La imagen anterior requiere limpieza:", cleanupError.message);
      }
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

  return (
    <div className={"relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-transparent text-center " + (compact ? "min-h-[112px]" : "min-h-[240px]")}>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={"Seleccionar imagen para " + title} className="hidden" disabled={!isAdmin || saving} onChange={e => { void uploadSelectedFile(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
      {imageUrl ? (
        isAdmin ? (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving} title="Pulsa la imagen para cambiarla" aria-label={"Cambiar imagen de " + title} className="group relative flex w-full items-center justify-center bg-transparent disabled:cursor-wait">
            <Image src={imageUrl} width={1200} height={800} unoptimized alt={description} className={"w-full object-contain " + (compact ? "max-h-28" : "max-h-[400px]")} />
            {saving && <span className="absolute inset-x-1 bottom-1 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-cyan-100">Guardando imagen…</span>}
          </button>
        ) : <Image src={imageUrl} width={1200} height={800} unoptimized alt={description} className={"w-full object-contain " + (compact ? "max-h-28" : "max-h-[400px]")} />
      ) : isAdmin ? (
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving || loading} className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 bg-transparent px-2 py-4 text-cyan-100 transition hover:bg-cyan-400/[.03] disabled:cursor-wait disabled:opacity-60" title={"Añadir imagen de " + title}>
          {saving ? <span className="animate-pulse text-sm">Subiendo…</span> : <><Plus className={(compact ? "h-7 w-7" : "h-9 w-9") + " text-cyan-200"} /><span className="pixel-font text-[9px] leading-tight">AÑADIR IMAGEN</span></>}
          <span className="text-[10px] text-cyan-200">{saving ? "Guardando automáticamente en Supabase" : "Solo admin · pulsa para subir"}</span>
        </button>
      ) : (
        <div className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 bg-transparent px-2 py-4">
          <span className="pixel-font text-[9px] text-cyan-100">{loading ? "CARGANDO IMAGEN" : "IMAGEN EN PREPARACIÓN"}</span>
        </div>
      )}
      {saving && imageUrl && <span className="text-[10px] font-bold text-cyan-200">Guardando automáticamente en Supabase…</span>}
      {notice && <p role="status" className="text-[10px] text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="max-w-full break-words text-[10px] text-rose-300">{error}</p>}
    </div>
  );
}

export default function CristalesMisteriososPage() {
  const [view, setView] = useState<"theory" | "examples" | "practice">("theory");
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const activeQuestions = attempt === 0 ? questions : retryQuestions;
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [reward, setReward] = useState(false);
  const q = activeQuestions[index];
  const correct = choice === q.answer;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!hash) return;
      if (hash === "ejemplos") {
        setView("examples");
        return;
      }
      if (hash === "desafio") {
        setAttempt(0); setIndex(0); setChoice(null); setChecked(false); setScore(0);
        setDone(false); setReward(false); setView("practice");
        return;
      }
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function sound(file: string, volume = 0.2) {
    if (typeof window === "undefined") return;
    const audio = new Audio("/sounds/" + file);
    audio.volume = volume;
    void audio.play().catch(() => {});
  }
  function startPractice() { setAttempt(0); setIndex(0); setChoice(null); setChecked(false); setScore(0); setDone(false); setReward(false); }
  function restart() { setAttempt(n => n + 1); setIndex(0); setChoice(null); setChecked(false); setScore(0); setDone(false); setReward(false); }
  function check() { if (!choice || checked) return; setChecked(true); if (correct) setScore(s => s + 1); }
  function next() {
    if (index < activeQuestions.length - 1) { sound("navigation.mp3", 0.16); setIndex(i => i + 1); setChoice(null); setChecked(false); return; }
    setDone(true);
    if (score === activeQuestions.length) { setReward(true); sound("level-win.mp3", 0.25); } else sound("game-over.wav", 0.3);
  }

  const navButton = (label: string, active: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick} className={"rounded-lg px-2 py-3 text-[11px] font-bold transition sm:text-sm " + (active ? "border border-cyan-300 bg-cyan-500/30 text-white" : "border border-transparent text-slate-300 hover:bg-white/[.04] hover:text-white")}>{label}</button>
  );

  return (
    <main className="min-h-screen bg-[#05070b] text-[#f0f4fa]">
      {view !== "practice" || !done ? (
        <div className="min-h-screen pb-24">
          <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between gap-3 border-b border-[#20334b] bg-[#070d17]/95 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3 text-xs text-slate-300"><Link href="/aprender/santuario-de-la-materia" className="hidden sm:inline hover:text-cyan-100">Santuario de la Materia</Link><span>›</span><strong className="text-cyan-200">Capítulo 01</strong><span>·</span><span className="truncate">Los cristales misteriosos</span></div>
            <div className="flex items-center gap-2"><span className="pixel-font text-[8px] text-slate-200">NIVEL 1</span><span className="h-2 w-14 overflow-hidden rounded-full bg-white/10 sm:w-24"><span className="block h-full rounded-full bg-emerald-300" style={{width:view==="theory"?"30%":view==="examples"?"65%":done?"100%":`${30+((index+(checked?1:0))/activeQuestions.length)*70}%`}}/></span></div>
          </header>
          {view === "theory" ? (
            <div className="mx-auto grid max-w-[1600px] gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_316px]">
              <div className="min-w-0">
                <section className="relative flex min-h-[166px] items-center overflow-hidden rounded-xl border border-[#21405e] bg-[#071321] p-5 sm:p-7" style={{backgroundImage:"linear-gradient(90deg,rgba(3,9,20,.96),rgba(3,9,20,.72) 55%,rgba(3,9,20,.12)),url('/images/aprender/santuario/misterio-cristales.png')",backgroundSize:"cover",backgroundPosition:"center"}}>
                  <div className="max-w-[680px]"><span className="pixel-font rounded border border-cyan-400 px-2 py-1 text-[8px] text-cyan-200">CAPÍTULO 01</span><h1 className="pixel-font mt-3 text-2xl text-white sm:text-3xl">Los cristales misteriosos</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-100">Investiga la materia como una científica: observa propiedades, compara mediciones y construye explicaciones con evidencia.</p></div>
                </section>
                <nav className="mt-2 grid grid-cols-4 rounded-xl border border-[#21405e] bg-[#071321] p-1">{navButton("Teoría",true,()=>setView("theory"))}{navButton("Ejemplos",false,()=>setView("examples"))}{navButton("Puntos clave",false,()=>document.getElementById("puntos-clave")?.scrollIntoView({behavior:"smooth"}))}{navButton("Ejercicios",false,()=>{startPractice();setView("practice")})}</nav>
                <div className="mt-3 space-y-3">
                  <section id="materia-intro" className="grid gap-4 rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5 lg:grid-cols-[minmax(0,.9fr)_minmax(300px,1.1fr)] lg:items-center"><div><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">1</span>¿Qué es la materia?</h2><p className="mt-3 text-sm leading-6 text-slate-200"><strong className="text-cyan-100">La materia es todo aquello que tiene masa y ocupa espacio.</strong> Está formada por partículas —átomos, moléculas o iones— cuya organización y movimiento ayudan a explicar sus propiedades observables.</p><p className="mt-3 text-sm leading-6 text-slate-300">Un cristal, el agua y el aire son sistemas materiales. Que algo no sea visible no significa que no sea materia: el aire, por ejemplo, tiene masa y ocupa el volumen del recipiente que lo contiene.</p><div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[.05] p-3"><h3 className="text-xs font-bold text-cyan-100">Sistema y entorno</h3><p className="mt-1 text-xs leading-5 text-slate-300">El <strong>sistema</strong> es la porción que decides estudiar; el <strong>entorno</strong> es lo que queda fuera. Si investigas un cubo de hielo en un vaso, el hielo es tu sistema y el vaso, el aire y la mesa pueden formar parte del entorno, según la pregunta.</p></div><p className="mt-3 text-xs leading-5 text-slate-300"><strong className="text-cyan-100">Ojo con la masa y el peso:</strong> la masa se mide en gramos o kilogramos y no cambia por trasladar la muestra; el peso es una fuerza gravitatoria y se mide en newtons. En preguntas científicas, no los uses como sinónimos.</p></div><ImageUploadSlot assetKey="cristales-misteriosos/materia" title="Materia" description="Ilustración de muestras de materia del santuario."/></section>
                  <section id="estados-materia" className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">2</span>Estados de la materia y modelo de partículas</h2><p className="mt-3 text-sm leading-6 text-slate-300">En un sólido las partículas vibran alrededor de posiciones relativamente fijas; en un líquido permanecen próximas pero pueden reorganizarse; en un gas están mucho más separadas y se desplazan libremente. El estado depende de la sustancia y de condiciones como temperatura y presión.</p><div className="mt-4 grid gap-3 md:grid-cols-3">{[["Sólido","Forma y volumen definidos en condiciones ordinarias.","cristales-misteriosos/solido"],["Líquido","Volumen definido; adopta la forma del recipiente.","cristales-misteriosos/liquido"],["Gas","No tiene forma ni volumen propios; se expande en el recipiente.","cristales-misteriosos/gas"]].map(([title,body,key])=><section key={key} className="rounded-lg border border-[#14517a] bg-[#071a2d] p-3"><h3 className="text-sm font-bold text-cyan-100">{title}</h3><ImageUploadSlot compact assetKey={key} title={title} description={"Ilustración del estado "+title.toLowerCase()+" de la materia."}/><p className="text-xs leading-5 text-slate-300">{body}</p></section>)}</div><p className="mt-3 text-xs leading-5 text-amber-100">Precisión: no todas las sustancias siguen exactamente el mismo comportamiento; el plasma y otros estados requieren condiciones específicas y un modelo más amplio.</p></section>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <section id="propiedades-generales" className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">3</span>Propiedades generales y cantidad de materia</h2><p className="mt-3 text-sm leading-6 text-slate-300">Las propiedades generales ayudan a describir una muestra, pero no suelen identificar por sí solas una sustancia. La masa cuantifica la inercia de un cuerpo y se mide en kg; el volumen expresa el espacio ocupado y puede medirse en m³, L o cm³.</p><div className="mt-3 grid grid-cols-2 gap-2">{[["Masa","Magnitud extensiva"],["Volumen","Magnitud extensiva"],["Inercia","Resistencia a cambiar el movimiento"],["Impenetrabilidad","Dos cuerpos no ocupan simultáneamente la misma región del espacio en el modelo clásico"]].map(([title,body])=><div key={title} className="border border-[#14517a] bg-[#081b2e] p-3"><h3 className="text-xs font-bold text-cyan-100">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-300">{body}</p></div>)}</div><div className="mt-3 border border-cyan-300/20 bg-cyan-300/[.05] p-3 text-xs leading-5 text-slate-300"><strong className="text-cyan-100">Extensivas e intensivas.</strong> Las extensivas cambian con la cantidad de muestra (masa, volumen); las intensivas no dependen directamente de ella (densidad, temperatura o punto de fusión bajo condiciones definidas).</div><div className="mt-3 rounded-lg border border-[#2b4a69] bg-[#0a1b2d] p-3"><h3 className="text-xs font-bold text-cyan-100">Cómo medir el volumen de un sólido irregular</h3><p className="mt-2 text-xs leading-5 text-slate-300">Si una piedra no tiene forma geométrica regular, puedes usar desplazamiento de agua: registra el volumen inicial en una probeta, sumerge la piedra por completo sin salpicar y registra el volumen final. El volumen de la piedra es la diferencia entre ambas lecturas. No uses este método con materiales que se disuelvan, reaccionen con el agua o la absorban de manera importante.</p><div className="mt-2 border-l-2 border-fuchsia-300 bg-fuchsia-300/[.05] px-3 py-2 text-xs leading-5 text-slate-200"><strong>Ejemplo:</strong> el agua pasa de 40 mL a 57 mL. El sólido ocupa 57 − 40 = 17 mL, equivalentes a 17 cm³. Si su masa es 34 g, su densidad media es 34 ÷ 17 = 2 g/cm³.</div></div><p className="mt-3 text-xs leading-5 text-amber-100"><strong>Razonamiento tipo Saber 11:</strong> si se duplica la cantidad de una muestra homogénea, masa y volumen se duplican; la densidad no tiene por qué duplicarse. Para comparar datos, verifica unidades, condiciones y si el instrumento mide con precisión suficiente.</p></section>
                    <section id="propiedades-especificas" className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">4</span>Propiedades específicas: comparar para identificar</h2><p className="mt-3 text-sm leading-6 text-slate-300">Las propiedades específicas ayudan a diferenciar materiales si se miden con métodos adecuados y condiciones comparables. Algunas son físicas —densidad, solubilidad, conductividad, dureza y punto de fusión— y otras químicas —reactividad, inflamabilidad o tendencia a oxidarse—.</p><ImageUploadSlot assetKey="cristales-misteriosos/propiedades" title="Propiedades" description="Comparación visual de propiedades físicas de cristales."/><div className="grid gap-2 sm:grid-cols-2">{[["Densidad","ρ = m/V; masa por unidad de volumen."],["Solubilidad","Cantidad máxima que se disuelve bajo condiciones definidas."],["Dureza","Resistencia a ser rayado; no equivale a tenacidad."],["Punto de fusión","Temperatura de transición sólido-líquido a una presión dada."]].map(([title,body])=><div key={title} className="border border-[#14517a] bg-[#081b2e] p-3"><h3 className="text-xs font-bold text-cyan-100">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-300">{body}</p></div>)}</div><div className="mt-3 rounded-lg border border-[#2b4a69] bg-[#0a1b2d] p-3"><p className="text-xs font-bold text-cyan-100">Ejemplo cuantitativo</p><p className="mt-2 text-xs leading-5 text-slate-300">Una muestra de 45 g ocupa 15 cm³. Su densidad media es ρ = 45/15 = 3 g/cm³. Si se toma la mitad de una muestra homogénea, su masa y volumen se reducen aproximadamente a la mitad, pero su densidad se mantiene.</p></div></section>
                  </div>
                  <section id="clasificacion-materia" className="rounded-xl border border-[#21405e] bg-[#071321]/95 p-4 sm:p-5"><h2 className="pixel-font flex items-center gap-3 text-sm text-white"><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-fuchsia-400 bg-fuchsia-500/10 text-lg">5</span>Clasificación de la materia: sustancias puras y mezclas</h2><p className="mt-3 text-sm leading-6 text-slate-300">Una sustancia pura tiene composición definida y propiedades características bajo condiciones especificadas. Puede ser un elemento (un tipo de átomo) o un compuesto (elementos combinados químicamente en proporciones definidas). Una mezcla contiene dos o más sustancias que conservan su identidad química y pueden separarse mediante procesos físicos adecuados.</p><ImageUploadSlot assetKey="cristales-misteriosos/clasificacion" title="Clasificación de la materia" description="Diagrama visual de sustancias puras, compuestos y mezclas."/><div className="grid gap-3 md:grid-cols-2"><div className="border border-fuchsia-300/30 bg-fuchsia-500/[.05] p-4"><h3 className="font-bold text-fuchsia-200">Sustancias puras</h3><p className="mt-2 text-sm leading-6 text-slate-300">Composición definida. Ejemplos: cobre elemental (Cu), agua pura (H₂O) y cloruro de sodio puro (NaCl). Un compuesto no es una mezcla: sus elementos están unidos químicamente.</p></div><div className="border border-cyan-300/30 bg-cyan-500/[.05] p-4"><h3 className="font-bold text-cyan-200">Mezclas</h3><p className="mt-2 text-sm leading-6 text-slate-300">Composición variable. Las homogéneas tienen una sola fase observable a escala macroscópica (como agua con sal disuelta); las heterogéneas presentan regiones o fases distinguibles (como agua y aceite).</p></div></div><div className="mt-3 border border-amber-200/25 bg-amber-200/[.04] p-3 text-xs leading-5 text-slate-300"><strong className="text-amber-100">Método científico:</strong> observa, plantea una pregunta, formula una hipótesis comprobable, controla variables, mide, registra incertidumbres y contrasta la conclusión con la evidencia. La apariencia uniforme no demuestra por sí sola que una muestra sea pura.</div></section>
                </div>
              </div>
              <aside className="hidden space-y-3 xl:block">
                <section className="rounded-xl border border-[#21405e] bg-[#071321] p-3"><div className="flex gap-3"><div className="w-[95px] shrink-0"><ImageUploadSlot compact assetKey="cristales-misteriosos/nova" title="Nova" description="Nova en el Santuario de la Materia."/></div><p className="self-center rounded-lg border border-[#29415c] bg-[#101d30] p-3 text-xs leading-5 text-slate-200">Observa, mide y compara: una buena explicación necesita datos, no solo una impresión visual.</p></div><button type="button" onClick={() => setTutorOpen(true)} className="mt-3 w-full rounded-lg border border-fuchsia-300 bg-gradient-to-b from-fuchsia-500 to-violet-700 px-3 py-3 text-sm font-extrabold text-white">Pregunta a la IA</button></section>
                <section className="rounded-xl border border-[#21405e] bg-[#071321] p-3"><h2 className="pixel-font text-[10px] text-cyan-100">EN ESTA LECCIÓN</h2><div className="mt-3 space-y-1">{[["¿Qué es la materia?","materia-intro"],["Estados de la materia","estados-materia"],["Propiedades generales","propiedades-generales"],["Propiedades específicas","propiedades-especificas"],["Clasificación","clasificacion-materia"]].map(([title,id],i)=><button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"})} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-[#12243a]"><span className="flex h-7 w-7 items-center justify-center rounded-md border border-fuchsia-400/40 bg-fuchsia-400/10">{i+1}</span>{title}</button>)}</div></section>
                <section id="puntos-clave" className="rounded-xl border border-[#21405e] bg-[#071321] p-4"><h2 className="pixel-font text-[10px] text-amber-300">PUNTOS CLAVE</h2><ul className="mt-3 space-y-3 text-xs leading-5 text-slate-300">{["La materia tiene masa y ocupa espacio.","Masa y volumen son extensivas; densidad es intensiva.","ρ = m/V: usa unidades coherentes.","Las sustancias puras tienen composición definida; las mezclas, variable.","Una observación no equivale automáticamente a una explicación."].map(s=><li key={s} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300"/>{s}</li>)}</ul></section>
              </aside>
            </div>
          ) : view === "examples" ? (
            <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-7"><p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">SANTUARIO DE LA MATERIA · EJEMPLOS RESUELTOS</p><h1 className="mt-3 text-2xl font-extrabold text-white">Aprende a investigar la materia</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Ejemplos desarrollados paso a paso con cálculos, clasificación y evaluación de evidencia.</p><div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo 1 · Densidad</p><h2 className="mt-3 text-lg font-bold text-white">Una muestra tiene 54 g de masa y 18 cm³ de volumen. Calcula su densidad y explica qué significa.</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> Identifica los datos: m = 54 g y V = 18 cm³.</p><p><strong className="text-cyan-200">Paso 2.</strong> Aplica la relación ρ = m/V: ρ = 54 g ÷ 18 cm³ = 3 g/cm³.</p><p><strong className="text-cyan-200">Paso 3.</strong> Interpreta: cada centímetro cúbico de esa muestra tiene una masa de 3 g. Para identificar el material, compara con referencias fiables y controla temperatura y pureza.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> la densidad media es 3 g/cm³; el dato aislado no demuestra por sí solo la identidad química.</div></div></section>
              <section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo 2 · Clasificación</p><h2 className="mt-3 text-lg font-bold text-white">Un líquido transparente se evapora y deja cristales blancos. ¿Se puede afirmar que era una sustancia pura?</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> Separa observación de inferencia: el residuo sólido es una observación, no una identificación definitiva.</p><p><strong className="text-cyan-200">Paso 2.</strong> Una explicación posible es que el líquido fuera una disolución y que al evaporarse el disolvente quedara el soluto.</p><p><strong className="text-cyan-200">Paso 3.</strong> Se requieren pruebas adicionales, controles y, si procede, análisis de composición para descartar otras explicaciones.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> no; el residuo es compatible con una disolución, pero no basta para determinar la composición inicial.</div></div></section>
              <section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo 3 · Propiedad intensiva</p><h2 className="mt-3 text-lg font-bold text-white">Una muestra homogénea se divide en tres partes iguales. ¿Qué ocurre con la masa, el volumen y la densidad?</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> La masa y el volumen son extensivos: cada fragmento tendrá aproximadamente un tercio de los valores originales.</p><p><strong className="text-cyan-200">Paso 2.</strong> La densidad es la razón m/V. Si composición, temperatura y presión se mantienen, ambas magnitudes disminuyen en la misma proporción.</p><p><strong className="text-cyan-200">Paso 3.</strong> Por eso la razón se conserva: (m/3)/(V/3) = m/V.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> masa y volumen disminuyen; la densidad permanece igual bajo las condiciones indicadas.</div></div></section>

<section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo 4 · Comparar propiedades</p><h2 className="mt-3 text-lg font-bold text-white">Un laboratorio necesita un material con densidad inferior a 3 g/cm³, punto de fusión superior a 600 °C y punto de ebullición superior a 2.000 °C. ¿Qué muestra cumple todos los criterios?</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[460px] border-collapse text-left text-xs text-slate-200"><thead><tr className="bg-[#15243a] text-cyan-100"><th className="border border-[#344a66] p-2">Muestra</th><th className="border border-[#344a66] p-2">Densidad (g/cm³)</th><th className="border border-[#344a66] p-2">Fusión (°C)</th><th className="border border-[#344a66] p-2">Ebullición (°C)</th></tr></thead><tbody><tr><td className="border border-[#344a66] p-2">A</td><td className="border border-[#344a66] p-2">2,70</td><td className="border border-[#344a66] p-2">660</td><td className="border border-[#344a66] p-2">2.470</td></tr><tr><td className="border border-[#344a66] p-2">B</td><td className="border border-[#344a66] p-2">7,87</td><td className="border border-[#344a66] p-2">1.538</td><td className="border border-[#344a66] p-2">2.862</td></tr><tr><td className="border border-[#344a66] p-2">C</td><td className="border border-[#344a66] p-2">0,79</td><td className="border border-[#344a66] p-2">−114</td><td className="border border-[#344a66] p-2">78</td></tr></tbody></table></div><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> Convierte cada condición en un filtro: densidad menor que 3; fusión mayor que 600; ebullición mayor que 2.000.</p><p><strong className="text-cyan-200">Paso 2.</strong> B falla por su densidad; C falla por sus temperaturas. A satisface los tres requisitos.</p><p><strong className="text-cyan-200">Paso 3.</strong> La misma muestra debe cumplir todas las condiciones; no basta con que cada criterio coincida con una muestra distinta.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> la muestra A es la única respaldada por la tabla.</div></div></section>
<section className="border border-[#35506d] bg-[#0d1422] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Ejemplo 5 · Medir con precisión</p><h2 className="mt-3 text-lg font-bold text-white">Se necesitan transferir exactamente 20,0 mL de una disolución en varias repeticiones. ¿Qué instrumento es el más adecuado?</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-200">Paso 1.</strong> Se necesita tomar un volumen fijo y conocido con buena precisión, no medir una masa ni estimar un volumen.</p><p><strong className="text-cyan-200">Paso 2.</strong> Una pipeta aforada de 20,0 mL está calibrada para entregar ese volumen. Una probeta suele ser menos precisa, un vaso de precipitados ofrece volúmenes aproximados y una balanza mide masa.</p><p><strong className="text-cyan-200">Paso 3.</strong> Para comparar resultados, usa el mismo procedimiento y condiciones equivalentes en cada repetición.</p><div className="border border-emerald-300/30 bg-emerald-300/[.07] p-3"><strong className="text-emerald-200">Conclusión:</strong> elige una pipeta aforada de 20,0 mL; el instrumento debe corresponder a la medición que exige el experimento.</div></div></section>

            </div></div>
          ) : (
            <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-7"><p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">DESAFÍO DEL SANTUARIO · PREGUNTA {index + 1} DE {activeQuestions.length}</p><h1 className="mt-3 text-2xl font-extrabold text-white">Investiga las muestras del santuario</h1><div className="mt-5 grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><aside className="border border-[#2f465f] bg-[#121e30] p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Repaso estratégico</p>{notes.map(n => <section key={n[0]} className="mt-4 border-t border-white/10 pt-4 first:border-0 first:pt-0"><h2 className="text-sm font-bold text-white">{n[0]}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{n[1]}</p></section>)}</aside><section className="overflow-hidden border border-[#35506d] bg-[#0d1422]"><div className="border-b border-[#293d56] bg-[#121d30] p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">{q.competency}</p><p className="mt-4 border-l-[3px] border-cyan-300 bg-[#0b1524] px-4 py-4 text-sm leading-7 text-slate-100">{q.context}</p><h2 className="mt-5 text-lg font-extrabold leading-8 text-white sm:text-xl">{q.prompt}</h2><p className="mt-2 text-xs text-slate-400">Selecciona la opción mejor respaldada por los datos.</p></div><div className="space-y-3 p-5 sm:p-7">{q.options.map(([label, text]) => { const active = choice === label; const right = checked && label === q.answer; const wrong = checked && active && !correct; const style = right ? "border-emerald-300 bg-emerald-300/10" : wrong ? "border-rose-400 bg-rose-400/10" : active ? "border-cyan-300 bg-cyan-300/10" : "border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60"; return <button key={label} type="button" disabled={checked} onClick={() => setChoice(label)} className={"flex w-full items-start gap-3 border p-4 text-left transition " + style}><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#425977] bg-[#0a1220] text-xs font-extrabold text-white">{label}</span><span className="pt-1 text-sm font-medium leading-6 text-slate-100">{text}</span>{right && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-300" />}</button>})}{checked && <div className={"border p-4 " + (correct ? "border-emerald-300/50 bg-emerald-300/[.08]" : "border-amber-300/50 bg-amber-300/[.07]")}><p className="font-bold text-white">{correct ? "Correcto: interpretación respaldada." : "Revisemos el concepto."}</p><p className="mt-2 text-sm leading-7 text-slate-200">{q.explanation}</p></div>}<div className="flex justify-end border-t border-[#293d56] pt-5">{!checked ? <button type="button" disabled={!choice} onClick={check} className="border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] disabled:opacity-40">Comprobar respuesta <ArrowRight className="ml-2 inline h-4 w-4" /></button> : <button type="button" onClick={next} className="border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-xs font-bold text-cyan-100 sm:text-sm">{index === activeQuestions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="ml-2 inline h-4 w-4" /></button>}</div></div></section></div></div>
          )}
        </div>
      ) : null}
      {view === "practice" && done && !reward && (
        <div className="game-over-overlay fixed inset-0 z-40 flex items-center justify-center overflow-y-auto px-3 py-5 sm:px-6 sm:py-8">
          <div className="game-over-content relative z-10 my-auto w-full max-w-4xl py-4 text-center">
            <div className="game-over-title pixel-font flex w-full items-center justify-center gap-1 whitespace-nowrap font-black text-white sm:gap-3"><span>GAME</span><span className="game-over-nova inline-flex shrink-0 items-center justify-center"><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova" width={88} height={88} priority className="h-auto w-full" /></span><span>OVER</span></div>
            <p className="pixel-font mt-3 text-[10px] font-bold tracking-[.14em] text-rose-300 sm:mt-4 sm:text-sm">EXPERIMENTO FALLIDO</p><p className="mt-5 font-extrabold text-white [text-shadow:0_2px_6px_#000]">No lograste acertar las tres preguntas de este desafío.</p><p className="mt-3 font-extrabold text-white [text-shadow:0_2px_6px_#000]">Acertaste <strong className="text-cyan-300">{score} de {activeQuestions.length}</strong> preguntas.</p><p className="mt-4 font-bold text-white [text-shadow:0_2px_6px_#000]">Repasa los puntos clave y vuelve a intentarlo. Cada error te ayuda a comprender mejor.</p>
            <div className="mt-7 flex flex-col items-center gap-3"><button type="button" onClick={restart} className="game-over-choice game-over-choice-yes">▶ YES <span className="game-over-choice-detail">REPETIR PRÁCTICA</span></button><button type="button" onClick={() => { setView("examples"); setDone(false); }} className="game-over-choice game-over-choice-no">SIGUIENTE <span className="game-over-choice-detail">VER EJEMPLOS RESUELTOS</span></button></div><p className="pixel-font mt-8 text-[10px] text-white">PEAKSCORE · CONTINÚA LA AVENTURA</p>
          </div>
        </div>
      )}
      {view === "practice" && !done && <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={"Los cristales misteriosos: pregunta " + (index + 1) + " de " + activeQuestions.length} stage="practice" question={q.prompt} context={"Situación: " + q.context + "\nOpciones: " + q.options.map(o => o.join(") ")).join("\n") + "\nExplicación: " + q.explanation} />}
      <XpRewardAnimation open={reward && done} xp={50} nextLabel="SIGUIENTE NIVEL" onContinue={() => { setReward(false); window.location.href = "/aprender/santuario-de-la-materia/leccion/2"; }} />
      {!(view === "practice" && done && !reward) && <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] shadow-[0_-8px_24px_rgba(0,0,0,.18)]"><div className="mx-auto grid min-h-[64px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:gap-3 sm:px-7"><div className="min-w-0"><p className="pixel-font text-[8px] text-slate-100">NIVEL 1{view === "practice" ? " · EJERCICIOS " + (index + 1) + "/" + activeQuestions.length : view === "examples" ? " · EJEMPLOS RESUELTOS" : " · LOS CRISTALES MISTERIOSOS"}</p><span className="mt-1 inline-flex items-center gap-1.5 border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-0.5 text-[9px] font-bold text-emerald-200"><Image src="/peaky/homepage/xp.webp" alt="" width={17} height={17} /> 50 XP</span></div><div className="flex justify-center">{view === "practice" && !done && <button type="button" onClick={() => setTutorOpen(true)} aria-label="Abrir asistente de inteligencia artificial" title="Pregunta a la IA" className="inline-flex min-h-10 items-center gap-1.5 border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 text-xs font-extrabold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:-translate-y-0.5 hover:bg-[#ffb84d] active:translate-y-0 active:shadow-none sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">AI</span></button>}</div><div className="flex min-w-0 justify-self-end items-center gap-2 sm:gap-3">{view === "theory" && <><Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-3 py-2 text-[10px] font-extrabold text-[#09200a] sm:px-4 sm:text-xs"><ArrowLeft className="h-4 w-4" /> Salir</Link><button type="button" onClick={() => setView("examples")} className="border border-cyan-300 bg-cyan-500/20 px-3 py-2 text-[10px] font-extrabold text-cyan-100 sm:px-4 sm:text-xs">Ejemplos <ArrowRight className="ml-1 inline h-4 w-4" /></button></>}{view === "examples" && <><button type="button" onClick={() => setView("theory")} className="border border-cyan-300/50 bg-[#172c43] px-3 py-2 text-[10px] font-extrabold text-cyan-100 sm:px-4 sm:text-xs"><ArrowLeft className="mr-1 inline h-4 w-4" /> Anterior</button><button type="button" onClick={() => { startPractice(); setView("practice"); }} className="border border-cyan-300 bg-cyan-500/20 px-3 py-2 text-[10px] font-extrabold text-cyan-100 sm:px-4 sm:text-xs">Desafío <ArrowRight className="ml-1 inline h-4 w-4" /></button></>}{view === "practice" && !done && <Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-3 py-2 text-[10px] font-extrabold text-[#09200a] sm:px-4 sm:text-xs"><ArrowLeft className="h-4 w-4" /> Salir</Link>}</div></div></footer>}
      <style jsx global>{`
        .game-over-overlay { isolation:isolate; overflow:hidden; background:linear-gradient(180deg,rgba(2,5,13,.28),rgba(2,5,13,.58)),url("/images/game-over-bg.png") center center/cover no-repeat,#020308!important; }
        .game-over-content { transform:translateY(24px); animation:crystal-game-over-enter 520ms cubic-bezier(.2,.8,.2,1) both; }
        .game-over-title { font-size:clamp(2.15rem,7.8vw,6.5rem); line-height:.98; letter-spacing:-.045em; text-shadow:5px 5px 0 #155e75,9px 9px 0 #0b1220; }
        .game-over-nova { width:clamp(2.7rem,8vw,6rem); flex:0 0 auto; image-rendering:pixelated; filter:drop-shadow(3px 4px 0 #0b1220); }
        .game-over-choice { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; padding:.8rem 1rem; border:1px solid transparent; color:#a5f3fc; background:transparent; font-family:var(--font-press-start),"Press Start 2P",monospace; font-size:10px; transition:transform .18s ease,border-color .18s ease,background .18s ease; }
        .game-over-choice:hover,.game-over-choice:focus-visible { transform:translateX(4px); border-color:rgba(103,232,249,.8); background:rgba(8,47,73,.72); outline:none; }
        .game-over-choice-detail { margin-left:.5rem; font-family:Arial,sans-serif; font-size:14px; font-weight:800; color:#e2e8f0; }
        @keyframes crystal-game-over-enter { from {opacity:0;transform:translateY(36px)} to {opacity:1;transform:translateY(24px)} }
        @media(max-width:640px) { .game-over-title{font-size:clamp(1.9rem,8.2vw,2.8rem)} .game-over-nova{width:clamp(2.25rem,10vw,3.25rem)} .game-over-choice{font-size:8px;padding:.7rem .6rem;flex-wrap:wrap} .game-over-choice-detail{font-size:12px} }
        @media(prefers-reduced-motion:reduce) { .game-over-content,.game-over-choice{animation:none!important;transition:none!important} }
      `}</style>
    </main>
  );
}

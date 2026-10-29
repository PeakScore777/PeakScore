"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, Lightbulb, Plus, Waves } from "lucide-react";

type Question = {
  competency: string;
  context: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "Nova registra plantas acuáticas, larvas de insectos, ranas, temperatura del agua y concentración de oxígeno disuelto.",
    prompt: "¿Cuál registro corresponde a un factor abiótico del ecosistema?",
    options: [
      { label: "A", text: "La cantidad de ranas observadas en la orilla." },
      { label: "B", text: "La presencia de larvas entre las piedras." },
      { label: "C", text: "La concentración de oxígeno disuelto en el agua." },
      { label: "D", text: "La cobertura de plantas acuáticas." },
    ],
    answer: "C",
    explanation: "El oxígeno disuelto es una condición del ambiente, por eso es un factor abiótico. Las ranas, las larvas y las plantas son organismos vivos y corresponden a factores bióticos. Un ecosistema se comprende al analizar las interacciones entre ambos tipos.",
  },
  {
    competency: "Explicación de fenómenos",
    context: "Ciertas ranas se refugian entre raíces húmedas de la orilla. Durante la noche capturan insectos y sirven de alimento a algunas serpientes.",
    prompt: "¿Cuál afirmación distingue mejor el hábitat del nicho ecológico de estas ranas?",
    options: [
      { label: "A", text: "Las raíces son su nicho y capturar insectos es su hábitat." },
      { label: "B", text: "La orilla húmeda forma parte de su hábitat; alimentarse de insectos y participar en la red trófica describe parte de su nicho." },
      { label: "C", text: "Hábitat y nicho significan exactamente lo mismo." },
      { label: "D", text: "La red trófica es el hábitat y la humedad es una población." },
    ],
    answer: "B",
    explanation: "El hábitat es el lugar y las condiciones donde vive un organismo. El nicho describe cómo utiliza recursos y se relaciona con el ecosistema. La orilla húmeda es un lugar de refugio; la alimentación y las relaciones con depredadores son parte de su nicho.",
  },
  {
    competency: "Indagación y evaluación de evidencia",
    context: "En una visita, Nova registra 18 ranas y 8 mg/L de oxígeno aguas arriba; aguas abajo encuentra 5 ranas y 3 mg/L. Solo hizo una visita a cada tramo.",
    prompt: "¿Cuál es la conclusión más rigurosa con esta evidencia inicial?",
    options: [
      { label: "A", text: "El oxígeno bajo es la causa demostrada de la menor cantidad de ranas." },
      { label: "B", text: "Los datos muestran una diferencia asociada, pero se requieren más mediciones para evaluar posibles causas." },
      { label: "C", text: "La población aguas arriba siempre será mayor en cualquier época." },
      { label: "D", text: "El oxígeno no puede relacionarse con organismos vivos." },
    ],
    answer: "B",
    explanation: "En esta visita, el tramo con menos oxígeno también tuvo menos ranas. Esa asociación es una pista, no una prueba de causalidad: podrían influir temperatura, corriente, refugios o esfuerzo de observación. Repetir registros comparables permite evaluar si el patrón se mantiene.",
  },
];

const retryQuestions: Question[] = [
  {
    competency: "Uso comprensivo del conocimiento científico",
    context: "En una laguna se registran peces, algas, microorganismos, luz solar, temperatura y minerales disueltos.",
    prompt: "¿Qué clasificación de los componentes es correcta?",
    options: [
      { label: "A", text: "Peces y algas son abióticos porque se pueden contar." },
      { label: "B", text: "La luz y la temperatura son bióticas porque afectan la vida." },
      { label: "C", text: "Peces, algas y microorganismos son bióticos; luz, temperatura y minerales son abióticos." },
      { label: "D", text: "Todo es biótico porque pertenece al mismo ecosistema." },
    ],
    answer: "C",
    explanation: "Los factores bióticos son organismos vivos; los abióticos son condiciones y componentes no vivos, como luz, temperatura y minerales. Ambos se relacionan y pueden influir en la supervivencia y distribución de las poblaciones.",
  },
  {
    competency: "Explicación de fenómenos",
    context: "Una especie de ave anida en árboles altos, busca insectos en la corteza y dispersa semillas después de alimentarse de algunos frutos.",
    prompt: "¿Cuál descripción representa mejor parte de su nicho ecológico?",
    options: [
      { label: "A", text: "Únicamente el nombre del bosque donde fue observada." },
      { label: "B", text: "Su uso de recursos, alimentación e interacciones como la dispersión de semillas." },
      { label: "C", text: "El número de aves de todas las especies del planeta." },
      { label: "D", text: "La temperatura registrada en una única mañana." },
    ],
    answer: "B",
    explanation: "El nicho incluye la forma en que una especie utiliza recursos y se relaciona con otros organismos y con el ambiente. El bosque donde anida es parte de su hábitat; su alimentación y la dispersión de semillas describen funciones e interacciones.",
  },
  {
    competency: "Indagación y evaluación de evidencia",
    context: "Un equipo sospecha que el oxígeno disuelto se relaciona con el número de larvas. Quiere comparar dos tramos sin confundir diferencias reales con diferencias en el método de conteo.",
    prompt: "¿Qué procedimiento mejora más la comparación?",
    options: [
      { label: "A", text: "Contar diez minutos en un tramo y una hora en el otro." },
      { label: "B", text: "Visitar solo el tramo donde se esperan más larvas." },
      { label: "C", text: "Usar el mismo tiempo y método, registrar el oxígeno y repetir las mediciones." },
      { label: "D", text: "Cambiar el método en cada visita." },
    ],
    answer: "C",
    explanation: "Aplicar el mismo esfuerzo y procedimiento hace comparables los registros. Repetir en distintos momentos ayuda a reconocer la variación. Medir oxígeno junto con el conteo permite buscar patrones, pero para afirmar una causa también hay que considerar otras variables.",
  },
];

const notes = [
  { title: "Ecosistema", body: "Incluye organismos, factores no vivos e interacciones. Considera ambos tipos de componentes para explicar un fenómeno." },
  { title: "Hábitat y nicho", body: "El hábitat es el lugar donde vive un organismo; el nicho describe cómo usa recursos y se relaciona con el ambiente." },
  { title: "Población", body: "Conjunto de individuos de la misma especie en un área y periodo definidos. Los conteos deben indicar sitio y tiempo." },
  { title: "Evidencia", body: "Una asociación es una pista, no una prueba de causa. Repite mediciones y considera otras variables." },
];

function ImageUploadSlot({ assetKey, title, description, fallbackSrc, compact = false }: { assetKey: string; title: string; description: string; fallbackSrc?: string; compact?: boolean }) {
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

  const visibleImageUrl = imageUrl || fallbackSrc || null;

  return (
    <div className={"relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-transparent text-center " + (compact ? "min-h-[112px]" : "min-h-[240px]")}>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={"Seleccionar imagen para " + title} className="hidden" disabled={!isAdmin || saving} onChange={e => { void uploadSelectedFile(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
      {visibleImageUrl ? (
        isAdmin ? (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving} title="Pulsa la imagen para cambiarla" aria-label={"Cambiar imagen de " + title} className="group relative flex w-full items-center justify-center bg-transparent disabled:cursor-wait">
            <Image src={visibleImageUrl} width={1200} height={800} unoptimized alt={description} className={"w-full object-contain " + (compact ? "max-h-28" : "max-h-[400px]")} />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded border border-emerald-200/30 bg-[#04110b]/90 px-2 py-1 text-[9px] font-bold text-emerald-100 opacity-90"><Plus className="h-3 w-3" /> CAMBIAR IMAGEN</span>
            {saving && <span className="absolute inset-x-1 bottom-1 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-cyan-100">Guardando imagen…</span>}
          </button>
        ) : <Image src={visibleImageUrl} width={1200} height={800} unoptimized alt={description} className={"w-full object-contain " + (compact ? "max-h-28" : "max-h-[400px]")} />
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


export default function CuencaDeLosEcosChapterOnePage() {
  const [view, setView] = useState<"theory" | "examples" | "practice">("theory");
  const [storyOpen, setStoryOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const activeQuestions = attempt % 2 === 0 ? questions : retryQuestions;
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [reward, setReward] = useState(false);
  const question = activeQuestions[index];
  const correct = choice === question.answer;
  const progress = view === "theory" ? 30 : view === "examples" ? 62 : done ? 100 : Math.round(62 + ((index + (checked ? 1 : 0)) / activeQuestions.length) * 38);

  function sound(file: string, volume = 0.2) {
    if (typeof window === "undefined") return;
    const audio = new Audio("/sounds/" + file);
    audio.volume = volume;
    void audio.play().catch(() => {});
  }
  function startPractice() {
    setIndex(0); setChoice(null); setChecked(false); setScore(0); setDone(false); setReward(false); setView("practice");
  }
  function restart() {
    setAttempt((value) => value + 1); setIndex(0); setChoice(null); setChecked(false); setScore(0); setDone(false); setReward(false); setView("practice");
  }
  function check() {
    if (!choice || checked) return;
    setChecked(true);
    if (correct) setScore((value) => value + 1);
  }
  function next() {
    if (index < activeQuestions.length - 1) {
      sound("navigation.mp3", 0.16); setIndex((value) => value + 1); setChoice(null); setChecked(false); return;
    }
    setDone(true);
    if (score === activeQuestions.length) { setReward(true); sound("level-win.mp3", 0.25); }
    else sound("game-over.wav", 0.3);
  }
  const navButton = (label: string, active: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick} className={"rounded-lg px-2 py-3 text-[11px] font-bold transition sm:text-sm " + (active ? "border border-emerald-300 bg-emerald-500/20 text-white" : "border border-transparent text-slate-300 hover:bg-white/[.04] hover:text-white")}>{label}</button>
  );

  return (
    <main className="lesson-shell min-h-screen bg-[#05080b] pb-24 text-[#eff7f0]">
      {!(view === "practice" && done) && (
        <header className="sticky top-0 z-30 border-b border-emerald-100/10 bg-[#07120f]/95 backdrop-blur">
          <div className="mx-auto flex min-h-[58px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
              <Link href="/aprender" className="hidden transition hover:text-emerald-100 sm:inline">Rutas</Link>
              <span className="hidden text-white/30 sm:inline">›</span>
              <Link href="/aprender/la-cuenca-de-los-ecos" className="hidden transition hover:text-emerald-100 sm:inline">La Cuenca de los Ecos</Link>
              <span>›</span><strong className="truncate text-emerald-200">Capítulo 01</strong>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="pixel-font text-[8px] text-emerald-100">NIVEL 2</span>
              <span className="h-2 w-16 overflow-hidden rounded-full bg-white/10 sm:w-24"><span className="block h-full rounded-full bg-emerald-300 transition-all" style={{ width: progress + "%" }} /></span>
              <span className="pixel-font text-[8px] text-emerald-100">{progress}%</span>
            </div>
          </div>
        </header>
      )}

      {!(view === "practice" && done) && (
        <nav aria-label="Secciones del capítulo" className="mx-auto mt-3 grid max-w-[1560px] grid-cols-3 rounded-xl border border-emerald-100/15 bg-[#07140f] p-1 px-3 sm:px-5">
          {navButton("Historia y teoría", view === "theory", () => setView("theory"))}
          {navButton("Ejemplo guiado", view === "examples", () => setView("examples"))}
          {navButton("Desafío", view === "practice", startPractice)}
        </nav>
      )}

      {view === "theory" && (
        <div className="mx-auto grid max-w-[1560px] gap-3 p-3 pb-28 sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <section className="relative flex min-h-[200px] items-end overflow-hidden rounded-xl border border-emerald-200/20 bg-[#071c18] p-5 sm:min-h-[255px] sm:p-7" style={{ backgroundImage: "linear-gradient(90deg,rgba(3,12,13,.95),rgba(3,12,13,.72) 47%,rgba(3,12,13,.16)),linear-gradient(0deg,rgba(3,12,13,.45),transparent 65%),url('/images/aprender/cuenca-de-los-ecos/header.svg')", backgroundSize: "cover", backgroundPosition: "center" }}>
              <div className="relative z-10 max-w-[720px]">
                <span className="pixel-font inline-flex border border-emerald-300/60 bg-[#071b16]/85 px-2 py-1.5 text-[8px] text-emerald-100">CAPÍTULO 01 · BIOLOGÍA</span>
                <h1 className="pixel-font mt-4 text-[clamp(1rem,2.2vw,1.8rem)] leading-[1.8] text-white">El Bosque que Dejó de Cantar</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90">Reconstruye el equilibrio de la cuenca: identifica los seres vivos, las condiciones del ambiente y las relaciones que los conectan.</p>
              </div>
            </section>

            <div className="mt-3 space-y-3">
              <LessonNotesSelection sourceTitle="El Bosque que Dejó de Cantar" sourcePath="/aprender/la-cuenca-de-los-ecos/leccion/1">
                <section className="overflow-hidden rounded-xl border border-emerald-100/15 bg-[#081611]">
                  <button type="button" onClick={() => setStoryOpen((open) => !open)} aria-expanded={storyOpen} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-100/[.035]">
                    <span className="pixel-font text-[8px] text-emerald-100">REGISTRO DE CAMPO · HISTORIA</span><span className="text-emerald-200">{storyOpen ? "−" : "+"}</span>
                  </button>
                  {storyOpen && (
                    <div className="border-t border-white/[.07] px-4 py-5 sm:px-5">
                      <p className="text-sm leading-7 text-slate-200">Después de estudiar los cristales del Santuario de la Materia, Nova detecta que uno emite un pulso tenue cada vez que se acerca al río. Orby compara el patrón con registros antiguos y encuentra una referencia a una cuenca donde las formas de vida estaban conectadas.</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">Al llegar, Nova nota algo extraño: el bosque está demasiado quieto. Hay menos cantos entre las ramas y en varios charcos apenas se ven rastros de anfibios. La señal del cristal no explica el fenómeno; solo la ha llevado hasta el lugar donde debe investigar.</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">Nova abre su cuaderno, registra las condiciones del agua y observa plantas, insectos y refugios de la orilla. Para descubrir qué cambió, primero tendrá que entender cómo funciona un ecosistema sin confundir una pista con una causa.</p>
                      <div className="mt-4 border-l-2 border-emerald-300/80 bg-emerald-300/[.06] px-4 py-3">
                        <p className="text-xs font-bold text-emerald-100">Tu misión</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">Ayuda a Nova a construir un mapa inicial del ecosistema: distingue los componentes vivos de las condiciones del entorno y relaciona cada organismo con el lugar y los recursos que utiliza.</p>
                      </div>
                    </div>
                  )}
                </section>

                <section id="ecosistema" className="rounded-xl border border-emerald-100/15 bg-[#081611] p-4 sm:p-5">
                  <h2 className="pixel-font flex items-center gap-3 text-[9px] leading-6 text-white sm:text-[10px]"><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-300/35 bg-emerald-400/10 text-emerald-100">01</span>¿Qué es un ecosistema?</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">Un <strong className="text-emerald-100">ecosistema</strong> está formado por los seres vivos de un lugar, los factores no vivos que los rodean y las interacciones entre ambos. No es solo una lista de especies: también incluye cómo el agua, la luz, la temperatura y otros factores influyen en la vida.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-emerald-200/15 bg-[#10251d] p-4"><p className="flex items-center gap-2 text-sm font-bold text-emerald-100"><Leaf className="h-4 w-4" /> Factores bióticos</p><p className="mt-2 text-sm leading-6 text-slate-300">Plantas acuáticas, ranas, peces, insectos, hongos y microorganismos. Son organismos vivos que pueden interactuar, competir, alimentarse o servir de refugio.</p></div>
                    <div className="border border-cyan-200/15 bg-[#0d2024] p-4"><p className="flex items-center gap-2 text-sm font-bold text-cyan-100"><Waves className="h-4 w-4" /> Factores abióticos</p><p className="mt-2 text-sm leading-6 text-slate-300">Agua, luz, temperatura, oxígeno disuelto, minerales y características del suelo. Son condiciones no vivas que pueden favorecer o limitar la supervivencia.</p></div>
                  </div>
                  <ImageUploadSlot assetKey="cuenca-de-los-ecos/ecosistema" title="Mapa de los factores del ecosistema" description="Ilustración didáctica de factores bióticos y abióticos en la cuenca." />
                  <div className="mt-4 rounded-lg border border-emerald-100/15 bg-black/20 p-3"><p className="text-xs font-bold text-emerald-100">La idea clave</p><p className="mt-1 text-sm leading-6 text-slate-300">Si cambia una condición del agua, puede afectar algunos organismos y, a través de sus relaciones, producir efectos en otras partes del ecosistema. La posibilidad debe evaluarse con evidencias, no suponerse automáticamente.</p></div>
                </section>

                <section id="habitat-poblacion-nicho" className="rounded-xl border border-emerald-100/15 bg-[#081611] p-4 sm:p-5">
                  <h2 className="pixel-font flex items-center gap-3 text-[9px] leading-6 text-white sm:text-[10px]"><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-300/35 bg-emerald-400/10 text-emerald-100">02</span>Hábitat, población y nicho</h2>
                  <div className="mt-4 space-y-3">
                    <div className="border-l-2 border-emerald-300/65 bg-emerald-300/[.04] p-3"><h3 className="text-sm font-bold text-white">Hábitat</h3><p className="mt-1 text-sm leading-6 text-slate-300">El lugar y las condiciones en que vive un organismo. Por ejemplo, una zona húmeda con raíces, refugios y agua poco profunda donde se encuentran ciertas ranas.</p></div>
                    <div className="border-l-2 border-cyan-300/65 bg-cyan-300/[.04] p-3"><h3 className="text-sm font-bold text-white">Población</h3><p className="mt-1 text-sm leading-6 text-slate-300">Individuos de la misma especie que habitan un área durante un periodo. Al comparar conteos, Nova debe indicar el lugar y el momento de cada observación.</p></div>
                    <div className="border-l-2 border-amber-300/65 bg-amber-300/[.04] p-3"><h3 className="text-sm font-bold text-white">Nicho ecológico</h3><p className="mt-1 text-sm leading-6 text-slate-300">La manera en que una especie usa recursos e interactúa con el ambiente y otros organismos: qué consume, dónde se refugia, cuándo está activa y qué función cumple.</p></div>
                  </div>
                  <ImageUploadSlot assetKey="cuenca-de-los-ecos/habitat-poblacion-nicho" title="Hábitat, población y nicho" description="Infografía para diferenciar hábitat, población y nicho ecológico." />
                  <p className="mt-4 text-sm leading-7 text-slate-300">No confundas el sitio con la función: la orilla húmeda puede ser parte del hábitat de una rana; alimentarse de insectos y servir de presa a otra especie describe parte de su nicho.</p>
                </section>

                <section id="evidencia-ecosistema" className="rounded-xl border border-emerald-100/15 bg-[#081611] p-4 sm:p-5">
                  <h2 className="pixel-font flex items-center gap-3 text-[9px] leading-6 text-white sm:text-[10px]"><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-300/35 bg-emerald-400/10 text-emerald-100">03</span>De la observación a una explicación</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">En preguntas tipo Saber 11, un dato aislado rara vez basta para explicar todo un fenómeno. Compara sitios con el mismo método, identifica variables y separa lo que viste de lo que todavía necesitas comprobar.</p>
                  <div className="mt-4 overflow-hidden border border-white/10">
                    <div className="grid grid-cols-[1.05fr_1fr_1fr] bg-[#10251d] text-xs font-bold text-emerald-100"><span className="p-3">Registro</span><span className="border-l border-white/10 p-3">Tramo A</span><span className="border-l border-white/10 p-3">Tramo B</span></div>
                    <div className="grid grid-cols-[1.05fr_1fr_1fr] bg-[#0a1913] text-sm text-slate-300"><span className="p-3">Ranas observadas</span><span className="border-l border-white/10 p-3">18</span><span className="border-l border-white/10 p-3">5</span></div>
                    <div className="grid grid-cols-[1.05fr_1fr_1fr] border-t border-white/[.06] bg-[#0a1913] text-sm text-slate-300"><span className="p-3">Oxígeno disuelto</span><span className="border-l border-white/10 p-3">8 mg/L</span><span className="border-l border-white/10 p-3">3 mg/L</span></div>
                  </div>
                  <ImageUploadSlot compact assetKey="cuenca-de-los-ecos/indagacion-evidencia" title="Cómo interpretar la evidencia" description="Diagrama del proceso de indagación para comparar dos tramos del ecosistema." />
                  <p className="mt-3 text-xs leading-6 text-slate-400">Ejemplo hipotético para aprender a interpretar datos; no es un registro real del río ni demuestra por sí solo la causa de una diferencia entre poblaciones.</p>
                </section>

                <section id="puntos-clave" className="rounded-xl border border-amber-200/20 bg-amber-100/[.035] p-4 sm:p-5">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Claves para Saber 11</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                    <li>• Un ecosistema integra seres vivos, factores abióticos e interacciones.</li>
                    <li>• Hábitat es el lugar; nicho describe la forma de vida y sus relaciones.</li>
                    <li>• Una población reúne individuos de la misma especie en un área y periodo definidos.</li>
                    <li>• Una asociación orienta una hipótesis, pero no prueba causalidad por sí sola.</li>
                  </ul>
                </section>
              </LessonNotesSelection>
            </div>
          </div>

          <aside className="hidden space-y-3 xl:block">
            <section className="overflow-hidden rounded-xl border border-emerald-100/15 bg-[#07140f]">
              <div className="relative h-[170px]">
                <Image src="/images/aprender/cuenca-de-los-ecos/header.svg" alt="La Cuenca de los Ecos" fill sizes="300px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07140f] via-transparent to-black/10" />
                <div className="absolute bottom-3 left-3 right-3"><p className="pixel-font text-[8px] text-emerald-100">CUADERNO DE NOVA</p><p className="mt-2 text-xs text-white">Observa · Registra · Compara</p></div>
              </div>
              <div className="space-y-3 p-4">{notes.map((note) => <div key={note.title} className="border-b border-white/[.07] pb-3 last:border-0 last:pb-0"><h3 className="text-xs font-bold text-emerald-100">{note.title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{note.body}</p></div>)}</div>
            </section>
            <section className="rounded-xl border border-emerald-100/15 bg-[#07140f] p-4"><p className="flex items-center gap-2 text-xs font-bold text-emerald-100"><Waves className="h-4 w-4" /> Misión actual</p><p className="mt-2 text-sm leading-6 text-slate-300">Construir un registro inicial del bosque sin adelantar conclusiones.</p></section>
          </aside>
        </div>
      )}

      {view === "examples" && (
        <div className="mx-auto max-w-[1040px] space-y-4 px-4 pb-28 pt-6 sm:px-6">
          <section className="overflow-hidden rounded-xl border border-emerald-100/15 bg-[#081611]">
            <div className="relative h-36 sm:h-52"><Image src="/images/aprender/cuenca-de-los-ecos/header.svg" alt="Ribera de la cuenca" fill sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#04100d]/95 via-[#04100d]/55 to-transparent" /><div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center p-5 sm:p-7"><p className="pixel-font text-[8px] text-emerald-200">EJEMPLO GUIADO</p><h1 className="mt-3 text-xl font-bold text-white sm:text-2xl">Dos tramos, una pregunta</h1></div></div>
            <div className="space-y-4 p-4 sm:p-6">
              <p className="text-sm leading-7 text-slate-300">Nova registró 18 ranas y 8 mg/L de oxígeno en un tramo; en otro encontró 5 ranas y 3 mg/L. ¿Puede afirmar que la baja concentración de oxígeno causó la diferencia?</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-emerald-200/15 bg-[#10251d] p-4"><p className="text-xs font-bold text-emerald-100">1. Observa</p><p className="mt-2 text-sm leading-6 text-slate-300">Los registros de ambos sitios no son iguales.</p></div>
                <div className="border border-cyan-200/15 bg-[#0d2024] p-4"><p className="text-xs font-bold text-cyan-100">2. Compara</p><p className="mt-2 text-sm leading-6 text-slate-300">Una menor cantidad de ranas coincide con menor oxígeno en esta observación.</p></div>
                <div className="border border-amber-200/15 bg-[#211a0c] p-4"><p className="text-xs font-bold text-amber-100">3. Sé prudente</p><p className="mt-2 text-sm leading-6 text-slate-300">Hay que repetir el muestreo y medir otros factores antes de atribuir una causa.</p></div>
              </div>
              <div className="border-l-2 border-emerald-300 bg-emerald-300/[.05] p-4"><p className="text-sm font-bold text-emerald-100">Conclusión modelo</p><p className="mt-2 text-sm leading-7 text-slate-300">Los datos iniciales muestran una asociación, no una causa confirmada. Nova debe repetir el conteo con el mismo esfuerzo de muestreo y registrar otras condiciones relevantes.</p></div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-[#08110e] p-4 sm:p-5">
            <h2 className="text-sm font-bold text-white">Cómo resolver una pregunta de ecosistemas</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300"><li>Separa organismos vivos de condiciones no vivas.</li><li>Identifica si preguntan por lugar, población, función o interacción.</li><li>Compara los datos y revisa las condiciones del muestreo.</li><li>Elige una conclusión que la evidencia permita sostener.</li></ol>
          </section>
        </div>
      )}

      {view === "practice" && !done && (
        <div className="mx-auto max-w-[1040px] px-4 pb-32 pt-6 sm:px-6">
          <section className="overflow-hidden rounded-xl border border-emerald-100/15 bg-[#081611]">
            <div className="flex flex-col gap-3 border-b border-white/[.08] bg-[#10251d] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><p className="pixel-font text-[8px] text-emerald-200">DESAFÍO DE CAMPO</p><h1 className="mt-3 text-lg font-bold text-white sm:text-xl">Reconstruye el equilibrio</h1></div>
              <div className="flex items-center gap-2"><span className="pixel-font border border-emerald-300/25 bg-black/20 px-3 py-2 text-[8px] text-emerald-100">PREGUNTA {index + 1}/{activeQuestions.length}</span><span className="pixel-font border border-amber-300/25 bg-black/20 px-3 py-2 text-[8px] text-amber-100">{score} PUNTOS</span></div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-100"><Leaf className="h-4 w-4" /> {question.competency}</span><span className="text-xs text-slate-400">Lee la evidencia antes de elegir.</span></div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4"><p className="text-sm leading-7 text-slate-300">{question.context}</p></div>
              <h2 className="mt-5 text-base font-bold leading-7 text-white sm:text-lg">{question.prompt}</h2>
              <div className="mt-4 space-y-3">
                {question.options.map((option) => {
                  const isAnswer = option.label === question.answer;
                  const isSelected = choice === option.label;
                  const stateClass = checked && isAnswer ? "border-emerald-300 bg-emerald-400/[.12]" : checked && isSelected && !correct ? "border-rose-300 bg-rose-400/[.08]" : isSelected ? "border-cyan-300 bg-cyan-400/[.08]" : "border-white/10 bg-[#0b1913] hover:border-emerald-100/30";
                  return <button key={option.label} type="button" disabled={checked} onClick={() => setChoice(option.label)} className={"flex w-full items-start gap-3 rounded-lg border p-3 text-left transition sm:p-4 " + stateClass}><span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 bg-black/20 text-xs font-bold text-emerald-100">{option.label}</span><span className="pt-1 text-sm leading-6 text-slate-200">{option.text}</span>{checked && isAnswer && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-200" />}</button>;
                })}
              </div>
              {checked && <div role="status" className={"mt-4 rounded-lg border p-4 " + (correct ? "border-emerald-200/30 bg-emerald-300/[.07]" : "border-amber-200/25 bg-amber-200/[.05]")}><p className={"text-sm font-bold " + (correct ? "text-emerald-100" : "text-amber-100")}>{correct ? "¡Bien observado!" : "Pista para tu siguiente intento"}</p><p className="mt-2 text-sm leading-7 text-slate-300">{question.explanation}</p></div>}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setTutorOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#ffb347]/45 bg-[#ff9f1c] px-4 py-2 text-xs font-extrabold text-[#251300] transition hover:bg-[#ffb84d]"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">CONSULTAR A ORBY</span></button>
                {!checked ? <button type="button" disabled={!choice} onClick={check} className="min-h-11 border border-emerald-300/50 bg-emerald-500/20 px-5 py-3 text-xs font-bold text-emerald-50 transition enabled:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta</button> : <button type="button" onClick={next} className="min-h-11 border border-emerald-200 bg-[#143526] px-5 py-3 text-xs font-bold text-emerald-50 transition hover:bg-[#1d4935]">{index === activeQuestions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="ml-2 inline h-4 w-4" /></button>}
              </div>
            </div>
          </section>
          <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={"La Cuenca de los Ecos: pregunta " + (index + 1) + " de " + activeQuestions.length} stage="practice" question={question.prompt} context={"Situación: " + question.context + "\nOpciones:\n" + question.options.map((option) => option.label + ") " + option.text).join("\n") + "\nExplicación: " + question.explanation} />
        </div>
      )}

      {view === "practice" && done && !reward && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#04100c] px-4 py-6 sm:px-6">
          <div className="relative my-auto w-full max-w-4xl py-4 text-center">
            <div className="pixel-font flex items-center justify-center gap-1 whitespace-nowrap text-[clamp(1.8rem,7vw,5rem)] font-black text-white sm:gap-3" style={{ textShadow: "5px 5px 0 #14532d, 9px 9px 0 #08110e" }}><span>GAME</span><span className="inline-flex shrink-0 items-center"><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova" width={90} height={90} className="h-auto w-[clamp(2.4rem,8vw,5.5rem)]" /></span><span>OVER</span></div>
            <p className="pixel-font mt-4 text-[9px] tracking-[.12em] text-rose-200 sm:text-xs">RASTRO INCOMPLETO</p>
            <p className="mt-5 text-sm font-bold text-white">Todavía no lograste completar las tres preguntas correctamente.</p>
            <p className="mt-3 text-sm text-slate-200">Respuestas correctas: <strong className="text-emerald-200">{score} de {activeQuestions.length}</strong>.</p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">Nova no dará por resuelto el misterio con evidencia insuficiente. Repasa tus notas e inténtalo otra vez: una buena investigación también aprende de los errores.</p>
            <div className="mt-7 flex flex-col items-center gap-3"><button type="button" onClick={restart} className="pixel-font min-h-11 px-4 py-3 text-[9px] text-emerald-100 transition hover:translate-x-1 hover:text-white">▶ REPETIR DESAFÍO</button><button type="button" onClick={() => { setDone(false); setReward(false); setView("examples"); }} className="pixel-font min-h-11 px-4 py-3 text-[9px] text-slate-300 transition hover:translate-x-1 hover:text-white">VER EJEMPLO GUIADO</button></div>
            <p className="pixel-font mt-8 text-[8px] text-white/60">PEAKSCORE · OBSERVA ANTES DE CONCLUIR</p>
          </div>
        </div>
      )}

      <XpRewardAnimation open={reward && done} xp={50} nextLabel="VOLVER A LA CUENCA" onContinue={() => { setReward(false); window.location.href = "/aprender/la-cuenca-de-los-ecos"; }} />
      {!(view === "practice" && done) && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100/10 bg-[#08140f]/[.98] shadow-[0_-8px_24px_rgba(0,0,0,.22)]">
          <div className="mx-auto grid min-h-[64px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:gap-3 sm:px-7">
            <div className="min-w-0"><p className="pixel-font text-[7px] text-emerald-50 sm:text-[8px]">NIVEL 2 · {view === "practice" ? "DESAFÍO " + (index + 1) + "/" + activeQuestions.length : view === "examples" ? "EJEMPLO GUIADO" : "EL BOSQUE QUE DEJÓ DE CANTAR"}</p><span className="mt-1 inline-flex items-center gap-1.5 border border-amber-200/20 bg-amber-200/[.07] px-2 py-0.5 text-[9px] font-bold text-amber-100"><Image src="/peaky/homepage/xp.webp" alt="" width={17} height={17} /> 50 XP</span></div>
            <div className="flex justify-center">{view === "practice" && !done && <button type="button" onClick={() => setTutorOpen(true)} aria-label="Abrir asistente de inteligencia artificial" title="Pregunta a Orby" className="inline-flex min-h-10 items-center gap-1.5 border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 text-xs font-extrabold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:-translate-y-0.5 hover:bg-[#ffb84d] sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">ORBY</span></button>}</div>
            <div className="flex min-w-0 items-center justify-self-end gap-2 sm:gap-3">
              {view === "theory" && <><Link href="/aprender/la-cuenca-de-los-ecos" className="inline-flex items-center gap-2 border border-emerald-300/40 bg-[#10271d] px-3 py-2 text-[10px] font-bold text-emerald-100 sm:px-4 sm:text-xs"><ArrowLeft className="h-4 w-4" /> Salir</Link><button type="button" onClick={() => setView("examples")} className="border border-emerald-300/50 bg-emerald-500/15 px-3 py-2 text-[10px] font-bold text-emerald-100 sm:px-4 sm:text-xs">Ejemplos <ArrowRight className="ml-1 inline h-4 w-4" /></button></>}
              {view === "examples" && <><button type="button" onClick={() => setView("theory")} className="border border-emerald-300/30 bg-[#10271d] px-3 py-2 text-[10px] font-bold text-emerald-100 sm:px-4 sm:text-xs"><ArrowLeft className="mr-1 inline h-4 w-4" /> Anterior</button><button type="button" onClick={startPractice} className="border border-emerald-300/50 bg-emerald-500/15 px-3 py-2 text-[10px] font-bold text-emerald-100 sm:px-4 sm:text-xs">Desafío <ArrowRight className="ml-1 inline h-4 w-4" /></button></>}
              {view === "practice" && !done && <Link href="/aprender/la-cuenca-de-los-ecos" className="inline-flex items-center gap-2 border border-emerald-300/40 bg-[#10271d] px-3 py-2 text-[10px] font-bold text-emerald-100 sm:px-4 sm:text-xs"><ArrowLeft className="h-4 w-4" /> Salir</Link>}
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}

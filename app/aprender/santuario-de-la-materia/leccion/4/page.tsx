"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";

type Question = {
  competency: string;
  difficulty: "Fácil" | "Media";
  context: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    competency: "Uso comprensivo del conocimiento científico",
    difficulty: "Fácil",
    context: "Nova analiza tres átomos en el escáner. El átomo X tiene 6 protones, 6 neutrones y 6 electrones. El átomo Y tiene 6 protones, 8 neutrones y 6 electrones. El átomo Z tiene 7 protones, 7 neutrones y 7 electrones.",
    prompt: "¿Cuál interpretación explica correctamente la relación entre los tres átomos?",
    options: [
      { label: "A", text: "X e Y son átomos del mismo elemento, pero Z pertenece a otro elemento." },
      { label: "B", text: "X y Z pertenecen al mismo elemento porque ambos tienen igual número de neutrones." },
      { label: "C", text: "Y es un ion porque tiene más neutrones que protones." },
      { label: "D", text: "Los tres son el mismo elemento porque todos tienen igual número de electrones y neutrones aproximadamente." },
    ],
    answer: "A",
    explanation: "La identidad de un elemento la determina su número de protones. X e Y tienen 6 protones, así que ambos son carbono; se diferencian en el número de neutrones y son isótopos. Z tiene 7 protones y corresponde a otro elemento: nitrógeno. Tener más neutrones que protones no convierte por sí solo a un átomo en ion; los iones se forman cuando cambia el número de electrones.",
  },
  {
    competency: "Explicación de fenómenos",
    difficulty: "Fácil",
    context: "Un átomo neutro de magnesio tiene número atómico 12. Durante un proceso, pierde dos electrones, mientras su núcleo permanece sin cambios.",
    prompt: "¿Qué descripción corresponde a la partícula que se forma?",
    options: [
      { label: "A", text: "Un átomo de otro elemento, porque perdió dos partículas del núcleo." },
      { label: "B", text: "Un ion con carga +2, porque conserva 12 protones y ahora tiene 10 electrones." },
      { label: "C", text: "Un isótopo del magnesio, porque el número de electrones disminuyó." },
      { label: "D", text: "Un ion con carga −2, porque perder electrones vuelve negativa la carga total." },
    ],
    answer: "B",
    explanation: "El número atómico 12 indica 12 protones. Un átomo neutro de magnesio tiene inicialmente 12 electrones; al perder dos, queda con 12 cargas positivas y 10 negativas, para una carga neta de +2. Como el núcleo no cambió, sigue siendo magnesio. Los isótopos se diferencian por el número de neutrones, no por el de electrones.",
  },
  {
    competency: "Indagación y evaluación de evidencia",
    difficulty: "Media",
    context: "Dos modelos intentan explicar la luz emitida por un elemento calentado. El modelo I predice una banda continua de colores. El modelo II predice líneas en longitudes de onda específicas. Al observar el espectro, el equipo registra varias líneas brillantes separadas.",
    prompt: "¿Qué conclusión está mejor respaldada por esta evidencia?",
    options: [
      { label: "A", text: "El modelo I queda confirmado porque todos los elementos contienen electrones." },
      { label: "B", text: "El modelo II es compatible con el patrón observado, aunque se requieren más pruebas para evaluar completamente el modelo." },
      { label: "C", text: "El espectro demuestra que los electrones se mueven como planetas por órbitas clásicas." },
      { label: "D", text: "El experimento demuestra que todos los elementos deben emitir exactamente las mismas líneas." },
    ],
    answer: "B",
    explanation: "El patrón de líneas discretas es compatible con la emisión de fotones de energías específicas asociadas a transiciones entre estados energéticos. La evidencia favorece la predicción del modelo II frente a la banda continua del modelo I. Sin embargo, un resultado compatible no prueba por sí solo todos los aspectos de una teoría ni demuestra que los electrones sigan trayectorias planetarias clásicas.",
  },
];

const notes = [
  {
    title: "Número atómico (Z)",
    body: "Es el número de protones del núcleo y define la identidad del elemento. Si cambia el número de protones, cambia el elemento.",
  },
  {
    title: "Número másico (A)",
    body: "Para un isótopo concreto, A = protones + neutrones. Por tanto, neutrones = A − Z. La masa atómica de la tabla periódica suele ser un promedio isotópico, no necesariamente un número entero.",
  },
  {
    title: "Átomos neutros e iones",
    body: "Un átomo neutro tiene igual cantidad de protones y electrones. Si pierde electrones forma un catión positivo; si gana electrones forma un anión negativo.",
  },
  {
    title: "Isótopos y modelos",
    body: "Los isótopos tienen igual número de protones y distinto número de neutrones. Los modelos científicos se contrastan con evidencia; un espectro de líneas revela energías electrónicas discretas.",
  },
];

export default function CodigoDelAtomoPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"theory" | "practice">("theory");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lost, setLost] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);

  const question = questions[questionIndex];
  const isCorrect = selected === question.answer;

  function playSound(file: "navigation.mp3" | "level-win.mp3" | "game-over.wav", volume = 0.2) {
    if (typeof window === "undefined") return;
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = volume;
    void audio.play().catch(() => {});
  }

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrectCount((count) => count + 1);
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      playSound("navigation.mp3", 0.16);
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    setFinished(true);
    if (correctCount === questions.length) {
      setLost(false);
      setRewardOpen(true);
      playSound("level-win.mp3", 0.25);
    } else {
      setLost(true);
      playSound("game-over.wav", 0.3);
    }
  }

  function restartPractice() {
    // Se alterna el orden de las opciones al reiniciar, sin cambiar la respuesta correcta.
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
    setLost(false);
    setRewardOpen(false);
  }

  const progress = stage === "theory" ? 30 : finished ? 100 : 30 + ((questionIndex + (checked ? 1 : 0)) / questions.length) * 70;

  return (
    <main className="min-h-screen bg-[#05070b] text-[#f0f4fa]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101725]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[58px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Santuario de la Materia
          </Link>
          <span className="pixel-font text-[8px] text-cyan-200">NIVEL 4 · QUÍMICA</span>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-24 overflow-hidden bg-white/10"><div className="h-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div>
            <span className="pixel-font text-[8px] text-emerald-200">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="h-[2px] bg-white/[.04]"><div className="h-full bg-cyan-300 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      </header>

      {stage === "theory" ? (
        <article className="mx-auto max-w-[820px] px-5 pb-28 pt-8 sm:px-8 sm:pt-11">
          <p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">CAPÍTULO 04 · EL CÓDIGO DEL ÁTOMO</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">El corazón invisible de la materia</h1>
          <p className="mt-4 text-base leading-8 text-slate-300">Después del accidente en el laboratorio, Nova encuentra una proyección escondida entre los instrumentos. La imagen no muestra una mezcla ni un cristal: revela una estructura diminuta, con un núcleo brillante y una región electrónica. En la pantalla aparece un mensaje: <strong className="text-cyan-100">«Para comprender los elementos, descifra lo que ocurre dentro de sus átomos».</strong></p>

          <div className="my-7 overflow-hidden border border-[#2e4965] bg-[#0d1522]">
            <Image src="/images/game-over-lab.png" alt="Laboratorio de Nova después del accidente, con instrumentos y luces de colores" width={1600} height={900} className="h-auto w-full object-cover" />
            <p className="border-t border-white/10 px-4 py-3 text-xs leading-6 text-slate-400">El accidente no destruyó el laboratorio, pero activó un escáner que permite explorar la estructura de la materia.</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">1. ¿Qué es un átomo?</h2>
            <p className="text-sm leading-7 text-slate-300">Un átomo es una unidad de un elemento que conserva su identidad química. Está constituido por un núcleo, que contiene protones y normalmente neutrones, y una región electrónica que contiene electrones. El núcleo concentra casi toda la masa del átomo, aunque su tamaño es muchísimo menor que el tamaño total de este.</p>
            <p className="text-sm leading-7 text-slate-300">El dibujo clásico de electrones girando como planetas puede ayudar a imaginar que existe una región alrededor del núcleo, pero no es una descripción literal del modelo moderno. En mecánica cuántica, los electrones se describen mediante estados cuánticos y orbitales: regiones asociadas a la probabilidad de encontrar un electrón.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">2. Las partículas subatómicas</h2>
            <div className="overflow-x-auto border border-[#344a66] bg-[#0b1320] p-3 sm:p-4">
              <table className="w-full min-w-[450px] border-collapse text-left text-sm">
                <thead><tr>{["Partícula", "Carga relativa", "Ubicación", "Importancia"].map((v) => <th key={v} className="border border-[#405873] bg-[#1a2b40] px-3 py-3 font-bold text-cyan-100">{v}</th>)}</tr></thead>
                <tbody>
                  {[
                    ["Protón", "+1", "Núcleo", "Determina el elemento."],
                    ["Neutrón", "0", "Núcleo", "Contribuye a la masa y a la estabilidad nuclear."],
                    ["Electrón", "−1", "Región electrónica", "Participa en los enlaces y la reactividad química."],
                  ].map((row, i) => <tr key={row[0]} className={i % 2 ? "bg-[#101c2c]" : "bg-[#0c1624]"}>{row.map((v) => <td key={v} className="border border-[#293d56] px-3 py-3 text-slate-100">{v}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
            <p className="text-sm leading-7 text-slate-300">No confundas las funciones de estas partículas. En los procesos químicos habituales, los núcleos no se transforman: lo que suele cambiar es la distribución de electrones y la manera en que los átomos se enlazan. Cambiar el número de protones implica cambiar de elemento y requiere un proceso nuclear, no una reacción química ordinaria.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">3. Número atómico y número másico</h2>
            <p className="text-sm leading-7 text-slate-300">El <strong className="text-white">número atómico (Z)</strong> indica cuántos protones hay en el núcleo. El <strong className="text-white">número másico (A)</strong> es la suma de protones y neutrones de un isótopo. Por eso:</p>
            <div className="border border-cyan-200/20 bg-[#0d1b2a] px-5 py-4 text-center font-mono text-base leading-8 text-cyan-100 sm:text-lg">A = Z + N<br />N = A − Z</div>
            <p className="text-sm leading-7 text-slate-300">Aquí N representa el número de neutrones. Por ejemplo, un átomo con Z = 11 y A = 23 tiene 11 protones y 23 − 11 = 12 neutrones. Si es neutro, también tiene 11 electrones. Recuerda que el valor de masa atómica que aparece en muchas tablas periódicas suele ser un promedio ponderado de los isótopos naturales; no siempre es igual al número másico de un átomo específico.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">4. Isótopos e iones: dos cambios diferentes</h2>
            <p className="text-sm leading-7 text-slate-300"><strong className="text-white">Los isótopos</strong> pertenecen al mismo elemento porque tienen igual número de protones, pero difieren en el número de neutrones. Por ejemplo, carbono-12 y carbono-14 tienen seis protones; sus núcleos contienen seis y ocho neutrones, respectivamente.</p>
            <p className="text-sm leading-7 text-slate-300"><strong className="text-white">Los iones</strong> se forman cuando un átomo o grupo de átomos gana o pierde electrones. Si pierde electrones, queda con más protones que electrones y su carga neta es positiva: es un catión. Si gana electrones, su carga neta es negativa: es un anión. Un átomo que cambia sus electrones sigue siendo el mismo elemento mientras conserve su número de protones.</p>
            <div className="border-l-2 border-amber-300 bg-amber-200/[.05] px-4 py-3">
              <p className="text-sm font-bold text-amber-100">Ejemplo guiado</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">El magnesio tiene Z = 12. Un átomo neutro tiene 12 protones y 12 electrones. Si pierde dos electrones, queda con 12 protones y 10 electrones: su carga neta es +2 y se representa Mg²⁺. No se convirtió en otro elemento, porque el núcleo conserva sus 12 protones.</p>
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">5. Cómo cambian los modelos atómicos</h2>
            <p className="text-sm leading-7 text-slate-300">La ciencia no obtuvo de una sola vez una imagen completa del átomo. Dalton propuso un modelo útil para explicar proporciones químicas; Thomson aportó evidencia del electrón; Rutherford mostró que la carga positiva y gran parte de la masa se concentran en un núcleo pequeño; Bohr introdujo niveles de energía cuantizados para explicar ciertos espectros; y el modelo cuántico actual describe los electrones mediante estados y orbitales.</p>
            <p className="text-sm leading-7 text-slate-300">Cuando un elemento se excita, puede emitir luz en longitudes de onda características. Un espectro de líneas es evidencia de que el átomo solo puede intercambiar ciertas energías en esas transiciones. Esta observación apoya los modelos con estados energéticos discretos, pero no significa que los electrones sean pequeños planetas que recorren órbitas clásicas definidas.</p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-cyan-200">6. Cómo resolver preguntas Saber 11</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300">
              <li>Identifica qué dato te dan: número atómico, número másico, carga o evidencia experimental.</li>
              <li>Separa las partículas: protones definen el elemento; neutrones diferencian isótopos; electrones explican la carga del ion.</li>
              <li>Usa relaciones explícitas: neutrones = A − Z; para un átomo neutro, electrones = protones.</li>
              <li>Elige la conclusión que sí se deduce. Una opción puede incluir un dato verdadero y aun así responder una pregunta diferente.</li>
            </ol>
          </section>

          <section className="mt-9 border border-[#344a66] bg-[#101a29] p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[.12em] text-cyan-100">Puntos clave antes del desafío</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-200">
              <li>Z = número de protones; A = protones + neutrones.</li>
              <li>Átomo neutro: protones = electrones.</li>
              <li>Isótopos: mismo Z, diferente número de neutrones.</li>
              <li>Ion: gana o pierde electrones; su elemento no cambia si conserva sus protones.</li>
              <li>La evidencia permite evaluar modelos, pero una sola observación no demuestra todos sus aspectos.</li>
            </ul>
          </section>
        </article>
      ) : (
        <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-7 sm:pt-8">
          <div className="mb-6">
            <p className="pixel-font text-[9px] tracking-[.12em] text-cyan-200">DESAFÍO DEL SANTUARIO · PREGUNTA {questionIndex + 1} DE {questions.length}</p>
            <h1 className="mt-3 text-2xl font-extrabold text-white">Descifra el código del átomo</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Usa los puntos clave de la teoría. Busca la opción mejor respaldada, no la que solo parece correcta.</p>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
            <aside className="border border-[#2f465f] bg-[#121e30] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Repaso estratégico</p>
              {notes.map((note) => <section key={note.title} className="mt-4 border-t border-white/10 pt-4 first:border-0 first:pt-0"><h2 className="text-sm font-bold text-white">{note.title}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{note.body}</p></section>)}
              <div className="mt-5 border-l-2 border-amber-300 bg-[#1b2738] px-4 py-3"><p className="text-sm font-bold text-amber-100">Clave para razonar</p><p className="mt-2 text-sm leading-6 text-slate-200">Antes de elegir, pregúntate si el cambio ocurre en el núcleo o en los electrones. Esa diferencia evita confundir elemento, isótopo e ion.</p></div>
            </aside>
            <section className="overflow-hidden border border-[#35506d] bg-[#0d1422] shadow-[0_16px_40px_rgba(0,0,0,.35)]">
              <div className="border-b border-[#293d56] bg-[#121d30] px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="pixel-font text-[9px] uppercase tracking-[.12em] text-slate-200">{question.competency}</p><span className="border border-cyan-300/30 bg-cyan-300/[.06] px-2 py-1 text-[10px] font-bold text-cyan-100">DIFICULTAD · {question.difficulty.toUpperCase()}</span></div>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Situación problema</p>
                <p className="mt-2 border-l-[3px] border-cyan-300 bg-[#0b1524] px-4 py-4 text-sm leading-7 text-slate-100">{question.context}</p>
                <div className="mt-4 border border-[#31485e] bg-[#0c1a29] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-cyan-200">Puntos clave de la teoría</p><p className="mt-2 text-sm leading-6 text-slate-200">{questionIndex === 0 ? "El número de protones define el elemento. Isótopos: igual número de protones y distinto número de neutrones." : questionIndex === 1 ? "En un átomo neutro, protones = electrones. Perder electrones produce carga positiva; ganarlos produce carga negativa." : "Los modelos científicos se comparan con predicciones y datos. Un patrón observado puede apoyar un modelo sin demostrarlo por completo."}</p></div>
                <h2 className="mt-5 text-lg font-extrabold leading-8 text-white sm:text-xl">{question.prompt}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">Selecciona la mejor respuesta y comprueba tu razonamiento.</p>
              </div>
              <div className="space-y-3 p-5 sm:p-7">
                {question.options.map((option) => {
                  const active = selected === option.label;
                  const correctOption = checked && option.label === question.answer;
                  const wrongOption = checked && active && !isCorrect;
                  const style = correctOption ? "border-emerald-300 bg-emerald-300/10 ring-1 ring-emerald-300/50" : wrongOption ? "border-rose-400 bg-rose-400/10 ring-1 ring-rose-400/40" : active ? "border-cyan-300 bg-cyan-300/10 ring-1 ring-cyan-300/40" : "border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60 hover:bg-[#17273c]";
                  return <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`flex w-full items-start gap-3 border p-4 text-left transition ${style}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-extrabold ${correctOption ? "border-emerald-300 bg-emerald-300 text-[#06131b]" : wrongOption ? "border-rose-300 bg-rose-300 text-[#21070b]" : active ? "border-cyan-300 bg-cyan-300 text-[#06131b]" : "border-[#425977] bg-[#0a1220] text-slate-100"}`}>{option.label}</span><span className="pt-1 text-sm font-medium leading-6 text-slate-100">{option.text}</span>{correctOption && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-300" />}</button>;
                })}
                {checked && <div aria-live="polite" className={`border p-4 ${isCorrect ? "border-emerald-300/50 bg-emerald-300/[.08]" : "border-amber-300/50 bg-amber-300/[.07]"}`}><p className={`font-bold ${isCorrect ? "text-emerald-200" : "text-amber-100"}`}>{isCorrect ? "Correcto: tu interpretación coincide con la evidencia." : "Revisemos el concepto."}</p><p className="mt-2 text-sm leading-7 text-slate-200">{question.explanation}</p></div>}
                <div className="flex flex-col gap-3 border-t border-[#293d56] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-400">Justifica tu elección con la información del enunciado.</p>{!checked ? <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center justify-center gap-2 border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] shadow-[3px_3px_0_#1b7659] transition hover:bg-[#8af7c6] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center justify-center gap-2 border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-sm font-bold text-cyan-100 shadow-[3px_3px_0_#07111d] transition hover:bg-[#203b57]">{questionIndex === questions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>}</div>
              </div>
            </section>
          </div>
        </div>
      )}

      {finished && lost && <div className="game-over-overlay fixed inset-x-0 bottom-0 top-[58px] z-40 flex items-center justify-center overflow-y-auto px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="game-over-title"><div className="game-over-content relative z-10 flex w-full max-w-6xl flex-col items-center text-center"><div className="game-over-heading relative flex w-full flex-wrap items-center justify-center gap-x-1 sm:gap-x-3"><h2 id="game-over-title" className="pixel-font game-over-title">GAME</h2><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova en pixel art" width={160} height={160} className="game-over-nova h-24 w-24 object-contain sm:h-36 sm:w-36" /><span className="pixel-font game-over-title">OVER</span></div><p className="pixel-font mt-4 text-xs tracking-[.08em] text-white sm:text-base">PLAY AGAIN?</p><p className="game-over-copy mt-4 max-w-3xl text-sm leading-8 text-white sm:text-lg">No lograste acertar las tres preguntas de este desafío.</p><p className="game-over-copy mt-2 text-sm text-white sm:text-lg">Acertaste <strong className="text-cyan-300">{correctCount} de {questions.length}</strong> preguntas.</p><p className="game-over-copy mt-3 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base">Repasa los puntos clave de la teoría y vuelve a intentarlo. Cada error te ayuda a reconocer qué concepto debes reforzar.</p><div className="mt-6 flex w-full max-w-xl flex-col items-center gap-2 sm:mt-8"><button type="button" onClick={restartPractice} autoFocus className="game-over-choice game-over-choice-yes"><span className="game-over-cursor">▶</span><span>YES</span><span className="game-over-choice-detail">REPETIR CON PREGUNTAS NUEVAS</span></button><button type="button" onClick={() => { setStage("theory"); setFinished(false); setLost(false); setRewardOpen(false); }} className="game-over-choice game-over-choice-no"><span className="game-over-cursor game-over-cursor-hidden">▶</span><span>NO</span><span className="game-over-choice-detail">REPASAR TEORÍA</span></button></div><p className="pixel-font mt-7 text-[9px] tracking-[.1em] text-white/90 sm:text-[11px]">PEAKSCORE · CONTINÚA LA AVENTURA</p></div></div>}

      {stage === "practice" && !finished && <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={`El código del átomo: pregunta ${questionIndex + 1} de ${questions.length}`} stage="practice" question={question.prompt} context={`Situación: ${question.context}\nOpciones: ${question.options.map((option) => `${option.label}) ${option.text}`).join("\n")}\nExplicación: ${question.explanation}`} />}

      <XpRewardAnimation open={rewardOpen && finished && !lost} xp={60} nextLabel="SIGUIENTE NIVEL" onContinue={() => { setRewardOpen(false); router.push("/aprender/santuario-de-la-materia"); }} />

      {!(finished && lost) && <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] shadow-[0_-8px_24px_rgba(0,0,0,.18)] backdrop-blur"><div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7"><div className="min-w-0"><p className="pixel-font text-[8px] leading-5 text-slate-100">NIVEL 4{stage === "practice" ? ` · PREGUNTA ${questionIndex + 1}/${questions.length}` : " · EL CÓDIGO DEL ÁTOMO"}</p><span className="mt-1 inline-flex items-center gap-1.5 border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-0.5 text-[9px] font-bold text-emerald-200"><Image src="/peaky/homepage/xp.webp" alt="" width={17} height={17} className="object-contain" /> 60 XP</span></div>{stage === "practice" && !finished && <button type="button" onClick={() => setTutorOpen((open) => !open)} aria-expanded={tutorOpen} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 font-bold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:bg-[#ffb84d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:min-h-10 sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">AI</span></button>}<div className="flex shrink-0 items-center gap-2 sm:gap-3">{stage === "theory" ? <button type="button" onClick={() => { playSound("navigation.mp3", .16); setStage("practice"); }} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a] shadow-[0_2px_0_#3a9a2b] transition hover:bg-[#8ced6d]">Iniciar desafío <ArrowRight className="h-3.5 w-3.5" /></button> : <button type="button" onClick={() => { playSound("navigation.mp3", .16); setStage("theory"); }} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#252f46]"><ArrowLeft className="h-3.5 w-3.5" /> Volver a teoría</button>}</div></div></footer>}

      <style jsx global>{`
        .game-over-overlay {
          background: linear-gradient(180deg, rgba(2,5,13,.34), rgba(2,5,13,.58) 50%, rgba(0,0,0,.78)), url("/images/game-over-lab.png") center / cover no-repeat, #020308 !important;
          isolation: isolate;
        }
        .game-over-content { animation: atom-game-over-enter 450ms ease-out both; }
        .game-over-heading { filter: drop-shadow(0 0 22px rgba(20,210,255,.2)); }
        .game-over-title { color: #f8fafc; font-size: clamp(2.7rem,9.8vw,8rem); line-height:1.12; letter-spacing:-.065em; text-shadow:5px 5px 0 #155e75, 9px 9px 0 #0b1220, 0 0 30px rgba(34,211,238,.32); }
        .game-over-nova { image-rendering:pixelated; filter:drop-shadow(0 0 20px rgba(132,204,22,.42)); animation:atom-nova-idle 2.2s steps(2,end) infinite; }
        .game-over-choice { display:flex; width:100%; min-height:42px; align-items:center; justify-content:center; gap:.65rem; padding:.7rem .9rem; color:#e2e8f0; background:transparent; border:0; font-family:var(--font-press-start), "Press Start 2P", monospace; font-size:10px; letter-spacing:.04em; text-align:center; transition:color 140ms ease, transform 140ms ease; text-shadow:0 2px 5px rgba(0,0,0,.95); }
        .game-over-choice:hover,.game-over-choice:focus-visible { color:#a5f3fc; transform:translateX(3px); outline:none; }
        .game-over-choice-yes { color:#a5f3fc; }
        .game-over-cursor { color:#22d3ee; font-size:11px; }
        .game-over-cursor-hidden { opacity:0; }
        .game-over-choice-detail { margin-left:.2rem; color:#cbd5e1; font-family:Arial,Helvetica,sans-serif; font-size:clamp(13px,1.1vw,16px); font-weight:800; letter-spacing:.02em; text-shadow:0 2px 5px rgba(0,0,0,.95); }
        .game-over-copy { font-family:var(--font-press-start), "Press Start 2P", monospace !important; font-size:clamp(9px,1vw,13px) !important; font-weight:700 !important; line-height:2.15 !important; text-shadow:0 2px 8px rgba(0,0,0,.98), 1px 1px 0 #05070b; }
        @keyframes atom-game-over-enter { from {opacity:0;transform:translateY(8px) scale(.98)} to {opacity:1;transform:translateY(0) scale(1)} }
        @keyframes atom-nova-idle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @media(max-width:640px){.game-over-title{letter-spacing:-.075em;font-size:clamp(2.2rem,10.5vw,4.8rem)}.game-over-content{padding-top:1rem;padding-bottom:1rem}.game-over-heading{gap:.05rem}.game-over-choice{min-height:62px;font-size:12px;flex-wrap:wrap}.game-over-choice-detail{flex-basis:100%;margin-left:0;font-size:13px}}
        @media(prefers-reduced-motion:reduce){.game-over-content,.game-over-nova{animation:none!important}}
      `}</style>
    </main>
  );
}

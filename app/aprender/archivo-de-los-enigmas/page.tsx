"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Leaf,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

type Lesson = {
  eyebrow: string;
  title: string;
  character: string;
  dialogue: string;
  paragraphs: string[];
  takeaway: string;
};

const LESSONS: Lesson[] = [
  {
    eyebrow: "CAPÍTULO 01 · LA SEÑAL",
    title: "¿De qué está hecho el mundo?",
    character: "NOVA",
    dialogue:
      "El cristal está brillando, pero no sabemos qué es. Antes de sacar conclusiones, tenemos que observarlo y describirlo.",
    paragraphs: [
      "Nova encontró un cristal verde en las raíces del Santuario. A su alrededor había agua, aire, rocas y hojas. Orby encendió su escáner: todos esos objetos tenían algo en común. Estaban hechos de materia.",
      "La materia es todo aquello que tiene masa y ocupa un lugar en el espacio. El agua, el aire, una roca y nuestro cuerpo son ejemplos de materia. La luz que emite el cristal, en cambio, es energía: no debemos confundir el objeto que la produce con la luz que vemos.",
      "Orby explicó que la masa indica cuánta materia tiene un objeto, mientras que el volumen indica cuánto espacio ocupa. Son propiedades distintas: dos objetos pueden tener el mismo volumen y masas diferentes, o la misma masa y volúmenes distintos.",
    ],
    takeaway:
      "Materia: tiene masa y ocupa espacio. Masa y volumen describen aspectos diferentes de un objeto.",
  },
  {
    eyebrow: "CAPÍTULO 02 · EL ESCÁNER",
    title: "Las pistas que deja cada sustancia",
    character: "ORBY",
    dialogue:
      "¡No basta con decir que el cristal es verde! Necesitamos varias pistas y pruebas para describirlo de forma confiable.",
    paragraphs: [
      "Orby proyectó una lista de propiedades que los investigadores podían observar o medir. Algunas se reconocen sin transformar la sustancia: el color, el estado físico, la masa, el volumen y la densidad son ejemplos de propiedades físicas.",
      "La densidad relaciona la masa con el volumen. Se calcula dividiendo la masa entre el volumen: densidad = masa / volumen. Si dos muestras ocupan el mismo volumen, la que tenga mayor masa tendrá mayor densidad. Las unidades deben ser compatibles, por ejemplo gramos por centímetro cúbico (g/cm³).",
      "Otras propiedades describen cómo una sustancia puede transformarse químicamente. La capacidad de oxidarse o de reaccionar con otra sustancia son propiedades químicas. Para reconocerlas se considera qué sustancias había antes y cuáles se forman después de la reacción.",
      "Zyra encontró una hoja húmeda y una hoja seca. Aunque su aspecto había cambiado, eso por sí solo no demostraba que se hubiera formado una sustancia nueva. Observar un cambio no siempre basta: hay que examinar qué ocurrió.",
    ],
    takeaway:
      "Las propiedades físicas se observan o miden sin cambiar la identidad química; las químicas describen la capacidad de formar sustancias nuevas.",
  },
  {
    eyebrow: "CAPÍTULO 03 · LA PRUEBA DE NOX",
    title: "Cambiar no siempre significa transformar",
    character: "ZYRA",
    dialogue:
      "Nox ha alterado la cámara: el hielo se derrite en una esquina y un metal muestra una capa rojiza en otra. ¿Son el mismo tipo de cambio?",
    paragraphs: [
      "Zyra observó el hielo. Al derretirse, pasa de sólido a líquido, pero sigue siendo agua. Es un cambio físico: cambia el estado o la forma, no la identidad de la sustancia. La fusión, la evaporación, la condensación y la solidificación son cambios de estado.",
      "Después examinó el metal rojizo. Si el metal reaccionó con el oxígeno y se formó óxido, ocurrió un cambio químico: aparecieron sustancias con propiedades diferentes a las iniciales. La formación de gas, un cambio persistente de color o la aparición de un sólido pueden ser indicios de reacción, aunque ningún indicio aislado demuestra siempre que hubo una reacción.",
      "—Entonces no debo decidir solo por lo que veo —dijo Nova—. Debo usar las evidencias para explicar qué cambió. Orby confirmó la idea: una deformación o un cambio de estado suele ser físico; la formación de sustancias nuevas es la señal central de un cambio químico.",
    ],
    takeaway:
      "Cambio físico: no se forma una sustancia nueva. Cambio químico: se forman una o más sustancias nuevas.",
  },
];

const QUESTIONS = [
  {
    label: "PRUEBA 01 · IDENTIFICA",
    prompt: "¿Cuál de estos ejemplos es materia?",
    context: "Nova debe clasificar las señales detectadas por el escáner.",
    options: [
      { label: "A", value: "La luz que emite el cristal" },
      { label: "B", value: "El aire dentro de la cámara" },
      { label: "C", value: "El brillo observado" },
      { label: "D", value: "La energía luminosa" },
    ],
    answer: "El aire dentro de la cámara",
    explanation:
      "El aire tiene masa y ocupa espacio, por eso es materia. La luz es energía, no materia.",
  },
  {
    label: "PRUEBA 02 · INTERPRETA",
    prompt: "Dos muestras ocupan el mismo volumen. La muestra X tiene más masa que la muestra Y. ¿Qué conclusión es correcta?",
    context: "Orby compara dos minerales hallados en el santuario.",
    options: [
      { label: "A", value: "X tiene menor densidad" },
      { label: "B", value: "Las dos tienen la misma densidad" },
      { label: "C", value: "X tiene mayor densidad" },
      { label: "D", value: "No se puede comparar la densidad" },
    ],
    answer: "X tiene mayor densidad",
    explanation:
      "La densidad es masa dividida entre volumen. Si el volumen es igual, la muestra con mayor masa tiene mayor densidad.",
  },
  {
    label: "PRUEBA 03 · DISTINGUE",
    prompt: "El hielo se derrite y se convierte en agua líquida. ¿Qué tipo de cambio ocurre?",
    context: "Zyra necesita restaurar el sistema de enfriamiento.",
    options: [
      { label: "A", value: "Un cambio químico porque aparece otra sustancia" },
      { label: "B", value: "Un cambio físico porque sigue siendo agua" },
      { label: "C", value: "Una combustión" },
      { label: "D", value: "Una reacción que siempre libera gas" },
    ],
    answer: "Un cambio físico porque sigue siendo agua",
    explanation:
      "En la fusión cambia el estado físico, pero la sustancia sigue siendo agua. No se forma una sustancia nueva.",
  },
  {
    label: "DESAFÍO FINAL · EVALÚA LAS EVIDENCIAS",
    prompt: "Nox deja dos muestras: en la primera, el agua se evapora; en la segunda, un metal reacciona y forma una capa de óxido. ¿Cuál interpretación es correcta?",
    context: "Resuelve el último enigma para estabilizar el Santuario.",
    options: [
      { label: "A", value: "Ambos son cambios físicos" },
      { label: "B", value: "Ambos son cambios químicos" },
      { label: "C", value: "Evaporación física; formación de óxido química" },
      { label: "D", value: "Evaporación química; formación de óxido física" },
    ],
    answer: "Evaporación física; formación de óxido química",
    explanation:
      "La evaporación cambia el estado del agua sin cambiar su identidad química. La oxidación forma óxido, una sustancia nueva, así que es un cambio químico.",
  },
];

export default function SantuarioDeLaMateriaPage() {
  const [stage, setStage] = useState<"intro" | "lesson" | "practice" | "results">("intro");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finalized, setFinalized] = useState(false);

  const lesson = LESSONS[lessonIndex];
  const question = QUESTIONS[questionIndex];
  const isCorrect = selected === question.answer;
  const correctCount = answers.filter(Boolean).length;
  const progress =
    stage === "intro"
      ? 0
      : stage === "lesson"
        ? 8 + ((lessonIndex + 1) / LESSONS.length) * 42
        : stage === "practice"
          ? 50 + ((questionIndex + (revealed ? 1 : 0)) / QUESTIONS.length) * 50
          : 100;

  function startPractice() {
    setStage("practice");
    setQuestionIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
  }

  function checkAnswer() {
    if (!selected || revealed) return;
    setRevealed(true);
    setAnswers((previous) => [...previous, selected === question.answer]);
  }

  function nextQuestion() {
    if (questionIndex === QUESTIONS.length - 1) {
      setStage("results");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setRevealed(false);
  }

  function restart() {
    setStage("intro");
    setLessonIndex(0);
    setQuestionIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setFinalized(false);
  }

  return (
    <main className="science-mission relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#080b17] px-4 py-6 text-white sm:px-7 sm:py-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(6,8,18,.3), #080b17 88%), url("/images/challenges/levels-background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/aprender"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1020]/85 px-3 py-2.5 text-xs font-bold text-white/70 transition hover:border-emerald-200/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la ruta
        </Link>

        <header className="mission-hero mt-5 overflow-hidden rounded-2xl border border-emerald-100/15 bg-[#0b1020]/95">
          <div className="grid md:grid-cols-[1.15fr_.85fr]">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-emerald-200">
                <FlaskConical className="h-4 w-4" /> Ciencias Naturales · Ruta 01
              </div>
              <h1 className="pixel-font mt-4 text-xl leading-[1.8] text-white sm:text-2xl">
                El Santuario de la Materia
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
                Un cristal imposible ha despertado en un santuario olvidado. Acompaña a Nova, Orby y Zyra para investigar sus propiedades y descubrir qué secretos esconde la materia.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-bold text-white/70">
                  <BookOpen className="h-4 w-4 text-emerald-200" /> Historia + teoría
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/[.06] px-3 py-2 text-xs font-bold text-amber-100">
                  <Zap className="h-4 w-4" /> +25 EXP prevista
                </span>
              </div>
            </div>
            <div className="mission-art relative flex min-h-[190px] items-center justify-center overflow-hidden border-t border-white/10 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,.18),_rgba(11,16,32,.1)_55%,_rgba(5,8,18,.2))] p-6 md:border-l md:border-t-0">
              <div aria-hidden="true" className="absolute h-44 w-44 rounded-full border border-emerald-200/15" />
              <div aria-hidden="true" className="absolute h-32 w-32 rotate-45 rounded-2xl border border-cyan-200/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-emerald-100/30 bg-emerald-200/[.08] shadow-[0_0_65px_rgba(52,211,153,.14)]">
                <Atom className="h-14 w-14 text-emerald-100" strokeWidth={1.3} />
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#080b17]/80 px-3 py-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-[10px] font-bold text-white/70">EXPEDIENTE 001 · ANOMALÍA VERDE</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-5 py-4 sm:px-8">
            <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-white/45">
              <span>Progreso de la misión</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        {stage === "intro" && (
          <section className="mt-5 grid gap-4 md:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-2xl border border-emerald-100/15 bg-[#0b1020]/95 p-5 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-200/[.08]">
                <Leaf className="h-6 w-6 text-emerald-100" />
              </div>
              <p className="pixel-font mt-5 text-[9px] leading-6 text-emerald-200">PRÓLOGO</p>
              <h2 className="mt-2 text-xl font-black leading-relaxed">La señal bajo las raíces</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Una luz desconocida acaba de despertar bajo el santuario. Los registros no coinciden y Nox quiere impedir que Nova descubra su origen. Tu misión es investigar antes de sacar conclusiones.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1020]/95 p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[.14em] text-white/45">Tu expediente de explorador</p>
              <div className="mt-4 space-y-3">
                {[
                  ["01", "Reconocer la materia", "Masa, volumen y ejemplos cotidianos."],
                  ["02", "Leer las pistas", "Propiedades físicas, químicas y densidad."],
                  ["03", "Distinguir transformaciones", "Cambios físicos frente a cambios químicos."],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200/20 bg-emerald-200/[.07] text-xs font-black text-emerald-100">{number}</span>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStage("lesson")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#071510] transition hover:bg-emerald-200">
                Entrar al santuario <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {stage === "lesson" && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-100/15 bg-[#0b1020]/95">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-8">
              <p className="pixel-font text-[8px] leading-6 text-emerald-200">{lesson.eyebrow}</p>
              <p className="text-xs font-bold text-white/45">Lección {lessonIndex + 1} de {LESSONS.length}</p>
            </div>
            <div className="grid md:grid-cols-[220px_1fr]">
              <aside className="border-b border-white/10 bg-emerald-200/[.035] p-5 md:border-b-0 md:border-r">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-200/[.08]">
                  {lessonIndex === 0 ? <Sparkles className="h-10 w-10 text-emerald-100" /> : lessonIndex === 1 ? <Atom className="h-10 w-10 text-emerald-100" /> : <Leaf className="h-10 w-10 text-emerald-100" />}
                </div>
                <p className="pixel-font mt-4 text-center text-[8px] leading-6 text-emerald-200">{lesson.character}</p>
                <p className="mt-3 text-center text-sm font-bold leading-6">“{lesson.dialogue}”</p>
                <div className="mt-5 space-y-2">
                  {LESSONS.map((item, index) => (
                    <div key={item.eyebrow} className={`rounded-lg border px-3 py-2 text-[10px] font-bold ${index === lessonIndex ? "border-emerald-200/30 bg-emerald-200/[.08] text-emerald-100" : index < lessonIndex ? "border-white/10 text-white/45" : "border-white/[.06] text-white/25"}`}>
                      {index < lessonIndex ? "✓ " : `${String(index + 1).padStart(2, "0")} · `}{item.title}
                    </div>
                  ))}
                </div>
              </aside>
              <div className="p-5 sm:p-8">
                <h2 className="text-xl font-black leading-relaxed sm:text-2xl">{lesson.title}</h2>
                <div className="mt-5 space-y-4">
                  {lesson.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-7 text-white/70">{paragraph}</p>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-emerald-200/20 bg-emerald-200/[.055] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-200">Dato que debes recordar</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-white/80">{lesson.takeaway}</p>
                </div>
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => lessonIndex === 0 ? setStage("intro") : setLessonIndex((index) => index - 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/[.04]">
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </button>
                  <button onClick={() => lessonIndex === LESSONS.length - 1 ? startPractice() : setLessonIndex((index) => index + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#071510] transition hover:bg-emerald-200">
                    {lessonIndex === LESSONS.length - 1 ? "Poner a prueba lo aprendido" : "Continuar historia"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stage === "practice" && (
          <section className="mt-5 rounded-2xl border border-emerald-100/15 bg-[#0b1020]/95 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="pixel-font text-[8px] leading-6 text-emerald-200">{question.label}</p>
              <p className="text-xs font-black text-white/45">{questionIndex + 1} / {QUESTIONS.length}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${((questionIndex + (revealed ? 1 : 0)) / QUESTIONS.length) * 100}%` }} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-white/40">{question.context}</p>
            <h2 className="mt-3 text-xl font-black leading-relaxed sm:text-2xl">{question.prompt}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const active = selected === option.value;
                const correctOption = revealed && option.value === question.answer;
                const wrongSelected = revealed && active && !isCorrect;
                return (
                  <button key={option.value} type="button" onClick={() => !revealed && setSelected(option.value)} disabled={revealed} className={`flex min-h-[66px] items-center gap-3 rounded-xl border p-4 text-left transition ${correctOption ? "border-emerald-300/60 bg-emerald-300/10" : wrongSelected ? "border-rose-300/50 bg-rose-300/10" : active ? "border-emerald-200/70 bg-emerald-200/10" : "border-white/10 bg-white/[.025] hover:border-white/25 hover:bg-white/[.05]"}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-xs font-black text-emerald-100">{option.label}</span>
                    <span className="text-sm font-bold leading-6">{option.value}</span>
                    {correctOption && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-200" />}
                  </button>
                );
              })}
            </div>
            {revealed && (
              <div className={`mt-5 rounded-xl border p-4 ${isCorrect ? "border-emerald-200/20 bg-emerald-200/[.06]" : "border-amber-200/20 bg-amber-200/[.06]"}`}>
                <p className="text-sm font-black">{isCorrect ? "¡Buena observación, explorador!" : "El santuario todavía te da otra pista."}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{question.explanation}</p>
              </div>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-white/40">Lee la situación y usa las evidencias de la historia para elegir.</p>
              {!revealed ? (
                <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#071510] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={nextQuestion} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#071510] transition hover:bg-emerald-200">{questionIndex === QUESTIONS.length - 1 ? "Cerrar expediente" : "Siguiente pista"} <ArrowRight className="h-4 w-4" /></button>
              )}
            </div>
          </section>
        )}

        {stage === "results" && (
          <section className="mt-5 rounded-2xl border border-emerald-200/20 bg-[#0b1020]/95 p-6 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/25 bg-emerald-200/10 text-emerald-100">
              {correctCount >= 3 ? <Trophy className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
            </div>
            <p className="pixel-font mt-6 text-[9px] leading-6 text-emerald-200">EXPEDIENTE CERRADO</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">{correctCount >= 3 ? "¡El santuario está a salvo!" : "La investigación continúa"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">Respuestas correctas: {correctCount} de {QUESTIONS.length}. {correctCount >= 3 ? "Nova y su equipo pueden continuar con la siguiente expedición." : "Repasa las pistas y vuelve a intentarlo para consolidar lo aprendido."}</p>
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-amber-200/20 bg-amber-200/[.06] p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-black text-amber-100"><Zap className="h-4 w-4" /> Recompensa prevista: +25 EXP</p>
              <p className="mt-2 text-xs leading-5 text-white/50">Esta misión aún no guarda progreso ni acredita EXP en la cuenta. La recompensa solo debe activarse cuando la finalización esté conectada al sistema seguro de progreso de PeakScore.</p>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={restart} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/5"><RotateCcw className="h-4 w-4" /> Repetir misión</button>
              <Link href="/aprender" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-[#071510] transition hover:bg-emerald-200">Volver a la ruta <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

type Question = {
  prompt: string;
  context: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    context: "En el Santuario, Nova registra tres datos de una muestra: tiene una masa de 18 g, ocupa 6 cm³ y su superficie es plateada.",
    prompt: "¿Cuál de los datos corresponde a una propiedad general de la materia?",
    options: [
      { label: "A", text: "Su superficie plateada." },
      { label: "B", text: "Su masa de 18 g." },
      { label: "C", text: "Su apariencia brillante." },
      { label: "D", text: "Su color plateado." },
    ],
    answer: "B",
    explanation: "La masa es una propiedad general: la materia la posee sin importar de qué sustancia esté hecha. El color y el brillo describen características que pueden ayudar a distinguir materiales, pero por sí solos no identifican de manera segura una sustancia.",
  },
  {
    context: "Dos muestras tienen el mismo volumen, pero masas diferentes. Las dos se encuentran en las mismas condiciones.",
    prompt: "¿Qué propiedad permite comparar cuánta masa hay en un mismo volumen?",
    options: [
      { label: "A", text: "La densidad." },
      { label: "B", text: "La forma." },
      { label: "C", text: "El color." },
      { label: "D", text: "La longitud." },
    ],
    answer: "A",
    explanation: "La densidad relaciona la masa con el volumen: densidad = masa ÷ volumen. Si dos muestras ocupan el mismo volumen y tienen masas distintas, sus densidades también son distintas.",
  },
  {
    context: "Una estudiante afirma: «El cristal es hierro porque se ve gris y brillante». No realizó otras pruebas.",
    prompt: "¿Cuál es la mejor evaluación de esa afirmación?",
    options: [
      { label: "A", text: "Es correcta: el color demuestra que es hierro." },
      { label: "B", text: "Es correcta: todos los sólidos brillantes son metales." },
      { label: "C", text: "No está justificada; debe comparar más propiedades y reunir evidencias." },
      { label: "D", text: "Es imposible estudiar las propiedades de un cristal." },
    ],
    answer: "C",
    explanation: "El color y el brillo son observaciones útiles, pero muchos materiales pueden parecerse. Para identificar una sustancia se comparan varias propiedades y, cuando sea necesario, se realizan pruebas adecuadas. Esta diferencia entre dato y conclusión es clave en preguntas de ciencias.",
  },
];

const matterNotes = [
  {
    title: "¿Qué es la materia?",
    body: "La materia es todo aquello que tiene masa y ocupa un lugar en el espacio. El agua, el aire, una roca y tu cuerpo son materia, aunque no todos estos ejemplos se puedan observar de la misma manera.",
  },
  {
    title: "Propiedades generales",
    body: "Son propiedades que presenta la materia en general. Entre ellas están la masa —cantidad de materia de una muestra— y el volumen —espacio que ocupa—. Sirven para describir una muestra, pero normalmente no bastan para saber de qué sustancia está hecha.",
  },
  {
    title: "Propiedades específicas",
    body: "Ayudan a diferenciar materiales. Algunos ejemplos son la densidad, la solubilidad y las temperaturas de fusión o ebullición. Sus valores deben compararse en condiciones adecuadas; una sola observación visual no suele ser suficiente para identificar una sustancia.",
  },
];

export default function CristalesMisteriososPage() {
  const [stage, setStage] = useState<"theory" | "practice">("theory");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[questionIndex];
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrectCount((count) => count + 1);
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    setFinished(true);
  }

  function restartPractice() {
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <main className="lesson-shell min-h-[calc(100vh-72px)] bg-[#080b14] text-[#e8edf7]">
      <header className="lesson-topbar sticky top-0 z-30 border-b border-white/10 bg-[#070a11]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[58px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-400 sm:flex">
            <span>Ciencias Naturales</span><span>›</span>
            <span>El Santuario de la Materia</span><span>›</span>
            <span className="truncate text-cyan-100">{stage === "theory" ? "Los cristales misteriosos" : "Misión: analiza las muestras"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="pixel-font text-[8px] text-white/70">LECCIÓN 1 / 13</span>
            <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
              <div className={`h-full rounded-full bg-cyan-300 transition-all ${stage === "practice" ? "w-[65%]" : "w-[30%]"}`} />
            </div>
            <span className="pixel-font text-[8px] text-cyan-200">{stage === "theory" ? "30%" : finished ? "100%" : "65%"}</span>
          </div>
        </div>
        <div className="h-[2px] bg-white/[.04]"><div className={`h-full bg-cyan-300 transition-all duration-300 ${stage === "theory" ? "w-[30%]" : finished ? "w-full" : "w-[65%]"}`} /></div>
      </header>

      {stage === "theory" ? (
        <div className="lesson-reading mx-auto max-w-[900px] px-5 pb-28 pt-7 sm:px-8 sm:pt-10">
          <div className="mb-6">
            <p className="pixel-font text-[8px] leading-5 tracking-[0.16em] text-cyan-200/80">RUTA 01 <span className="mx-1 text-slate-600">·</span> CIENCIAS NATURALES</p>
            <h1 className="pixel-font mt-5 text-[clamp(1.05rem,2.2vw,1.65rem)] leading-[1.8] text-white">Los cristales<br className="sm:hidden" /> misteriosos</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">Primero observa. Después compara. Solo entonces saca una conclusión.</p>
          </div>

          <section className="mb-7">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)} className="flex w-full items-center justify-between border border-white/[.09] bg-[#131824] px-4 py-3 text-left transition hover:border-cyan-200/25">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-200"><span aria-hidden="true" className="text-base leading-none">📖</span> Historia</span>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </button>
            {historyOpen && (
              <div className="border-x border-b border-white/[.08] bg-[#0b101b] px-4 py-5 sm:px-5">
                <p className="text-sm leading-7 text-slate-300">Al caer la tarde, Nova llega por primera vez a un antiguo santuario escondido entre ruinas. El lugar está en silencio, salvo por el sonido del agua que cae entre las piedras. Sobre una mesa encuentra tres muestras: una roca oscura, un cristal transparente y una pieza azul que refleja la luz.</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">Nova no sabe de qué materiales están hechas ni por qué son diferentes. En vez de adivinar, abre su cuaderno y anota lo que puede observar: color, brillo, forma y tamaño. También se pregunta qué podría medir para comparar las muestras de manera justa.</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">Una pequeña inscripción aparece en la mesa: <em className="text-cyan-100">«Quien observa con cuidado encuentra mejores respuestas».</em> Nova decide comenzar por lo esencial: entender qué es la materia y cuáles propiedades permiten describirla. Su investigación apenas comienza.</p>
                <div className="mt-5 border-l-2 border-cyan-300/70 bg-cyan-300/[.045] px-4 py-3">
                  <p className="text-xs font-bold text-cyan-100">Tu papel en esta aventura</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">Ayuda a Nova a distinguir una observación de una conclusión y a elegir qué propiedades necesita comparar. Por ahora, ella investiga sola: sus próximos encuentros llegarán cuando la historia avance.</p>
                </div>
              </div>
            )}
          </section>

          <article className="space-y-6">
            <section>
              <p className="pixel-font text-[8px] leading-5 text-cyan-200">01 · CONCEPTO FUNDAMENTAL</p>
              <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">¿Qué es la materia?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300"><strong className="text-cyan-100">La materia es todo aquello que tiene masa y ocupa un lugar en el espacio.</strong> Una piedra, el agua de una botella y el aire dentro de un balón son ejemplos de materia. Aunque el aire no siempre se vea, tiene masa y ocupa espacio.</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Para estudiar una muestra, no basta con decir «se ve bonita» o «parece pesada». En ciencias describimos características mediante observaciones y mediciones, y usamos esos datos para comparar muestras.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Propiedades generales y específicas</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Las propiedades de la materia nos ayudan a describirla. Se suelen estudiar en dos grupos:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-white/10 bg-[#101725] p-4">
                  <h3 className="font-bold text-white">Propiedades generales</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Son comunes a la materia y no suelen identificar por sí solas una sustancia.</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                    <li><strong className="text-amber-200">Masa:</strong> cantidad de materia de una muestra.</li>
                    <li><strong className="text-amber-200">Volumen:</strong> espacio que ocupa.</li>
                  </ul>
                </div>
                <div className="border border-white/10 bg-[#101725] p-4">
                  <h3 className="font-bold text-white">Propiedades específicas</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Permiten comparar y, bajo condiciones controladas, ayudar a diferenciar materiales.</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                    <li><strong className="text-amber-200">Densidad:</strong> relación entre masa y volumen.</li>
                    <li><strong className="text-amber-200">Solubilidad:</strong> capacidad de disolverse en otra sustancia.</li>
                    <li><strong className="text-amber-200">Punto de fusión:</strong> temperatura a la que un sólido pasa a líquido, bajo una presión determinada.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">¿Cómo describimos una muestra?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Imagina que tienes dos cubos del mismo tamaño. Uno tiene más masa que el otro. El tamaño por sí solo no explica la diferencia: comparar la masa y el volumen permite calcular la <strong className="text-cyan-100">densidad</strong>.</p>
              <div className="my-4 border border-slate-600 bg-[#101725] p-4">
                <p className="pixel-font text-[8px] leading-5 text-slate-400">EJEMPLO GUIADO</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">Una muestra tiene una masa de 20 g y un volumen de 10 cm³.</p>
                <div className="my-3 border border-cyan-200/15 bg-[#080e19] px-4 py-3 font-mono text-sm text-cyan-100">Densidad = masa ÷ volumen<br />Densidad = 20 g ÷ 10 cm³<br />Densidad = 2 g/cm³</div>
                <p className="text-sm leading-7 text-slate-300">La operación permite comparar esta muestra con otras medidas en las mismas condiciones. No basta con observar su color para conocer su densidad.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Observación no es lo mismo que conclusión</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Si una muestra cambia de color, esa frase describe una observación. Decir que se formó una sustancia nueva ya es una conclusión que necesita más evidencias. Algunos cambios de apariencia no significan necesariamente que haya ocurrido una reacción química.</p>
              <div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave para Saber 11</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Lee qué datos entrega el enunciado, identifica qué propiedad describen y elige solo la conclusión respaldada por la evidencia. No agregues información que el problema no proporciona.</p>
              </div>
            </section>
          </article>
        </div>
      ) : (
        <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-7 sm:pt-8">
          <div className="mb-6">
            <span className="pixel-font text-[8px] leading-5 text-cyan-200">RUTA 01 · CIENCIAS NATURALES</span>
            <h1 className="pixel-font mt-3 text-[clamp(1rem,2vw,1.5rem)] leading-[1.8] text-white">Misión 1: analiza las muestras</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Consulta la teoría a la izquierda cuando la necesites. Usa las evidencias para justificar tu respuesta.</p>
          </div>

          {finished ? (
            <section className="mx-auto max-w-2xl border border-cyan-200/20 bg-[#0d1522] p-6 sm:p-9">
              <div className="flex h-14 w-14 items-center justify-center border border-cyan-200/25 bg-cyan-200/[.08]"><CheckCircle2 className="h-7 w-7 text-cyan-200" /></div>
              <h2 className="pixel-font mt-5 text-sm leading-7 text-white">Misión completada</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Respondiste correctamente {correctCount} de {questions.length} preguntas. Revisa las explicaciones y vuelve a intentarlo si quieres reforzar tus conceptos.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={restartPractice} className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 py-3 text-sm font-bold hover:bg-white/[.05]"><RotateCcw className="h-4 w-4" /> Repetir práctica</button>
                <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-11 items-center gap-2 bg-cyan-300 px-4 py-3 text-sm font-bold text-[#07111b] hover:bg-cyan-200"><BookOpen className="h-4 w-4" /> Repasar teoría</button>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">La práctica es una demostración visual; el guardado de progreso y la asignación de XP requieren integración con el sistema de progreso.</p>
            </section>
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,370px)_minmax(0,1fr)]">
              <aside className="border border-white/10 bg-[#0d1320] p-5 lg:sticky lg:top-[82px]">
                <p className="flex items-center gap-2 text-xs font-bold text-cyan-200"><BookOpen className="h-4 w-4" /> Repaso rápido</p>
                {matterNotes.map((note) => (
                  <section key={note.title} className="mt-5 border-t border-white/[.08] pt-4 first:border-0 first:pt-0">
                    <h2 className="text-sm font-bold text-white">{note.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{note.body}</p>
                  </section>
                ))}
                <div className="mt-5 border border-amber-200/25 bg-amber-200/[.04] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Recuerda</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Una observación es un dato; una conclusión debe estar respaldada por los datos.</p>
                </div>
              </aside>

              <section className="border border-cyan-200/20 bg-[#0d1522] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="pixel-font text-[8px] leading-5 text-cyan-200">PREGUNTA {questionIndex + 1} DE {questions.length}</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-200/[.05] px-3 py-1.5 text-xs font-bold text-amber-100"><Zap className="h-3.5 w-3.5" /> Práctica</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
                <p className="mt-6 text-sm leading-6 text-slate-400">{question.context}</p>
                <h2 className="mt-3 text-lg font-bold leading-8 text-white sm:text-xl">{question.prompt}</h2>
                <div className="mt-6 space-y-3">
                  {question.options.map((option) => {
                    const active = selected === option.label;
                    const correctOption = checked && option.label === question.answer;
                    const wrongOption = checked && active && !isCorrect;
                    const style = correctOption ? "border-emerald-300/50 bg-emerald-300/[.08]" : wrongOption ? "border-rose-300/50 bg-rose-300/[.07]" : active ? "border-cyan-200/60 bg-cyan-200/[.07]" : "border-white/10 bg-white/[.02] hover:border-cyan-200/30";
                    return (
                      <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`flex w-full items-start gap-3 border p-4 text-left transition ${style}`}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 text-xs font-bold text-cyan-100">{option.label}</span>
                        <span className="pt-1 text-sm leading-6 text-slate-200">{option.text}</span>
                        {correctOption && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-200" />}
                      </button>
                    );
                  })}
                </div>
                {checked && (
                  <div aria-live="polite" className={`mt-5 border p-4 ${isCorrect ? "border-emerald-300/25 bg-emerald-300/[.05]" : "border-amber-200/25 bg-amber-200/[.05]"}`}>
                    <p className="font-bold text-white">{isCorrect ? "¡Correcto! Buena lectura de la evidencia." : "Vamos a revisar el razonamiento."}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{question.explanation}</p>
                  </div>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">Selecciona una opción y comprueba tu razonamiento.</p>
                  {!checked ? (
                    <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center justify-center gap-2 bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07111b] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center justify-center gap-2 bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07111b] hover:bg-cyan-200">{questionIndex === questions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      <footer className="lesson-footer fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#101728]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[62px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-200/20 bg-cyan-200/[.06]"><BookOpen className="h-4 w-4 text-cyan-200" /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{stage === "theory" ? "Lección 1 · Teoría" : finished ? "Lección 1 · Resultado" : `Lección 1 · Práctica ${questionIndex + 1}/${questions.length}`}</p>
              <p className="mt-1 text-[10px] text-slate-400">Recompensa prevista: +10 XP</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {stage === "theory" ? (
              <>
                <Link href="/aprender/santuario-de-la-materia" className="hidden min-h-10 items-center gap-2 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white sm:inline-flex"><ArrowLeft className="h-4 w-4" /> Capítulo</Link>
                <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-10 items-center gap-2 bg-cyan-300 px-4 py-2 text-xs font-extrabold text-[#07111b] transition hover:bg-cyan-200 sm:px-5">Siguiente <ArrowRight className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Atrás</button>
                {!finished && <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:inline-flex"><FlaskConical className="h-3.5 w-3.5" /> Razonamiento científico</span>}
              </>
            )}
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .lesson-shell { font-family: var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif; }
        .lesson-shell .pixel-font { font-family: var(--font-press-start), "Press Start 2P", monospace; }
        .lesson-pixel-mark { display: inline-flex; width: 29px; height: 29px; align-items: center; justify-content: center; border: 1px solid rgba(103,232,249,.6); color: #a5f3fc; font-family: var(--font-press-start), monospace; font-size: 11px; box-shadow: 3px 3px 0 #103345; }
        .lesson-reading { padding-bottom: 112px; }
        @media (max-width: 640px) {
          .lesson-footer .text-xs { font-size: 10px; }
          .lesson-footer .min-h-10 { min-height: 38px; }
        }
      `}</style>
    </main>
  );
}

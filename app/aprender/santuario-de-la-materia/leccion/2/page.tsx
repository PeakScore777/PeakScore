"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Lightbulb } from "lucide-react";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import LessonAITutor from "@/components/aprender/LessonAITutor";

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

export default function CuandoLaMateriaCambiaPage() {
  const [stage, setStage] = useState<"theory" | "practice">("theory");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const question = questions[index];
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrect((n) => n + 1);
  }

  function nextQuestion() {
    if (index < questions.length - 1) {
      setIndex((n) => n + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrect(0);
    setFinished(false);
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
        <div className="mx-auto max-w-[760px] px-5 pt-8 sm:px-8 sm:pt-10">
          <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Capítulo 02 · Cuando la materia cambia</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">La señal de los cristales</h1>
          <p className="mt-4 text-base leading-8 text-slate-300">Los cristales azules del Santuario están cambiando. Uno conserva su forma; otro deja gotas sobre la piedra; un tercero parece convertirse en una neblina. Nova necesita descubrir si la materia desaparece, se transforma o simplemente adopta otro estado.</p>

          <LessonNotesSelection sourceTitle="Nivel 2: La señal de los cristales" sourcePath="/aprender/santuario-de-la-materia/leccion/2">
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

            <article className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-cyan-200">1. ¿Qué significa que la materia tenga distintos estados?</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">La materia está constituida por partículas —átomos, moléculas o iones— que interactúan entre sí. El estado físico que observamos depende de las condiciones del sistema, como la temperatura y la presión, y de la naturaleza de las partículas y de sus interacciones. En condiciones habituales estudiamos los estados sólido, líquido y gaseoso.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">No basta con decir que un sólido es «duro» o que un gas «no se ve». Estas descripciones no explican por qué se comportan de manera diferente. Para comprenderlo, debemos relacionar las propiedades macroscópicas —forma, volumen y compresibilidad— con la organización y el movimiento microscópico de sus partículas.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-cyan-200">2. Sólidos: estructura y estabilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un sólido, las partículas suelen permanecer próximas y sus interacciones limitan su desplazamiento. Vibran alrededor de posiciones de equilibrio y, por eso, el material conserva normalmente su forma y volumen. En sólidos cristalinos existe un patrón de organización que se repite; en sólidos amorfos, como ciertos vidrios, no hay el mismo orden de largo alcance.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La estabilidad de un sólido no significa que sus partículas estén inmóviles. Si aumenta la temperatura, suele aumentar la amplitud de sus vibraciones. Cuando las condiciones permiten la fusión, la estructura deja de mantener el orden rígido característico del sólido y las partículas pueden reorganizarse con mayor libertad.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-cyan-200">3. Líquidos: proximidad con movilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un líquido, las partículas continúan estando próximas, pero pueden cambiar de vecinas y desplazarse unas respecto de otras. Las interacciones siguen siendo importantes: por eso los líquidos mantienen un volumen aproximadamente definido y muestran poca compresibilidad en comparación con los gases. Sin embargo, no conservan una forma propia y adoptan la del recipiente.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La fluidez no significa que las partículas estén separadas como en un gas. La diferencia clave es que, en el líquido, la distancia entre partículas continúa siendo relativamente pequeña y las interacciones permiten tanto cohesión como movimiento.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-cyan-200">4. Gases: movimiento y compresibilidad</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">En un gas, las partículas están mucho más separadas que en un sólido o un líquido y se desplazan de forma continua y desordenada. Chocan entre sí y contra las paredes del recipiente. La presión se relaciona con esos choques; la temperatura, en el modelo cinético, con la energía cinética media de las partículas.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">Como hay mucho espacio disponible entre las partículas, un gas puede comprimirse de manera considerable. Si la cantidad de gas y la temperatura se mantienen constantes, reducir el volumen aumenta la frecuencia de los choques contra las paredes y, por tanto, la presión. Esta relación se conoce como ley de Boyle para un gas ideal o para sistemas que se aproximan a ese comportamiento.</p>
                <div className="mt-4 border border-cyan-200/20 bg-[#101725] p-4">
                  <p className="text-sm font-bold text-cyan-100">Conexión matemática</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">A temperatura constante y para una cantidad fija de gas ideal: P₁V₁ = P₂V₂. Si el volumen se reduce a la mitad, la presión absoluta se duplica aproximadamente. Esta predicción solo es válida bajo las condiciones asumidas; los gases reales pueden desviarse del modelo, especialmente a presiones altas o temperaturas cercanas a la condensación.</p>
                </div>
              </section>

              <section>
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

              <section>
                <h2 className="text-xl font-bold text-cyan-200">6. Temperatura, energía y cambios de estado</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">La temperatura no es lo mismo que el calor. La temperatura caracteriza el estado térmico; el calor es energía transferida entre sistemas por una diferencia de temperatura. Cuando una muestra recibe energía, puede aumentar su temperatura o experimentar un cambio de estado, según las condiciones.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">Durante la fusión de una sustancia pura a presión constante, la temperatura puede permanecer aproximadamente estable mientras coexisten sólido y líquido. La energía transferida se utiliza en el cambio de estado y en la reorganización de las partículas, no simplemente en aumentar su energía cinética media. Más adelante, la curva de calentamiento permitirá estudiar este fenómeno cuantitativamente.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">La fusión y la solidificación, la vaporización y la condensación, y la sublimación y la deposición son pares de transformaciones opuestas. En estos procesos físicos la composición química de la sustancia se conserva, aunque cambien el estado y las propiedades macroscópicas.</p>
              </section>

              <section>
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

          <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 bg-[#26364a] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-[#33465e]"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
            <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-11 items-center justify-center gap-2 border border-emerald-300/60 bg-[#75df55] px-5 py-3 text-sm font-extrabold text-[#09200a] shadow-[0_2px_0_#3a9a2b] hover:bg-[#8ced6d]">Iniciar desafío · 3 preguntas <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[980px] px-4 pb-24 pt-7 sm:px-7">
          <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Desafío del Santuario · Pregunta {index + 1} de {questions.length}</p>
          {!finished ? (
            <section className="mt-5 border border-[#35506d] bg-[#0d1422]">
              <div className="border-b border-[#293d56] bg-[#121d30] px-5 py-4">
                <p className="text-xs font-semibold text-cyan-200">{question.competency} · {question.difficulty}</p>
                <p className="mt-4 border-l-[3px] border-cyan-300 bg-[#15243a] px-4 py-4 text-sm leading-7 text-slate-100">{question.context}</p>
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
                  {!checked ? <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center gap-2 border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-sm font-bold text-cyan-100">{index === questions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>}
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-5 border border-cyan-200/25 bg-[#101725] p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-white">Desafío completado</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">Respondiste correctamente <strong className="text-cyan-100">{correct} de {questions.length}</strong> preguntas. Repasa las explicaciones y vuelve a intentarlo si quieres fortalecer tu comprensión.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={restart} className="inline-flex min-h-10 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-4 py-2 text-sm font-bold text-cyan-100">Repetir práctica <ArrowRight className="h-4 w-4" /></button>
                <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-10 items-center gap-2 border border-white/15 bg-[#26364a] px-4 py-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
              </div>
            </section>
          )}
          {!finished && <div className="mt-5 flex justify-end"><button type="button" onClick={() => setTutorOpen((v) => !v)} className="inline-flex items-center gap-2 border border-amber-300/50 bg-[#ff9f1c] px-4 py-2 text-sm font-bold text-[#251300]"><span aria-hidden="true">🤖</span> Preguntar a Orby</button></div>}
          {!finished && <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={`Nivel 2: estados de la materia, modelo cinético-molecular y cambios de estado`} stage="practice" question={question.prompt} context={`Situación: ${question.context}\nOpciones: ${question.options.map((o) => `${o.label}) ${o.text}`).join("\n")}\nExplicación: ${question.explanation}`} />}
        </div>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] backdrop-blur">
        <div className="mx-auto flex min-h-[62px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-7">
          <div><p className="pixel-font text-[8px] text-slate-100">NIVEL 2 · LECCIÓN 1</p><p className="mt-1 text-[10px] text-slate-400">{stage === "theory" ? "Teoría" : finished ? "Práctica finalizada" : `Pregunta ${index + 1} / ${questions.length}`}</p></div>
          {stage === "theory" ? <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Ir a la práctica <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-4 py-2 text-xs font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver a teoría</button>}
        </div>
      </footer>
    </main>
  );
}

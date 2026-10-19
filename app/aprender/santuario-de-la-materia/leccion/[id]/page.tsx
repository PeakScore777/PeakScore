"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FlaskConical, Lightbulb, Sparkles, Zap } from "lucide-react";

const answers = [
  { label: "A", text: "El color y la masa de la muestra", correct: false, feedback: "El color y la masa se pueden observar o medir sin convertir la muestra en otra sustancia." },
  { label: "B", text: "Que la muestra se oxidó y formó una sustancia nueva", correct: true, feedback: "La formación de una sustancia nueva es una señal de cambio químico. Aun así, se necesitan evidencias para justificar la conclusión." },
  { label: "C", text: "Que la muestra tiene una forma irregular", correct: false, feedback: "La forma irregular describe una característica física; por sí sola no demuestra que ocurrió una reacción." },
  { label: "D", text: "Que la muestra ocupa espacio", correct: false, feedback: "Ocupar espacio es una característica general de la materia, no evidencia suficiente de una reacción química." },
];

export default function CristalesMisteriososPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = answers.find((answer) => answer.label === selected)?.correct === true;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#080b12] px-4 pb-10 pt-5 text-white sm:px-7 sm:pt-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> El Santuario de la Materia</Link>
        <header className="mt-5 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Lección 1 · Historia</span>
            <span className="text-xs text-white/45">Ruta 01 / 08</span>
          </div>
          <h1 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">Los cristales misteriosos</h1>
          <p className="mt-3 text-sm leading-7 text-white/55">Observa, compara y aprende a distinguir las propiedades de la materia.</p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[12.5%] rounded-full bg-cyan-300" /></div>
        </header>

        <div className="mt-7 space-y-6">
          <section className="rounded-2xl border border-violet-300/20 bg-gradient-to-br from-[#171331] to-[#0c1224] p-5 sm:p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-violet-200"><Sparkles className="h-4 w-4" /> Historia · Entrada al santuario</p>
            <h2 className="mt-4 text-xl font-extrabold">Una señal entre los cristales</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">Nova cruza la entrada del santuario y encuentra tres cristales sobre una mesa de piedra. Uno es azul y frío al tacto; otro es transparente y deja pasar la luz; el tercero tiene manchas nuevas que no estaban allí el día anterior.</p>
            <p className="mt-3 text-sm leading-7 text-white/75">En lugar de adivinar qué ocurrió, Nova registra lo que puede observar, compara las muestras y se pregunta qué evidencia necesitaría para explicar los cambios. Tu misión es ayudarla a investigar sin confundir una observación con una conclusión.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0d1322] p-5 sm:p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-cyan-200"><BookOpen className="h-4 w-4" /> Teoría · Lo esencial</p>
            <h2 className="mt-3 text-xl font-extrabold">¿Qué es la materia?</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">La <strong className="text-cyan-100">materia</strong> es aquello que tiene masa y ocupa un lugar en el espacio. El agua, el aire, una roca y tu cuerpo están hechos de materia, aunque no siempre podamos verla a simple vista.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-cyan-200/15 bg-cyan-200/[.05] p-4">
                <h3 className="font-bold text-cyan-100">Propiedades generales</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">Son comunes a la materia, como la masa y el volumen. Ayudan a describir una muestra, pero no siempre permiten identificar qué sustancia es.</p>
              </article>
              <article className="rounded-xl border border-violet-200/15 bg-violet-200/[.05] p-4">
                <h3 className="font-bold text-violet-100">Propiedades específicas</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">Permiten diferenciar materiales en determinadas condiciones, por ejemplo la densidad, la solubilidad o la temperatura de fusión.</p>
              </article>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.05] p-4">
              <p className="flex items-center gap-2 font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Observar que algo cambió de color no demuestra por sí solo que ocurrió una reacción química. En una pregunta tipo ICFES, identifica qué datos se presentan y qué conclusión sí permiten justificar.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0d1322] p-5 sm:p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-emerald-200"><FlaskConical className="h-4 w-4" /> Ejemplo guiado</p>
            <h2 className="mt-3 text-xl font-extrabold">Observar no es lo mismo que explicar</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">Una estudiante mide la masa de un cristal, registra su color y luego nota que aparece una capa diferente en su superficie. El registro del color y la masa son observaciones; afirmar que ocurrió una reacción es una hipótesis que debe apoyarse en más evidencias.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white/[.04] p-4"><p className="text-xs font-bold uppercase tracking-wider text-white/45">Observación</p><p className="mt-2 text-sm leading-6 text-white/75">“Apareció una capa marrón en la superficie”.</p></div>
              <div className="rounded-lg bg-white/[.04] p-4"><p className="text-xs font-bold uppercase tracking-wider text-white/45">Conclusión por comprobar</p><p className="mt-2 text-sm leading-6 text-white/75">“Se formó una sustancia diferente”.</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-200/20 bg-[#0d1722] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-cyan-100"><Zap className="h-4 w-4" /> Tu misión · Pregunta tipo ICFES</div>
            <h2 className="mt-3 text-lg font-extrabold leading-7">Nova observa que la superficie de uno de los cristales cambió después de permanecer expuesta al aire. ¿Cuál afirmación describe mejor una evidencia de que pudo formarse una sustancia nueva?</h2>
            <div className="mt-5 space-y-3">
              {answers.map((answer) => {
                const active = selected === answer.label;
                const revealCorrect = checked && answer.correct;
                const revealWrong = checked && active && !answer.correct;
                return (
                  <button key={answer.label} type="button" disabled={checked} onClick={() => setSelected(answer.label)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${revealCorrect ? "border-emerald-300/50 bg-emerald-300/[.08]" : revealWrong ? "border-rose-300/50 bg-rose-300/[.08]" : active ? "border-cyan-200/50 bg-cyan-200/[.07]" : "border-white/10 bg-white/[.02] hover:border-white/25"}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs font-black text-white/75">{answer.label}</span>
                    <span className="pt-1 text-sm leading-6 text-white/80">{answer.text}</span>
                    {revealCorrect && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-200" />}
                  </button>
                );
              })}
            </div>
            {checked && (
              <div aria-live="polite" className={`mt-4 rounded-xl border p-4 ${correct ? "border-emerald-300/25 bg-emerald-300/[.06]" : "border-amber-300/25 bg-amber-300/[.06]"}`}>
                <p className="font-bold">{correct ? "¡Bien observado!" : "Revisemos la evidencia"}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{answers.find((answer) => answer.label === selected)?.feedback}</p>
              </div>
            )}
            {!checked ? (
              <button type="button" disabled={!selected} onClick={() => setChecked(true)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#07111b] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={() => { setSelected(null); setChecked(false); }} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-white/75 hover:bg-white/[.05]">Intentar de nuevo</button>
            )}
          </section>
        </div>

        <footer className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
          <span className="inline-flex items-center justify-center gap-2 text-xs text-white/45"><CheckCircle2 className="h-4 w-4" /> Lección en construcción · el progreso no se guarda todavía</span>
        </footer>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";

const QUESTIONS = [
  {
    label: "PRUEBA 01 · DESCUBRE LA REGLA",
    prompt: "Observa la secuencia: 3, 6, 12, 24, ¿qué número sigue?",
    explanation: "Cada número se obtiene multiplicando el anterior por 2. Por eso, 24 × 2 = 48.",
    options: [
      { label: "A", value: "36" },
      { label: "B", value: "42" },
      { label: "C", value: "48" },
      { label: "D", value: "30" },
    ],
    answer: "48",
  },
  {
    label: "PRUEBA 02 · COMPARA",
    prompt: "Una secuencia empieza en 5 y aumenta 4 en cada paso. ¿Cuál es el cuarto término?",
    explanation: "La secuencia es 5, 9, 13, 17. Sumamos 4 en cada paso, así que el cuarto término es 17.",
    options: [
      { label: "A", value: "13" },
      { label: "B", value: "17" },
      { label: "C", value: "20" },
      { label: "D", value: "21" },
    ],
    answer: "17",
  },
  {
    label: "PRUEBA 03 · ELIGE LA EXPRESIÓN",
    prompt: "Un patrón comienza en 2 y cada término aumenta 3. ¿Qué expresión representa el término n?",
    explanation: "El primer término es 2. Al sumar 3 por cada posición avanzada, una expresión válida es 3n − 1: para n = 1 obtenemos 2.",
    options: [
      { label: "A", value: "2n + 3" },
      { label: "B", value: "3n − 1" },
      { label: "C", value: "n + 3" },
      { label: "D", value: "3n + 1" },
    ],
    answer: "3n − 1",
  },
];

export default function ArchivoDeLosEnigmasPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[questionIndex];
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (!selected || revealed) return;
    setRevealed(true);
    if (selected === question.answer) setCorrectCount((count) => count + 1);
  }

  function nextQuestion() {
    if (questionIndex === QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setRevealed(false);
  }

  function restart() {
    setQuestionIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#080b17] px-4 py-8 text-white sm:px-7 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(6,8,18,.28), #080b17 90%), url("/images/challenges/levels-background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div className="relative mx-auto max-w-4xl">
        <Link href="/aprender" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1020]/80 px-3 py-2 text-xs font-bold text-white/70 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Volver a niveles
        </Link>

        <header className="mt-8 rounded-3xl border border-white/10 bg-[#0b1020]/90 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">
            <Sparkles className="h-4 w-4" /> Matemáticas · Desafío 01
          </div>
          <h1 className="pixel-font mt-4 text-xl leading-relaxed sm:text-2xl">El Archivo de los Enigmas</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
            El archivo está lleno de secuencias misteriosas. Encuentra la regla que conecta los números y demuestra que puedes pensar más allá de memorizar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-bold text-white/70"><Swords className="h-4 w-4 text-rose-200" /> Guardián de los Patrones</span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/[.06] px-3 py-2 text-xs font-bold text-amber-100"><Zap className="h-4 w-4" /> Recompensa prevista: +25 EXP</span>
          </div>
        </header>

        {!finished ? (
          <section className="mt-5 rounded-3xl border border-cyan-200/15 bg-[#0b1020]/95 p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="pixel-font text-[8px] leading-5 text-cyan-200">{question.label}</p>
              <p className="text-xs font-black text-white/45">{questionIndex + 1} / {QUESTIONS.length}</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} />
            </div>

            <h2 className="mt-7 text-xl font-black leading-relaxed sm:text-2xl">{question.prompt}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const active = selected === option.value;
                const correctOption = revealed && option.value === question.answer;
                const wrongSelected = revealed && active && !isCorrect;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !revealed && setSelected(option.value)}
                    disabled={revealed}
                    className={`flex min-h-[62px] items-center gap-3 rounded-xl border p-4 text-left transition ${correctOption ? "border-emerald-300/60 bg-emerald-300/10" : wrongSelected ? "border-rose-300/50 bg-rose-300/10" : active ? "border-cyan-200/70 bg-cyan-200/10" : "border-white/10 bg-white/[.025] hover:border-white/25 hover:bg-white/[.05]"}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-xs font-black text-cyan-100">{option.label}</span>
                    <span className="text-sm font-bold">{option.value}</span>
                    {correctOption && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-200" />}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className={`mt-5 rounded-xl border p-4 ${isCorrect ? "border-emerald-200/20 bg-emerald-200/[.06]" : "border-amber-200/20 bg-amber-200/[.06]"}`}>
                <p className="text-sm font-black">{isCorrect ? "¡Bien hecho! Has encontrado la regla." : "No pasa nada: veamos cómo resolverlo."}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{question.explanation}</p>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-white/40">Elige una respuesta; después podrás revisar la explicación.</p>
              {!revealed ? (
                <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#07111e] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Comprobar respuesta <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={nextQuestion} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#07111e] transition hover:bg-cyan-200">
                  {questionIndex === QUESTIONS.length - 1 ? "Terminar práctica" : "Siguiente prueba"} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-3xl border border-emerald-200/20 bg-[#0b1020]/95 p-6 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-200/10 text-amber-100"><Sparkles className="h-8 w-8" /></div>
            <p className="pixel-font mt-6 text-[9px] leading-6 text-emerald-200">PRÁCTICA COMPLETADA</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">¡Has descifrado parte del archivo!</h2>
            <p className="mt-3 text-sm text-white/60">Respuestas correctas: {correctCount} de {QUESTIONS.length}.</p>
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-amber-200/20 bg-amber-200/[.06] p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-black text-amber-100"><LockKeyhole className="h-4 w-4" /> Recompensa de +25 EXP prevista</p>
              <p className="mt-2 text-xs leading-5 text-white/50">Esta práctica es una vista funcional de demostración. La EXP no se ha añadido a tu cuenta: primero debe conectarse el guardado seguro de finalización para evitar recompensas repetidas o manipuladas.</p>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={restart} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/5">Repetir práctica</button>
              <Link href="/aprender" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-[#07111e] transition hover:bg-cyan-200">Volver a la ruta <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

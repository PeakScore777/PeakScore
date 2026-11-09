"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Atom, BookOpen, Calculator, Globe2, Landmark, PenLine } from "lucide-react";

const subjects = [
  { name: "Ciencias Naturales", detail: "Biología, química y física", icon: Atom },
  { name: "Matemáticas", detail: "Razonamiento y resolución", icon: Calculator },
  { name: "Lectura Crítica", detail: "Comprensión e interpretación", icon: BookOpen },
  { name: "Sociales y Ciudadanas", detail: "Historia, territorio y ciudadanía", icon: Landmark },
  { name: "Inglés", detail: "Práctica guiada A1–C2 y Saber 11", icon: Globe2 },
];

export default function OmegaXStudyHome() {
  const router = useRouter();
  const [subject, setSubject] = useState("Ciencias Naturales");
  const [topic, setTopic] = useState("");

  function startLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ subject, topic: topic.trim() || "Quiero comenzar desde lo básico" });
    router.push(`/orby/class?${params.toString()}`);
  }

  function chooseSubject(value: string) {
    const params = new URLSearchParams({ subject: value, topic: "" });
    router.push(`/orby/class?${params.toString()}`);
  }

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#fffdfa] px-5 py-10 text-[#242321] sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="mb-16 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3a09a]">PeakScore · Espacio de estudio</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">OmegaX</h1>
          </div>
          <div className="rounded-full border border-[#eee9e2] px-3 py-1.5 text-xs text-[#77736c]">Tu profesor de estudio</div>
        </header>

        <section className="mx-auto w-full max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f1e8df] bg-white text-[#d65a27] shadow-sm">
            <PenLine size={19} strokeWidth={1.8} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b0aaa1]">Aprende a tu ritmo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">¿Qué quieres aprender hoy?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#77736c] sm:text-base">
            Dime qué tema estás estudiando. Prepararé una clase paso a paso y construiremos los apuntes juntos en la pizarra.
          </p>

          <form onSubmit={startLesson} className="mt-9 rounded-2xl border border-[#eae5de] bg-white p-3 text-left shadow-[0_12px_45px_rgba(44,35,24,0.055)] sm:p-4">
            <label htmlFor="omega-topic" className="mb-2 block px-1 text-xs font-medium text-[#77736c]">¿Qué tema quieres entender?</label>
            <input
              id="omega-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Ej. Genética, leyes de Newton, función cuadrática..."
              className="h-12 w-full rounded-xl border border-[#eeeae4] bg-[#fffdfa] px-4 text-sm outline-none transition placeholder:text-[#b4afa7] focus:border-[#d65a27] focus:ring-2 focus:ring-[#d65a27]/10"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 px-1 text-xs text-[#77736c]">
                Materia
                <select value={subject} onChange={(event) => setSubject(event.target.value)} className="max-w-[210px] rounded-lg border border-[#eeeae4] bg-white px-2.5 py-2 text-xs font-medium text-[#393631] outline-none focus:border-[#d65a27]">
                  {subjects.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d65a27] px-5 text-sm font-semibold text-white transition hover:bg-[#bd4c20] focus:outline-none focus:ring-2 focus:ring-[#d65a27]/30 focus:ring-offset-2">
                Empezar a estudiar <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="my-10 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.16em] text-[#b0aaa1]">
            <span className="h-px flex-1 bg-[#eee9e2]" />
            O elige una materia
            <span className="h-px flex-1 bg-[#eee9e2]" />
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.name} type="button" onClick={() => chooseSubject(item.name)} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#eee9e2] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#e4b39e] hover:shadow-[0_10px_28px_rgba(44,35,24,0.06)] focus:outline-none focus:ring-2 focus:ring-[#d65a27]/20">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf4ef] text-[#c95a2d]"><Icon size={19} strokeWidth={1.7} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#33302c]">{item.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#8b857d]">{item.detail}</span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-[#c2bcb3] transition group-hover:translate-x-0.5 group-hover:text-[#d65a27]" />
              </button>
            );
          })}
        </section>
        <p className="mt-12 text-center text-xs text-[#aaa49b]">Una clase a la vez. Pregunta, interrumpe y vuelve a intentarlo cuando lo necesites.</p>
      </div>
    </main>
  );
}

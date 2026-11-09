"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Atom, BookOpen, Calculator, Globe2, Landmark, Lightbulb, MessageCircleQuestion, NotebookPen, Target } from "lucide-react";

const subjects = [
  { name: "Ciencias Naturales", detail: "Biología, química y física", icon: Atom },
  { name: "Matemáticas", detail: "Razonamiento y resolución", icon: Calculator },
  { name: "Lectura Crítica", detail: "Comprensión e interpretación", icon: BookOpen },
  { name: "Sociales y Ciudadanas", detail: "Historia, territorio y ciudadanía", icon: Landmark },
  { name: "Inglés", detail: "Práctica guiada A1–C2 y Saber 11", icon: Globe2 },
];

const studyIntents = [
  { label: "Explícame un tema", prompt: "Quiero que me expliques un tema paso a paso.", icon: Lightbulb },
  { label: "Resuelve una pregunta", prompt: "Quiero resolver una pregunta y entender cada paso.", icon: MessageCircleQuestion },
  { label: "Estudia mis apuntes", prompt: "Quiero estudiar mis apuntes contigo.", icon: NotebookPen },
  { label: "Prepárame para el ICFES", prompt: "Quiero practicar para el Saber 11 con ejercicios guiados.", icon: Target },
];

export default function OmegaXStudyHome() {
  const router = useRouter();
  const [subject, setSubject] = useState("Ciencias Naturales");
  const [topic, setTopic] = useState("");
  const [intent, setIntent] = useState(studyIntents[0].prompt);

  function startLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lessonTopic = topic.trim() || intent;
    const params = new URLSearchParams({ subject, topic: lessonTopic });
    router.push(`/orby/class?${params.toString()}`);
  }

  function chooseSubject(value: string) {
    const params = new URLSearchParams({ subject: value, topic: topic.trim() || intent });
    router.push(`/orby/class?${params.toString()}`);
  }

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#fffdfa] px-5 py-8 text-[#242321] sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="mb-12 flex items-center justify-between sm:mb-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a3a09a]">PeakScore · Espacio de estudio</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">OmegaX</h1>
          </div>
          <div className="rounded-full border border-[#eee9e2] px-3 py-1.5 text-xs text-[#77736c]">Tu profesor de estudio</div>
        </header>

        <section className="mx-auto w-full max-w-3xl text-center">
          <p className="text-sm font-medium text-[#a39b91]">Aprende a tu ritmo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">¿Qué quieres aprender hoy?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#77736c] sm:text-base">
            Elige cómo quieres estudiar. Orby te acompaña con explicaciones claras y una pizarra que construyen juntos.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {studyIntents.map((item) => {
              const Icon = item.icon;
              const active = intent === item.prompt;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setIntent(item.prompt)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#d65a27]/20 ${active ? "border-[#d65a27] bg-[#fcf4ef] text-[#a9431e]" : "border-[#eee9e2] bg-white text-[#514d47] hover:border-[#e4b39e]"}`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                  {active ? <span className="h-2 w-2 rounded-full bg-[#d65a27]" /> : null}
                </button>
              );
            })}
          </div>

          <form onSubmit={startLesson} className="mt-4 rounded-2xl border border-[#eae5de] bg-white p-3 text-left shadow-[0_12px_45px_rgba(44,35,24,0.055)] sm:p-4">
            <label htmlFor="omega-topic" className="mb-2 block px-1 text-xs font-medium text-[#77736c]">Cuéntame qué necesitas aprender</label>
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
                Empezar la clase <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>

        <section className="mx-auto mt-12 w-full max-w-4xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[#33302c]">O entra por materia</h3>
              <p className="mt-1 text-xs text-[#8b857d]">Elige un área y empezamos desde ahí.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.name} type="button" onClick={() => chooseSubject(item.name)} className="group flex min-h-[92px] items-center gap-4 rounded-2xl border border-[#eee9e2] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#e4b39e] hover:shadow-[0_10px_28px_rgba(44,35,24,0.06)] focus:outline-none focus:ring-2 focus:ring-[#d65a27]/20">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf4ef] text-[#c95a2d]"><Icon size={19} strokeWidth={1.7} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#33302c]">{item.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#8b857d]">{item.detail}</span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-[#c2bcb3] transition group-hover:translate-x-0.5 group-hover:text-[#d65a27]" />
                </button>
              );
            })}
          </div>
        </section>
        <p className="mt-10 text-center text-xs text-[#aaa49b]">Una clase a la vez. Puedes preguntar, interrumpir y volver a intentarlo cuando lo necesites.</p>
      </div>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import LessonAITutor from "@/components/aprender/LessonAITutor";

const SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Ciencias Naturales",
  "Sociales y Ciudadanas",
  "Inglés",
  "Elegir según el tema",
] as const;

export default function OrbyStuddyClassroom() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Elegir según el tema");
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  function beginClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTopic = topic.trim().replace(/\s+/g, " ");
    if (cleanTopic.length < 3) {
      setError("Escribe un tema concreto para preparar tu clase.");
      return;
    }
    if (!consent) {
      setError("Confirma primero el aviso de tratamiento de audio y texto para iniciar Gemini Live.");
      return;
    }
    setError("");
    setTopic(cleanTopic);
    setStarted(true);
  }

  if (started) {
    const selectedSubject = subject === "Elegir según el tema" ? "Preparación Saber 11" : subject;
    return (
      <LessonAITutor
        key={topic + ":" + selectedSubject}
        subject={selectedSubject}
        topic={topic}
        stage="theory"
        context="Orby es el profesor particular de PeakScore. Enseña exclusivamente contenidos y competencias de Saber 11/ICFES, con explicaciones originales en español colombiano. La hoja digital es el centro de la clase: explica y construye la pizarra progresivamente mientras habla. No enseñes programación ni promociones otros preICFES."
        open
        onOpenChange={(open) => { if (!open) setStarted(false); }}
        accent="orby"
        workspace
        assistantName="Orby"
        initialTopic={topic}
        autoStartClass
        freeTierDataUseAccepted
      />
    );
  }

  return (
    <main className="relative flex min-h-[calc(100dvh-80px)] w-full items-center justify-center overflow-hidden bg-white px-5 py-12 text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_14%,rgba(186,218,255,.28),transparent_42%),radial-gradient(ellipse_at_82%_76%,rgba(248,205,225,.22),transparent_44%),radial-gradient(ellipse_at_70%_12%,rgba(211,201,255,.18),transparent_36%)]" />
      <section className="relative mx-auto w-full max-w-[760px]">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src="/avatars/orby.webp" alt="" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-800">Orby <span className="font-normal text-slate-400">· Profesor de PeakScore</span></span>
        </div>

        <header className="mx-auto mb-9 max-w-[620px] text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.2em] text-slate-400">Tu espacio de aprendizaje</p>
          <h1 className="text-balance text-[clamp(2.1rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.055em] text-slate-900">
            ¿Qué quieres aprender hoy?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-slate-500">
            Preparamos una clase a tu ritmo. Orby explica, escribe y desarrolla los conceptos en una pizarra mientras aprendes.
          </p>
        </header>

        <form onSubmit={beginClass} className="rounded-[28px] border border-slate-200/90 bg-white/90 p-5 shadow-[0_24px_80px_rgba(36,51,82,.09)] backdrop-blur-sm sm:p-8">
          <label htmlFor="orby-class-topic" className="mb-3 block text-sm font-semibold text-slate-800">Tema de la clase</label>
          <textarea
            id="orby-class-topic"
            value={topic}
            onChange={(event) => { setTopic(event.currentTarget.value); if (error) setError(""); }}
            maxLength={180}
            rows={2}
            placeholder="Ej. La mitosis y sus etapas, leyes de Newton, funciones cuadráticas…"
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[15px] leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />

          <div className="mt-5">
            <label htmlFor="orby-class-subject" className="mb-2 block text-xs font-semibold text-slate-600">Área de estudio <span className="font-normal text-slate-400">(opcional)</span></label>
            <select
              id="orby-class-subject"
              value={subject}
              onChange={(event) => setSubject(event.currentTarget.value as (typeof SUBJECTS)[number])}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3.5 text-[11px] leading-5 text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => { setConsent(event.currentTarget.checked); if (error) setError(""); }}
              className="mt-1 h-4 w-4 shrink-0 accent-slate-800"
            />
            <span>Entiendo que la clase en vivo utiliza Gemini Live y que el audio y el texto de la sesión se procesan según las condiciones del nivel gratuito del proveedor. Si el servicio o su cuota gratuita no están disponibles, la clase no cambiará a un proveedor de pago.</span>
          </label>

          {error && <p role="alert" className="mt-4 text-xs font-medium text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={topic.trim().length < 3 || !consent}
            className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Comenzar clase <span aria-hidden="true">→</span>
          </button>
          <p className="mt-4 text-center text-[10px] leading-5 text-slate-400">Clases enfocadas en las competencias de Saber 11 · Contenido original</p>
        </form>
      </section>
    </main>
  );
}

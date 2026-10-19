"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown,
  ChevronRight, Clock3, FlaskConical, LockKeyhole, Play, Sparkles, Zap,
} from "lucide-react";

const chapters = [
  {
    id: "01",
    title: "El misterio de los cristales",
    description: "Aprende a observar la materia antes de explicar sus cambios.",
    lessons: [
      { id: "1", title: "Los cristales misteriosos", duration: "10 min", status: "available" },
      { id: "2", title: "¿De qué está hecho todo?", duration: "8 min", status: "soon" },
      { id: "3", title: "Propiedades que nos dan pistas", duration: "10 min", status: "soon" },
    ],
  },
  {
    id: "02",
    title: "Cuando la materia cambia",
    description: "Distingue los estados de la materia y sus transformaciones.",
    lessons: [
      { id: "4", title: "Sólido, líquido y gas", duration: "9 min", status: "soon" },
      { id: "5", title: "Cambios físicos y químicos", duration: "10 min", status: "soon" },
    ],
  },
  {
    id: "03",
    title: "El laboratorio de observación",
    description: "Usa datos, comparaciones y evidencias para explicar fenómenos.",
    lessons: [
      { id: "6", title: "Densidad: una pista importante", duration: "10 min", status: "soon" },
      { id: "7", title: "La materia no desaparece", duration: "8 min", status: "soon" },
      { id: "8", title: "Desafío final del santuario", duration: "12 min", status: "soon" },
    ],
  },
];

export default function SantuarioDeLaMateriaPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);
  const toggle = (id: string) =>
    setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#080b12] px-4 py-6 text-white sm:px-7 sm:py-9">
      <div className="mx-auto max-w-5xl">
        <Link href="/aprender" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Volver a las rutas
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#101729]">
          <div className="relative min-h-56 overflow-hidden bg-gradient-to-br from-[#182b3c] via-[#152033] to-[#17132b] p-6 sm:min-h-64 sm:p-9">
            <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(105,188,226,.45), transparent 35%), radial-gradient(circle at 20% 100%, rgba(133,99,220,.3), transparent 45%)" }} />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-200">Ruta 01 · Ciencias Naturales</p>
              <h1 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">El Santuario de la Materia</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
                Nova ha encontrado unos cristales extraños dentro de un santuario antiguo. Observa sus propiedades, reúne evidencias y descubre qué nos cuenta la materia sobre el mundo.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><BookOpen className="h-4 w-4 text-cyan-200" /> 8 lecciones planificadas</span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><Clock3 className="h-4 w-4 text-violet-200" /> 70–80 min aprox.</span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><Zap className="h-4 w-4 text-amber-200" /> EXP por completar</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 border-t border-white/10 bg-[#0c1220] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
            <div>
              <div className="flex items-center justify-between gap-4 text-xs text-white/60">
                <span>Progreso de la ruta</span><span>0 de 8 lecciones</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-0 rounded-full bg-cyan-300" /></div>
              <p className="mt-2 text-xs text-white/40">Tu avance aparecerá aquí a medida que completes las lecciones.</p>
            </div>
            <Link href="/aprender/santuario-de-la-materia/leccion/1" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#07111b] transition hover:bg-cyan-200">
              <Play className="h-4 w-4 fill-current" /> Comenzar ruta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-200">Tu recorrido</p>
            <h2 className="mt-2 text-xl font-extrabold">Capítulos y lecciones</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Avanza paso a paso: primero observa, luego comprende y finalmente demuestra lo que aprendiste con retos de razonamiento tipo ICFES.</p>
          </div>

          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              return (
                <section key={chapter.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1322]">
                  <button type="button" onClick={() => toggle(chapter.id)} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[.025] sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-300/10 text-sm font-black text-violet-100">{chapter.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-6 text-white">{chapter.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/50">{chapter.description}</span>
                      <span className="mt-2 block text-[11px] text-white/35">{chapter.lessons.length} lecciones</span>
                    </span>
                    {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-white/55" /> : <ChevronRight className="h-5 w-5 shrink-0 text-white/55" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/10">
                      {chapter.lessons.map((lesson, index) => {
                        const available = lesson.status === "available";
                        const Row = (
                          <div className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${available ? "transition hover:bg-cyan-300/[.04]" : "opacity-55"}`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${available ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-100" : "border-white/10 bg-white/[.03] text-white/50"}`}>
                              {available ? <Play className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-white/90">{lesson.title}</span>
                              <span className="mt-1 block text-xs text-white/40">{lesson.duration} · {available ? "Disponible" : "En preparación"}</span>
                            </span>
                            {available ? <ArrowRight className="h-4 w-4 text-cyan-200" /> : <span className="text-[10px] uppercase tracking-wider text-white/35">Próximamente</span>}
                          </div>
                        );
                        return available ? (
                          <Link key={lesson.id} href={`/aprender/santuario-de-la-materia/leccion/${lesson.id}`} className="block border-b border-white/[.06] last:border-b-0">{Row}</Link>
                        ) : (
                          <div key={lesson.id} aria-disabled="true" className="border-b border-white/[.06] last:border-b-0">{Row}</div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-300/15 bg-violet-300/[.04] p-4 text-sm leading-6 text-white/60">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" />
          <p>Esta ruta se centra en las propiedades y los cambios de la materia. Las mezclas, el átomo y la tabla periódica tendrán sus propios recorridos para que cada tema se aprenda con profundidad y sin repetir contenido innecesariamente.</p>
        </div>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight,
  Clock3, Grid2X2, LockKeyhole, Play, Sparkles, Zap,
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  duration: string;
  available?: boolean;
};

type Chapter = {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
  available?: boolean;
};

const chapters: Chapter[] = [
  {
    id: "01",
    title: "El misterio de los cristales",
    description: "Aprende a observar la materia antes de explicar sus cambios.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    available: true,
    lessons: [
      { id: "1", title: "Los cristales misteriosos", duration: "10 min", available: true },
      { id: "2", title: "¿Qué es la materia?", duration: "8 min" },
      { id: "3", title: "Propiedades generales y específicas", duration: "10 min" },
      { id: "4", title: "Estados de la materia", duration: "10 min" },
      { id: "5", title: "Cambios físicos y químicos", duration: "10 min" },
      { id: "6", title: "Desafío: el primer cristal", duration: "12 min" },
    ],
  },
  {
    id: "02",
    title: "Cuando la materia cambia",
    description: "Distingue los estados de la materia y sus transformaciones.",
    image: "/images/aprender/santuario/cuando-la-materia-cambia.png",
    lessons: [
      { id: "7", title: "Sólido, líquido y gas", duration: "9 min" },
      { id: "8", title: "Cambios físicos y químicos", duration: "10 min" },
    ],
  },
  {
    id: "03",
    title: "El laboratorio de las mezclas",
    description: "Identifica sustancias, mezclas y métodos de separación.",
    image: "/images/aprender/santuario/laboratorio-mezclas.png",
    lessons: [
      { id: "9", title: "Sustancias puras y mezclas", duration: "10 min" },
      { id: "10", title: "Separa la muestra", duration: "12 min" },
    ],
  },
  {
    id: "04",
    title: "El código del átomo",
    description: "Descubre la estructura de la materia y cómo se organizan los elementos.",
    image: "/images/aprender/santuario/codigo-atomo.png",
    lessons: [
      { id: "11", title: "Dentro del átomo", duration: "10 min" },
      { id: "12", title: "Las pistas de los elementos", duration: "12 min" },
    ],
  },
  {
    id: "05",
    title: "El guardián de los elementos",
    description: "Demuestra todo lo que aprendiste en un desafío final.",
    image: "/images/aprender/santuario/guardian-elementos.png",
    lessons: [
      { id: "13", title: "Desafío final del santuario", duration: "15 min" },
    ],
  },
];

const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

export default function SantuarioDeLaMateriaPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);
  const [detailedView, setDetailedView] = useState(true);

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#050914] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/aprender"
          className="group inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Volver a las rutas
        </Link>

        <section className="relative mt-3 overflow-hidden rounded-[22px] border border-cyan-100/10 bg-[#091322] shadow-[0_22px_70px_rgba(0,0,0,.28)]">
          <div className="absolute inset-0">
            <Image
              src="/images/aprender/santuario/santuario-encabezado.png"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1440px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#06101ff5_0%,rgba(6,16,31,.96)_24%,rgba(6,16,31,.72)_47%,rgba(6,16,31,.16)_76%,rgba(6,16,31,.1)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] via-transparent to-black/10" />
          </div>

          <div className="relative grid min-h-[350px] items-end px-5 pb-8 pt-8 sm:min-h-[390px] sm:px-8 sm:pb-9 lg:min-h-[420px] lg:px-10">
            <div className="max-w-[610px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-[#07131f]/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-cyan-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Ruta 01 <span className="text-white/30">·</span> Ciencias Naturales
              </div>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-5xl lg:text-[3.8rem]">
                El Santuario
                <br />
                de la <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-emerald-300 bg-clip-text text-transparent">Materia</span>
              </h1>
              <p className="mt-4 max-w-[530px] text-sm leading-6 text-slate-100/80 sm:text-base sm:leading-7">
                Nova ha encontrado unos cristales extraños dentro de un santuario antiguo. Observa sus propiedades, reúne evidencias y descubre qué nos cuenta la materia sobre el mundo.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-[#06101d]/75 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur"><BookOpen className="h-4 w-4 text-cyan-200" /> {totalLessons} lecciones</span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200/20 bg-[#06101d]/75 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur"><Clock3 className="h-4 w-4 text-violet-200" /> 2 h 20 min aprox.</span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200/20 bg-[#06101d]/75 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur"><Zap className="h-4 w-4 text-amber-300" /> EXP por completar</span>
              </div>
            </div>
            <span className="absolute right-5 top-5 rounded-lg border border-emerald-300/30 bg-[#062b29]/85 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 backdrop-blur sm:right-8 sm:top-7">
              Nivel básico
            </span>
          </div>

          <div className="relative border-t border-white/10 bg-[#07101eeF] px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-200">Progreso de la ruta</span>
                  <span className="font-bold tabular-nums text-white/90">0%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Tu avance aparecerá aquí a medida que completes las lecciones.</p>
              </div>
              <Link
                href="/aprender/santuario-de-la-materia/leccion/1"
                className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-black text-[#07101c] shadow-[0_8px_28px_rgba(70,190,255,.16)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <Play className="h-4 w-4 fill-current" /> Comenzar ruta
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-9 sm:mt-11">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> Tu recorrido</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Capítulos y lecciones</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/75">Avanza paso a paso: primero observa, luego comprende y finalmente demuestra lo que aprendiste con retos de razonamiento tipo ICFES.</p>
            </div>
            <button
              type="button"
              onClick={() => setDetailedView((value) => !value)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/10 bg-white/[.025] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-200/30 hover:text-white sm:self-auto"
              aria-pressed={detailedView}
            >
              <Grid2X2 className="h-4 w-4" /> {detailedView ? "Vista detallada" : "Vista compacta"}
            </button>
          </div>

          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              const isAvailable = Boolean(chapter.available);
              return (
                <section key={chapter.id} className="overflow-hidden rounded-[17px] border border-[#23334a] bg-[linear-gradient(115deg,rgba(12,25,43,.96),rgba(7,15,28,.98))] shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors hover:border-[#31465f]">
                  <button
                    type="button"
                    onClick={() => toggle(chapter.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[.025] sm:gap-4 sm:px-5 sm:py-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/15 text-sm font-black text-white shadow-inner sm:h-11 sm:w-11">{chapter.id}</span>
                    <div className="relative h-[62px] w-[112px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b1728] sm:h-[70px] sm:w-[160px]">
                      <Image src={chapter.image} alt="" fill sizes="160px" className="object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                    </div>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="block text-sm font-extrabold leading-5 text-white sm:text-base">{chapter.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-300/80">{chapter.description}</span>
                    </span>
                    <span className="hidden shrink-0 sm:inline-flex">
                      {isAvailable ? (
                        <span className="rounded-lg border border-emerald-300/30 bg-emerald-300/[.08] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">Disponible</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Bloqueado</span>
                      )}
                    </span>
                    {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-violet-200" /> : <ChevronRight className="h-5 w-5 shrink-0 text-violet-200" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/[.07] bg-[#050b15]/45 p-2 sm:p-3">
                      <div className={detailedView ? "grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]" : "grid gap-3"}>
                        {detailedView && (
                          <div className="relative hidden min-h-[245px] overflow-hidden rounded-xl border border-white/10 bg-[#0a1422] lg:block">
                            <Image src={chapter.image} alt="" fill sizes="230px" className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#040a13]/80 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur">Capítulo {chapter.id}</span>
                              <p className="mt-2 text-sm font-extrabold leading-5 text-white">{chapter.title}</p>
                            </div>
                          </div>
                        )}
                        <div className="min-w-0 overflow-hidden rounded-xl border border-white/[.07]">
                          {chapter.lessons.map((lesson) => {
                            const available = Boolean(lesson.available);
                            const row = (
                              <div className={`group flex min-h-[51px] items-center gap-3 px-3 py-2.5 transition sm:px-4 ${available ? "hover:bg-cyan-200/[.045]" : "opacity-60"}`}>
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${available ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[.035] text-slate-400"}`}>
                                  {available ? <Play className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                                </span>
                                <span className="min-w-0 flex-1 text-sm">
                                  <span className={`block leading-5 ${available ? "font-bold text-white" : "font-medium text-slate-300"}`}>{lesson.id}. {lesson.title}</span>
                                  {!detailedView && <span className="mt-0.5 block text-[11px] text-slate-400">{lesson.duration}</span>}
                                </span>
                                <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{lesson.duration}</span>
                                {available ? <ArrowRight className="h-4 w-4 shrink-0 text-cyan-200 transition group-hover:translate-x-0.5" /> : <span className="w-4 shrink-0" />}
                              </div>
                            );
                            return available ? (
                              <Link key={lesson.id} href={`/aprender/santuario-de-la-materia/leccion/${lesson.id}`} className="block border-b border-white/[.06] last:border-b-0">{row}</Link>
                            ) : (
                              <div key={lesson.id} aria-disabled="true" className="border-b border-white/[.06] last:border-b-0">{row}</div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-300/15 bg-violet-300/[.04] p-4 text-sm leading-6 text-slate-300/75">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" />
          <p>La ruta combina observación, explicación de fenómenos e investigación científica. Los capítulos se desbloquearán a medida que construyamos sus lecciones y retos originales de preparación para el ICFES.</p>
        </div>
      </div>
    </main>
  );
}

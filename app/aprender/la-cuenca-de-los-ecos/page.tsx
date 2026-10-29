"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";

type Lesson = {
  id: string;
  number: string;
  title: string;
  available: boolean;
  href?: string;
};

type Chapter = {
  id: string;
  title: string;
  description: string;
  available: boolean;
  lessons: Lesson[];
};

const chapters: Chapter[] = [
  {
    id: "01",
    title: "El Bosque que Dejó de Cantar",
    description: "Reconstruye el ecosistema: identifica los organismos, las condiciones del ambiente y las relaciones entre ellos.",
    available: true,
    lessons: [
      { id: "historia", number: "1", title: "Registro de campo: el bosque silencioso", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1" },
      { id: "ecosistema", number: "2", title: "¿Qué es un ecosistema?", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1#ecosistema" },
      { id: "habitat-poblacion-nicho", number: "3", title: "Hábitat, población y nicho", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1#habitat-poblacion-nicho" },
      { id: "evidencia-ecosistema", number: "4", title: "De la observación a una explicación", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1#evidencia-ecosistema" },
      { id: "puntos-clave", number: "5", title: "Claves para preguntas Saber 11", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1#puntos-clave" },
    ],
  },
  {
    id: "02",
    title: "Las Alianzas Invisibles",
    description: "Próximo capítulo: descubre las relaciones entre especies y cómo influyen en el equilibrio de la cuenca.",
    available: false,
    lessons: [
      { id: "mutualismo", number: "1", title: "Cooperación y mutualismo", available: false },
      { id: "competencia", number: "2", title: "Competencia por recursos", available: false },
      { id: "depredacion", number: "3", title: "Depredación y parasitismo", available: false },
    ],
  },
  {
    id: "03",
    title: "La Cadena Rota",
    description: "Próximo capítulo: sigue el recorrido de la energía y la materia en las redes tróficas.",
    available: false,
    lessons: [
      { id: "cadenas", number: "1", title: "Cadenas y redes alimentarias", available: false },
      { id: "energia", number: "2", title: "Flujo de energía", available: false },
      { id: "ciclos", number: "3", title: "Ciclos de la materia", available: false },
    ],
  },
  {
    id: "04",
    title: "El Guardián del Equilibrio",
    description: "Desafío final planificado: interpreta datos y argumenta una explicación basada en evidencias.",
    available: false,
    lessons: [
      { id: "indagacion-final", number: "1", title: "Desafío integrador de ecología", available: false },
    ],
  },
];

const totalLessons = chapters
  .filter((chapter) => chapter.available)
  .reduce((sum, chapter) => sum + chapter.lessons.filter((lesson) => lesson.available).length, 0);

export default function LaCuencaDeLosEcosPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="pixel-font min-h-[calc(100vh-72px)] overflow-hidden bg-[#050914] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/aprender"
          className="group inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Volver a las rutas
        </Link>

        <section className="relative mt-3 overflow-hidden rounded-[22px] border border-emerald-100/10 bg-[#091817] shadow-[0_22px_70px_rgba(0,0,0,.28)]">
          <div className="absolute inset-0">
            <Image
              src="/images/aprender/cuenca-de-los-ecos/header.svg"
              alt="Río que atraviesa el bosque de la Cuenca de los Ecos"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1440px"
              className="object-cover object-[center_52%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#061411f5_0%,rgba(6,20,17,.96)_24%,rgba(6,20,17,.76)_48%,rgba(6,20,17,.18)_78%,rgba(6,20,17,.1)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071511] via-transparent to-black/10" />
          </div>

          <div className="relative grid min-h-[350px] items-end px-5 pb-8 pt-8 sm:min-h-[390px] sm:px-8 sm:pb-9 lg:min-h-[420px] lg:px-10">
            <div className="max-w-[610px]">
              <div className="inline-flex items-center gap-2 border-2 border-emerald-300/50 bg-[#071710]/90 px-3 py-2 text-[9px] font-normal uppercase tracking-[.08em] text-emerald-200 [box-shadow:3px_3px_0_#163b2c]">
                Ruta 02 <span className="text-white/30">·</span> Biología y Ecología
              </div>
              <h1 className="mt-5 pixel-font text-[clamp(1.25rem,2.5vw,2.5rem)] font-normal leading-[1.55] tracking-normal">
                La Cuenca
                <br />
                de los <span className="bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Ecos</span>
              </h1>
              <p className="mt-4 max-w-[530px] text-[9px] leading-[2.2] text-slate-100/80 sm:text-[10px]">
                Después de estudiar los cristales del Santuario de la Materia, Nova sigue una señal hasta un bosque demasiado silencioso. Observa el agua, registra las especies y reúne evidencias antes de explicar qué cambió en el ecosistema.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="border border-emerald-200/35 bg-[#061410]/90 px-3 py-2 text-[8px] leading-5 text-emerald-100 [box-shadow:3px_3px_0_#163b2c]">{totalLessons} LECCIONES</span>
                <span className="border border-amber-200/35 bg-[#061410]/90 px-3 py-2 text-[8px] leading-5 text-amber-100 [box-shadow:3px_3px_0_#493716]">EXP POR COMPLETAR</span>
              </div>
            </div>
            <span className="absolute right-5 top-5 border-2 border-emerald-300/50 bg-[#062b24]/95 px-3 py-2 text-[8px] font-normal uppercase tracking-normal text-emerald-200 [box-shadow:3px_3px_0_#12453c] sm:right-8 sm:top-7">
              Nivel básico
            </span>
          </div>

          <div className="relative border-t border-white/10 bg-[#071511ef] px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-200">Progreso de la ruta</span>
                  <span className="font-bold tabular-nums text-white/90">0%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-300" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Tu avance aparecerá aquí a medida que completes las lecciones.</p>
              </div>
              <Link
                href="/aprender/la-cuenca-de-los-ecos/leccion/1"
                className="group inline-flex min-h-[54px] items-center justify-center gap-3 border-2 border-emerald-200 bg-[#103024] px-6 py-3 text-[9px] font-normal uppercase tracking-[.04em] text-emerald-100 [box-shadow:5px_5px_0_#03120d] transition-[transform,box-shadow,background-color] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#164333] hover:shadow-[3px_3px_0_#03120d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                <span className="inline-block h-2.5 w-2.5 bg-emerald-200 [clip-path:polygon(0_0,100%_50%,0_100%)]" /> INICIAR RUTA
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-9 sm:mt-11">
          <div className="mb-5">
            <p className="text-[9px] font-normal uppercase tracking-[.12em] text-emerald-200">Tu recorrido</p>
            <h2 className="mt-2 text-[clamp(1rem,1.7vw,1.5rem)] font-normal leading-[1.8] tracking-normal">Capítulos y lecciones</h2>
            <p className="mt-2 max-w-3xl text-[9px] leading-[2.1] text-slate-300/75">
              Avanza paso a paso: observa las pistas, comprende las relaciones del ecosistema y resuelve desafíos de razonamiento tipo ICFES.
            </p>
          </div>

          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              const isAvailable = chapter.available;
              return (
                <section
                  key={chapter.id}
                  className={"overflow-hidden rounded-[17px] border shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors " + (isAvailable ? "border-[#233d3a] bg-[linear-gradient(115deg,rgba(12,32,29,.96),rgba(7,18,19,.98)] hover:border-[#31524d]" : "border-[#26303d] bg-[linear-gradient(115deg,rgba(12,20,31,.8),rgba(7,13,23,.9)] opacity-75")}
                >
                  <button
                    type="button"
                    onClick={() => isAvailable && toggle(chapter.id)}
                    aria-expanded={isAvailable ? isOpen : false}
                    aria-disabled={!isAvailable}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[.025] sm:gap-4 sm:px-5 sm:py-3.5 disabled:cursor-not-allowed"
                    disabled={!isAvailable}
                  >
                    <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black text-white shadow-inner sm:h-11 sm:w-11 " + (isAvailable ? "border-emerald-400/40 bg-emerald-400/15" : "border-slate-500/30 bg-slate-500/10 text-slate-400")}>{chapter.id}</span>
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
                    {isAvailable ? (isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-emerald-200" /> : <ChevronRight className="h-5 w-5 shrink-0 text-emerald-200" />) : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />}
                  </button>

                  {isAvailable && isOpen && (
                    <div className="border-t border-white/[.07] bg-[#050b15]/45 p-2 sm:p-3">
                      <div className="min-w-0 overflow-hidden rounded-xl border border-white/[.07]">
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const row = (
                            <div className="group flex min-h-[51px] items-center gap-3 px-3 py-2.5 transition hover:bg-emerald-200/[.045] sm:px-4">
                              <span className="min-w-0 flex-1 text-sm">
                                <span className="block leading-5 font-bold text-white">{lesson.number || lessonIndex + 1}. {lesson.title}</span>
                              </span>
                              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-200/70 transition group-hover:translate-x-1" />
                            </div>
                          );
                          return lesson.available && lesson.href ? (
                            <Link key={lesson.id} href={lesson.href} className="block border-b border-white/[.06] last:border-b-0">{row}</Link>
                          ) : (
                            <div key={lesson.id} aria-disabled="true" className="border-b border-white/[.06] last:border-b-0 opacity-60">{row}</div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <div className="mt-6 border border-emerald-300/20 bg-[#08130e] p-4 text-[8px] leading-[2.2] text-slate-300/75 [box-shadow:4px_4px_0_#102319]">
          <p>La ruta combina observación, explicación de fenómenos e indagación científica. Los registros de la historia sirven para practicar interpretación de evidencias; no prueban por sí solos la causa de un cambio ambiental.</p>
        </div>
      </div>
    </main>
  );
}

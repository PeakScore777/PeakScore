"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import {
  CUENCA_PROGRESS_EVENT,
  markCuencaLessonVisited,
  readCuencaChapterProgress,
  type CuencaChapterProgress,
} from "@/lib/learning-course-progress";

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

export default function LaCuencaDeLosEcosPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);
  const [courseProgress, setCourseProgress] = useState<CuencaChapterProgress>({
    visitedLessonIds: [],
    completed: false,
  });

  useEffect(() => {
    const syncProgress = () => setCourseProgress(readCuencaChapterProgress());
    syncProgress();
    window.addEventListener(CUENCA_PROGRESS_EVENT, syncProgress);
    window.addEventListener("storage", syncProgress);
    return () => {
      window.removeEventListener(CUENCA_PROGRESS_EVENT, syncProgress);
      window.removeEventListener("storage", syncProgress);
    };
  }, []);

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#0e111a] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1040px]">
        <section className="relative overflow-hidden rounded-[18px] border border-[#252d40] bg-[#091817] shadow-[0_18px_50px_rgba(0,0,0,.3)]">
          <div className="absolute inset-0">
            <Image
              src="/images/aprender/cuenca-de-los-ecos/header.svg"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1440px"
              className="object-cover object-[center_52%]"
            />
            <video
              aria-hidden="true"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/aprender/cuenca-de-los-ecos/header.svg"
              className="absolute inset-0 h-full w-full object-cover object-[center_52%] motion-reduce:hidden"
            >
              <source src="/video/aprender/cuenca-de-los-ecos.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#061411f5_0%,rgba(6,20,17,.96)_24%,rgba(6,20,17,.76)_48%,rgba(6,20,17,.18)_78%,rgba(6,20,17,.1)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071511] via-transparent to-black/10" />
          </div>

          <div className="relative grid min-h-[240px] items-end px-5 pb-6 pt-7 sm:min-h-[260px] sm:px-7 sm:pb-7 lg:min-h-[270px] lg:px-8">
            <div className="max-w-[760px]">
              <div className="inline-flex items-center gap-2 rounded border-2 border-emerald-300/50 bg-[#071710]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-emerald-200 [box-shadow:3px_3px_0_#163b2c]">
                Ruta 02 <span className="text-white/30">·</span> Biología y Ecología
              </div>
              <h1 className="pixel-font mt-4 text-[clamp(1.65rem,2.5vw,2.5rem)] font-normal leading-[1.2] tracking-normal">
                La Cuenca de los <span className="bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Ecos</span>
              </h1>
              <p className="mt-3 max-w-[680px] text-sm leading-6 text-slate-100/85">
                Después de estudiar los cristales del Santuario de la Materia, Nova sigue una señal hasta un bosque demasiado silencioso. Observa el agua, registra las especies y reúne evidencias antes de explicar qué cambió en el ecosistema.
              </p>
              <Link
                href="/aprender/la-cuenca-de-los-ecos/leccion/1"
                className="group relative mt-5 inline-flex min-h-11 min-w-[188px] items-center justify-center rounded-md border-2 border-[#ffe08a] bg-[#f7c948] px-5 py-3 text-[11px] font-extrabold tracking-[.02em] text-[#17130c] shadow-[0_4px_0_#8b681b] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#ffda69] hover:shadow-[0_5px_0_#8b681b] active:translate-y-0 active:shadow-none"
              >
                <span className="transition-opacity group-hover:opacity-0">
                  {courseProgress.completed ? "Repasar" : "Comenzar a estudiar"}
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  {courseProgress.completed ? "Repasar" : "+50 XP"}
                </span>
              </Link>
            </div>
            <span className="absolute right-4 top-4 border-2 border-emerald-300/50 bg-[#062b24]/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-normal text-emerald-200 [box-shadow:3px_3px_0_#12453c] sm:right-6 sm:top-6">
              Nivel básico
            </span>
          </div>
        </section>

        <section className="mt-7 sm:mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-200">Tu recorrido</p>
            <h2 className="pixel-font mt-2 text-[clamp(1rem,1.7vw,1.45rem)] font-normal leading-[1.8] tracking-normal">Capítulos y lecciones</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/75">
              Avanza paso a paso: observa las pistas, comprende las relaciones del ecosistema y resuelve desafíos de razonamiento tipo ICFES.
            </p>
          </div>

          <div className="relative space-y-3">
            <span aria-hidden="true" className="pointer-events-none absolute bottom-6 left-[30px] top-6 z-0 w-px bg-[#30394f] sm:left-[34px]" />
            {chapters.map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              const isAvailable = chapter.available;
              return (
                <section
                  key={chapter.id}
                  className={"relative z-[1] overflow-hidden rounded-xl border shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors " + (isAvailable ? "border-[#30394f] bg-[#1a2030] hover:border-[#46516d]" : "border-[#283044] bg-[#131a29]")}
                >
                  <button
                    type="button"
                    onClick={() => isAvailable && toggle(chapter.id)}
                    aria-expanded={isAvailable ? isOpen : false}
                    aria-disabled={!isAvailable}
                    className="flex min-h-[62px] w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[.035] sm:gap-4 sm:px-4 sm:py-3 disabled:cursor-not-allowed"
                    disabled={!isAvailable}
                  >
                    <span className={"pixel-font relative z-[2] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[9px] font-normal text-white " + (isAvailable ? "border-[#46516c] bg-[#111725]" : "border-[#384154] bg-[#131a29] text-slate-400")}>{Number(chapter.id)}</span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="pixel-font block text-[13px] font-normal leading-6 text-white sm:text-[14px]">{chapter.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-300/80">{chapter.description}</span>
                    </span>
                    <span className={"hidden shrink-0 text-[9px] font-extrabold uppercase tracking-[.12em] sm:inline-flex " + (isAvailable ? "text-emerald-200" : "text-slate-500")}>
                      {isAvailable ? (chapter.id === "01" && courseProgress.completed ? "Completado" : "En curso") : "Próximamente"}
                    </span>
                    {isAvailable ? (isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-emerald-200" /> : <ChevronRight className="h-5 w-5 shrink-0 text-emerald-200" />) : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />}
                  </button>

                  {isAvailable && isOpen && (
                    <div className="relative border-t border-white/[.07] bg-[#0d121c] py-1">
                      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[30px] top-0 z-0 w-px bg-[#30394f] sm:left-[34px]" />
                      <div className="relative z-[1] pl-[46px] pr-2 sm:pl-[53px] sm:pr-4">
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const isVisited = courseProgress.completed || courseProgress.visitedLessonIds.includes(lesson.id);
                          const previousLesson = chapter.lessons[lessonIndex - 1];
                          const isUnlocked = lesson.available && (
                            lessonIndex === 0 ||
                            courseProgress.completed ||
                            Boolean(previousLesson && courseProgress.visitedLessonIds.includes(previousLesson.id))
                          );
                          const isActive = isUnlocked && !isVisited;
                          const row = (
                            <div className={"group flex min-h-[49px] items-center gap-4 px-3 py-2 transition-colors " + (isUnlocked ? "hover:bg-white/[.025]" : "")}>
                              <span className={"min-w-0 flex-1 text-[13px] leading-5 " + (isUnlocked || isVisited ? "font-semibold text-slate-100" : "font-medium text-slate-500")}>
                                <span className="pixel-font mr-2 text-[9px] font-normal text-slate-400">{lesson.number || lessonIndex + 1}.</span>{lesson.title}
                              </span>
                              {isVisited ? (
                                <span className="inline-flex min-w-[82px] shrink-0 items-center justify-center rounded-md border border-[#30394f] bg-[#151c2a] px-3 py-2 text-[10px] font-extrabold text-slate-200 transition-colors group-hover:border-emerald-300/50 group-hover:text-emerald-200">Repasar</span>
                              ) : isActive ? (
                                <span className="relative inline-flex min-w-[82px] shrink-0 items-center justify-center rounded-md bg-[#f7c948] px-3 py-2 text-[10px] font-extrabold text-[#17130c] shadow-[0_3px_0_#8b681b]">
                                  <span className="transition-opacity group-hover:opacity-0">Iniciar</span>
                                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">+50 XP</span>
                                </span>
                              ) : (
                                <span className="inline-flex min-w-[82px] shrink-0 items-center justify-center rounded-md border border-white/[.06] bg-[#151b28] px-3 py-2 text-[10px] font-bold text-slate-500">Bloqueada</span>
                              )}
                            </div>
                          );
                          return isUnlocked && lesson.href ? (
                            <Link
                              key={lesson.id}
                              href={lesson.href}
                              onClick={() => markCuencaLessonVisited(lesson.id)}
                              className="block"
                            >
                              {row}
                            </Link>
                          ) : (
                            <div key={lesson.id} aria-disabled="true" className="block opacity-60">{row}</div>
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
      </div>
    </main>
  );
}

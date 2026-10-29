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
  CUENCA_CHAPTER_ONE_LESSON_IDS,
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

type CourseStatsResponse = {
  profile?: {
    xp?: number | null;
    seasonXp?: number | null;
    };
  rank?: {
    progress?: number | null;
    xpToNextRank?: number | null;
  };
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
  const [courseStats, setCourseStats] = useState<CourseStatsResponse | null>(null);
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

  useEffect(() => {
    let active = true;

    async function loadCourseStats() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as CourseStatsResponse;
        if (active) setCourseStats(data);
      } catch {
        // El contenido del curso sigue funcionando si las estadísticas no están disponibles.
      }
    }

    void loadCourseStats();
    return () => { active = false; };
  }, []);

  const seasonXp = Math.max(0, Number(courseStats?.profile?.seasonXp ?? 0));
  const xpToNextRank = Math.max(0, Number(courseStats?.rank?.xpToNextRank ?? 0));
  const rankProgress = Math.min(100, Math.max(0, Number(courseStats?.rank?.progress ?? 0)));
  const xpTarget = seasonXp + xpToNextRank;
  const completedLessonCount = courseProgress.completed
    ? CUENCA_CHAPTER_ONE_LESSON_IDS.length
    : courseProgress.visitedLessonIds.length;
  const courseProgressPercent = Math.round(
    (completedLessonCount / CUENCA_CHAPTER_ONE_LESSON_IDS.length) * 100,
  );

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#0e111a] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1220px]">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
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

          <aside className="mt-0 space-y-4 lg:sticky lg:top-20 lg:-mt-7">
            <section className="overflow-hidden rounded-xl border border-[#252d40] bg-[#10141e]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[12px] font-normal text-white">Progreso del curso</h2>
              <div className="space-y-5 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="mt-1 h-8 w-8 shrink-0"
                    shapeRendering="crispEdges"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <defs>
                      <path id="cuenca-heart-outline" d="M3 1H6V2H7V3H9V2H10V1H13V2H14V4H15V7H16V9H15V11H14V12H13V13H12V14H11V15H5V14H4V13H3V12H2V11H1V9H0V7H1V4H2V2H3Z" />
                      <path id="cuenca-heart-fill-shape" d="M3 2H6V3H7V4H9V3H10V2H13V3H14V6H15V8H14V10H13V11H12V12H11V13H5V12H4V11H3V10H2V8H1V6H2V3H3Z" />
                      <clipPath id="cuenca-heart-interior">
                        <use href="#cuenca-heart-fill-shape" />
                      </clipPath>
                    </defs>
                    <use href="#cuenca-heart-outline" fill="#77796e" />
                    <use href="#cuenca-heart-fill-shape" fill="#10141e" />
                    <rect
                      x="0"
                      y="0"
                      width={courseProgressPercent > 0 ? Math.max(1, 16 * courseProgressPercent / 100) : 0}
                      height="16"
                      fill="#ef3340"
                      clipPath="url(#cuenca-heart-interior)"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <span className="pixel-font text-[10px] font-normal text-[#9ca3af] sm:text-[11px]">Progreso {courseProgressPercent}%</span>
                    <div className="mt-2 h-[18px] border-2 border-[#536071] bg-[#202833] p-[2px]" aria-label={`Progreso del curso: ${courseProgressPercent}%`}>
                      <div className="h-full bg-[#ef4444] transition-[width] duration-300" style={{ width: `${courseProgressPercent}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="mt-1 h-8 w-8 shrink-0"
                    shapeRendering="crispEdges"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <defs>
                      <path id="cuenca-star-outline" d="M8 0L10 5H16L11 9L13 16L8 12L3 16L5 9L0 5H6Z" />
                      <path id="cuenca-star-fill-shape" d="M8 2L9 6H13L10 9L11 13L8 11L5 13L6 9L3 6H7Z" />
                      <clipPath id="cuenca-star-interior">
                        <use href="#cuenca-star-fill-shape" />
                      </clipPath>
                    </defs>
                    <use href="#cuenca-star-outline" fill="#77796e" />
                    <use href="#cuenca-star-fill-shape" fill="#10141e" />
                    <rect
                      x="0"
                      y="0"
                      width={rankProgress > 0 ? Math.max(1, 16 * rankProgress / 100) : 0}
                      height="16"
                      fill="#facc15"
                      clipPath="url(#cuenca-star-interior)"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <span className="pixel-font text-[10px] font-normal text-[#9ca3af] sm:text-[11px]">
                      {xpTarget > seasonXp ? `XP ${seasonXp.toLocaleString("es-CO")}/${xpTarget.toLocaleString("es-CO")}` : `XP ${seasonXp.toLocaleString("es-CO")}`}
                    </span>
                    <div className="mt-2 h-[18px] border-2 border-[#536071] bg-[#202833] p-[2px]" aria-label={`Progreso de experiencia de temporada: ${rankProgress}%`}>
                      <div className="h-full bg-[#a5adb9] transition-[width] duration-300" style={{ width: `${rankProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

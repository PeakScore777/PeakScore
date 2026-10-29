"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  LockKeyhole,
  Star,
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

type CourseStatsResponse = {
  profile?: {
    xp?: number | null;
    seasonXp?: number | null;
    coins?: number | null;
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

const totalLessons = chapters
  .filter((chapter) => chapter.available)
  .reduce((sum, chapter) => sum + chapter.lessons.filter((lesson) => lesson.available).length, 0);

export default function LaCuencaDeLosEcosPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);
  const [courseStats, setCourseStats] = useState<CourseStatsResponse | null>(null);

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
  const peakCoins = Math.max(0, Number(courseStats?.profile?.coins ?? 0));
  const xpToNextRank = Math.max(0, Number(courseStats?.rank?.xpToNextRank ?? 0));
  const rankProgress = Math.min(100, Math.max(0, Number(courseStats?.rank?.progress ?? 0)));
  const xpTarget = seasonXp + xpToNextRank;

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#0e111a] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1120px]">
        <Link
          href="/aprender"
          className="group inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Volver a las rutas
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="min-w-0">
        <section className="relative mt-3 overflow-hidden rounded-[18px] border border-[#252d40] bg-[#091817] shadow-[0_18px_50px_rgba(0,0,0,.3)]">
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

          <div className="relative grid min-h-[250px] items-end px-5 pb-6 pt-7 sm:min-h-[285px] sm:px-7 sm:pb-7 lg:min-h-[310px] lg:px-8">
            <div className="max-w-[610px]">
              <div className="inline-flex items-center gap-2 rounded border border-emerald-300/50 bg-[#071710]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-emerald-200 [box-shadow:3px_3px_0_#163b2c]">
                Ruta 02 <span className="text-white/30">·</span> Biología y Ecología
              </div>
              <h1 className="pixel-font mt-4 text-[clamp(1.45rem,2.5vw,2.35rem)] font-normal leading-[1.5] tracking-normal">
                La Cuenca
                <br />
                de los <span className="bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Ecos</span>
              </h1>
              <p className="mt-3 max-w-[560px] text-sm leading-6 text-slate-100/85">
                Después de estudiar los cristales del Santuario de la Materia, Nova sigue una señal hasta un bosque demasiado silencioso. Observa el agua, registra las especies y reúne evidencias antes de explicar qué cambió en el ecosistema.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded border border-emerald-200/30 bg-[#061410]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">{totalLessons} LECCIONES</span>
                <span className="rounded border border-amber-200/30 bg-[#061410]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">+50 XP · DESAFÍO PERFECTO</span>
              </div>
              <Link
                href="/aprender/la-cuenca-de-los-ecos/leccion/1"
                className="group mt-5 inline-flex min-h-11 items-center justify-center gap-3 rounded-md border-2 border-[#ffe08a] bg-[#f7c948] px-5 py-3 text-[11px] font-extrabold tracking-[.02em] text-[#17130c] shadow-[0_4px_0_#8b681b] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#ffda69] hover:shadow-[0_5px_0_#8b681b] active:translate-y-0 active:shadow-none"
              >
                Comenzar a estudiar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <span className="absolute right-4 top-4 border border-emerald-300/50 bg-[#062b24]/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-normal text-emerald-200 [box-shadow:3px_3px_0_#12453c] sm:right-6 sm:top-6">
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
                  className={"relative z-[1] overflow-hidden rounded-xl border shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors " + (isAvailable ? "border-[#30394f] bg-[#1a2030] hover:border-[#46516d]" : "border-[#283044] bg-[#131a29] opacity-85")}
                >
                  <button
                    type="button"
                    onClick={() => isAvailable && toggle(chapter.id)}
                    aria-expanded={isAvailable ? isOpen : false}
                    aria-disabled={!isAvailable}
                    className="flex min-h-[70px] w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[.035] sm:gap-4 sm:px-5 sm:py-4 disabled:cursor-not-allowed"
                    disabled={!isAvailable}
                  >
                    <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold text-white shadow-inner " + (isAvailable ? "border-[#46516c] bg-[#111725]" : "border-slate-500/30 bg-slate-500/10 text-slate-400")}>{Number(chapter.id)}</span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="pixel-font block text-[12px] font-normal leading-6 text-white sm:text-[13px]">{chapter.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-300/80">{chapter.description}</span>
                    </span>
                    <span className="hidden shrink-0 sm:inline-flex">
                      {isAvailable ? (
                        <span className="rounded-md border border-emerald-300/30 bg-emerald-300/[.08] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">En curso</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Próximamente</span>
                      )}
                    </span>
                    {isAvailable ? (isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-emerald-200" /> : <ChevronRight className="h-5 w-5 shrink-0 text-emerald-200" />) : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />}
                  </button>

                  {isAvailable && isOpen && (
                    <div className="relative border-t border-white/[.07] bg-[#0d121c]/65 py-1">
                      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[30px] top-0 w-px bg-[#30394f] sm:left-[36px]" />
                      <div className="pl-[46px] pr-2 sm:pl-[53px] sm:pr-4">
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const row = (
                            <div className="group flex min-h-[49px] items-center gap-4 px-3 py-2 transition-colors hover:bg-white/[.025] sm:px-5">
                              <span className={"min-w-0 flex-1 text-[13px] leading-5 " + (lesson.available ? "font-semibold text-slate-100" : "font-medium text-slate-500")}>
                                <span className="mr-2 text-slate-400">{lesson.number || lessonIndex + 1}.</span>{lesson.title}
                              </span>
                              {lesson.available ? (
                                <span className={"inline-flex min-w-[72px] shrink-0 items-center justify-center rounded-md px-3 py-2 text-[10px] font-extrabold " + (lessonIndex === 0 ? "bg-[#f7c948] text-[#17130c] shadow-[0_3px_0_#8b681b]" : "border border-[#30394f] bg-[#151c2a] text-slate-200 group-hover:border-emerald-300/50 group-hover:text-emerald-200")}>
                                  {lessonIndex === 0 ? "Iniciar" : "Abrir"}
                                </span>
                              ) : (
                                <span className="inline-flex min-w-[82px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/[.06] bg-[#151b28] px-3 py-2 text-[10px] font-bold text-slate-500"><LockKeyhole className="h-3 w-3" /> Bloqueada</span>
                              )}
                            </div>
                          );
                          return lesson.available && lesson.href ? (
                            <Link key={lesson.id} href={lesson.href} className="block">{row}</Link>
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

        <div className="mt-5 rounded-lg border border-[#252d40] bg-[#101722] p-4 text-xs leading-6 text-slate-300/80">
          <p>La ruta combina observación, explicación de fenómenos e indagación científica. Los registros de la historia sirven para practicar interpretación de evidencias; no prueban por sí solos la causa de un cambio ambiental.</p>
        </div>
          </div>

          <aside className="mt-3 space-y-4 lg:sticky lg:top-24 lg:mt-3">
            <section className="overflow-hidden rounded-xl border border-[#252d40] bg-[#10141e]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[12px] font-normal text-white">Progreso del curso</h2>
              <div className="space-y-5 p-4">
                <div className="flex items-start gap-3">
                  <Heart aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 stroke-[1.25] text-[#7d7c72]" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-[#9ca3af]">Progreso 0%</span>
                    <div className="mt-2 h-[18px] border border-[#536071] bg-[#202833] p-[2px]" aria-label="Progreso del curso: 0%">
                      <div className="h-full w-0 bg-[#54dfbb]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 stroke-[1.25] text-[#7d7c72]" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-[#9ca3af]">
                      {xpTarget > seasonXp ? `XP ${seasonXp.toLocaleString("es-CO")}/${xpTarget.toLocaleString("es-CO")}` : `XP ${seasonXp.toLocaleString("es-CO")}`}
                    </span>
                    <div className="mt-2 h-[18px] border border-[#536071] bg-[#202833] p-[2px]" aria-label={`Progreso de experiencia de temporada: ${rankProgress}%`}>
                      <div className="h-full bg-[#a5adb9] transition-[width] duration-300" style={{ width: `${rankProgress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[.07] pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">PeakCoins</span>
                    <span className="inline-flex items-center gap-2 text-xs font-extrabold tabular-nums text-slate-100">
                      <Image src="/images/currency/peakcoin.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                      {peakCoins.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#252d40] bg-[#10141e]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[12px] font-normal text-white">Recompensas</h2>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  <div title="EXP al superar el desafío perfecto" className="flex h-[68px] w-[68px] items-center justify-center rounded-md border border-[#3a4555] bg-[#1a202b] p-2">
                    <Image src="/peaky/homepage/xp.webp" alt="EXP" width={46} height={46} className="h-11 w-11 object-contain" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-100">Desafío perfecto</p>
                <p className="mt-1 text-xs text-slate-400">+50 XP</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

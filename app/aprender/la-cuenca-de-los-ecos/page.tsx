"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Coins,
  Flame,
  LockKeyhole,
  Sparkles,
  UserRound,
  Zap,
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

type SidebarProfile = {
  fullName?: string | null;
  avatarUrl?: string | null;
  level?: number | null;
  xp?: number | null;
  seasonXp?: number | null;
  coins?: number | null;
  streak?: number | null;
};

type ProfileApiResponse = {
  profile?: SidebarProfile;
  rank?: { name?: string };
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
  const [profile, setProfile] = useState<SidebarProfile | null>(null);
  const [rankName, setRankName] = useState("Explorador");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as ProfileApiResponse;
        if (!active) return;
        setProfile(payload.profile ?? null);
        setRankName(payload.rank?.name ?? "Explorador");
      } catch {
        // El contenido de aprendizaje debe seguir disponible aunque falle el panel del perfil.
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  const profileName = profile?.fullName?.trim() || "Explorador PeakScore";
  const profileInitial = profileName.charAt(0).toLocaleUpperCase("es-CO");
  const seasonXp = Math.max(0, Number(profile?.seasonXp ?? 0));
  const coins = Math.max(0, Number(profile?.coins ?? 0));
  const historicalXp = Math.max(0, Number(profile?.xp ?? 0));
  const accountLevel = Math.max(1, Number(profile?.level ?? 1));

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#0e111a] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/aprender"
          className="group inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Volver a las rutas
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
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
                <span className="inline-flex items-center gap-2 rounded border border-emerald-200/30 bg-[#061410]/90 px-3 py-2 text-[10px] font-bold text-emerald-100"><BookOpen className="h-3.5 w-3.5" /> {totalLessons} lecciones</span>
                <span className="inline-flex items-center gap-2 rounded border border-amber-200/30 bg-[#061410]/90 px-3 py-2 text-[10px] font-bold text-amber-100"><Zap className="h-3.5 w-3.5" /> +50 XP · desafío perfecto</span>
              </div>
            </div>
            <span className="absolute right-4 top-4 border border-emerald-300/50 bg-[#062b24]/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-normal text-emerald-200 [box-shadow:3px_3px_0_#12453c] sm:right-6 sm:top-6">
              Nivel básico
            </span>
          </div>

          <div className="relative border-t border-white/10 bg-[#071511ef] px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-200">
                <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-200" /> Capítulo 01 disponible</span>
                <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-amber-200" /> Recompensa anunciada: 50 XP</span>
              </div>
              <Link
                href="/aprender/la-cuenca-de-los-ecos/leccion/1"
                className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-md border-2 border-emerald-200 bg-[#f7c948] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[.03em] text-[#1b1a12] shadow-[0_4px_0_#8b681b] transition-[transform,box-shadow,background-color] hover:translate-y-[-2px] hover:bg-[#ffda69] hover:shadow-[0_6px_0_#8b681b] active:translate-y-0 active:shadow-none"
              >
                Comenzar a estudiar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
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

          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              const isAvailable = chapter.available;
              return (
                <section
                  key={chapter.id}
                  className={"overflow-hidden rounded-xl border shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors " + (isAvailable ? "border-[#30394f] bg-[#1a2030] hover:border-[#46516d]" : "border-[#283044] bg-[#131a29] opacity-85")}
                >
                  <button
                    type="button"
                    onClick={() => isAvailable && toggle(chapter.id)}
                    aria-expanded={isAvailable ? isOpen : false}
                    aria-disabled={!isAvailable}
                    className="flex min-h-[70px] w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[.035] sm:gap-4 sm:px-5 sm:py-4 disabled:cursor-not-allowed"
                    disabled={!isAvailable}
                  >
                    <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold text-white shadow-inner sm:h-11 sm:w-11 " + (isAvailable ? "border-[#46516c] bg-[#111725]" : "border-slate-500/30 bg-slate-500/10 text-slate-400")}>{Number(chapter.id)}</span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="pixel-font block text-[10px] font-normal leading-6 text-white sm:text-[11px]">{chapter.title}</span>
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
                    <div className="border-t border-white/[.07] bg-[#050b15]/45 p-2 sm:p-3">
                      <div className="min-w-0 overflow-hidden rounded-xl border border-white/[.07]">
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const row = (
                            <div className="group flex min-h-[58px] items-center gap-3 px-3 py-2.5 transition hover:bg-white/[.025] sm:px-5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#30394f] bg-[#141b2a] text-xs font-extrabold text-slate-300">{lesson.number || lessonIndex + 1}</span>
                              <span className="min-w-0 flex-1 text-sm">
                                <span className="block leading-5 font-bold text-white">{lesson.title}</span>
                              </span>
                              {lesson.available ? (
                                <span className={"inline-flex min-w-[78px] shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-extrabold " + (lessonIndex === 0 ? "bg-[#f7c948] text-[#17130c] shadow-[0_3px_0_#8b681b]" : "border border-[#30394f] bg-[#151c2a] text-slate-200 group-hover:border-emerald-300/50 group-hover:text-emerald-200")}>
                                  {lessonIndex === 0 ? "Iniciar" : "Abrir"}
                                </span>
                              ) : (
                                <span className="inline-flex min-w-[78px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/[.06] bg-[#151b28] px-3 py-2 text-[10px] font-bold text-slate-500"><LockKeyhole className="h-3 w-3" /> Bloqueada</span>
                              )}
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

        <div className="mt-5 rounded-lg border border-[#252d40] bg-[#101722] p-4 text-xs leading-6 text-slate-300/80">
          <p>La ruta combina observación, explicación de fenómenos e indagación científica. Los registros de la historia sirven para practicar interpretación de evidencias; no prueban por sí solos la causa de un cambio ambiental.</p>
        </div>
          </div>

          <aside className="mt-3 space-y-4 lg:sticky lg:top-24 lg:mt-3">
            <section className="overflow-hidden rounded-xl border border-[#252d40] bg-[#10141e]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[11px] font-normal text-white">Perfil del explorador</h2>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-[#162a27] text-xl font-extrabold text-emerald-100 shadow-inner">
                    {profile?.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="" width={56} height={56} unoptimized className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <span>{profileInitial || <UserRound className="h-6 w-6" />}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">{profileLoading ? "Cargando perfil…" : profileName}</p>
                    <p className="mt-1 text-xs text-slate-400">{rankName} · Nivel {accountLevel}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/[.07] pt-3 text-xs text-slate-300">
                  <Flame className="h-4 w-4 text-amber-300" />
                  {Math.max(0, Number(profile?.streak ?? 0))} días de racha
                </div>
                <Link href="/perfil" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-emerald-200/30 bg-[#162b27] px-4 py-2 text-xs font-bold text-emerald-100 transition hover:border-emerald-200 hover:bg-[#1b3a32]">
                  Ver perfil
                </Link>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#252d40] bg-[#10141e]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[11px] font-normal text-white">Progreso de la ruta</h2>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300">Capítulo 01</span>
                  <span className="text-sm font-extrabold tabular-nums text-white">0%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#252d40]">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">El avance se reflejará aquí cuando el sistema registre las lecciones completadas.</p>
                <div className="mt-4 border-t border-white/[.07] pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">EXP acumulada</span>
                    <span className="text-xs font-extrabold tabular-nums text-slate-100">{historicalXp.toLocaleString("es-CO")} XP</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">EXP de temporada</span>
                    <span className="text-xs font-extrabold tabular-nums text-slate-100">{seasonXp.toLocaleString("es-CO")} XP</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs text-slate-400"><Coins className="h-4 w-4 text-amber-300" /> PeakCoins</span>
                    <span className="text-xs font-extrabold tabular-nums text-amber-200">{coins.toLocaleString("es-CO")}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#30394f] bg-[#111827]">
              <h2 className="pixel-font border-b border-[#252d40] px-4 py-3 text-[11px] font-normal text-white">Recompensas del desafío</h2>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/[.08] text-cyan-200"><Zap className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-extrabold text-white">+50 XP</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Recompensa mostrada al superar las 3 preguntas sin errores.</p>
                  </div>
                </div>
                <p className="border-t border-white/[.07] pt-3 text-[11px] leading-5 text-slate-400">Esta ruta todavía no tiene una recompensa de PeakCoins configurada.</p>
              </div>
            </section>

            <section className="rounded-xl border border-[#252d40] bg-[#10141e] p-4">
              <p className="pixel-font text-[10px] text-emerald-200">MISIÓN ACTUAL</p>
              <p className="mt-2 text-sm font-bold leading-6 text-white">Descubrir por qué el bosque dejó de cantar.</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Observa la cuenca, diferencia pistas de conclusiones y ayuda a Nova a reunir evidencia.</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-200"><Sparkles className="h-4 w-4" /> Ciencias Naturales</div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Coins,
  LockKeyhole,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSeasonContext,
} from "@/lib/gamification/season-service";
import {
  getRankBySeasonXp,
} from "@/lib/gamification/ranks";

export const metadata = {
  title: "Niveles | PeakScore",
  description: "Avanza por las rutas de desafíos de PeakScore.",
};

function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export default async function AprenderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, coins")
    .eq("id", user.id)
    .maybeSingle();

  let seasonXp = 0;
  let rankName = "Aprendiz";
  let seasonName = "Tu aventura comienza aquí";

  try {
    const { season, participation } = await getCurrentSeasonContext(user.id);
    seasonXp = safeNumber(participation.seasonXp);
    seasonName = season.name;
    rankName = getRankBySeasonXp(
      seasonXp,
      participation.startingRank === "aprendiz",
    ).name;
  } catch (error) {
    console.error("[Niveles] No se pudo cargar el contexto de temporada:", error);
  }

  const coins = safeNumber(profile?.coins);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "explorador";

  return (
    <main className="levels-page relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#080b17] text-white">
      <div aria-hidden="true" className="levels-background" />
      <div aria-hidden="true" className="levels-vignette" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-16 pt-8 sm:px-7 sm:pt-12 lg:px-10">
        <section className="levels-hero relative overflow-hidden rounded-[28px] border border-white/15">
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b17]/95 via-[#080b17]/75 to-[#080b17]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b17]/60 via-transparent to-black/10" />
          <div className="relative grid min-h-[300px] items-end gap-8 p-6 sm:min-h-[340px] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {seasonName}
              </div>
              <p className="pixel-font mb-4 text-[9px] leading-5 text-amber-200 sm:text-[10px]">
                MAPA DE AVENTURA · TEMPORADA ACTUAL
              </p>
              <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Tu próxima gran <span className="text-cyan-200">victoria</span> empieza aquí.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                Hola, {firstName}. Explora rutas, domina conceptos y enfréntate a desafíos
                que ponen a prueba lo que aprendes. Cada avance se construye con práctica.
              </p>
              <a
                href="#ruta-principal"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#06101c] shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                Explorar la ruta <ArrowDown className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[330px]">
              <StatTile icon={<Zap className="h-4 w-4" />} label="EXP temporada" value={seasonXp.toLocaleString("es-CO")} />
              <StatTile icon={<Coins className="h-4 w-4" />} label="Peak Coins" value={coins.toLocaleString("es-CO")} />
              <StatTile icon={<Trophy className="h-4 w-4" />} label="Rango" value={rankName} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <InfoPill icon={<BookOpen className="h-5 w-5" />} title="Aprende paso a paso" text="Conceptos cortos y ejemplos claros." />
          <InfoPill icon={<Swords className="h-5 w-5" />} title="Desafía al guardián" text="Aplica lo aprendido en una prueba final." />
          <InfoPill icon={<Trophy className="h-5 w-5" />} title="Gana por dominar" text="Las recompensas llegan por completar, no por repetir." />
        </section>

        <section id="ruta-principal" className="mt-12 scroll-mt-28">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="pixel-font text-[9px] leading-5 text-cyan-200">RUTA 01 · MATEMÁTICAS</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">El Sendero del Conocimiento</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Empieza por los patrones y las relaciones numéricas. Desbloquea el camino dominando cada desafío.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-[#0b1020]/80 px-3 py-2 text-xs font-bold text-white/65">
              <Shield className="h-4 w-4 text-cyan-200" />
              Progreso vinculado a tu cuenta
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
            <article className="levels-challenge-card group overflow-hidden rounded-[26px] border border-cyan-200/25 bg-[#0b1020]/95 shadow-2xl shadow-black/25">
              <div className="relative min-h-[230px] overflow-hidden sm:min-h-[300px]">
                <video
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/images/challenges/levels-background.png"
                  aria-label="Nova observa un entorno de aventura con un portal mágico"
                >
                  <source src="/challenges/archivo-enigmas/portal-nova.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#080d19] via-[#080d19]/25 to-black/10" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                  <span className="rounded-md border border-emerald-200/25 bg-emerald-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">Disponible</span>
                  <span className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/80">Desafío 01</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
                  <p className="pixel-font text-[8px] leading-5 text-cyan-200">MISIÓN DE INICIACIÓN</p>
                  <h3 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">El Archivo de los Enigmas</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                    Descubre la lógica oculta detrás de las secuencias y encuentra la regla que conecta los números.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:p-7">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Detail label="Materia" value="Matemáticas" />
                  <Detail label="Dificultad" value="Principiante" />
                  <Detail label="Duración" value="8–12 min" />
                  <Detail label="Habilidad" value="Patrones" />
                </div>

                <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/45">Jefe del desafío</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200">
                        <Swords className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-black">Guardián de los Patrones</p>
                        <p className="mt-1 text-xs text-white/55">Encuentra la regla antes de que se agote el intento.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200/20 bg-amber-300/[.07] px-4 py-3 sm:min-w-[150px]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-200/80">Recompensa prevista</p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-black text-amber-100">
                      <Zap className="h-5 w-5" /> +25 EXP
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-white/45">Una vez al completar por primera vez</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-xs leading-5 text-white/45">
                    Recompensas mostradas como diseño de la ruta. La entrega de EXP se conectará al registro seguro de finalización del desafío.
                  </p>
                  <Link
                    href="/aprender/archivo-de-los-enigmas"
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#07111e] transition hover:-translate-y-0.5 hover:bg-cyan-200"
                  >
                    Ver desafío <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>

            <aside className="flex flex-col gap-4">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1020]/90 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="pixel-font text-[8px] leading-5 text-violet-200">TU PROGRESO</p>
                  <Sparkles className="h-5 w-5 text-violet-200" />
                </div>
                <h3 className="mt-3 text-xl font-black">Tu aventura apenas comienza</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Completa tu primer desafío para comenzar a registrar tu recorrido en esta ruta.
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold text-white/40">
                  <span>Primer paso</span><span>Ruta 1</span>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0b1020]/90 p-5 sm:p-6">
                <p className="pixel-font text-[8px] leading-5 text-amber-200">LO QUE VIENE</p>
                <div className="mt-4 space-y-3">
                  <LockedChallenge number="02" title="La Forja de las Secuencias" detail="Reconoce reglas y cambios." />
                  <LockedChallenge number="03" title="El Laberinto de las Variables" detail="Relaciona cantidades." />
                  <LockedChallenge number="04" title="El Guardián del Archivo" detail="Jefe final de la ruta." />
                </div>
                <p className="mt-4 text-xs leading-5 text-white/40">
                  Los siguientes desafíos se habilitarán cuando su contenido y las reglas de desbloqueo estén listos.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>PEAKSCORE · APRENDE, PRACTICA, AVANZA.</span>
          <Link href="/perfil" className="inline-flex items-center gap-2 font-bold text-white/65 transition hover:text-white">
            Volver a mi perfil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>

      <style>{`
        .levels-page { isolation: isolate; }
        .levels-background {
          position: absolute; inset: 0 0 auto; height: min(1000px, 95vh);
          background-image: linear-gradient(180deg, rgba(6,8,18,.14) 0%, rgba(6,8,18,.48) 48%, #080b17 100%), url("/images/challenges/levels-background.png");
          background-size: cover; background-position: center top; background-repeat: no-repeat;
          opacity: .8; pointer-events: none;
        }
        .levels-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(5,7,17,.22) 55%, rgba(5,7,17,.7) 100%);
        }
        .levels-hero { background: rgba(9,12,25,.7); box-shadow: 0 24px 80px rgba(0,0,0,.28); }
        .levels-challenge-card { box-shadow: 0 20px 70px rgba(0,0,0,.22); }
        @media (prefers-reduced-motion: reduce) {
          .levels-challenge-card video { display: none; }
          .levels-challenge-card { transition: none; }
        }
      `}</style>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#080b17]/75 p-3 backdrop-blur-md sm:p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[.07] text-cyan-200">{icon}</span>
      <p className="mt-3 text-[9px] font-bold leading-4 text-white/45 sm:text-[10px]">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-5 text-white sm:text-lg">{value}</p>
    </div>
  );
}

function InfoPill({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#0b1020]/80 p-4 backdrop-blur-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/[.08] text-cyan-200">{icon}</span>
      <div>
        <h3 className="text-sm font-black">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/50">{text}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xs font-black leading-5 text-white/85">{value}</p>
    </div>
  );
}

function LockedChallenge({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3 opacity-75">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[.04] text-white/45">
        <LockKeyhole className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-wider text-white/35">Desafío {number}</p>
        <p className="mt-1 text-xs font-black leading-5 text-white/70">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-white/40">{detail}</p>
      </div>
      <LockKeyhole className="h-4 w-4 shrink-0 text-white/25" />
    </div>
  );
}

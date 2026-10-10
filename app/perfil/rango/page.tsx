
"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import {
  PEAKSCORE_RANKS,
  getNextRank,
  type RankId,
  type RankDefinition,
} from "@/lib/gamification/ranks";

/* -------------------------------------------------------------------------- */
/* TIPOS Y RECURSOS                                                           */
/* -------------------------------------------------------------------------- */

type ProfileResponse = {
  profile?: {
    seasonXp?: number;
  };
  season?: {
    name?: string;
    number?: number;
    endsAt?: string;
  };
  rank?: {
    id: string;
    name: string;
    minSeasonXp: number;
    maxSeasonXp: number | null;
    progress: number;
    xpToNextRank: number;
    isNewAccount: boolean;
  };
  error?: string;
};

const RANK_IMAGES: Record<RankId, string> = {
  renacer: "/images/ranks/renacer.webp",
  aprendiz: "/images/ranks/aprendiz.webp",
  explorador: "/images/ranks/explorador.webp",
  competidor: "/images/ranks/competidor.webp",
  avanzado: "/images/ranks/avanzado.webp",
  elite: "/images/ranks/elite.webp",
  maestro: "/images/ranks/maestro.webp",
  "gran-maestro": "/images/ranks/granmaestro.webp",
  leyenda: "/images/ranks/leyenda.webp",
  peak: "/images/ranks/peak.webp",
};

const LOCK_IMAGE = "/images/ranks/ui/rank-lock.webp";
const FOUNDER_GIF =
  "/images/profile/rank/founder/founder-throne-idle.gif";
const REWARD_IMAGE = "/dashboard/premio-pixel.webp";

/* -------------------------------------------------------------------------- */
/* HISTORIA DE CADA RANGO                                                     */
/* -------------------------------------------------------------------------- */

const RANK_DETAILS: Record<
  RankId,
  {
    subtitle: string;
    description: string;
    objective: string;
    color: string;
  }
> = {
  renacer: {
    subtitle: "Un nuevo comienzo",
    description:
      "Una nueva temporada abre otra oportunidad para demostrar tu progreso. Renacer representa el regreso de quienes ya han recorrido PeakScore y están preparados para volver a competir. Tu EXP histórica permanece conservada, pero el ascenso competitivo vuelve a comenzar.",
    objective:
      "Retoma el ritmo, completa actividades y vuelve a construir tu ascenso desde el inicio de la temporada.",
    color: "violet",
  },
  aprendiz: {
    subtitle: "Todo gran camino comienza aquí",
    description:
      "Aprendiz es el primer rango de las cuentas nuevas. Este es el comienzo de tu propia historia en PeakScore: un lugar para familiarizarte con los desafíos, desarrollar hábitos de estudio y descubrir hasta dónde puedes llegar. Cada actividad es una oportunidad para construir las bases de tu progreso.",
    objective:
      "Consigue 300 EXP de temporada para alcanzar Explorador.",
    color: "cyan",
  },
  explorador: {
    subtitle: "Descubre tu potencial",
    description:
      "Has comenzado a explorar tus capacidades. Explorador representa la curiosidad, la práctica y la voluntad de enfrentarte a nuevos desafíos. Cada actividad completada amplía tus habilidades y te permite descubrir nuevas formas de superar tus propios límites.",
    objective:
      "Alcanza 650 EXP de temporada para avanzar a Competidor.",
    color: "emerald",
  },
  competidor: {
    subtitle: "Convierte el esfuerzo en resultados",
    description:
      "Competidor marca una nueva etapa de constancia. Ya conoces el camino y empiezas a poner a prueba tus conocimientos con objetivos más exigentes. La disciplina y el aprendizaje continuo se convierten en tus aliados para continuar escalando.",
    objective:
      "Alcanza 1.100 EXP de temporada para avanzar a Avanzado.",
    color: "blue",
  },
  avanzado: {
    subtitle: "Supera tu propio nivel",
    description:
      "Avanzado simboliza una evolución sostenida. Has construido una base que te permite afrontar retos más complejos, identificar oportunidades de mejora y transformar la práctica en resultados cada vez más sólidos.",
    objective:
      "Alcanza 1.600 EXP de temporada para llegar a Élite.",
    color: "amber",
  },
  elite: {
    subtitle: "Destaca por tu constancia",
    description:
      "Élite representa un rendimiento destacado dentro de la temporada. La capacidad de aprender de cada resultado, mantener el compromiso y afrontar nuevos desafíos será fundamental para continuar tu camino hacia los rangos superiores.",
    objective:
      "Alcanza 2.150 EXP de temporada para llegar a Maestro.",
    color: "orange",
  },
  maestro: {
    subtitle: "El dominio se construye",
    description:
      "Maestro representa un progreso notable y un dominio cada vez mayor de tus conocimientos. Has avanzado más allá de las primeras etapas y ahora cada reto te permite perfeccionar tus habilidades y prepararte para exigencias superiores.",
    objective:
      "Alcanza 2.700 EXP de temporada para llegar a Gran Maestro.",
    color: "purple",
  },
  "gran-maestro": {
    subtitle: "Entre los grandes",
    description:
      "Gran Maestro representa una trayectoria sobresaliente. Tu dedicación te ha llevado lejos y demuestra que puedes mantener el esfuerzo a lo largo de la temporada. Estás cerca de los rangos más prestigiosos de PeakScore: continúa avanzando y prepara tu siguiente gran salto.",
    objective:
      "Alcanza 3.300 EXP de temporada para convertirte en Leyenda.",
    color: "fuchsia",
  },
  leyenda: {
    subtitle: "Deja huella en la temporada",
    description:
      "Leyenda simboliza una trayectoria extraordinaria. Has recorrido casi toda la progresión competitiva y estás a un paso de la cima. Cada actividad, cada reto y cada mejora forman parte de la historia que has construido durante la temporada.",
    objective:
      "Alcanza 4.000 EXP de temporada para llegar a Peak.",
    color: "orange",
  },
  peak: {
    subtitle: "La cima de PeakScore",
    description:
      "Peak es el máximo rango del sistema competitivo. Representa la culminación de tu ascenso durante la temporada: un símbolo de constancia, dedicación y superación personal. No se trata solamente de llegar a la cima, sino de reconocer todo lo que fuiste capaz de construir para alcanzarla. Tu historia no termina al llegar: la cima representa el camino que lograste recorrer.",
    objective:
      "Has llegado al objetivo máximo de la progresión competitiva. Conserva tu historial y sigue demostrando tu potencial en cada temporada.",
    color: "galaxy",
  },
};

function formatXp(value: number) {
  return Math.max(0, value).toLocaleString("es-CO");
}

function getRequirement(rank: RankDefinition) {
  if (rank.id === "peak") {
    return `${formatXp(rank.minSeasonXp)}+ EXP`;
  }

  return `${formatXp(rank.minSeasonXp)}–${formatXp(
    rank.maxSeasonXp ?? rank.minSeasonXp,
  )} EXP`;
}

/* -------------------------------------------------------------------------- */
/* CARGA                                                                       */
/* -------------------------------------------------------------------------- */

function RankSkeleton() {
  return (
    <main className="min-h-screen space-y-6 bg-[#080612] p-4 sm:p-6 lg:p-8">
      <div className="h-[650px] animate-pulse rounded-2xl bg-white/5 sm:h-[510px]" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {PEAKSCORE_RANKS.map((rank) => (
          <div
            key={rank.id}
            className="h-44 animate-pulse rounded-xl border border-white/10 bg-[#100d20]"
          />
        ))}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* DETALLES DE CADA RANGO                                                     */
/* -------------------------------------------------------------------------- */

type RankDetailsProps = {
  rank: RankDefinition;
  unlocked: boolean;
  current: boolean;
  seasonXp: number;
  onClose: () => void;
};

function RankDetails({
  rank,
  unlocked,
  current,
  seasonXp,
  onClose,
}: RankDetailsProps) {
  const details = RANK_DETAILS[rank.id];
  const isPeak = rank.id === "peak";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="rank-modal-backdrop fixed inset-0 z-[1000] flex flex-col items-center overflow-x-hidden overflow-y-auto overscroll-y-contain bg-black/85 p-3 backdrop-blur-lg touch-pan-y sm:p-6"
      style={{ WebkitOverflowScrolling: "touch" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rank-detail-title"
        className={`rank-detail-panel relative my-auto w-full max-w-5xl shrink-0 overflow-hidden rounded-2xl border text-white sm:rounded-3xl ${
          isPeak
            ? "rank-peak-panel border-fuchsia-300/50 bg-[#070416]"
            : `rank-detail-${rank.id} border-violet-300/25 bg-[#0b0819]`
        }`}
      >
        {isPeak && (
          <>
            <div aria-hidden="true" className="rank-galaxy" />
            <div aria-hidden="true" className="rank-stars" />
            <div aria-hidden="true" className="rank-nebula" />
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles del rango"
          className="absolute right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xl text-white transition hover:rotate-90 hover:border-violet-300/50 hover:bg-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          ×
        </button>

        <div className="relative z-10 grid items-center gap-2 p-4 sm:gap-7 sm:p-7 md:grid-cols-[1fr_1.08fr] md:p-9">
          {/* ILUSTRACIÓN GRANDE DEL RANGO */}
          <div
            className={`rank-detail-art relative flex min-h-[260px] items-center justify-center overflow-hidden sm:min-h-[370px] md:min-h-[440px] ${
              isPeak ? "rank-peak-art" : `rank-art-${rank.id}`
            }`}
          >
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/15 blur-3xl sm:h-64 sm:w-64"
            />

            {isPeak && (
              <>
                <div
                  aria-hidden="true"
                  className="rank-peak-orbit absolute h-52 w-52 rounded-full border border-cyan-200/20 sm:h-72 sm:w-72"
                />
                <div
                  aria-hidden="true"
                  className="absolute h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl sm:h-56 sm:w-56"
                />
              </>
            )}

            <Image
              src={RANK_IMAGES[rank.id]}
              alt={`Insignia de ${rank.name}`}
              width={440}
              height={440}
              priority
              sizes="(max-width: 639px) 75vw, (max-width: 1023px) 42vw, 440px"
              className={`rank-detail-emblem relative z-10 h-[230px] w-[230px] object-contain sm:h-[330px] sm:w-[330px] md:h-[390px] md:w-[390px] ${
                unlocked
                  ? `rank-emblem-${rank.id}`
                  : "grayscale brightness-[0.45]"
              }`}
            />

            {/* Candado en la esquina de la ilustración */}
            {!unlocked && (
              <div className="absolute bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/65 shadow-xl sm:bottom-8 sm:right-8 sm:h-14 sm:w-14">
                <Image
                  src={LOCK_IMAGE}
                  alt="Rango bloqueado"
                  width={54}
                  height={54}
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                />
              </div>
            )}

            {isPeak && (
              <span className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-200/30 bg-black/50 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.25em] text-cyan-100">
                El máximo rango
              </span>
            )}
          </div>

          {/* INFORMACIÓN Y REQUISITOS */}
          <div className="relative z-10 py-4 sm:py-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-violet-300 sm:text-[10px]">
              PEAKSCORE · SISTEMA DE RANGOS
            </p>

            <h2
              id="rank-detail-title"
              className={`mt-4 text-3xl font-black sm:text-4xl md:text-5xl ${
                isPeak
                  ? "bg-gradient-to-r from-cyan-200 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {rank.name}
            </h2>

            <p className="mt-2 text-sm font-semibold text-violet-200 sm:text-base">
              {details.subtitle}
            </p>

            <div className="mt-5 h-px w-full bg-gradient-to-r from-violet-400/80 via-fuchsia-400/25 to-transparent" />

            <p className="mt-5 text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
              {details.description}
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.045] p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300 sm:text-[10px]">
                Requisito de temporada
              </p>

              <p className="mt-3 text-xl font-black sm:text-2xl">
                {getRequirement(rank)}
              </p>

              <p className="mt-2 text-xs leading-6 text-white/50">
                La EXP de temporada determina tu rango competitivo.
                Tu EXP histórica se conserva por separado.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-400/[0.06] p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300 sm:text-[10px]">
                Tu siguiente objetivo
              </p>

              <p className="mt-3 text-sm leading-6 text-white/80">
                {current
                  ? details.objective
                  : unlocked
                    ? `Actualmente llevas ${formatXp(seasonXp)} EXP de temporada. ${details.objective}`
                    : isPeak
                      ? "Continúa tu ascenso por los rangos hasta llegar a la cima."
                      : `Necesitas alcanzar ${formatXp(rank.minSeasonXp)} EXP de temporada para llegar a este rango.`}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-2 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
                  current
                    ? "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-200"
                    : unlocked
                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/50"
                }`}
              >
                {current
                  ? "Tu rango actual"
                  : unlocked
                    ? "Desbloqueado"
                    : "Bloqueado"}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="rank-details-button rounded-xl border border-violet-300/35 bg-violet-500/15 px-4 py-3 text-xs font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                Volver a los rangos
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .rank-modal-backdrop {
          animation: rank-backdrop-in 180ms ease-out both;
        }

        .rank-detail-panel {
          animation: rank-panel-in 320ms cubic-bezier(.2,.8,.2,1) both;
        }

        .rank-detail-emblem {
          animation: rank-emblem-in 750ms cubic-bezier(.2,.8,.2,1) both;
        }

        .rank-peak-panel {
          isolation: isolate;
        }

        .rank-galaxy {
          position: absolute;
          inset: -55%;
          z-index: -3;
          pointer-events: none;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(34,211,238,.14),
            rgba(139,92,246,.34),
            transparent 35%,
            rgba(217,70,239,.2),
            transparent 70%
          );
          animation: rank-galaxy-spin 28s linear infinite;
        }

        .rank-nebula {
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 75%, rgba(124,58,237,.32), transparent 50%),
            radial-gradient(ellipse at 90% 15%, rgba(8,145,178,.2), transparent 42%);
        }

        .rank-stars {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 16% 23%, #c4b5fd 0 1px, transparent 2px),
            radial-gradient(circle at 72% 16%, #67e8f9 0 1px, transparent 2px),
            radial-gradient(circle at 84% 65%, #e9d5ff 0 1px, transparent 2px),
            radial-gradient(circle at 42% 81%, #c4b5fd 0 1px, transparent 2px),
            radial-gradient(circle at 91% 33%, #fff 0 1px, transparent 2px);
          animation: rank-star-pulse 3s ease-in-out infinite alternate;
        }

        .rank-peak-art {
          animation: rank-peak-float 4s ease-in-out infinite;
        }

        .rank-peak-orbit {
          animation: rank-orbit 18s linear infinite;
        }

        .rank-details-button:hover {
          border-color: rgba(196,181,253,.8);
          background: rgba(139,92,246,.3);
          box-shadow: 0 0 24px rgba(139,92,246,.2);
          transform: translateY(-2px);
        }

        @keyframes rank-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes rank-panel-in {
          from { opacity: 0; transform: translateY(18px) scale(.975); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes rank-emblem-in {
          0% { opacity: 0; transform: scale(.72) rotate(-5deg); }
          65% { opacity: 1; transform: scale(1.06) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }

        @keyframes rank-galaxy-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes rank-star-pulse {
          from { opacity: .35; }
          to { opacity: .9; }
        }

        @keyframes rank-peak-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes rank-orbit {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rank-modal-backdrop,
          .rank-detail-panel,
          .rank-detail-emblem,
          .rank-galaxy,
          .rank-stars,
          .rank-peak-art,
          .rank-peak-orbit {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* PÁGINA PRINCIPAL                                                           */
/* -------------------------------------------------------------------------- */

export default function RangoPage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRankId, setSelectedRankId] = useState<RankId | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const customEvent = event as CustomEvent<"light" | "dark">;

      if (
        customEvent.detail === "light" ||
        customEvent.detail === "dark"
      ) {
        setTheme(customEvent.detail);
      }
    };

    try {
      const savedTheme = window.localStorage.getItem("peakscore-theme");

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    } catch {
      // Conserva el tema oscuro si localStorage no está disponible.
    }

    window.addEventListener("peakscore-theme-change", syncTheme);

    return () => {
      window.removeEventListener("peakscore-theme-change", syncTheme);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json()) as ProfileResponse;

        if (!response.ok) {
          throw new Error(
            result.error || "No se pudo cargar tu rango.",
          );
        }

        setData(result);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar tu rango.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedRankId(null);
  }, []);

  if (loading) return <RankSkeleton />;

  if (error || !data?.rank || !data.profile) {
    return (
      <main className="min-h-[60vh] bg-[#080612] p-6 text-white">
        <h1 className="pixel-font text-xl">TU RANGO</h1>

        <p className="mt-4 text-sm text-white/60">
          {error || "No se pudo obtener la información del rango."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl border border-white/15 px-4 py-3 text-sm transition hover:bg-white/5"
        >
          Intentar de nuevo
        </button>
      </main>
    );
  }

  const { rank, profile, season } = data;
  const seasonXp = Math.max(0, Number(profile.seasonXp ?? 0));
  const currentRankId = rank.id as RankId;

  const currentRank = PEAKSCORE_RANKS.find(
    (item) => item.id === currentRankId,
  );

  const nextRank = getNextRank(currentRankId);
  const progress = Math.min(
    100,
    Math.max(0, Number(rank.progress) || 0),
  );
  const xpToNextRank = Math.max(
    0,
    Number(rank.xpToNextRank) || 0,
  );

  /*
   * La clasificación inicial se mantiene durante la temporada:
   * cuenta nueva = Aprendiz → Peak;
   * usuario veterano = Renacer → Peak.
   */
  const visibleRanks = PEAKSCORE_RANKS.filter(
    (item) => !(rank.isNewAccount && item.id === "renacer"),
  );

  function isRankUnlocked(item: RankDefinition) {
    if (item.id === "aprendiz") {
      return rank.isNewAccount;
    }

    if (item.id === "renacer") {
      return !rank.isNewAccount;
    }

    return seasonXp >= item.minSeasonXp;
  }

  const selectedRank = selectedRankId
    ? PEAKSCORE_RANKS.find((item) => item.id === selectedRankId) ?? null
    : null;

  return (
    <main
      className={`rank-page relative isolate min-h-screen space-y-6 p-3 transition-colors duration-300 sm:space-y-7 sm:p-5 lg:space-y-8 lg:p-7 ${
        theme === "dark"
          ? "bg-[#080612] text-white"
          : "bg-[#f4f1fa] text-slate-950"
      }`}
    >
      {/* Fondo global sincronizado con el tema del navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
      <Image
        src="/perfil/biome-profile-dark.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover object-top transition-opacity duration-300 ${
          theme === "dark" ? "opacity-100" : "opacity-0"
        }`}
      />

      <Image
        src="/perfil/biome-profile-light.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover object-top transition-opacity duration-300 ${
          theme === "light" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>

      {/* ================================================================== */}
      {/* BIOMA SUPERIOR: EL FUNDADOR DEBE TOCAR EL SUELO DE LA PLATAFORMA    */}
      {/* ================================================================== */}

      <section className="rank-hero relative isolate min-h-[480px] overflow-hidden rounded-2xl border border-violet-300/25 bg-[#090719] shadow-[0_15px_55px_rgba(0,0,0,.3)] sm:min-h-[510px] sm:rounded-3xl lg:min-h-[500px]">
        {/* Fondo de escritorio */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 hidden bg-cover bg-center sm:block"
          style={{
            backgroundImage:
              'url("/images/profile/rank/tu-rango-fundador-bg.png")',
          }}
        />

        {/* Fondo móvil */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center sm:hidden"
          style={{
            backgroundImage:
              'url("/images/profile/rank/tu-rango-fundador-mobile-bg.png")',
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#080719]/50 via-[#080719]/30 to-[#080719]/60 sm:bg-gradient-to-r sm:from-[#080719]/95 sm:via-[#080719]/80 sm:to-[#080719]/10"
        />

        {/* INFORMACIÓN DEL RANGO */}
        <div className="relative z-20 w-full max-w-[720px] px-4 pb-6 pt-5 sm:px-7 sm:pb-8 sm:pt-8 lg:max-w-[62%] lg:px-9 lg:py-9">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-violet-200 sm:text-xs">
            {season?.name || "Temporada actual"}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-white/90 sm:text-sm">
            Tu rango actual
          </p>

          <h1 className="pixel-font mt-3 max-w-xl text-xl leading-[1.8] text-white drop-shadow-[0_3px_0_#5423a8] sm:text-2xl md:text-3xl">
            {rank.name}
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
            {currentRank?.identity ||
              "Tu esfuerzo construye tu historia. Sigue avanzando en PeakScore."}
          </p>

          {/* EXP Y BARRA DE PROGRESO */}
          <div className="mt-6 max-w-[540px] rounded-2xl border border-white/15 bg-[#080719]/90 p-4 shadow-xl backdrop-blur-md sm:mt-7 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-white/75 sm:text-sm">
                EXP de temporada
              </span>

              <span className="text-sm font-bold tabular-nums sm:text-base">
                {formatXp(seasonXp)} EXP
              </span>
            </div>

            <div
              className="mt-4 h-4 overflow-hidden rounded-full border border-white/25 bg-black/55"
              role="progressbar"
              aria-label="Progreso hacia el siguiente rango"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400 shadow-[0_0_16px_rgba(192,132,252,.65)] transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between gap-3 text-xs text-white/75">
              <span>Progreso del rango</span>
              <span className="font-bold tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>

            {/* TARJETA DE RECOMPENSA */}
            <div className="rank-reward-card mt-5 flex items-start gap-3 rounded-xl border border-violet-300/20 bg-violet-400/[.07] p-3 sm:gap-4 sm:p-4">
              <Image
                src={REWARD_IMAGE}
                alt="Recompensa de PeakScore"
                width={72}
                height={72}
                className="rank-reward-image h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16"
              />

              <div className="min-w-0">
                {nextRank ? (
                  <>
                    <p className="text-sm font-bold leading-5 text-white sm:text-base">
                      Faltan {formatXp(xpToNextRank)} EXP para{" "}
                      {nextRank.name}.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/75 sm:text-sm">
                      {rank.id === "aprendiz"
                        ? "Comienza tu aventura: completa actividades y construye las bases de tu progreso."
                        : "Sigue completando actividades, aprendiendo y manteniendo tu constancia para seguir ascendiendo."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold leading-5 text-white sm:text-base">
                      Has alcanzado el rango máximo.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/75 sm:text-sm">
                      Has llegado a Peak. Sigue demostrando todo tu potencial.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FUNDADOR: CENTRADO SOBRE LA PLATAFORMA EN ESCRITORIO */}
          <div className="rank-founder-desktop pointer-events-none absolute bottom-0 left-[27%] z-10 hidden h-full w-[58%] items-end justify-center sm:flex">
            <Image
              src={FOUNDER_GIF}
              alt="Fundador de PeakScore sentado en su trono"
              width={600}
              height={700}
              unoptimized
              priority
              sizes="(min-width: 640px) 58vw"
              draggable={false}
              className="rank-founder-image relative bottom-[60px] h-[330px] w-auto max-w-full object-contain object-bottom lg:bottom-[68px] lg:h-[370px]"
            />
          </div>
      </section>

      {/* ================================================================== */}
      {/* CATÁLOGO SIN BIOMA                                                 */}
      {/* ================================================================== */}

      <section
        id="todos-los-rangos"
        className="relative z-10 pb-6 bg-[#080612]"
      >
        <div className="mb-5">
          <h2 className="pixel-font text-xs leading-7 sm:text-sm">
            TODOS LOS RANGOS
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/60 sm:text-sm">
            Cada rango tiene su propia historia. Selecciona una insignia
            para descubrir su significado y sus requisitos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {visibleRanks.map((item) => {
            const isCurrent = item.id === currentRankId;
            const unlocked = isRankUnlocked(item);
            const isPeak = item.id === "peak";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedRankId(item.id)}
                aria-label={`Ver detalles del rango ${item.name}${unlocked ? "" : ", bloqueado"}`}
                className={`rank-catalog-card rank-card-${item.id} group relative flex min-h-[190px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border p-3 text-center transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:min-h-[215px] sm:p-4 ${
                  isCurrent
                    ? `rank-card-current border-fuchsia-400 ${
                        theme === "dark"
                          ? "bg-violet-500/[.11] shadow-[0_0_22px_rgba(192,38,211,.16)]"
                          : "bg-violet-950/90 shadow-[0_0_22px_rgba(192,38,211,.20)]"
                      }`
                    : isPeak
                      ? "rank-card-peak border-violet-400/30 bg-[#0b0820]"
                      : "border-white/10 bg-[#0b0918] hover:border-violet-300/50 hover:bg-violet-950/25"
                }`}
              >
                <span aria-hidden="true" className="rank-card-sheen" />

                {isCurrent && (
                  <span className="absolute left-2 top-2 z-20 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-fuchsia-200">
                    Actual
                  </span>
                )}

                {/* INSIGNIA */}
                <div className="rank-card-emblem relative mt-2 h-[88px] w-[88px] shrink-0 sm:mt-3 sm:h-[104px] sm:w-[104px]">
                  <Image
                    src={RANK_IMAGES[item.id]}
                    alt={`Insignia de ${item.name}`}
                    fill
                    sizes="(max-width: 639px) 88px, 104px"
                    className={`rank-card-image object-contain transition duration-500 ${
                      unlocked
                        ? "rank-unlocked-emblem"
                        : "opacity-35 grayscale brightness-75"
                    }`}
                  />

                  {/* CANDADO EN LA ESQUINA INFERIOR DERECHA */}
                  {!unlocked && (
                    <div className="rank-lock-corner absolute bottom-0 right-0 z-20 flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-[#080612]/90 shadow-lg sm:h-8 sm:w-8">
                      <Image
                        src={LOCK_IMAGE}
                        alt="Bloqueado"
                        width={32}
                        height={32}
                        className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                      />
                    </div>
                  )}
                </div>

                {/* SOLO NOMBRE, SIN NÚMEROS ORDINALES */}
                <h3
                  className={`mt-3 text-xs font-bold sm:text-sm ${
                    isCurrent ? "text-fuchsia-200" : "text-white"
                  }`}
                >
                  {item.name}
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-white/60 sm:text-xs sm:leading-5">
                  {getRequirement(item)}
                </p>

                {isPeak && (
                  <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-violet-300">
                    {unlocked ? "Cima alcanzada" : "Próximamente"}
                  </span>
                )}

                <span className="rank-details-cta mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-violet-300 sm:text-[10px]">
                  Ver detalles
                  <span aria-hidden="true">↗</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FICHA DEL RANGO SELECCIONADO */}
      {selectedRank && (
        <RankDetails
          key={selectedRank.id}
          rank={selectedRank}
          unlocked={isRankUnlocked(selectedRank)}
          current={selectedRank.id === currentRankId}
          seasonXp={seasonXp}
          onClose={closeDetails}
        />
      )}

      {/* ================================================================== */}
      {/* EFECTOS GAMING                                                     */}
      {/* ================================================================== */}

      <style jsx global>{`
        .rank-page {
          overflow-x: clip;
        }

        /* El catálogo no hereda el bioma de la tarjeta superior. */
        .rank-catalog-card {
          isolation: isolate;
          transform: translateZ(0);
        }

        .rank-card-sheen {
          position: absolute;
          inset: -100% -50%;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(
            115deg,
            transparent 38%,
            rgba(196, 181, 253, 0.1) 48%,
            rgba(255, 255, 255, 0.035) 52%,
            transparent 62%
          );
          transform: translateX(-70%) rotate(8deg);
          transition: transform 650ms ease;
        }

        .rank-catalog-card:hover .rank-card-sheen,
        .rank-catalog-card:focus-visible .rank-card-sheen {
          transform: translateX(70%) rotate(8deg);
        }

        .rank-catalog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        }

        .rank-card-emblem {
          transition: transform 300ms ease;
        }

        .rank-catalog-card:hover .rank-card-emblem {
          transform: translateY(-3px) scale(1.035);
        }

        .rank-unlocked-emblem {
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.14));
        }

        .rank-card-current {
          animation: current-rank-glow 3s ease-in-out infinite;
        }

        .rank-card-current::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(217, 70, 239, 0.09),
            transparent 50%,
            rgba(139, 92, 246, 0.1)
          );
        }

        .rank-lock-corner {
          animation: rank-lock-settle 450ms ease-out both;
        }

        .rank-details-cta {
          transition: color 180ms ease, transform 180ms ease;
        }

        .rank-catalog-card:hover .rank-details-cta {
          color: #e9d5ff;
          transform: translateX(2px);
        }

        .rank-reward-card {
          transition: border-color 250ms ease, background 250ms ease;
        }

        .rank-reward-card:hover {
          border-color: rgba(196, 181, 253, 0.4);
          background: rgba(139, 92, 246, 0.12);
        }

        .rank-reward-image {
          filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.2));
          animation: reward-bob 3s ease-in-out infinite;
        }

        /* Efectos individuales por rango */
        .rank-card-renacer:hover .rank-card-image {
          filter: drop-shadow(0 0 15px rgba(196, 181, 253, 0.55));
        }

        .rank-card-aprendiz:hover .rank-card-image {
          filter: drop-shadow(0 0 16px rgba(103, 232, 249, 0.5));
        }

        .rank-card-explorador:hover .rank-card-image {
          filter: drop-shadow(0 0 16px rgba(52, 211, 153, 0.5));
        }

        .rank-card-competidor:hover .rank-card-image {
          filter: drop-shadow(0 0 16px rgba(96, 165, 250, 0.55));
        }

        .rank-card-avanzado:hover .rank-card-image {
          filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.5));
        }

        .rank-card-elite:hover .rank-card-image {
          filter: drop-shadow(0 0 17px rgba(251, 146, 60, 0.55));
        }

        .rank-card-maestro:hover .rank-card-image {
          filter: drop-shadow(0 0 17px rgba(192, 132, 252, 0.6));
        }

        .rank-card-gran-maestro:hover .rank-card-image {
          filter: drop-shadow(0 0 18px rgba(232, 121, 249, 0.65));
        }

        .rank-card-leyenda:hover .rank-card-image {
          filter: drop-shadow(0 0 18px rgba(251, 191, 36, 0.65));
        }

        .rank-card-peak {
          isolation: isolate;
        }

        .rank-card-peak::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(circle at 20% 25%, rgba(196, 181, 253, 0.18), transparent 36%),
            radial-gradient(circle at 85% 80%, rgba(34, 211, 238, 0.13), transparent 38%);
        }

        .rank-card-peak::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            115deg,
            transparent 25%,
            rgba(167, 139, 250, 0.09) 50%,
            transparent 75%
          );
          background-size: 250% 100%;
          animation: peak-card-shimmer 5s linear infinite;
        }

        .rank-card-peak:hover {
          border-color: rgba(103, 232, 249, 0.6);
          box-shadow:
            0 0 20px rgba(139, 92, 246, 0.15),
            inset 0 0 25px rgba(139, 92, 246, 0.07);
        }

        .rank-card-peak:hover .rank-card-image {
          filter: drop-shadow(0 0 20px rgba(103, 232, 249, 0.55));
        }

        /* Ventana de detalles */
        .rank-detail-art {
          isolation: isolate;
        }

        .rank-detail-renacer .rank-detail-art,
        .rank-art-renacer {
          background: radial-gradient(ellipse, rgba(167, 139, 250, 0.11), transparent 68%);
        }

        .rank-art-aprendiz {
          background: radial-gradient(ellipse, rgba(103, 232, 249, 0.1), transparent 68%);
        }

        .rank-art-explorador {
          background: radial-gradient(ellipse, rgba(52, 211, 153, 0.1), transparent 68%);
        }

        .rank-art-competidor {
          background: radial-gradient(ellipse, rgba(96, 165, 250, 0.11), transparent 68%);
        }

        .rank-art-avanzado {
          background: radial-gradient(ellipse, rgba(251, 191, 36, 0.1), transparent 68%);
        }

        .rank-art-elite,
        .rank-art-leyenda {
          background: radial-gradient(ellipse, rgba(251, 146, 60, 0.11), transparent 68%);
        }

        .rank-art-maestro,
        .rank-art-gran-maestro {
          background: radial-gradient(ellipse, rgba(192, 132, 252, 0.12), transparent 68%);
        }

        .rank-emblem-renacer {
          filter: drop-shadow(0 0 19px rgba(167, 139, 250, 0.35));
        }

        .rank-emblem-aprendiz {
          filter: drop-shadow(0 0 20px rgba(103, 232, 249, 0.32));
        }

        .rank-emblem-explorador {
          filter: drop-shadow(0 0 20px rgba(52, 211, 153, 0.3));
        }

        .rank-emblem-competidor {
          filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.35));
        }

        .rank-emblem-avanzado,
        .rank-emblem-leyenda {
          filter: drop-shadow(0 0 22px rgba(251, 191, 36, 0.35));
        }

        .rank-emblem-elite {
          filter: drop-shadow(0 0 22px rgba(251, 146, 60, 0.35));
        }

        .rank-emblem-maestro,
        .rank-emblem-gran-maestro {
          filter: drop-shadow(0 0 24px rgba(192, 132, 252, 0.4));
        }

        .rank-peak-art {
          animation: rank-peak-float 4s ease-in-out infinite;
        }

        .rank-peak-panel {
          isolation: isolate;
        }

        .rank-galaxy {
          position: absolute;
          inset: -55%;
          z-index: -3;
          pointer-events: none;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(34, 211, 238, 0.14),
            rgba(139, 92, 246, 0.34),
            transparent 35%,
            rgba(217, 70, 239, 0.2),
            transparent 70%
          );
          animation: rank-galaxy-spin 28s linear infinite;
        }

        .rank-nebula {
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 75%, rgba(124, 58, 237, 0.32), transparent 50%),
            radial-gradient(ellipse at 90% 15%, rgba(8, 145, 178, 0.2), transparent 42%);
        }

        .rank-stars {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 16% 23%, #c4b5fd 0 1px, transparent 2px),
            radial-gradient(circle at 72% 16%, #67e8f9 0 1px, transparent 2px),
            radial-gradient(circle at 84% 65%, #e9d5ff 0 1px, transparent 2px),
            radial-gradient(circle at 42% 81%, #c4b5fd 0 1px, transparent 2px),
            radial-gradient(circle at 91% 33%, #fff 0 1px, transparent 2px);
          animation: rank-star-pulse 3s ease-in-out infinite alternate;
        }

        .rank-peak-orbit {
          animation: rank-orbit 18s linear infinite;
        }

        @keyframes current-rank-glow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(192, 38, 211, 0.08);
          }
          50% {
            box-shadow: 0 0 25px rgba(192, 38, 211, 0.2);
          }
        }

        @keyframes rank-lock-settle {
          from {
            opacity: 0;
            transform: scale(0.75) rotate(-12deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes reward-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes peak-card-shimmer {
          from { background-position: 100% 0; }
          to { background-position: -150% 0; }
        }

        @keyframes rank-peak-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes rank-galaxy-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes rank-star-pulse {
          from { opacity: 0.35; }
          to { opacity: 0.9; }
        }

        @keyframes rank-orbit {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rank-catalog-card,
          .rank-catalog-card *,
          .rank-reward-image,
          .rank-peak-art,
          .rank-galaxy,
          .rank-stars,
          .rank-peak-orbit,
          .rank-card-peak::after,
          .rank-card-current,
          .rank-lock-corner {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

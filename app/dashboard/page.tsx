"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { supabase } from "@/lib/supabase/browser";

import type { Profile } from "@/types/profile";

import { getProfile } from "@/lib/services/profile.service";
import { updateUserStreak } from "@/lib/services/streak.service";



import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import ProgressChart from "@/components/dashboard/ProgressChart";
import Achievements from "@/components/dashboard/Achievements";
import RecentSimulations from "@/components/dashboard/RecentSimulations";
import GoalCard from "@/components/dashboard/GoalCard";

/* ============================================================
   TIPOS
============================================================ */

type FloatingIslandProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
};

/* ============================================================
   ISLAS FLOTANTES PEQUEÑAS
============================================================ */

function FloatingIsland({
  className = "",
  size = "md",
  glow = false,
}: FloatingIslandProps) {
  const sizes = {
    sm: "h-[28px] w-[48px]",
    md: "h-[38px] w-[64px]",
    lg: "h-[48px] w-[78px]",
  };

  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${sizes[size]}
        ${className}
      `}
    >
      <div
        className="
          absolute
          left-1/2
          top-0
          h-[13px]
          w-[72%]
          -translate-x-1/2
          rounded-[50%]
          bg-gradient-to-b
          from-emerald-300/65
          via-emerald-500/45
          to-emerald-800/20
        "
      />

      <div
        className="
          absolute
          bottom-0
          left-1/2
          h-[72%]
          w-full
          -translate-x-1/2
          bg-gradient-to-b
          from-[#25485d]
          via-[#16334b]
          to-[#091827]
          [clip-path:polygon(8%_0,92%_0,100%_25%,76%_100%,25%_88%,0_25%)]
        "
      />

      {glow && (
        <div
          className="
            absolute
            bottom-0
            left-1/2
            h-2
            w-[55%]
            -translate-x-1/2
            rounded-full
            bg-cyan-400/40
            blur-md
          "
        />
      )}
    </div>
  );
}

/* ============================================================
   ISLA FINAL
============================================================ */

function MainFloatingIsland({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${className}
      `}
    >
      {/* Sombra */}
      <div
        className="
          absolute
          left-1/2
          top-[25px]
          h-[95px]
          w-[220px]
          -translate-x-1/2
          rounded-full
          bg-black/80
          blur-2xl
        "
      />

      {/* Superficie exterior */}
      <div
        className="
          absolute
          left-1/2
          top-0
          h-[44px]
          w-[235px]
          -translate-x-1/2
          rounded-[50%]
          border
          border-slate-700/55
          bg-[#02050a]
          shadow-[0_8px_25px_rgba(0,0,0,0.85)]
        "
      />

      {/* Superficie interior */}
      <div
        className="
          absolute
          left-1/2
          top-[5px]
          h-[33px]
          w-[218px]
          -translate-x-1/2
          rounded-[50%]
          bg-[radial-gradient(ellipse_at_center,#111827_0%,#050912_58%,#010307_100%)]
        "
      />

      {/* Cuerpo triangular */}
      <div
        className="
          absolute
          left-1/2
          top-[21px]
          h-[105px]
          w-[145px]
          -translate-x-1/2
          bg-gradient-to-b
          from-[#080d17]
          via-[#03060d]
          to-[#010207]
          [clip-path:polygon(8%_0,92%_0,74%_100%,26%_100%)]
          drop-shadow-[0_20px_25px_rgba(0,0,0,0.9)]
        "
      />

      {/* Detalle de profundidad */}
      <div
        className="
          absolute
          left-[43%]
          top-[34px]
          h-[55px]
          w-px
          rotate-[12deg]
          bg-gradient-to-b
          from-slate-600/20
          to-transparent
        "
      />

      <div
        className="
          absolute
          left-[58%]
          top-[36px]
          h-[45px]
          w-px
          -rotate-[15deg]
          bg-gradient-to-b
          from-violet-300/10
          to-transparent
        "
      />

      <div
        className="
          absolute
          bottom-0
          left-1/2
          h-1
          w-[65px]
          -translate-x-1/2
          rounded-full
          bg-cyan-400/20
          blur-md
        "
      />
    </div>
  );
}

/* ============================================================
   NUBE GALÁCTICA
============================================================ */

function PixelCloud({
  className = "",
  scale = "md",
}: {
  className?: string;
  scale?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-[26px] w-[82px]",
    md: "h-[36px] w-[118px]",
    lg: "h-[48px] w-[165px]",
  };

  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${sizes[scale]}
        ${className}
      `}
    >
      <div
        className="
          absolute
          inset-0
          rounded-full
          bg-gradient-to-r
          from-violet-400/10
          via-fuchsia-300/20
          to-cyan-300/10
          blur-[9px]
        "
      />

      <div
        className="
          absolute
          bottom-[5px]
          left-[8%]
          h-[55%]
          w-[84%]
          bg-gradient-to-b
          from-violet-300/25
          via-fuchsia-400/12
          to-indigo-900/5
          [clip-path:polygon(0_55%,8%_55%,8%_28%,20%_28%,20%_10%,36%_10%,36%_25%,51%_25%,51%_0,67%_0,67%_22%,82%_22%,82%_40%,94%_40%,94%_58%,100%_58%,100%_100%,0_100%)]
        "
      />
    </div>
  );
}

/* ============================================================
   NEBULOSA
============================================================ */

function PixelNebula({
  className = "",
  color = "violet",
}: {
  className?: string;
  color?: "violet" | "blue" | "pink" | "cyan";
}) {
  const colors = {
    violet:
      "from-violet-500/20 via-fuchsia-500/8 to-transparent",
    blue:
      "from-blue-500/20 via-cyan-500/8 to-transparent",
    pink:
      "from-fuchsia-500/18 via-pink-500/8 to-transparent",
    cyan:
      "from-cyan-400/18 via-blue-500/8 to-transparent",
  };

  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${className}
      `}
    >
      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-r
          ${colors[color]}
          blur-[25px]
        `}
      />
    </div>
  );
}

/* ============================================================
   ORB GALÁCTICO
============================================================ */

function GalaxyOrb({
  className = "",
  color = "violet",
}: {
  className?: string;
  color?: "violet" | "cyan" | "pink" | "blue";
}) {
  const colors = {
    violet:
      "from-violet-400/15 via-fuchsia-500/8 to-transparent",
    cyan:
      "from-cyan-300/15 via-blue-500/8 to-transparent",
    pink:
      "from-pink-300/15 via-purple-500/8 to-transparent",
    blue:
      "from-blue-300/15 via-cyan-500/8 to-transparent",
  };

  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${className}
      `}
    >
      <div
        className={`
          h-full
          w-full
          rounded-full
          bg-gradient-to-br
          ${colors[color]}
          blur-[2px]
        `}
      />

      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[18%]
          w-[18%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-white/15
          blur-[2px]
        "
      />
    </div>
  );
}

/* ============================================================
   ESTRELLAS
============================================================ */

function PixelStarfield() {
  const stars = [
    [5, 12, 2],
    [9, 31, 1],
    [14, 18, 1],
    [18, 8, 2],
    [23, 26, 1],
    [28, 12, 1],
    [33, 22, 2],
    [38, 7, 1],
    [43, 17, 1],
    [48, 10, 2],
    [54, 24, 1],
    [59, 8, 1],
    [64, 16, 2],
    [69, 6, 1],
    [74, 27, 1],
    [79, 12, 2],
    [84, 21, 1],
    [89, 8, 1],
    [94, 27, 2],
    [97, 15, 1],
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map(([left, top, size], index) => (
        <span
          key={`star-${index}`}
          className="
            absolute
            rounded-full
            bg-white
            shadow-[0_0_9px_rgba(255,255,255,0.45)]
          "
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   NUBE DE MENSAJE PEAKSCORE
============================================================ */

function PeakMessageCloud() {
  return (
    <div
      className="
        absolute
        left-[5%]
        top-[185px]
        z-[165]
        hidden
        md:block
      "
    >
      {/* Brillo exterior */}
      <div
        className="
          absolute
          -inset-7
          rounded-full
          bg-fuchsia-400/[0.06]
          blur-2xl
        "
      />

      <div className="relative h-[132px] w-[245px]">

        {/* Burbujas de la nube */}

        <span
          className="
            absolute
            left-[32px]
            top-[12px]
            h-[38px]
            w-[58px]
            rounded-full
            bg-gradient-to-br
            from-[#d8a8ff]/80
            via-[#b77de8]/75
            to-[#7546a7]/70
          "
        />

        <span
          className="
            absolute
            left-[76px]
            top-[2px]
            h-[55px]
            w-[72px]
            rounded-full
            bg-gradient-to-br
            from-[#e3b8ff]/85
            via-[#c084fc]/75
            to-[#8150b8]/65
          "
        />

        <span
          className="
            absolute
            left-[132px]
            top-[15px]
            h-[42px]
            w-[60px]
            rounded-full
            bg-gradient-to-br
            from-[#d6a6ff]/75
            via-[#a66bd2]/70
            to-[#6d4399]/60
          "
        />

        {/* Cuerpo */}

        <div
          className="
            absolute
            bottom-[15px]
            left-0
            h-[92px]
            w-[222px]
            rounded-[30px]
            border
            border-fuchsia-200/30
            bg-gradient-to-br
            from-[#c18bea]/85
            via-[#9861c6]/88
            to-[#68418f]/90
            shadow-[0_15px_35px_rgba(91,33,182,0.2)]
          "
        >
          <div
            className="
              absolute
              inset-[2px]
              rounded-[28px]
              bg-gradient-to-br
              from-[#2c173e]/95
              via-[#24152f]/95
              to-[#171022]/95
            "
          />

          <div className="relative z-10 px-7 pt-5">

            <p
              className="
                text-[12px]
                font-bold
                leading-[1.7]
                text-white
              "
            >
              Pequeños esfuerzos,
              <br />
              grandes resultados.
            </p>

            <div className="mt-3 flex items-center gap-2">

              <span
                className="
                  h-px
                  w-6
                  bg-gradient-to-r
                  from-fuchsia-300
                  to-transparent
                "
              />

              <span
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-fuchsia-200
                "
              >
                PEAKSCORE
              </span>
            </div>
          </div>
        </div>

        {/* Cola */}

        <div
          className="
            absolute
            bottom-[5px]
            left-[42px]
            h-[24px]
            w-[30px]
            rotate-[20deg]
            rounded-[8px_8px_20px_8px]
            bg-[#21142c]
          "
        />

        {/* Destellos */}

        <span
          className="
            absolute
            right-[12px]
            top-[6px]
            h-1.5
            w-1.5
            rounded-full
            bg-fuchsia-200
            shadow-[0_0_9px_rgba(244,114,182,0.9)]
          "
        />

        <span
          className="
            absolute
            right-0
            top-[38px]
            h-1
            w-1
            rounded-full
            bg-cyan-200
            shadow-[0_0_7px_rgba(103,232,249,0.8)]
          "
        />
      </div>
    </div>
  );
}

/* ============================================================
   NODO DE MATERIA
============================================================ */

function SubjectNode({
  label,
  color,
  icon,
  className,
}: {
  label: string;
  color: "cyan" | "green" | "yellow" | "slate";
  icon: string;
  className: string;
}) {
  const styles = {
    cyan: {
      node:
        "border-cyan-200 bg-cyan-400/20 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.65)]",
      label:
        "border-cyan-400/30 bg-[#061728]/95 text-cyan-300",
    },

    green: {
      node:
        "border-emerald-200 bg-emerald-400/20 text-emerald-100 shadow-[0_0_22px_rgba(52,211,153,0.6)]",
      label:
        "border-emerald-400/30 bg-[#061728]/95 text-emerald-300",
    },

    yellow: {
      node:
        "border-amber-200 bg-amber-400/20 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.6)]",
      label:
        "border-amber-400/30 bg-[#061728]/95 text-amber-300",
    },

    slate: {
      node:
        "border-slate-400/50 bg-slate-700/60 text-slate-300 shadow-[0_0_18px_rgba(148,163,184,0.15)]",
      label:
        "border-slate-500/20 bg-[#061728]/95 text-slate-400",
    },
  };

  return (
    <div
      className={`
        absolute
        flex
        flex-col
        items-center
        ${className}
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          border-2
          text-sm
          font-black
          ${styles[color].node}
        `}
      >
        {icon}
      </div>

      <div
        className={`
          mt-2
          whitespace-nowrap
          rounded-lg
          border
          px-3
          py-1.5
          text-[9px]
          font-black
          uppercase
          tracking-[0.1em]
          backdrop-blur-md
          ${styles[color].label}
        `}
      >
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   BRILLO
============================================================ */

function GroundGlow({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`
        pointer-events-none
        absolute
        ${className}
      `}
    >
      <div
        className="
          absolute
          bottom-0
          left-1/2
          h-2
          w-full
          -translate-x-1/2
          rounded-full
          bg-cyan-400/20
          blur-md
        "
      />
    </div>
  );
}

/* ============================================================
   CALCULAR RENDIMIENTO DEL SIMULACRO COMPLETO
============================================================ */

type SubjectProgressData = {
  matematicas: number;
  lectura: number;
  ciencias: number;
  sociales: number;
  ingles: number;
};

type SimulationAttemptRow = {
  id: string;
  simulation_id: string;
  score: number | null;
  completed_at: string | null;
};

type SimulationRow = {
  id: string;
  type: string | null;
  session: number | null;
};

type SimulationAnswerRow = {
  is_correct: boolean | null;
  question_id: string;
};

type QuestionSubjectRow = {
  id: string;
  subject: string | null;
};

const EMPTY_SUBJECT_PROGRESS: SubjectProgressData = {
  matematicas: 0,
  lectura: 0,
  ciencias: 0,
  sociales: 0,
  ingles: 0,
};

function calculateSubjectProgress(
  answers: SimulationAnswerRow[],
  questions: QuestionSubjectRow[]
): SubjectProgressData {
  const result: SubjectProgressData = {
    ...EMPTY_SUBJECT_PROGRESS,
  };

  const totals: Record<
    keyof SubjectProgressData,
    number
  > = {
    matematicas: 0,
    lectura: 0,
    ciencias: 0,
    sociales: 0,
    ingles: 0,
  };

  const correct: Record<
    keyof SubjectProgressData,
    number
  > = {
    matematicas: 0,
    lectura: 0,
    ciencias: 0,
    sociales: 0,
    ingles: 0,
  };

  const questionSubjectMap = new Map<string, string>();

  for (const question of questions) {
    if (question.subject) {
      questionSubjectMap.set(
        question.id,
        question.subject
      );
    }
  }

  for (const answer of answers) {
    const rawSubject =
      questionSubjectMap.get(
        answer.question_id
      );

    if (!rawSubject) {
      continue;
    }

    const normalized = rawSubject
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let subject:
      | keyof SubjectProgressData
      | null = null;

    if (normalized.includes("matem")) {
      subject = "matematicas";
    } else if (
      normalized.includes("lectura")
    ) {
      subject = "lectura";
    } else if (
      normalized.includes("ciencias")
    ) {
      subject = "ciencias";
    } else if (
      normalized.includes("sociales")
    ) {
      subject = "sociales";
    } else if (
      normalized.includes("ingles")
    ) {
      subject = "ingles";
    }

    if (!subject) {
      continue;
    }

    totals[subject] += 1;

    if (answer.is_correct === true) {
      correct[subject] += 1;
    }
  }

  (
    Object.keys(totals) as Array<
      keyof SubjectProgressData
    >
  ).forEach((subject) => {
    if (totals[subject] > 0) {
      result[subject] = Math.round(
        (correct[subject] /
          totals[subject]) *
          100
      );
    }
  });

  return result;
}

/*
 * Convierte el rendimiento de las cinco áreas
 * a una escala de 0 a 500.
 *
 * Matemáticas        = 3
 * Lectura Crítica    = 3
 * Sociales           = 3
 * Ciencias Naturales = 3
 * Inglés             = 1
 */
function calculateGlobalScore(
  progress: SubjectProgressData
): number {
  const weightedAverage =
    (
      progress.matematicas * 3 +
      progress.lectura * 3 +
      progress.sociales * 3 +
      progress.ciencias * 3 +
      progress.ingles
    ) / 13;

  return Math.round(
    weightedAverage * 5
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [userName, setUserName] =
    useState("");

  const [userId, setUserId] =
    useState("");

  /* ==========================================================
     RENDIMIENTO POR ÁREA
  ========================================================== */

  const [subjectProgress, setSubjectProgress] =
    useState<SubjectProgressData>(
      EMPTY_SUBJECT_PROGRESS
    );

  const [
    latestSimulationScore,
    setLatestSimulationScore,
  ] = useState<number | null>(null);

  const [
    latestSimulationDate,
    setLatestSimulationDate,
  ] = useState<string | null>(null);

  const [
    hasCompleteSimulation,
    setHasCompleteSimulation,
  ] = useState(false);

  /* ==========================================================
     PROGRESO
  ========================================================== */

  const targetScore =
    profile?.target_score ?? 500;

  const currentScore =
    latestSimulationScore ?? 0;

  const progress =
    targetScore > 0
      ? Math.min(
          (currentScore /
            targetScore) *
            100,
          100
        )
      : 0;

  /* ==========================================================
     CARGAR DASHBOARD
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const currentUserId =
          session.user.id;

        if (!mounted) return;

        setUserId(currentUserId);

        await updateUserStreak(
          currentUserId
        );

        const profileData =
          await getProfile(
            currentUserId
          );

        if (!mounted) return;

        if (profileData) {
          setProfile(profileData);

          setUserName(
            profileData.full_name ??
              "Usuario"
          );
        } else {
          setUserName(
            session.user.user_metadata
              ?.full_name ||
              session.user.email ||
              "Usuario"
          );
        }

        /* ======================================================
           SIMULACRO COMPLETO

           IMPORTANTE:
           Un simulacro completo SOLO cuenta cuando
           existen las dos sesiones terminadas:

           SESIÓN 1
           - Matemáticas
           - Lectura Crítica
           - Sociales y Ciudadanas
           - Ciencias Naturales

           SESIÓN 2
           - Sociales y Ciudadanas
           - Matemáticas
           - Ciencias Naturales
           - Inglés

           Los simulacros simples NO participan.

           No hacemos un JOIN de Supabase entre
           simulation_attempts y simulations porque esa relación
           no está garantizada por el esquema actual.
           Primero obtenemos los intentos y después las
           simulaciones por sus IDs.
        ====================================================== */

        const {
          data: attemptRows,
          error: attemptsError,
        } = await supabase
          .from("simulation_attempts")
          .select(
            "id, simulation_id, score, completed_at"
          )
          .eq(
            "user_id",
            currentUserId
          )
          .not(
            "completed_at",
            "is",
            null
          )
          .order(
            "completed_at",
            {
              ascending: false,
            }
          );

        /*
         * Si no hay simulacros todavía, Supabase devuelve
         * normalmente un array vacío.
         *
         * Eso NO es un error.
         *
         * Si existe un error real de consulta, dejamos el
         * dashboard funcionando y mostramos rendimiento 0.
         */
        if (attemptsError) {
          console.warn(
            "[PeakScore] No fue posible consultar los intentos completos:",
            attemptsError
          );

          if (mounted) {
            setSubjectProgress(
              EMPTY_SUBJECT_PROGRESS
            );
            setLatestSimulationScore(
              null
            );
            setLatestSimulationDate(
              null
            );
            setHasCompleteSimulation(
              false
            );
          }
        } else {
          const completedAttempts =
            (attemptRows ??
              []) as SimulationAttemptRow[];

          /*
           * Si todavía no existe ningún intento:
           * estado completamente normal para un usuario nuevo.
           */
          if (
            completedAttempts.length ===
            0
          ) {
            if (mounted) {
              setSubjectProgress(
                EMPTY_SUBJECT_PROGRESS
              );
              setLatestSimulationScore(
                null
              );
              setLatestSimulationDate(
                null
              );
              setHasCompleteSimulation(
                false
              );
            }
          } else {
            /*
             * ==================================================
             * OBTENER LAS SIMULACIONES
             * ==================================================
             */

            const simulationIds = Array.from(
              new Set(
                completedAttempts
                  .map(
                    (attempt) =>
                      attempt.simulation_id
                  )
                  .filter(Boolean)
              )
            );

            let simulations: SimulationRow[] =
              [];

            if (
              simulationIds.length > 0
            ) {
              const {
                data: simulationRows,
                error:
                  simulationsError,
              } = await supabase
                .from("simulations")
                .select(
                  "id, type, session"
                )
                .in(
                  "id",
                  simulationIds
                );

              if (simulationsError) {
                console.warn(
                  "[PeakScore] No fue posible consultar las simulaciones:",
                  simulationsError
                );

                if (mounted) {
                  setSubjectProgress(
                    EMPTY_SUBJECT_PROGRESS
                  );
                  setLatestSimulationScore(
                    null
                  );
                  setLatestSimulationDate(
                    null
                  );
                  setHasCompleteSimulation(
                    false
                  );
                }
              } else {
                simulations =
                  (simulationRows ??
                    []) as SimulationRow[];

                const simulationMap =
                  new Map<
                    string,
                    SimulationRow
                  >();

                for (const simulation of simulations) {
                  simulationMap.set(
                    simulation.id,
                    simulation
                  );
                }

                /*
                 * ==================================================
                 * SOLO SIMULACROS COMPLETOS
                 * ==================================================
                 */

                const completeAttempts =
                  completedAttempts.filter(
                    (attempt) => {
                      const simulation =
                        simulationMap.get(
                          attempt.simulation_id
                        );

                      const type =
                        simulation?.type
                          ?.trim()
                          .toLowerCase();

                      return (
                        type ===
                          "completo" &&
                        (simulation?.session ===
                          1 ||
                          simulation?.session ===
                            2)
                      );
                    }
                  );

                /*
                 * IMPORTANTE:
                 *
                 * Los intentos vienen ordenados por
                 * completed_at DESC, por lo que el primero
                 * de cada sesión es el más reciente.
                 */

                /*
                 * Buscamos el par de sesiones que forma el simulacro
                 * completo más reciente.
                 *
                 * No mezclamos una sesión 1 nueva con una sesión 2
                 * perteneciente a otro simulacro.
                 */
                const session1Attempts =
                  completeAttempts.filter(
                    (attempt) =>
                      simulationMap.get(
                        attempt.simulation_id
                      )?.session === 1
                  );

                const session2Attempts =
                  completeAttempts.filter(
                    (attempt) =>
                      simulationMap.get(
                        attempt.simulation_id
                      )?.session === 2
                  );

                /*
                 * Emparejamos cada Sesión 2 con la Sesión 1
                 * terminada inmediatamente anterior que todavía
                 * no haya sido utilizada.
                 *
                 * Así evitamos mezclar una Sesión 1 de un completo
                 * con una Sesión 2 de otro completo.
                 */
                const sortedSession1Attempts = [
                  ...session1Attempts,
                ].sort(
                  (a, b) =>
                    Date.parse(
                      a.completed_at ?? ""
                    ) -
                    Date.parse(
                      b.completed_at ?? ""
                    )
                );

                const sortedSession2Attempts = [
                  ...session2Attempts,
                ].sort(
                  (a, b) =>
                    Date.parse(
                      a.completed_at ?? ""
                    ) -
                    Date.parse(
                      b.completed_at ?? ""
                    )
                );

                const usedSession1Ids =
                  new Set<string>();

                let latestSession1:
                  SimulationAttemptRow | null = null;

                let latestSession2:
                  SimulationAttemptRow | null = null;

                let latestCompleteEndTime = -1;

                for (const session2Attempt of sortedSession2Attempts) {
                  const session2Time = Date.parse(
                    session2Attempt.completed_at ?? ""
                  );

                  if (Number.isNaN(session2Time)) {
                    continue;
                  }

                  let candidateSession1:
                    SimulationAttemptRow | null = null;

                  let candidateSession1Time = -1;

                  for (const session1Attempt of sortedSession1Attempts) {
                    if (usedSession1Ids.has(session1Attempt.id)) {
                      continue;
                    }

                    const session1Time = Date.parse(
                      session1Attempt.completed_at ?? ""
                    );

                    if (
                      Number.isNaN(session1Time) ||
                      session1Time > session2Time
                    ) {
                      continue;
                    }

                    if (session1Time > candidateSession1Time) {
                      candidateSession1 = session1Attempt;
                      candidateSession1Time = session1Time;
                    }
                  }

                  if (!candidateSession1) {
                    continue;
                  }

                  usedSession1Ids.add(
                    candidateSession1.id
                  );

                  const pairEndTime = Math.max(
                    candidateSession1Time,
                    session2Time
                  );

                  if (pairEndTime > latestCompleteEndTime) {
                    latestCompleteEndTime = pairEndTime;
                    latestSession1 = candidateSession1;
                    latestSession2 = session2Attempt;
                  }
                }

                /*
                 * ==================================================
                 * TODAVÍA NO HAY SIMULACRO COMPLETO
                 * ==================================================
                 *
                 * Si falta cualquiera de las dos sesiones,
                 * no calculamos rendimiento ni puntaje.
                 */

                if (
                  !latestSession1 ||
                  !latestSession2
                ) {
                  if (mounted) {
                    setSubjectProgress(
                      EMPTY_SUBJECT_PROGRESS
                    );
                    setLatestSimulationScore(
                      null
                    );
                    setLatestSimulationDate(
                      null
                    );
                    setHasCompleteSimulation(
                      false
                    );
                  }
                } else {
                  /*
                   * ==================================================
                   * OBTENER RESPUESTAS DE LAS DOS SESIONES
                   * ==================================================
                   */

                  const attemptIds = [
                    latestSession1.id,
                    latestSession2.id,
                  ];

                  const {
                    data: answerRows,
                    error:
                      answersError,
                  } = await supabase
                    .from(
                      "simulation_answers"
                    )
                    .select(
                      "is_correct, question_id"
                    )
                    .in(
                      "attempt_id",
                      attemptIds
                    );

                  if (answersError) {
                    console.warn(
                      "[PeakScore] No fue posible consultar las respuestas:",
                      answersError
                    );

                    if (mounted) {
                      setSubjectProgress(
                        EMPTY_SUBJECT_PROGRESS
                      );
                      setLatestSimulationScore(
                        null
                      );
                      setLatestSimulationDate(
                        null
                      );
                      setHasCompleteSimulation(
                        false
                      );
                    }
                  } else {
                    const answers =
                      (answerRows ??
                        []) as SimulationAnswerRow[];

                    /*
                     * ==================================================
                     * OBTENER LAS MATERIAS DE LAS PREGUNTAS
                     * ==================================================
                     *
                     * No hacemos JOIN questions!inner para evitar
                     * depender de una relación automática de Supabase.
                     */

                    const questionIds =
                      Array.from(
                        new Set(
                          answers
                            .map(
                              (answer) =>
                                answer.question_id
                            )
                            .filter(
                              Boolean
                            )
                        )
                      );

                    let questions: QuestionSubjectRow[] =
                      [];

                    if (
                      questionIds.length >
                      0
                    ) {
                      const {
                        data: questionRows,
                        error:
                          questionsError,
                      } = await supabase
                        .from(
                          "questions"
                        )
                        .select(
                          "id, subject"
                        )
                        .in(
                          "id",
                          questionIds
                        );

                      if (
                        questionsError
                      ) {
                        console.warn(
                          "[PeakScore] No fue posible consultar las materias de las preguntas:",
                          questionsError
                        );
                      } else {
                        questions =
                          (questionRows ??
                            []) as QuestionSubjectRow[];
                      }
                    }

                    /*
                     * ==================================================
                     * CALCULAR RENDIMIENTO
                     * ==================================================
                     */

                    const calculatedProgress =
                      calculateSubjectProgress(
                        answers,
                        questions
                      );

                    /*
                     * Si ambas sesiones están terminadas,
                     * el simulacro completo sí existe.
                     *
                     * Incluso si todavía no hay respuestas,
                     * mantenemos el estado como completado y
                     * los porcentajes quedan en 0.
                     */

                    const calculatedScore =
                      calculateGlobalScore(
                        calculatedProgress
                      );

                    /*
                     * Respaldo:
                     * simulation_attempts.score contiene el porcentaje
                     * de cada sesión (0-100).
                     *
                     * Si el cálculo por respuestas da 0 porque las
                     * respuestas/materias no pudieron reconstruirse,
                     * usamos el promedio de las dos sesiones y lo
                     * convertimos a escala 0-500.
                     */
                    const session1Score =
                      Number(latestSession1.score ?? 0);

                    const session2Score =
                      Number(latestSession2.score ?? 0);

                    const fallbackScore =
                      Math.round(
                        ((session1Score +
                          session2Score) /
                          2) *
                          5
                      );

                    const globalScore =
                      calculatedScore > 0
                        ? calculatedScore
                        : fallbackScore;

                    const completedDates =
                      [
                        latestSession1.completed_at,
                        latestSession2.completed_at,
                      ]
                        .filter(
                          (
                            date
                          ): date is string =>
                            Boolean(date)
                        )
                        .map(
                          (date) =>
                            new Date(
                              date
                            ).getTime()
                        );

                    const latestCompleteDate =
                      completedDates.length >
                      0
                        ? new Date(
                            Math.max(
                              ...completedDates
                            )
                          ).toLocaleDateString(
                            "es-CO",
                            {
                              day: "2-digit",
                              month:
                                "long",
                              year:
                                "numeric",
                            }
                          )
                        : null;

                    if (mounted) {
                      setSubjectProgress(
                        calculatedProgress
                      );

                      setLatestSimulationScore(
                        globalScore
                      );

                      setLatestSimulationDate(
                        latestCompleteDate
                      );

                      setHasCompleteSimulation(
                        true
                      );
                    }
                  }
                }
              }
            } else {
              if (mounted) {
                setSubjectProgress(
                  EMPTY_SUBJECT_PROGRESS
                );
                setLatestSimulationScore(
                  null
                );
                setLatestSimulationDate(
                  null
                );
                setHasCompleteSimulation(
                  false
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando dashboard:",
          error
        );

        /*
         * Un error inesperado tampoco debe dejar
         * valores viejos en pantalla.
         */
        if (mounted) {
          setSubjectProgress(
            EMPTY_SUBJECT_PROGRESS
          );
          setLatestSimulationScore(
            null
          );
          setLatestSimulationDate(
            null
          );
          setHasCompleteSimulation(
            false
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* ==========================================================
     GUARDAR META DEL USUARIO

     La meta se guarda en Supabase para que NO se pierda
     al recargar, cerrar sesión o volver a entrar.
  ========================================================== */

  const handleTargetChange = async (
    newTarget: number
  ) => {
    if (!userId) {
      return;
    }

    const normalizedTarget = Math.max(
      100,
      Math.min(500, Math.round(newTarget))
    );

    const { error } = await supabase
      .from("profiles")
      .update({
        target_score: normalizedTarget,
      })
      .eq("id", userId);

    if (error) {
      console.error(
        "[PeakScore] Error guardando meta:",
        error
      );
      return;
    }

    setProfile((previous) =>
      previous
        ? {
            ...previous,
            target_score: normalizedTarget,
          }
        : previous
    );
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace("/login");
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-100
        "
      >
        <div className="text-center">

          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-slate-200
              border-t-blue-600
            "
          />

          <p
            className="
              mt-4
              text-sm
              font-medium
              text-slate-500
            "
          >
            Cargando tu dashboard...
          </p>

        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#020817]
        bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_100%_50%,rgba(168,85,247,0.07),transparent_30%)]
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Header
        userName={userName}
        onLogout={handleLogout}
      />

      <div
        className="
          mx-auto
          max-w-7xl
          space-y-8
          p-6
          md:p-8
        "
      >

        {/* ====================================================
            HERO / TU PEAK
        ==================================================== */}

        <section
          className="
            relative
            isolate
            min-h-[700px]
            overflow-hidden
            rounded-[34px]
            border
            border-cyan-500/20
            bg-[#020615]
            shadow-[0_35px_110px_rgba(2,8,23,0.58)]
          "
        >

          {/* ==================================================
              FONDO ESPACIAL
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              overflow-hidden
            "
          >

            <div
              className="
                absolute
                inset-0
                bg-[radial-gradient(circle_at_50%_25%,rgba(37,99,235,0.23),transparent_27%),radial-gradient(circle_at_85%_30%,rgba(168,85,247,0.17),transparent_28%),radial-gradient(circle_at_12%_48%,rgba(34,211,238,0.08),transparent_25%),linear-gradient(180deg,#05041a_0%,#07102a_48%,#03101b_100%)]
              "
            />

            <PixelNebula
              color="violet"
              className="
                left-[-5%]
                top-[2%]
                h-[170px]
                w-[310px]
              "
            />

            <PixelNebula
              color="blue"
              className="
                left-[32%]
                top-[-8%]
                h-[145px]
                w-[270px]
              "
            />

            <PixelNebula
              color="pink"
              className="
                right-[-2%]
                top-[3%]
                h-[210px]
                w-[350px]
              "
            />

            <GalaxyOrb
              color="violet"
              className="
                left-[7%]
                top-[5%]
                h-[80px]
                w-[125px]
              "
            />

            <GalaxyOrb
              color="cyan"
              className="
                left-[37%]
                top-[2%]
                h-[65px]
                w-[105px]
              "
            />

            <GalaxyOrb
              color="blue"
              className="
                right-[28%]
                top-[5%]
                h-[90px]
                w-[140px]
              "
            />

            <PixelStarfield />

            {/* Nubes sutiles */}

            <PixelCloud
              scale="lg"
              className="
                left-[2%]
                top-[27%]
                opacity-[0.55]
              "
            />

            <PixelCloud
              scale="md"
              className="
                right-[7%]
                top-[23%]
                opacity-[0.5]
              "
            />

            <PixelCloud
              scale="sm"
              className="
                right-[14%]
                top-[41%]
                opacity-[0.35]
              "
            />

            {/* Islas pequeñas solamente */}

            <FloatingIsland
              size="sm"
              glow
              className="
                left-[9%]
                top-[27%]
              "
            />

            <FloatingIsland
              size="md"
              glow
              className="
                right-[27%]
                top-[19%]
              "
            />

            <FloatingIsland
              size="sm"
              className="
                right-[10%]
                top-[43%]
              "
            />

            <FloatingIsland
              size="sm"
              className="
                left-[6%]
                top-[45%]
              "
            />

            {/* Grid muy sutil */}

            <div
              className="
                absolute
                inset-0
                opacity-[0.025]
                [background-image:linear-gradient(rgba(56,189,248,1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,1)_1px,transparent_1px)]
                [background-size:40px_40px]
              "
            />

          </div>

          {/* ==================================================
              CONTENIDO
          ================================================== */}

          <div
            className="
              relative
              z-20
              min-h-[700px]
              p-7
              md:p-9
            "
          >

            {/* ==================================================
                CABECERA
            ================================================== */}

            <div
              className="
                relative
                z-[180]
                flex
                items-start
                justify-between
              "
            >

              <div>

                <div className="flex items-center gap-2">

                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-cyan-300
                      shadow-[0_0_14px_rgba(103,232,249,0.9)]
                    "
                  />

                  <span
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.24em]
                      text-cyan-300
                    "
                  >
                    Tu Peak
                  </span>

                </div>

                <h1
                  className="
                    mt-3
                    text-4xl
                    font-black
                    tracking-[-0.05em]
                    text-white
                    md:text-5xl
                  "
                >
                  ¡Hola, {userName}!
                </h1>

                <p
                  className="
                    mt-2
                    max-w-lg
                    text-sm
                    font-medium
                    text-slate-400
                  "
                >
                  Tu mejor versión también se
                  construye estudiando.
                </p>

              </div>

              {/* Score */}

              <div
                className="
                  hidden
                  min-w-[160px]
                  rounded-2xl
                  border
                  border-cyan-400/20
                  bg-[#061426]/90
                  px-5
                  py-4
                  shadow-[0_0_35px_rgba(34,211,238,0.06)]
                  backdrop-blur-md
                  sm:block
                "
              >

                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                  "
                >
                  Puntaje actual
                </p>

                <div
                  className="
                    mt-1
                    flex
                    items-baseline
                    gap-1.5
                  "
                >

                  <span
                    className="
                      text-3xl
                      font-black
                      tracking-[-0.04em]
                      text-white
                    "
                  >
                    {currentScore}
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    / {targetScore}
                  </span>

                </div>

                {latestSimulationDate && (
                  <p
                    className="
                      mt-1
                      text-[9px]
                      text-slate-500
                    "
                  >
                    {latestSimulationDate}
                  </p>
                )}

              </div>

            </div>

            {/* ==================================================
                MENSAJE
            ================================================== */}

            <PeakMessageCloud />

            {/* ==================================================
                ESCENA
            ================================================== */}

            <div
              className="
                relative
                mt-2
                min-h-[455px]
              "
            >

              {/* AURA */}

              <div
                className="
                  absolute
                  bottom-[65px]
                  left-1/2
                  z-0
                  h-[390px]
                  w-[800px]
                  -translate-x-1/2
                  rounded-full
                  bg-blue-600/10
                  blur-[110px]
                "
              />

              <div
                className="
                  absolute
                  bottom-[120px]
                  left-1/2
                  z-0
                  h-[240px]
                  w-[520px]
                  -translate-x-1/2
                  rounded-full
                  bg-cyan-400/10
                  blur-[75px]
                "
              />

              {/* =================================================
                  MONTAÑA
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[38px]
                  left-1/2
                  z-20
                  w-[74%]
                  max-w-[820px]
                  -translate-x-1/2
                "
              >

                <Image
                  src="/dashboard/peak-mountain.png"
                  alt="Montaña PeakScore"
                  width={1100}
                  height={700}
                  priority
                  className="
                    h-auto
                    w-full
                    object-contain
                    drop-shadow-[0_30px_55px_rgba(0,0,0,0.85)]
                  "
                />

              </div>

              {/* =================================================
                  TU PEAK
                  
                  IMPORTANTE:
                  Se posiciona SOBRE la punta real.
                  La montaña está centrada.
              ================================================= */}

              <div
                className="
                  absolute
                  left-[51%]
                  top-[-58px]
                  z-[170]
                  -translate-x-1/2
                "
              >

                {/* Glow de la punta */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[100px]
                    w-[100px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-cyan-400/[0.08]
                    blur-2xl
                  "
                />

                {/* Órbita */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-[16px]
                    h-[22px]
                    w-[122px]
                    -translate-x-1/2
                    rounded-[50%]
                    border
                    border-cyan-300/70
                    shadow-[0_0_25px_rgba(34,211,238,0.5)]
                  "
                />

                {/* Órbita secundaria */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-[8px]
                    h-[34px]
                    w-[148px]
                    -translate-x-1/2
                    rounded-[50%]
                    border
                    border-violet-300/20
                  "
                />

                {/* Placa */}

                <div
                  className="
                    relative
                    rounded-xl
                    border
                    border-cyan-300/70
                    bg-[#061426]/95
                    px-5
                    py-2.5
                    shadow-[0_0_35px_rgba(34,211,238,0.42)]
                    backdrop-blur-md
                  "
                >

                  <span
                    className="
                      whitespace-nowrap
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.18em]
                      text-cyan-200
                    "
                  >
                    ✦ TU PEAK ✦
                  </span>

                </div>

              </div>

              {/* =================================================
                  NODOS

                  SOLO UNO POR MATERIA
              ================================================= */}

              <SubjectNode
                label="Matemáticas"
                color="cyan"
                icon="∑"
                className="
                  left-[18%]
                  top-[304px]
                  z-[95]
                "
              />

              <SubjectNode
                label="Lectura Crítica"
                color="green"
                icon="▣"
                className="
                  left-[40%]
                  top-[248px]
                  z-[95]
                "
              />

              <SubjectNode
                label="Ciencias Naturales"
                color="yellow"
                icon="⚗"
                className="
                  left-[61%]
                  top-[190px]
                  z-[95]
                "
              />

              {/* =================================================
                  SOCIALES

                  ÚLTIMO PUNTO DE LA RUTA
              ================================================= */}

              <SubjectNode
                label="Sociales"
                color="slate"
                icon="..."
                className="
                  left-[82%]
                  top-[114px]
                  z-[150]
                  hidden
                  md:flex
                "
              />

              {/* =================================================
                  PEAKY
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[-2px]
                  left-[9%]
                  z-[125]
                  w-[245px]
                  md:w-[275px]
                "
              >

                <img
                  src="/characters/peaky/peaky-study-blink.gif?v=6"
                  alt="Peaky"
                  width="570"
                  height="570"
                  className="
                    block
                    h-auto
                    w-full
                    object-contain
                    drop-shadow-[0_26px_30px_rgba(0,0,0,0.92)]
                  "
                />

              </div>

              {/* =================================================
                  POKI

                  PEQUEÑO
                  A LA IZQUIERDA DE PEAKY
                  SOBRE LA MESA
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[25px]
                  left-[12%]
                  z-[150]
                  w-[62px]
                  md:w-[70px]
                "
              >

                <div
                  className="
                    absolute
                    bottom-0
                    left-1/2
                    h-2
                    w-[90%]
                    -translate-x-1/2
                    rounded-full
                    bg-cyan-300/20
                    blur-md
                  "
                />

                <img
                  src="/characters/piko/poki-idle.gif?v=6"
                  alt="Poki"
                  width="512"
                  height="512"
                  className="
                    relative
                    z-10
                    block
                    h-auto
                    w-full
                    object-contain
                    drop-shadow-[0_15px_20px_rgba(0,0,0,0.9)]
                  "
                />

              </div>

              {/* =================================================
                  PLACA PEAKY & POKI
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[154px]
                  left-[9%]
                  z-[140]
                  hidden
                  rounded-xl
                  border
                  border-amber-300/30
                  bg-[#1b160b]/95
                  px-3
                  py-2
                  shadow-[0_0_22px_rgba(251,191,36,0.08)]
                  backdrop-blur-md
                  md:block
                "
              >

                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.08em]
                    text-amber-200
                  "
                >
                  PEAKY &amp; POKI
                </p>

                <p
                  className="
                    mt-0.5
                    text-[8px]
                    text-amber-100/60
                  "
                >
                  Compañeros de expedición
                </p>

              </div>

              <GroundGlow
                className="
                  bottom-0
                  left-[2%]
                  z-[120]
                  h-5
                  w-[31%]
                "
              />

              {/* =================================================
                  ISLA FINAL

                  MISMO EJE QUE SOCIALES
              ================================================= */}

              <MainFloatingIsland
                className="
                  bottom-[312px]
                  left-[86%]
                  z-[105]
                  h-[115px]
                  w-[240px]
                  -translate-x-1/2
                "
              />

              {/* =================================================
                  ? EN EL CENTRO DE LA ISLA
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[369px]
                  left-[86%]
                  z-[130]
                  -translate-x-1/2
                "
              >

                <span
                  className="
                    block
                    text-[30px]
                    font-black
                    leading-none
                    text-slate-600/75
                  "
                >
                  ?
                </span>

              </div>

              {/* =================================================
                  CONEXIÓN SOCIALES → ISLA
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[99px]
                  left-[82%]
                  z-[132]
                  -translate-x-1/2
                "
              >

                <span
                  className="
                    block
                    h-[25px]
                    w-px
                    bg-gradient-to-b
                    from-slate-300/65
                    via-cyan-300/30
                    to-transparent
                  "
                />

              </div>

              {/* =================================================
                  TEXTO LATERAL
              ================================================= */}

              <div
                className="
                  absolute
                  bottom-[105px]
                  right-[1%]
                  z-[90]
                  hidden
                  max-w-[165px]
                  text-right
                  md:block
                "
              >

                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-cyan-400
                  "
                >
                  Un mejor tú
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-semibold
                    leading-5
                    text-slate-400
                  "
                >
                  También construye
                  <br />
                  un mejor mañana.
                </p>

              </div>

            </div>

            {/* ==================================================
                PROGRESO
            ================================================== */}

            <div
              className="
                relative
                z-[180]
                rounded-2xl
                border
                border-cyan-400/10
                bg-[#04101f]/90
                px-5
                py-4
                backdrop-blur-md
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-slate-500
                  "
                >
                  Progreso hacia tu objetivo
                </p>

                <p
                  className="
                    text-xs
                    font-black
                    text-white
                  "
                >
                  {Math.round(progress)}%
                </p>

              </div>

              <div
                className="
                  mt-2
                  h-2.5
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-violet-500
                    shadow-[0_0_18px_rgba(34,211,238,0.45)]
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                  text-[10px]
                  font-medium
                  text-slate-500
                "
              >

                <span>
                  {currentScore} pts actuales
                </span>

                <span>
                  {targetScore} pts objetivo
                </span>

              </div>

            </div>

          </div>
        </section>

        {/* ====================================================
            ESTADÍSTICAS
        ==================================================== */}

        <section
          className="
            grid
            gap-5
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >

          <StatCard
            title="Meta"
            value={
              profile?.target_score ?? 500
            }
            color="green"
          />

          <StatCard
            title="Simulacros"
            value={
              profile?.simulations ?? 0
            }
            color="orange"
          />

          <StatCard
            title="Racha"
            value={
              profile?.streak ?? 0
            }
            color="red"
          />

        </section>

        {/* ====================================================
            EVOLUCIÓN + ACCIONES
        ==================================================== */}

        <section className="w-full">
          <ProgressChart userId={userId} />
        </section>

        {/* ====================================================
    MATERIAS + SIMULACROS
==================================================== */}

<section
  className="
    grid
    gap-6
    lg:grid-cols-3
  "
>
  {/* ==================================================
      RENDIMIENTO POR ÁREA
  ================================================== */}

  <div
    className="
      relative
      overflow-hidden
      rounded-[22px]
      border
      border-[#124d80]
      bg-[#031426]
      p-5
      shadow-[0_0_35px_rgba(0,100,180,0.10)]
      lg:col-span-2
    "
  >
    {/* Línea superior */}

    <div
      className="
        pointer-events-none
        absolute
        left-5
        right-5
        top-0
        h-[2px]
        bg-gradient-to-r
        from-transparent
        via-cyan-400
        to-transparent
        opacity-80
      "
    />

    {/* Brillo ambiental */}

    <div
      className="
        pointer-events-none
        absolute
        -right-24
        -top-24
        h-64
        w-64
        rounded-full
        bg-cyan-500/[0.035]
        blur-3xl
      "
    />

    {/* ==================================================
        HEADER — RENDIMIENTO POR ÁREA
    ================================================== */}

    <div className="relative z-10 mb-6">

      {/* Línea decorativa superior */}
      <div className="mb-3 flex items-center gap-3">

        <div
          className="
            h-[2px]
            w-8
            bg-gradient-to-r
            from-cyan-400
            to-blue-500
            shadow-[0_0_10px_rgba(34,211,238,0.65)]
          "
        />

        <span
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.22em]
            text-cyan-300
            drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]
          "
        >
          PeakScore
        </span>

        <div
          className="
            h-px
            flex-1
            bg-gradient-to-r
            from-cyan-400/30
            via-blue-500/20
            to-transparent
          "
        />

      </div>

      {/* TÍTULO */}
      <div className="flex items-center gap-3">

        {/* Decoración pixel */}
        <div
          className="
            relative
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-cyan-400/30
            bg-cyan-400/[0.07]
            shadow-[0_0_18px_rgba(34,211,238,0.12)]
          "
        >
          <span
            className="
              h-2
              w-2
              rounded-[2px]
              bg-cyan-300
              shadow-[0_0_10px_rgba(103,232,249,0.9)]
            "
          />

          <span
            className="
              absolute
              right-[6px]
              top-[6px]
              h-1
              w-1
              rounded-[1px]
              bg-blue-400
            "
          />

          <span
            className="
              absolute
              bottom-[6px]
              left-[6px]
              h-1
              w-1
              rounded-[1px]
              bg-cyan-400
            "
          />
        </div>

        <div>
          <h2
            className="
              text-[18px]
              font-black
              uppercase
              tracking-[0.04em]
              text-white
              drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]
              md:text-[19px]
            "
          >
            Rendimiento por área
          </h2>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="
                h-[3px]
                w-[22px]
                rounded-full
                bg-cyan-400
                shadow-[0_0_8px_rgba(34,211,238,0.65)]
              "
            />

            <p
              className="
                text-[10px]
                font-medium
                leading-none
                text-slate-400
              "
            >
              {hasCompleteSimulation
                ? "Rendimiento calculado con las sesiones 1 y 2."
                : "Completa las sesiones 1 y 2 para actualizar tu rendimiento."}
            </p>
          </div>
        </div>
      </div>

      {/* Línea inferior decorativa */}
      <div className="mt-4 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_7px_rgba(103,232,249,0.9)]" />
        <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/25 via-blue-400/10 to-transparent" />
        <span className="h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_7px_rgba(96,165,250,0.8)]" />
      </div>

    </div>

    {/* ==================================================
        MATERIAS
    ================================================== */}

    <div
      className="
        relative
        z-10
        space-y-2.5
      "
    >
      <SubjectProgress
        subject="Matemáticas"
        percentage={
          subjectProgress.matematicas
        }
      />

      <SubjectProgress
        subject="Lectura Crítica"
        percentage={
          subjectProgress.lectura
        }
      />

      <SubjectProgress
        subject="Ciencias Naturales"
        percentage={
          subjectProgress.ciencias
        }
      />

      <SubjectProgress
        subject="Sociales y Ciudadanas"
        percentage={
          subjectProgress.sociales
        }
      />

      <SubjectProgress
        subject="Inglés"
        percentage={
          subjectProgress.ingles
        }
      />
    </div>
  </div>

  {/* ==================================================
      ÚLTIMOS SIMULACROS
  ================================================== */}

  <RecentSimulations />

</section>

        {/* ====================================================
            OBJETIVO + LOGROS
        ==================================================== */}

        <section
          className="
            grid
            items-stretch
            gap-6
            lg:grid-cols-3
          "
        >
          {/* OBJETIVO */}

          <div className="h-full">
            <GoalCard
              currentScore={currentScore}
              targetScore={targetScore}
              onTargetChange={handleTargetChange}
            />
         </div>

         {/* LOGROS + FRASE */}

         <div className="min-h-0 lg:col-span-2">
           <Achievements />
         </div>
       </section>

      </div>
    </main>
  );
}
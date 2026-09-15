"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

import type { Profile } from "@/types/profile";

import { getProfile } from "@/lib/services/profile.service";
import { updateUserStreak } from "@/lib/services/streak.service";

import {
  Target,
  Trophy,
  BookOpen,
  Flame,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import QuickActions from "@/components/dashboard/QuickActions";
import ProgressChart from "@/components/dashboard/ProgressChart";
import Achievements from "@/components/dashboard/Achievements";
import RecentSimulations from "@/components/dashboard/RecentSimulations";
import GoalCard from "@/components/dashboard/GoalCard";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");

  /*
   * ============================================================
   * ÚLTIMO SIMULACRO
   * ============================================================
   */

  const [latestSimulationScore, setLatestSimulationScore] =
    useState<number | null>(null);

  const [latestSimulationDate, setLatestSimulationDate] =
    useState<string | null>(null);

  /*
   * ============================================================
   * PROGRESO HACIA LA META
   *
   * El progreso se calcula usando el último simulacro completado.
   * Si todavía no existe ninguno, usamos 0.
   * ============================================================
   */

  const targetScore = profile?.target_score ?? 500;

  const currentScore = latestSimulationScore ?? 0;

  const progress =
    targetScore > 0
      ? Math.min((currentScore / targetScore) * 100, 100)
      : 0;

  /*
   * ============================================================
   * CARGAR USUARIO
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        /*
         * ======================================================
         * SESIÓN
         * ======================================================
         */

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const currentUserId = session.user.id;

        if (!mounted) return;

        setUserId(currentUserId);

        /*
         * ======================================================
         * ACTUALIZAR RACHA
         * ======================================================
         */

        await updateUserStreak(currentUserId);

        /*
         * ======================================================
         * OBTENER PERFIL
         * ======================================================
         */

        const profileData = await getProfile(currentUserId);

        if (!mounted) return;

        if (profileData) {
          setProfile(profileData);
          setUserName(profileData.full_name ?? "Usuario");
        } else {
          setUserName(
            session.user.user_metadata?.full_name ||
              session.user.email ||
              "Usuario"
          );
        }

        /*
         * ======================================================
         * OBTENER ÚLTIMO SIMULACRO COMPLETADO
         * ======================================================
         *
         * Importante:
         *
         * No usamos average_score.
         *
         * Buscamos directamente el último intento terminado
         * del usuario.
         *
         * Ejemplo:
         *
         * Simulacro 1 → 445
         * Simulacro 2 → 423
         *
         * Resultado mostrado:
         *
         * 423 / 500
         * ======================================================
         */

        const {
          data: latestAttempt,
          error: latestAttemptError,
        } = await supabase
          .from("simulation_attempts")
          .select("score, completed_at")
          .eq("user_id", currentUserId)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (latestAttemptError) {
          console.error(
            "[PeakScore] Error obteniendo último simulacro:",
            latestAttemptError
          );

          if (mounted) {
            setLatestSimulationScore(null);
            setLatestSimulationDate(null);
          }
        } else if (latestAttempt) {
          if (mounted) {
            setLatestSimulationScore(
              typeof latestAttempt.score === "number"
                ? latestAttempt.score
                : 0
            );

            setLatestSimulationDate(
              latestAttempt.completed_at
                ? new Date(
                    latestAttempt.completed_at
                  ).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : null
            );
          }
        } else {
          if (mounted) {
            setLatestSimulationScore(null);
            setLatestSimulationDate(null);
          }
        }
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando dashboard:",
          error
        );
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

  /*
   * ============================================================
   * CERRAR SESIÓN
   * ============================================================
   */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace("/login");
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Cargando tu dashboard...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * DASHBOARD
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-slate-100">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Header
        userName={userName}
        onLogout={handleLogout}
      />

      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">

        {/* ====================================================
            PROGRESO HACIA LA META
        ==================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200/80
            bg-white
            px-7
            py-7
            shadow-[0_4px_24px_rgba(15,23,42,0.05)]
            transition-all
            duration-300
            hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]
          "
        >

          {/* DECORACIÓN */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              bg-blue-500/[0.035]
              blur-2xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              right-8
              top-8
              h-20
              w-20
              rounded-full
              border
              border-blue-500/[0.06]
            "
          />

          {/* CABECERA */}

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp
                    size={16}
                    strokeWidth={2}
                  />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Tu progreso
                </p>

              </div>

              <h2 className="mt-4 text-[22px] font-bold tracking-[-0.025em] text-slate-950">
                Preparación ICFES
              </h2>

              <p className="mt-1 text-[13px] font-medium text-slate-400">
                {latestSimulationScore !== null
                  ? "Resultado de tu simulacro más reciente."
                  : "Completa tu primer simulacro para comenzar a medir tu progreso."}
              </p>

            </div>

            {/* PUNTAJE */}

            <div className="relative flex items-center gap-5">

              <div className="hidden h-12 w-px bg-slate-200 md:block" />

              <div className="text-right">

                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                  Último puntaje
                </p>

                <div className="mt-1 flex items-baseline justify-end gap-1">

                  <span className="text-[34px] font-bold leading-none tracking-[-0.04em] text-slate-950">
                    {currentScore}
                  </span>

                  <span className="text-[13px] font-semibold text-slate-400">
                    / {targetScore}
                  </span>

                </div>

                {latestSimulationDate && (
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {latestSimulationDate}
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* BARRA */}

          <div className="relative mt-7">

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">

              <div
                className="
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-blue-600
                  to-blue-500
                  shadow-[0_0_14px_rgba(37,99,235,0.25)]
                  transition-all
                  duration-700
                "
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <div className="mt-3 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <span className="text-[12px] font-bold text-slate-800">
                  {currentScore} pts
                </span>

                <span className="text-[10px] font-medium text-slate-400">
                  resultado actual
                </span>

              </div>

              <div className="flex items-center gap-1.5">

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                  {Math.round(progress)}% del objetivo
                </span>

                <ArrowUpRight
                  size={13}
                  className="text-blue-500"
                  strokeWidth={2}
                />

              </div>

              <span className="text-[12px] font-bold text-slate-400">
                {targetScore} pts
              </span>

            </div>

          </div>

        </section>

        {/* ====================================================
            ESTADÍSTICAS PRINCIPALES
        ==================================================== */}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Puntaje promedio"
            value={profile?.average_score ?? 0}
            icon={<Trophy size={30} />}
            color="blue"
          />

          <StatCard
            title="Meta"
            value={profile?.target_score ?? 500}
            icon={<Target size={30} />}
            color="green"
          />

          <StatCard
            title="Simulacros"
            value={profile?.simulations ?? 0}
            icon={<BookOpen size={30} />}
            color="orange"
          />

          <StatCard
            title="Racha"
            value={profile?.streak ?? 0}
            icon={<Flame size={30} />}
            color="red"
          />

        </section>

        {/* ====================================================
            EVOLUCIÓN + ACCIONES
        ==================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2">
            <ProgressChart userId={userId} />
          </div>

          <QuickActions />

        </section>

        {/* ====================================================
            RENDIMIENTO + ÚLTIMOS SIMULACROS
        ==================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          {/* RENDIMIENTO POR MATERIA */}

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">

            <div className="mb-7">

              <h2 className="text-2xl font-bold text-slate-900">
                Rendimiento por materia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta cómo estás avanzando en cada área.
              </p>

            </div>

            <div className="space-y-6">

              <SubjectProgress
                subject="Matemáticas"
                percentage={0}
              />

              <SubjectProgress
                subject="Lectura Crítica"
                percentage={0}
              />

              <SubjectProgress
                subject="Ciencias Naturales"
                percentage={0}
              />

              <SubjectProgress
                subject="Sociales y Ciudadanas"
                percentage={0}
              />

              <SubjectProgress
                subject="Inglés"
                percentage={0}
              />

            </div>

          </div>

          {/* ÚLTIMOS SIMULACROS */}

          <RecentSimulations />

        </section>

        {/* ====================================================
            OBJETIVO + LOGROS
        ==================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          <GoalCard
            currentScore={profile?.average_score ?? 0}
            targetScore={profile?.target_score ?? 500}
          />

          <div className="lg:col-span-2">
            <Achievements />
          </div>

        </section>

      </div>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import { supabase } from "@/lib/supabase/browser";

/* ============================================================
   TIPOS
============================================================ */

interface RecentSimulation {
  id: string;
  date: string;
  score: number;
  duration: string;
}

/* ============================================================
   COMPONENTE AUXILIAR
   NUBE PIXELADA
============================================================ */

function PixelCloud({
  className = "",
  opacity = "opacity-70",
}: {
  className?: string;
  opacity?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${opacity} ${className}`}
    >
      <div className="relative h-10 w-32">
        <span className="absolute bottom-0 left-3 h-4 w-20 bg-fuchsia-300/20 blur-[2px]" />
        <span className="absolute bottom-2 left-8 h-7 w-14 bg-fuchsia-300/25 blur-[3px]" />
        <span className="absolute bottom-1 left-20 h-5 w-16 bg-pink-300/20 blur-[3px]" />
        <span className="absolute bottom-0 left-0 h-3 w-10 bg-pink-300/20 blur-[2px]" />

        <span className="absolute left-5 top-1 h-2 w-5 bg-fuchsia-300/20 blur-[1px]" />
        <span className="absolute left-12 top-0 h-3 w-7 bg-pink-300/20 blur-[2px]" />
        <span className="absolute left-24 top-2 h-2 w-5 bg-fuchsia-300/20 blur-[1px]" />
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE AUXILIAR
   ESTRELLA / PARTÍCULA
============================================================ */

function PixelParticle({
  className = "",
  type = "dot",
}: {
  className?: string;
  type?: "dot" | "diamond" | "star";
}) {
  if (type === "diamond") {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute h-2 w-2 rotate-45 bg-fuchsia-300 shadow-[0_0_12px_rgba(244,114,182,0.8)] ${className}`}
      />
    );
  }

  if (type === "star") {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] ${className}`}
      >
        ✦
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(34,211,238,0.9)] ${className}`}
    />
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function RecentSimulations() {
  const [simulations, setSimulations] = useState<RecentSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
     CARGAR SIMULACROS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadRecentSimulations() {
      try {
        /* ------------------------------------------------------
           1. USUARIO
        ------------------------------------------------------ */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           2. OBTENER INTENTOS TERMINADOS
        ------------------------------------------------------ */

        const {
          data: attemptRows,
          error: attemptsError,
        } = await supabase
          .from("simulation_attempts")
          .select(
            "id, simulation_id, started_at, completed_at, score"
          )
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", {
            ascending: false,
          })
          .limit(20);

        if (attemptsError) {
          console.warn(
            "[PeakScore] No fue posible obtener los intentos:",
            attemptsError
          );

          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           3. SIN INTENTOS
        ------------------------------------------------------ */

        if (!attemptRows || attemptRows.length === 0) {
          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           4. OBTENER IDS DE SIMULACIONES
        ------------------------------------------------------ */

        const simulationIds = Array.from(
          new Set(
            attemptRows
              .map((attempt) => attempt.simulation_id)
              .filter(
                (id): id is string =>
                  typeof id === "string" && id.length > 0
              )
          )
        );

        if (simulationIds.length === 0) {
          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           5. OBTENER INFORMACIÓN DE LAS SIMULACIONES

           Importante:
           Filtramos también por user_id.

           Esto ayuda a que Supabase trabaje con la fila
           correspondiente al usuario y evita problemas
           innecesarios con RLS.
        ------------------------------------------------------ */

        const {
          data: simulationRows,
          error: simulationsError,
        } = await supabase
          .from("simulations")
          .select("id, type, session")
          .eq("user_id", user.id)
          .in("id", simulationIds);

        if (simulationsError) {
          console.warn(
            "[PeakScore] No fue posible obtener las simulaciones:",
            simulationsError
          );

          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           6. MAPA DE SIMULACIONES
        ------------------------------------------------------ */

        const simulationMap = new Map<
          string,
          {
            id: string;
            type: string | null;
            session: number | null;
          }
        >();

        for (const simulation of simulationRows ?? []) {
          simulationMap.set(simulation.id, simulation);
        }

        /* ------------------------------------------------------
           7. SOLO SIMULACROS COMPLETOS

           PeakScore considera como bitácora únicamente:

           type = completo
           session = 1 o 2
        ------------------------------------------------------ */

        const completeAttempts = attemptRows.filter((attempt) => {
          const simulation = simulationMap.get(
            attempt.simulation_id
          );

          if (!simulation) {
            return false;
          }

          const type = String(simulation.type ?? "")
            .trim()
            .toLowerCase();

          return (
            type === "completo" &&
            (simulation.session === 1 ||
              simulation.session === 2)
          );
        });

        /* ------------------------------------------------------
           8. SIN SIMULACROS COMPLETOS
        ------------------------------------------------------ */

        if (completeAttempts.length === 0) {
          if (mounted) {
            setSimulations([]);
            setLoading(false);
          }

          return;
        }

        /* ------------------------------------------------------
           9. FORMATEAR

           Solo mostramos los 3 más recientes.
        ------------------------------------------------------ */

        const formatted: RecentSimulation[] =
          completeAttempts.slice(0, 3).map((attempt) => {
            /* --------------------------------------------------
               FECHA
            -------------------------------------------------- */

            const completedDate = new Date(
              attempt.completed_at
            );

            const date = completedDate.toLocaleDateString(
              "es-CO",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );

            /* --------------------------------------------------
               DURACIÓN
            -------------------------------------------------- */

            let duration = "—";

            if (
              attempt.started_at &&
              attempt.completed_at
            ) {
              const start = new Date(
                attempt.started_at
              ).getTime();

              const end = new Date(
                attempt.completed_at
              ).getTime();

              const difference = Math.max(
                0,
                end - start
              );

              const totalMinutes = Math.floor(
                difference / 60000
              );

              const hours = Math.floor(
                totalMinutes / 60
              );

              const minutes = totalMinutes % 60;

              if (hours > 0) {
                duration = `${hours}h ${String(
                  minutes
                ).padStart(2, "0")}m`;
              } else {
                duration = `${minutes} min`;
              }
            }

            /* --------------------------------------------------
               PUNTAJE
            -------------------------------------------------- */

            const score =
              typeof attempt.score === "number"
                ? attempt.score
                : 0;

            return {
              id: attempt.id,
              date,
              score,
              duration,
            };
          });

        if (mounted) {
          setSimulations(formatted);
        }
      } catch (error) {
        console.warn(
          "[PeakScore] Error cargando Bitácora de Expedición:",
          error
        );

        if (mounted) {
          setSimulations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRecentSimulations();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <article
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-[#123453]
          bg-[#03111f]
          shadow-[0_20px_60px_rgba(0,20,40,0.22)]
        "
      >
        <div className="relative h-[185px] overflow-hidden">
          <img
            src="/dashboard/peakyboveda.png?v=3"
            alt="Bitácora de expedición PeakScore"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#03111f] via-transparent to-transparent" />
        </div>

        <div className="relative bg-[#03111f] p-5">
          <div className="h-4 w-48 animate-pulse rounded bg-white/10" />

          <div className="mt-5 h-3 w-32 animate-pulse rounded bg-white/10" />

          <div className="mt-5 h-32 animate-pulse rounded-[22px] bg-white/[0.04]" />
        </div>
      </article>
    );
  }

  /* ==========================================================
     ESTADO VACÍO
  ========================================================== */

  if (simulations.length === 0) {
    return (
      <article
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-[#123453]
          bg-[#03111f]
          shadow-[0_20px_60px_rgba(0,20,40,0.28)]
        "
      >
        {/* ====================================================
            DECORACIÓN SUPERIOR
        ==================================================== */}

        <div className="relative h-[185px] overflow-hidden">
          <img
            src="/dashboard/peakyboveda.png?v=3"
            alt="Bitácora de expedición PeakScore"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />

          {/* Overlay */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-b
              from-transparent
              via-transparent
              to-[#03111f]
            "
          />

          {/* NUBES ROSAS */}
          <PixelCloud
            className="-bottom-2 left-[5%] scale-75"
            opacity="opacity-70"
          />

          <PixelCloud
            className="bottom-2 right-[5%] scale-90"
            opacity="opacity-60"
          />

          {/* PARTÍCULAS */}
          <PixelParticle
            className="left-[13%] top-[25%]"
            type="diamond"
          />

          <PixelParticle
            className="left-[42%] top-[18%]"
            type="star"
          />

          <PixelParticle
            className="right-[16%] top-[31%]"
            type="diamond"
          />

          <PixelParticle
            className="right-[30%] top-[18%]"
          />
        </div>

        {/* ====================================================
            CONTENIDO
        ==================================================== */}

        <div
          className="
            relative
            overflow-hidden
            bg-[#03111f]
            px-5
            pb-6
            pt-5
          "
        >
          {/* BRILLOS */}

          <div
            className="
              pointer-events-none
              absolute
              -left-20
              bottom-[-70px]
              h-48
              w-48
              rounded-full
              bg-fuchsia-500/[0.10]
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              top-[-70px]
              h-48
              w-48
              rounded-full
              bg-cyan-400/[0.09]
              blur-3xl
            "
          />

          {/* NUBES ROSAS PIXELADAS */}

          <PixelCloud
            className="-bottom-4 left-[-15px] scale-75"
            opacity="opacity-50"
          />

          <PixelCloud
            className="right-[-15px] top-4 scale-75"
            opacity="opacity-40"
          />

          {/* PARTÍCULAS */}

          <PixelParticle
            className="left-[8%] top-[17%]"
            type="star"
          />

          <PixelParticle
            className="right-[12%] top-[25%]"
            type="diamond"
          />

          <PixelParticle
            className="left-[24%] bottom-[23%]"
          />

          <PixelParticle
            className="right-[24%] bottom-[19%]"
          />

          {/* HEADER */}

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div>
                <p
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.22em]
                    text-cyan-300
                  "
                >
                  BITÁCORA DE EXPEDICIÓN
                </p>
              </div>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-medium
                  text-slate-500
                "
              >
                Tus últimos simulacros completos
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                border
                border-cyan-400/30
                bg-cyan-400/[0.05]
                px-3
                py-1.5
                text-[8px]
                font-black
                text-cyan-300
                shadow-[0_0_20px_rgba(34,211,238,0.05)]
              "
            >
              <FileText size={11} />

              <span>0 recientes</span>
            </div>
          </div>

          {/* LÍNEA PEAKSCORE */}

          <div className="mt-5 flex items-center gap-2">
            <span className="h-[2px] w-10 bg-cyan-400" />

            <span className="h-px flex-1 bg-cyan-400/10" />

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-cyan-400
                shadow-[0_0_12px_rgba(34,211,238,0.95)]
              "
            />
          </div>

          {/* ==================================================
              PANEL CENTRAL
          ================================================== */}

          <div
            className="
              relative
              mt-5
              min-h-[280px]
              overflow-hidden
              rounded-[22px]
              border
              border-cyan-400/20
              bg-[#051725]
              px-5
              py-9
              text-center
              shadow-[inset_0_0_50px_rgba(34,211,238,0.025)]
            "
          >
            {/* GRID */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-40
                [background-image:linear-gradient(rgba(45,212,191,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.045)_1px,transparent_1px)]
                [background-size:18px_18px]
              "
            />

            {/* GLOW ROSA */}

            <div
              className="
                pointer-events-none
                absolute
                bottom-[-80px]
                left-1/2
                h-44
                w-72
                -translate-x-1/2
                rounded-full
                bg-fuchsia-500/[0.12]
                blur-3xl
              "
            />

            {/* NUBES ROSAS */}

            <PixelCloud
              className="-bottom-3 left-[-20px] scale-110"
              opacity="opacity-55"
            />

            <PixelCloud
              className="-bottom-4 right-[-15px] scale-95"
              opacity="opacity-50"
            />

            <PixelCloud
              className="left-[5%] top-[20%] scale-50"
              opacity="opacity-30"
            />

            <PixelCloud
              className="right-[3%] top-[30%] scale-50"
              opacity="opacity-30"
            />

            {/* PARTÍCULAS */}

            <PixelParticle
              className="left-[15%] top-[18%]"
              type="diamond"
            />

            <PixelParticle
              className="left-[31%] top-[30%]"
              type="star"
            />

            <PixelParticle
              className="right-[16%] top-[26%]"
              type="diamond"
            />

            <PixelParticle
              className="right-[25%] bottom-[22%]"
              type="star"
            />

            <PixelParticle
              className="left-[8%] bottom-[25%]"
            />

            {/* TEXTO */}

            <div className="relative">
              <p
                className="
                  mt-5
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.25em]
                  text-cyan-300
                "
              >
                Primera expedición
              </p>

              <h3
                className="
                  mt-3
                  text-[18px]
                  font-black
                  tracking-[-0.03em]
                  text-white
                "
              >
                Aún no hay expediciones
              </h3>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-[290px]
                  text-[10px]
                  font-medium
                  leading-5
                  text-slate-400
                "
              >
                Completa las sesiones 1 y 2 de un
                simulacro completo para comenzar tu
                bitácora.
              </p>

              {/* DIVISOR */}

              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-cyan-400/30" />

                <span
                  className="
                    text-[7px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                  "
                >
                  Sesión 1 + Sesión 2
                </span>

                <span className="h-px w-8 bg-cyan-400/30" />
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-cyan-400/20" />

            <span
              className="
                text-[7px]
                font-black
                uppercase
                tracking-[0.18em]
                text-slate-600
              "
            >
              Tu próxima expedición comienza aquí
            </span>

            <span className="h-px w-8 bg-cyan-400/20" />
          </div>
        </div>
      </article>
    );
  }

  /* ==========================================================
     HISTORIAL
  ========================================================== */

  return (
    <article
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-[#123453]
        bg-[#03111f]
        shadow-[0_20px_60px_rgba(0,20,40,0.28)]
      "
    >
      {/* ======================================================
          BANNER SUPERIOR
      ====================================================== */}

      <div
        className="
          relative
          h-[185px]
          w-full
          overflow-hidden
          bg-[#03111f]
        "
      >
        <img
          src="/dashboard/peakyboveda.png?v=3"
          alt="Bitácora de expedición PeakScore"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
          "
        />

        {/* OVERLAY */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-b
            from-transparent
            via-transparent
            to-[#03111f]
          "
        />

        {/* NUBES ROSAS */}

        <PixelCloud
          className="-bottom-3 left-[-15px] scale-90"
          opacity="opacity-50"
        />

        <PixelCloud
          className="-bottom-2 right-[-10px] scale-90"
          opacity="opacity-45"
        />

        {/* PARTICULAS */}

        <PixelParticle
          className="left-[8%] top-[20%]"
          type="star"
        />

        <PixelParticle
          className="right-[13%] top-[27%]"
          type="diamond"
        />
      </div>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          bg-[#03111f]
          px-5
          pb-6
          pt-5
        "
      >
        {/* GLOWS */}

        <div
          className="
            pointer-events-none
            absolute
            -left-24
            top-20
            h-48
            w-48
            rounded-full
            bg-fuchsia-500/[0.06]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            bottom-10
            h-48
            w-48
            rounded-full
            bg-cyan-400/[0.05]
            blur-3xl
          "
        />

        {/* HEADER */}

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div>
              <p
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.22em]
                  text-cyan-300
                "
              >
                Bitácora de expedición
              </p>
            </div>

            <p
              className="
                mt-1
                text-[9px]
                font-medium
                text-slate-500
              "
            >
              Tus últimos simulacros completos
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              rounded-full
              border
              border-cyan-400/30
              bg-cyan-400/[0.05]
              px-3
              py-1.5
              text-[8px]
              font-black
              text-cyan-300
            "
          >
            <FileText size={11} />

            <span>{simulations.length} recientes</span>
          </div>
        </div>

        {/* LÍNEA */}

        <div className="mt-5 flex items-center gap-2">
          <span className="h-[2px] w-10 bg-cyan-400" />

          <span className="h-px flex-1 bg-cyan-400/10" />

          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-cyan-400
              shadow-[0_0_12px_rgba(34,211,238,0.9)]
            "
          />
        </div>

        {/* ====================================================
            TARJETAS
        ==================================================== */}

        <div className="relative mt-5 space-y-4">
          {simulations.map((simulation, index) => (
            <div
              key={simulation.id}
              className="
                group
                relative
                overflow-hidden
                rounded-[22px]
                border
                border-[#123c5d]
                bg-[#061827]
                p-5
                transition-all
                duration-200
                hover:border-cyan-400/40
                hover:bg-[#071c2e]
              "
            >
              {/* GLOW */}

              <div
                className="
                  pointer-events-none
                  absolute
                  -right-16
                  -top-16
                  h-32
                  w-32
                  rounded-full
                  bg-cyan-400/[0.05]
                  blur-3xl
                "
              />

              <div
                className="
                  pointer-events-none
                  absolute
                  -left-16
                  -bottom-20
                  h-32
                  w-32
                  rounded-full
                  bg-fuchsia-500/[0.04]
                  blur-3xl
                "
              />

              {/* PARTÍCULA */}

              <span
                className="
                  pointer-events-none
                  absolute
                  right-6
                  top-5
                  h-1
                  w-1
                  rounded-full
                  bg-cyan-300
                  opacity-60
                "
              />

              <div
                className="
                  relative
                  grid
                  grid-cols-[72px_1fr]
                  gap-5
                  md:grid-cols-[100px_1fr]
                "
              >
                {/* ==================================================
                    FECHA
                ================================================== */}

                <div className="border-r border-cyan-400/10 pr-4">
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-cyan-400/60
                      bg-[#071d2d]
                      text-[22px]
                      font-black
                      text-cyan-300
                      shadow-[0_0_20px_rgba(34,211,238,0.06)]
                    "
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div
                    className="
                      mt-5
                      border-l-2
                      border-cyan-400
                      pl-3
                    "
                  >
                    <p
                      className="
                        text-[12px]
                        font-bold
                        uppercase
                        leading-5
                        text-slate-400
                      "
                    >
                      {simulation.date
                        .replace(/\./g, "")
                        .split(" ")
                        .map((part, i) => (
                          <span
                            key={`${simulation.id}-${i}`}
                            className="block"
                          >
                            {part.toUpperCase()}
                          </span>
                        ))}
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    CONTENIDO
                ================================================== */}

                <div className="min-w-0">
                  {/* TÍTULO */}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className="
                          text-[17px]
                          font-black
                          tracking-[-0.02em]
                          text-white
                        "
                      >
                        Simulacro Completo
                      </h3>

                      <p
                        className="
                          mt-1
                          text-[12px]
                          font-medium
                          text-slate-400
                        "
                      >
                        Sesión 1 + Sesión 2
                      </p>
                    </div>

                    {/* ESTADO */}

                    <div
                      className="
                        flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-emerald-400/40
                        bg-emerald-400/[0.06]
                        px-3
                        py-2
                        text-[10px]
                        font-black
                        text-emerald-400
                      "
                    >
                      <CheckCircle2
                        size={14}
                        strokeWidth={2}
                      />

                      Completado
                    </div>
                  </div>

                  {/* SEPARADOR */}

                  <div className="my-4 h-px bg-cyan-400/10" />

                  {/* PUNTAJE */}

                  <div>
                    <p
                      className="
                        text-[11px]
                        font-black
                        uppercase
                        tracking-[0.16em]
                        text-slate-500
                      "
                    >
                      Puntaje
                    </p>

                    <div className="mt-1 flex items-end gap-2">
                      <span
                        className="
                          text-[40px]
                          font-black
                          leading-none
                          tracking-[-0.04em]
                          text-white
                        "
                      >
                        {simulation.score}
                      </span>

                      <span
                        className="
                          mb-1
                          text-[17px]
                          font-medium
                          text-slate-500
                        "
                      >
                        / 500
                      </span>
                    </div>
                  </div>

                  {/* DURACIÓN */}

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      gap-2
                      text-[10px]
                      font-medium
                      text-slate-500
                    "
                  >
                    <Clock3
                      size={12}
                      strokeWidth={1.8}
                    />

                    {simulation.duration}
                  </div>

                  {/* BOTÓN */}

                  <div
                    className="
                      mt-5
                      flex
                      h-12
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-blue-500/70
                      bg-blue-500/[0.04]
                      px-4
                      text-cyan-300
                      transition-all
                      duration-200
                      group-hover:border-cyan-400
                      group-hover:bg-cyan-400/[0.06]
                      group-hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]
                    "
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3
                        size={20}
                        strokeWidth={2}
                      />

                      <span
                        className="
                          text-[12px]
                          font-black
                        "
                      >
                        Ver resultados de la expedición
                      </span>
                    </div>

                    <ArrowRight
                      size={21}
                      strokeWidth={2}
                      className="
                        transition-transform
                        duration-200
                        group-hover:translate-x-1
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}

        <div
          className="
            relative
            mt-6
            flex
            items-center
            justify-center
            gap-3
          "
        >
          <span className="h-px w-10 bg-cyan-400/20" />

          <span
            className="
              text-[8px]
              font-black
              uppercase
              tracking-[0.2em]
              text-slate-600
            "
          >
            Cada simulacro te acerca más a tu Peak
          </span>

          <span className="h-px w-10 bg-cyan-400/20" />
        </div>
      </div>
    </article>
  );
}
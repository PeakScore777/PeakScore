"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon?: ReactNode;
  color: "blue" | "green" | "orange" | "red";
}

/* ============================================================
   TEMAS
============================================================ */

const themes = {
  blue: {
    border: "border-cyan-400",
    accent: "bg-cyan-400",
    title: "text-cyan-300",
    glow: "shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    soft: "bg-cyan-400/[0.08]",
  },

  green: {
    border: "border-emerald-400",
    accent: "bg-emerald-400",
    title: "text-emerald-300",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.12)]",
    soft: "bg-emerald-400/[0.08]",
  },

  orange: {
    border: "border-yellow-400",
    accent: "bg-yellow-400",
    title: "text-yellow-300",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.12)]",
    soft: "bg-yellow-400/[0.08]",
  },

  red: {
    border: "border-red-400",
    accent: "bg-red-400",
    title: "text-red-300",
    glow: "shadow-[0_0_24px_rgba(248,113,113,0.12)]",
    soft: "bg-red-400/[0.08]",
  },
};

/* ============================================================
   COMPONENTE
============================================================ */

export default function StatCard({
  title,
  value,
  color,
}: StatCardProps) {
  const theme = themes[color];

  const numericValue =
    typeof value === "number"
      ? value
      : Number(value) || 0;

  /* ==========================================================
     TIPOS DE TARJETA
  ========================================================== */

  const isGoal =
    title === "Meta";

  const isSimulations =
    title === "Simulacros";

  const isStreak =
    title === "Racha" ||
    title === "Racha de estudio";

  /* ==========================================================
     IMÁGENES
  ========================================================== */

  const imageSrc = isGoal
    ? "/peaky/homepage/statsmontaña.png"
    : isStreak
      ? "/dashboard/racha-pixel.png"
      : isSimulations
        ? ""
        : null;

  /* ==========================================================
     PROGRESO DE META
  ========================================================== */

  const goalPercentage = isGoal
    ? Math.min(
        Math.max(
          (numericValue / 500) * 100,
          0
        ),
        100
      )
    : 0;

  /* ==========================================================
     PROGRESO DE RACHA
     
     No representa días de la semana.
     Solamente muestra visualmente la cantidad
     de días consecutivos alcanzados.
  ========================================================== */

  const streakPercentage = isStreak
    ? Math.min(
        Math.max(
          (numericValue / 30) * 100,
          0
        ),
        100
      )
    : 0;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <article
      className={`
        group
        relative
        min-w-0
        min-h-[150px]
        overflow-hidden
        rounded-[18px]
        border
        ${theme.border}
        ${theme.glow}
        bg-[#061321]
        px-5
        py-4
        transition-all
        duration-300
        hover:-translate-y-[2px]
        hover:shadow-[0_14px_35px_rgba(0,0,0,0.30)]
      `}
    >
      {/* ======================================================
          ACENTO SUPERIOR
      ====================================================== */}

      <div
        className={`
          pointer-events-none
          absolute
          left-0
          top-0
          h-[3px]
          w-full
          ${theme.accent}
        `}
      />

      {/* ======================================================
          BRILLO SUTIL
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.035),transparent_38%)]
        "
      />

      {/* ======================================================
          BRILLO LATERAL
      ====================================================== */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-24
          w-24
          rounded-full
          blur-3xl
          ${theme.soft}
        `}
      />

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div className="relative z-10 flex h-full flex-col">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-start justify-between gap-3">

          <p
            className={`
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              ${theme.title}
            `}
            style={{
              fontFamily:
                '"Press Start 2P", "Courier New", monospace',
            }}
          >
            {isGoal && "TU META ICFES"}

            {isSimulations && "SIMULACROS"}

            {isStreak && "RACHA DE ESTUDIO"}
          </p>

          {/* ==================================================
              MENSAJE DE RACHA
          ================================================== */}

          {isStreak && (
            <span
              className="
                shrink-0
                max-w-[75px]
                text-right
                text-[8px]
                font-black
                leading-[1.35]
                tracking-[0.03em]
                text-red-400
              "
              style={{
                fontFamily:
                  '"Press Start 2P", "Courier New", monospace',
              }}
            >
              ¡SIGUE ASÍ!
            </span>
          )}

        </div>

        {/* ====================================================
            CUERPO
        ===================================================== */}

        <div className="mt-3 flex min-h-[65px] items-center gap-4">

          {/* ==================================================
              IMAGEN
          ================================================== */}

          {imageSrc && (
            <div
              className={`
                relative
                flex
                h-[58px]
                w-[58px]
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-[14px]
                ${theme.soft}
              `}
            >
              <Image
                src={imageSrc}
                alt=""
                width={58}
                height={58}
                className="
                  h-[58px]
                  w-[58px]
                  object-contain
                  drop-shadow-[0_0_9px_rgba(34,211,238,0.20)]
                "
              />
            </div>
          )}

          {/* ==================================================
              INFORMACIÓN
          ================================================== */}

          <div className="min-w-0 flex-1">

            {/* =================================================
                VALOR
            ================================================= */}

            <div className="flex items-end gap-2">

              <span
                className="
                  text-[30px]
                  font-black
                  leading-none
                  tracking-[-0.04em]
                  text-white
                "
              >
                {value ?? 0}
              </span>

              {/* META */}

              {isGoal && (
                <span
                  className="
                    mb-[3px]
                    text-[10px]
                    font-bold
                    text-slate-400
                  "
                >
                  pts
                </span>
              )}

              {/* RACHA */}

              {isStreak && (
                <span
                  className="
                    mb-[3px]
                    text-[10px]
                    font-bold
                    text-slate-400
                  "
                >
                  días
                </span>
              )}

            </div>

            {/* =================================================
                DESCRIPCIÓN
            ================================================= */}

            <p
              className="
                mt-2
                max-w-[190px]
                text-[11px]
                font-semibold
                leading-[1.4]
                text-slate-300
              "
            >
              {isGoal &&
                "Objetivo que quieres alcanzar."}

              {isSimulations &&
                "Simulacros completados."}

              {isStreak &&
                "Días consecutivos de estudio."}
            </p>

          </div>

        </div>

        {/* ====================================================
            PARTE INFERIOR
        ==================================================== */}

        <div className="mt-auto pt-3">

          {/* ==================================================
              META ICFES
          ================================================== */}

          {isGoal && (
            <div>

              <div
                className="
                  h-[6px]
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-yellow-400
                    shadow-[0_0_8px_rgba(250,204,21,0.25)]
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${goalPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">

                <span
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.06em]
                    text-slate-400
                  "
                  style={{
                    fontFamily:
                      '"Press Start 2P", "Courier New", monospace',
                  }}
                >
                  OBJETIVO ICFES
                </span>

                <span
                  className="
                    text-[9px]
                    font-black
                    text-yellow-300
                  "
                  style={{
                    fontFamily:
                      '"Press Start 2P", "Courier New", monospace',
                  }}
                >
                  {Math.round(goalPercentage)}%
                </span>

              </div>

            </div>
          )}

          {/* ==================================================
              SIMULACROS
          ================================================== */}

          {isSimulations && (
            <div>

              <div
                className="
                  h-[6px]
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >
                <div
                  className="
                    h-full
                    w-[24%]
                    rounded-full
                    bg-orange-400
                    shadow-[0_0_8px_rgba(251,146,60,0.25)]
                  "
                />
              </div>

              <div className="mt-2 flex items-center justify-between">

                <span
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.06em]
                    text-slate-500
                  "
                >
                  PEAKSCORE
                </span>

                <span
                  className="
                    text-[8px]
                    font-bold
                    text-yellow-300
                  "
                >
                  COMPLETADOS
                </span>

              </div>

            </div>
          )}

          {/* ==================================================
              RACHA
              
              IMPORTANTE:
              NO HAY L M X J V S D.
          ================================================== */}

          {isStreak && (
            <div>

              {/* BARRA DE RACHA */}

              <div
                className="
                  h-[6px]
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-red-400
                    shadow-[0_0_8px_rgba(248,113,113,0.30)]
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${streakPercentage}%`,
                  }}
                />
              </div>

              {/* TEXTO */}

              <div className="mt-2 flex items-center justify-between">

                <span
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.06em]
                    text-slate-500
                  "
                >
                  RACHA ACTUAL
                </span>

                <span
                  className="
                    text-[8px]
                    font-black
                    text-red-300
                  "
                >
                  {numericValue}{" "}
                  {numericValue === 1
                    ? "DÍA"
                    : "DÍAS"}
                </span>

              </div>

            </div>
          )}

        </div>

      </div>
    </article>
  );
}
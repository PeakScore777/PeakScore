"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface GoalCardProps {
  currentScore: number;
  targetScore: number;
  onTargetChange?: (target: number) => void;
}

/* ============================================================
   NUBE PIXELADA ROSA
============================================================ */

function PixelCloud({
  className = "",
  scale = 1,
}: {
  className?: string;
  scale?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        transform: `scale(${scale})`,
      }}
    >
      <div className="relative h-12 w-40">
        <span className="absolute bottom-0 left-2 h-5 w-28 rounded bg-pink-400/20 blur-[7px]" />
        <span className="absolute bottom-3 left-8 h-6 w-20 rounded bg-fuchsia-400/20 blur-[8px]" />
        <span className="absolute bottom-0 right-2 h-5 w-24 rounded bg-pink-300/20 blur-[7px]" />

        <span className="absolute bottom-1 left-3 h-3 w-14 bg-pink-300/20 blur-[2px]" />
        <span className="absolute bottom-4 left-10 h-4 w-11 bg-fuchsia-300/25 blur-[2px]" />
        <span className="absolute bottom-2 left-20 h-4 w-14 bg-pink-300/20 blur-[2px]" />
        <span className="absolute bottom-1 right-5 h-3 w-12 bg-fuchsia-300/20 blur-[2px]" />
      </div>
    </div>
  );
}

/* ============================================================
   ESTRELLA PIXEL
============================================================ */

function PixelStar({
  className = "",
  pink = false,
}: {
  className?: string;
  pink?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none
        absolute
        h-[4px]
        w-[4px]
        rotate-45
        ${
          pink
            ? "bg-fuchsia-300 shadow-[0_0_12px_rgba(244,114,182,0.9)]"
            : "bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
        }
        ${className}
      `}
    />
  );
}

/* ============================================================
   PARTÍCULA
============================================================ */

function PixelParticle({
  className = "",
  pink = false,
}: {
  className?: string;
  pink?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none
        absolute
        h-[3px]
        w-[3px]
        rounded-full
        ${
          pink
            ? "bg-pink-300 shadow-[0_0_9px_rgba(244,114,182,0.9)]"
            : "bg-cyan-300 shadow-[0_0_9px_rgba(34,211,238,0.9)]"
        }
        ${className}
      `}
    />
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function GoalCard({
  currentScore,
  targetScore,
  onTargetChange,
}: GoalCardProps) {
  /* ==========================================================
     PUNTAJE ACTUAL
  ========================================================== */

  const safeCurrentScore = Math.max(
    0,
    Math.min(
      500,
      Number.isFinite(currentScore)
        ? currentScore
        : 0
    )
  );

  /* ==========================================================
     META INICIAL
  ========================================================== */

  const initialTarget =
    Number.isFinite(targetScore) &&
    targetScore >= 100 &&
    targetScore <= 500
      ? Math.round(targetScore)
      : 500;

  /* ==========================================================
     ESTADO DE META

     STRING INTENCIONALMENTE.

     Así podemos tener:

     ""

     mientras el usuario borra el valor.
  ========================================================== */

  const [targetInput, setTargetInput] =
    useState<string>(
      String(initialTarget)
    );

  const [savedTarget, setSavedTarget] =
    useState<number>(
      initialTarget
    );

  const [editingTarget, setEditingTarget] =
    useState(false);

  /* ==========================================================
     SINCRONIZAR CON PROPS
  ========================================================== */

  useEffect(() => {
    const nextTarget =
      Number.isFinite(targetScore) &&
      targetScore >= 100 &&
      targetScore <= 500
        ? Math.round(targetScore)
        : 500;

    setSavedTarget(nextTarget);
    setTargetInput(String(nextTarget));
  }, [targetScore]);

  /* ==========================================================
     PROGRESO
  ========================================================== */

  const progress = useMemo(() => {
    if (savedTarget <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (safeCurrentScore /
          savedTarget) *
          100
      )
    );
  }, [
    safeCurrentScore,
    savedTarget,
  ]);

  /* ==========================================================
     DISTANCIA
  ========================================================== */

  const remainingPoints = Math.max(
    savedTarget -
      safeCurrentScore,
    0
  );

  const goalReached =
    safeCurrentScore >= savedTarget;

  /* ==========================================================
     INPUT META
  ========================================================== */

  const handleTargetChange = (
    value: string
  ) => {
    /*
     * IMPORTANTE:
     *
     * Si el usuario borra 500,
     * queda completamente vacío.
     */

    if (value === "") {
      setTargetInput("");
      return;
    }

    /*
     * Solo números.
     */

    if (!/^\d+$/.test(value)) {
      return;
    }

    const numericValue =
      Number(value);

    /*
     * Máximo permitido.
     */

    if (numericValue > 500) {
      setTargetInput("500");
      return;
    }

    setTargetInput(value);
  };

  /* ==========================================================
     GUARDAR META
  ========================================================== */

  const handleSaveTarget = () => {
    if (targetInput.trim() === "") {
      return;
    }

    const numericTarget = Number(targetInput);

    if (
      !Number.isFinite(numericTarget) ||
      numericTarget < 100 ||
      numericTarget > 500
    ) {
      return;
    }

    const normalizedTarget = Math.round(numericTarget);

    // Actualiza inmediatamente el GoalCard
    setSavedTarget(normalizedTarget);
    setTargetInput(String(normalizedTarget));

    // Le informa al componente padre si existe callback
    onTargetChange?.(normalizedTarget);

    // Cierra el modo edición
    setEditingTarget(false);
  };

  /* ==========================================================
     CANCELAR
  ========================================================== */

  const handleCancelTarget = () => {
    setTargetInput(
      String(savedTarget)
    );

    setEditingTarget(false);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        rounded-[28px]
        border
        border-cyan-400/25
        bg-[#020914]
        shadow-[0_25px_80px_rgba(0,8,25,0.35)]
      "
    >
      {/* ======================================================
          FONDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_50%_15%,rgba(0,195,255,0.12),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_90%_70%,rgba(37,99,235,0.10),transparent_30%)]
        "
      />

      {/* ======================================================
          GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.08]
          [background-image:linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)]
          [background-size:24px_24px]
        "
      />

      {/* ======================================================
          DECORACIÓN SUPERIOR
      ====================================================== */}

      <PixelStar
        className="left-[8%] top-[5%]"
      />

      <PixelStar
        className="left-[24%] top-[10%]"
        pink
      />

      <PixelStar
        className="left-[51%] top-[5%]"
      />

      <PixelStar
        className="right-[18%] top-[8%]"
        pink
      />

      <PixelParticle
        className="left-[35%] top-[8%]"
      />

      <PixelParticle
        className="right-[30%] top-[12%]"
        pink
      />

      {/* ======================================================
          IMAGEN PRINCIPAL GOALCARD

          La imagen debe ocupar inmediatamente el ancho
          disponible y conservar TODA su proporción.

          NO usar aspect-[2/3].
          NO usar object-contain dentro de una caja alta.

          Esto evita el espacio negro superior.
      ====================================================== */}

      <div
        className="
          relative
          z-10
          w-full
          overflow-hidden
          bg-[#020817]
        "
      >
        <Image
          src="/dashboard/goalcard.png"
          alt="Objetivo ICFES PeakScore"
          width={1024}
          height={1050}
          priority
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            700px
          "
          className="
            block
            h-auto
            w-full
            object-cover
            object-top
          "
        />
      </div>

      {/* ======================================================
          DECORACIÓN ENTRE IMAGEN Y DATOS
      ====================================================== */}

      <PixelCloud
        className="left-[-50px] top-[48%]"
        scale={0.65}
      />

      <PixelCloud
        className="right-[-55px] top-[53%]"
        scale={0.65}
      />

      {/* ======================================================
          DATOS

          AQUÍ YA NO HAY IMAGEN PARA
          "PUNTAJE ACTUAL".

          Lo dejamos limpio.
      ====================================================== */}

      <div
        className="
          relative
          z-30
          mx-5
          mt-4
          grid
          grid-cols-2
          gap-3
          sm:mx-7
          sm:gap-4
        "
      >
        {/* ==================================================
            PUNTAJE ACTUAL
        ================================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-cyan-400/25
            bg-[#041321]/95
            px-4
            py-4
            shadow-[0_15px_35px_rgba(0,0,0,0.30)]
          "
        >
          {/* pequeño detalle PeakScore */}

          <div
            aria-hidden="true"
            className="
              absolute
              right-3
              top-3
              h-1
              w-1
              bg-cyan-300
              shadow-[0_0_8px_rgba(34,211,238,0.9)]
            "
          />

          <p
            className="
              text-[8px]
              font-black
              uppercase
              tracking-[0.15em]
              text-cyan-300
            "
          >
            Puntaje actual
          </p>

          <div className="mt-2 flex items-end gap-1">
            <span
              className="
                text-[27px]
                font-black
                leading-none
                text-white
              "
            >
              {safeCurrentScore}
            </span>

          </div>

          <div
            className="
              mt-3
              h-[2px]
              w-10
              bg-cyan-400
              shadow-[0_0_8px_rgba(34,211,238,0.6)]
            "
          />
        </div>

        {/* ==================================================
            META
        ================================================== */}

        <div
          className="
            relative
            rounded-2xl
            border
            border-fuchsia-400/25
            bg-[#16091f]/95
            px-4
            py-4
            shadow-[0_15px_35px_rgba(217,70,239,0.10)]
          "
        >
          <div className="flex items-center justify-between">
            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.15em]
                text-fuchsia-300
              "
            >
              Meta
            </p>

            {!editingTarget && (
              <button
                type="button"
                onClick={() =>
                  setEditingTarget(true)
                }
                className="
                  text-[7px]
                  font-black
                  text-fuchsia-300/65
                  transition
                  hover:text-fuchsia-200
                "
              >
                CAMBIAR
              </button>
            )}
          </div>

          {!editingTarget ? (
            <div className="mt-2 flex items-end gap-1">
              <span
                className="
                  text-[27px]
                  font-black
                  leading-none
                  text-fuchsia-100
                "
              >
                {savedTarget}
              </span>

              <span
                className="
                  mb-0.5
                  text-[8px]
                  font-bold
                  text-fuchsia-300/50
                "
              >
                pts
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={500}
                step={1}
                value={targetInput}
                onChange={(event) =>
                  handleTargetChange(
                    event.target.value
                  )
                }
                placeholder="Meta"
                className="
                  h-9
                  w-full
                  rounded-lg
                  border
                  border-fuchsia-400/30
                  bg-black/30
                  px-2
                  text-[13px]
                  font-black
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-fuchsia-300
                "
              />

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={
                    targetInput.trim() === ""
                  }
                  onClick={
                    handleSaveTarget
                  }
                  className="
                    flex-1
                    rounded-lg
                    bg-fuchsia-500/20
                    py-1.5
                    text-[7px]
                    font-black
                    uppercase
                    text-fuchsia-200
                    transition
                    hover:bg-fuchsia-500/30
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                >
                  Guardar
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancelTarget
                  }
                  className="
                    rounded-lg
                    border
                    border-white/10
                    px-3
                    text-[8px]
                    font-bold
                    text-slate-400
                    transition
                    hover:text-white
                  "
                >
                  X
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          PROGRESO DE ASCENSO
      ====================================================== */}

      <div
        className="
          relative
          z-30
          mx-5
          mt-4
          rounded-2xl
          border
          border-cyan-400/20
          bg-[#061522]/95
          p-4
          shadow-[0_15px_35px_rgba(0,0,0,0.25)]
          sm:mx-7
        "
      >
        <div className="flex items-center justify-between">
          <span
            className="
              text-[8px]
              font-black
              uppercase
              tracking-[0.16em]
              text-cyan-200
            "
          >
            Progreso de ascenso
          </span>

          <span
            className="
              text-[11px]
              font-black
              text-cyan-300
            "
          >
            {progress}%
          </span>
        </div>

        <div
          className="
            mt-3
            h-3
            overflow-hidden
            rounded-full
            border
            border-cyan-400/15
            bg-[#020812]
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-cyan-400
              via-blue-400
              to-fuchsia-400
              shadow-[0_0_18px_rgba(34,211,238,0.65)]
              transition-all
              duration-700
            "
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between">
          <span
            className="
              text-[7px]
              font-bold
              text-slate-600
            "
          >
            0 pts
          </span>

          <span
            className="
              text-[7px]
              font-bold
              text-slate-600
            "
          >
            {savedTarget} pts
          </span>
        </div>
      </div>

      {/* ======================================================
          DISTANCIA RESTANTE
      ====================================================== */}

      <div
        className="
          relative
          z-30
          flex
          items-end
          justify-between
          gap-4
          px-6
          pb-7
          pt-5
          sm:px-7
        "
      >
        <div>
          <p
            className="
              text-[7px]
              font-black
              uppercase
              tracking-[0.18em]
              text-fuchsia-300/65
            "
          >
            Distancia restante
          </p>

          <p
            className="
              mt-1
              text-[10px]
              font-bold
              text-slate-400
            "
          >
            {goalReached
              ? "¡Has alcanzado tu Peak!"
              : `${remainingPoints} puntos para alcanzar tu meta`}
          </p>
        </div>

        <div
          className="
            text-right
            text-[7px]
            font-black
            uppercase
            tracking-[0.15em]
            text-cyan-300/70
          "
        >
          Cada ascenso
          <br />
          cuenta
        </div>
      </div>

      {/* ======================================================
          NUBES INFERIORES
      ====================================================== */}

      <PixelCloud
        className="bottom-[-10px] left-[-55px]"
        scale={0.7}
      />

      <PixelCloud
        className="bottom-[-10px] right-[-55px]"
        scale={0.7}
      />

      {/* ======================================================
          BORDE FINAL
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          z-50
          h-[2px]
          bg-gradient-to-r
          from-transparent
          via-cyan-400
          to-fuchsia-400
          opacity-80
        "
      />
    </section>
  );
}
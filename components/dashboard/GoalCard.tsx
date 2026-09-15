"use client";

interface GoalCardProps {
  currentScore?: number;
  targetScore?: number;
}

export default function GoalCard({
  currentScore = 378,
  targetScore = 500,
}: GoalCardProps) {
  const safeTarget = Math.max(targetScore, 1);

  const percentage = Math.min(
    (currentScore / safeTarget) * 100,
    100
  );

  const remaining = Math.max(
    safeTarget - currentScore,
    0
  );

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white
        p-7
        shadow-[0_4px_20px_rgba(15,23,42,0.045)]
        transition-all
        duration-300
        hover:border-slate-300
        hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]
      "
    >
      {/* DETALLE DECORATIVO */}

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-blue-500/[0.035]
          blur-2xl
        "
      />

      {/* CABECERA */}

      <div className="relative">

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-blue-600
          "
        >
          Objetivo
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">

          <div>
            <h2
              className="
                text-[21px]
                font-bold
                tracking-[-0.025em]
                text-slate-950
              "
            >
              Objetivo ICFES
            </h2>

            <p className="mt-1 text-[12px] font-medium text-slate-400">
              Tu progreso hacia el puntaje que quieres alcanzar.
            </p>
          </div>

        </div>
      </div>

      {/* MÉTRICAS */}

      <div className="relative mt-8">

        <div className="grid grid-cols-2 gap-5">

          {/* ACTUAL */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50/70
              px-5
              py-4
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Puntaje actual
            </p>

            <div className="mt-2 flex items-baseline gap-1.5">

              <span
                className="
                  text-[32px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                  text-slate-950
                "
              >
                {currentScore}
              </span>

              <span className="text-[11px] font-medium text-slate-400">
                pts
              </span>

            </div>
          </div>

          {/* META */}

          <div
            className="
              rounded-2xl
              border
              border-blue-100
              bg-blue-50/50
              px-5
              py-4
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-blue-500
              "
            >
              Meta
            </p>

            <div className="mt-2 flex items-baseline gap-1.5">

              <span
                className="
                  text-[32px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                  text-blue-600
                "
              >
                {targetScore}
              </span>

              <span className="text-[11px] font-medium text-blue-400">
                pts
              </span>

            </div>
          </div>

        </div>
      </div>

      {/* PROGRESO */}

      <div className="relative mt-7">

        <div className="mb-2.5 flex items-center justify-between">

          <span
            className="
              text-[11px]
              font-semibold
              text-slate-500
            "
          >
            Progreso
          </span>

          <span
            className="
              text-[11px]
              font-bold
              text-slate-700
            "
          >
            {Math.round(percentage)}%
          </span>

        </div>

        <div
          className="
            h-[7px]
            w-full
            overflow-hidden
            rounded-full
            bg-slate-100
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-blue-600
              transition-all
              duration-700
              ease-out
            "
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

      </div>

      {/* DISTANCIA A LA META */}

      <div
        className="
          relative
          mt-6
          flex
          items-center
          justify-between
          border-t
          border-slate-100
          pt-5
        "
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Distancia restante
          </p>

          <p className="mt-1 text-[13px] font-semibold text-slate-700">
            {remaining > 0
              ? `${remaining} puntos para alcanzar tu meta`
              : "Meta alcanzada"}
          </p>
        </div>

        <div
          className="
            text-right
            text-[11px]
            font-semibold
            text-slate-400
          "
        >
          {currentScore} / {targetScore}
        </div>
      </div>
    </section>
  );
}
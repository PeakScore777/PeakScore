import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon?: ReactNode;
  color: "blue" | "green" | "orange" | "red";
}

const themes = {
  blue: {
    accent: "bg-blue-600",
    soft: "bg-blue-50",
    line: "bg-blue-500",
    text: "text-blue-600",
  },

  green: {
    accent: "bg-emerald-500",
    soft: "bg-emerald-50",
    line: "bg-emerald-500",
    text: "text-emerald-600",
  },

  orange: {
    accent: "bg-orange-500",
    soft: "bg-orange-50",
    line: "bg-orange-500",
    text: "text-orange-600",
  },

  red: {
    accent: "bg-red-500",
    soft: "bg-red-50",
    line: "bg-red-500",
    text: "text-red-600",
  },
};

export default function StatCard({
  title,
  value,
  color,
}: StatCardProps) {
  const theme = themes[color];

  const numericValue =
    typeof value === "number" ? value : Number(value) || 0;

  return (
    <article
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200/80
        bg-white
        px-6
        py-6
        shadow-[0_2px_12px_rgba(15,23,42,0.035)]
        transition-all
        duration-300
        hover:-translate-y-[2px]
        hover:border-slate-300
        hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
      "
    >
      {/* =====================================================
          ACENTO
      ====================================================== */}

      <div
        className={`
          absolute
          left-0
          top-0
          h-[2px]
          w-10
          ${theme.accent}
          transition-all
          duration-300
          group-hover:w-20
        `}
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-[38px] font-bold leading-none tracking-[-0.045em] text-slate-950">
              {value ?? 0}
            </span>

            {title === "Puntaje promedio" && (
              <span className="text-[11px] font-semibold text-slate-400">
                pts
              </span>
            )}

            {title === "Meta" && (
              <span className="text-[11px] font-semibold text-slate-400">
                pts
              </span>
            )}

            {title === "Racha" && (
              <span className="text-[11px] font-semibold text-slate-400">
                días
              </span>
            )}

          </div>

        </div>

        {/* =================================================
            INDICADOR VISUAL PROPIO
            NO ICONOS / NO EMOJIS
        ================================================= */}

        <div
          className={`
            relative
            flex
            h-[48px]
            w-[48px]
            shrink-0
            items-center
            justify-center
            rounded-[15px]
            ${theme.soft}
          `}
        >

          {/* PUNTAJE */}

          {title === "Puntaje promedio" && (
            <div className="flex items-end gap-[3px]">

              <span
                className={`h-3 w-[4px] rounded-full ${theme.line} opacity-40`}
              />

              <span
                className={`h-5 w-[4px] rounded-full ${theme.line} opacity-60`}
              />

              <span
                className={`h-7 w-[4px] rounded-full ${theme.line}`}
              />

              <span
                className={`h-4 w-[4px] rounded-full ${theme.line} opacity-50`}
              />

            </div>
          )}

          {/* META */}

          {title === "Meta" && (
            <div
              className={`
                relative
                h-[27px]
                w-[27px]
                rounded-full
                border-[3px]
                border-emerald-200
              `}
            >
              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  h-[13px]
                  w-[13px]
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  border-[3px]
                  border-emerald-500
                "
              />

              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  h-[4px]
                  w-[4px]
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-emerald-500
                "
              />
            </div>
          )}

          {/* SIMULACROS */}

          {title === "Simulacros" && (
            <div className="relative h-[26px] w-[30px]">

              <span
                className="
                  absolute
                  left-0
                  top-2
                  h-[18px]
                  w-[22px]
                  rounded-[5px]
                  border-2
                  border-orange-300
                "
              />

              <span
                className="
                  absolute
                  left-[5px]
                  top-1
                  h-[18px]
                  w-[22px]
                  rounded-[5px]
                  border-2
                  border-orange-500
                  bg-orange-50
                "
              />

              <span
                className="
                  absolute
                  left-[9px]
                  top-[7px]
                  h-[2px]
                  w-[10px]
                  rounded-full
                  bg-orange-400
                "
              />

              <span
                className="
                  absolute
                  left-[9px]
                  top-[12px]
                  h-[2px]
                  w-[7px]
                  rounded-full
                  bg-orange-300
                "
              />

            </div>
          )}

          {/* RACHA */}

          {title === "Racha" && (
            <div className="relative flex h-[27px] w-[32px] items-end gap-[3px]">

              <span
                className={`h-[7px] w-[4px] rounded-full ${theme.line} opacity-30`}
              />

              <span
                className={`h-[12px] w-[4px] rounded-full ${theme.line} opacity-50`}
              />

              <span
                className={`h-[19px] w-[4px] rounded-full ${theme.line} opacity-70`}
              />

              <span
                className={`h-[25px] w-[4px] rounded-full ${theme.line}`}
              />

              <span
                className={`h-[15px] w-[4px] rounded-full ${theme.line} opacity-60`}
              />

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          DESCRIPCIÓN
      ====================================================== */}

      <p className="mt-3 text-[11px] font-medium text-slate-400">
        {title === "Puntaje promedio" &&
          "Tu rendimiento actual"}

        {title === "Meta" &&
          "Objetivo de preparación"}

        {title === "Simulacros" &&
          "Completados"}

        {title === "Racha" &&
          "Mantén el ritmo"}
      </p>

      {/* =====================================================
          INDICADOR INFERIOR
      ====================================================== */}

      <div className="mt-6 flex items-center gap-3">

        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-slate-100">

          <div
            className={`
              h-full
              rounded-full
              ${theme.accent}
              opacity-70
              transition-all
              duration-500
              group-hover:w-[36%]
            `}
            style={{
              width:
                title === "Meta"
                  ? `${Math.min(
                      (numericValue / 500) * 100,
                      100
                    )}%`
                  : "24%",
            }}
          />

        </div>

        <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
          PeakScore
        </span>

      </div>

    </article>
  );
}
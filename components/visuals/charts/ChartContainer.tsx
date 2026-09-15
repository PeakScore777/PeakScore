"use client";

import type { ReactNode } from "react";

/* =========================================================
   PEAKSCORE — CHART CONTAINER

   Contenedor visual estándar para gráficos académicos.

   Objetivo:
   - Mantener consistencia visual.
   - Separar presentación de lógica.
   - Crear una experiencia profesional tipo
     plataforma educativa / evaluación estandarizada.
========================================================= */

interface ChartContainerProps {
  title?: string | null;

  xLabel?: string | null;

  yLabel?: string | null;

  children: ReactNode;
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function ChartContainer({
  title,
  xLabel,
  yLabel,
  children,
}: ChartContainerProps) {
  return (
    <section
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
      "
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      {title && (
        <header
          className="
            border-b
            border-slate-200
            bg-slate-50/70
            px-5
            py-3
          "
        >
          <h3
            className="
              text-center
              text-sm
              font-semibold
              tracking-tight
              text-slate-800
            "
          >
            {title}
          </h3>
        </header>
      )}

      {/* =====================================================
          ÁREA DEL GRÁFICO
      ===================================================== */}

      <div
        className="
          relative
          min-h-[320px]
          w-full
          bg-white
          p-4
          sm:p-6
        "
      >
        {children}
      </div>

      {/* =====================================================
          LABELS DE EJES
      ===================================================== */}

      {(xLabel || yLabel) && (
        <footer
          className="
            flex
            items-center
            justify-between
            gap-4
            border-t
            border-slate-100
            px-5
            py-3
          "
        >
          <span
            className="
              text-[11px]
              font-medium
              text-slate-500
            "
          >
            {xLabel ?? ""}
          </span>

          <span
            className="
              text-[11px]
              font-medium
              text-slate-500
            "
          >
            {yLabel ?? ""}
          </span>
        </footer>
      )}
    </section>
  );
}
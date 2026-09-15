"use client";

import {
  Play,
  BarChart3,
  Target,
  ArrowUpRight,
} from "lucide-react";

export default function QuickActions() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200/80
        bg-white
        p-6
        shadow-[0_2px_12px_rgba(15,23,42,0.04)]
      "
    >
      {/* DECORACIÓN */}

      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-50/70 blur-2xl" />

      {/* HEADER */}

      <div className="relative mb-6">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ArrowUpRight
              size={18}
              strokeWidth={2}
            />
          </div>

          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
              Acciones rápidas
            </h2>

            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Continúa con tu preparación
            </p>
          </div>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="relative space-y-3">

        {/* SIMULACRO */}

        <button
          type="button"
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-[15px]
            bg-blue-600
            px-4
            py-3.5
            text-left
            text-white
            shadow-[0_8px_20px_rgba(37,99,235,0.18)]
            transition-all
            duration-200
            hover:bg-blue-700
            hover:shadow-[0_10px_25px_rgba(37,99,235,0.25)]
            active:scale-[0.99]
          "
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Play
              size={17}
              strokeWidth={2}
              fill="currentColor"
            />
          </span>

          <span className="flex-1">

            <span className="block text-[13px] font-semibold">
              Iniciar simulacro
            </span>

            <span className="mt-0.5 block text-[10px] font-medium text-blue-100">
              Pon a prueba tu nivel
            </span>

          </span>

          <ArrowUpRight
            size={16}
            strokeWidth={1.8}
            className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </button>

        {/* ESTADÍSTICAS */}

        <button
          type="button"
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-[15px]
            border
            border-slate-200
            bg-white
            px-4
            py-3.5
            text-left
            text-slate-700
            transition-all
            duration-200
            hover:border-blue-200
            hover:bg-blue-50/40
            hover:text-slate-900
            active:scale-[0.99]
          "
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <BarChart3
              size={17}
              strokeWidth={1.8}
            />
          </span>

          <span className="flex-1">

            <span className="block text-[13px] font-semibold">
              Ver estadísticas
            </span>

            <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
              Analiza tu rendimiento
            </span>

          </span>

          <ArrowUpRight
            size={16}
            strokeWidth={1.8}
            className="text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
          />
        </button>

        {/* META */}

        <button
          type="button"
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-[15px]
            border
            border-slate-200
            bg-white
            px-4
            py-3.5
            text-left
            text-slate-700
            transition-all
            duration-200
            hover:border-blue-200
            hover:bg-blue-50/40
            hover:text-slate-900
            active:scale-[0.99]
          "
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <Target
              size={17}
              strokeWidth={1.8}
            />
          </span>

          <span className="flex-1">

            <span className="block text-[13px] font-semibold">
              Configurar meta
            </span>

            <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
              Define tu objetivo ICFES
            </span>

          </span>

          <ArrowUpRight
            size={16}
            strokeWidth={1.8}
            className="text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
          />
        </button>

      </div>
    </section>
  );
}
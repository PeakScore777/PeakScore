import { Play, BarChart3, Target } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow">

      <h2 className="mb-6 text-2xl font-bold text-slate-800">
        ⚡ Acciones rápidas
      </h2>

      <div className="space-y-4">

        <button className="flex w-full items-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700">
          <Play size={22} />
          Iniciar simulacro
        </button>

        <button className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-100">
          <BarChart3 size={22} />
          Ver estadísticas
        </button>

        <button className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-100">
          <Target size={22} />
          Configurar meta
        </button>

      </div>

    </div>
  );
}
"use client";

import {
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export default function StatisticsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Estadísticas
          </h1>

          <p className="mt-2 text-slate-600">
            Analiza tu progreso y rendimiento.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow">
            <Trophy className="mb-4 text-yellow-500" size={35} />
            <h2 className="text-slate-500">Mejor puntaje</h2>
            <p className="mt-2 text-4xl font-bold">412</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <Target className="mb-4 text-blue-600" size={35} />
            <h2 className="text-slate-500">Meta</h2>
            <p className="mt-2 text-4xl font-bold">450</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <TrendingUp className="mb-4 text-green-600" size={35} />
            <h2 className="text-slate-500">Promedio</h2>
            <p className="mt-2 text-4xl font-bold">389</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <BookOpen className="mb-4 text-purple-600" size={35} />
            <h2 className="text-slate-500">Simulacros</h2>
            <p className="mt-2 text-4xl font-bold">18</p>
          </div>

        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold">
            Evolución del puntaje
          </h2>

          <div className="flex h-80 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300">

            <p className="text-slate-400">
              📈 Aquí irá la gráfica del progreso.
            </p>

          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl bg-white p-8 shadow">
            <h2 className="mb-5 text-2xl font-bold">
              Rendimiento por materia
            </h2>

            <div className="space-y-4">

              <p>📘 Matemáticas — 84%</p>

              <p>📖 Lectura Crítica — 77%</p>

              <p>🧪 Ciencias — 81%</p>

              <p>🌎 Sociales — 74%</p>

              <p>🇬🇧 Inglés — 92%</p>

            </div>

          </div>

          <div className="rounded-3xl bg-white p-8 shadow">

            <h2 className="mb-5 text-2xl font-bold">
              Resumen
            </h2>

            <ul className="space-y-3 text-slate-600">

              <li>✅ Mejor materia: Inglés</li>

              <li>⚠️ Materia por mejorar: Sociales</li>

              <li>🔥 Racha actual: 6 días</li>

              <li>🎯 Objetivo: alcanzar 450 puntos.</li>

            </ul>

          </div>

        </div>

      </div>
    </main>
  );
}
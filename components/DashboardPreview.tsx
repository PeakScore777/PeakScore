import {
  TrendingUp,
  Target,
  BookOpen,
  BarChart3,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Visualiza tu progreso
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            PeakScore analiza tu rendimiento y te muestra exactamente en qué debes mejorar.
          </p>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">

          {/* Barra superior */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">

            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Dashboard
              </h3>

              <p className="text-slate-500">
                Resumen de rendimiento
              </p>
            </div>

            <div className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg">
              Puntaje 468
            </div>

          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-2">

            {/* Columna izquierda */}
            <div>

              <div className="rounded-2xl bg-slate-50 p-6">

                <div className="flex items-center gap-3">
                  <TrendingUp className="text-blue-600" />
                  <h4 className="font-bold">
                    Progreso general
                  </h4>
                </div>

                <div className="mt-6 h-4 rounded-full bg-slate-200">
                  <div className="h-4 w-[82%] rounded-full bg-blue-600"></div>
                </div>

                <p className="mt-3 font-semibold text-blue-600">
                  82% completado
                </p>

              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-6">

                <h4 className="mb-6 font-bold">
                  Rendimiento por materia
                </h4>

                {[
                  ["Matemáticas", "91%"],
                  ["Lectura Crítica", "84%"],
                  ["Ciencias", "79%"],
                  ["Sociales", "74%"],
                  ["Inglés", "96%"],
                ].map(([materia, valor]) => (

                  <div
                    key={materia}
                    className="mb-5"
                  >

                    <div className="mb-2 flex justify-between text-sm">
                      <span>{materia}</span>
                      <span>{valor}</span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-200">

                      <div
                        className="h-3 rounded-full bg-blue-600"
                        style={{ width: valor }}
                      ></div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

            {/* Columna derecha */}
            <div className="space-y-6">

              <div className="rounded-2xl bg-slate-50 p-6">

                <div className="flex items-center gap-3">
                  <Target className="text-green-600" />

                  <h4 className="font-bold">
                    Meta
                  </h4>

                </div>

                <h2 className="mt-5 text-6xl font-bold text-blue-600">
                  500
                </h2>

                <p className="text-slate-500">
                  Puntaje objetivo
                </p>

              </div>

              <div className="grid gap-6 md:grid-cols-2">

                <div className="rounded-2xl bg-slate-50 p-6">

                  <BookOpen className="mb-4 text-orange-500" />

                  <h2 className="text-4xl font-bold">
                    23
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Simulacros realizados
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-6">

                  <BarChart3 className="mb-4 text-purple-600" />

                  <h2 className="text-4xl font-bold">
                    468
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Promedio actual
                  </p>

                </div>

              </div>

              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">

                <h3 className="text-xl font-bold">
                  🔥 Racha de estudio
                </h3>

                <p className="mt-4 text-5xl font-extrabold">
                  120 días
                </p>

                <p className="mt-2 text-blue-100">
                  Continúa así y alcanzarás tu meta.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
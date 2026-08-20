"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getSimulations,
  type Simulation,
} from "@/lib/services/simulation.service";

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimulations() {
      const data = await getSimulations();

      setSimulations(data);
      setLoading(false);
    }

    loadSimulations();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-slate-900">
            Simulacros
          </h1>

          <p className="mt-4 text-slate-600">
            Cargando simulacros...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* ================================
            ENCABEZADO
        ================================= */}

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Simulacros
          </h1>

          <p className="mt-2 text-slate-600">
            Elige un simulacro y comienza a practicar.
          </p>
        </div>

        {/* ================================
            SIN SIMULACROS
        ================================= */}

        {simulations.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-bold text-slate-900">
              No hay simulacros disponibles
            </h2>

            <p className="mt-2 text-slate-600">
              Todavía no hay simulacros registrados en la plataforma.
            </p>
          </div>
        ) : (

          /* ================================
             LISTA DE SIMULACROS
          ================================= */

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {simulations.map((simulation) => {
              const color =
                simulation.color ?? "bg-blue-600";

              const description =
                simulation.description ??
                "Practica con preguntas tipo ICFES y evalúa tu desempeño.";

              const subject =
                simulation.subject ??
                simulation.type;

              const duration =
                simulation.duration ?? 90;

              const difficulty =
                simulation.difficulty ?? "Media";

              return (
                <div
                  key={simulation.id}
                  className="rounded-3xl bg-white p-7 shadow transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* COLOR SUPERIOR */}

                  <div
                    className={`mb-5 h-3 w-20 rounded-full ${color}`}
                  />

                  {/* TITULO */}

                  <h2 className="text-2xl font-bold text-slate-900">
                    {simulation.title}
                  </h2>

                  {/* DESCRIPCION */}

                  <p className="mt-3 text-slate-600">
                    {description}
                  </p>

                  {/* INFORMACION */}

                  <div className="mt-6 space-y-2 text-sm text-slate-500">

                    <p>
                      📚 Materia:{" "}
                      <strong>{subject}</strong>
                    </p>

                    <p>
                      ❓ Preguntas:{" "}
                      <strong>
                        {simulation.total_questions}
                      </strong>
                    </p>

                    <p>
                      ⏱ Duración:{" "}
                      <strong>
                        {duration} min
                      </strong>
                    </p>

                    <p>
                      🎯 Dificultad:{" "}
                      <strong>
                        {difficulty}
                      </strong>
                    </p>

                  </div>

                  {/* BOTON */}

                  <Link
                    href={`/simulacros/${simulation.id}`}
                    className="mt-8 inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Comenzar simulacro
                  </Link>

                </div>
              );
            })}

          </div>
        )}
      </div>
    </main>
  );
}
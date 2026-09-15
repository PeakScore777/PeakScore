"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Sparkles,
} from "lucide-react";

const SUBJECTS = [
  {
    name: "Matemáticas",
    description:
      "Resuelve problemas y fortalece tu razonamiento matemático.",
  },
  {
    name: "Lectura Crítica",
    description:
      "Analiza textos, argumentos e interpreta información.",
  },
  {
    name: "Sociales y Ciudadanas",
    description:
      "Analiza fenómenos sociales, históricos y ciudadanos.",
  },
  {
    name: "Ciencias Naturales",
    description:
      "Pon a prueba tus conocimientos científicos y capacidad de análisis.",
  },
  {
    name: "Inglés",
    description:
      "Practica comprensión de lectura y uso del idioma.",
  },
];

const QUESTION_AMOUNTS = [5, 10, 25, 50];

const DIFFICULTIES = [
  {
    value: "Mixta",
    label: "Mixta",
    description: "Una combinación equilibrada de niveles.",
  },
  {
    value: "Fácil",
    label: "Fácil",
    description: "Ideal para reforzar fundamentos.",
  },
  {
    value: "Media",
    label: "Media",
    description: "Un nivel de entrenamiento estándar.",
  },
  {
    value: "Difícil",
    label: "Difícil",
    description: "Un reto para llevar tu nivel más lejos.",
  },
];

function calculateDuration(amount: number) {
  return Math.max(10, Math.ceil(amount * 1.5));
}

export default function NewSimulationPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("Matemáticas");
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState("Mixta");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubject = useMemo(
    () => SUBJECTS.find((item) => item.name === subject),
    [subject]
  );

  const duration = calculateDuration(amount);

  async function handleGenerate() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "normal",
          subject,
          amount,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No fue posible generar el simulacro."
        );
      }

      if (!result.simulation?.id) {
        throw new Error(
          "El simulacro fue creado, pero no se recibió su identificador."
        );
      }

      router.push(`/simulacros/${result.simulation.id}`);
    } catch (err) {
      console.error("Error generando simulacro:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error generando el simulacro."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() => router.push("/dashboard/simulacros")}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Volver a simulacros
        </button>

        {/* HEADER */}

        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            <Sparkles size={15} />
            Entrenamiento personalizado
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Genera tu simulacro
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Elige una materia, define cuántas preguntas quieres resolver
            y deja que PeakScore prepare tu entrenamiento.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* CONFIGURACIÓN */}

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

            {/* MATERIA */}

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  1. Elige una materia
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Cada simulacro personalizado trabaja una sola materia.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SUBJECTS.map((item) => {
                  const selected = subject === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSubject(item.name)}
                      className={`group rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <h3
                            className={`font-semibold ${
                              selected
                                ? "text-blue-700"
                                : "text-slate-900"
                            }`}
                          >
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        {selected && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check size={14} />
                          </div>
                        )}

                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CANTIDAD */}

            <div className="mt-9">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  2. ¿Cuántas preguntas?
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Elige el tamaño de tu entrenamiento.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUESTION_AMOUNTS.map((value) => {
                  const selected = amount === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(value)}
                      className={`rounded-2xl border px-3 py-4 text-center transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-xl font-bold">
                        {value}
                      </span>

                      <span
                        className={`text-xs ${
                          selected
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        preguntas
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIFICULTAD */}

            <div className="mt-9">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  3. Elige la dificultad
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Selecciona el nivel de desafío.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {DIFFICULTIES.map((item) => {
                  const selected = difficulty === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setDifficulty(item.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            selected
                              ? "text-blue-700"
                              : "text-slate-900"
                          }`}
                        >
                          {item.label}
                        </span>

                        {selected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check size={14} />
                          </div>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* BOTÓN */}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Generando simulacro..."
              ) : (
                <>
                  <Sparkles size={18} />
                  Generar simulacro
                </>
              )}
            </button>

          </section>

          {/* RESUMEN */}

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <BookOpen size={23} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Tu entrenamiento
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              PeakScore preparará una prueba enfocada únicamente
              en el área que seleccionaste.
            </p>

            <div className="mt-6 space-y-3">

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Materia
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedSubject?.name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Preguntas
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {amount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Dificultad
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {difficulty}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock3 size={17} />

                  <p className="text-xs font-semibold">
                    Tiempo estimado
                  </p>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {duration} min
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
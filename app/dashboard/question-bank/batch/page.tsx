"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS_BY_SESSION: Record<string, string[]> = {
  "1": [
    "Matemáticas",
    "Lectura Crítica",
    "Sociales y Ciudadanas",
    "Ciencias Naturales",
  ],
  "2": [
    "Matemáticas",
    "Sociales y Ciudadanas",
    "Ciencias Naturales",
    "Inglés",
  ],
};

const AMOUNTS = [10, 20, 50, 100, 250, 500];

const DIFFICULTIES = [
  "Mixta",
  "Fácil",
  "Media",
  "Difícil",
] as const;

export default function BatchQuestionsPage() {
  const router = useRouter();

  const [session, setSession] = useState("1");
  const [subject, setSubject] = useState("Matemáticas");
  const [amount, setAmount] = useState("10");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("Mixta");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const availableSubjects =
    SUBJECTS_BY_SESSION[session] ?? [];

  function handleSessionChange(
    newSession: string
  ) {
    setSession(newSession);
    setError("");
    setResult("");

    const subjects =
      SUBJECTS_BY_SESSION[newSession] ?? [];

    if (!subjects.includes(subject)) {
      setSubject(subjects[0] ?? "");
    }
  }

  async function handleGenerate() {
    setError("");
    setResult("");

    if (!subject) {
      setError("Selecciona una materia.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/generate-question-batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            session: Number(session),
            amount: Number(amount),
            difficulty,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "No se pudieron generar las preguntas."
        );
      }

      setResult(
        `🔥 Se generaron y guardaron ${data.data.saved} preguntas correctamente.`
      );
    } catch (err) {
      console.error(
        "Error generando lote:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error generando las preguntas."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/question-bank"
            )
          }
          className="mb-5 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          ← Volver al banco
        </button>

        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            HERRAMIENTA DE ADMINISTRACIÓN
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900">
            Generación masiva
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Genera grandes cantidades de preguntas
            originales con IA para construir el banco
            de preguntas de PeakScore.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-8 shadow-sm">

          <div className="grid gap-6 md:grid-cols-2">

            {/* SESIÓN */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Sesión
              </label>

              <select
                value={session}
                onChange={(e) =>
                  handleSessionChange(
                    e.target.value
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="1">
                  Sesión 1
                </option>

                <option value="2">
                  Sesión 2
                </option>
              </select>
            </div>

            {/* MATERIA */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Materia
              </label>

              <select
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {availableSubjects.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CANTIDAD */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Cantidad
              </label>

              <select
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {AMOUNTS.map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value} preguntas
                  </option>
                ))}
              </select>
            </div>

            {/* DIFICULTAD */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Dificultad
              </label>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as (typeof DIFFICULTIES)[number]
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {DIFFICULTIES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Configuración
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {amount} preguntas de{" "}
              {subject} · Sesión {session}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              La IA procesará las preguntas en
              bloques pequeños para mayor estabilidad.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
              {result}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Generando preguntas..."
              : "✨ Generar lote de preguntas"}
          </button>

        </section>
      </div>
    </main>
  );
}
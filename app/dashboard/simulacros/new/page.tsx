"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Calculator,
  BookOpen,
  Globe,
  Microscope,
  Languages,
  Sparkles,
} from "lucide-react";

const subjects = [
  {
    id: "Matemáticas",
    name: "Matemáticas",
    icon: Calculator,
  },
  {
    id: "Lectura Crítica",
    name: "Lectura Crítica",
    icon: BookOpen,
  },
  {
    id: "Sociales y Ciudadanas",
    name: "Sociales y Ciudadanas",
    icon: Globe,
  },
  {
    id: "Ciencias Naturales",
    name: "Ciencias Naturales",
    icon: Microscope,
  },
  {
    id: "Inglés",
    name: "Inglés",
    icon: Languages,
  },
];

export default function NewSimulationPage() {
  const [name, setName] = useState("");
  const [session, setSession] = useState("1");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState(5);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject]
    );
  };

  const totalQuestions =
    selectedSubjects.length * questionsPerSubject;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">

          <Link
            href="/dashboard/simulacros"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a simulacros
          </Link>

          <h1 className="text-4xl font-bold text-slate-900">
            Crear simulacro
          </h1>

          <p className="mt-2 text-slate-600">
            Configura tu simulacro antes de generarlo.
          </p>

        </div>

        {/* FORMULARIO */}
        <section className="rounded-3xl bg-white p-8 shadow-sm">

          {/* INFORMACIÓN GENERAL */}
          <div className="mb-10">

            <h2 className="text-2xl font-bold text-slate-900">
              Información general
            </h2>

            <p className="mt-2 text-slate-500">
              Define las características principales del simulacro.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              {/* NOMBRE */}
              <div className="md:col-span-2">

                <label className="mb-2 block font-semibold text-slate-700">
                  Nombre del simulacro
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Simulacro ICFES - Sesión 1"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* SESIÓN */}
              <div>

                <label className="mb-2 block font-semibold text-slate-700">
                  Sesión
                </label>

                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="1">Sesión 1</option>
                  <option value="2">Sesión 2</option>
                </select>

              </div>

              {/* PREGUNTAS */}
              <div>

                <label className="mb-2 block font-semibold text-slate-700">
                  Preguntas por materia
                </label>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={questionsPerSubject}
                  onChange={(e) =>
                    setQuestionsPerSubject(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

          </div>

          {/* MATERIAS */}
          <div className="border-t border-slate-200 pt-10">

            <h2 className="text-2xl font-bold text-slate-900">
              Materias
            </h2>

            <p className="mt-2 text-slate-500">
              Selecciona las materias que quieres incluir.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {subjects.map((subject) => {
                const Icon = subject.icon;

                const selected = selectedSubjects.includes(
                  subject.id
                );

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() =>
                      toggleSubject(subject.id)
                    }
                    className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >

                    <div
                      className={`rounded-xl p-3 ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={24} />
                    </div>

                    <div className="flex-1">

                      <p className="font-bold text-slate-800">
                        {subject.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {questionsPerSubject} preguntas
                      </p>

                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <span className="text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                    </div>

                  </button>
                );
              })}

            </div>

          </div>

          {/* RESUMEN */}
          <div className="mt-10 rounded-2xl bg-slate-50 p-6">

            <h3 className="font-bold text-slate-900">
              Resumen
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <div>
                <p className="text-sm text-slate-500">
                  Sesión
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  Sesión {session}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Materias seleccionadas
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {selectedSubjects.length}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total de preguntas
                </p>

                <p className="mt-1 text-2xl font-extrabold text-blue-600">
                  {totalQuestions}
                </p>
              </div>

            </div>

          </div>

          {/* BOTÓN */}
          <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">

            <button
              type="button"
              disabled={
                !name.trim() ||
                selectedSubjects.length === 0
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={20} />
              Generar simulacro
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}
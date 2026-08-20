"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { useParams } from "next/navigation";

import {
  getQuestions,
  type Question,
} from "@/lib/services/question.service";

export default function SubjectQuestionsPage() {
  const params = useParams();

  const subject = decodeURIComponent(
    params.subject as string
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);

        const data = await getQuestions();

        const filteredQuestions = data.filter(
          (question) => question.subject === subject
        );

        setQuestions(filteredQuestions);
      } catch (error) {
        console.error(
          "Error cargando preguntas:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (subject) {
      loadQuestions();
    }
  }, [subject]);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href="/dashboard/question-bank"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Volver al banco
            </Link>

            <Link
              href="/dashboard/question-bank/new"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={18} />
              Nueva pregunta
            </Link>

          </div>

          <div className="mt-8">

            <h1 className="text-4xl font-bold text-slate-900">
              {subject}
            </h1>

            <p className="mt-2 text-slate-600">
              Preguntas registradas en esta materia.
            </p>

          </div>

        </div>

        {/* =========================
            CONTADOR
        ========================= */}

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">

          {loading ? (
            <div className="flex items-center gap-3 text-slate-500">

              <Loader2
                size={22}
                className="animate-spin"
              />

              Cargando preguntas...

            </div>
          ) : (
            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Preguntas registradas
                </p>

                <p className="mt-1 text-4xl font-extrabold text-slate-900">
                  {questions.length}
                </p>

              </div>

            </div>
          )}

        </div>

        {/* =========================
            CARGANDO
        ========================= */}

        {loading && (
          <div className="flex items-center justify-center rounded-3xl bg-white p-16 shadow-sm">

            <div className="flex flex-col items-center gap-4 text-slate-500">

              <Loader2
                size={32}
                className="animate-spin"
              />

              <p>
                Cargando preguntas...
              </p>

            </div>

          </div>
        )}

        {/* =========================
            SIN PREGUNTAS
        ========================= */}

        {!loading && questions.length === 0 && (
          <div className="rounded-3xl bg-white p-16 text-center shadow-sm">

            <h2 className="text-2xl font-bold text-slate-800">
              No hay preguntas
            </h2>

            <p className="mx-auto mt-3 max-w-md text-slate-500">
              Todavía no hay preguntas registradas para{" "}
              <strong>{subject}</strong>.
            </p>

            <Link
              href="/dashboard/question-bank/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Crear pregunta
            </Link>

          </div>
        )}

        {/* =========================
            LISTA DE PREGUNTAS
        ========================= */}

        {!loading && questions.length > 0 && (
          <div className="space-y-5">

            {questions.map((question, index) => (

              <div
                key={question.id}
                className="rounded-3xl bg-white p-7 shadow-sm transition hover:shadow-md"
              >

                {/* =====================
                    ENCABEZADO
                ===================== */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div className="flex-1">

                    <div className="mb-4 flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        Pregunta {index + 1}
                      </span>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                        Sesión {question.session}
                      </span>

                      {question.difficulty && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                          {question.difficulty}
                        </span>
                      )}

                      {question.year && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                          {question.year}
                        </span>
                      )}

                    </div>

                    <h2 className="text-lg font-semibold leading-7 text-slate-900">
                      {question.question}
                    </h2>

                  </div>

                  {/* EDITAR */}

                  <Link
                    href={`/dashboard/question-bank/edit/${question.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Pencil size={18} />
                    Editar
                  </Link>

                </div>

                {/* =====================
                    INFORMACIÓN
                ===================== */}

                {(question.component ||
                  question.competence) && (
                  <div className="mt-5 flex flex-wrap gap-2">

                    {question.component && (
                      <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <strong>Componente:</strong>{" "}
                        {question.component}
                      </span>
                    )}

                    {question.competence && (
                      <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <strong>Competencia:</strong>{" "}
                        {question.competence}
                      </span>
                    )}

                  </div>
                )}

                {/* =====================
                    OPCIONES
                ===================== */}

                <div className="mt-6 grid gap-3 md:grid-cols-2">

                  <div className="rounded-xl border border-slate-200 p-4 text-slate-700">
                    <span className="font-bold">A.</span>{" "}
                    {question.option_a}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-slate-700">
                    <span className="font-bold">B.</span>{" "}
                    {question.option_b}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-slate-700">
                    <span className="font-bold">C.</span>{" "}
                    {question.option_c}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-slate-700">
                    <span className="font-bold">D.</span>{" "}
                    {question.option_d}
                  </div>

                </div>

                {/* =====================
                    RESPUESTA CORRECTA
                ===================== */}

                <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">

                  Respuesta correcta:{" "}
                  <strong>
                    {question.correct_answer}
                  </strong>

                </div>

                {/* =====================
                    EXPLICACIÓN
                ===================== */}

                {question.explanation && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">

                    <strong>
                      Explicación:
                    </strong>{" "}

                    {question.explanation}

                  </div>
                )}

                {/* =====================
                    FUENTE
                ===================== */}

                {question.source && (
                  <div className="mt-3 text-sm text-slate-400">
                    Fuente: {question.source}
                  </div>
                )}

              </div>

            ))}

          </div>
        )}

      </div>
    </main>
  );
}
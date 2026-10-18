"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
  getQuestions,
  type Question,
} from "@/lib/services/question.service";

export default function SubjectQuestionsPage() {
  const params = useParams();
  const router = useRouter();

  const subject = decodeURIComponent(
    params.subject as string
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  const isSociales = subject === "Sociales y Ciudadanas";
  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const pageQuestions = questions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  useEffect(() => {
    if (subject === "Inglés") {
      router.replace("/dashboard/question-bank/english");
      return;
    }
    const loadQuestions = async () => {
      try {
        setLoading(true);

        const data = await getQuestions();

        const filteredQuestions = data.filter(
          (question) => question.subject === subject
        );

        setQuestions(filteredQuestions);
        setCurrentPage(1);
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
  }, [subject, router]);

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
            CUADERNILLO DE SOCIALES
        ========================= */}

        {!loading && isSociales && questions.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Vista tipo cuadernillo</p>
                <p className="mt-1 text-sm text-slate-600">
                  Página {currentPage} de {totalPages} · Preguntas {(currentPage - 1) * questionsPerPage + 1}–{Math.min(currentPage * questionsPerPage, questions.length)} de {questions.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <article className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white shadow-md print:max-w-none print:border-0 print:shadow-none">
              <header className="border-b-4 border-slate-800 px-6 py-5 sm:px-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">PeakScore · Ciencias Sociales</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">Sociales y Ciudadanas</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Lee cuidadosamente los contextos y responde cada pregunta seleccionando una sola opción.</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">PÁG. {currentPage}</span>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-x-8 px-6 py-6 sm:px-9 md:grid-cols-2">
                {pageQuestions.map((question, index) => {
                  const questionNumber = question.question_number ?? ((currentPage - 1) * questionsPerPage + index + 1);
                  const previous = pageQuestions[index - 1];
                  const showContext = Boolean(question.context_text?.trim()) &&
                    (!previous || previous.context_text?.trim() !== question.context_text?.trim());
                  return (
                    <section key={question.id} className="mb-7 min-w-0 break-inside-avoid border-b border-slate-300 pb-5 last:border-0">
                      {showContext && (
                        <div className="mb-4 rounded-sm bg-slate-50 px-3 py-3 text-[13px] leading-6 text-slate-800">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Contexto</p>
                          <p className="whitespace-pre-wrap">{question.context_text}</p>
                        </div>
                      )}
                      {question.image_url && (
                        <div className="mb-4 flex justify-center">
                          <img src={question.image_url} alt={`Material visual de la pregunta ${questionNumber}`} loading="lazy" className="h-auto max-h-64 max-w-full object-contain" />
                        </div>
                      )}
                      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
                        <strong className="pt-0.5 text-sm text-slate-900">{questionNumber}.</strong>
                        <div className="min-w-0">
                          <p className="whitespace-pre-wrap font-serif text-[14px] leading-6 text-slate-900">{question.question}</p>
                          <div className="mt-4 space-y-2">
                            {([
                              ["A", question.option_a],
                              ["B", question.option_b],
                              ["C", question.option_c],
                              ["D", question.option_d],
                            ] as const).map(([letter, option]) => (
                              <div key={letter} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 text-[13px] leading-5 text-slate-800">
                                <strong>{letter}.</strong>
                                <span className="whitespace-pre-wrap">{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span className="rounded border border-slate-200 px-2 py-1">Sesión {question.session}</span>
                        {question.component && <span className="rounded border border-slate-200 px-2 py-1">{question.component}</span>}
                        <Link href={`/dashboard/question-bank/edit/${question.id}`} className="ml-auto inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100">
                          <Pencil size={12} /> Editar
                        </Link>
                      </div>
                      {question.explanation && (
                        <details className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <summary className="cursor-pointer font-semibold">Ver respuesta y explicación (admin)</summary>
                          <p className="mt-2"><strong>Respuesta:</strong> {question.correct_answer}</p>
                          <p className="mt-1 whitespace-pre-wrap"><strong>Explicación:</strong> {question.explanation}</p>
                        </details>
                      )}
                    </section>
                  );
                })}
              </div>
              <footer className="flex items-center justify-between border-t border-slate-300 px-6 py-4 text-[10px] text-slate-500 sm:px-9">
                <span>PeakScore · Banco de preguntas · Uso administrativo</span>
                <span>{pageQuestions.length} preguntas en esta página</span>
              </footer>
            </article>

            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">Anterior</button>
              <span className="px-3 text-sm font-semibold text-slate-600">{currentPage} / {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">Siguiente</button>
            </div>
          </section>
        )}

        {/* =========================
            LISTA DE PREGUNTAS
        ========================= */}

        {!loading && !isSociales && questions.length > 0 && (
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
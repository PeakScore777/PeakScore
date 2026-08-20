"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  Calculator,
  Globe,
  Microscope,
  Languages,
  Upload,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Search,
  X,
  FileText,
} from "lucide-react";

import { supabase } from "@/lib/supabase/browser";

import {
  getQuestions,
  deleteQuestion,
  type Question,
} from "@/lib/services/question.service";

const subjects = [
  {
    name: "Matemáticas",
    color: "bg-blue-100 text-blue-700",
    icon: Calculator,
  },
  {
    name: "Lectura Crítica",
    color: "bg-purple-100 text-purple-700",
    icon: BookOpen,
  },
  {
    name: "Sociales y Ciudadanas",
    color: "bg-orange-100 text-orange-700",
    icon: Globe,
  },
  {
    name: "Ciencias Naturales",
    color: "bg-green-100 text-green-700",
    icon: Microscope,
  },
  {
    name: "Inglés",
    color: "bg-red-100 text-red-700",
    icon: Languages,
  },
];

export default function QuestionBankPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const loadQuestions = async () => {
    setLoading(true);

    try {
      const data = await getQuestions();

      setQuestions(data);
    } catch (error) {
      console.error("Error cargando preguntas:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("institution_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error(
            "Error verificando permisos:",
            error
          );

          router.push("/dashboard");
          return;
        }

        if (!data) {
          router.push("/dashboard");
          return;
        }

        setCheckingAdmin(false);

        await loadQuestions();
      } catch (error) {
        console.error(
          "Error comprobando acceso:",
          error
        );

        router.push("/dashboard");
      }
    }

    checkAdminAccess();
  }, []);

  const getSubjectCount = (subjectName: string) => {
    return questions.filter(
      (question) =>
        question.subject === subjectName
    ).length;
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const searchValue =
        search.toLowerCase().trim();

      const contextText =
        question.context_text
          ?.toLowerCase()
          .trim() ?? "";

      const matchesSearch =
        !searchValue ||
        question.question
          .toLowerCase()
          .includes(searchValue) ||
        contextText.includes(searchValue) ||
        question.option_a
          .toLowerCase()
          .includes(searchValue) ||
        question.option_b
          .toLowerCase()
          .includes(searchValue) ||
        question.option_c
          .toLowerCase()
          .includes(searchValue) ||
        question.option_d
          .toLowerCase()
          .includes(searchValue);

      const matchesSubject =
        !subjectFilter ||
        question.subject === subjectFilter;

      const matchesSession =
        !sessionFilter ||
        String(question.session) ===
          sessionFilter;

      const matchesDifficulty =
        !difficultyFilter ||
        question.difficulty ===
          difficultyFilter;

      const matchesYear =
        !yearFilter ||
        String(question.year ?? "") ===
          yearFilter;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesSession &&
        matchesDifficulty &&
        matchesYear
      );
    });
  }, [
    questions,
    search,
    subjectFilter,
    sessionFilter,
    difficultyFilter,
    yearFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setSessionFilter("");
    setDifficultyFilter("");
    setYearFilter("");
  };

  const hasFilters =
    search ||
    subjectFilter ||
    sessionFilter ||
    difficultyFilter ||
    yearFilter;

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar esta pregunta?"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(id);

      await deleteQuestion(id);

      setQuestions((current) =>
        current.filter(
          (question) =>
            question.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error eliminando pregunta:",
        error
      );

      alert(
        "No se pudo eliminar la pregunta."
      );
    } finally {
      setDeleting(null);
    }
  };

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-4 font-medium text-slate-600">
            Verificando permisos...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Banco de Preguntas
            </h1>

            <p className="mt-2 text-slate-600">
              Administra todas las preguntas
              de PeakScore.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/import-pdf"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <Upload size={20} />
              Importar PDF
            </Link>

            <Link
              href="/dashboard/question-bank/new"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={20} />
              Nueva pregunta
            </Link>
          </div>
        </div>

        {/* MATERIAS */}

        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            const total =
              getSubjectCount(
                subject.name
              );

            return (
              <Link
                key={subject.name}
                href={`/dashboard/question-bank/subject/${encodeURIComponent(
                  subject.name
                )}`}
                className="group block"
              >
                <div className="h-full rounded-3xl bg-white p-8 shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div
                    className={`mb-6 inline-flex rounded-2xl p-4 ${subject.color}`}
                  >
                    <Icon size={30} />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    {subject.name}
                  </h2>

                  <p className="mt-3 text-slate-500">
                    Preguntas registradas
                  </p>

                  {loading ? (
                    <div className="mt-6 flex items-center gap-2 text-slate-400">
                      <Loader2
                        size={24}
                        className="animate-spin"
                      />

                      Cargando...
                    </div>
                  ) : (
                    <p className="mt-6 text-5xl font-extrabold text-slate-900">
                      {total}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-semibold text-slate-400 transition group-hover:text-blue-600">
                    Ver preguntas →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* LISTA */}

        <section className="rounded-3xl bg-white shadow-sm">
          {/* CABECERA */}

          <div className="border-b border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Preguntas registradas
            </h2>

            <p className="mt-2 text-slate-500">
              Busca y filtra las preguntas
              del banco.
            </p>
          </div>

          {/* FILTROS */}

          <div className="border-b border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* BUSCAR */}

              <div className="relative lg:col-span-2">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Buscar pregunta o texto..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* MATERIA */}

              <select
                value={subjectFilter}
                onChange={(e) =>
                  setSubjectFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="">
                  Todas las materias
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.name}
                    value={subject.name}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>

              {/* SESIÓN */}

              <select
                value={sessionFilter}
                onChange={(e) =>
                  setSessionFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="">
                  Todas las sesiones
                </option>

                <option value="1">
                  Sesión 1
                </option>

                <option value="2">
                  Sesión 2
                </option>
              </select>

              {/* DIFICULTAD */}

              <select
                value={difficultyFilter}
                onChange={(e) =>
                  setDifficultyFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="">
                  Todas las dificultades
                </option>

                <option value="Fácil">
                  Fácil
                </option>

                <option value="Media">
                  Media
                </option>

                <option value="Difícil">
                  Difícil
                </option>
              </select>
            </div>

            {/* SEGUNDA FILA */}

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <label className="font-medium text-slate-600">
                  Año:
                </label>

                <input
                  type="number"
                  value={yearFilter}
                  onChange={(e) =>
                    setYearFilter(
                      e.target.value
                    )
                  }
                  placeholder="Ej. 2025"
                  className="w-32 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <X size={18} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* RESULTADOS */}

          <div className="border-b border-slate-200 px-8 py-4">
            {loading ? (
              <p className="text-sm text-slate-500">
                Cargando...
              </p>
            ) : (
              <p className="text-sm font-medium text-slate-600">
                Mostrando{" "}
                <span className="font-bold text-slate-900">
                  {filteredQuestions.length}
                </span>{" "}
                de{" "}
                <span className="font-bold text-slate-900">
                  {questions.length}
                </span>{" "}
                preguntas
              </p>
            )}
          </div>

          {/* PREGUNTAS */}

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2
                size={28}
                className="animate-spin"
              />

              Cargando preguntas...
            </div>
          ) : filteredQuestions.length ===
            0 ? (
            <div className="p-12 text-center">
              <Search
                size={40}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-lg font-semibold text-slate-700">
                No encontramos preguntas
              </p>

              <p className="mt-2 text-slate-500">
                Prueba cambiando los filtros
                de búsqueda.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredQuestions.map(
                (question, index) => (
                  <div
                    key={question.id}
                    className="p-8 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      {/* INFORMACIÓN */}

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            #
                            {index + 1}
                          </span>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                            {
                              question.subject
                            }
                          </span>

                          {question.difficulty && (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                              {
                                question.difficulty
                              }
                            </span>
                          )}

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                            Sesión{" "}
                            {
                              question.session
                            }
                          </span>

                          {question.year && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                              {
                                question.year
                              }
                            </span>
                          )}
                        </div>

                        {/* CONTEXTO / TEXTO */}

                        {question.context_text && (
                          <div className="mb-6 overflow-hidden rounded-2xl border border-purple-200 bg-purple-50">
                            <div className="flex items-center gap-2 border-b border-purple-200 bg-purple-100 px-5 py-3">
                              <FileText
                                size={19}
                                className="text-purple-700"
                              />

                              <span className="font-bold text-purple-800">
                                Texto de
                                contexto
                              </span>
                            </div>

                            <div className="whitespace-pre-line px-5 py-5 text-[15px] leading-7 text-slate-700">
                              {
                                question.context_text
                              }
                            </div>
                          </div>
                        )}

                        {/* PREGUNTA */}

                        <h3 className="text-lg font-semibold leading-7 text-slate-900">
                          {
                            question.question
                          }
                        </h3>

                        {/* OPCIONES */}

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="font-semibold">
                              A.
                            </span>{" "}
                            {
                              question.option_a
                            }
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="font-semibold">
                              B.
                            </span>{" "}
                            {
                              question.option_b
                            }
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="font-semibold">
                              C.
                            </span>{" "}
                            {
                              question.option_c
                            }
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="font-semibold">
                              D.
                            </span>{" "}
                            {
                              question.option_d
                            }
                          </div>
                        </div>

                        {/* RESPUESTA */}

                        <div className="mt-5 text-green-700">
                          Respuesta correcta:{" "}
                          <strong>
                            {
                              question.correct_answer
                            }
                          </strong>
                        </div>

                        {/* COMPONENTE Y COMPETENCIA */}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {question.component && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Componente:{" "}
                              {
                                question.component
                              }
                            </span>
                          )}

                          {question.competence && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Competencia:{" "}
                              {
                                question.competence
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ACCIONES */}

                      <div className="flex shrink-0 gap-3">
                        <Link
                          href={`/dashboard/question-bank/edit/${question.id}`}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil
                            size={18}
                          />
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              question.id
                            )
                          }
                          disabled={
                            deleting ===
                            question.id
                          }
                          className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleting ===
                          question.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={18}
                            />
                          )}

                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  AlertTriangle,
  Pencil,
  Highlighter,
  X,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  LayoutGrid,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import QuestionPalette from "@/components/simulacros/QuestionPalette";
import BookletView from "@/components/simulacros/BookletView";
import ExamResults from "@/components/simulacros/ExamResults";

import { type Simulation } from "@/lib/services/simulation.service";

import type { Question } from "@/lib/services/question.service";

interface ExamResult {
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredAnswers: number;
  totalQuestions: number;
  percentage: number;
}

interface SavedExamState {
  currentQuestion: number;
  timeLeft: number;
  answers: Record<number, number>;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();

  const simulationId = params.id as string;

  /* =====================================================
     ESTADO
  ====================================================== */

  const [simulation, setSimulation] =
    useState<Simulation | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [englishSets, setEnglishSets] = useState<Record<string, {
    title: string;
    shared_title: string | null;
    booklet_format: string;
    part: number;
    shared_text: string | null;
    shared_image_url?: string | null;
    instructions: string | null;
    word_bank: Array<{ key: string; text: string; example?: boolean; example_description?: string; example_answer?: string }> | null;
    example_prompt: string | null;
    example_options: Array<{ key: string; text: string }> | null;
    example_image_url: string | null;
    example_answer: string | null;
  }>>({});

  const [loading, setLoading] =
    useState(true);

  const [answers, setAnswers] =
    useState<Record<number, number>>({});

  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ text: string; block: string } | null>(null);
  const [annotations, setAnnotations] = useState<Record<string, string[]>>({});

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [bookletView, setBookletView] = useState(false);

  const [examFinished, setExamFinished] =
    useState(false);

  const [savingAttempt, setSavingAttempt] =
    useState(false);

  const [result, setResult] =
    useState<ExamResult | null>(null);

  const [hasSavedProgress, setHasSavedProgress] =
    useState(false);

  const [serverAttemptId, setServerAttemptId] =
    useState<string | null>(null);

  const finishHandledRef =
    useRef(false);

  const storageKey =
    `peakscore:simulation:${simulationId}`;
  const annotationStorageKey = `peakscore:annotations:${simulationId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(annotationStorageKey);
      if (saved) setAnnotations(JSON.parse(saved) as Record<string, string[]>);
    } catch {
      console.error("[PeakScore] No se pudieron recuperar los subrayados.");
    }
  }, [annotationStorageKey]);

  const captureTextSelection = (block: string) => {
    if (!annotationMode) return;
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text) setPendingSelection({ text, block });
  };

  const saveUnderline = () => {
    if (!pendingSelection || !question) return;
    const key = `${question.id}:${pendingSelection.block}`;
    const next = { ...annotations, [key]: [...new Set([...(annotations[key] ?? []), pendingSelection.text])] };
    setAnnotations(next);
    try { localStorage.setItem(annotationStorageKey, JSON.stringify(next)); } catch {}
    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
  };

  const renderAnnotatedText = (text: string, block: string) => {
    const phrases = annotations[`${question?.id}:${block}`] ?? [];
    let segments: Array<{ text: string; marked: boolean }> = [{ text, marked: false }];
    for (const phrase of phrases) {
      if (!phrase) continue;
      segments = segments.flatMap((segment) => {
        if (segment.marked || !segment.text.includes(phrase)) return [segment];
        return segment.text.split(phrase).flatMap((part, index, parts) => {
          const result: Array<{ text: string; marked: boolean }> = [];
          if (part) result.push({ text: part, marked: false });
          if (index < parts.length - 1) result.push({ text: phrase, marked: true });
          return result;
        });
      });
    }
    return segments.map((segment, index) => segment.marked
      ? <mark key={`${block}-${index}`} className="rounded-sm bg-yellow-200 text-slate-900 underline decoration-2 decoration-yellow-600 underline-offset-4">{segment.text}</mark>
      : segment.text);
  };

  /* =====================================================
     GUARDAR PROGRESO LOCAL
  ====================================================== */

  const saveLocalProgress = (
    nextAnswers = answers,
    nextQuestion = currentQuestion,
    nextTime = timeLeft
  ) => {
    try {
      const state: SavedExamState = {
        currentQuestion: nextQuestion,
        timeLeft: nextTime,
        answers: nextAnswers,
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(state)
      );

      setHasSavedProgress(true);
    } catch (error) {
      console.error(
        "[PeakScore] Error guardando progreso local:",
        error
      );
    }
  };

  /* =====================================================
     ELIMINAR PROGRESO LOCAL
  ====================================================== */

  const clearLocalProgress = () => {
    try {
      localStorage.removeItem(storageKey);
      setHasSavedProgress(false);
    } catch (error) {
      console.error(
        "[PeakScore] Error eliminando progreso local:",
        error
      );
    }
  };

  /* =====================================================
     GUARDAR PROGRESO EN SERVIDOR
  ====================================================== */

  const saveServerProgress = async (
    nextAnswers = answers,
    nextQuestion = currentQuestion,
    nextTime = timeLeft
  ) => {
    const formattedAnswers = Object.entries(
      nextAnswers
    )
      .map(([questionIndex, selectedAnswer]) => {
        const index = Number(questionIndex);
        const question = questions[index];

        if (!question || !selectedAnswer) {
          return null;
        }

        return {
          question_id: question.id,
          selected_answer: String.fromCharCode(
            64 + selectedAnswer
          ),
        };
      })
      .filter(
        (
          answer
        ): answer is {
          question_id: string;
          selected_answer: string;
        } => Boolean(answer)
      );

    const response = await fetch(
      `/api/simulations/${simulationId}/progress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attempt_id: serverAttemptId,
          current_question: nextQuestion,
          time_left: nextTime,
          answers: formattedAnswers,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          "No fue posible guardar el progreso."
      );
    }

    if (data.attempt_id) {
      setServerAttemptId(data.attempt_id);
    }

    setHasSavedProgress(true);

    console.log(
      "[PeakScore] Progreso guardado en servidor:",
      {
        attemptId: data.attempt_id,
        currentQuestion:
          data.current_question,
        timeLeft: data.time_left,
        answered: data.answered,
      }
    );

    return data;
  };

  /* =====================================================
     CARGAR SIMULACRO
  ====================================================== */

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);

        const examResponse = await fetch(
          `/api/simulations/${simulationId}/questions`,
          { cache: "no-store" }
        );

        const examData = await examResponse.json();

        if (!examResponse.ok || !examData.success) {
          throw new Error(
            examData.error || "No fue posible cargar el simulacro."
          );
        }

        const simulationData = examData.simulation as Simulation;
        const questionData = examData.questions as Question[];
        const englishSetData = (examData.englishSets ?? {}) as typeof englishSets;

        setSimulation(simulationData);
        setQuestions(questionData);
        setEnglishSets(englishSetData);

        /* =================================================
           TIEMPO INICIAL
        ================================================== */

        const defaultTime =
          simulationData?.duration &&
          simulationData.duration > 0
            ? Math.round(
                simulationData.duration * 60
              )
            : 0;

        let loadedFromServer = false;

        /* =================================================
           RECUPERAR PROGRESO DEL SERVIDOR PRIMERO
        ================================================== */

        try {
          const progressResponse =
            await fetch(
              `/api/simulations/${simulationId}/progress`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const progressData =
            await progressResponse.json();

          if (
            progressResponse.ok &&
            progressData.success &&
            progressData.inProgress &&
            progressData.attempt
          ) {
            const serverAnswers: Record<
              number,
              number
            > = {};

            for (
              const answer of
                progressData.answers ?? []
            ) {
              const questionIndex =
                questionData.findIndex(
                  (item) =>
                    item.id ===
                    answer.question_id
                );

              if (
                questionIndex >= 0 &&
                ["A", "B", "C", "D"].includes(
                  answer.selected_answer
                )
              ) {
                serverAnswers[
                  questionIndex
                ] =
                  answer.selected_answer.charCodeAt(
                    0
                  ) - 64;
              }
            }

            const serverQuestion =
              Number.isInteger(
                progressData.attempt
                  .current_question
              ) &&
              progressData.attempt
                .current_question >= 0 &&
              progressData.attempt
                .current_question <
                questionData.length
                ? progressData.attempt
                    .current_question
                : 0;

            const serverTime =
              typeof progressData.attempt
                .time_left === "number" &&
              progressData.attempt
                .time_left >= 0
                ? progressData.attempt
                    .time_left
                : defaultTime;

            setServerAttemptId(
              progressData.attempt.id
            );

            setAnswers(
              serverAnswers
            );

            setCurrentQuestion(
              serverQuestion
            );

            setTimeLeft(
              serverTime
            );

            setHasSavedProgress(true);

            loadedFromServer = true;

            console.log(
              "[PeakScore] Progreso del servidor recuperado."
            );
          } else if (
            progressData.completed
          ) {
            clearLocalProgress();
            setServerAttemptId(null);

            console.log(
              "[PeakScore] El simulacro ya tiene un intento finalizado."
            );
          }
        } catch (serverError) {
          console.error(
            "[PeakScore] Error recuperando progreso del servidor:",
            serverError
          );
        }

        /* =================================================
           RECUPERAR PROGRESO LOCAL COMO RESPALDO
        ================================================== */

        if (!loadedFromServer) {
          try {
            const saved =
              localStorage.getItem(
                `peakscore:simulation:${simulationId}`
              );

            if (saved) {
              const parsed =
                JSON.parse(saved) as Partial<SavedExamState>;

              const savedAnswers =
                parsed.answers ?? {};

              const savedQuestion =
                Number.isInteger(
                  parsed.currentQuestion
                ) &&
                parsed.currentQuestion! >= 0 &&
                parsed.currentQuestion! <
                  questionData.length
                  ? parsed.currentQuestion!
                  : 0;

              const savedTime =
                typeof parsed.timeLeft === "number" &&
                parsed.timeLeft >= 0
                  ? parsed.timeLeft
                  : defaultTime;

              setAnswers(
                savedAnswers
              );

              setCurrentQuestion(
                savedQuestion
              );

              setTimeLeft(
                savedTime
              );

              if (
                Object.keys(
                  savedAnswers
                ).length > 0 ||
                savedQuestion > 0
              ) {
                setHasSavedProgress(true);
              }

              console.log(
                "[PeakScore] Progreso local recuperado como respaldo."
              );
            } else {
              setTimeLeft(
                defaultTime
              );
            }
          } catch (storageError) {
            console.error(
              "[PeakScore] Error leyendo progreso local:",
              storageError
            );

            setTimeLeft(
              defaultTime
            );
          }
        }
      } catch (error) {
        console.error(
          "[PeakScore] Error cargando simulacro:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    if (simulationId) {
      void loadExam();
    }
  }, [simulationId]);

  /* =====================================================
     GUARDADO AUTOMÁTICO CADA 5 SEGUNDOS
  ====================================================== */

  useEffect(() => {
    if (
      loading ||
      examFinished ||
      questions.length === 0
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        saveLocalProgress();
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    loading,
    examFinished,
    questions.length,
    currentQuestion,
    timeLeft,
    answers,
  ]);

  /* =====================================================
     GUARDAR AL SALIR / CERRAR PÁGINA
  ====================================================== */

  useEffect(() => {
    if (
      loading ||
      examFinished ||
      questions.length === 0
    ) {
      return;
    }

    const handleBeforeUnload = () => {
      saveLocalProgress();
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    loading,
    examFinished,
    questions.length,
    currentQuestion,
    timeLeft,
    answers,
  ]);

  /* =====================================================
     GUARDAR INTENTO DEFINITIVO
  ====================================================== */

  const saveAttempt = async () => {
    try {
      setSavingAttempt(true);

      const formattedAnswers =
        questions.map(
          (question, index) => {
            const selectedAnswer =
              answers[index];

            if (
              selectedAnswer ===
              undefined
            ) {
              return {
                question_id:
                  question.id,
                selected_answer:
                  null,
              };
            }

            const selectedLetter =
              String.fromCharCode(
                64 + selectedAnswer
              );

            return {
              question_id:
                question.id,
              selected_answer:
                selectedLetter,
            };
          }
        );

      const response =
        await fetch(
          `/api/simulations/${simulationId}/finish`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              attempt_id: serverAttemptId,
              answers: formattedAnswers,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        console.error(
          "[PeakScore] Error del servidor:",
          data
        );

        throw new Error(
          data.error ||
            "No fue posible guardar el simulacro."
        );
      }

      const serverResult: ExamResult = {
        correctAnswers:
          data.result.correctAnswers,
        incorrectAnswers:
          data.result.incorrectAnswers,
        unansweredAnswers:
          data.result.unansweredAnswers,
        totalQuestions:
          data.result.totalQuestions,
        percentage:
          data.result.percentage,
      };

      if (typeof data.attempt?.id === "string") {
        setServerAttemptId(data.attempt.id);
      }

      console.log(
        "[PeakScore] Simulacro finalizado correctamente."
      );

      setResult(
        serverResult
      );

      return true;
    } catch (error) {
      console.error(
        "[PeakScore] Error guardando simulacro:",
        error
      );

      throw error;
    } finally {
      setSavingAttempt(false);
    }
  };

  /* =====================================================
     FINALIZAR EXAMEN
  ====================================================== */

  const handleFinishExam = async (
    automatic = false
  ) => {
    if (
      finishHandledRef.current
    ) {
      return;
    }

    if (!automatic) {
      const confirmed =
        window.confirm(
          "¿Estás seguro de que deseas finalizar el simulacro?"
        );

      if (!confirmed) {
        return;
      }
    }

    finishHandledRef.current =
      true;

    try {
      await saveAttempt();

      /* ================================================
         EL SIMULACRO YA ESTÁ FINALIZADO
      ================================================= */

      clearLocalProgress();

      setExamFinished(true);

      console.log(
        "[PeakScore] Examen finalizado."
      );
    } catch (error) {
      finishHandledRef.current =
        false;

      console.error(
        "[PeakScore] Error finalizando examen:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el simulacro."
      );
    }
  };

  /* =====================================================
     CONTINUAR LUEGO
  ====================================================== */

  const handleContinueLater = async () => {
    saveLocalProgress();

    setSavingAttempt(true);

    try {
      await saveServerProgress(
        answers,
        currentQuestion,
        timeLeft
      );

      router.push(
        "/simulacros"
      );
    } catch (error) {
      console.error(
        "[PeakScore] Error guardando progreso antes de salir:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el progreso."
      );
    } finally {
      setSavingAttempt(false);
    }
  };

  /* =====================================================
     TEMPORIZADOR
  ====================================================== */

  useEffect(() => {
    if (
      loading ||
      examFinished ||
      !simulation
    ) {
      return;
    }

    if (timeLeft <= 0) {
      if (
        simulation.duration != null &&
        simulation.duration > 0
      ) {
        void handleFinishExam(true);
      }

      return;
    }

    const timer =
      setTimeout(() => {
        setTimeLeft(
          (previous) =>
            Math.max(
              0,
              previous - 1
            )
        );
      }, 1000);

    return () =>
      clearTimeout(timer);
  }, [
    timeLeft,
    loading,
    examFinished,
    simulation,
  ]);

  /* =====================================================
     CARGANDO
  ====================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
            <div className="animate-pulse">
              <div className="h-8 w-64 rounded-lg bg-slate-200" />

              <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />

              <div className="mt-8 h-32 rounded-2xl bg-slate-100" />
            </div>

            <p className="mt-6 text-center text-sm font-medium text-slate-500">
              Cargando simulacro...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     SIMULACRO NO ENCONTRADO
  ====================================================== */

  if (!simulation) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Simulacro no encontrado
            </h1>

            <p className="mt-3 text-slate-600">
              No pudimos encontrar este simulacro.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/simulacros"
                )
              }
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Volver a simulacros
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     SIN PREGUNTAS
  ====================================================== */

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Este simulacro todavía no tiene preguntas
            </h1>

            <p className="mt-3 text-slate-600">
              Primero debemos agregar preguntas a este simulacro.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     TIEMPO
  ====================================================== */

  const hours =
    Math.floor(
      timeLeft / 3600
    );

  const minutes =
    Math.floor(
      (timeLeft % 3600) / 60
    );

  const seconds =
    timeLeft % 60;

  const timeRemaining =
    hours > 0
      ? `${String(hours).padStart(
          2,
          "0"
        )}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(
          2,
          "0"
        )}`
      : `${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(
          2,
          "0"
        )}`;

  /* =====================================================
     PROGRESO
  ====================================================== */

  const question =
    questions[currentQuestion];

  const currentEnglishSet =
    question?.english_set_id
      ? englishSets[question.english_set_id] ?? null
      : null;

  const questionOptions = question
    ? question.english_options?.length
      ? question.english_options.map((option) => ({
          key: option.key,
          text: option.text,
        }))
      : [
          { key: "A", text: question.option_a },
          { key: "B", text: question.option_b },
          { key: "C", text: question.option_c },
          { key: "D", text: question.option_d },
        ]
    : [];

  const answeredQuestions =
    Object.keys(
      answers
    ).length;

  const answeredProgress =
    questions.length > 0
      ? Math.round(
          (answeredQuestions /
            questions.length) *
            100
        )
      : 0;

  const isLastQuestion =
    currentQuestion ===
    questions.length - 1;

  const hasCurrentAnswer =
    answers[currentQuestion] !==
    undefined;

  const timerIsLow =
    timeLeft <= 5 * 60;

  const timerIsCritical =
    timeLeft <= 60;

  /* =====================================================
     RESULTADOS
  ====================================================== */

  if (
    examFinished &&
    result
  ) {
    return (
      <div className="relative min-h-screen">
        <ExamResults
          correctAnswers={
            result.correctAnswers
          }
          incorrectAnswers={
            result.incorrectAnswers
          }
          unansweredAnswers={
            result.unansweredAnswers
          }
          totalQuestions={
            result.totalQuestions
          }
          percentage={
            result.percentage
          }
          simulationId={simulationId}
          attemptId={serverAttemptId}
          onRetry={() => {
            clearLocalProgress();
            window.location.reload();
          }}
        />

        <button
          type="button"
          onClick={() =>
            router.push(
              "/simulacros"
            )
          }
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
        >
          Volver a simulacros
        </button>
      </div>
    );
  }

  /* =====================================================
     EXAMEN
  ====================================================== */

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">

      {/* =================================================
          BARRA SUPERIOR
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">

          <div className="flex min-h-[76px] items-center gap-4">

            <div className="flex min-w-0 flex-1 items-center gap-4">

              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black tracking-tight text-white sm:flex">
                P
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-lg font-black tracking-tight text-slate-950">
                    PeakScore
                  </span>

                  <span className="hidden h-4 w-px bg-slate-300 sm:block" />

                  <span className="truncate text-sm font-semibold text-slate-600">
                    {simulation.title}
                  </span>

                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">

                  <span>
                    Modo examen
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    {simulation.subject ||
                      "Práctica"}
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                TEMPORIZADOR
            ================================================== */}

            <div
              className={`hidden items-center gap-3 rounded-2xl border px-4 py-2.5 sm:flex ${
                timerIsCritical
                  ? "border-red-200 bg-red-50"
                  : timerIsLow
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >

              <Clock3
                size={19}
                className={
                  timerIsCritical
                    ? "text-red-600"
                    : timerIsLow
                    ? "text-amber-600"
                    : "text-slate-700"
                }
              />

              <div className="leading-none">

                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Tiempo restante
                </p>

                <p
                  className={`mt-1 text-lg font-black tabular-nums ${
                    timerIsCritical
                      ? "text-red-600"
                      : timerIsLow
                      ? "text-amber-600"
                      : "text-slate-950"
                  }`}
                >
                  {timeRemaining}
                </p>

              </div>

            </div>

            {/* =================================================
                CONTINUAR LUEGO
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                void handleContinueLater()
              }
              disabled={savingAttempt}
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
            >
              <LogOut
                size={16}
              />

              {savingAttempt
                ? "Guardando..."
                : "Continuar luego"}
            </button>

            {/* =================================================
                FINALIZAR
            ================================================== */}

            <button
              type="button"
              disabled={
                savingAttempt
              }
              onClick={() =>
                void handleFinishExam()
              }
              className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
            >
              {savingAttempt
                ? "Guardando..."
                : "Finalizar"}
            </button>

          </div>

          {/* =================================================
              PROGRESO GLOBAL
          ================================================== */}

          <div className="pb-3">

            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">

              <span>
                Progreso
              </span>

              <span className="text-slate-600">
                {answeredQuestions}/
                {questions.length}{" "}
                respondidas
              </span>

            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${answeredProgress}%`,
                }}
              />

            </div>

          </div>

        </div>
      </header>

      {/* =================================================
          CONTENIDO
      ================================================== */}

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =================================================
            CABECERA
        ================================================== */}

        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">

              <span className="h-2 w-2 rounded-full bg-blue-600" />

              {simulation.subject ||
                "Simulacro"}

            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">

              Pregunta{" "}

              {String(
                currentQuestion + 1
              ).padStart(2, "0")}

              <span className="ml-2 text-slate-300">

                /{" "}

                {String(
                  questions.length
                ).padStart(2, "0")}

              </span>

            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona una sola respuesta.
              Puedes cambiarla antes de finalizar.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setAnnotationMode((value) => !value); setPendingSelection(null); }} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${annotationMode ? "border-amber-400 bg-amber-100 text-amber-900" : "border-slate-200 bg-white text-slate-700"}`} aria-pressed={annotationMode}>
            <Pencil size={16} /> {annotationMode ? "Lápiz activado" : "Lápiz"}
          </button>
          {annotationMode && <span className="text-xs text-slate-500">Selecciona texto y subráyalo.</span>}
          {pendingSelection && <button type="button" onClick={saveUnderline} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white"><Highlighter size={16}/> Subrayar selección</button>}
          {pendingSelection && <button type="button" onClick={() => setPendingSelection(null)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600" aria-label="Cancelar subrayado"><X size={16}/></button>}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">

            <ShieldCheck
              size={17}
              className="text-emerald-600"
            />

            Respuesta única

          </div>

        </div>

        <div className="mb-5 flex justify-end">
          <button type="button" onClick={() => setBookletView((value) => !value)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            {bookletView ? "Ver pregunta individual" : "Ver cuadernillo completo"}
          </button>
        </div>

        {bookletView && (
          <BookletView
            questions={questions}
            answers={answers}
            englishSets={englishSets}
            saving={savingAttempt}
            answeredCount={answeredQuestions}
            onAnswer={(index, optionNumber) => {
              const nextAnswers = { ...answers, [index]: optionNumber };
              setAnswers(nextAnswers);
              setCurrentQuestion(index);
              saveLocalProgress(nextAnswers, index, timeLeft);
            }}
            onFinish={() => void handleFinishExam()}
          />
        )}

        {!bookletView && (
        <div>
        {/* =================================================
            GRID PRINCIPAL
        ================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">

          {/* =================================================
              PREGUNTA
          ================================================== */}

          <section className="min-w-0">

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.07)]">

              {/* CABECERA */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    {currentQuestion + 1}
                  </div>

                  <div>

                    <p className="text-sm font-extrabold text-slate-900">
                      Analiza y responde
                    </p>

                    <p className="text-xs text-slate-400">
                      Pregunta de selección múltiple
                    </p>

                  </div>

                </div>

                {hasCurrentAnswer && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700">

                    <CheckCircle2
                      size={14}
                    />

                    Respondida

                  </span>
                )}

              </div>

              {/* CONTENIDO */}

              <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10">

                {/* =================================================
                    CONTEXTO
                ================================================== */}

                {currentEnglishSet && (
                  <div className="relative mb-7 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/60">
                    <div className="absolute inset-y-0 left-0 w-1 bg-violet-500" />
                    <div className="px-5 py-5 pl-6 sm:px-7 sm:py-7 sm:pl-8">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                          Inglés · Parte {currentEnglishSet.part}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {currentEnglishSet.booklet_format === "historical"
                            ? "Formato histórico"
                            : currentEnglishSet.booklet_format === "saber11_2026"
                              ? "Saber 11 · 2026 Cal A"
                              : "Texto compartido"}
                        </span>
                      </div>
                      {(currentEnglishSet.shared_title || currentEnglishSet.title) && (
                        <h2 className="text-lg font-black leading-7 text-slate-900">
                          {currentEnglishSet.shared_title || currentEnglishSet.title}
                        </h2>
                      )}
                      {currentEnglishSet.instructions && (
                        <p className="mt-3 text-sm font-semibold leading-6 text-violet-900">
                          {currentEnglishSet.instructions}
                        </p>
                      )}
                      {currentEnglishSet.shared_text && (
                        <div
                          onMouseUp={() => captureTextSelection("english-shared-text")}
                          className={`mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-[15px] ${annotationMode ? "cursor-text select-text" : ""}`}
                        >
                          {renderAnnotatedText(currentEnglishSet.shared_text, "english-shared-text")}
                        </div>
                      )}
                      {currentEnglishSet.shared_image_url && (
                        <div className="mt-4 flex justify-center">
                          <img
                            src={currentEnglishSet.shared_image_url}
                            alt={currentEnglishSet.shared_title || currentEnglishSet.title}
                            className="max-h-[440px] w-auto max-w-full rounded-xl border border-slate-200 object-contain"
                          />
                        </div>
                      )}
                      {Array.isArray(currentEnglishSet.word_bank) && currentEnglishSet.word_bank.length > 0 && (
                        <div className="mt-4 rounded-xl border border-violet-200/80 bg-white/80 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-violet-800">
                            Banco de palabras
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentEnglishSet.word_bank.map((entry, index) => {
                              const item = entry as { key?: string; text?: string };
                              if (typeof item.text !== "string") return null;
                              return (
                                <span
                                  key={item.key || index}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                >
                                  {item.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {question.context_text &&
                  question.context_text.trim() && (
                    <div className="relative mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                      <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />

                      <div className="px-5 py-5 pl-6 sm:px-7 sm:py-7 sm:pl-8">

                        <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">

                          <Info
                            size={14}
                          />

                          Contexto

                        </div>

                        <div onMouseUp={() => captureTextSelection("context")} className={`whitespace-pre-wrap text-[16px] font-medium leading-8 text-slate-700 sm:text-[17px] ${annotationMode ? "cursor-text select-text" : ""}`}>
                          {renderAnnotatedText(question.context_text, "context")}
                        </div>

                      </div>

                    </div>
                  )}

                {/* =================================================
                    PREGUNTA
                ================================================== */}

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">

                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />

                  <div className="px-5 py-5 pl-6 sm:px-7 sm:py-7 sm:pl-8">

                    <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">

                      <Info
                        size={14}
                      />

                      Pregunta

                    </div>

                    <div onMouseUp={() => captureTextSelection("question")} className={`whitespace-pre-wrap text-[17px] font-medium leading-8 text-slate-800 sm:text-[18px] ${annotationMode ? "cursor-text select-text" : ""}`}>
                      {renderAnnotatedText(question.question, "question")}
                    </div>

                    {question.image_url && (
                      <div className="mt-6 flex justify-center">
                        <img
                          src={question.image_url}
                          alt={`Recurso visual de la pregunta ${currentQuestion + 1}`}
                          className="max-h-[500px] w-auto max-w-full rounded-2xl border border-slate-200 object-contain"
                        />
                     </div>
                   )}

                  </div>

                </div>

                {/* =================================================
                    RESPUESTAS
                ================================================== */}

                <div className="mt-9">

                  <div className="mb-4">

                    <p className="text-sm font-black text-slate-950">
                      Selecciona tu respuesta
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Marca la opción que consideres correcta.
                    </p>

                  </div>

                  <div className="space-y-3">

                    {questionOptions.map(
                      (
                        option,
                        index
                      ) => {

                        const optionNumber =
                          index + 1;

                        const selected =
                          answers[
                            currentQuestion
                          ] ===
                          optionNumber;

                        return (
                          <button
                            key={
                              optionNumber
                            }
                            type="button"
                            onClick={() => {

                              const nextAnswers =
                                {
                                  ...answers,
                                  [currentQuestion]:
                                    optionNumber,
                                };

                              setAnswers(
                                nextAnswers
                              );

                              saveLocalProgress(
                                nextAnswers,
                                currentQuestion,
                                timeLeft
                              );
                            }}
                            className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
                              selected
                                ? "border-blue-500 bg-blue-50/70 shadow-[0_8px_25px_rgba(37,99,235,0.10)] ring-2 ring-blue-100"
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                            }`}
                          >

                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black transition ${
                                selected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                              }`}
                            >
                              {option.key || String.fromCharCode(64 + optionNumber)}
                            </span>

                            <span className="flex-1 pt-1 text-sm font-medium leading-6 text-slate-700 sm:text-[15px]">
                              {option.text}
                            </span>

                            <span
                              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Check
                                size={14}
                                strokeWidth={3}
                              />
                            </span>

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* =================================================
                    NAVEGACIÓN
                ================================================== */}

                <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">

                  {/* ANTERIOR */}

                  <button
                    type="button"
                    onClick={() => {

                      if (
                        currentQuestion >
                        0
                      ) {
                        const nextQuestion =
                          currentQuestion -
                          1;

                        setCurrentQuestion(
                          nextQuestion
                        );

                        saveLocalProgress(
                          answers,
                          nextQuestion,
                          timeLeft
                        );
                      }

                    }}
                    disabled={
                      currentQuestion ===
                      0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >

                    <ChevronLeft
                      size={18}
                    />

                    Anterior

                  </button>

                  {/* SIGUIENTE / FINALIZAR */}

                  {!isLastQuestion ? (
                    <button
                      type="button"
                      onClick={() => {

                        const nextQuestion =
                          currentQuestion +
                          1;

                        setCurrentQuestion(
                          nextQuestion
                        );

                        saveLocalProgress(
                          answers,
                          nextQuestion,
                          timeLeft
                        );

                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 hover:shadow-[0_10px_25px_rgba(37,99,235,0.28)]"
                    >

                      Siguiente

                      <ChevronRight
                        size={18}
                      />

                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        savingAttempt
                      }
                      onClick={() =>
                        void handleFinishExam()
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(16,185,129,0.20)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {savingAttempt
                        ? "Guardando..."
                        : "Finalizar simulacro"}

                      <CheckCircle2
                        size={18}
                      />

                    </button>
                  )}

                </div>

                {/* =================================================
                    CONTINUAR LUEGO - MÓVIL
                ================================================== */}

                <button
                  type="button"
                  onClick={
                    handleContinueLater
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:hidden"
                >

                  <LogOut
                    size={16}
                  />

                  Continuar luego

                </button>

              </div>

            </div>

          </section>

          {/* =================================================
              PANEL DE NAVEGACIÓN
          ================================================== */}

          <aside className="lg:sticky lg:top-[105px] lg:self-start">

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)]">

              <div className="border-b border-slate-100 px-5 py-5">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <div className="flex items-center gap-2">

                      <LayoutGrid
                        size={18}
                        className="text-blue-600"
                      />

                      <h2 className="font-black text-slate-950">
                        Mapa del examen
                      </h2>

                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Navega rápidamente entre las preguntas.
                    </p>

                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                    {answeredQuestions}/
                    {questions.length}
                  </span>

                </div>

              </div>

              <div className="p-5">

                <QuestionPalette
                  totalQuestions={
                    questions.length
                  }
                  currentQuestion={
                    currentQuestion
                  }
                  answers={answers}
                  onSelectQuestion={(
                    questionIndex
                  ) => {

                    setCurrentQuestion(
                      questionIndex
                    );

                    saveLocalProgress(
                      answers,
                      questionIndex,
                      timeLeft
                    );

                  }}
                />

                {/* ESTADÍSTICAS */}

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">

                  <div className="rounded-xl bg-blue-50 p-3 text-center">

                    <p className="text-lg font-black text-blue-600">
                      {currentQuestion +
                        1}
                    </p>

                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Actual
                    </p>

                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3 text-center">

                    <p className="text-lg font-black text-emerald-600">
                      {answeredQuestions}
                    </p>

                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Respondidas
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-100 p-3 text-center">

                    <p className="text-lg font-black text-slate-700">
                      {questions.length -
                        answeredQuestions}
                    </p>

                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Pendientes
                    </p>

                  </div>

                </div>

                {/* AVISO */}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="rounded-lg bg-white p-2 shadow-sm">

                      <ShieldCheck
                        size={16}
                        className="text-slate-600"
                      />

                    </div>

                    <div>

                      <p className="text-xs font-extrabold text-slate-800">
                        Puedes cambiar tus respuestas
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Revisa tus opciones antes de finalizar el simulacro.
                      </p>

                    </div>

                  </div>

                </div>

                {/* PROGRESO GUARDADO */}

                {hasSavedProgress && (
                  <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">

                    <p className="text-xs font-extrabold text-blue-800">
                      Progreso guardado
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-blue-700">
                      Puedes salir y continuar este simulacro después.
                    </p>

                  </div>
                )}

                {/* PREGUNTAS PENDIENTES */}

                {answeredQuestions <
                  questions.length && (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                      <div className="flex items-start gap-3">

                        <AlertTriangle
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <p className="text-[11px] leading-5 text-amber-800">

                          Tienes{" "}

                          <strong>
                            {questions.length -
                              answeredQuestions}
                          </strong>{" "}

                          pregunta
                          {questions.length -
                            answeredQuestions !==
                          1
                            ? "s"
                            : ""}{" "}
                          sin responder.

                        </p>

                      </div>

                    </div>
                  )}

              </div>

            </div>

          </aside>

        </div>

        {/* =================================================
            PALETA MÓVIL
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Preguntas
            </p>

            <p className="text-xs font-bold text-slate-400">
              {answeredQuestions}/
              {questions.length}
            </p>

          </div>

          <QuestionPalette
            totalQuestions={
              questions.length
            }
            currentQuestion={
              currentQuestion
            }
            answers={answers}
            onSelectQuestion={(
              questionIndex
            ) => {

              setCurrentQuestion(
                questionIndex
              );

              saveLocalProgress(
                answers,
                questionIndex,
                timeLeft
              );

            }}
          />

        </div>
        </div>
        )}

      </div>

    </main>
  );
}
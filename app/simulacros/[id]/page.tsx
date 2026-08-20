"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ExamHeader from "@/components/simulacros/ExamHeader";
import QuestionCard from "@/components/simulacros/QuestionCard";
import QuestionOptions from "@/components/simulacros/QuestionOptions";
import QuestionPalette from "@/components/simulacros/QuestionPalette";
import ExamResults from "@/components/simulacros/ExamResults";

import {
  getSimulationById,
  getSimulationQuestions,
  type Simulation,
} from "@/lib/services/simulation.service";

import type { Question } from "@/lib/services/question.service";

export default function ExamPage() {
  const params = useParams();
  const simulationId = params.id as string;

  const [simulation, setSimulation] =
    useState<Simulation | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] =
    useState<Record<number, number>>({});

  const [timeLeft, setTimeLeft] =
    useState(2 * 60 * 60);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [examFinished, setExamFinished] =
    useState(false);

  const [result, setResult] = useState<{
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
    percentage: number;
  } | null>(null);

  /* ================================
     CARGAR SIMULACRO Y PREGUNTAS
  ================================= */

  useEffect(() => {
    async function loadExam() {
      setLoading(true);

      const [simulationData, questionData] =
        await Promise.all([
          getSimulationById(simulationId),
          getSimulationQuestions(simulationId),
        ]);

      setSimulation(simulationData);
      setQuestions(questionData);

      if (simulationData?.duration) {
        setTimeLeft(simulationData.duration * 60);
      }

      setLoading(false);
    }

    if (simulationId) {
      loadExam();
    }
  }, [simulationId]);

  /* ================================
     CALCULAR RESULTADO
  ================================= */

  const calculateScore = () => {
    let correctAnswers = 0;

    questions.forEach((question, index) => {
      const selectedAnswer = answers[index];

      if (!selectedAnswer) {
        return;
      }

      const selectedLetter =
        String.fromCharCode(64 + selectedAnswer);

      if (
        selectedLetter.toLowerCase() ===
        question.correct_answer.toLowerCase()
      ) {
        correctAnswers++;
      }
    });

    return {
      correctAnswers,
      incorrectAnswers:
        questions.length - correctAnswers,
      totalQuestions: questions.length,
      percentage:
        questions.length > 0
          ? Math.round(
              (correctAnswers / questions.length) * 100
            )
          : 0,
    };
  };

  /* ================================
     FINALIZAR EXAMEN
  ================================= */

  const handleFinishExam = (automatic = false) => {
    if (!automatic) {
      const confirmed = confirm(
        "¿Estás seguro de que deseas finalizar el examen?"
      );

      if (!confirmed) return;
    }

    const finalResult = calculateScore();

    setResult(finalResult);
    setExamFinished(true);
  };

  /* ================================
     TEMPORIZADOR
  ================================= */

  useEffect(() => {
    if (loading || examFinished) {
      return;
    }

    if (timeLeft <= 0) {
      handleFinishExam(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, loading, examFinished]);

  /* ================================
     ESTADOS DE CARGA
  ================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-900">
            Cargando simulacro...
          </h1>

          <p className="mt-3 text-slate-600">
            Estamos preparando las preguntas.
          </p>
        </div>
      </main>
    );
  }

  /* ================================
     SIMULACRO NO ENCONTRADO
  ================================= */

  if (!simulation) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <h1 className="text-2xl font-bold text-slate-900">
              Simulacro no encontrado
            </h1>

            <p className="mt-3 text-slate-600">
              No pudimos encontrar este simulacro.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ================================
     SIN PREGUNTAS
  ================================= */

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow">
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

  /* ================================
     TIEMPO
  ================================= */

  const hours = String(
    Math.floor(timeLeft / 3600)
  ).padStart(2, "0");

  const minutes = String(
    Math.floor((timeLeft % 3600) / 60)
  ).padStart(2, "0");

  const seconds = String(
    timeLeft % 60
  ).padStart(2, "0");

  const question = questions[currentQuestion];

  const answeredQuestions =
    Object.keys(answers).length;

  /* ================================
     RESULTADOS
  ================================= */

  if (examFinished && result) {
    return (
      <ExamResults
        correctAnswers={result.correctAnswers}
        incorrectAnswers={result.incorrectAnswers}
        percentage={result.percentage}
        onRetry={() => window.location.reload()}
      />
    );
  }

  /* ================================
     EXAMEN
  ================================= */

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8 space-y-8">

        <div className="flex items-start justify-between gap-4">

          <ExamHeader
            title={simulation.title}
            currentQuestion={currentQuestion + 1}
            totalQuestions={questions.length}
            timeRemaining={`${hours}:${minutes}:${seconds}`}
          />

          <button
            onClick={() => handleFinishExam()}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Finalizar examen
          </button>

        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm font-medium text-slate-600">
            Respondidas:

            <span className="ml-2 font-bold text-blue-600">
              {answeredQuestions} / {questions.length}
            </span>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">

          <div className="space-y-6">

            <QuestionCard
              questionNumber={currentQuestion + 1}
              context={
                question.question
              }
              statement={
                question.explanation ??
                ""
              }
            />

            <QuestionOptions
              options={[
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
              ]}
              selectedOption={
                answers[currentQuestion] ?? null
              }
              onSelect={(option) => {
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion]: option,
                }));
              }}
            />

            <div className="flex justify-between">

              <button
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(
                      currentQuestion - 1
                    );
                  }
                }}
                disabled={currentQuestion === 0}
                className="rounded-xl bg-slate-600 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Anterior
              </button>

              <button
                onClick={() => {
                  if (
                    currentQuestion <
                    questions.length - 1
                  ) {
                    setCurrentQuestion(
                      currentQuestion + 1
                    );
                  }
                }}
                disabled={
                  currentQuestion ===
                  questions.length - 1
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Siguiente
              </button>

            </div>
          </div>

          <div>
            <QuestionPalette
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answers={answers}
              onSelectQuestion={
                setCurrentQuestion
              }
            />
          </div>

        </div>
      </div>
    </main>
  );
}
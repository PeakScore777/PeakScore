"use client";

import { BookOpen, Clock3 } from "lucide-react";

interface ExamHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: string;
}

export default function ExamHeader({
  title,
  currentQuestion,
  totalQuestions,
  timeRemaining,
}: ExamHeaderProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {title}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-slate-500">
            <BookOpen size={18} />
            Pregunta {currentQuestion} de {totalQuestions}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3">
          <Clock3 className="text-blue-600" size={22} />

          <div>
            <p className="text-xs text-slate-500">
              Tiempo restante
            </p>

            <p className="font-bold text-blue-700">
              {timeRemaining}
            </p>
          </div>
        </div>

      </div>

      <div className="mt-6 h-3 rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </header>
  );
}
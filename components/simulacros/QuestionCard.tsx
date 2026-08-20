"use client";

interface QuestionCardProps {
  questionNumber: number;
  statement: string;
  context?: string;
}

export default function QuestionCard({
  questionNumber,
  statement,
  context,
}: QuestionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
          Pregunta {questionNumber}
        </span>
      </div>

      {context && (
        <div className="mb-8 rounded-2xl bg-slate-50 p-6">
          <p className="leading-8 text-slate-700">
            {context}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-semibold leading-10 text-slate-800">
        {statement}
      </h2>

    </div>
  );
}
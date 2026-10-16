"use client";

import type { Question } from "@/lib/services/question.service";

type Props = {
  questions: Question[];
  answers: Record<number, number>;
  onAnswer: (index: number, optionNumber: number) => void;
  onFinish: () => void;
  saving: boolean;
  answeredCount: number;
};

export default function BookletView({
  questions,
  answers,
  onAnswer,
  onFinish,
  saving,
  answeredCount,
}: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="border border-slate-300 bg-white px-6 py-6 shadow-sm sm:px-10">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PeakScore · Cuadernillo de práctica</p>
        <h2 className="mt-2 text-center text-2xl font-black text-slate-950">Cuadernillo del simulacro</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Lee el documento de arriba hacia abajo. Marca una respuesta en cada pregunta; puedes cambiarla antes de entregar.</p>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-sm font-bold text-slate-600">
          <span>{answeredCount} de {questions.length} respondidas</span>
          <span>{questions.length - answeredCount} pendientes</span>
        </div>
      </section>
      {questions.map((question, index) => {
        const selected = answers[index] ?? 0;
        const rawOptions = [question.option_a, question.option_b, question.option_c, question.option_d];
        return (
          <article key={question.id} id={`booklet-question-${index}`} className="scroll-mt-28 border border-slate-300 bg-white px-6 py-6 shadow-sm sm:px-10 sm:py-8">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-950">Pregunta {index + 1}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${selected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{selected ? "Respondida" : "Sin responder"}</span>
            </div>
            {question.context_text?.trim() && <div className="mb-6 whitespace-pre-wrap border border-slate-200 bg-slate-50 p-5 font-serif text-[15px] leading-7 text-slate-800">{question.context_text}</div>}
            <p className="whitespace-pre-wrap font-serif text-base leading-8 text-slate-900">{question.question}</p>
            {question.image_url && <div className="mt-5 flex justify-center"><img src={question.image_url} alt={`Recurso de la pregunta ${index + 1}`} className="max-h-[480px] max-w-full object-contain" /></div>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {rawOptions.map((option, optionIndex) => {
                if (typeof option !== "string" || !option.trim()) return null;
                const optionNumber = optionIndex + 1;
                const active = selected === optionNumber;
                return (
                  <button key={optionIndex} type="button" onClick={() => onAnswer(index, optionNumber)} aria-pressed={active} className={`flex items-start gap-3 border p-4 text-left transition ${active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-300 hover:border-slate-500 hover:bg-slate-50"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-black ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-700"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="pt-1 text-sm leading-6 text-slate-800">{option}</span>
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
      <div className="flex flex-col gap-3 border border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Revisa tus respuestas antes de finalizar. Las preguntas sin marcar quedarán como omitidas.</p>
        <button type="button" disabled={saving} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Finalizar simulacro"}</button>
      </div>
    </div>
  );
}

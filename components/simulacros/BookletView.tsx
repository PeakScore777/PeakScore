"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/services/question.service";

type EnglishSetDisplay = {
  title: string;
  part: number;
  shared_text: string | null;
  shared_image_url?: string | null;
  instructions: string | null;
  word_bank: Array<{ key: string; text: string; example?: boolean; example_description?: string; example_answer?: string }> | null;
  example_prompt: string | null;
  example_options: Array<{ key: string; text: string }> | null;
  example_image_url: string | null;
  example_answer: string | null;
};

type Props = {
  questions: Question[];
  answers: Record<number, number>;
  onAnswer: (index: number, optionNumber: number) => void;
  onFinish: () => void;
  saving: boolean;
  answeredCount: number;
  englishSets?: Record<string, EnglishSetDisplay>;
};

function getEnglishNumber(question: Question, fallback: number, setTitle?: string) {
  const part = question.english_part;
  const position = question.english_position;
  if (!part || !position) return fallback;
  if (part === 1) return 79 + position;
  if (part === 2) return 84 + position;
  if (part === 3) return 89 + position;
  if (part === 4) {
    const isB = /^4B\b/i.test(setTitle ?? question.component ?? "");
    return (isB ? 104 : 96) + position;
  }
  if (part === 5) return 112 + position;
  if (part === 6) return 119 + position;
  if (part === 7) {
    const isB = /^7B\b/i.test(setTitle ?? question.component ?? "");
    return (isB ? 129 : 124) + position;
  }
  return fallback;
}

export default function BookletView({
  questions,
  answers,
  onAnswer,
  onFinish,
  saving,
  answeredCount,
  englishSets = {},
}: Props) {
  const renderedSetIntro = new Set<string>();
  const questionsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <section className="border border-slate-300 bg-white px-6 py-6 shadow-sm sm:px-10">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PeakScore · Cuadernillo de práctica</p>
        <h2 className="mt-2 text-center text-2xl font-black text-slate-950">Cuadernillo del simulacro</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Lee cada sección y marca una sola respuesta por pregunta. Puedes cambiarla antes de entregar.</p>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-sm font-bold text-slate-600">
          <span>{answeredCount} de {questions.length} respondidas</span>
          <span>{questions.length - answeredCount} pendientes</span>
        </div>
      </section>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="text-sm text-slate-600">Página {currentPage} de {totalPages} · Preguntas {startIndex + 1}–{Math.min(startIndex + questionsPerPage, questions.length)} de {questions.length}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={16} /> Anterior</button>
          <button type="button" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Siguiente <ChevronRight size={16} /></button>
        </div>
      </div>
      <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-5 py-5 shadow-sm sm:px-8 sm:py-7">
      <div className="grid grid-cols-1 gap-x-7 md:grid-cols-2">
      {visibleQuestions.map((question, pageIndex) => {
        const index = startIndex + pageIndex;
        const selected = answers[index] ?? 0;
        const setId = question.english_set_id ?? "";
        const setInfo = setId ? englishSets[setId] : undefined;
        const isEnglish = Boolean(question.english_part);
        const part = question.english_part ?? 0;
        const firstInSet = Boolean(setId && !renderedSetIntro.has(setId));
        if (firstInSet) renderedSetIntro.add(setId);
        const officialNumber = getEnglishNumber(question, index + 1, setInfo?.title);
        const rawOptions = part === 1
          ? []
          : question.english_options?.length
            ? question.english_options.map(option => option.text)
            : [question.option_a, question.option_b, question.option_c, question.option_d];
        const options = rawOptions
          .map((text, optionIndex) => ({ text, optionIndex }))
          .filter(option => typeof option.text === "string" && option.text.trim());
        const stacked = isEnglish;
        const showPart3Example = firstInSet && part === 3 && Boolean(setInfo?.example_image_url);
        const showSharedText = firstInSet && Boolean(setInfo?.shared_image_url || setInfo?.shared_text || question.context_text);
        const wordBank = firstInSet ? setInfo?.word_bank ?? [] : [];

        return (
          <article key={question.id} id={`booklet-question-${index}`} className="mb-6 min-w-0 scroll-mt-28 break-inside-avoid">
            {firstInSet && setInfo && (
              <header className="mb-5 border-b border-slate-300 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {question.session}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{setInfo.title}</h3>
                {setInfo.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{setInfo.instructions}</p>}
                {showPart3Example && (
                  <div className="mt-4">
                    <div className="flex justify-center">
                      <img src={setInfo.example_image_url!} alt="Ejemplo ilustrado de conversación" className="max-h-64 max-w-full object-contain" />
                    </div>
                  </div>
                )}

              </header>
            )}
            {firstInSet && setInfo && part === 1 && wordBank.length > 0 && (() => {
              const exampleWord = wordBank.find(word => word.example);
              return exampleWord?.example_description ? (
                <div className="mb-5 border-b-2 border-slate-900 pb-4">
                  <p className="mb-3 text-center text-xs font-black uppercase tracking-widest">Ejemplo</p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
                    <p className="font-serif text-sm leading-6"><strong>0.</strong> {exampleWord.example_description}</p>
                    <div className="flex flex-wrap items-center gap-1 border border-slate-300 p-2 text-xs">
                      <strong className="mr-2">Respuesta 0.</strong>
                      {wordBank.map(word => <span key={word.key} className={`flex h-6 w-6 items-center justify-center rounded-full border ${word.key === (exampleWord.example_answer ?? exampleWord.key) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300"}`}>{word.key}</span>)}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            {firstInSet && setInfo && part !== 1 && part !== 3 && (setInfo.example_prompt || setInfo.example_image_url) && (
              <div className="mb-5 border-b border-slate-900 pb-5">
                <p className="mb-3 text-center text-xs font-black uppercase tracking-widest">Ejemplo</p>
                {setInfo.example_image_url && <div className="mb-3 flex justify-center"><img src={setInfo.example_image_url} alt="Imagen del ejemplo" className="max-h-56 max-w-full object-contain" /></div>}
                {setInfo.example_prompt && <p className="mb-3 whitespace-pre-wrap font-serif text-sm leading-6"><strong>0.</strong> {setInfo.example_prompt}</p>}
                {!!setInfo.example_options?.length && <div className="grid grid-cols-1 gap-y-1 text-sm leading-6">{setInfo.example_options.map(option => <div key={option.key} className="flex gap-2"><strong>{option.key}.</strong><span>{option.text}</span></div>)}</div>}
                {!!setInfo.example_options?.length && setInfo.example_answer && <div className="mt-3 inline-flex flex-wrap items-center gap-1 border border-slate-400 px-2 py-1 text-xs"><strong className="mr-2">Respuesta 0.</strong>{setInfo.example_options.map(option => <span key={option.key} className={`flex h-6 w-6 items-center justify-center rounded-full border ${setInfo.example_answer === option.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-400"}`}>{option.key}</span>)}</div>}
              </div>
            )}
            {showSharedText && (
              setInfo?.shared_image_url ? (
                <div className="mb-5 flex justify-center border border-slate-900 p-3">
                  <img src={setInfo.shared_image_url} alt="Texto compartido de la Parte 4" className="h-auto max-h-[560px] max-w-full object-contain" />
                </div>
              ) : (
                <div className="mb-5 whitespace-pre-wrap border border-slate-300 px-4 py-4 font-serif text-[15px] leading-7 text-slate-900">
                  {setInfo?.shared_text ?? question.context_text}
                </div>
              )
            )}
            {wordBank.length > 0 && firstInSet && (
              <div className="mb-5 grid gap-2 border-b border-slate-300 pb-4 sm:grid-cols-2">
                {wordBank.map(word => (
                  <div key={word.key} className="flex gap-2 py-1 text-sm leading-6">
                    <strong>{word.key}.</strong><span>{word.text}{word.example ? " (ejemplo)" : ""}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={`grid gap-3 ${isEnglish ? "sm:grid-cols-[2.5rem_minmax(0,1fr)]" : "sm:grid-cols-[3.5rem_minmax(0,1fr)]"}`}>
              <div className="flex items-start justify-between gap-3 sm:block">
                <h3 className="text-sm font-black text-slate-950">{isEnglish ? `${officialNumber}.` : `Pregunta ${index + 1}`}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold sm:mt-2 sm:inline-block ${selected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{selected ? "Respondida" : "Sin responder"}</span>
              </div>
              <div>
                {question.image_url && part === 2 && (
                  <div className="mb-2 flex justify-start">
                    <img src={question.image_url} alt={`Aviso de la pregunta ${officialNumber}`} className="max-h-28 max-w-[280px] object-contain" />
                  </div>
                )}
                <p className={`whitespace-pre-wrap font-serif text-slate-900 ${isEnglish ? "text-[15px] leading-7" : "text-base leading-8"}`}>{question.question}</p>
                {question.image_url && part !== 2 && (
                  <div className="mt-3 flex justify-center">
                    <img src={question.image_url} alt={`Recurso de la pregunta ${officialNumber}`} className="max-h-[480px] max-w-full object-contain" />
                  </div>
                )}
                <div className={`mt-3 grid gap-x-6 ${part === 3 ? "sm:grid-cols-2 gap-y-2" : stacked ? "grid-cols-1 gap-y-2" : "sm:grid-cols-2 gap-y-3"}`}>
                  {options.map(({ text, optionIndex }) => {
                    const optionNumber = optionIndex + 1;
                    const active = selected === optionNumber;
                    return (
                      <button key={optionIndex} type="button" onClick={() => onAnswer(index, optionNumber)} aria-pressed={active} className={`flex items-start gap-2 border px-3 py-2.5 text-left transition ${stacked && part !== 3 ? "min-h-10" : "p-3"} ${active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-300 hover:border-slate-500 hover:bg-slate-50"}`}>
                        <span className={`shrink-0 font-black ${active ? "text-blue-700" : "text-slate-800"}`}>{String.fromCharCode(65 + optionIndex)}.</span>
                        <span className="text-sm leading-6 text-slate-800">{text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      </div>
      <footer className="mt-5 flex items-center justify-between border-t border-slate-300 pt-3 text-[10px] text-slate-500"><span>PeakScore · Cuadernillo de práctica</span><span>Página {currentPage} de {totalPages}</span></footer>
      </section>
      <div className="flex flex-col gap-3 border border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Revisa tus respuestas antes de finalizar. Las preguntas sin marcar quedarán como omitidas.</p>
        <button type="button" disabled={saving} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Finalizar simulacro"}</button>
      </div>
    </div>
  );
}

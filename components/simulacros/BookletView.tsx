"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/services/question.service";

type EnglishSetDisplay = {
  title: string;
  shared_title?: string | null;
  booklet_format?: string;
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

function getEnglishNumber(
  question: Question,
  fallback: number,
  setInfo?: EnglishSetDisplay,
) {
  const part = question.english_part;
  const position = question.english_position;
  if (!part || !position) return fallback;

  const historical = setInfo?.booklet_format === "historical";
  const title = setInfo?.title ?? question.component ?? "";

  if (part === 1) return 79 + position;
  if (part === 2) return 84 + position;
  if (part === 3) return 89 + position;

  if (part === 4) {
    if (/^4B\b/i.test(title)) return 104 + position;
    return historical ? 96 + position : 94 + position;
  }

  if (part === 5) return (historical ? 112 : 102) + position;
  if (part === 6) return (historical ? 119 : 109) + position;

  if (part === 7) {
    if (historical || /^7B\b/i.test(title)) return 124 + position;
    return 114 + position;
  }

  return fallback;
}

function getAllowedLetters(part: number): string[] {
  if (part === 1) return ["A", "B", "C", "D", "E", "F", "G"];
  if (part >= 2 && part <= 5) return ["A", "B", "C"];
  if (part === 6 || part === 7) return ["A", "B", "C", "D"];
  return ["A", "B", "C", "D"];
}

function getOptions(question: Question, part: number) {
  if (part === 1) return [];
  if (question.english_options?.length) {
    return question.english_options
      .filter((option) => typeof option.key === "string" && typeof option.text === "string")
      .map((option) => ({ key: option.key.trim().toUpperCase(), text: option.text }));
  }

  return [
    { key: "A", text: question.option_a },
    { key: "B", text: question.option_b },
    { key: "C", text: question.option_c },
    { key: "D", text: question.option_d },
  ].filter((option) => option.text?.trim() && option.text !== "N/A");
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
  const questionsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const questionPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const isEnglishSimulation = questions.some((question) => Boolean(question.english_part));
  const totalPages = questionPages + (isEnglishSimulation ? 1 : 0);
  const isAnswerSheetPage = isEnglishSimulation && currentPage > questionPages;
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = isAnswerSheetPage
    ? []
    : questions.slice(startIndex, startIndex + questionsPerPage);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      <section className="border border-slate-300 bg-white px-5 py-3 shadow-sm sm:px-7 sm:py-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          PeakScore · Cuadernillo de práctica
        </p>
        <h2 className="mt-1 text-center text-xl font-black text-slate-950">
          {isAnswerSheetPage ? "Hoja de respuestas · Inglés" : "Cuadernillo del simulacro"}
        </h2>
        <p className="mx-auto mt-1 max-w-2xl text-xs leading-4 text-slate-600">
          {isAnswerSheetPage
            ? "Marca una sola opción por pregunta. Puedes cambiarla antes de finalizar."
            : isEnglishSimulation
              ? "Resuelve las preguntas siguiendo el orden del cuadernillo y registra tus respuestas en la hoja al final."
              : "Lee cada sección y marca una sola respuesta por pregunta. Puedes cambiarla antes de entregar."}
        </p>
        <div className="mt-2 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-2 text-xs font-bold text-slate-600">
          <span>{answeredCount} de {questions.length} respondidas</span>
          <span>{questions.length - answeredCount} pendientes</span>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="text-sm text-slate-600">
          {isAnswerSheetPage
            ? `Hoja de respuestas · ${questions.length} preguntas`
            : `Página ${currentPage} de ${questionPages} · Preguntas ${startIndex + 1}–${Math.min(startIndex + questionsPerPage, questions.length)} de ${questions.length}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {isEnglishSimulation && currentPage === questionPages ? "Hoja de respuestas" : isAnswerSheetPage ? "Última página" : "Siguiente"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!isAnswerSheetPage && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            {visibleQuestions.map((question, pageIndex) => {
              const index = startIndex + pageIndex;
              const setId = question.english_set_id ?? "";
              const setInfo = setId ? englishSets[setId] : undefined;
              const isEnglish = Boolean(question.english_part);
              const part = question.english_part ?? 0;
              const title = setInfo?.title ?? question.component ?? "";
              const officialNumber = getEnglishNumber(question, index + 1, setInfo);
              const options = getOptions(question, part);
              const isFirstInSet = pageIndex === 0 || visibleQuestions[pageIndex - 1]?.english_set_id !== setId;
              const wordBank = isFirstInSet ? setInfo?.word_bank ?? [] : [];
              const showSharedText = isFirstInSet && Boolean(setInfo?.shared_image_url || setInfo?.shared_text || question.context_text);
              const showPart3Example = isFirstInSet && part === 3 && Boolean(setInfo?.example_image_url);

              return (
                <article
                  key={question.id}
                  id={`booklet-question-${index}`}
                  className="mb-4 min-w-0 break-inside-avoid border-b border-slate-200 pb-3"
                >
                  {isFirstInSet && setInfo && (
                    <header className="mb-2 border-b border-slate-300 pb-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Inglés · Sesión {question.session}
                      </p>
                      <h3 className="mt-1 text-sm font-black leading-5 text-slate-950">
                        {setInfo.shared_title || setInfo.title}
                      </h3>
                      {setInfo.instructions && (
                        <p className="mt-2 whitespace-pre-wrap text-[11px] leading-4 text-slate-700">
                          {setInfo.instructions}
                        </p>
                      )}
                      {showPart3Example && (
                        <div className="mt-3 flex justify-center">
                          <img src={setInfo.example_image_url!} alt="Ejemplo ilustrado de conversación" className="max-h-48 max-w-full object-contain" />
                        </div>
                      )}
                    </header>
                  )}

                  {isFirstInSet && setInfo && part === 1 && wordBank.length > 0 && (() => {
                    const exampleWord = wordBank.find((word) => word.example);
                    return exampleWord?.example_description ? (
                      <div className="mb-2 border-b-2 border-slate-900 pb-2">
                        <p className="mb-2 text-center text-[9px] font-black uppercase tracking-widest">Ejemplo</p>
                        <div className="grid gap-2 sm:grid-cols-[1fr_0.9fr]">
                          <p className="font-serif text-[11px] leading-4">
                            <strong>0.</strong> {exampleWord.example_description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 border border-slate-300 p-2 text-[9px]">
                            <strong className="mr-1">Respuesta 0.</strong>
                            {wordBank.map((word) => (
                              <span key={word.key} className={`flex h-5 w-5 items-center justify-center rounded-full border ${word.key === (exampleWord.example_answer ?? exampleWord.key) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300"}`}>
                                {word.key}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {isFirstInSet && setInfo && part !== 1 && part !== 3 && (setInfo.example_prompt || setInfo.example_image_url) && (
                    <div className="mb-2 border-b border-slate-900 pb-2">
                      <p className="mb-2 text-center text-[9px] font-black uppercase tracking-widest">Ejemplo</p>
                      {setInfo.example_image_url && (
                        <div className="mb-2 flex justify-center">
                          <img src={setInfo.example_image_url} alt="Imagen del ejemplo del banco de preguntas" className="max-h-44 max-w-full object-contain" />
                        </div>
                      )}
                      {setInfo.example_prompt && (
                        <p className="mb-2 whitespace-pre-wrap font-serif text-[11px] leading-4">
                          <strong>0.</strong> {setInfo.example_prompt}
                        </p>
                      )}
                      {!!setInfo.example_options?.length && (
                        <div className={`grid gap-x-3 gap-y-1 text-[10px] leading-4 ${setInfo.example_options.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {setInfo.example_options.map((option) => (
                            <div key={option.key} className="flex gap-1">
                              <strong>{option.key}.</strong><span>{option.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!setInfo.example_options?.length && setInfo.example_answer && (
                        <div className="mt-2 inline-flex flex-wrap items-center gap-1 border border-slate-400 px-2 py-1 text-[9px]">
                          <strong className="mr-1">Respuesta 0.</strong>
                          {setInfo.example_options.map((option) => (
                            <span key={option.key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${setInfo.example_answer === option.key ? "border-black bg-black font-bold text-white" : "border-slate-400"}`}>
                              {option.key}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {showSharedText && (
                    setInfo?.shared_image_url ? (
                      <div className="mb-2 flex justify-center">
                        <img src={setInfo.shared_image_url} alt={setInfo.shared_title || setInfo.title} className="h-auto max-h-[500px] max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="mb-2 whitespace-pre-wrap font-serif text-[11px] leading-[1.4] text-slate-900">
                        {setInfo?.shared_text ?? question.context_text}
                      </div>
                    )
                  )}

                  {wordBank.length > 0 && isFirstInSet && (
                    <div className="mb-2 grid gap-1 border-b border-slate-300 pb-2 sm:grid-cols-2">
                      {wordBank.map((word) => (
                        <div key={word.key} className="flex gap-2 py-0.5 text-[11px] leading-4">
                          <strong>{word.key}.</strong>
                          <span>{word.text}{word.example ? " (ejemplo)" : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
                    <strong className="text-[11px] text-slate-950">
                      {isEnglish ? `${officialNumber}.` : `Pregunta ${index + 1}`}
                    </strong>
                    <div>
                      {question.image_url && part === 2 && (
                        <div className="mb-2 flex justify-start">
                          <img src={question.image_url} alt={`Aviso de la pregunta ${officialNumber}`} className="max-h-24 max-w-[240px] object-contain" />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap font-serif text-[11px] leading-[1.4] text-slate-900">
                        {question.question}
                      </p>
                      {question.image_url && part !== 2 && (
                        <div className="mt-2 flex justify-center">
                          <img src={question.image_url} alt={`Recurso de la pregunta ${officialNumber}`} className="max-h-[420px] max-w-full object-contain" />
                        </div>
                      )}
                      {options.length > 0 && (
                        <div className={`mt-2 grid gap-x-3 gap-y-1 ${part === 4 ? "grid-cols-3" : part === 5 || part === 6 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                          {options.map((option) => (
                            isEnglish ? (
                              <div key={option.key} className="flex gap-1 text-[10px] leading-[1.35]">
                                <strong>{option.key}.</strong><span>{option.text}</span>
                              </div>
                            ) : (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => onAnswer(index, option.key.charCodeAt(0) - 64)}
                                aria-pressed={answers[index] === option.key.charCodeAt(0) - 64}
                                className={`flex items-start gap-2 border-0 px-0 py-0.5 text-left transition ${answers[index] === option.key.charCodeAt(0) - 64 ? "bg-blue-50" : "hover:bg-slate-50"}`}
                              >
                                <strong className="shrink-0">{option.key}.</strong>
                                <span className="text-[12px] leading-[1.35] text-slate-900">{option.text}</span>
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <footer className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-[9px] text-slate-500">
            <span>PeakScore · Material de práctica</span>
            <span>Página {currentPage} de {questionPages}</span>
          </footer>
        </section>
      )}

      {isAnswerSheetPage && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white p-5 shadow-sm sm:p-8">
          <header className="mb-5 border-b-2 border-slate-900 pb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Saber 11 · Inglés</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Hoja de respuestas</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Selecciona una burbuja por pregunta. Las letras disponibles cambian según la parte del cuadernillo.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {questions.map((question, index) => {
              const part = question.english_part ?? 0;
              const setInfo = question.english_set_id ? englishSets[question.english_set_id] : undefined;
              const letters = getAllowedLetters(part);
              const number = getEnglishNumber(question, index + 1, setInfo);
              const selected = answers[index] ?? 0;

              return (
                <div key={question.id} className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900">{number}.</p>
                    <p className="text-[10px] text-slate-500">Parte {part}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {letters.map((letter) => {
                      const optionNumber = letter.charCodeAt(0) - 64;
                      const active = selected === optionNumber;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => onAnswer(index, optionNumber)}
                          aria-label={`Pregunta ${number}, respuesta ${letter}`}
                          aria-pressed={active}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-400 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700"}`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {answeredCount} de {questions.length} respuestas marcadas. Puedes volver al cuadernillo para revisar el enunciado sin perder tus selecciones.
          </div>
          <footer className="mt-5 flex items-center justify-between border-t border-slate-300 pt-3 text-[9px] text-slate-500">
            <span>PeakScore · Hoja de respuestas</span>
            <span>Página {totalPages} de {totalPages}</span>
          </footer>
        </section>
      )}

      <div className="flex flex-col gap-3 border border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        {isAnswerSheetPage || !isEnglishSimulation ? (
          <>
            <p className="text-sm text-slate-600">Revisa tus respuestas antes de finalizar. Las preguntas sin marcar quedarán como omitidas.</p>
            <button type="button" disabled={saving} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Guardando..." : "Finalizar simulacro"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Cuando termines de revisar el cuadernillo, pasa a la hoja de respuestas para marcar tus opciones.</p>
            <button type="button" onClick={() => setCurrentPage(totalPages)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
              Ir a la hoja de respuestas <ChevronRight size={16}/>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

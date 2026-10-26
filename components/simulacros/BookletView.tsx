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
  simulationTitle?: string;
};

function isHistorical(simulationTitle: string | undefined, setInfo?: EnglishSetDisplay) {
  if (simulationTitle?.toLowerCase().includes("histórico")) return true;
  return setInfo?.booklet_format === "historical";
}

function getEnglishNumber(
  question: Question,
  fallback: number,
  setInfo: EnglishSetDisplay | undefined,
  historical: boolean,
) {
  const part = question.english_part;
  const position = question.english_position;
  if (!part || !position) return fallback;

  const title = setInfo?.title ?? question.component ?? "";
  if (part === 1) return 79 + position;
  if (part === 2) return 84 + position;
  if (part === 3) return 89 + position;
  if (part === 4) {
    if (/^4B\b/i.test(title)) return 104 + position;
    return (historical ? 96 : 94) + position;
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
  simulationTitle,
}: Props) {
  const questionsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const isEnglishSimulation = questions.some((question) => Boolean(question.english_part));
  const questionPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const totalPages = questionPages + (isEnglishSimulation ? 1 : 0);
  const isAnswerSheetPage = isEnglishSimulation && currentPage > questionPages;
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = isAnswerSheetPage
    ? []
    : questions.slice(startIndex, startIndex + questionsPerPage);

  const firstQuestion = questions[0];
  const firstSet = firstQuestion?.english_set_id
    ? englishSets[firstQuestion.english_set_id]
    : undefined;
  const englishPart = firstQuestion?.english_part ?? 0;
  const historical = isHistorical(simulationTitle, firstSet);
  const currentSectionName =
    englishPart === 1 ? "Parte 1. Descripciones y banco de palabras" :
    englishPart === 2 ? "Parte 2. Avisos y situaciones" :
    englishPart === 3 ? "Parte 3. Conversaciones cotidianas" :
    englishPart === 4 ? (/^4B\b/i.test(firstSet?.title ?? "") ? "Parte 4B. Completar espacios" : historical ? "Parte 4A. Completar espacios" : "Parte 4. Uso del idioma en contexto") :
    englishPart === 5 ? "Parte 5. Comprensión de lectura" :
    englishPart === 6 ? "Parte 6. Lectura inferencial" :
    englishPart === 7 ? (historical ? "Parte 7. Formato histórico" : /^7B\b/i.test(firstSet?.title ?? "") ? "Parte 7B. Formato Saber 11 · 2026" : "Parte 7A. Formato Saber 11 · 2026") : "Cuadernillo de práctica";

  const sectionQuestions = visibleQuestions;
  const wordBank = firstSet?.word_bank ?? [];
  const exampleWord = wordBank.find((word) => word.example);
  const hasEnglishSet = Boolean(isEnglishSimulation && firstSet);

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
            ? "Marca una sola burbuja por pregunta. Puedes cambiar las respuestas antes de finalizar."
            : isEnglishSimulation
              ? "Respeta el orden y la estructura de la sección seleccionada. Registra tus respuestas en la hoja al final."
              : "Lee cada pregunta y selecciona una respuesta. Puedes cambiarla antes de finalizar."}
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
            {isEnglishSimulation && currentPage === questionPages ? "Hoja de respuestas" : "Siguiente"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!isAnswerSheetPage && hasEnglishSet && englishPart === 1 && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-5 py-5 shadow-sm sm:px-8 sm:py-7">
          <header className="mb-5 border-b border-slate-200 pb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Inglés · Sesión {firstQuestion?.session}
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{firstSet?.shared_title || firstSet?.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {firstSet?.instructions || "Lee las descripciones de la columna de la izquierda. Elige la palabra de la derecha que corresponde a cada descripción. Usa el ejemplo como guía."}
            </p>
          </header>
          {exampleWord?.example_description && (
            <div className="mb-5 border-b-2 border-slate-900 pb-5">
              <p className="mb-3 text-center text-xs font-black uppercase tracking-widest">Ejemplo</p>
              <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
                <p className="font-serif text-sm leading-6"><strong>0.</strong> {exampleWord.example_description}</p>
                <div className="flex flex-wrap items-center gap-1 border border-slate-300 p-3 text-xs">
                  <strong className="mr-1">Respuesta 0.</strong>
                  {wordBank.map((word) => (
                    <span key={word.key} className={`flex h-6 w-6 items-center justify-center rounded-full border ${word.key === (exampleWord.example_answer ?? exampleWord.key) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300"}`}>{word.key}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-7 md:grid-cols-2">
            <section>
              <h4 className="mb-4 border-b border-slate-300 pb-3 text-center text-xs font-black uppercase tracking-wide">Descripciones</h4>
              <div className="space-y-0">
                {sectionQuestions.map((question, index) => {
                  const number = getEnglishNumber(question, index + 1, firstSet, historical);
                  return (
                    <div key={question.id} className="grid min-h-[58px] grid-cols-[2.5rem_minmax(0,1fr)] gap-2 border-b border-dotted border-slate-300 py-3">
                      <strong className="text-xs">{number}.</strong>
                      <p className="whitespace-pre-wrap font-serif text-sm leading-6 text-slate-900">{question.question}</p>
                    </div>
                  );
                })}
              </div>
            </section>
            <section>
              <h4 className="mb-4 border-b border-slate-300 pb-3 text-center text-xs font-black uppercase tracking-wide">Palabras</h4>
              <div className="space-y-0">
                {wordBank.map((word) => (
                  <div key={word.key} className={`flex min-h-[48px] items-start gap-3 border-b border-dotted border-slate-300 px-2 py-3 text-sm leading-6 ${word.example ? "font-bold underline decoration-2" : ""}`}>
                    <strong>{word.key}.</strong>
                    <span>{word.text}{word.example ? " (ejemplo)" : ""}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <footer className="mt-5 border-t border-slate-300 pt-3 text-[10px] text-slate-400">PeakScore · Material de práctica · Las respuestas correctas no se muestran en esta vista.</footer>
        </section>
      )}

      {!isAnswerSheetPage && hasEnglishSet && englishPart !== 1 && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-5 py-5 shadow-sm sm:px-8 sm:py-7">
          <header className="mb-5 border-b border-slate-200 pb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {firstQuestion?.session}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{firstSet?.shared_title || currentSectionName}</h3>
            {firstSet?.title && <p className="mt-1 text-sm text-slate-600">{firstSet.title}</p>}
            {firstSet?.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{firstSet.instructions}</p>}
          </header>

          {firstSet?.example_image_url && englishPart === 3 && (
            <div className="mb-5 flex justify-center border-b border-slate-300 pb-4">
              <img src={firstSet.example_image_url} alt="Ejemplo de la sección" className="max-h-60 max-w-full object-contain"/>
            </div>
          )}

          {firstSet?.example_prompt && (
            <div className="mb-5 border-b border-slate-300 pb-4">
              <p className="mb-2 text-center text-xs font-black uppercase tracking-widest">Ejemplo</p>
              <p className="whitespace-pre-wrap font-serif text-sm leading-6"><strong>0.</strong> {firstSet.example_prompt}</p>
              {firstSet.example_image_url && englishPart !== 3 && <img src={firstSet.example_image_url} alt="Imagen de ejemplo" className="mt-3 max-h-52 max-w-full object-contain"/>}
              {!!firstSet.example_options?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{firstSet.example_options.map((option) => <p key={option.key} className="text-sm"><strong>{option.key}.</strong> {option.text}</p>)}</div>}
              {firstSet.example_answer && <p className="mt-2 text-xs text-slate-500">Respuesta de ejemplo: {firstSet.example_answer}</p>}
            </div>
          )}

          {firstSet?.shared_image_url && (
            <div className="mb-5 flex justify-center">
              <img src={firstSet.shared_image_url} alt={firstSet.shared_title || firstSet.title} className="max-h-[560px] max-w-full object-contain"/>
            </div>
          )}
          {firstSet?.shared_text && (
            <div className="mb-5 whitespace-pre-wrap border-b border-slate-300 pb-5 font-serif text-sm leading-7 text-slate-900">
              {firstSet.shared_text}
            </div>
          )}

          {englishPart === 4 ? (
            <div className="space-y-0">
              {sectionQuestions.map((question, index) => {
                const number = getEnglishNumber(question, index + 1, firstSet, historical);
                const options = getOptions(question, englishPart);
                return (
                  <article key={question.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-slate-300 py-3">
                    <strong className="pt-1 text-xs">{number}.</strong>
                    <div>
                      {!question.question.toLowerCase().startsWith("completa el espacio") && <p className="mb-2 whitespace-pre-wrap font-serif text-sm">{question.question}</p>}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {options.map((option) => <p key={option.key} className="text-sm leading-6"><strong>{option.key}.</strong> {option.text}</p>)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : englishPart === 6 ? (
            <div className="grid gap-x-7 md:grid-cols-2">
              {sectionQuestions.map((question, index) => {
                const number = getEnglishNumber(question, index + 1, firstSet, historical);
                const options = getOptions(question, englishPart);
                return (
                  <article key={question.id} className="border-b border-slate-300 py-3">
                    <p className="font-serif text-sm leading-6"><strong>{number}.</strong> {question.question}</p>
                    <div className="mt-2 space-y-1">
                      {options.map((option) => <p key={option.key} className="text-sm leading-5"><strong>{option.key}.</strong> {option.text}</p>)}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={`grid gap-x-7 ${englishPart === 2 || englishPart === 3 || englishPart === 5 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {sectionQuestions.map((question, index) => {
                const number = getEnglishNumber(question, index + 1, firstSet, historical);
                const options = getOptions(question, englishPart);
                return (
                  <article key={question.id} className={`border-b border-slate-300 py-3 ${englishPart === 3 ? "min-h-[100px]" : ""}`}>
                    <div className={`grid gap-3 ${englishPart === 2 ? "sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "grid-cols-1"}`}>
                      <div>
                        {question.image_url && <img src={question.image_url} alt={`Recurso de la pregunta ${number}`} className={englishPart === 2 ? "mb-2 max-h-36 max-w-full object-contain" : "mb-2 max-h-64 max-w-full object-contain"}/>}
                        <p className="whitespace-pre-wrap font-serif text-sm leading-6"><strong>{number}.</strong> {question.question}</p>
                      </div>
                      <div className={`grid gap-2 ${englishPart === 5 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                        {options.map((option) => <p key={option.key} className="text-sm leading-5"><strong>{option.key}.</strong> {option.text}</p>)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <footer className="mt-5 border-t border-slate-300 pt-3 text-[10px] text-slate-400">PeakScore · Material de práctica · Las respuestas correctas no se muestran en esta vista.</footer>
        </section>
      )}

      {!isAnswerSheetPage && !hasEnglishSet && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-5 py-5 shadow-sm sm:px-8 sm:py-7">
          <header className="mb-5 border-b border-slate-200 pb-4">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PeakScore · Cuadernillo de práctica</p>
            <h3 className="mt-1 text-center text-xl font-black text-slate-950">Cuadernillo del simulacro</h3>
          </header>
          <div className="grid gap-x-7 md:grid-cols-2">
            {visibleQuestions.map((question, pageIndex) => {
              const index = startIndex + pageIndex;
              const selected = answers[index] ?? 0;
              const options = getOptions(question, 0);
              return (
                <article key={question.id} className="mb-4 border-b border-slate-200 pb-4">
                  <p className="font-serif text-sm leading-6"><strong>Pregunta {index + 1}.</strong> {question.question}</p>
                  {question.context_text && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{question.context_text}</p>}
                  {question.image_url && <img src={question.image_url} alt={`Recurso de la pregunta ${index + 1}`} className="mt-3 max-h-72 max-w-full object-contain"/>}
                  <div className="mt-3 space-y-2">
                    {options.map((option) => {
                      const value = option.key.charCodeAt(0) - 64;
                      return (
                        <button key={option.key} type="button" onClick={() => onAnswer(index, value)} aria-pressed={selected === value} className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm ${selected === value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                          <strong>{option.key}.</strong><span>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {isAnswerSheetPage && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white p-5 shadow-sm sm:p-8">
          <header className="mb-5 border-b-2 border-slate-900 pb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Saber 11 · Inglés</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Hoja de respuestas</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">Marca una sola burbuja por pregunta. Las letras disponibles corresponden a cada parte.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {questions.map((question, index) => {
              const part = question.english_part ?? 0;
              const setInfo = question.english_set_id ? englishSets[question.english_set_id] : undefined;
              const letters = getAllowedLetters(part);
              const number = getEnglishNumber(question, index + 1, setInfo, historical);
              const selected = answers[index] ?? 0;
              return (
                <div key={question.id} className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900">{number}.</p>
                    <p className="text-[10px] text-slate-500">{currentSectionName}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {letters.map((letter) => {
                      const optionNumber = letter.charCodeAt(0) - 64;
                      const active = selected === optionNumber;
                      return (
                        <button key={letter} type="button" onClick={() => onAnswer(index, optionNumber)} aria-label={`Pregunta ${number}, respuesta ${letter}`} aria-pressed={active} className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-400 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700"}`}>
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
            {answeredCount} de {questions.length} respuestas marcadas. Puedes volver al cuadernillo para revisar los enunciados sin perder tus selecciones.
          </div>
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

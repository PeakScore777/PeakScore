"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/services/question.service";

type Word = {
  key: string;
  text: string;
  example?: boolean;
  example_description?: string;
  example_answer?: string;
};
type Option = { key: string; text: string };
type FormatFilter = "saber11_2026" | "historical" | "custom_review";

type EnglishSetDisplay = {
  id?: string;
  title: string;
  shared_title: string | null;
  booklet_format: string;
  part: number;
  shared_text: string | null;
  shared_image_url?: string | null;
  instructions: string | null;
  word_bank: Word[] | null;
  example_prompt: string | null;
  example_options: Option[] | null;
  example_image_url: string | null;
  example_answer: string | null;
  status?: string;
  session?: number;
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

function getBankQuestionNumber(
  set: EnglishSetDisplay,
  question: Question,
  index: number,
  filter: FormatFilter,
): number {
  const position = question.english_position ?? index + 1;
  if (set.booklet_format === "custom_review") {
    return question.question_number ?? 114 + position;
  }

  const historicalView = filter === "historical" ||
    (filter === "historical" && set.booklet_format === "historical");

  switch (set.part) {
    case 1: return 79 + position;
    case 2: return 84 + position;
    case 3: return 89 + position;
    case 4:
      if (set.title.startsWith("4B")) return 104 + position;
      return (historicalView ? 96 : 94) + position;
    case 5: return (historicalView ? 112 : 102) + position;
    case 6: return (historicalView ? 119 : 109) + position;
    case 7:
      if (historicalView || set.title.startsWith("7B")) return 124 + position;
      return 114 + position;
    default: return question.question_number ?? position;
  }
}

function getAllowedLetters(set: EnglishSetDisplay): string[] {
  if ((set.word_bank ?? []).length > 0) return ["A", "B", "C", "D", "E", "F", "G"];
  if (set.part === 6 || set.part === 7) return ["A", "B", "C", "D"];
  return ["A", "B", "C"];
}

function getOptions(question: Question): Option[] {
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
  ].filter((option) => Boolean(option.text?.trim()) && option.text !== "N/A");
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
  const firstQuestion = questions[0];
  const firstSet = firstQuestion?.english_set_id
    ? englishSets[firstQuestion.english_set_id]
    : undefined;
  const isEnglishSimulation = questions.some((question) => Boolean(question.english_part));
  const formatFilter: FormatFilter =
    simulationTitle?.toLowerCase().includes("histórico") ||
    simulationTitle?.toLowerCase().includes("historico")
      ? "historical"
      : firstSet?.booklet_format === "historical"
        ? "historical"
        : "saber11_2026";

  const questionsPerPage = 10;
  const questionPages = isEnglishSimulation
    ? 1
    : Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const totalPages = questionPages + (isEnglishSimulation ? 1 : 0);
  const [currentPage, setCurrentPage] = useState(1);
  const isAnswerSheetPage = isEnglishSimulation && currentPage > questionPages;
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = isAnswerSheetPage
    ? []
    : isEnglishSimulation
      ? questions
      : questions.slice(startIndex, startIndex + questionsPerPage);

  const allQuestions = questions;
  const qs = firstSet?.part === 3 && formatFilter === "saber11_2026"
    ? allQuestions.slice(0, 5)
    : allQuestions;
  const words = firstSet?.word_bank ?? [];
  const group = formatFilter === "historical" && firstSet?.part === 7
    ? undefined
    : firstSet?.title.match(/^((?:4|7)[AB])\s*[·—-]/)?.[1] ??
      (formatFilter === "historical" && firstSet?.part === 4 ? "4A" : undefined);
  const isWordBankSet = words.length > 0;
  const displayPart = isWordBankSet ? 1 : firstSet?.part ?? 0;
  const partNames: Record<number, string> = {
    1: "Descripciones y banco de palabras",
    2: "Avisos y lugares",
    3: "Completar conversaciones",
    4: "Completar espacios",
    5: "Comprensión de lectura",
    6: "Comprensión de lectura",
    7: "Completar espacios",
  };
  const displayPartName = isWordBankSet
    ? "Descripciones y banco de palabras"
    : (partNames[displayPart] ?? "Inglés");
  const displayPartTitle = firstSet?.part === 7
    ? (formatFilter === "historical"
      ? "Parte 7"
      : `Parte ${group ?? (firstSet.title.startsWith("7B") ? "7B" : "7A")}`)
    : `${group ? `Parte ${group}` : `Parte ${displayPart}`} · ${displayPartName}`;
  const displayFormatLabel = formatFilter === "historical"
    ? firstSet?.booklet_format === "historical"
      ? "Formato histórico"
      : "Formato histórico · contenido compartido"
    : firstSet?.booklet_format === "custom_review"
      ? "Revisión requerida"
      : "Formato Saber 11 · 2026";
  const displayInstructions = firstSet?.part === 3
    ? formatFilter === "historical"
      ? "Completa las siete conversaciones. En las preguntas 90–96, marca A, B o C en tu hoja de respuestas."
      : "Completa las cinco conversaciones. En las preguntas 90–94, marca A, B o C en tu hoja de respuestas."
    : firstSet?.part === 4
      ? firstSet.title.startsWith("4B")
        ? "Lee el texto y selecciona la palabra que mejor completa cada espacio. En las preguntas 105–112, marca A, B o C."
        : formatFilter === "historical"
          ? "Lee el texto y selecciona la palabra que mejor completa cada espacio. En las preguntas 97–104, marca A, B o C."
          : "Lee el texto y selecciona la palabra que mejor completa cada espacio. En las preguntas 95–102, marca A, B o C."
    : firstSet?.part === 5
      ? formatFilter === "historical"
        ? "Lee el texto y responde las preguntas. En las preguntas 113–119, marca A, B o C en tu hoja de respuestas."
        : "Lee el texto y responde las preguntas. En las preguntas 103–109, marca A, B o C en tu hoja de respuestas."
    : firstSet?.part === 6
      ? formatFilter === "historical"
        ? "Lee el texto y responde las preguntas. En las preguntas 120–124, marca A, B, C o D en tu hoja de respuestas."
        : "Lee el texto y responde las preguntas. En las preguntas 110–114, marca A, B, C o D en tu hoja de respuestas."
    : firstSet?.part === 7
      ? formatFilter === "historical"
        ? "Lee el texto y selecciona la palabra que completa cada espacio. En las preguntas 125–134, marca A, B, C o D."
        : firstSet.title.startsWith("7B")
          ? "Lee el texto y selecciona la palabra que completa cada espacio. En las preguntas 125–134, marca A, B, C o D."
          : "Lee el texto y selecciona la palabra que completa cada espacio. En las preguntas 115–124, marca A, B, C o D."
      : firstSet?.instructions;

  const showEnglishBankLayout = Boolean(isEnglishSimulation && firstSet);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      <section className="border border-slate-300 bg-white px-5 py-3 shadow-sm sm:px-7 sm:py-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PeakScore · Cuadernillo de práctica</p>
        <h2 className="mt-1 text-center text-xl font-black text-slate-950">
          {isAnswerSheetPage ? "Hoja de respuestas · Inglés" : "Cuadernillo del simulacro"}
        </h2>
        <p className="mx-auto mt-1 max-w-2xl text-xs leading-4 text-slate-600">
          {isAnswerSheetPage
            ? "Marca una sola burbuja por pregunta. Puedes cambiar tus respuestas antes de finalizar."
            : isEnglishSimulation
              ? "Resuelve la parte con la misma estructura del banco de preguntas y registra tus respuestas en la hoja al final."
              : "Lee cada pregunta y marca una sola respuesta. Puedes cambiarla antes de finalizar."}
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
            : isEnglishSimulation
              ? `Cuadernillo · Parte ${displayPartTitle.replace(/^Parte\s*/i, "")}`
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

      {!isAnswerSheetPage && showEnglishBankLayout && (
        <article className={`mx-auto ${firstSet!.part === 6 ? "" : "min-h-[297mm]"} w-full max-w-[210mm] overflow-hidden border border-slate-300 bg-white shadow-sm ${firstSet!.part === 6 ? "" : "print:break-after-page"}`}>
          <div className="border-b border-slate-200 px-6 py-5 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {firstSet!.session ?? firstQuestion?.session ?? "2"}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{displayPartTitle}</h2>
                {![6, 7].includes(firstSet!.part) && <p className="mt-1 text-sm text-slate-600">{firstSet!.title}</p>}
              </div>
            </div>
            {firstSet!.booklet_format === "custom_review" && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Revisión requerida: este texto no corresponde a un formato completo 2026 ni al histórico.</div>}
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{displayFormatLabel}</p>
            {displayInstructions && <p className="mt-5 text-sm font-medium leading-6 text-slate-700">{displayInstructions}</p>}
          </div>

          <div className={firstSet!.part === 6 ? "px-4 py-4 sm:px-5 sm:py-5" : "px-6 py-6 sm:px-10 sm:py-8"}>
            {firstSet!.part === 6 && firstSet!.shared_text ? (
              <section className="mb-3 rounded-xl border-2 border-slate-900 px-3 py-3 sm:px-4">
                <p className="whitespace-pre-wrap font-serif text-[10px] leading-[1.35] text-slate-900">{firstSet!.shared_text}</p>
              </section>
            ) : firstSet!.part === 5 && firstSet!.shared_text ? (
              <section className="mb-5 rounded-xl border-2 border-slate-900 px-5 py-5">
                {firstSet!.shared_title && <h3 className="mb-4 text-center text-lg font-black uppercase tracking-wide">{firstSet!.shared_title}</h3>}
                <div className={firstSet!.shared_image_url ? "grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(150px,0.42fr)]" : ""}>
                  <p className="whitespace-pre-wrap font-serif text-[13px] leading-6 text-slate-900">{firstSet!.shared_text}</p>
                  {firstSet!.shared_image_url && <div className="flex justify-center md:justify-end"><img src={firstSet!.shared_image_url} alt="Ilustración del texto de lectura" className="h-auto max-h-64 max-w-full object-contain"/></div>}
                </div>
              </section>
            ) : firstSet!.shared_image_url ? (
              <div className={`mb-5 flex justify-center ${[4, 5, 7].includes(firstSet!.part) ? "" : "border border-slate-900 p-3"}`}>
                <img src={firstSet!.shared_image_url} alt={firstSet!.part === 4 ? "Texto compartido de la Parte 4" : firstSet!.part === 5 ? "Imagen completa del texto de lectura" : "Imagen compartida del conjunto"} className="h-auto max-h-[560px] max-w-full object-contain" />
              </div>
            ) : firstSet!.shared_text ? (
              <div className={`mb-5 whitespace-pre-wrap font-serif text-[15px] leading-7 text-slate-900 ${firstSet!.part === 4 ? "" : "border border-slate-300 px-5 py-5"}`}>{firstSet!.shared_text}</div>
            ) : null}

            {words.length > 0 && (
              <div className="mb-7">
                {(() => {
                  const exampleWord = words.find((word) => word.example);
                  const exampleDescription = exampleWord?.example_description;
                  const exampleAnswer = exampleWord?.example_answer ?? exampleWord?.key;
                  return exampleDescription ? (
                    <div className="mb-6 border-b-2 border-slate-900 pb-5">
                      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                        <div className="flex gap-3"><strong>0.</strong><p className="whitespace-pre-wrap leading-6">{exampleDescription}</p></div>
                        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-slate-300 p-3">
                          <strong className="mr-2">Respuesta 0.</strong>
                          {words.map((word) => <span key={word.key} className={word.key === exampleAnswer ? "flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-900 text-xs font-bold text-white ring-2 ring-slate-300" : "flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600"}>{word.key}</span>)}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className={`grid gap-8 md:grid-cols-[1fr_0.9fr] ${isWordBankSet ? "mt-8" : ""}`}>
                  <div>
                    <h3 className="mb-4 border-b border-slate-300 pb-3 text-center text-sm font-black uppercase tracking-wide">Descripciones</h3>
                    <div className={isWordBankSet ? "space-y-8" : "space-y-3"}>
                      {qs.map((question, index) => (
                        <div key={question.id} className={`grid grid-cols-[3rem_1fr] gap-3 border-b border-dotted border-slate-300 ${isWordBankSet ? "min-h-[90px] pb-5 pt-2" : "pb-3"}`}>
                          <strong>{(displayPart === 1 ? 80 : 85) + index}.</strong>
                          <p className={`whitespace-pre-wrap ${isWordBankSet ? "text-sm leading-7" : "leading-6"}`}>{question.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-4 border-b border-slate-300 pb-3 text-center text-sm font-black uppercase tracking-wide">Palabras</h3>
                    <div className={isWordBankSet ? "space-y-8" : "space-y-3"}>
                      {words.map((word) => <div key={word.key} className={`flex min-h-[42px] items-start gap-3 rounded-sm px-2 py-2 ${isWordBankSet ? "text-sm leading-6" : ""} ${word.example ? "font-bold underline decoration-2" : ""}`}><strong>{word.key}.</strong><span>{word.text}{word.example ? " (ejemplo)" : ""}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!words.length && firstSet!.part === 3 && firstSet!.example_image_url && (
              <div className="mb-5 border-b border-slate-900 pb-5">
                <div className="flex justify-center"><img src={firstSet!.example_image_url} alt="Ejemplo ilustrado de conversación" className="max-h-64 max-w-full object-contain" /></div>
              </div>
            )}

            {!words.length && firstSet!.part === 4 && (
              <div className="mb-3 border-b border-slate-900 pb-3">
                <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[10px] leading-4">
                  <strong>0.</strong>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
                    {(firstSet!.example_options ?? []).map((option) => <div key={option.key} className="flex gap-1"><strong>{option.key}.</strong><span>{option.text}</span></div>)}
                  </div>
                  <div className="inline-flex items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${firstSet!.example_answer ?? "sin respuesta marcada"}`}>
                    <span className="mr-1 font-semibold">Respuesta 0.</span>
                    {["A", "B", "C"].map((key) => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${firstSet!.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                  </div>
                </div>
              </div>
            )}

            {!words.length && firstSet!.part !== 3 && firstSet!.part !== 4 && firstSet!.part !== 6 && firstSet!.part !== 7 && firstSet!.example_prompt && (
              <div className={`mb-3 border-b border-slate-900 pb-3 ${firstSet!.part === 2 ? "text-[10px] leading-4" : ""}`}>
                <div className={`grid gap-2 ${firstSet!.part === 2 ? "grid-cols-[1rem_minmax(0,1fr)] sm:grid-cols-[1.5rem_minmax(0,1fr)]" : "md:grid-cols-[3.5rem_1fr]"}`}>
                  <strong className="pt-1">0.</strong>
                  <div className={firstSet!.part === 5 ? "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:gap-5" : firstSet!.part === 2 ? "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-4" : ""}>
                    <div>
                      {firstSet!.part !== 5 && firstSet!.example_image_url && <img src={firstSet!.example_image_url} alt="Imagen del ejemplo" className={firstSet!.part === 2 ? "mb-1 h-auto max-h-20 w-fit max-w-full object-contain" : "mb-4 max-h-64 max-w-full object-contain"} />}
                      <p className="whitespace-pre-wrap font-serif text-[11px] leading-4">{firstSet!.example_prompt}</p>
                    </div>
                    <div>
                      {!!firstSet!.example_options?.length && (
                        <div className={`grid gap-x-3 gap-y-1 ${firstSet!.part === 2 ? "grid-cols-1" : firstSet!.example_options.length > 2 ? "sm:grid-cols-2" : ""}`}>
                          {firstSet!.example_options.map((option) => <div key={option.key} className="flex gap-1 text-[10px] leading-4"><strong>{option.key}.</strong><span>{option.text}</span></div>)}
                        </div>
                      )}
                      {[2, 3, 4, 5, 7].includes(firstSet!.part) && (
                        <div className="mt-2 inline-flex items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${firstSet!.example_answer ?? "sin respuesta marcada"}`}>
                          <span className="mr-1 font-semibold">0.</span>
                          {(firstSet!.part === 7 ? ["A", "B", "C", "D"] : ["A", "B", "C"]).map((key) => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${firstSet!.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!words.length && firstSet!.part === 7 ? (
              <section className="mt-2">
                <div className="mb-2 border-b-2 border-slate-900 pb-3">
                  <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 text-[10px] leading-4">
                    <strong>0.</strong>
                    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">{(firstSet!.example_options ?? []).map((option) => <p key={option.key}><strong>{option.key}.</strong> {option.text}</p>)}</div>
                      <div className="inline-flex h-fit items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${firstSet!.example_answer ?? "sin respuesta marcada"}`}>
                        <strong className="mr-1">Respuesta 0.</strong>
                        {["A", "B", "C", "D"].map((key) => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${firstSet!.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-0">
                  {qs.map((question, index) => {
                    const options = getOptions(question);
                    const number = getBankQuestionNumber(firstSet!, question, index, formatFilter);
                    return (
                      <div key={question.id} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 border-b border-slate-400 py-2 last:border-0">
                        <strong className="pt-0.5 text-[10px]">{number}.</strong>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] leading-4 sm:grid-cols-4">
                          {["A", "B", "C", "D"].map((key) => <p key={key}><strong>{key}.</strong> {options.find((item) => item.key === key)?.text ?? ""}</p>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : !words.length && firstSet!.part === 6 ? (
              <section className="mt-2">
                <div className="space-y-0">
                  {[[0, 2], [1, 3]].map((pair, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-slate-400 py-2 md:grid-cols-2">
                      {pair.map((questionIndex) => {
                        const question = qs[questionIndex];
                        if (!question) return null;
                        const options = getOptions(question);
                        const number = getBankQuestionNumber(firstSet!, question, questionIndex, formatFilter);
                        return (
                          <div key={question.id} className="grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start gap-2">
                            <p className="text-[10px] leading-[1.35]"><strong>{number}.</strong> {question.question}</p>
                            <div className="space-y-0.5">{options.map((option) => <p key={option.key} className="text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text}</p>)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {qs[4] && (() => {
                  const question = qs[4];
                  const options = getOptions(question);
                  const number = getBankQuestionNumber(firstSet!, question, 4, formatFilter);
                  return (
                    <article className="mt-2 border-t-2 border-slate-900 pt-2">
                      <p className="text-[11px] leading-4"><strong>{number}.</strong> {question.question}</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{options.map((option) => <div key={option.key} className="min-h-12 border border-slate-500 px-2 py-2 text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text}</div>)}</div>
                    </article>
                  );
                })()}
              </section>
            ) : !words.length ? (
              <div className={firstSet!.part === 2 ? "space-y-0" : firstSet!.part === 3 ? "space-y-0" : "space-y-7"}>
                {qs.map((question, index) => {
                  const options = getOptions(question);
                  const questionNumber = getBankQuestionNumber(firstSet!, question, index, formatFilter);
                  return (
                    <div key={question.id} className={`grid gap-2 border-b border-slate-300 last:border-0 ${firstSet!.part === 4 ? "grid-cols-[2rem_minmax(0,1fr)] items-center py-2" : firstSet!.part === 5 ? "grid-cols-[1.5rem_minmax(0,1fr)] py-2" : `pb-3 pt-2 ${firstSet!.part === 2 ? "text-[10px] leading-4 sm:grid-cols-[1.5rem_minmax(0,1fr)]" : "md:grid-cols-[2rem_minmax(0,1fr)]"} ${firstSet!.part === 3 ? "min-h-[72px] pb-3 pt-3" : ""}`}`}>
                      <strong className="pt-1 text-[11px]">{questionNumber}.</strong>
                      {firstSet!.part === 4 ? (
                        <div className="grid grid-cols-3 items-start gap-x-3 text-sm leading-5">
                          {["A", "B", "C"].map((key) => {
                            const option = options.find((item) => item.key === key);
                            return <div key={key} className="flex min-w-0 items-start gap-1"><strong className="shrink-0">{key}.</strong><span className="break-words">{option?.text ?? ""}</span></div>;
                          })}
                        </div>
                      ) : (
                        <div className={firstSet!.part === 5 ? "grid grid-cols-1 gap-8 md:gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" : firstSet!.part === 2 || firstSet!.part === 3 ? "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-4" : ""}>
                          <div>
                            {question.image_url && <img src={question.image_url} alt={`Imagen de la pregunta ${index + 1}`} className={firstSet!.part === 2 ? "mb-1 h-auto max-h-20 w-fit max-w-full object-contain" : "mb-4 max-h-72 max-w-full object-contain"}/>}
                            <p className={`whitespace-pre-wrap font-serif ${firstSet!.part === 2 ? "text-[10px] leading-4" : firstSet!.part === 5 ? "text-[13px] leading-5" : "text-[15px] leading-7"}`}>{question.question}</p>
                          </div>
                          <div>{options.length > 0 && <div className={`grid grid-cols-1 ${firstSet!.part === 5 ? "gap-y-1" : "gap-y-2"}`}>{options.map((option) => <div key={option.key} className={`flex gap-2 ${firstSet!.part === 2 ? "text-[10px] leading-4" : firstSet!.part === 5 ? "text-xs leading-4" : "text-sm leading-6"}`}><strong>{option.key}.</strong><span>{option.text}</span></div>)}</div>}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className={firstSet!.part === 6 ? "mt-3 border-t border-slate-300 pt-2 text-[9px] text-slate-400" : "mt-5 border-t border-slate-300 pt-3 text-xs text-slate-400"}>PeakScore · Material de práctica · Las respuestas correctas no se muestran en esta vista.</div>
          </div>
        </article>
      )}

      {!isAnswerSheetPage && !showEnglishBankLayout && (
        <section className="mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            {visibleQuestions.map((question, pageIndex) => {
              const index = startIndex + pageIndex;
              const selected = answers[index] ?? 0;
              const options = getOptions(question);
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{formatFilter === "historical" ? "Formato histórico · Inglés" : "Saber 11 · Inglés"}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Hoja de respuestas</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">Marca una sola burbuja por pregunta. Las letras disponibles corresponden a la parte seleccionada.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {questions.map((question, index) => {
              const setInfo = question.english_set_id ? englishSets[question.english_set_id] : undefined;
              const letters = setInfo ? getAllowedLetters(setInfo) : ["A", "B", "C", "D"];
              const number = setInfo ? getBankQuestionNumber(setInfo, question, index, formatFilter) : index + 1;
              const selected = answers[index] ?? 0;
              return (
                <div key={question.id} className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900">{number}.</p>
                    <p className="text-[10px] text-slate-500">{setInfo ? displayPartTitle : "Pregunta"}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {letters.map((letter) => {
                      const optionNumber = letter.charCodeAt(0) - 64;
                      const active = selected === optionNumber;
                      return <button key={letter} type="button" onClick={() => onAnswer(index, optionNumber)} aria-label={`Pregunta ${number}, respuesta ${letter}`} aria-pressed={active} className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-slate-400 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700"}`}>{letter}</button>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">{answeredCount} de {questions.length} respuestas marcadas. Puedes volver al cuadernillo sin perder tus selecciones.</div>
        </section>
      )}

      <div className="flex flex-col gap-3 border border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        {isAnswerSheetPage || !isEnglishSimulation ? (
          <>
            <p className="text-sm text-slate-600">Revisa tus respuestas antes de finalizar. Las preguntas sin marcar quedarán como omitidas.</p>
            <button type="button" disabled={saving} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Finalizar simulacro"}</button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">Cuando termines de revisar el cuadernillo, pasa a la hoja de respuestas para marcar tus opciones.</p>
            <button type="button" onClick={() => setCurrentPage(totalPages)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800">Ir a la hoja de respuestas <ChevronRight size={16}/></button>
          </>
        )}
      </div>
    </div>
  );
}

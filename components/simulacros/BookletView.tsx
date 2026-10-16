"use client";

import type { Question } from "@/lib/services/question.service";

type EnglishSetDisplay = {
  title: string;
  part: number;
  shared_text: string | null;
  instructions: string | null;
  word_bank: Array<{ key: string; text: string; example?: boolean }> | null;
  example_prompt: string | null;
  example_options: Array<{ key: string; text: string }> | null;
  example_image_url: string | null;
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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="border border-slate-300 bg-white px-6 py-6 shadow-sm sm:px-10">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">PeakScore · Cuadernillo de práctica</p>
        <h2 className="mt-2 text-center text-2xl font-black text-slate-950">Cuadernillo del simulacro</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Lee cada sección y marca una sola respuesta por pregunta. Puedes cambiarla antes de entregar.</p>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-sm font-bold text-slate-600">
          <span>{answeredCount} de {questions.length} respondidas</span>
          <span>{questions.length - answeredCount} pendientes</span>
        </div>
      </section>
      {questions.map((question, index) => {
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
        const showSharedText = firstInSet && Boolean(setInfo?.shared_text || question.context_text);
        const wordBank = firstInSet ? setInfo?.word_bank ?? [] : [];

        return (
          <article key={question.id} id={`booklet-question-${index}`} className={`scroll-mt-28 border border-slate-300 bg-white px-5 py-5 shadow-sm sm:px-8 ${isEnglish ? "sm:py-6" : "sm:py-8"}`}>
            {firstInSet && setInfo && (
              <header className="mb-5 border-b border-slate-300 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {question.session}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{setInfo.title}</h3>
                {setInfo.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{setInfo.instructions}</p>}
                {showPart3Example && (
                  <div className="mt-4">
                    <p className="mb-2 text-center text-xs font-black uppercase tracking-widest">Ejemplo</p>
                    <div className="flex justify-center">
                      <img src={setInfo.example_image_url!} alt="Ejemplo ilustrado de conversación" className="max-h-64 max-w-full object-contain" />
                    </div>
                  </div>
                )}
                {setInfo.example_image_url && part !== 3 && (
                  <div className="mt-4 flex justify-center">
                    <img src={setInfo.example_image_url} alt="Imagen del ejemplo" className="max-h-64 max-w-full object-contain" />
                  </div>
                )}
              </header>
            )}
            {showSharedText && (
              <div className="mb-5 whitespace-pre-wrap border border-slate-300 px-4 py-4 font-serif text-[15px] leading-7 text-slate-900">
                {setInfo?.shared_text ?? question.context_text}
              </div>
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
                <div className={`mt-3 grid gap-x-6 ${stacked ? "grid-cols-1 gap-y-2" : "sm:grid-cols-2 gap-y-3"}`}>
                  {options.map(({ text, optionIndex }) => {
                    const optionNumber = optionIndex + 1;
                    const active = selected === optionNumber;
                    return (
                      <button key={optionIndex} type="button" onClick={() => onAnswer(index, optionNumber)} aria-pressed={active} className={`flex items-start gap-2 border px-3 py-2.5 text-left transition ${stacked ? "min-h-10" : "p-4"} ${active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-300 hover:border-slate-500 hover:bg-slate-50"}`}>
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
      <div className="flex flex-col gap-3 border border-slate-300 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Revisa tus respuestas antes de finalizar. Las preguntas sin marcar quedarán como omitidas.</p>
        <button type="button" disabled={saving} onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Finalizar simulacro"}</button>
      </div>
    </div>
  );
}

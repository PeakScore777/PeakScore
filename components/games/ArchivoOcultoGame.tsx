"use client";

import { FlipBook, Page } from "@openpageflip/react";
import type { Book } from "@openpageflip/core";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Feather, RotateCcw, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchivoQuestion, ArchivoReading } from "@/lib/games/archivo-oculto-bank";

type PublicQuestion = Omit<ArchivoQuestion, "answer" | "explanation">;
type Phase = "loading" | "cover" | "playing" | "finished";
type AnswerFeedback = {
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};

function BookPaper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f2e5ca] text-[#302313] " + className}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(110,76,38,.16) 0, rgba(110,76,38,.16) 1px, transparent 1px, transparent 5px), radial-gradient(ellipse at 15% 8%, rgba(255,255,255,.9), transparent 45%)",
      }} />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[9px] font-bold uppercase tracking-[.17em] text-[#957044]">{children}</span>;
}

export default function ArchivoOcultoGame() {
  const bookRef = useRef<Book>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [readings, setReadings] = useState<ArchivoReading[]>([]);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bookPage, setBookPage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, AnswerFeedback>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ games_completed: number; best_score: number; best_correct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handheld, setHandheld] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setHandheld(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/games/archivo-oculto/questions", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/games/progress?gameKey=archivo-oculto", { credentials: "same-origin", cache: "no-store" }),
    ]).then(async ([contentResponse, progressResponse]) => {
      const content = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) throw new Error(content.error ?? "No se pudo cargar el libro.");
      if (!Array.isArray(content.readings) || !Array.isArray(content.questions) || content.questions.length !== 10) {
        throw new Error("El archivo no tiene sus diez preguntas disponibles.");
      }
      if (!active) return;
      setReadings(content.readings as ArchivoReading[]);
      setQuestions(content.questions as PublicQuestion[]);
      const progressData = await progressResponse.json().catch(() => ({}));
      if (active && progressResponse.ok && progressData.progress) {
        setProgress({
          games_completed: Number(progressData.progress.games_completed) || 0,
          best_score: Number(progressData.progress.best_score) || 0,
          best_correct: Number(progressData.progress.best_correct) || 0,
        });
      }
      if (active) setPhase("cover");
    }).catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : "No se pudo abrir El Archivo Oculto.");
        setPhase("cover");
      }
    });
    return () => { active = false; };
  }, []);

  const currentQuestion = questions[questionIndex] ?? null;
  const currentReading = useMemo(
    () => readings.find((reading) => reading.id === currentQuestion?.readingId) ?? readings[0] ?? null,
    [currentQuestion, readings],
  );
  const feedback = currentQuestion ? feedbackById[currentQuestion.id] ?? null : null;
  const correctCount = Object.values(feedbackById).filter((answer) => answer.isCorrect).length;
  const answeredCount = Object.keys(feedbackById).length;
  const score = correctCount * 100;
  const textPageIndex = 1 + questionIndex * 2;

  const handleFlip = useCallback((event: { page: number }) => {
    setBookPage(event.page);
    if (event.page > 0 && questions.length) {
      const index = Math.min(questions.length - 1, Math.max(0, Math.floor((event.page - 1) / 2)));
      setQuestionIndex(index);
      setSelectedOption(feedbackById[questions[index]?.id]?.selectedOption ?? null);
    }
  }, [feedbackById, questions]);

  const startBook = useCallback(async () => {
    if (starting || questions.length !== 10) return;
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/games/archivo-oculto/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.sessionId !== "string") {
        throw new Error(payload.error ?? "No se pudo iniciar la lectura.");
      }
      setSessionId(payload.sessionId);
      setPhase("playing");
      setQuestionIndex(0);
      setSelectedOption(null);
      setFeedbackById({});
      window.requestAnimationFrame(() => {
        bookRef.current?.flipTo(1);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir el expediente.");
    } finally {
      setStarting(false);
    }
  }, [questions.length, starting]);

  const submitAnswer = useCallback(async () => {
    if (!sessionId || !currentQuestion || selectedOption === null || savingAnswer || feedback) return;
    setSavingAnswer(true);
    setError(null);
    try {
      const response = await fetch("/api/games/archivo-oculto/answer", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, selectedOption }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Number.isInteger(payload.correctOption) || typeof payload.explanation !== "string") {
        throw new Error(payload.error ?? "No se pudo validar tu respuesta.");
      }
      setFeedbackById((previous) => ({
        ...previous,
        [currentQuestion.id]: {
          selectedOption,
          correctOption: Number(payload.correctOption),
          isCorrect: Boolean(payload.isCorrect),
          explanation: payload.explanation,
        },
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar tu respuesta.");
    } finally {
      setSavingAnswer(false);
    }
  }, [currentQuestion, feedback, savingAnswer, selectedOption, sessionId]);

  const goToQuestion = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(questions.length - 1, index));
    setQuestionIndex(safeIndex);
    setSelectedOption(feedbackById[questions[safeIndex]?.id]?.selectedOption ?? null);
    bookRef.current?.flipTo(1 + safeIndex * 2);
  }, [feedbackById, questions]);

  const finishBook = useCallback(async () => {
    if (!sessionId || answeredCount !== 10 || finishing) {
      setError("Responde las diez preguntas antes de cerrar el expediente.");
      return;
    }
    setFinishing(true);
    setError(null);
    try {
      const completionResponse = await fetch("/api/games/archivo-oculto/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const completed = await completionResponse.json().catch(() => ({}));
      if (!completionResponse.ok || !completed.completion?.progress) {
        throw new Error(completed.error ?? "No se pudo registrar el cierre de la lectura.");
      }

      const claimResponse = await fetch("/api/games/archivo-oculto/claim", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const claim = await claimResponse.json().catch(() => ({}));
      if (!claimResponse.ok) throw new Error(claim.error ?? "No se pudo validar la recompensa.");
      if (claim.reward?.claimed) {
        setRewardMessage("Has recibido +" + claim.reward.xpAwarded + " EXP y +" + claim.reward.coinsAwarded + " PeakCoins.");
      } else if (claim.reward?.alreadyClaimed) {
        setRewardMessage("Ya habías recibido la recompensa de este expediente. Tu resultado quedó guardado.");
      } else {
        setRewardMessage(correctCount >= 7
          ? "Tu resultado quedó registrado."
          : "Necesitas al menos 7 respuestas correctas para obtener la recompensa especial. ¡Puedes volver a practicar!");
      }
      setProgress({
        games_completed: Number(completed.completion.progress.games_completed) || 0,
        best_score: Number(completed.completion.progress.best_score) || score,
        best_correct: Number(completed.completion.progress.best_correct) || correctCount,
      });
      setPhase("finished");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el resultado.");
    } finally {
      setFinishing(false);
    }
  }, [answeredCount, correctCount, finishing, score, sessionId]);

  const restartBook = useCallback(() => {
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackById({});
    setSessionId(null);
    setError(null);
    setRewardMessage(null);
    setBookPage(0);
    setPhase("cover");
  }, []);

  if (phase === "loading") {
    return (
      <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#17110c] px-5 text-[#f3e4c5]">
        <div className="flex items-center gap-3 border border-[#6e512d] bg-[#21170e] px-5 py-4 text-sm">
          <span className="h-2 w-2 animate-pulse bg-[#d5a34e]" /> Preparando el libro…
        </div>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#17110c] px-4 py-7 text-[#f4e6ca] sm:px-7 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/aprender/juegos" className="inline-flex items-center gap-2 text-xs font-bold text-[#cdbb9a] hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Todos los juegos
          </Link>
          <section className="mt-7 border-[5px] border-double border-[#9e7944] bg-[#21180f] p-6 shadow-[8px_8px_0_#090705] sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center border border-[#c7a66a] bg-[#332414] text-[#e7c88c]"><BookOpen className="h-8 w-8" /></div>
            <SmallLabel>Expediente 001 · Informe de lectura</SmallLabel>
            <h1 className="mt-3 text-center font-serif text-3xl font-bold sm:text-4xl">Lectura concluida</h1>
            <p className="mt-3 text-center text-sm text-[#d0bd9c]">Has terminado los dos textos y sus diez preguntas.</p>
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Aciertos</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{correctCount}<span className="text-sm text-[#bda67e]">/10</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Puntaje</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{score}<span className="text-sm text-[#bda67e]">/1000</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Respondidas</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{answeredCount}<span className="text-sm text-[#bda67e]">/10</span></p></div>
            </div>
            {rewardMessage && <p className="mt-6 border border-[#927342] bg-[#302315] p-4 text-center text-sm font-semibold text-[#f0d59c]">{rewardMessage}</p>}
            {error && <p role="alert" className="mt-4 border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
            <div className="mt-7">
              <h2 className="font-serif text-xl font-bold">Repasa tus respuestas</h2>
              <div className="mt-4 space-y-3">
                {questions.map((question, index) => {
                  const answer = feedbackById[question.id];
                  return (
                    <article key={question.id} className="border border-[#6a5233] bg-[#17120d] p-4">
                      <div className="flex items-start gap-2">
                        {answer?.isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#e9d6b1]">{index + 1}. {question.prompt}</p>
                          <p className="mt-2 text-xs leading-5 text-[#bba987]">{answer?.explanation ?? "Sin respuesta registrada."}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={restartBook} className="inline-flex min-h-11 items-center gap-2 border border-[#c6a46b] bg-[#392916] px-5 py-3 text-xs font-black text-[#f7e8c5] hover:bg-[#4c351b]"><RotateCcw className="h-4 w-4" /> Volver a practicar</button>
              <Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border border-[#a78655] px-5 py-3 text-xs font-bold text-[#d9c7a6] hover:bg-white/5">Salir del archivo <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="archivo-oculto relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#17110c] px-3 pb-8 pt-5 text-[#f2e3c5] sm:px-6 sm:pt-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50" style={{
        backgroundImage: "radial-gradient(ellipse at 50% 20%, rgba(147,101,48,.22), transparent 56%), linear-gradient(180deg, #1c140d, #0e0b08)",
      }} />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex items-center gap-2 border border-[#6d512f] bg-[#21170f] px-3 py-2 text-xs font-bold text-[#d9c5a0] transition hover:border-[#c49a5b] hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Todos los juegos
          </Link>
          <div className="text-right">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-[#d1a762]">Lectura crítica · Saber 11</p>
            <h1 className="mt-1 font-serif text-xl font-bold tracking-wide text-[#f3e5c8] sm:text-2xl">EL ARCHIVO OCULTO</h1>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#d9c5a0]">{currentReading?.title ?? "Expedientes de lectura"}</p>
            <p className="mt-1 text-[10px] text-[#9e8865]">Expediente 001 · Pregunta {phase === "cover" ? 0 : questionIndex + 1} de 10 · {answeredCount}/10 respondidas</p>
          </div>
          <div className="h-1.5 w-28 overflow-hidden bg-[#4b3823] sm:w-44"><div className="h-full bg-[#d4a34f] transition-all" style={{ width: (answeredCount / 10 * 100) + "%" }} /></div>
        </div>

        {error && <p role="alert" className="mb-3 border border-rose-800/70 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">{error}</p>}

        <div className="overflow-hidden border-[6px] border-[#5e4325] bg-[#2c1d10] p-2 shadow-[0_25px_70px_rgba(0,0,0,.48),inset_0_0_0_2px_#b68a4d] sm:p-4">
          <FlipBook
            ref={bookRef}
            className="archivo-book mx-auto"
            width={440}
            height={590}
            size="stretch"
            minWidth={280}
            maxWidth={550}
            cover
            layout={handheld ? "single" : "auto"}
            binding={handheld ? "top" : "left"}
            flipDuration={850}
            shadowOpacity={0.42}
            page={bookPage}
            onFlip={handleFlip}
          >
            <Page density="hard" className="archivo-cover">
              <div className="flex h-full flex-col items-center justify-between border-[8px] border-double border-[#d2ad70] bg-[radial-gradient(ellipse_at_50%_35%,#76512b_0%,#382416_68%,#21150d_100%)] p-7 text-center text-[#f5e3bd]">
                <div className="w-full border-y border-[#d3b47d]/70 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#e1c18a]">PeakScore · Biblioteca de lectura</p>
                </div>
                <div>
                  <div className="mx-auto grid h-24 w-24 place-items-center border border-[#d2ad70] bg-[#1f150d]/70 text-[#e6c58e] shadow-[0_0_30px_rgba(0,0,0,.35)]">
                    <BookOpen className="h-12 w-12" strokeWidth={1.2} />
                  </div>
                  <p className="mt-7 font-mono text-[10px] uppercase tracking-[.3em] text-[#d9b981]">Colección de textos ICFES</p>
                  <h2 className="mt-4 font-serif text-4xl font-black leading-tight">EL ARCHIVO<br/>OCULTO</h2>
                  <div className="mx-auto mt-5 h-px w-24 bg-[#d8b77e]" />
                  <p className="mt-5 font-serif text-sm italic text-[#e2cba5]">Leer con atención.<br/>Pensar más allá de las palabras.</p>
                </div>
                <div className="w-full border-t border-[#d3b47d]/70 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#e1c18a]">Expediente de práctica · 001</p>
                  <p className="mt-2 text-[10px] text-[#cfb68b]">Abre la portada para comenzar</p>
                </div>
              </div>
            </Page>

            {questions.flatMap((question, index) => {
              const reading = readings.find((item) => item.id === question.readingId);
              const answer = feedbackById[question.id];
              return [
                <Page key={question.id + "-text"} className="archivo-page">
                  <BookPaper className="p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#bda47b] pb-3">
                      <SmallLabel>El Archivo Oculto · Lectura {question.readingId === "ciudad-que-camina" ? "01" : "02"}</SmallLabel>
                      <span className="font-mono text-[9px] text-[#9a8057]">PÁG. {index * 2 + 1}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-[22px] font-bold leading-tight text-[#382816]">{reading?.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#92764c]">
                      <span>{reading?.typeLabel}</span><span>·</span><span>{reading?.authorLabel}</span>
                    </div>
                    <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-[11px] leading-[1.65] text-[#483720] sm:text-[12px]">
                      {reading?.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex} className="text-justify indent-4">{paragraph}</p>
                      ))}
                    </div>
                    <button
                      type="button"
                      data-opf-no-flip
                      onClick={() => bookRef.current?.flipTo(2 + index * 2)}
                      className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#9d7c4d] bg-[#e5d1aa] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#573d20] hover:bg-[#d9c091]"
                    >Ir a la pregunta <ArrowRight className="h-3.5 w-3.5"/></button>
                    <p className="mt-2 text-center font-mono text-[8px] text-[#aa9068]">Texto de práctica original · PeakScore</p>
                  </BookPaper>
                </Page>,
                <Page key={question.id + "-question"} className="archivo-page">
                  <BookPaper className="p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#bda47b] pb-3">
                      <SmallLabel>Cuestionario · Pregunta {String(index + 1).padStart(2, "0")}</SmallLabel>
                      <span className="font-mono text-[9px] text-[#9a8057]">{question.difficulty.toUpperCase()}</span>
                    </div>
                    <div className="mt-4 border-l-[3px] border-[#a9824d] bg-[#e8d8b8] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8b6b3f]">{question.competencyShort}</p>
                      <h2 className="mt-2 font-serif text-[17px] font-bold leading-snug text-[#382816]">{question.prompt}</h2>
                    </div>
                    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = (answer?.selectedOption ?? (questionIndex === index ? selectedOption : null)) === optionIndex;
                        const isCorrect = answer && answer.correctOption === optionIndex;
                        const isWrong = answer && isSelected && !answer.isCorrect;
                        return (
                          <button
                            key={optionIndex}
                            type="button"
                            data-opf-no-flip
                            disabled={Boolean(answer) || phase !== "playing" || questionIndex !== index}
                            onClick={() => setSelectedOption(optionIndex)}
                            className={"flex min-h-[48px] w-full items-start gap-2 border p-2.5 text-left text-[10px] leading-4 transition " +
                              (isCorrect ? "border-emerald-700 bg-emerald-100" : isWrong ? "border-rose-700 bg-rose-100" : isSelected ? "border-[#946d38] bg-[#e4d0a7]" : "border-[#c7b28d] bg-[#f5ebd5] hover:border-[#947044]") +
                              " disabled:cursor-default"}
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center border border-[#b39a6d] bg-[#e8d7b5] font-mono text-[10px] font-bold text-[#604522]">{String.fromCharCode(65 + optionIndex)}</span>
                            <span className="flex-1 text-[#42311d]">{option}</span>
                            {isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-800"/>}
                            {isWrong && <XCircle className="h-4 w-4 shrink-0 text-rose-800"/>}
                          </button>
                        );
                      })}
                    </div>
                    {answer && (
                      <div aria-live="polite" className="mt-3 border border-[#a78b5c] bg-[#e5d3ae] p-3">
                        <p className={"text-[10px] font-black " + (answer.isCorrect ? "text-emerald-800" : "text-[#7e4e2b]")}>{answer.isCorrect ? "Respuesta correcta" : "Revisemos tu interpretación"}</p>
                        <p className="mt-1 text-[10px] leading-4 text-[#51402b]">{answer.explanation}</p>
                      </div>
                    )}
                    <div className="mt-3 border-t border-[#bda47b] pt-3">
                      {questionIndex === index && !answer && (
                        <button type="button" data-opf-no-flip onClick={() => void submitAnswer()} disabled={selectedOption === null || savingAnswer} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] hover:bg-[#8c6839] disabled:cursor-not-allowed disabled:opacity-45">
                          {savingAnswer ? "Comprobando…" : "Comprobar respuesta"} <ArrowRight className="h-3.5 w-3.5"/>
                        </button>
                      )}
                      {questionIndex === index && answer && (
                        <button
                          type="button"
                          data-opf-no-flip
                          disabled={finishing}
                          onClick={() => {
                            if (index === questions.length - 1) {
                              void finishBook();
                            } else {
                              goToQuestion(index + 1);
                            }
                          }}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] hover:bg-[#8c6839] disabled:opacity-50"
                        >{index === questions.length - 1 ? (finishing ? "Cerrando…" : "Cerrar expediente") : "Siguiente pregunta"} <ArrowRight className="h-3.5 w-3.5"/></button>
                      )}
                      <button type="button" data-opf-no-flip onClick={() => bookRef.current?.flipTo(1 + index * 2)} className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-2 text-[9px] font-bold text-[#82623a] hover:text-[#443018]">
                        <ChevronLeft className="h-3.5 w-3.5"/> Volver al texto
                      </button>
                    </div>
                    <p className="mt-2 text-center font-mono text-[8px] text-[#aa9068]">Lectura Crítica · Saber 11</p>
                  </BookPaper>
                </Page>,
              ];
            })}

            <Page density="hard" className="archivo-cover">
              <div className="flex h-full flex-col items-center justify-center border-[8px] border-double border-[#d2ad70] bg-[radial-gradient(ellipse_at_50%_35%,#76512b_0%,#382416_68%,#21150d_100%)] p-7 text-center text-[#f5e3bd]">
                <Feather className="h-12 w-12 text-[#e6c58e]"/>
                <h2 className="mt-6 font-serif text-3xl font-black">FIN DEL<br/>EXPEDIENTE</h2>
                <p className="mt-4 text-sm italic text-[#dfc69a]">Cada lectura abre una nueva perspectiva.</p>
              </div>
            </Page>
          </FlipBook>
        </div>

        {phase === "cover" && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <button type="button" onClick={() => void startBook()} disabled={starting || questions.length !== 10} className="inline-flex min-h-12 items-center gap-3 border-2 border-[#e7c58b] bg-gradient-to-b from-[#c89a54] to-[#94652e] px-8 py-3 text-xs font-black uppercase tracking-[.13em] text-[#21160c] shadow-[4px_4px_0_#080604] transition hover:brightness-110 disabled:opacity-50">
              <BookOpen className="h-4 w-4"/> {starting ? "Abriendo el archivo…" : "Abrir el libro"}
            </button>
            {progress && <p className="text-[10px] text-[#9e8969]">Lecturas completadas: {progress.games_completed} · Mejor resultado: {progress.best_correct}/10</p>}
          </div>
        )}

        {phase === "playing" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => bookRef.current?.flipPrev()} disabled={bookPage <= 1} className="inline-flex min-h-9 items-center gap-2 border border-[#6d512f] bg-[#21170f] px-3 py-2 text-[10px] font-bold text-[#d9c5a0] hover:border-[#c49a5b] disabled:opacity-40"><ChevronLeft className="h-4 w-4"/> Página anterior</button>
            <p className="text-[10px] font-mono text-[#ad956d]">Pregunta {questionIndex + 1} de 10 · {correctCount} correctas</p>
            <button type="button" onClick={() => bookRef.current?.flipNext()} className="inline-flex min-h-9 items-center gap-2 border border-[#6d512f] bg-[#21170f] px-3 py-2 text-[10px] font-bold text-[#d9c5a0] hover:border-[#c49a5b]">Voltear página <ChevronRight className="h-4 w-4"/></button>
          </div>
        )}

        <p className="mt-5 text-center text-[9px] text-[#806c50]">Textos originales de práctica · Las respuestas se validan de forma segura en PeakScore.</p>
      </div>
    </main>
  );
}

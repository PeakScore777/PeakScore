"use client";

import { FlipBook, Page } from "@openpageflip/react";
import type { Book } from "@openpageflip/core";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Feather,
  Lightbulb, RotateCcw, XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchivoContentBlock, ArchivoQuestion, ArchivoReading } from "@/lib/games/archivo-oculto-bank";

type PublicQuestion = Omit<ArchivoQuestion, "answer" | "explanation">;
type Phase = "loading" | "cover" | "playing" | "finished";
type AnswerFeedback = {
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};
type ContentSource = "seed" | "database";

function BookPaper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4e8d0] text-[#302313] " + className}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(110,76,38,.15) 0, rgba(110,76,38,.15) 1px, transparent 1px, transparent 5px), radial-gradient(ellipse at 15% 8%, rgba(255,255,255,.9), transparent 45%)",
      }} />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[9px] font-bold uppercase tracking-[.17em] text-[#956e3e]">{children}</span>;
}

function ReadingContent({ reading }: { reading: ArchivoReading | null }) {
  const blocks: ArchivoContentBlock[] = reading?.contentBlocks?.length
    ? reading.contentBlocks
    : (reading?.paragraphs ?? []).map((text) => ({ type: "paragraph" as const, text }));

  return (
    <div className="reading-content min-h-0 flex-1 overflow-hidden text-[11px] leading-[1.48] text-[#493822] sm:text-[11.5px]">
      {blocks.map((block, index) => {
        if (block.type === "image") {
          const imageClass = block.layout === "wide"
            ? "my-3 clear-both w-full"
            : "float-right mb-2 ml-4 mt-1 w-[39%] max-w-[190px]";
          return (
            <figure key={"image-" + index} className={imageClass}>
              <div className="overflow-hidden border border-[#c1a477] bg-[#e5d5b7] p-1 shadow-sm">
                <Image
                  src={block.url}
                  alt={block.alt || "Ilustración de la lectura"}
                  width={440}
                  height={300}
                  unoptimized
                  className="h-auto max-h-[190px] w-full object-cover"
                  sizes="(max-width: 768px) 42vw, 190px"
                />
              </div>
              {block.caption && (
                <figcaption className="mt-1 text-center font-serif text-[9px] italic leading-tight text-[#896b44]">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        return (
          <p key={"paragraph-" + index} className="mb-3 text-justify indent-4 last:mb-0">
            {block.text}
          </p>
        );
      })}
      <div aria-hidden="true" className="clear-both" />
    </div>
  );
}

export default function ArchivoOcultoGame() {
  const bookRef = useRef<Book>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [readings, setReadings] = useState<ArchivoReading[]>([]);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [source, setSource] = useState<ContentSource>("seed");
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
        throw new Error("El archivo necesita diez preguntas publicadas para abrirse.");
      }
      if (!active) return;
      setReadings(content.readings as ArchivoReading[]);
      setQuestions(content.questions as PublicQuestion[]);
      setSource(content.source === "database" ? "database" : "seed");

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
        body: JSON.stringify({ source, questionIds: questions.map((question) => question.id) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.sessionId !== "string"
        || !Array.isArray(payload.questions) || !Array.isArray(payload.readings)) {
        throw new Error(payload.error ?? "No se pudo iniciar la lectura.");
      }
      setSessionId(payload.sessionId);
      setQuestions(payload.questions as PublicQuestion[]);
      setReadings(payload.readings as ArchivoReading[]);
      setPhase("playing");
      setQuestionIndex(0);
      setSelectedOption(null);
      setFeedbackById({});
      setBookPage(0);
      window.requestAnimationFrame(() => bookRef.current?.flipTo(1));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir el expediente.");
    } finally {
      setStarting(false);
    }
  }, [questions, source, starting]);

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
    <main className="archivo-oculto relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#17110c] px-3 pb-8 pt-5 text-[#f2e3c5] sm:px-5 sm:pt-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{
        backgroundImage: "radial-gradient(ellipse at 50% 22%, rgba(160,111,54,.25), transparent 58%), linear-gradient(180deg, #1c140d, #0e0b08)",
      }} />
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex items-center gap-2 text-xs font-bold text-[#cdbb9a] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Todos los juegos
          </Link>
          <div className="text-right">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-[#d1a762]">Lectura crítica · Saber 11</p>
            <h1 className="mt-1 font-serif text-xl font-bold tracking-wide text-[#f3e5c8] sm:text-2xl">EL ARCHIVO OCULTO</h1>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-bold text-[#ead6b1]">{currentReading?.title ?? "Colección de lecturas"}</p>
            <p className="mt-1 text-[10px] text-[#9e8865]">Expediente 001 · {phase === "cover" ? "Listo para abrir" : "Pregunta " + (questionIndex + 1) + " de " + questions.length}</p>
          </div>
          {phase === "playing" && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-[9px] text-[#b49a72]">{answeredCount}/{questions.length}</span>
              <div className="h-1.5 w-24 overflow-hidden bg-[#4b3823] sm:w-36"><div className="h-full bg-[#d4a34f] transition-all" style={{ width: (answeredCount / questions.length * 100) + "%" }} /></div>
            </div>
          )}
        </div>

        {error && <p role="alert" className="mb-3 border border-rose-800/70 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">{error}</p>}

        <div className="overflow-hidden rounded-[8px] border-[7px] border-[#654722] bg-[#2c1d10] p-2 shadow-[0_28px_78px_rgba(0,0,0,.55),inset_0_0_0_2px_#d3a65e] sm:p-4">
          <FlipBook
            ref={bookRef}
            className="archivo-book mx-auto"
            width={510}
            height={680}
            size="stretch"
            minWidth={300}
            maxWidth={620}
            cover
            layout={handheld ? "single" : "auto"}
            binding={handheld ? "top" : "left"}
            flipDuration={900}
            shadowOpacity={0.38}
            page={bookPage}
            onFlip={handleFlip}
          >
            <Page density="hard" className="archivo-cover">
              <div className="flex h-full flex-col items-center justify-between border-[9px] border-double border-[#d8b477] bg-[radial-gradient(ellipse_at_50%_35%,#805a32_0%,#392618_68%,#21150d_100%)] p-8 text-center text-[#f5e3bd]">
                <div className="w-full border-y border-[#d3b47d]/70 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#e1c18a]">PeakScore · Biblioteca de lectura</p>
                </div>
                <div>
                  <div className="mx-auto grid h-28 w-28 place-items-center border border-[#d2ad70] bg-[#1f150d]/70 text-[#e6c58e] shadow-[0_0_36px_rgba(0,0,0,.4)]">
                    <BookOpen className="h-14 w-14" strokeWidth={1.1} />
                  </div>
                  <p className="mt-8 font-mono text-[10px] uppercase tracking-[.3em] text-[#d9b981]">Colección de textos ICFES</p>
                  <h2 className="mt-4 font-serif text-4xl font-black leading-tight">EL ARCHIVO<br/>OCULTO</h2>
                  <div className="mx-auto mt-6 h-px w-28 bg-[#d8b77e]" />
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
                      <SmallLabel>El Archivo Oculto · Lectura {reading ? String(readings.indexOf(reading) + 1).padStart(2, "0") : "01"}</SmallLabel>
                      <span className="font-mono text-[9px] text-[#9a8057]">PÁG. {index * 2 + 1}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-[23px] font-bold leading-tight text-[#382816]">{reading?.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#92764c]">
                      <span>{reading?.typeLabel}</span><span>·</span><span>{reading?.authorLabel}</span>
                    </div>
                    <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-[#ddcaa8] pt-3">
                      <ReadingContent reading={reading} />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]">
                      <span className="h-px w-12 bg-[#b99a6b]" /> {index * 2 + 1} <span className="h-px w-12 bg-[#b99a6b]" />
                    </div>
                  </BookPaper>
                </Page>,
                <Page key={question.id + "-question"} className="archivo-page">
                  <BookPaper className="p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#bda47b] pb-3">
                      <SmallLabel>Pregunta {String(index + 1).padStart(2, "0")}</SmallLabel>
                      <span className="font-mono text-[9px] text-[#9a8057]">LECTURA CRÍTICA</span>
                    </div>
                    <div className="mt-4 border-l-[3px] border-[#a9824d] bg-[#ead9b7] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8b6b3f]">{question.competencyShort}</p>
                      <h2 className="mt-2 font-serif text-[19px] font-bold leading-snug text-[#382816]">{question.prompt}</h2>
                    </div>
                    <div className="mt-4 space-y-2.5">
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
                            className={"flex min-h-[54px] w-full items-start gap-3 border px-3 py-3 text-left text-[11px] leading-[1.45] transition " +
                              (isCorrect ? "border-emerald-700 bg-[#e2ead8]" : isWrong ? "border-rose-700 bg-[#f1dfd5]" : isSelected ? "border-[#a77b3f] bg-[#ead6ad]" : "border-[#d0b98d] bg-[#f8eedb] hover:border-[#947044]") +
                              " disabled:cursor-default"}
                          >
                            <span className={"grid h-7 w-7 shrink-0 place-items-center border font-serif text-[12px] font-bold " +
                              (isCorrect ? "border-emerald-700 bg-emerald-800 text-white" : isWrong ? "border-rose-700 bg-rose-800 text-white" : "border-[#b39a6d] bg-[#f0dfbc] text-[#604522]")}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1 pt-0.5 text-[#42311d]">{option}</span>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-800"/>}
                            {isWrong && <XCircle className="h-5 w-5 shrink-0 text-rose-800"/>}
                          </button>
                        );
                      })}
                    </div>
                    {answer ? (
                      <div aria-live="polite" className={"mt-4 border p-4 shadow-sm " + (answer.isCorrect ? "border-[#9aaa72] bg-[#edf0dd]" : "border-[#c18a71] bg-[#f2e3d5]")}>
                        <div className="flex items-center gap-2">
                          <Lightbulb className={"h-5 w-5 shrink-0 " + (answer.isCorrect ? "text-[#61733e]" : "text-[#9a6041]")}/>
                          <p className={"font-serif text-[14px] font-bold " + (answer.isCorrect ? "text-[#354b27]" : "text-[#75442e]")}>
                            {answer.isCorrect ? "Comprende la respuesta" : "Aprende de esta respuesta"}
                          </p>
                        </div>
                        <p className="mt-2 text-[11px] leading-[1.55] text-[#51402b]">{answer.explanation}</p>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 border border-dashed border-[#cdb58c] bg-[#f3e7cf]/70 px-3 py-3 text-[10px] text-[#8b704c]">
                        <BookOpen className="h-4 w-4 shrink-0"/> Lee el texto y elige la opción que mejor sustenta tu respuesta.
                      </div>
                    )}
                    <div className="mt-auto border-t border-[#bda47b] pt-4">
                      {!answer && questionIndex === index && (
                        <button type="button" data-opf-no-flip onClick={() => void submitAnswer()} disabled={selectedOption === null || savingAnswer} className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] hover:bg-[#8c6839] disabled:cursor-not-allowed disabled:opacity-45">
                          {savingAnswer ? "Comprobando…" : "Comprobar respuesta"} <ArrowRight className="h-4 w-4"/>
                        </button>
                      )}
                      {answer && questionIndex === index && index === questions.length - 1 && (
                        <button type="button" data-opf-no-flip onClick={() => void finishBook()} disabled={finishing} className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] hover:bg-[#8c6839] disabled:opacity-50">
                          {finishing ? "Cerrando expediente…" : "Cerrar expediente"} <ArrowRight className="h-4 w-4"/>
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]">
                      <span className="h-px w-12 bg-[#b99a6b]" /> {index * 2 + 2} <span className="h-px w-12 bg-[#b99a6b]" />
                    </div>
                  </BookPaper>
                </Page>,
              ];
            })}

            <Page density="hard" className="archivo-cover">
              <div className="flex h-full flex-col items-center justify-center border-[9px] border-double border-[#d8b477] bg-[radial-gradient(ellipse_at_50%_35%,#805a32_0%,#392618_68%,#21150d_100%)] p-8 text-center text-[#f5e3bd]">
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
          <div className="mt-4 flex items-center justify-center">
            <p className="rounded-full border border-[#6d512f] bg-[#21170f]/80 px-4 py-2 text-[10px] font-mono text-[#ad956d]">
              Pregunta {questionIndex + 1} de 10 · {correctCount} respuestas correctas
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-[9px] text-[#806c50]">Textos de práctica · Las respuestas se validan de forma segura en PeakScore.</p>
      </div>
    </main>
  );
}

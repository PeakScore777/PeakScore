"use client";

import { FlipBook, Page } from "@openpageflip/react";
import type { Book } from "@openpageflip/core";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2,
  Lightbulb, RotateCcw, XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
    <div className={"archivo-paper relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4e8d0] text-[#302313] " + className}>
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

  const textLength = blocks.reduce((total, block) => total + (block.type === "paragraph" ? block.text.length : 0), 0);
  const readingFontSize = textLength > 2600 ? "9px" : textLength > 1900 ? "10px" : "11.5px";
  const readingLineHeight = textLength > 2600 ? 1.32 : 1.45;

  return (
    <div
      className="reading-content min-h-0 flex-1 overflow-hidden text-justify text-[#493822]"
      style={{ fontSize: readingFontSize, lineHeight: readingLineHeight }}
    >
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
  const feedback = currentQuestion ? feedbackById[currentQuestion.id] ?? null : null;
  const correctCount = Object.values(feedbackById).filter((answer) => answer.isCorrect).length;
  const answeredCount = Object.keys(feedbackById).length;
  const score = correctCount * 100;

  useEffect(() => {
    if (phase !== "cover") return;
    const frame = window.requestAnimationFrame(() => {
      bookRef.current?.flipTo(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

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
    <main className="archivo-oculto relative min-h-[calc(100svh-72px)] overflow-hidden px-4 pb-8 pt-5 text-[#f2e3c5] sm:px-7 sm:pt-6"
      style={{ backgroundImage: "linear-gradient(180deg, rgba(12,8,5,.34), rgba(12,8,5,.52)), url('/images/games/archivo-oculto/fondo-biblioteca.png')", backgroundPosition: "center center", backgroundSize: "cover", backgroundAttachment: "fixed" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,transparent_22%,rgba(8,5,3,.32)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-112px)] max-w-[1480px] flex-col">
        <header className="flex min-h-10 items-center justify-between gap-4">
          <Link href="/aprender/juegos" className="inline-flex items-center gap-2 text-xs font-semibold text-[#f0d7a7] drop-shadow-[0_1px_4px_rgba(0,0,0,.9)] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Todos los juegos
          </Link>
          {phase === "cover" && progress && <span className="rounded-full border border-[#c79b53]/55 bg-[#160e09]/75 px-3 py-1.5 font-mono text-[10px] text-[#f0d6a2] backdrop-blur-sm">{progress.games_completed} completados</span>}
          {phase === "playing" && <div className="flex items-center gap-3 rounded-full border border-[#c79b53]/55 bg-[#160e09]/80 px-3 py-2 backdrop-blur-sm"><span className="font-mono text-[10px] text-[#f0d6a2]">{answeredCount}/10</span><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#5a4024] sm:w-32"><div className="h-full rounded-full bg-[#e1b765] transition-all" style={{width:(answeredCount/10*100)+"%"}} /></div></div>}
        </header>
        {error && <p role="alert" className="mx-auto mt-3 max-w-xl border border-rose-300/40 bg-[#310f0e]/90 px-4 py-3 text-center text-xs text-rose-100 shadow-xl">{error}</p>}
        {phase === "cover" ? (
          <section className="archivo-entry-layout flex flex-1 items-center justify-center py-8 sm:py-5">
            <button type="button" aria-label="Abrir El Archivo Oculto" aria-disabled={starting || questions.length !== 10} disabled={starting || questions.length !== 10} onClick={() => void startBook()} className="archivo-book-object group relative block shrink-0 text-left outline-none transition duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#f5d38f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#21140e] disabled:cursor-wait disabled:opacity-75">
              <span aria-hidden="true" className="archivo-book-spine" />
              <span aria-hidden="true" className="archivo-book-pages" />
              <span className="archivo-book-face">
                <span aria-hidden="true" className="archivo-book-inner-frame" />
                <span className="archivo-book-title">EL ARCHIVO<br/>OCULTO</span>
                <span className="archivo-book-divider" aria-hidden="true" />
                <span className="archivo-book-plaque">EXPEDIENTE 001</span>
              </span>
              <span className="archivo-book-shadow" aria-hidden="true" />
              <span className="sr-only">{starting ? "Abriendo expediente" : "Abrir expediente"}</span>
            </button>
          </section>
        ) : (
          <section className="archivo-reader-layout flex flex-1 flex-col justify-center py-4 sm:py-5">
            <div className="archivo-reader-stage mx-auto w-full max-w-[1120px]">
              <FlipBook ref={bookRef} className="archivo-book mx-auto" width={510} height={680} size="stretch" minWidth={300} maxWidth={620} cover layout={handheld ? "single" : "auto"} binding={handheld ? "top" : "left"} flipDuration={780} shadowOpacity={0.38} page={bookPage} onFlip={handleFlip}>
                <Page density="hard" className="archivo-cover"><div className="archivo-flip-cover"><span>EL ARCHIVO OCULTO</span><small>EXPEDIENTE 001</small></div></Page>
                {questions.flatMap((question,index)=>{
                  const reading=readings.find(item=>item.id===question.readingId);
                  const answer=feedbackById[question.id];
                  return [
                    <Page key={question.id+"-text"} className="archivo-page archivo-page-left">
                      <BookPaper className="p-5 sm:p-6">
                        <div className="flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>El Archivo Oculto · Lectura {reading?String(readings.indexOf(reading)+1).padStart(2,"0"):"01"}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">PÁG. {index*2+1}</span></div>
                        <h2 className="mt-4 font-serif text-[23px] font-bold leading-tight text-[#382816]">{reading?.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#92764c]"><span>{reading?.typeLabel}</span><span>·</span><span>{reading?.authorLabel}</span></div>
                        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-[#ddcaa8] pt-3"><ReadingContent reading={reading??null}/></div>
                        <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+1}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>,
                    <Page key={question.id+"-question"} className="archivo-page archivo-page-right">
                      <BookPaper className="p-5 sm:p-6">
                        <div className="flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>Pregunta {String(index+1).padStart(2,"0")}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">LECTURA CRÍTICA</span></div>
                        <div className="mt-4 border-l-[3px] border-[#a9824d] bg-[#ead9b7] p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-[#8b6b3f]">{question.competencyShort}</p><h2 className="mt-2 font-serif text-[19px] font-bold leading-snug text-[#382816]">{question.prompt}</h2></div>
                        <div className="mt-4 space-y-2.5">
                          {question.options.map((option,optionIndex)=>{
                            const isSelected=(answer?.selectedOption??(questionIndex===index?selectedOption:null))===optionIndex;
                            const isCorrect=answer&&answer.correctOption===optionIndex;
                            const isWrong=answer&&isSelected&&!answer.isCorrect;
                            return <button key={optionIndex} type="button" data-opf-no-flip disabled={Boolean(answer)||phase!=="playing"||questionIndex!==index} onClick={()=>setSelectedOption(optionIndex)} className={"flex min-h-[54px] w-full items-start gap-3 border px-3 py-3 text-left text-[11px] leading-[1.45] transition "+(isCorrect?"border-emerald-700 bg-[#e2ead8]":isWrong?"border-rose-700 bg-[#f1dfd5]":isSelected?"border-[#a77b3f] bg-[#ead6ad]":"border-[#d0b98d] bg-[#f8eedb] hover:border-[#947044]")+" disabled:cursor-default"}>
                              <span className={"grid h-7 w-7 shrink-0 place-items-center border font-serif text-[12px] font-bold "+(isCorrect?"border-emerald-700 bg-emerald-800 text-white":isWrong?"border-rose-700 bg-rose-800 text-white":"border-[#b39a6d] bg-[#f0dfbc] text-[#604522]")}>{String.fromCharCode(65+optionIndex)}</span>
                              <span className="flex-1 pt-0.5 text-[#42311d]">{option}</span>{isCorrect&&<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-800"/>}{isWrong&&<XCircle className="h-5 w-5 shrink-0 text-rose-800"/>}
                            </button>;
                          })}
                        </div>
                        {answer?<div aria-live="polite" className={"mt-4 border p-4 shadow-sm "+(answer.isCorrect?"border-[#9aaa72] bg-[#edf0dd]":"border-[#c18a71] bg-[#f2e3d5]")}><div className="flex items-center gap-2"><Lightbulb className={"h-5 w-5 shrink-0 "+(answer.isCorrect?"text-[#61733e]":"text-[#9a6041]")}/><p className={"font-serif text-[14px] font-bold "+(answer.isCorrect?"text-[#354b27]":"text-[#75442e]")}>{answer.isCorrect?"Comprende la respuesta":"Aprende de esta respuesta"}</p></div><p className="mt-2 text-[11px] leading-[1.55] text-[#51402b]">{answer.explanation}</p></div>:<div className="mt-4 flex items-center gap-2 border border-dashed border-[#cdb58c] bg-[#f3e7cf]/70 px-3 py-3 text-[10px] text-[#8b704c]"><BookOpen className="h-4 w-4 shrink-0"/>Lee el texto y elige la opción que mejor sustenta tu respuesta.</div>}
                        <div className="mt-auto border-t border-[#bda47b] pt-4">
                          {!answer&&questionIndex===index&&<button type="button" data-opf-no-flip onClick={()=>void submitAnswer()} disabled={selectedOption===null||savingAnswer} className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] hover:bg-[#8c6839] disabled:cursor-not-allowed disabled:opacity-45">{savingAnswer?"Comprobando…":"Comprobar respuesta"}<ArrowRight className="h-4 w-4"/></button>}
                          {answer&&questionIndex===index&&index===questions.length-1&&<button type="button" data-opf-no-flip onClick={()=>void finishBook()} disabled={finishing} className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] hover:bg-[#8c6839] disabled:opacity-50">{finishing?"Cerrando expediente…":"Cerrar expediente"}<ArrowRight className="h-4 w-4"/></button>}
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+2}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>
                  ];
                })}
                <Page density="hard" className="archivo-cover"><div className="archivo-flip-cover"><span>FIN DEL EXPEDIENTE</span></div></Page>
              </FlipBook>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
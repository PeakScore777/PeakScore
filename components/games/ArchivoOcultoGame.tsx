"use client";

import { FlipBook, Page } from "@openpageflip/react";
import type { Book } from "@openpageflip/core";
import {
  ArrowLeft, ArrowRight, CheckCircle2,
  Lightbulb, RotateCcw, XCircle,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchivoContentBlock, ArchivoQuestion, ArchivoReading } from "@/lib/games/archivo-oculto-bank";

const ArchivoOcultoBookScene = dynamic(() => import("./ArchivoOculto3D").then((module) => module.ArchivoOcultoBookScene), { ssr: false });

type PublicQuestion = Omit<ArchivoQuestion, "answer" | "explanation">;
type Phase = "loading" | "cover" | "playing" | "finished";
type AnswerFeedback = {
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};
type ContentSource = "database";

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
  return <span className="archivo-page-label font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#956e3e]">{children}</span>;
}

function InteractiveEvidencePhoto({ block }: { block: Extract<ArchivoContentBlock, { type: "image" }> }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number; u: number; v: number; width: number; height: number; src: string } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const lensSize = 112;
  const zoomFactor = 3.15;

  useEffect(() => () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (pointerFrameRef.current !== null) return;

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const point = pendingPointerRef.current;
      const frame = frameRef.current;
      const image = imageRef.current;
      if (!point || !frame || !image) return;

      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const naturalWidth = image.naturalWidth || 1;
      const naturalHeight = image.naturalHeight || 1;
      const imageRatio = naturalWidth / naturalHeight;
      const boxRatio = imageRect.width / Math.max(1, imageRect.height);
      const displayedWidth = boxRatio > imageRatio ? imageRect.height * imageRatio : imageRect.width;
      const displayedHeight = boxRatio > imageRatio ? imageRect.height : imageRect.width / imageRatio;
      const imageLeft = imageRect.left + (imageRect.width - displayedWidth) / 2;
      const imageTop = imageRect.top + (imageRect.height - displayedHeight) / 2;
      const u = (point.clientX - imageLeft) / Math.max(1, displayedWidth);
      const v = (point.clientY - imageTop) / Math.max(1, displayedHeight);

      if (u < 0 || u > 1 || v < 0 || v > 1) {
        setLens(null);
        return;
      }

      setLens({
        x: point.clientX - frameRect.left,
        y: point.clientY - frameRect.top,
        u,
        v,
        width: displayedWidth,
        height: displayedHeight,
        src: image.currentSrc || image.src,
      });
    });
  };

  const handlePointerLeave = () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    pendingPointerRef.current = null;
    setLens(null);
  };

  return (
    <figure
      data-opf-no-flip
      data-layout={block.layout === "wide" ? "wide" : "float"}
      className={"archivo-evidence-photo " + (block.layout === "wide"
        ? "my-5 clear-both w-full"
        : "float-right mb-3 ml-4 mt-1 w-[46%] max-w-[230px]") + " relative"}
    >
      <div
        ref={frameRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-opf-no-flip
        className="relative overflow-hidden border-[5px] border-[#a88756] bg-[#e7d4ae] p-1.5 shadow-[0_5px_12px_rgba(50,29,11,.24)]"
      >
        <div className="relative overflow-hidden border border-[#6b4c2b] bg-[#21170f]">
          <Image
            ref={imageRef}
            src={block.url}
            alt={block.alt || "Imagen del expediente"}
            width={900}
            height={620}
            draggable={false}
            className="archivo-evidence-image block h-auto w-full select-none object-contain"
            sizes="(max-width: 767px) 88vw, (max-width: 1199px) 42vw, 520px"
            loading="lazy"
          />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-[#f7e8c8]/80" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-[#f7e8c8]/80" />

        {lens && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-20 h-0 w-0"
            style={{ left: lens.x, top: lens.y }}
          >
            <div
              className="absolute left-[39px] top-[40px] z-0 h-[23px] w-[132px] origin-[12px_11px] rotate-[43deg] rounded-[8px] border border-[#24170e] shadow-[2px_5px_8px_rgba(0,0,0,.56)]"
              style={{ background: "linear-gradient(180deg,#b8793c 0%,#4a2817 18%,#21130c 48%,#6a3c21 78%,#c58a4a 100%)" }}
            />
            <div
              className="absolute left-[44px] top-[44px] z-[1] h-[13px] w-[116px] origin-[7px_6px] rotate-[43deg] rounded-[5px] border border-[#d4a66a]/50"
              style={{ background: "linear-gradient(180deg,#b47a47,#4c2b19 45%,#2b190f)" }}
            />
            <div
              className="absolute left-[29px] top-[30px] z-[2] h-[30px] w-[34px] origin-[16px_15px] rotate-[43deg] rounded-[7px] border border-[#4a2b16] shadow-sm"
              style={{ background: "linear-gradient(135deg,#f2d39c 0%,#986432 28%,#3d2515 54%,#dfb779 82%,#6c441f 100%)" }}
            />
            <div className="absolute -left-[65px] -top-[65px] z-[3] h-[130px] w-[130px] rounded-full border-[5px] border-[#392718] shadow-[0_5px_12px_rgba(0,0,0,.55),inset_0_1px_2px_rgba(255,255,255,.7)]" style={{ background: "linear-gradient(135deg,#f2d39c 0%,#a06a31 20%,#392415 43%,#1d120b 62%,#d9ad6d 86%,#4b2d18 100%)" }} />
            <div
              className="absolute -left-[56px] -top-[56px] z-[4] overflow-hidden rounded-full border border-[#dfc58d]/90 shadow-[inset_0_2px_8px_rgba(255,255,255,.3)]"
              style={{ width: lensSize, height: lensSize, background: "rgba(225,205,158,.16)" }}
            >
              <div className="absolute inset-0" style={{
                backgroundImage: "url('" + lens.src + "')",
                backgroundRepeat: "no-repeat",
                backgroundSize: lens.width * zoomFactor + "px " + lens.height * zoomFactor + "px",
                backgroundPosition: (lensSize / 2 - lens.u * lens.width * zoomFactor) + "px " + (lensSize / 2 - lens.v * lens.height * zoomFactor) + "px",
                filter: "contrast(1.08) sepia(.08)",
              }} />
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at 24% 15%,rgba(255,255,255,.55),transparent 28%),linear-gradient(135deg,rgba(255,255,255,.12),transparent 54%,rgba(30,14,4,.2))" }} />
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-1 border-x border-b border-[#c6a878] bg-[#ead9b8] px-2 py-1.5 text-center">
        <span className="block font-mono text-[7px] font-black uppercase tracking-[.16em] text-[#9b3025]">Evidencia del expediente · Examina con la lupa</span>
        {block.caption && <span className="mt-0.5 block font-serif text-[9px] italic leading-tight text-[#684b2e]">{block.caption}</span>}
      </figcaption>
    </figure>
  );
}

function splitParagraphAtSentenceRatio(text: string, ratio: number): [string, string] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜ¿¡])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    const targetLength = text.length * ratio;
    let bestIndex = 1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let currentLength = 0;

    for (let index = 1; index < sentences.length; index += 1) {
      currentLength += sentences[index - 1].length + 1;
      const distance = Math.abs(currentLength - targetLength);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    return [
      sentences.slice(0, bestIndex).join(" "),
      sentences.slice(bestIndex).join(" "),
    ];
  }

  const words = text.trim().split(/\s+/);
  const target = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));
  return [words.slice(0, target).join(" "), words.slice(target).join(" ")];
}

function splitReadingIntoPages(reading: ArchivoReading | null, pageCount: number): ArchivoContentBlock[][] {
  const blocks: ArchivoContentBlock[] = reading?.contentBlocks?.length
    ? reading.contentBlocks
    : (reading?.paragraphs ?? []).map((text) => ({ type: "paragraph" as const, text }));
  const safePageCount = Math.max(1, pageCount);
  const sections: ArchivoContentBlock[][] = [];

  // Keep each documentary image attached to the paragraph that introduces it.
  // Editorial subheadings belong to the following paragraph, not the previous one.
  let pendingSubheadings: ArchivoContentBlock[] = [];
  for (const block of blocks) {
    if (block.type === "subheading") {
      pendingSubheadings.push(block);
      continue;
    }

    if (block.type === "paragraph" || sections.length === 0) {
      sections.push([...pendingSubheadings, block]);
      pendingSubheadings = [];
    } else {
      sections[sections.length - 1].push(block);
    }
  }

  if (pendingSubheadings.length && sections.length) {
    sections[sections.length - 1].push(...pendingSubheadings);
  }

  // For the six-part structure of "El caso de las 9:17", keep the chronology:
  // opening/photo, testimony + register, photo limitations + signed statement,
  // source-evaluation theory, and the final applied synthesis.
  if (safePageCount === 5 && sections.length === 7) {
    return [
      sections[0],
      sections[1],
      [...sections[2], ...sections[3]],
      [...sections[4], ...sections[5]],
      sections[6],
    ];
  }

  if (safePageCount === 5 && sections.length === 6) {
    return [
      sections[0],
      sections[1],
      sections[2],
      [...sections[3], ...sections[4]],
      sections[5],
    ];
  }

  const sectionWeight = (section: ArchivoContentBlock[]) =>
    section.reduce((total, block) => total + (block.type === "paragraph" ? block.text.length : 0), 0);
  const sectionHasImage = (section: ArchivoContentBlock[]) =>
    section.some((block) => block.type === "image");

  // If there are fewer content sections than question pages, split the longest
  // paragraph at a sentence boundary. Any image stays with the final fragment.
  while (sections.length < safePageCount) {
    const candidates = sections
      .map((section, index) => ({ section, index, weight: sectionWeight(section), hasImage: sectionHasImage(section) }))
      .filter(({ weight }) => weight >= 180)
      .sort((a, b) => {
        if (a.hasImage !== b.hasImage) return Number(a.hasImage) - Number(b.hasImage);
        return b.weight - a.weight;
      });

    const candidate = candidates[0];
    if (!candidate) break;

    const paragraphIndex = candidate.section.findIndex((block) => block.type === "paragraph");
    if (paragraphIndex < 0) break;
    const paragraph = candidate.section[paragraphIndex];
    if (paragraph.type !== "paragraph") break;

    const [firstHalf, secondHalf] = splitParagraphAtSentenceRatio(paragraph.text, 0.5);
    if (!firstHalf || !secondHalf || firstHalf === paragraph.text || secondHalf === paragraph.text) break;

    const trailingBlocks = candidate.section.slice(paragraphIndex + 1);
    sections.splice(
      candidate.index,
      1,
      [{ type: "paragraph", text: firstHalf }],
      [{ type: "paragraph", text: secondHalf }, ...trailingBlocks],
    );
  }

  // When there are more sections than pages, group neighbouring sections in
  // reading order by text weight. This keeps all content and evidence in sequence.
  const pages: ArchivoContentBlock[][] = [];
  let cursor = 0;

  for (let pageIndex = 0; pageIndex < safePageCount; pageIndex += 1) {
    const pagesRemaining = safePageCount - pageIndex;
    const sectionsRemaining = sections.length - cursor;
    if (sectionsRemaining <= 0) {
      pages.push([]);
      continue;
    }

    const remainingWeight = sections
      .slice(cursor)
      .reduce((total, section) => total + sectionWeight(section), 0);
    const targetWeight = remainingWeight / pagesRemaining;
    const pageSections = [sections[cursor++]];
    let pageWeight = sectionWeight(pageSections[0]);

    while (cursor < sections.length && sections.length - cursor >= pagesRemaining - 1) {
      const nextWeight = sectionWeight(sections[cursor]);
      if (pageWeight >= targetWeight || (pageSections.length > 0 && pageWeight + nextWeight > targetWeight * 1.18)) {
        break;
      }
      pageSections.push(sections[cursor++]);
      pageWeight += nextWeight;
    }

    pages.push(pageSections.flat());
  }

  return pages;
}

function ReadingContent({ blocks }: { blocks: ArchivoContentBlock[] }) {
  const textLength = blocks.reduce((total, block) => total + (block.type === "paragraph" ? block.text.length : 0), 0);
  const readingFontSize = textLength > 1400 ? "12px" : "13.5px";
  const readingLineHeight = 1.52;

  return (
    <div
      className="archivo-reading-body reading-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-justify text-[#493822]"
      style={{ fontSize: readingFontSize, lineHeight: readingLineHeight }}
    >
      {blocks.map((block, index) => {
        if (block.type === "image") {
          return <InteractiveEvidencePhoto key={"evidence-" + index} block={block} />;
        }

        if (block.type === "subheading") {
          return (
            <h3 key={"subheading-" + index} className="archivo-reading-subheading mb-2 mt-3 border-b border-[#b89561] pb-1 font-serif text-[13px] font-bold uppercase tracking-[.08em] text-[#7c4e20]">
              {block.text}
            </h3>
          );
        }

        return (
          <p key={"paragraph-" + index} className="archivo-reading-paragraph mb-4 text-justify indent-4 last:mb-0">
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
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [readings, setReadings] = useState<ArchivoReading[]>([]);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [source, setSource] = useState<ContentSource>("database");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bookPage, setBookPage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, AnswerFeedback>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [starting, setStarting] = useState(false);
  const [openingBook, setOpeningBook] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handheld, setHandheld] = useState(false);

  useEffect(() => {
    // Freesound: SpaceJoe, "Quiet Page Turn - 8" (CC0).
    // Preview MP3 is used so the sound can be fetched without a Freesound login.
    const audio = new Audio("/audio/archivo-oculto/page-turn.mp3");
    audio.preload = "none";
    audio.volume = 0.38;
    pageTurnAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
      pageTurnAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px), (pointer: coarse) and (max-width: 1024px)");
    const update = () => setHandheld(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/games/archivo-oculto/questions", {
      credentials: "same-origin",
      cache: "no-store",
    }).then(async (contentResponse) => {
      const content = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) throw new Error(content.error ?? "No se pudo cargar el libro.");
      const questionCount = Array.isArray(content.questions) ? content.questions.length : 0;
      const readingCount = Array.isArray(content.readings) ? content.readings.length : 0;
      if (questionCount < 5 || questionCount > 10 || questionCount % 5 !== 0 || readingCount !== questionCount / 5) {
        throw new Error("El archivo necesita una o dos lecturas publicadas, con cinco preguntas cada una.");
      }
      if (!active) return;
      setReadings(content.readings as ArchivoReading[]);
      setQuestions(content.questions as PublicQuestion[]);
      if (content.source !== "database") throw new Error("El archivo no recibió contenido publicado.");
      setSource("database");

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
  const score = questions.length ? Math.round((correctCount * 1000) / questions.length) : 0;
  const investigatorRank = score === 1000
    ? "Maestro de evidencias"
    : score >= 700
      ? "Analista del expediente"
      : score >= 400
        ? "Investigador en formación"
        : "Expediente por revisar";
  const readingPagesByQuestionId = useMemo(() => {
    const pagesByQuestion = new Map<string, { reading: ArchivoReading; blocks: ArchivoContentBlock[] }>();

    for (const reading of readings) {
      const relatedQuestions = questions.filter((question) => question.readingId === reading.id);
      const pages = splitReadingIntoPages(reading, relatedQuestions.length);
      relatedQuestions.forEach((question, index) => {
        pagesByQuestion.set(question.id, {
          reading,
          blocks: pages[index] ?? [],
        });
      });
    }

    return pagesByQuestion;
  }, [questions, readings]);

  useEffect(() => {
    if (phase !== "cover") return;
    const frame = window.requestAnimationFrame(() => {
      bookRef.current?.flipTo(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const lastAudioFlipRef = useRef<string | null>(null);

  const handleFlipProgress = useCallback((event: { from: number; to: number; progress: number }) => {
    const lastPage = (bookRef.current?.pageCount ?? 0) - 1;
    const isCoverTurn =
      event.from === 0 || event.to === 0 ||
      event.from === lastPage || event.to === lastPage;

    // Only soft interior pages should make a paper sound. Hard front/back covers stay silent.
    if (isCoverTurn) {
      lastAudioFlipRef.current = null;
      return;
    }

    if (event.progress <= 0 || event.progress >= 1) {
      lastAudioFlipRef.current = null;
      return;
    }

    const flipKey = `${event.from}->${event.to}`;
    if (lastAudioFlipRef.current === flipKey) return;
    lastAudioFlipRef.current = flipKey;

    const pageTurnAudio = pageTurnAudioRef.current;
    if (!pageTurnAudio) return;
    pageTurnAudio.currentTime = 0;
    void pageTurnAudio.play().catch(() => {
      // Browsers may block playback until the first direct user interaction.
    });
  }, []);

  const handleFlip = useCallback((event: { page: number }) => {
    setBookPage(event.page);
    if (event.page > 0 && questions.length) {
      const index = Math.min(questions.length - 1, Math.max(0, Math.floor((event.page - 1) / 2)));
      setQuestionIndex(index);
      setSelectedOption(feedbackById[questions[index]?.id]?.selectedOption ?? null);
    }
  }, [feedbackById, questions]);

  const startBook = useCallback(async () => {
    if (starting || questions.length < 5) return;
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
      setOpeningBook(true);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1480));
      setPhase("playing");
      setOpeningBook(false);
      setQuestionIndex(0);
      setSelectedOption(null);
      setFeedbackById({});
      setBookPage(1);
      window.requestAnimationFrame(() => bookRef.current?.flipTo(1));
    } catch (cause) {
      setOpeningBook(false);
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
    if (!sessionId || answeredCount !== questions.length || finishing) {
      setError("Responde las " + questions.length + " preguntas antes de cerrar el expediente.");
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

      setCompletionMessage("Tu resultado quedó guardado. Puedes repasar tus respuestas y volver a intentarlo cuando quieras.");
      setPhase("finished");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el resultado.");
    } finally {
      setFinishing(false);
    }
  }, [answeredCount, finishing, questions.length, sessionId]);

  const restartBook = useCallback(() => {
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackById({});
    setSessionId(null);
    setError(null);
    setCompletionMessage(null);
    setBookPage(0);
    setPhase("cover");
  }, []);

  if (handheld) {
    return (
      <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#17110c] px-5 text-center text-[#f3e4c5]">
        <section className="max-w-md border border-[#80613a] bg-[#21170e]/95 p-7 shadow-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b47e]">El Archivo Oculto</p>
          <h1 className="mt-3 font-serif text-2xl font-bold">Disponible solo en computador</h1>
          <p className="mt-3 text-sm leading-6 text-[#d7c5a4]">Esta experiencia está diseñada para jugarse desde un computador, con el libro abierto en pantalla completa y sus herramientas de investigación.</p>
          <Link href="/aprender/juegos" className="mt-6 inline-flex min-h-11 items-center justify-center border border-[#c6a46b] bg-[#392916] px-5 py-3 text-xs font-black text-[#f7e8c5] hover:bg-[#4c351b]">Volver a los juegos</Link>
        </section>
      </main>
    );
  }

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
          <Link href="/aprender/juegos" aria-label="Salir del juego" title="Salir del juego" className="archivo-exit-arrow" >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Salir del juego</span>
          </Link>
          <section className="mt-7 border-[5px] border-double border-[#9e7944] bg-[#21180f] p-6 shadow-[8px_8px_0_#090705] sm:p-10">
            <div className="archivo-finish-monogram mx-auto grid h-16 w-16 place-items-center" aria-hidden="true"><span>001</span></div>
            <SmallLabel>Expediente 001 · Informe de lectura</SmallLabel>
            <h1 className="mt-3 text-center font-serif text-3xl font-bold sm:text-4xl">Lectura concluida</h1>
            <p className="mt-3 text-center text-sm text-[#d0bd9c]">Has terminado {readings.length === 1 ? "la lectura y sus cinco preguntas." : "las dos lecturas y sus diez preguntas."}</p>
            <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#e5c58f]">
              Rango obtenido · {investigatorRank}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Aciertos</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{correctCount}<span className="text-sm text-[#bda67e]">/{questions.length}</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Puntaje</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{score}<span className="text-sm text-[#bda67e]">/1000</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Respondidas</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{answeredCount}<span className="text-sm text-[#bda67e]">/{questions.length}</span></p></div>
            </div>
            {completionMessage && <p className="mt-6 border border-[#927342] bg-[#302315] p-4 text-center text-sm font-semibold text-[#f0d59c]">{completionMessage}</p>}
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
      style={{ backgroundImage: "linear-gradient(180deg, rgba(12,8,5,.34), rgba(12,8,5,.52)), url('/images/games/archivo-oculto/fondo-biblioteca.png')", backgroundPosition: "center center", backgroundSize: "cover", backgroundAttachment: "scroll" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,transparent_22%,rgba(8,5,3,.32)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-112px)] max-w-[1480px] flex-col">
        <header className="flex min-h-10 items-center justify-between gap-3">
          <Link href="/aprender/juegos" aria-label="Salir del juego" title="Salir del juego" className="archivo-exit-arrow shrink-0">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Salir del juego</span>
          </Link>

        </header>
        {error && <p role="alert" className="mx-auto mt-3 max-w-xl border border-rose-300/40 bg-[#310f0e]/90 px-4 py-3 text-center text-xs text-rose-100 shadow-xl">{error}</p>}
        {phase === "cover" ? (
          <section className="archivo-entry-layout flex flex-1 flex-col items-center justify-center gap-2 py-5 sm:py-3">
            <button type="button" aria-label="Abrir El Archivo Oculto" aria-disabled={starting || questions.length < 5} disabled={starting || questions.length < 5} onClick={() => void startBook()} className="archivo-3d-book-trigger group relative block shrink-0 outline-none transition duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#f5d38f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#21140e] disabled:cursor-wait disabled:opacity-75">
              <ArchivoOcultoBookScene opening={openingBook} />
              <span className="sr-only">{starting ? "Abriendo expediente" : "Abrir expediente"}</span>
            </button>
          </section>
        ) : (
          <section className="archivo-reader-layout flex flex-1 flex-col justify-center py-4 sm:py-5">
            <div className="archivo-reader-stage relative mx-auto w-full max-w-[1160px]">
              <FlipBook ref={bookRef} className="archivo-book mx-auto" width={530} height={700} size="stretch" minWidth={300} maxWidth={650} cover layout="auto" binding="left" flipDuration={760} easing={(progress) => progress * progress * (3 - 2 * progress)} shadows shadowOpacity={0.16} hover={false} page={bookPage} onFlip={handleFlip} onFlipProgress={handleFlipProgress}>
                <Page density="hard" className="archivo-cover archivo-cover-front">
                  <div className="archivo-flip-cover archivo-flip-cover-front" aria-label="Portada roja lisa" />
                </Page>
                {questions.flatMap((question,index)=>{
                  const readingPage=readingPagesByQuestionId.get(question.id);
                  const reading=readingPage?.reading;
                  const readingPartBlocks=readingPage?.blocks ?? [];
                  const pageHasEvidence=readingPartBlocks.some(block=>block.type==="image");
                  const answer=feedbackById[question.id];
                  return [
                    <Page key={question.id+"-text"} className="archivo-page archivo-page-left">
                      <BookPaper className="archivo-page-inner p-6 sm:p-7">
                        <div className="archivo-page-running-head flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>El Archivo Oculto · Lectura {reading?String(readings.indexOf(reading)+1).padStart(2,"0"):"01"}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">PÁG. {index*2+1}</span></div>
                        <h2 className="archivo-reading-title mt-4 font-serif text-[25px] font-bold leading-tight text-[#382816]">{reading?.title}</h2>
                        <div className="archivo-reading-byline mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#92764c]"><span>{reading?.typeLabel}</span><span>·</span><span>{reading?.authorLabel}</span></div>
                        <div className="archivo-reading-flow mt-4 flex min-h-0 flex-1 flex-col border-t border-[#ddcaa8] pt-3"><ReadingContent blocks={readingPartBlocks}/></div>
                        <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+1}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>,
                    <Page key={question.id+"-question"} className="archivo-page archivo-page-right">
                      <BookPaper className="archivo-page-inner p-6 sm:p-7">
                        <div className="flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>Pregunta {String(index+1).padStart(2,"0")}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">LECTURA CRÍTICA</span></div>
                        <div className="archivo-question-content mt-3 min-h-0 flex-1 overflow-y-auto" aria-label="Contenido de la pregunta" tabIndex={0}>
                        {pageHasEvidence && (
                          <div className="mt-2 flex items-start gap-3 border border-[#bd9f70] bg-[#f0dfbf] px-3 py-2 shadow-sm">
                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-[#9b3025] bg-[#8f211c] font-serif text-sm font-black text-[#fff0d3]">!</span>
                            <div>
                              <p className="font-mono text-[8px] font-black uppercase tracking-[.16em] text-[#9b3025]">Cruce de fuentes</p>
                              <p className="mt-1 font-serif text-[11px] leading-[1.5] text-[#513a23]">Vuelve a las evidencias del expediente. Contrasta sus datos con el texto antes de elegir tu respuesta.</p>
                            </div>
                          </div>
                        )}
                                                <div className="archivo-question-card mt-3 border-l-[3px] border-[#a9824d] bg-[#ead9b7] p-5"><p className="archivo-question-competency text-[10px] font-bold uppercase tracking-[.14em] text-[#8b6b3f]">{question.competencyShort}</p><h2 className="archivo-question-prompt mt-2 font-serif text-[21px] font-bold leading-snug text-[#382816]">{question.prompt}</h2></div>
                        <div className="archivo-option-list mt-4">
                          {question.options.map((option,optionIndex)=>{
                            const isSelected=(answer?.selectedOption??(questionIndex===index?selectedOption:null))===optionIndex;
                            const isCorrect=answer&&answer.correctOption===optionIndex;
                            const isWrong=answer&&isSelected&&!answer.isCorrect;
                            return <button key={optionIndex} type="button" data-opf-no-flip data-state={isCorrect?"correct":isWrong?"wrong":isSelected?"selected":"idle"} disabled={Boolean(answer)||phase!=="playing"||questionIndex!==index} onClick={()=>setSelectedOption(optionIndex)} className={"archivo-option flex min-h-[64px] w-full items-start gap-3 border px-4 py-4 text-left text-[12px] leading-[1.5] transition "+(isCorrect?"border-emerald-700 bg-[#e2ead8]":isWrong?"border-rose-700 bg-[#f1dfd5]":isSelected?"border-[#a77b3f] bg-[#ead6ad]":"border-[#d0b98d] bg-[#f8eedb] hover:border-[#947044]")+" disabled:cursor-default"}>
                              <span className={"archivo-option-key grid h-8 w-8 shrink-0 place-items-center border font-serif text-[13px] font-bold "+(isCorrect?"border-emerald-700 bg-emerald-800 text-white":isWrong?"border-rose-700 bg-rose-800 text-white":"border-[#b39a6d] bg-[#f0dfbc] text-[#604522]")}>{String.fromCharCode(65+optionIndex)}</span>
                              <span className="archivo-option-copy flex-1 pt-0.5 text-[#42311d]">{option}</span>{isCorrect&&<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-800"/>}{isWrong&&<XCircle className="h-5 w-5 shrink-0 text-rose-800"/>}
                            </button>;
                          })}
                        </div>
                        {answer?<div aria-live="polite" className={"archivo-feedback mt-4 border p-4 shadow-sm "+(answer.isCorrect?"border-[#9aaa72] bg-[#edf0dd]":"border-[#c18a71] bg-[#f2e3d5]")}><div className="flex items-center gap-2"><Lightbulb className={"h-5 w-5 shrink-0 "+(answer.isCorrect?"text-[#61733e]":"text-[#9a6041]")}/><p className={"font-serif text-[14px] font-bold "+(answer.isCorrect?"text-[#354b27]":"text-[#75442e]")}>{answer.isCorrect?"Comprende la respuesta":"Aprende de esta respuesta"}</p></div><p className="archivo-answer-explanation mt-2 text-[12px] leading-[1.65] text-[#51402b]">{answer.explanation}</p></div>:<div className="archivo-question-hint mt-4 flex items-center gap-2 border border-dashed border-[#cdb58c] bg-[#f3e7cf]/70 px-4 py-3 text-[11px] text-[#8b704c]"><span className="archivo-hint-rule" aria-hidden="true" />Lee el texto y elige la opción que mejor sustenta tu respuesta.</div>}
                        </div>
                        <div className="archivo-question-actions mt-2 border-t border-[#bda47b] pt-3">
                          {!answer&&questionIndex===index&&<button type="button" data-opf-no-flip onClick={()=>void submitAnswer()} disabled={selectedOption===null||savingAnswer} className="archivo-submit-answer inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-5 py-3 text-[11px] font-black uppercase tracking-[.14em] text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] transition hover:-translate-y-0.5 hover:bg-[#8c6839] disabled:cursor-not-allowed disabled:opacity-45">{savingAnswer?"Comprobando…":"Comprobar respuesta"}<ArrowRight className="h-4 w-4"/></button>}
                          {answer&&questionIndex===index&&index===questions.length-1&&<button type="button" data-opf-no-flip onClick={()=>void finishBook()} disabled={finishing} className="archivo-submit-answer inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-5 py-3 text-[11px] font-black uppercase tracking-[.14em] text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] transition hover:-translate-y-0.5 hover:bg-[#8c6839] disabled:opacity-50">{finishing?"Cerrando expediente…":"Cerrar expediente"}<ArrowRight className="h-4 w-4"/></button>}
                        </div>
                        <div className="archivo-page-folio mt-3 flex items-center justify-center gap-3 font-mono text-[9px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+2}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>
                  ];
                })}
                <Page density="hard" className="archivo-cover archivo-cover-back">
                  <div className="archivo-flip-cover archivo-flip-cover-back" aria-label="Contraportada roja lisa" />
                </Page>
              </FlipBook>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
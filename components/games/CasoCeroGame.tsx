"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileSearch,
  FlaskConical,
  Leaf,
  Lightbulb,
  Microscope,
  RotateCcw,
  XCircle,
} from "lucide-react";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import CasoCeroScene from "@/components/games/CasoCeroScene";
import CasoCeroCinematicScene from "@/components/games/CasoCeroCinematicScene";
import CasoCeroLoadingSkeleton from "@/components/games/CasoCeroLoadingSkeleton";
import type { EvidenceCase } from "@/lib/games/caso-cero-bank";
import {
  prepareCasoCeroAmbientAudio,
  revealCasoCeroAmbientAudio,
  stopCasoCeroAmbientAudio,
} from "@/lib/games/caso-cero-audio";

type PublicCase = Omit<EvidenceCase, "answer" | "explanation">;
type CaseResult = PublicCase & {
  questionNumber: number;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};
type Feedback = {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
};

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const subjectMark = (subject: string) => {
  if (subject === "Biología") return <Leaf className="h-4 w-4" />;
  if (subject === "Física") return <Activity className="h-4 w-4" />;
  if (subject === "Química") return <FlaskConical className="h-4 w-4" />;
  return <Microscope className="h-4 w-4" />;
};

export default function CasoCeroGame() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [phase, setPhase] = useState<"loading" | "intro" | "playing" | "feedback" | "finished">("loading");
  const [rounds, setRounds] = useState<PublicCase[]>([]);
  const [index, setIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [busyStarting, setBusyStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [orbyOpen, setOrbyOpen] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [cinematicReady, setCinematicReady] = useState(false);
  const prepareAmbientAudio = useCallback(() => prepareCasoCeroAmbientAudio(), []);
  const revealAmbientAudio = useCallback(() => revealCasoCeroAmbientAudio(), []);
  const handleSceneReady = useCallback(() => setCinematicReady(true), []);
  const handleSceneInteraction = useCallback(() => {
    // Direct URL visits may not have received the catalog's JUGAR gesture.
    // Keep audio silent until ready, then let a real interaction retry playback.
    if (cinematicReady) revealAmbientAudio();
    else prepareAmbientAudio();
  }, [cinematicReady, prepareAmbientAudio, revealAmbientAudio]);

  useEffect(() => {
    // A direct route visit also prepares tracks silently while data/assets load.
    void prepareAmbientAudio();
    return () => stopCasoCeroAmbientAudio();
  }, [prepareAmbientAudio]);

  useEffect(() => {
    if (phase === "intro" && cinematicReady) {
      revealAmbientAudio();
    }
  }, [phase, cinematicReady, revealAmbientAudio]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch("/api/games/caso-cero/questions", { credentials: "same-origin" }),
      fetch("/api/games/progress?gameKey=caso-cero", { credentials: "same-origin" }),
    ]).then(async ([questionsResponse, progressResponse]) => {
      const questionData = await questionsResponse.json().catch(() => ({}));
      if (!questionsResponse.ok) throw new Error(questionData.error ?? "No se pudo cargar el archivo de casos.");
      if (!cancelled) setCases(Array.isArray(questionData.questions) ? questionData.questions as PublicCase[] : []);
      const progressData = await progressResponse.json().catch(() => ({}));
      if (!cancelled && progressResponse.ok && progressData.progress) {
          setGamesCompleted(Number(progressData.progress.games_completed) || 0);
      }
      if (!cancelled) setPhase("intro");
    }).catch((cause: unknown) => {
      if (!cancelled) {
        setError(cause instanceof Error ? cause.message : "No se pudo cargar el juego.");
        setPhase("intro");
      }
    });
    return () => { cancelled = true; };
  }, []);

  const currentCase = rounds[index] ?? null;
  const correctCount = results.filter((item) => item.isCorrect).length;
  const score = correctCount * 100;
  const wrongResults = useMemo(() => results.filter((item) => !item.isCorrect), [results]);
  const progressPercent = rounds.length ? Math.round(((index + (phase === "feedback" ? 1 : 0)) / rounds.length) * 100) : 0;

  const beginCaseFile = useCallback(async () => {
    if (cases.length < 10 || busyStarting) {
      if (cases.length < 10) setError("Necesitamos al menos diez casos publicados para iniciar una investigación.");
      return;
    }
    setBusyStarting(true);
    setError(null);
    try {
      const chosen = shuffled(cases).slice(0, 10);
      const response = await fetch("/api/games/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameKey: "caso-cero", questionIds: chosen.map((item) => item.id) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.sessionId !== "string") throw new Error(data.error ?? "No se pudo abrir el expediente. Inténtalo de nuevo.");
      setRounds(chosen);
      setSessionId(data.sessionId);
      setIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setResults([]);
      setProgressSaved(false);
      setPhase("playing");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar la partida.");
    } finally {
      setBusyStarting(false);
    }
  }, [cases, busyStarting]);

  const submitAnswer = useCallback(async (optionIndex: number) => {
    if (!currentCase || !sessionId || loadingAnswer || phase !== "playing") return;
    setSelectedOption(optionIndex);
    setLoadingAnswer(true);
    setError(null);
    try {
      const response = await fetch("/api/games/answer", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentCase.id, selectedOption: optionIndex }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Number.isInteger(data.correctOption)) throw new Error(data.error ?? "No se pudo validar tu respuesta.");
      const result: CaseResult = {
        ...currentCase,
        questionNumber: index + 1,
        selectedOption: optionIndex,
        correctOption: Number(data.correctOption),
        isCorrect: Boolean(data.isCorrect),
        explanation: typeof data.explanation === "string" ? data.explanation : "Revisa los datos del expediente y compara tu razonamiento con la respuesta correcta.",
      };
      setFeedback({ isCorrect: result.isCorrect, correctOption: result.correctOption, explanation: result.explanation });
      setResults((previous) => [...previous.filter((item) => item.id !== result.id), result]);
      setPhase("feedback");
    } catch (cause) {
      setSelectedOption(null);
      setError(cause instanceof Error ? cause.message : "Error al validar tu respuesta.");
    } finally {
      setLoadingAnswer(false);
    }
  }, [currentCase, index, loadingAnswer, phase, sessionId]);

  const continueCase = useCallback(async () => {
    if (index + 1 < rounds.length) {
      setIndex((previous) => previous + 1);
      setSelectedOption(null);
      setFeedback(null);
      setPhase("playing");
      return;
    }

    setPhase("finished");
    if (progressSaved) return;
    const finalCorrect = results.filter((item) => item.isCorrect).length;
    const finalScore = finalCorrect * 100;
    try {
      const response = await fetch("/api/games/progress", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameKey: "caso-cero", score: finalScore, correct: finalCorrect }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.progress) {
          setGamesCompleted(Number(data.progress.games_completed) || gamesCompleted + 1);
        setProgressSaved(true);
      } else {
        setError(data.error ?? "Terminaste el expediente, pero no pudimos guardar tu progreso.");
      }
    } catch {
      setError("Terminaste el expediente, pero no pudimos guardar tu progreso.");
    }
  }, [gamesCompleted, index, progressSaved, results, rounds.length]);

  const resetView = () => {
    setError(null);
    setPhase("intro");
    setRounds([]);
    setIndex(0);
    setSessionId(null);
    setSelectedOption(null);
    setFeedback(null);
    setResults([]);
    setProgressSaved(false);
    setOrbyOpen(false);
  };

  if (phase === "loading") {
    return <CasoCeroLoadingSkeleton />;
  }

  if (phase === "intro") {
    return (
      <>
        <CasoCeroCinematicScene
          canStart={cases.length >= 10}
          busyStarting={busyStarting}
          error={error}
          caseCount={cases.length}
          onStart={() => void beginCaseFile()}
          onSceneReady={handleSceneReady}
          onUserInteraction={handleSceneInteraction}
        />

      </>
    );
  }

  return (
    <>
    <main
      onPointerDownCapture={handleSceneInteraction}
      onKeyDownCapture={handleSceneInteraction}
      className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#050a15] text-white"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(ellipse at 16% 0%, rgba(40,117,111,.28), transparent 45%), radial-gradient(ellipse at 86% 80%, rgba(176,105,41,.18), transparent 42%)" }} />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-7 sm:py-8">
        <Link href="/aprender/juegos" className="inline-flex items-center gap-2 border border-[#65563d] bg-[#111720] px-3 py-2 text-xs font-bold text-[#f1e5d0] transition hover:border-[#d3a85f]"><ArrowLeft className="h-4 w-4"/> Todos los juegos</Link>

        {(phase === "playing" || phase === "feedback") && currentCase && (
          <section className="mx-auto mt-5 max-w-6xl">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
              <div className="min-w-0 overflow-hidden border-[3px] border-[#485663] bg-[#0a101b] shadow-[5px_5px_0_#02050a]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#364551] bg-[#111a25] px-4 py-3 sm:px-6">
                  <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#d9ad65]">CASO CERO · EXPEDIENTE {String(index + 1).padStart(2, "0")}</p><h1 className="mt-1 text-lg font-black sm:text-xl">{currentCase.title}</h1></div>
                  <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 border border-[#5a4930] bg-[#211a12] px-2.5 py-1.5 text-[10px] font-bold text-[#f1cb86]">{subjectMark(currentCase.subject)}{currentCase.subject}</span><span className="text-xs font-black text-[#c4cfda]">{index + 1}/10</span></div>
                </div>
                <div className="h-1.5 bg-[#1c2834]"><div className="h-full bg-[#d8a24d] transition-all duration-300" style={{ width: `${progressPercent}%` }}/></div>
                <div className="grid gap-0 xl:grid-cols-[.88fr_1.12fr]">
                  <div className="border-b border-[#33414d] p-4 sm:p-6 xl:border-b-0 xl:border-r">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#89c7bd]"><FileSearch className="h-4 w-4"/> Contexto del caso</div>
                    <p className="mt-3 text-sm leading-6 text-[#d4deea]">{currentCase.context}</p>
                    <div className="mt-5 border border-[#465664] bg-[#0d1520] p-3">
                      <div className="flex items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-[.13em] text-[#e8bf7b]">{currentCase.evidenceLabel}</p><span className="text-[9px] text-[#8397a8]">{currentCase.evidenceUnit}</span></div>
                      <div className="mt-3 grid gap-2">
                        {currentCase.evidenceRows.map((row) => <div key={row.label} className="flex min-w-0 items-center justify-between gap-3 border-b border-[#25323f] pb-2 last:border-0 last:pb-0"><span className="min-w-0 text-xs text-[#becbd9]">{row.label}</span><span className="shrink-0 border border-[#4a5b60] bg-[#17252a] px-2 py-1 text-xs font-black tabular-nums text-[#b9e0d4]">{row.displayValue}</span></div>)}
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 border-l-2 border-[#b5813a] bg-[#211a12] p-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#f1c475]"/><p className="text-xs leading-5 text-[#dbc9a7]">{currentCase.hint}</p></div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#d9ad65]">PREGUNTA DE ANÁLISIS</p>
                    <h2 className="mt-3 text-base font-extrabold leading-7 text-white sm:text-lg">{currentCase.question}</h2>
                    <p className="mt-3 text-[10px] leading-5 text-[#8294a9]">Competencia: {currentCase.competence} · Dificultad: {currentCase.difficulty}</p>
                    <div className="mt-5 grid gap-3">
                      {currentCase.options.map((option, optionIndex) => {
                        const isSelected = selectedOption === optionIndex;
                        const isAnswer = phase === "feedback" && feedback?.correctOption === optionIndex;
                        const isWrongSelection = phase === "feedback" && isSelected && !feedback?.isCorrect;
                        return <button key={option} type="button" disabled={phase === "feedback" || loadingAnswer} onClick={() => void submitAnswer(optionIndex)} className={`group flex w-full items-start gap-3 border-2 p-3 text-left transition sm:p-4 ${isAnswer ? "border-[#78c99c] bg-[#132b20]" : isWrongSelection ? "border-[#ce7868] bg-[#301a1a]" : isSelected ? "border-[#d5a455] bg-[#2c2114]" : "border-[#344250] bg-[#101923] hover:border-[#b78a4c] hover:bg-[#1c2226]"} disabled:cursor-default`}>
                          <span className={`grid h-7 w-7 shrink-0 place-items-center border text-xs font-black ${isAnswer ? "border-[#78c99c] bg-[#1b5839] text-white" : isWrongSelection ? "border-[#ce7868] bg-[#542722] text-white" : "border-[#536273] bg-[#0a1018] text-[#d6b574]"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                          <span className="flex-1 text-sm leading-6 text-[#e4eaf0]">{option}</span>
                          {isAnswer && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#8be1ad]"/>}
                          {isWrongSelection && <XCircle className="mt-1 h-5 w-5 shrink-0 text-[#ef9c8c]"/>}
                        </button>;
                      })}
                    </div>
                    {loadingAnswer && <p className="mt-4 text-xs text-[#f0c97c]">Validando tu conclusión…</p>}
                    {error && <p role="alert" className="mt-4 border border-[#9d5749] bg-[#2b1716] px-3 py-2 text-xs text-[#ffd1c6]">{error}</p>}
                    {phase === "feedback" && feedback && (
                      <div className={`mt-5 border-2 p-4 ${feedback.isCorrect ? "border-[#578d6b] bg-[#10231a]" : "border-[#94694a] bg-[#241a14]"}`}>
                        <div className="flex items-center gap-2">{feedback.isCorrect ? <CheckCircle2 className="h-5 w-5 text-[#8be1ad]"/> : <CircleHelp className="h-5 w-5 text-[#f2bd76]"/>}<h3 className="text-sm font-black">{feedback.isCorrect ? "Conclusión respaldada" : "Revisemos la evidencia"}</h3><span className="ml-auto text-xs font-black text-[#e8c47f]">{feedback.isCorrect ? "+100 PTS" : "0 PTS"}</span></div>
                        <p className="mt-3 text-sm leading-6 text-[#d4deea]">{feedback.explanation}</p>
                        <button type="button" onClick={() => void continueCase()} className="mt-4 inline-flex min-h-11 items-center gap-2 border-2 border-[#e7bd72] bg-[#bd7729] px-4 py-2.5 text-xs font-black text-[#fff7e7] shadow-[3px_3px_0_#513013] transition hover:bg-[#d18a3c]">{index + 1 === rounds.length ? "Ver informe del caso" : "Siguiente expediente"} <ArrowRight className="h-4 w-4"/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <aside className="space-y-3">
                <div className="border-2 border-[#465664] bg-[#0a101b] p-4">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#d9ad65]"><ClipboardList className="h-4 w-4"/> Informe de misión</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="border border-[#46515d] bg-[#121a23] p-3"><p className="text-[9px] text-[#a7b6c7]">Puntos</p><p className="mt-1 text-xl font-black text-[#ffd17b]">{score}</p></div>
                    <div className="border border-[#46515d] bg-[#121a23] p-3"><p className="text-[9px] text-[#a7b6c7]">Casos</p><p className="mt-1 text-xl font-black text-white">{results.length}/10</p></div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-[#aab8c8]">No busques solo la opción correcta. Determina qué evidencias la respaldan y cuáles conclusiones serían demasiado fuertes.</p>
                </div>
                <div className="border border-[#7c5b35] bg-[#17140f] p-4"><div className="flex items-center gap-2 text-xs font-black text-[#efc47e]"><BrainCircuit className="h-4 w-4"/> Orby está disponible</div><p className="mt-2 text-xs leading-5 text-[#c7baa3]">Pregunta por el concepto o por los datos de este expediente. Al terminar, también podrás elegir errores en su cuaderno para una explicación paso a paso.</p><button type="button" onClick={() => setOrbyOpen(true)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border-2 border-[#e8a653] bg-[#a85b1d] px-3 py-2 text-[10px] font-black text-white shadow-[3px_3px_0_#48240e] transition hover:bg-[#c5732a]"><Image src="/avatars/photo_perfil/orbyp.png" alt="" width={22} height={22} className="h-5 w-5 rounded-full object-contain"/> Preguntar a Orby sobre este caso</button></div>
              </aside>
            </div>
          </section>
        )}

        {phase === "finished" && (
          <section className="mx-auto mt-6 max-w-5xl overflow-hidden border-[3px] border-double border-[#a87a3e] bg-[#0a101b] shadow-[6px_6px_0_#02050a]">
            <div className="flex flex-wrap items-center gap-4 border-b border-[#59452b] bg-gradient-to-r from-[#241a10] to-[#10151c] p-5 sm:p-8">
              <div className="grid h-16 w-16 place-items-center border-2 border-[#c69a56] bg-[#2b2012]"><ClipboardList className="h-8 w-8 text-[#f0c779]"/></div>
              <div className="flex-1"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#d9ad65]">CASO CERO · INFORME DE CIERRE</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{correctCount >= 8 ? "Evidencias bien analizadas." : correctCount >= 5 ? "El caso está parcialmente resuelto." : "La investigación continúa."}</h1><p className="mt-2 text-sm leading-6 text-[#c5d0dc]">{correctCount >= 8 ? "Supiste distinguir datos de conclusiones. Sigue afinando ese criterio." : "Revisa qué inferencias no estaban respaldadas y vuelve a resolver otro expediente."}</p></div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
              <div className="border border-[#55452f] bg-[#151821] p-4"><p className="text-[10px] font-bold text-[#acb9c7]">PUNTOS</p><p className="mt-2 text-3xl font-black text-[#ffd17b]">{score}<span className="ml-1 text-sm">/1000</span></p></div>
              <div className="border border-[#364756] bg-[#121b23] p-4"><p className="text-[10px] font-bold text-[#acb9c7]">CASOS RESUELTOS</p><p className="mt-2 text-3xl font-black text-white">{correctCount}<span className="ml-1 text-sm text-[#a9b7c7]">/10</span></p></div>
              <div className="border border-[#364756] bg-[#121b23] p-4"><p className="text-[10px] font-bold text-[#acb9c7]">ARCHIVOS POR REPASAR</p><p className="mt-2 text-3xl font-black text-[#e9bb74]">{wrongResults.length}</p></div>
            </div>
            <div className="border-t border-[#34414c] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">¿Qué hacemos con los errores?</h2><p className="mt-1 text-xs leading-5 text-[#aebdcd]">Abre a Orby y elige en su cuaderno el expediente que quieres entender mejor.</p></div><button type="button" onClick={() => setOrbyOpen(true)} className="inline-flex min-h-11 items-center gap-2 border-2 border-[#ffc078] bg-gradient-to-b from-[#df842d] to-[#a95218] px-4 py-2.5 text-xs font-black text-white shadow-[3px_3px_0_#54290f] transition hover:from-[#ee9b43] hover:to-[#bd631f]"><Image src="/avatars/photo_perfil/orbyp.png" alt="" width={26} height={26} className="h-6 w-6 rounded-full object-contain"/> Conversar con Orby</button></div>
              {wrongResults.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {wrongResults.map((item) => <div key={item.id} className="border border-[#55442f] bg-[#13171d] p-3"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#d4a35e]">EXPEDIENTE {String(item.questionNumber).padStart(2, "0")} · {item.subject}</p><p className="mt-2 text-sm font-bold leading-5 text-[#e3e9f0]">{item.question}</p><p className="mt-2 text-[10px] leading-4 text-[#b7c3d1]">Tu opción: {item.options[item.selectedOption]}</p><p className="mt-1 text-[10px] leading-4 text-[#9fd7b0]">Respuesta respaldada: {item.options[item.correctOption]}</p></div>)}
              </div>}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-[#36414b] pt-5">
                <button type="button" onClick={() => { resetView(); }} className="inline-flex min-h-11 items-center gap-2 border-2 border-[#9ce5ae] bg-[#207543] px-5 py-3 text-xs font-black text-white transition hover:bg-[#2c8d50]"><RotateCcw className="h-4 w-4"/> Volver a jugar</button>
                <Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border border-[#766b5b] bg-[#151923] px-5 py-3 text-xs font-bold text-[#f0e4d3] transition hover:border-[#d29a55]"><ArrowLeft className="h-4 w-4"/> Ver más juegos</Link>
                <span className="ml-auto self-center text-[10px] text-[#8fa0b2]">{progressSaved ? "Progreso guardado" : "Guardando progreso…"}</span>
              </div>
              {error && <p role="alert" className="mt-4 text-xs text-[#ffd1c6]">{error}</p>}
            </div>
          </section>
        )}
      </div>
      <LessonAITutor
        reviewQuestions={wrongResults.map((item) => ({
          id: item.id,
          number: item.questionNumber,
          subject: item.subject,
          topic: item.topic,
          prompt: item.question,
          options: item.options,
          userAnswer: item.options[item.selectedOption] ?? "Respuesta seleccionada",
          correctAnswer: item.options[item.correctOption] ?? "Respuesta correcta",
          explanation: item.explanation,
        }))}
        open={orbyOpen}
        onOpenChange={setOrbyOpen}
        accent="orby"
        stage="practice"
        subject={phase === "playing" || phase === "feedback" ? currentCase?.subject ?? "Ciencias Naturales" : "Ciencias Naturales"}
        topic={phase === "playing" || phase === "feedback" ? currentCase?.topic ?? "Caso Cero · Archivo de evidencias" : "Caso Cero · Archivo de evidencias"}
        question={phase === "playing" || phase === "feedback" ? currentCase?.question ?? "" : ""}
        context={(phase === "playing" || phase === "feedback") && currentCase ? [
          currentCase.context,
          "Datos del expediente: " + currentCase.evidenceRows.map((row) => row.label + ": " + row.displayValue).join("; "),
          "Pregunta: " + currentCase.question,
          "Opciones: " + currentCase.options.map((option, optionIndex) => String.fromCharCode(65 + optionIndex) + ") " + option).join("; "),
          "Pista disponible: " + currentCase.hint,
        ].join("\n") : ""}
      />
    </main>
    </>
  );
}

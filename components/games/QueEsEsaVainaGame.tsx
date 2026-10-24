"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, Lightbulb, RotateCcw, Sparkles, Trophy, XCircle } from "lucide-react";

import { QUESTION_BANK, type Question } from "@/lib/games/que-es-esa-vaina-bank";

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = "peakscore-que-es-esa-vaina-v1";

type SavedProgress = { bestScore: number; completedIds: string[]; chests: number };

function getRoundsFromPool(source: Question[]): Question[] {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOTAL_ROUNDS);
}

function getRounds(): Question[] {
  return getRoundsFromPool(QUESTION_BANK);
}

export default function QueEsEsaVainaGame() {
  const [rounds, setRounds] = useState<Question[]>([]);
  const [questionPool, setQuestionPool] = useState<Question[]>(QUESTION_BANK);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState<SavedProgress>({ bestScore: 0, completedIds: [], chests: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [accountProgress, setAccountProgress] = useState<{ best_score: number; best_correct: number; games_completed: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedProgress>;
        setSaved({
          bestScore: Math.max(0, Number(parsed.bestScore) || 0),
          completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds.filter((id): id is string => typeof id === "string") : [],
          chests: Math.max(0, Number(parsed.chests) || 0),
        });
      }
    } catch {
      // El juego continúa sin progreso guardado si el almacenamiento está bloqueado.
    }
    let active = true;
    void fetch("/api/games/questions", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = await response.json();
        return Array.isArray(payload?.questions) ? payload.questions : [];
      })
      .then((published: Array<Partial<Question> & { id: string }>) => {
        if (!active) return;
        const valid = published.filter((q) =>
          typeof q.id === "string" &&
          typeof q.subject === "string" &&
          typeof q.topic === "string" &&
          typeof q.clue === "string" &&
          Array.isArray(q.options) && q.options.length === 4 &&
          q.options.every((option) => typeof option === "string") &&
          Number.isInteger(q.answer) && Number(q.answer) >= 0 && Number(q.answer) <= 3 &&
          typeof q.explanation === "string" && typeof q.hint === "string"
        ) as Question[];
        const pool = valid.length >= TOTAL_ROUNDS ? valid : QUESTION_BANK;
        setQuestionPool(pool);
        setRounds(getRoundsFromPool(pool));
      })
      .catch(() => {
        if (active) {
          setQuestionPool(QUESTION_BANK);
          setRounds(getRounds());
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    void fetch("/api/games/progress", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.progress ?? null;
      })
      .then((progress) => {
        if (!active || !progress) return;
        setAccountProgress({
          best_score: Math.max(0, Number(progress.best_score) || 0),
          best_correct: Math.max(0, Number(progress.best_correct) || 0),
          games_completed: Math.max(0, Number(progress.games_completed) || 0),
        });
      })
      .catch(() => {
        // El juego sigue disponible aunque no se pueda consultar el progreso de la cuenta.
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // El progreso de esta sesión sigue funcionando aunque localStorage no esté disponible.
    }
  }, [saved, hydrated]);

  const question = rounds[index];
  // La barra conserva cinco hitos visuales, pero solo hay tres cofres reclamables.
  // Se desbloquean al alcanzar 2, 5 y 8 respuestas correctas.
  const chestThresholds = [2, 5, 8];
  const chestLevel = Math.max(
    Math.min(3, Number(saved.chests) || 0),
    chestThresholds.filter((threshold) => correctCount >= threshold).length,
  );
  const progress = finished ? 100 : Math.round((index / TOTAL_ROUNDS) * 100);
  const answeredCorrectly = selected !== null && question?.answer === selected;

  const chooseOption = useCallback((optionIndex: number) => {
    if (revealed || finished) return;
    setSelected(optionIndex);
    setRevealed(true);
    const current = rounds[index];
    if (!current) return;
    const isCorrect = optionIndex === current.answer;
    if (isCorrect) {
      setScore((value) => value + 100);
      setCorrectCount((value) => value + 1);
    }
    // Una pregunta solo queda marcada como completada cuando se responde correctamente.
    // Los intentos incorrectos permiten reintentar sin consumir progreso ni registrar el ID.
    if (isCorrect) {
      setSaved((value) => ({
        ...value,
        completedIds: value.completedIds.includes(current.id) ? value.completedIds : [...value.completedIds, current.id],
      }));
    }
  }, [finished, index, revealed, rounds]);

  const next = useCallback(() => {
    if (!revealed) return;
    if (index + 1 >= rounds.length) {
      setFinished(true);
      setSaved((value) => ({
        ...value,
        bestScore: Math.max(value.bestScore, score),
        chests: Math.max(value.chests, chestThresholds.filter((threshold) => correctCount >= threshold).length),
      }));
      setSaveStatus("saving");
      void fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct: correctCount }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("No se pudo guardar el progreso de la cuenta.");
          const payload = await response.json();
          const progress = payload?.progress;
          if (progress) {
            setAccountProgress({
              best_score: Math.max(0, Number(progress.best_score) || 0),
              best_correct: Math.max(0, Number(progress.best_correct) || 0),
              games_completed: Math.max(0, Number(progress.games_completed) || 0),
            });
          }
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
  }, [correctCount, index, revealed, rounds.length, score]);

  const restart = useCallback(() => {
    setRounds(getRoundsFromPool(questionPool));
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setCorrectCount(0);
    setHintsUsed([]);
    setShowHint(false);
    setFinished(false);
  }, [questionPool]);

  const useHint = () => {
    if (!question || showHint) return;
    setShowHint(true);
    setHintsUsed((current) => current.includes(question.id) ? current : [...current, question.id]);
  };

  const totalCorrect = finished ? correctCount : correctCount;
  const earnedChests = chestLevel;

  const chestMessage = useMemo(() => {
    if (chestLevel >= 3) return "¡Los tres cofres están desbloqueados!";
    if (chestLevel >= 2) return "¡Vas muy bien! Sigue acertando para desbloquear el siguiente cofre.";
    if (chestLevel >= 1) return "¡Buen comienzo! Sigue acertando para alcanzar el siguiente cofre.";
    return "Resuelve preguntas para llenar el cofre.";
  }, [chestLevel]);

  if (!hydrated || rounds.length === 0) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#07091a] text-white"><p className="animate-pulse text-sm">Preparando el desafío...</p></main>;
  }

  const handleNext = () => {
    if (!revealed) return;
    try {
      const audio = new Audio("/sounds/navigation.mp3");
      audio.volume = 0.35;
      void audio.play().catch(() => undefined);
    } catch {
      // El sonido no debe bloquear la navegación.
    }
    if (!answeredCorrectly) {
      setSelected(null);
      setRevealed(false);
      setShowHint(false);
      return;
    }
    next();
  };

  return (
    <main className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#070b18] text-white">
      <div className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} />
      <div className="absolute inset-0 -z-20 bg-[#040817]/30" />
      <div className="absolute inset-0 -z-10 bg-[#030817]/20" />
      <div className="ml-auto mr-[1vw] w-full max-w-[1390px] px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex min-h-10 items-center gap-2 border-[3px] border-[#77839d] bg-[#10172b]/95 px-3 py-2 text-xs font-black text-white shadow-[4px_4px_0_#030713] transition hover:bg-[#1c2942]"><ArrowLeft className="h-4 w-4" /> Todos los juegos</Link>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section className="min-w-0 border-[3px] border-[#74809b] bg-[#070d22]/[.98] shadow-[0_0_0_3px_#11182d,7px_7px_0_rgba(0,0,0,.5)]">
            <header className="border-b-[3px] border-[#35415e] px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0c86d] [font-family:var(--font-pixel),monospace]">Ronda {finished ? TOTAL_ROUNDS : index + 1} de {TOTAL_ROUNDS}</p><h1 className="mt-2 text-xl font-black text-white [font-family:var(--font-pixel),monospace] sm:text-xl">{finished ? "¡Desafío completado!" : "Descifra la pista"}</h1></div>
                <div className="flex flex-wrap items-stretch gap-2">
                  <div className="min-w-[95px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">Puntos</p><p className="mt-1 flex items-center justify-center gap-1 text-lg font-black text-[#ffd65c]">{score} <span className="text-xs">PTS</span></p></div>
                  <div className="min-w-[95px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">XP</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/peaky/homepage/xp.webp" alt="XP" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#f2d68c]">—</span></div></div>
                  <div className="min-w-[105px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">Peak Coins</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#7feaff]">—</span></div></div>
                </div>
              </div>
              <div className="mt-5 border-[3px] border-[#5e6983] bg-[#080e20] p-2 shadow-[inset_0_0_0_2px_#202b44]">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#f4d57e]">Progreso de la ronda</span><span className="text-[10px] font-black text-[#f4d57e]">{correctCount} / {TOTAL_ROUNDS}</span></div>
                <div className="relative flex h-8 items-center px-1"><div className="absolute left-1 right-1 top-1/2 h-3 -translate-y-1/2 border-2 border-[#7b8396] bg-[#171d2c]" /><div className="absolute left-1 top-1/2 h-3 -translate-y-1/2 border-y-2 border-[#fff0a6] bg-[#e8b936] transition-[width] duration-300" style={{ width: `calc(${Math.min(100, correctCount / TOTAL_ROUNDS * 100)}% - 8px)` }} /><div className="relative z-10 flex w-full items-center justify-between">{Array.from({ length: 5 }, (_, i) => { const chestIndex = i - 1; const isChest = i === 1 || i === 2 || i === 3; const unlocked = isChest && chestLevel >= chestIndex; return <div key={i} className={`relative grid h-7 w-7 place-items-center border-2 ${isChest ? (unlocked ? "border-[#ffe08a] bg-[#4b3211]" : "border-[#566079] bg-[#101629]") : "border-[#8992a8] bg-[#182136]"} shadow-[2px_2px_0_#030713]`} title={isChest ? (unlocked ? "Cofre disponible para reclamar" : `Cofre al alcanzar ${chestThresholds[chestIndex]} aciertos`) : `Hito ${i + 1}`} >{isChest ? <Image src="/images/games/poco-responda/cofre.png" alt="" width={24} height={24} className={`h-6 w-6 object-contain ${unlocked ? "" : "grayscale opacity-45"}`} /> : <span className="text-[10px] font-black text-[#c8d1e5] [font-family:var(--font-pixel),monospace]">{i === 0 ? "1" : "10"}</span>}{unlocked && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" aria-label="Cofre disponible para reclamar" />}</div>; })}</div></div>
              </div>
            </header>
            {finished ? <div className="p-5 text-center sm:p-8"><h2 className="text-2xl font-black text-[#ffe28b]">¡Ronda terminada!</h2><p className="mt-2 text-sm text-slate-200">Acertaste {correctCount} de {TOTAL_ROUNDS} preguntas y conseguiste {score} puntos.</p><p className="mt-2 text-xs text-slate-400">{saveStatus === "saving" ? "Guardando tu progreso…" : saveStatus === "saved" ? "Progreso guardado en tu cuenta." : saveStatus === "error" ? "No se pudo guardar en la cuenta; tu partida local sigue disponible." : "Tu resultado está listo."}</p><div className="mx-auto mt-5 max-w-sm border-[3px] border-[#77839d] bg-[#0b1228] p-4 shadow-[5px_5px_0_#030713]"><Image src="/images/games/poco-responda/cofre.png" alt="Cofre de recompensas" width={180} height={130} className="mx-auto h-28 w-36 object-contain" /><div className="mt-3 flex gap-1.5">{Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-3 flex-1 border-2 ${i < earnedChests ? "border-[#ffdc7a] bg-[#e8b936]" : "border-[#566079] bg-[#151c31]"}`} />)}</div><p className="mt-2 text-xs text-[#f5d987]">{earnedChests} / 3 cofres desbloqueados</p></div><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a8d99a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] hover:bg-[#32934f]"><RotateCcw className="h-4 w-4" /> Jugar otra vez</button><Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#737c93] bg-[#111a31] px-5 text-xs font-bold text-white hover:bg-[#1a2944]">Volver a juegos</Link></div></div> : question ? <div className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap gap-2"><span className="border-2 border-[#627d8d] bg-[#172b3a] px-3 py-1.5 text-[10px] font-black text-[#b8f3e7]">{question.subject}</span></div>
              <div className="relative border-[4px] border-[#7d879e] bg-[#111a31] p-5 shadow-[inset_0_0_0_3px_#29344e,inset_0_0_0_6px_#080e20,6px_6px_0_#030713] sm:p-7"><div className="absolute left-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute right-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute bottom-2 left-2 h-2 w-2 bg-[#68738e]" /><div className="absolute bottom-2 right-2 h-2 w-2 bg-[#68738e]" /><div className="mb-4 flex h-10 w-10 items-center justify-center border-[3px] border-[#77829d] bg-[#252e49]"><CircleHelp className="h-5 w-5 text-[#f5d77c]" /></div><p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8">{question.clue}</p><button type="button" onClick={useHint} disabled={showHint} className="mt-5 inline-flex min-h-10 items-center gap-2 border-[3px] border-[#8e8059] bg-[#28243a] px-3 text-xs font-black text-[#ffe7a2] shadow-[3px_3px_0_#050817] transition hover:bg-[#39334a] disabled:opacity-60"><Lightbulb className="h-4 w-4" /> {showHint ? "Pista revelada" : "Dame una pista"}</button>{showHint && <p className="mt-3 border-[3px] border-[#89774c] bg-[#242032] p-3 text-sm leading-6 text-[#ffedb8]">{question.hint}</p>}</div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = optionIndex === question.answer; const stateClass = !revealed ? "border-[#69748d] bg-[#111a31] hover:border-[#d8c16b] hover:bg-[#222a40]" : isCorrect ? "border-[#8bc79a] bg-[#193b32]" : isSelected ? "border-[#d58a91] bg-[#3b202d]" : "border-[#3c4762] bg-[#0b1226] opacity-75"; return <button key={option} type="button" onClick={() => chooseOption(optionIndex)} disabled={revealed} aria-pressed={isSelected} className={`relative flex min-h-[66px] items-center gap-3 border-[3px] p-4 text-left text-sm font-bold leading-6 shadow-[4px_4px_0_#030713] transition ${stateClass}`}><span className="absolute left-1 top-1 h-1.5 w-1.5 bg-[#aeb8ce]" /><span className="flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-[#69738c] bg-[#080e20] text-xs font-black text-[#f5d77c]">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{revealed && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#a5e6b1]" />}{revealed && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 shrink-0 text-[#ff9aa5]" />}</button>; })}</div>
              {revealed && <div role="status" aria-live="polite" className={`mt-4 border-[3px] p-4 ${answeredCorrectly ? "border-[#80bd8d] bg-[#14352c]" : "border-[#ca858d] bg-[#351d2a]"}`}><p className="text-sm font-black">{answeredCorrectly ? "¡Correcto, bien hecho!" : "Esta vez no fue. ¡Aprendamos!"}</p><p className="mt-2 text-sm leading-6 text-white/85">{question.explanation}</p></div>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[10px] font-semibold text-[#b5bfd5]"><Clock3 className="h-4 w-4" /> Sin límite de tiempo: piensa con calma</p><button type="button" onClick={handleNext} disabled={!revealed} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a5d79a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] transition hover:bg-[#32984f] active:translate-y-0.5 active:shadow-[2px_2px_0_#102b1c] disabled:cursor-not-allowed disabled:border-[#424b60] disabled:bg-[#222a3b] disabled:text-[#7c8497] disabled:shadow-none">{!answeredCorrectly ? "Reintentar" : index + 1 === TOTAL_ROUNDS ? "Ver resultados" : "Siguiente"} <ArrowRight className="h-4 w-4" /></button></div>
            </div> : null}
          </section>
          {!finished && <aside className="grid gap-4"><section className="border-[3px] border-[#746e88] bg-[#0a1026]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.45)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f0d28a]">Recompensa de la ronda</p><h2 className="mt-2 text-base font-black">El cofre misterioso</h2><Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className="mx-auto my-3 h-32 w-full object-contain drop-shadow-[0_5px_0_rgba(0,0,0,.5)]" /><div className="grid grid-cols-4 gap-1.5" aria-label={`${chestLevel} de 3 cofres desbloqueados`}>{Array.from({ length: 3 }, (_, i) => <div key={i} className={`h-3 border-[3px] ${i < chestLevel ? "border-[#ffe08a] bg-[#e8b936]" : "border-[#566079] bg-[#151b2d]"}`} />)}</div><p className="mt-3 text-xs font-black leading-5 text-[#ffe5a0]">{chestMessage}</p><p className="mt-2 text-[10px] leading-5 text-[#9da8c5]">Hay 3 cofres que se desbloquean al llegar a 2, 5 y 8 respuestas correctas.</p></section>
          <section className="border-[3px] border-[#5e6d8c] bg-[#081027]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.4)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8c8e9]">Pistas</p><div className="mt-3 grid gap-2"><button type="button" onClick={useHint} disabled={showHint} className={`flex items-center gap-3 border-[3px] p-3 text-left ${showHint ? "border-[#6e6484] bg-[#17172e] opacity-70" : "border-[#b58cdb] bg-[#251c3c] hover:bg-[#32234d]"}`}><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#8b75b5] bg-[#382a52]"><Lightbulb className="h-5 w-5 text-[#ffe36b]" /></span><span className="min-w-0"><span className="block text-sm font-black text-[#f4d8ff]">Pista 1</span><span className="block text-xs text-[#d8cce8]">{showHint ? "Ya revelada" : "Revelar una orientación"}</span></span></button><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">◉</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 2</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">▤</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 3</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div></div></section></aside>}
        </div>
      </div>
    </main>
  );
}

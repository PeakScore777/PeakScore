"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, Lightbulb, RotateCcw, XCircle } from "lucide-react";

import { QUESTION_BANK, type Question } from "@/lib/games/que-es-esa-vaina-bank";

const TOTAL_ROUNDS = 10;
const CHEST_THRESHOLDS = [2, 5, 8] as const;
const STORAGE_KEY = "peakscore-que-es-esa-vaina-v1";

type SavedProgress = { bestScore: number; completedIds: string[]; chests: number };

const RECENT_KEY = "peakscore-que-es-esa-vaina-recent-v1";
const QUESTION_SECONDS = 20;

function shuffleQuestions<T>(source: T[]): T[] {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function normalizeQuestionKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function questionTopicKey(question: Pick<Question, "subject" | "topic">): string {
  return normalizeQuestionKey(question.subject) + "::" + normalizeQuestionKey(question.topic);
}

function questionHistoryKey(question: Pick<Question, "subject" | "clue">): string {
  return "content::" + normalizeQuestionKey(question.subject) + "::" + normalizeQuestionKey(question.clue);
}

function readRecentIds(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const recent = value.filter((id): id is string => typeof id === "string");
    const localById = new Map(QUESTION_BANK.map((question) => [question.id, question]));
    const migrated = recent.flatMap((id) => {
      const localQuestion = localById.get(id);
      return localQuestion ? [id, questionHistoryKey(localQuestion)] : [id];
    });
    return [...new Set(migrated)].slice(0, 1000);
  } catch {
    return [];
  }
}

function pickDiverseQuestions(source: Question[], amount: number, reservedTopics: string[] = []): Question[] {
  const remaining = shuffleQuestions(source);
  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set(reservedTopics);
  const subjectOrder = shuffleQuestions([...new Set(remaining.map((question) => question.subject))]);

  while (selected.length < amount && remaining.length > 0) {
    let addedInPass = false;
    for (const subject of subjectOrder) {
      if (selected.length >= amount) break;
      const index = remaining.findIndex((question) =>
        question.subject === subject &&
        !selectedTopics.has(questionTopicKey(question)) &&
        !selectedIds.has(question.id)
      );
      if (index === -1) continue;
      const [question] = remaining.splice(index, 1);
      selected.push(question);
      selectedIds.add(question.id);
      selectedTopics.add(questionTopicKey(question));
      addedInPass = true;
    }

    if (!addedInPass) {
      const index = remaining.findIndex((question) => !selectedIds.has(question.id));
      if (index === -1) break;
      const [question] = remaining.splice(index, 1);
      selected.push(question);
      selectedIds.add(question.id);
      selectedTopics.add(questionTopicKey(question));
    }
  }

  return selected;
}

/**
 * The recent-ID list is newest-first. When fewer than ten unseen questions
 * remain, fill with the least-recently-seen questions instead of ignoring history.
 */
function getRoundsFromPool(source: Question[], excludeIds: string[] = []): Question[] {
  const uniqueById = new Map<string, Question>();
  for (const question of source) {
    if (!uniqueById.has(question.id)) uniqueById.set(question.id, question);
  }

  const pool = [...uniqueById.values()];
  if (pool.length < TOTAL_ROUNDS) return [];

  const excluded = new Set(excludeIds);
  const historyPosition = new Map<string, number>();
  excludeIds.forEach((key, index) => {
    if (!historyPosition.has(key)) historyPosition.set(key, index);
  });

  const isExcluded = (question: Question) =>
    excluded.has(question.id) || excluded.has(questionHistoryKey(question));

  const historyIndex = (question: Question) =>
    Math.max(
      historyPosition.get(question.id) ?? -1,
      historyPosition.get(questionHistoryKey(question)) ?? -1
    );

  const unseen = pool.filter((question) => !isExcluded(question));
  const selected = pickDiverseQuestions(unseen, Math.min(TOTAL_ROUNDS, unseen.length));

  if (selected.length < TOTAL_ROUNDS) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const olderQuestions = pool
      .filter((question) => isExcluded(question) && !selectedIds.has(question.id))
      .sort((a, b) => historyIndex(b) - historyIndex(a));

    selected.push(...pickDiverseQuestions(
      olderQuestions,
      TOTAL_ROUNDS - selected.length,
      selected.map(questionTopicKey)
    ));
  }

  return selected.length === TOTAL_ROUNDS ? shuffleQuestions(selected) : [];
}

/** Published database questions take priority; local questions fill the pool. */
function mergeQuestionPools(published: Question[], local: Question[]): Question[] {
  const seenIds = new Set<string>();
  const seenClues = new Set<string>();
  const merged: Question[] = [];

  for (const question of [...published, ...local]) {
    const clueKey = normalizeQuestionKey(question.subject) + "::" + normalizeQuestionKey(question.clue);
    if (seenIds.has(question.id) || seenClues.has(clueKey)) continue;
    seenIds.add(question.id);
    seenClues.add(clueKey);
    merged.push(question);
  }
  return merged;
}

export default function QueEsEsaVainaGame() {
  const [rounds, setRounds] = useState<Question[]>([]);
  const [questionPool, setQuestionPool] = useState<Question[]>(QUESTION_BANK);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState<SavedProgress>({ bestScore: 0, completedIds: [], chests: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const answeringRef = useRef(false);
  const timerDeadlineRef = useRef<number | null>(null);
  const timerExpiredRef = useRef(false);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const sessionAttemptedRef = useRef(false);
  const [answering, setAnswering] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [claimedChests, setClaimedChests] = useState<number[]>([]);
  const [claimingChest, setClaimingChest] = useState<number | null>(null);
  const [chestAnimation, setChestAnimation] = useState<{ chestNumber: number; xp: number; coins: number; phase: "opening" | "reward" } | null>(null);
  const [wallet, setWallet] = useState<{ xp: number; coins: number } | null>(null);
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preparamos el audio al entrar, pero no se reproduce hasta que el jugador inicia.
  // Al desmontar el minijuego, detenemos el reloj y los efectos para que no salgan de la página.
  useEffect(() => {
    const audio = new Audio("/audio/games/que-es-esa-vaina-timer.wav");
    audio.preload = "auto";
    audio.loop = false;
    timerAudioRef.current = audio;
    audio.load();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      if (timerAudioRef.current === audio) timerAudioRef.current = null;
      const feedbackAudio = feedbackAudioRef.current;
      if (feedbackAudio) {
        feedbackAudio.pause();
        feedbackAudio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const restoreFrame = window.requestAnimationFrame(() => {
      try {
        // Cada entrada empieza una partida nueva; borramos únicamente el estado temporal antiguo.
        try { window.localStorage.removeItem("peakscore-que-es-esa-vaina-active-match-v1"); } catch { /* almacenamiento opcional */ }
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
    });
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
        const pool = mergeQuestionPools(valid, QUESTION_BANK);
        setQuestionPool(pool);
        setRounds(getRoundsFromPool(pool, readRecentIds()));
      })
      .catch(() => {
        if (active) {
          const pool = QUESTION_BANK;
          setQuestionPool(pool);
          setRounds(getRoundsFromPool(pool, readRecentIds()));
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => { active = false; window.cancelAnimationFrame(restoreFrame); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // El progreso de esta sesión sigue funcionando aunque localStorage no esté disponible.
    }
  }, [saved, hydrated]);

  useEffect(() => {
    if (!hydrated || rounds.length !== TOTAL_ROUNDS || gameSessionId || sessionAttemptedRef.current || finished) return;
    sessionAttemptedRef.current = true;
    setSessionLoading(true);
    setGameError(null);
    void fetch("/api/games/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: rounds.map((item) => item.id) }),
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok || typeof payload.sessionId !== "string") throw new Error(payload.error || "No se pudo iniciar una partida segura.");
      setGameSessionId(payload.sessionId);
    }).catch((error: unknown) => {
      setGameError(error instanceof Error ? error.message : "No se pudo iniciar la partida.");
    }).finally(() => {
      setSessionLoading(false);
    });
  }, [hydrated, rounds, gameSessionId, finished]);

  useEffect(() => {
    if (!chestAnimation || chestAnimation.phase !== "opening") return;
    const timer = window.setTimeout(() => setChestAnimation((current) => current ? { ...current, phase: "reward" } : null), 3000);
    return () => window.clearTimeout(timer);
  }, [chestAnimation]);

  useEffect(() => {
    let active = true;
    void fetch("/api/games/chests/claim", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((payload) => {
        if (!active || !payload) return;
        if (Array.isArray(payload.claimedChests)) {
          setClaimedChests(payload.claimedChests.filter((number: unknown): number is number => Number.isInteger(number) && Number(number) >= 1 && Number(number) <= 3));
        }
        if (payload.wallet && Number.isFinite(Number(payload.wallet.xp)) && Number.isFinite(Number(payload.wallet.coins))) {
          setWallet({ xp: Number(payload.wallet.xp), coins: Number(payload.wallet.coins) });
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const question = rounds[index];

  const playSfx = useCallback((kind: "tick" | "wrong" | "chest" | "click") => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const tone = (frequency: number, start: number, duration: number, wave: OscillatorType, volume: number) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + start);
        oscillator.stop(ctx.currentTime + start + duration + 0.02);
      };
      if (kind === "tick") tone(1150, 0, 0.035, "square", 0.018);
      if (kind === "click") tone(780, 0, 0.055, "square", 0.025);
      if (kind === "wrong") {
        tone(210, 0, 0.16, "sawtooth", 0.045);
        tone(145, 0.13, 0.2, "sawtooth", 0.04);
      }
      if (kind === "chest") {
        tone(660, 0, 0.12, "sine", 0.04);
        tone(880, 0.1, 0.16, "sine", 0.035);
        tone(1320, 0.22, 0.3, "sine", 0.03);
      }
      window.setTimeout(() => { void ctx.close().catch(() => undefined); }, 700);
    } catch {
      // El audio nunca debe bloquear la partida.
    }
  }, []);

  useEffect(() => {
    if (!hydrated || rounds.length !== TOTAL_ROUNDS || !gameSessionId || sessionLoading || !gameStarted || finished || revealed) return;
    if (timerDeadlineRef.current === null) return;
    const syncClock = () => {
      if (answeringRef.current) return;
      const deadline = timerDeadlineRef.current;
      if (deadline === null) return;
      const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setTimeLeft((current) => current === remaining ? current : remaining);
    };
    syncClock();
    const timer = window.setInterval(syncClock, 100);
    return () => window.clearInterval(timer);
  }, [hydrated, rounds.length, gameSessionId, sessionLoading, gameStarted, finished, revealed, index, timerEpoch]);

  const startRoundTimer = useCallback(() => {
    setStartingGame(true);
    const audio = timerAudioRef.current;

    const beginCountdown = (soundEnabled: boolean) => {
      timerDeadlineRef.current = performance.now() + QUESTION_SECONDS * 1000;
      setTimeLeft(QUESTION_SECONDS);
      setGameStarted(true);
      setTimerSoundEnabled(soundEnabled);
      setStartingGame(false);
      setTimerEpoch((value) => value + 1);
    };

    if (!audio) {
      beginCountdown(false);
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      void audio.play().then(
        () => beginCountdown(true),
        () => beginCountdown(false)
      );
    } catch {
      beginCountdown(false);
    }
  }, []);

  // La expiración se procesa una sola vez al llegar a cero.
  useEffect(() => {
    if (timeLeft !== 0) {
      timerExpiredRef.current = false;
      return;
    }
    if (!hydrated || !gameSessionId || sessionLoading || !gameStarted || finished || revealed || timerExpiredRef.current) return;
    timerExpiredRef.current = true;
    timerDeadlineRef.current = null;
    answeringRef.current = false;
    const revealFrame = window.requestAnimationFrame(() => {
      setSelected(null);
      setRevealed(true);
    });
    const timerAudio = timerAudioRef.current;
    if (timerAudio) {
      timerAudio.pause();
      timerAudio.currentTime = 0;
    }
    try {
      const timeoutAudio = new Audio("/sounds/game-over.wav");
      timeoutAudio.volume = 0.42;
      feedbackAudioRef.current = timeoutAudio;
      void timeoutAudio.play().catch(() => undefined);
    } catch {
      playSfx("wrong");
    }
    return () => window.cancelAnimationFrame(revealFrame);
  }, [hydrated, gameSessionId, sessionLoading, gameStarted, finished, revealed, timeLeft, playSfx]);

  useEffect(() => {
    if (!hydrated || !gameSessionId || sessionLoading || !gameStarted || finished || revealed) {
      const existing = timerAudioRef.current;
      if (existing) {
        existing.pause();
        existing.currentTime = 0;
      }
      const frame = window.requestAnimationFrame(() => setTimerSoundEnabled(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [hydrated, gameSessionId, sessionLoading, gameStarted, finished, revealed]);
  // La barra conserva cinco hitos visuales, pero solo hay tres cofres reclamables.
  // Se desbloquean al alcanzar 2, 5 y 8 respuestas correctas.
  const chestLevel = CHEST_THRESHOLDS.filter((threshold) => correctCount >= threshold).length;
  const answeredCorrectly = selected !== null && question?.answer === selected;

  const chooseOption = useCallback(async (optionIndex: number) => {
    if (!gameStarted || revealed || finished || answeringRef.current || !gameSessionId || timeLeft <= 0) return;
    const current = rounds[index];
    if (!current) return;

    // La selección, el resultado y la explicación se muestran en este mismo clic.
    const isCorrectLocally = optionIndex === current.answer;
    answeringRef.current = true;
    timerDeadlineRef.current = null;
    const timerAudio = timerAudioRef.current;
    if (timerAudio) {
      timerAudio.pause();
      timerAudio.currentTime = 0;
    }
    setSelected(optionIndex);
    setRevealed(true);
    setAnswering(true);
    setGameError(null);

    if (isCorrectLocally) {
      setCorrectCount((value) => value + 1);
      setScore((value) => value + 100);
      setSaved((value) => ({
        ...value,
        completedIds: value.completedIds.includes(current.id) ? value.completedIds : [...value.completedIds, current.id],
      }));
    } else {
      playSfx("wrong");
    }

    try {
      const response = await fetch("/api/games/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gameSessionId, questionId: current.id, selectedOption: optionIndex }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.isCorrect !== "boolean") {
        throw new Error(payload.error || "No se pudo validar la respuesta.");
      }
      setCorrectCount(Math.max(0, Number(payload.correctCount) || 0));
      if (payload.isCorrect !== isCorrectLocally) {
        setGameError("El servidor devolvió un resultado distinto; se sincronizó el recuento.");
      }
      if (payload.alreadyCorrect && isCorrectLocally) {
        setScore((value) => Math.max(0, value - 100));
      }
    } catch (error) {
      if (isCorrectLocally) {
        setScore((value) => Math.max(0, value - 100));
        setCorrectCount((value) => Math.max(0, value - 1));
      }
      setGameError(error instanceof Error ? error.message : "No se pudo guardar la respuesta.");
    } finally {
      answeringRef.current = false;
      setAnswering(false);
    }
  }, [finished, gameSessionId, gameStarted, index, playSfx, revealed, rounds, timeLeft]);

  const next = useCallback(() => {
    if (!revealed) return;
    if (index + 1 >= rounds.length) {
      timerDeadlineRef.current = null;
      setTimeLeft(0);
      setFinished(true);
      setSaved((value) => ({
        ...value,
        bestScore: Math.max(value.bestScore, score),
        chests: Math.max(value.chests, CHEST_THRESHOLDS.filter((threshold) => correctCount >= threshold).length),
      }));
      setSaveStatus("saving");
      void fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct: correctCount }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("No se pudo guardar el progreso de la cuenta.");
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
    setTimeLeft(QUESTION_SECONDS);
  }, [correctCount, index, revealed, rounds.length, score]);

  const handleNext = useCallback(() => {
    if (!revealed || answeringRef.current) return;

    try {
      const navigationAudio = new Audio("/sounds/navigation.mp3");
      navigationAudio.volume = 0.35;
      feedbackAudioRef.current = navigationAudio;
      void navigationAudio.play().catch(() => undefined);
    } catch {
      // El sonido no debe bloquear la navegación.
    }

    // Una respuesta incorrecta permite reintentar esta misma pregunta.
    if (selected !== null && !answeredCorrectly) {
      setSelected(null);
      setRevealed(false);
      setShowHint(false);
      setGameError(null);
      startRoundTimer();
      return;
    }

    const hasNextQuestion = index + 1 < rounds.length;
    if (hasNextQuestion) {
      next();
      startRoundTimer();
    } else {
      timerDeadlineRef.current = null;
      setTimeLeft(0);
      next();
    }
  }, [answeredCorrectly, index, next, revealed, rounds.length, selected, startRoundTimer]);

  const restart = useCallback(() => {
    const currentHistory = rounds.slice(0, index + 1).reverse().flatMap((question) => [question.id, questionHistoryKey(question)]);
    const recent = [...new Set([...currentHistory, ...readRecentIds()])].slice(0, 1000);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch { /* El historial es una mejora opcional. */ }
    setGameStarted(false);
    setStartingGame(false);
    timerDeadlineRef.current = null;
    setTimerSoundEnabled(false);
    const timerAudio = timerAudioRef.current;
    if (timerAudio) { timerAudio.pause(); timerAudio.currentTime = 0; }
    const feedbackAudio = feedbackAudioRef.current;
    if (feedbackAudio) { feedbackAudio.pause(); feedbackAudio.currentTime = 0; }
    setRounds(getRoundsFromPool(questionPool, recent));
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setCorrectCount(0);
    setShowHint(false);
    setFinished(false);
    setGameSessionId(null);
    sessionAttemptedRef.current = false;
    setClaimedChests([]);
    setClaimingChest(null);
    setChestAnimation(null);
    setGameError(null);
    setSaveStatus("idle");
  }, [index, questionPool, rounds]);

  const claimChest = useCallback(async (chestNumber: number) => {
    if (!gameSessionId || claimingChest !== null || claimedChests.includes(chestNumber)) return;
    const required = CHEST_THRESHOLDS[chestNumber - 1];
    if (correctCount < required) return;
    setClaimingChest(chestNumber);
    setGameError(null);
    try {
      const response = await fetch("/api/games/chests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gameSessionId, chestNumber }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.reward?.claimed) {
        if (payload.reward?.alreadyClaimed) {
          setClaimedChests((current) => current.includes(chestNumber) ? current : [...current, chestNumber]);
          return;
        }
        throw new Error(payload.error || "No se pudo reclamar el cofre.");
      }
      const reward = payload.reward;
      setClaimedChests((current) => current.includes(chestNumber) ? current : [...current, chestNumber]);
      setSaved((current) => ({ ...current, chests: Math.max(current.chests, chestNumber) }));
      setWallet({ xp: Number(reward.xpTotal) || 0, coins: Number(reward.coinsTotal) || 0 });
      setChestAnimation({ chestNumber, xp: Number(reward.xpAwarded) || 0, coins: Number(reward.coinsAwarded) || 0, phase: "opening" });
      playSfx("chest");
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "No se pudo reclamar el cofre.");
    } finally {
      setClaimingChest(null);
    }
  }, [claimedChests, claimingChest, correctCount, gameSessionId, playSfx]);

  const useHint = () => {
    if (!question || showHint) return;
    setShowHint(true);
  };

  const earnedChests = chestLevel;

  useEffect(() => {
    if (!finished || rounds.length === 0) return;
    try {
      const playedHistory = rounds.slice().reverse().flatMap((question) => [question.id, questionHistoryKey(question)]);
      const ids = [...playedHistory, ...readRecentIds()].filter((id, i, all) => all.indexOf(id) === i).slice(0, 1000);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
    } catch { /* La rotación sigue funcionando en memoria. */ }
  }, [finished, rounds]);

  const chestMessage = useMemo(() => {
    if (chestLevel >= 3) return "¡Los tres cofres están desbloqueados!";
    if (chestLevel >= 2) return "¡Vas muy bien! Sigue acertando para desbloquear el siguiente cofre.";
    if (chestLevel >= 1) return "¡Buen comienzo! Sigue acertando para alcanzar el siguiente cofre.";
    return "Resuelve preguntas para llenar el cofre.";
  }, [chestLevel]);

  if (!hydrated || rounds.length === 0 || (sessionLoading && !gameSessionId)) {
    return (
      <main className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#070b18] p-3 text-white sm:p-5">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-[#030817]/75" />
        <div className="ml-auto mr-[1vw] w-full max-w-[1390px] px-3 pb-8 pt-4 sm:px-5 lg:px-6 animate-pulse">
          <div className="mb-4 h-10 w-36 border-2 border-slate-600 bg-slate-800/80" />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
            <section className="border-[3px] border-[#74809b] bg-[#070d22]/95 shadow-[7px_7px_0_rgba(0,0,0,.5)]">
              <header className="border-b-[3px] border-[#35415e] p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-3">
                    <div className="h-3 w-28 rounded bg-slate-700" />
                    <div className="h-7 w-48 rounded bg-slate-700" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-16 w-24 border-2 border-slate-600 bg-slate-800" />
                    ))}
                  </div>
                </div>
                <div className="mt-5 border-[3px] border-slate-600 bg-slate-900 p-3">
                  <div className="mb-3 h-3 w-36 rounded bg-slate-700" />
                  <div className="flex items-center gap-4 border border-slate-700 p-3">
                    <div className="h-16 w-16 shrink-0 rounded-full border-4 border-slate-600 bg-slate-800" />
                    <div className="flex-1 space-y-3">
                      <div className="h-3 w-32 rounded bg-slate-700" />
                      <div className="h-7 w-14 rounded bg-slate-700" />
                      <div className="h-2 w-full rounded bg-slate-700" />
                    </div>
                  </div>
                  <div className="mt-4 h-7 w-full rounded bg-slate-800" />
                </div>
              </header>
              <div className="space-y-4 p-5">
                <div className="h-5 w-28 bg-slate-700" />
                <div className="min-h-36 space-y-4 border-[4px] border-slate-600 bg-slate-800/80 p-6">
                  <div className="h-4 w-24 bg-slate-700" />
                  <div className="h-5 w-4/5 bg-slate-700" />
                  <div className="h-10 w-32 bg-slate-700" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-16 border-[3px] border-slate-600 bg-slate-800" />
                  ))}
                </div>
                <div className="flex justify-between gap-3">
                  <div className="h-4 w-44 bg-slate-700" />
                  <div className="h-11 w-32 border-2 border-slate-600 bg-slate-800" />
                </div>
              </div>
            </section>
            <aside className="grid gap-4">
              <div className="h-64 border-[3px] border-slate-600 bg-slate-900/90 p-4">
                <div className="h-4 w-36 bg-slate-700" />
                <div className="mx-auto mt-8 h-28 w-32 rounded-xl bg-slate-800" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 border-2 border-slate-600 bg-slate-800" />
                  ))}
                </div>
              </div>
              <div className="h-48 border-[3px] border-slate-600 bg-slate-900/90 p-4">
                <div className="h-4 w-20 bg-slate-700" />
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-14 border-2 border-slate-700 bg-slate-800" />
                  ))}
                </div>
              </div>
            </aside>
          </div>
          <p role="status" className="mt-5 text-center text-xs font-bold tracking-wide text-[#f4d57e]">
            {sessionLoading ? "Preparando una partida segura y cargando las preguntas…" : "Preparando el desafío…"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#070b18] text-white">
      {chestAnimation && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#02040d]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Recompensa del cofre"><div className="w-full max-w-md border-[4px] border-[#ffe08a] bg-[#0a1026] p-6 text-center shadow-[0_0_0_5px_#291b12,0_0_35px_rgba(255,204,74,.45)]"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffe08a]">{chestAnimation.phase === "opening" ? "¡Cofre desbloqueado!" : "¡Recompensa obtenida!"}</p><div className={"relative mx-auto my-5 grid h-44 place-items-center " + (chestAnimation.phase === "opening" ? "chest-open-sequence" : "chest-reward-glow")}><div className="absolute inset-5 rounded-full bg-amber-300/25 blur-2xl"/><Image src="/images/games/poco-responda/cofre.png" alt="Cofre del tesoro" width={240} height={180} className="relative z-10 h-40 w-52 object-contain drop-shadow-[0_8px_0_rgba(0,0,0,.5)]"/>{chestAnimation.phase === "reward" && <span className="absolute inset-0 z-20 grid place-items-center text-4xl font-black text-[#fff1a6] drop-shadow-[0_3px_0_#5c3700]">✦</span>}</div>{chestAnimation.phase === "opening" ? <p className="animate-pulse text-sm font-bold text-[#ffe6a3]">¡La tapa se abre y sale una luz dorada…!</p> : <><p className="text-lg font-black text-white">Cofre {chestAnimation.chestNumber}</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="border-2 border-[#6476a0] bg-[#111a31] p-3"><Image src="/peaky/homepage/xp.webp" alt="XP" width={28} height={28} className="mx-auto h-7 w-7"/><p className="mt-1 text-xl font-black text-[#ffe08a]">+{chestAnimation.xp} XP</p></div><div className="border-2 border-[#6476a0] bg-[#111a31] p-3"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={28} height={28} className="mx-auto h-7 w-7"/><p className="mt-1 text-xl font-black text-[#82eaff]">+{chestAnimation.coins}</p></div></div><button type="button" onClick={() => setChestAnimation(null)} className="mt-5 min-h-11 border-[3px] border-[#ffe08a] bg-[#6a4710] px-6 text-xs font-black text-white shadow-[4px_4px_0_#291b12] hover:bg-[#805817]">¡RECLAMAR Y CONTINUAR!</button></>}</div></div>}
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
                  <div className="min-w-[95px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">XP</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/peaky/homepage/xp.webp" alt="XP" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#f2d68c]">{wallet ? wallet.xp : "—"}</span></div></div>
                  <div className="min-w-[105px] border-[3px] border-[#68738e] bg-[#080e20] px-3 py-2 text-center shadow-[3px_3px_0_#030713]"><p className="text-[9px] font-bold text-[#aab4cf]">Peak Coins</p><div className="mt-1 flex items-center justify-center gap-1"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={24} height={24} className="h-6 w-6 object-contain" /><span className="text-sm font-black text-[#7feaff]">{wallet ? wallet.coins : "—"}</span></div></div>
                </div>
              </div>
              <div className="mt-5 border-[3px] border-[#5e6983] bg-[#080e20] p-2 shadow-[inset_0_0_0_2px_#202b44]">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#f4d57e]">Progreso de la ronda</span><span className="text-[10px] font-black text-[#f4d57e]">{correctCount} / {TOTAL_ROUNDS}</span></div><div className="mb-3 flex items-center gap-4 rounded-xl border border-[#52617f] bg-[#080f23]/90 p-3">
                  <div className={"relative h-[76px] w-[76px] shrink-0 transition-transform duration-300 " + (timeLeft <= 5 ? "animate-pulse" : "")} aria-label={`Reloj: quedan ${timeLeft} segundos`}>
                    <svg viewBox="0 0 100 100" role="img" aria-hidden="true" className="h-full w-full overflow-visible drop-shadow-[0_4px_0_rgba(0,0,0,.45)]">
                      <path d="M28 17 L21 7 Q19 3 24 3 L40 13 Z" fill="#9f2432" stroke="#5b1722" strokeWidth="3"/>
                      <path d="M72 17 L79 7 Q81 3 76 3 L60 13 Z" fill="#9f2432" stroke="#5b1722" strokeWidth="3"/>
                      <path d="M24 28 Q15 23 19 17 Q23 13 31 21" fill="#e64a50" stroke="#741d2a" strokeWidth="3"/>
                      <path d="M76 28 Q85 23 81 17 Q77 13 69 21" fill="#e64a50" stroke="#741d2a" strokeWidth="3"/>
                      <circle cx="50" cy="51" r="40" fill="#681b2a" stroke="#3d111c" strokeWidth="5"/>
                      <circle cx="50" cy="49" r="36" fill={timeLeft <= 5 ? "#ffe5e5" : "#fff9e9"} stroke={timeLeft <= 5 ? "#ff687b" : "#d94a50"} strokeWidth="5"/>
                      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="50" y1="17" x2="50" y2="22" stroke="#222333" strokeWidth={i % 3 === 0 ? "2.5" : "1.5"} strokeLinecap="round" transform={`rotate(${i * 30} 50 49)`}/>)}
                      <g transform={`rotate(${(QUESTION_SECONDS - timeLeft) * 18} 50 49)`} className="transition-transform duration-500">
                        <line x1="50" y1="49" x2="50" y2="22" stroke={timeLeft <= 5 ? "#e11d48" : "#26283a"} strokeWidth="3" strokeLinecap="round"/>
                      </g>
                      <line x1="50" y1="49" x2="62" y2="57" stroke="#252638" strokeWidth="4" strokeLinecap="round"/>
                      <circle cx="50" cy="49" r="4" fill="#d93445" stroke="#681b2a" strokeWidth="2"/>
                      <path d="M32 78 Q50 88 68 78" fill="none" stroke="#fca5a5" strokeWidth="2" opacity=".8"/>
                    </svg>
                    <span className="sr-only">{timeLeft} segundos restantes</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#c5d1e8]">Tiempo restante</span><div className="flex items-center gap-2"><span className={"text-[10px] font-black " + (timeLeft <= 5 ? "text-rose-300" : "text-[#f4d57e]")}>{timeLeft <= 5 ? "¡RÁPIDO!" : "20 SEGUNDOS"}</span><span className="text-[9px] font-bold text-[#a8b6d3]">{gameStarted && timerSoundEnabled ? "SONIDO ACTIVO" : gameStarted ? "AUDIO NO DISPONIBLE" : "LISTO PARA INICIAR"}</span></div></div>
                    <p className={"mt-1 text-3xl font-black tabular-nums [font-family:var(--font-pixel),monospace] " + (timeLeft <= 5 ? "text-rose-300" : "text-amber-100")}>{String(timeLeft).padStart(2, "0")}</p>
                    {!gameStarted && !finished && <button type="button" onClick={() => { answeringRef.current = false; setSelected(null); setAnswering(false); setRevealed(false); setShowHint(false); setGameError(null); timerDeadlineRef.current = null; setTimeLeft(QUESTION_SECONDS); startRoundTimer(); }} disabled={!gameSessionId || sessionLoading || startingGame} className="mt-2 min-h-10 border-[3px] border-[#ffe08a] bg-[#5a3c11] px-4 text-xs font-black text-white shadow-[3px_3px_0_#030713] disabled:opacity-50">{sessionLoading || !gameSessionId ? "PREPARANDO PARTIDA…" : startingGame ? "INICIANDO AUDIO…" : "▶ COMENZAR PARTIDA"}</button>}
                    <div className="mt-2 h-2 overflow-hidden border border-[#414d67] bg-[#252f47]"><div className={"h-full transition-[width] duration-300 " + (timeLeft <= 5 ? "bg-rose-400" : "bg-amber-300")} style={{ width: (timeLeft / QUESTION_SECONDS * 100) + "%" }}/></div>
                  </div>
                </div>
                <div className="relative flex h-8 items-center px-1"><div className="absolute left-1 right-1 top-1/2 h-3 -translate-y-1/2 border-2 border-[#7b8396] bg-[#171d2c]" /><div className="absolute left-1 top-1/2 h-3 -translate-y-1/2 border-y-2 border-[#fff0a6] bg-[#e8b936] transition-[width] duration-300" style={{ width: `calc(${Math.min(100, correctCount / TOTAL_ROUNDS * 100)}% - 8px)` }} /><div className="relative z-10 flex w-full items-center justify-between">{Array.from({ length: 5 }, (_, i) => { const chestIndex = i === 1 ? 0 : i === 2 ? 1 : i === 4 ? 2 : -1; const isChest = chestIndex >= 0; const unlocked = isChest && chestLevel > chestIndex; return <div key={i} className={`relative grid h-7 w-7 place-items-center border-2 ${isChest ? (unlocked ? "border-[#ffe08a] bg-[#4b3211]" : "border-[#566079] bg-[#101629]") : "border-[#8992a8] bg-[#182136]"} shadow-[2px_2px_0_#030713]`} title={isChest ? (unlocked ? "Cofre disponible para reclamar" : `Cofre al alcanzar ${CHEST_THRESHOLDS[chestIndex]} aciertos`) : `Hito ${i + 1}`} >{isChest ? <button type="button" onClick={() => void claimChest(chestIndex + 1)} disabled={!unlocked || claimedChests.includes(chestIndex + 1) || claimingChest !== null || !gameSessionId} aria-label={claimedChests.includes(chestIndex + 1) ? `Cofre ${chestIndex + 1} reclamado` : `Reclamar cofre ${chestIndex + 1}`} className="relative grid h-full w-full place-items-center disabled:cursor-not-allowed"><Image src="/images/games/poco-responda/cofre.png" alt="" width={24} height={24} className={`h-6 w-6 object-contain ${claimedChests.includes(chestIndex + 1) ? "opacity-40 grayscale" : unlocked ? "animate-pulse" : "grayscale opacity-45"}`} />{unlocked && !claimedChests.includes(chestIndex + 1) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" aria-label="Cofre disponible para reclamar" />}</button> : <span className="text-[10px] font-black text-[#c8d1e5] [font-family:var(--font-pixel),monospace]">{i === 0 || i === 3 ? "•" : ""}</span>}</div>; })}</div></div>
              </div>
            </header>
            {finished ? <div className="p-5 text-center sm:p-8"><h2 className="text-2xl font-black text-[#ffe28b]">¡Ronda terminada!</h2><p className="mt-2 text-sm text-slate-200">Acertaste {correctCount} de {TOTAL_ROUNDS} preguntas y conseguiste {score} puntos.</p><p className="mt-2 text-xs text-slate-400">{saveStatus === "saving" ? "Guardando tu progreso…" : saveStatus === "saved" ? "Progreso guardado en tu cuenta." : saveStatus === "error" ? "No se pudo guardar en la cuenta; tu partida local sigue disponible." : "Tu resultado está listo."}</p><div className="mx-auto mt-5 max-w-sm border-[3px] border-[#77839d] bg-[#0b1228] p-4 shadow-[5px_5px_0_#030713]"><Image src="/images/games/poco-responda/cofre.png" alt="Cofre de recompensas" width={180} height={130} className="mx-auto h-28 w-36 object-contain" /><div className="mt-3 flex gap-1.5">{Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-3 flex-1 border-2 ${i < earnedChests ? "border-[#ffdc7a] bg-[#e8b936]" : "border-[#566079] bg-[#151c31]"}`} />)}</div><p className="mt-2 text-xs text-[#f5d987]">{earnedChests} / 3 cofres desbloqueados</p></div><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a8d99a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] hover:bg-[#32934f]"><RotateCcw className="h-4 w-4" /> Jugar otra vez</button><Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#737c93] bg-[#111a31] px-5 text-xs font-bold text-white hover:bg-[#1a2944]">Volver a juegos</Link></div></div> : question ? <div className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap gap-2"><span className="border-2 border-[#627d8d] bg-[#172b3a] px-3 py-1.5 text-[10px] font-black text-[#b8f3e7]">{question.subject}</span></div>
              <div className="relative border-[4px] border-[#7d879e] bg-[#111a31] p-5 shadow-[inset_0_0_0_3px_#29344e,inset_0_0_0_6px_#080e20,6px_6px_0_#030713] sm:p-7"><div className="absolute left-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute right-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute bottom-2 left-2 h-2 w-2 bg-[#68738e]" /><div className="absolute bottom-2 right-2 h-2 w-2 bg-[#68738e]" /><div className="mb-4 flex h-10 w-10 items-center justify-center border-[3px] border-[#77829d] bg-[#252e49]"><CircleHelp className="h-5 w-5 text-[#f5d77c]" /></div><p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8">{question.clue}</p><button type="button" onClick={useHint} disabled={showHint} className="mt-5 inline-flex min-h-10 items-center gap-2 border-[3px] border-[#8e8059] bg-[#28243a] px-3 text-xs font-black text-[#ffe7a2] shadow-[3px_3px_0_#050817] transition hover:bg-[#39334a] disabled:opacity-60"><Lightbulb className="h-4 w-4" /> {showHint ? "Pista revelada" : "Dame una pista"}</button>{showHint && <p className="mt-3 border-[3px] border-[#89774c] bg-[#242032] p-3 text-sm leading-6 text-[#ffedb8]">{question.hint}</p>}</div>
              {gameError && <p role="alert" className="mb-3 border-2 border-rose-400 bg-rose-950/60 p-3 text-xs font-bold text-rose-100">{gameError}</p>}
              {(!gameSessionId || sessionLoading) && <p role="status" className="mb-3 text-xs text-[#c7d5ee]">{sessionLoading ? "Preparando partida segura…" : "Conectando con el servidor…"}</p>}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = optionIndex === question.answer; const stateClass = !revealed ? "border-[#69748d] bg-[#111a31] hover:border-[#d8c16b] hover:bg-[#222a40]" : isCorrect ? "border-[#8bc79a] bg-[#193b32]" : isSelected ? "border-[#d58a91] bg-[#3b202d]" : "border-[#3c4762] bg-[#0b1226] opacity-75"; return <button key={option} type="button" onClick={() => void chooseOption(optionIndex)} disabled={!gameStarted || revealed || answering || !gameSessionId} aria-pressed={isSelected} className={`relative flex min-h-[66px] items-center gap-3 border-[3px] p-4 text-left text-sm font-bold leading-6 shadow-[4px_4px_0_#030713] transition ${!revealed && isSelected ? "border-[#f5d77c] bg-[#34304a] ring-2 ring-[#f5d77c]/70" : stateClass}`}><span className="absolute left-1 top-1 h-1.5 w-1.5 bg-[#aeb8ce]" /><span className="flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-[#69738c] bg-[#080e20] text-xs font-black text-[#f5d77c] [font-family:var(--font-pixel),monospace]">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{revealed && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#a5e6b1]" />}{revealed && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 shrink-0 text-[#ff9aa5]" />}</button>; })}</div>
              {revealed && <div role="status" aria-live="polite" className={`mt-4 border-[3px] p-4 ${answeredCorrectly ? "border-[#80bd8d] bg-[#14352c]" : "border-[#ca858d] bg-[#351d2a]"}`}><p className="text-sm font-black">{selected === null ? "¡Se acabó el tiempo!" : answeredCorrectly ? "¡Correcto, bien hecho!" : "Esta vez no fue. ¡Aprendamos!"}</p><p className="mt-2 text-sm leading-6 text-white/85">{question.explanation}</p></div>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[10px] font-semibold text-[#b5bfd5]"><Clock3 className="h-4 w-4" /> Responde antes de que se agote el tiempo</p><button type="button" onClick={handleNext} disabled={!revealed || answering} className="inline-flex min-h-11 items-center gap-2 border-[3px] border-[#a5d79a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] transition hover:bg-[#32984f] active:translate-y-0.5 active:shadow-[2px_2px_0_#102b1c] disabled:cursor-not-allowed disabled:border-[#424b60] disabled:bg-[#222a3b] disabled:text-[#7c8497] disabled:shadow-none">{selected === null && revealed ? "Siguiente" : !answeredCorrectly ? "Reintentar" : index + 1 === TOTAL_ROUNDS ? "Ver resultados" : "Siguiente"} <ArrowRight className="h-4 w-4" /></button></div>
            </div> : null}
          </section>
          {!finished && <aside className="grid gap-4"><section className="border-[3px] border-[#746e88] bg-[#0a1026]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.45)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f0d28a]">Recompensa de la ronda</p><h2 className="mt-2 text-base font-black">El cofre misterioso</h2><div className={"relative mx-auto my-3 grid h-36 place-items-center "+(chestLevel > 0 ? "animate-pulse" : "")}><div className="absolute inset-x-8 inset-y-3 rounded-full bg-amber-300/20 blur-xl" aria-hidden="true"/><Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className={"relative z-10 h-32 w-full object-contain drop-shadow-[0_5px_0_rgba(0,0,0,.5)] "+(chestLevel > 0 ? "animate-bounce" : "")} />{chestLevel > 0 && <span className="absolute bottom-0 z-20 border-2 border-[#ffe28b] bg-[#261d35] px-3 py-1 text-[10px] font-black text-[#ffe28b] shadow-[0_0_18px_rgba(255,214,92,.6)]">¡RECOMPENSA DESBLOQUEADA!</span>}</div><div className="grid grid-cols-3 gap-2" aria-label={`${chestLevel} de 3 cofres desbloqueados`}>{Array.from({ length: 3 }, (_, i) => { const number = i + 1; const unlocked = correctCount >= CHEST_THRESHOLDS[i]; const claimed = claimedChests.includes(number); return <button key={number} type="button" onClick={() => void claimChest(number)} disabled={!unlocked || claimed || claimingChest !== null || !gameSessionId} title={claimed ? "Recompensa reclamada" : unlocked ? "Abrir cofre" : `Necesitas ${CHEST_THRESHOLDS[i]} respuestas correctas`} className={`relative flex min-h-10 items-center justify-center border-[3px] transition ${claimed ? "border-[#7f8798] bg-[#22283a] opacity-60" : unlocked ? "border-[#ffe08a] bg-[#5a3c11] shadow-[0_0_12px_rgba(255,214,92,.4)] hover:bg-[#785016]" : "border-[#566079] bg-[#151b2d] opacity-65"}`}><Image src="/images/games/poco-responda/cofre.png" alt={`Cofre ${number}`} width={34} height={28} className={`h-7 w-9 object-contain ${claimed ? "grayscale" : unlocked ? "animate-pulse" : "grayscale opacity-45"}`}/>{unlocked && !claimed && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500"/>}{claimingChest === number && <span className="absolute inset-0 grid place-items-center bg-black/70 text-[8px] font-black">ABRIENDO</span>}</button>; })}</div><p className="mt-3 text-xs font-black leading-5 text-[#ffe5a0]">{chestMessage}</p><p className="mt-2 text-[10px] leading-5 text-[#9da8c5]">Hay 3 cofres que se desbloquean al llegar a 2, 5 y 8 respuestas correctas.</p></section>
          <section className="border-[3px] border-[#5e6d8c] bg-[#081027]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.4)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8c8e9]">Pistas</p><div className="mt-3 grid gap-2"><button type="button" onClick={useHint} disabled={showHint} className={`flex items-center gap-3 border-[3px] p-3 text-left ${showHint ? "border-[#6e6484] bg-[#17172e] opacity-70" : "border-[#b58cdb] bg-[#251c3c] hover:bg-[#32234d]"}`}><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#8b75b5] bg-[#382a52]"><Lightbulb className="h-5 w-5 text-[#ffe36b]" /></span><span className="min-w-0"><span className="block text-sm font-black text-[#f4d8ff]">Pista 1</span><span className="block text-xs text-[#d8cce8]">{showHint ? "Ya revelada" : "Revelar una orientación"}</span></span></button><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">◉</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 2</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div><div className="flex items-center gap-3 border-[3px] border-[#35425e] bg-[#10172c] p-3 opacity-65"><span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#405477] bg-[#152542] text-lg">▤</span><span><span className="block text-sm font-black text-[#a9dff4]">Pista 3</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span></div></div></section></aside>}
        </div>
      </div>
    </main>
  );
}

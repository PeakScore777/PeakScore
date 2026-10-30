"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, Lightbulb, RotateCcw, XCircle } from "lucide-react";

import { QUESTION_BANK, type Question } from "@/lib/games/que-es-esa-vaina-bank";
import LessonAITutor from "@/components/aprender/LessonAITutor";

const TOTAL_ROUNDS = 10;
const CHEST_THRESHOLDS = [200, 500, 1000] as const;
const STORAGE_KEY = "peakscore-que-es-esa-vaina-v1";

type SavedProgress = { bestScore: number; completedIds: string[]; chests: number };
type IncorrectAnswerReview = {
  question: Question;
  questionNumber: number;
  selectedOption: number | null;
  correctOption: number;
};

const RECENT_KEY = "peakscore-que-es-esa-vaina-recent-v1";
const QUESTION_SECONDS = 20;
const WRONG_ANSWER_PENALTY = 50;
const HINT_COSTS = [5, 10, 15] as const;

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

function formatCooldown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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
  const [serverAnswerCorrect, setServerAnswerCorrect] = useState<boolean | null>(null);
  const [serverCorrectOption, setServerCorrectOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswerReview[]>([]);
  const [orbyReviewOpen, setOrbyReviewOpen] = useState(false);
  const [mobileTools, setMobileTools] = useState<"chests" | "hints" | null>(null);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [visibleHints, setVisibleHints] = useState<Partial<Record<1 | 2 | 3, string>>>({});
  const [hintLoading, setHintLoading] = useState(false);
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
  const [rewardScore, setRewardScore] = useState(0);
  const [chestCycleNumber, setChestCycleNumber] = useState(1);
  const [chestCooldownUntil, setChestCooldownUntil] = useState<string | null>(null);
  const [frozenRewardScore, setFrozenRewardScore] = useState(0);
  const [sessionOutdated, setSessionOutdated] = useState(false);
  const [cooldownNow, setCooldownNow] = useState(0);
  const cooldownRefreshRef = useRef(false);
  const lastChestCycleRef = useRef<number | null>(null);
  const chestStateInitializedRef = useRef(false);
  const [chestAnimation, setChestAnimation] = useState<{ chestNumber: number; xp: number; coins: number; phase: "opening" | "reward" } | null>(null);
  const [wallet, setWallet] = useState<{ xp: number; coins: number } | null>(null);
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const rewardAudioContextRef = useRef<AudioContext | null>(null);

  // Preparamos el audio al entrar, pero no se reproduce hasta que el jugador inicia.
  // Al desmontar el minijuego, detenemos el reloj y los efectos para que no salgan de la página.
  useEffect(() => {
    const audio = new Audio("/audio/games/que-es-esa-vaina-timer.wav");
    audio.volume = 0.16;
    audio.preload = "auto";
    audio.loop = false;
    timerAudioRef.current = audio;
    audio.load();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      if (timerAudioRef.current === audio) timerAudioRef.current = null;
      const rewardAudioContext = rewardAudioContextRef.current;
      if (rewardAudioContext && rewardAudioContext.state !== "closed") void rewardAudioContext.close().catch(() => undefined);
      rewardAudioContextRef.current = null;
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
      setSessionOutdated(false);
      setGameSessionId(payload.sessionId);
    }).catch((error: unknown) => {
      setGameError(error instanceof Error ? error.message : "No se pudo iniciar la partida.");
    }).finally(() => {
      setSessionLoading(false);
    });
  }, [hydrated, rounds, gameSessionId, finished]);

  useEffect(() => {
    if (!chestAnimation || chestAnimation.phase !== "opening") return;
    const timer = window.setTimeout(() => setChestAnimation((current) => current ? { ...current, phase: "reward" } : null), 1500);
    return () => window.clearTimeout(timer);
  }, [chestAnimation]);

  const refreshChestState = useCallback(async () => {
    const response = await fetch("/api/games/chests/claim", { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo actualizar el estado de los cofres.");
    const payload = await response.json();
    setClaimedChests(Array.isArray(payload.claimedChests)
      ? payload.claimedChests.filter((number: unknown): number is number => Number.isInteger(number) && Number(number) >= 1 && Number(number) <= 3)
      : []);
    if (payload.wallet && Number.isFinite(Number(payload.wallet.xp)) && Number.isFinite(Number(payload.wallet.coins))) {
      setWallet({ xp: Number(payload.wallet.xp), coins: Number(payload.wallet.coins) });
    }
    if (Number.isInteger(payload.cycleNumber) && payload.cycleNumber > 0) {
      const loadedCycleNumber = Number(payload.cycleNumber);
      if (!chestStateInitializedRef.current) {
        // La primera sincronización no es una recarga ocurrida en mitad de la partida.
        chestStateInitializedRef.current = true;
        lastChestCycleRef.current = loadedCycleNumber;
      }
      setChestCycleNumber(loadedCycleNumber);
    }
    setChestCooldownUntil(typeof payload.cooldownUntil === "string" ? payload.cooldownUntil : null);
    setFrozenRewardScore(Math.max(0, Math.min(1000, Number(payload.frozenScore) || 0)));
    setCooldownNow(Date.now());
    return payload;
  }, []);

  useEffect(() => {
    void refreshChestState().catch(() => undefined);
  }, [refreshChestState]);

  useEffect(() => {
    // Espera a que Supabase haya entregado el ciclo real antes de detectar cambios.
    if (!chestStateInitializedRef.current) return;
    if (lastChestCycleRef.current === null) {
      lastChestCycleRef.current = chestCycleNumber;
      return;
    }
    if (lastChestCycleRef.current !== chestCycleNumber) {
      lastChestCycleRef.current = chestCycleNumber;
      setRewardScore(0);
      setSessionOutdated(true);
      setGameError("Terminó la recarga. Pulsa Jugar otra vez para iniciar una partida nueva y reactivar los cofres.");
    }
  }, [chestCycleNumber]);

  useEffect(() => {
    if (!chestCooldownUntil) {
      setCooldownNow(Date.now());
      return;
    }
    const timer = window.setInterval(() => {
      const now = Date.now();
      setCooldownNow(now);
      if (Date.parse(chestCooldownUntil) <= now && !cooldownRefreshRef.current) {
        cooldownRefreshRef.current = true;
        void refreshChestState().catch(() => undefined).finally(() => {
          cooldownRefreshRef.current = false;
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [chestCooldownUntil, refreshChestState]);

  const question = rounds[index];
  const cooldownActive = Boolean(chestCooldownUntil && Date.parse(chestCooldownUntil) > cooldownNow);
  const allChestsClaimed = claimedChests.length >= 3;
  const rewardCanProgress = !cooldownActive && !allChestsClaimed && !sessionOutdated;
  const rewardMeterScore = cooldownActive || allChestsClaimed || sessionOutdated ? frozenRewardScore : rewardScore;
  const scoreProgress = Math.max(0, Math.min(100, Math.round((rewardMeterScore / 1000) * 100)));
  const chestLevel = CHEST_THRESHOLDS.filter((threshold) => rewardMeterScore >= threshold).length;
  const nextChestToClaim = ([1, 2, 3] as const).find((number) => !claimedChests.includes(number)) ?? null;
  const hasUnclaimedChest = Boolean(nextChestToClaim && !cooldownActive && !sessionOutdated && rewardMeterScore >= CHEST_THRESHOLDS[nextChestToClaim - 1]);
  const cooldownRemainingMs = chestCooldownUntil ? Math.max(0, Date.parse(chestCooldownUntil) - cooldownNow) : 0;

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
      if (kind === "tick") tone(1150, 0, 0.035, "square", 0.009);
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

  // Desbloqueamos el contexto de audio durante el clic del usuario para que
  // el sonido de recompensa pueda sonar también después de la animación de apertura.
  const primeRewardAudioContext = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      let context = rewardAudioContextRef.current;
      if (!context || context.state === "closed") {
        context = new AudioContextClass();
        rewardAudioContextRef.current = context;
      }
      if (context.state === "suspended") void context.resume().catch(() => undefined);
    } catch {
      // Los navegadores sin Web Audio conservan el sonido de apertura del cofre.
    }
  }, []);

  // Coro celestial "ahhh" generado con Web Audio. No depende de un archivo remoto
  // y solo suena cuando el cofre termina de abrirse.
  const playSyntheticRewardSting = useCallback(() => {
    const context = rewardAudioContextRef.current;
    if (!context || context.state === "closed") return;

    void context.resume().then(() => {
      const startAt = context.currentTime + 0.035;
      const master = context.createGain();
      master.gain.setValueAtTime(0.72, startAt);
      master.connect(context.destination);

      // Eco corto y suave para dar profundidad sin crear un bucle de audio permanente.
      const echo = context.createDelay(0.4);
      echo.delayTime.setValueAtTime(0.24, startAt);
      const echoGain = context.createGain();
      echoGain.gain.setValueAtTime(0.19, startAt);
      master.connect(echo);
      echo.connect(echoGain);
      echoGain.connect(context.destination);

      const formants = [
        { frequency: 780, q: 1.15, gain: 0.68 },
        { frequency: 1180, q: 1.45, gain: 0.38 },
        { frequency: 2650, q: 2.0, gain: 0.11 },
      ];
      const voices: Array<{ frequency: number; detune: number; volume: number }> = [
        { frequency: 261.63, detune: -7, volume: 0.032 },
        { frequency: 261.63, detune: 6, volume: 0.028 },
        { frequency: 329.63, detune: -5, volume: 0.026 },
        { frequency: 329.63, detune: 7, volume: 0.024 },
        { frequency: 392, detune: -6, volume: 0.021 },
        { frequency: 392, detune: 5, volume: 0.019 },
        { frequency: 523.25, detune: -4, volume: 0.009 },
      ];

      for (const voice of voices) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const voiceBus = context.createGain();
        const vibrato = context.createOscillator();
        const vibratoDepth = context.createGain();
        const noteStart = startAt;

        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(voice.frequency * 0.965, noteStart);
        oscillator.frequency.exponentialRampToValueAtTime(voice.frequency, noteStart + 0.42);
        oscillator.detune.setValueAtTime(voice.detune, noteStart);
        vibrato.type = "sine";
        vibrato.frequency.setValueAtTime(4.6 + Math.abs(voice.detune) * 0.025, noteStart);
        vibratoDepth.gain.setValueAtTime(2.2, noteStart);
        vibrato.connect(vibratoDepth);
        vibratoDepth.connect(oscillator.detune);

        envelope.gain.setValueAtTime(0.0001, noteStart);
        envelope.gain.exponentialRampToValueAtTime(voice.volume, noteStart + 0.34);
        envelope.gain.setValueAtTime(voice.volume * 0.88, noteStart + 1.08);
        envelope.gain.exponentialRampToValueAtTime(0.0001, noteStart + 2.55);

        for (const formant of formants) {
          const filter = context.createBiquadFilter();
          const formantGain = context.createGain();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(formant.frequency, noteStart);
          filter.Q.setValueAtTime(formant.q, noteStart);
          formantGain.gain.setValueAtTime(formant.gain, noteStart);
          oscillator.connect(filter);
          filter.connect(formantGain);
          formantGain.connect(voiceBus);
        }
        voiceBus.gain.setValueAtTime(0.72, noteStart);
        voiceBus.connect(envelope);
        envelope.connect(master);

        oscillator.start(noteStart);
        vibrato.start(noteStart);
        oscillator.stop(noteStart + 2.62);
        vibrato.stop(noteStart + 2.65);
      }
    }).catch(() => undefined);
  }, []);

  // Primero usamos el coro celestial original elegido en Freesound. Si el CDN no
  // responde, el sintetizador anterior queda como respaldo para no silenciar la recompensa.
  const playRewardSting = useCallback(() => {
    try {
      const audio = new Audio("https://cdn.freesound.org/previews/392/392172_7387785-hq.mp3");
      audio.preload = "auto";
      audio.volume = 0.56;
      feedbackAudioRef.current = audio;
      audio.onended = () => {
        if (feedbackAudioRef.current === audio) feedbackAudioRef.current = null;
      };
      void audio.play().catch(() => {
        if (feedbackAudioRef.current === audio) feedbackAudioRef.current = null;
        playSyntheticRewardSting();
      });
    } catch {
      playSyntheticRewardSting();
    }
  }, [playSyntheticRewardSting]);

  useEffect(() => {
    if (!chestAnimation || chestAnimation.phase !== "reward" || (chestAnimation.xp === 0 && chestAnimation.coins === 0)) return;
    playRewardSting();
  }, [chestAnimation, playRewardSting]);

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
    answeringRef.current = true;
    setAnswering(true);
    const revealFrame = window.requestAnimationFrame(() => {
      setSelected(null);
      setRevealed(true);
    });
    setServerAnswerCorrect(false);
    setScore((value) => Math.max(0, value - WRONG_ANSWER_PENALTY));
    if (rewardCanProgress) setRewardScore((value) => Math.max(0, value - WRONG_ANSWER_PENALTY));
    const timedOutQuestion = rounds[index];
    if (timedOutQuestion) {
      void fetch("/api/games/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gameSessionId, questionId: timedOutQuestion.id, selectedOption: null }),
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok || typeof payload.correctCount !== "number") throw new Error(payload.error || "No se pudo registrar el tiempo agotado.");
        setCorrectCount(Math.max(0, Number(payload.correctCount) || 0));
        const timeoutCorrectOption = Number.isInteger(payload.correctOption) && payload.correctOption >= 0 && payload.correctOption < timedOutQuestion.options.length
          ? payload.correctOption
          : timedOutQuestion.answer;
        setServerCorrectOption(timeoutCorrectOption);
        setIncorrectAnswers((current) => current.some((item) => item.question.id === timedOutQuestion.id)
          ? current
          : [...current, { question: timedOutQuestion, questionNumber: index + 1, selectedOption: null, correctOption: timeoutCorrectOption }]);
      }).catch(() => setGameError("No se pudo registrar el intento agotado. Continúa con la siguiente pregunta.")).finally(() => {
        answeringRef.current = false;
        setAnswering(false);
      });
    } else {
      answeringRef.current = false;
      setAnswering(false);
    }
    const timerAudio = timerAudioRef.current;
    if (timerAudio) {
      timerAudio.pause();
      timerAudio.currentTime = 0;
    }
    try {
      const timeoutAudio = new Audio("/sounds/game-over.wav");
      timeoutAudio.volume = 0.22;
      feedbackAudioRef.current = timeoutAudio;
      void timeoutAudio.play().catch(() => undefined);
    } catch {
      playSfx("wrong");
    }
    return () => window.cancelAnimationFrame(revealFrame);
  }, [hydrated, gameSessionId, sessionLoading, gameStarted, finished, revealed, timeLeft, playSfx, rounds, index, rewardCanProgress]);

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
  // Los cofres se desbloquean por puntos netos: 200, 500 y 1000 (barra completa para el último).
  const answeredCorrectly = selected !== null && (serverAnswerCorrect ?? (question?.answer === selected));

  const chooseOption = useCallback(async (optionIndex: number) => {
    if (!gameStarted || revealed || finished || answeringRef.current || hintLoading || !gameSessionId || timeLeft <= 0) return;
    const current = rounds[index];
    if (!current) return;

    // La selección, el resultado y la explicación se muestran en este mismo clic.
    const isCorrectLocally = optionIndex === current.answer;
    const previousScore = score;
    answeringRef.current = true;
    timerDeadlineRef.current = null;
    const timerAudio = timerAudioRef.current;
    if (timerAudio) {
      timerAudio.pause();
      timerAudio.currentTime = 0;
    }
    setSelected(optionIndex);
    setServerAnswerCorrect(null);
    setServerCorrectOption(null);
    setRevealed(true);
    setAnswering(true);
    setGameError(null);

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
      if (payload.alreadyAnswered) {
        setScore(previousScore);
        setCorrectCount(Math.max(0, Number(payload.correctCount) || 0));
        setServerAnswerCorrect(payload.isCorrect);
        if (Number.isInteger(payload.correctOption) && payload.correctOption >= 0 && payload.correctOption <= 3) {
          setServerCorrectOption(payload.correctOption);
        }
        setGameError("Esta pregunta ya fue registrada y no se puede repetir.");
        return;
      }
      const officialCorrect = payload.isCorrect;
      const officialCorrectOption = Number.isInteger(payload.correctOption) && payload.correctOption >= 0 && payload.correctOption < current.options.length
        ? payload.correctOption
        : current.answer;
      setServerAnswerCorrect(officialCorrect);
      setServerCorrectOption(officialCorrectOption);
      if (!officialCorrect) {
        setIncorrectAnswers((currentAnswers) => currentAnswers.some((item) => item.question.id === current.id)
          ? currentAnswers
          : [...currentAnswers, { question: current, questionNumber: index + 1, selectedOption: optionIndex, correctOption: officialCorrectOption }]);
      }
      setCorrectCount(Math.max(0, Number(payload.correctCount) || 0));
      setScore(officialCorrect ? previousScore + 100 : Math.max(0, previousScore - WRONG_ANSWER_PENALTY));
      if (rewardCanProgress) setRewardScore((value) => officialCorrect ? value + 100 : Math.max(0, value - WRONG_ANSWER_PENALTY));
      if (officialCorrect) {
        setSaved((value) => ({
          ...value,
          completedIds: value.completedIds.includes(current.id) ? value.completedIds : [...value.completedIds, current.id],
        }));
      } else {
        playSfx("wrong");
      }
      if (officialCorrect !== isCorrectLocally) {
        setGameError("La validación del servidor difiere de la pregunta local; se usó el resultado oficial.");
      }
    } catch (error) {
      setScore(previousScore);
      setServerAnswerCorrect(null);
      setServerCorrectOption(null);
      setGameError(error instanceof Error ? error.message : "No se pudo guardar la respuesta.");
    } finally {
      answeringRef.current = false;
      setAnswering(false);
    }
  }, [finished, gameSessionId, gameStarted, hintLoading, index, playSfx, revealed, rounds, score, timeLeft, rewardCanProgress]);

  const next = useCallback(() => {
    if (!revealed) return;
    if (index + 1 >= rounds.length) {
      timerDeadlineRef.current = null;
      setTimeLeft(0);
      setFinished(true);
      setSaved((value) => ({
        ...value,
        bestScore: Math.max(value.bestScore, score),
        chests: Math.max(value.chests, CHEST_THRESHOLDS.filter((threshold) => rewardScore >= threshold).length),
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
    setServerAnswerCorrect(null);
    setServerCorrectOption(null);
    setRevealed(false);
    setVisibleHints({});
    setTimeLeft(QUESTION_SECONDS);
  }, [correctCount, index, revealed, rounds.length, score, rewardScore]);

  const handleNext = useCallback(() => {
    if (!revealed || answeringRef.current || hintLoading) return;
    setMobileTools(null);

    try {
      const navigationAudio = new Audio("/sounds/navigation.mp3");
      navigationAudio.volume = 0.35;
      feedbackAudioRef.current = navigationAudio;
      void navigationAudio.play().catch(() => undefined);
    } catch {
      // El sonido no debe bloquear la navegación.
    }

    // Un intento por pregunta: reintentar significa avanzar a una pregunta distinta.
    const hasNextQuestion = index + 1 < rounds.length;
    if (hasNextQuestion) {
      next();
      startRoundTimer();
    } else {
      timerDeadlineRef.current = null;
      setTimeLeft(0);
      next();
    }
  }, [hintLoading, index, next, revealed, rounds.length, startRoundTimer]);

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
    setServerAnswerCorrect(null);
    setServerCorrectOption(null);
    setRevealed(false);
    setScore(0);
    setRewardScore(0);
    setSessionOutdated(false);
    setCorrectCount(0);
    setIncorrectAnswers([]);
    setOrbyReviewOpen(false);
    setUsedHints([]); setVisibleHints({});
    setFinished(false);
    setMobileTools(null);
    setGameSessionId(null);
    sessionAttemptedRef.current = false;
    setClaimingChest(null);
    setChestAnimation(null);
    setGameError(null);
    setSaveStatus("idle");
  }, [index, questionPool, rounds]);

  const claimChest = useCallback(async (chestNumber: number) => {
    if (!gameSessionId || claimingChest !== null || claimedChests.includes(chestNumber) || cooldownActive || sessionOutdated || chestNumber !== nextChestToClaim) return;
    const required = CHEST_THRESHOLDS[chestNumber - 1];
    if (rewardMeterScore < required) return;
    primeRewardAudioContext();
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
      if (Number.isInteger(reward.cycleNumber) && reward.cycleNumber > 0) setChestCycleNumber(reward.cycleNumber);
      setChestCooldownUntil(typeof reward.cooldownUntil === "string" ? reward.cooldownUntil : null);
      setFrozenRewardScore(Math.max(0, Math.min(1000, Number(reward.frozenScore) || 0)));
      setCooldownNow(Date.now());
      setChestAnimation({ chestNumber, xp: Number(reward.xpAwarded) || 0, coins: Number(reward.coinsAwarded) || 0, phase: "opening" });
      const chestAudio = new Audio("/audio/games/que-es-esa-vaina-chest-open.mp3");
      chestAudio.volume = 0.48;
      feedbackAudioRef.current = chestAudio;
      void chestAudio.play().catch(() => undefined);
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "No se pudo reclamar el cofre.");
    } finally {
      setClaimingChest(null);
    }
  }, [claimedChests, claimingChest, cooldownActive, gameSessionId, nextChestToClaim, playSfx, primeRewardAudioContext, rewardMeterScore, sessionOutdated]);

  // Vista previa local: muestra el premio y reproduce los sonidos, pero no llama a Supabase.
  const previewChestReward = useCallback(() => {
    primeRewardAudioContext();
    const openingAudio = new Audio("/audio/games/que-es-esa-vaina-chest-open.mp3");
    openingAudio.volume = 0.48;
    feedbackAudioRef.current = openingAudio;
    void openingAudio.play().catch(() => undefined);
    setChestAnimation({ chestNumber: 1, xp: 5, coins: 3, phase: "opening" });
  }, [primeRewardAudioContext]);

  const handleUseHint = async (hintNumber: 1 | 2 | 3) => {
    const hintCost = HINT_COSTS[hintNumber - 1];
    if (!question || usedHints.includes(hintNumber) || hintLoading || answering || revealed || !gameStarted || !gameSessionId) return;
    setHintLoading(true);
    setGameError(null);
    try {
      const response = await fetch("/api/games/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gameSessionId, questionId: question.id, hintNumber }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.coinsTotal !== "number" || typeof payload.hintText !== "string") {
        throw new Error(payload.error || `Necesitas ${hintCost} Peak Coins para usar esta pista.`);
      }
      setWallet((current) => ({ xp: current?.xp ?? 0, coins: Math.max(0, Number(payload.coinsTotal) || 0) }));
      setUsedHints((current) => current.includes(hintNumber) ? current : [...current, hintNumber]);
      setVisibleHints((current) => ({ ...current, [hintNumber]: payload.hintText }));
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "No se pudo comprar la pista.");
    } finally {
      setHintLoading(false);
    }
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
    if (sessionOutdated) return "La recarga terminó. Pulsa Jugar otra vez para iniciar una partida nueva y reactivar los cofres.";
    if (cooldownActive) return "Ya reclamaste el conjunto de cofres. Puedes seguir jugando; las recompensas se reactivan al terminar la recarga.";
    if (allChestsClaimed) return "¡Conjunto completado! Las recompensas entran en recarga durante una hora.";
    if (chestLevel >= 3) return "Tienes puntos para los tres cofres; reclámalos en orden desde la barra superior.";
    if (chestLevel >= 2) return "Ya alcanzaste el segundo umbral. Reclama los cofres en orden para continuar.";
    if (chestLevel >= 1) return "Primer umbral alcanzado. Puedes reclamar el cofre desde la barra superior.";
    return "Resuelve preguntas; los errores restan puntos y reducen el progreso de recompensa.";
  }, [allChestsClaimed, chestLevel, cooldownActive, sessionOutdated]);

  if (!hydrated || rounds.length === 0 || (sessionLoading && !gameSessionId)) {
    return (
      <main className="relative isolate min-h-[calc(100svh-72px)] overflow-x-clip bg-[#070b18] p-2 text-white sm:overflow-hidden sm:p-5">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-[#030817]/75" />
        <div className="ml-auto mr-[1vw] w-full max-w-[1390px] px-3 pb-8 pt-4 sm:px-5 lg:px-6 animate-pulse">
          <div className="mb-4 h-10 w-36 border-2 border-slate-600 bg-slate-800/80" />
          <div className="grid min-w-0 items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
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
            <aside className="hidden gap-4 xl:grid">
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
    <main className="relative isolate min-h-[calc(100svh-72px)] overflow-x-clip bg-[#070b18] p-2 text-white sm:overflow-hidden sm:p-5">
      {chestAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#03020a]/95 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Recompensa del cofre">
          <div className="absolute inset-0 scale-105 bg-cover bg-center opacity-35 blur-[3px]" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,165,29,.24)_0%,rgba(11,7,30,.46)_40%,rgba(2,3,10,.96)_100%)]" aria-hidden="true" />
          <section className="chest-reward-legendary-frame relative my-auto flex min-h-0 max-h-[calc(100svh-24px)] w-full max-w-[820px] flex-col items-center justify-between overflow-x-hidden overflow-y-auto border-[3px] border-[#eab348] px-3 py-3 shadow-[inset_0_0_0_2px_rgba(255,221,131,.35),0_0_0_2px_#39240e,0_0_32px_rgba(255,177,35,.22)] sm:max-h-[calc(100svh-48px)] sm:px-7 sm:py-4">
            <span aria-hidden="true" className="chest-reward-frame-corner chest-reward-frame-corner-tl" />
            <span aria-hidden="true" className="chest-reward-frame-corner chest-reward-frame-corner-tr" />
            <span aria-hidden="true" className="chest-reward-frame-corner chest-reward-frame-corner-bl" />
            <span aria-hidden="true" className="chest-reward-frame-corner chest-reward-frame-corner-br" />

            <div className="relative z-10 flex w-full max-w-[1000px] flex-col items-center">
              <div className="mb-2 flex w-full max-w-[760px] items-center justify-center gap-3 sm:mb-3 sm:gap-5" aria-hidden="true">
                <span className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-[#f4b82f] to-[#ffe58b]" />
                <span className="pixel-font text-xl leading-none text-[#ffdf53] drop-shadow-[0_0_12px_rgba(255,187,34,.9)] sm:text-3xl">✦</span>
                <span className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-[#f4b82f] to-[#ffe58b]" />
              </div>

              <h1 className="chest-reward-legendary-title pixel-font max-w-full text-center text-[14px] leading-7 sm:text-[23px] sm:leading-10 md:text-[31px]">
                {chestAnimation.phase === "opening" ? "ABRIENDO COFRE…" : "¡RECOMPENSA OBTENIDA!"}
              </h1>

              <div className="mt-1 flex w-full items-center justify-center sm:mt-2">
                <span className="h-[2px] w-[12%] bg-gradient-to-r from-transparent to-[#9d6320]" />
                <span className="mx-2 pixel-font text-[10px] text-[#ffc74b] sm:mx-4 sm:text-base" aria-hidden="true">✦ ── ✦</span>
                <span className="h-[2px] w-[12%] bg-gradient-to-l from-transparent to-[#9d6320]" />
              </div>

              <div className={"chest-reward-legendary-burst relative mt-1 grid h-[clamp(150px,27vh,240px)] w-full max-w-[540px] place-items-center sm:mt-0 sm:h-[clamp(200px,30vh,310px)] sm:max-w-[650px] " + (chestAnimation.phase === "opening" ? "chest-open-sequence" : "chest-reward-glow")}>
                <div className="chest-reward-legendary-rays absolute inset-0" aria-hidden="true" />
                <div className="absolute inset-x-[18%] inset-y-[18%] rounded-full bg-[#ffc12b]/30 blur-3xl" aria-hidden="true" />
                {chestAnimation.phase === "reward" && (
                  <>
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-a" />
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-b" />
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-c" />
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-d" />
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-e" />
                    <span aria-hidden="true" className="chest-reward-spark chest-reward-spark-f" />
                  </>
                )}
                <Image
                  src={chestAnimation.phase === "opening" ? "/images/games/que-es-esa-vaina/cofre-apertura.gif" : "/images/games/que-es-esa-vaina/cofre-abierto-recompensas.png"}
                  alt={chestAnimation.phase === "opening" ? "Animación de apertura del cofre" : "Cofre abierto con monedas, gemas Peak Coin y emblemas de experiencia XP"}
                  unoptimized={chestAnimation.phase === "opening"}
                  width={560}
                  height={420}
                  className={"relative z-10 h-[clamp(145px,25vh,225px)] w-full max-w-[350px] object-contain drop-shadow-[0_10px_0_rgba(0,0,0,.55)] sm:h-full sm:max-w-[430px]" + (chestAnimation.phase === "reward" ? " chest-reward-open-art" : "")}
                />
              </div>
            </div>

            {chestAnimation.phase === "opening" ? (
              <p className="pixel-font relative z-10 mb-2 text-center text-[8px] leading-5 text-[#ffe6a3] sm:mb-4 sm:text-[10px]">TU TESORO TE ESPERA…</p>
            ) : (
              <div className="relative z-10 flex w-full max-w-[900px] flex-col items-center gap-4 sm:gap-5">
                {chestAnimation.xp === 0 && chestAnimation.coins === 0 ? (
                  <p className="max-w-[620px] border-2 border-[#96733c] bg-[#100b20]/95 p-4 text-center text-xs leading-6 text-[#f7e4b1] sm:text-sm">
                    Este cofre no entregó una recompensa adicional en esta ocasión. Tus recompensas anteriores permanecen seguras.
                  </p>
                ) : (
                  <div className="grid w-full max-w-[850px] grid-cols-2 gap-2 sm:gap-4">
                    <div className="chest-reward-legendary-card chest-reward-legendary-card-xp chest-reward-card-v2">
                      <div className="chest-reward-card-body">
                        <Image src="/peaky/homepage/xp.webp" alt="Experiencia XP" width={92} height={92} className="chest-reward-card-icon" />
                        <p className="pixel-font chest-reward-card-value">
                          <span className="chest-reward-card-plus">+</span>{chestAnimation.xp}<span className="chest-reward-card-unit">XP</span>
                        </p>
                      </div>
                      <span className="chest-reward-card-glint" aria-hidden="true" />
                    </div>
                    <div className="chest-reward-legendary-card chest-reward-legendary-card-coins chest-reward-card-v2">
                      <div className="chest-reward-card-body">
                        <Image src="/images/currency/peakcoin.webp" alt="Peak Coin" width={92} height={92} className="chest-reward-card-icon" />
                        <p className="pixel-font chest-reward-card-value">
                          <span className="chest-reward-card-plus">+</span>{chestAnimation.coins}
                        </p>
                      </div>
                      <span className="chest-reward-card-glint" aria-hidden="true" />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setChestAnimation(null)}
                  className="chest-reward-legendary-continue pixel-font flex min-h-[54px] w-full max-w-[420px] items-center justify-center gap-3 px-5 py-3 text-[10px] text-[#291707] transition-transform hover:scale-[1.02] active:translate-y-1 sm:min-h-[72px] sm:text-[13px]"
                >
                  <span aria-hidden="true" className="text-[#9a5709]">➜</span>
                  CONTINUAR
                  <span aria-hidden="true" className="text-[#9a5709]">➜</span>
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      <div className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} />
      <div className="absolute inset-0 -z-20 bg-[#040817]/30" />
      <div className="absolute inset-0 -z-10 bg-[#030817]/20" />
      <div className="qeav-game-shell ml-auto mr-[1vw] w-full max-w-[1390px] px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex min-h-10 items-center gap-2 border-[3px] border-[#77839d] bg-[#10172b]/95 px-3 py-2 text-xs font-black text-white shadow-[4px_4px_0_#030713] transition hover:bg-[#1c2942]"><ArrowLeft className="h-4 w-4" /> Todos los juegos</Link>
        </div>
        <div className="grid min-w-0 items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section className="min-w-0 border-[3px] border-[#74809b] bg-[#070d22]/[.98] shadow-[0_0_0_3px_#11182d,7px_7px_0_rgba(0,0,0,.5)]">
            <header className="border-b-[3px] border-[#35415e] px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0c86d] [font-family:var(--font-pixel),monospace]">Ronda {finished ? TOTAL_ROUNDS : index + 1} de {TOTAL_ROUNDS}</p><h1 className="mt-1 text-sm font-black leading-6 text-white [font-family:var(--font-pixel),monospace] sm:mt-2 sm:text-xl">{finished ? "¡Desafío completado!" : "Descifra la pista"}</h1></div>
                <div className="grid w-full grid-cols-3 overflow-hidden border-y border-[#59462f] bg-gradient-to-r from-[#100f11] via-[#10131a] to-[#16110d] sm:w-auto">
                  <div className="flex min-w-0 items-center justify-center gap-1.5 border-r border-[#59462f] px-1.5 py-2 sm:min-w-[105px] sm:flex-1 sm:justify-start sm:gap-2 sm:px-3 sm:py-2.5">
                    <Image src="/dashboard/premio-pixel.webp" alt="Trofeo · puntos" width={38} height={38} className="h-6 w-6 shrink-0 object-contain sm:h-9 sm:w-9"/>
                    <span><span className="block text-[7px] font-bold uppercase tracking-wide text-[#d0b58c] sm:text-[9px]">Puntos</span><span className="mt-1 block text-sm font-black leading-none text-[#ffd65c] sm:text-lg">{score} <span className="text-[10px]">PTS</span></span></span>
                  </div>
                  <div className="flex min-w-0 items-center justify-center gap-1.5 border-r border-[#3b3b3b] px-1.5 py-2 sm:min-w-[96px] sm:flex-1 sm:justify-start sm:gap-2 sm:px-3 sm:py-2.5">
                    <Image src="/peaky/homepage/xp.webp" alt="XP" width={36} height={36} className="h-6 w-6 shrink-0 object-contain sm:h-9 sm:w-9"/>
                    <span><span className="block text-[7px] font-bold uppercase tracking-wide text-[#c8c8b5] sm:text-[9px]">XP total</span><span className="mt-1 block text-sm font-black leading-none text-[#eee4a9] sm:text-lg">{wallet ? wallet.xp : "—"}</span></span>
                  </div>
                  <div className="flex min-w-0 items-center justify-center gap-1.5 px-1.5 py-2 sm:min-w-[118px] sm:flex-1 sm:justify-start sm:gap-2 sm:px-3 sm:py-2.5">
                    <Image src="/images/currency/monedasacopiladas.png" alt="Peak Coins acumuladas" width={42} height={36} className="h-6 w-7 shrink-0 object-contain sm:h-9 sm:w-10"/>
                    <span><span className="block text-[7px] font-bold uppercase tracking-wide text-[#d9b68c] sm:text-[9px]">Peak Coins</span><span className="mt-1 block text-sm font-black leading-none text-[#ffbd68] sm:text-lg">{wallet ? wallet.coins : "—"}</span></span>
                  </div>
                </div>
              </div>
              <div className="mt-3 border-[3px] border-[#5e6983] bg-[#080e20] p-1.5 shadow-[inset_0_0_0_2px_#202b44] sm:mt-5 sm:p-2">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#f4d57e]">Progreso de recompensa</span><span className="text-[10px] font-black text-[#f4d57e]">{Math.round(rewardMeterScore)} / 1000 PTS</span></div><div className="mb-2 flex items-center gap-2 rounded-lg border border-[#52617f] bg-[#080f23]/90 p-2 sm:mb-3 sm:gap-4 sm:rounded-xl sm:p-3">
                  <div className={"relative h-12 w-12 shrink-0 transition-transform duration-300 sm:h-[76px] sm:w-[76px] " + (timeLeft <= 5 ? "animate-pulse" : "")} aria-label={`Reloj: quedan ${timeLeft} segundos`}>
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
                    <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-[#c5d1e8]">Tiempo restante</span><div className="flex items-center gap-2"><span className={"text-[10px] font-black " + (timeLeft <= 5 ? "text-rose-300" : "text-[#f4d57e]")}>{timeLeft <= 5 ? "¡RÁPIDO!" : "20 SEGUNDOS"}</span></div></div>
                    <p className={"mt-1 text-2xl font-black tabular-nums [font-family:var(--font-pixel),monospace] sm:text-3xl " + (timeLeft <= 5 ? "text-rose-300" : "text-amber-100")}>{String(timeLeft).padStart(2, "0")}</p>
                    {!gameStarted && !finished && <button type="button" onClick={() => { answeringRef.current = false; setSelected(null); setAnswering(false); setRevealed(false); setUsedHints([]); setVisibleHints({}); setGameError(null); timerDeadlineRef.current = null; setTimeLeft(QUESTION_SECONDS); startRoundTimer(); }} disabled={!gameSessionId || sessionLoading || startingGame} className="mt-2 min-h-10 border-[3px] border-[#ffe08a] bg-[#5a3c11] px-4 text-xs font-black text-white shadow-[3px_3px_0_#030713] disabled:opacity-50">{sessionLoading || !gameSessionId ? "PREPARANDO PARTIDA…" : startingGame ? "INICIANDO AUDIO…" : "▶ COMENZAR PARTIDA"}</button>}
                    <div className="mt-2 h-2 overflow-hidden border border-[#414d67] bg-[#252f47]"><div className={"h-full transition-[width] duration-300 " + (timeLeft <= 5 ? "bg-rose-400" : "bg-amber-300")} style={{ width: (timeLeft / QUESTION_SECONDS * 100) + "%" }}/></div>
                  </div>
                </div>
                <div className="relative flex h-8 items-center px-1"><div className="absolute left-1 right-1 top-1/2 h-3 -translate-y-1/2 border-2 border-[#7b8396] bg-[#171d2c]" /><div className="absolute left-1 top-1/2 h-3 -translate-y-1/2 border-y-2 border-[#fff0a6] bg-[#e8b936] transition-[width] duration-300" style={{ width: `${scoreProgress}%` }} /><div className="absolute inset-0 z-10">{Array.from({ length: 5 }, (_, i) => { const markerPosition = [0, 20, 50, 80, 100][i]; const chestIndex: 0 | 1 | 2 | null = i === 1 ? 0 : i === 2 ? 1 : i === 4 ? 2 : null; const isChest = chestIndex !== null; const chestNumber = chestIndex === null ? null : chestIndex + 1; const unlocked = chestIndex !== null && !cooldownActive && !sessionOutdated && chestNumber === nextChestToClaim && rewardMeterScore >= CHEST_THRESHOLDS[chestIndex]; return <div key={i} style={{ left: `${markerPosition}%` }} className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center border-2 ${isChest ? (unlocked ? "border-[#ffe08a] bg-[#4b3211]" : "border-[#566079] bg-[#101629]") : "border-[#8992a8] bg-[#182136]"} shadow-[2px_2px_0_#030713]`} title={chestIndex !== null ? (unlocked ? "Cofre disponible para reclamar" : `Cofre al alcanzar ${CHEST_THRESHOLDS[chestIndex]} puntos netos`) : `Hito ${i + 1}`} >{chestIndex !== null ? <button type="button" onClick={() => void claimChest(chestIndex + 1)} disabled={!unlocked || claimedChests.includes(chestIndex + 1) || claimingChest !== null || !gameSessionId || cooldownActive || sessionOutdated} aria-label={claimedChests.includes(chestIndex + 1) ? `Cofre ${chestIndex + 1} reclamado` : `Reclamar cofre ${chestIndex + 1}`} className="relative grid h-full w-full place-items-center disabled:cursor-not-allowed"><Image src="/images/games/poco-responda/cofre.png" alt="" width={24} height={24} className={`h-6 w-6 object-contain ${claimedChests.includes(chestIndex + 1) ? "opacity-40 grayscale" : unlocked ? "animate-pulse" : "grayscale opacity-45"}`} />{unlocked && !claimedChests.includes(chestIndex + 1) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" aria-label="Cofre disponible para reclamar" />}</button> : <span className="text-[10px] font-black text-[#c8d1e5] [font-family:var(--font-pixel),monospace]">{i === 0 || i === 3 ? "•" : ""}</span>}</div>; })}</div></div>
              </div>
            </header>
            {gameError && (
        <div role="alert" className="mb-3 flex flex-col gap-3 border-2 border-rose-400 bg-rose-950/60 p-3 text-xs font-bold text-rose-100 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 flex-1">{gameError}</p>
          {sessionOutdated && (
            <button type="button" onClick={restart} className="pixel-font min-h-10 shrink-0 border-2 border-[#ffe08a] bg-gradient-to-b from-[#986821] to-[#69440f] px-3 py-2 text-[8px] text-white shadow-[3px_3px_0_#030713] transition hover:from-[#b88435] hover:to-[#805817]">
              JUGAR OTRA VEZ ↻
            </button>
          )}
        </div>
      )}
            {!finished && <div className="mb-3 grid grid-cols-2 gap-2 xl:hidden">
              <button type="button" onClick={() => setMobileTools((value) => value === "chests" ? null : "chests")} aria-expanded={mobileTools === "chests"} className={`flex min-h-12 min-w-0 items-center gap-2 border-2 px-3 py-2 text-left shadow-[2px_2px_0_#030713] transition ${mobileTools === "chests" ? "border-[#ffe08a] bg-[#352711]" : "border-[#65583e] bg-[#111727]"}`}>
                <Image src="/images/games/poco-responda/cofre.png" alt="" width={34} height={28} className="h-7 w-8 shrink-0 object-contain"/>
                <span className="min-w-0 flex-1"><span className="block text-[10px] font-black text-[#ffe6a4]">Cofres</span><span className="block text-[9px] text-[#c9d3e6]">{claimedChests.length}/3 reclamados</span></span>
                <span className="text-lg font-bold text-[#f5d77c]">{mobileTools === "chests" ? "−" : "+"}</span>
              </button>
              <button type="button" onClick={() => setMobileTools((value) => value === "hints" ? null : "hints")} aria-expanded={mobileTools === "hints"} className={`flex min-h-12 min-w-0 items-center gap-2 border-2 px-3 py-2 text-left shadow-[2px_2px_0_#030713] transition ${mobileTools === "hints" ? "border-[#ffe08a] bg-[#352711]" : "border-[#65583e] bg-[#111727]"}`}>
                <Lightbulb className="h-5 w-5 shrink-0 text-[#ffe08a]"/>
                <span className="min-w-0 flex-1"><span className="block text-[10px] font-black text-[#ffe6a4]">Pistas</span><span className="block text-[9px] text-[#c9d3e6]">5 · 10 · 15 coins</span></span>
                <span className="text-lg font-bold text-[#f5d77c]">{mobileTools === "hints" ? "−" : "+"}</span>
              </button>
            </div>}
            {!finished && mobileTools === "chests" && <section className="mb-3 border-[3px] border-[#746e56] bg-[#0a1026]/[.98] p-3 shadow-[3px_3px_0_rgba(0,0,0,.4)] xl:hidden">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#f0d28a]">Progreso de cofres</p><p className="mt-1 text-xs leading-5 text-[#ffe5a0]">{chestMessage}</p></div><span className="shrink-0 text-xs font-black text-[#f4d57e]">{Math.round(rewardMeterScore)}/1000</span></div>
              {cooldownActive && <p role="timer" className="mt-2 border border-[#ffe08a] bg-[#211a2b] p-2 text-xs font-black text-[#ffe08a]">Recarga: {formatCooldown(cooldownRemainingMs)}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((chestNumber) => {
                  const chestIndex = chestNumber - 1;
                  const unlocked = !cooldownActive && !sessionOutdated && chestNumber === nextChestToClaim && rewardMeterScore >= CHEST_THRESHOLDS[chestIndex];
                  const claimed = claimedChests.includes(chestNumber);
                  return <button key={chestNumber} type="button" onClick={() => void claimChest(chestNumber)} disabled={!unlocked || claimed || claimingChest !== null || !gameSessionId || cooldownActive || sessionOutdated} aria-label={claimed ? `Cofre ${chestNumber} reclamado` : unlocked ? `Reclamar cofre ${chestNumber}` : `Cofre ${chestNumber}: necesita ${CHEST_THRESHOLDS[chestIndex]} puntos netos`} className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 border-2 px-1 py-2 text-center disabled:cursor-not-allowed ${claimed ? "border-[#596274] bg-[#141b2a] opacity-60" : unlocked ? "border-[#ffe08a] bg-[#49330f]" : "border-[#46516a] bg-[#111727] opacity-70"}`}>
                    <Image src="/images/games/poco-responda/cofre.png" alt="" width={34} height={28} className={`h-7 w-8 object-contain ${claimed ? "grayscale" : unlocked ? "" : "grayscale opacity-45"}`}/>
                    <span className="text-[9px] font-black text-[#f3e5c0]">{claimed ? "Reclamado" : unlocked ? "Reclamar" : `${CHEST_THRESHOLDS[chestIndex]} pts`}</span>
                  </button>;
                })}
              </div>
            </section>}
            {!finished && mobileTools === "hints" && <section className="mb-3 border-[3px] border-[#746e56] bg-[#0a1026]/[.98] p-3 shadow-[3px_3px_0_rgba(0,0,0,.4)] xl:hidden">
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#f0d28a]">Pistas de esta partida</p>
              <div className="mt-2 grid gap-2">
                {([1, 2, 3] as const).map((hintNumber) => {
                  const hintCost = HINT_COSTS[hintNumber - 1];
                  const isUsed = usedHints.includes(hintNumber);
                  const cannotAfford = wallet !== null && wallet.coins < hintCost;
                  const descriptions = ["Orientación para pensar el problema", "Categoría y tema que debes aplicar", "Revelar la respuesta correcta"];
                  return <button key={hintNumber} type="button" onClick={() => void handleUseHint(hintNumber)} disabled={isUsed || hintLoading || answering || revealed || !gameStarted || !gameSessionId || cannotAfford} className={`flex min-h-[52px] min-w-0 items-center gap-3 border-2 p-2.5 text-left transition ${isUsed ? "border-[#8b7757] bg-[#201c17] opacity-70" : "border-[#9a7740] bg-[#171522] hover:border-[#e8b75b] hover:bg-[#292116]"} disabled:cursor-not-allowed disabled:opacity-50`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#a77b35] bg-[#3a2812]"><Lightbulb className="h-5 w-5 text-[#ffe08a]"/></span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-black leading-5 text-[#fff0c6]">Pista {hintNumber} · {hintCost} Peak Coins</span><span className="block text-[10px] leading-4 text-[#c3cce0]">{isUsed ? "Ya utilizada" : hintLoading ? "Procesando compra…" : cannotAfford ? "Monedas insuficientes" : descriptions[hintNumber - 1]}</span></span>
                    <span className="text-[10px] font-black text-[#ffe08a]">{isUsed ? "✓" : ""}</span>
                  </button>;
                })}
              </div>
              <p className="mt-2 text-[9px] leading-4 text-[#aebbd0]">Cada pista se utiliza una sola vez por partida. Al iniciar otra partida, vuelven a estar disponibles.</p>
            </section>}
            {finished ? <div className="p-3 sm:p-7">
  <section className="relative mx-auto max-w-3xl overflow-hidden border-[4px] border-double border-[#b58b45] bg-[#0b101c] shadow-[6px_6px_0_#030713,0_0_0_2px_#292018]">
    <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20 h-3 w-3 border-r-2 border-b-2 border-[#ffe09a] bg-[#b58b45]"/><span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-20 h-3 w-3 border-l-2 border-b-2 border-[#ffe09a] bg-[#b58b45]"/><span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 z-20 h-3 w-3 border-r-2 border-t-2 border-[#ffe09a] bg-[#b58b45]"/><span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-20 h-3 w-3 border-l-2 border-t-2 border-[#ffe09a] bg-[#b58b45]"/>
    <div className="flex items-center gap-4 border-b-2 border-[#65502f] bg-gradient-to-r from-[#21180f] via-[#12131b] to-[#0b101c] p-5 sm:p-7">
      <div className="grid h-[76px] w-[76px] shrink-0 place-items-center border-[3px] border-[#c18b43] bg-[#2e2114] shadow-[3px_3px_0_#030713,inset_0_0_0_3px_#17120d]">
        <Image src="/dashboard/premio-pixel.webp" alt="Trofeo de PeakScore" width={96} height={96} className="h-[62px] w-[62px] object-contain"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="pixel-font text-[8px] leading-5 uppercase tracking-[.08em] text-[#dfa85e]">PARTIDA FINALIZADA · RONDA 10 DE 10</p>
        <h2 className="pixel-font mt-3 text-sm leading-[1.9] text-white sm:text-base">{correctCount >= 8 ? "¡Excelente partida!" : correctCount >= 5 ? "¡Vas por buen camino!" : correctCount >= 1 ? "¡Vamos por la revancha!" : "Cada intento te enseña algo"}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#d4c8ba]">{correctCount >= 8 ? "Tu esfuerzo se nota. Sigue así y ve por el siguiente desafío." : correctCount >= 5 ? "Ya tienes una base. Repasa lo que falló con Orby y vuelve a intentarlo." : correctCount >= 1 ? "Esta ronda estuvo difícil. Revisa tus errores con Orby y prueba otra vez." : "No te rindas. Revisa una pregunta con Orby y vuelve a intentarlo cuando estés listo."}</p>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3 p-5 sm:justify-start sm:p-6">
      <button type="button" onClick={restart} className="pixel-font inline-flex min-h-12 items-center gap-2 border-[3px] border-[#9ce5ae] bg-[#207543] px-5 py-3 text-[8px] leading-5 text-white shadow-[3px_3px_0_#102b1c] transition hover:bg-[#2c8d50] active:translate-y-0.5 active:shadow-none"><RotateCcw className="h-4 w-4"/> Volver a intentar</button>
      <Link href="/aprender/juegos" className="pixel-font inline-flex min-h-12 items-center gap-2 border-2 border-[#756b5c] bg-[#151923] px-5 py-3 text-[8px] leading-5 text-[#f0e4d3] transition hover:border-[#d29a55] hover:bg-[#242019]"><ArrowLeft className="h-4 w-4"/> Ver más juegos</Link>
    </div>
  </section>
</div> : question ? <div className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap gap-2"><span className="border-2 border-[#627d8d] bg-[#172b3a] px-3 py-1.5 text-[10px] font-black text-[#b8f3e7]">{question.subject}</span></div>
              <div className="relative border-[3px] border-[#7d879e] bg-[#111a31] p-3 shadow-[inset_0_0_0_2px_#29344e,inset_0_0_0_5px_#080e20,4px_4px_0_#030713] sm:border-[4px] sm:p-7 sm:shadow-[inset_0_0_0_3px_#29344e,inset_0_0_0_6px_#080e20,6px_6px_0_#030713]"><div className="absolute left-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute right-2 top-2 h-2 w-2 bg-[#b7c0d3]" /><div className="absolute bottom-2 left-2 h-2 w-2 bg-[#68738e]" /><div className="absolute bottom-2 right-2 h-2 w-2 bg-[#68738e]" /><div className="mb-4 flex h-10 w-10 items-center justify-center border-[3px] border-[#77829d] bg-[#252e49]"><CircleHelp className="h-5 w-5 text-[#f5d77c]" /></div><p className="break-words text-sm font-bold leading-6 text-white sm:text-lg sm:leading-8">{question.clue}</p>{([1, 2, 3] as const).filter((number) => Boolean(visibleHints[number])).map((number) => <p key={number} className="mt-3 border-[3px] border-[#89774c] bg-[#242032] p-3 text-sm leading-6 text-[#ffedb8]"><strong className="mr-2 text-[#ffe08a]">Pista {number}:</strong>{visibleHints[number]}</p>)}</div>
              {(!gameSessionId || sessionLoading) && <p role="status" className="mb-3 text-xs text-[#c7d5ee]">{sessionLoading ? "Preparando partida segura…" : "Conectando con el servidor…"}</p>}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = optionIndex === (serverCorrectOption ?? question.answer); const stateClass = !revealed ? "border-[#69748d] bg-[#111a31] hover:border-[#d8c16b] hover:bg-[#222a40]" : isCorrect ? "border-[#8bc79a] bg-[#193b32]" : isSelected ? "border-[#d58a91] bg-[#3b202d]" : "border-[#3c4762] bg-[#0b1226] opacity-75"; return <button key={option} type="button" onClick={() => void chooseOption(optionIndex)} disabled={!gameStarted || revealed || answering || hintLoading || !gameSessionId} aria-pressed={isSelected} className={`relative flex min-h-[58px] min-w-0 items-center gap-2 border-[3px] p-3 text-left text-sm font-bold leading-6 shadow-[3px_3px_0_#030713] transition sm:min-h-[66px] sm:gap-3 sm:p-4 sm:shadow-[4px_4px_0_#030713] ${!revealed && isSelected ? "border-[#f5d77c] bg-[#34304a] ring-2 ring-[#f5d77c]/70" : stateClass}`}><span className="absolute left-1 top-1 h-1.5 w-1.5 bg-[#aeb8ce]" /><span className="flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-[#69738c] bg-[#080e20] text-xs font-black text-[#f5d77c] [font-family:var(--font-pixel),monospace]">{String.fromCharCode(65 + optionIndex)}</span><span className="min-w-0 flex-1 break-words">{option}</span>{revealed && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#a5e6b1]" />}{revealed && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 shrink-0 text-[#ff9aa5]" />}</button>; })}</div>
              {revealed && <div role="status" aria-live="polite" className={`mt-4 border-[3px] p-4 ${answeredCorrectly ? "border-[#80bd8d] bg-[#14352c]" : "border-[#ca858d] bg-[#351d2a]"}`}><p className="text-sm font-black">{selected === null ? "¡Se acabó el tiempo!" : answeredCorrectly ? "¡Correcto, bien hecho!" : "Esta vez no fue. ¡Aprendamos!"}</p><p className="mt-2 text-sm leading-6 text-white/85">{question.explanation}</p>{!answeredCorrectly && <p className="mt-3 text-xs font-black text-rose-200">Penalización: −{WRONG_ANSWER_PENALTY} puntos. Esta pregunta ya no se puede repetir.</p>}</div>}
              <div className="mt-4 flex flex-col items-stretch gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-[10px] font-semibold text-[#b5bfd5]"><Clock3 className="h-4 w-4" /> Responde antes de que se agote el tiempo</p><button type="button" onClick={handleNext} disabled={!revealed || answering || hintLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 border-[3px] border-[#a5d79a] bg-[#287b42] px-4 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] transition hover:bg-[#32984f] sm:w-auto sm:px-5 active:translate-y-0.5 active:shadow-[2px_2px_0_#102b1c] disabled:cursor-not-allowed disabled:border-[#424b60] disabled:bg-[#222a3b] disabled:text-[#7c8497] disabled:shadow-none">{index + 1 === TOTAL_ROUNDS ? "Completar desafío" : selected === null && revealed ? "Siguiente pregunta" : !answeredCorrectly ? "Reintentar · otra pregunta" : "Siguiente"} <ArrowRight className="h-4 w-4" /></button></div>
            </div> : null}
            {finished && <section className="mt-3 border-[3px] border-[#9b642f] bg-[#0b101c] p-3 shadow-[3px_3px_0_rgba(0,0,0,.4)] xl:hidden">
              <div className="flex items-center gap-3"><Image src="/avatars/photo_perfil/orbyp.png" width={48} height={48} alt="Orby" className="h-12 w-12 shrink-0 rounded-full border-2 border-[#e99a43] bg-[#2b190d] object-contain"/><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#f1ad5c]">ORBY · TUTOR CON IA</p><p className="mt-1 text-xs leading-5 text-[#e8d8c6]">{incorrectAnswers.length ? `${incorrectAnswers.length} preguntas para repasar` : "Repasa un concepto o resuelve una duda."}</p></div></div>
              <button type="button" onClick={() => setOrbyReviewOpen(true)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border-2 border-[#ffc078] bg-gradient-to-b from-[#e48a35] to-[#a95218] px-4 py-3 text-xs font-black text-[#fff8ed] shadow-[0_3px_0_#66300f]"><Image src="/avatars/photo_perfil/orbyp.png" alt="" width={24} height={24} className="h-6 w-6 rounded-full border border-[#ffd095] object-contain"/>{incorrectAnswers.length ? "Preguntar a Orby" : "Abrir chat con Orby"}</button>
            </section>}
          </section>
          <aside className="hidden gap-4 xl:grid"><section className="border-[3px] border-[#746e88] bg-[#0a1026]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.45)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f0d28a]">Recompensa de la ronda</p><h2 className="mt-2 text-base font-black">El cofre misterioso</h2><div className={"relative mx-auto my-3 grid h-36 place-items-center " + (hasUnclaimedChest ? "chest-unlock-pulse" : "")}><div className="absolute inset-x-8 inset-y-3 rounded-full bg-amber-300/20 blur-xl" aria-hidden="true"/><Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className="chest-idle-float relative z-10 h-32 w-full object-contain drop-shadow-[0_5px_0_rgba(0,0,0,.5)]"/>{hasUnclaimedChest && <span className="absolute bottom-0 z-20 border-2 border-[#ffe28b] bg-[#261d35] px-3 py-1 text-[10px] font-black text-[#ffe28b] shadow-[0_0_18px_rgba(255,214,92,.6)]">¡RECLÁMALO ARRIBA!</span>}</div><div className="grid grid-cols-3 gap-2" aria-label="Estado de los cofres">{Array.from({ length: 3 }, (_, i) => { const number = i + 1; const unlocked = !cooldownActive && !sessionOutdated && number === nextChestToClaim && rewardMeterScore >= CHEST_THRESHOLDS[i]; const claimed = claimedChests.includes(number); return <div key={number} title={claimed ? "Cofre reclamado" : unlocked ? "Disponible en la barra superior" : `Necesitas ${CHEST_THRESHOLDS[i]} puntos netos`} className={`flex min-h-10 items-center justify-center border-[3px] ${claimed ? "border-[#7f8798] bg-[#22283a] opacity-60" : unlocked ? "border-[#ffe08a] bg-[#5a3c11]" : "border-[#566079] bg-[#151b2d] opacity-65"}`}><Image src="/images/games/poco-responda/cofre.png" alt={`Cofre ${number}`} width={34} height={28} className={`h-7 w-9 object-contain ${claimed ? "grayscale" : unlocked ? "" : "grayscale opacity-45"}`}/></div>; })}</div><p className="mt-3 text-xs font-black leading-5 text-[#ffe5a0]">{chestMessage}</p>{cooldownActive && <p role="timer" className="mt-2 border-2 border-[#ffe08a] bg-[#211a2b] p-2 text-xs font-black text-[#ffe08a]">Cofres en recarga: {formatCooldown(cooldownRemainingMs)}</p>}<p className="mt-2 text-[10px] leading-5 text-[#9da8c5]">Reclama los cofres en orden. Después de completar el conjunto, la barra queda congelada una hora. Puedes seguir jugando, pero sin premios durante la recarga.</p></section>{finished ? <section className="overflow-hidden border-[3px] border-[#9b642f] bg-[#0b101c] shadow-[5px_5px_0_rgba(0,0,0,.4)]">
  <div className="flex items-center gap-3 border-b border-[#704720] bg-gradient-to-r from-[#38220f] to-[#15121a] p-4">
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#e99a43] bg-[#2b190d] shadow-[0_0_0_3px_rgba(249,115,22,.1)]">
      <Image src="/avatars/photo_perfil/orbyp.png" width={1200} height={800} alt="Orby, tutor con IA" className="h-full w-full object-contain object-center"/>
    </div>
    <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#f1ad5c]">ORBY · TUTOR CON IA</p><h2 className="mt-1 text-base font-black text-white">¿Revisamos tus errores?</h2><p className="mt-1 text-[10px] leading-4 text-[#d8c7b4]">{incorrectAnswers.length ? `${incorrectAnswers.length} preguntas para repasar` : "Practica y aclara tus dudas"}</p></div>
  </div>
  <div className="p-4">
    <p className="text-xs leading-5 text-[#d5c7b8]">{incorrectAnswers.length ? "Abre el chat de Orby y elige en el cuaderno la pregunta que quieres entender. Él te explica el razonamiento paso a paso." : "No registraste errores en esta ronda. Puedes abrir el chat para resolver una duda o practicar un concepto."}</p>
    <button type="button" onClick={() => setOrbyReviewOpen(true)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 border-2 border-[#ffc078] bg-gradient-to-b from-[#e48a35] to-[#a95218] px-4 py-3 text-xs font-black text-[#fff8ed] shadow-[0_3px_0_#66300f] transition hover:from-[#f0a04b] hover:to-[#bd631f] active:translate-y-0.5 active:shadow-none">
      <Image src="/avatars/photo_perfil/orbyp.png" alt="" width={26} height={26} className="h-6 w-6 rounded-full border border-[#ffd095] bg-[#38210d] object-contain"/>
      {incorrectAnswers.length ? "Preguntar a Orby" : "Abrir chat con Orby"}
    </button>
  </div>
</section> : <section className="border-[3px] border-[#5e6d8c] bg-[#081027]/[.98] p-4 shadow-[5px_5px_0_rgba(0,0,0,.4)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8c8e9]">Pistas</p><div className="mt-3 grid gap-2">{([1, 2, 3] as const).map((hintNumber) => {
  const hintCost = HINT_COSTS[hintNumber - 1];
  const isUsed = usedHints.includes(hintNumber);
  const cannotAfford = wallet !== null && wallet.coins < hintCost;
  const descriptions = ["Orientación para pensar el problema", "Categoría y tema que debes aplicar", "Revelar la respuesta correcta"];
  return <button key={hintNumber} type="button" onClick={() => void handleUseHint(hintNumber)}
    disabled={isUsed || hintLoading || answering || revealed || !gameStarted || !gameSessionId || cannotAfford}
    className={`flex items-center gap-3 border-[3px] p-3 text-left transition ${isUsed ? "border-[#8b7757] bg-[#201c17] opacity-70" : "border-[#9a7740] bg-[#171522] hover:border-[#e8b75b] hover:bg-[#292116]"} disabled:cursor-not-allowed disabled:opacity-50`}>
    <span className="grid h-9 w-9 shrink-0 place-items-center border-[3px] border-[#a77b35] bg-[#3a2812]"><Lightbulb className="h-5 w-5 text-[#ffe08a]"/></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#fff0c6]">Pista {hintNumber} · {hintCost} Peak Coins</span><span className="block text-xs text-[#c3cce0]">{isUsed ? "Ya utilizada en esta partida" : hintLoading ? "Procesando compra…" : cannotAfford ? "No tienes monedas suficientes" : descriptions[hintNumber - 1]}</span></span>
    <span className="text-[10px] font-black text-[#ffe08a]">{isUsed ? "✓" : ""}</span>
  </button>;
})}</div><p className="mt-3 text-[10px] leading-5 text-[#c0b3d6]">Cada tipo de pista se puede usar una vez por partida: 5, 10 y 15 Peak Coins. Al iniciar otra partida, las tres vuelven a estar disponibles.</p></section>}</aside>
        </div>
        <LessonAITutor
          reviewQuestions={incorrectAnswers.map((item) => ({
            id: item.question.id,
            number: item.questionNumber,
            subject: item.question.subject,
            topic: item.question.topic,
            prompt: item.question.clue,
            options: item.question.options,
            userAnswer: item.selectedOption === null ? "No alcanzó a responder; se agotó el tiempo." : item.question.options[item.selectedOption] ?? "Respuesta seleccionada",
            correctAnswer: item.question.options[item.correctOption] ?? item.question.options[item.question.answer] ?? "Respuesta correcta",
            explanation: item.question.explanation,
          }))}
          open={orbyReviewOpen}
          onOpenChange={setOrbyReviewOpen}
          accent="orby"
          stage="practice"
          subject="Saber 11"
          topic="Tutor de estudio PeakScore"
          question=""
          context=""
        />
      </div>
    </main>
  );
}

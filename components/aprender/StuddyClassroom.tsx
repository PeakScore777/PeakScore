"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp, BookOpen, CircleHelp, Ellipsis, Keyboard, LoaderCircle,
  LogOut, Menu, MessageSquare, Mic, Pause, Play, Printer, RotateCcw, Send,
  SlidersHorizontal, Square, Volume2, VolumeX, X,
} from "lucide-react";
import OrbyBoard from "@/components/aprender/OrbyBoard";
import type { OrbyBoard as OrbyBoardData } from "@/lib/ai/orby-board";

type Subject =
  | "Matemáticas"
  | "Lectura Crítica"
  | "Sociales y Ciudadanas"
  | "Ciencias Naturales"
  | "Inglés";
type Intent = "topic" | "exam" | "task";
type Turn = { role: "user" | "assistant"; content: string };
type TeachingStage = { speech: string; board: OrbyBoardData | null };

const SUBJECTS: Subject[] = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
];

function encodeWav(audio: AudioBuffer): Blob {
  const targetRate = 16_000;
  const source = audio.getChannelData(0);
  const ratio = audio.sampleRate / targetRate;
  const length = Math.floor(source.length / ratio);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * 2, true);
  for (let index = 0; index < length; index += 1) {
    const sample = Math.max(-1, Math.min(1, source[Math.floor(index * ratio)] ?? 0));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function convertToWav(blob: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(decoded);
  } finally {
    await context.close().catch(() => undefined);
  }
}

export default function StuddyClassroom() {
  const [subject, setSubject] = useState<Subject>("Ciencias Naturales");
  const [topicDraft, setTopicDraft] = useState("");
  const [intent, setIntent] = useState<Intent>("topic");
  const [active, setActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [board, setBoard] = useState<OrbyBoardData | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [caption, setCaption] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [finishConfirm, setFinishConfirm] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.94);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Tu aula está lista.");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [showAudioConsent, setShowAudioConsent] = useState(false);
  const [audioConsent, setAudioConsent] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const shouldSubmitRecordingRef = useRef(false);
  const boardRef = useRef<OrbyBoardData | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const topicRef = useRef("");
  const speechTextRef = useRef("");
  const speechGenerationRef = useRef(0);
  const pendingSpeechResolveRef = useRef<((completed: boolean) => void) | null>(null);
  const turnRequestGenerationRef = useRef(0);
  const silentStageTimerRef = useRef<number | null>(null);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { turnsRef.current = turns; }, [turns]);
  useEffect(() => { topicRef.current = topic; }, [topic]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (autoStopRef.current !== null) window.clearTimeout(autoStopRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const interruptSpeech = useCallback(() => {
    speechGenerationRef.current += 1;
    window.speechSynthesis?.cancel();
    if (silentStageTimerRef.current !== null) {
      window.clearTimeout(silentStageTimerRef.current);
      silentStageTimerRef.current = null;
    }
    const resolve = pendingSpeechResolveRef.current;
    pendingSpeechResolveRef.current = null;
    resolve?.(false);
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback((text: string, generation: number): Promise<boolean> => new Promise((resolve) => {
    let settled = false;
    const finish = (completed: boolean) => {
      if (settled) return;
      settled = true;
      if (pendingSpeechResolveRef.current === finish) pendingSpeechResolveRef.current = null;
      if (silentStageTimerRef.current !== null) {
        window.clearTimeout(silentStageTimerRef.current);
        silentStageTimerRef.current = null;
      }
      resolve(completed && generation === speechGenerationRef.current);
    };
    speechTextRef.current = text;
    const words = text.trim().split(/\\s+/).filter(Boolean);
    setCaption(words.slice(0, 10).join(" "));
    if (generation !== speechGenerationRef.current) {
      finish(false);
      return;
    }
    if (muted || !("speechSynthesis" in window) || !text.trim()) {
      setSpeaking(false);
      setStatus("Etapa visible en la pizarra y los subtítulos.");
      pendingSpeechResolveRef.current = finish;
      silentStageTimerRef.current = window.setTimeout(() => finish(true), Math.max(1_500, Math.min(2_700, words.length * 115)));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-CO";
    utterance.rate = voiceRate;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((voice) => voice.lang.toLowerCase() === "es-co")
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es-mx"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;
    pendingSpeechResolveRef.current = finish;
    setSpeaking(true);
    setPaused(false);
    utterance.onstart = () => setStatus("Orby está explicando y escribiendo esta etapa.");
    utterance.onboundary = (event) => {
      if (typeof event.charIndex !== "number") return;
      const spokenWords = text.slice(0, Math.max(0, event.charIndex)).trim().split(/\\s+/).filter(Boolean).length;
      setCaption(words.slice(Math.max(0, spokenWords - 1), spokenWords + 9).join(" "));
    };
    utterance.onend = () => {
      if (generation !== speechGenerationRef.current) return finish(false);
      setSpeaking(false);
      setPaused(false);
      setCaption(words.slice(-10).join(" "));
      setStatus("Etapa completada. Orby continúa con la siguiente idea.");
      finish(true);
    };
    utterance.onerror = () => {
      if (generation !== speechGenerationRef.current) return finish(false);
      setSpeaking(false);
      setPaused(false);
      setCaption(words.slice(0, 10).join(" "));
      setStatus("La voz del navegador no está disponible; la etapa sigue en los subtítulos.");
      window.setTimeout(() => finish(true), 1_100);
    };
    window.speechSynthesis.speak(utterance);
  }), [muted, voiceRate]);

  const playStages = useCallback(async (stages: TeachingStage[]) => {
    const generation = ++speechGenerationRef.current;
    const completed: string[] = [];
    for (let index = 0; index < stages.length; index += 1) {
      if (generation !== speechGenerationRef.current) break;
      const stage = stages[index];
      if (stage.board) {
        setSpeaking(true);
        setBoard(stage.board);
        boardRef.current = stage.board;
      }
      setCaption(stage.speech);
      setStatus("Etapa " + (index + 1) + " de " + stages.length + " · Orby está enseñando.");
      setTurns((current) => [...current, { role: "assistant", content: stage.speech }].slice(-24));
      const didComplete = await speak(stage.speech, generation);
      if (!didComplete) break;
      completed.push(stage.speech);
      if (index < stages.length - 1) {
        await new Promise<void>((resolve) => {
          silentStageTimerRef.current = window.setTimeout(() => {
            silentStageTimerRef.current = null;
            resolve();
          }, 260);
        });
      }
    }
    if (generation === speechGenerationRef.current) {
      setSpeaking(false);
      setPaused(false);
      setStatus(completed.length === stages.length
        ? "Orby terminó esta explicación. Responde su pregunta o pide que profundice."
        : "Puedes intervenir para continuar la clase.");
    }
    return completed;
  }, [speak]);

  const sendTurn = useCallback(async (studentMessage: string, audio?: Blob) => {
    if (busy || !topicRef.current) return;
    const requestGeneration = ++turnRequestGenerationRef.current;
    interruptSpeech();
    setBusy(true);
    setError("");
    setStatus(audio ? "Transcribiendo tu intervención…" : "Preparando la siguiente parte de la clase…");
    try {
      let response: Response;
      if (audio) {
        const wav = await convertToWav(audio);
        if (wav.size > 2 * 1024 * 1024) throw new Error("El audio convertido supera el límite de 2 MB.");
        const form = new FormData();
        form.append("audio", new File([wav], "orby-class.wav", { type: "audio/wav" }));
        form.append("subject", subject);
        form.append("topic", topicRef.current);
        form.append("intent", intent);
        form.append("board", JSON.stringify(boardRef.current));
        form.append("history", JSON.stringify(turnsRef.current.slice(-6)));
        response = await fetch("/api/orby/studdy-class", {
          method: "POST",
          credentials: "same-origin",
          body: form,
        });
      } else {
        response = await fetch("/api/orby/studdy-class", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            topic: topicRef.current,
            intent,
            message: studentMessage,
            board: boardRef.current,
            history: turnsRef.current.slice(-6),
          }),
        });
      }
      const payload = await response.json().catch(() => ({}));
      if (requestGeneration !== turnRequestGenerationRef.current) return;
      const rawStages = Array.isArray(payload.stages) ? payload.stages : [];
      const stages = rawStages.flatMap((entry: unknown) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const stage = entry as Record<string, unknown>;
        if (typeof stage.speech !== "string" || !stage.speech.trim()) return [];
        return [{
          speech: stage.speech.trim(),
          board: stage.board && typeof stage.board === "object" ? stage.board as OrbyBoardData : null,
        }];
      });
      if (!response.ok || !stages.length) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Orby no pudo preparar la secuencia de enseñanza.");
      }
      const actualStudentMessage = typeof payload.transcript === "string" && payload.transcript.trim()
        ? payload.transcript.trim()
        : studentMessage;
      if (actualStudentMessage) {
        setTurns((current) => [...current, { role: "user", content: actualStudentMessage }].slice(-24));
      }
      setBusy(false);
      setStatus("La pizarra se construye al ritmo de la explicación.");
      await playStages(stages);
    } catch (caught) {
      if (requestGeneration === turnRequestGenerationRef.current) {
        setError(caught instanceof Error ? caught.message : "No se pudo completar esta etapa.");
        setStatus("La clase permanece abierta. Puedes volver a intentarlo.");
      }
    } finally {
      if (requestGeneration === turnRequestGenerationRef.current) setBusy(false);
    }
  }, [busy, intent, interruptSpeech, playStages, subject]);

  async function beginClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTopic = topicDraft.trim();
    if (!nextTopic || busy) return;
    setError("");
    setStatus("Comprobando la disponibilidad gratuita de la clase…");
    try {
      const preflight = await fetch("/api/orby/studdy-class", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await preflight.json().catch(() => ({}));
      if (!preflight.ok || payload.available !== true) {
        throw new Error(typeof payload.error === "string" ? payload.error : "La clase gratuita no está disponible en este momento.");
      }
      setVoiceAvailable(true);
      setTopic(nextTopic);
      topicRef.current = nextTopic;
      setBoard(null);
      boardRef.current = null;
      setTurns([]);
      turnsRef.current = [];
      setActive(true);
      setStatus("Abriendo la pizarra y preparando el primer concepto…");
      window.setTimeout(() => {
        void sendTurn("Comienza la clase: presenta la idea central del tema y construye la primera etapa visual.");
      }, 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo comprobar la disponibilidad.");
      setStatus("No se inició ninguna sesión.");
    }
  }

  function togglePlayback() {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      setStatus("Clase pausada.");
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setStatus("La clase continúa.");
    } else if (speechTextRef.current) {
      const generation = ++speechGenerationRef.current;
      void speak(speechTextRef.current, generation);
    }
  }

  function toggleMute() {
    if (muted) {
      setMuted(false);
      return;
    }
    interruptSpeech();
    setMuted(true);
  }

  function startRecording() {
    if (busy || recording) return;
    if (!voiceAvailable) {
      setError("Primero inicia la clase y comprueba que la cuota gratuita esté disponible.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Puedes intervenir por escrito.");
      return;
    }
    void navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    }).then((stream) => {
      streamRef.current = stream;
      chunksRef.current = [];
      shouldSubmitRecordingRef.current = true;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        if (autoStopRef.current !== null) window.clearTimeout(autoStopRef.current);
        if (shouldSubmitRecordingRef.current) {
          shouldSubmitRecordingRef.current = false;
          void sendTurn("", blob);
        }
      };
      recorder.start(250);
      interruptSpeech();
      setRecording(true);
      setRecordingSeconds(0);
      setStatus("Te escucho. Habla con claridad y detén el micrófono al terminar.");
      timerRef.current = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
      autoStopRef.current = window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 45_000);
    }).catch(() => {
      setError("No se pudo activar el micrófono. Revisa el permiso del navegador o continúa por escrito.");
    });
  }

  function requestRecording() {
    if (!audioConsent) {
      setShowAudioConsent(true);
      return;
    }
    startRecording();
  }

  function confirmAudioConsent() {
    setAudioConsent(true);
    setShowAudioConsent(false);
    startRecording();
  }

  function stopRecording() {
    shouldSubmitRecordingRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function cancelRecording() {
    shouldSubmitRecordingRef.current = false;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
    }
  }

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = message.trim();
    if (!value || busy || recording) return;
    setMessage("");
    setComposerOpen(false);
    void sendTurn(value);
  }

  function restartLesson() {
    interruptSpeech();
    setMenuOpen(false);
    setBoard(null);
    boardRef.current = null;
    setTurns([]);
    turnsRef.current = [];
    setCaption("");
    void sendTurn("Reiniciemos la clase desde los fundamentos. Enséñame el tema paso a paso, dibujando la idea central y comprueba mi comprensión al final.");
  }

  function finishClass() {
    turnRequestGenerationRef.current += 1;
    setBusy(false);
    interruptSpeech();
    cancelRecording();
    setActive(false);
    setBoard(null);
    boardRef.current = null;
    setTurns([]);
    turnsRef.current = [];
    setCaption("");
    setDrawerOpen(false);
    setShowAudioConsent(false);
    setAudioConsent(false);
    setComposerOpen(false);
    setMenuOpen(false);
    setFinishConfirm(false);
    setError("");
    setStatus("Tu aula está lista.");
  }

  return (
    <main className="studdy-classroom fixed inset-0 z-[2147483647] h-[100dvh] w-screen overflow-hidden bg-white text-slate-900">
      {!active ? (
        <section className="studdy-launcher flex min-h-0 h-full items-center justify-center overflow-y-auto px-5 py-10">
          <div className="w-full max-w-2xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img src="/avatars/orby.webp" alt="Orby" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">PeakScore · Aula visual</p>
                <p className="text-sm font-semibold text-slate-700">Orby · profesor de Saber 11</p>
              </div>
            </div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">¿Qué vamos a estudiar hoy?</h1>
            <p className="mb-8 max-w-xl text-sm leading-6 text-slate-500">Elige un tema y una meta. Orby te lo explicará paso a paso, dibujará las ideas y te hará preguntas para comprobar lo que vas entendiendo.</p>
            <form onSubmit={beginClass} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Área Saber 11</span>
                <select value={subject} onChange={(event) => setSubject(event.target.value as Subject)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100">
                  {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Tema de la clase</span>
                <input value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} maxLength={160} required placeholder="Ej. Mitosis, funciones cuadráticas, Revolución francesa…" className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
              </label>
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Objetivo de la clase</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {([
                    ["topic", "Comprender el tema"],
                    ["exam", "Prepararme para Saber 11"],
                    ["task", "Resolver una tarea"],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIntent(value)} aria-pressed={intent === value} className={"rounded-xl border px-3 py-3 text-xs font-semibold transition " + (intent === value ? "border-slate-400 bg-slate-100 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{label}</button>
                  ))}
                </div>
              </div>
              {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <button type="submit" disabled={!topicDraft.trim() || busy} className="studdy-primary-button flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                Comenzar clase
              </button>
            </form>
            <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">La voz y la transcripción utilizan únicamente la cuota gratuita confirmada. Si se agota, la clase se detiene sin cambiar a un servicio de pago.</p>
          </div>
        </section>
      ) : (
        <>
          <button type="button" aria-label="Abrir panel lateral de clase" onClick={() => setDrawerOpen(true)} className="studdy-top-left-control">
            <Menu className="h-4 w-4" />
          </button>
          <div className="studdy-top-right-controls">
            <button type="button" aria-label="Menú de la clase" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="studdy-top-control">
              <Ellipsis className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Imprimir o guardar la pizarra" onClick={() => window.print()} className="studdy-top-control">
              <Printer className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Finalizar clase" onClick={() => setFinishConfirm(true)} className="studdy-top-control">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {menuOpen ? (
            <div className="studdy-class-menu" role="menu" aria-label="Opciones de clase">
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-[11px] font-semibold">Velocidad de la voz</span>
                <span className="ml-auto text-[11px] tabular-nums">{voiceRate.toFixed(2)}×</span>
              </div>
              <input aria-label="Velocidad de la voz" type="range" min="0.75" max="1.2" step="0.05" value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} className="studdy-speed-slider mb-4 w-full" />
              <button type="button" role="menuitem" onClick={() => setCaptions((value) => !value)} className="studdy-menu-item">
                <MessageSquare className="h-4 w-4" /> {captions ? "Ocultar subtítulos" : "Mostrar subtítulos"}
              </button>
              <button type="button" role="menuitem" onClick={restartLesson} className="studdy-menu-item">
                <RotateCcw className="h-4 w-4" /> Reiniciar lección
              </button>
              <button type="button" role="menuitem" onClick={() => { setDrawerOpen(true); setMenuOpen(false); }} className="studdy-menu-item">
                <MessageSquare className="h-4 w-4" /> Comentarios y transcripción
              </button>
              <button type="button" role="menuitem" onClick={() => { setInstructionsOpen(true); setMenuOpen(false); }} className="studdy-menu-item">
                <CircleHelp className="h-4 w-4" /> Instrucciones
              </button>
              <div className="my-2 border-t border-slate-100" />
              <button type="button" role="menuitem" onClick={() => { setFinishConfirm(true); setMenuOpen(false); }} className="studdy-menu-item text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> Fin de la lección
              </button>
            </div>
          ) : null}

          <section className="studdy-board-stage absolute inset-0 overflow-y-auto bg-white">
            {board ? (
              <OrbyBoard board={board} drawingActive={speaking && !paused} showTitle />
            ) : (
              <div className="flex min-h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Orby está preparando la primera explicación…</p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">La hoja se irá construyendo a medida que avance la clase.</p>
              </div>
            )}
          </section>

          {drawerOpen ? (
            <>
              <button type="button" aria-label="Cerrar transcripción" onClick={() => setDrawerOpen(false)} className="studdy-drawer-backdrop" />
              <aside className="studdy-transcript-drawer" aria-label="Transcripción de la clase">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Transcripción</p>
                    <p className="mt-1 text-[10px] text-slate-400">Tu conversación con Orby</p>
                  </div>
                  <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Cerrar panel" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {turns.length ? turns.map((turn, index) => (
                    <article key={index} className="studdy-transcript-turn">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">{turn.role === "assistant" ? "Orby · profesor" : "Tú"}</p>
                      <p className="whitespace-pre-wrap text-[12px] leading-[1.65] text-slate-700">{turn.content}</p>
                    </article>
                  )) : <p className="text-xs text-slate-400">La transcripción aparecerá durante la clase.</p>}
                </div>
                <form onSubmit={submitText} className="border-t border-slate-100 px-3 py-3">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-3 pr-1">
                    <input value={message} onChange={(event) => setMessage(event.target.value)} disabled={busy || recording} placeholder="Escribe una pregunta…" className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
                    <button type="submit" disabled={!message.trim() || busy || recording} aria-label="Enviar pregunta" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white disabled:opacity-40"><Send className="h-3.5 w-3.5" /></button>
                  </div>
                </form>
              </aside>
            </>
          ) : null}

          {captions && caption ? (
            <div aria-live="polite" aria-label="Subtítulos de Orby" className="studdy-live-caption">
              <p>{caption}</p>
            </div>
          ) : null}

          {composerOpen ? (
            <form onSubmit={submitText} className="studdy-floating-composer">
              <input autoFocus value={message} onChange={(event) => setMessage(event.target.value)} disabled={busy || recording} placeholder="Haz una pregunta a Orby…" className="min-w-0 flex-1 bg-transparent px-1 text-xs outline-none placeholder:text-slate-400 sm:text-sm" />
              <button type="submit" disabled={!message.trim() || busy || recording} aria-label="Enviar pregunta" className="studdy-send-button"><ArrowUp className="h-4 w-4" /></button>
            </form>
          ) : null}

          <footer className="studdy-class-controls">
            <div className="studdy-controls-left">
              <img src="/avatars/orby.webp" alt="Orby" className={"studdy-orby-avatar " + (speaking && !paused ? "is-speaking" : "")} />
              <button type="button" aria-label="Abrir transcripción" onClick={() => setDrawerOpen((value) => !value)} className="studdy-call-control">
                <BookOpen className="h-4 w-4" />
              </button>
              <button type="button" aria-label={paused ? "Reanudar clase" : "Pausar clase"} onClick={togglePlayback} className="studdy-call-control">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button type="button" aria-label={muted ? "Activar voz" : "Silenciar voz"} onClick={toggleMute} className="studdy-call-control">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
            <div className="studdy-controls-right">
              <button type="button" aria-label={composerOpen ? "Cerrar teclado" : "Escribir pregunta"} aria-expanded={composerOpen} onClick={() => setComposerOpen((value) => !value)} className="studdy-call-control">
                <Keyboard className="h-4 w-4" />
              </button>
              <button type="button" onClick={recording ? stopRecording : requestRecording} disabled={busy} aria-label={recording ? "Finalizar grabación" : "Hablar con Orby"} className={"studdy-mic-control " + (recording ? "is-recording" : "")}>
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          </footer>
          {recording ? <div className="studdy-recording-indicator">Escuchando · {recordingSeconds}s / 45s</div> : null}

          {showAudioConsent ? (
            <div className="studdy-dialog-backdrop">
              <section role="dialog" aria-modal="true" aria-labelledby="orby-audio-consent-title" className="studdy-dialog">
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Privacidad del micrófono</p>
                <h2 id="orby-audio-consent-title" className="mt-2 text-lg font-semibold text-slate-900">¿Permites procesar tu voz?</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Tu intervención se grabará durante un máximo de 45 segundos y se enviará a Cloudflare Workers AI para transcribirla. La explicación se genera con la misma cuota gratuita confirmada. Si se agota la cuota, la clase se detiene y no se cambia a un servicio de pago.</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAudioConsent(false)} className="studdy-dialog-secondary">Cancelar</button>
                  <button type="button" onClick={confirmAudioConsent} className="studdy-dialog-primary">Entiendo, usar micrófono</button>
                </div>
              </section>
            </div>
          ) : null}

          {finishConfirm ? (
            <div className="studdy-dialog-backdrop">
              <section role="dialog" aria-modal="true" aria-labelledby="orby-finish-title" className="studdy-dialog">
                <button type="button" aria-label="Cerrar confirmación" onClick={() => setFinishConfirm(false)} className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                <h2 id="orby-finish-title" className="pr-8 text-lg font-semibold text-slate-900">¿De verdad quieres terminar la lección?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Se cerrará esta clase. Podrás iniciar otra cuando quieras.</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setFinishConfirm(false)} className="studdy-dialog-secondary">Continuar</button>
                  <button type="button" onClick={() => { setFinishConfirm(false); finishClass(); }} className="studdy-dialog-danger">Fin de la lección</button>
                </div>
              </section>
            </div>
          ) : null}

          {instructionsOpen ? (
            <div className="studdy-dialog-backdrop" onClick={() => setInstructionsOpen(false)}>
              <section role="dialog" aria-modal="true" aria-labelledby="orby-help-title" onClick={(event) => event.stopPropagation()} className="studdy-dialog">
                <button type="button" aria-label="Cerrar instrucciones" onClick={() => setInstructionsOpen(false)} className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                <h2 id="orby-help-title" className="pr-8 text-lg font-semibold text-slate-900">Cómo aprender con Orby</h2>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Orby explica el tema en pequeñas etapas y las va dibujando sobre una misma hoja.</p>
                  <p>Interrúmpelo cuando quieras con el micrófono o el teclado. La pizarra conserva lo que ya escribieron.</p>
                  <p>Al final de una explicación, responde la pregunta de comprobación para continuar al siguiente paso.</p>
                </div>
                <div className="mt-5 flex justify-end"><button type="button" onClick={() => setInstructionsOpen(false)} className="studdy-dialog-primary">Entendido</button></div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

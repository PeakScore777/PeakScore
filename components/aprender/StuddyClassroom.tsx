"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  BookOpen,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  X,
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
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback((text: string) => {
    speechTextRef.current = text;
    if (muted || !("speechSynthesis" in window) || !text.trim()) {
      setCaption(text);
      setStatus("La explicación queda disponible en subtítulos.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-CO";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      setStatus("Orby está explicando la etapa actual.");
    };
    utterance.onboundary = (event) => {
      if (typeof event.charIndex !== "number") return;
      const start = Math.max(0, event.charIndex);
      setCaption(text.slice(start, Math.min(text.length, start + 150)));
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      setCaption(text);
      setStatus("Etapa completada. Puedes preguntar o continuar.");
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
      setCaption(text);
      setStatus("La explicación sigue disponible por escrito.");
    };
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  const sendTurn = useCallback(async (studentMessage: string, audio?: Blob) => {
    if (busy || !topicRef.current) return;
    interruptSpeech();
    setBusy(true);
    setError("");
    setStatus(audio ? "Transcribiendo tu intervención…" : "Preparando la siguiente etapa de la clase…");
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
      if (!response.ok || typeof payload.speech !== "string" || !payload.board) {
        throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo preparar la siguiente etapa.");
      }
      const actualStudentMessage = typeof payload.transcript === "string" && payload.transcript.trim()
        ? payload.transcript.trim()
        : studentMessage;
      if (actualStudentMessage) {
        setTurns((current) => [...current, { role: "user", content: actualStudentMessage }].slice(-24));
      }
      setBoard(payload.board as OrbyBoardData);
      boardRef.current = payload.board as OrbyBoardData;
      setTurns((current) => [...current, { role: "assistant", content: payload.speech as string }].slice(-24));
      setCaption(payload.speech);
      setStatus("La pizarra está lista. Orby comienza a explicar.");
      speak(payload.speech);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar esta etapa.");
      setStatus("La clase permanece abierta. Puedes volver a intentarlo.");
    } finally {
      setBusy(false);
    }
  }, [busy, intent, interruptSpeech, speak, subject]);

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
      speak(speechTextRef.current);
    }
  }

  function toggleMute() {
    setMuted((current) => {
      const next = !current;
      if (next) {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setPaused(false);
      }
      return next;
    });
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
    void sendTurn(value);
  }

  function finishClass() {
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
    setError("");
    setStatus("Tu aula está lista.");
  }

  return (
    <main className="fixed inset-0 z-[2147483647] flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-slate-900">
      {!active ? (
        <section className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="w-full max-w-2xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">PeakScore · Aula visual</p>
                <p className="text-sm font-semibold text-slate-500">Orby · profesor de Saber 11</p>
              </div>
            </div>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">¿Qué vamos a estudiar hoy?</h1>
            <p className="mb-8 max-w-xl text-sm leading-6 text-slate-500">Prepara una clase guiada. Orby explicará el tema y construirá los apuntes y esquemas directamente en la pizarra.</p>
            <form onSubmit={beginClass} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Área Saber 11</span>
                <select value={subject} onChange={(event) => setSubject(event.target.value as Subject)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                  {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Tema de la clase</span>
                <input value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} maxLength={160} required placeholder="Ej. Fotosíntesis, funciones cuadráticas, Revolución francesa…" className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Objetivo de la clase</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {([
                    ["topic", "Comprender el tema"],
                    ["exam", "Prepararme para Saber 11"],
                    ["task", "Resolver una tarea"],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIntent(value)} className={"rounded-xl border px-3 py-3 text-xs font-semibold transition " + (intent === value ? "border-orange-300 bg-orange-50 text-orange-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{label}</button>
                  ))}
                </div>
              </div>
              {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <button type="submit" disabled={!topicDraft.trim() || busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                Comenzar clase
              </button>
            </form>
            <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">La generación y transcripción usan únicamente la cuota gratuita confirmada. Si se agota, la clase se pausa sin cambiar a un servicio de pago.</p>
          </div>
        </section>
      ) : (
        <>
          <header className="z-20 flex min-h-[58px] items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 sm:px-7">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-700">Orby · clase en curso</p>
              <p className="truncate text-sm font-semibold text-slate-800">{topic}</p>
              <p className="truncate text-[10px] text-slate-400">{subject} · {status}</p>
            </div>
            <button type="button" onClick={finishClass} className="flex shrink-0 items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50">
              <X className="h-4 w-4" /> <span className="hidden sm:inline">Salir de clase</span>
            </button>
          </header>

          <section className="relative min-h-0 flex-1 overflow-hidden bg-white">
            <div className="h-full overflow-y-auto px-3 pb-36 pt-2 sm:px-8 sm:pb-40">
              {board ? (
                <OrbyBoard board={board} drawingActive={speaking && !paused} showTitle />
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-700">
                    <LoaderCircle className="h-7 w-7 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Preparando la primera hoja…</p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">La clase empieza en cuanto Orby construya el primer concepto y su apoyo visual.</p>
                </div>
              )}
            </div>
            {drawerOpen ? (
              <aside className="absolute inset-y-3 left-3 z-30 flex w-[min(360px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.16)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Transcripción de la clase</p>
                    <p className="text-[10px] text-slate-400">Tus intervenciones y las explicaciones de Orby</p>
                  </div>
                  <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Cerrar transcripción" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                  {turns.length ? turns.map((turn, index) => (
                    <article key={index} className="border-b border-slate-100 pb-3 last:border-0">
                      <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{turn.role === "assistant" ? "Orby · profesor" : "Tú"}</p>
                      <p className="whitespace-pre-wrap text-xs leading-5 text-slate-700">{turn.content}</p>
                    </article>
                  )) : <p className="text-xs text-slate-400">La transcripción aparecerá a medida que avance la clase.</p>}
                </div>
              </aside>
            ) : null}
          </section>

          {captions ? (
            <div aria-live="polite" aria-label="Subtítulos de Orby" className="pointer-events-none absolute inset-x-0 bottom-[94px] z-20 flex justify-center px-5">
              <p className="max-w-3xl rounded-xl bg-white/95 px-5 py-3 text-center text-xs font-medium leading-5 text-slate-700 shadow-[0_4px_24px_rgba(15,23,42,.08)] sm:text-sm">{caption || (busy ? "Orby está preparando la siguiente explicación…" : "La explicación aparecerá aquí.")}</p>
            </div>
          ) : null}

          {showAudioConsent ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
              <section role="dialog" aria-modal="true" aria-labelledby="orby-audio-consent-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">Privacidad del micrófono</p>
                <h2 id="orby-audio-consent-title" className="mt-2 text-lg font-semibold text-slate-900">¿Permites procesar tu voz?</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Tu intervención se grabará durante un máximo de 45 segundos y se enviará a Cloudflare Workers AI para transcribirla. La explicación se genera con la misma cuota gratuita confirmada. No se activa Gemini Live ni se cambia a un proveedor de pago; si se agota la cuota, la clase se detiene.</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAudioConsent(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="button" onClick={confirmAudioConsent} className="rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700">Entiendo, usar micrófono</button>
                </div>
              </section>
            </div>
          ) : null}

          <footer className="z-20 border-t border-slate-100 bg-white/95 px-3 py-3 backdrop-blur sm:px-6">
            {error ? <p role="alert" className="mx-auto mb-2 max-w-4xl rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
            <div className="mx-auto flex max-w-5xl items-center gap-2">
              <button type="button" onClick={toggleMute} aria-label={muted ? "Activar voz" : "Silenciar voz"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button type="button" onClick={togglePlayback} aria-label={paused ? "Reanudar explicación" : "Pausar explicación"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => setDrawerOpen((value) => !value)} aria-label="Mostrar transcripción" className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition " + (drawerOpen ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <BookOpen className="h-4 w-4" />
              </button>
              <form onSubmit={submitText} className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-1 shadow-[0_3px_16px_rgba(15,23,42,.05)] focus-within:border-orange-300">
                <input value={message} onChange={(event) => setMessage(event.target.value)} disabled={busy || recording} placeholder="Pregunta algo sobre esta explicación…" className="h-11 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 sm:text-sm" />
                <button type="submit" disabled={!message.trim() || busy || recording} aria-label="Enviar intervención" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
              </form>
              <button type="button" onClick={recording ? stopRecording : requestRecording} disabled={busy} aria-label={recording ? "Finalizar grabación" : "Hablar con Orby"} className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition " + (recording ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-5xl items-center justify-between px-1 text-[9px] text-slate-400">
              <span>{recording ? "Grabando · " + recordingSeconds + " s / 45 s" : busy ? "Procesando con cuota gratuita" : "Pizarra, voz y subtítulos de la misma clase"}</span>
              <button type="button" onClick={() => setCaptions((value) => !value)} className="rounded px-2 py-1 hover:bg-slate-100">{captions ? "Ocultar subtítulos" : "Mostrar subtítulos"}</button>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}

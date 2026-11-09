"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  LoaderCircle,
  X,
} from "lucide-react";

type Turn = { role: "user" | "assistant"; content: string };

type Props = {
  subject: string;
  topic: string;
  englishPractice?: boolean;
  conversationId?: string | null;
  assistantName?: "OmegaX" | "Orby";
  onClose: () => void;
};

function encodeWav(audio: AudioBuffer): Blob {
  const targetRate = 16_000;
  const source = audio.getChannelData(0);
  const ratio = audio.sampleRate / targetRate;
  const length = Math.floor(source.length / ratio);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
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
  for (let i = 0; i < length; i += 1) {
    const sample = Math.max(-1, Math.min(1, source[Math.floor(i * ratio)] ?? 0));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function convertToWav(blob: Blob): Promise<Blob> {
  const AudioContextCtor = window.AudioContext;
  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(decoded);
  } finally {
    await context.close().catch(() => undefined);
  }
}

export default function OmegaXFreeVoiceTurn({
  subject,
  topic,
  englishPractice = false,
  conversationId = null,
  assistantName = "Orby",
  onClose,
}: Props) {
  const tutorName = assistantName === "OmegaX" ? "OmegaX" : "Orby";
  const [preflight, setPreflight] = useState<"checking" | "ready" | "blocked">("checking");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recordingDurationSeconds = englishPractice ? 60 : 45;
  const [secondsLeft, setSecondsLeft] = useState(recordingDurationSeconds);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopReasonRef = useRef<"manual" | "timeout">("manual");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void fetch("/api/orby/cloudflare-voice-turn", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.available !== true) {
        if (mountedRef.current) {
          setPreflight("blocked");
          setError(typeof payload.error === "string"
            ? payload.error
            : "La voz gratuita aún no está disponible. Puedes continuar por escrito.");
        }
        return;
      }
      if (mountedRef.current) setPreflight("ready");
    }).catch(() => {
      if (mountedRef.current) {
        setPreflight("blocked");
        setError("No se pudo comprobar la conexión gratuita. No se solicitó el micrófono.");
      }
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopSpeech() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window) || !text.trim()) {
      setNotice("La respuesta está disponible en subtítulos; este dispositivo no ofrece voz del sistema.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = englishPractice ? "en-US" : "es-CO";
    utterance.rate = 0.96;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function submitAudio(blob: Blob) {
    setProcessing(true);
    setError("");
    setNotice("Transcribiendo tu intervención y preparando la respuesta.");
    try {
      const wav = await convertToWav(blob);
      if (wav.size > 2 * 1024 * 1024) throw new Error("El audio convertido supera el límite de 2 MB.");
      const form = new FormData();
      form.append("audio", new File([wav], "omega-voice.wav", { type: "audio/wav" }));
      form.append("englishPractice", String(englishPractice));
      form.append("assistantName", assistantName);
      form.append("subject", subject);
      form.append("topic", topic);
      form.append("history", JSON.stringify(history.slice(-4)));
      const response = await fetch("/api/orby/cloudflare-voice-turn", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.reply !== "string" || typeof payload.transcript !== "string") {
        throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo completar el turno de voz.");
      }
      const studentText = payload.transcript.trim();
      const assistantText = payload.reply.trim();
      setTranscript(studentText);
      setReply(assistantText);
      setHistory((current) => [
        ...current,
        { role: "user", content: studentText },
        { role: "assistant", content: assistantText },
      ].slice(-8));
      setNotice("Turno completado. Puedes interrumpir la lectura y volver a hablar cuando quieras.");
      if (conversationId) {
        const turnId = crypto.randomUUID();
        const save = await fetch("/api/orby/realtime-turn", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            turnId,
            userContent: studentText,
            assistantContent: assistantText,
          }),
        });
        if (!save.ok) setNotice("Respuesta lista, pero no se pudo guardar el turno en el historial.");
      }
      setTimeout(() => speak(assistantText), 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo procesar el audio.");
      setNotice("");
    } finally {
      setProcessing(false);
      setSecondsLeft(recordingDurationSeconds);
    }
  }

  async function startRecording() {
    if (preflight !== "ready" || recording || processing) return;
    setError("");
    setNotice("");
    stopSpeech();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio en este dispositivo. Puedes continuar por escrito.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      stopReasonRef.current = "manual";
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
        timerRef.current = null;
        if (blob.size >= 1_024) void submitAudio(blob);
        else setError("No se detectó audio suficiente. Inténtalo de nuevo.");
      };
      recorder.start();
      setRecording(true);
      setSecondsLeft(recordingDurationSeconds);
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            stopReasonRef.current = "timeout";
            if (recorder.state !== "inactive") recorder.stop();
            return 0;
          }
          return current - 1;
        });
      }, 1_000);
      setNotice(englishPractice
        ? "Te escucho. Tienes hasta 60 segundos para completar el reto oral."
        : "Te escucho. Habla con naturalidad; puedes terminar antes de 45 segundos.");
    } catch {
      setError("No se pudo acceder al micrófono. Revisa el permiso del navegador y vuelve a intentarlo.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fffefa] text-[#171717]" aria-label={"Clase en vivo con " + tutorName}>
      <header className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <span role="status" className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] text-[#6b6258] shadow-sm">
          {preflight === "ready" ? "Voz disponible" : preflight === "checking" ? "Conectando voz" : "Voz sin conexión"}
        </span>
        <button type="button" onClick={() => { stopSpeech(); stopRecording(); onClose(); }} className="flex size-9 items-center justify-center rounded-full bg-white text-[#4b463f] shadow-sm hover:bg-[#f5f1e9]" aria-label="Cerrar clase"><X className="h-4 w-4" /></button>
      </header>

      <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[min(70vw,440px)] sm:left-12 sm:top-12">
        <h2 className="orby-board-handwriting inline-block -rotate-[.5deg] rounded-[9px] bg-[#fff1bd] px-3 py-2 text-lg font-semibold leading-tight text-[#242018] sm:px-4 sm:text-2xl">
          {topic || "Clase de estudio"}
        </h2>
        <p className="mt-1 text-[10px] text-[#777064]">{subject} · {englishPractice ? "Práctica de inglés" : "Preparación Saber 11"}</p>
      </div>

      <main className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-28 pt-28 sm:px-14 sm:pb-32 sm:pt-36">
        <div className="mx-auto flex min-h-full w-full max-w-[1180px] flex-col items-start">
          {transcript && (
            <p className="orby-board-handwriting mb-5 max-w-2xl text-lg leading-relaxed text-[#26231e] sm:text-2xl">
              {transcript}
            </p>
          )}
          {reply ? (
            <div className="orby-board-handwriting max-w-5xl whitespace-pre-wrap text-lg leading-[1.65] text-[#24211d] sm:text-[23px] sm:leading-[1.7]" aria-live="polite">
              {reply}
            </div>
          ) : (
            <div className="orby-board-handwriting mt-8 max-w-2xl text-lg leading-relaxed text-[#29251f] sm:text-2xl">
              {processing
                ? "Estoy preparando la explicación…"
                : recording
                  ? "Te escucho. Cuéntame qué parte quieres entender."
                  : "Hola. ¿Qué tema quieres aprender hoy?"}
            </div>
          )}
          {(error || notice) && (
            <p role={error ? "alert" : "status"} className={"pointer-events-auto mt-6 max-w-2xl text-xs leading-5 " + (error ? "text-rose-700" : "text-[#71695e]")}>
              {error || notice}
            </p>
          )}
          {recording && <p role="timer" className="mt-4 text-xs tabular-nums text-rose-700">Grabando · 00:{String(secondsLeft).padStart(2, "0")}</p>}
        </div>
      </main>

      <section className="pointer-events-none absolute inset-x-0 bottom-[66px] z-10 px-5 sm:bottom-[76px]" aria-label={"Subtítulos de " + tutorName} aria-live="polite" aria-atomic="true">
        <p className="mx-auto min-h-6 max-w-4xl text-center text-xs leading-5 text-[#242424] sm:text-sm sm:leading-6">
          {processing ? "Estoy preparando la respuesta." : recording ? "Te estoy escuchando." : reply || notice || "Pulsa el micrófono para comenzar la conversación."}
        </p>
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-4 pt-2 sm:px-7 sm:pb-5">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#27231e] shadow-[0_2px_14px_rgba(40,30,10,.12)]" aria-label={tutorName}>{tutorName === "Orby" ? "O" : "X"}</div>
          <button type="button" onClick={() => { setTranscript(""); setReply(""); setNotice(""); setError(""); setHistory([]); stopSpeech(); }} disabled={recording || processing} className="flex size-9 items-center justify-center rounded-full bg-white text-[#5c554b] shadow-sm hover:bg-[#f5f1e9] disabled:opacity-40" aria-label="Nueva conversación" title="Nueva conversación"><RotateCcw className="h-4 w-4" /></button>
          <button type="button" onClick={() => speaking ? stopSpeech() : speak(reply)} disabled={!reply || processing} className="flex size-9 items-center justify-center rounded-full bg-white text-[#5c554b] shadow-sm hover:bg-[#f5f1e9] disabled:opacity-40" aria-label={speaking ? "Interrumpir voz" : "Escuchar respuesta"} title={speaking ? "Interrumpir voz" : "Escuchar respuesta"}>{speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        </div>
        <div className="flex items-center gap-2">
          {recording && <span className="text-xs tabular-nums text-[#746b60]">00:{String(secondsLeft).padStart(2, "0")}</span>}
          <button
            type="button"
            onClick={() => recording ? stopRecording() : void startRecording()}
            disabled={preflight !== "ready" || processing}
            className={"flex size-12 items-center justify-center rounded-full shadow-[0_3px_12px_rgba(40,30,10,.14)] transition disabled:cursor-not-allowed disabled:opacity-35 " + (recording ? "bg-[#e64b4b] text-white hover:bg-[#ca3838]" : "bg-white text-[#514b42] hover:bg-[#f5f1e9]")}
            aria-label={recording ? "Terminar de hablar" : "Iniciar micrófono"}
            title={recording ? "Terminar de hablar" : "Iniciar micrófono"}
          >
            {processing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </footer>
    </section>
  );
}

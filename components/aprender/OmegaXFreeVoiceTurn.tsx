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
  onClose,
}: Props) {
  const [preflight, setPreflight] = useState<"checking" | "ready" | "blocked">("checking");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
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
      setSecondsLeft(60);
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
      setSecondsLeft(45);
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
      setNotice("Te escucho. Habla con naturalidad; puedes terminar antes de 60 segundos.");
    } catch {
      setError("No se pudo acceder al micrófono. Revisa el permiso del navegador y vuelve a intentarlo.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7fafc]" aria-label="Aula de voz de OmegaX">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ebf0] bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#607284]">Aula de voz · OmegaX</p>
          <h2 className="mt-1 truncate text-lg font-extrabold text-[#203344]">{topic || "Clase de estudio"}</h2>
          <p className="mt-0.5 text-xs text-[#718294]">{subject} · {englishPractice ? "Práctica de inglés" : "Preparación Saber 11"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={"rounded-full border px-3 py-1.5 text-[10px] font-bold " + (preflight === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : preflight === "checking" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700")}>
            {preflight === "ready" ? "Voz gratuita disponible" : preflight === "checking" ? "Comprobando acceso" : "Voz no disponible"}
          </span>
          <button type="button" onClick={() => { stopSpeech(); stopRecording(); onClose(); }} className="inline-flex size-9 items-center justify-center rounded-lg border border-[#e1e7ed] text-[#526679] hover:bg-[#f4f7fa]" aria-label="Cerrar aula de voz"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-[340px] flex-col rounded-2xl border border-[#e1e8ef] bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#6f8192]">Conversación</p>
              <p className="mt-1 text-sm font-semibold text-[#25394a]">Habla por turnos; OmegaX te escucha y te responde.</p>
            </div>
            {recording && <span role="timer" className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold tabular-nums text-rose-700">Grabando · 00:{String(secondsLeft).padStart(2, "0")}</span>}
          </div>

          <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
            <article className="min-w-0 rounded-xl border border-[#e1e8ef] bg-[#fbfcfd] p-3" aria-live="polite">
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#63768a]">Tú</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#2b3d4d]">{transcript || (recording ? "El micrófono está escuchando tu intervención…" : "Tu transcripción aparecerá aquí.")}</p>
            </article>
            <article className="min-w-0 rounded-xl border border-[#d9e8f4] bg-[#f4f9fd] p-3" aria-live="polite">
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#21658f]">OmegaX</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#21384b]">{reply || (processing ? "Estoy preparando la respuesta…" : "La explicación aparecerá aquí en subtítulos.")}</p>
            </article>
          </div>

          {(error || notice) && <p role={error ? "alert" : "status"} className={"mt-4 rounded-lg border px-3 py-2 text-xs leading-5 " + (error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#dce7ef] bg-[#f7fafc] text-[#52687c]")}>{error || notice}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#edf1f4] pt-4">
            {!recording ? (
              <button type="button" onClick={() => void startRecording()} disabled={preflight !== "ready" || processing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877b5] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#125b8a] transition hover:bg-[#14689f] disabled:cursor-not-allowed disabled:opacity-45">
                {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {processing ? "Procesando turno" : "Hablar con OmegaX"}
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c52d35] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#942028] hover:bg-[#a9242b]">
                <Square className="h-4 w-4 fill-current" /> Terminar de hablar
              </button>
            )}
            <button type="button" onClick={() => speak(reply)} disabled={!reply || processing || speaking} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dfe7ee] bg-white px-3 text-xs font-bold text-[#43596d] disabled:opacity-40">
              <Volume2 className="h-4 w-4" /> Escuchar respuesta
            </button>
            <button type="button" onClick={stopSpeech} disabled={!speaking} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dfe7ee] bg-white px-3 text-xs font-bold text-[#43596d] disabled:opacity-40">
              <VolumeX className="h-4 w-4" /> Interrumpir voz
            </button>
            <button type="button" onClick={() => { setTranscript(""); setReply(""); setNotice(""); setError(""); setHistory([]); stopSpeech(); }} disabled={recording || processing} className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#718294] hover:bg-[#f4f7fa] disabled:opacity-40">
              <RotateCcw className="h-4 w-4" /> Nueva práctica
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-[#e1e8ef] bg-white p-4 sm:p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#6f8192]">Cómo funciona</p>
          <ol className="mt-4 space-y-4">
            {[
              ["01", "Habla", "Pulsa el micrófono y explica tu idea en un máximo de 60 segundos."],
              ["02", "Escucha", "OmegaX transcribe tu intervención y responde en subtítulos."],
              ["03", "Repite", "Puedes escuchar la respuesta, interrumpir la voz local y volver a hablar."],
            ].map(([number, title, detail]) => (
              <li key={number} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf3f9] text-[10px] font-extrabold text-[#28658b]">{number}</span>
                <span><strong className="block text-xs text-[#2f4355]">{title}</strong><span className="mt-1 block text-[11px] leading-5 text-[#708193]">{detail}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-[#edf1f4] pt-4 text-[10px] leading-5 text-[#788897]">El audio se convierte a texto y no se guarda como archivo. La voz de respuesta usa la síntesis disponible en tu dispositivo. Esta modalidad es por turnos, no una llamada dúplex continua.</p>
        </aside>
      </div>
    </section>
  );
}

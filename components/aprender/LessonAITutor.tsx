"use client";

import Image from "next/image";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, FileText, LoaderCircle, Mic, MicOff, Paperclip, ScanText, Send, Volume2, X } from "lucide-react";
import { createWorker } from "tesseract.js";

type Message = { role: "user" | "assistant"; content: string; checkQuestion?: string; attachmentName?: string; attachmentPreview?: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string; isFinal: boolean }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type ReviewQuestion = {
  id: string;
  number: number;
  subject: string;
  topic: string;
  prompt: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
};

type Props = {
  reviewQuestions?: ReviewQuestion[];
  subject: string;
  topic: string;
  stage?: "theory" | "practice";
  question?: string;
  context?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
  accent?: "default" | "orby";
  voiceEnabled?: boolean;
};


function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  );
}

function renderTutorContent(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  return (
    <div className="space-y-2.5">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" aria-hidden="true" />;
        // Hide a bullet glyph emitted alone by the model instead of rendering it as content.
        if (/^(?:\*\*)?[•·](?:\*\*)?$/.test(line)) return null;
        const heading = line.match(/^\*\*(.+?)\*\*:?$/);
        if (heading) {
          return <h4 key={index} className="pt-1 text-sm font-extrabold tracking-tight text-slate-950">{heading[1].replace(/:$/, "")}</h4>;
        }
        const bullet = line.match(/^(?:[-•])\s+(.+)$/);
        if (bullet) {
          return <div key={index} className="flex gap-2 pl-1"><span className="mt-[2px] font-bold text-sky-600">•</span><p className="min-w-0 flex-1">{renderInline(bullet[1])}</p></div>;
        }
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          return <div key={index} className="flex gap-2 pl-1"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-50 text-[11px] font-extrabold text-sky-700">{numbered[1]}</span><p className="min-w-0 flex-1">{renderInline(numbered[2])}</p></div>;
        }
        return <p key={index}>{renderInline(line.replace(/^\*\*(.+?)\*\*$/, "$1"))}</p>;
      })}
    </div>
  );
}

const starters = [
  "Explícame la diferencia entre masa y densidad",
  "¿Cómo analizo una tabla de datos?",
  "Dame un ejemplo similar para practicar",
  "No entiendo por qué una opción es incorrecta",
];

export default function LessonAITutor({ subject, topic, stage = "theory", question = "", context = "", open, onOpenChange, initialPrompt, accent = "default", reviewQuestions = [], voiceEnabled = false }: Props) {
  const orbyAccent = accent === "orby";
  const [notebookOpen, setNotebookOpen] = useState(false);
  const activeReviewRef = useRef<ReviewQuestion | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const voiceModeRef = useRef(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropX, setCropX] = useState(5);
  const [cropY, setCropY] = useState(5);
  const [cropW, setCropW] = useState(90);
  const [cropH, setCropH] = useState(90);
  const [imageContrast, setImageContrast] = useState(115);
  const [imageBrightness, setImageBrightness] = useState(105);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageRef = useRef<(text: string, includeAttachment?: boolean) => Promise<void>>(async () => {});
  const lastInitialPromptRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);


  useEffect(() => {
    return () => {
      if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
    };
  }, [attachmentPreview]);

  function handleAttachment(file?: File) {
    setAttachmentError("");
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError("Solo se permiten imágenes JPG, PNG o WebP. Los PDF no están permitidos.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setAttachmentError("La imagen debe pesar máximo 1 MB.");
      return;
    }
    setAttachment(file);
    setOcrText("");
    setCropMode(false);
    setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    setAttachmentPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  }

  function clearAttachment() {
    if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview("");
    setAttachmentError("");
    setOcrText("");
    setCropMode(false);
    setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function detectPaperBounds() {
    if (!attachmentPreview) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo analizar la fotografía."));
      });

      // Analiza una copia pequeña para no bloquear el navegador con fotos grandes.
      const scale = Math.min(1, 700 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No se pudo analizar la fotografía.");
      ctx.drawImage(image, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const rowCoverage = new Array<number>(height).fill(0);
      const colCoverage = new Array<number>(width).fill(0);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const bright = (r + g + b) / 3 > 190;
          const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 65;
          if (bright && neutral) {
            rowCoverage[y]++;
            colCoverage[x]++;
          }
        }
      }
      const top = rowCoverage.findIndex((count) => count / width > 0.35);
      const bottom = rowCoverage.length - 1 - [...rowCoverage].reverse().findIndex((count) => count / width > 0.35);
      const left = colCoverage.findIndex((count) => count / height > 0.35);
      const right = colCoverage.length - 1 - [...colCoverage].reverse().findIndex((count) => count / height > 0.35);
      if (top < 0 || bottom <= top || left < 0 || right <= left || (right - left) / width < 0.25 || (bottom - top) / height < 0.25) {
        throw new Error("No detecté con suficiente confianza los bordes de una hoja clara. Ajusta el recorte manualmente.");
      }
      const padX = Math.round(width * 0.012);
      const padY = Math.round(height * 0.012);
      const x1 = Math.max(0, left - padX), y1 = Math.max(0, top - padY);
      const x2 = Math.min(width, right + padX), y2 = Math.min(height, bottom + padY);
      setCropX(Math.round((x1 / width) * 100));
      setCropY(Math.round((y1 / height) * 100));
      setCropW(Math.max(10, Math.round(((x2 - x1) / width) * 100)));
      setCropH(Math.max(10, Math.round(((y2 - y1) / height) * 100)));
      setCropMode(true);
      setAttachmentError("Detecté un encuadre aproximado. Revisa los límites antes de aplicar el recorte.");
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudieron detectar los bordes.");
    }
  }

  async function enhanceImage() {
    if (!attachment || !attachmentPreview) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo abrir la imagen para mejorarla."));
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar la mejora de imagen.");
      ctx.filter = `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`;
      ctx.drawImage(image, 0, 0);
      ctx.filter = "none";
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar la imagen mejorada.")), "image/jpeg", 0.92));
      const enhanced = new File([blob], "orby-hoja-mejorada.jpg", { type: "image/jpeg" });
      if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
      setAttachment(enhanced);
      setAttachmentPreview(URL.createObjectURL(enhanced));
      setOcrText("");
      setAttachmentError("");
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo mejorar la imagen.");
    }
  }

  async function applyImageCrop() {
    if (!attachment || !attachmentPreview || cropW < 10 || cropH < 10) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo abrir la imagen para recortarla."));
      });
      const sx = Math.round((cropX / 100) * image.naturalWidth);
      const sy = Math.round((cropY / 100) * image.naturalHeight);
      const sw = Math.max(1, Math.round((cropW / 100) * image.naturalWidth));
      const sh = Math.max(1, Math.round((cropH / 100) * image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar el recorte.");
      ctx.drawImage(image, sx, sy, Math.min(sw, image.naturalWidth - sx), Math.min(sh, image.naturalHeight - sy), 0, 0, sw, sh);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar el recorte.")), "image/jpeg", 0.9));
      const cropped = new File([blob], "orby-pregunta-recortada.jpg", { type: "image/jpeg" });
      if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
      setAttachment(cropped);
      setAttachmentPreview(URL.createObjectURL(cropped));
      setOcrText("");
      setCropMode(false);
      setAttachmentError("");
      setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo recortar la imagen.");
    }
  }

  async function readImageText() {
    if (!attachment || ocrLoading) return;
    setOcrLoading(true);
    setAttachmentError("");
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      worker = await createWorker("spa");
      const result = await worker.recognize(attachment);
      const extracted = result.data.text.trim();
      if (!extracted) {
        setAttachmentError("No pude detectar texto legible. Intenta tomar la foto con mejor luz y enfoque.");
        return;
      }
      setOcrText(extracted.slice(0, 6000));
    } catch (error) {
      console.error("[Orby OCR] Local recognition failed.", error);
      setAttachmentError("No se pudo leer la imagen en este dispositivo. Puedes enviarla directamente a Orby.");
    } finally {
      if (worker) await worker.terminate();
      setOcrLoading(false);
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") return reject(new Error("No se pudo leer la imagen adjunta."));
        const comma = result.indexOf(",");
        if (comma < 0) return reject(new Error("La imagen adjunta no tiene un formato válido."));
        resolve(result.slice(comma + 1));
      };
      reader.onerror = () => reject(new Error("No se pudo leer la imagen adjunta."));
      reader.readAsDataURL(file);
    });
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }

  function speakText(text: string, index: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Tu navegador no tiene lectura de voz disponible.");
      return;
    }
    stopSpeaking();
    const clean = text.replace(/\*\*/g, "").replace(/`/g, "").replace(/^[-•]\s*/gm, "").replace(/^\d+[.)]\s*/gm, "").slice(0, 5000);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "es-CO"; utterance.rate = 1; utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((voice) => voice.lang.toLowerCase() === "es-co") ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index); window.speechSynthesis.speak(utterance);
  }

  function toggleVoiceMode() {
    const next = !voiceModeRef.current;
    voiceModeRef.current = next;
    setVoiceMode(next);
    if (!next) stopSpeaking();
  }

  function toggleVoiceInput() {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setVoiceError("Este navegador no admite dictado por voz. Prueba con Chrome o Edge, o escribe tu pregunta."); return; }
    setVoiceError("");
    const recognition = new Recognition();
    recognition.lang = "es-CO"; recognition.continuous = false; recognition.interimResults = true;
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results.map((result) => result[0]?.transcript ?? "").join(" ").trim();
      if (!transcript) return;
      setInput(transcript.slice(0, 1200));
      if (results.some((result) => result[0]?.isFinal)) {
        setIsListening(false); recognitionRef.current = null;
        void sendMessageRef.current(transcript.slice(0, 1200));
      }
    };
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null; setVoiceError("No pude reconocer tu voz. Revisa el permiso del micrófono e inténtalo otra vez."); };
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); } catch { setIsListening(false); recognitionRef.current = null; setVoiceError("No se pudo activar el micrófono. Inténtalo de nuevo."); }
  }
  async function sendMessage(text: string, includeAttachment = false) {
    const message = text.trim();
    const selectedFile = includeAttachment ? attachment : null;
    if ((!message && !selectedFile) || loading || message.length > 1200) return;
    let imagePayload: { mimeType: string; base64: string } | undefined;
    try {
      if (selectedFile) imagePayload = { mimeType: selectedFile.type, base64: await fileToBase64(selectedFile) };
    } catch (caught) {
      setAttachmentError(caught instanceof Error ? caught.message : "No se pudo leer la imagen.");
      return;
    }
    const nextMessages: Message[] = [...messages, { role: "user", content: message || "Analiza la imagen adjunta.", ...(selectedFile && imagePayload ? { attachmentName: selectedFile.name, attachmentPreview: selectedFile.type.startsWith("image/") ? `data:${selectedFile.type};base64,${imagePayload.base64}` : "" } : {}) }];
    setMessages(nextMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "48px";
    if (selectedFile) clearAttachment();
    setError("");
    setLoading(true);
    try {
      const activeReview = activeReviewRef.current;
      const reviewContext = activeReview ? [
        `Pregunta seleccionada: ${activeReview.prompt}`,
        `Opciones: ${activeReview.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join("\n")}`,
        `Respuesta del estudiante: ${activeReview.userAnswer}`,
        `Respuesta correcta: ${activeReview.correctAnswer}`,
        `Explicación base: ${activeReview.explanation}`,
      ].join("\\n") : context;
      const response = await fetch("/api/lesson-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          subject: activeReview?.subject ?? subject,
          topic: activeReview?.topic ?? topic,
          stage,
          question: activeReview?.prompt ?? question,
          context: [reviewContext, ocrText ? `Texto OCR extraído localmente de la imagen (puede contener errores):\n${ocrText}` : ""].filter(Boolean).join("\n\n").slice(0, 10000),
          message,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
          ...(imagePayload ? { image: imagePayload } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Orby no está disponible por ahora.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta llegó incompleta. Inténtalo de nuevo.");
      const assistantIndex = nextMessages.length;
      setMessages((current) => [...current, { role: "assistant", content: data.reply, checkQuestion: typeof data.checkQuestion === "string" ? data.checkQuestion : "" }]);
      if (voiceModeRef.current && "speechSynthesis" in window) {
        window.setTimeout(() => speakText(data.reply, assistantIndex), 120);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocurrió un error. Inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  useEffect(() => {
    if (!open) {
      lastInitialPromptRef.current = null;
      activeReviewRef.current = null;
      setNotebookOpen(false);
      return;
    }
    const prompt = initialPrompt?.trim();
    if (!prompt || lastInitialPromptRef.current === prompt) return;
    lastInitialPromptRef.current = prompt;
    void sendMessageRef.current(prompt);
  }, [open, initialPrompt]);

  function explainReviewQuestion(item: ReviewQuestion) {
    activeReviewRef.current = item;
    setNotebookOpen(false);
    const prompt = `Explícame paso a paso la pregunta ${item.number}. Quiero entender por qué mi respuesta fue incorrecta o por qué se agotó el tiempo, cómo se llega a la respuesta correcta y qué idea clave debo recordar para resolver una pregunta parecida. Distingue claramente mi respuesta de la correcta, usa la explicación base como referencia y no inventes datos.`;
    void sendMessageRef.current(prompt);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input, true);
  }

  if (!open) return null;

  return (
    <aside id="orby-tutor-panel" aria-label="Tutor de inteligencia artificial Orby" className="fixed inset-x-3 bottom-[76px] z-[60] flex max-h-[min(720px,calc(100dvh-100px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.5)] sm:inset-x-auto sm:right-5 sm:top-[88px] sm:bottom-[82px] sm:w-[390px] lg:right-7 lg:w-[410px]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${orbyAccent ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,.14)]" : "border-sky-300 shadow-[0_0_0_3px_rgba(14,165,233,.12)]"}`}>
            <Image src="/avatars/photo_perfil/orbyp.png" width={1200} height={800} alt="Avatar de Orby" className="h-full w-full object-contain object-center" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-950">Orby <span className={orbyAccent ? "text-orange-500" : "text-sky-600"}>●</span></p>
            <p className="truncate text-xs text-slate-500">Tutor de ciencias · Saber 11</p>
          </div>
        </div>
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar tutor Orby" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
      </header>

      {reviewQuestions.length > 0 && <div className="shrink-0 border-b border-[#d9c5ae] bg-[#fff9f0] px-3 py-2">
        <button type="button" onClick={() => setNotebookOpen((value) => !value)} aria-expanded={notebookOpen} className={`flex min-h-10 w-full items-center justify-between gap-3 border px-3 py-2 text-left text-xs font-extrabold transition ${notebookOpen ? "border-orange-500 bg-orange-100 text-orange-950" : "border-orange-200 bg-white text-slate-800 hover:border-orange-400 hover:bg-orange-50"}`}>
          <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-orange-600"/> Cuaderno de preguntas falladas <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white">{reviewQuestions.length}</span></span>
          <span className="text-[10px] text-orange-700">{notebookOpen ? "Cerrar −" : "Ver preguntas +"}</span>
        </button>
        {notebookOpen && <section aria-label="Cuaderno de preguntas falladas" className="mt-2 max-h-64 overflow-y-auto border border-orange-200 bg-[#fffdf9] p-2">
          <p className="px-2 py-1 text-[10px] leading-4 text-slate-600">Elige una pregunta para enviársela a Orby. La explicación aparecerá en este chat.</p>
          <div className="mt-1 grid gap-2">
            {reviewQuestions.map((item) => <button key={item.id} type="button" onClick={() => explainReviewQuestion(item)} className="w-full border border-[#e7c6a5] bg-white px-3 py-2 text-left transition hover:border-orange-500 hover:bg-orange-50">
              <span className="block text-[9px] font-black uppercase tracking-wider text-orange-700">Pregunta {item.number} · {item.subject}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{item.prompt}</span>
              <span className="mt-1 block text-[10px] leading-4 text-slate-600">Tu respuesta: {item.userAnswer}</span>
              <span className="mt-1 block text-[10px] leading-4 text-emerald-800">Respuesta correcta: {item.correctAnswer}</span>
            </button>)}
          </div>
        </section>}
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] px-4 py-4" ref={scrollRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center">
            <Image src="/avatars/photo_perfil/orbyp.png" width={1200} height={800} alt="Orby, tutor de PeakScore" className={`mb-2 h-28 w-28 rounded-full border-2 bg-white object-contain object-center ${orbyAccent ? "border-orange-300 shadow-[0_4px_18px_rgba(249,115,22,.18)]" : "border-sky-200 shadow-[0_4px_18px_rgba(14,165,233,.16)]"}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
            <div className="w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-base font-extrabold text-slate-950">¡Hola! Soy Orby 👋</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Te ayudo a comprender la teoría, analizar los datos y razonar tu respuesta. ¿Qué parte revisamos juntos?</p>
            </div>
            <div className="mt-4 grid w-full gap-2">
              {starters.map((starter) => (
                <button key={starter} type="button" disabled={loading} onClick={() => void sendMessage(starter)} className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition disabled:opacity-50 ${orbyAccent ? "hover:border-orange-300 hover:bg-orange-50" : "hover:border-sky-300 hover:bg-sky-50"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${orbyAccent ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"}`}>✦</span>{starter}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <article key={index} className={message.role === "user" ? `ml-auto max-w-[92%] rounded-2xl rounded-br-sm px-3 py-3 text-white ${orbyAccent ? "bg-orange-600" : "bg-sky-600"}` : "mr-auto max-w-[96%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm"}>
                <p className={message.role === "user" ? "mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-100" : `mb-1 text-[10px] font-bold uppercase tracking-wider ${orbyAccent ? "text-orange-700" : "text-sky-700"}`}>{message.role === "user" ? "Tú" : "Orby · Tutor PeakScore"}</p>
                <div className="break-words text-[13px] leading-[1.75] sm:text-sm">{renderTutorContent(message.content)}</div>
                {voiceEnabled && message.role === "assistant" && <button type="button" onClick={() => speakingIndex === index ? stopSpeaking() : speakText(message.content, index)} className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
                  <Volume2 className="h-3.5 w-3.5" /> {speakingIndex === index ? "Detener audio" : "Escuchar respuesta"}
                </button>}
                {message.attachmentName && <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/25 p-2">{message.attachmentPreview ? <Image src={message.attachmentPreview} width={1200} height={800} unoptimized alt={`Adjunto: ${message.attachmentName}`} className="max-h-28 max-w-full rounded-md object-contain" /> : <FileText className="h-6 w-6 shrink-0" />}<p className="min-w-0 break-all text-[10px] opacity-80">{message.attachmentName}</p></div>}
                {message.checkQuestion && <div className="mt-3 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"><strong>Comprueba lo aprendido:</strong> {message.checkQuestion}</div>}
              </article>
            ))}
            {loading && <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Orby está preparando una explicación…</div>}
          </div>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>

      {attachment && <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-3">
        <div className={`flex items-center gap-3 rounded-xl border p-2 ${orbyAccent ? "border-orange-200 bg-orange-50" : "border-sky-200 bg-sky-50"}`}>
          {attachmentPreview ? <Image src={attachmentPreview} width={1200} height={800} unoptimized alt="Vista previa de la imagen adjunta" className={`h-12 w-12 shrink-0 rounded-lg border bg-white object-cover ${orbyAccent ? "border-orange-100" : "border-sky-100"}`} /> : <FileText className={`ml-2 h-8 w-8 shrink-0 ${orbyAccent ? "text-orange-700" : "text-sky-700"}`} />}
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{attachment.name}</p><p className="text-[11px] text-slate-500">Listo para analizar · {(attachment.size / 1024).toFixed(0)} KB</p><p className="text-[10px] text-slate-500">La imagen solo se envía a Orby cuando pulses enviar. Puedes quitarla antes.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
              <label className="text-[10px] font-semibold text-slate-600">Contraste {imageContrast}%<input type="range" min="80" max="180" value={imageContrast} onChange={(event) => setImageContrast(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Brillo {imageBrightness}%<input type="range" min="70" max="150" value={imageBrightness} onChange={(event) => setImageBrightness(Number(event.target.value))} className="block w-full" /></label>
              <button type="button" onClick={enhanceImage} className="col-span-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100">Mejorar contraste y brillo</button>
            </div>
            <button type="button" onClick={detectPaperBounds} className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-800 hover:bg-orange-100">Detectar bordes de la hoja</button>
            <button type="button" onClick={() => setCropMode((value) => !value)} className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">{cropMode ? "Cerrar recorte" : "Recortar pregunta"}</button>
            {cropMode && <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
              <label className="text-[10px] font-semibold text-slate-600">Izquierda {cropX}%<input type="range" min="0" max={Math.max(0, 100 - cropW)} value={cropX} onChange={(event) => setCropX(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Arriba {cropY}%<input type="range" min="0" max={Math.max(0, 100 - cropH)} value={cropY} onChange={(event) => setCropY(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Ancho {cropW}%<input type="range" min="10" max={100 - cropX} value={cropW} onChange={(event) => setCropW(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Alto {cropH}%<input type="range" min="10" max={100 - cropY} value={cropH} onChange={(event) => setCropH(Number(event.target.value))} className="block w-full" /></label>
              <button type="button" onClick={applyImageCrop} className="col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700">Aplicar recorte</button>
            </div>}
            <button type="button" onClick={readImageText} disabled={ocrLoading || !attachment || !attachment.type.startsWith("image/")} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50">
              {ocrLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5" />}
              {ocrLoading ? "Leyendo en este dispositivo…" : ocrText ? "Volver a leer texto" : "Leer texto de la hoja"}
            </button>
            {ocrText && <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[10px] leading-relaxed text-slate-600">{ocrText}</p>}
</div>
          <button type="button" onClick={clearAttachment} aria-label="Quitar imagen adjunta" className="rounded-full p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
        </div>
      </div>}
      {attachmentError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{attachmentError}</p>}
      {voiceError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{voiceError}</p>}
      {isListening && <p role="status" className="shrink-0 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">Te escucho… habla ahora. Al terminar, enviaré tu pregunta a Orby.</p>}
      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Adjuntar imagen" onChange={(event) => handleAttachment(event.currentTarget.files?.[0])} />
        <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label="Tomar foto de una pregunta" onChange={(event) => handleAttachment(event.currentTarget.files?.[0])} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} aria-label="Adjuntar imagen o gráfico" title="Adjuntar imagen (JPG, PNG o WebP; máximo 1 MB)" className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition disabled:opacity-40 ${orbyAccent ? "hover:border-orange-300 hover:bg-orange-50" : "hover:border-sky-300 hover:bg-sky-50"}`}><Paperclip className="h-5 w-5" /></button>
        <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading} aria-label="Abrir cámara para escanear una pregunta" title="Tomar foto con la cámara" className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}><Camera className="h-5 w-5" /></button>
        {voiceEnabled && <button type="button" onClick={toggleVoiceInput} disabled={loading} aria-label={isListening ? "Detener dictado por voz" : "Hablar con Orby"} title={isListening ? "Detener dictado" : "Hablar con Orby"} className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${isListening ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse" : orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>}
        {voiceEnabled && <button type="button" onClick={toggleVoiceMode} aria-label={voiceMode ? "Desactivar respuestas habladas" : "Activar respuestas habladas"} title={voiceMode ? "Respuestas habladas activadas" : "Activar respuestas habladas"} className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition ${voiceMode ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}><Volume2 className="h-5 w-5" /></button>}
        <label className="sr-only" htmlFor="orby-tutor-message">Pregunta a Orby</label>
        <textarea ref={inputRef} id="orby-tutor-message" value={input} onPaste={(event) => {
          const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
          if (!imageItem) return;
          const pastedImage = imageItem.getAsFile();
          if (!pastedImage) return;
          event.preventDefault();
          const extension = pastedImage.type === "image/jpeg" ? "jpg" : pastedImage.type === "image/webp" ? "webp" : "png";
          handleAttachment(new File([pastedImage], "captura-" + Date.now() + "." + extension, { type: pastedImage.type }));
        }} onChange={(event) => { setInput(event.target.value); const element = event.currentTarget; element.style.height = "48px"; element.style.height = `${Math.min(element.scrollHeight, 112)}px`; }} maxLength={1200} rows={1} placeholder="Escribe tu pregunta o pega una imagen con Ctrl + V…" style={{ scrollbarWidth: "none" }} className={`min-h-12 max-h-28 flex-1 overflow-y-auto resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-5 text-slate-900 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:text-slate-400 ${orbyAccent ? "focus:border-orange-400 focus:ring-2 focus:ring-orange-100" : "focus:border-sky-400 focus:ring-2 focus:ring-sky-100"}`} />
        <button type="submit" disabled={(!input.trim() && !attachment) || loading} aria-label="Enviar mensaje a Orby" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${orbyAccent ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}><Send className="h-5 w-5" /></button>
      </form>
      <p className="shrink-0 bg-white px-4 pb-3 text-[10px] leading-4 text-slate-400">Orby es un apoyo de estudio; verifica siempre los datos y procedimientos de la lección.</p>
    </aside>
  );
}

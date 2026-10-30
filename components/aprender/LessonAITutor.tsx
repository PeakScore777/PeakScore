"use client";

import Image from "next/image";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Mic, MicOff, Paperclip, Send, Volume2, X } from "lucide-react";

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

export default function LessonAITutor({ subject, topic, stage = "theory", question = "", context = "", open, onOpenChange, initialPrompt, accent = "default", reviewQuestions = [] }: Props) {
  const orbyAccent = accent === "orby";
  const [notebookOpen, setNotebookOpen] = useState(false);
  const activeReviewRef = useRef<ReviewQuestion | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);\n  const [isListening, setIsListening] = useState(false);\n  const [voiceError, setVoiceError] = useState("");\n  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);\n  const [voiceMode, setVoiceMode] = useState(false);\n  const voiceModeRef = useRef(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageRef = useRef<(text: string, includeAttachment?: boolean) => Promise<void>>(async () => {});
  const lastInitialPromptRef = useRef<string | null>(null);\n  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
    setAttachmentPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  }

  function clearAttachment() {
    if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview("");
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  function stopSpeaking() {\n    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();\n    setSpeakingIndex(null);\n  }\n\n  function speakText(text: string, index: number) {\n    if (typeof window === "undefined" || !("speechSynthesis" in window)) {\n      setVoiceError("Tu navegador no tiene lectura de voz disponible.");\n      return;\n    }\n    stopSpeaking();\n    const clean = text.replace(/\*\*/g, "").replace(/`/g, "").replace(/^[-•]\s*/gm, "").replace(/^\d+[.)]\s*/gm, "").slice(0, 5000);\n    const utterance = new SpeechSynthesisUtterance(clean);\n    utterance.lang = "es-CO"; utterance.rate = 1; utterance.pitch = 1;\n    const voices = window.speechSynthesis.getVoices();\n    const spanishVoice = voices.find((voice) => voice.lang.toLowerCase() === "es-co") ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));\n    if (spanishVoice) utterance.voice = spanishVoice;\n    utterance.onend = () => setSpeakingIndex(null);\n    utterance.onerror = () => setSpeakingIndex(null);\n    setSpeakingIndex(index); window.speechSynthesis.speak(utterance);\n  }\n\n  function toggleVoiceMode() {\n    const next = !voiceModeRef.current;\n    voiceModeRef.current = next;\n    setVoiceMode(next);\n    if (!next) stopSpeaking();\n  }\n\n  function toggleVoiceInput() {\n    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }\n    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };\n    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;\n    if (!Recognition) { setVoiceError("Este navegador no admite dictado por voz. Prueba con Chrome o Edge, o escribe tu pregunta."); return; }\n    setVoiceError("");\n    const recognition = new Recognition();\n    recognition.lang = "es-CO"; recognition.continuous = false; recognition.interimResults = true;\n    recognition.onresult = (event) => {\n      const results = Array.from(event.results);\n      const transcript = results.map((result) => result[0]?.transcript ?? "").join(" ").trim();\n      if (!transcript) return;\n      setInput(transcript.slice(0, 1200));\n      if (results.some((result) => result[0]?.isFinal)) {\n        setIsListening(false); recognitionRef.current = null;\n        void sendMessageRef.current(transcript.slice(0, 1200));\n      }\n    };\n    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null; setVoiceError("No pude reconocer tu voz. Revisa el permiso del micrófono e inténtalo otra vez."); };\n    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };\n    recognitionRef.current = recognition;\n    try { recognition.start(); setIsListening(true); } catch { setIsListening(false); recognitionRef.current = null; setVoiceError("No se pudo activar el micrófono. Inténtalo de nuevo."); }\n  }\n  async function sendMessage(text: string, includeAttachment = false) {
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
          context: reviewContext,
          message,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
          ...(imagePayload ? { image: imagePayload } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Orby no está disponible por ahora.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta llegó incompleta. Inténtalo de nuevo.");
      const assistantIndex = nextMessages.length;\n      setMessages((current) => [...current, { role: "assistant", content: data.reply, checkQuestion: typeof data.checkQuestion === "string" ? data.checkQuestion : "" }]);\n      if (voiceModeRef.current && "speechSynthesis" in window) {\n        window.setTimeout(() => speakText(data.reply, assistantIndex), 120);\n      }
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
                {message.role === "assistant" && <button type="button" onClick={() => speakingIndex === index ? stopSpeaking() : speakText(message.content, index)} className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
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
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{attachment.name}</p><p className="text-[11px] text-slate-500">Listo para analizar · {(attachment.size / 1024).toFixed(0)} KB</p></div>
          <button type="button" onClick={clearAttachment} aria-label="Quitar imagen adjunta" className="rounded-full p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
        </div>
      </div>}
      {attachmentError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{attachmentError}</p>}\n      {voiceError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{voiceError}</p>}\n      {isListening && <p role="status" className="shrink-0 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">Te escucho… habla ahora. Al terminar, enviaré tu pregunta a Orby.</p>}
      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Adjuntar imagen" onChange={(event) => handleAttachment(event.currentTarget.files?.[0])} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} aria-label="Adjuntar imagen o gráfico" title="Adjuntar imagen (JPG, PNG o WebP; máximo 1 MB)" className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition disabled:opacity-40 ${orbyAccent ? "hover:border-orange-300 hover:bg-orange-50" : "hover:border-sky-300 hover:bg-sky-50"}`}><Paperclip className="h-5 w-5" /></button>
        <button type="button" onClick={toggleVoiceInput} disabled={loading} aria-label={isListening ? "Detener dictado por voz" : "Hablar con Orby"} title={isListening ? "Detener dictado" : "Hablar con Orby"} className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${isListening ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse" : orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button type="button" onClick={toggleVoiceMode} aria-label={voiceMode ? "Desactivar respuestas habladas" : "Activar respuestas habladas"} title={voiceMode ? "Respuestas habladas activadas" : "Activar respuestas habladas"} className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition ${voiceMode ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}><Volume2 className="h-5 w-5" /></button>\n        <label className="sr-only" htmlFor="orby-tutor-message">Pregunta a Orby</label>
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

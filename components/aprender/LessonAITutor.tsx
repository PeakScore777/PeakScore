"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, Send, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; checkQuestion?: string };

type Props = {
  subject: string;
  topic: string;
  stage?: "theory" | "practice";
  question?: string;
  context?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function LessonAITutor({ subject, topic, stage = "theory", question = "", context = "", open, onOpenChange }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading || message.length > 1200) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "48px";
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/lesson-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          subject, topic, stage, question, context, message,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Orby no está disponible por ahora.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta llegó incompleta. Inténtalo de nuevo.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply, checkQuestion: typeof data.checkQuestion === "string" ? data.checkQuestion : "" }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocurrió un error. Inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  if (!open) return null;

  return (
    <aside id="orby-tutor-panel" aria-label="Tutor de inteligencia artificial Orby" className="fixed inset-x-3 bottom-[76px] z-[60] flex max-h-[min(720px,calc(100dvh-100px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.5)] sm:inset-x-auto sm:right-5 sm:top-[88px] sm:bottom-[82px] sm:w-[390px] lg:right-7 lg:w-[410px]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-sky-300 bg-white shadow-[0_0_0_3px_rgba(14,165,233,.12)]">
            <img src="/avatars/photo_perfil/orbyp.png" alt="Avatar de Orby" className="h-full w-full object-contain object-center" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-950">Orby <span className="text-sky-600">●</span></p>
            <p className="truncate text-xs text-slate-500">Tutor de ciencias · Saber 11</p>
          </div>
        </div>
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar tutor Orby" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] px-4 py-4" ref={scrollRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center">
            <img src="/avatars/photo_perfil/orbyp.png" alt="Orby, tutor de PeakScore" className="mb-2 h-28 w-28 rounded-full border-2 border-sky-200 bg-white object-contain object-center shadow-[0_4px_18px_rgba(14,165,233,.16)]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
            <div className="w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-base font-extrabold text-slate-950">¡Hola! Soy Orby 👋</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Te ayudo a comprender la teoría, analizar los datos y razonar tu respuesta. ¿Qué parte revisamos juntos?</p>
            </div>
            <div className="mt-4 grid w-full gap-2">
              {starters.map((starter) => (
                <button key={starter} type="button" disabled={loading} onClick={() => void sendMessage(starter)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">✦</span>{starter}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <article key={index} className={message.role === "user" ? "ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-sky-600 px-3 py-3 text-white" : "mr-auto max-w-[96%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm"}>
                <p className={message.role === "user" ? "mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-100" : "mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-700"}>{message.role === "user" ? "Tú" : "Orby · Tutor PeakScore"}</p>
                <div className="break-words text-[13px] leading-[1.75] sm:text-sm">{renderTutorContent(message.content)}</div>
                {message.checkQuestion && <div className="mt-3 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"><strong>Comprueba lo aprendido:</strong> {message.checkQuestion}</div>}
              </article>
            ))}
            {loading && <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Orby está preparando una explicación…</div>}
          </div>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
        <label className="sr-only" htmlFor="orby-tutor-message">Pregunta a Orby</label>
        <textarea ref={inputRef} id="orby-tutor-message" value={input} onChange={(event) => { setInput(event.target.value); const element = event.currentTarget; element.style.height = "48px"; element.style.height = `${Math.min(element.scrollHeight, 112)}px`; }} maxLength={1200} rows={1} placeholder="Escribe tu pregunta aquí…" style={{ scrollbarWidth: "none" }} className="min-h-12 max-h-28 flex-1 overflow-y-auto resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-5 text-slate-900 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensaje a Orby" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-5 w-5" /></button>
      </form>
      <p className="shrink-0 bg-white px-4 pb-3 text-[10px] leading-4 text-slate-400">Orby es un apoyo de estudio; verifica siempre los datos y procedimientos de la lección.</p>
    </aside>
  );
}

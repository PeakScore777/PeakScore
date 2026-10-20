"use client";

import { FormEvent, useState } from "react";
import { Bot, BookOpen, LoaderCircle, Send, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; checkQuestion?: string };

type Props = {
  subject: string;
  topic: string;
  stage?: "theory" | "practice";
  question?: string;
  context?: string;
};

const starters = [
  "Explícamelo desde cero",
  "Dame un ejemplo paso a paso",
  "¿Cómo lo preguntan en Saber 11?",
  "¿Cuáles son los errores más comunes?",
];

export default function LessonAITutor({ subject, topic, stage = "theory", question = "", context = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/lesson-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          stage,
          question,
          context,
          message,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "No pudimos contactar al profesor.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply, checkQuestion: data.checkQuestion }]);
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

  return (
    <section className="my-8 overflow-hidden border border-cyan-300/25 bg-[#0b1320] shadow-[0_12px_35px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-cyan-200/15 bg-gradient-to-r from-[#112b3b] to-[#111827] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-cyan-200/30 bg-cyan-300/10 text-cyan-200">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Profesor PeakScore</p>
            <p className="mt-1 text-xs text-cyan-100/70">Tutor de la lección · Saber 11</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex min-h-9 items-center gap-2 border border-cyan-200/25 px-3 text-xs font-bold text-cyan-100 transition hover:bg-cyan-200/10">
          {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {open ? "Cerrar" : "Preguntar"}
        </button>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/[.025] sm:px-5">
          <BookOpen className="mt-1 h-5 w-5 shrink-0 text-cyan-200" />
          <span className="text-sm leading-6 text-slate-300">¿Algo no te quedó claro? Pídele que lo explique de otra manera, resuelva un ejemplo contigo o te enseñe a reconocer la estrategia que evalúa Saber 11.</span>
        </button>
      ) : (
        <div className="p-4 sm:p-5">
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="mb-3 text-sm leading-6 text-slate-300">Estoy aquí para ayudarte a entender <strong className="text-white">{topic}</strong>. No se trata de memorizar: vamos a comprender el concepto y practicar cómo razonarlo.</p>
              <div className="flex flex-wrap gap-2">
                {starters.map((starter) => (
                  <button key={starter} type="button" disabled={loading} onClick={() => void sendMessage(starter)} className="border border-cyan-200/20 bg-cyan-200/[.04] px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-200/10 disabled:opacity-50">{starter}</button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[380px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((message, index) => (
              <article key={index} className={message.role === "user" ? "ml-auto max-w-[92%] border border-cyan-200/15 bg-[#14283a] p-3" : "mr-auto max-w-[96%] border border-white/10 bg-[#101725] p-4"}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-cyan-200/75">{message.role === "user" ? "Tu pregunta" : "Profesor PeakScore"}</p>
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{message.content}</div>
                {message.checkQuestion && <div className="mt-3 border-l-2 border-amber-300/70 bg-amber-200/[.05] px-3 py-2 text-sm leading-6 text-amber-100"><strong>Comprueba lo aprendido:</strong> {message.checkQuestion}</div>}
              </article>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-cyan-100" role="status"><LoaderCircle className="h-4 w-4 animate-spin" /> El profesor está preparando una explicación...</div>}
          </div>

          {error && <p role="alert" className="mt-3 border border-rose-300/20 bg-rose-300/[.06] px-3 py-2 text-sm text-rose-200">{error}</p>}

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row">
            <label className="sr-only" htmlFor="peakscore-tutor-message">Pregunta al profesor</label>
            <textarea id="peakscore-tutor-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1200} rows={2} placeholder="Ej. No entiendo por qué se divide la masa entre el volumen..." className="min-h-12 flex-1 resize-y border border-white/15 bg-[#080e19] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60" />
            <button type="submit" disabled={!input.trim() || loading} className="inline-flex min-h-12 items-center justify-center gap-2 bg-cyan-300 px-4 py-3 text-sm font-extrabold text-[#06121a] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /> Enviar</button>
          </form>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">El tutor puede equivocarse. Contrasta los procedimientos con la explicación de la lección y los datos del enunciado.</p>
        </div>
      )}
    </section>
  );
}

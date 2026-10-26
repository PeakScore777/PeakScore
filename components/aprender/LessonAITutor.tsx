"use client";

import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle, MessageCircle, Send, X } from "lucide-react";

type LessonAITutorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  topic: string;
  stage: "theory" | "practice";
  question: string;
  context: string;
};

export default function LessonAITutor({
  open,
  onOpenChange,
  subject,
  topic,
  stage,
  question,
  context,
}: LessonAITutorProps) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setError("");
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onOpenChange(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, loading, onOpenChange]);

  async function askOrby() {
    if (loading) return;
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/lesson-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic, stage, question, context }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        answer?: string;
        error?: string;
      };

      if (!response.ok || !data.success || typeof data.answer !== "string") {
        throw new Error(data.error || "Orby no pudo preparar la explicación.");
      }

      setAnswer(data.answer);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos conectar con Orby en este momento.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onOpenChange(false);
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="orby-lesson-tutor-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-cyan-200/25 bg-[#0d1422] text-white shadow-[0_24px_80px_rgba(0,0,0,.5)]"
      >
        <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-white/10 bg-[#101a2a]/95 px-5 py-4 backdrop-blur">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-200">
              Orby · apoyo de la lección
            </p>
            <h2 id="orby-lesson-tutor-title" className="mt-1 text-lg font-black">
              Vamos a razonar juntos
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {subject} · {topic}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            aria-label="Cerrar tutor"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="border-l-2 border-cyan-200/60 bg-cyan-200/[.05] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-100">
              <BookOpen className="h-4 w-4" />
              {stage === "theory" ? "Aclarar un concepto" : "Analizar la pregunta"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {question}
            </p>
          </div>

          {context && (
            <details className="border border-white/10 bg-white/[.02]">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/[.03]">
                Ver contexto y opciones
              </summary>
              <p className="whitespace-pre-wrap border-t border-white/10 px-4 py-3 text-xs leading-6 text-slate-400">
                {context}
              </p>
            </details>
          )}

          {!answer && (
            <p className="text-sm leading-6 text-slate-400">
              Orby te ayudará a entender los datos, revisar los pasos y encontrar una estrategia, sin limitarse a darte una respuesta suelta.
            </p>
          )}

          {loading && (
            <div className="flex items-center gap-3 border border-cyan-200/20 bg-cyan-200/[.04] p-4 text-sm text-cyan-100">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Orby está preparando una explicación…
            </div>
          )}

          {error && (
            <p role="alert" className="border border-amber-200/25 bg-amber-100/[.06] p-3 text-sm leading-6 text-amber-100">
              {error}
            </p>
          )}

          {answer && (
            <div className="border border-emerald-200/20 bg-emerald-100/[.04] p-4 sm:p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-100">
                <MessageCircle className="h-4 w-4" />
                Explicación de Orby
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                {answer}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void askOrby()}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-cyan-200 bg-cyan-200 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {answer ? "Preparar otra explicación" : "Preguntar a Orby"}
          </button>
        </div>
      </section>
    </div>
  );
}

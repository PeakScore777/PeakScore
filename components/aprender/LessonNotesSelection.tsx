"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Highlighter, X } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type HighlightColor = "yellow" | "cyan" | "purple" | "green";

const COLORS: { id: HighlightColor; label: string; swatch: string; ring: string }[] = [
  { id: "yellow", label: "Amarillo", swatch: "#facc15", ring: "ring-yellow-300" },
  { id: "purple", label: "Morado", swatch: "#c084fc", ring: "ring-purple-300" },
  { id: "cyan", label: "Azul", swatch: "#22d3ee", ring: "ring-cyan-300" },
  { id: "green", label: "Verde", swatch: "#4ade80", ring: "ring-green-300" },
];

export default function LessonNotesSelection({
  children,
  sourceTitle,
  sourcePath,
}: {
  children: ReactNode;
  sourceTitle: string;
  sourcePath: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-note-popover]")) return;
    window.setTimeout(() => {
      const current = window.getSelection();
      const text = current?.toString().trim() ?? "";
      if (!text || text.length > 5000 || !current?.rangeCount || !rootRef.current) {
        setSelection(null);
        return;
      }
      const range = current.getRangeAt(0);
      if (!rootRef.current.contains(range.commonAncestorContainer)) return;
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        x: Math.min(Math.max(12, rect.left), window.innerWidth - 340),
        y: Math.min(rect.bottom + 10, window.innerHeight - 300),
      });
      setMessage("");
    }, 0);
  }

  async function saveSelection() {
    if (!selection || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setMessage("Inicia sesión para guardar notas en tu cuaderno.");
        return;
      }
      const { error } = await supabase.from("study_notes").insert({
        user_id: user.id,
        selected_text: selection.text,
        note_text: noteText.trim(),
        highlight_color: color,
        source_title: sourceTitle,
        source_path: sourcePath,
      });
      if (error) throw error;
      setSelection(null);
      setNoteText("");
      window.getSelection()?.removeAllRanges();
      setMessage("¡Guardado en Mi cuaderno!");
      window.setTimeout(() => setMessage(""), 3500);
    } catch (error) {
      console.error("No se pudo guardar la nota:", error);
      setMessage("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={rootRef} onMouseUp={handleMouseUp} className="relative">
      {children}
      {message && !selection && (
        <div role="status" className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 border border-cyan-200/25 bg-[#111827] px-4 py-3 text-sm text-cyan-100 shadow-xl">
          {message}
          {message.includes("Mi cuaderno") && <Link href="/perfil/cuaderno" className="ml-2 underline">Ver</Link>}
        </div>
      )}
      {selection && (
        <div
          data-note-popover
          role="dialog"
          aria-label="Guardar fragmento en Mi cuaderno"
          className="fixed z-[110] w-[min(320px,calc(100vw-24px))] border border-[#3b455b] bg-[#111827] p-4 text-slate-100 shadow-2xl"
          style={{ left: selection.x, top: selection.y }}
          onMouseUp={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><Highlighter className="h-4 w-4 text-cyan-200" /> Guardar resaltado</p>
            <button type="button" onClick={() => setSelection(null)} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 max-h-20 overflow-auto border-l-2 px-3 py-2 text-xs leading-5 text-slate-200" style={{ borderColor: COLORS.find((item) => item.id === color)?.swatch, backgroundColor: `${COLORS.find((item) => item.id === color)?.swatch}18` }}>
            {selection.text}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-400">Elige un color</p>
          <div className="mt-2 flex items-center gap-3">
            {COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={color === item.id}
                onClick={() => setColor(item.id)}
                className={`flex size-7 items-center justify-center rounded-full border border-white/15 transition ${color === item.id ? "ring-2 ring-offset-2 ring-offset-[#111827]" : "hover:scale-110"}`}
                style={{ backgroundColor: item.swatch, ...(color === item.id ? { outline: "2px solid white", outlineOffset: "2px" } : {}) }}
              >
                {color === item.id && <Check className="h-4 w-4 text-[#10131b]" />}
              </button>
            ))}
          </div>
          <label htmlFor="study-note-text" className="mt-3 block text-xs font-medium text-slate-400">Añade una nota (opcional)</label>
          <textarea
            id="study-note-text"
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            maxLength={5000}
            rows={2}
            placeholder="¿Qué quieres recordar?"
            className="mt-2 w-full resize-y border border-white/10 bg-[#090e18] px-3 py-2 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-cyan-200/50"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link href="/perfil/cuaderno" className="text-[11px] text-slate-400 underline decoration-dotted underline-offset-4 hover:text-white">Mi cuaderno</Link>
            <button type="button" onClick={saveSelection} disabled={saving} className="inline-flex items-center gap-2 bg-cyan-300 px-3 py-2 text-xs font-bold text-[#07111b] transition hover:bg-cyan-200 disabled:opacity-50">
              <BookmarkPlus className="h-3.5 w-3.5" /> {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {message && <p role="status" className="mt-2 text-xs text-amber-200">{message}</p>}
        </div>
      )}
    </div>
  );
}

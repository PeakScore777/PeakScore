"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { BookmarkCheck, Highlighter, NotebookPen } from "lucide-react";

type SavedLessonNote = {
  id: string;
  text: string;
  sourceTitle: string;
  sourcePath: string;
  savedAt: string;
};

type LessonNotesSelectionProps = {
  sourceTitle: string;
  sourcePath: string;
  children: ReactNode;
};

const STORAGE_KEY = "peakscore:lesson-notes";

export default function LessonNotesSelection({
  sourceTitle,
  sourcePath,
  children,
}: LessonNotesSelectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState("");
  const [status, setStatus] = useState("");

  function captureSelection(event: MouseEvent<HTMLDivElement>) {
    const selected = window.getSelection();
    const text = selected?.toString().trim() ?? "";
    const anchor = selected?.anchorNode ?? null;

    if (
      text.length > 0 &&
      anchor &&
      contentRef.current?.contains(anchor) &&
      text.length <= 6000
    ) {
      setSelection(text);
      setStatus("");
    } else {
      setSelection("");
    }
  }

  function saveSelection() {
    if (!selection) return;

    try {
      const parsed = window.localStorage.getItem(STORAGE_KEY);
      const previous: SavedLessonNote[] = parsed
        ? (JSON.parse(parsed) as SavedLessonNote[])
        : [];
      const next: SavedLessonNote[] = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          text: selection,
          sourceTitle,
          sourcePath,
          savedAt: new Date().toISOString(),
        },
        ...previous.filter(
          (note) =>
            note.text !== selection ||
            note.sourcePath !== sourcePath,
        ),
      ].slice(0, 100);

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSelection("");
      window.getSelection()?.removeAllRanges();
      setStatus("Fragmento guardado en tus notas de estudio.");
    } catch {
      setStatus("No fue posible guardar la nota en este dispositivo.");
    }
  }

  return (
    <div ref={contentRef} onMouseUp={captureSelection} className="relative">
      {children}

      {(selection || status) && (
        <div className="sticky bottom-20 z-30 mt-5 flex flex-wrap items-center gap-3 border border-cyan-200/25 bg-[#111b2b]/95 p-3 shadow-xl backdrop-blur">
          {selection ? (
            <>
              <div className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-5 text-slate-200">
                <Highlighter className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                <span>Seleccionaste un fragmento de la lección.</span>
              </div>
              <button
                type="button"
                onClick={saveSelection}
                className="inline-flex min-h-9 items-center gap-2 border border-cyan-200/40 bg-cyan-200 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-100"
              >
                <NotebookPen className="h-4 w-4" />
                Guardar en mis notas
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelection("");
                  window.getSelection()?.removeAllRanges();
                }}
                className="min-h-9 border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </button>
            </>
          ) : (
            <p role="status" className="flex items-center gap-2 text-xs leading-5 text-emerald-100">
              <BookmarkCheck className="h-4 w-4 shrink-0" />
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

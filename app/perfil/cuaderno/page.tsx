"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, Highlighter, LoaderCircle, Search, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type StudyNote = {
  id: string;
  selected_text: string;
  note_text: string;
  highlight_color: "yellow" | "cyan" | "purple" | "green";
  source_title: string;
  source_path: string;
  created_at: string;
};

const COLOR_MAP = {
  yellow: { label: "Amarillo", color: "#facc15", bg: "rgba(250,204,21,.10)" },
  cyan: { label: "Azul", color: "#22d3ee", bg: "rgba(34,211,238,.10)" },
  purple: { label: "Morado", color: "#c084fc", bg: "rgba(192,132,252,.10)" },
  green: { label: "Verde", color: "#4ade80", bg: "rgba(74,222,128,.10)" },
};

export default function MiCuadernoPage() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setError("Inicia sesión para consultar las notas guardadas en tu cuenta.");
        setNotes([]);
        return;
      }
      const { data, error: notesError } = await supabase
        .from("study_notes")
        .select("id, selected_text, note_text, highlight_color, source_title, source_path, created_at")
        .order("created_at", { ascending: false });
      if (notesError) throw notesError;
      setNotes((data ?? []) as StudyNote[]);
    } catch (cause) {
      console.error("No se pudieron cargar las notas:", cause);
      setError("No pudimos cargar tu cuaderno. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return notes;
    return notes.filter((note) =>
      [note.selected_text, note.note_text, note.source_title].some((value) =>
        value.toLocaleLowerCase("es").includes(needle)
      )
    );
  }, [notes, query]);

  async function deleteNote(noteId: string) {
    if (deleting) return;
    setDeleting(noteId);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("study_notes").delete().eq("id", noteId);
      if (deleteError) throw deleteError;
      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch (cause) {
      console.error("No se pudo eliminar la nota:", cause);
      setError("No se pudo eliminar esta nota. Inténtalo de nuevo.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] px-4 pb-28 pt-8 text-[#e8edf7] sm:px-7 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/aprender/santuario-de-la-materia/leccion/1" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-100">
          <ArrowLeft className="h-4 w-4" /> Volver a la lección
        </Link>

        <header className="mt-7 flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-200">Tu espacio de estudio</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Mi cuaderno</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Todos los fragmentos que resaltes y guardes en tus lecciones, junto con tus propias notas. Solo tú puedes verlos.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 border border-white/10 bg-[#101725] px-4 py-3">
            <BookOpen className="h-5 w-5 text-cyan-200" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Guardados</p>
              <p className="text-xl font-bold text-white">{notes.length}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en tus resaltados y notas…" className="w-full border border-white/10 bg-[#0d1320] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-200/40" />
          </label>
          <button type="button" onClick={() => { setLoading(true); setError(""); void loadNotes(); }} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/10 bg-[#151c2b] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#202b3f] disabled:opacity-50">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LoaderCircle className="h-4 w-4" />} Actualizar
          </button>
        </div>

        {error && <div role="alert" className="mt-5 border border-amber-200/20 bg-amber-200/[.05] px-4 py-3 text-sm text-amber-100">{error}</div>}

        {loading ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse border border-white/[.06] bg-[#101725]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <section className="mt-8 flex flex-col items-center border border-dashed border-white/15 bg-[#0d1320] px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center border border-cyan-200/15 bg-cyan-200/[.05]"><Highlighter className="h-6 w-6 text-cyan-200" /></div>
            <h2 className="mt-5 text-lg font-bold text-white">{query ? "No encontramos coincidencias" : "Tu cuaderno empieza aquí"}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{query ? "Prueba con otra palabra o limpia la búsqueda." : "En una lección, selecciona con el cursor una frase importante. Elige el color, añade una nota si quieres y pulsa Guardar."}</p>
            {!query && <Link href="/aprender/santuario-de-la-materia/leccion/1" className="mt-5 inline-flex items-center gap-2 bg-cyan-300 px-4 py-3 text-sm font-bold text-[#07111b] transition hover:bg-cyan-200">Ir a la lección <ArrowLeft className="h-4 w-4 rotate-180" /></Link>}
          </section>
        ) : (
          <div className="mt-7 grid items-start gap-4 md:grid-cols-2">
            {filtered.map((note) => {
              const color = COLOR_MAP[note.highlight_color] ?? COLOR_MAP.yellow;
              return (
                <article key={note.id} className="relative border border-white/10 bg-[#0d1320] p-5 transition hover:border-white/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-300">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color.color }} />
                      <span className="truncate">{note.source_title}</span>
                    </div>
                    <button type="button" onClick={() => void deleteNote(note.id)} disabled={deleting === note.id} aria-label="Eliminar nota" title="Eliminar nota" className="flex size-8 shrink-0 items-center justify-center border border-white/10 text-slate-500 transition hover:border-rose-300/30 hover:text-rose-200 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <blockquote className="mt-4 border-l-[3px] px-4 py-3 text-sm leading-7 text-slate-100" style={{ borderColor: color.color, backgroundColor: color.bg }}>
                    {note.selected_text}
                  </blockquote>
                  {note.note_text && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{note.note_text}</p>}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[.07] pt-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(note.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {note.source_path && <Link href={note.source_path} className="text-cyan-200 underline decoration-dotted underline-offset-4 hover:text-cyan-100">Abrir lección</Link>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, BookOpen, CheckCircle2, FileText, ImagePlus, LoaderCircle,
  Plus, Save, Trash2, Upload,
} from "lucide-react";
import type { ArchivoContentBlock } from "@/lib/games/archivo-oculto-bank";

type GameKey =
  | "archivo-oculto"
  | "que-es-esa-vaina"
  | "caso-cero"
  | "operacion-rescate"
  | "mapa-de-decisiones"
  | "mision-global";

type Passage = {
  id: string;
  title: string;
  reading_type: string;
  source_label: string;
  content_blocks: ArchivoContentBlock[];
  status: "draft" | "published" | "archived";
};

type Question = {
  id: string;
  game_key: GameKey;
  passage_id: string | null;
  subject: string;
  topic: string;
  difficulty: "facil" | "media" | "dificil";
  clue: string;
  options: string[];
  answer: number;
  explanation: string;
  hint: string;
  competency: string | null;
  competency_short: string | null;
  image_url: string | null;
  status: "draft" | "published" | "archived";
};

const GAMES: { key: GameKey; label: string; subject: string }[] = [
  { key: "archivo-oculto", label: "El Archivo Oculto", subject: "Lectura Crítica" },
  { key: "caso-cero", label: "Caso Cero", subject: "Ciencias Naturales" },
  { key: "operacion-rescate", label: "Operación Rescate", subject: "Matemáticas" },
  { key: "mapa-de-decisiones", label: "Mapa de Decisiones", subject: "Sociales y Ciudadanas" },
  { key: "mision-global", label: "Misión Global", subject: "Inglés" },
  { key: "que-es-esa-vaina", label: "¿Qué es esa vaina?", subject: "Mixto" },
];

const emptyQuestion = (gameKey: GameKey) => ({
  gameKey,
  passageId: "",
  subject: GAMES.find((game) => game.key === gameKey)?.subject ?? "Mixto",
  topic: "",
  difficulty: "media" as const,
  prompt: "",
  options: ["", "", "", ""],
  answer: 0,
  explanation: "",
  hint: "Vuelve al texto y busca la evidencia.",
  competency: "",
  competencyShort: "",
  imageUrl: "",
});

const field = "w-full border border-[#5a503e] bg-[#17130e] px-3 py-2.5 text-sm text-[#f5e6c7] outline-none transition focus:border-[#d4ab68]";
const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]";
const button = "inline-flex min-h-10 items-center justify-center gap-2 border border-[#a88450] bg-[#4a351e] px-3 py-2 text-xs font-bold text-[#f7e7c6] transition hover:bg-[#614625] disabled:cursor-not-allowed disabled:opacity-45";

export default function AdminGamesWorkspace() {
  const [gameKey, setGameKey] = useState<GameKey>("archivo-oculto");
  const [tab, setTab] = useState<"passages" | "questions">("passages");
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPassage, setSavingPassage] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passageForm, setPassageForm] = useState({
    title: "",
    readingType: "Texto argumentativo",
    sourceLabel: "Texto original de práctica · PeakScore",
    contentBlocks: [] as ArchivoContentBlock[],
  });
  const [questionForm, setQuestionForm] = useState(emptyQuestion("archivo-oculto"));

  const currentGame = GAMES.find((game) => game.key === gameKey)!;
  const isReadingGame = gameKey === "archivo-oculto";
  const questionCountByPassage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const question of questions) {
      if (question.passage_id) counts.set(question.passage_id, (counts.get(question.passage_id) ?? 0) + 1);
    }
    return counts;
  }, [questions]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/game-content?gameKey=" + encodeURIComponent(gameKey), {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el contenido.");
      setPassages(Array.isArray(data.passages) ? data.passages : []);
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el contenido.");
    } finally {
      setLoading(false);
    }
  }, [gameKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  useEffect(() => {
    setQuestionForm(emptyQuestion(gameKey));
    setPassageForm({
      title: "",
      readingType: "Texto argumentativo",
      sourceLabel: "Texto original de práctica · PeakScore",
      contentBlocks: [],
    });
    setTab(gameKey === "archivo-oculto" ? "passages" : "questions");
    setNotice("");
    setError("");
  }, [gameKey]);

  const addParagraph = () => {
    setPassageForm((current) => ({
      ...current,
      contentBlocks: [...current.contentBlocks, { type: "paragraph", text: "" }],
    }));
  };

  const addImage = () => {
    setPassageForm((current) => ({
      ...current,
      contentBlocks: [...current.contentBlocks, { type: "image", url: "", alt: "", caption: "", layout: "float" }],
    }));
  };

  const patchBlock = (index: number, patch: Record<string, unknown>) => {
    setPassageForm((current) => ({
      ...current,
      contentBlocks: current.contentBlocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } as unknown as ArchivoContentBlock : block
      ),
    }));
  };

  const removeBlock = (index: number) => {
    setPassageForm((current) => ({
      ...current,
      contentBlocks: current.contentBlocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const uploadBlockImage = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploading(index);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/game-content/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.url !== "string") throw new Error(data.error ?? "No se pudo subir la imagen.");
      patchBlock(index, { url: data.url });
      setNotice("Imagen subida y añadida a la lectura.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(null);
    }
  };

  const savePassage = async () => {
    setSavingPassage(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/game-content", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "passage", passage: passageForm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la lectura.");
      setNotice("Lectura guardada como borrador. Ahora añade al menos cinco preguntas.");
      setPassageForm({
        title: "",
        readingType: "Texto argumentativo",
        sourceLabel: "Texto original de práctica · PeakScore",
        contentBlocks: [],
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la lectura.");
    } finally {
      setSavingPassage(false);
    }
  };

  const patchQuestionField = (key: string, value: unknown) => {
    setQuestionForm((current) => ({ ...current, [key]: value }));
  };

  const saveQuestion = async () => {
    setSavingQuestion(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/game-content", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "question", question: questionForm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la pregunta.");
      setNotice("Pregunta guardada como borrador. Puedes seguir añadiendo preguntas.");
      setQuestionForm((current) => ({
        ...emptyQuestion(gameKey),
        passageId: current.passageId,
        subject: current.subject,
        topic: current.topic,
        competency: current.competency,
        competencyShort: current.competencyShort,
      }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la pregunta.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const passageAction = async (passageId: string, action: "publish-passage" | "passage-status", status?: string) => {
    setPublishingId(passageId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/game-content", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, passageId, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo cambiar el estado.");
      setNotice(action === "publish-passage"
        ? "Lectura y sus preguntas publicadas."
        : status === "archived" ? "Lectura archivada." : "Lectura devuelta a borrador.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado.");
    } finally {
      setPublishingId(null);
    }
  };

  const questionAction = async (questionId: string, status: "published" | "draft" | "archived") => {
    setPublishingId(questionId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/game-content", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "question-status", questionId, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo cambiar el estado.");
      setNotice(status === "published" ? "Pregunta publicada." : "Estado actualizado.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado.");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <main className="min-h-[calc(100svh-72px)] bg-[#120e0a] px-4 py-7 text-[#f4e6ca] sm:px-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#d1a762]">PeakScore · Administración</p>
            <h1 className="mt-2 font-serif text-3xl font-black sm:text-4xl">Estudio de contenidos</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#b9a789]">Crea bancos de preguntas para todos los juegos, publica lecturas y añade imágenes sin modificar el código.</p>
          </div>
          <div className="border border-[#6d512f] bg-[#24190f] px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Elementos de este juego</p>
            <p className="mt-1 text-2xl font-black text-[#f0d394]">{passages.length + questions.length}</p>
          </div>
        </header>

        <section className="mb-6 border border-[#765a35] bg-[#21170f] p-4 sm:p-5">
          <label className={label}>Juego que vas a administrar</label>
          <select value={gameKey} onChange={(event) => setGameKey(event.target.value as GameKey)} className={field + " max-w-xl"}>
            {GAMES.map((game) => <option key={game.key} value={game.key}>{game.label}</option>)}
          </select>
          <p className="mt-2 text-[11px] text-[#a99574]">Las preguntas se guardan en un banco independiente por juego. Los borradores no se muestran a estudiantes.</p>
        </section>

        {isReadingGame && (
          <div className="mb-5 flex flex-wrap gap-2 border-b border-[#5a452c]">
            <button type="button" onClick={() => setTab("passages")} className={"border-b-2 px-4 py-3 text-xs font-bold " + (tab === "passages" ? "border-[#d7ae67] text-[#f5d79d]" : "border-transparent text-[#a99574]")}>
              <BookOpen className="mr-2 inline h-4 w-4"/> Lecturas
            </button>
            <button type="button" onClick={() => setTab("questions")} className={"border-b-2 px-4 py-3 text-xs font-bold " + (tab === "questions" ? "border-[#d7ae67] text-[#f5d79d]" : "border-transparent text-[#a99574]")}>
              <FileText className="mr-2 inline h-4 w-4"/> Preguntas
            </button>
          </div>
        )}

        {error && <p role="alert" className="mb-4 border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="mb-4 border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

        {isReadingGame && tab === "passages" ? (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
            <section className="border border-[#765a35] bg-[#21170f] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d1a762]">Nuevo expediente de lectura</p>
                  <h2 className="mt-1 font-serif text-xl font-bold">Crear lectura</h2>
                </div>
                <BookOpen className="h-6 w-6 text-[#d0aa68]"/>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className={label}>Título del texto</span><input className={field} maxLength={180} value={passageForm.title} onChange={(e) => setPassageForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej. El lenguaje de las ciudades"/></label>
                <label><span className={label}>Tipo de texto</span><select className={field} value={passageForm.readingType} onChange={(e) => setPassageForm((p) => ({ ...p, readingType: e.target.value }))}><option>Texto argumentativo</option><option>Texto expositivo</option><option>Texto narrativo</option><option>Texto informativo</option><option>Texto discontinuo</option><option>Artículo de opinión</option><option>Infografía</option></select></label>
                <label><span className={label}>Autor / procedencia</span><input className={field} maxLength={180} value={passageForm.sourceLabel} onChange={(e) => setPassageForm((p) => ({ ...p, sourceLabel: e.target.value }))}/></label>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-[#5b452b] py-3">
                <div><h3 className="text-sm font-bold">Contenido de las páginas</h3><p className="mt-1 text-[10px] text-[#a99574]">Combina párrafos e imágenes en el orden en que deben aparecer.</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addParagraph} className={button}><Plus className="h-4 w-4"/> Párrafo</button>
                  <button type="button" onClick={addImage} className={button}><ImagePlus className="h-4 w-4"/> Imagen</button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {passageForm.contentBlocks.length === 0 && <div className="border border-dashed border-[#765a35] p-8 text-center text-sm text-[#a99574]">Añade el primer párrafo o una imagen para construir las páginas.</div>}
                {passageForm.contentBlocks.map((block, index) => (
                  <div key={index} className="border border-[#5b452b] bg-[#17120d] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#d1a762]">{block.type === "paragraph" ? "Párrafo " + (index + 1) : "Imagen " + (index + 1)}</p>
                      <button type="button" onClick={() => removeBlock(index)} aria-label="Eliminar bloque" className="border border-rose-900/70 p-1.5 text-rose-300 hover:bg-rose-950"><Trash2 className="h-4 w-4"/></button>
                    </div>
                    {block.type === "paragraph" ? (
                      <textarea rows={5} className={field} value={block.text} maxLength={5000} onChange={(e) => patchBlock(index, { text: e.target.value })} placeholder="Escribe un párrafo del texto..."/>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                        <div className="flex min-h-28 items-center justify-center border border-dashed border-[#765a35] bg-[#21170f] p-2">
                          {block.url ? <Image src={block.url} alt={block.alt || "Vista previa"} width={150} height={110} unoptimized className="max-h-32 w-auto object-contain"/> : <ImagePlus className="h-8 w-8 text-[#94784f]"/>}
                        </div>
                        <div className="space-y-2">
                          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#ead6b1]">
                            <Upload className="h-4 w-4"/> {uploading === index ? "Subiendo imagen…" : "Subir PNG, JPG o WebP"}
                            <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading !== null} className="sr-only" onChange={(e) => { void uploadBlockImage(index, e.target.files?.[0]); e.currentTarget.value = ""; }}/>
                          </label>
                          <input className={field} value={block.alt} onChange={(e) => patchBlock(index, { alt: e.target.value })} placeholder="Descripción accesible de la imagen"/>
                          <input className={field} value={block.caption ?? ""} onChange={(e) => patchBlock(index, { caption: e.target.value })} placeholder="Pie de imagen (opcional)"/>
                          <select className={field} value={block.layout ?? "float"} onChange={(e) => patchBlock(index, { layout: e.target.value as "float" | "wide" })}>
                            <option value="float">Imagen integrada junto al texto</option>
                            <option value="wide">Imagen ancha entre párrafos</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => void savePassage()} disabled={savingPassage || passageForm.contentBlocks.length === 0} className={button + " mt-5 w-full border-[#dfbd80] bg-[#866035] py-3 text-[11px] uppercase tracking-wider text-[#fff0d0]"}>
                {savingPassage ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Guardar lectura como borrador
              </button>
            </section>

            <section className="border border-[#765a35] bg-[#21170f] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-xl font-bold">Biblioteca de lecturas</h2><button type="button" onClick={() => void load()} className="text-[10px] font-bold text-[#d5b57f] hover:text-white">Actualizar</button></div>
              {loading ? <p className="text-sm text-[#b9a789]">Cargando lecturas…</p> : passages.length === 0 ? (
                <div className="border border-dashed border-[#765a35] p-6 text-center text-sm text-[#a99574]">Aún no hay lecturas. Crea la primera en el editor.</div>
              ) : (
                <div className="space-y-3">
                  {passages.map((passage) => {
                    const count = questionCountByPassage.get(passage.id) ?? 0;
                    const ready = count >= 5;
                    return (
                      <article key={passage.id} className="border border-[#5b452b] bg-[#17120d] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={"border px-2 py-1 text-[9px] font-bold uppercase tracking-wider " + (passage.status === "published" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : passage.status === "archived" ? "border-slate-700 text-slate-400" : "border-[#7a5a2e] text-[#e3bd7c]")}>{passage.status === "published" ? "Publicada" : passage.status === "archived" ? "Archivada" : "Borrador"}</span>
                          <span className="text-[10px] text-[#ac936b]">{count} preguntas · {ready ? "Lista para publicar" : "Faltan " + (5 - count)}</span>
                        </div>
                        <h3 className="mt-2 font-serif text-lg font-bold">{passage.title}</h3>
                        <p className="mt-1 text-[10px] text-[#a99574]">{passage.reading_type} · {passage.source_label}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {passage.status !== "published" && passage.status !== "archived" && (
                            <button type="button" disabled={!ready || publishingId === passage.id} onClick={() => void passageAction(passage.id, "publish-passage")} className={button + " disabled:opacity-40"}>
                              {publishingId === passage.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>} Publicar lectura
                            </button>
                          )}
                          {passage.status === "published" && <button type="button" onClick={() => void passageAction(passage.id, "passage-status", "archived")} className={button}><Archive className="h-3.5 w-3.5"/> Archivar</button>}
                          {passage.status === "archived" && <button type="button" onClick={() => void passageAction(passage.id, "passage-status", "draft")} className={button}>Restaurar borrador</button>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 border border-[#785b35] bg-[#302315]/60 p-4">
                <p className="text-xs font-bold text-[#efd29a]">Regla de publicación</p>
                <p className="mt-1 text-[11px] leading-5 text-[#c6b28f]">Una lectura solo aparece en el juego cuando tiene al menos cinco preguntas asociadas. El sistema selecciona dos lecturas y cinco preguntas de cada una para formar un expediente de diez preguntas.</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
            <section className="border border-[#765a35] bg-[#21170f] p-4 sm:p-6">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d1a762]">Banco de preguntas · {currentGame.label}</p>
              <h2 className="mt-1 font-serif text-xl font-bold">Crear pregunta</h2>
              {isReadingGame && (
                <label className="mt-4 block"><span className={label}>Lectura asociada</span><select className={field} value={questionForm.passageId} onChange={(e) => patchQuestionField("passageId", e.target.value)}><option value="">Selecciona una lectura</option>{passages.filter((passage) => passage.status !== "archived").map((passage) => <option key={passage.id} value={passage.id}>{passage.title} · {questionCountByPassage.get(passage.id) ?? 0} preguntas</option>)}</select></label>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label><span className={label}>Materia</span><select className={field} value={questionForm.subject} onChange={(e) => patchQuestionField("subject", e.target.value)}>{["Lectura Crítica", "Mixto", "Ciencias Naturales", "Matemáticas", "Sociales y Ciudadanas", "Inglés", "Química", "Física", "Biología", "Historia"].map((subject) => <option key={subject}>{subject}</option>)}</select></label>
                <label><span className={label}>Tema</span><input className={field} value={questionForm.topic} onChange={(e) => patchQuestionField("topic", e.target.value)} placeholder="Tema evaluado"/></label>
                <label><span className={label}>Dificultad interna</span><select className={field} value={questionForm.difficulty} onChange={(e) => patchQuestionField("difficulty", e.target.value)}><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select></label>
                <label><span className={label}>Competencia</span><input className={field} value={questionForm.competency} onChange={(e) => patchQuestionField("competency", e.target.value)} placeholder="Ej. Inferencia"/></label>
                <label className="sm:col-span-2"><span className={label}>Etiqueta corta de competencia</span><input className={field} value={questionForm.competencyShort} onChange={(e) => patchQuestionField("competencyShort", e.target.value)} placeholder="Ej. Sentido global"/></label>
              </div>
              <label className="mt-4 block"><span className={label}>Enunciado de la pregunta</span><textarea rows={4} maxLength={1200} className={field} value={questionForm.prompt} onChange={(e) => patchQuestionField("prompt", e.target.value)} placeholder="Escribe una pregunta clara y contextualizada…"/></label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {questionForm.options.map((option, index) => (
                  <label key={index}>
                    <span className={label}>Opción {String.fromCharCode(65 + index)} {questionForm.answer === index ? "· Correcta" : ""}</span>
                    <div className="flex gap-2">
                      <input className={field} value={option} maxLength={400} onChange={(e) => patchQuestionField("options", questionForm.options.map((value, i) => i === index ? e.target.value : value))} placeholder={"Respuesta " + String.fromCharCode(65 + index)}/>
                      <button type="button" aria-label={"Marcar opción " + String.fromCharCode(65 + index) + " como correcta"} onClick={() => patchQuestionField("answer", index)} className={"border px-3 " + (questionForm.answer === index ? "border-emerald-700 bg-emerald-950 text-emerald-300" : "border-[#5a503e] text-[#a99574]")}>{questionForm.answer === index ? <CheckCircle2 className="h-4 w-4"/> : String.fromCharCode(65 + index)}</button>
                    </div>
                  </label>
                ))}
              </div>
              <label className="mt-4 block"><span className={label}>Explicación pedagógica</span><textarea rows={4} maxLength={1800} className={field} value={questionForm.explanation} onChange={(e) => patchQuestionField("explanation", e.target.value)} placeholder="Explica por qué la opción correcta se sostiene en el texto o los datos…"/></label>
              <label className="mt-4 block"><span className={label}>Pista opcional</span><input className={field} maxLength={500} value={questionForm.hint} onChange={(e) => patchQuestionField("hint", e.target.value)} placeholder="Una orientación sin revelar la respuesta"/></label>
              <button type="button" onClick={() => void saveQuestion()} disabled={savingQuestion} className={button + " mt-5 w-full border-[#dfbd80] bg-[#866035] py-3 text-[11px] uppercase tracking-wider text-[#fff0d0]"}>
                {savingQuestion ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Guardar pregunta como borrador
              </button>
            </section>

            <section className="border border-[#765a35] bg-[#21170f] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-bold">Banco de {currentGame.label}</h2><button type="button" onClick={() => void load()} className="text-[10px] font-bold text-[#d5b57f] hover:text-white">Actualizar</button></div>
              {loading ? <p className="text-sm text-[#b9a789]">Cargando preguntas…</p> : questions.length === 0 ? (
                <div className="border border-dashed border-[#765a35] p-7 text-center text-sm text-[#a99574]">Todavía no hay preguntas para este juego.</div>
              ) : (
                <div className="max-h-[920px] space-y-3 overflow-y-auto pr-1">
                  {questions.map((question) => (
                    <article key={question.id} className="border border-[#5b452b] bg-[#17120d] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={"border px-2 py-1 text-[9px] font-bold uppercase tracking-wider " + (question.status === "published" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : question.status === "archived" ? "border-slate-700 text-slate-400" : "border-[#7a5a2e] text-[#e3bd7c]")}>{question.status === "published" ? "Publicada" : question.status === "archived" ? "Archivada" : "Borrador"}</span>
                        <span className="text-[9px] uppercase text-[#a99574]">{question.difficulty} · {question.subject}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-[#f2e3c5]">{question.topic}</h3>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#bca889]">{question.clue}</p>
                      <p className="mt-2 text-[10px] text-[#92764c]">{question.passage_id ? passages.find((passage) => passage.id === question.passage_id)?.title ?? "Lectura vinculada" : "Pregunta independiente"}</p>
                      {question.status === "draft" && (
                        <button type="button" disabled={publishingId === question.id || (isReadingGame && question.passage_id !== null)} onClick={() => void questionAction(question.id, "published")} className={button + " mt-3"}>
                          {publishingId === question.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>} Publicar pregunta
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {isReadingGame && <p className="mt-4 text-[10px] leading-5 text-[#a99574]">Las preguntas asociadas a una lectura se publican al publicar el expediente completo, para evitar que los alumnos vean preguntas sin su texto.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

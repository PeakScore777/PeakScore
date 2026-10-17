"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Word = { key: string; text: string; example?: boolean; example_description?: string; example_answer?: string };
type Option = { key: string; text: string };
type EnglishSet = {
  id: string;
  part: number;
  title: string;
  shared_text: string | null;
  shared_title: string | null;
  shared_image_url: string | null;
  instructions: string | null;
  example_prompt: string | null;
  example_options: Option[] | null;
  example_answer: string | null;
  example_image_url: string | null;
  word_bank: Word[] | null;
  status: string;
  session: number;
  created_at: string;
};
type EnglishQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  english_part: number | null;
  english_position: number | null;
  english_options: Option[] | null;
  component: string | null;
  difficulty: string | null;
};

const PART_NAMES: Record<number, string> = {
  1: "Descripciones y banco de palabras",
  2: "Avisos y lugares",
  3: "Completar conversaciones",
  4: "Texto cloze",
  5: "Comprensión de lectura",
  6: "Comprensión de lectura",
  7: "Texto cloze",
};

export default function EnglishQuestionBankPage() {
  const [sets, setSets] = useState<EnglishSet[]>([]);
  const [questionsBySet, setQuestionsBySet] = useState<Record<string, EnglishQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      const { data: setData, error: setLoadSetsError } = await supabase
        .from("english_question_sets")
        .select("id,part,title,shared_title,shared_text,shared_image_url,instructions,example_prompt,example_options,example_answer,example_image_url,word_bank,status,session,created_at")
        .order("part", { ascending: true })
        .order("created_at", { ascending: false });
      if (setLoadSetsError) {
        if (alive) { setError("No se pudieron cargar los conjuntos de Inglés."); setLoading(false); }
        return;
      }
      const allSets = (setData ?? []) as EnglishSet[];
      if (!allSets.length) {
        if (alive) { setSets([]); setQuestionsBySet({}); setLoading(false); }
        return;
      }
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_url,english_part,english_position,english_options,component,difficulty,english_set_id")
        .in("english_set_id", allSets.map((item) => item.id))
        .order("english_position", { ascending: true });
      if (questionError) {
        if (alive) { setError("Los conjuntos cargaron, pero no se pudieron cargar sus preguntas."); setLoading(false); }
        return;
      }
      const grouped: Record<string, EnglishQuestion[]> = {};
      for (const question of (questionData ?? []) as (EnglishQuestion & { english_set_id: string })[]) {
        (grouped[question.english_set_id] ??= []).push(question);
      }
      const completeSets = allSets.filter((item) => (grouped[item.id]?.length ?? 0) > 0);
      const normalizedSets = completeSets.map((item) => ({ ...item, part: item.word_bank?.length ? 1 : item.part }))
        .sort((a, b) => a.part - b.part || a.created_at.localeCompare(b.created_at));
      if (alive) {
        setSets(normalizedSets);
        setQuestionsBySet(grouped);
        setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/question-bank" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm">
            <ArrowLeft size={18} /> Volver al banco
          </Link>
          <Link href="/dashboard/question-bank/english/new" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
            <Plus size={18} /> Nuevo conjunto
          </Link>
        </header>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">Banco de preguntas · PeakScore</p>
          <h1 className="mt-1 text-3xl font-black">Inglés</h1>
          <p className="mt-2 max-w-3xl text-slate-600">Conjuntos organizados por parte y presentados en formato de cuadernillo: instrucciones, material compartido y preguntas en un mismo bloque.</p>
        </div>
        {loading && <div className="flex items-center justify-center rounded-2xl bg-white p-12 text-slate-500"><Loader2 className="mr-3 animate-spin" /> Cargando conjuntos...</div>}
        {!loading && error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {!loading && !error && sets.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-sm"><h2 className="text-xl font-bold">Todavía no hay conjuntos de Inglés</h2><p className="mt-2 text-slate-600">Crea un conjunto para que aparezca aquí como una página del cuadernillo.</p></div>}
        <div className="space-y-8">
          {sets.map((set) => {
            const qs = questionsBySet[set.id] ?? [];
            const words = set.word_bank ?? [];
            const group = set.title.match(/^((?:4|7)[AB])\s*[·—-]/)?.[1];
            const isWordBankSet = words.length > 0;
            const displayPart = isWordBankSet ? 1 : set.part;
            const displayPartName = isWordBankSet ? "Descripciones y banco de palabras" : (PART_NAMES[displayPart] ?? "Inglés");
            return (
              <article key={set.id} className={`mx-auto ${set.part === 6 ? "" : "min-h-[297mm]"} w-full max-w-[210mm] overflow-hidden border border-slate-300 bg-white shadow-sm ${set.part === 6 ? "" : "print:break-after-page"}`}>
                <div className="border-b border-slate-200 px-6 py-5 sm:px-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {set.session}</p>
                      <h2 className="mt-1 text-xl font-black">{group ? `Parte ${group}` : `Parte ${displayPart}`} · {displayPartName}</h2>
                      {set.part !== 6 && <p className="mt-1 text-sm text-slate-600">{set.title}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${set.status === "approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{set.status === "approved" ? "Aprobado" : set.status === "review" ? "En revisión" : set.status === "rejected" ? "Rechazado" : "Borrador"}</span>
                      <Link href={`/dashboard/question-bank/english/new?id=${set.id}`} title="Editar página completa" aria-label={`Editar página completa: ${set.title}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Pencil size={16}/></Link>
                    </div>
                  </div>
                  {set.instructions && <p className="mt-5 text-sm font-medium leading-6 text-slate-700">{set.instructions}</p>}
                </div>
                <div className={set.part === 6 ? "px-4 py-4 sm:px-5 sm:py-5" : "px-6 py-6 sm:px-10 sm:py-8"}>
                  {set.part === 6 && set.shared_text ? <section className="mb-3 rounded-xl border-2 border-slate-900 px-3 py-3 sm:px-4">
                    <p className="whitespace-pre-wrap font-serif text-[10px] leading-[1.35] text-slate-900">{set.shared_text}</p>
                  </section> : set.part === 5 && set.shared_text ? <section className="mb-5 rounded-xl border-2 border-slate-900 px-5 py-5">
                    {set.shared_title && <h3 className="mb-4 text-center text-lg font-black uppercase tracking-wide">{set.shared_title}</h3>}
                    <div className={set.shared_image_url ? "grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(150px,0.42fr)]" : ""}>
                      <p className="whitespace-pre-wrap font-serif text-[13px] leading-6 text-slate-900">{set.shared_text}</p>
                      {set.shared_image_url && <div className="flex justify-center md:justify-end"><img src={set.shared_image_url} alt="Ilustración del texto de lectura" className="h-auto max-h-64 max-w-full object-contain"/></div>}
                    </div>
                  </section> : set.shared_image_url ? <div className={`mb-5 flex justify-center ${[4, 5, 7].includes(set.part) ? "" : "border border-slate-900 p-3"}`}><img src={set.shared_image_url} alt={set.part === 4 ? "Texto compartido de la Parte 4" : set.part === 5 ? "Imagen completa del texto de lectura" : "Imagen compartida del conjunto"} className="h-auto max-h-[560px] max-w-full object-contain" /></div> : set.shared_text && <div className={`mb-5 whitespace-pre-wrap font-serif text-[15px] leading-7 text-slate-900 ${set.part === 4 ? "" : "border border-slate-300 px-5 py-5"}`}>{set.shared_text}</div>}
                  {words.length > 0 && <div className="mb-7">
                    {(() => { const exampleWord = words.find((word) => word.example); const exampleDescription = exampleWord?.example_description; const exampleAnswer = exampleWord?.example_answer ?? exampleWord?.key; return exampleDescription ? <div className="mb-6 border-b-2 border-slate-900 pb-5"><p className="text-center text-sm font-black uppercase tracking-wide">Ejemplo</p><div className="mt-3 grid gap-4 md:grid-cols-[1fr_0.9fr]"><div className="flex gap-3"><strong>0.</strong><p className="whitespace-pre-wrap leading-6">{exampleDescription}</p></div><div className="flex flex-wrap items-center gap-2 rounded-sm border border-slate-300 p-3"><strong className="mr-2">Respuesta 0.</strong>{words.map((word) => <span key={word.key} className={word.key === exampleAnswer ? "flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-900 text-xs font-bold text-white ring-2 ring-slate-300" : "flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600"}>{word.key}</span>)}</div></div></div> : null; })()}
                    <div className={`grid gap-8 md:grid-cols-[1fr_0.9fr] ${isWordBankSet ? "mt-8" : ""}`}>
                    <div><h3 className="mb-4 border-b border-slate-300 pb-3 text-center text-sm font-black uppercase tracking-wide">Descripciones</h3>
                      <div className={isWordBankSet ? "space-y-8" : "space-y-3"}>{qs.map((q, i) => <div key={q.id} className={`grid grid-cols-[3rem_1fr] gap-3 border-b border-dotted border-slate-300 ${isWordBankSet ? "min-h-[90px] pb-5 pt-2" : "pb-3"}`}><strong>{(displayPart === 1 ? 80 : 85) + i}.</strong><p className={`whitespace-pre-wrap ${isWordBankSet ? "text-sm leading-7" : "leading-6"}`}>{q.question}</p></div>)}</div>
                    </div>
                    <div><h3 className="mb-4 border-b border-slate-300 pb-3 text-center text-sm font-black uppercase tracking-wide">Palabras</h3>
                      <div className={isWordBankSet ? "space-y-8" : "space-y-3"}>{words.map((word) => <div key={word.key} className={`flex min-h-[42px] items-start gap-3 rounded-sm px-2 py-2 ${isWordBankSet ? "text-sm leading-6" : ""} ${word.example ? "font-bold underline decoration-2" : ""}`}><strong>{word.key}.</strong><span>{word.text}{word.example ? " (ejemplo)" : ""}</span></div>)}</div>
                    </div>
                    </div>
                  </div>}
                  {!words.length && set.part === 3 && set.example_image_url && <div className="mb-5 border-b border-slate-900 pb-5">
                    <div className="flex justify-center"><img src={set.example_image_url} alt="Ejemplo ilustrado de conversación" className="max-h-64 max-w-full object-contain" /></div>
                  </div>}
                  {!words.length && set.part === 4 && <div className="mb-3 border-b border-slate-900 pb-3">
                    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 text-[10px] leading-4">
                      <strong>0.</strong>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
                        {(set.example_options ?? []).map(option => <div key={option.key} className="flex gap-1"><strong>{option.key}.</strong><span>{option.text}</span></div>)}
                      </div>
                      <div className="inline-flex items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${set.example_answer ?? "sin respuesta marcada"}`}>
                        <span className="mr-1 font-semibold">Respuesta 0.</span>
                        {["A", "B", "C"].map(key => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${set.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                      </div>
                    </div>
                  </div>}
                  {!words.length && set.part !== 3 && set.part !== 4 && set.part !== 6 && set.part !== 7 && set.example_prompt && <div className={`mb-3 border-b border-slate-900 pb-3 ${set.part === 2 ? "text-[10px] leading-4" : ""}`}>
                    <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wide">Ejemplo</p>
                    <div className={`grid gap-2 ${set.part === 2 ? "grid-cols-[1rem_minmax(0,1fr)] sm:grid-cols-[1.5rem_minmax(0,1fr)]" : "md:grid-cols-[3.5rem_1fr]"}`}>
                      <strong className="pt-1">0.</strong>
                      <div className={set.part === 5 ? "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:gap-5" : set.part === 2 ? "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-4" : ""}>
                        <div>
                          {set.part !== 5 && set.example_image_url && <img src={set.example_image_url} alt="Imagen del ejemplo" className={set.part === 2 ? "mb-1 h-auto max-h-20 w-fit max-w-full object-contain" : "mb-4 max-h-64 max-w-full object-contain"} />}
                          <p className="whitespace-pre-wrap font-serif text-[11px] leading-4">{set.example_prompt}</p>
                        </div>
                        <div>
                          {!!set.example_options?.length && <div className={`grid gap-x-3 gap-y-1 ${set.part === 2 ? "grid-cols-1" : set.example_options.length > 2 ? "sm:grid-cols-2" : ""}`}>
                            {set.example_options.map(option => <div key={option.key} className="flex gap-1 text-[10px] leading-4"><strong>{option.key}.</strong><span>{option.text}</span></div>)}
                          </div>}
                          {[2, 3, 4, 5, 7].includes(set.part) && <div className="mt-2 inline-flex items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${set.example_answer ?? "sin respuesta marcada"}`}>
                            <span className="mr-1 font-semibold">0.</span>
                            {["A", "B", "C"].map((key) => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${set.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                          </div>}
                        </div>
                      </div>
                    </div>
                  </div>}
                  {!words.length && set.part === 7 ? <section className="mt-2">
                    <div className="mb-2 border-b-2 border-slate-900 pb-3">
                      <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wide">Ejemplo</p>
                      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 text-[10px] leading-4">
                        <strong>0.</strong>
                        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">{(set.example_options ?? []).map(option => <p key={option.key}><strong>{option.key}.</strong> {option.text}</p>)}</div>
                          <div className="inline-flex h-fit items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none" aria-label={`Hoja de respuestas del ejemplo: ${set.example_answer ?? "sin respuesta marcada"}`}>
                            <strong className="mr-1">Respuesta 0.</strong>
                            {["A", "B", "C", "D"].map(key => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${set.example_answer?.trim().toUpperCase() === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {qs.map((q, i) => {
                        const opts = q.english_options?.length ? q.english_options : [{ key: "A", text: q.option_a }, { key: "B", text: q.option_b }, { key: "C", text: q.option_c }, { key: "D", text: q.option_d }].filter(option => option.text?.trim() && option.text !== "N/A");
                        const number = (/^7B\b/i.test(set.title) ? 124 : 114) + (q.english_position ?? i + 1);
                        return <div key={q.id} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 border-b border-slate-400 py-2 last:border-0">
                          <strong className="pt-0.5 text-[10px]">{number}.</strong>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] leading-4 sm:grid-cols-4">
                            {["A", "B", "C", "D"].map(key => {
                              const option = opts.find(item => item.key.toUpperCase() === key);
                              return <p key={key}><strong>{key}.</strong> {option?.text ?? ""}</p>;
                            })}
                          </div>
                        </div>;
                      })}
                    </div>
                  </section> : !words.length && set.part === 6 ? <section className="mt-2">
                    <div className="space-y-0">
                      {[[0, 2], [1, 3]].map((pair, rowIndex) => <div key={rowIndex} className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-slate-400 py-2 md:grid-cols-2">
                        {pair.map(questionIndex => {
                          const q = qs[questionIndex];
                          if (!q) return null;
                          const opts = q.english_options?.length ? q.english_options : [{ key: "A", text: q.option_a }, { key: "B", text: q.option_b }, { key: "C", text: q.option_c }, { key: "D", text: q.option_d }].filter(option => option.text?.trim() && option.text !== "N/A");
                          const number = 119 + (q.english_position ?? questionIndex + 1);
                          return <div key={q.id} className="grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start gap-2">
                            <p className="text-[10px] leading-[1.35]"><strong>{number}.</strong> {q.question}</p>
                            <div className="space-y-0.5">{opts.map(option => <p key={option.key} className="text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text}</p>)}</div>
                          </div>;
                        })}
                      </div>)}
                    </div>
                    {qs[4] && (() => {
                      const q = qs[4];
                      const opts = q.english_options?.length ? q.english_options : [{ key: "A", text: q.option_a }, { key: "B", text: q.option_b }, { key: "C", text: q.option_c }, { key: "D", text: q.option_d }].filter(option => option.text?.trim() && option.text !== "N/A");
                      const number = 119 + (q.english_position ?? 5);
                      return <article className="mt-2 border-t-2 border-slate-900 pt-2">
                        <p className="text-[11px] leading-4"><strong>{number}.</strong> {q.question}</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {opts.map(option => <div key={option.key} className="min-h-12 border border-slate-500 px-2 py-2 text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text}</div>)}
                        </div>
                      </article>;
                    })()}
                  </section> : !words.length && <div className={set.part === 2 ? "space-y-0" : set.part === 3 ? "space-y-0" : "space-y-7"}>{qs.map((q, i) => {
                    const opts = q.english_options?.length ? q.english_options : [
                      { key: "A", text: q.option_a }, { key: "B", text: q.option_b }, { key: "C", text: q.option_c }, { key: "D", text: q.option_d },
                    ].filter((o) => o.text?.trim());
                    const partPosition = q.english_position ?? i + 1;
                    const isSubpartB = /^(?:4B|7B)\b/i.test(set.title);
                    const questionNumber = set.part === 1 ? 79 + partPosition
                      : set.part === 2 ? 84 + partPosition
                      : set.part === 3 ? 89 + partPosition
                      : set.part === 4 ? (isSubpartB ? 104 : 96) + partPosition
                      : set.part === 5 ? 112 + partPosition
                      : set.part === 6 ? 119 + partPosition
                      : set.part === 7 ? (isSubpartB ? 124 : 114) + partPosition
                      : partPosition;
                    return <div key={q.id} className={`grid gap-2 border-b border-slate-300 last:border-0 ${set.part === 4 ? "grid-cols-[2rem_minmax(0,1fr)] items-center py-2" : set.part === 5 ? "grid-cols-[1.5rem_minmax(0,1fr)] py-2" : `pb-3 pt-2 ${set.part === 2 ? "text-[10px] leading-4 sm:grid-cols-[1.5rem_minmax(0,1fr)]" : "md:grid-cols-[2rem_minmax(0,1fr)]"} ${set.part === 3 ? "min-h-[72px] pb-3 pt-3" : ""}`}`}>
                      <strong className="pt-1 text-[11px]">{questionNumber}.</strong>
                      {set.part === 4 ? (
                        <div className="grid grid-cols-3 items-start gap-x-3 text-sm leading-5">
                          {["A", "B", "C"].map((key) => {
                            const option = opts.find((item) => item.key.toUpperCase() === key);
                            return <div key={key} className="flex min-w-0 items-start gap-1"><strong className="shrink-0">{key}.</strong><span className="break-words">{option?.text ?? ""}</span></div>;
                          })}
                        </div>
                      ) : (
                        <div className={set.part === 5 ? "grid grid-cols-1 gap-8 md:gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" : set.part === 2 || set.part === 3 ? "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-4" : ""}>
                          <div>
                            {q.image_url && <img src={q.image_url} alt={`Imagen de la pregunta ${i + 1}`} className={set.part === 2 ? "mb-1 h-auto max-h-20 w-fit max-w-full object-contain" : "mb-4 max-h-72 max-w-full object-contain"}/>}
                            <p className={`whitespace-pre-wrap font-serif ${set.part === 2 ? "text-[10px] leading-4" : set.part === 5 ? "text-[13px] leading-5" : "text-[15px] leading-7"}`}>{q.question}</p>
                          </div>
                          <div>{opts.length > 0 && <div className={`grid grid-cols-1 ${set.part === 5 ? "gap-y-1" : "gap-y-2"}`}>{opts.map((o) => <div key={o.key} className={`flex gap-2 ${set.part === 2 ? "text-[10px] leading-4" : set.part === 5 ? "text-xs leading-4" : "text-sm leading-6"}`}><strong>{o.key}.</strong><span>{o.text}</span></div>)}</div>}</div>
                        </div>
                      )}
                    </div>;
                  })}</div>}
                  
                  <div className={set.part === 6 ? "mt-3 border-t border-slate-300 pt-2 text-[9px] text-slate-400" : "mt-5 border-t border-slate-300 pt-3 text-xs text-slate-400"}>PeakScore · Material de práctica · Las respuestas correctas no se muestran en esta vista.</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

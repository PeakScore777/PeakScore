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
  instructions: string | null;
  example_prompt: string | null;
  example_options: Option[] | null;
  example_answer: string | null;
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
        .select("id,part,title,shared_text,instructions,example_prompt,example_options,example_answer,word_bank,status,session,created_at")
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
              <article key={set.id} className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5 sm:px-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {set.session}</p>
                      <h2 className="mt-1 text-xl font-black">{group ? `Parte ${group}` : `Parte ${displayPart}`} · {displayPartName}</h2>
                      <p className="mt-1 text-sm text-slate-600">{set.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${set.status === "approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{set.status === "approved" ? "Aprobado" : set.status === "review" ? "En revisión" : set.status === "rejected" ? "Rechazado" : "Borrador"}</span>
                      <Link href="/dashboard/question-bank/english/new" title="Crear otro conjunto" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Pencil size={16}/></Link>
                    </div>
                  </div>
                  {set.instructions && <p className="mt-5 text-sm font-medium leading-6 text-slate-700">{set.instructions}</p>}
                </div>
                <div className="px-6 py-6 sm:px-10 sm:py-8">
                  {set.shared_text && <div className="mb-7 whitespace-pre-wrap border border-slate-300 px-5 py-5 font-serif text-[15px] leading-7 text-slate-900">{set.shared_text}</div>}
                  {words.length > 0 && <div className="mb-7">
                    {(() => { const exampleWord = words.find((word) => word.example); const exampleDescription = exampleWord?.example_description; const exampleAnswer = exampleWord?.example_answer ?? exampleWord?.key; return exampleDescription ? <div className="mb-6 border-b-2 border-slate-900 pb-5"><p className="text-center text-sm font-black uppercase tracking-wide">Ejemplo</p><div className="mt-3 grid gap-4 md:grid-cols-[1fr_0.9fr]"><div className="flex gap-3"><strong>0.</strong><p className="whitespace-pre-wrap leading-6">{exampleDescription}</p></div><div className="flex flex-wrap items-center gap-2 rounded-sm border border-slate-300 p-3"><strong className="mr-2">Respuesta 0.</strong>{words.map((word) => <span key={word.key} className={word.key === exampleAnswer ? "flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-900 text-xs font-bold text-white ring-2 ring-slate-300" : "flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600"}>{word.key}</span>)}</div></div></div> : null; })()}
                    <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div><h3 className="mb-3 border-b border-slate-300 pb-2 text-center text-sm font-black uppercase tracking-wide">Descripciones</h3>
                      <div className="space-y-3">{qs.map((q, i) => <div key={q.id} className="grid grid-cols-[3rem_1fr] gap-3 border-b border-dotted border-slate-300 pb-3"><strong>{(displayPart === 1 ? 80 : 85) + i}.</strong><p className="whitespace-pre-wrap leading-6">{q.question}</p></div>)}</div>
                    </div>
                    <div><h3 className="mb-3 border-b border-slate-300 pb-2 text-center text-sm font-black uppercase tracking-wide">Palabras</h3>
                      <div className="space-y-3">{words.map((word) => <div key={word.key} className={`flex gap-3 rounded-sm px-2 py-1 ${word.example ? "font-bold underline decoration-2" : ""}`}><strong>{word.key}.</strong><span>{word.text}{word.example ? " (ejemplo)" : ""}</span></div>)}</div>
                    </div>
                    </div>
                  </div>}
                  {!words.length && set.example_prompt && <div className="mb-7 border-b-2 border-slate-900 pb-5">
                    <p className="text-center text-sm font-black uppercase tracking-wide">Ejemplo</p>
                    <div className="mt-3 grid gap-4 md:grid-cols-[3.5rem_1fr]">
                      <strong className="pt-1">0.</strong>
                      <div>
                        <p className="whitespace-pre-wrap font-serif text-[15px] leading-7">{set.example_prompt}</p>
                        {!!set.example_options?.length && <div className={`mt-4 grid gap-x-6 gap-y-2 ${set.example_options.length > 2 ? "sm:grid-cols-2" : ""}`}>
                          {set.example_options.map(option => <div key={option.key} className="flex gap-2 text-sm leading-6"><strong>{option.key}.</strong><span>{option.text}</span></div>)}
                        </div>}
                        {set.example_answer && <p className="mt-3 text-xs text-slate-500">Ejemplo ilustrativo · Respuesta {set.example_answer}</p>}
                      </div>
                    </div>
                  </div>}
                  {!words.length && <div className="space-y-7">{qs.map((q, i) => {
                    const opts = q.english_options?.length ? q.english_options : [
                      { key: "A", text: q.option_a }, { key: "B", text: q.option_b }, { key: "C", text: q.option_c }, { key: "D", text: q.option_d },
                    ].filter((o) => o.text?.trim());
                    return <div key={q.id} className="grid gap-4 border-b border-slate-200 pb-6 last:border-0 md:grid-cols-[3.5rem_1fr]">
                      <strong className="pt-1 text-base">{q.english_position ?? i + 1}.</strong>
                      <div>
                        {q.image_url && <img src={q.image_url} alt={`Imagen de la pregunta ${i + 1}`} className="mb-4 max-h-72 max-w-full object-contain"/>}
                        <p className="whitespace-pre-wrap font-serif text-[15px] leading-7">{q.question}</p>
                        {opts.length > 0 && <div className={`mt-4 grid gap-x-6 gap-y-2 ${opts.length > 2 ? "sm:grid-cols-2" : ""}`}>{opts.map((o) => <div key={o.key} className="flex gap-2 text-sm leading-6"><strong>{o.key}.</strong><span>{o.text}</span></div>)}</div>}
                      </div>
                    </div>;
                  })}</div>}
                  
                  <div className="mt-5 border-t border-slate-300 pt-3 text-xs text-slate-400">PeakScore · Material de práctica · Las respuestas correctas no se muestran en esta vista.</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

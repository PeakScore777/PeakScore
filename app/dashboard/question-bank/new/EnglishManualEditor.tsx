"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Loader2, BookOpen, CheckCircle2 } from "lucide-react";

type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Option = { key: string; text: string };
type Item = {
  question: string;
  correct_answer: string;
  explanation: string;
  difficulty: "Fácil" | "Media" | "Difícil";
  skill: string;
  options: Option[];
};

const PARTS: { value: Part; title: string; description: string; type: string }[] = [
  { value: 1, title: "Parte 1 · Conocimiento lexical", description: "Cinco descripciones y un banco compartido de siete palabras A–G.", type: "word_bank" },
  { value: 2, title: "Parte 2 · Conocimiento pragmático", description: "Un aviso o texto corto con una pregunta y tres opciones.", type: "notice" },
  { value: 3, title: "Parte 3 · Conocimiento comunicativo", description: "Una conversación breve con una pregunta y tres opciones.", type: "conversation" },
  { value: 4, title: "Parte 4 · Gramática en contexto", description: "Texto cloze con un espacio numerado por pregunta y tres opciones.", type: "cloze_text" },
  { value: 5, title: "Parte 5 · Comprensión literal", description: "Texto de lectura con preguntas de comprensión literal y tres opciones.", type: "reading_text" },
  { value: 6, title: "Parte 6 · Comprensión inferencial", description: "Texto de lectura con preguntas inferenciales y cuatro opciones.", type: "reading_text" },
  { value: 7, title: "Parte 7 · Gramática y léxico en contexto", description: "Texto cloze con espacios numerados y cuatro opciones por pregunta.", type: "cloze_text" },
];

function createItem(part: Part): Item {
  const count = part === 1 ? 0 : part === 6 || part === 7 ? 4 : 3;
  return {
    question: "",
    correct_answer: "",
    explanation: "",
    difficulty: "Media",
    skill: part === 1 ? "Conocimiento lexical" : "",
    options: Array.from({ length: count }, (_, i) => ({ key: String.fromCharCode(65 + i), text: "" })),
  };
}

export default function EnglishManualEditor({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [part, setPart] = useState<Part>(1);
  const [stimulus, setStimulus] = useState("");
  const [wordBank, setWordBank] = useState<Option[]>(
    Array.from({ length: 7 }, (_, i) => ({ key: String.fromCharCode(65 + i), text: "" })),
  );
  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 5 }, (_, i) => createItem(1)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const partInfo = useMemo(() => PARTS.find((p) => p.value === part)!, [part]);
  const minItems = part === 1 ? 5 : part === 2 || part === 3 ? 1 : part === 6 ? 2 : 4;
  const maxItems = part === 1 ? 5 : part === 2 || part === 3 ? 1 : part === 5 ? 7 : part === 6 ? 4 : 8;
  const optionCount = part === 1 ? 0 : part === 6 || part === 7 ? 4 : 3;

  function changePart(next: Part) {
    setPart(next);
    setStimulus("");
    setItems(Array.from({ length: next === 1 ? 5 : next === 2 || next === 3 ? 1 : next === 6 ? 2 : 4 }, (_, i) => createItem(next)));
    setWordBank(Array.from({ length: 7 }, (_, i) => ({ key: String.fromCharCode(65 + i), text: "" })));
    setError("");
    setSavedCount(null);
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function updateOption(index: number, optionIndex: number, text: string) {
    setItems((current) => current.map((item, i) => i !== index ? item : {
      ...item,
      options: item.options.map((option, j) => j === optionIndex ? { ...option, text } : option),
    }));
  }

  function addItem() {
    if (items.length >= maxItems) return;
    const next = items.length + 1;
    setItems((current) => [...current, createItem(part)]);
    if (part === 4 || part === 7) {
      setStimulus((current) => current.includes(`[[${next}]]`) ? current : `${current.trimEnd()} [[${next}]]`.trim());
    }
  }

  function removeItem(index: number) {
    if (items.length <= minItems) return;
    setItems((current) => current.filter((_, i) => i !== index));
    if (part === 4 || part === 7) {
      setStimulus((current) => current.replace(/\[\[(\d+)\]\]/g, (_match, raw) => {
        const marker = Number(raw);
        if (marker === index + 1) return "";
        return `[[${marker > index + 1 ? marker - 1 : marker}]]`;
      }).replace(/[ \t]{2,}/g, " "));
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSavedCount(null);

    if (stimulus.trim().length === 0) {
      setError("Escribe el estímulo completo antes de guardar.");
      return;
    }
    if (items.some((item) => !item.question.trim() || !item.explanation.trim() || !item.skill.trim() || !item.correct_answer)) {
      setError("Completa el enunciado, habilidad, respuesta correcta y explicación de cada pregunta.");
      return;
    }
    if (part === 1) {
      if (wordBank.some((option) => !option.text.trim()) || new Set(wordBank.map((o) => o.text.trim().toLocaleLowerCase("en"))).size !== 7) {
        setError("El banco de la Parte 1 requiere siete palabras distintas, de A a G.");
        return;
      }
      if (new Set(items.map((item) => item.correct_answer)).size !== 5) {
        setError("En la Parte 1, las cinco descripciones deben usar cinco respuestas distintas del banco.");
        return;
      }
    } else if (items.some((item) => item.options.length !== optionCount || item.options.some((option) => !option.text.trim()))) {
      setError(`Cada pregunta de esta parte debe tener ${optionCount} opciones completas.`);
      return;
    }
    if (items.some((item) => !item.options.some((option) => option.key === item.correct_answer)) && part !== 1) {
      setError("La respuesta correcta debe coincidir con una de las opciones de cada pregunta.");
      return;
    }
    if ((part === 4 || part === 7)) {
      const markers = [...stimulus.matchAll(/\[\[(\d+)\]\]/g)].map((match) => Number(match[1])).sort((a, b) => a - b);
      if (markers.length !== items.length || markers.some((marker, i) => marker !== i + 1)) {
        setError(`El texto cloze debe incluir exactamente los marcadores consecutivos [[1]] hasta [[${items.length}]], uno por pregunta.`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/question-bank/english-stimuli/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part,
          stimulus: stimulus.trim(),
          word_bank: part === 1 ? wordBank : null,
          questions: items.map((item) => ({
            question: item.question.trim(),
            options: part === 1 ? null : item.options,
            correct_answer: item.correct_answer,
            explanation: item.explanation.trim(),
            difficulty: item.difficulty,
            skill: item.skill.trim(),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "No se pudo guardar el conjunto de Inglés.");
      }
      setSavedCount(Number(result.question_count ?? items.length));
      setTimeout(() => router.push("/dashboard/question-bank"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el conjunto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start gap-4">
          <button type="button" onClick={onBack} className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300"><BookOpen size={16} /> Banco de Inglés · Editor manual</div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Crear conjunto de preguntas</h1>
            <p className="mt-2 max-w-3xl text-slate-400">Escribe el estímulo una sola vez y vincula todas las preguntas que dependen de él. El conjunto se guarda inactivo hasta completar la revisión editorial.</p>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-7">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Estructura ICFES · Inglés</label>
            <select value={part} onChange={(e) => changePart(Number(e.target.value) as Part)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
              {PARTS.map((item) => <option key={item.value} value={item.value}>{item.title}</option>)}
            </select>
            <p className="mt-3 text-slate-300">{partInfo.description}</p>
            <div className="mt-4 rounded-xl border border-cyan-900 bg-cyan-950/40 p-4 text-sm text-cyan-100">
              {part === 1 ? "5 descripciones · 7 opciones compartidas A–G · cada respuesta correcta debe ser distinta." :
                part === 2 || part === 3 ? "1 estímulo · 1 pregunta · 3 opciones A–C." :
                  `${items.length} preguntas vinculadas · ${optionCount} opciones por pregunta (${optionCount === 3 ? "A–C" : "A–D"}). ${part === 4 || part === 7 ? "Cada texto debe tener entre 4 y 8 espacios." : part === 5 ? "Cada lectura debe tener entre 4 y 7 preguntas." : part === 6 ? "Cada lectura debe tener entre 2 y 4 preguntas." : ""}`}
              {(part === 4 || part === 7) && " Usa marcadores [[1]], [[2]], etc. en el texto; cada marcador debe corresponder a una pregunta."}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-7">
            <label className="mb-2 block text-lg font-bold">Estímulo compartido *</label>
            <p className="mb-3 text-sm text-slate-400">Texto, aviso, conversación, lectura o cloze. Se asociará a todas las preguntas del conjunto.</p>
            <textarea value={stimulus} onChange={(e) => setStimulus(e.target.value)} required rows={part === 2 ? 5 : 9} maxLength={20000} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 leading-7 text-white outline-none focus:border-cyan-500" placeholder={part === 1 ? "Opcionalmente describe la instrucción del ejercicio; el banco A–G aparece debajo." : part === 2 ? "Escribe el aviso en inglés..." : part === 3 ? "Escribe la conversación en inglés..." : part === 4 || part === 7 ? "Escribe el texto en inglés e inserta espacios como [[1]], [[2]]..." : "Escribe aquí el texto de lectura en inglés..."} />
            <div className="mt-2 text-right text-xs text-slate-500">{stimulus.length.toLocaleString()} / 20.000 caracteres</div>

            {part === 1 && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-bold">Banco compartido de palabras A–G</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {wordBank.map((option, index) => (
                    <label key={option.key} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400 font-bold text-slate-950">{option.key}</span>
                      <input value={option.text} onChange={(e) => setWordBank((current) => current.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} maxLength={1000} required className="min-w-0 flex-1 bg-transparent outline-none" placeholder={`Palabra u opción ${option.key}`} />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Preguntas del conjunto</h2>
                <p className="mt-1 text-sm text-slate-400">Cada pregunta se guarda vinculada al mismo estímulo y con su propia respuesta y explicación.</p>
              </div>
              {part !== 1 && part !== 2 && part !== 3 && (
                <button type="button" onClick={addItem} disabled={items.length >= maxItems} className="inline-flex items-center gap-2 rounded-xl border border-cyan-800 bg-cyan-950/50 px-4 py-2.5 font-semibold text-cyan-200 hover:bg-cyan-900 disabled:opacity-40"><Plus size={18} /> Añadir pregunta</button>
              )}
            </div>

            {items.map((item, index) => (
              <article key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Ítem {index + 1}</span><h3 className="mt-1 text-lg font-bold">Pregunta {index + 1}</h3></div>
                  {part !== 1 && part !== 2 && part !== 3 && items.length > minItems && <button type="button" onClick={() => removeItem(index)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-950/40" aria-label={`Eliminar pregunta ${index + 1}`}><Trash2 size={18} /></button>}
                </div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">Enunciado / instrucción de la pregunta *</label>
                <textarea value={item.question} onChange={(e) => updateItem(index, { question: e.target.value })} required rows={3} maxLength={10000} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500" placeholder={part === 1 ? "Write the description in English..." : part === 4 || part === 7 ? `Question for gap ${index + 1}...` : "Escribe la pregunta en inglés..."} />

                {part !== 1 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {item.options.map((option, optionIndex) => (
                      <label key={option.key} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                        <span className="mb-2 block text-xs font-bold text-cyan-300">OPCIÓN {option.key}</span>
                        <input value={option.text} onChange={(e) => updateOption(index, optionIndex, e.target.value)} required maxLength={5000} className="w-full bg-transparent text-white outline-none" placeholder={`Texto de la opción ${option.key}`} />
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-300">Respuesta correcta *
                    <select value={item.correct_answer} onChange={(e) => updateItem(index, { correct_answer: e.target.value })} required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                      <option value="">Seleccionar respuesta</option>
                      {(part === 1 ? wordBank.map((option) => option.key) : item.options.map((option) => option.key)).map((key) => <option key={key} value={key}>{key}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-300">Dificultad *
                    <select value={item.difficulty} onChange={(e) => updateItem(index, { difficulty: e.target.value as Item["difficulty"] })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                      <option value="Fácil">Fácil</option><option value="Media">Media</option><option value="Difícil">Difícil</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-300 md:col-span-2">Habilidad evaluada *
                    <input value={item.skill} onChange={(e) => updateItem(index, { skill: e.target.value })} required maxLength={200} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500" placeholder="Ej. comprensión literal, inferencia, vocabulario en contexto..." />
                  </label>
                  <label className="block text-sm font-semibold text-slate-300 md:col-span-2">Explicación de la respuesta correcta *
                    <textarea value={item.explanation} onChange={(e) => updateItem(index, { explanation: e.target.value })} required rows={3} maxLength={20000} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500" placeholder="Explica por qué la opción seleccionada es correcta y por qué encaja con el estímulo." />
                  </label>
                </div>
              </article>
            ))}
          </section>

          {error && <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/50 p-4 text-rose-200">{error}</div>}
          {savedCount !== null && <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-800 bg-emerald-950/50 p-4 text-emerald-200"><CheckCircle2 /> Se guardaron {savedCount} preguntas como pendientes de revisión. Redirigiendo al banco…</div>}

          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-5">
            <button type="button" onClick={onBack} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-900">Volver</button>
            <button type="submit" disabled={loading || savedCount !== null} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={19} /> : <Save size={19} />}
              {loading ? "Validando y guardando..." : "Guardar conjunto"}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

type Choice = { key: string; text: string };
type ManualQuestion = { prompt: string; options: Choice[]; answer: string; explanation: string; imageUrl: string };

const partNames: Record<number, string> = {
  1: "Avisos e imágenes",
  2: "Descripciones y banco de palabras",
  3: "Completar conversaciones",
  4: "Texto cloze (dos conjuntos en el simulacro oficial)",
  5: "Comprensión de lectura",
  6: "Comprensión de lectura",
  7: "Texto cloze con cuatro opciones",
};

const instructions: Record<number, string> = {
  1: "Crea un aviso o una imagen y tres lugares/situaciones posibles. La respuesta indica dónde se puede ver el aviso.",
  2: "Escribe descripciones breves y un banco compartido de palabras A–G. Puedes incluir H como ejemplo.",
  3: "Escribe una intervención de conversación y tres respuestas posibles.",
  4: "Añade un texto compartido con espacios numerados y tres opciones para cada espacio.",
  5: "Añade un texto de lectura y preguntas de comprensión con tres opciones.",
  6: "Añade un texto de lectura y preguntas de comprensión con tres opciones. En el cuadernillo oficial esta parte contiene cinco preguntas.",
  7: "Añade un texto compartido con espacios numerados y cuatro opciones por espacio.",
};

function makeQuestion(part: number, wordBank: string[]): ManualQuestion {
  const count = part === 7 ? 4 : part === 2 ? 0 : 3;
  const options = Array.from({ length: count }, (_, i) => ({
    key: String.fromCharCode(65 + i),
    text: part === 2 ? (wordBank[i] ?? "") : "",
  }));
  return { prompt: "", options, answer: "A", explanation: "", imageUrl: "" };
}

export default function EnglishManualEditor({ onBack }: { onBack: () => void }) {
  const [part, setPart] = useState(1);
  const [session, setSession] = useState("2");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Media");
  const [sharedText, setSharedText] = useState("");
  const [wordBankText, setWordBankText] = useState("");
  const [questions, setQuestions] = useState<ManualQuestion[]>(Array.from({ length: 5 }, () => makeQuestion(1, [])));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [savedSetId, setSavedSetId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const wordBank = useMemo(() => wordBankText.split("\n").map(x => x.trim()).filter(Boolean), [wordBankText]);

  function changePart(value: number) {
    setPart(value);
    setQuestions(Array.from({ length: ({1:5,2:5,3:7,4:8,5:7,6:5,7:10} as Record<number, number>)[value] }, () => makeQuestion(value, wordBank)));
    setSharedText("");
    setError("");
    setMessage("");
    setSavedSetId(null);
  }

  function updateQuestion(index: number, patch: Partial<ManualQuestion>) {
    setQuestions(current => current.map((question, i) => i === index ? { ...question, ...patch } : question));
  }

  function updateOption(questionIndex: number, optionIndex: number, text: string) {
    setQuestions(current => current.map((question, i) => i !== questionIndex ? question : ({
      ...question,
      options: question.options.map((option, j) => j === optionIndex ? { ...option, text } : option),
    })));
  }

  function changeWordBank(value: string) {
    setWordBankText(value);
    if (part === 2) {
      setQuestions(current => current.map(question => ({
        ...question,
        options: [],
      })));
    }
  }

  function addQuestion() {
    if (questions.length >= 30) return;
    setQuestions(current => [...current, makeQuestion(part, wordBank)]);
  }

  async function save() {
    setLoading(true);
    setError("");
    setMessage("");
    setSavedSetId(null);
    try {
      const response = await fetch("/api/admin/question-bank/english-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part, session: Number(session), title, difficulty,
          instructions: instructions[part], sharedText, wordBank, questions,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "No se pudo guardar el conjunto.");
      setSavedSetId(typeof result.setId === "string" ? result.setId : null);
      setMessage(`Conjunto guardado como borrador: ${result.count} pregunta(s). Aún no está activo en simulacros.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  function resetForAnotherSet() {
    setPart(1);
    setSession("2");
    setTitle("");
    setDifficulty("Media");
    setSharedText("");
    setWordBankText("");
    setQuestions(Array.from({ length: 5 }, () => makeQuestion(1, [])));
    setSavedSetId(null);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <button type="button" onClick={onBack} className="rounded-xl bg-white p-3 shadow" aria-label="Volver"><ArrowLeft size={20}/></button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas · Inglés</p>
            <h1 className="text-3xl font-bold text-slate-900">Editor manual de las 7 partes</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Crea conjuntos completos por parte. La cantidad inicial sigue la estructura del cuadernillo oficial: P1 5, P2 5, P3 7, P4 8 por texto, P5 7, P6 5 y P7 10. Puedes ajustar la cantidad según el conjunto que estés creando.</p>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold">Parte del examen
              <select value={part} onChange={e => changePart(Number(e.target.value))} className="mt-2 w-full rounded-xl border p-3">
                {Object.entries(partNames).map(([value, name]) => <option key={value} value={value}>Parte {value} · {name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Sesión ICFES
              <select value={session} onChange={e => setSession(e.target.value)} className="mt-2 w-full rounded-xl border p-3">
                <option value="1">Sesión 1</option><option value="2">Sesión 2</option>
              </select>
            </label>
            <label className="block text-sm font-semibold md:col-span-2">Nombre del conjunto
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Ej. Avisos cotidianos — conjunto 01" className="mt-2 w-full rounded-xl border p-3"/>
            </label>
            <label className="block text-sm font-semibold">Dificultad
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border p-3">
                <option>Fácil</option><option>Media</option><option>Difícil</option>
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
            <strong>Formato de esta parte:</strong> {instructions[part]}
          </div>

          {part === 2 && <div className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">Banco de palabras compartido (una palabra por línea; A–G y opcionalmente H como ejemplo)
              <textarea value={wordBankText} onChange={e => changeWordBank(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={"beach\nbed\ncamera\nmountain\nsquare\nsuitcase\npool\ntowel"}/>
            </label>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="mb-2 text-sm font-bold text-indigo-950">Vista previa de las opciones compartidas</p>
              {wordBank.length === 0 ? <p className="text-sm text-indigo-900">Escribe una palabra por línea para ver el banco A–G. La opción H, si la incluyes, queda como ejemplo y no se puede marcar como respuesta.</p> :
                <div className="grid gap-2 sm:grid-cols-2">
                  {wordBank.map((word, index) => <div key={index} className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span className="font-bold text-indigo-700">{String.fromCharCode(65 + index)}.</span><span className="break-words text-slate-800">{word}{index === 7 ? " (ejemplo)" : ""}</span></div>)}
                </div>}
            </div>
          </div>}

          {[4, 5, 6, 7].includes(part) && <label className="mt-5 block text-sm font-semibold">Texto compartido
            <textarea value={sharedText} onChange={e => setSharedText(e.target.value)} rows={8} maxLength={30000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 5 ? "Escribe aquí el texto de lectura..." : "Escribe aquí el texto y marca los espacios como (1), (2), (3)..."} />
          </label>}
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold text-slate-900">Preguntas del conjunto</h2><p className="text-sm text-slate-600">{questions.length} de 30 preguntas</p></div>
            <button type="button" onClick={addQuestion} disabled={questions.length >= 30} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"><Plus size={18}/> Añadir pregunta</button>
          </div>
          {questions.map((question, index) => (
            <article key={index} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-7">
              <div className="flex items-center justify-between"><h3 className="font-bold">Pregunta {index + 1}</h3>
                {questions.length > 1 && <button type="button" onClick={() => setQuestions(current => current.filter((_, i) => i !== index))} className="inline-flex items-center gap-1 text-sm text-red-700"><Trash2 size={16}/> Eliminar</button>}
              </div>
              {part === 1 && <label className="block text-sm font-semibold">URL de imagen/aviso
                <input value={question.imageUrl} onChange={e => updateQuestion(index, { imageUrl: e.target.value })} maxLength={2048} placeholder="https://..." className="mt-2 w-full rounded-xl border p-3 font-normal"/>
              </label>}
              <label className="block text-sm font-semibold">{part === 2 ? "Descripción en inglés" : part === 3 ? "Intervención de la conversación" : [4,7].includes(part) ? "Número del espacio / enunciado" : part === 5 || part === 6 ? "Pregunta de comprensión" : "Aviso o situación descrita"}
                <textarea value={question.prompt} onChange={e => updateQuestion(index, { prompt: e.target.value })} rows={3} maxLength={10000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 2 ? "People take photos with this." : part === 3 ? "Can you hold the camera?" : [4,7].includes(part) ? "Ej. (1) _____" : "Escribe el enunciado en inglés..."}/>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {part !== 2 && question.options.map((option, optionIndex) => <label key={option.key} className="block text-sm font-semibold">
                  Opción {option.key}
                  <input value={option.text} onChange={e => updateOption(index, optionIndex, e.target.value)} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 2 ? "Se toma del banco de palabras" : `Texto de la opción ${option.key}`}/>
                </label>)}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold">Respuesta correcta
                  <select value={question.answer} onChange={e => updateQuestion(index, { answer: e.target.value })} className="mt-2 w-full rounded-xl border p-3">
                    {(part === 2 ? wordBank.slice(0, 7).map((_, i) => String.fromCharCode(65 + i)) : question.options.map(option => option.key)).map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Explicación (opcional)
                  <input value={question.explanation} onChange={e => updateQuestion(index, { explanation: e.target.value })} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Por qué es correcta"/>
                </label>
              </div>
            </article>
          ))}
        </section>

        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{message}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          {savedSetId && <>
            <button type="button" onClick={() => window.location.assign("/dashboard/question-bank/english")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800">Ver banco de Inglés</button>
            <button type="button" onClick={resetForAnotherSet} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Crear otro conjunto</button>
          </>}
          <button type="button" onClick={save} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Save size={18}/>{loading ? "Guardando..." : "Guardar conjunto como borrador"}</button>
        </div>
      </div>
    </main>
  );
}

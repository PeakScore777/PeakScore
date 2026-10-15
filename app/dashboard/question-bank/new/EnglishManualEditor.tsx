"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

type Choice = { key: string; text: string };
type ManualQuestion = { prompt: string; options: Choice[]; answer: string; explanation: string; imageUrl: string };

const partNames: Record<number, string> = {
  1: "Avisos e imágenes",
  2: "Descripciones y banco de palabras",
  3: "Completar conversaciones",
  4: "Texto cloze: gramática y vocabulario",
  5: "Comprensión de lectura",
  6: "Lectura y comprensión inferencial",
  7: "Texto cloze con cuatro opciones",
};

const instructions: Record<number, string> = {
  1: "Crea un aviso o una imagen y tres lugares/situaciones posibles. La respuesta indica dónde se puede ver el aviso.",
  2: "Escribe descripciones breves y un banco compartido de palabras A–G. Puedes incluir H como ejemplo.",
  3: "Escribe una intervención de conversación y tres respuestas posibles.",
  4: "Añade un texto compartido con espacios numerados y tres opciones para cada espacio.",
  5: "Añade un texto de lectura y preguntas de comprensión con tres opciones.",
  6: "Añade un texto compartido y preguntas de comprensión/inferencia con tres opciones.",
  7: "Añade un texto compartido con espacios numerados y cuatro opciones por espacio.",
};

function makeQuestion(part: number, wordBank: string[]): ManualQuestion {
  const count = part === 7 ? 4 : 3;
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
  const [wordBankText, setWordBankText] = useState("","","");
  const [questions, setQuestions] = useState<ManualQuestion[]>([makeQuestion(1, [])]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const wordBank = useMemo(() => wordBankText.split("\n").map(x => x.trim()).filter(Boolean), [wordBankText]);

  function changePart(value: number) {
    setPart(value);
    setQuestions([makeQuestion(value, wordBank)]);
    setSharedText("");
    setError("");
    setMessage("");
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
      const words = value.split("\n").map(x => x.trim());
      setQuestions(current => current.map(question => ({
        ...question,
        options: question.options.map((option, index) => ({ ...option, text: words[index] ?? "" })),
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
      setMessage(`Conjunto guardado como borrador: ${result.count} pregunta(s). Aún no está activo en simulacros.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <button type="button" onClick={onBack} className="rounded-xl bg-white p-3 shadow" aria-label="Volver"><ArrowLeft size={20}/></button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas · Inglés</p>
            <h1 className="text-3xl font-bold text-slate-900">Editor manual de las 7 partes</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Crea contenido original y conserva juntos los textos, avisos, bancos de palabras y preguntas que comparten contexto.</p>
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

          {part === 2 && <label className="mt-5 block text-sm font-semibold">Banco de palabras compartido (una palabra por línea; A–G y opcionalmente H)
            <textarea value={wordBankText} onChange={e => changeWordBank(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={"beach\nbed\ncamera\nmountain\nsquare\nsuitcase\npool\ntowel"}/>
          </label>}

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
                {question.options.map((option, optionIndex) => <label key={option.key} className="block text-sm font-semibold">
                  Opción {option.key}{part === 2 ? " (palabra del banco)" : ""}
                  <input value={option.text} onChange={e => updateOption(index, optionIndex, e.target.value)} disabled={part === 2} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 2 ? "Se toma del banco de palabras" : `Texto de la opción ${option.key}`}/>
                </label>)}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold">Respuesta correcta
                  <select value={question.answer} onChange={e => updateQuestion(index, { answer: e.target.value })} className="mt-2 w-full rounded-xl border p-3">
                    {(part === 2 ? wordBank.map((_, i) => String.fromCharCode(65 + i)) : question.options.map(option => option.key)).map(key => <option key={key} value={key}>{key}</option>)}
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
        <div className="flex justify-end"><button type="button" onClick={save} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Save size={18}/>{loading ? "Guardando..." : "Guardar conjunto como borrador"}</button></div>
      </div>
    </main>
  );
}

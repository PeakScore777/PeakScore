"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Choice = { key: string; text: string };
type DraftQuestion = {
  prompt: string;
  options: Choice[];
  answer: string;
  explanation: string;
  imageUrl: string;
  imageFile: File | null;
};
const PARTS: Record<number, { name: string; count: number; guidance: string; choices: number }> = {
  1: { name: "Avisos e imágenes", count: 5, guidance: "Relaciona cada aviso o imagen con el lugar o situación correspondiente.", choices: 3 },
  2: { name: "Descripciones y banco de palabras", count: 5, guidance: "Cada descripción se completa con una opción del banco compartido A–G. H puede usarse como ejemplo.", choices: 0 },
  3: { name: "Completar conversaciones", count: 7, guidance: "Selecciona la respuesta que completa naturalmente la conversación.", choices: 3 },
  4: { name: "Texto cloze (4A o 4B)", count: 8, guidance: "Debes crear dos conjuntos independientes: Parte 4A (preguntas 97–104) y Parte 4B (105–112), cada uno con su propio texto.", choices: 3 },
  5: { name: "Comprensión de lectura", count: 7, guidance: "Texto de lectura compartido y preguntas de comprensión.", choices: 3 },
  6: { name: "Comprensión de lectura", count: 5, guidance: "Texto de lectura compartido y preguntas de comprensión.", choices: 4 },
  7: { name: "Texto cloze", count: 10, guidance: "Texto compartido con espacios numerados y cuatro opciones por espacio.", choices: 4 },
};
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const makeQuestion = (part: number): DraftQuestion => ({
  prompt: "",
  options: LETTERS.slice(0, PARTS[part].choices).map(key => ({ key, text: "" })),
  answer: "A",
  explanation: "",
  imageUrl: "",
  imageFile: null,
});
export default function EnglishManualEditor({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [part, setPart] = useState(1);
  const [part4Group, setPart4Group] = useState<"4A" | "4B">("4A");
  const [session, setSession] = useState("2");
  const [title, setTitle] = useState("");
  const [sharedText, setSharedText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [wordBankText, setWordBankText] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => Array.from({ length: 5 }, () => makeQuestion(1)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedSetId, setSavedSetId] = useState<string | null>(null);
  const wordBank = useMemo(() => wordBankText.split("\n").map(x => x.trim()).filter(Boolean), [wordBankText]);

  function changePart(next: number) {
    setPart(next);
    if (next === 4) setPart4Group("4A");
    setQuestions(Array.from({ length: PARTS[next].count }, () => makeQuestion(next)));
    setSharedText("");
    setWordBankText("");
    setInstructions("");
    setTitle("");
    setError("");
    setMessage("");
    setSavedSetId(null);
  }
  function patchQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions(current => current.map((q, i) => i === index ? { ...q, ...patch } : q));
  }
  function patchOption(qIndex: number, oIndex: number, value: string) {
    setQuestions(current => current.map((q, i) => i !== qIndex ? q : {
      ...q, options: q.options.map((o, j) => j === oIndex ? { ...o, text: value } : o),
    }));
  }
  function addQuestion() {
    if (questions.length >= 30) return;
    setQuestions(current => [...current, makeQuestion(part)]);
  }
  async function save() {
    setError(""); setMessage(""); setSavedSetId(null);
    if (!title.trim()) return setError("Escribe un nombre para el conjunto.");
    if (questions.some(q => !q.prompt.trim())) return setError("Completa el enunciado de todas las preguntas.");
    if (part === 2 && (wordBank.length < 7 || wordBank.length > 8)) return setError("La Parte 2 necesita siete opciones y, opcionalmente, una octava opción de ejemplo.");
    if ([4, 5, 6, 7].includes(part) && !sharedText.trim()) return setError("Añade el texto compartido de esta parte.");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (part !== 2 && q.options.some(o => !o.text.trim())) return setError(`Completa todas las opciones de la pregunta ${i + 1}.`);
      const validAnswers = part === 2 ? LETTERS.slice(0, 7) : q.options.map(o => o.key);
      if (!validAnswers.includes(q.answer)) return setError(`Selecciona una respuesta válida en la pregunta ${i + 1}.`);
    }
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Tu sesión no está activa. Inicia sesión de nuevo.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role,email").eq("id", user.id).maybeSingle();
      if (profileError) throw new Error("No se pudo verificar tu rol de administrador.");
      if (profile?.role !== "admin" && profile?.email?.toLowerCase() !== "aragonyostynsena07@gmail.com") {
        throw new Error("Solo el administrador autorizado puede crear conjuntos de Inglés.");
      }
      const { data: setRow, error: setError } = await supabase.from("english_question_sets").insert({
        part, session: Number(session), title: part === 4 ? `${part4Group} · ${title.trim()}` : title.trim(),
        shared_text: sharedText.trim() || null,
        instructions: (instructions.trim() || PARTS[part].guidance),
        word_bank: part === 2 ? wordBank.map((text, index) => ({ key: LETTERS[index], text, example: index === 7 })) : null,
        status: "draft", created_by: user.id,
      }).select("id").single();
      if (setError || !setRow) throw new Error(setError?.message || "No se pudo crear el conjunto.");
      const uploadedImageUrls = await Promise.all(questions.map(async (q, index) => {
        if (!q.imageFile) return q.imageUrl.trim() || null;
        const safeName = q.imageFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `english/${user.id}/${setRow.id}/${index + 1}-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("question-images").upload(path, q.imageFile, { upsert: false, contentType: q.imageFile.type });
        if (uploadError) throw new Error(`No se pudo subir la imagen de la pregunta ${index + 1}: ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from("question-images").getPublicUrl(path);
        return publicUrl.publicUrl;
      }));
      const rows = questions.map((q, index) => {
        const optionMap = part === 2
          ? Object.fromEntries(wordBank.slice(0, 7).map((text, i) => [LETTERS[i], text]))
          : Object.fromEntries(q.options.map(o => [o.key, o.text.trim()]));
        const options = part === 2 ? wordBank.slice(0, 7).map((text, i) => ({ key: LETTERS[i], text })) : q.options.map(o => ({ key: o.key, text: o.text.trim() }));
        return {
          subject: "Inglés", subject_id: null, session: Number(session),
          component: `Parte ${part === 4 ? part4Group : part} · ${PARTS[part].name}`, competence: null, difficulty: "Media",
          context_text: sharedText.trim() || null, question: q.prompt.trim(),
          option_a: optionMap.A ?? "", option_b: optionMap.B ?? "", option_c: optionMap.C ?? "", option_d: optionMap.D ?? "",
          correct_answer: q.answer, explanation: q.explanation.trim() || null,
          image_url: uploadedImageUrls[index], year: null, source: "PeakScore · creación manual",
          question_number: null, is_active: false, requires_visual: Boolean(uploadedImageUrls[index]),
          visual_type: null, visual_description: null, visual_data: null, chart_data: null,
          english_part: part, english_set_id: setRow.id, english_position: index + 1,
          english_options: options,
        };
      });
      const { error: questionsError } = await supabase.from("questions").insert(rows);
      if (questionsError) {
        throw new Error(`El conjunto se creó como borrador, pero falló el guardado de preguntas: ${questionsError.message}. ID del conjunto: ${setRow.id}`);
      }
      setSavedSetId(setRow.id);
      setMessage(`Borrador guardado: ${rows.length} preguntas. Queda inactivo hasta su revisión.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el conjunto.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <button type="button" onClick={onBack ?? (() => router.back())} className="rounded-xl bg-white p-3 shadow" aria-label="Volver"><ArrowLeft size={20}/></button>
          <div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas · Inglés</p><h1 className="text-3xl font-bold text-slate-900">Editor manual de las 7 partes</h1><p className="mt-2 text-slate-600">Crea conjuntos por parte, con textos compartidos, imágenes y opciones según el formato.</p></div>
        </header>
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Parte del examen<select value={part} onChange={e => changePart(Number(e.target.value))} className="mt-2 w-full rounded-xl border p-3">{Object.entries(PARTS).map(([key, value]) => <option key={key} value={key}>Parte {key} · {value.name} ({value.count})</option>)}</select></label>
            {part === 4 && <label className="text-sm font-semibold">Subparte<select value={part4Group} onChange={e => setPart4Group(e.target.value as "4A" | "4B")} className="mt-2 w-full rounded-xl border p-3"><option value="4A">Parte 4A · Preguntas 97–104</option><option value="4B">Parte 4B · Preguntas 105–112</option></select></label>}
            <label className="text-sm font-semibold">Sesión ICFES<select value={session} onChange={e => setSession(e.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="1">Sesión 1</option><option value="2">Sesión 2</option></select></label>
            <label className="text-sm font-semibold md:col-span-2">Nombre del conjunto<input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border p-3" placeholder={part === 4 ? `Ej. ${part4Group} — conjunto 01` : `Ej. Parte ${part} — conjunto 01`}/></label>
            <label className="text-sm font-semibold md:col-span-2">Instrucciones (opcional)<textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} maxLength={5000} className="mt-2 w-full rounded-xl border p-3" placeholder={PARTS[part].guidance}/></label>
          </div>
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950"><strong>Formato:</strong> {PARTS[part].guidance}</div>
          {part === 2 && <div className="mt-5"><label className="block text-sm font-semibold">Banco de palabras compartido (una opción por línea: A–G y opcionalmente H como ejemplo)<textarea value={wordBankText} onChange={e => setWordBankText(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={"beach\nbed\ncamera\nmountain\nsquare\nsuitcase\npool\ntowel"}/></label><div className="mt-3 grid gap-2 sm:grid-cols-2">{wordBank.map((word, i) => <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{LETTERS[i]}.</b> {word}{i === 7 ? " (ejemplo)" : ""}</div>)}</div></div>}
          {[4, 5, 6, 7].includes(part) && <label className="mt-5 block text-sm font-semibold">Texto compartido<textarea value={sharedText} onChange={e => setSharedText(e.target.value)} rows={8} maxLength={30000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 5 || part === 6 ? "Pega aquí el texto de lectura..." : "Pega aquí el texto e indica los espacios como (1), (2), (3)..."} /></label>}
        </section>
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Preguntas del conjunto</h2><p className="text-sm text-slate-600">{questions.length} pregunta(s) · máximo 30</p></div><button type="button" onClick={addQuestion} disabled={questions.length >= 30} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"><Plus size={18}/> Añadir pregunta</button></div>
          {questions.map((q, i) => <article key={i} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-7">
            <div className="flex items-center justify-between"><h3 className="font-bold">Pregunta {i + 1}</h3>{questions.length > 1 && <button type="button" onClick={() => setQuestions(current => current.filter((_, index) => index !== i))} className="inline-flex items-center gap-1 text-sm text-red-700"><Trash2 size={16}/> Eliminar</button>}</div>
            {part === 1 && <div className="space-y-3"><label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del aviso (desde tu carpeta)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen no puede superar 8 MB."); e.currentTarget.value = ""; return; } setError(""); patchQuestion(i, { imageFile: file, imageUrl: file ? URL.createObjectURL(file) : "" }); }} className="mt-2 w-full rounded-xl border p-3 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700" /></label>{q.imageUrl && <div className="rounded-xl border bg-slate-50 p-3"><img src={q.imageUrl} alt={`Vista previa de imagen de pregunta ${i + 1}`} className="max-h-64 max-w-full rounded-lg object-contain" /><button type="button" onClick={() => patchQuestion(i, { imageFile: null, imageUrl: "" })} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen</button></div>}<p className="text-xs text-slate-500">PNG, JPG, WEBP o GIF · máximo 8 MB. Se sube al guardar.</p></div>}
            <label className="block text-sm font-semibold">{part === 2 ? "Descripción en inglés" : part === 3 ? "Intervención de la conversación" : [4, 7].includes(part) ? "Número del espacio / enunciado" : "Pregunta o situación en inglés"}<textarea value={q.prompt} onChange={e => patchQuestion(i, { prompt: e.target.value })} rows={3} maxLength={10000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 2 ? "People take photos with this." : [4, 7].includes(part) ? "Ej. (1) _____" : "Escribe el enunciado en inglés..."}/></label>
            {part !== 2 && <div className="grid gap-3 md:grid-cols-2">{q.options.map((option, j) => <label key={option.key} className="block text-sm font-semibold">Opción {option.key}<input value={option.text} onChange={e => patchOption(i, j, e.target.value)} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={`Texto de la opción ${option.key}`}/></label>)}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Respuesta correcta<select value={q.answer} onChange={e => patchQuestion(i, { answer: e.target.value })} className="mt-2 w-full rounded-xl border p-3">{(part === 2 ? LETTERS.slice(0, 7) : q.options.map(o => o.key)).map(key => <option key={key} value={key}>{key}</option>)}</select></label>
              <label className="text-sm font-semibold">Explicación (opcional)<input value={q.explanation} onChange={e => patchQuestion(i, { explanation: e.target.value })} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Por qué es correcta"/></label>
            </div>
          </article>)}
        </section>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{message}</p>}
        <div className="flex flex-wrap justify-end gap-3">{savedSetId && <button type="button" onClick={() => router.push("/dashboard/question-bank")} className="rounded-xl border bg-white px-5 py-3 font-semibold">Volver al banco</button>}<button type="button" onClick={save} disabled={loading || Boolean(savedSetId)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Save size={18}/>{loading ? "Guardando..." : "Guardar conjunto como borrador"}</button></div>
      </div>
    </main>
  );
}

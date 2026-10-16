"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Choice = { key: string; text: string };
type DraftQuestion = {
  id?: string;
  prompt: string;
  options: Choice[];
  answer: string;
  explanation: string;
  imageUrl: string;
  imageFile: File | null;
};
const PARTS: Record<number, { name: string; count: number; guidance: string; choices: number }> = {
  1: { name: "Descripciones y banco de palabras", count: 5, guidance: "Relaciona cada descripción con una palabra del banco A–G. H es el ejemplo; sobran dos palabras.", choices: 0 },
  2: { name: "Avisos y lugares", count: 5, guidance: "Observa cada aviso y elige dónde puede encontrarse. Selecciona A, B o C.", choices: 3 },
  3: { name: "Completar conversaciones", count: 7, guidance: "Selecciona la respuesta que completa naturalmente la conversación.", choices: 3 },
  4: { name: "Texto cloze (4A o 4B)", count: 8, guidance: "Debes crear dos conjuntos independientes: Parte 4A (preguntas 97–104) y Parte 4B (105–112), cada uno con su propio texto.", choices: 3 },
  5: { name: "Comprensión de lectura", count: 7, guidance: "Texto de lectura compartido y preguntas de comprensión.", choices: 3 },
  6: { name: "Comprensión de lectura", count: 5, guidance: "Texto de lectura compartido y preguntas de comprensión.", choices: 4 },
  7: { name: "Texto cloze (7A o 7B)", count: 5, guidance: "Texto compartido con espacios numerados y cuatro opciones por espacio. Crea 7A y 7B como conjuntos separados.", choices: 4 },
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
  const [part7Group, setPart7Group] = useState<"7A" | "7B">("7A");
  const [session, setSession] = useState("2");
  const [difficulty, setDifficulty] = useState("Media");
  const [title, setTitle] = useState("");
  const [sharedText, setSharedText] = useState("");
  const [sharedImageFile, setSharedImageFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [wordBankText, setWordBankText] = useState("");
  const [examplePrompt, setExamplePrompt] = useState("");
  const [exampleAnswer, setExampleAnswer] = useState("H");
  const [exampleImageFile, setExampleImageFile] = useState<File | null>(null);
  const [exampleOptions, setExampleOptions] = useState<Choice[]>(() => ["A", "B", "C"].map(key => ({ key, text: "" })));
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => Array.from({ length: 5 }, () => makeQuestion(1)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedSetId, setSavedSetId] = useState<string | null>(null);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [editingQuestionIds, setEditingQuestionIds] = useState<string[]>([]);
  const [existingSharedImageUrl, setExistingSharedImageUrl] = useState("");
  const [existingExampleImageUrl, setExistingExampleImageUrl] = useState("");
  const wordBank = useMemo(() => wordBankText.split("\n").map(x => x.trim()).filter(Boolean), [wordBankText]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    let alive = true;
    setEditSetId(id);
    (async () => {
      setLoading(true);
      const { data: setRow, error: setLoadError } = await supabase.from("english_question_sets")
        .select("id,part,title,session,shared_image_url,example_image_url,instructions,example_prompt,example_options,example_answer")
        .eq("id", id).single();
      if (setLoadError || !setRow || setRow.part !== 4) {
        if (alive) { setError("No se pudo abrir este conjunto de Parte 4 para editar."); setLoading(false); }
        return;
      }
      const { data: rows, error: questionLoadError } = await supabase.from("questions")
        .select("id,question,option_a,option_b,option_c,correct_answer,explanation,image_url,english_options,english_position,difficulty")
        .eq("english_set_id", id).order("english_position", { ascending: true });
      if (questionLoadError || !rows || !rows.length) {
        if (alive) { setError("No se pudieron cargar las preguntas del conjunto."); setLoading(false); }
        return;
      }
      if (!alive) return;
      setPart(4);
      setPart4Group(/^4B\s*[·—-]/i.test(setRow.title) ? "4B" : "4A");
      setTitle(setRow.title.replace(/^4[AB]\s*[·—-]\s*/i, ""));
      setSession(String(setRow.session ?? 2));
      setInstructions(setRow.instructions ?? "");
      setExistingSharedImageUrl(setRow.shared_image_url ?? "");
      setExistingExampleImageUrl(setRow.example_image_url ?? "");
      setExamplePrompt(setRow.example_prompt ?? "");
      setExampleOptions((setRow.example_options as Choice[] | null) ?? ["A","B","C"].map(key => ({key,text:""})));
      setExampleAnswer(setRow.example_answer ?? "A");
      setEditingQuestionIds(rows.map((q: any) => q.id));
      setQuestions(rows.map((q: any) => ({
        id: q.id,
        prompt: q.question ?? "",
        options: (q.english_options as Choice[] | null)?.length ? q.english_options as Choice[] : [{key:"A",text:q.option_a},{key:"B",text:q.option_b},{key:"C",text:q.option_c}],
        answer: q.correct_answer ?? "A", explanation: q.explanation ?? "", imageUrl: q.image_url ?? "", imageFile: null,
      })));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  function changePart(next: number) {
    setPart(next);
    if (next === 4) setPart4Group("4A");
    if (next === 7) setPart7Group("7A");
    setQuestions(Array.from({ length: PARTS[next].count }, () => makeQuestion(next)));
    setSharedText("");
    setSharedImageFile(null);
    setWordBankText("");
    setExamplePrompt("");
    setExampleAnswer(next === 1 ? "H" : "A");
    setExampleImageFile(null);
    setExampleOptions(LETTERS.slice(0, PARTS[next].choices || 3).map(key => ({ key, text: "" })));
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
    const maxQuestions = part === 1 ? 5 : part === 4 ? PARTS[4].count : 30;
    if (questions.length >= maxQuestions) return;
    setQuestions(current => [...current, makeQuestion(part)]);
  }
  async function save() {
    setError(""); setMessage(""); setSavedSetId(null);
    if (!title.trim()) return setError("Escribe un nombre para el conjunto.");
    if (part === 4 && questions.length !== PARTS[4].count) return setError(`La Parte ${part4Group} debe tener exactamente ${PARTS[4].count} preguntas.`);
    if (part !== 4 && questions.some(q => !q.prompt.trim())) return setError("Completa el enunciado de todas las preguntas.");
    if (part === 1 && wordBank.length !== 8) return setError("La Parte 1 necesita exactamente ocho palabras, de A a H.");
    if (part === 1 && !examplePrompt.trim()) return setError("Escribe el enunciado de ejemplo, como en el cuadernillo ICFES.");
    if (part === 3 && !exampleImageFile) return setError("Sube la imagen del ejemplo de conversación (Nova y Zyra, por ejemplo).");
    if (part !== 1 && part !== 3 && !examplePrompt.trim()) return setError("Completa el ejemplo inicial del conjunto, como en el cuadernillo ICFES.");
    if (part !== 1 && part !== 3 && exampleOptions.some(option => !option.text.trim())) return setError("Completa todas las opciones del ejemplo inicial.");
    if (part !== 1 && part !== 3 && !exampleOptions.some(option => option.key === exampleAnswer)) return setError("Selecciona una respuesta válida para el ejemplo.");
    if (part === 2 && questions.some(q => !q.imageFile && !q.imageUrl.trim())) return setError("Sube la imagen del aviso para cada pregunta de la Parte 2.");
    
    if (part === 4 && !sharedImageFile && !existingSharedImageUrl) return setError("Sube la imagen del texto compartido de la Parte 4.");
    if (part === 4 && questions.some(q => !q.explanation.trim())) return setError("Escribe una explicación en español para cada espacio de la Parte 4.");
    if ([5, 6, 7].includes(part) && !sharedText.trim()) return setError("Añade el texto compartido de esta parte.");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (part !== 1 && q.options.some(o => !o.text.trim())) return setError(`Completa todas las opciones de la pregunta ${i + 1}.`);
      const validAnswers = part === 1 ? LETTERS.filter(key => key !== exampleAnswer) : q.options.map(o => o.key);
      if (!validAnswers.includes(q.answer)) return setError(part === 1 ? `La pregunta ${i + 1} no puede usar la letra reservada para el ejemplo (${exampleAnswer}).` : `Selecciona una respuesta válida en la pregunta ${i + 1}.`);
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
      let uploadedExampleImageUrl: string | null = existingExampleImageUrl || null;
      let uploadedSharedImageUrl: string | null = existingSharedImageUrl || null;
      if (part !== 1 && exampleImageFile) {
        if (exampleImageFile.size > 8 * 1024 * 1024) throw new Error("La imagen del ejemplo supera el máximo de 8 MB.");
        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(exampleImageFile.type)) throw new Error("La imagen del ejemplo debe ser PNG, JPG, WEBP o GIF.");
        const safeExampleName = exampleImageFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
        const examplePath = `english/${user.id}/examples/${Date.now()}-${safeExampleName}`;
        const { error: exampleUploadError } = await supabase.storage.from("question-images").upload(examplePath, exampleImageFile, { upsert: false, contentType: exampleImageFile.type });
        if (exampleUploadError) throw new Error(`No se pudo subir la imagen del ejemplo: ${exampleUploadError.message}`);
        uploadedExampleImageUrl = supabase.storage.from("question-images").getPublicUrl(examplePath).data.publicUrl;
      }
      if (part === 4 && sharedImageFile) {
        if (sharedImageFile.size > 8 * 1024 * 1024) throw new Error("La imagen del texto supera el máximo de 8 MB.");
        if (!["image/png", "image/jpeg", "image/webp"].includes(sharedImageFile.type)) throw new Error("La imagen del texto debe ser PNG, JPG o WEBP.");
        const safeSharedName = sharedImageFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
        const sharedPath = "english/" + user.id + "/shared/" + Date.now() + "-" + safeSharedName;
        const { error: sharedUploadError } = await supabase.storage.from("question-images").upload(sharedPath, sharedImageFile, { upsert: false, contentType: sharedImageFile.type });
        if (sharedUploadError) throw new Error("No se pudo subir la imagen del texto: " + sharedUploadError.message);
        uploadedSharedImageUrl = supabase.storage.from("question-images").getPublicUrl(sharedPath).data.publicUrl;
      }
      const setPayload = {
        part, session: Number(session), title: part === 4 ? `${part4Group} · ${title.trim()}` : part === 7 ? `${part7Group} · ${title.trim()}` : title.trim(),
        shared_text: part === 4 ? null : sharedText.trim() || null,
        shared_image_url: part === 4 ? uploadedSharedImageUrl : null,
        instructions: (instructions.trim() || PARTS[part].guidance),
        example_prompt: part === 1 || part === 3 ? null : examplePrompt.trim() || null,
        example_options: part === 1 || part === 3 ? null : exampleOptions.map(option => ({ key: option.key, text: option.text.trim() })),
        example_answer: part === 1 || part === 3 ? null : exampleAnswer,
        example_image_url: part === 1 ? null : uploadedExampleImageUrl,
        word_bank: part === 1 ? wordBank.map((text, index) => ({ key: LETTERS[index], text, example: LETTERS[index] === exampleAnswer, ...(LETTERS[index] === exampleAnswer ? { example_description: examplePrompt.trim(), example_answer: exampleAnswer } : {}) })) : null,
        status: "draft",
      };
      let setRow: { id: string } | null = null;
      let setError: { message: string } | null = null;
      if (editSetId) {
        const result = await supabase.from("english_question_sets").update(setPayload).eq("id", editSetId).select("id").single();
        setRow = result.data; setError = result.error;
      } else {
        const result = await supabase.from("english_question_sets").insert({ ...setPayload, created_by: user.id }).select("id").single();
        setRow = result.data; setError = result.error;
      }
      if (setError || !setRow) throw new Error(setError?.message || "No se pudo guardar el conjunto.");
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
        const optionMap = part === 1
          ? Object.fromEntries(wordBank.slice(0, 7).map((text, i) => [LETTERS[i], text]))
          : Object.fromEntries(q.options.map(o => [o.key, o.text.trim()]));
        const options = part === 1 ? [] : q.options.map(o => ({ key: o.key, text: o.text.trim() }));
        return {
          subject: "Inglés", subject_id: null, session: Number(session),
          component: `Parte ${part === 4 ? part4Group : part === 7 ? part7Group : part} · ${PARTS[part].name}`, competence: null, difficulty,
          context_text: part === 4 ? null : sharedText.trim() || null, question: part === 4 ? `Completa el espacio ${(part4Group === "4A" ? 97 : 105) + index} del texto compartido.` : q.prompt.trim(),
          option_a: optionMap.A ?? "N/A", option_b: optionMap.B ?? "N/A", option_c: optionMap.C ?? "N/A", option_d: optionMap.D ?? "N/A",
          correct_answer: q.answer, explanation: q.explanation.trim() || null,
          image_url: uploadedImageUrls[index], year: null, source: "PeakScore · creación manual",
          question_number: part === 4 ? (part4Group === "4A" ? 97 : 105) + index : null, is_active: false, requires_visual: Boolean(uploadedImageUrls[index]),
          visual_type: null, visual_description: null, visual_data: null, chart_data: null,
          english_part: part, english_set_id: setRow.id, english_position: index + 1,
          english_options: options,
        };
      });
      let questionsError: { message: string } | null = null;
      if (editSetId) {
        const retainedQuestionIds = new Set(questions.flatMap((question) => question.id ? [question.id] : []));
        for (let index = 0; index < rows.length; index++) {
          const questionId = questions[index].id;
          if (questionId) {
            const result = await supabase.from("questions")
              .update(rows[index])
              .eq("id", questionId)
              .eq("english_set_id", editSetId)
              .select("id")
              .single();
            if (result.error || !result.data) {
              questionsError = result.error ?? { message: `No se encontró la pregunta existente en la posición ${index + 1}.` };
              break;
            }
          } else {
            const result = await supabase.from("questions")
              .insert(rows[index])
              .select("id")
              .single();
            if (result.error || !result.data) {
              questionsError = result.error ?? { message: `No se pudo crear la pregunta nueva en la posición ${index + 1}.` };
              break;
            }
            const insertedId = result.data.id as string;
            setQuestions((current) => current.map((question, currentIndex) => currentIndex === index ? { ...question, id: insertedId } : question));
            setEditingQuestionIds((current) => current.includes(insertedId) ? current : [...current, insertedId]);
          }
        }
        if (!questionsError) {
          const removedQuestionIds = editingQuestionIds.filter((id) => !retainedQuestionIds.has(id));
          if (removedQuestionIds.length) {
            const result = await supabase.from("questions")
              .delete()
              .eq("english_set_id", editSetId)
              .in("id", removedQuestionIds);
            if (result.error) questionsError = result.error;
          }
        }
      } else {
        const result = await supabase.from("questions").insert(rows);
        questionsError = result.error;
      }
      if (questionsError) throw new Error(`El conjunto se guardó, pero no se pudieron guardar todas las preguntas: ${questionsError.message}. ID: ${setRow.id}`);
      setSavedSetId(setRow.id);
      setMessage(`${editSetId ? "Cambios guardados" : "Borrador guardado"}: ${rows.length} preguntas. Queda inactivo hasta su revisión.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el conjunto.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <button type="button" onClick={onBack ?? (() => router.back())} className="rounded-xl bg-white p-3 shadow" aria-label="Volver"><ArrowLeft size={20}/></button>
          <div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas · Inglés</p><h1 className="text-3xl font-bold text-slate-900">Editor manual de las 7 partes</h1><p className="mt-2 text-slate-600">Crea conjuntos por parte, con textos compartidos, imágenes y opciones según el formato.</p></div>
        </header>
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Parte del examen<select value={part} onChange={e => changePart(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400">{Object.entries(PARTS).map(([key, value]) => <option key={key} value={key}>Parte {key} · {value.name} ({value.count})</option>)}</select></label>
            {part === 4 && <label className="text-sm font-semibold">Subparte<select value={part4Group} onChange={e => setPart4Group(e.target.value as "4A" | "4B")} className="mt-2 w-full rounded-xl border p-3"><option value="4A">Parte 4A · Preguntas 97–104</option><option value="4B">Parte 4B · Preguntas 105–112</option></select></label>}
            {part === 7 && <label className="text-sm font-semibold">Subparte<select value={part7Group} onChange={e => setPart7Group(e.target.value as "7A" | "7B")} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="7A">Parte 7A</option><option value="7B">Parte 7B</option></select></label>}
            <label className="text-sm font-semibold">Sesión ICFES<select value={session} onChange={e => setSession(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="1">Sesión 1</option><option value="2">Sesión 2</option></select></label>
            <label className="text-sm font-semibold">Dificultad del conjunto<select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="Fácil">Fácil</option><option value="Media">Media</option><option value="Difícil">Difícil</option></select></label>
            <label className="text-sm font-semibold md:col-span-2">Nombre del conjunto<input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400" placeholder={part === 4 ? `Ej. ${part4Group} — conjunto 01` : `Ej. Parte ${part} — conjunto 01`}/></label>
            <label className="text-sm font-semibold md:col-span-2">Instrucciones (opcional)<textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400" placeholder={PARTS[part].guidance}/></label>
          </div>
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950"><strong>Formato:</strong> {PARTS[part].guidance}</div>
          {part === 1 && <div className="mt-5 space-y-4"><div className="grid gap-3 md:grid-cols-[1fr_12rem]"><label className="block text-sm font-semibold">Enunciado de ejemplo (no se califica)<textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900" placeholder="Example: This is a place to go shopping for vegetables, meat, among other things."/></label><label className="block text-sm font-semibold">Letra de ejemplo<select value={exampleAnswer} onChange={e => setExampleAnswer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900">{LETTERS.map(key => <option key={key} value={key}>{key}</option>)}</select></label></div><label className="block text-sm font-semibold">Banco de palabras compartido (A–H; selecciona cuál es el ejemplo)<textarea value={wordBankText} onChange={e => setWordBankText(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={"basement\nbathroom\nbookstore\ncafé\ncinema\nelevator\nplayground\nsupermarket"}/></label><div className="mt-3 grid gap-2 sm:grid-cols-2">{wordBank.map((word, i) => <div key={i} className={`rounded-lg p-3 text-sm ${LETTERS[i] === exampleAnswer ? "border-2 border-slate-900 bg-slate-100 font-bold underline" : "bg-slate-50"}`}><b>{LETTERS[i]}.</b> {word}{LETTERS[i] === exampleAnswer ? " (ejemplo)" : ""}</div>)}</div><p className="text-xs text-slate-500">El ejemplo se muestra antes de las cinco preguntas calificadas y no se guarda como pregunta puntuable. La letra elegida para el ejemplo queda excluida de las respuestas de las cinco preguntas.</p></div>}
          {part === 4 && <div className="mt-5 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div><h3 className="font-bold text-slate-900">Ejemplo inicial (no puntuable)</h3><p className="mt-1 text-sm text-slate-600">Se mostrará como pregunta 0, antes de las preguntas de la subparte.</p></div>
            <label className="block text-sm font-semibold">Enunciado del ejemplo<textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={2} maxLength={10000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder="Escribe una frase breve con el espacio de ejemplo (0) ____..." /></label>
            <div className="grid gap-3 md:grid-cols-3">{exampleOptions.map((option, index) => <label key={option.key} className="block text-sm font-semibold">Opción de ejemplo {option.key}<input value={option.text} onChange={e => setExampleOptions(current => current.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder={"Texto de la opción " + option.key} /></label>)}</div>
            <label className="block text-sm font-semibold">Respuesta del ejemplo<select value={exampleAnswer} onChange={e => setExampleAnswer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3">{exampleOptions.map(option => <option key={option.key} value={option.key}>{option.key}</option>)}</select></label>
            <label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del texto compartido (obligatoria)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen no puede superar 8 MB."); e.currentTarget.value = ""; return; } setError(""); setSharedImageFile(file); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Sube una sola imagen que contenga el texto con los ocho espacios numerados. PNG, JPG o WEBP · máximo 8 MB. Las ocho preguntas y sus opciones se ingresan por separado.</span>
            </label>
            {!sharedImageFile && existingSharedImageUrl && <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="mb-2 text-xs font-medium text-slate-600">Imagen guardada actualmente. Se conservará si no seleccionas otra.</p><img src={existingSharedImageUrl} alt="Imagen actual del texto compartido de la Parte 4" className="max-h-[480px] max-w-full object-contain"/></div>}
            {sharedImageFile && <div className="rounded-lg border border-slate-200 bg-white p-3"><img src={URL.createObjectURL(sharedImageFile)} alt="Vista previa del texto compartido de la Parte 4" className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setSharedImageFile(null)} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen</button></div>}
          </div>}
          {[5, 6, 7].includes(part) && <label className="mt-5 block text-sm font-semibold">Texto compartido<textarea value={sharedText} onChange={e => setSharedText(e.target.value)} rows={8} maxLength={30000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={part === 5 || part === 6 ? "Pega aquí el texto de lectura..." : "Pega aquí el texto e indica los espacios como (1), (2), (3)..."} /></label>}
          {part !== 1 && part !== 4 && <div className="mt-5 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div><h3 className="font-bold text-slate-900">Ejemplo inicial (no puntuable)</h3><p className="mt-1 text-sm text-slate-600">Se mostrará antes de las preguntas del conjunto, siguiendo la estructura del cuadernillo.</p></div>
            <label className="block text-sm font-semibold">Imagen del ejemplo (opcional)
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setExampleImageFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" />
              <span className="mt-1 block text-xs font-normal text-slate-500">PNG, JPG, WEBP o GIF · máximo 8 MB. Se sube al guardar.</span>
            </label>
            {!exampleImageFile && existingExampleImageUrl && <div className="space-y-2"><p className="text-xs text-slate-600">Imagen de ejemplo guardada. Se conservará si no seleccionas otra.</p><img src={existingExampleImageUrl} alt="Imagen de ejemplo guardada" className={part === 3 ? "max-h-80 max-w-full rounded-lg border border-slate-200 bg-white object-contain" : "max-h-48 rounded-lg border border-slate-200 bg-white object-contain"} /></div>}
            {exampleImageFile && <div className="space-y-2"><p className="text-xs text-slate-600">Imagen seleccionada: {exampleImageFile.name}</p><img src={URL.createObjectURL(exampleImageFile)} alt="Vista previa de la conversación de ejemplo" className={part === 3 ? "max-h-80 max-w-full rounded-lg border border-slate-200 bg-white object-contain" : "max-h-48 rounded-lg border border-slate-200 bg-white object-contain"} /></div>}
            {part !== 3 && <>
              <label className="block text-sm font-semibold">Enunciado del ejemplo<textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={2} maxLength={10000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder="Escribe aquí el enunciado de ejemplo..." /></label>
              <div className="grid gap-3 md:grid-cols-2">{exampleOptions.map((option, index) => <label key={option.key} className="block text-sm font-semibold">Opción de ejemplo {option.key}<input value={option.text} onChange={e => setExampleOptions(current => current.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder={"Texto de la opción " + option.key} /></label>)}</div>
              <label className="block text-sm font-semibold">Respuesta del ejemplo<select value={exampleAnswer} onChange={e => setExampleAnswer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3">{exampleOptions.map(option => <option key={option.key} value={option.key}>{option.key}</option>)}</select></label>
            </>}
            {part === 3 && <p className="text-xs text-slate-600">Para la Parte 3, el ejemplo se compone únicamente de una imagen del diálogo completo, como en el cuadernillo ICFES. La respuesta de ejemplo queda representada dentro de esa imagen.</p>}
          </div>}
        </section>
        {part === 1 && <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <header className="border-b border-slate-300 px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inglés · Sesión {session}</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">{title.trim() || "Parte 1 · Descripciones y banco de palabras"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{instructions.trim() || PARTS[1].guidance}</p>
          </header>
          <div className="p-6">
            <div className="mb-6 rounded-md border border-slate-300 p-4">
              <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-slate-700">Ejemplo</p>
              <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
                <p className="text-sm leading-6 text-slate-800"><strong>0.</strong> {examplePrompt.trim() || "Aquí aparecerá el enunciado de ejemplo."}</p>
                <div className="flex flex-wrap items-center gap-2"><strong className="mr-1 text-xs">Respuesta 0.</strong>{LETTERS.map(key => <span key={key} className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${key === exampleAnswer ? "border-slate-950 bg-slate-950 text-white ring-2 ring-slate-300" : "border-slate-300 text-slate-600"}`}>{key}</span>)}</div>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div><h3 className="mb-3 border-b border-slate-300 pb-2 text-center text-xs font-black uppercase tracking-widest">Descripciones</h3><div className="space-y-0">{questions.map((q, i) => <div key={i} className="flex gap-3 border-b border-dotted border-slate-300 py-3 text-sm leading-6"><strong className="shrink-0">{80 + i}.</strong><span className="whitespace-pre-wrap">{q.prompt || "Descripción en inglés…"}</span></div>)}</div></div>
              <div><h3 className="mb-3 border-b border-slate-300 pb-2 text-center text-xs font-black uppercase tracking-widest">Palabras</h3><div className="space-y-0">{wordBank.map((word, i) => <div key={`${word}-${i}`} className={`flex gap-3 border-b border-dotted border-slate-200 py-2 text-sm leading-6 ${LETTERS[i] === exampleAnswer ? "font-bold underline decoration-2 underline-offset-2" : ""}`}><strong className="shrink-0">{LETTERS[i]}.</strong><span>{word}</span>{LETTERS[i] === exampleAnswer && <span className="text-xs">(ejemplo)</span>}</div>)}{wordBank.length === 0 && <p className="py-3 text-sm text-slate-400">Las palabras del banco aparecerán aquí.</p>}</div></div>
            </div>
            <p className="mt-6 border-t border-slate-300 pt-3 text-[10px] text-slate-500">PeakScore · Vista previa del cuadernillo. Las respuestas correctas no se muestran.</p>
          </div>
        </section>}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Preguntas del conjunto</h2><p className="text-sm text-slate-600">{questions.length} pregunta(s) · {part === 1 ? "máximo 5 según el formato ICFES" : part === 4 ? "exactamente 8 por subparte" : "máximo 30"}</p></div><button type="button" onClick={addQuestion} disabled={questions.length >= (part === 1 ? 5 : part === 4 ? PARTS[4].count : 30)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"><Plus size={18}/> Añadir pregunta</button></div>
          {questions.map((q, i) => <article key={i} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-7">
            <div className="flex items-center justify-between"><h3 className="font-bold">Pregunta {i + 1}</h3>{questions.length > 1 && <button type="button" onClick={() => setQuestions(current => current.filter((_, index) => index !== i))} className="inline-flex items-center gap-1 text-sm text-red-700"><Trash2 size={16}/> Eliminar</button>}</div>
            {part === 2 && <div className="space-y-3"><label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del aviso (desde tu carpeta)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen no puede superar 8 MB."); e.currentTarget.value = ""; return; } setError(""); patchQuestion(i, { imageFile: file, imageUrl: file ? URL.createObjectURL(file) : "" }); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700" /></label>{q.imageUrl && <div className="rounded-xl border bg-slate-50 p-3"><img src={q.imageUrl} alt={`Vista previa de imagen de pregunta ${i + 1}`} className="max-h-64 max-w-full rounded-lg object-contain" /><button type="button" onClick={() => patchQuestion(i, { imageFile: null, imageUrl: "" })} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen</button></div>}<p className="text-xs text-slate-500">PNG, JPG, WEBP o GIF · máximo 8 MB. Se sube al guardar.</p></div>}
            {part === 4 ? <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm"><strong>Espacio {(part4Group === "4A" ? 97 : 105) + i}.</strong> El número se asigna automáticamente según la subparte. El texto compartido se carga una sola vez como imagen.</div> : <label className="block text-sm font-semibold">{part === 2 ? "Texto del aviso o pregunta asociada" : part === 1 ? "Descripción en inglés" : part === 3 ? "Intervención de la conversación" : part === 7 ? "Número del espacio / enunciado" : "Pregunta o situación en inglés"}<textarea value={q.prompt} onChange={e => patchQuestion(i, { prompt: e.target.value })} rows={3} maxLength={10000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={part === 2 ? "Where can you see this notice?" : part === 1 ? "Example: You wear these on your feet." : part === 7 ? "Ej. (1) _____" : "Escribe el enunciado en inglés..."}/></label>}
            <div className="grid gap-3 md:grid-cols-2">{q.options.map((option, j) => <label key={option.key} className="block text-sm font-semibold">Opción {option.key}<input value={option.text} onChange={e => patchOption(i, j, e.target.value)} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={`Texto de la opción ${option.key}`}/></label>)}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Respuesta correcta<select value={q.answer} onChange={e => patchQuestion(i, { answer: e.target.value })} className="mt-2 w-full rounded-xl border p-3">{(part === 1 ? LETTERS.filter(key => key !== exampleAnswer).map(key => ({ key, text: key })) : q.options).map(o => <option key={o.key} value={o.key}>{o.key}</option>)}</select></label>
              <label className="text-sm font-semibold">Explicación {part === 4 ? "(obligatoria, en español)" : "(opcional)"}<input value={q.explanation} onChange={e => patchQuestion(i, { explanation: e.target.value })} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 4 ? "Explica en español la regla gramatical y por qué encaja aquí" : "Por qué es correcta"}/></label>
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

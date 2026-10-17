"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Choice = { key: string; text: string };
type DraftQuestion = {
  id?: string;
  isActive?: boolean;
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
  4: { name: "Texto cloze", count: 8, guidance: "Texto cloze compartido con ocho espacios numerados y tres opciones A–C por espacio.", choices: 3 },
  5: { name: "Comprensión de lectura", count: 7, guidance: "Texto de lectura compartido y preguntas de comprensión.", choices: 3 },
  6: { name: "Comprensión inferencial", count: 5, guidance: "Texto de interés general y cinco preguntas inferenciales sobre la intención del autor, ideas generales y detalles relevantes. Cuatro opciones (A–D), sin ejemplo inicial. Nivel de referencia Saber 11: B1.", choices: 4 },
  7: { name: "Texto cloze", count: 10, guidance: "Texto cloze compartido: subparte y numeración dependen del perfil de cuadernillo seleccionado. Cada espacio tiene cuatro opciones A–D.", choices: 4 },
};
type BookletFormat = "saber11_2026" | "historical";
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function getQuestionCount(part: number, format: BookletFormat, part7Group: "7A" | "7B") {
  if (part === 7) return format === "saber11_2026" && part7Group === "7A" ? 8 : 10;
  return PARTS[part]?.count ?? 30;
}
function getQuestionStart(part: number, format: BookletFormat, part4Group: "4A" | "4B", part7Group: "7A" | "7B") {
  if (part === 1) return 80;
  if (part === 2) return 85;
  if (part === 3) return 90;
  if (part === 4) return format === "historical" && part4Group === "4B" ? 105 : 97;
  if (part === 5) return format === "historical" ? 113 : 105;
  if (part === 6) return format === "historical" ? 120 : 112;
  if (part === 7) return format === "saber11_2026" && part7Group === "7A" ? 117 : 125;
  return 1;
}
function getPartGuidance(part: number, format: BookletFormat, part4Group: "4A" | "4B", part7Group: "7A" | "7B") {
  if (part === 4) return format === "saber11_2026"
    ? "Un solo conjunto de texto cloze para la Parte 4, con ocho espacios (97–104)."
    : part4Group === "4A"
      ? "Parte 4A: ocho espacios (97–104). La Parte 4B es un conjunto independiente del formato anterior."
      : "Parte 4B del formato anterior: ocho espacios (105–112).";
  if (part === 5) return format === "saber11_2026"
    ? "Texto de lectura compartido y siete preguntas (105–111)."
    : "Texto de lectura compartido y siete preguntas (113–119) del formato anterior.";
  if (part === 6) return format === "saber11_2026"
    ? "Texto de interés general y cinco preguntas inferenciales (112–116), con cuatro opciones A–D y sin ejemplo inicial."
    : "Texto de interés general y cinco preguntas inferenciales (120–124), con cuatro opciones A–D y sin ejemplo inicial.";
  if (part === 7) {
    const start = getQuestionStart(7, format, part4Group, part7Group);
    const end = start + getQuestionCount(7, format, part7Group) - 1;
    return `Texto cloze ${part7Group}: imagen con el ejemplo (0) y los espacios numerados ${start}–${end}. Cada espacio tiene opciones A–D.`;
  }
  return PARTS[part]?.guidance ?? "";
}
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
  const [bookletFormat, setBookletFormat] = useState<BookletFormat>("saber11_2026");
  const [needsFormatReview, setNeedsFormatReview] = useState(false);
  const [confirmFormatReview, setConfirmFormatReview] = useState(false);
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
  const [existingSetStatus, setExistingSetStatus] = useState("draft");
  const wordBank = useMemo(() => wordBankText.split("\n").map(x => x.trim()).filter(Boolean), [wordBankText]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    let alive = true;
    setEditSetId(id);
    (async () => {
      setLoading(true);
      setError("");
      const { data: setRow, error: setLoadError } = await supabase.from("english_question_sets")
        .select("id,part,title,session,status,booklet_format,shared_text,shared_image_url,example_image_url,instructions,example_prompt,example_options,example_answer,word_bank")
        .eq("id", id).single();
      if (setLoadError || !setRow || !PARTS[setRow.part]) {
        if (alive) { setError("No se pudo abrir el conjunto seleccionado para editar."); setLoading(false); }
        return;
      }
      const { data: rows, error: questionLoadError } = await supabase.from("questions")
        .select("id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,image_url,english_options,english_position,difficulty,is_active")
        .eq("english_set_id", id).order("english_position", { ascending: true });
      if (questionLoadError || !rows || !rows.length) {
        if (alive) { setError("No se pudieron cargar las preguntas del conjunto."); setLoading(false); }
        return;
      }
      if (!alive) return;

      const loadedWordBank = Array.isArray(setRow.word_bank)
        ? setRow.word_bank as { key: string; text: string; example?: boolean; example_description?: string; example_answer?: string }[]
        : [];
      const exampleWord = loadedWordBank.find(word => word.example);
      const loadedTitle = setRow.title ?? "";

      setPart(setRow.part);
      const loadedFormat: BookletFormat = setRow.booklet_format === "historical" ? "historical" : "saber11_2026";
      setBookletFormat(loadedFormat);
      setNeedsFormatReview(setRow.booklet_format === "custom_review");
      setConfirmFormatReview(setRow.booklet_format === "custom_review");
      setPart4Group(/^4B\s*[·—-]/i.test(loadedTitle) ? "4B" : "4A");
      setPart7Group(/^7B\s*[·—-]/i.test(loadedTitle) ? "7B" : "7A");
      setTitle(loadedTitle.replace(/^(?:4[AB]|7[AB])\s*[·—-]\s*/i, ""));
      setSession(String(setRow.session ?? 2));
      setDifficulty(rows[0]?.difficulty ?? "Media");
      setExistingSetStatus(setRow.status ?? "draft");
      setInstructions(setRow.instructions ?? "");
      setSharedText(setRow.shared_text ?? "");
      setWordBankText(loadedWordBank.map(word => word.text).join("\n"));
      setExistingSharedImageUrl(setRow.shared_image_url ?? "");
      setExistingExampleImageUrl(setRow.example_image_url ?? "");
      setExamplePrompt(setRow.part === 1 ? exampleWord?.example_description ?? "" : setRow.example_prompt ?? "");
      setExampleOptions((setRow.example_options as Choice[] | null) ?? ["A","B","C"].map(key => ({key,text:""})));
      setExampleAnswer(setRow.part === 1 ? exampleWord?.example_answer ?? exampleWord?.key ?? "H" : setRow.example_answer ?? "A");
      setSharedImageFile(null);
      setExampleImageFile(null);
      setEditingQuestionIds(rows.map((q: any) => q.id));
      setQuestions(rows.map((q: any) => {
        const loadedOptions = (q.english_options as Choice[] | null) ?? [];
        const fallbackOptions = [
          { key: "A", text: q.option_a },
          { key: "B", text: q.option_b },
          { key: "C", text: q.option_c },
          { key: "D", text: q.option_d },
        ].filter(option => Boolean(option.text?.trim()) && option.text !== "N/A");
        return {
          id: q.id,
          isActive: q.is_active ?? false,
          prompt: q.question ?? "",
          options: setRow.part === 1 ? [] : loadedOptions.length ? loadedOptions : fallbackOptions.length ? fallbackOptions : LETTERS.slice(0, PARTS[setRow.part].choices).map(key => ({ key, text: "" })),
          answer: q.correct_answer ?? "A",
          explanation: q.explanation ?? "",
          imageUrl: q.image_url ?? "",
          imageFile: null,
        };
      }));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  function changePart(next: number) {
    setPart(next);
    if (next === 4) setPart4Group("4A");
    if (next === 7) setPart7Group("7A");
    setNeedsFormatReview(false);
    setConfirmFormatReview(false);
    setQuestions(Array.from({ length: getQuestionCount(next, bookletFormat, "7A") }, () => makeQuestion(next)));
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
  function changeBookletFormat(next: BookletFormat) {
    setBookletFormat(next);
    setNeedsFormatReview(false);
    setConfirmFormatReview(true);
    const nextPart7Group = next === "historical" && part === 7 ? "7A" : part7Group;
    if (part === 7) setPart7Group(nextPart7Group);
    if (next === "saber11_2026" && part === 4) setPart4Group("4A");
    const desired = getQuestionCount(part, next, nextPart7Group);
    setQuestions(current => current.length < desired
      ? [...current, ...Array.from({ length: desired - current.length }, () => makeQuestion(part))]
      : current);
    setError("Revisa la numeración de la imagen después de cambiar el formato. No se eliminó ninguna pregunta automáticamente.");
  }
  function changePart7Group(next: "7A" | "7B") {
    if (bookletFormat === "historical" && next === "7B") return;
    const desired = getQuestionCount(7, bookletFormat, next);
    if (desired < questions.length) {
      const excessHasContent = questions.slice(desired).some(q =>
        Boolean(q.prompt.trim() || q.explanation.trim() || q.imageUrl || q.imageFile || q.options.some(o => o.text.trim()))
      );
      if (excessHasContent) {
        setError("Esta subparte necesita " + desired + " preguntas. Copia o limpia el contenido de las preguntas sobrantes antes de cambiar.");
        return;
      }
    }
    setPart7Group(next);
    setQuestions(current => current.length < desired
      ? [...current, ...Array.from({ length: desired - current.length }, () => makeQuestion(7))]
      : current.slice(0, desired));
    setError("");
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
    const maxQuestions = getQuestionCount(part, bookletFormat, part7Group);
    if (questions.length >= maxQuestions) return;
    setQuestions(current => [...current, makeQuestion(part)]);
  }
  async function save() {
    setError(""); setMessage(""); setSavedSetId(null);
    if (needsFormatReview) return setError("Este conjunto antiguo mezcla numeraciones. Elige explícitamente el formato 2026 o el histórico y corrige la imagen y los espacios antes de guardar.");
    if (confirmFormatReview) return setError("Confirma que corregiste el PNG y la numeración para el formato seleccionado.");
    if (!title.trim()) return setError("Escribe un nombre para el conjunto.");
    const expectedCount = getQuestionCount(part, bookletFormat, part7Group);
    if (questions.length !== expectedCount) {
      const start = getQuestionStart(part, bookletFormat, part4Group, part7Group);
      return setError(`Este conjunto debe tener exactamente ${expectedCount} preguntas (${start}–${start + expectedCount - 1}) para el formato seleccionado.`);
    }
    if (![4, 7].includes(part) && questions.some(q => !q.prompt.trim())) return setError("Completa el enunciado de todas las preguntas.");
    if (part === 1 && wordBank.length !== 8) return setError("La Parte 1 necesita exactamente ocho palabras, de A a H.");
    if (part === 1 && !examplePrompt.trim()) return setError("Escribe el enunciado de ejemplo, como en el cuadernillo ICFES.");
    if (part === 3 && !exampleImageFile) return setError("Sube la imagen del ejemplo de conversación (Nova y Zyra, por ejemplo).");
    if (![1, 3, 4, 6, 7].includes(part) && !examplePrompt.trim()) return setError("Completa el ejemplo inicial del conjunto, como en el cuadernillo ICFES.");
    if (part !== 1 && part !== 3 && part !== 6 && exampleOptions.some(option => !option.text.trim())) return setError("Completa todas las opciones del ejemplo inicial.");
    if (part !== 1 && part !== 3 && part !== 6 && !exampleOptions.some(option => option.key === exampleAnswer)) return setError("Selecciona una respuesta válida para el ejemplo.");
    if (part === 2 && questions.some(q => !q.imageFile && !q.imageUrl.trim())) return setError("Sube la imagen del aviso para cada pregunta de la Parte 2.");
    
    if (part === 4 && !sharedImageFile && !existingSharedImageUrl) return setError("Sube la imagen del texto compartido de la Parte 4.");
    if (part === 4 && questions.some(q => !q.explanation.trim())) return setError("Escribe una explicación en español para cada espacio de la Parte 4.");
    if (part === 5 && !sharedImageFile && !existingSharedImageUrl) return setError("Sube la imagen completa del texto de lectura de la Parte 5.");
    if (part === 7 && !sharedImageFile && !existingSharedImageUrl) {
      const start = getQuestionStart(part, bookletFormat, part4Group, part7Group);
      const end = start + expectedCount - 1;
      return setError(`Sube la imagen del texto de la Parte ${part7Group}, con el ejemplo (0) y los espacios ${start}–${end}.`);
    }
    if (part === 6 && !sharedText.trim()) return setError("Añade el texto compartido de esta parte.");
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
      let uploadedExampleImageUrl: string | null = part === 7 ? null : existingExampleImageUrl || null;
      let uploadedSharedImageUrl: string | null = existingSharedImageUrl || null;
      if (part !== 1 && part !== 7 && exampleImageFile) {
        if (exampleImageFile.size > 8 * 1024 * 1024) throw new Error("La imagen del ejemplo supera el máximo de 8 MB.");
        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(exampleImageFile.type)) throw new Error("La imagen del ejemplo debe ser PNG, JPG, WEBP o GIF.");
        const safeExampleName = exampleImageFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
        const examplePath = `english/${user.id}/examples/${Date.now()}-${safeExampleName}`;
        const { error: exampleUploadError } = await supabase.storage.from("question-images").upload(examplePath, exampleImageFile, { upsert: false, contentType: exampleImageFile.type });
        if (exampleUploadError) throw new Error(`No se pudo subir la imagen del ejemplo: ${exampleUploadError.message}`);
        uploadedExampleImageUrl = supabase.storage.from("question-images").getPublicUrl(examplePath).data.publicUrl;
      }
      if ([4, 5, 7].includes(part) && sharedImageFile) {
        if (sharedImageFile.size > 8 * 1024 * 1024) throw new Error("La imagen del texto supera el máximo de 8 MB.");
        if (!["image/png", "image/jpeg", "image/webp"].includes(sharedImageFile.type)) throw new Error("La imagen del texto debe ser PNG, JPG o WEBP.");
        const safeSharedName = sharedImageFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
        const sharedPath = "english/" + user.id + "/shared/" + Date.now() + "-" + safeSharedName;
        const { error: sharedUploadError } = await supabase.storage.from("question-images").upload(sharedPath, sharedImageFile, { upsert: false, contentType: sharedImageFile.type });
        if (sharedUploadError) throw new Error("No se pudo subir la imagen del texto: " + sharedUploadError.message);
        uploadedSharedImageUrl = supabase.storage.from("question-images").getPublicUrl(sharedPath).data.publicUrl;
      }
      const setPayload = {
        part, session: Number(session), booklet_format: bookletFormat,
        title: part === 4 && bookletFormat === "historical" ? `${part4Group} · ${title.trim()}` : part === 7 ? `${part7Group} · ${title.trim()}` : title.trim(),
        shared_title: null,
        shared_text: [5, 7].includes(part) ? null : sharedText.trim() || null,
        shared_image_url: part === 6 ? null : uploadedSharedImageUrl,
        instructions: instructions.trim() || getPartGuidance(part, bookletFormat, part4Group, part7Group),
        example_prompt: [1, 3, 4, 6, 7].includes(part) ? null : examplePrompt.trim() || null,
        example_options: part === 1 || part === 3 || part === 6 ? null : exampleOptions.map(option => ({ key: option.key, text: option.text.trim() })),
        example_answer: part === 1 || part === 3 || part === 6 ? null : exampleAnswer,
        example_image_url: [5, 6, 7].includes(part) ? null : uploadedExampleImageUrl,
        word_bank: part === 1 ? wordBank.map((text, index) => ({ key: LETTERS[index], text, example: LETTERS[index] === exampleAnswer, ...(LETTERS[index] === exampleAnswer ? { example_description: examplePrompt.trim(), example_answer: exampleAnswer } : {}) })) : null,
        status: editSetId ? existingSetStatus : "draft",
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
          component: `Parte ${part === 4 && bookletFormat === "historical" ? part4Group : part === 7 ? part7Group : part} · ${PARTS[part].name}`, competence: null, difficulty,
          context_text: [4, 7].includes(part) ? null : sharedText.trim() || null, question: [4, 7].includes(part) ? `Completa el espacio ${getQuestionStart(part, bookletFormat, part4Group, part7Group) + index} del texto compartido.` : q.prompt.trim(),
          option_a: optionMap.A ?? "N/A", option_b: optionMap.B ?? "N/A", option_c: optionMap.C ?? "N/A", option_d: optionMap.D ?? "N/A",
          correct_answer: q.answer, explanation: q.explanation.trim() || null,
          image_url: uploadedImageUrls[index], year: null, source: "PeakScore · creación manual",
          question_number: getQuestionStart(part, bookletFormat, part4Group, part7Group) + index, is_active: editSetId ? q.isActive ?? false : false, requires_visual: Boolean(uploadedImageUrls[index]),
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
      setMessage(editSetId
        ? `Cambios guardados: ${rows.length} preguntas. Estado del conjunto conservado: ${existingSetStatus}.`
        : `Borrador guardado: ${rows.length} preguntas. Queda inactivo hasta su revisión.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el conjunto.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-4">
          <button type="button" onClick={onBack ?? (() => router.back())} className="rounded-xl bg-white p-3 shadow" aria-label="Volver"><ArrowLeft size={20}/></button>
          <div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Banco de preguntas · Inglés</p><h1 className="text-3xl font-bold text-slate-900">{editSetId ? loading ? "Cargando página para editar..." : "Editar página completa" : "Editor manual de las 7 partes"}</h1><p className="mt-2 text-slate-600">{editSetId ? "Edita el conjunto existente. Los cambios se guardarán sobre esta misma página." : "Crea conjuntos por parte, con textos compartidos, imágenes y opciones según el formato."}</p></div>
        </header>
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold md:col-span-2">Formato de cuadernillo
              <select value={bookletFormat} onChange={e => changeBookletFormat(e.target.value as BookletFormat)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900">
                <option value="saber11_2026">Saber 11 · 2026: Parte 4 única; 7A (8) + 7B (10), total 55</option>
                <option value="historical">Formato anterior: 4A/4B; una Parte 7A (10), total 55</option>
              </select>
            </label>
            {(needsFormatReview || confirmFormatReview) && <div className="md:col-span-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <strong>Revisión de numeración requerida.</strong>
              <p className="mt-1">Revisa que el PNG, los espacios y las preguntas coincidan con el formato seleccionado. No se ha borrado contenido.</p>
              <label className="mt-2 flex items-start gap-2 font-medium"><input type="checkbox" checked={!confirmFormatReview && !needsFormatReview} onChange={e => { if (e.target.checked) { setNeedsFormatReview(false); setConfirmFormatReview(false); } else { setNeedsFormatReview(true); setConfirmFormatReview(true); } }} className="mt-1"/> Ya corregí la imagen y los números del texto.</label>
            </div>}
            <label className="text-sm font-semibold">Parte del examen<select value={part} onChange={e => changePart(Number(e.target.value))} disabled={Boolean(editSetId)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100">{Object.entries(PARTS).map(([key, value]) => <option key={key} value={key}>Parte {key} · {value.name} ({Number(key) === 7 ? "8/10 según subparte" : value.count})</option>)}</select></label>
            {part === 4 && bookletFormat === "historical" && <label className="text-sm font-semibold">Subparte<select value={part4Group} onChange={e => setPart4Group(e.target.value as "4A" | "4B")} className="mt-2 w-full rounded-xl border p-3"><option value="4A">Parte 4A · Preguntas 97–104</option><option value="4B">Parte 4B · Preguntas 105–112</option></select></label>}
            {part === 7 && <label className="text-sm font-semibold">Subparte<select value={part7Group} onChange={e => changePart7Group(e.target.value as "7A" | "7B")} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="7A">{bookletFormat === "saber11_2026" ? "Parte 7A · Preguntas 117–124 (8)" : "Parte 7A · Preguntas 125–134 (10)"}</option>{bookletFormat === "saber11_2026" && <option value="7B">Parte 7B · Preguntas 125–134 (10)</option>}</select></label>}
            <label className="text-sm font-semibold">Sesión ICFES<select value={session} onChange={e => setSession(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="1">Sesión 1</option><option value="2">Sesión 2</option></select></label>
            <label className="text-sm font-semibold">Dificultad del conjunto<select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="Fácil">Fácil</option><option value="Media">Media</option><option value="Difícil">Difícil</option></select></label>
            <label className="text-sm font-semibold md:col-span-2">Nombre del conjunto<input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400" placeholder={part === 4 ? `Ej. ${part4Group} — conjunto 01` : `Ej. Parte ${part} — conjunto 01`}/></label>
            <label className="text-sm font-semibold md:col-span-2">Instrucciones (opcional)<textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400" placeholder={getPartGuidance(part, bookletFormat, part4Group, part7Group)}/></label>
          </div>
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950"><strong>Formato:</strong> {getPartGuidance(part, bookletFormat, part4Group, part7Group)} <span className="mt-1 block text-xs">Numeración {getQuestionStart(part, bookletFormat, part4Group, part7Group)}–{getQuestionStart(part, bookletFormat, part4Group, part7Group) + getQuestionCount(part, bookletFormat, part7Group) - 1} · {getQuestionCount(part, bookletFormat, part7Group)} preguntas.</span></div>
          {part === 1 && <div className="mt-5 space-y-4"><div className="grid gap-3 md:grid-cols-[1fr_12rem]"><label className="block text-sm font-semibold">Enunciado de ejemplo (no se califica)<textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900" placeholder="Example: This is a place to go shopping for vegetables, meat, among other things."/></label><label className="block text-sm font-semibold">Letra de ejemplo<select value={exampleAnswer} onChange={e => setExampleAnswer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900">{LETTERS.map(key => <option key={key} value={key}>{key}</option>)}</select></label></div><label className="block text-sm font-semibold">Banco de palabras compartido (A–H; selecciona cuál es el ejemplo)<textarea value={wordBankText} onChange={e => setWordBankText(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={"basement\nbathroom\nbookstore\ncafé\ncinema\nelevator\nplayground\nsupermarket"}/></label><div className="mt-3 grid gap-2 sm:grid-cols-2">{wordBank.map((word, i) => <div key={i} className={`rounded-lg p-3 text-sm ${LETTERS[i] === exampleAnswer ? "border-2 border-slate-900 bg-slate-100 font-bold underline" : "bg-slate-50"}`}><b>{LETTERS[i]}.</b> {word}{LETTERS[i] === exampleAnswer ? " (ejemplo)" : ""}</div>)}</div><p className="text-xs text-slate-500">El ejemplo se muestra antes de las cinco preguntas calificadas y no se guarda como pregunta puntuable. La letra elegida para el ejemplo queda excluida de las respuestas de las cinco preguntas.</p></div>}
          {part === 4 && <div className="mt-5 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div><h3 className="font-bold text-slate-900">Ejemplo inicial (no puntuable)</h3><p className="mt-1 text-sm text-slate-600">Se mostrará como pregunta 0, antes de las preguntas de la subparte.</p></div>
            <div className="grid gap-3 md:grid-cols-3">{exampleOptions.map((option, index) => <label key={option.key} className="block text-sm font-semibold">Opción de ejemplo {option.key}<input value={option.text} onChange={e => setExampleOptions(current => current.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder={"Texto de la opción " + option.key} /></label>)}</div>
            <label className="block text-sm font-semibold">Respuesta del ejemplo<select value={exampleAnswer} onChange={e => setExampleAnswer(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3">{exampleOptions.map(option => <option key={option.key} value={option.key}>{option.key}</option>)}</select></label>
            <label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del texto compartido (obligatoria)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen no puede superar 8 MB."); e.currentTarget.value = ""; return; } setError(""); setSharedImageFile(file); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" />
               <span className="mt-1 block text-xs font-normal text-slate-500">Sube una sola imagen con el ejemplo (0) y los espacios {getQuestionStart(part, bookletFormat, part4Group, part7Group)}–{getQuestionStart(part, bookletFormat, part4Group, part7Group) + getQuestionCount(part, bookletFormat, part7Group) - 1}. En el formato 2026 solo existe el conjunto único de la Parte 4; la subparte 4B se ofrece únicamente en el perfil histórico. PNG, JPG o WEBP · máximo 8 MB.</span>
            </label>
            {!sharedImageFile && existingSharedImageUrl && <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="mb-2 text-xs font-medium text-slate-600">Imagen guardada actualmente. Se conservará si no seleccionas otra.</p><img src={existingSharedImageUrl} alt="Imagen actual del texto compartido de la Parte 4" className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setExistingSharedImageUrl("")} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen guardada</button></div>}
            {sharedImageFile && <div className="rounded-lg border border-slate-200 bg-white p-3"><img src={URL.createObjectURL(sharedImageFile)} alt="Vista previa del texto compartido de la Parte 4" className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setSharedImageFile(null)} className="mt-2 text-sm font-semibold text-red-700">{existingSharedImageUrl ? "Cancelar reemplazo" : "Quitar imagen"}</button></div>}
          </div>}
          {part === 5 && <div className="mt-5 space-y-3 rounded-xl border border-slate-300 bg-white p-4">
            <label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen completa del texto de lectura (obligatoria)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen del texto no puede superar 8 MB."); e.currentTarget.value = ""; return; } if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("La imagen del texto debe ser PNG, JPG o WEBP."); e.currentTarget.value = ""; return; } setError(""); setSharedImageFile(file); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Sube una sola imagen con el título, el texto completo y cualquier ilustración del pasaje. PNG, JPG o WEBP · máximo 8 MB.</span>
            </label>
            {!sharedImageFile && existingSharedImageUrl && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-600">Imagen completa guardada actualmente.</p><img src={existingSharedImageUrl} alt="Imagen completa del texto de lectura" className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setExistingSharedImageUrl("")} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen guardada</button></div>}
            {sharedImageFile && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><img src={URL.createObjectURL(sharedImageFile)} alt="Vista previa del texto completo de lectura" className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setSharedImageFile(null)} className="mt-2 text-sm font-semibold text-red-700">{existingSharedImageUrl ? "Cancelar reemplazo" : "Quitar imagen"}</button></div>}
          </div>}
          {part === 6 && <label className="mt-5 block text-sm font-semibold">Texto de lectura compartido<textarea value={sharedText} onChange={e => setSharedText(e.target.value)} rows={7} maxLength={30000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder="Pega aquí el texto original de interés general. Las preguntas evaluarán inferencias sobre el texto." /></label>}
          {part === 7 && <div className="mt-5 space-y-3 rounded-xl border border-slate-300 bg-white p-4">
            <label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del texto cloze — Parte {part7Group} (obligatoria)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen del texto no puede superar 8 MB."); e.currentTarget.value = ""; return; } if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("La imagen del texto debe ser PNG, JPG o WEBP."); e.currentTarget.value = ""; return; } setError(""); setSharedImageFile(file); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900"/>
               <span className="mt-1 block text-xs font-normal text-slate-500">Sube una sola imagen con el ejemplo (0) y los espacios {getQuestionStart(part, bookletFormat, part4Group, part7Group)}–{getQuestionStart(part, bookletFormat, part4Group, part7Group) + getQuestionCount(part, bookletFormat, part7Group) - 1}. El ejemplo se completa abajo con opciones A–D; no necesita imagen aparte. PNG, JPG o WEBP · máximo 8 MB.</span>
            </label>
            {!sharedImageFile && existingSharedImageUrl && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-600">Imagen del pasaje guardada actualmente.</p><img src={existingSharedImageUrl} alt={`Texto cloze guardado de la Parte ${part7Group}`} className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setExistingSharedImageUrl("")} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen guardada</button></div>}
            {sharedImageFile && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><img src={URL.createObjectURL(sharedImageFile)} alt={`Vista previa del texto cloze de la Parte ${part7Group}`} className="max-h-[480px] max-w-full object-contain"/><button type="button" onClick={() => setSharedImageFile(null)} className="mt-2 text-sm font-semibold text-red-700">{existingSharedImageUrl ? "Cancelar reemplazo" : "Quitar imagen"}</button></div>}
          </div>}
          {part !== 1 && part !== 4 && part !== 6 && <div className="mt-5 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div><h3 className="font-bold text-slate-900">Ejemplo inicial (no puntuable)</h3><p className="mt-1 text-sm text-slate-600">{part === 7 ? "El enunciado del ejemplo (0) ya está dentro de la imagen del pasaje. Completa únicamente las opciones A–D y la respuesta." : "Se mostrará antes de las preguntas del conjunto, siguiendo la estructura del cuadernillo."}</p></div>
            {![5, 7].includes(part) && <>
              <label className="block text-sm font-semibold">Imagen del ejemplo (opcional)
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setExampleImageFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" />
                <span className="mt-1 block text-xs font-normal text-slate-500">PNG, JPG, WEBP o GIF · máximo 8 MB. Se sube al guardar.</span>
              </label>
              {!exampleImageFile && existingExampleImageUrl && <div className="space-y-2"><p className="text-xs text-slate-600">Imagen de ejemplo guardada. Se conservará si no seleccionas otra.</p><img src={existingExampleImageUrl} alt="Imagen de ejemplo guardada" className={part === 3 ? "max-h-80 max-w-full rounded-lg border border-slate-200 bg-white object-contain" : "max-h-48 rounded-lg border border-slate-200 bg-white object-contain"} /><button type="button" onClick={() => setExistingExampleImageUrl("")} className="text-sm font-semibold text-red-700">Quitar imagen guardada</button></div>}
              {exampleImageFile && <div className="space-y-2"><p className="text-xs text-slate-600">Imagen seleccionada: {exampleImageFile.name}</p><img src={URL.createObjectURL(exampleImageFile)} alt="Vista previa de la conversación de ejemplo" className={part === 3 ? "max-h-80 max-w-full rounded-lg border border-slate-200 bg-white object-contain" : "max-h-48 rounded-lg border border-slate-200 bg-white object-contain"} /><button type="button" onClick={() => setExampleImageFile(null)} className="text-sm font-semibold text-red-700">{existingExampleImageUrl ? "Cancelar reemplazo" : "Quitar imagen"}</button></div>}
            </>}
            {part !== 3 && <>
              {part !== 7 && <label className="block text-sm font-semibold">Enunciado del ejemplo<textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={2} maxLength={10000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" placeholder="Escribe aquí el enunciado de ejemplo..." /></label>}
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
        {part === 5 && <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <header className="border-b border-slate-300 px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {session}</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">{title.trim() || "Parte 5 · Comprensión de lectura"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{instructions.trim() || PARTS[5].guidance}</p>
          </header>
          <div className="p-5 sm:p-7">
            <article className="rounded-xl border-2 border-slate-900 p-3">
              {(sharedImageFile || existingSharedImageUrl) ? <img src={sharedImageFile ? URL.createObjectURL(sharedImageFile) : existingSharedImageUrl} alt="Vista previa de la imagen completa del texto de lectura" className="mx-auto h-auto max-h-[560px] max-w-full object-contain"/> : <p className="py-16 text-center text-sm text-slate-400">Aquí aparecerá la imagen completa del texto de lectura.</p>}
            </article>
            <div className="mt-5 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b-2 border-slate-900 pb-4">
              <strong className="pt-1 text-sm">0.</strong>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{examplePrompt.trim() || "Aquí aparecerá el enunciado del ejemplo."}</p>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">{exampleOptions.map(option => <p key={option.key} className="text-xs leading-5"><strong>{option.key}.</strong> {option.text || "Opción sin completar"}</p>)}</div>
                  <div className="inline-flex items-center gap-1 border border-slate-400 px-2 py-1 text-[10px] leading-none">
                    <span className="mr-1 font-semibold">Respuesta 0.</span>
                    {["A", "B", "C"].map(key => <span key={key} className={`flex h-5 w-5 items-center justify-center rounded-full border ${exampleAnswer === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 divide-y divide-slate-300">
              {questions.map((question, index) => <div key={question.id ?? index} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-4">
                <strong className="pt-1 text-sm">{113 + index}.</strong>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
                  <p className="whitespace-pre-wrap text-sm leading-6">{question.prompt || "Enunciado de comprensión de lectura…"}</p>
                  <div className="space-y-2">{question.options.map(option => <p key={option.key} className="text-xs leading-5"><strong>{option.key}.</strong> {option.text || "Opción sin completar"}</p>)}</div>
                </div>
              </div>)}
            </div>
            <p className="mt-4 border-t border-slate-300 pt-3 text-[10px] text-slate-500">PeakScore · Vista previa del cuadernillo. Las respuestas correctas no se muestran.</p>
          </div>
        </section>}
        {part === 6 && <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <header className="border-b border-slate-300 px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {session}</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">Parte 6 · Comprensión de lectura</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{instructions.trim() || PARTS[6].guidance}</p>
          </header>
          <div className="p-3 sm:p-4">
            <article className="mb-3 border-2 border-slate-900 px-3 py-3 sm:px-4">
              <p className="whitespace-pre-wrap font-serif text-[10px] leading-[1.35] text-slate-900">{sharedText.trim() || "Aquí aparecerá el texto de lectura."}</p>
            </article>
            <div className="space-y-0">
              {[[0, 2], [1, 3]].map((pair, rowIndex) => <div key={rowIndex} className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-slate-400 py-2 md:grid-cols-2">
                {pair.map(questionIndex => {
                  const question = questions[questionIndex];
                  if (!question) return null;
                  return <div key={question.id ?? questionIndex} className="grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start gap-2">
                    <p className="text-[10px] leading-[1.35]"><strong>{120 + questionIndex}.</strong> {question.prompt || "Pregunta de comprensión inferencial…"}</p>
                    <div className="space-y-0.5">{question.options.map(option => <p key={option.key} className="text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text || "Opción sin completar"}</p>)}</div>
                  </div>;
                })}
              </div>)}
              {questions[4] && <article className="border-t-2 border-slate-900 pt-2 md:col-span-2">
                <p className="text-[11px] leading-4"><strong>124.</strong> {questions[4].prompt || "Pregunta inferencial con opciones de respuesta extensas…"}</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {questions[4].options.map(option => <div key={option.key} className="min-h-12 border border-slate-500 px-2 py-2 text-[10px] leading-[1.35]"><strong>{option.key}.</strong> {option.text || "Texto de opción extensa…"}</div>)}
                </div>
              </article>}
            </div>
            <p className="mt-3 border-t border-slate-300 pt-2 text-[9px] text-slate-500">PeakScore · Vista previa del cuadernillo. Las respuestas correctas no se muestran.</p>
          </div>
        </section>}
        {part === 7 && <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <header className="border-b border-slate-300 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Inglés · Sesión {session}</p>
            <h2 className="mt-1 text-base font-extrabold text-slate-950">Parte {part7Group} · Texto cloze</h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">{instructions.trim() || "Lee el texto y selecciona la palabra adecuada para completar cada espacio. Marca A, B, C o D en tu hoja de respuestas."}</p>
          </header>
          <div className="p-4">
            <div className="mb-3 flex justify-center">
              {(sharedImageFile || existingSharedImageUrl) ? <img src={sharedImageFile ? URL.createObjectURL(sharedImageFile) : existingSharedImageUrl} alt={`Vista previa del pasaje de la Parte ${part7Group}`} className="h-auto max-h-[520px] max-w-full object-contain"/> : <p className="py-10 text-center text-sm text-slate-400">Sube la imagen del pasaje con el ejemplo 0 y los {getQuestionCount(part, bookletFormat, part7Group)} espacios numerados.</p>}
            </div>
            <div className="border-b-2 border-slate-900 pb-3">
              <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wide">Ejemplo</p>
              <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-3 text-[11px] leading-4">
                <strong>0.</strong>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    {part !== 7 && <p>{examplePrompt.trim() || "Aquí aparece el enunciado del ejemplo 0."}</p>}
                    <div className={`grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4 ${part === 7 ? "" : "mt-2"}`}>{exampleOptions.map(option => <p key={option.key}><strong>{option.key}.</strong> {option.text || "Opción sin completar"}</p>)}</div>
                  </div>
                  <div className="inline-flex h-fit items-center gap-1 border border-slate-400 px-2 py-1 text-[9px] leading-none">
                    <strong className="mr-1">Respuesta 0.</strong>
                    {["A","B","C","D"].map(key => <span key={key} className={`flex h-4 w-4 items-center justify-center rounded-full border ${exampleAnswer === key ? "border-black bg-black font-bold text-white" : "border-slate-500 text-slate-700"}`}>{key}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1">
              {questions.map((question, index) => <div key={question.id ?? index} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 border-b border-slate-300 py-2 last:border-0">
                <strong className="pt-0.5 text-[10px]">{getQuestionStart(part, bookletFormat, part4Group, part7Group) + index}.</strong>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] leading-4 sm:grid-cols-4">{question.options.map(option => <p key={option.key}><strong>{option.key}.</strong> {option.text || "Opción sin completar"}</p>)}</div>
              </div>)}
            </div>
          </div>
        </section>}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Preguntas del conjunto</h2><p className="text-sm text-slate-600">{questions.length} pregunta(s) · esperado: {getQuestionCount(part, bookletFormat, part7Group)} ({getQuestionStart(part, bookletFormat, part4Group, part7Group)}–{getQuestionStart(part, bookletFormat, part4Group, part7Group) + getQuestionCount(part, bookletFormat, part7Group) - 1})</p></div><button type="button" onClick={addQuestion} disabled={questions.length >= getQuestionCount(part, bookletFormat, part7Group)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"><Plus size={18}/> Añadir pregunta</button></div>
          {questions.map((q, i) => <article key={i} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-7">
            <div className="flex items-center justify-between"><h3 className="font-bold">Pregunta {i + 1}</h3>{questions.length > 1 && <button type="button" onClick={() => setQuestions(current => current.filter((_, index) => index !== i))} className="inline-flex items-center gap-1 text-sm text-red-700"><Trash2 size={16}/> Eliminar</button>}</div>
            {part === 2 && <div className="space-y-3"><label className="block text-sm font-semibold"><span className="inline-flex items-center gap-2"><ImageIcon size={16}/> Imagen del aviso (desde tu carpeta)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const file = e.target.files?.[0] ?? null; if (file && file.size > 8 * 1024 * 1024) { setError("La imagen no puede superar 8 MB."); e.currentTarget.value = ""; return; } setError(""); patchQuestion(i, { imageFile: file, imageUrl: file ? URL.createObjectURL(file) : "" }); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700" /></label>{q.imageUrl && <div className="rounded-xl border bg-slate-50 p-3"><img src={q.imageUrl} alt={`Vista previa de imagen de pregunta ${i + 1}`} className="max-h-64 max-w-full rounded-lg object-contain" /><button type="button" onClick={() => patchQuestion(i, { imageFile: null, imageUrl: "" })} className="mt-2 text-sm font-semibold text-red-700">Quitar imagen</button></div>}<p className="text-xs text-slate-500">PNG, JPG, WEBP o GIF · máximo 8 MB. Se sube al guardar.</p></div>}
            {[4, 7].includes(part) ? <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm"><strong>Espacio {part === 4 ? (part4Group === "4A" ? 97 : 105) + i : (part7Group === "7A" ? 115 : 125) + i}.</strong> El número se asigna automáticamente. Las cuatro opciones A–D se ingresan por separado y el pasaje está en la imagen compartida.</div> : <label className="block text-sm font-semibold">{part === 2 ? "Texto del aviso o pregunta asociada" : part === 1 ? "Descripción en inglés" : part === 3 ? "Intervención de la conversación" : part === 6 ? (i === 4 ? "Pregunta inferencial 124 (opciones en tarjetas)" : "Pregunta de comprensión inferencial") : part === 7 ? "Número del espacio / enunciado" : "Pregunta o situación en inglés"}<textarea value={q.prompt} onChange={e => patchQuestion(i, { prompt: e.target.value })} rows={3} maxLength={10000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={part === 2 ? "Where can you see this notice?" : part === 1 ? "Example: You wear these on your feet." : part === 7 ? "Ej. (1) _____" : "Escribe el enunciado en inglés..."}/></label>}
            <div className="grid gap-3 md:grid-cols-2">{q.options.map((option, j) => <label key={option.key} className="block text-sm font-semibold">Opción {option.key}<input value={option.text} onChange={e => patchOption(i, j, e.target.value)} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400" placeholder={part === 6 && i === 4 ? `Texto completo de la opción ${option.key} (se mostrará en tarjeta)` : `Texto de la opción ${option.key}`}/></label>)}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Respuesta correcta<select value={q.answer} onChange={e => patchQuestion(i, { answer: e.target.value })} className="mt-2 w-full rounded-xl border p-3">{(part === 1 ? LETTERS.filter(key => key !== exampleAnswer).map(key => ({ key, text: key })) : q.options).map(o => <option key={o.key} value={o.key}>{o.key}</option>)}</select></label>
              <label className="text-sm font-semibold">Explicación {part === 4 ? "(obligatoria, en español)" : "(opcional)"}<input value={q.explanation} onChange={e => patchQuestion(i, { explanation: e.target.value })} maxLength={5000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder={part === 4 ? "Explica en español la regla gramatical y por qué encaja aquí" : "Por qué es correcta"}/></label>
            </div>
          </article>)}
        </section>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{message}</p>}
        <div className="flex flex-wrap justify-end gap-3">{savedSetId && <button type="button" onClick={() => router.push(editSetId ? "/dashboard/question-bank/english" : "/dashboard/question-bank")} className="rounded-xl border bg-white px-5 py-3 font-semibold">Volver al banco</button>}<button type="button" onClick={save} disabled={loading || Boolean(savedSetId)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Save size={18}/>{loading ? "Guardando..." : editSetId ? "Guardar cambios" : "Guardar conjunto como borrador"}</button></div>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, Image as ImageIcon, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

const SUBJECTS_BY_SESSION: Record<string, string[]> = {
  "1": ["Matemáticas", "Lectura Crítica", "Sociales y Ciudadanas", "Ciencias Naturales"],
  "2": ["Matemáticas", "Sociales y Ciudadanas", "Ciencias Naturales"],
};
const DIFFICULTIES = ["Fácil", "Media", "Difícil"];
const ANSWERS = ["A", "B", "C", "D"] as const;
const MAX_QUESTIONS = 50;

type Answer = (typeof ANSWERS)[number];
type DraftQuestion = {
  component: string;
  competence: string;
  difficulty: string;
  context_text: string;
  image_url: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Answer;
  explanation: string;
  year: string;
  source: string;
};

function createDraft(): DraftQuestion {
  return {
    component: "",
    competence: "",
    difficulty: "Media",
    context_text: "",
    image_url: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
    year: "",
    source: "",
  };
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export default function ManualBulkQuestionsPage() {
  const router = useRouter();
  const [session, setSession] = useState("1");
  const [subject, setSubject] = useState("Matemáticas");
  const [amount, setAmount] = useState("10");
  const [drafts, setDrafts] = useState<DraftQuestion[]>(() => Array.from({ length: 10 }, createDraft));
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const availableSubjects = SUBJECTS_BY_SESSION[session] ?? [];

  useEffect(() => {
    let alive = true;
    async function checkAccess() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,email")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError || (profile?.role !== "admin" && profile?.email?.toLowerCase() !== "aragonyostynsena07@gmail.com")) {
        router.replace("/dashboard");
        return;
      }
      if (alive) setCheckingAdmin(false);
    }
    void checkAccess();
    return () => { alive = false; };
  }, [router]);

  const filledCount = useMemo(() => drafts.filter((item) => item.question.trim()).length, [drafts]);

  function resizeDrafts(nextAmount: string) {
    setAmount(nextAmount);
    const parsed = Number(nextAmount);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_QUESTIONS) return;
    setDrafts((current) => {
      if (parsed === current.length) return current;
      if (parsed < current.length) return current.slice(0, parsed);
      return [...current, ...Array.from({ length: parsed - current.length }, createDraft)];
    });
    setError("");
    setNotice("");
  }

  function changeSession(nextSession: string) {
    const nextSubjects = SUBJECTS_BY_SESSION[nextSession] ?? [];
    setSession(nextSession);
    if (!nextSubjects.includes(subject)) setSubject(nextSubjects[0] ?? "");
    setError("");
    setNotice("");
  }

  function updateDraft(index: number, field: keyof DraftQuestion, value: string) {
    setDrafts((current) => current.map((draft, i) => i === index ? { ...draft, [field]: value } : draft));
  }

  async function handleImageUpload(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato no permitido. Usa PNG, JPG o WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen supera el límite de 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImageIndex(index);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("La sesión expiró. Inicia sesión de nuevo.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `questions/manual-batch/${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Error subiendo imagen de pregunta:", uploadError);
        throw new Error("No se pudo subir la imagen. Comprueba los permisos del almacenamiento e inténtalo de nuevo.");
      }

      const { data } = supabase.storage.from("question-images").getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("La imagen se subió, pero no se pudo obtener su URL pública.");
      updateDraft(index, "image_url", data.publicUrl);
      setNotice(`Imagen añadida a la pregunta ${index + 1}. Guarda el lote para asociarla a la pregunta.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadingImageIndex(null);
      event.target.value = "";
    }
  }

  async function handleSave() {
    setError("");
    setNotice("");
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1 || parsedAmount > MAX_QUESTIONS || drafts.length !== parsedAmount) {
      setError(`La cantidad debe estar entre 1 y ${MAX_QUESTIONS} preguntas.`);
      return;
    }
    if (!availableSubjects.includes(subject)) {
      setError("La materia no corresponde a la sesión seleccionada.");
      return;
    }

    const incompleteIndex = drafts.findIndex((q) =>
      !q.question.trim() ||
      !q.option_a.trim() ||
      !q.option_b.trim() ||
      !q.option_c.trim() ||
      !q.option_d.trim() ||
      !q.correct_answer ||
      !q.difficulty
    );
    if (incompleteIndex >= 0) {
      setError(`Completa el enunciado, las cuatro opciones, la respuesta correcta y la dificultad de la pregunta ${incompleteIndex + 1}.`);
      return;
    }

    const duplicateMap = new Map<string, number>();
    for (let i = 0; i < drafts.length; i++) {
      const key = normalizeText(drafts[i].question);
      const previous = duplicateMap.get(key);
      if (previous !== undefined) {
        setError(`Las preguntas ${previous + 1} y ${i + 1} tienen el mismo enunciado. Corrige el duplicado antes de guardar.`);
        return;
      }
      duplicateMap.set(key, i);
      const options = [drafts[i].option_a, drafts[i].option_b, drafts[i].option_c, drafts[i].option_d].map(normalizeText);
      if (new Set(options).size !== 4) {
        setError(`La pregunta ${i + 1} tiene opciones repetidas.`);
        return;
      }
    }

    setSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("La sesión expiró. Inicia sesión de nuevo.");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,email")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError || (profile?.role !== "admin" && profile?.email?.toLowerCase() !== "aragonyostynsena07@gmail.com")) {
        throw new Error("No se pudo confirmar el permiso de administrador.");
      }

      const rows = drafts.map((q) => ({
        subject,
        subject_id: null,
        session: Number(session),
        component: q.component.trim() || null,
        competence: q.competence.trim() || null,
        difficulty: q.difficulty,
        context_text: q.context_text.trim() || null,
        question: q.question.trim(),
        option_a: q.option_a.trim(),
        option_b: q.option_b.trim(),
        option_c: q.option_c.trim(),
        option_d: q.option_d.trim(),
        correct_answer: q.correct_answer,
        explanation: q.explanation.trim() || null,
        image_url: q.image_url.trim() || null,
        year: q.year.trim() ? Number(q.year) : null,
        source: q.source.trim() || "MANUAL",
        question_number: null,
        is_active: true,
        requires_visual: false,
        visual_type: null,
        visual_description: null,
        visual_data: null,
        chart_data: null,
      }));

      // Small chunks reduce request size. Report partial progress if a later chunk fails.
      let saved = 0;
      for (let offset = 0; offset < rows.length; offset += 10) {
        const chunk = rows.slice(offset, offset + 10);
        const { error: insertError } = await supabase.from("questions").insert(chunk);
        if (insertError) {
          throw new Error(`Se guardaron ${saved} de ${rows.length} preguntas. El siguiente bloque falló: ${insertError.message}`);
        }
        saved += chunk.length;
      }
      setNotice(`¡Listo! Se guardaron ${saved} preguntas manuales en el banco.`);
      setTimeout(() => router.push("/dashboard/question-bank"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar las preguntas.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600"><Loader2 className="mr-3 animate-spin" />Verificando permisos...</main>;
  }

  if (subject === "Inglés") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/dashboard/question-bank" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={18} /> Volver al banco</Link>
          <section className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700"><ClipboardList size={24} /></div>
            <h1 className="text-3xl font-black">Creación manual de Inglés</h1>
            <p className="mt-3 leading-7 text-slate-600">Inglés se organiza en conjuntos por parte, con instrucciones, texto o imagen compartida, ejemplo y cantidad de preguntas definida por el formato del cuadernillo. Para conservar esa estructura y que las preguntas aparezcan correctamente en el banco, utiliza el editor especializado.</p>
            <Link href="/dashboard/question-bank/english/new" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Abrir editor estructurado de Inglés <ArrowLeft className="rotate-180" size={18} /></Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/question-bank" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={18} /> Volver al banco</Link>
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-800"><ClipboardList size={15} /> Herramienta manual</div>
          <h1 className="text-3xl font-black sm:text-4xl">Creador manual masivo</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Elige cuántas preguntas vas a redactar, completa cada ficha y guarda el lote en el banco. No utiliza IA ni publica preguntas incompletas.</p>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <label className="block text-sm font-bold text-slate-700">Sesión
              <select value={session} onChange={(e) => changeSession(e.target.value)} disabled={saving} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal">
                <option value="1">Sesión 1</option><option value="2">Sesión 2</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">Materia
              <select value={subject} onChange={(e) => { setSubject(e.target.value); setError(""); setNotice(""); }} disabled={saving} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal">
                {[...availableSubjects, ...(session === "2" ? ["Inglés"] : [])].map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">Cantidad de preguntas
              <input type="number" min={1} max={MAX_QUESTIONS} value={amount} onChange={(e) => resizeDrafts(e.target.value)} disabled={saving} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Entre 1 y {MAX_QUESTIONS}; puedes añadir o quitar fichas antes de guardar.</span>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
            <p className="font-bold text-slate-800">{drafts.length} fichas · {filledCount} enunciados iniciados</p>
            <div className="flex gap-2">
              <button type="button" disabled={saving || drafts.length >= MAX_QUESTIONS} onClick={() => { setDrafts((current) => [...current, createDraft()]); setAmount(String(drafts.length + 1)); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold disabled:opacity-50"><Plus size={16} /> Añadir una</button>
              <button type="button" disabled={saving || drafts.length <= 1} onClick={() => { setDrafts((current) => current.slice(0, -1)); setAmount(String(drafts.length - 1)); }} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 disabled:opacity-50"><Trash2 size={16} /> Quitar última</button>
            </div>
          </div>
        </section>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-800">{error}</div>}
        {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={20} />{notice}</div>}

        <div className="space-y-6">
          {drafts.map((draft, index) => (
            <section key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Pregunta {index + 1} de {drafts.length}</p><h2 className="mt-1 text-xl font-black text-slate-900">Ficha manual</h2></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{subject} · Sesión {session}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-semibold text-slate-700">Dificultad *
                  <select value={draft.difficulty} onChange={(e) => updateDraft(index, "difficulty", e.target.value)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    {DIFFICULTIES.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">Componente
                  <input value={draft.component} onChange={(e) => updateDraft(index, "component", e.target.value)} disabled={saving} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Ej. Numérico-Variacional" />
                </label>
                <label className="text-sm font-semibold text-slate-700">Competencia
                  <input value={draft.competence} onChange={(e) => updateDraft(index, "competence", e.target.value)} disabled={saving} maxLength={160} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Ej. Interpretación y representación" />
                </label>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Texto de contexto (opcional)
                <textarea value={draft.context_text} onChange={(e) => updateDraft(index, "context_text", e.target.value)} disabled={saving} rows={3} maxLength={12000} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Lectura, situación, tabla descrita o datos necesarios..." />
              </label>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm"><ImageIcon size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">Imagen o recurso visual (opcional)</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Adjunta diagramas, gráficas, mapas, figuras geométricas o imágenes necesarias para resolver la pregunta. PNG, JPG o WEBP; máximo 10 MB por imagen.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100">
                        {uploadingImageIndex === index ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                        {uploadingImageIndex === index ? "Subiendo imagen..." : draft.image_url ? "Cambiar imagen" : "Adjuntar imagen"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving || uploadingImageIndex !== null} onChange={(e) => void handleImageUpload(index, e)} className="sr-only" />
                      </label>
                      {draft.image_url && <button type="button" disabled={saving || uploadingImageIndex !== null} onClick={() => updateDraft(index, "image_url", "")} className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Quitar imagen</button>}
                    </div>
                    {draft.image_url && <div className="mt-4">
                      <Image src={draft.image_url} width={1200} height={800} unoptimized alt={`Vista previa de la imagen de la pregunta ${index + 1}`} className="max-h-64 max-w-full rounded-xl border border-slate-200 bg-white object-contain" />
                      <p className="mt-2 break-all text-xs text-slate-500">Imagen cargada y lista para guardar con esta pregunta.</p>
                    </div>}
                  </div>
                </div>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Enunciado de la pregunta *
                <textarea value={draft.question} onChange={(e) => updateDraft(index, "question", e.target.value)} disabled={saving} required rows={3} maxLength={6000} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Escribe la pregunta completa..." />
              </label>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {ANSWERS.map((letter) => {
                  const key = `option_${letter.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d";
                  return <label key={letter} className="block text-sm font-semibold text-slate-700">Opción {letter} *
                    <textarea value={draft[key]} onChange={(e) => updateDraft(index, key, e.target.value)} disabled={saving} required rows={2} maxLength={3000} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder={`Texto de la opción ${letter}`} />
                  </label>;
                })}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Respuesta correcta *
                  <select value={draft.correct_answer} onChange={(e) => updateDraft(index, "correct_answer", e.target.value)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    {ANSWERS.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">Año (opcional)
                  <input type="number" min={1900} max={2100} value={draft.year} onChange={(e) => updateDraft(index, "year", e.target.value)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="2026" />
                </label>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Explicación / justificación (opcional)
                <textarea value={draft.explanation} onChange={(e) => updateDraft(index, "explanation", e.target.value)} disabled={saving} rows={2} maxLength={5000} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Explica por qué la respuesta seleccionada es correcta..." />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Fuente o referencia (opcional)
                <input value={draft.source} onChange={(e) => updateDraft(index, "source", e.target.value)} disabled={saving} maxLength={300} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Ej. Elaboración propia, documento de referencia..." />
              </label>
            </section>
          ))}
        </div>

        <div className="sticky bottom-3 z-10 mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Se guardarán {drafts.length} preguntas en {subject}, sesión {session}. Revisa los enunciados y las respuestas antes de confirmar.</p>
          <button type="button" onClick={handleSave} disabled={saving || subject === "Inglés"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <><Loader2 className="animate-spin" size={18} /> Guardando lote...</> : <><Save size={18} /> Guardar {drafts.length} preguntas</>}
          </button>
        </div>
      </div>
    </main>
  );
}

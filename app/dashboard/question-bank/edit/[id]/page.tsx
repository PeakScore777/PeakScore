"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import {
  getQuestionById,
  updateQuestion,
} from "@/lib/services/question.service";

import type {
  VisualData,
  VisualType,
} from "@/lib/visuals/types";

const VISUAL_TYPES: VisualType[] = [
  "chart",
  "table",
  "math_graph",
  "diagram",
  "geometry",
  "map",
  "illustration",
  "infographic",
  "image_context",
];

const VISUAL_TYPE_LABELS: Record<VisualType, string> = {
  chart: "Gráfico",
  table: "Tabla",
  math_graph: "Gráfica matemática",
  diagram: "Diagrama",
  geometry: "Geometría",
  map: "Mapa",
  illustration: "Ilustración",
  infographic: "Infografía",
  image_context: "Imagen contextual",
};

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    subject: "",
    session: 1,
    component: "",
    competence: "",
    difficulty: "",
    context_text: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    explanation: "",
    image_url: "",
    year: new Date().getFullYear(),
    source: "",
    question_number: 1,
    is_active: true,
    subject_id: "",

    // Visual
    requires_visual: false,
    visual_type: "" as VisualType | "",
    visual_description: "",
    visual_data: null as VisualData | null,
    chart_data: null as unknown | null,
  });

  useEffect(() => {
    if (!id) return;

    loadQuestion();
  }, [id]);

  async function loadQuestion() {
    try {
      setLoading(true);
      setError("");

      const question = await getQuestionById(id);

      if (!question) {
        setError("No se encontró la pregunta.");
        return;
      }

      setForm({
        subject: question.subject ?? "",
        session: question.session ?? 1,
        component: question.component ?? "",
        competence: question.competence ?? "",
        difficulty: question.difficulty ?? "",
        context_text: question.context_text ?? "",
        question: question.question ?? "",
        option_a: question.option_a ?? "",
        option_b: question.option_b ?? "",
        option_c: question.option_c ?? "",
        option_d: question.option_d ?? "",
        correct_answer: question.correct_answer ?? "",
        explanation: question.explanation ?? "",
        image_url: question.image_url ?? "",
        year: question.year ?? new Date().getFullYear(),
        source: question.source ?? "",
        question_number: question.question_number ?? 1,
        is_active: question.is_active ?? true,
        subject_id: question.subject_id ?? "",

        // Visual
        requires_visual: question.requires_visual === true,
        visual_type: question.visual_type ?? "",
        visual_description: question.visual_description ?? "",
        visual_data: question.visual_data ?? null,
        chart_data: question.chart_data ?? null,
      });
    } catch (err) {
      console.error("Error cargando pregunta:", err);
      setError("No fue posible cargar la pregunta.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "session" ||
        name === "year" ||
        name === "question_number"
          ? Number(value)
          : value,
    }));
  }

  function handleVisualToggle(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      requires_visual: checked,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * Si la pregunta tiene visual, necesitamos como mínimo:
       * - requires_visual = true
       * - visual_type
       * - visual_data
       *
       * No permitimos guardar una configuración visual incompleta.
       */
      if (
        form.requires_visual &&
        (!form.visual_type || !form.visual_data)
      ) {
        setError(
          "La pregunta está marcada para usar un visual, pero faltan datos del visual."
        );
        return;
      }

      const visualEnabled = form.requires_visual;

      await updateQuestion(id, {
        subject: form.subject,
        subject_id: form.subject_id || null,
        session: form.session,
        component: form.component || null,
        competence: form.competence || null,
        difficulty: form.difficulty || null,

        context_text: form.context_text.trim() || null,

        question: form.question,
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_answer: form.correct_answer,

        explanation: form.explanation.trim() || null,
        image_url: form.image_url.trim() || null,

        year: form.year || null,
        source: form.source.trim() || null,
        question_number: form.question_number || null,
        is_active: form.is_active,

        /*
         * VISUAL
         *
         * Si requires_visual = false:
         * dejamos todos los campos visuales en null.
         *
         * Si es true:
         * preservamos exactamente los datos existentes.
         */
        requires_visual: visualEnabled,
        visual_type: visualEnabled
          ? form.visual_type || null
          : null,
        visual_description: visualEnabled
          ? form.visual_description.trim() || null
          : null,
        visual_data: visualEnabled
          ? form.visual_data
          : null,
        chart_data: visualEnabled
          ? form.chart_data
          : null,
      });

      setSuccess("Pregunta actualizada correctamente.");

      setTimeout(() => {
        router.push("/dashboard/question-bank");
      }, 900);
    } catch (err) {
      console.error("Error actualizando pregunta:", err);
      setError("No fue posible guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando pregunta...</span>
        </div>
      </div>
    );
  }

  if (error && !form.question) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-900">
                No se pudo cargar la pregunta
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al banco de preguntas
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Editar pregunta
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Modifica la información de la pregunta sin perder su
              configuración visual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {form.requires_visual ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Eye className="h-3.5 w-3.5" />
                Visual activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                <EyeOff className="h-3.5 w-3.5" />
                Sin visual
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <p className="font-medium text-red-900">
                  No se pudieron guardar los cambios
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />

              <p className="font-medium text-emerald-800">
                {success}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ========================================================= */}
          {/* INFORMACIÓN GENERAL */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Información general
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Clasificación académica de la pregunta.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Materia
                </label>

                <input
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Session */}
              <div>
                <label
                  htmlFor="session"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Sesión
                </label>

                <input
                  id="session"
                  name="session"
                  type="number"
                  min={1}
                  value={form.session}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Component */}
              <div>
                <label
                  htmlFor="component"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Componente
                </label>

                <input
                  id="component"
                  name="component"
                  value={form.component}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Competence */}
              <div>
                <label
                  htmlFor="competence"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Competencia
                </label>

                <input
                  id="competence"
                  name="competence"
                  value={form.competence}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Dificultad
                </label>

                <select
                  id="difficulty"
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">Seleccionar dificultad</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              {/* Subject ID */}
              <div>
                <label
                  htmlFor="subject_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  ID de materia
                </label>

                <input
                  id="subject_id"
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* CONTEXTO */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Contexto
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Texto introductorio que acompaña la pregunta, si existe.
              </p>
            </div>

            <div className="p-6">
              <label
                htmlFor="context_text"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Texto de contexto
              </label>

              <textarea
                id="context_text"
                name="context_text"
                value={form.context_text}
                onChange={handleChange}
                rows={5}
                placeholder="Contexto, situación o información previa..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* PREGUNTA */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Pregunta
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enunciado principal que verá el estudiante.
              </p>
            </div>

            <div className="p-6">
              <label
                htmlFor="question"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Enunciado
              </label>

              <textarea
                id="question"
                name="question"
                value={form.question}
                onChange={handleChange}
                required
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* VISUAL */}
          {/* ========================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Visual de la pregunta
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configuración visual estructurada de la pregunta.
                  </p>
                </div>

                {/* Toggle */}
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {form.requires_visual
                      ? "Visual activo"
                      : "Sin visual"}
                  </span>

                  <input
                    type="checkbox"
                    checked={form.requires_visual}
                    onChange={(e) =>
                      handleVisualToggle(e.target.checked)
                    }
                    className="peer sr-only"
                  />

                  <span className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-slate-900">
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6">
              {!form.requires_visual ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <EyeOff className="mx-auto h-7 w-7 text-slate-400" />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Esta pregunta no tiene un visual activo.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Activa la opción superior si la pregunta necesita
                    una gráfica, tabla, geometría, diagrama u otro
                    recurso visual.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Visual type */}
                  <div>
                    <label
                      htmlFor="visual_type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Tipo de visual
                    </label>

                    <div className="relative">
                      <select
                        id="visual_type"
                        name="visual_type"
                        value={form.visual_type}
                        disabled
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none"
                      >
                        <option value="">
                          Sin tipo de visual
                        </option>

                        {VISUAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {VISUAL_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      El tipo se muestra desde la configuración
                      estructurada guardada. No lo modificamos aquí
                      para evitar incompatibilidades con los datos
                      existentes.
                    </p>
                  </div>

                  {/* Visual description */}
                  <div>
                    <label
                      htmlFor="visual_description"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Descripción del visual
                    </label>

                    <textarea
                      id="visual_description"
                      name="visual_description"
                      value={form.visual_description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe qué representa el visual..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* Visual status */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-900">
                          Datos visuales estructurados
                        </p>

                        {form.visual_data ? (
                          <>
                            <p className="mt-1 text-sm text-blue-800">
                              Los datos del visual están presentes y
                              se conservarán al guardar esta pregunta.
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                                Tipo:{" "}
                                {form.visual_type
                                  ? VISUAL_TYPE_LABELS[
                                      form.visual_type
                                    ]
                                  : "No definido"}
                              </span>

                              <span className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                                Datos: disponibles
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-amber-700">
                            Este visual está activado, pero no contiene
                            datos estructurados. No podrás guardar
                            hasta completar el visual.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Read-only structured data */}
                  {form.visual_data && (
                    <details className="group rounded-xl border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700">
                        <div className="flex items-center justify-between gap-4">
                          <span>
                            Ver datos estructurados del visual
                          </span>

                          <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                        </div>
                      </summary>

                      <div className="border-t border-slate-200 p-4">
                        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-5 text-slate-200">
                          {JSON.stringify(
                            form.visual_data,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* OPCIONES */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Opciones de respuesta
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Respuestas disponibles para el estudiante.
              </p>
            </div>

            <div className="space-y-5 p-6">
              {/* A */}
              <div>
                <label
                  htmlFor="option_a"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Opción A
                </label>

                <textarea
                  id="option_a"
                  name="option_a"
                  value={form.option_a}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* B */}
              <div>
                <label
                  htmlFor="option_b"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Opción B
                </label>

                <textarea
                  id="option_b"
                  name="option_b"
                  value={form.option_b}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* C */}
              <div>
                <label
                  htmlFor="option_c"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Opción C
                </label>

                <textarea
                  id="option_c"
                  name="option_c"
                  value={form.option_c}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* D */}
              <div>
                <label
                  htmlFor="option_d"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Opción D
                </label>

                <textarea
                  id="option_d"
                  name="option_d"
                  value={form.option_d}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Correct answer */}
              <div>
                <label
                  htmlFor="correct_answer"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Respuesta correcta
                </label>

                <select
                  id="correct_answer"
                  name="correct_answer"
                  value={form.correct_answer}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">Seleccionar respuesta</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* EXPLICACIÓN */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Explicación
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Justificación de la respuesta correcta.
              </p>
            </div>

            <div className="p-6">
              <textarea
                id="explanation"
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={7}
                placeholder="Explicación de la respuesta..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* INFORMACIÓN ADICIONAL */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Información adicional
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Metadatos y estado de la pregunta.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              {/* Image URL */}
              <div className="md:col-span-2">
                <label
                  htmlFor="image_url"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  URL de imagen
                </label>

                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Este campo se conserva como imagen externa/legacy.
                  Los nuevos gráficos y diagramas utilizan
                  `visual_data`.
                </p>
              </div>

              {/* Year */}
              <div>
                <label
                  htmlFor="year"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Año
                </label>

                <input
                  id="year"
                  name="year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.year}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Question number */}
              <div>
                <label
                  htmlFor="question_number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Número de pregunta
                </label>

                <input
                  id="question_number"
                  name="question_number"
                  type="number"
                  min={1}
                  value={form.question_number}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Source */}
              <div className="md:col-span-2">
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Fuente
                </label>

                <input
                  id="source"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="AI_GENERATED"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Active */}
              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Pregunta activa
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Las preguntas inactivas no deberían aparecer en
                      los flujos normales del banco.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* ACTIONS */}
          {/* ========================================================= */}

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
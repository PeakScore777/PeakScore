"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { createQuestion } from "@/lib/services/question.service";
import { supabase } from "@/lib/supabase/browser";

const subjects = [
  "Matemáticas",
  "Lectura Crítica",
  "Sociales y Ciudadanas",
  "Ciencias Naturales",
  "Inglés",
];

const difficulties = ["Fácil", "Media", "Difícil"];

interface FormState {
  subject: string;
  session: string;
  component: string;
  competence: string;
  difficulty: string;
  context_text: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  image_url: string;
  year: string;
  source: string;
  question_number: string;
  is_active: boolean;
}

const initialForm: FormState = {
  subject: "",
  session: "",
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
  year: "",
  source: "",
  question_number: "",
  is_active: true,
};

export default function NewQuestionPage() {
  const router = useRouter();

  const [aiMode, setAiMode] = useState(false);

  const [loading, setLoading] = useState(false);

  const [aiForm, setAiForm] = useState({
    subject: "",
    session: "",
    amount: "5",
    difficulty: "Mixta",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [generationComplete, setGenerationComplete] = useState(false);

  const [form, setForm] = useState<FormState>(initialForm);

  /*
   * Detectar ?mode=ai
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAiMode(params.get("mode") === "ai");
  }, []);

  /*
   * ================================
   * CAMBIOS DEL FORMULARIO MANUAL
   * ================================
   */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * ================================
   * CREAR PREGUNTA MANUAL
   * ================================
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createQuestion({
        subject: form.subject,
        subject_id: null,

        session: Number(form.session),

        component: form.component || null,
        competence: form.competence || null,
        difficulty: form.difficulty || null,

        context_text: form.context_text || null,

        question: form.question,

        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,

        correct_answer: form.correct_answer,

        explanation: form.explanation || null,
        image_url: form.image_url || null,

        year: form.year ? Number(form.year) : null,
        source: form.source || null,

        question_number: form.question_number
          ? Number(form.question_number)
          : null,

        is_active: form.is_active,

        requires_visual: false,
        visual_type: null,
        visual_description: null,
        visual_data: null,
        chart_data: null,
      });

      router.push("/dashboard/question-bank");
    } catch (error) {
      console.error("Error creando pregunta:", error);
      alert("No se pudo crear la pregunta.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ================================
   * CAMBIOS DEL GENERADOR IA
   * ================================
   */

  const handleAiChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setAiForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * ================================
   * GENERAR PREGUNTAS CON IA
   * ================================
   */

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiForm.subject) {
      alert("Selecciona una materia.");
      return;
    }

    if (!aiForm.session) {
      alert("Selecciona una sesión.");
      return;
    }

    const amount = Number(aiForm.amount);

    if (!amount || amount < 1 || amount > 100) {
      alert("La cantidad debe estar entre 1 y 100 preguntas.");
      return;
    }

    try {
      setLoading(true);
      setGenerationComplete(false);
      setGeneratedQuestions([]);

      console.log("======================================");
      console.log("PEAKSCORE - GENERADOR DE PREGUNTAS IA");
      console.log("======================================");
      console.log("Materia:", aiForm.subject);
      console.log("Sesión:", aiForm.session);
      console.log("Cantidad:", amount);
      console.log("Dificultad:", aiForm.difficulty);

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: aiForm.subject,
          session: Number(aiForm.session),
          amount,
          difficulty: aiForm.difficulty,
        }),
      });

      const result = await response.json();

      console.log("Respuesta del generador:", result);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "No se pudieron generar las preguntas."
        );
      }

      const questions =
        result?.data?.questions ??
        result?.questions ??
        [];

      setGeneratedQuestions(
        Array.isArray(questions) ? questions : []
      );

      setGenerationComplete(true);
    } catch (error) {
      console.error("ERROR GENERANDO PREGUNTAS:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido generando preguntas.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ================================
   * MODO IA
   * ================================
   */

  if (aiMode) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl">

          {/* HEADER */}

          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/question-bank")}
              className="rounded-xl bg-white p-3 shadow hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-slate-900">
                  Generador de preguntas
                </h1>

                <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                  <Sparkles size={15} />
                  IA
                </span>
              </div>

              <p className="mt-2 text-slate-600">
                Genera preguntas nuevas para el banco de PeakScore.
              </p>
            </div>
          </div>

          {/* GENERADOR */}

          <form
            onSubmit={handleGenerate}
            className="space-y-8 rounded-3xl bg-white p-8 shadow"
          >
            <section>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Configuración
              </h2>

              <p className="mb-6 text-slate-600">
                La IA creará preguntas nuevas según la materia,
                sesión, cantidad y dificultad seleccionadas.
              </p>

              <div className="grid gap-6 md:grid-cols-2">

                {/* MATERIA */}

                <div>
                  <label className="mb-2 block font-semibold text-slate-700">
                    Materia *
                  </label>

                  <select
                    name="subject"
                    value={aiForm.subject}
                    onChange={handleAiChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option value="">
                      Selecciona una materia
                    </option>

                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SESIÓN */}

                <div>
                  <label className="mb-2 block font-semibold text-slate-700">
                    Sesión *
                  </label>

                  <input
                    type="number"
                    name="session"
                    value={aiForm.session}
                    onChange={handleAiChange}
                    required
                    min="1"
                    max="2"
                    placeholder="Ej: 2"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                </div>

                {/* CANTIDAD */}

                <div>
                  <label className="mb-2 block font-semibold text-slate-700">
                    Cantidad de preguntas *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={aiForm.amount}
                    onChange={handleAiChange}
                    required
                    min="1"
                    max="100"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />

                  <p className="mt-1 text-sm text-slate-500">
                    Máximo 100 preguntas por generación.
                  </p>
                </div>

                {/* DIFICULTAD */}

                <div>
                  <label className="mb-2 block font-semibold text-slate-700">
                    Dificultad *
                  </label>

                  <select
                    name="difficulty"
                    value={aiForm.difficulty}
                    onChange={handleAiChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option value="Mixta">
                      Mixta
                    </option>

                    <option value="Fácil">
                      Fácil
                    </option>

                    <option value="Media">
                      Media
                    </option>

                    <option value="Difícil">
                      Difícil
                    </option>
                  </select>
                </div>

              </div>
            </section>

            {/* INFORMACIÓN */}

            <section className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <div className="flex gap-3">
                <Sparkles
                  className="mt-1 shrink-0 text-purple-600"
                  size={22}
                />

                <div>
                  <h3 className="font-bold text-purple-900">
                    Generación inteligente
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-purple-800">
                    Las preguntas se generarán siguiendo la
                    configuración solicitada y se guardarán
                    directamente en el banco de preguntas de
                    PeakScore.
                  </p>
                </div>
              </div>
            </section>

            {/* RESULTADO */}

            {generationComplete && (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-green-600"
                    size={24}
                  />

                  <div>
                    <h3 className="font-bold text-green-900">
                      Generación completada
                    </h3>

                    <p className="text-sm text-green-800">
                      Se generaron{" "}
                      <strong>
                        {generatedQuestions.length || Number(aiForm.amount)}
                      </strong>{" "}
                      preguntas.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* BOTÓN */}

            <div className="flex justify-end border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />

                    Generar preguntas
                  </>
                )}
              </button>
            </div>
          </form>

          {/* PREGUNTAS GENERADAS */}

          {generatedQuestions.length > 0 && (
            <section className="mt-8 rounded-3xl bg-white p-8 shadow">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Preguntas generadas
                </h2>

                <p className="mt-1 text-slate-600">
                  Estas son las preguntas que fueron generadas.
                </p>
              </div>

              <div className="space-y-6">
                {generatedQuestions.map((question, index) => (
                  <div
                    key={question?.id ?? index}
                    className="rounded-2xl border border-slate-200 p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        Pregunta #{index + 1}
                      </span>

                      {question?.difficulty && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                          {question.difficulty}
                        </span>
                      )}
                    </div>

                    {question?.context_text && (
                      <div className="mb-4 rounded-xl bg-purple-50 p-4">
                        <p className="mb-2 font-semibold text-purple-800">
                          Texto de contexto
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {question.context_text}
                        </p>
                      </div>
                    )}

                    <p className="font-semibold leading-7 text-slate-900">
                      {question?.question}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {["a", "b", "c", "d"].map((letter) => (
                        <div
                          key={letter}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <span className="font-bold">
                            {letter.toUpperCase()}.
                          </span>{" "}
                          {question?.[`option_${letter}`]}
                        </div>
                      ))}
                    </div>

                    {question?.correct_answer && (
                      <p className="mt-4 font-semibold text-green-600">
                        Respuesta correcta:{" "}
                        {question.correct_answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/question-bank")
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Ver banco de preguntas
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    );
  }

  /*
   * ================================
   * MODO MANUAL
   * ================================
   */

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white p-3 shadow hover:bg-slate-50"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Nueva pregunta
            </h1>

            <p className="mt-2 text-slate-600">
              Agrega una nueva pregunta al banco de PeakScore.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-white p-8 shadow"
        >

          {/* INFORMACIÓN GENERAL */}

          <section>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Información general
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Materia *
                </label>

                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Selecciona una materia
                  </option>

                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Sesión *
                </label>

                <input
                  type="number"
                  name="session"
                  value={form.session}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Ej: 1"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Componente
                </label>

                <input
                  name="component"
                  value={form.component}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Ej: Álgebra"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Competencia
                </label>

                <input
                  name="competence"
                  value={form.competence}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Ej: Interpretación"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Dificultad
                </label>

                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Selecciona dificultad
                  </option>

                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Año
                </label>

                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Ej: 2026"
                />
              </div>

            </div>
          </section>

          {/* CONTEXTO */}

          <section>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Texto de contexto
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              Opcional. Úsalo cuando varias preguntas dependan de
              una lectura, situación, gráfico o información común.
            </p>

            <textarea
              name="context_text"
              value={form.context_text}
              onChange={handleChange}
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Escribe aquí el texto que el estudiante debe leer..."
            />
          </section>

          {/* PREGUNTA */}

          <section>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Pregunta
            </h2>

            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              required
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Escribe aquí el enunciado de la pregunta..."
            />
          </section>

          {/* OPCIONES */}

          <section>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Opciones de respuesta
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <input
                name="option_a"
                value={form.option_a}
                onChange={handleChange}
                required
                placeholder="Opción A"
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="option_b"
                value={form.option_b}
                onChange={handleChange}
                required
                placeholder="Opción B"
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="option_c"
                value={form.option_c}
                onChange={handleChange}
                required
                placeholder="Opción C"
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="option_d"
                value={form.option_d}
                onChange={handleChange}
                required
                placeholder="Opción D"
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>

            <div className="mt-6">
              <label className="mb-2 block font-semibold text-slate-700">
                Respuesta correcta *
              </label>

              <select
                name="correct_answer"
                value={form.correct_answer}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Selecciona la respuesta correcta
                </option>

                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </section>

          {/* INFORMACIÓN ADICIONAL */}

          <section>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Información adicional
            </h2>

            <div className="space-y-6">

              <textarea
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={4}
                placeholder="Explicación de la respuesta..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="URL de imagen (opcional)"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Fuente (opcional)"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                name="question_number"
                value={form.question_number}
                onChange={handleChange}
                placeholder="Número de pregunta (opcional)"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>
          </section>

          {/* BOTÓN */}

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={20} />

              {loading
                ? "Guardando..."
                : "Guardar pregunta"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
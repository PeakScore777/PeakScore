"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { createQuestion } from "@/lib/services/question.service";
import { supabase } from "@/lib/supabase/browser";

export default function NewQuestionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    session: "",
    component: "",
    competence: "",
    difficulty: "",
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
    subject_id: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();

    console.log("SESSION:", session);
    console.log("USER ID:", session?.user?.id);

    try {
      setLoading(true);

      await createQuestion({
        subject: form.subject,
        subject_id: form.subject_id || null,

        session: Number(form.session),

        component: form.component || null,
        competence: form.competence || null,
        difficulty: form.difficulty || null,

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

      });

      router.push("/dashboard/question-bank");
    } catch (error) {
      console.error("Error creando pregunta:", error);
      alert("No se pudo crear la pregunta.");
    } finally {
      setLoading(false);
    }
  };

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
                  <option value="">Selecciona una materia</option>
                  <option value="Matemáticas">Matemáticas</option>
                  <option value="Lectura Crítica">
                    Lectura Crítica
                  </option>
                  <option value="Sociales y Ciudadanas">
                    Sociales y Ciudadanas
                  </option>
                  <option value="Ciencias Naturales">
                    Ciencias Naturales
                  </option>
                  <option value="Inglés">Inglés</option>
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
                  <option value="">Selecciona dificultad</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Media">Media</option>
                  <option value="Difícil">Difícil</option>
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
                <option value="">Selecciona la respuesta correcta</option>
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

              {loading ? "Guardando..." : "Guardar pregunta"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
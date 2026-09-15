import {
  ArrowLeft,
  Brain,
  FileUp,
  Database,
  Zap,
  ShieldCheck,
} from "lucide-react";

import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Volver al dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Panel de administración
              </h1>

              <p className="mt-1 text-slate-500">
                Administra el contenido y las herramientas
                internas de PeakScore.
              </p>
            </div>
          </div>
        </div>

        {/* HERRAMIENTAS */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Herramientas
            </h2>

            <p className="text-sm text-slate-500">
              Herramientas disponibles únicamente para
              administradores.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* GENERADOR IA */}
            <Link
              href="/dashboard/question-bank/generate"
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Brain size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Generar preguntas con IA
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Genera nuevas preguntas para agregarlas
                al banco de PeakScore.
              </p>

              <div className="mt-5 text-sm font-semibold text-purple-600">
                Abrir herramienta →
              </div>
            </Link>

            {/* GENERACIÓN MASIVA */}
            <Link
              href="/dashboard/question-bank/batch"
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Zap size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Generación masiva
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Genera grandes cantidades de preguntas
                con IA para hacer crecer el banco.
              </p>

              <div className="mt-5 text-sm font-semibold text-amber-600">
                Abrir herramienta →
              </div>
            </Link>

            {/* IMPORTAR PDF */}
            <Link
              href="/dashboard/question-bank/import-pdf"
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <FileUp size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Importar PDF
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Importa material para alimentar el
                sistema de PeakScore.
              </p>

              <div className="mt-5 text-sm font-semibold text-red-600">
                Abrir herramienta →
              </div>
            </Link>

            {/* BANCO */}
            <Link
              href="/dashboard/question-bank"
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Database size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Administrar banco
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Consulta, revisa y administra las
                preguntas almacenadas en PeakScore.
              </p>

              <div className="mt-5 text-sm font-semibold text-blue-600">
                Abrir banco →
              </div>
            </Link>

          </div>
        </section>
      </div>
    </main>
  );
}
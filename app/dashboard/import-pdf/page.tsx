"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Database,
} from "lucide-react";

const SUBJECT_SESSIONS: Record<string, string[]> = {
  Matemáticas: ["1", "2"],
  "Sociales y Ciudadanas": ["1", "2"],
  "Ciencias Naturales": ["1", "2"],
  "Lectura Crítica": ["1"],
  Inglés: ["2"],
};

type DocumentType = "mixed" | "single_subject";

type ImportResult = {
  total_questions?: number;
  valid_questions?: number;
  invalid_questions?: unknown[];
  visual_questions?: unknown[];
  reference_questions_saved?: number;
};

export default function ImportPdfPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState("");
  const [documentType, setDocumentType] =
    useState<DocumentType | "">("");

  const [loading, setLoading] = useState(false);

  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    setFile(e.target.files[0]);

    // Limpiar resultado anterior al seleccionar otro archivo
    setImportResult(null);
    setSuccessMessage("");
  };

  const handleImport = async () => {
    if (!file || !subject || !session || !documentType) {
      alert("Completa todos los campos.");
      return;
    }

    setLoading(true);
    setImportResult(null);
    setSuccessMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("subject", subject);
      formData.append("session", session);
      formData.append("documentMode", documentType);

      const response = await fetch("/api/import.pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Error al importar el PDF."
        );
      }

      console.log(
        "Resultado de importación:",
        data
      );

      // Guardamos las estadísticas devueltas por route.ts
      setImportResult(data.data || null);

      setSuccessMessage(
        data.message ||
          "PDF procesado correctamente."
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Error al importar el PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        {/* ENCABEZADO */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Importar Banco de Preguntas
          </h1>

          <p className="mt-3 text-slate-600">
            Sube un PDF para analizar sus preguntas
            como material de referencia.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">

          {/* SUBIR PDF */}
          <div
            onClick={() =>
              inputRef.current?.click()
            }
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-14 text-center transition hover:border-blue-600"
          >
            <Upload
              className="mx-auto mb-5 text-blue-600"
              size={60}
            />

            <h2 className="text-2xl font-bold">
              Selecciona un PDF
            </h2>

            <p className="mt-3 text-slate-500">
              Haz clic para elegir un archivo.
              Máximo 30 MB.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* ARCHIVO SELECCIONADO */}
          {file && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-5">

              <div className="flex items-center gap-4">

                <FileText
                  className="text-red-500"
                  size={40}
                />

                <div>
                  <h3 className="font-bold">
                    {file.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>
                </div>

                <CheckCircle2
                  className="ml-auto text-green-600"
                  size={28}
                />

              </div>

            </div>
          )}

          {/* CONFIGURACIÓN */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">

            {/* MATERIA */}
            <div>
              <label className="mb-2 block font-medium">
                Materia
              </label>

              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSession("");
                }}
                className="w-full rounded-xl border p-3"
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Matemáticas">
                  Matemáticas
                </option>

                <option value="Lectura Crítica">
                  Lectura Crítica
                </option>

                <option value="Sociales y Ciudadanas">
                  Sociales y Ciudadanas
                </option>

                <option value="Ciencias Naturales">
                  Ciencias Naturales
                </option>

                <option value="Inglés">
                  Inglés
                </option>
              </select>
            </div>

            {/* SESIÓN */}
            <div>
              <label className="mb-2 block font-medium">
                Sesión
              </label>

              <select
                value={session}
                onChange={(e) =>
                  setSession(e.target.value)
                }
                disabled={!subject}
                className="w-full rounded-xl border p-3 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {subject
                    ? "Seleccionar"
                    : "Primero selecciona una materia"}
                </option>

                {subject &&
                  SUBJECT_SESSIONS[subject]?.map(
                    (availableSession) => (
                      <option
                        key={availableSession}
                        value={availableSession}
                      >
                        Sesión {availableSession}
                      </option>
                    )
                  )}
              </select>
            </div>

          </div>

          {/* TIPO DE DOCUMENTO */}
          <div className="mt-6">

            <label className="mb-2 block font-medium">
              Tipo de documento
            </label>

            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(
                  e.target.value as DocumentType
                )
              }
              className="w-full rounded-xl border p-3"
            >
              <option value="">
                Seleccionar tipo de documento
              </option>

              <option value="mixed">
                Simulacro mixto (varias materias)
              </option>

              <option value="single_subject">
                Exclusivo de una materia
              </option>
            </select>

            {documentType === "mixed" && (
              <p className="mt-2 text-sm text-slate-500">
                Se analizarán únicamente las preguntas
                correspondientes a la materia y sesión
                seleccionadas.
              </p>
            )}

            {documentType === "single_subject" && (
              <p className="mt-2 text-sm text-slate-500">
                Se analizarán todas las preguntas
                encontradas de la materia seleccionada,
                sin aplicar un límite fijo.
              </p>
            )}

          </div>

          {/* BOTÓN */}
          <button
            disabled={
              !file ||
              !subject ||
              !session ||
              !documentType ||
              loading
            }
            onClick={handleImport}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Procesando PDF...
              </>
            ) : (
              <>
                <Upload />
                Procesar PDF
              </>
            )}
          </button>

          {/* RESULTADO DE IMPORTACIÓN */}
          {successMessage && (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">

              <div className="flex items-start gap-4">

                <CheckCircle2
                  className="mt-1 shrink-0 text-green-600"
                  size={28}
                />

                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    Importación completada
                  </h3>

                  <p className="mt-1 text-sm text-green-700">
                    {successMessage}
                  </p>
                </div>

              </div>

              {importResult && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {/* TOTAL */}
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileText size={18} />
                      <span className="text-sm">
                        Total detectadas
                      </span>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {importResult.total_questions ?? 0}
                    </p>
                  </div>

                  {/* VÁLIDAS */}
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CheckCircle2
                        size={18}
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        Preguntas válidas
                      </span>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {importResult.valid_questions ?? 0}
                    </p>
                  </div>

                  {/* INVÁLIDAS */}
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <AlertCircle
                        size={18}
                        className="text-amber-500"
                      />
                      <span className="text-sm">
                        Preguntas inválidas
                      </span>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {Array.isArray(
                        importResult.invalid_questions
                      )
                        ? importResult.invalid_questions.length
                        : 0}
                    </p>
                  </div>

                  {/* VISUALES */}
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Eye
                        size={18}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        Preguntas visuales
                      </span>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-blue-600">
                      {Array.isArray(
                        importResult.visual_questions
                      )
                        ? importResult.visual_questions.length
                        : 0}
                    </p>
                  </div>

                  {/* GUARDADAS */}
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Database
                        size={18}
                        className="text-purple-600"
                      />
                      <span className="text-sm">
                        Perfiles guardados
                      </span>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-purple-600">
                      {importResult.reference_questions_saved ??
                        0}
                    </p>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}
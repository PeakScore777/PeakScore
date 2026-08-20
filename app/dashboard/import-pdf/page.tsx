"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ImportPdfPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file || !subject || !session) {
      alert("Completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("subject", subject);
      formData.append("session", session);

      const response = await fetch("/api/import.pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      alert(data.message);
    } catch (error) {
      console.error(error);
      alert("Error al importar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            Importar Banco de Preguntas
          </h1>

          <p className="mt-3 text-slate-600">
            Sube un PDF para convertir automáticamente sus preguntas.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">

          <div
            onClick={() => inputRef.current?.click()}
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
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFile}
            />
          </div>

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
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <CheckCircle2
                  className="ml-auto text-green-600"
                  size={28}
                />

              </div>

            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block font-medium">
                Materia
              </label>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Seleccionar</option>
                <option value="Matemáticas">Matemáticas</option>
                <option value="Lectura Crítica">Lectura Crítica</option>
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
              <label className="mb-2 block font-medium">
                Sesión
              </label>

              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Seleccionar</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

          </div>

          <button
            disabled={!file || loading}
            onClick={handleImport}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload />
                Procesar PDF
              </>
            )}
          </button>

        </div>

      </div>
    </main>
  );
}
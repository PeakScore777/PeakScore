
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
} from "lucide-react";
import { getEnglishDifficulty } from "@/lib/simulations/english-difficulty";

const SUBJECTS = [
  {
    name: "Matemáticas",
    description:
      "Resuelve problemas y fortalece tu razonamiento matemático.",
    image: "/dashboard/matematicaprogress.webp",
    accent: "cyan",
  },
  {
    name: "Lectura Crítica",
    description:
      "Analiza textos, argumentos e interpreta información.",
    image: "/dashboard/lecturaprogress.webp",
    accent: "violet",
  },
  {
    name: "Sociales y Ciudadanas",
    description:
      "Analiza fenómenos sociales, históricos y ciudadanos.",
    image: "/dashboard/socialesprogress.webp",
    accent: "gold",
  },
  {
    name: "Ciencias Naturales",
    description:
      "Pon a prueba tus conocimientos científicos y capacidad de análisis.",
    image: "/dashboard/naturalesprogress.webp",
    accent: "green",
  },
  {
    name: "Inglés",
    description:
      "Practica comprensión de lectura y uso del idioma.",
    image: "/dashboard/inglesprogress.webp",
    accent: "pink",
  },
] as const;

type EnglishFormat = "historical" | "saber11_2026";

type EnglishPartOption = {
  value: string;
  label: string;
  description: string;
};

const ENGLISH_PARTS_BY_FORMAT: Record<EnglishFormat, EnglishPartOption[]> = {
  historical: [
    { value: "1", label: "Parte 1", description: "Vocabulario y descripciones" },
    { value: "2", label: "Parte 2", description: "Avisos y situaciones" },
    { value: "3", label: "Parte 3", description: "Conversaciones cotidianas" },
    { value: "4A", label: "Parte 4A", description: "Formato histórico" },
    { value: "4B", label: "Parte 4B", description: "Formato histórico" },
    { value: "5", label: "Parte 5", description: "Comprensión de lectura" },
    { value: "6", label: "Parte 6", description: "Lectura inferencial" },
    { value: "7", label: "Parte 7", description: "Formato histórico" },
  ],
  saber11_2026: [
    { value: "1", label: "Parte 1", description: "Vocabulario y descripciones" },
    { value: "2", label: "Parte 2", description: "Avisos y situaciones" },
    { value: "3", label: "Parte 3", description: "Conversaciones cotidianas" },
    { value: "4", label: "Parte 4", description: "Uso del idioma en contexto" },
    { value: "5", label: "Parte 5", description: "Comprensión de lectura" },
    { value: "6", label: "Parte 6", description: "Lectura inferencial" },
    { value: "7A", label: "Parte 7A", description: "Formato Saber 11 · 2026" },
    { value: "7B", label: "Parte 7B", description: "Formato Saber 11 · 2026" },
  ],
};

const ENGLISH_FORMAT_LABELS: Record<EnglishFormat, string> = {
  historical: "Formato histórico",
  saber11_2026: "Saber 11 · 2026 Cal A",
};

const QUESTION_AMOUNTS = [5, 10, 25, 50];

const DIFFICULTIES = [
  {
    value: "Mixta",
    label: "Mixta",
    description: "Una combinación equilibrada de niveles.",
    image: "/images/simulacros/dificultad-mixta.webp",
    color: "mixed",
  },
  {
    value: "Fácil",
    label: "Fácil",
    description: "Ideal para reforzar fundamentos.",
    image: "/images/simulacros/dificultad-facil.webp",
    color: "easy",
  },
  {
    value: "Media",
    label: "Media",
    description: "Un nivel de entrenamiento estándar.",
    image: "/images/simulacros/dificultad-media.webp",
    color: "medium",
  },
  {
    value: "Difícil",
    label: "Difícil",
    description: "Un reto para llevar tu nivel más lejos.",
    image: "/images/simulacros/dificultad-dificil.webp",
    color: "hard",
  },
] as const;

const pixelFont = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontWeight: 400,
  WebkitFontSmoothing: "none" as const,
};

function calculateDuration(amount: number) {
  return Math.max(10, Math.ceil(amount * 1.5));
}

export default function NewSimulationPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("Matemáticas");
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState("Mixta");
  const [bookletFormat, setBookletFormat] =
    useState<EnglishFormat>("saber11_2026");
  const [englishPart, setEnglishPart] = useState("1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubject = useMemo(
    () => SUBJECTS.find((item) => item.name === subject),
    [subject],
  );

  const effectiveDifficulty =
    subject === "Inglés" ? getEnglishDifficulty(englishPart) : difficulty;

  const selectedDifficulty = useMemo(
    () => DIFFICULTIES.find((item) => item.value === effectiveDifficulty),
    [effectiveDifficulty],
  );

  const visibleDifficulties =
    subject === "Inglés"
      ? DIFFICULTIES.filter((item) => item.value === effectiveDifficulty)
      : DIFFICULTIES;

  const selectedEnglishPart = useMemo(
    () =>
      ENGLISH_PARTS_BY_FORMAT[bookletFormat].find(
        (item) => item.value === englishPart,
      ),
    [bookletFormat, englishPart],
  );

  const duration = calculateDuration(amount);

  async function handleGenerate() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "normal",
          subject,
          amount,
          difficulty: effectiveDifficulty,
          englishFormat: subject === "Inglés" ? bookletFormat : null,
          englishPart: subject === "Inglés" ? englishPart : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No fue posible generar el simulacro.",
        );
      }

      if (!result.simulation?.id) {
        throw new Error(
          "El simulacro fue creado, pero no se recibió su identificador.",
        );
      }

      router.push(`/simulacros/${result.simulation.id}`);
    } catch (err) {
      console.error("Error generando simulacro:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error generando el simulacro.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#070813] px-4 pb-14 pt-7 text-white sm:px-6 sm:pt-9 lg:px-8">
      {/* Fondo general de la página de simulacros */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/backgrounds/simulacros-fondo.webp')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#080916]/75 via-[#080916]/65 to-[#050611]/95"
      />

      <div className="relative mx-auto max-w-[1440px]">
        {/* Navegación de regreso */}
        <div className="mb-7 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/simulacros")}
            className="group inline-flex items-center gap-3 border border-white/15 bg-[#080a18]/80 px-4 py-3 text-sm font-semibold text-slate-300 backdrop-blur-md transition hover:border-[#8de9f2]/50 hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Volver a simulacros
          </button>
        </div>

        {/* Cabecera y objetivo */}
        <header className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-center">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[3px] w-8 bg-[#8de9f2]" />

              <p
                className="text-[8px] leading-5 tracking-[0.12em] text-[#b8f8ff] sm:text-[9px]"
                style={pixelFont}
              >
                PERSONALIZA TU ENTRENAMIENTO
              </p>
            </div>

            <h1
              className="text-[24px] leading-[1.65] tracking-tight text-white sm:text-[32px] lg:text-[39px]"
              style={pixelFont}
            >
              CREA TU
              <span className="block text-[#8de9f2]">
                SIMULACRO
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Elige tu materia, configura el desafío y prepárate para
              superar tu próximo objetivo ICFES.
            </p>
          </div>

          <aside className="relative overflow-hidden border border-[#8de9f2]/30 bg-[#080a18]/90 p-5 shadow-[0_0_35px_rgba(56,189,248,0.08)] backdrop-blur-xl sm:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#8de9f2] via-[#9280df] to-transparent" />

            <div className="flex items-center gap-4">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center">
                <img
                  src="/images/simulacros/objetivo-icfes.webp"
                  alt="Cristal que representa tu objetivo ICFES"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="text-[8px] leading-5 text-[#b8f8ff]"
                  style={pixelFont}
                >
                  TU OBJETIVO
                </p>

                <h2 className="mt-2 text-lg font-black text-white">
                  Supera tu marca
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Practica, mejora y avanza hacia tu mejor resultado.
                </p>
              </div>
            </div>
          </aside>
        </header>

        {/* Configuración y resumen */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* Panel de configuración */}
          <section className="min-w-0 overflow-hidden border border-white/15 bg-[#070914]/95 shadow-[0_18px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-4 sm:px-7">
              <div>
                <p
                  className="text-[8px] leading-5 text-[#a99bea]"
                  style={pixelFont}
                >
                  PREPARACIÓN
                </p>

                <h2 className="mt-2 text-lg font-black text-white sm:text-xl">
                  Configura tu prueba
                </h2>
              </div>

              <span className="border border-[#8de9f2]/25 bg-[#8de9f2]/5 px-3 py-2 text-[9px] font-bold text-[#b8f8ff]">
                {subject === "Inglés" ? "4 pasos" : "3 pasos"}
              </span>
            </div>

            <div className="p-4 sm:p-7">
              {/* Paso 1: materia */}
              <section>
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#8de9f2]/50 bg-[#8de9f2]/10">
                    <span
                      className="text-[10px] text-[#8de9f2]"
                      style={pixelFont}
                    >
                      01
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-[10px] leading-6 text-white sm:text-[11px]"
                      style={pixelFont}
                    >
                      ELIGE UNA MATERIA
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Cada simulacro personalizado trabaja una sola materia.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {SUBJECTS.map((item) => {
                    const selected = subject === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSubject(item.name);
                          if (item.name !== "Inglés") {
                            setDifficulty("Mixta");
                          }
                        }}
                        className={`group relative flex min-h-[112px] min-w-0 items-center gap-3 border p-3 text-left transition duration-200 sm:p-4 ${
                          selected
                            ? "border-[#8de9f2] bg-[#10202c]/90 shadow-[inset_0_0_22px_rgba(34,211,238,0.07),0_0_16px_rgba(34,211,238,0.08)]"
                            : "border-white/10 bg-[#0d1020]/90 hover:border-white/25 hover:bg-[#11152a]"
                        }`}
                      >
                        <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center">
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-sm font-bold leading-5 ${
                              selected ? "text-[#c5faff]" : "text-white"
                            }`}
                          >
                            {item.name}
                          </h3>

                          <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                            {item.description}
                          </p>
                        </div>

                        {selected && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8de9f2] text-[#06101c]">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        )}

                        <span
                          aria-hidden="true"
                          className={`absolute bottom-0 left-0 h-[2px] transition-all ${
                            selected
                              ? "w-full bg-[#8de9f2]"
                              : "w-0 bg-[#9b8be6] group-hover:w-1/3"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              {subject === "Inglés" && (
                <>
                  <div className="my-7 border-t border-white/10 sm:my-8" />

                  <section aria-labelledby="english-format-title">
                    <div className="mb-5 flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#8de9f2]/50 bg-[#8de9f2]/10">
                        <span className="text-[10px] text-[#8de9f2]" style={pixelFont}>
                          02
                        </span>
                      </div>
                      <div>
                        <h2
                          id="english-format-title"
                          className="text-[10px] leading-6 text-white sm:text-[11px]"
                          style={pixelFont}
                        >
                          FORMATO DE INGLÉS
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Elige la estructura del cuadernillo que deseas practicar.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          {
                            value: "historical",
                            label: "Formato histórico",
                            description: "Incluye 4A, 4B y una sola Parte 7.",
                          },
                          {
                            value: "saber11_2026",
                            label: "Saber 11 · 2026 Cal A",
                            description: "Incluye Parte 4 y las secciones 7A y 7B.",
                          },
                        ] as const
                      ).map((format) => {
                        const selected = bookletFormat === format.value;

                        return (
                          <button
                            key={format.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setBookletFormat(format.value);
                              setEnglishPart("1");
                            }}
                            className={[
                              "relative min-h-[98px] border p-4 text-left transition",
                              selected
                                ? "border-[#8de9f2] bg-[#102431] shadow-[inset_0_0_24px_rgba(34,211,238,0.07)]"
                                : "border-white/10 bg-[#0d1020] hover:border-white/25 hover:bg-[#11152a]",
                            ].join(" ")}
                          >
                            <span className="block text-sm font-bold text-white">
                              {format.label}
                            </span>
                            <span className="mt-2 block text-xs leading-5 text-slate-400">
                              {format.description}
                            </span>
                            {selected && (
                              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#8de9f2] text-[#06101c]">
                                <Check size={13} strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">
                          ¿Qué parte quieres presentar?
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          {ENGLISH_FORMAT_LABELS[bookletFormat]}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {ENGLISH_PARTS_BY_FORMAT[bookletFormat].map((part) => {
                          const selected = englishPart === part.value;

                          return (
                            <button
                              key={part.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setEnglishPart(part.value)}
                              className={[
                                "relative flex min-h-[76px] flex-col justify-center border px-3 py-3 text-left transition",
                                selected
                                  ? "border-[#a99bea] bg-[#17132b] shadow-[inset_0_0_20px_rgba(167,139,250,0.09)]"
                                  : "border-white/10 bg-[#0d1020] hover:border-white/25 hover:bg-[#11152a]",
                              ].join(" ")}
                            >
                              <span className="text-sm font-black text-white">
                                {part.label}
                              </span>
                              <span className="mt-1 text-[10px] leading-4 text-slate-400">
                                {part.description}
                              </span>
                              {selected && (
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#c7bbff]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-200/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/80">
                        Solo aparecerán preguntas que estén revisadas, publicadas y disponibles en el banco para el formato y la parte elegidos.
                      </p>
                    </div>
                  </section>
                </>
              )}

              <div className="my-7 border-t border-white/10 sm:my-8" />

              {/* Paso 3: preguntas */}
              <section>
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#a99bea]/50 bg-[#a99bea]/10">
                    <span
                      className="text-[10px] text-[#c7bbff]"
                      style={pixelFont}
                    >
                      {subject === "Inglés" ? "03" : "02"}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-[10px] leading-6 text-white sm:text-[11px]"
                      style={pixelFont}
                    >
                      ¿CUÁNTAS PREGUNTAS?
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Elige el tamaño de tu entrenamiento.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {QUESTION_AMOUNTS.map((value) => {
                    const selected = amount === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAmount(value)}
                        className={`relative flex min-h-[86px] flex-col items-center justify-center border transition duration-200 ${
                          selected
                            ? "border-[#8de9f2] bg-[#102431] text-white shadow-[inset_0_0_24px_rgba(34,211,238,0.07)]"
                            : "border-white/10 bg-[#0d1020] text-slate-300 hover:border-white/25 hover:bg-[#11152a]"
                        }`}
                      >
                        <span className="text-2xl font-black tabular-nums">
                          {value}
                        </span>

                        <span
                          className={`mt-2 text-[7px] leading-4 ${
                            selected ? "text-[#8de9f2]" : "text-slate-500"
                          }`}
                          style={pixelFont}
                        >
                          PREGUNTAS
                        </span>

                        {selected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8de9f2] text-[#06101c]">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="my-7 border-t border-white/10 sm:my-8" />

              {/* Paso 4: dificultad */}
              <section>
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#a99bea]/50 bg-[#a99bea]/10">
                    <span
                      className="text-[10px] text-[#c7bbff]"
                      style={pixelFont}
                    >
                      {subject === "Inglés" ? "04" : "03"}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-[10px] leading-6 text-white sm:text-[11px]"
                      style={pixelFont}
                    >
                      ELIGE LA DIFICULTAD
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Selecciona el nivel de desafío.
                    </p>
                  </div>
                </div>

                {subject === "Inglés" && (
                  <p className="mb-3 rounded-xl border border-[#8de9f2]/20 bg-[#8de9f2]/[0.04] px-4 py-3 text-xs leading-5 text-slate-300">
                    Esta parte tiene una dificultad definida por el banco de preguntas.
                  </p>
                )}
                <div className={subject === "Inglés" ? "grid grid-cols-1 sm:max-w-[220px]" : "grid grid-cols-2 gap-3 sm:grid-cols-4"}>
                  {visibleDifficulties.map((item) => {
                    const selected = difficulty === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          if (subject !== "Inglés") setDifficulty(item.value);
                        }}
                        className={`group relative flex min-w-0 flex-col items-center border px-2 py-4 text-center transition duration-200 sm:px-3 ${
                          selected
                            ? "border-[#a99bea] bg-[#17132b] shadow-[inset_0_0_22px_rgba(167,139,250,0.1)]"
                            : "border-white/10 bg-[#0d1020] hover:border-white/25 hover:bg-[#11152a]"
                        }`}
                      >
                        <div className="flex h-[78px] w-full items-center justify-center">
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        <span
                          className={`mt-2 text-[8px] leading-5 sm:text-[9px] ${
                            selected ? "text-[#d2c8ff]" : "text-white"
                          }`}
                          style={pixelFont}
                        >
                          {item.label.toUpperCase()}
                        </span>

                        <p className="mt-2 text-[10px] leading-4 text-slate-400">
                          {item.description}
                        </p>

                        {selected && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#b7a9f5] text-[#111020]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Errores de generación */}
              {error && (
                <div
                  role="alert"
                  className="mt-6 border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm leading-6 text-red-200"
                >
                  {error}
                </div>
              )}

              {/* Generar */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="group relative mt-8 flex min-h-[58px] w-full items-center justify-between gap-4 overflow-hidden border border-[#8de9f2]/70 bg-gradient-to-r from-[#102438] via-[#19183a] to-[#27143c] px-5 py-4 text-white shadow-[0_0_24px_rgba(34,211,238,0.08)] transition hover:border-[#d4c6ff] hover:shadow-[0_0_32px_rgba(139,92,246,0.16)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7"
              >
                <span
                  className="text-[8px] leading-5 text-[#c5faff] sm:text-[10px]"
                  style={pixelFont}
                >
                  {loading ? "PREPARANDO..." : "GENERAR SIMULACRO"}
                </span>

                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#8de9f2]" />
                ) : (
                  <span className="flex items-center gap-3 text-[#8de9f2]">
                    <span
                      aria-hidden="true"
                      className="text-2xl transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                )}

                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-1/3 bg-[#8de9f2]"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-[2px] w-1/4 bg-[#a99bea]"
                />
              </button>
            </div>
          </section>

          {/* Resumen: Tu entrenamiento */}
          <aside className="h-fit overflow-hidden border border-[#a99bea]/35 bg-[#080a17]/95 shadow-[0_18px_55px_rgba(0,0,0,0.4)] backdrop-blur-xl xl:sticky xl:top-6">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <p
                className="text-[8px] leading-5 text-[#c7bbff]"
                style={pixelFont}
              >
                VISTA PREVIA
              </p>

              <h2
                className="mt-3 text-[10px] leading-6 text-white sm:text-[11px]"
                style={pixelFont}
              >
                TU ENTRENAMIENTO
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Revisa tu configuración antes de comenzar.
              </p>
            </div>

            {/* Ilustración del entrenamiento */}
            <div
              className="relative h-[190px] overflow-hidden bg-cover bg-center sm:h-[220px]"
              style={{
                backgroundImage:
                  "url('/images/simulacros/tu-entrenamiento-fondo.webp')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#080a17] via-[#080a17]/10 to-[#080a17]/15" />

              <div className="absolute bottom-4 left-4 right-4">
                <p
                  className="text-[8px] leading-5 text-[#b8f8ff]"
                  style={pixelFont}
                >
                  TU PRÓXIMO DESAFÍO
                </p>

                <p className="mt-2 text-sm font-black text-white">
                  {selectedSubject?.name ?? subject}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {/* Materia */}
              <div className="flex items-center gap-3 border border-white/10 bg-[#0d1020] p-3">
                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center">
                  {selectedSubject && (
                    <img
                      src={selectedSubject.image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">
                    Materia
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {selectedSubject?.name ?? subject}
                  </p>
                </div>
              </div>

              {subject === "Inglés" && (
                <div className="flex items-center gap-4 border border-[#8de9f2]/20 bg-[#8de9f2]/[0.06] p-4">
                  <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center border border-[#8de9f2]/30 bg-[#8de9f2]/10 text-xs font-black text-[#8de9f2]">
                    EN
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">Formato · Parte</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {ENGLISH_FORMAT_LABELS[bookletFormat]} · {selectedEnglishPart?.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400">
                      Solo se seleccionará contenido de esta sección.
                    </p>
                  </div>
                </div>
              )}

              {/* Preguntas */}
              <div className="flex items-center gap-4 border border-white/10 bg-[#0d1020] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#a99bea]/25 bg-[#a99bea]/10">
                  <span
                    className="text-[9px] text-[#c7bbff]"
                    style={pixelFont}
                  >
                    {amount}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">
                    Número de preguntas
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {amount} preguntas
                  </p>
                </div>
              </div>

              {/* Dificultad */}
              <div className="flex items-center gap-4 border border-white/10 bg-[#0d1020] p-4">
                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center">
                  {selectedDifficulty && (
                    <img
                      src={selectedDifficulty.image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">
                    Dificultad
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {effectiveDifficulty}
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-slate-400">
                    {selectedDifficulty?.description}
                  </p>
                </div>
              </div>

              {/* Tiempo estimado */}
              <div className="border border-[#8de9f2]/20 bg-[#8de9f2]/[0.06] p-4">
                <div className="flex items-center gap-2 text-[#8de9f2]">
                  <Clock3 size={16} />

                  <p className="text-xs font-semibold">
                    Tiempo estimado
                  </p>
                </div>

                <p className="mt-2 text-3xl font-black text-white">
                  {duration}
                  <span className="ml-2 text-sm font-semibold text-slate-400">
                    min
                  </span>
                </p>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Estimación de duración según la cantidad de preguntas.
                </p>
              </div>

              {/* Recordatorio */}
              <div className="border border-[#a99bea]/25 bg-[#a99bea]/[0.06] p-4">
                <p
                  className="text-[8px] leading-5 text-[#c7bbff]"
                  style={pixelFont}
                >
                  RECUERDA
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-300">
                  PeakScore preparará una prueba enfocada únicamente
                  en la materia que seleccionaste.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

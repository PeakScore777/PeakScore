
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartColumnIncreasing,
  CheckCircle2,
  CircleHelp,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Table2,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type Question = {
  prompt: string;
  context: string;
  options: Option[];
  answer: string;
  explanation: string;
};

const PRACTICE_QUESTIONS: Question[] = [
  {
    prompt: "¿En qué mes se vendieron más bananos?",
    context:
      "Una tienda registró las ventas de tres frutas durante el primer trimestre.",
    options: [
      { label: "A", value: "Enero" },
      { label: "B", value: "Febrero" },
      { label: "C", value: "Marzo" },
      { label: "D", value: "Se vendieron lo mismo" },
    ],
    answer: "Marzo",
    explanation:
      "La columna de bananos registra 80 unidades en enero, 90 en febrero y 110 en marzo. El valor mayor es 110, por eso la respuesta es marzo.",
  },
  {
    prompt: "¿Cuál grupo obtuvo el mayor resultado en Matemáticas?",
    context:
      "En una evaluación, tres grupos obtuvieron estos resultados: grupo A, 72 puntos; grupo B, 85 puntos; grupo C, 90 puntos.",
    options: [
      { label: "A", value: "Grupo A" },
      { label: "B", value: "Grupo B" },
      { label: "C", value: "Grupo C" },
      { label: "D", value: "Todos obtuvieron lo mismo" },
    ],
    answer: "Grupo C",
    explanation:
      "Comparamos los tres resultados: 72, 85 y 90. Como 90 es el mayor valor, el grupo C obtuvo el resultado más alto.",
  },
  {
    prompt: "¿Cuántos libros más se leyeron el viernes que el lunes?",
    context:
      "Un registro semanal muestra estos libros leídos: lunes, 4; martes, 6; miércoles, 8; jueves, 5; viernes, 9.",
    options: [
      { label: "A", value: "3 libros" },
      { label: "B", value: "4 libros" },
      { label: "C", value: "5 libros" },
      { label: "D", value: "13 libros" },
    ],
    answer: "5 libros",
    explanation:
      "El viernes se leyeron 9 libros y el lunes 4. Para calcular la diferencia, restamos 9 − 4 = 5 libros.",
  },
];

const FINAL_QUESTION: Question = {
  prompt:
    "¿Cuál fue el porcentaje de aumento del consumo entre enero y marzo?",
  context:
    "Una vivienda registró el siguiente consumo de agua: enero, 120 litros; febrero, 150 litros; marzo, 180 litros.",
  options: [
    { label: "A", value: "25 %" },
    { label: "B", value: "40 %" },
    { label: "C", value: "50 %" },
    { label: "D", value: "60 %" },
  ],
  answer: "50 %",
  explanation:
    "Primero calculamos el aumento: 180 − 120 = 60 litros. Después dividimos el aumento entre el valor inicial: 60 ÷ 120 = 0,5. Finalmente multiplicamos por 100: 0,5 × 100 = 50 %.",
};

const STEPS = [
  "Introducción",
  "Teoría",
  "Ejemplo guiado",
  "Práctica",
  "Desafío final",
  "Resultados",
];

function PixelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200">
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#0c1224]/95 p-5 shadow-xl shadow-black/20 sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

function DataTable({
  rows,
}: {
  rows: { name: string; values: string[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-violet-400/10 text-violet-100">
          <tr>
            <th className="border-b border-white/10 px-3 py-3">Mes</th>
            <th className="border-b border-white/10 px-3 py-3">Manzanas</th>
            <th className="border-b border-white/10 px-3 py-3">Bananos</th>
            <th className="border-b border-white/10 px-3 py-3">Naranjas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="even:bg-white/[0.025]">
              <th className="border-t border-white/10 px-3 py-3 font-semibold text-white/80">
                {row.name}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.name}-${index}`}
                  className="border-t border-white/10 px-3 py-3 text-white/70"
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionCard({
  question,
  questionNumber,
  total,
  selected,
  revealed,
  onSelect,
  onCheck,
  onNext,
  isLast,
}: {
  question: Question;
  questionNumber: number;
  total: number;
  selected: string | null;
  revealed: boolean;
  onSelect: (value: string) => void;
  onCheck: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const correct = selected === question.answer;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PixelLabel>
          Pregunta {questionNumber} de {total}
        </PixelLabel>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
          Entrenamiento
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-400 transition-all"
          style={{ width: `${(questionNumber / total) * 100}%` }}
        />
      </div>

      <p className="mt-6 text-sm leading-7 text-white/60">
        {question.context}
      </p>
      <h2 className="mt-3 text-xl font-extrabold leading-relaxed text-white sm:text-2xl">
        {question.prompt}
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const active = selected === option.value;
          const isAnswer = revealed && option.value === question.answer;
          const isWrong = revealed && active && !correct;

          let style =
            "border-white/10 bg-white/[0.025] hover:border-violet-300/50 hover:bg-violet-300/5";

          if (active && !revealed) {
            style = "border-violet-300 bg-violet-400/15";
          } else if (isAnswer) {
            style = "border-emerald-300/60 bg-emerald-300/10";
          } else if (isWrong) {
            style = "border-rose-300/60 bg-rose-300/10";
          }

          return (
            <button
              key={option.label}
              type="button"
              disabled={revealed}
              onClick={() => onSelect(option.value)}
              className={`flex min-h-16 items-center gap-3 rounded-xl border p-4 text-left transition disabled:cursor-default ${style}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-sm font-black text-violet-200">
                {option.label}
              </span>
              <span className="text-sm font-semibold text-white/90">
                {option.value}
              </span>
              {isAnswer && (
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-300" />
              )}
              {isWrong && (
                <XCircle className="ml-auto h-5 w-5 shrink-0 text-rose-300" />
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          aria-live="polite"
          className={`mt-5 rounded-xl border p-4 ${
            correct
              ? "border-emerald-300/25 bg-emerald-300/[0.07]"
              : "border-amber-300/25 bg-amber-300/[0.07]"
          }`}
        >
          <p className="flex items-center gap-2 font-bold text-white">
            {correct ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            ) : (
              <CircleHelp className="h-5 w-5 text-amber-200" />
            )}
            {correct ? "¡Respuesta correcta!" : "Vamos a entenderlo"}
          </p>
          <p className="mt-2 text-sm leading-7 text-white/70">
            {question.explanation}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-white/40">
          {revealed
            ? "Lee la explicación antes de continuar."
            : "Selecciona una opción y comprueba tu respuesta."}
        </p>

        {!revealed ? (
          <button
            type="button"
            disabled={!selected}
            onClick={onCheck}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comprobar <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-violet-400"
          >
            {isLast ? "Ver resultados" : "Siguiente pregunta"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </Panel>
  );
}

export default function ArchivoDeLosEnigmasPage() {
  const [step, setStep] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(false);
  const [finalAnswered, setFinalAnswered] = useState(false);
  const [finalSelected, setFinalSelected] = useState<string | null>(null);

  const currentQuestion = PRACTICE_QUESTIONS[practiceIndex];

  function checkPractice() {
    if (!selected || revealed) return;
    setRevealed(true);

    if (selected === currentQuestion.answer) {
      setPracticeCorrect((count) => count + 1);
    }
  }

  function nextPractice() {
    if (practiceIndex < PRACTICE_QUESTIONS.length - 1) {
      setPracticeIndex((index) => index + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }

    setStep(4);
    setSelected(null);
    setRevealed(false);
  }

  function checkFinal() {
    if (!finalSelected || finalAnswered) return;
    setFinalCorrect(finalSelected === FINAL_QUESTION.answer);
    setFinalAnswered(true);
  }

  function restart() {
    setStep(0);
    setPracticeIndex(0);
    setSelected(null);
    setRevealed(false);
    setPracticeCorrect(0);
    setFinalCorrect(false);
    setFinalAnswered(false);
    setFinalSelected(null);
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#070b16] px-4 py-6 text-white sm:px-7 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(91,55,180,.28), transparent 58%), linear-gradient(180deg, transparent, #070b16 90%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/aprender"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c1224] px-3 py-2.5 text-xs font-bold text-white/65 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a niveles
        </Link>

        <header className="mt-6 overflow-hidden rounded-2xl border border-violet-300/20 bg-gradient-to-br from-[#171331] via-[#10152a] to-[#0c1224] p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-violet-200/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-violet-200">
              Ruta 01 · Matemáticas
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/60">
              Misión 1 de 5
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-black leading-relaxed sm:text-4xl">
            El Archivo de los Enigmas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
            Aprende a interpretar tablas, comparar datos y descubrir qué
            información puedes obtener de ellos. Cada paso te prepara para
            resolver problemas con mayor confianza.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white/70">
              <Zap className="h-4 w-4 text-amber-200" />
              Recompensa prevista: +25 EXP
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white/70">
              <BookOpen className="h-4 w-4 text-violet-200" />
              Teoría y práctica
            </div>
          </div>
        </header>

        <nav
          aria-label="Etapas de la misión"
          className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6"
        >
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border p-3 ${
                index === step
                  ? "border-violet-300/50 bg-violet-400/10"
                  : index < step
                    ? "border-emerald-300/20 bg-emerald-300/[0.04]"
                    : "border-white/10 bg-[#0c1224]/70"
              }`}
            >
              <span className="text-xs font-black text-white/45">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-[10px] font-bold leading-5 text-white/80">
                {label}
              </p>
            </div>
          ))}
        </nav>

        <div className="mt-5">
          {step === 0 && (
            <Panel>
              <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/10 to-cyan-300/5 p-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-400/10">
                    <Sparkles className="h-10 w-10 text-violet-200" />
                  </div>
                  <p className="mt-4 text-sm font-extrabold">¡Bienvenido al archivo!</p>
                  <p className="mt-2 text-xs leading-6 text-white/45">
                    Una nueva misión te espera.
                  </p>
                </div>

                <div>
                  <PixelLabel>Tu misión</PixelLabel>
                  <h2 className="mt-3 text-xl font-black leading-relaxed sm:text-2xl">
                    Descifra la información oculta
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/65">
                    Las tablas y las gráficas organizan información de manera
                    visual. Tu objetivo es aprender a leerlas, identificar los
                    valores importantes y justificar tus conclusiones.
                  </p>

                  <ul className="mt-5 space-y-3 text-sm text-white/75">
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      Identificar filas, columnas y unidades.
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      Comparar cantidades y encontrar diferencias.
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      Resolver una pregunta contextualizada.
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold transition hover:bg-violet-400 sm:w-auto"
                  >
                    Comenzar misión <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === 1 && (
            <Panel>
              <PixelLabel>Parte 01 · Aprende</PixelLabel>
              <h2 className="mt-3 text-2xl font-black">
                ¿Cómo se interpreta una tabla?
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Una tabla organiza datos en filas y columnas. Para interpretarla
                correctamente, identifica qué representa cada encabezado, qué
                valor necesitas y en qué unidad se expresa.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <article className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                  <Table2 className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-3 font-extrabold">Filas</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Organizan los registros que quieres comparar, como los
                    diferentes meses.
                  </p>
                </article>
                <article className="rounded-xl border border-violet-300/20 bg-violet-300/[0.05] p-4">
                  <ChartColumnIncreasing className="h-6 w-6 text-violet-200" />
                  <h3 className="mt-3 font-extrabold">Columnas</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Identifican las categorías o variables, como los tipos de
                    fruta.
                  </p>
                </article>
                <article className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
                  <CircleHelp className="h-6 w-6 text-emerald-200" />
                  <h3 className="mt-3 font-extrabold">Datos y unidades</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Indican el valor registrado y cómo debe interpretarse:
                    personas, litros, pesos u otras unidades.
                  </p>
                </article>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-white/80">
                  Ejemplo: ventas de una tienda, en unidades
                </p>
                <DataTable
                  rows={[
                    { name: "Enero", values: ["120", "80", "60"] },
                    { name: "Febrero", values: ["150", "90", "70"] },
                    { name: "Marzo", values: ["180", "110", "90"] },
                  ]}
                />
              </div>

              <div className="mt-5 rounded-xl border border-amber-200/20 bg-amber-200/[0.05] p-4">
                <p className="font-bold text-amber-100">
                  Consejo de Peaky
                </p>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  Antes de responder, lee la pregunta y localiza únicamente
                  los datos que necesitas. No confundas el valor mayor de una
                  fila con el valor mayor de una columna.
                </p>
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/5"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold hover:bg-violet-400"
                >
                  Ver ejemplo <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Panel>
          )}

          {step === 2 && (
            <Panel>
              <PixelLabel>Parte 02 · Ejemplo guiado</PixelLabel>
              <h2 className="mt-3 text-2xl font-black leading-relaxed">
                Vamos a resolverlo paso a paso
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Utiliza la tabla de ventas para responder: ¿en qué mes se
                vendieron más bananos?
              </p>

              <div className="mt-6">
                <DataTable
                  rows={[
                    { name: "Enero", values: ["120", "80", "60"] },
                    { name: "Febrero", values: ["150", "90", "70"] },
                    { name: "Marzo", values: ["180", "110", "90"] },
                  ]}
                />
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    number: "01",
                    title: "Localiza la columna correcta",
                    text: "Buscamos bananos. No necesitamos comparar las ventas de manzanas ni las de naranjas.",
                  },
                  {
                    number: "02",
                    title: "Compara los valores",
                    text: "Los valores de bananos son 80, 90 y 110 unidades.",
                  },
                  {
                    number: "03",
                    title: "Justifica la conclusión",
                    text: "110 es el mayor valor. Corresponde a marzo, así que marzo es la respuesta.",
                  },
                ].map((item) => (
                  <div
                    key={item.number}
                    className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-sm font-black text-violet-200">
                      {item.number}
                    </span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/60">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4">
                <p className="flex items-center gap-2 font-bold text-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                  Conclusión: marzo, con 110 bananos.
                </p>
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/5"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold hover:bg-violet-400"
                >
                  Practicar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Panel>
          )}

          {step === 3 && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={practiceIndex + 1}
              total={PRACTICE_QUESTIONS.length}
              selected={selected}
              revealed={revealed}
              onSelect={setSelected}
              onCheck={checkPractice}
              onNext={nextPractice}
              isLast={practiceIndex === PRACTICE_QUESTIONS.length - 1}
            />
          )}

          {step === 4 && (
            <QuestionCard
              question={FINAL_QUESTION}
              questionNumber={1}
              total={1}
              selected={finalSelected}
              revealed={finalAnswered}
              onSelect={setFinalSelected}
              onCheck={checkFinal}
              onNext={() => setStep(5)}
              isLast
            />
          )}

          {step === 5 && (
            <Panel className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-200/10">
                <Trophy className="h-10 w-10 text-amber-200" />
              </div>

              <PixelLabel>Misión finalizada</PixelLabel>
              <h2 className="mt-4 text-2xl font-black leading-relaxed sm:text-3xl">
                {practiceCorrect === PRACTICE_QUESTIONS.length &&
                finalCorrect
                  ? "¡Excelente, descifrador!"
                  : "¡Buen trabajo, explorador!"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Terminaste la experiencia de demostración. Revisa tus
                resultados y vuelve a practicar cuando quieras.
              </p>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="text-xs text-white/45">Práctica</p>
                  <p className="mt-2 text-2xl font-black text-violet-200">
                    {practiceCorrect}/{PRACTICE_QUESTIONS.length}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Respuestas correctas
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="text-xs text-white/45">Desafío final</p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      finalCorrect ? "text-emerald-200" : "text-amber-200"
                    }`}
                  >
                    {finalCorrect ? "Correcto" : "Por mejorar"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {finalCorrect ? "50 % de aumento" : "Repasa el cálculo"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/[0.05] p-4 text-left">
                <p className="flex items-center gap-2 font-bold text-amber-100">
                  <LockKeyhole className="h-4 w-4" />
                  Recompensa prevista: +25 EXP
                </p>
                <p className="mt-2 text-xs leading-6 text-white/55">
                  Esta versión es una experiencia funcional de demostración.
                  Todavía no guarda el progreso en Supabase ni concede EXP o
                  monedas. Eso se conectará después mediante una operación
                  segura en el servidor para evitar recompensas duplicadas.
                </p>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Repetir misión
                </button>
                <Link
                  href="/aprender"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-extrabold hover:bg-violet-400"
                >
                  Volver a los niveles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Panel>
          )}
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-xs text-white/35">
          <span>PEAKSCORE · RUTA DE APRENDIZAJE</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Aprende. Practica. Supera el desafío.
          </span>
        </footer>
      </div>
    </main>
  );
}

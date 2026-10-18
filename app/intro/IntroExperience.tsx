"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, LoaderCircle, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AnswerKey =
  | "school_grade"
  | "icfes_experience"
  | "learning_goal"
  | "math_confidence";

type Answers = Record<AnswerKey, string>;

const QUESTIONS: {
  key: AnswerKey;
  title: string;
  description: string;
  options: { value: string; label: string; detail: string }[];
}[] = [
  {
    key: "school_grade",
    title: "¿En qué etapa estás?",
    description: "Así adaptamos el punto de partida a tu momento.",
    options: [
      { value: "decimo", label: "Estoy en décimo", detail: "Quiero construir bases con tiempo." },
      { value: "undecimo", label: "Estoy en undécimo", detail: "Quiero prepararme para el examen." },
      { value: "graduado", label: "Ya terminé el colegio", detail: "Estoy retomando mi preparación." },
      { value: "otro", label: "Otra situación", detail: "Mi recorrido es diferente." },
    ],
  },
  {
    key: "icfes_experience",
    title: "¿Qué experiencia tienes con el ICFES?",
    description: "No importa cuántas veces lo hayas presentado: queremos conocer tu recorrido.",
    options: [
      { value: "principiante", label: "Estoy empezando", detail: "Todavía no he hecho simulacros." },
      { value: "simulacros", label: "He practicado", detail: "Ya conozco los simulacros tipo ICFES." },
      { value: "presentado_una_vez", label: "Lo presenté una vez", detail: "Tengo una experiencia previa con el examen." },
      { value: "presentado_varias_veces", label: "Lo he presentado varias veces", detail: "Quiero aprovechar lo que he aprendido." },
    ],
  },
  {
    key: "learning_goal",
    title: "¿Qué quieres conseguir primero?",
    description: "Esto nos ayuda a orientar tu recorrido, no a ponerte una etiqueta.",
    options: [
      { value: "fundamentos", label: "Fortalecer mis bases", detail: "Entender los conceptos desde el principio." },
      { value: "reforzar_debilidades", label: "Trabajar mis dificultades", detail: "Dedicar tiempo a lo que más me cuesta." },
      { value: "mejorar_puntaje", label: "Mejorar mi puntaje", detail: "Prepararme con una meta clara." },
      { value: "practicar", label: "Practicar preguntas", detail: "Resolver situaciones tipo ICFES." },
    ],
  },
  {
    key: "math_confidence",
    title: "¿Cómo te sientes con Matemáticas?",
    description: "No es una calificación. Solo queremos saber cómo empezar contigo.",
    options: [
      { value: "baja", label: "Me cuesta bastante", detail: "A veces no sé por dónde comenzar." },
      { value: "media", label: "Tengo algunas bases", detail: "Hay temas que entiendo y otros que no." },
      { value: "alta", label: "Me siento seguro", detail: "Quiero retos y preguntas más exigentes." },
      { value: "no_seguro", label: "No estoy seguro", detail: "Prefiero descubrirlo practicando." },
    ],
  },
];

const DIALOGUE = [
  {
    speaker: "Founder",
    text: "¡Hey! Bienvenido a PeakScore. Antes de comenzar, quiero presentarme: soy el Founder, el creador de esta aventura. Construí PeakScore con una idea en mente: que prepararte para el ICFES sea mucho más que memorizar respuestas.",
  },
  {
    speaker: "Founder",
    text: "Aquí no tienes que llegar sabiéndolo todo. La idea es descubrir qué dominas, fortalecer lo que te cuesta y ayudarte a avanzar a tu ritmo. Tu punto de partida no define hasta dónde puedes llegar.",
  },
  {
    speaker: "Nova",
    text: "¡Y yo soy Nova! Voy a acompañarte mientras descubres tu ruta. Primero te haré unas preguntas cortas sobre tu experiencia y tus objetivos. No hay respuestas buenas o malas: responde con sinceridad y empezamos desde ahí.",
  },
];

const EMPTY_ANSWERS: Answers = {
  school_grade: "",
  icfes_experience: "",
  learning_goal: "",
  math_confidence: "",
};

export default function IntroExperience() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isStory = step < DIALOGUE.length;
  const question = step >= DIALOGUE.length ? QUESTIONS[step - DIALOGUE.length] : null;
  const story = isStory ? DIALOGUE[step] : null;
  const currentText = story?.text ?? question?.description ?? "";
  const activeSpeaker = story?.speaker ?? "Nova";

  useEffect(() => {
    setVisibleCharacters(0);
    if (reduceMotion) {
      setVisibleCharacters(currentText.length);
      return;
    }

    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setVisibleCharacters(current);
      if (current >= currentText.length) window.clearInterval(timer);
    }, 17);

    return () => window.clearInterval(timer);
  }, [currentText, reduceMotion]);

  const selectedValue = question ? answers[question.key] : "";
  const progress = useMemo(
    () => Math.min(100, Math.round(((step + 1) / (DIALOGUE.length + QUESTIONS.length)) * 100)),
    [step],
  );

  function choose(value: string) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.key]: value }));
    setError("");
  }

  async function finish(skip = false) {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skip ? { skip: true } : answers),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; success?: boolean }
        | null;

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "No pudimos guardar tus respuestas. Inténtalo otra vez.");
        return;
      }

      router.replace("/perfil/personaje");
      router.refresh();
    } catch {
      setError("No pudimos conectar con PeakScore. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (saving) return;
    if (step < DIALOGUE.length + QUESTIONS.length - 1) {
      if (question && !selectedValue) {
        setError("Elige una opción para continuar.");
        return;
      }
      setError("");
      setStep((current) => current + 1);
      return;
    }

    if (Object.values(answers).some((value) => !value)) {
      setError("Completa las respuestas para recomendarte un punto de partida.");
      return;
    }
    void finish();
  }

  function previous() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  const founderSrc = step === 0
    ? "/characters/intro/founder-saludo.gif"
    : "/characters/intro/founder-static.gif";

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="font-[var(--font-press-start)] text-[9px] leading-5 tracking-[.12em] text-violet-300">
              PEAKSCORE <span className="text-white/40">/ PRIMER ENCUENTRO</span>
            </p>
            <p className="mt-1 text-xs text-white/45">Tu aventura comienza conociéndote.</p>
          </div>
          <button
            type="button"
            onClick={() => void finish(true)}
            disabled={saving}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65 transition hover:border-white/35 hover:text-white disabled:opacity-50"
          >
            <SkipForward size={14} />
            Saltar intro
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0d]/95 shadow-[0_24px_100px_rgba(0,0,0,.5)]">
          <div className="h-1 w-full bg-white/10">
            <motion.div
              className="h-full bg-violet-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            />
          </div>

          <div className="grid min-h-[330px] grid-cols-2 items-end gap-1 px-3 pt-4 sm:min-h-[400px] sm:px-8 sm:pt-7 md:gap-8">
            <motion.div
              key={`nova-${step}`}
              initial={reduceMotion ? false : { opacity: 0.3, y: 10 }}
              animate={{ opacity: activeSpeaker === "Nova" ? 1 : 0.68, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              className="flex min-w-0 flex-col items-center justify-end"
            >
              <div className="flex h-[190px] w-full items-end justify-center sm:h-[245px]">
                <Image
                  src="/characters/intro/nova-static-intro.gif"
                  alt="Nova, la guía de PeakScore"
                  width={230}
                  height={260}
                  unoptimized
                  priority
                  className="h-auto max-h-full w-auto max-w-full object-contain [image-rendering:pixelated]"
                />
              </div>
              <span className={`mb-3 mt-2 rounded-md border px-2 py-1 font-[var(--font-press-start)] text-[8px] sm:text-[9px] ${activeSpeaker === "Nova" ? "border-violet-300/60 bg-violet-300/10 text-violet-200" : "border-white/10 text-white/40"}`}>
                NOVA
              </span>
            </motion.div>

            <motion.div
              key={`founder-${step}`}
              initial={reduceMotion ? false : { opacity: 0.3, y: 10 }}
              animate={{ opacity: activeSpeaker === "Founder" ? 1 : 0.68, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              className="flex min-w-0 flex-col items-center justify-end"
            >
              <div className="flex h-[190px] w-full items-end justify-center sm:h-[245px]">
                <Image
                  src={founderSrc}
                  alt="Founder, creador de PeakScore"
                  width={230}
                  height={260}
                  unoptimized
                  priority
                  className="h-auto max-h-full w-auto max-w-full object-contain [image-rendering:pixelated]"
                />
              </div>
              <span className={`mb-3 mt-2 rounded-md border px-2 py-1 font-[var(--font-press-start)] text-[8px] sm:text-[9px] ${activeSpeaker === "Founder" ? "border-amber-200/60 bg-amber-200/10 text-amber-100" : "border-white/10 text-white/40"}`}>
                FOUNDER
              </span>
            </motion.div>
          </div>

          <div className="border-t border-white/10 bg-[#101012] p-4 sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              >
                <p className="font-[var(--font-press-start)] text-[9px] uppercase tracking-[.08em] text-violet-200">
                  {isStory ? activeSpeaker : "TU RECORRIDO"}
                </p>
                <h1 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-2xl">
                  {question?.title ?? (step === 0 ? "Antes de empezar, déjame presentarme." : step === 1 ? "Esto apenas comienza." : "Conozcámonos un poco.")}
                </h1>
                <p className="mt-3 min-h-[68px] whitespace-pre-wrap text-sm leading-7 text-white/75 sm:min-h-[56px] sm:text-base">
                  {currentText.slice(0, visibleCharacters)}
                  {visibleCharacters < currentText.length && (
                    <span aria-hidden="true" className="ml-1 inline-block h-4 w-1 animate-pulse bg-violet-300 align-middle" />
                  )}
                </p>
              </motion.div>
            </AnimatePresence>

            {question && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const selected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(option.value)}
                      className={`min-h-[76px] rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${selected ? "border-violet-300 bg-violet-300/10" : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"}`}
                    >
                      <span className="block text-sm font-semibold text-white">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/45">{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={previous}
                disabled={step === 0 || saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/50 transition hover:text-white disabled:invisible"
              >
                <ChevronLeft size={16} />
                Atrás
              </button>
              <button
                type="button"
                onClick={next}
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-300 px-5 py-3 text-sm font-semibold text-[#17121f] transition hover:bg-violet-200 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {saving ? "Guardando..." : step === DIALOGUE.length + QUESTIONS.length - 1 ? "Guardar y continuar" : "Continuar"}
                {!saving && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </section>

        <p className="text-center text-[10px] leading-5 text-white/30">
          Tus respuestas nos ayudan a orientar tu preparación. Puedes saltar esta introducción y volver a ella después.
        </p>
      </div>
    </main>
  );
}

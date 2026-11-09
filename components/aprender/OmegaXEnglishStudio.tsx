"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, Check, ChevronDown, Headphones, Mic, RotateCcw,
  Volume2, X, Clock3, Languages, GraduationCap, PenLine, Target,
} from "lucide-react";

type Mode = "speaking" | "pronunciation" | "listening" | "reading" | "writing";
type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type Props = {
  onStartRoleplay: (prompt: string) => void;
  onSendForFeedback: (data: { mode: Mode; level: string; prompt: string; transcript: string; seconds: number }) => void;
  onSaveTranscript: (title: string, content: string) => Promise<boolean>;
};

const LEVELS: Record<CefrLevel, { name: string; summary: string; target: string }> = {
  A1: { name: "Principiante", summary: "Frases sencillas sobre ti, tu entorno y necesidades cotidianas.", target: "Presentarte, describir rutinas y responder preguntas simples." },
  A2: { name: "Básico", summary: "Intercambios cotidianos, descripciones breves y experiencias cercanas.", target: "Contar lo que haces, hiciste y planeas hacer." },
  B1: { name: "Intermedio", summary: "Experiencias, opiniones y explicaciones con ideas conectadas.", target: "Narrar, comparar y justificar tus opiniones." },
  B2: { name: "Intermedio alto", summary: "Conversaciones espontáneas, argumentos y matices.", target: "Defender una postura y responder contraargumentos." },
  C1: { name: "Avanzado", summary: "Comunicación flexible en contextos académicos y profesionales.", target: "Expresarte con precisión, cohesión y naturalidad." },
  C2: { name: "Dominio avanzado", summary: "Matices, intención implícita, estilo e idiomaticidad.", target: "Interpretar y expresar significados complejos con precisión." },
};

const SPEAKING_TOPICS: Record<CefrLevel, string[]> = {
  A1: [
    "Introduce yourself. Say where you study, what you like and one thing you do every day.",
    "Describe your classroom, the people in it and three objects you can see.",
    "Talk about your favourite food and explain when you usually eat it.",
  ],
  A2: [
    "Describe a place you visited and explain what you did there.",
    "Talk about your usual weekend and one activity you would like to try.",
    "Explain how you get to school and describe the places on your way.",
  ],
  B1: [
    "Describe a challenge you solved at school and explain what you learned.",
    "Compare studying alone with studying in a group. Which works better for you?",
    "Talk about an environmental problem in your community and suggest a solution.",
  ],
  B2: [
    "Should mobile phones be used in every lesson? Defend your view and address one counterargument.",
    "Compare online learning with classroom learning. Explain the trade-offs.",
    "How can technology change the future of work? Support your ideas with examples.",
  ],
  C1: [
    "Evaluate whether artificial intelligence should play a role in assessing students. Discuss benefits, risks and safeguards.",
    "How should societies balance economic growth with environmental sustainability?",
    "Assess the ethical tension between educational personalization and student privacy.",
  ],
  C2: [
    "Analyze how framing, irony and implied meaning can change the interpretation of a public argument.",
    "Discuss an ethical dilemma in which two defensible principles conflict.",
    "Evaluate the unintended consequences of a policy whose stated purpose is beneficial.",
  ],
};

const PRONUNCIATION_PHRASES: Record<CefrLevel, string[]> = {
  A1: ["I go to school every day.", "My favourite subject is science.", "There is a book on the table."],
  A2: ["I visited a new place with my family last weekend.", "Could you tell me how to get to the bus station?", "I am going to study English after school."],
  B1: ["Although the task was difficult, our group found a solution.", "I would rather practise every day than study only before an exam.", "The project was successful because everyone contributed."],
  B2: ["Despite the initial difficulties, the team managed to reach an agreement.", "What matters most is whether the evidence supports the conclusion.", "The proposal would be more effective if local communities were involved."],
  C1: ["Had the evidence been interpreted differently, the conclusion might have changed.", "The extent to which technology improves learning depends on how it is implemented.", "Notwithstanding its advantages, the policy raises questions about accountability."],
  C2: ["The remark was deliberately ambiguous, allowing it to convey approval and criticism simultaneously.", "Were the assumptions left unchallenged, the argument would appear more conclusive than it is.", "Far from resolving the dispute, the qualification exposed the disagreement beneath it."],
};

const ICFES_PARTS = [
  { part: 1, weight: "11%", title: "Conocimiento lexical", detail: "Relacionar cinco descripciones con siete palabras disponibles (A–G). Al final sobran dos opciones.", focus: "Vocabulario cotidiano, significado de palabras y reconocimiento de descripciones.", tip: "Identifica la idea clave de cada descripción y elimina palabras que no pertenecen a la categoría." },
  { part: 2, weight: "11%", title: "Conocimiento pragmático", detail: "Leer un aviso y escoger, entre tres lugares posibles, dónde podría aparecer.", focus: "Propósito comunicativo, destinatario, contexto y señales del entorno.", tip: "Observa qué pide o informa el aviso y piensa qué lugar necesitaría ese mensaje." },
  { part: 3, weight: "11%", title: "Conocimiento comunicativo", detail: "Completar conversaciones cortas escogiendo la intervención más pertinente entre tres opciones.", focus: "Funciones comunicativas, cortesía, solicitudes, respuestas y coherencia del diálogo.", tip: "La respuesta debe contestar lo que se dijo y sonar natural en esa situación." },
  { part: 4, weight: "18%", title: "Gramática en contexto", detail: "Completar espacios de un texto con la opción gramatical correcta entre tres alternativas.", focus: "Tiempos verbales, concordancia, pronombres, preposiciones y estructura.", tip: "Lee la oración completa y comprueba el sujeto, el tiempo y la función de la palabra." },
  { part: 5, weight: "16%", title: "Comprensión literal", detail: "Elegir, entre tres opciones, la paráfrasis que responde cada pregunta sobre un texto.", focus: "Información explícita, detalles, paráfrasis y referentes.", tip: "Localiza la evidencia exacta y busca la opción que expresa la misma idea con otras palabras." },
  { part: 6, weight: "11%", title: "Comprensión inferencial", detail: "Responder preguntas sobre la intención del autor y aspectos generales o particulares del texto. Cuatro opciones.", focus: "Inferencias, propósito, idea global, tono y pistas relacionadas.", tip: "Combina dos o más pistas del texto; no supongas datos que no aparecen." },
  { part: 7, weight: "22%", title: "Gramática y léxico en texto", detail: "Completar espacios de un texto eligiendo la palabra adecuada entre cuatro opciones.", focus: "Cohesión, colocaciones, conectores, gramática y vocabulario en contexto.", tip: "Lee antes y después del espacio para comprobar el sentido del texto completo." },
] as const;

const ICFES_SAMPLE = {
  1: {
    stem: "Match each description with one word. Use each word once. Two words are extra.",
    options: ["A. nurse", "B. firefighter", "C. librarian", "D. mechanic", "E. veterinarian", "F. baker", "G. dentist"],
    correct: 0,
    reason: "Relaciona cada descripción con la palabra que expresa la profesión. Se usan cinco palabras y quedan dos sin seleccionar.",
    descriptions: [
      "A person who takes care of sick people in a hospital.",
      "A person who puts out fires and rescues people from dangerous situations.",
      "Someone who works in a library and helps visitors find books.",
      "A person who repairs cars, engines and other vehicles.",
      "Someone who examines animals and treats them when they are ill.",
    ],
    correctIndices: [0, 1, 2, 3, 4],
    feedback: [
      "Nurse es quien cuida a pacientes en un hospital.",
      "Firefighter es quien combate incendios y rescata personas.",
      "Librarian trabaja en una biblioteca y orienta a los visitantes.",
      "Mechanic repara vehículos y sus motores.",
      "Veterinarian atiende la salud de los animales.",
    ],
  },
  2: {
    stem: "NOTICE: “VISITORS MUST USE THE MAIN ENTRANCE. STAFF ONLY BEYOND THIS POINT.” Where would you most likely see this notice?",
    options: ["A. At the entrance to a hospital or office building.", "B. On a menu in a restaurant.", "C. Inside a public swimming pool."],
    correct: 0,
    reason: "El aviso separa la entrada de visitantes de una zona exclusiva para personal. Por eso es probable encontrarlo en la entrada de un edificio con áreas restringidas.",
  },
  3: {
    stem: "A: “I'm sorry, I can't find the science laboratory.” B: “…”",
    options: ["A. It is on the second floor, next to the library.", "B. I usually have science on Monday.", "C. Yes, I found the experiment interesting."],
    correct: 0,
    reason: "La primera persona necesita una indicación para encontrar un lugar. La opción A responde directamente con una ubicación; las otras no resuelven la situación.",
  },
  4: {
    stem: "Every morning, Daniel ___ his lunch before he leaves home.",
    options: ["A. prepare", "B. prepares", "C. preparing"],
    correct: 1,
    reason: "Daniel es tercera persona singular. En presente simple, el verbo lleva -s: prepares. Las otras opciones no concuerdan con el sujeto.",
  },
  5: {
    stem: "Read: “The school library opens at 7:00 a.m. and closes at 4:30 p.m. Students may borrow two books for up to seven days. They must show their student card at the desk.” What must students show to borrow books?",
    options: ["A. Their student card.", "B. A note from a teacher.", "C. Their homework."],
    correct: 0,
    reason: "La respuesta aparece de forma explícita en la última oración: deben mostrar su carné estudiantil. No se necesita inferir información externa.",
  },
  6: {
    stem: "Read: “When Maya arrived at the station, the platform was almost empty. She checked the departure board twice and called her brother before sitting down.” What can be inferred about Maya?",
    options: ["A. She was checking that she had the correct travel information.", "B. She wanted to buy a new phone.", "C. She had decided not to travel.", "D. She was waiting for a school lesson to begin."],
    correct: 0,
    reason: "Revisar dos veces el tablero y llamar a su hermano sugieren que quería confirmar la información del viaje. Es una inferencia basada en varias pistas.",
  },
  7: {
    stem: "“The community garden has become popular ___ it gives neighbours a place to grow food and meet one another.”",
    options: ["A. unless", "B. although", "C. because", "D. meanwhile"],
    correct: 2,
    reason: "Because introduce la causa de la popularidad del jardín. Las otras opciones expresan condición, contraste o simultaneidad y no completan bien la relación.",
  },
} as const;

const CURRICULUM = [
  { title: "Bases del idioma", items: "Orden de palabras · sustantivos · artículos · pronombres · determinantes · plurales · contables y no contables · posesivos." },
  { title: "Tiempos verbales", items: "Present simple/continuous · past simple/continuous · present perfect · present perfect continuous · past perfect · futuros con will, going to y present continuous · future continuous y future perfect." },
  { title: "Verbos y estructuras", items: "Be, have y auxiliares do/did · modales · imperativos · gerundios e infinitivos · phrasal verbs · voz pasiva · causativas · estilo indirecto · preguntas directas e indirectas · question tags." },
  { title: "Oraciones complejas", items: "Comparativos y superlativos · relativas · subordinadas · condicionales zero/first/second/third/mixed · wish/if only · concordancia · elipsis · formación de palabras." },
  { title: "Conectores y cohesión", items: "Adición: also, moreover · contraste: although, however, whereas, despite · causa: because, since · resultado: therefore, consequently · secuencia: first, meanwhile, finally · propósito: so that · reformulación: in other words." },
  { title: "Vocabulario y comunicación", items: "Identidad · familia · rutinas · estudio · trabajo · ciudad · transporte · viajes · salud · alimentación · tecnología · cultura · ciudadanía · medioambiente · ciencia · colocaciones · falsos cognados · registro formal e informal." },
  { title: "Pronunciación y fluidez", items: "Vocales y consonantes · pares mínimos · terminaciones -s/-es y -ed · grupos consonánticos · sílaba tónica · ritmo · linking · reducción · pausas · entonación y acento de frase." },
  { title: "Habilidades", items: "Speaking: interacción, fluidez, coherencia y precisión. Listening: idea general, detalle, propósito e inferencia. Reading: localizar, relacionar y evaluar información. Writing: párrafos, correos, argumentos, cohesión y revisión." },
];

function buildLivePracticePrompt(level: CefrLevel, skill: "speaking" | "pronunciation", task: string) {
  const levelInfo = LEVELS[level];
  const pronunciationRules = [
    "MODO PRONUNCIATION COACH: esto es una práctica de pronunciación en una llamada de audio bidireccional. Di primero la frase modelo con pronunciación natural, velocidad clara y pausas útiles. Después invita al estudiante a repetirla por el micrófono.",
    "Escucha la señal acústica original, no juzgues a partir de una transcripción. Valora inteligibilidad, sonidos que realmente distingas, acento de palabra, ritmo y entonación. Distingue un error que cambia el significado de una variante de acento válida.",
    "Cuando tengas evidencia suficiente, entrega una estimación pedagógica de 0 a 100 para esa repetición, identificada explícitamente como estimación orientativa y no como certificación. Acompaña el número con confianza alta/media/baja y máximo dos razones audibles. Si no hay audio suficiente, no inventes nota: di que no se pudo evaluar.",
    "Señala el fragmento concreto, explica en español colombiano qué ajustar (posición de lengua/labios, duración, sílaba tónica o enlace), pronuncia el modelo correcto y deja que el estudiante repita de inmediato. Compara el nuevo intento con el anterior.",
    "No uses el reconocimiento de palabras como porcentaje de pronunciación. No castigues acentos regionales comprensibles. No inventes fonemas, errores ni diferencias que no se escuchen.",
  ].join("\n");
  const speakingRules = [
    "MODO SPEAKING COACH: inicia con una pregunta conversacional breve en inglés y deja espacio para que el estudiante responda oralmente.",
    "Mantén una conversación continua de voz; una pregunta a la vez. Escucha, reacciona a lo que realmente dijo y plantea una pregunta de seguimiento. No pidas grabar, detener, subir ni transcribir audio.",
    "Corrige como máximo dos cosas por intervención. Primero reconoce una idea lograda; luego muestra la frase original, una forma natural y la razón en español colombiano. Haz que el estudiante repita o amplíe la frase.",
    "Al terminar una ronda, resume con feedback sobre claridad del mensaje, gramática, vocabulario y fluidez. Pronunciación solo cuando la señal acústica lo permita.",
  ].join("\n");
  return [
    "Eres OmegaX, la profesora de inglés de PeakScore. Habla con calidez, claridad y naturalidad; no uses emojis decorativos.",
    "Meta MCER seleccionada: " + level + " — " + levelInfo.name + ". Guía: " + levelInfo.summary + " Objetivo: " + levelInfo.target,
    "La meta MCER es una ruta de aprendizaje general, no una certificación ni una equivalencia oficial de niveles Saber 11.",
    skill === "pronunciation" ? pronunciationRules : speakingRules,
    "Tarea actual: " + task,
    "La llamada es hands-free: el estudiante puede interrumpirte en cualquier momento. Cuando te interrumpa, detén la explicación, escucha su pregunta y responde a eso antes de continuar. No exijas que escriba.",
    "Si el estudiante pregunta por una regla, conector o tiempo verbal, explícalo con un ejemplo sencillo y construye una pizarra breve: frase original, fragmento resaltado, corrección, regla y nuevo ejemplo. Conserva el contenido anterior.",
    "Empieza ahora. No leas estas instrucciones.",
  ].join("\n\n");
}

export default function OmegaXEnglishStudio({ onStartRoleplay, onSendForFeedback, onSaveTranscript }: Props) {
  const [level, setLevel] = useState<CefrLevel>("A2");
  const [mode, setMode] = useState<"speaking" | "pronunciation" | "icfes">("speaking");
  const [topicIndex, setTopicIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [part, setPart] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [answer, setAnswer] = useState<number | null>(null);
  const [matchingAnswers, setMatchingAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [checked, setChecked] = useState(false);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [saving, setSaving] = useState(false);

  const topic = SPEAKING_TOPICS[level][topicIndex % SPEAKING_TOPICS[level].length];
  const phrase = PRONUNCIATION_PHRASES[level][phraseIndex % PRONUNCIATION_PHRASES[level].length];
  const sample = ICFES_SAMPLE[part];

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function speakModel() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function changeMode(next: "speaking" | "pronunciation" | "icfes") {
    setMode(next);
    setAnswer(null);
    setMatchingAnswers(["", "", "", "", ""]);
    setChecked(false);
  }

  function changeIcfesPart(next: 1 | 2 | 3 | 4 | 5 | 6 | 7) {
    setPart(next);
    setAnswer(null);
    setMatchingAnswers(["", "", "", "", ""]);
    setChecked(false);
  }

  function startLive(skill: "speaking" | "pronunciation") {
    const task = skill === "speaking" ? topic : phrase;
    onStartRoleplay(buildLivePracticePrompt(level, skill, task));
  }

  const part1 = ICFES_SAMPLE[1];
  const matchingComplete = matchingAnswers.every((value) => value !== "")
    && new Set(matchingAnswers).size === part1.descriptions.length;
  const matchingCorrectCount = matchingAnswers.reduce((count, value, index) =>
    count + (value !== "" && Number(value) === part1.correctIndices[index] ? 1 : 0), 0);

  function checkIcfesAnswer() {
    const labels = ["A", "B", "C", "D", "E", "F", "G"];
    if (part === 1) {
      if (!matchingComplete) return;
      setChecked(true);
      const selected = matchingAnswers.map((value) => labels[Number(value)]);
      const correct = part1.correctIndices.map((value) => labels[value]);
      const context = [
        "English Studio · práctica original tipo Saber 11 · Parte 1 · conocimiento lexical.",
        "Instrucción: relaciona cinco descripciones con siete palabras; cada palabra se usa una sola vez y sobran dos.",
        ...part1.descriptions.map((description, index) =>
          (index + 1) + ". " + description + " | Respuesta: " + selected[index] + " | Correcta: " + correct[index] + " | " + part1.feedback[index]),
        "Explica cada acierto/error con lenguaje cercano en español colombiano. No conviertas el MCER A1–C2 en una clasificación ICFES.",
      ].join("\n");
      onSendForFeedback({ mode: "reading", level, prompt: context, transcript: selected.join(", "), seconds: 0 });
      return;
    }

    if (answer === null) return;
    setChecked(true);
    const selected = labels[answer];
    const correct = labels[sample.correct];
    const context = [
      "English Studio · práctica original tipo Saber 11 · Parte " + part + " (" + ICFES_PARTS[part - 1].title + ")",
      "Consigna: " + sample.stem,
      "Opciones: " + sample.options.join(" | "),
      "Respuesta del estudiante: " + selected,
      "Respuesta correcta: " + correct,
      "Justificación: " + sample.reason,
      "Explica brevemente por qué la correcta funciona y qué pista descarta cada distractor. Usa español colombiano cercano.",
    ].join("\n");
    onSendForFeedback({ mode: "reading", level, prompt: context, transcript: selected, seconds: 0 });
  }

  async function saveIcfesResult() {
    setSaving(true);
    try {
      const labels = ["A", "B", "C", "D", "E", "F", "G"];
      const content = part === 1
        ? [
          "Parte 1 · Conocimiento lexical",
          "Instrucción: cinco descripciones, siete palabras; dos opciones sobran.",
          ...part1.descriptions.map((description, index) =>
            (index + 1) + ". " + description + " | Mi respuesta: "
            + (matchingAnswers[index] === "" ? "Sin responder" : labels[Number(matchingAnswers[index])])
            + " | Correcta: " + labels[part1.correctIndices[index]]
            + " | " + part1.feedback[index]),
          "Aciertos: " + matchingCorrectCount + " de 5",
        ].join("\n")
        : [
          sample.stem,
          ...sample.options,
          "Mi respuesta: " + (answer === null ? "Sin responder" : labels[answer]),
          "Respuesta correcta: " + labels[sample.correct],
          "Resultado: " + (answer === sample.correct ? "Correcta" : "Por repasar"),
          sample.reason,
        ].join("\n");
      await onSaveTranscript("English Studio · Saber 11 · Parte " + part, content);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 text-[#25231f] sm:px-7 sm:pt-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#eee8df] pb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c95725]">PeakScore · espacio de estudio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#1f1e1b] sm:text-[40px]">English Studio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777168]">Aprende inglés con práctica guiada, retroalimentación clara y una ruta especial para Saber 11.</p>
        </div>
        {mode !== "icfes" ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#eee6dc] bg-white px-3 py-2 text-xs text-[#6f6a62]">
            <Languages className="h-4 w-4 text-[#c95725]" />
            <label htmlFor="english-level" className="font-medium">Mi meta</label>
            <select id="english-level" value={level} onChange={(event) => { setLevel(event.target.value as CefrLevel); setTopicIndex(0); setPhraseIndex(0); }} className="max-w-[170px] rounded-lg border-0 bg-transparent py-1 pr-5 text-xs font-semibold text-[#282620] outline-none focus:ring-2 focus:ring-orange-200">
              {Object.entries(LEVELS).map(([value, meta]) => <option key={value} value={value}>{value} · {meta.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="rounded-xl border border-[#eee6dc] bg-white px-3 py-2 text-xs text-[#6f6a62]">
            <span className="block font-semibold text-[#302d27]">Desempeño en la guía 2026-2</span>
            <span className="mt-1 block text-[11px] text-[#8a8278]">Pre-A1 · A1 · A2 · B1</span>
          </div>
        )}
      </header>

      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[24px] border border-[#f1dfd0] bg-[linear-gradient(120deg,#fff8f1_0%,#fffdfa_56%,#fff4e9_100%)] p-5 sm:p-7">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b94e21]"><Target className="h-4 w-4" /> Tu siguiente paso</div>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-[-.035em] sm:text-[30px]">{mode === "icfes" ? "Lee, interpreta y usa el inglés." : "Habla con confianza. Mejora en cada intento."}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#716b61]">{mode === "icfes" ? "Entrena las siete partes de la prueba con ejercicios originales y aprende qué pista buscar antes de elegir." : LEVELS[level].summary + " OmegaX adapta el diálogo, las correcciones y los ejemplos a tu objetivo."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {mode === "icfes" ? (
              <>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">Saber 11 · 2026-2</span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">Lectura y uso de la lengua</span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">Ejercicios originales</span>
              </>
            ) : (
              <>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">{level} · {LEVELS[level].name}</span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">Práctica de voz en vivo</span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#6a5546]">Una habilidad a la vez</span>
              </>
            )}
          </div>
        </div>
        <aside className="flex flex-col justify-between rounded-[24px] border border-[#eee8df] bg-white p-5">
          {mode === "icfes" ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999187]">Niveles de desempeño de la guía</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#282620]">Pre-A1, A1, A2 y B1. Esta escala de desempeño no es la misma ruta didáctica MCER A1–C2 que usamos para hablar y pronunciar.</p>
              <div className="mt-4 grid grid-cols-4 gap-1">
                {["Pre-A1", "A1", "A2", "B1"].map((item) => <span key={item} className="rounded-md bg-[#f3f0eb] py-2 text-center text-[10px] font-bold text-[#71695f]">{item}</span>)}
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#999187]">Objetivo del nivel</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#282620]">{LEVELS[level].target}</p>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-[10px] text-[#8f887e]"><span>Ruta de aprendizaje general</span><span>A1 → C2</span></div>
                <div className="grid grid-cols-6 gap-1">
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((item) => <span key={item} className={"rounded-md py-1.5 text-center text-[10px] font-bold " + (item === level ? "bg-[#e95716] text-white" : "bg-[#f3f0eb] text-[#8a837a]")}>{item}</span>)}
                </div>
              </div>
            </>
          )}
        </aside>
      </section>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Rutas de práctica de inglés">
        <button type="button" onClick={() => changeMode("speaking")} aria-pressed={mode === "speaking"} className={"inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition " + (mode === "speaking" ? "bg-[#e95716] text-white shadow-sm" : "border border-[#e9e2d8] bg-white text-[#6d675e] hover:border-orange-200 hover:text-[#b84e20]")}><Mic className="h-4 w-4" /> Speaking</button>
        <button type="button" onClick={() => changeMode("pronunciation")} aria-pressed={mode === "pronunciation"} className={"inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition " + (mode === "pronunciation" ? "bg-[#e95716] text-white shadow-sm" : "border border-[#e9e2d8] bg-white text-[#6d675e] hover:border-orange-200 hover:text-[#b84e20]")}><Volume2 className="h-4 w-4" /> Pronunciation</button>
        <button type="button" onClick={() => changeMode("icfes")} aria-pressed={mode === "icfes"} className={"inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition " + (mode === "icfes" ? "bg-[#e95716] text-white shadow-sm" : "border border-[#e9e2d8] bg-white text-[#6d675e] hover:border-orange-200 hover:text-[#b84e20]")}><GraduationCap className="h-4 w-4" /> Saber 11</button>
      </nav>

      {mode === "speaking" && (
        <section className="overflow-hidden rounded-[24px] border border-[#eee7de] bg-white shadow-[0_10px_35px_rgba(44,35,24,.035)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#ba4d20]"><Mic className="h-4 w-4" /> Reto de conversación · 1 pregunta a la vez</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em] text-[#25231f]">Let’s talk about it.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#777168]">Responde con tu voz. OmegaX seguirá la conversación, te hará preguntas y corregirá lo que más te ayude a avanzar.</p>
              <div className="mt-5 rounded-2xl bg-[#fff8f1] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#aa4c25]">Tema de hoy</span><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#82796e]">{level}</span></div>
                <p className="mt-3 text-lg font-semibold leading-7 text-[#282620]">{topic}</p>
                <button type="button" onClick={() => setTopicIndex((value) => (value + 1) % SPEAKING_TOPICS[level].length)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#b34c20] hover:text-[#913b18]"><RotateCcw className="h-3.5 w-3.5" /> Cambiar tema</button>
              </div>
              <button type="button" onClick={() => startLive("speaking")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f58216] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e66f0b] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 sm:w-auto"><Mic className="h-4 w-4" /> Iniciar conversación en vivo <ArrowRight className="h-4 w-4" /></button>
              <p className="mt-2 text-[11px] leading-5 text-[#8c857b]">No necesitas grabar ni enviar una transcripción. Habla con OmegaX y puedes interrumpirla cuando quieras.</p>
            </div>
            <aside className="rounded-2xl border border-[#f0e9df] bg-[#fffdfa] p-5">
              <p className="text-xs font-semibold text-[#302d27]">Así será tu práctica</p>
              <ol className="mt-4 space-y-4">
                {[
                  ["01", "Hablas", "Responde con tus propias palabras."],
                  ["02", "Recibes feedback", "Una fortaleza y hasta dos mejoras útiles."],
                  ["03", "Lo intentas de nuevo", "Aplica la corrección en otra respuesta."],
                ].map(([number, title, detail]) => <li key={number} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff0e5] text-[10px] font-bold text-[#b94f21]">{number}</span><span><strong className="block text-xs text-[#302d27]">{title}</strong><span className="mt-1 block text-[11px] leading-5 text-[#817a70]">{detail}</span></span></li>)}
              </ol>
            </aside>
          </div>
        </section>
      )}

      {mode === "pronunciation" && (
        <section className="overflow-hidden rounded-[24px] border border-[#eee7de] bg-white shadow-[0_10px_35px_rgba(44,35,24,.035)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#ba4d20]"><Headphones className="h-4 w-4" /> Entrenamiento de pronunciación</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em] text-[#25231f]">Listen. Repeat. Improve.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#777168]">Primero escucha el modelo. Después repite la frase en voz alta y recibe una corrección sobre los sonidos que OmegaX pueda escuchar.</p>
              <div className="mt-5 rounded-2xl bg-[#fff8f1] p-5">
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#aa4c25]">Tu frase de práctica</span>
                <p className="mt-3 text-xl font-semibold leading-8 text-[#282620]">{phrase}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={speakModel} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#eadbc9] bg-white px-3.5 text-xs font-semibold text-[#744b35] hover:border-orange-200"><Volume2 className="h-4 w-4" /> Escuchar modelo</button>
                  <button type="button" onClick={() => setPhraseIndex((value) => (value + 1) % PRONUNCIATION_PHRASES[level].length)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#eadbc9] bg-white px-3.5 text-xs font-semibold text-[#744b35] hover:border-orange-200"><RotateCcw className="h-4 w-4" /> Otra frase</button>
                </div>
              </div>
              <button type="button" onClick={() => startLive("pronunciation")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f58216] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e66f0b] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 sm:w-auto"><Mic className="h-4 w-4" /> Practicar con OmegaX <ArrowRight className="h-4 w-4" /></button>
              <p className="mt-2 text-[11px] leading-5 text-[#8c857b]">La evaluación se basa en el audio de tu llamada, no en la coincidencia de palabras de una transcripción.</p>
            </div>
            <aside className="rounded-2xl border border-[#f0e9df] bg-[#fffdfa] p-5">
              <p className="text-xs font-semibold text-[#302d27]">Qué recibirás</p>
              <div className="mt-4 space-y-3 text-xs text-[#736d63]">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2b8c63]" /> Pronunciación orientativa y confianza</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2b8c63]" /> Sonido o sílaba que debes ajustar</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2b8c63]" /> Modelo correcto pronunciado en voz</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2b8c63]" /> Segundo intento para comparar</div>
              </div>
              <p className="mt-4 rounded-xl bg-[#f5f2ed] p-3 text-[10px] leading-5 text-[#7c756a]">El porcentaje es una estimación pedagógica cuando hay audio suficiente; no es una certificación fonética ni un resultado oficial.</p>
            </aside>
          </div>
        </section>
      )}

      {mode === "icfes" && (
        <section className="overflow-hidden rounded-[24px] border border-[#eee7de] bg-white shadow-[0_10px_35px_rgba(44,35,24,.035)]">
          <div className="border-b border-[#eee8df] px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#ba4d20]"><GraduationCap className="h-4 w-4" /> Ruta Saber 11</div>
              <span className="rounded-full bg-[#f5f2ed] px-3 py-1 text-[10px] font-semibold text-[#746e65]">7 partes · 100% de la prueba</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em] text-[#25231f]">Practica como te van a evaluar.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777168]">La prueba de Inglés Saber 11 evalúa lectura y uso de la lengua. Aquí encontrarás una muestra original por parte para aprender la estrategia antes de responder.</p>
          </div>
          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,.95fr)]">
            <div>
              <div className="grid grid-cols-7 gap-1.5">
                {ICFES_PARTS.map((item) => <button key={item.part} type="button" onClick={() => changeIcfesPart(item.part)} aria-pressed={part === item.part} className={"rounded-lg py-2 text-xs font-bold transition " + (part === item.part ? "bg-[#e95716] text-white" : "bg-[#f3f0eb] text-[#70695e] hover:bg-[#f8e5d8]")}>P{item.part}</button>)}
              </div>
              <div className="mt-5 rounded-2xl bg-[#fff8f1] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a94c25]">Parte {part} · {ICFES_PARTS[part - 1].title}</span><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#8a4c2d]">{ICFES_PARTS[part - 1].weight}</span></div>
                {part === 1 ? (
                  <>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#292720]">{part1.stem}</p>
                    <div className="mt-4 rounded-xl border border-[#eee1d4] bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9b6a4e]">Palabras disponibles · A–G</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {part1.options.map((option) => <span key={option} className="rounded-lg bg-[#f7f2ec] px-2.5 py-1.5 text-[11px] font-medium text-[#51483f]">{option}</span>)}
                      </div>
                      <p className="mt-2 text-[10px] text-[#8d8479]">Debes usar cinco palabras una sola vez. Dos quedan sin utilizar.</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {part1.descriptions.map((description, index) => (
                        <label key={index} className="grid gap-2 rounded-xl border border-[#e9e1d7] bg-white/75 p-3 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-center">
                          <span className="text-xs leading-5 text-[#4d4941]"><strong className="mr-2 text-[#aa4c25]">{index + 1}.</strong>{description}</span>
                          <select
                            aria-label={"Respuesta de la descripción " + (index + 1)}
                            value={matchingAnswers[index]}
                            disabled={checked}
                            onChange={(event) => {
                              const next = [...matchingAnswers];
                              next[index] = event.target.value;
                              setMatchingAnswers(next);
                            }}
                            className="min-h-10 rounded-lg border border-[#e9e1d7] bg-white px-3 text-xs font-semibold text-[#413a32] outline-none focus:border-[#d65a27]"
                          >
                            <option value="">Elige A–G</option>
                            {part1.options.map((option, optionIndex) => {
                              const usedElsewhere = matchingAnswers.some((value, answerIndex) => answerIndex !== index && value === String(optionIndex));
                              return <option key={option} value={String(optionIndex)} disabled={usedElsewhere}>{option}</option>;
                            })}
                          </select>
                        </label>
                      ))}
                    </div>
                    {!checked ? (
                      <button type="button" onClick={checkIcfesAnswer} disabled={!matchingComplete} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e95716] px-4 text-xs font-bold text-white transition hover:bg-[#ca4a12] disabled:cursor-not-allowed disabled:opacity-40">Comprobar las cinco respuestas <ArrowRight className="h-4 w-4" /></button>
                    ) : (
                      <div className="mt-4 rounded-xl border border-[#d6e9dd] bg-[#f4fbf6] p-4">
                        <p className="text-xs font-bold text-[#246b47]">{matchingCorrectCount} de 5 relaciones correctas</p>
                        <div className="mt-3 space-y-2">
                          {part1.descriptions.map((description, index) => <p key={index} className="text-xs leading-5 text-[#4c6254]"><strong>{index + 1}. {part1.options[part1.correctIndices[index]].slice(0, 1)}</strong> · {part1.feedback[index]}</p>)}
                        </div>
                        <button type="button" onClick={() => void saveIcfesResult()} disabled={saving} className="mt-3 text-xs font-semibold text-[#246b47] underline underline-offset-2 disabled:opacity-50">{saving ? "Guardando…" : "Guardar este resultado"}</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#292720]">{sample.stem}</p>
                    <div className="mt-4 space-y-2">
                      {sample.options.map((option, index) => <button key={option} type="button" onClick={() => { setAnswer(index); setChecked(false); }} className={"flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition " + (answer === index ? "border-[#dc7a45] bg-white text-[#6e371d]" : "border-[#e9e1d7] bg-white/65 text-[#4d4941] hover:border-[#dfb59e]")}>
                        <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (answer === index ? "bg-[#e95716] text-white" : "bg-[#f1ece5] text-[#766e63]")}>{String.fromCharCode(65 + index)}</span>
                        {option.replace(/^[A-D]\.\s*/, "")}
                      </button>)}
                    </div>
                    {!checked ? (
                      <button type="button" onClick={checkIcfesAnswer} disabled={answer === null} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e95716] px-4 text-xs font-bold text-white transition hover:bg-[#ca4a12] disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button>
                    ) : (
                      <div className="mt-4 rounded-xl border border-[#d6e9dd] bg-[#f4fbf6] p-4">
                        <p className="text-xs font-bold text-[#246b47]">{answer === sample.correct ? "¡Correcto!" : "Vamos a corregirlo."} · Respuesta {String.fromCharCode(65 + sample.correct)}</p>
                        <p className="mt-2 text-xs leading-5 text-[#4c6254]">{sample.reason}</p>
                        <button type="button" onClick={() => void saveIcfesResult()} disabled={saving} className="mt-3 text-xs font-semibold text-[#246b47] underline underline-offset-2 disabled:opacity-50">{saving ? "Guardando…" : "Guardar este resultado"}</button>
                      </div>
                    )}
                  </>
                )}
              </div>              </div>
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#eee8df] p-5">
                <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-[#302d27]">{ICFES_PARTS[part - 1].title}</p><span className="text-[10px] font-bold text-[#b64c20]">{ICFES_PARTS[part - 1].weight}</span></div>
                <p className="mt-2 text-xs leading-5 text-[#777168]">{ICFES_PARTS[part - 1].detail}</p>
                <div className="mt-4 border-t border-[#eee8df] pt-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a9185]">Qué necesitas dominar</p><p className="mt-2 text-xs leading-5 text-[#5f594f]">{ICFES_PARTS[part - 1].focus}</p></div>
                <div className="mt-4 rounded-xl bg-[#fff8f1] p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a94c25]">Estrategia</p><p className="mt-1 text-xs leading-5 text-[#6c5546]">{ICFES_PARTS[part - 1].tip}</p></div>
              </div>
              <p className="px-1 text-[10px] leading-5 text-[#8c857b]">Las ponderaciones corresponden a la Guía de orientación Saber 11, 2026-2. Los ejercicios de esta pantalla son originales de práctica, no preguntas oficiales ni copias del material del Icfes.</p>
            </aside>
          </div>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-[20px] border border-[#eee8df] bg-white">
        <button type="button" onClick={() => setShowCurriculum((value) => !value)} aria-expanded={showCurriculum} className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left sm:px-6">
          <span><span className="block text-xs font-semibold text-[#302d27]">Mapa completo de aprendizaje</span><span className="mt-1 block text-[11px] text-[#8b8479]">Gramática, tiempos, conectores, vocabulario y habilidades A1–C2</span></span>
          <ChevronDown className={"h-4 w-4 shrink-0 text-[#8c857b] transition " + (showCurriculum ? "rotate-180" : "")} />
        </button>
        {showCurriculum && <div className="grid gap-3 border-t border-[#eee8df] bg-[#fffdfa] p-4 sm:grid-cols-2 sm:p-5">
          {CURRICULUM.map((item) => <article key={item.title} className="rounded-xl border border-[#eee8df] bg-white p-4"><h3 className="text-xs font-semibold text-[#302d27]">{item.title}</h3><p className="mt-2 text-[11px] leading-5 text-[#777168]">{item.items}</p></article>)}
        </div>}
      </section>

      <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8df] pt-4 text-[10px] text-[#928b81]">
        <span>English Studio · práctica guiada sin saturar la pantalla.</span>
        <span>MCER general y Saber 11 son rutas distintas.</span>
      </footer>
    </main>
  );
}

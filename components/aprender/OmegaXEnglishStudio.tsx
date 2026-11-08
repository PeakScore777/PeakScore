"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, BookOpen, Headphones, LoaderCircle, Mic, Play, Save, Square, Volume2 } from "lucide-react";

type Mode = "speaking" | "pronunciation";
type Props = {
  onStartRoleplay: (prompt: string) => void;
  onSendForFeedback: (data: { mode: Mode; level: string; prompt: string; transcript: string; seconds: number }) => void;
  onSaveTranscript: (title: string, content: string) => Promise<boolean>;
};

const TOPICS_BY_LEVEL: Record<CefrLevel, string[]> = {
  A1: [
    "Introduce yourself. Say where you study, what you like and one thing you do every day.",
    "Describe your classroom using simple words for people, objects and colours.",
    "Talk about your favourite food and say when you usually eat it.",
    "Describe your daily routine using simple present verbs and times.",
  ],
  A2: [
    "Describe a place you visited and explain what you did there.",
    "Talk about your usual weekend and one activity you would like to try.",
    "Explain how you get to school and describe places on the way.",
    "Describe a plan for your next holiday and give two reasons for it.",
  ],
  B1: [
    "Describe a challenge you solved at school and explain what you learned.",
    "Compare studying alone with studying in a group. Which works better for you?",
    "Talk about an environmental problem in your community and suggest a solution.",
    "Describe a skill you would like to develop and explain how you would practise it.",
  ],
  B2: [
    "Should mobile phones be used in every lesson? Defend your view and address one counterargument.",
    "Discuss the advantages and disadvantages of online learning compared with classroom learning.",
    "How can technology change the future of work? Support your ideas with examples.",
    "Should cities prioritize public transport over private cars? Explain the trade-offs.",
  ],
  C1: [
    "Evaluate whether artificial intelligence should play a role in assessing students. Discuss benefits, risks and safeguards.",
    "How should societies balance economic growth with environmental sustainability? Defend a nuanced position.",
    "Discuss how digital platforms influence cultural identity and public debate.",
    "Assess the ethical tension between educational personalization and the collection of student data.",
  ],
  C2: [
    "Analyze how framing, irony and implied meaning can change the interpretation of a public argument.",
    "Discuss an ethical dilemma in which two defensible principles conflict; qualify your position and its limits.",
    "Evaluate the unintended consequences of a policy whose stated purpose is broadly beneficial.",
    "Explain how tone, register and cultural assumptions affect whether a translation preserves the force of an original text.",
  ],
};

const PHRASES_BY_LEVEL: Record<CefrLevel, string[]> = {
  A1: [
    "I go to school every day.",
    "My favourite subject is science.",
    "I usually have breakfast at home.",
    "There is a book on the table.",
  ],
  A2: [
    "I visited a new place with my family last weekend.",
    "Could you tell me how to get to the bus station?",
    "I am going to study English after school.",
    "There were fewer people at the museum than I expected.",
  ],
  B1: [
    "Although the task was difficult, our group found a solution.",
    "I would rather practise every day than study only before an exam.",
    "The project was successful because everyone contributed.",
    "If I had more time, I would join an environmental project.",
  ],
  B2: [
    "Despite the initial difficulties, the team managed to reach an agreement.",
    "What matters most is whether the evidence supports the conclusion.",
    "The proposal would be more effective if local communities were involved.",
    "Having considered both perspectives, I still favour the second option.",
  ],
  C1: [
    "Had the evidence been interpreted differently, the conclusion might have changed.",
    "The extent to which technology improves learning depends on how it is implemented.",
    "Notwithstanding its advantages, the policy raises questions about accountability.",
    "What distinguishes a persuasive argument is the careful handling of counterevidence.",
  ],
  C2: [
    "The remark was deliberately ambiguous, allowing it to convey approval and criticism simultaneously.",
    "Were the assumptions left unchallenged, the argument would appear more conclusive than it is.",
    "The translation preserves the literal meaning while subtly altering the speaker's tone.",
    "Far from resolving the dispute, the qualification exposed the disagreement beneath it.",
  ],
};

const ROLEPLAYS = [
  ["At a café", "You are ordering breakfast. Ask about the menu, prices and ingredients. You are the customer; OmegaX is the barista."],
  ["At the airport", "You are checking in for an international flight. Ask about your seat, baggage and boarding time."],
  ["Job interview", "You are applying for your first part-time job. Answer questions about your strengths, studies and availability."],
  ["Meeting someone", "You have just met a student from another country. Introduce yourself and find something you have in common."],
  ["Giving directions", "A visitor is lost in your city. Explain how to reach a museum, a bus station and a restaurant."],
];
type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const CEFR_LEVEL_GUIDANCE: Record<CefrLevel, { label: string; descriptor: string; coaching: string }> = {
  A1: {
    label: "Principiante",
    descriptor: "Comprende y usa frases muy sencillas sobre datos personales y necesidades inmediatas.",
    coaching: "Usa frases cortas, vocabulario cotidiano y estructuras frecuentes. Habla despacio, formula una sola pregunta concreta y ofrece un modelo breve si se bloquea. Acepta respuestas simples antes de pedir ampliación.",
  },
  A2: {
    label: "Básico",
    descriptor: "Se comunica en intercambios cotidianos y describe aspectos sencillos de su entorno.",
    coaching: "Usa situaciones familiares, presente y pasado básicos, preguntas directas y conectores frecuentes. Pide dos o tres frases y ayuda a ampliar respuestas sin subir bruscamente la dificultad.",
  },
  B1: {
    label: "Intermedio",
    descriptor: "Explica experiencias, planes y opiniones con un discurso sencillo y conectado.",
    coaching: "Invita a narrar experiencias, explicar razones y justificar opiniones. Trabaja conectores, tiempos narrativos y organización de ideas; permite que el estudiante se autocorrija.",
  },
  B2: {
    label: "Intermedio alto",
    descriptor: "Sostiene argumentos y comprende textos o conversaciones de cierta complejidad.",
    coaching: "Pide argumentos desarrollados, ejemplos, matices y respuestas espontáneas. Trabaja collocations, precisión gramatical, contraargumentos y registro; no simplifiques en exceso.",
  },
  C1: {
    label: "Avanzado",
    descriptor: "Se expresa con flexibilidad y eficacia en contextos académicos, sociales y profesionales.",
    coaching: "Exige precisión, fluidez discursiva, cohesión, reformulación y adaptación de registro. Señala matices léxicos y estructuras complejas sin interrumpir cada idea.",
  },
  C2: {
    label: "Dominio avanzado",
    descriptor: "Comprende prácticamente todo tipo de discurso y expresa matices con precisión y naturalidad.",
    coaching: "Trabaja significados implícitos, matices semánticos, ironía, tono, estilo, idiomaticidad y reformulación precisa. Propón debates y síntesis complejas; evita convertir C2 en una lista de palabras raras.",
  },
};

function buildRoleplayPrompt(level: CefrLevel, situation: string): string {
  const profile = CEFR_LEVEL_GUIDANCE[level];
  return [
    "Actúa como el coach conversacional de inglés de OmegaX en PeakScore, inspirado en una práctica de habla breve, feedback accionable y repetición enfocada.",
    "Nivel objetivo CEFR elegido por el estudiante: " + level + " (" + profile.label + "). " + profile.coaching,
    "Objetivo de la sesión: que el estudiante hable más, reciba una corrección útil y vuelva a intentarlo. No afirmes certificar su nivel a partir de una sola conversación.",
    situation,
    "Mantén la conversación principalmente en inglés, una pregunta por turno. Después de cada respuesta, elige como máximo dos correcciones de mayor impacto: muestra lo que dijo, una versión natural y una explicación breve en español colombiano; después continúa el diálogo.",
    "Si el estudiante pide explicar gramática, vocabulario o una diferencia entre expresiones, cambia temporalmente a modo profesora: explica con un ejemplo sencillo y construye en la pizarra una estructura, una línea de tiempo verbal, una tabla de contraste o un mapa de vocabulario cuando ayude. Conserva los elementos anteriores y señala la pieza que explicas; no dibujes por decorar.",
    "Ajusta la complejidad de ejemplos y preguntas al nivel elegido. Si el desempeño parece estar por debajo o por encima, ofrece apoyo o reto sin cambiar silenciosamente el nivel seleccionado.",
    "No afirmes evaluar pronunciación, fonemas, acento o entonación si solo dispones de una transcripción. Si falta contexto, pregunta con naturalidad. Empieza ahora con una pregunta breve y adecuada al nivel.",
  ].join("\\n");
}


function words(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter(Boolean);
}

function wordMatch(expected: string, actual: string) {
  const remaining = [...words(actual)];
  const target = words(expected);
  if (!target.length) return 0;
  let found = 0;
  for (const token of target) {
    const index = remaining.indexOf(token);
    if (index >= 0) {
      found += 1;
      remaining.splice(index, 1);
    }
  }
  return Math.round((found / target.length) * 100);
}

export default function OmegaXEnglishStudio({ onStartRoleplay, onSendForFeedback, onSaveTranscript }: Props) {
  const [mode, setMode] = useState<Mode>("speaking");
  const [level, setLevel] = useState<CefrLevel>("A2");
  const [topicIndex, setTopicIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [roleplayIndex, setRoleplayIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const prompt = mode === "speaking" ? TOPICS_BY_LEVEL[level][topicIndex % TOPICS_BY_LEVEL[level].length] : PHRASES_BY_LEVEL[level][phraseIndex % PHRASES_BY_LEVEL[level].length];
  const match = mode === "pronunciation" && transcript ? wordMatch(prompt, transcript) : null;
  const levelProfile = CEFR_LEVEL_GUIDANCE[level];

  function cleanupTimer() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function discard() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    cleanupTimer();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setBlob(null);
    setTranscript("");
    setSeconds(0);
    setRecording(false);
    setSaved(false);
    setError("");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Prueba con Chrome o Edge actualizado.");
      return;
    }
    discard();
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"]
        .find((item) => MediaRecorder.isTypeSupported(item));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunksRef.current.push(event.data);
        const total = chunksRef.current.reduce((sum, item) => sum + item.size, 0);
        if (total > 8 * 1024 * 1024 && recorder.state !== "inactive") {
          setError("La grabación llegó al límite de 8 MB y se detuvo.");
          recorder.stop();
        }
      };
      recorder.onstop = () => {
        cleanupTimer();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const duration = Math.max(1, Math.min(60, Math.round((Date.now() - startRef.current) / 1000)));
        setSeconds(duration);
        if (audio.size < 1024) {
          setRecording(false);
          setError("La grabación quedó demasiado corta. Habla durante unos segundos y vuelve a intentarlo.");
          return;
        }
        setBlob(audio);
        setAudioUrl(URL.createObjectURL(audio));
        setRecording(false);
      };
      startRef.current = Date.now();
      recorder.start(500);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - startRef.current) / 1000));
        setSeconds(elapsed);
        if (elapsed >= 60 && recorder.state !== "inactive") recorder.stop();
      }, 250);
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
      setError(cause instanceof Error && cause.name === "NotAllowedError"
        ? "No concediste permiso para usar el micrófono. Actívalo en los permisos del sitio."
        : "No se pudo iniciar la grabación. Comprueba que el micrófono esté disponible.");
    }
  }

  async function transcribe() {
    if (!blob || transcribing) return;
    setTranscribing(true);
    setError("");
    try {
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], "omegax-english-practice." + ext, { type: blob.type || "audio/webm" });
      const form = new FormData();
      form.set("audio", file);
      const response = await fetch("/api/orby/audio/transcribe", {
        method: "POST",
        credentials: "same-origin",
        body: form,
        signal: AbortSignal.timeout(90_000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.transcript !== "string" || !payload.transcript.trim()) {
        throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo transcribir tu práctica.");
      }
      setTranscript(payload.transcript.trim().slice(0, 6000));
      setSaved(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo procesar el audio.");
    } finally {
      setTranscribing(false);
    }
  }

  function speakModel() {
    if (!("speechSynthesis" in window)) {
      setError("La voz de referencia no está disponible en este navegador.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  async function saveTranscript() {
    if (!transcript || saved) return;
    const title = mode === "speaking" ? "English Studio · speaking" : "English Studio · pronunciation";
    const content = [
      "Nivel: " + level,
      "Actividad: " + (mode === "speaking" ? "Speaking de 60 segundos" : "Repetición guiada"),
      "Duración: " + seconds + " segundos",
      "Tema/frase: " + prompt,
      "",
      "Transcripción:",
      transcript,
    ].join("\n");
    const result = await onSaveTranscript(title, content);
    setSaved(result);
    if (!result) setError("No se pudo guardar. Revisa tu biblioteca e inténtalo otra vez.");
  }

  useEffect(() => () => {
    cleanupTimer();
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    window.speechSynthesis?.cancel();
  }, [audioUrl]);

  const roleplay = ROLEPLAYS[roleplayIndex];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[#eee6dc] bg-white">
        <div className="flex flex-col gap-5 border-b border-[#eee6dc] bg-[#fffaf4] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-orange-800"><AudioLines className="h-3.5 w-3.5" /> OMEGAX · ENGLISH STUDIO · MCER A1–C2</span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Speak with confidence.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Habla, recibe feedback concreto y vuelve a practicar. OmegaX adapta la conversación, la explicación y la pizarra al nivel A1–C2 que elijas.</p>
          </div>
          <label className="block min-w-48 text-xs font-semibold text-slate-700">Nivel objetivo · MCER
            <select value={level} onChange={(event) => { setLevel(event.target.value as CefrLevel); setTopicIndex(0); setPhraseIndex(0); }} disabled={recording || transcribing || Boolean(blob)} className="mt-2 h-11 w-full rounded-xl border border-[#e7ded3] bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-55">
              <option value="A1">A1 · Principiante</option><option value="A2">A2 · Básico</option><option value="B1">B1 · Intermedio</option><option value="B2">B2 · Intermedio alto</option><option value="C1">C1 · Avanzado</option><option value="C2">C2 · Dominio avanzado</option>
            </select>
            <span className="mt-2 block text-[11px] font-normal leading-5 text-slate-500">{levelProfile.descriptor} Nivel de práctica elegido; no es una certificación ni un nivel oficial de desempeño de Saber 11.</span>
          </label>
        </div>
        <div className="border-b border-[#eee6dc] px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">
            <span>Tu ruta de inglés · A1 → C2</span><span>Objetivo actual: {level}</span>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((item) => <span key={item} className={`rounded-md px-1.5 py-1.5 text-center text-[10px] font-bold ${item === level ? "bg-orange-600 text-white" : "bg-[#f4f0eb] text-slate-500"}`}>{item}</span>)}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{levelProfile.coaching}</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-6">
          <article className="rounded-2xl border border-orange-200 bg-[#fffaf4] p-5">
            <Mic className="h-5 w-5 text-orange-800" /><h4 className="mt-4 text-sm font-semibold text-slate-900">60-second speaking</h4><p className="mt-1 text-xs leading-5 text-slate-600">Habla sobre un tema durante un minuto y revisa gramática, vocabulario y claridad.</p>
            <button type="button" onClick={() => { discard(); setMode("speaking"); }} className="mt-4 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-xs font-semibold text-orange-800 disabled:opacity-45" disabled={recording || transcribing}>Abrir reto</button>
          </article>
          <article className="rounded-2xl border border-[#eee6dc] bg-white p-5">
            <Headphones className="h-5 w-5 text-slate-700" /><h4 className="mt-4 text-sm font-semibold text-slate-900">Pronunciation practice</h4><p className="mt-1 text-xs leading-5 text-slate-600">Escucha una frase modelo, repítela y compara las palabras reconocidas.</p>
            <button type="button" onClick={() => { discard(); setMode("pronunciation"); }} className="mt-4 rounded-xl border border-[#e7ded3] px-3 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-45" disabled={recording || transcribing}>Abrir práctica</button>
          </article>
          <article className="rounded-2xl border border-[#eee6dc] bg-white p-5">
            <BookOpen className="h-5 w-5 text-emerald-700" /><h4 className="mt-4 text-sm font-semibold text-slate-900">Real-life roleplay</h4><p className="mt-1 text-xs leading-5 text-slate-600">Practica viajes, estudio, trabajo y situaciones cotidianas con OmegaX.</p>
            <button type="button" onClick={() => onStartRoleplay(buildRoleplayPrompt(level, roleplay[1]))} className="mt-4 rounded-xl border border-[#e7ded3] px-3 py-2.5 text-xs font-semibold text-slate-700">Practicar con OmegaX</button>
          </article>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
        <div className="rounded-2xl border border-[#eee6dc] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-orange-700">{mode === "speaking" ? "SPEAKING CHALLENGE" : "PRONUNCIATION LAB"}</p><h4 className="mt-2 text-lg font-semibold text-slate-900">{mode === "speaking" ? "Your 60-second challenge" : "Listen, repeat, compare"}</h4></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600">{level} · English</span></div>
          <div className="mt-5 rounded-2xl bg-[#fffaf4] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">{mode === "speaking" ? "Today's topic" : "Repeat this sentence"}</p>
            <p className="mt-3 text-lg font-semibold leading-7 text-slate-900">{prompt}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {mode === "speaking"
                ? <button type="button" onClick={() => { setTopicIndex((value) => (value + 1) % TOPICS_BY_LEVEL[level].length); setTranscript(""); setSaved(false); }} className="text-xs font-semibold text-orange-800 disabled:opacity-45" disabled={recording || transcribing}>Cambiar tema</button>
                : <><button type="button" onClick={speakModel} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-800"><Volume2 className="h-4 w-4" /> Escuchar modelo</button><button type="button" onClick={() => { setPhraseIndex((value) => (value + 1) % PHRASES_BY_LEVEL[level].length); setTranscript(""); setSaved(false); }} className="text-xs font-semibold text-orange-800 disabled:opacity-45" disabled={recording || transcribing}>Otra frase</button></>}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!recording && !blob && <button type="button" onClick={() => void startRecording()} className="inline-flex items-center gap-2 rounded-xl bg-[#f58216] px-4 py-3 text-xs font-bold text-white"><Mic className="h-4 w-4" /> Start recording</button>}
            {recording && <button type="button" onClick={() => recorderRef.current?.stop()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white"><Square className="h-3.5 w-3.5 fill-current" /> Stop recording</button>}
            {blob && !transcript && !transcribing && <button type="button" onClick={() => void transcribe()} className="inline-flex items-center gap-2 rounded-xl bg-[#f58216] px-4 py-3 text-xs font-bold text-white"><AudioLines className="h-4 w-4" /> Transcribir mi práctica</button>}
            {transcribing && <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-800"><LoaderCircle className="h-4 w-4 animate-spin" /> Transcribiendo con la cuota gratuita…</span>}
            {(recording || blob) && <span className="text-xs tabular-nums text-slate-500">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} / 01:00</span>}
            {blob && <button type="button" onClick={discard} disabled={transcribing} className="rounded-xl border border-[#e7ded3] px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-45">Nueva grabación</button>}
          </div>
          {audioUrl && <audio controls src={audioUrl} className="mt-4 w-full" />}
          {transcript && <div className="mt-4 rounded-xl border border-[#eee6dc] bg-[#fffdfa] p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-800">Tu transcripción</p><span className="text-[10px] text-slate-500">{words(transcript).length} palabras</span></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{transcript}</p>
            {match !== null && <p className="mt-3 rounded-lg bg-orange-50 p-2 text-xs text-orange-900">Coincidencia de palabras reconocidas: {match}% · comparación aproximada, no evaluación fonética.</p>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onSendForFeedback({ mode, level, prompt, transcript, seconds })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"><AudioLines className="h-4 w-4" /> Recibir feedback de OmegaX</button><button type="button" onClick={() => void saveTranscript()} disabled={saved} className="inline-flex items-center gap-2 rounded-xl border border-[#e7ded3] px-3.5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><Save className="h-4 w-4" /> {saved ? "Guardado" : "Guardar transcripción"}</button></div>
          </div>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{error}</p>}
          <p className="mt-4 text-[10px] leading-5 text-slate-500">El audio se procesa cuando pulsas Transcribir. PeakScore conserva solo la transcripción si decides guardarla. Se usa el servicio gratuito existente; no se activa un proveedor de pago.</p>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#eee6dc] bg-white p-5">
            <h4 className="text-sm font-semibold text-slate-900">Roleplay scenarios</h4>
            <p className="mt-2 text-xs leading-5 text-slate-600">Elige una situación y practica un diálogo adaptado a tu nivel.</p>
            <select value={roleplayIndex} onChange={(event) => setRoleplayIndex(Number(event.target.value))} className="mt-4 h-11 w-full rounded-xl border border-[#e7ded3] bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400">{ROLEPLAYS.map((item, index) => <option key={item[0]} value={index}>{item[0]}</option>)}</select>
            <p className="mt-3 rounded-xl bg-[#fffaf4] p-3 text-xs leading-5 text-slate-700">{roleplay[1]}</p>
            <button type="button" onClick={() => onStartRoleplay(buildRoleplayPrompt(level, roleplay[1]))} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-semibold text-orange-900"><Play className="h-4 w-4" /> Comenzar roleplay en el chat</button>
            <p className="mt-2 text-[10px] leading-5 text-slate-500">OmegaX inicia la llamada de voz al comenzar; si Live no está disponible, continúa con el modo gratuito por turnos.</p>
          </section>
          <section className="rounded-2xl border border-[#eee6dc] bg-white p-5">
            <p className="text-xs font-semibold text-slate-900">Cómo te ayuda OmegaX</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600"><li>• Corrige gramática y construcciones poco naturales.</li><li>• Sugiere vocabulario más preciso.</li><li>• Usa palabras por minuto como referencia de ritmo.</li><li>• Propone una práctica basada en tus errores.</li></ul>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500">La transcripción no permite verificar por sí sola fonemas, acento o entonación. La repetición compara palabras reconocidas, no produce una puntuación fonética.</p>
          </section>
        </div>
      </section>
    </div>
  );
}

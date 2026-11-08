"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, BookOpen, Headphones, LoaderCircle, Mic, PencilLine, Play, Save, Square, Volume2 } from "lucide-react";

type Mode = "speaking" | "pronunciation" | "listening" | "reading" | "writing";
type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
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

type ListeningTask = { title: string; script: string; question: string; expectedAnswer: string; clue: string };
type ReadingTask = { title: string; passage: string; question: string; expectedAnswer: string; evidence: string };
type WritingTask = { title: string; task: string; targetWords: string; checklist: string[] };

const LISTENING_TASKS_BY_LEVEL: Record<CefrLevel, ListeningTask[]> = {
  A1: [
    { title: "A message from Emma", script: "Hello, my name is Emma. I am thirteen years old. I live near my school, so I walk there every morning. My favourite day is Friday because I have art class.", question: "How does Emma travel to school?", expectedAnswer: "She walks to school.", clue: "Listen for the sentence about how close her home is to school." },
    { title: "At the café", script: "Good morning. I would like a glass of orange juice and a cheese sandwich, please. I do not want coffee today. How much is the sandwich?", question: "What two things does the customer order?", expectedAnswer: "A glass of orange juice and a cheese sandwich.", clue: "Listen for the two items after 'I would like'." },
  ],
  A2: [
    { title: "A change of plans", script: "We planned to visit the museum on Saturday, but it will be closed. Instead, we are going to the city park in the afternoon. Please bring a jacket because the weather may be cold.", question: "Why are they changing their plan?", expectedAnswer: "Because the museum will be closed.", clue: "Listen for the reason introduced after 'but'." },
    { title: "A school announcement", script: "The science club meeting has moved from room twelve to the library. It will still begin at half past three on Wednesday. Remember to bring your notebook.", question: "Where will the meeting take place, and when does it begin?", expectedAnswer: "In the library at half past three on Wednesday.", clue: "Separate the new location from the unchanged time." },
  ],
  B1: [
    { title: "The community garden", script: "Last year, a group of neighbours turned an empty piece of land into a community garden. At first, only six families took part. Now the garden supplies fresh vegetables to a local food programme, and the group offers free workshops on weekends.", question: "What are two benefits the garden provides to the community?", expectedAnswer: "It supplies vegetables to a local food programme and offers free weekend workshops.", clue: "Listen to the final two benefits, not only the original purpose." },
    { title: "A study decision", script: "Daniel used to revise every subject on the night before a test. After receiving lower results than expected, he started planning shorter study sessions across the week. He says the new routine helps him remember ideas and feel less stressed.", question: "What did Daniel change, and what result did he notice?", expectedAnswer: "He changed to shorter study sessions during the week and remembers more while feeling less stressed.", clue: "Compare his old routine with the new one and its effects." },
  ],
  B2: [
    { title: "Public transport proposal", script: "The council's proposal is not simply to add more buses. It combines dedicated bus lanes with safer walking routes to major stops. Although the initial construction will be disruptive, the report argues that reliability matters more than the number of vehicles operating.", question: "What is the proposal's main priority, according to the speaker?", expectedAnswer: "Improving reliability through dedicated bus lanes and safer access routes, rather than merely increasing the number of buses.", clue: "Notice the contrast between adding vehicles and improving reliability." },
    { title: "Research findings", script: "The study found that students who took short breaks often completed more tasks. However, the authors warned that the result does not prove breaks alone caused the improvement, since the participants also had quieter workspaces.", question: "Why do the authors avoid claiming that breaks caused the improvement?", expectedAnswer: "Because quieter workspaces may also have contributed, so the study does not isolate the effect of breaks.", clue: "Listen for the limitation introduced by 'however'." },
  ],
  C1: [
    { title: "The museum's new policy", script: "The museum describes its new entry system as a way to broaden access. Yet the policy also requires visitors to reserve a time slot online, which may disadvantage people with limited connectivity. The director therefore proposes keeping a small number of walk-in places while monitoring demand.", question: "What tension does the policy create, and how does the director propose addressing it?", expectedAnswer: "The online reservation system may improve access for some but exclude people with limited connectivity; the director proposes retaining walk-in places and monitoring demand.", clue: "Identify the tension between the stated aim and a possible unintended barrier." },
    { title: "Interpreting a survey", script: "Although the survey reports a strong preference for remote work, its sample consists mainly of employees whose roles can be performed online. The findings may therefore describe that group accurately without representing the wider workforce.", question: "What limitation should readers consider before generalising the result?", expectedAnswer: "The sample is concentrated in jobs that can be done remotely, so it may not represent the wider workforce.", clue: "Focus on who was included in the sample." },
  ],
  C2: [
    { title: "A carefully qualified statement", script: "The spokesperson did not deny that the timetable had failed; she said only that the delays were not wholly attributable to the department. The distinction is deliberate: it concedes the outcome while contesting the scope of responsibility.", question: "What does the spokesperson concede, and what does she dispute?", expectedAnswer: "She concedes that the timetable failed but disputes that the department was entirely responsible for the delays.", clue: "Notice the difference between accepting an outcome and accepting full responsibility." },
    { title: "The critic's reservation", script: "The critic praises the novel's formal ingenuity, then observes that its emotional restraint occasionally becomes indistinguishable from indifference. The qualification does not retract the praise; it narrows the terms on which that praise should be understood.", question: "How does the qualification change the force of the critic's praise?", expectedAnswer: "It preserves the praise for the novel's technique while limiting it by questioning its emotional effect.", clue: "The reservation qualifies the praise rather than cancelling it." },
  ],
};

const READING_TASKS_BY_LEVEL: Record<CefrLevel, ReadingTask[]> = {
  A1: [
    { title: "A school notice", passage: "SPORTS DAY\nFriday, 9:00 a.m.\nSchool playground\nBring water and a hat.\nFamilies are welcome.", question: "Where will Sports Day take place?", expectedAnswer: "In the school playground.", evidence: "The notice states 'School playground' below the date and time." },
    { title: "A short message", passage: "Hi Leo,\nI cannot play football after school today because I have a music lesson. Can we meet on Saturday morning?\nMia", question: "Why can Mia not play football today?", expectedAnswer: "Because she has a music lesson.", evidence: "Mia gives her music lesson as the reason." },
  ],
  A2: [
    { title: "Library information", passage: "The town library opens at 9 a.m. from Monday to Friday. On Saturdays it opens two hours later and closes at 1 p.m. Visitors can borrow up to four books for three weeks.", question: "How is the Saturday schedule different from the weekday schedule?", expectedAnswer: "It opens two hours later and closes at 1 p.m.", evidence: "The Saturday sentence says it opens two hours later and closes at 1 p.m." },
    { title: "A travel email", passage: "Hello Sam,\nOur train arrives at 10:20, so there should be enough time to leave our bags at the hotel before lunch. I have booked the walking tour for 2 p.m.\nSee you soon, Ana", question: "What activity has Ana booked, and at what time?", expectedAnswer: "A walking tour at 2 p.m.", evidence: "Ana says she booked the walking tour for 2 p.m." },
  ],
  B1: [
    { title: "Learning in groups", passage: "Working in a group can expose students to different ways of solving a problem. However, a group is not automatically effective: members need clear roles, shared goals and time to explain their ideas. Without these conditions, a confident student may dominate while others remain silent.", question: "According to the passage, what conditions make group work more effective?", expectedAnswer: "Clear roles, shared goals and time for members to explain their ideas.", evidence: "The second sentence explicitly lists the three conditions." },
    { title: "Urban trees", passage: "Trees can lower street temperatures by providing shade and releasing water vapour. Their benefits are not distributed equally, however. Neighbourhoods with fewer green spaces may experience more heat, which is why urban planting plans should consider both climate and social needs.", question: "Why should planting plans consider social needs as well as climate?", expectedAnswer: "Because neighbourhoods with fewer green spaces may experience more heat and benefits are unevenly distributed.", evidence: "The final two sentences connect unequal green space with unequal heat exposure." },
  ],
  B2: [
    { title: "The value of public spaces", passage: "Public spaces are often evaluated by the number of visitors they attract. That measure is useful, but incomplete. A square used by fewer people may still be essential to residents who depend on it for quiet recreation, informal meetings or access to local services. Attendance alone therefore offers a narrow account of public value.", question: "What limitation of visitor numbers does the author emphasise?", expectedAnswer: "Visitor numbers overlook less frequent but important uses and the needs of particular residents.", evidence: "The examples of quiet recreation, informal meetings and local services show value beyond attendance." },
    { title: "A scientific claim", passage: "A correlation between screen time and sleep quality does not establish that one causes the other. Stress, work schedules or other variables may influence both. Researchers therefore distinguish an observed association from a causal explanation and design further studies to test competing possibilities.", question: "Why is correlation insufficient to establish causation in this example?", expectedAnswer: "Because other variables could influence both screen time and sleep quality.", evidence: "The second sentence names possible confounding variables." },
  ],
  C1: [
    { title: "Designing for accessibility", passage: "An interface may satisfy formal accessibility checks while remaining difficult to use in practice. Automated tests can identify missing labels or contrast problems, but they cannot fully capture whether navigation makes sense to someone using assistive technology. Accessibility is therefore not merely a checklist; it requires observation, feedback and revision with diverse users.", question: "What distinction does the author make between passing checks and being accessible in practice?", expectedAnswer: "Formal checks identify some technical barriers, but real accessibility also depends on how diverse users experience and navigate the interface.", evidence: "The contrast between automated tests and observation with assistive-technology users supports this distinction." },
    { title: "Interpreting historical sources", passage: "A source's proximity to an event may make it valuable, but proximity does not guarantee neutrality. A witness may have direct knowledge while also having limited information, personal interests or reasons to remember events selectively. Historians therefore assess not only when a source was produced but also whose perspective it represents.", question: "Why is a contemporary source not automatically neutral or complete?", expectedAnswer: "Because direct witnesses may have limited information, personal interests or selective memory.", evidence: "The second sentence lists limitations that can affect a contemporary witness." },
  ],
  C2: [
    { title: "The ambiguity of reform", passage: "The minister called the reform 'a necessary correction', a phrase that presupposes the existence of an error while leaving its nature unspecified. Supporters heard a promise of overdue action; opponents heard an attempt to legitimise disruption without naming who would bear its costs. The phrase's political usefulness lies partly in accommodating both readings.", question: "How does the phrase allow opposing audiences to interpret the reform differently?", expectedAnswer: "It presupposes a problem and the need for action but leaves the nature of the error and the costs unspecified, allowing different groups to project their own concerns.", evidence: "The passage contrasts supporters' and opponents' readings and explains the phrase's ambiguity." },
    { title: "The limits of a metric", passage: "Once a proxy becomes a target, institutions may optimise what is measurable at the expense of what the measure was intended to represent. This does not render quantification useless; it makes the relationship between indicator and purpose a continuing object of scrutiny. The difficulty is not measurement itself but the temptation to mistake the map for the territory.", question: "What warning is conveyed by the final metaphor?", expectedAnswer: "Do not confuse a measurable indicator or representation with the complex reality or purpose it is meant to represent.", evidence: "The metaphor summarises the distinction between an indicator and the underlying purpose." },
  ],
};

const WRITING_TASKS_BY_LEVEL: Record<CefrLevel, WritingTask[]> = {
  A1: [
    { title: "My daily routine", task: "Write 4–6 simple sentences about your school day. Say what time you get up, how you go to school and what subject you like.", targetWords: "25–40 words", checklist: ["Use simple present verbs.", "Include at least two time or frequency expressions.", "Check capital letters and full stops."] },
    { title: "A person I know", task: "Write 4–6 sentences describing a friend or family member: name, age, appearance and one thing they like.", targetWords: "25–40 words", checklist: ["Use 'be' and 'have' correctly.", "Include one adjective.", "Use complete sentences."] },
  ],
  A2: [
    { title: "A memorable day", task: "Write a short message about a day you enjoyed. Explain where you went, what you did and why you liked it.", targetWords: "50–70 words", checklist: ["Use past simple for completed events.", "Add time connectors such as first, then and finally.", "Give a reason for your opinion."] },
    { title: "Giving advice", task: "Write a short message to a student who feels nervous before an exam. Give two practical suggestions and explain them.", targetWords: "50–70 words", checklist: ["Use should or can for advice.", "Organise each suggestion clearly.", "Use a friendly tone."] },
  ],
  B1: [
    { title: "A school improvement", task: "Write a connected paragraph proposing one change that would improve your school. Explain the problem, your solution and one likely benefit.", targetWords: "90–120 words", checklist: ["State a clear main idea.", "Use linking words to connect reasons.", "Support the proposal with an example."] },
    { title: "A personal learning goal", task: "Describe a skill you want to develop, why it matters and what steps you will take over the next month.", targetWords: "90–120 words", checklist: ["Use future forms appropriately.", "Explain reasons and steps.", "Keep a clear beginning, middle and ending."] },
  ],
  B2: [
    { title: "Technology at school", task: "Write an opinion essay discussing whether schools should limit smartphone use. Present a clear position, address a counterargument and support your reasoning.", targetWords: "150–180 words", checklist: ["Develop a clear thesis.", "Address a relevant counterargument.", "Use precise connectors and examples."] },
    { title: "Public transport priorities", task: "Write a short formal proposal explaining how a city could encourage public transport without ignoring the needs of people who rely on cars.", targetWords: "150–180 words", checklist: ["Use an appropriate formal register.", "Compare competing needs fairly.", "Make recommendations supported by reasons."] },
  ],
  C1: [
    { title: "Personalised education", task: "Write a balanced argument on whether personalised learning systems improve educational equity. Consider benefits, limitations and safeguards.", targetWords: "200–240 words", checklist: ["Build a nuanced thesis.", "Integrate counterarguments rather than merely listing them.", "Maintain cohesion and a consistent academic register."] },
    { title: "A public policy response", task: "Write a policy brief recommending how a city should respond to extreme heat. Distinguish immediate measures from long-term structural changes.", targetWords: "200–240 words", checklist: ["Prioritise recommendations.", "Distinguish evidence from assumptions.", "Use precise and economical language."] },
  ],
  C2: [
    { title: "Language and power", task: "Write a critical commentary on how euphemism and framing can shape public understanding of a controversial decision. Develop a qualified argument and acknowledge interpretive limits.", targetWords: "250–300 words", checklist: ["Analyse implications and rhetorical choices.", "Control tone, nuance and register.", "Qualify claims and address plausible alternative readings."] },
    { title: "A complex ethical dilemma", task: "Present and evaluate two defensible but conflicting principles in a public-policy dilemma. Explain the trade-offs and defend a position without oversimplifying the opposing view.", targetWords: "250–300 words", checklist: ["Represent both principles fairly.", "Explain trade-offs and unintended consequences.", "Reach a carefully qualified conclusion."] },
  ],
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
  const [taskIndex, setTaskIndex] = useState(0);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [showListeningTranscript, setShowListeningTranscript] = useState(false);
  const [listeningPlaying, setListeningPlaying] = useState(false);
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

  const activeListening = LISTENING_TASKS_BY_LEVEL[level][taskIndex % LISTENING_TASKS_BY_LEVEL[level].length];
  const activeReading = READING_TASKS_BY_LEVEL[level][taskIndex % READING_TASKS_BY_LEVEL[level].length];
  const activeWriting = WRITING_TASKS_BY_LEVEL[level][taskIndex % WRITING_TASKS_BY_LEVEL[level].length];
  const prompt = mode === "speaking"
    ? TOPICS_BY_LEVEL[level][topicIndex % TOPICS_BY_LEVEL[level].length]
    : mode === "pronunciation"
      ? PHRASES_BY_LEVEL[level][phraseIndex % PHRASES_BY_LEVEL[level].length]
      : mode === "listening" ? activeListening.question
        : mode === "reading" ? activeReading.question : activeWriting.task;
  const taskFeedbackContext = mode === "listening"
    ? "Listening task: " + activeListening.title + "\\nAudio script: " + activeListening.script + "\\nQuestion: " + activeListening.question + "\\nExpected evidence-based answer: " + activeListening.expectedAnswer + "\\nListening clue: " + activeListening.clue
    : mode === "reading"
      ? "Reading task: " + activeReading.title + "\\nPassage: " + activeReading.passage + "\\nQuestion: " + activeReading.question + "\\nExpected answer: " + activeReading.expectedAnswer + "\\nTextual evidence: " + activeReading.evidence
      : mode === "writing"
        ? "Writing task: " + activeWriting.title + "\\nInstruction: " + activeWriting.task + "\\nTarget length: " + activeWriting.targetWords + "\\nReview points: " + activeWriting.checklist.join("; ")
        : prompt;
  const writtenMode = mode === "listening" || mode === "reading" || mode === "writing";
  const studentResponse = writtenMode ? writtenResponse : transcript;
  const canSubmitResponse = studentResponse.trim().length > 0;
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

  function selectMode(nextMode: Mode) {
    if (recording || transcribing) return;
    discard();
    window.speechSynthesis?.cancel();
    setListeningPlaying(false);
    setWrittenResponse("");
    setShowListeningTranscript(false);
    setTaskIndex(0);
    setMode(nextMode);
  }

  function nextSkillTask() {
    window.speechSynthesis?.cancel();
    setListeningPlaying(false);
    setTaskIndex((value) => value + 1);
    setWrittenResponse("");
    setShowListeningTranscript(false);
    setSaved(false);
    setError("");
  }

  function playListeningTask() {
    if (!("speechSynthesis" in window)) {
      setError("La voz de lectura no está disponible en este navegador. Puedes leer el texto después de revelarlo y continuar con la actividad.");
      return;
    }
    window.speechSynthesis.cancel();
    setListeningPlaying(true);
    const utterance = new SpeechSynthesisUtterance(activeListening.script);
    utterance.lang = "en-US";
    utterance.rate = level === "A1" ? 0.78 : level === "A2" ? 0.84 : level === "B1" ? 0.9 : level === "B2" ? 0.96 : 1;
    utterance.onend = () => setListeningPlaying(false);
    utterance.onerror = () => {
      setListeningPlaying(false);
      setError("El navegador no pudo reproducir este audio. Inténtalo de nuevo o revela la transcripción.");
    };
    window.speechSynthesis.speak(utterance);
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
    if (!studentResponse.trim() || saved) return;
    const activityNames: Record<Mode, string> = {
      speaking: "Speaking de 60 segundos",
      pronunciation: "Repetición guiada",
      listening: "Comprensión auditiva",
      reading: "Comprensión lectora",
      writing: "Producción escrita",
    };
    const title = "English Studio · " + activityNames[mode];
    const content = [
      "Nivel objetivo MCER: " + level,
      "Actividad: " + activityNames[mode],
      "Duración de la grabación: " + (seconds > 0 ? seconds + " segundos" : "No aplica a esta respuesta escrita"),
      "Consigna: " + taskFeedbackContext,
      "",
      "Respuesta del estudiante:",
      studentResponse,
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
            <select value={level} onChange={(event) => { setLevel(event.target.value as CefrLevel); setTopicIndex(0); setPhraseIndex(0); setTaskIndex(0); setTranscript(""); setWrittenResponse(""); setShowListeningTranscript(false); setListeningPlaying(false); setSaved(false); window.speechSynthesis?.cancel(); }} disabled={recording || transcribing || Boolean(blob)} className="mt-2 h-11 w-full rounded-xl border border-[#e7ded3] bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-55">
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
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 sm:p-6">
          {([
            { id: "speaking" as const, title: "Speaking · 60 segundos", description: "Habla sobre un tema y recibe feedback sobre tu respuesta.", icon: Mic },
            { id: "pronunciation" as const, title: "Pronunciation", description: "Escucha una frase, repítela y compara las palabras reconocidas.", icon: Headphones },
            { id: "listening" as const, title: "Listening lab", description: "Escucha un mensaje y responde preguntas de comprensión.", icon: Volume2 },
            { id: "reading" as const, title: "Reading lab", description: "Lee un texto graduado, encuentra evidencia y responde.", icon: BookOpen },
            { id: "writing" as const, title: "Writing lab", description: "Escribe con una meta clara y recibe correcciones accionables.", icon: PencilLine },
          ]).map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return <article key={item.id} className={`rounded-2xl border p-5 ${active ? "border-orange-200 bg-[#fffaf4]" : "border-[#eee6dc] bg-white"}`}>
              <Icon className="h-5 w-5 text-orange-800" />
              <h4 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
              <button type="button" onClick={() => selectMode(item.id)} className="mt-4 rounded-xl border border-[#e7ded3] bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-45" disabled={recording || transcribing}>{active ? "Actividad abierta" : "Abrir actividad"}</button>
            </article>;
          })}
          <article className="rounded-2xl border border-[#eee6dc] bg-white p-5">
            <BookOpen className="h-5 w-5 text-emerald-700" /><h4 className="mt-4 text-sm font-semibold text-slate-900">Real-life roleplay</h4><p className="mt-1 text-xs leading-5 text-slate-600">Practica viajes, estudio, trabajo y situaciones cotidianas con OmegaX.</p>
            <button type="button" onClick={() => onStartRoleplay(buildRoleplayPrompt(level, roleplay[1]))} className="mt-4 rounded-xl border border-[#e7ded3] px-3 py-2.5 text-xs font-semibold text-slate-700">Practicar con OmegaX</button>
          </article>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
        <div className="rounded-2xl border border-[#eee6dc] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-orange-700">{mode === "speaking" ? "SPEAKING CHALLENGE" : mode === "pronunciation" ? "PRONUNCIATION LAB" : mode === "listening" ? "LISTENING LAB" : mode === "reading" ? "READING LAB" : "WRITING LAB"}</p><h4 className="mt-2 text-lg font-semibold text-slate-900">{mode === "speaking" ? "Your 60-second challenge" : mode === "pronunciation" ? "Listen, repeat, compare" : mode === "listening" ? "Listen for meaning" : mode === "reading" ? "Read, find evidence, answer" : "Write with a clear purpose"}</h4></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600">{level} · English</span></div>
          {(mode === "speaking" || mode === "pronunciation") && <div className="mt-5 rounded-2xl bg-[#fffaf4] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">{mode === "speaking" ? "Today's topic" : "Repeat this sentence"}</p>
            <p className="mt-3 text-lg font-semibold leading-7 text-slate-900">{prompt}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {mode === "speaking"
                ? <button type="button" onClick={() => { setTopicIndex((value) => (value + 1) % TOPICS_BY_LEVEL[level].length); setTranscript(""); setSaved(false); }} className="text-xs font-semibold text-orange-800 disabled:opacity-45" disabled={recording || transcribing}>Cambiar tema</button>
                : <><button type="button" onClick={speakModel} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-800"><Volume2 className="h-4 w-4" /> Escuchar modelo</button><button type="button" onClick={() => { setPhraseIndex((value) => (value + 1) % PHRASES_BY_LEVEL[level].length); setTranscript(""); setSaved(false); }} className="text-xs font-semibold text-orange-800 disabled:opacity-45" disabled={recording || transcribing}>Otra frase</button></>}
            </div>
          </div>}
          {mode === "listening" && <div className="mt-5 rounded-2xl bg-[#fffaf4] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">{activeListening.title} · escucha sin leer</p>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-900">{activeListening.question}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={playListeningTask} disabled={listeningPlaying} className="inline-flex items-center gap-2 rounded-xl bg-[#f58216] px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Volume2 className="h-4 w-4"/>{listeningPlaying ? "Reproduciendo…" : "Reproducir audio"}</button>
              <button type="button" onClick={() => { setShowListeningTranscript((value) => !value); window.speechSynthesis?.cancel(); setListeningPlaying(false); }} className="rounded-xl border border-[#e7ded3] bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">{showListeningTranscript ? "Ocultar transcripción" : "Revelar transcripción"}</button>
              <button type="button" onClick={nextSkillTask} className="rounded-xl border border-[#e7ded3] bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">Otro audio</button>
            </div>
            {showListeningTranscript && <p className="mt-4 rounded-xl border border-orange-100 bg-white p-4 text-sm leading-6 text-slate-700">{activeListening.script}</p>}
            <p className="mt-3 text-[10px] leading-5 text-slate-500">Audio leído por la voz disponible en tu navegador. No es una grabación de hablante nativo ni una evaluación de acento.</p>
          </div>}
          {mode === "reading" && <div className="mt-5 rounded-2xl bg-[#fffaf4] p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">Reading · {activeReading.title}</p><button type="button" onClick={nextSkillTask} className="text-xs font-semibold text-orange-800">Otro texto</button></div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-800">{activeReading.passage}</p>
            <p className="mt-4 border-t border-orange-100 pt-4 text-sm font-semibold leading-6 text-slate-900">{activeReading.question}</p>
          </div>}
          {mode === "writing" && <div className="mt-5 rounded-2xl bg-[#fffaf4] p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">Writing · {activeWriting.title}</p><button type="button" onClick={nextSkillTask} className="text-xs font-semibold text-orange-800">Otra consigna</button></div>
            <p className="mt-3 text-sm leading-7 text-slate-800">{activeWriting.task}</p>
            <p className="mt-3 text-xs font-semibold text-orange-900">Extensión orientativa: {activeWriting.targetWords}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">{activeWriting.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>}
          {(mode === "speaking" || mode === "pronunciation") && <div className="mt-5 flex flex-wrap items-center gap-3">
            {!recording && !blob && <button type="button" onClick={() => void startRecording()} className="inline-flex items-center gap-2 rounded-xl bg-[#f58216] px-4 py-3 text-xs font-bold text-white"><Mic className="h-4 w-4" /> Start recording</button>}
            {recording && <button type="button" onClick={() => recorderRef.current?.stop()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white"><Square className="h-3.5 w-3.5 fill-current" /> Stop recording</button>}
            {blob && !transcript && !transcribing && <button type="button" onClick={() => void transcribe()} className="inline-flex items-center gap-2 rounded-xl bg-[#f58216] px-4 py-3 text-xs font-bold text-white"><AudioLines className="h-4 w-4" /> Transcribir mi práctica</button>}
            {transcribing && <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-800"><LoaderCircle className="h-4 w-4 animate-spin" /> Transcribiendo con la cuota gratuita…</span>}
            {(recording || blob) && <span className="text-xs tabular-nums text-slate-500">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} / 01:00</span>}
            {blob && <button type="button" onClick={discard} disabled={transcribing} className="rounded-xl border border-[#e7ded3] px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-45">Nueva grabación</button>}
          </div>}
          {audioUrl && <audio controls src={audioUrl} className="mt-4 w-full" />}
          {writtenMode && <div className="mt-5 rounded-2xl border border-[#eee6dc] bg-[#fffdfa] p-4">
            <label className="block text-xs font-semibold text-slate-800">{mode === "writing" ? "Tu texto" : "Tu respuesta en inglés"}
              <textarea value={writtenResponse} onChange={(event) => { setWrittenResponse(event.target.value.slice(0, 5000)); setSaved(false); }} rows={mode === "writing" ? 9 : 3} maxLength={5000} placeholder={mode === "writing" ? "Escribe aquí tu texto en inglés…" : "Escribe aquí tu respuesta en inglés…"} className="mt-2 w-full resize-y rounded-xl border border-[#e7ded3] bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-orange-400"/>
            </label>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>{words(writtenResponse).length} palabras</span><span>{mode === "writing" ? activeWriting.targetWords + " · rango orientativo" : "Respuesta breve, basada en la evidencia"}</span></div>
          </div>}
          {(mode === "speaking" || mode === "pronunciation") && transcript && <div className="mt-4 rounded-xl border border-[#eee6dc] bg-[#fffdfa] p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-800">Tu transcripción</p><span className="text-[10px] text-slate-500">{words(transcript).length} palabras</span></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{transcript}</p>
            {match !== null && <p className="mt-3 rounded-lg bg-orange-50 p-2 text-xs text-orange-900">Coincidencia de palabras reconocidas: {match}% · comparación aproximada, no evaluación fonética.</p>}
          </div>}
          {canSubmitResponse && <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onSendForFeedback({ mode, level, prompt: taskFeedbackContext, transcript: studentResponse, seconds })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"><AudioLines className="h-4 w-4" /> Recibir feedback de OmegaX</button>
            <button type="button" onClick={() => void saveTranscript()} disabled={saved} className="inline-flex items-center gap-2 rounded-xl border border-[#e7ded3] px-3.5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><Save className="h-4 w-4" /> {saved ? "Guardado" : "Guardar respuesta"}</button>
            {writtenMode && <button type="button" onClick={() => { setWrittenResponse(""); setSaved(false); setError(""); }} className="rounded-xl border border-[#e7ded3] px-3.5 py-2.5 text-xs font-semibold text-slate-600">Borrar respuesta</button>}
          </div>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{error}</p>}
          <p className="mt-4 text-[10px] leading-5 text-slate-500">Las respuestas de listening, reading y writing se evalúan con el motor gratuito existente de OmegaX cuando envías la actividad. El audio de listening usa la voz del navegador; no es una grabación nativa. Guardar una actividad es opcional.</p>
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

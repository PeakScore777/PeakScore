"use client";

import Image from "next/image";

import { useCallback, useEffect, useRef, useState } from "react";

type Stage = "GRADO 10" | "GRADO 11" | "YA ME GRADUÉ" | "OTRA SITUACIÓN";
type Experience =
  | "ESTOY EMPEZANDO"
  | "HE PRACTICADO CON SIMULACROS"
  | "YA PRESENTÉ EL EXAMEN"
  | "LO HE PRESENTADO VARIAS VECES";
type Goal =
  | "FORTALECER MIS BASES"
  | "MEJORAR EN LO QUE ME CUESTA"
  | "SUBIR MI PUNTAJE"
  | "PRACTICAR Y MEDIR MI NIVEL";

const SCENES = [
  "¡Ey! ¡Por fin llegaste! Bienvenido a PeakScore, aventurero.",
  "Soy Founder, el creador de este mundo. Y tú estás a punto de comenzar tu propia aventura.",
  "Aquí no se trata solamente de responder preguntas. Vas a descubrir tus fortalezas, superar retos y avanzar a tu ritmo.",
  "Cada aventurero comienza desde un punto diferente. Cuéntame un poco de tu camino y te recomendaré por dónde empezar.",
];

const STAGES: Stage[] = ["GRADO 10", "GRADO 11", "YA ME GRADUÉ", "OTRA SITUACIÓN"];
const GOALS: Goal[] = [
  "FORTALECER MIS BASES",
  "MEJORAR EN LO QUE ME CUESTA",
  "SUBIR MI PUNTAJE",
  "PRACTICAR Y MEDIR MI NIVEL",
];

function experienceOptions(stage: Stage): Experience[] {
  if (stage === "GRADO 10") {
    // En décimo todavía no se presenta el Saber 11 oficial.
    return ["ESTOY EMPEZANDO", "HE PRACTICADO CON SIMULACROS"];
  }
  if (stage === "GRADO 11") {
    return ["ESTOY EMPEZANDO", "HE PRACTICADO CON SIMULACROS", "YA PRESENTÉ EL EXAMEN"];
  }
  return [
    "ESTOY EMPEZANDO",
    "HE PRACTICADO CON SIMULACROS",
    "YA PRESENTÉ EL EXAMEN",
    "LO HE PRESENTADO VARIAS VECES",
  ];
}

function recommendation(stage: Stage, experience: Experience, goal: Goal) {
  let title = "CAMPAMENTO BASE";
  let subtitle = "Tu primer punto de partida";
  let description =
    "Empezaremos con un recorrido guiado para reconocer los conceptos esenciales y construir confianza antes de subir la dificultad.";
  let firstStep = "Comienza con los fundamentos y una práctica diagnóstica corta.";

  if (goal === "MEJORAR EN LO QUE ME CUESTA") {
    title = "RUTA DE REFUERZO";
    subtitle = "Convierte tus dudas en fortalezas";
    description =
      "Primero haremos una exploración breve para detectar qué temas necesitan más atención. Después podrás reforzarlos sin perder tiempo en lo que ya dominas.";
    firstStep = "Inicia con una exploración de habilidades y desbloquea tu primer refuerzo.";
  } else if (goal === "SUBIR MI PUNTAJE") {
    title = "ASCENSO AL PUNTAJE";
    subtitle = "Entrena con una meta en mente";
    description =
      "Organizaremos tu preparación por retos: diagnóstico, práctica tipo ICFES y revisión de errores para que avances con intención.";
    firstStep = "Empieza con un diagnóstico y luego pasa a retos de práctica.";
  } else if (goal === "PRACTICAR Y MEDIR MI NIVEL") {
    title = "ZONA DE EXPLORACIÓN";
    subtitle = "Descubre tu nivel jugando";
    description =
      "Comenzaremos con preguntas variadas para conocer tu punto actual. El resultado servirá para recomendarte los siguientes retos, no para etiquetarte.";
    firstStep = "Resuelve una práctica inicial y descubre qué ruta te conviene.";
  }

  if (stage === "GRADO 10") {
    if (experience === "ESTOY EMPEZANDO") {
      title = goal === "MEJORAR EN LO QUE ME CUESTA" ? "CAMPAMENTO DE EXPLORACIÓN" : title;
      subtitle = "Construye tus bases con tiempo";
      description =
        "Como estás en décimo y apenas comienzas, no necesitas asumir que ya conoces el examen. Te recomendamos aprender los fundamentos paso a paso y familiarizarte gradualmente con preguntas tipo ICFES.";
      firstStep = "Comienza con el primer recorrido de fundamentos y una práctica guiada.";
    } else {
      subtitle = "Ya conoces el formato de práctica";
      description =
        "Como estás en décimo y ya has practicado con simulacros, puedes combinar fundamentos con retos cortos. Todavía hay tiempo para consolidar habilidades antes de presentar Saber 11.";
      firstStep = "Haz una exploración corta y continúa con retos de dificultad progresiva.";
    }
  } else if (stage === "GRADO 11") {
    if (experience === "ESTOY EMPEZANDO") {
      title = goal === "SUBIR MI PUNTAJE" ? "DESPEGUE SABER 11" : "CAMPAMENTO BASE";
      subtitle = "Prepárate desde tu punto actual";
      description =
        "Como estás en undécimo y estás empezando, iremos de menos a más: fundamentos prioritarios, práctica guiada y luego simulacros para familiarizarte con el examen.";
      firstStep = "Inicia con un diagnóstico breve y los fundamentos prioritarios.";
    } else if (experience === "YA PRESENTÉ EL EXAMEN") {
      title = "SEGUNDO ASCENSO";
      subtitle = "Aprovecha tu primera experiencia";
      description =
        "Ya conoces la experiencia del examen. Vamos a usar esa referencia para identificar oportunidades de mejora y preparar tu siguiente intento con un plan más enfocado.";
      firstStep = "Comienza revisando tus áreas por reforzar y practica con retos dirigidos.";
    } else {
      subtitle = "Transforma la experiencia en estrategia";
      description =
        "Ya has tenido contacto con simulacros o con el examen. Te conviene empezar con una práctica diagnóstica y enfocar el entrenamiento en las áreas que más impacto puedan tener.";
      firstStep = "Haz un diagnóstico y prioriza los retos según tus resultados.";
    }
  } else if (experience === "YA PRESENTÉ EL EXAMEN" || experience === "LO HE PRESENTADO VARIAS VECES") {
    title = goal === "FORTALECER MIS BASES" ? "RECONSTRUYE TU BASE" : "RUTA DE REINTENTO";
    subtitle = "Una nueva oportunidad, con estrategia";
    description =
      "Tu experiencia previa puede ayudarte a prepararte de manera más intencional. Empezaremos identificando tus fortalezas y los temas que conviene trabajar antes del siguiente intento.";
    firstStep = "Inicia con un diagnóstico y crea tu mapa de refuerzo.";
  } else if (experience === "HE PRACTICADO CON SIMULACROS") {
    subtitle = "Convierte la práctica en progreso";
    firstStep = "Empieza con una práctica diagnóstica y revisa tus respuestas.";
  }

  return { title, subtitle, description, firstStep };
}

export default function IntroTestPage() {
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typingProgress, setTypingProgress] = useState<{ key: string; count: number }>({ key: "", count: 0 });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stage, setStage] = useState<Stage | "">("");
  const [experience, setExperience] = useState<Experience | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [selected, setSelected] = useState("");
  const [musicOn, setMusicOn] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const typingRef = useRef<HTMLAudioElement | null>(null);

  const isStory = sceneIndex < SCENES.length;
  const stageOptions = STAGES;
  const activeQuestion = questionIndex === 0
    ? { title: "¿EN QUÉ ETAPA ESTÁS?", options: stageOptions as string[] }
    : questionIndex === 1
      ? { title: "¿QUÉ EXPERIENCIA TIENES CON EL ICFES?", options: stage ? experienceOptions(stage) as string[] : [] }
      : { title: "¿QUÉ QUIERES CONSEGUIR PRIMERO?", options: GOALS as string[] };
  const questionText = activeQuestion.title;
  const text = isStory
    ? SCENES[sceneIndex]
    : showRecommendation
      ? "¡Listo, aventurero! Esta es la ruta que te recomendamos para empezar. Más adelante podrás desbloquear nuevos niveles y ajustar tu camino a medida que avances."
      : questionText;
  const typingKey = JSON.stringify([started, sceneIndex, questionIndex, showRecommendation, text]);
  const visibleChars = started && typingProgress.key === typingKey ? typingProgress.count : 0;
  const isTyping = visibleChars < text.length;
  const route = stage && experience && goal ? recommendation(stage, experience, goal) : null;

  useEffect(() => {
    if (!started || !musicOn || !musicRef.current) return;
    const audio = musicRef.current;
    audio.volume = 0.2;
    void audio.play().catch(() => {});
    return () => audio.pause();
  }, [started, musicOn]);

  useEffect(() => {
    if (!started) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const frame = window.requestAnimationFrame(() => {
        setTypingProgress({ key: typingKey, count: text.length });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    let count = 0;
    let soundCounter = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setTypingProgress({ key: typingKey, count });
      soundCounter += 1;
      // Un toque corto cada pocos caracteres: evita convertir el diálogo en ruido continuo.
      if (soundCounter >= 3 && count < text.length && typingRef.current) {
        const audio = typingRef.current;
        audio.volume = 0.12;
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        soundCounter = 0;
      }
      if (count >= text.length) window.clearInterval(timer);
    }, 34);
    return () => window.clearInterval(timer);
  }, [started, text, typingKey]);

  const currentOptions = showRecommendation
    ? []
    : questionIndex === 0
      ? STAGES
      : questionIndex === 1
        ? (stage ? experienceOptions(stage) : [])
        : GOALS;

  const advance = useCallback(() => {
    if (isTyping) return;
    if (isStory) {
      setSceneIndex((value) => value + 1);
      return;
    }
    if (showRecommendation) {
      setStarted(false);
      setSceneIndex(0);
      setQuestionIndex(0);
      setStage("");
      setExperience("");
      setGoal("");
      setSelected("");
      setShowRecommendation(false);
      return;
    }
    if (!selected) return;

    if (questionIndex === 0) {
      const nextStage = selected as Stage;
      setStage(nextStage);
      setExperience("");
      setSelected("");
      setQuestionIndex(1);
      return;
    }
    if (questionIndex === 1) {
      setExperience(selected as Experience);
      setSelected("");
      setQuestionIndex(2);
      return;
    }
    setGoal(selected as Goal);
    setSelected("");
    setShowRecommendation(true);
  }, [isTyping, isStory, showRecommendation, selected, questionIndex]);

  useEffect(() => {
    if (!started) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "BUTTON") return;
        event.preventDefault();
        advance();
      }
      if (event.key === "Escape") setStarted(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, advance]);

  return (
    <main
      className="intro-test-shell"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        overflow: "auto",
        background: "#000000",
        color: "#f5f1e8",
        fontFamily: "var(--font-press-start), monospace",
      }}
    >
      <style jsx global>{`
        .intro-test-shell * { box-sizing: border-box; }
        .intro-test-shell button { font: inherit; cursor: pointer; }
        .intro-test-pixel { font-family: var(--font-press-start), monospace; }
        .intro-test-action { border: 1px solid #d9ad52; color:#f2c76b; background:transparent; padding:12px 16px; font-size:10px; letter-spacing:.06em; }
        .intro-test-action:hover { background:#e4b95e; color:#080808; }
        .intro-test-shell button:focus-visible { outline: 1px solid #f1c85c; outline-offset: 5px; }
        @media(max-width:640px) {
          .intro-test-character { width: 37vw !important; max-width: 150px !important; }
          .intro-test-dialogue { font-size: 10px !important; line-height: 2.2 !important; }
          .intro-test-shell button { font-size: 9px; }
        }
      `}</style>

      <audio ref={musicRef} src="/audio/intro/peakscore-intro.wav" loop preload="none" />
      <audio ref={typingRef} src="/audio/intro/peakscore-typing.wav" preload="auto" />

      {/* Negro puro para que los halos/artefactos verdes de los GIF no se noten. */}
      <button
        type="button"
        aria-label={musicOn ? "Silenciar música" : "Activar música"}
        title={musicOn ? "Silenciar música" : "Activar música"}
        onClick={() => setMusicOn((value) => !value)}
        style={{
          position: "fixed",
          top: 18,
          left: 18,
          zIndex: 20,
          display: "grid",
          placeItems: "center",
          width: 42,
          height: 42,
          border: "1px solid #514322",
          background: "#050505",
          color: "#f1c85c",
          fontSize: 20,
        }}
      >
        {musicOn ? "♫" : "♪"}
      </button>

      {!started ? (
        <section style={{ position: "relative", zIndex: 1, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <p style={{ color: "#e4b95e", fontSize: 9, letterSpacing: ".2em", marginBottom: 24 }}>UNA NUEVA AVENTURA COMIENZA</p>
          <h1 className="intro-test-pixel" style={{ fontSize: "clamp(20px, 4vw, 36px)", lineHeight: 1.8, maxWidth: 760, margin: "0 auto 18px" }}>BIENVENIDO A PEAKSCORE</h1>
          <p style={{ color: "#a7a39a", fontSize: 10, lineHeight: 2.2, maxWidth: 520, marginBottom: 32 }}>Founder recibe a Nova, la aventurera que acaba de llegar.</p>
          <button className="intro-test-action" style={{ padding: "17px 24px" }} onClick={() => { setTypingProgress({ key: "", count: 0 }); setStarted(true); }}>▶ COMENZAR</button>
          <p style={{ color: "#5c5a55", fontSize: 8, lineHeight: 2, marginTop: 18 }}>Prueba local: las respuestas no se guardan.</p>
        </section>
      ) : (
        <section style={{ position: "relative", zIndex: 1, minHeight: "100dvh", width: "min(100%, 1040px)", margin: "0 auto", padding: "clamp(18px, 4vh, 42px) clamp(16px, 4vw, 36px) 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "clamp(14px, 3vh, 28px)" }}>
          <div style={{ minHeight: 10 }} aria-hidden="true" />

          <div style={{ minHeight: "clamp(210px, 38vh, 390px)", display: "flex", alignItems: "end", justifyContent: "center", gap: "clamp(22px, 9vw, 120px)", paddingTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Image className="intro-test-character" src="/characters/intro/nova-static-intro.gif" width={1200} height={800} unoptimized alt="Nova, la aventurera, mirando hacia Founder" style={{ width: "clamp(120px, 18vw, 205px)", maxHeight: "34vh", objectFit: "contain", imageRendering: "pixelated", filter: "none" }} />
              <span style={{ color: "#a6a29a", fontSize: 8, letterSpacing: ".14em" }}>NOVA</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Image className="intro-test-character" src={isStory && sceneIndex === 0 ? "/characters/intro/founder-saludo.gif" : "/characters/intro/founder-static.gif"} width={1200} height={800} unoptimized alt="Founder, recibiendo a Nova" style={{ width: "clamp(120px, 18vw, 205px)", maxHeight: "34vh", objectFit: "contain", imageRendering: "pixelated", filter: "none" }} />
              <span style={{ color: "#e4b95e", fontSize: 8, letterSpacing: ".14em" }}>FOUNDER</span>
            </div>
          </div>

          <div style={{ padding: "clamp(18px, 3vw, 30px) 0", minHeight: 155 }}>
            <p className="intro-test-dialogue" style={{ color: "#f5f1e8", fontSize: "clamp(10px, 1.15vw, 13px)", lineHeight: 2.3, maxWidth: 850, margin: "0 auto", textAlign: "center", minHeight: 70 }}>
              {text.slice(0, visibleChars)}{isTyping && <span aria-hidden="true" style={{ color: "#e4b95e", animation: "intro-test-blink 1s steps(2,start) infinite" }}>▌</span>}
            </p>

            {!isStory && !showRecommendation && !isTyping && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 22 }}>
                {currentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected === option}
                    onClick={() => setSelected(option)}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: selected === option ? "#f1c85c" : "#eee9df",
                      padding: "5px 8px",
                      fontSize: "clamp(9px, 1vw, 11px)",
                      lineHeight: 1.9,
                      textAlign: "center",
                      maxWidth: "100%",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <span aria-hidden="true" style={{ display: "inline-block", width: 18, color: "#f1c85c" }}>{selected === option ? "▶" : ""}</span>{option}
                  </button>
                ))}
              </div>
            )}

            {showRecommendation && route && !isTyping && (
              <div style={{ maxWidth: 740, margin: "24px auto 0", textAlign: "center" }}>
                <p style={{ color: "#e4b95e", fontSize: 9, lineHeight: 2, marginBottom: 12 }}>TU PRIMER DESTINO</p>
                <h2 style={{ color: "#f5f1e8", fontSize: "clamp(14px, 2vw, 20px)", lineHeight: 1.8, margin: "0 0 8px" }}>{route.title}</h2>
                <p style={{ color: "#e4b95e", fontSize: 9, lineHeight: 2, marginBottom: 12 }}>{route.subtitle}</p>
                <p style={{ color: "#aaa69d", fontFamily: "var(--font-press-start), monospace", fontSize: 8, lineHeight: 2.4, marginBottom: 14 }}>{route.description}</p>
                <p style={{ color: "#f1c85c", fontSize: 9, lineHeight: 2 }}>▶ {route.firstStep}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 38 }}>
            <button
              type="button"
              onClick={advance}
              disabled={isTyping || (!isStory && !showRecommendation && !selected)}
              style={{
                border: 0,
                background: "transparent",
                color: isTyping || (!isStory && !showRecommendation && !selected) ? "#4b4639" : "#f1c85c",
                opacity: isTyping ? 0.38 : 1,
                cursor: isTyping ? "not-allowed" : "pointer",
                padding: "8px 12px",
                fontSize: "clamp(9px, 1vw, 11px)",
                lineHeight: 1.8,
                letterSpacing: ".02em",
              }}
            >
              {isTyping ? "▶ ESPERA..." : isStory ? "▶ Continuar" : showRecommendation ? "▶ Repetir prueba" : questionIndex === 2 ? "▶ Recomendarme una ruta" : "▶ Siguiente"}
            </button>
          </div>
        </section>
      )}
      <style jsx global>{`@keyframes intro-test-blink { to { visibility: hidden; } }`}</style>
    </main>
  );
}

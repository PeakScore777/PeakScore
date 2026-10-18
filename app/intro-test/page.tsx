"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Scene = { speaker: "FOUNDER"; text: string };

const SCENES: Scene[] = [
  {
    speaker: "FOUNDER",
    text: "¡Ey! ¡Por fin llegaste! Bienvenido a PeakScore, aventurero.",
  },
  {
    speaker: "FOUNDER",
    text: "Soy Founder, el creador de este mundo. Y tú estás a punto de comenzar tu propia aventura.",
  },
  {
    speaker: "FOUNDER",
    text: "Aquí no se trata solamente de responder preguntas. Vas a descubrir tus fortalezas, trabajar en lo que te cuesta y avanzar con cada reto.",
  },
  {
    speaker: "FOUNDER",
    text: "Cada aventurero comienza desde un punto diferente. Antes de continuar, quiero conocer un poco de tu camino.",
  },
];

const QUESTIONS = [
  {
    title: "¿EN QUÉ ETAPA ESTÁS?",
    options: ["GRADO 10", "GRADO 11", "YA ME GRADUÉ", "OTRA SITUACIÓN"],
  },
  {
    title: "¿QUÉ EXPERIENCIA TIENES CON EL ICFES?",
    options: [
      "ESTOY EMPEZANDO",
      "HE PRACTICADO CON SIMULACROS",
      "YA PRESENTÉ EL EXAMEN",
      "LO HE PRESENTADO VARIAS VECES",
    ],
  },
  {
    title: "¿QUÉ QUIERES CONSEGUIR?",
    options: [
      "FORTALECER MIS BASES",
      "MEJORAR EN LO QUE ME CUESTA",
      "SUBIR MI PUNTAJE",
      "PRACTICAR Y MEDIR MI NIVEL",
    ],
  },
  {
    title: "¿CÓMO TE SIENTES CON MATEMÁTICAS?",
    options: [
      "ME CUESTAN",
      "VOY APRENDIENDO",
      "ME SIENTO SEGURO",
      "DEPENDE DEL TEMA",
    ],
  },
];

export default function IntroTestPage() {
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [musicOn, setMusicOn] = useState(true);
  const [typingOn, setTypingOn] = useState(true);
  const [finished, setFinished] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const typingRef = useRef<HTMLAudioElement | null>(null);

  const isStory = sceneIndex < SCENES.length;
  const story = isStory ? SCENES[sceneIndex] : null;
  const text = story?.text ?? (finished
    ? "¡Listo! Esta fue una prueba visual. Tus respuestas no se han guardado."
    : QUESTIONS[questionIndex]?.title ?? "");
  const isTyping = visibleChars < text.length;

  useEffect(() => {
    if (!started || !musicOn || !musicRef.current) return;
    const audio = musicRef.current;
    audio.volume = 0.22;
    void audio.play().catch(() => {});
    return () => audio.pause();
  }, [started, musicOn]);

  useEffect(() => {
    if (!started) return;
    setVisibleChars(0);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 34;
    if (delay === 0) {
      setVisibleChars(text.length);
      return;
    }
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleChars(count);
      if (count >= text.length) window.clearInterval(timer);
    }, delay);
    return () => window.clearInterval(timer);
  }, [started, sceneIndex, questionIndex, finished, text]);

  useEffect(() => {
    const audio = typingRef.current;
    if (!audio || !started || !typingOn || !isTyping || !text.length) {
      if (audio) audio.pause();
      return;
    }
    audio.volume = 0.16;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [started, typingOn, sceneIndex, questionIndex, finished, text, isTyping]);

  const advance = useCallback(() => {
    if (isTyping) {
      setVisibleChars(text.length);
      return;
    }
    if (isStory) {
      setSceneIndex((value) => value + 1);
      return;
    }
    if (finished) {
      setStarted(false);
      setSceneIndex(0);
      setQuestionIndex(0);
      setAnswers([]);
      setSelected("");
      setFinished(false);
      return;
    }
    if (!selected) return;
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = selected;
    setAnswers(nextAnswers);
    setSelected("");
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((value) => value + 1);
    } else {
      setFinished(true);
    }
  }, [isTyping, text, isStory, finished, selected, answers, questionIndex]);

  useEffect(() => {
    if (!started) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
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
        background: "#050505",
        color: "#f5f1e8",
        fontFamily: "var(--font-press-start), monospace",
      }}
    >
      <style jsx global>{`
        .intro-test-shell * { box-sizing: border-box; }
        .intro-test-shell button { font: inherit; cursor: pointer; }
        .intro-test-pixel { font-family: var(--font-press-start), monospace; }
        .intro-test-scanlines {
          background-image: linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px);
          background-size: 100% 4px;
          pointer-events: none;
        }
        .intro-test-choice { border: 1px solid #343434; background: #101010; color: #e8e4db; text-align:left; padding: 15px; line-height: 1.8; transition: border-color .15s, background .15s; }
        .intro-test-choice:hover, .intro-test-choice[aria-pressed="true"] { border-color: #e4b95e; background: #211b10; }
        .intro-test-action { border: 1px solid #d9ad52; color:#f2c76b; background:transparent; padding:12px 16px; font-size:10px; letter-spacing:.06em; }
        .intro-test-action:hover { background:#e4b95e; color:#080808; }
        @media(max-width:640px) {
          .intro-test-character { width: 37vw !important; max-width: 150px !important; }
          .intro-test-dialogue { font-size: 10px !important; line-height: 2.2 !important; }
          .intro-test-shell button { font-size: 9px; }
        }
      `}</style>

      <audio ref={musicRef} src="/audio/intro/peakscore-intro.wav" loop preload="none" />
      <audio ref={typingRef} src="/audio/intro/peakscore-typing.wav" preload="none" />

      <div style={{ position: "absolute", inset: 0, opacity: 0.18, background: "radial-gradient(ellipse at 50% 38%, #342714 0%, transparent 58%)", pointerEvents: "none" }} />
      <div className="intro-test-scanlines" style={{ position: "absolute", inset: 0, opacity: 0.35 }} />

      <header style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px clamp(16px, 4vw, 48px)", borderBottom: "1px solid #222" }}>
        <span style={{ color: "#e4b95e", fontSize: 10, letterSpacing: ".16em" }}>PEAKSCORE</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#686868", fontSize: 8 }}>ESCENA DE PRUEBA</span>
          <button className="intro-test-action" onClick={() => setMusicOn((v) => !v)}>{musicOn ? "♫ MÚSICA: ON" : "♫ MÚSICA: OFF"}</button>
          <button className="intro-test-action" onClick={() => setTypingOn((v) => !v)}>{typingOn ? "⌨ TECLAS: ON" : "⌨ TECLAS: OFF"}</button>
        </div>
      </header>

      {!started ? (
        <section style={{ position: "relative", zIndex: 1, minHeight: "calc(100dvh - 76px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <p style={{ color: "#e4b95e", fontSize: 9, letterSpacing: ".2em", marginBottom: 24 }}>UNA NUEVA AVENTURA COMIENZA</p>
          <h1 className="intro-test-pixel" style={{ fontSize: "clamp(20px, 4vw, 36px)", lineHeight: 1.8, maxWidth: 760, margin: "0 auto 18px" }}>BIENVENIDO A PEAKSCORE</h1>
          <p style={{ color: "#a7a39a", fontSize: 10, lineHeight: 2.2, maxWidth: 520, marginBottom: 32 }}>Prueba de escena narrativa · Founder recibe a Nova, la aventurera que acaba de llegar.</p>
          <button className="intro-test-action" style={{ padding: "17px 24px" }} onClick={() => setStarted(true)}>▶ COMENZAR PRUEBA</button>
          <p style={{ color: "#5c5a55", fontSize: 8, lineHeight: 2, marginTop: 18 }}>La música comienza después de pulsar el botón. Las respuestas no se guardan.</p>
        </section>
      ) : (
        <section style={{ position: "relative", zIndex: 1, minHeight: "calc(100dvh - 76px)", width: "min(100%, 1040px)", margin: "0 auto", padding: "clamp(18px, 4vh, 42px) clamp(16px, 4vw, 36px) 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "clamp(14px, 3vh, 28px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#666", fontSize: 8 }}>
            <span>{isStory ? `DIÁLOGO ${sceneIndex + 1} / ${SCENES.length}` : finished ? "PRUEBA COMPLETADA" : `RUTA INICIAL ${questionIndex + 1} / ${QUESTIONS.length}`}</span>
            <span style={{ color: "#d9b35e" }}>● ● ●</span>
          </div>

          <div style={{ minHeight: "clamp(210px, 38vh, 390px)", display: "flex", alignItems: "end", justifyContent: "center", gap: "clamp(22px, 9vw, 120px)", paddingTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <img className="intro-test-character" src="/characters/intro/nova-static-intro.gif" alt="Nova, la aventurera, mirando hacia Founder" style={{ width: "clamp(120px, 18vw, 205px)", maxHeight: "34vh", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 0 18px rgba(215,174,82,.08))" }} />
              <span style={{ color: "#a6a29a", fontSize: 8, letterSpacing: ".14em" }}>NOVA</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <img className="intro-test-character" src={isStory && sceneIndex === 0 ? "/characters/intro/founder-saludo.gif" : "/characters/intro/founder-static.gif"} alt="Founder, recibiendo a Nova" style={{ width: "clamp(120px, 18vw, 205px)", maxHeight: "34vh", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 0 18px rgba(215,174,82,.08))" }} />
              <span style={{ color: "#e4b95e", fontSize: 8, letterSpacing: ".14em" }}>FOUNDER</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #383126", borderBottom: "1px solid #383126", padding: "clamp(18px, 3vw, 30px) 0", minHeight: 155 }}>
            {isStory ? (
              <p className="intro-test-dialogue" style={{ color: "#f5f1e8", fontSize: "clamp(10px, 1.15vw, 13px)", lineHeight: 2.3, maxWidth: 850, margin: "0 auto", textAlign: "center", minHeight: 70 }}>
                {text.slice(0, visibleChars)}{isTyping && <span style={{ color: "#e4b95e", animation: "intro-test-blink 1s steps(2,start) infinite" }}>▌</span>}
              </p>
            ) : (
              <div style={{ maxWidth: 780, margin: "0 auto" }}>
                <p className="intro-test-dialogue" style={{ color: "#f5f1e8", fontSize: "clamp(10px, 1.1vw, 12px)", lineHeight: 2.2, textAlign: "center", margin: "0 0 18px" }}>
                  {text.slice(0, visibleChars)}{isTyping && <span style={{ color: "#e4b95e" }}>▌</span>}
                </p>
                {!finished && !isTyping && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))", gap: 9 }}>
                    {QUESTIONS[questionIndex].options.map((option) => (
                      <button key={option} className="intro-test-choice" aria-pressed={selected === option} onClick={() => setSelected(option)}>{selected === option ? "▶ " : "　"}{option}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button className="intro-test-action" onClick={() => { setStarted(false); setSceneIndex(0); setQuestionIndex(0); setAnswers([]); setSelected(""); setFinished(false); }}>SALIR DE LA PRUEBA</button>
            <button className="intro-test-action" onClick={advance} disabled={!isStory && !finished && !isTyping && !selected} style={{ opacity: !isStory && !finished && !isTyping && !selected ? .35 : 1 }}>
              {isTyping ? "▶ MOSTRAR TEXTO" : isStory ? "CONTINUAR ▼" : finished ? "REPETIR PRUEBA ↻" : questionIndex === QUESTIONS.length - 1 ? "TERMINAR ▶" : "SIGUIENTE ▶"}
            </button>
          </div>
        </section>
      )}
      <style jsx global>{`@keyframes intro-test-blink { to { visibility: hidden; } }`}</style>
    </main>
  );
}

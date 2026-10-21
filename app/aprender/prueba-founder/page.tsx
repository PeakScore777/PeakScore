"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/founder-intro.mp3";
const GREETING_SRC = "/characters/founder/founder-saludo.png";
const SELF_INTRO_SRC = "/characters/founder/founder-soy-yo.png";
const DURATION_SECONDS = 48.51;

// Cambia aquí los tiempos cuando terminemos de marcar el guion del audio.
const SCENES = [
  { start: 0, end: 3.6, image: GREETING_SRC, label: "Saludo" },
  { start: 3.6, end: DURATION_SECONDS, image: SELF_INTRO_SRC, label: "Founder se presenta" },
] as const;

export default function FounderAudioLessonPilot() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(DURATION_SECONDS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const scene = SCENES.find(
    (item) => currentTime >= item.start && currentTime < item.end,
  ) ?? SCENES[SCENES.length - 1];

  useEffect(() => {
    setImageFailed(false);
  }, [scene.image]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = Math.floor(safeSeconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#080914] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
            PeakScore · Aprender
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Conoce a tu guía
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Escucha la presentación del Founder. Su imagen cambia según el momento
            de la explicación, sin GIF ni animaciones por fotogramas.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <div className="rounded-2xl border border-violet-400/20 bg-[#111326] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
              Presentación · Nivel 1
            </p>
            <h2 className="mt-2 text-xl font-bold">Escucha la exposición</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Puedes pausar, reanudar o moverte a cualquier parte del audio.
              La pose del Founder se selecciona automáticamente por tiempo.
            </p>

            <audio
              ref={audioRef}
              src={AUDIO_SRC}
              preload="metadata"
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => {
                const audioDuration = event.currentTarget.duration;
                if (Number.isFinite(audioDuration) && audioDuration > 0) {
                  setDuration(audioDuration);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="sr-only"
            />

            <div className="mt-6 rounded-xl border border-white/10 bg-[#090b18] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{scene.label}</span>
                <span className="font-mono text-xs text-slate-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <input
                aria-label="Posición del audio"
                type="range"
                min={0}
                max={duration || DURATION_SECONDS}
                step={0.1}
                value={Math.min(currentTime, duration || DURATION_SECONDS)}
                onChange={(event) => seek(Number(event.target.value))}
                className="mt-4 w-full accent-violet-400"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {isPlaying ? "Pausar" : currentTime > 0 ? "Continuar" : "Reproducir"}
                </button>
                <button
                  type="button"
                  onClick={() => seek(0)}
                  className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  Volver al inicio
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Prototipo funcional: el saludo ocupa los primeros 3,6 segundos y
              luego aparece la pose de presentación. Ajustaremos los demás cambios
              cuando terminemos de marcar las frases del audio.
            </p>
          </div>

          <aside className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-violet-400/20 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.2),transparent_60%),#111326] p-5">
            <div className="mb-3 flex w-full items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                Founder
              </span>
              <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
                {scene.label}
              </span>
            </div>
            {!imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={scene.image}
                src={scene.image}
                alt={`Founder: ${scene.label.toLowerCase()}`}
                onError={() => setImageFailed(true)}
                className="max-h-[440px] w-full max-w-[300px] object-contain [image-rendering:pixelated]"
              />
            ) : (
              <div className="flex min-h-[280px] w-full max-w-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-rose-300/40 p-6 text-center">
                <p className="font-bold text-rose-200">Falta el PNG del Founder</p>
                <p className="mt-2 break-all text-xs leading-5 text-slate-300">
                  Añade el archivo: {scene.image}
                </p>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              PNG estático · Fondo transparente recomendado
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

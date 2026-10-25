"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle, Volume2, VolumeX, Waves } from "lucide-react";

const IMAGE_WIDTH = 1672;
const IMAGE_HEIGHT = 941;

const WINDOW_MASK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">
  <g fill="white">
    <rect x="466" y="101" width="144" height="160"/>
    <rect x="646" y="101" width="141" height="160"/>
    <rect x="847" y="101" width="138" height="160"/>
    <rect x="1021" y="101" width="134" height="160"/>
    <rect x="466" y="303" width="144" height="101"/>
    <rect x="647" y="303" width="141" height="101"/>
    <rect x="847" y="303" width="138" height="101"/>
    <rect x="1021" y="303" width="134" height="101"/>
    <rect x="480" y="447" width="128" height="149"/>
    <rect x="647" y="447" width="141" height="149"/>
    <rect x="848" y="447" width="137" height="149"/>
    <rect x="1022" y="447" width="132" height="149"/>
  </g>
</svg>`;

const WINDOW_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(WINDOW_MASK_SVG)}")`;

type LightingStage = 0 | 1 | 2 | 3;
type RainFxInstance = {
  start: () => Promise<void> | void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
};
type RainFxConstructor = new (options: Record<string, unknown>) => RainFxInstance;

type Props = {
  canStart: boolean;
  busyStarting: boolean;
  error: string | null;
  caseCount: number;
  onStart: () => void;
};

export default function CasoCeroCinematicScene({
  canStart,
  busyStarting,
  error,
  caseCount,
  onStart,
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ambienceAudioRef = useRef<HTMLAudioElement | null>(null);
  const windowRainAudioRef = useRef<HTMLAudioElement | null>(null);
  const mysteryMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lightingStage, setLightingStage] = useState<LightingStage>(0);
  const [sceneVideoFailed, setSceneVideoFailed] = useState(false);
  const [rainFxFailed, setRainFxFailed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [mediaBox, setMediaBox] = useState({ left: 0, top: 0, width: IMAGE_WIDTH, height: IMAGE_HEIGHT });

  useEffect(() => {
    const firstLamp = window.setTimeout(() => setLightingStage(1), 450);
    const lampOut = window.setTimeout(() => setLightingStage(2), 1650);
    const allLights = window.setTimeout(() => setLightingStage(3), 2250);
    return () => {
      window.clearTimeout(firstLamp);
      window.clearTimeout(lampOut);
      window.clearTimeout(allLights);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scale = Math.max(rect.width / IMAGE_WIDTH, rect.height / IMAGE_HEIGHT);
      const width = IMAGE_WIDTH * scale;
      const height = IMAGE_HEIGHT * scale;
      setMediaBox({
        left: (rect.width - width) / 2,
        top: (rect.height - height) / 2,
        width,
        height,
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let starting = false;
    let instance: RainFxInstance | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (instance) instance.resize(width, height);
      }
      return true;
    };

    const initialiseRain = async () => {
      if (disposed || starting || instance || !resizeCanvas()) return;
      starting = true;
      try {
        const imported: unknown = await import("raindrop-fx");
        const moduleValue = imported as { default?: unknown };
        const RainDropFX = (moduleValue.default ?? imported) as RainFxConstructor;
        const nextInstance = new RainDropFX({
          canvas,
          windowMode: true,
          windowOverlayColor: [0.008, 0.014, 0.024, 0.24],
          mist: false,
          spawnInterval: [0.09, 0.22],
          spawnSize: [24, 58],
          spawnLimit: 650,
          dropletsPerSeconds: 100,
          dropletSize: [7, 22],
          backgroundBlurSteps: 2,
          raindropCompose: "smoother",
        });

        if (disposed) {
          nextInstance.destroy();
          return;
        }
        instance = nextInstance;
        await instance.start();
      } catch {
        if (!disposed) setRainFxFailed(true);
      } finally {
        starting = false;
      }
    };

    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      if (!instance) void initialiseRain();
    });
    resizeObserver.observe(canvas);
    void initialiseRain();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      instance?.destroy();
      instance = null;
    };
  }, []);

  useEffect(() => () => {
    const tracks = [ambienceAudioRef.current, windowRainAudioRef.current, mysteryMusicAudioRef.current];
    for (const track of tracks) {
      if (!track) continue;
      track.pause();
      track.currentTime = 0;
    }
  }, []);

  const toggleAudio = async () => {
    const tracks = [
      { audio: ambienceAudioRef.current, volume: 0.42 },
      { audio: windowRainAudioRef.current, volume: 0.31 },
      { audio: mysteryMusicAudioRef.current, volume: 0.19 },
    ].filter((track): track is { audio: HTMLAudioElement; volume: number } => track.audio !== null);

    if (audioEnabled) {
      for (const track of tracks) track.audio.pause();
      setAudioEnabled(false);
      setAudioError(false);
      return;
    }

    try {
      for (const track of tracks) {
        track.audio.loop = true;
        track.audio.volume = track.volume;
        track.audio.muted = false;
      }
      await Promise.all(tracks.map(({ audio }) => audio.play()));
      setAudioEnabled(true);
      setAudioError(false);
    } catch {
      for (const track of tracks) track.audio.pause();
      setAudioEnabled(false);
      setAudioError(true);
    }
  };

  const maskStyle = {
    WebkitMaskImage: WINDOW_MASK,
    maskImage: WINDOW_MASK,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  } as const;

  return (
    <main
      ref={rootRef}
      aria-label="Caso Cero, laboratorio nocturno"
      className="caso-cero-cinematic relative h-[calc(100svh-48px)] min-h-[540px] w-full overflow-hidden bg-[#030609] text-white"
    >
      <div
        className="absolute overflow-hidden"
        style={{
          left: mediaBox.left,
          top: mediaBox.top,
          width: mediaBox.width,
          height: mediaBox.height,
        }}
      >
        {!sceneVideoFailed ? (
          <video
            className="absolute inset-0 h-full w-full object-fill"
            src="/videos/caso-cero/rio-nocturno.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setSceneVideoFailed(true)}
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_92%,rgba(41,72,78,.42),transparent_50%),linear-gradient(180deg,#03080e,#07131a_65%,#0b181a)]"
          />
        )}

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="caso-cero-rain-canvas pointer-events-none absolute inset-0 h-full w-full"
          style={maskStyle}
        />

        {rainFxFailed && (
          <div
            aria-hidden="true"
            className="caso-cero-rain-fallback pointer-events-none absolute inset-0 overflow-hidden"
            style={maskStyle}
          >
            {Array.from({ length: 48 }, (_, index) => (
              <span
                key={index}
                className="caso-cero-fallback-drop absolute block rounded-full"
                style={{
                  left: ((index * 43) % 98) + "%",
                  top: ((index * 29) % 94) + "%",
                  height: 14 + ((index * 7) % 21) + "px",
                  animationDelay: "-" + (((index * 11) % 25) / 3) + "s",
                  animationDuration: 2.1 + ((index * 5) % 14) / 10 + "s",
                }}
              />
            ))}
          </div>
        )}

        <img
          src="/images/backgrounds/caso-cero/escena-apagada.png"
          alt=""
          draggable={false}
          className="caso-cero-light-layer absolute inset-0 h-full w-full object-fill"
        />
        <img
          src="/images/backgrounds/caso-cero/escena-lampara-derecha.png"
          alt=""
          draggable={false}
          className={
            "caso-cero-light-layer caso-cero-right-lamp absolute inset-0 h-full w-full object-fill " +
            (lightingStage === 1 ? "is-flickering " : "") +
            (lightingStage === 1 ? "is-visible" : "")
          }
        />
        <img
          src="/images/backgrounds/caso-cero/escena-encendida.png"
          alt=""
          draggable={false}
          className={
            "caso-cero-light-layer caso-cero-all-lights absolute inset-0 h-full w-full object-fill " +
            (lightingStage === 3 ? "is-visible" : "")
          }
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,5,8,.10)_0%,transparent_22%,transparent_65%,rgba(2,5,8,.55)_100%)]" />

      <Link
        href="/aprender/juegos"
        className="absolute left-3 top-3 z-30 inline-flex min-h-10 items-center gap-2 border border-[#a88b5b]/60 bg-[#070c11]/75 px-3 py-2 text-[10px] font-bold text-[#f2e7d3] shadow-lg backdrop-blur-md transition hover:border-[#e6bd72] sm:left-5 sm:top-5 sm:text-xs"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos los juegos
      </Link>

      <button
        type="button"
        onClick={() => void toggleAudio()}
        aria-pressed={audioEnabled}
        aria-label={audioEnabled ? "Silenciar ambiente" : "Activar ambiente"}
        className="absolute right-3 top-3 z-30 inline-flex min-h-10 items-center gap-2 border border-[#a88b5b]/60 bg-[#070c11]/75 px-3 py-2 text-[10px] font-bold text-[#f2e7d3] shadow-lg backdrop-blur-md transition hover:border-[#e6bd72] sm:right-5 sm:top-5 sm:text-xs"
      >
        {audioEnabled ? <Volume2 className="h-4 w-4 text-[#e5bd76]" /> : <VolumeX className="h-4 w-4" />}
        <span className="hidden sm:inline">{audioEnabled ? "Ambiente activo" : "Activar ambiente"}</span>
      </button>

      <section className="absolute bottom-4 left-3 z-30 w-[min(390px,calc(100%-24px))] sm:bottom-7 sm:left-7">
        <div className="border border-[#b28a4e]/65 bg-[#061016]/82 p-4 shadow-[0_16px_45px_rgba(0,0,0,.48)] backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#a4cfc5] sm:text-[10px]">
            <Waves className="h-4 w-4" />
            Investigación Saber 11 · Archivo 001
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-wide text-[#f6e7cb] sm:text-3xl">
            CASO CERO<span className="text-[#dda953]">.</span>
          </h1>
          <p className="mt-2 text-xs leading-5 text-[#d0d9df] sm:text-sm">
            La lluvia golpea el cristal. Examina las pistas, compara los datos y descubre qué conclusión respalda la evidencia.
          </p>
          {audioError && (
            <p role="status" className="mt-2 text-[10px] leading-4 text-[#f2c68c]">El navegador no permitió iniciar el ambiente. Pulsa de nuevo «Activar ambiente».</p>
          )}
          {error && (
            <p role="alert" className="mt-3 border border-[#9d5749] bg-[#2b1716]/90 px-3 py-2 text-xs text-[#ffd1c6]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart || busyStarting}
            className="mt-4 inline-flex min-h-12 items-center justify-center gap-3 border-2 border-[#f2cc7f] bg-[#bd7729] px-4 py-3 text-[10px] font-black text-[#fff8eb] shadow-[3px_3px_0_#4e2c11] transition hover:bg-[#d28c3d] disabled:cursor-not-allowed disabled:opacity-55 sm:text-xs"
          >
            {busyStarting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busyStarting ? "PREPARANDO EXPEDIENTE…" : canStart ? "INICIAR INVESTIGACIÓN" : "PREPARANDO ARCHIVO…"}
          </button>
          <div className="mt-3 border-t border-[#57452e]/80 pt-3 text-[9px] text-[#9eacbd]">
            {caseCount >= 10 ? "10 expedientes listos para investigar" : "Cargando expedientes…"}
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-4 right-5 z-20 hidden items-center gap-2 text-[9px] font-semibold tracking-[.14em] text-white/65 lg:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b7dacf]" />
        LLUVIA EN VIVO · RÍO NOCTURNO
      </div>

      <audio ref={ambienceAudioRef} src="/audio/caso-cero/ambiente-rio-lluvia.wav" preload="none" loop className="hidden" aria-hidden="true" />
      <audio ref={windowRainAudioRef} src="/audio/caso-cero/lluvia-ventana.wav" preload="none" loop className="hidden" aria-hidden="true" />
      <audio ref={mysteryMusicAudioRef} src="/audio/caso-cero/musica-misterio.wav" preload="none" loop className="hidden" aria-hidden="true" />

      <style jsx>{`
        .caso-cero-light-layer {
          opacity: 0;
          transition: opacity 220ms ease;
          pointer-events: none;
          user-select: none;
        }

        .caso-cero-all-lights {
          transition-duration: 1050ms;
        }

        .caso-cero-light-layer:first-of-type {
          opacity: 1;
        }

        .caso-cero-right-lamp.is-visible,
        .caso-cero-all-lights.is-visible {
          opacity: 1;
        }

        .caso-cero-right-lamp.is-flickering {
          animation: caso-cero-light-flicker 1150ms ease-out both;
        }

        .caso-cero-fallback-drop {
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(225, 240, 255, .88) 42%, rgba(170, 210, 240, .12));
          filter: drop-shadow(0 0 2px rgba(160, 209, 245, .45));
          animation: caso-cero-rain-fall linear infinite;
        }

        @keyframes caso-cero-light-flicker {
          0% { filter: brightness(.52); }
          11% { filter: brightness(1.48); }
          17% { filter: brightness(.68); }
          27% { filter: brightness(1.31); }
          34% { filter: brightness(.82); }
          44% { filter: brightness(1.18); }
          58% { filter: brightness(.93); }
          72% { filter: brightness(1.06); }
          100% { filter: brightness(1); }
        }

        @keyframes caso-cero-rain-fall {
          from { transform: translate3d(2px, -24px, 0); }
          to { transform: translate3d(-3px, 145px, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .caso-cero-light-layer {
            transition: none;
          }
          .caso-cero-right-lamp.is-flickering,
          .caso-cero-fallback-drop {
            animation: none !important;
          }
        }

        @media (max-width: 640px) {
          .caso-cero-cinematic {
            min-height: calc(100svh - 48px);
          }
        }
      `}</style>
    </main>
  );
}

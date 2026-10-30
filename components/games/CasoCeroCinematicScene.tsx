"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle, Waves } from "lucide-react";
import CasoCeroLoadingSkeleton from "@/components/games/CasoCeroLoadingSkeleton";
import CasoCeroEvidenceClothesline from "@/components/games/CasoCeroEvidenceClothesline";

const IMAGE_WIDTH = 1672;
const IMAGE_HEIGHT = 941;

// Coordinates are relative to the window's own bounding box rather than
// the full illustration, keeping the rain effects clipped to the panes.
const WINDOW_MASK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="689" height="495" viewBox="0 0 689 495">
  <g fill="white">
    <rect x="0" y="0" width="144" height="160"/>
    <rect x="180" y="0" width="141" height="160"/>
    <rect x="381" y="0" width="138" height="160"/>
    <rect x="555" y="0" width="134" height="160"/>
    <rect x="0" y="202" width="144" height="101"/>
    <rect x="181" y="202" width="141" height="101"/>
    <rect x="381" y="202" width="138" height="101"/>
    <rect x="555" y="202" width="134" height="101"/>
    <rect x="14" y="346" width="128" height="149"/>
    <rect x="181" y="346" width="141" height="149"/>
    <rect x="382" y="346" width="137" height="149"/>
    <rect x="556" y="346" width="132" height="149"/>
  </g>
</svg>`;

const WINDOW_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(WINDOW_MASK_SVG)}")`;
const WINDOW_BOUNDS_STYLE = {
  left: "27.87%",
  top: "10.73%",
  width: "41.21%",
  height: "52.60%",
} as const;

type LightingStage = 0 | 1 | 2 | 3;
type Props = {
  canStart: boolean;
  busyStarting: boolean;
  error: string | null;
  caseCount: number;
  onStart: () => void;
  onSceneReady: () => void;
  onUserInteraction: () => void;
};

export default function CasoCeroCinematicScene({
  canStart,
  busyStarting,
  error,
  caseCount,
  onStart,
  onSceneReady,
  onUserInteraction,
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [lightingStage, setLightingStage] = useState<LightingStage>(0);
  const [lightLayersReady, setLightLayersReady] = useState([false, false, false]);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneReadyRef = useRef(false);
  const [baseLayerReady, leftLampLayerReady, rightLampLayerReady] = lightLayersReady;
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(true);
  const [mediaBox, setMediaBox] = useState({ left: 0, top: 0, width: IMAGE_WIDTH, height: IMAGE_HEIGHT });

  const markLightLayerReady = (index: number) => {
    setLightLayersReady((previous) =>
      previous.map((isReady, layerIndex) => layerIndex === index ? true : isReady),
    );

    if (index === 0 && !sceneReadyRef.current) {
      sceneReadyRef.current = true;
      setSceneReady(true);
      onSceneReady();
    }
  };

  useEffect(() => {
    // Reveal the lighting sequence only when its two overlay images are ready.
    // The base scene can be shown earlier while they finish optimizing/loading.
    if (!sceneReady || !leftLampLayerReady || !rightLampLayerReady) return;

    const firstLamp = window.setTimeout(() => setLightingStage(1), 450);
    const lampOut = window.setTimeout(() => setLightingStage(2), 1650);
    const allLights = window.setTimeout(() => setLightingStage(3), 2250);
    return () => {
      window.clearTimeout(firstLamp);
      window.clearTimeout(lampOut);
      window.clearTimeout(allLights);
    };
  }, [sceneReady, leftLampLayerReady, rightLampLayerReady]);

  useEffect(() => {
    if (!sceneReady) return;
    const fadeOutTimer = window.setTimeout(() => setShowLoadingSkeleton(false), 420);
    return () => window.clearTimeout(fadeOutTimer);
  }, [sceneReady]);

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
      onPointerDownCapture={onUserInteraction}
      onKeyDownCapture={onUserInteraction}
      onClickCapture={onUserInteraction}
      className="caso-cero-cinematic relative w-full overflow-hidden bg-[#030609] text-white"
      style={{
        height: "calc(100svh - 48px)",
        minHeight: "min(540px, calc(100svh - 48px))",
      }}
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
        {/* Solid dark backing for all window panes: no video, network fetch, or decoder. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#030609]" />
        {/* Lightweight CSS rain replaces a second WebGL renderer and live refraction. */}
        <div
          aria-hidden="true"
          className="caso-cero-rain-fallback pointer-events-none absolute overflow-hidden"
          style={{ ...WINDOW_BOUNDS_STYLE, ...maskStyle }}
        >
          {Array.from({ length: 32 }, (_, index) => (
            <span
              key={index}
              className="caso-cero-fallback-drop absolute block rounded-full"
              style={{
                left: ((index * 43) % 98) + "%",
                top: ((index * 29) % 94) + "%",
                height: 14 + ((index * 7) % 21) + "px",
                animationDelay: "-" + (((index * 11) % 25) / 3) + "s",
                animationDuration: 2.8 + ((index * 5) % 12) / 10 + "s",
              }}
            />
          ))}
        </div>


        {/* Fogged, damp glass texture: masked to the twelve transparent panes only. */}
        <div
          aria-hidden="true"
          className="caso-cero-glass-humidity pointer-events-none absolute"
          style={{ ...WINDOW_BOUNDS_STYLE, ...maskStyle }}
        />
        <div
          aria-hidden="true"
          className="caso-cero-glass-streaks pointer-events-none absolute overflow-hidden"
          style={{ ...WINDOW_BOUNDS_STYLE, ...maskStyle }}
        >
          {Array.from({ length: 56 }, (_, index) => (
            <span
              key={index}
              className="caso-cero-wet-streak absolute block rounded-full"
              style={{
                left: ((index * 47) % 98) + "%",
                top: ((index * 31) % 96) + "%",
                height: 22 + ((index * 17) % 48) + "px",
                width: 1 + (index % 3 === 0 ? 1 : 0) + "px",
                opacity: 0.22 + ((index * 7) % 9) / 35,
                animationDelay: "-" + ((index * 13) % 70) / 5 + "s",
                animationDuration: 5.5 + ((index * 7) % 70) / 10 + "s",
              }}
            />
          ))}
        </div>


        <Image
          src="/images/backgrounds/caso-cero/escena-apagada.png"
          alt=""
          draggable={false}
          fill
          sizes="100vw"
          quality={85}
          preload
          className="caso-cero-light-layer object-fill"
          onLoad={() => markLightLayerReady(0)}
          onError={() => markLightLayerReady(0)}
        />
        <Image
          src="/images/backgrounds/caso-cero/escena-lampara-derecha.png"
          alt=""
          draggable={false}
          fill
          sizes="100vw"
          quality={85}
          className={
            "caso-cero-light-layer caso-cero-right-lamp object-fill " +
            (lightingStage === 1 ? "is-flickering " : "") +
            (lightingStage === 1 ? "is-visible" : "")
          }
          onLoad={() => markLightLayerReady(1)}
          onError={() => markLightLayerReady(1)}
        />
        <Image
          src="/images/backgrounds/caso-cero/escena-encendida.png"
          alt=""
          draggable={false}
          fill
          sizes="100vw"
          quality={85}
          className={
            "caso-cero-light-layer caso-cero-all-lights object-fill " +
            (lightingStage === 3 ? "is-visible" : "")
          }
          onLoad={() => markLightLayerReady(2)}
          onError={() => markLightLayerReady(2)}
        />
      </div>

      {/* Three independent science clues hanging from twine, above the window layer. */}
      <CasoCeroEvidenceClothesline />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,5,8,.10)_0%,transparent_22%,transparent_65%,rgba(2,5,8,.55)_100%)]" />

      <Link
        href="/aprender/juegos"
        className="absolute left-3 top-3 z-30 inline-flex min-h-10 items-center gap-2 border border-[#a88b5b]/60 bg-[#070c11]/75 px-3 py-2 text-[10px] font-bold text-[#f2e7d3] shadow-lg backdrop-blur-md transition hover:border-[#e6bd72] sm:left-5 sm:top-5 sm:text-xs"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos los juegos
      </Link>

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
        LLUVIA SOBRE EL CRISTAL
      </div>

      {showLoadingSkeleton && (
        <div
          aria-hidden={sceneReady}
          className={[
            "absolute inset-0 z-50 transition-opacity duration-500 ease-out",
            sceneReady ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <CasoCeroLoadingSkeleton overlay />
        </div>
      )}

      <style jsx>{`
        .caso-cero-glass-humidity {
          opacity: .68;
          background:
            radial-gradient(ellipse at 21% 18%, rgba(220, 238, 246, .20), transparent 17%),
            radial-gradient(ellipse at 77% 68%, rgba(186, 215, 231, .15), transparent 25%),
            radial-gradient(ellipse at 48% 42%, rgba(201, 228, 240, .10), transparent 42%),
            linear-gradient(115deg, rgba(226, 244, 250, .06), transparent 24%, rgba(180, 214, 231, .08) 71%, transparent);
          mix-blend-mode: screen;
        }

        .caso-cero-wet-streak {
          background: linear-gradient(
            180deg,
            rgba(220, 241, 252, .04),
            rgba(216, 238, 249, .45) 36%,
            rgba(237, 248, 255, .78) 52%,
            rgba(194, 224, 241, .20) 82%,
            transparent
          );
          box-shadow: 0 0 3px rgba(201, 230, 245, .22);
          filter: blur(.12px);
          animation: caso-cero-wet-glass-slide linear infinite;
        }

        .caso-cero-wet-streak::after {
          content: "";
          position: absolute;
          left: -1px;
          bottom: 1px;
          width: 3px;
          height: 4px;
          border-radius: 50%;
          background: rgba(228, 245, 255, .52);
          box-shadow: 0 0 4px rgba(205, 234, 250, .38);
        }

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

        @keyframes caso-cero-wet-glass-slide {
          0% { transform: translate3d(1px, -54px, 0); }
          100% { transform: translate3d(-3px, 145px, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .caso-cero-light-layer {
            transition: none;
          }
          .caso-cero-right-lamp.is-flickering,
          .caso-cero-fallback-drop,
          .caso-cero-wet-streak {
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

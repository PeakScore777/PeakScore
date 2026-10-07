"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type ViewId =
  | "front"
  | "three-left"
  | "side-left"
  | "side-right"
  | "three-right"
  | "back";

type SpriteLayerConfig = {
  width: number;
  x: number;
  y: number;
};

type CharacterComposition = {
  body: SpriteLayerConfig;
  head: SpriteLayerConfig;
  hair: SpriteLayerConfig;
};

const views: { id: ViewId; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "three-left", label: "3/4 Izq." },
  { id: "side-left", label: "Perfil Izq." },
  { id: "side-right", label: "Perfil Der." },
  { id: "three-right", label: "3/4 Der." },
  { id: "back", label: "Espalda" },
];

const assets: Record<
  ViewId,
  {
    body: string;
    head: string;
    hair: string;
  }
> = {
  front: {
    body: "/characters/peaky-nova/body/front.png",
    head: "/characters/peaky-nova/head/front.png",
    hair: "/characters/peaky-nova/hair/front.png",
  },
  "three-left": {
    body: "/characters/peaky-nova/body/three-quarter-left.png",
    head: "/characters/peaky-nova/head/three-quarter-left.png",
    hair: "/characters/peaky-nova/hair/three-quarter-left.png",
  },
  "side-left": {
    body: "/characters/peaky-nova/body/side-left.png",
    head: "/characters/peaky-nova/head/side-left.png",
    hair: "/characters/peaky-nova/hair/side-left.png",
  },
  "side-right": {
    body: "/characters/peaky-nova/body/side-right.png",
    head: "/characters/peaky-nova/head/side-right.png",
    hair: "/characters/peaky-nova/hair/side-right.png",
  },
  "three-right": {
    body: "/characters/peaky-nova/body/three-quarter-right.png",
    head: "/characters/peaky-nova/head/three-quarter-right.png",
    hair: "/characters/peaky-nova/hair/three-quarter-right.png",
  },
  back: {
    body: "/characters/peaky-nova/body/back.png",
    head: "/characters/peaky-nova/head/back.png",
    hair: "/characters/peaky-nova/hair/back.png",
  },
};

/*
 * Posiciones internas del sistema.
 * El usuario nunca tiene que mover HEAD o HAIR manualmente.
 */
const composition: Record<ViewId, CharacterComposition> = {
  front: {
    body: { width: 270, x: 0, y: 0 },
    head: { width: 138, x: 0, y: -153 },
    hair: { width: 177, x: 0, y: -196 },
  },
  "three-left": {
    body: { width: 257, x: 0, y: 0 },
    head: { width: 135, x: -2, y: -151 },
    hair: { width: 176, x: -4, y: -194 },
  },
  "side-left": {
    body: { width: 232, x: 2, y: 0 },
    head: { width: 130, x: -6, y: -147 },
    hair: { width: 170, x: -8, y: -190 },
  },
  "side-right": {
    body: { width: 232, x: -2, y: 0 },
    head: { width: 130, x: 6, y: -147 },
    hair: { width: 170, x: 8, y: -190 },
  },
  "three-right": {
    body: { width: 257, x: 0, y: 0 },
    head: { width: 135, x: 2, y: -151 },
    hair: { width: 176, x: 4, y: -194 },
  },
  back: {
    body: { width: 270, x: 0, y: 0 },
    head: { width: 138, x: 0, y: -151 },
    hair: { width: 178, x: 0, y: -196 },
  },
};

const MIN_POSITION = -190;
const MAX_POSITION = 190;
const POSITION_STEP = 24;

function CharacterLayer({
  src,
  config,
  positionX,
  zIndex,
}: {
  src: string;
  config: SpriteLayerConfig;
  positionX: number;
  zIndex: number;
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={512}
      height={512}
      unoptimized
      className="pointer-events-none absolute h-auto max-w-none select-none"
      style={{
        width: config.width + "px",
        left: "calc(50% + " + (positionX + config.x) + "px)",
        top: "calc(50% + " + config.y + "px)",
        transform: "translate(-50%, -50%)",
        transformOrigin: "center center",
        imageRendering: "pixelated",
        zIndex,
      }}
    />
  );
}

export default function CharacterTestPage() {
  const [view, setView] = useState<ViewId>("front");
  const [positionX, setPositionX] = useState(0);

  const currentAssets = assets[view];
  const currentComposition = useMemo(
    () => composition[view],
    [view],
  );

  const moveCharacter = (direction: -1 | 1) => {
    setPositionX((current) =>
      Math.max(
        MIN_POSITION,
        Math.min(
          MAX_POSITION,
          current + direction * POSITION_STEP,
        ),
      ),
    );
  };

  const resetPosition = () => setPositionX(0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020814] text-white">
      <div className="mx-auto min-h-screen max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300/80">
              PeakScore · Character Lab
            </p>

            <h1 className="mt-1 font-mono text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Peaky Nova
            </h1>

            <p className="mt-1 font-mono text-[11px] text-white/40">
              Ensamblaje automático · BODY + HEAD + HAIR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[9px] text-white/30 sm:block">
              Vista:{" "}
              {views.find((item) => item.id === view)?.label}
            </span>

            <button
              type="button"
              onClick={resetPosition}
              className="
                inline-flex items-center gap-2 rounded-lg border border-white/10
                bg-white/[0.03] px-3 py-2 font-mono text-[9px] font-black
                uppercase tracking-[0.12em] text-white/45 transition
                hover:border-white/20 hover:bg-white/[0.06] hover:text-white
              "
            >
              <RotateCcw size={13} />
              Centrar
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#071426]/85 shadow-[0_30px_100px_rgba(0,0,0,.35)]">
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`
                    rounded-lg border px-3 py-2 font-mono text-[9px] font-black uppercase
                    transition
                    ${view === item.id
                      ? "border-cyan-300/60 bg-cyan-300/[0.08] text-cyan-200"
                      : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white"}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="
              relative flex min-h-[680px] items-center justify-center
              overflow-hidden
              bg-[radial-gradient(circle_at_50%_34%,rgba(34,211,238,.10),transparent_25%),linear-gradient(180deg,#071426_0%,#040d1a_63%,#020711_100%)]
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-x-0 bottom-0 h-[40%]
                border-t border-cyan-300/10
                bg-[linear-gradient(180deg,rgba(34,211,238,.03),rgba(0,0,0,.17))]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-x-0 bottom-0 h-[40%] opacity-35
                [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)]
                [background-size:52px_52px]
                [mask-image:linear-gradient(to_bottom,transparent,black_30%)]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute bottom-[54px] left-1/2
                h-7 w-[300px] -translate-x-1/2 rounded-[50%]
                bg-black/45 blur-xl
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute bottom-[49px] left-1/2
                h-px w-[470px] -translate-x-1/2
                bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent
              "
            />

            <div className="relative z-20 h-[570px] w-full max-w-[760px]">
              <CharacterLayer
                src={currentAssets.body}
                config={currentComposition.body}
                positionX={positionX}
                zIndex={10}
              />

              <CharacterLayer
                src={currentAssets.head}
                config={currentComposition.head}
                positionX={positionX}
                zIndex={20}
              />

              <CharacterLayer
                src={currentAssets.hair}
                config={currentComposition.hair}
                positionX={positionX}
                zIndex={30}
              />
            </div>

            <button
              type="button"
              onClick={() => moveCharacter(-1)}
              disabled={positionX <= MIN_POSITION}
              aria-label="Mover Peaky a la izquierda"
              className="
                absolute left-4 top-1/2 z-40 flex h-14 w-14 -translate-y-1/2
                items-center justify-center rounded-xl border border-white/10
                bg-[#061426]/90 text-white/45 backdrop-blur-xl transition
                hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]
                hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-20
              "
            >
              <ChevronLeft size={25} />
            </button>

            <button
              type="button"
              onClick={() => moveCharacter(1)}
              disabled={positionX >= MAX_POSITION}
              aria-label="Mover Peaky a la derecha"
              className="
                absolute right-4 top-1/2 z-40 flex h-14 w-14 -translate-y-1/2
                items-center justify-center rounded-xl border border-white/10
                bg-[#061426]/90 text-white/45 backdrop-blur-xl transition
                hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]
                hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-20
              "
            >
              <ChevronRight size={25} />
            </button>

            <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/10 bg-[#020814]/80 px-3 py-1.5 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-white/30 backdrop-blur">
              Posición {positionX > 0 ? "+" : ""}
              {positionX}
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#06101f]/75 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["BODY", "base del personaje"],
                ["HEAD", "pieza facial"],
                ["HAIR", "capa superior"],
              ].map(([label, description]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <p className="font-mono text-[9px] font-black uppercase text-cyan-300/70">
                    {label}
                  </p>

                  <p className="mt-1 font-mono text-[9px] text-white/30">
                    {description}
                  </p>

                  <p className="mt-2 font-mono text-[8px] text-white/20">
                    posición automática
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

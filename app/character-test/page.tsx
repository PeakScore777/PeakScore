"use client";

import { useState } from "react";

type ViewId =
  | "front"
  | "three-left"
  | "side-left"
  | "side-right"
  | "three-right"
  | "back";

type Offset = {
  scale: number;
  x: number;
  y: number;
};

const views: { id: ViewId; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "three-left", label: "3/4 Izq." },
  { id: "side-left", label: "Perfil Izq." },
  { id: "side-right", label: "Perfil Der." },
  { id: "three-right", label: "3/4 Der." },
  { id: "back", label: "Espalda" },
];

const viewIndex: Record<ViewId, number> = {
  front: 0,
  "three-left": 1,
  "side-left": 2,
  "side-right": 3,
  "three-right": 4,
  back: 5,
};

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

const initial: Offset = { scale: 100, x: 0, y: 0 };

function SpriteLayer({
  src,
  offset,
  visible,
}: {
  src: string;
  offset: Offset;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-auto max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      style={{
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${
          offset.scale / 100
        })`,
        transformOrigin: "center center",
        imageRendering: "pixelated",
      }}
    />
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[10px] font-black uppercase font-mono">
        <span className="text-white/50">{label}</span>
        <span className="text-cyan-300">{value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  );
}

export default function CharacterTestPage() {
  const [view, setView] = useState<ViewId>("front");
  const [head, setHead] = useState<Offset>(initial);
  const [hair, setHair] = useState<Offset>(initial);

  const [showBody, setShowBody] = useState(true);
  const [showHead, setShowHead] = useState(true);
  const [showHair, setShowHair] = useState(true);

  const currentAssets = assets[view];

  const reset = () => {
    setHead(initial);
    setHair(initial);
  };

  const panel =
    "rounded-2xl border border-white/10 bg-[#071426]/90 backdrop-blur-xl";

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 font-mono">
            PeakScore · Dev Tool
          </p>

          <h1 className="mt-1 text-3xl font-black font-mono">
            Character Test
          </h1>

          <p className="mt-2 text-sm text-white/50 font-mono">
            Prueba el ensamblaje BODY + HEAD + HAIR antes de crear animaciones.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className={`${panel} p-4 sm:p-5`}>
            <div className="mb-4 flex flex-wrap gap-2">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`
                    rounded-lg border px-3 py-2 text-[10px] font-black font-mono
                    transition
                    ${
                      view === item.id
                        ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={reset}
                className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black font-mono text-white/50 hover:text-white"
              >
                Restablecer
              </button>
            </div>

            <div className="grid min-h-[650px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[#030b17]">
              <div
                className="relative aspect-square w-full max-w-[620px] overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle, rgba(34,211,238,.08), transparent 42%)",
                }}
              >
                <SpriteLayer
                  src={currentAssets.body}
                  offset={initial}
                  visible={showBody}
                />

                <SpriteLayer
                  src={currentAssets.head}
                  offset={head}
                  visible={showHead}
                />

                <SpriteLayer
                  src={currentAssets.hair}
                  offset={hair}
                  visible={showHair}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: "BODY",
                  visible: showBody,
                  onToggle: () =>
                    setShowBody((value) => !value),
                },
                {
                  label: "HEAD",
                  visible: showHead,
                  onToggle: () =>
                    setShowHead((value) => !value),
                },
                {
                  label: "HAIR",
                  visible: showHair,
                  onToggle: () =>
                    setShowHair((value) => !value),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onToggle}
                  className={`
                    rounded-xl border px-3 py-2 text-[10px] font-black font-mono
                    ${
                      item.visible
                        ? "border-emerald-300/25 bg-emerald-300/[0.05] text-emerald-200"
                        : "border-white/10 text-white/30"
                    }
                  `}
                >
                  {item.label} · {item.visible ? "ON" : "OFF"}
                </button>
              ))}            </div>
          </section>

          <aside className="space-y-5">
            <section className={`${panel} p-5`}>
              <h2 className="text-sm font-black font-mono">HEAD</h2>
              <div className="mt-4 space-y-4">
                <Slider
                  label="Escala"
                  value={head.scale}
                  min={85}
                  max={115}
                  onChange={(value) =>
                    setHead((current) => ({ ...current, scale: value }))
                  }
                />
                <Slider
                  label="X"
                  value={head.x}
                  min={-80}
                  max={80}
                  onChange={(value) =>
                    setHead((current) => ({ ...current, x: value }))
                  }
                />
                <Slider
                  label="Y"
                  value={head.y}
                  min={-120}
                  max={120}
                  onChange={(value) =>
                    setHead((current) => ({ ...current, y: value }))
                  }
                />
              </div>
            </section>

            <section className={`${panel} p-5`}>
              <h2 className="text-sm font-black font-mono">HAIR</h2>
              <div className="mt-4 space-y-4">
                <Slider
                  label="Escala"
                  value={hair.scale}
                  min={85}
                  max={115}
                  onChange={(value) =>
                    setHair((current) => ({ ...current, scale: value }))
                  }
                />
                <Slider
                  label="X"
                  value={hair.x}
                  min={-80}
                  max={80}
                  onChange={(value) =>
                    setHair((current) => ({ ...current, x: value }))
                  }
                />
                <Slider
                  label="Y"
                  value={hair.y}
                  min={-120}
                  max={120}
                  onChange={(value) =>
                    setHair((current) => ({ ...current, y: value }))
                  }
                />
              </div>
            </section>

            <section className={`${panel} p-5`}>
              <h2 className="text-sm font-black font-mono">MASTER ASSETS</h2>
              <div className="mt-3 space-y-2 text-[10px] text-white/40 font-mono">
                <p className="break-all">BODY · {currentAssets.body}</p>
                <p className="break-all">HEAD · {currentAssets.head}</p>
                <p className="break-all">HAIR · {currentAssets.hair}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

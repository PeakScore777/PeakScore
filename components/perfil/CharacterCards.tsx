
"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";

type CharacterId = "peaky-nova" | "peaky-nox" | "zyra" | "orby";

type Character = {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  image: string;
  color: string;
  glow: string;
  aspect: string;
};

const CHARACTERS: Character[] = [
  {
    id: "peaky-nova",
    name: "NOVA",
    title: "GUARDIÁN DE LA LUZ",
    description:
      "Nova representa la energía, la curiosidad y el progreso. Explora los mundos de PeakScore, supera desafíos y demuestra todo lo que puedes aprender.",
    image: "/characters/peaky-nova/card/peaky-nova-card.webp",
    color: "#39ff91",
    glow: "57,255,145",
    aspect: "aspect-[2/3]",
  },
  {
    id: "peaky-nox",
    name: "NOX",
    title: "GUARDIÁN DE LA SOMBRA",
    description:
      "Nox recorre los rincones misteriosos del multiverso. Convierte cada dificultad en una oportunidad para aprender.",
    image: "/characters/peaky-nox/peaky-nox-card.webp",
    color: "#bd70ff",
    glow: "189,112,255",
    aspect: "aspect-[496/793]",
  },
  {
    id: "zyra",
    name: "ZYRA",
    title: "ESPÍRITU DE LA NATURALEZA",
    description:
      "Zyra combina intuición y estrategia. Conecta ideas, reconoce patrones y resuelve los retos de cada mundo.",
    image: "/characters/zyra/zyra-card.webp",
    color: "#ff70c8",
    glow: "255,112,200",
    aspect: "aspect-[496/793]",
  },
  {
    id: "orby",
    name: "ORBY",
    title: "EXPLORADOR CÓSMICO",
    description:
      "Orby mira más allá de lo evidente. Analiza situaciones y encuentra nuevas rutas para superar los desafíos de PeakScore.",
    image: "/characters/orby/orby-card.webp",
    color: "#ff9b45",
    glow: "255,155,69",
    aspect: "aspect-[496/793]",
  },
];

function normalizeCharacterId(value: unknown): CharacterId {
  const id =
    typeof value === "string"
      ? value.toLowerCase().trim().replace(/_/g, "-")
      : "";

  if (id.includes("nox") || id.includes("dark")) return "peaky-nox";
  if (id.includes("zyra")) return "zyra";
  if (id.includes("orby")) return "orby";

  return "peaky-nova";
}

export default function CharacterCards() {
  const [selectedId, setSelectedId] =
    useState<CharacterId>("peaky-nova");

  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const [pointer, setPointer] = useState({
    x: 50,
    y: 35,
    rotateX: 0,
    rotateY: 0,
    active: false,
  });

  const loadCharacter = useCallback(async () => {
    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      const value = data?.profile?.selectedCharacter;

      if (value) setSelectedId(normalizeCharacterId(value));
    } catch (error) {
      console.error("[CharacterCards] Error cargando personaje:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCharacter();

    const refresh = () => void loadCharacter();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "peakscore-selected-character" ||
        event.key === "selectedCharacter"
      ) {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("peakscore:character-changed", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "peakscore:character-changed",
        refresh,
      );
    };
  }, [loadCharacter]);

  const character =
    CHARACTERS.find((item) => item.id === selectedId) ??
    CHARACTERS[0];

  useEffect(() => {
    setImageFailed(false);
    setPointer({
      x: 50,
      y: 35,
      rotateX: 0,
      rotateY: 0,
      active: false,
    });
  }, [selectedId]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPointer({
      x,
      y,
      rotateX: (50 - y) * 0.20,
      rotateY: (x - 50) * 0.20,
      active: true,
    });
  }

  function resetPointer() {
    setPointer({
      x: 50,
      y: 35,
      rotateX: 0,
      rotateY: 0,
      active: false,
    });
  }

  const cardStyle = {
    "--character-glow": character.glow,
    transform: `rotateX(${pointer.rotateX}deg) rotateY(${pointer.rotateY}deg) scale(${pointer.active ? 1.025 : 1})`,
    boxShadow: pointer.active
      ? `0 25px 45px rgba(0,0,0,.42), 0 0 18px rgba(${character.glow},.13)`
      : "0 16px 32px rgba(0,0,0,.32)",
  } as CSSProperties;

  return (
    <section
      aria-label={`Carta de ${character.name}`}
      className="mx-auto w-full max-w-[420px] [perspective:1400px] lg:mx-0"
    >
      <article
        key={character.id}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        style={cardStyle}
        className={`character-card group relative isolate w-full ${character.aspect} cursor-pointer bg-transparent transition-[transform,box-shadow] duration-150 ease-out`}
      >
        {/* Imagen original: conserva sus bordes ornamentales */}
        {!imageFailed ? (
          <Image
            src={character.image}
            alt={`Carta de ${character.name}`}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 420px"
            onError={() => setImageFailed(true)}
            className="pointer-events-none object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="font-mono text-xs text-white/70">
              No se pudo cargar la carta.
              <span className="mt-2 block break-all text-[10px]">
                {character.image}
              </span>
            </p>
          </div>
        )}

        {/* TODOS los reflejos quedan dentro de la carta */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2%] z-[2] overflow-hidden rounded-[2%]"
        >
          {/* Halo interior: nunca se extiende fuera de la ilustración */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background: `radial-gradient(ellipse at ${pointer.x}% ${pointer.y}%, rgba(${character.glow},.22), transparent 48%)`,
            }}
          />

          {/* Reflejo especular que sigue al cursor */}
          <div
            className="absolute inset-0 transition-opacity duration-150"
            style={{
              background: `radial-gradient(ellipse 34% 25% at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,.28), rgba(${character.glow},.10) 35%, transparent 100%)`,
              opacity: pointer.active ? 1 : 0,
              mixBlendMode: "screen",
            }}
          />

          {/* Lámina holográfica */}
          <div
            className="absolute inset-0 transition-opacity duration-150"
            style={{
              background: `
                linear-gradient(
                  ${115 + pointer.x * 0.55}deg,
                  transparent 20%,
                  rgba(255,255,255,.06) 38%,
                  rgba(${character.glow},.13) 46%,
                  rgba(130,160,255,.10) 52%,
                  transparent 68%
                )
              `,
              opacity: pointer.active ? 1 : 0,
              mixBlendMode: "screen",
            }}
          />

          {/* Destello diagonal contenido en la carta */}
          <div className="character-shine absolute inset-y-0 left-[-65%] w-[35%] -skew-x-[22deg] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>

        {/* Panel del personaje */}
        <div className="absolute inset-x-[7%] bottom-[4%] z-10">
          <div className="rounded-xl border border-white/15 bg-[#080d16]/90 p-3 shadow-[0_-8px_24px_rgba(0,0,0,.38)] backdrop-blur-md transition-colors duration-300 group-hover:border-white/30 group-hover:bg-[#080d16]/95 sm:p-4">
            <h2
              className="font-mono text-lg font-black tracking-[-0.04em] sm:text-xl"
              style={{
                color: character.color,
                textShadow: `0 0 16px rgba(${character.glow},.30)`,
              }}
            >
              {character.name}
            </h2>

            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-hover:mt-2 group-hover:grid-rows-[1fr] group-hover:opacity-100">
              <div className="overflow-hidden">
                <p className="translate-y-2 font-mono text-[10px] font-bold uppercase tracking-[.08em] text-white/65 transition-transform duration-300 group-hover:translate-y-0 sm:text-[11px]">
                  {character.title}
                </p>

                <p className="mt-2 translate-y-2 font-mono text-[10px] leading-[1.7] text-slate-200 transition-transform duration-300 group-hover:translate-y-0 sm:text-[11px]">
                  {character.description}
                </p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="mt-2 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
              style={{
                background: `linear-gradient(90deg, ${character.color}, transparent)`,
                boxShadow: `0 0 12px rgba(${character.glow},.55)`,
              }}
            />
          </div>
        </div>
      </article>

      {loading && (
        <p className="mt-2 text-center font-mono text-[9px] text-white/35">
          Sincronizando personaje...
        </p>
      )}

      <style jsx>{`
        .character-card {
          transform-style: preserve-3d;
          transform-origin: center;
          will-change: transform, box-shadow;
          -webkit-tap-highlight-color: transparent;
        }

        .character-shine {
          opacity: 0;
        }

        .character-card:hover .character-shine {
          animation: character-shine 800ms ease-out forwards;
          opacity: 1;
        }

        @keyframes character-shine {
          from {
            left: -65%;
          }
          to {
            left: 135%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .character-card,
          .character-card *,
          .character-shine {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}

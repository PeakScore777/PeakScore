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

      const data: unknown = await response.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "profile" in data &&
        typeof data.profile === "object" &&
        data.profile !== null &&
        "selectedCharacter" in data.profile
      ) {
        const value = data.profile.selectedCharacter;

        if (typeof value === "string" && value.length > 0) {
          setSelectedId(normalizeCharacterId(value));
        }
      }
    } catch (error) {
      console.error(
        "[CharacterCards] Error cargando personaje:",
        error,
      );
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
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPointer({
      x,
      y,
      rotateX: (50 - y) * 0.2,
      rotateY: (x - 50) * 0.2,
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

  function handleTouchTilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPointer({
      x,
      y,
      rotateX: (50 - y) * 0.12,
      rotateY: (x - 50) * 0.12,
      active: true,
    });
  }

  const cardStyle = {
    transform: `rotateX(${pointer.rotateX}deg) rotateY(${pointer.rotateY}deg) scale(${pointer.active ? 1.015 : 1})`,
    boxShadow: pointer.active
      ? "0 25px 45px rgba(0,0,0,.42), 0 0 18px rgba(255,255,255,.10)"
      : "0 16px 32px rgba(0,0,0,.32)",
    transition: "transform 180ms ease-out, box-shadow 180ms ease-out",
    "--pointer-x": `${pointer.x}%`,
    "--pointer-y": `${pointer.y}%`,
  } as CSSProperties;

  return (
    <section
      aria-label={`Carta de ${character.name}`}
      className="mx-auto w-full max-w-[450px] [perspective:1400px] lg:mx-0"
    >
      <article
        key={character.id}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        onPointerDown={handleTouchTilt}
        onPointerUp={resetPointer}
        onPointerCancel={resetPointer}
        style={cardStyle}
        className={`character-card group relative isolate w-full ${character.aspect} cursor-pointer bg-transparent`}
      >
        {/* Arte original de la carta */}
        {!imageFailed ? (
          <Image
            src={character.image}
            alt={`Carta de ${character.name}`}
            fill
            priority
            sizes="(max-width: 639px) 94vw, 450px"
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

        {/* Reflejo blanco de luz */}
        <div
          aria-hidden="true"
          className="character-light pointer-events-none absolute inset-0 z-[6]"
        >
          <div
            className="character-light__spot absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 30% 22% at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,.42), rgba(255,255,255,.15) 38%, transparent 75%)`,
              opacity: pointer.active ? 1 : 0,
            }}
          />

          <div
            className="character-light__beam absolute inset-y-0 left-[-65%] w-[32%] -skew-x-[22deg] bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{
              opacity: pointer.active ? 1 : 0,
              animation: pointer.active
                ? "character-shine 850ms ease-out forwards"
                : "none",
            }}
          />
        </div>

        {/* Nombre y descripción */}
        <div className="absolute inset-x-[7%] bottom-[4%] z-10">
          <div className="rounded-xl border border-white/15 bg-[#080d16]/90 p-3 shadow-[0_-8px_24px_rgba(0,0,0,.38)] backdrop-blur-md sm:p-4">
            <h2
              className="font-mono text-lg font-black tracking-[-0.04em] sm:text-xl"
              style={{
                color: character.color,
                textShadow: "0 0 12px rgba(255,255,255,.12)",
              }}
            >
              {character.name}
            </h2>

            {/* Móvil: visible. PC: aparece al pasar el cursor. */}
            <div className="character-details mt-2 grid grid-rows-[1fr] opacity-100 transition-all duration-300 ease-out">
              <div className="min-h-0">
                <p className="character-detail-text font-mono text-[10px] font-bold uppercase tracking-[.08em] text-white/65 sm:text-[11px]">
                  {character.title}
                </p>

                <p className="character-detail-text mt-2 whitespace-normal break-words font-mono text-[10px] leading-[1.7] text-slate-200 sm:text-[11px]">
                  {character.description}
                </p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="character-underline mt-2 h-[2px] w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,.9), transparent)",
                boxShadow: "0 0 10px rgba(255,255,255,.25)",
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
          overflow: hidden;
          border-radius: 2%;
          isolation: isolate;
          contain: paint;
          clip-path: inset(0 round 2%);
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          touch-action: pan-y;
        }

        .character-light {
          overflow: hidden;
          border-radius: 2%;
          clip-path: inset(0 round 2%);
          contain: paint;
        }

        .character-light__spot {
          mix-blend-mode: screen;
          transition: opacity 150ms ease-out;
        }

        .character-light__beam {
          pointer-events: none;
        }

        @keyframes character-shine {
          from {
            left: -65%;
          }
          to {
            left: 135%;
          }
        }

        /* En escritorio se oculta la descripción hasta el hover. */
        @media (hover: hover) and (pointer: fine) {
          .character-details {
            display: grid;
            grid-template-rows: 0fr;
            opacity: 0;
            margin-top: 0;
          }

          .character-card:hover .character-details {
            grid-template-rows: 1fr;
            opacity: 1;
            margin-top: 0.5rem;
          }

          .character-card:hover .character-underline {
            width: 100%;
            transition: width 500ms ease-out;
          }
        }

        .character-details {
          min-height: 0;
          overflow: hidden;
        }

        .character-detail-text {
          transform: translateY(0);
        }

        .character-underline {
          width: 100%;
        }

        @media (prefers-reduced-motion: reduce) {
          .character-card,
          .character-card *,
          .character-light__spot {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
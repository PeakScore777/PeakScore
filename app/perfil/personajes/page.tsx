"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Check, ShoppingCart, X } from "lucide-react";
import {
  CHARACTER_LORE,
  type PeakScoreCharacterId,
} from "@/lib/characters/lore";

type CharacterRow = {
  id: string;
  name: string;
  description: string;
  price_coins: number;
  xp_bonus_percent: number;
  coin_bonus_percent: number;
  is_active: boolean;
};

type ProfileResponse = {
  profile: {
    coins: number;
    selectedCharacter: string | null;
  };
  characters: CharacterRow[];
  unlockedCharacterIds: string[];
};

type CharacterVisual = {
  id: PeakScoreCharacterId;
  image: string;
  card: string;
  biome: string;
  color: string;
  glow: string;
  statusColor: string;
  statusBackground: string;
};

const CHARACTERS: CharacterVisual[] = [
  {
    id: "nova",
    image: "/characters/peaky-nova/nova-pixel.webp",
    card: "/characters/peaky-nova/card/peaky-nova-card.webp",
    biome: "/characters/novabioma.png",
    color: "#45FF88",
    glow: "rgba(42,255,120,.19)",
    statusColor: "#FFFFFF",
    statusBackground: "#13A957",
  },
  {
    id: "nox",
    image: "/characters/peaky-nox/nox-pixel.webp",
    card: "/characters/peaky-nox/peaky-nox-card.webp",
    biome: "/characters/noxbioma.png",
    color: "#BE83FF",
    glow: "rgba(166,76,255,.2)",
    statusColor: "#FFFFFF",
    statusBackground: "#7629CF",
  },
  {
    id: "zyra",
    image: "/characters/zyra/zyra-pixel.webp",
    card: "/characters/zyra/zyra-card.webp",
    biome: "/characters/zyra.png",
    color: "#FFAC42",
    glow: "rgba(255,135,49,.2)",
    statusColor: "#FFFFFF",
    statusBackground: "#EC65AD",
  },
  {
    id: "orby",
    image: "/characters/orby/orby-pixel.webp",
    card: "/characters/orby/orby-card.webp",
    biome: "/characters/orbybioma.png",
    color: "#45DDFF",
    glow: "rgba(46,203,255,.2)",
    statusColor: "#FFFFFF",
    statusBackground: "#F07828",
  },
];

const PIXEL_FONT = "'Press Start 2P', monospace";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function identifyCharacter(
  value: string,
): PeakScoreCharacterId | null {
  const id = normalize(value);

  if (id.includes("nova")) return "nova";
  if (id.includes("nox")) return "nox";
  if (id.includes("zyra")) return "zyra";
  if (id.includes("orby")) return "orby";

  return null;
}

function formatCoins(value: number) {
  return Math.max(0, value).toLocaleString("es-CO");
}

function CharacterStoryModal({
  characterId,
  visual,
  onClose,
  unlocked,
  equipped,
  price,
}: {
  characterId: PeakScoreCharacterId;
  visual: CharacterVisual;
  onClose: () => void;
  unlocked: boolean;
  equipped: boolean;
  price: number | null;
}) {
  const lore = CHARACTER_LORE[characterId];

  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    px: 50,
    py: 40,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;

    setTilt({
      x: (50 - py) * 0.2,
      y: (px - 50) * 0.2,
      px,
      py,
    });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0, px: 50, py: 40 });
  }

  const epic = lore.rarity === "Épico";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-story-title"
        className="relative my-auto grid w-full max-w-[1450px] overflow-hidden rounded-2xl border bg-[#090815] shadow-[0_0_90px_rgba(106,63,255,.18)] lg:min-h-[780px] lg:grid-cols-[minmax(440px,.9fr)_minmax(0,1.1fr)]"
        style={{ borderColor: `${visual.color}65` }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar historia"
          className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-xl border border-white/15 bg-black/65 text-white transition hover:bg-white/10"
        >
          <X size={20} />
        </button>

        {/* Carta original con inclinación y reflejo */}
        <div
          className="relative flex min-h-[420px] items-center justify-center overflow-hidden border-b p-4 sm:min-h-[540px] sm:p-6 lg:min-h-[760px] lg:border-b-0 lg:border-r"
          style={{
            borderColor: `${visual.color}35`,
            background: `radial-gradient(ellipse at 50% 45%, ${visual.glow}, transparent 70%), #080711`,
            perspective: "1100px",
          }}
        >
          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={resetTilt}
            className="relative aspect-[2/3] w-full max-w-[340px] transition-transform duration-150 ease-out sm:max-w-[410px] lg:max-w-[460px]"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src={visual.card}
              alt={`Carta oficial de ${lore.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 460px"
              className="rounded-xl object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,.5)]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,.27), transparent 36%)`,
                mixBlendMode: "screen",
              }}
            />
          </div>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <span
              className="rounded-md border border-white/10 bg-black/70 px-3 py-2 text-[9px] uppercase text-white"
              style={{ fontFamily: PIXEL_FONT }}
            >
              {lore.biome}
            </span>
          </div>
        </div>

        {/* Historia */}
        <div className="max-h-[82vh] overflow-y-auto p-5 sm:p-8 lg:max-h-[85vh] lg:p-9">
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span
              className="rounded-md px-3 py-2 text-[9px] text-white"
              style={{
                fontFamily: PIXEL_FONT,
                background: epic ? "#DCA51D" : "#373044",
              }}
            >
              {epic ? "ÉPICO" : "INICIAL"}
            </span>

            {equipped && (
              <span
                className="rounded-md px-3 py-2 text-[9px] text-white"
                style={{
                  fontFamily: PIXEL_FONT,
                  background: visual.statusBackground,
                }}
              >
                EQUIPADO
              </span>
            )}
          </div>

          <p
            className="mt-6 text-[10px] uppercase tracking-wide"
            style={{ color: visual.color, fontFamily: PIXEL_FONT }}
          >
            {lore.epithet}
          </p>

          <h2
            id="character-story-title"
            className="mt-4 text-3xl font-black uppercase sm:text-4xl"
            style={{ color: visual.color }}
          >
            {lore.name}
          </h2>

          <p
            className="mt-2 text-xs uppercase leading-6 text-white/60"
            style={{ fontFamily: PIXEL_FONT }}
          >
            {lore.title}
          </p>

          <p className="mt-6 text-base leading-7 text-slate-300 sm:text-lg">
            {lore.story.introduction}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {lore.personality.map((trait) => (
              <span
                key={trait}
                className="rounded-lg border border-white/10 bg-white/[.035] px-3 py-2 text-sm text-white/70"
              >
                {trait}
              </span>
            ))}
          </div>

          <div className="mt-8 space-y-7">
            {lore.story.chapters.map((chapter, index) => (
              <article key={chapter.title}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[9px] text-white"
                    style={{
                      background: `${visual.color}25`,
                      border: `1px solid ${visual.color}60`,
                      fontFamily: PIXEL_FONT,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3
                    className="text-base font-bold uppercase leading-7 sm:text-lg lg:text-xl"
                    style={{
                      color: visual.color,
                      fontFamily: PIXEL_FONT,
                    }}
                  >
                    {chapter.title}
                  </h3>
                </div>

                <div className="mt-4 space-y-4 pl-0 text-base leading-8 text-slate-300 sm:pl-11 sm:text-[17px]">
                  {chapter.paragraphs.map(
                    (paragraph, paragraphIndex) => (
                      <p key={`${chapter.title}-${paragraphIndex}`}>
                        {paragraph}
                      </p>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>

          <blockquote
            className="mt-8 rounded-xl border-l-4 p-4 sm:p-5"
            style={{
              borderColor: visual.color,
              background: visual.glow,
            }}
          >
            <p className="text-base italic leading-7 text-white">
              “{lore.quote}”
            </p>
          </blockquote>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
            <p
              className="text-[9px] uppercase text-white/50"
              style={{ fontFamily: PIXEL_FONT }}
            >
              Habilidad del personaje
            </p>

            <h3
              className="mt-3 text-base font-bold"
              style={{ color: visual.color }}
            >
              {lore.ability.name}
            </h3>

            <p className="mt-2 text-base leading-7 text-slate-300">
              {lore.ability.description}
            </p>

            {epic && (
              <div className="mt-4 flex items-center gap-3">
                <Image
                  src="/images/currency/peakcoin.webp"
                  alt="PeakCoin"
                  width={30}
                  height={30}
                  className="size-7 object-contain"
                />

                <span className="text-base font-black text-amber-300">
                  {price === null
                    ? "Precio no configurado"
                    : `${formatCoins(price)} PeakCoins`}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {equipped ? (
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-[9px] text-white"
                style={{
                  background: visual.statusBackground,
                  fontFamily: PIXEL_FONT,
                }}
              >
                <Check size={16} />
                EQUIPADO
              </div>
            ) : unlocked ? (
              <p className="rounded-lg border border-white/10 px-4 py-3 text-xs text-white/50">
                El equipamiento se habilitará al conectar la API segura.
              </p>
            ) : (
              <p className="rounded-lg border border-white/10 px-4 py-3 text-xs text-white/50">
                El desbloqueo se habilitará al conectar la compra segura.
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold text-white/75 transition hover:bg-white/5"
            >
              Cerrar historia
            </button>
          </div>

          <p className="mt-6 text-sm leading-7 text-white/35">
            {lore.story.conclusion}
          </p>
        </div>
      </section>
    </div>
  );
}

function CharacterSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      aria-label="Cargando personajes"
    >
      {/* Contador de personajes */}
      <div className="flex justify-end">
        <div className="h-3 w-36 rounded bg-[var(--app-surface-secondary)]" />
      </div>

      {/* Cuatro tarjetas de personajes */}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
          >
            {/* Imagen del personaje */}
            <div className="relative h-[165px] overflow-hidden bg-[var(--app-surface-secondary)] sm:h-[220px] lg:h-[245px]">
              <div className="absolute inset-4 rounded-lg bg-white/5" />
              <div className="absolute left-2 top-2 h-6 w-20 rounded bg-white/10" />
            </div>

            {/* Texto y botones */}
            <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
              <div className="h-4 w-3/4 rounded bg-[var(--app-surface-secondary)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--app-surface-secondary)]" />

              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-[var(--app-surface-secondary)]" />
                <div className="h-3 w-5/6 rounded bg-[var(--app-surface-secondary)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--app-surface-secondary)]" />
              </div>

              <div className="mt-2 h-10 rounded-lg bg-[var(--app-surface-secondary)]" />
              <div className="mt-auto h-10 rounded-lg bg-[var(--app-surface-secondary)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Panel inferior de PeakCoin */}
      <div className="grid gap-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-7">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-[var(--app-surface-secondary)]" />
          <div className="h-3 w-full max-w-md rounded bg-[var(--app-surface-secondary)]" />
          <div className="h-3 w-4/5 max-w-sm rounded bg-[var(--app-surface-secondary)]" />
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--app-border)] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="size-10 shrink-0 rounded-full bg-[var(--app-surface-secondary)]" />
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-[var(--app-surface-secondary)]" />
            <div className="h-6 w-24 rounded bg-[var(--app-surface-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonajesPage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyCharacter, setStoryCharacter] =
    useState<PeakScoreCharacterId | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Inicia sesión para consultar tus personajes."
            : "No se pudo cargar tu colección.",
        );
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("profile" in result) ||
        !("characters" in result) ||
        !("unlockedCharacterIds" in result)
      ) {
        throw new Error(
          "La respuesta del perfil no tiene el formato esperado.",
        );
      }

      setData(result as ProfileResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar tu colección.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const catalog = data?.characters ?? [];
  const unlockedIds = data?.unlockedCharacterIds ?? [];

  const equippedKey = identifyCharacter(
    data?.profile.selectedCharacter ?? "",
  );

  function findCatalogItem(visual: CharacterVisual) {
    return catalog.find(
      (item) =>
        identifyCharacter(item.id) === visual.id ||
        identifyCharacter(item.name) === visual.id,
    );
  }

  function isUnlocked(visual: CharacterVisual) {
    const item = findCatalogItem(visual);

    if (!item) return false;

    return unlockedIds.some(
      (id) => id === item.id || identifyCharacter(id) === visual.id,
    );
  }

  const activeStoryVisual = storyCharacter
    ? CHARACTERS.find((item) => item.id === storyCharacter) ?? null
    : null;

  const activeStoryItem = activeStoryVisual
    ? findCatalogItem(activeStoryVisual)
    : null;

  const activeStoryUnlocked = activeStoryVisual
    ? isUnlocked(activeStoryVisual)
    : false;

  const activeStoryEquipped = Boolean(
    activeStoryVisual && equippedKey === activeStoryVisual.id,
  );

  const activeStoryPrice =
    activeStoryItem &&
    Number.isFinite(Number(activeStoryItem.price_coins))
      ? Math.max(0, Number(activeStoryItem.price_coins))
      : null;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#05030b] px-3 pb-28 pt-5 text-white sm:px-5 sm:pt-7 lg:px-8 lg:pb-12">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">

        {/* Encabezado con los biomas y Peaky */}
        <header className="relative isolate flex min-h-[170px] items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] sm:min-h-[205px]">
          <Image
            src="/perfil/biome-profile-dark.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-70"
          />

          <Image
            src="/perfil/biome-profile-light.webp"
            alt=""
            fill
            sizes="100vw"
            className="-z-20 object-cover opacity-35 mix-blend-screen"
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080b19]/95 via-[#0c1027]/75 to-[#101a23]/30" />

          <div className="relative z-10 w-full max-w-[760px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <h1
              className="text-2xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl"
              style={{ fontFamily: PIXEL_FONT }}
            >
              PERSONAJES
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Colecciona, desbloquea y elige a tu compañero en PeakScore.
              Cada personaje te acompaña en tu progreso.
            </p>
          </div>

          {/* Peaky solo aparece en pantallas sm en adelante */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] sm:block">
            <Image
              src="/images/profile/personajes-banner.png"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 48vw, 600px"
              className="object-contain object-right"
            />

            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#0a1020] to-transparent" />
          </div>
        </header>

        {loading && <CharacterSkeleton />}

        {!loading && error && (
          <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-5">
            <p className="font-bold text-red-200">{error}</p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadData();
              }}
              className="mt-3 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
            >
              Reintentar
            </button>
          </section>
        )}

        {!loading && data && (
          <>
            <section>
              {/* Se conserva el contador, sin repetir el título */}
              <div className="mb-4 flex justify-end">
                <p className="text-xs text-white/50">
                  {CHARACTERS.filter(isUnlocked).length} de{" "}
                  {CHARACTERS.length} desbloqueados
                </p>
              </div>

              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
                {CHARACTERS.map((visual) => {
                  const lore = CHARACTER_LORE[visual.id];
                  const item = findCatalogItem(visual);
                  const unlocked = isUnlocked(visual);
                  const equipped = equippedKey === visual.id;
                  const epic = lore.rarity === "Épico";

                  const price = item
                    ? Math.max(0, Number(item.price_coins) || 0)
                    : null;

                  return (
                    <article
                      key={visual.id}
                      className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-[#0b0a16] transition duration-300 hover:-translate-y-1"
                      style={{
                        borderColor: `${visual.color}70`,
                        boxShadow: `inset 0 0 35px ${visual.glow}`,
                      }}
                    >
                      <div
                        className="relative flex h-[165px] items-center justify-center overflow-hidden sm:h-[220px] lg:h-[245px]"
                        style={{
                          background: `linear-gradient(180deg,rgba(5,4,12,.18),rgba(5,4,12,.72)), url("${visual.biome}") center / cover, radial-gradient(ellipse at 50% 45%,${visual.glow},#080812 75%)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-black/15" />

                        <Image
                          src={visual.image}
                          alt={lore.name}
                          fill
                          sizes="(max-width: 639px) 45vw, (max-width: 1279px) 40vw, 300px"
                          className={`z-[1] object-contain p-2 transition duration-300 sm:p-4 ${
                            unlocked
                              ? "hover:scale-105"
                              : "grayscale-[.65] brightness-75"
                          }`}
                        />

                        <span
                          className="absolute left-2 top-2 z-10 rounded px-2 py-2 text-[8px] leading-3 text-white sm:text-[9px]"
                          style={{
                            fontFamily: PIXEL_FONT,
                            background: equipped
                              ? visual.statusBackground
                              : epic
                                ? "#DCA51D"
                                : "#24202E",
                          }}
                        >
                          {equipped
                            ? "EQUIPADO"
                            : epic
                              ? "ÉPICO"
                              : unlocked
                                ? "INICIAL"
                                : "BLOQUEADO"}
                        </span>

                        {!unlocked && (
                          <div className="absolute right-2 top-2 z-10 size-7">
                            <Image
                              src="/images/ranks/ui/rank-lock.webp"
                              alt="Bloqueado"
                              fill
                              sizes="28px"
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <h3
                          className="text-sm font-black uppercase sm:text-lg"
                          style={{
                            color: visual.color,
                            fontFamily: PIXEL_FONT,
                          }}
                        >
                          {lore.name}
                        </h3>

                        <p
                          className="mt-2 text-[8px] uppercase leading-4 text-white/45 sm:text-[9px]"
                          style={{ fontFamily: PIXEL_FONT }}
                        >
                          {lore.title}
                        </p>

                        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">
                          {lore.story.introduction}
                        </p>

                        <div className="mt-4 min-h-12">
                          {lore.ability.active ? (
                            <p className="text-xs font-semibold leading-5 text-white/80 sm:text-sm">
                              +{lore.ability.bonusPercent}%{" "}
                              {visual.id === "orby"
                                ? "PeakCoins"
                                : "EXP"}{" "}
                              en misiones, niveles y simulacros.
                            </p>
                          ) : (
                            <p
                              className="text-[8px] uppercase leading-5 text-white/65 sm:text-[9px]"
                              style={{ fontFamily: PIXEL_FONT }}
                            >
                              Personaje inicial sin habilidades
                            </p>
                          )}
                        </div>

                        {epic && !unlocked && (
                          <div className="my-2 flex items-center gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[.06] px-2 py-2">
                            <Image
                              src="/images/currency/peakcoin.webp"
                              alt="PeakCoin"
                              width={25}
                              height={25}
                              className="size-6 object-contain"
                            />

                            <span className="text-sm font-black text-amber-300">
                              {price === null ? "—" : formatCoins(price)}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setStoryCharacter(visual.id)}
                          className="mt-3 rounded-lg border border-white/10 bg-white/[.04] px-3 py-3 text-[8px] text-white transition hover:bg-white/10 sm:text-[9px]"
                          style={{ fontFamily: PIXEL_FONT }}
                        >
                          VER DETALLES
                        </button>

                        <div
                          className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 py-3 text-center text-[8px] leading-4 text-white sm:text-[9px]"
                          style={{
                            fontFamily: PIXEL_FONT,
                            background: equipped
                              ? visual.statusBackground
                              : "rgba(255,255,255,.035)",
                            border: equipped
                              ? "1px solid rgba(255,255,255,.15)"
                              : "1px solid rgba(255,255,255,.09)",
                          }}
                        >
                          {equipped ? (
                            <>
                              <Check size={14} />
                              EQUIPADO
                            </>
                          ) : unlocked ? (
                            "EQUIPAMIENTO PENDIENTE"
                          ) : (
                            <>
                              <ShoppingCart size={13} />
                              COMPRA PENDIENTE
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Panel PeakCoin con fondos adaptables */}
            <section className="relative isolate grid min-w-0 items-center gap-5 overflow-hidden rounded-2xl border border-violet-400/30 bg-[#0c0a19] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-7">
              {/* Fondo para escritorio */}
              <Image
                src="/images/currency/fondomonedas.png"
                alt=""
                fill
                sizes="(max-width: 639px) 0px, 100vw"
                aria-hidden="true"
                className="pointer-events-none -z-20 hidden object-cover sm:block"
              />

              {/* Fondo vertical para móvil */}
              <Image
                src="/images/currency/fondomonedas-mobile.png"
                alt=""
                fill
                sizes="100vw"
                aria-hidden="true"
                className="pointer-events-none -z-20 object-cover sm:hidden"
              />

              {/* Capa de contraste para mantener la lectura */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#080612]/90 via-[#100b24]/75 to-[#080612]/65"
              />

              {/* Descripción */}
              <div className="relative z-10 min-w-0">
                <h2
                  className="text-sm font-black uppercase text-white sm:text-base"
                  style={{ fontFamily: PIXEL_FONT }}
                >
                  PEAKCOIN
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                  La moneda de PeakScore. Úsala para desbloquear personajes
                  y ampliar tu colección.
                </p>
              </div>

              {/* Saldo real del usuario */}
              <div className="relative z-10 border-t border-white/20 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="text-xs text-white/75">Tu saldo</p>

                <div className="mt-2 flex items-center gap-3">
                  <Image
                    src="/images/currency/peakcoin.webp"
                    alt="PeakCoin"
                    width={42}
                    height={42}
                    className="size-9 object-contain sm:size-11"
                  />

                  <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">
                    {formatCoins(data.profile.coins)}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {storyCharacter && activeStoryVisual && (
        <CharacterStoryModal
          characterId={storyCharacter}
          visual={activeStoryVisual}
          onClose={() => setStoryCharacter(null)}
          unlocked={activeStoryUnlocked}
          equipped={activeStoryEquipped}
          price={activeStoryPrice}
        />
      )}
    </main>
  );
}
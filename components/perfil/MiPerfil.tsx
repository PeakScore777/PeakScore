"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProfileData = {
  id: string;
  fullName: string;
  email: string;
  username?: string | null;
  avatarUrl: string | null;
  xp: number;
  historicalXp?: number;
  seasonXp?: number;
  coins: number;
  level: number;
  selectedCharacter: string | null;
  levelProgress?: number;
};

type SeasonData = {
  id: string;
  number: number;
  name: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

type RankData = {
  id: string;
  name: string;
  identity: string;
  minSeasonXp: number;
  maxSeasonXp: number | null;
  progress: number;
  xpToNextRank: number;
  isNewAccount: boolean;
};

type BadgeData = {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_target: number;
  icon: string | null;
};

type ProfileResponse = {
  profile: ProfileData;
  season: SeasonData;
  rank: RankData;
  unlockedBadgeIds: string[];
  badges: BadgeData[];
};

const BADGE_SLOTS = 5;
const BADGES_KEY = "peakscore-profile-badges";
const LEVEL_FRAME = "/perfil/levelcuadro.png";
const PROFILE_BACKGROUND = "/perfil/biome-profile-dark.webp";
const BADGE_LOCK = "/images/ranks/rank-lock.webp";
const RANK_VERSION = "20261009-9";

const CHARACTER_IMAGES: Record<string, string> = {
  "peaky-nova": "/avatars/photo_perfil/peaky-nova.png",
  "peaky-nox": "/avatars/photo_perfil/peaky-nox.png",
  zyra: "/avatars/photo_perfil/zyrap.png",
  orby: "/avatars/photo_perfil/orbyp.png",
};

const CHARACTER_BIOMES: Record<string, string> = {
  "peaky-nova": "/characters/novabioma.png",
  "peaky-nox": "/characters/noxbioma.png",
  zyra: "/characters/zyrabioma.png",
  orby: "/characters/orbybioma.png",
};

const RANK_IMAGES: Record<string, string> = {
  renacer: "/images/ranks/renacer.webp",
  aprendiz: "/images/ranks/aprendiz.webp",
  explorador: "/images/ranks/explorador.webp",
  competidor: "/images/ranks/competidor.webp",
  avanzado: "/images/ranks/avanzado.webp",
  elite: "/images/ranks/elite.webp",
  maestro: "/images/ranks/maestro.webp",
  "gran-maestro": "/images/ranks/gran-maestro.webp",
  leyenda: "/images/ranks/leyenda.webp",
  peak: "/images/ranks/peak.webp",
};

function formatNumber(value: number) {
  return Math.max(0, value).toLocaleString("es-CO");
}

function normalizeSlots(ids: (string | null)[]) {
  return Array.from(
    { length: BADGE_SLOTS },
    (_, index) => ids[index] ?? null,
  );
}

function getCharacterImage(id: string | null) {
  return CHARACTER_IMAGES[id ?? ""] ?? CHARACTER_IMAGES["peaky-nova"];
}

function getCharacterBiome(id: string | null) {
  return CHARACTER_BIOMES[id ?? ""] ?? CHARACTER_BIOMES["peaky-nova"];
}

function getRankImage(id: string) {
  return RANK_IMAGES[id] ?? RANK_IMAGES.renacer;
}

export default function MiPerfil() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equipped, setEquipped] = useState<(string | null)[]>(
    Array(BADGE_SLOTS).fill(null),
  );

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Cargar los datos del perfil.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "No se pudo cargar el perfil.";

          throw new Error(message);
        }

        if (!cancelled) {
          setData(result as ProfileResponse);
        }
      } catch (err) {
        console.error("[MiPerfil] Error cargando el perfil:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el perfil.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Restaurar las insignias seleccionadas.
  useEffect(() => {
    if (!data) return;

    const unlocked = new Set(data.unlockedBadgeIds ?? []);
    let savedIds: string[] = [];

    try {
      const saved = window.localStorage.getItem(BADGES_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          savedIds = parsed.filter(
            (id): id is string =>
              typeof id === "string" && unlocked.has(id),
          );
        }
      }
    } catch (err) {
      console.warn("No se pudieron restaurar las insignias:", err);
    }

    setEquipped(normalizeSlots([...new Set(savedIds)]));
    setPreferencesLoaded(true);
  }, [data]);

  // Guardar las insignias seleccionadas.
  useEffect(() => {
    if (!preferencesLoaded) return;

    try {
      window.localStorage.setItem(
        BADGES_KEY,
        JSON.stringify(equipped.filter(Boolean)),
      );
    } catch (err) {
      console.warn("No se pudieron guardar las insignias:", err);
    }
  }, [equipped, preferencesLoaded]);

  const unlockedIds = useMemo(
    () => new Set(data?.unlockedBadgeIds ?? []),
    [data],
  );

  const badgeById = useMemo(
    () =>
      new Map(
        (data?.badges ?? []).map((badge) => [badge.id, badge]),
      ),
    [data],
  );

  const equippedBadges = equipped.map((id) =>
    id ? badgeById.get(id) ?? null : null,
  );

  function openSelector(slot: number) {
    setActiveSlot(slot);
    setSelectorOpen(true);
  }

  function closeSelector() {
    setSelectorOpen(false);
    setActiveSlot(null);
  }

  function equipBadge(badge: BadgeData) {
    if (activeSlot === null || !unlockedIds.has(badge.id)) return;

    setEquipped((current) => {
      const next = [...normalizeSlots(current)];
      const previousIndex = next.indexOf(badge.id);

      if (previousIndex !== -1 && previousIndex !== activeSlot) {
        next[previousIndex] = null;
      }

      next[activeSlot] = badge.id;
      return next;
    });

    closeSelector();
  }

  function removeBadge(slot: number) {
    setEquipped((current) => {
      const next = [...normalizeSlots(current)];
      next[slot] = null;
      return next;
    });
  }

  if (loading) {
    return (
      <section className="flex min-h-[170px] items-center justify-center rounded-2xl border border-violet-300/20 bg-[#080611]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-2xl border border-red-400/20 bg-[#080611] p-5">
        <p className="text-sm font-bold text-red-200">
          No se pudo cargar tu perfil.
        </p>

        <p className="mt-2 text-xs text-white/45">
          {error ?? "Comprueba la respuesta de /api/profile."}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-violet-300/30 px-4 py-2 text-xs font-bold transition hover:bg-violet-500/15"
        >
          Reintentar
        </button>
      </section>
    );
  }

  const characterId = data.profile.selectedCharacter;
  const characterImage = getCharacterImage(characterId);
  const characterBiome = getCharacterBiome(characterId);
  const rankImage = getRankImage(data.rank.id);

  const displayName =
    data.profile.username?.trim() ||
    data.profile.fullName?.trim() ||
    "Jugador";

  const seasonXp = data.profile.seasonXp ?? 0;
  const levelProgress = Math.max(
    0,
    Math.min(100, data.profile.levelProgress ?? 0),
  );

  return (
    <>
      {/* TARJETA PRINCIPAL */}

      <section
        className="relative isolate w-full min-w-0 overflow-hidden rounded-[20px] border border-violet-300/25 bg-[#070511] shadow-[0_16px_50px_rgba(0,0,0,0.42)]"
        style={{
          backgroundImage: `linear-gradient(100deg,rgba(5,3,14,.72),rgba(5,5,20,.73)),url("${PROFILE_BACKGROUND}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_50%,rgba(0,255,170,0.07),transparent_35%),radial-gradient(ellipse_at_90%_15%,rgba(0,130,255,0.09),transparent_38%)]"
        />

        {/* Personaje + contenido + rango */}
        <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-x-3 gap-y-4 p-3 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-x-4 sm:p-5 lg:grid-cols-[120px_minmax(0,1fr)_180px] lg:gap-x-5 lg:gap-y-0 lg:p-5">
          {/* PERSONAJE Y BIOMA */}

          <div className="profile-capsule group relative mx-auto w-full max-w-[110px]">
            <div
              aria-hidden="true"
              className="absolute -inset-[3px] rounded-[18px] bg-gradient-to-br from-cyan-300 via-violet-500 to-fuchsia-400 opacity-50 blur-[8px] transition duration-500 group-hover:opacity-90 group-hover:blur-[12px]"
            />

            <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-cyan-200/50 bg-[#050713]/80 shadow-[inset_0_0_20px_rgba(34,211,238,0.12),0_0_18px_rgba(34,211,238,0.12)] transition duration-300 group-hover:border-cyan-200">
              <Image
                src={characterBiome}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 120px, (min-width: 640px) 100px, 76px"
                className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-200/10 via-transparent to-violet-500/10"
              />

              <Image
                src={characterImage}
                alt="Personaje de perfil"
                fill
                priority
                sizes="(min-width: 1024px) 120px, (min-width: 640px) 100px, 76px"
                className="object-contain object-bottom drop-shadow-[0_0_10px_rgba(52,255,166,0.22)]"
              />

              <div className="pointer-events-none absolute inset-1 rounded-[11px] border border-white/15" />

              <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 bg-emerald-300 shadow-[0_0_10px_rgba(52,255,166,0.95)]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.95)]" />
            </div>
          </div>

          {/* NOMBRE, NIVEL, EDITAR E INSIGNIAS */}

          <div className="min-w-0 py-1">
            <h1 className="break-words text-[14px] font-black leading-tight tracking-[-0.035em] text-white sm:text-base lg:text-lg">
              Bienvenido de nuevo, {displayName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* NIVEL */}

              <button
                type="button"
                aria-label={`Nivel ${data.profile.level}`}
                className="level-frame group relative flex h-[44px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] transition duration-200 hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.97]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[8px] bg-amber-400/0 opacity-0 blur-md transition duration-300 group-hover:bg-amber-400/40 group-hover:opacity-100"
                />

                <Image
                  src={LEVEL_FRAME}
                  alt=""
                  fill
                  priority
                  sizes="96px"
                  className="pointer-events-none z-0 object-fill drop-shadow-[0_3px_3px_rgba(0,0,0,0.65)]"
                />

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[4px] z-[1] rounded-[5px] border border-amber-100/20 transition group-hover:border-yellow-100/65"
                />

                <span className="level-frame-label relative z-10 whitespace-nowrap text-[9px] font-black uppercase leading-none text-white transition group-hover:text-yellow-100">
                  LEVEL {formatNumber(data.profile.level)}
                </span>
              </button>

              {/* EDITAR INSIGNIAS */}

              <button
                type="button"
                onClick={() => openSelector(0)}
                className="group relative flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-fuchsia-300/50 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_4px_14px_rgba(168,85,247,0.16)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(217,70,239,0.3)]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[-40%] w-[25%] rotate-[18deg] bg-white/35 blur-md transition-transform duration-700 group-hover:translate-x-[600%]"
                />
                <span className="relative z-10">EDITAR</span>
              </button>
            </div>

            {typeof data.profile.levelProgress === "number" && (
              <div className="mt-1.5 h-1 max-w-[220px] overflow-hidden rounded-full bg-black/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-200 transition-[width]"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            )}

            {/* CINCO ESPACIOS PARA INSIGNIAS */}

            <div className="mt-3 grid w-full max-w-[260px] grid-cols-5 gap-1.5">
              {Array.from({ length: BADGE_SLOTS }, (_, slot) => {
                const badge = equippedBadges[slot];

                return (
                  <div key={`badge-${slot}`} className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => openSelector(slot)}
                      aria-label={
                        badge
                          ? `Cambiar insignia ${slot + 1}`
                          : `Agregar insignia ${slot + 1}`
                      }
                      className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[8px] border bg-[#080616]/80 p-1 transition duration-200 ${
                        badge
                          ? "border-violet-300/45 hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                          : "border-dashed border-violet-300/35 hover:-translate-y-1 hover:scale-[1.045] hover:border-fuchsia-300/80 hover:bg-violet-500/10 hover:shadow-[0_6px_18px_rgba(217,70,239,0.22)]"
                      }`}
                    >
                      {badge?.icon ? (
                        <Image
                          src={badge.icon}
                          alt={badge.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1 transition duration-200 group-hover:scale-110"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-violet-300/35 bg-violet-500/10 text-violet-300 transition duration-200 group-hover:scale-110 group-hover:border-fuchsia-200 group-hover:bg-gradient-to-br group-hover:from-violet-500 group-hover:to-fuchsia-500 group-hover:text-white group-hover:shadow-[0_0_16px_rgba(217,70,239,0.5)]">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      )}

                      {badge && (
                        <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-400">
                          <Check className="h-2 w-2 text-[#04100a]" />
                        </span>
                      )}
                    </button>

                    {badge && (
                      <button
                        type="button"
                        onClick={() => removeBadge(slot)}
                        aria-label={`Quitar ${badge.name}`}
                        className="absolute -right-1 -top-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-[#140b22] text-white/80 transition hover:scale-110 hover:bg-red-500 hover:text-white"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RANGO: EMBLEMA Y DATOS */}

          <div className="relative col-span-2 flex min-w-0 items-center justify-center gap-3 border-t border-violet-300/15 pt-3 sm:col-span-2 sm:gap-4 lg:col-span-1 lg:w-full lg:flex-col lg:gap-0 lg:border-t-0 lg:pt-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[28px]"
            />

            <div className="relative h-[104px] w-[104px] shrink-0 transition-transform duration-300 sm:h-[116px] sm:w-[116px] lg:h-[136px] lg:w-[136px]">
              <Image
                key={rankImage}
                src={`${rankImage}?v=${RANK_VERSION}`}
                alt={`Emblema de ${data.rank.name}`}
                fill
                sizes="(min-width: 1024px) 136px, (min-width: 640px) 116px, 104px"
                unoptimized
                className="object-contain drop-shadow-[0_0_18px_rgba(0,190,255,0.28)]"
              />
            </div>

            <div className="relative min-w-0 text-center lg:mt-3">
              <p className="break-words font-mono text-[12px] font-black uppercase tracking-[0.02em] text-white">
                {data.rank.name}
              </p>

              <p className="mt-1 font-mono text-[10px] font-black text-emerald-300">
                {formatNumber(seasonXp)} XP
              </p>

              {data.rank.xpToNextRank > 0 && (
                <p className="mt-1 whitespace-normal font-mono text-[8px] leading-4 text-slate-300">
                  {formatNumber(data.rank.xpToNextRank)} XP para subir
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SELECTOR CENTRADO EN TODA LA VENTANA */}

      {selectorOpen &&
        activeSlot !== null &&
        portalReady &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020108]/85 p-3 backdrop-blur-md sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeSelector();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="badge-selector-title"
              className="flex max-h-[min(680px,90dvh)] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-violet-300/30 bg-[#090615] shadow-[0_25px_100px_rgba(0,0,0,0.7)]"
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-violet-300/15 px-4 py-4 sm:px-5">
                <div>
                  <h2
                    id="badge-selector-title"
                    className="text-lg font-black text-white"
                  >
                    Insignias
                  </h2>

                  <p className="mt-1 text-[11px] text-white/45">
                    Selecciona una insignia para el espacio {activeSlot + 1}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSelector}
                  aria-label="Cerrar selector"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {data.badges.length === 0 ? (
                  <p className="py-12 text-center text-xs text-white/45">
                    No hay insignias disponibles en la respuesta del perfil.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                    {data.badges.map((badge) => {
                      const unlocked = unlockedIds.has(badge.id);
                      const isEquipped = equipped.includes(badge.id);

                      return (
                        <button
                          key={badge.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => equipBadge(badge)}
                          title={
                            unlocked
                              ? badge.name
                              : `${badge.name}: bloqueada`
                          }
                          className={`group relative flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-xl border p-3 text-center transition duration-200 ${
                            unlocked
                              ? isEquipped
                                ? "border-emerald-300/70 bg-emerald-400/[0.07]"
                                : "border-violet-300/25 bg-[#100a20] hover:-translate-y-0.5 hover:border-fuchsia-300/70 hover:bg-violet-500/[0.08] hover:shadow-[0_8px_20px_rgba(168,85,247,0.15)]"
                              : "cursor-not-allowed border-white/10 bg-[#07050c]"
                          }`}
                        >
                          <div className="relative flex h-[62px] w-full items-center justify-center">
                            {badge.icon && (
                              <Image
                                src={badge.icon}
                                alt=""
                                fill
                                sizes="75px"
                                className={`object-contain transition duration-200 ${
                                  unlocked
                                    ? "group-hover:scale-110"
                                    : "scale-[0.88] grayscale brightness-[0.32] contrast-75"
                                }`}
                              />
                            )}

                            {!unlocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Image
                                  src={BADGE_LOCK}
                                  alt="Bloqueada"
                                  width={34}
                                  height={34}
                                  className="h-8 w-8 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
                                />
                              </div>
                            )}

                            {unlocked && isEquipped && (
                              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400">
                                <Check className="h-2.5 w-2.5 text-black" />
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-2 line-clamp-2 text-[10px] font-bold ${
                              unlocked ? "text-white" : "text-white/35"
                            }`}
                          >
                            {badge.name}
                          </p>

                          <p className="mt-1 text-[8px] font-bold uppercase tracking-wide">
                            {unlocked ? (
                              <span className="text-emerald-300">
                                {isEquipped ? "EQUIPADA" : "DESBLOQUEADA"}
                              </span>
                            ) : (
                              <span className="text-white/30">
                                BLOQUEADA
                              </span>
                            )}
                          </p>

                          {!unlocked && badge.description && (
                            <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-white/30">
                              {badge.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-300/15 px-4 py-3 sm:px-5">
                <p className="text-[10px] text-white/40">
                  {equipped.filter(Boolean).length} de {BADGE_SLOTS} espacios usados
                </p>

                <button
                  type="button"
                  onClick={closeSelector}
                  className="rounded-lg border border-fuchsia-300/40 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110"
                >
                  LISTO
                </button>
              </footer>
            </section>
          </div>,
          document.body,
        )}

      <style jsx>{`
        .level-frame {
          isolation: isolate;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .level-frame-label {
          font-family: "Press Start 2P", "Silkscreen", monospace;
          font-weight: 900;
          letter-spacing: -0.055em;
          -webkit-font-smoothing: none;
          text-shadow:
            0 1px 0 #713b19,
            0 2px 0 #52270f,
            0 3px 4px rgba(0, 0, 0, 0.8);
        }

        .profile-capsule {
          isolation: isolate;
        }

        @media (prefers-reduced-motion: reduce) {
          .level-frame,
          .profile-capsule,
          .profile-capsule *,
          .level-frame * {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
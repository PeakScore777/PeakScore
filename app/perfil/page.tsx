"use client";

import Image from "next/image";
import { AlertTriangle, Check, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  targetScore: number | null;
  averageScore: number | null;
  streak: number;
  simulations: number;
  xp: number;
  historicalXp?: number;
  seasonXp?: number;
  coins: number;
  level: number;
  selectedCharacter: string | null;
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

const PROFILE_IMAGES: Record<string, string> = {
  "peaky-nova": "/avatars/photo_perfil/peaky-nova.png",
  "peaky-nox": "/avatars/photo_perfil/peaky-nox.png",
  zyra: "/avatars/photo_perfil/zyrap.png",
  orby: "/avatars/photo_perfil/orbyp.png",
};

const RANK_IMAGES: Record<string, string> = {
  renacer: "/images/ranks/renacer.webp",
  aprendiz: "/images/ranks/aprendiz.webp",
  explorador: "/images/ranks/explorador.webp",
  competidor: "/images/ranks/competidor.webp",
  avanzado: "/images/ranks/avanzado.webp",
  elite: "/images/ranks/elite.webp",
  maestro: "/images/ranks/maestro.webp",
  "gran-maestro": "/images/ranks/granmaestro.webp",
  leyenda: "/images/ranks/leyenda.webp",
  peak: "/images/ranks/peak.webp",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function getProfileImage(characterId: string | null) {
  return PROFILE_IMAGES[characterId ?? ""] ?? PROFILE_IMAGES["peaky-nova"];
}

function getRankImage(rankId: string) {
  return RANK_IMAGES[rankId] ?? RANK_IMAGES.renacer;
}

export default function PerfilPage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [badgePickerOpen, setBadgePickerOpen] = useState(false);
  const [featuredBadgeIds, setFeaturedBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? "No se pudo cargar el perfil.");
        }

        if (!active) return;

        const profileResult = result as ProfileResponse;
        setData(profileResult);

        setFeaturedBadgeIds(
          profileResult.badges
            .filter((badge) => profileResult.unlockedBadgeIds.includes(badge.id))
            .slice(0, 3)
            .map((badge) => badge.id),
        );
      } catch (requestError) {
        console.error("[Perfil] Error cargando perfil:", requestError);

        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo cargar el perfil.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const unlockedBadges = useMemo(() => {
    if (!data) return [];

    return data.badges.filter((badge) =>
      data.unlockedBadgeIds.includes(badge.id),
    );
  }, [data]);

  const featuredBadges = useMemo(
    () =>
      featuredBadgeIds
        .map((id) => unlockedBadges.find((badge) => badge.id === id))
        .filter((badge): badge is BadgeData => Boolean(badge)),
    [featuredBadgeIds, unlockedBadges],
  );

  const toggleFeaturedBadge = (badgeId: string) => {
    setFeaturedBadgeIds((current) => {
      if (current.includes(badgeId)) {
        return current.filter((id) => id !== badgeId);
      }

      if (current.length >= 3) return current;

      return [...current, badgeId];
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05030b] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="ml-auto w-full max-w-[1240px]">
          <div className="flex min-h-[410px] items-center justify-center rounded-[26px] border border-violet-400/15 bg-[#08050f]">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
              <p className="mt-4 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                Cargando perfil
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#05030b] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="ml-auto w-full max-w-[1240px]">
          <div className="rounded-[26px] border border-red-400/20 bg-[#08050f] p-10 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-red-300/70" />
            <p className="mt-4 font-mono text-sm font-black uppercase text-red-200">
              {error ?? "No se pudo cargar el perfil."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const historicalXp = data.profile.historicalXp ?? data.profile.xp ?? 0;
  const seasonXp = data.profile.seasonXp ?? 0;
  const profileImage = getProfileImage(data.profile.selectedCharacter);
  const rankImage = getRankImage(data.rank.id);
  const displayName = data.profile.fullName?.trim().toUpperCase() || "USUARIO";
  const username = data.profile.email?.split("@")[0]?.trim() || "usuario";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05030b] px-3 pb-12 pt-7 text-white sm:px-5 lg:px-8 lg:pt-9">
      {/* app/layout.tsx ya monta GlobalNavbar. No se agrega otro Navbar aquí. */}

      <section className="relative ml-auto w-full max-w-[1240px] overflow-hidden rounded-[26px] border border-violet-400/20 bg-[#08050f] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 50%, rgba(52,211,153,.18), transparent 28%), radial-gradient(circle at 85% 50%, rgba(139,92,246,.18), transparent 32%)",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-px w-[55%] bg-gradient-to-r from-emerald-400/70 via-cyan-400/30 to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-px w-[55%] bg-gradient-to-l from-violet-400/70 via-fuchsia-400/25 to-transparent"
        />

        <div className="relative z-10 grid min-h-[410px] grid-cols-[150px_minmax(0,1fr)_245px] gap-6 p-6 xl:grid-cols-[170px_minmax(0,1fr)_275px] xl:gap-7 xl:p-7">
          {/* FOTO_PERFIL */}

          <div className="flex items-center justify-center">
            <div className="relative flex h-[175px] w-[145px] items-center justify-center overflow-hidden rounded-[22px] border border-emerald-300/30 bg-[#07130e] shadow-[0_0_30px_rgba(52,211,153,0.07)]">
              <span aria-hidden="true" className="absolute left-2 top-2 h-2 w-2 bg-emerald-300 shadow-[0_0_9px_rgba(110,231,183,.8)]" />
              <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,.8)]" />
              <span aria-hidden="true" className="absolute bottom-2 left-2 h-2 w-2 bg-violet-300" />
              <span aria-hidden="true" className="absolute bottom-2 right-2 h-2 w-2 bg-fuchsia-300" />

              <Image
                src={profileImage}
                alt="Foto de perfil"
                width={180}
                height={180}
                priority
                className="h-[172px] w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,.75)]"
              />
            </div>
          </div>

          {/* USER + LEVEL + SEASON + BADGES */}

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate font-mono text-[30px] font-black uppercase leading-none tracking-[-0.06em] text-white xl:text-[36px]">
                  {displayName}
                </h1>

                <p className="mt-1 font-mono text-[10px] font-bold text-white/35">
                  @{username}
                </p>
              </div>

              <button
                type="button"
                aria-label="Editar perfil"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-300/25 bg-violet-400/[0.05] text-violet-200/70 transition hover:border-violet-200/60 hover:bg-violet-400/15 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid max-w-[640px] grid-cols-2 gap-3">
              {/* NIVEL: AMARILLO, SOLIDO, DELGADO */}

              <div className="relative min-h-[88px] overflow-hidden rounded-xl border border-yellow-300/55 bg-[#2a2108] px-4 py-3 shadow-[inset_0_0_25px_rgba(250,204,21,0.045)]">
                <span aria-hidden="true" className="absolute right-0 top-0 h-px w-20 bg-yellow-200/70" />

                <p className="font-mono text-[7px] font-black uppercase tracking-[0.18em] text-yellow-300/70">
                  NIVEL
                </p>

                <p className="mt-1 font-mono text-[21px] font-black leading-none text-white">
                  Nivel {data.profile.level}
                </p>

                <p className="mt-2 font-mono text-[8px] font-black uppercase text-yellow-100/55">
                  {formatNumber(historicalXp)} XP
                </p>
              </div>

              {/* TEMPORADA: AZUL, SOLIDO, MISMO TAMANO */}

              <div className="relative min-h-[88px] overflow-hidden rounded-xl border border-cyan-300/55 bg-[#0a2851] px-4 py-3 shadow-[inset_0_0_25px_rgba(34,211,238,0.055)]">
                <span aria-hidden="true" className="absolute right-0 top-0 h-px w-20 bg-cyan-200/70" />

                <p className="font-mono text-[7px] font-black uppercase tracking-[0.18em] text-cyan-200/80">
                  TEMPORADA
                </p>

                <p className="mt-1 font-mono text-[21px] font-black leading-none text-white">
                  Temporada {data.season.number}
                </p>

                <p className="mt-2 font-mono text-[8px] font-black uppercase text-cyan-100/60">
                  {formatNumber(seasonXp)} XP DE TEMPORADA
                </p>
              </div>
            </div>

            <div className="mt-5 h-px w-full max-w-[650px] bg-gradient-to-r from-emerald-300/45 via-white/10 to-transparent" />

            {/* INSIGNIAS */}

            <div className="mt-4 max-w-[650px]">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-white/45">
                  INSIGNIAS
                </p>

                {unlockedBadges.length > 0 && (
                  <p className="font-mono text-[7px] font-bold text-white/25">
                    {unlockedBadges.length} DESBLOQUEADAS
                  </p>
                )}
              </div>

              {unlockedBadges.length === 0 ? (
                <div className="flex min-h-[78px] items-center gap-3 rounded-xl border border-dashed border-yellow-300/20 bg-[#161007] px-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-yellow-300/15 bg-yellow-300/[0.04]">
                    <AlertTriangle className="h-4 w-4 text-yellow-300/55" />
                  </div>

                  <div>
                    <p className="font-mono text-[8px] font-black uppercase text-yellow-100/55">
                      AÚN NO TIENES INSIGNIAS
                    </p>

                    <p className="mt-1 max-w-[470px] font-mono text-[7px] leading-4 text-white/25">
                      Completa actividades para conseguir tus primeras insignias.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const badge = featuredBadges[index];

                    if (!badge) {
                      return (
                        <button
                          key={"empty-" + index}
                          type="button"
                          onClick={() => setBadgePickerOpen(true)}
                          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-dashed border-violet-300/25 bg-[#0b0812] text-violet-200/45 transition hover:border-violet-300/55 hover:bg-violet-400/[0.06] hover:text-white"
                          aria-label="Agregar insignia"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setBadgePickerOpen(true)}
                        title={badge.name}
                        className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-[#0b0812] transition hover:-translate-y-0.5 hover:border-violet-300/50"
                      >
                        {badge.icon ? (
                          <Image
                            src={badge.icon}
                            alt={badge.name}
                            width={52}
                            height={52}
                            className="h-[52px] w-[52px] object-contain"
                          />
                        ) : (
                          <span className="font-mono text-[8px] text-white/25">?</span>
                        )}

                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#08050f] bg-emerald-400">
                          <Check className="h-2.5 w-2.5 text-black" />
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setBadgePickerOpen(true)}
                    className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-dashed border-violet-300/30 bg-violet-400/[0.035] text-violet-200/55 transition hover:border-violet-300/65 hover:bg-violet-400/[0.08] hover:text-white"
                    aria-label="Agregar insignia"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RANGO GRANDE, SIN TARJETA ALREDEDOR.
              El fondo negro del WEBP se conserva por ahora. */}

          <div className="relative flex min-h-[360px] flex-col items-center justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-[60px]" />

            <div className="relative h-[250px] w-[250px]">
              <Image
                src={rankImage}
                alt=""
                fill
                sizes="250px"
                priority
                className="object-contain drop-shadow-[0_0_28px_rgba(110,231,183,0.14)]"
              />
            </div>

            <div className="relative -mt-5 text-center">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                {data.rank.name}
              </p>

              <p className="mt-1 font-mono text-[8px] font-black uppercase text-emerald-300/75">
                {formatNumber(seasonXp)} XP
              </p>

              {data.rank.xpToNextRank > 0 && (
                <p className="mt-0.5 font-mono text-[7px] text-white/25">
                  {formatNumber(data.rank.xpToNextRank)} XP para subir
                </p>
              )}
            </div>

            <button
              type="button"
              className="group relative mt-4 flex h-10 w-[170px] items-center justify-center gap-2 overflow-hidden rounded-xl border border-violet-300/45 bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_25px_rgba(139,92,246,0.25)] transition-all hover:-translate-y-0.5 hover:border-violet-100 hover:shadow-[0_12px_32px_rgba(168,85,247,0.4)]"
            >
              <span aria-hidden="true" className="absolute inset-y-0 left-[-35%] w-[25%] rotate-[18deg] bg-white/35 blur-md transition-transform duration-700 group-hover:translate-x-[500%]" />
              <Pencil className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">EDITAR PERFIL</span>
              <span className="relative z-10 text-violet-200">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* SELECTOR DE INSIGNIAS */}

      {badgePickerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setBadgePickerOpen(false);
            }
          }}
        >
          <div className="w-full max-w-[720px] overflow-hidden rounded-[24px] border border-violet-300/20 bg-[#0b0712] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="font-mono text-[8px] font-black uppercase tracking-[0.15em] text-violet-300">
                  INSIGNIAS
                </p>
                <h2 className="mt-1 font-mono text-lg font-black text-white">
                  Personaliza tus insignias
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setBadgePickerOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[7px] font-black uppercase text-white/45 hover:text-white"
              >
                CERRAR
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {unlockedBadges.length === 0 ? (
                <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-9 w-9 text-yellow-300/55" />
                  <p className="mt-4 font-mono text-sm font-black uppercase text-white/55">
                    AÚN NO TIENES INSIGNIAS
                  </p>
                  <p className="mt-2 max-w-sm font-mono text-[8px] leading-5 text-white/25">
                    Completa actividades para desbloquearlas.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {unlockedBadges.map((badge) => {
                    const selected = featuredBadgeIds.includes(badge.id);

                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => toggleFeaturedBadge(badge.id)}
                        className={
                          selected
                            ? "rounded-2xl border border-emerald-300/40 bg-emerald-400/[0.06] p-4 text-left"
                            : "rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-left hover:border-violet-300/30"
                        }
                      >
                        <div className="flex h-28 items-center justify-center">
                          {badge.icon ? (
                            <Image
                              src={badge.icon}
                              alt={badge.name}
                              width={100}
                              height={100}
                              className="h-24 w-24 object-contain"
                            />
                          ) : (
                            <Plus className="h-8 w-8 text-white/20" />
                          )}
                        </div>

                        <p className="font-mono text-[9px] font-black text-white">
                          {badge.name}
                        </p>

                        <p className="mt-1 font-mono text-[7px] leading-4 text-white/30">
                          {badge.description}
                        </p>

                        {selected && (
                          <p className="mt-2 font-mono text-[6px] font-black uppercase text-emerald-300">
                            MOSTRADA EN PERFIL
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

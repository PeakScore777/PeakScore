"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Coins,
  Flame,
  Home,
  Lock,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Target,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type Character = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  profile: string;
};

type CharacterCatalogEntry = {
  id: string;
  name: string;
  description: string;
  price_coins: number;
  xp_bonus_percent: number;
  coin_bonus_percent: number;
  is_active: boolean;
};

type Badge = {
  id: string;
  name: string;
  level: string;
  image: string;
  description: string;
  group: "aprendizaje" | "constante" | "racha";
};

type ProfileData = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  targetScore: number | null;
  averageScore: number | null;
  streak: number;
  simulations: number;
  xp: number;
  coins: number;
  level: number;
  selectedCharacter: string;
};

type Rank = {
  id: string;
  name: string;
  minXp: number;
  maxXp: number | null;
  identity: string;
};

const characters: Character[] = [
  {
    id: "peaky-nova",
    name: "Peaky Nova",
    description: "Guardián del conocimiento y del universo PeakScore.",
    avatar: "/characters/peaky-nova/peaky-nova-front.png",
    profile: "/avatars/photo_perfil/peaky-nova.png",
  },
  {
    id: "peaky-nox",
    name: "Peaky Nox",
    description: "La fuerza del multiverso oscuro.",
    avatar: "/avatars/peaky-nox.webp",
    profile: "/avatars/photo_perfil/peaky-nox.png",
  },
  {
    id: "zyra",
    name: "Zyra",
    description: "Curiosidad, exploración y aprendizaje.",
    avatar: "/avatars/zorra.webp",
    profile: "/avatars/photo_perfil/zyra.png",
  },
  {
    id: "orby",
    name: "Orby",
    description: "Tecnología, precisión e inteligencia.",
    avatar: "/avatars/orby.webp",
    profile: "/avatars/photo_perfil/orby.png",
  },
];

const badges: Badge[] = [
  {
    id: "aprendizaje-1",
    name: "Aprendizaje",
    level: "Nivel I",
    image: "/badges/aprendizaje-1.png",
    description: "Completa 5 simulacros simples.",
    group: "aprendizaje",
  },
  {
    id: "aprendizaje-2",
    name: "Aprendizaje",
    level: "Nivel II",
    image: "/badges/aprendizaje-2.png",
    description: "Completa 20 simulacros simples.",
    group: "aprendizaje",
  },
  {
    id: "aprendizaje-3",
    name: "Aprendizaje",
    level: "Nivel III",
    image: "/badges/aprendizaje-3.png",
    description: "Completa 50 simulacros simples.",
    group: "aprendizaje",
  },
  {
    id: "constante-1",
    name: "Constante",
    level: "Nivel I",
    image: "/badges/constante-1.png",
    description: "Completa 3 simulacros completos.",
    group: "constante",
  },
  {
    id: "racha-1",
    name: "Racha",
    level: "Nivel I",
    image: "/badges/racha-1.png",
    description: "Mantén una racha de 10 días.",
    group: "racha",
  },
  {
    id: "racha-2",
    name: "Racha",
    level: "Nivel II",
    image: "/badges/racha-2.png",
    description: "Mantén una racha de 20 días.",
    group: "racha",
  },
  {
    id: "racha-3",
    name: "Racha",
    level: "Nivel III",
    image: "/badges/racha-3.png",
    description: "Mantén una racha de 30 días.",
    group: "racha",
  },
];

const ranks: Rank[] = [
  { id: "novato", name: "Novato", minXp: 0, maxXp: 499, identity: "Recién comienza" },
  { id: "aprendiz", name: "Aprendiz", minXp: 500, maxXp: 1499, identity: "Está construyendo bases" },
  { id: "explorador", name: "Explorador", minXp: 1500, maxXp: 2999, identity: "Empieza a dominar" },
  { id: "competidor", name: "Competidor", minXp: 3000, maxXp: 4999, identity: "Buen rendimiento" },
  { id: "avanzado", name: "Avanzado", minXp: 5000, maxXp: 7499, identity: "Alto nivel" },
  { id: "elite", name: "Élite", minXp: 7500, maxXp: 9999, identity: "Muy buen dominio" },
  { id: "maestro", name: "Maestro", minXp: 10000, maxXp: 14999, identity: "Dominio excepcional" },
  { id: "gran-maestro", name: "Gran Maestro", minXp: 15000, maxXp: 24999, identity: "Nivel sobresaliente" },
  { id: "peak", name: "Peak", minXp: 25000, maxXp: null, identity: "Máximo rango" },
];

const rankIcons: Record<string, string> = {
  novato: "✦",
  aprendiz: "🌱",
  explorador: "⚡",
  competidor: "🔥",
  avanzado: "💎",
  elite: "🏆",
  maestro: "👑",
  "gran-maestro": "🌟",
  peak: "🚀",
};

const navItems = [
  { label: "Inicio", href: "/dashboard", icon: Home },
  { label: "Simulacros", href: "/dashboard/simulacros", icon: Target },
  { label: "Progreso", href: "/dashboard", icon: BarChart3 },
  { label: "Aprender", href: "/dashboard", icon: BookOpen },
  { label: "Retos", href: "/dashboard", icon: Sparkles },
  { label: "Insignias", href: "#insignias", icon: Shield },
  { label: "Mi Perfil", href: "/perfil", icon: UserRound },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-CO").format(value);

export default function PerfilPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [selectedCharacterId, setSelectedCharacterId] = useState("peaky-nova");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [characterCatalog, setCharacterCatalog] = useState<CharacterCatalogEntry[]>([]);
  const [unlockedCharacterIds, setUnlockedCharacterIds] = useState<string[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [characterActionLoading, setCharacterActionLoading] = useState(false);
  const [characterActionError, setCharacterActionError] = useState<string | null>(null);
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [purchaseModalCharacterId, setPurchaseModalCharacterId] = useState<string | null>(null);

  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ??
    characters[0];

  const selectedCatalogCharacter = characterCatalog.find(
    (character) => character.id === selectedCharacterId,
  );

  const currentRank = useMemo(() => {
    const xp = profileData?.xp ?? 0;

    return (
      ranks.find(
        (rank) =>
          xp >= rank.minXp &&
          (rank.maxXp === null || xp <= rank.maxXp),
      ) ?? ranks[0]
    );
  }, [profileData?.xp]);

  const currentRankIndex = ranks.findIndex(
    (rank) => rank.id === currentRank.id,
  );

  const nextRank =
    currentRankIndex >= 0 && currentRankIndex < ranks.length - 1
      ? ranks[currentRankIndex + 1]
      : null;

  const rankProgress = useMemo(() => {
    const xp = profileData?.xp ?? 0;

    if (!nextRank) return 100;

    const span = nextRank.minXp - currentRank.minXp;

    if (span <= 0) return 100;

    return Math.max(
      0,
      Math.min(
        100,
        ((xp - currentRank.minXp) / span) * 100,
      ),
    );
  }, [currentRank, nextRank, profileData?.xp]);

  const collectionGroups = [
    {
      id: "aprendizaje",
      label: "Aprendizaje",
      items: badges.filter((badge) => badge.group === "aprendizaje"),
      icon: "🌱",
    },
    {
      id: "constante",
      label: "Constantes",
      items: badges.filter((badge) => badge.group === "constante"),
      icon: "⚔️",
    },
    {
      id: "racha",
      label: "Rachas",
      items: badges.filter((badge) => badge.group === "racha"),
      icon: "🔥",
    },
  ];

  const loadProfile = async () => {
    try {
      setProfileLoading(true);

      const response = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el perfil");
      }

      const data = await response.json();

      setProfileData(data.profile);
      setSelectedCharacterId(
        data.profile?.selectedCharacter ?? "peaky-nova",
      );
      setCharacterCatalog(data.characters ?? []);
      setUnlockedCharacterIds(data.unlockedCharacterIds ?? []);
      setUnlockedBadgeIds(data.unlockedBadgeIds ?? []);
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("peakscore-profile-theme", theme);
  }, [theme]);

  const changeCharacter = async (id: string) => {
    if (
      characterActionLoading ||
      id === selectedCharacterId ||
      !unlockedCharacterIds.includes(id)
    ) {
      return;
    }

    try {
      setCharacterActionLoading(true);
      setCharacterActionError(null);

      const response = await fetch("/api/profile/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "equip",
          characterId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo equipar el personaje",
        );
      }

      const nextCharacter =
        data.profile?.selectedCharacter ?? id;

      setSelectedCharacterId(nextCharacter);

      setProfileData((current) =>
        current
          ? { ...current, selectedCharacter: nextCharacter }
          : current,
      );
    } catch (error) {
      setCharacterActionError(
        error instanceof Error
          ? error.message
          : "No se pudo equipar el personaje",
      );
    } finally {
      setCharacterActionLoading(false);
    }
  };

  const purchaseCharacter = async (id: string) => {
    if (
      characterActionLoading ||
      unlockedCharacterIds.includes(id)
    ) {
      return false;
    }

    try {
      setCharacterActionLoading(true);
      setCharacterActionError(null);

      const response = await fetch("/api/profile/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          characterId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo comprar el personaje",
        );
      }

      setUnlockedCharacterIds((current) =>
        current.includes(id) ? current : [...current, id],
      );

      if (data.profile) {
        setProfileData((current) =>
          current
            ? {
                ...current,
                coins: data.profile.coins,
                xp: data.profile.xp,
                level: data.profile.level,
                selectedCharacter:
                  data.profile.selectedCharacter ??
                  current.selectedCharacter,
              }
            : current,
        );
      }

      return true;
    } catch (error) {
      setCharacterActionError(
        error instanceof Error
          ? error.message
          : "No se pudo comprar el personaje",
      );

      return false;
    } finally {
      setCharacterActionLoading(false);
    }
  };

  const selectedPurchaseCharacter = purchaseModalCharacterId
    ? characters.find(
        (character) => character.id === purchaseModalCharacterId,
      ) ?? null
    : null;

  const selectedPurchaseCatalog = purchaseModalCharacterId
    ? characterCatalog.find(
        (character) => character.id === purchaseModalCharacterId,
      ) ?? null
    : null;

  const purchasePrice =
    selectedPurchaseCatalog?.price_coins ?? 0;

  const hasEnoughCoins =
    (profileData?.coins ?? 0) >= purchasePrice;

  const surface =
    theme === "dark"
      ? "border-white/10 bg-[#10091a]"
      : "border-black/8 bg-white";

  const muted =
    theme === "dark" ? "text-white/45" : "text-[#6c786f]";

  const accent =
    theme === "dark" ? "text-violet-300" : "text-emerald-700";

  return (
    <main
      className={
        theme === "dark"
          ? "min-h-screen bg-[#07040d] text-white"
          : "min-h-screen bg-[#f7faf7] text-[#102019]"
      }
    >
      <header
        className={
          theme === "dark"
            ? "sticky top-0 z-40 border-b border-violet-400/20 bg-[#0b0713]/95 backdrop-blur-xl"
            : "sticky top-0 z-40 border-b border-emerald-300/40 bg-white/95 backdrop-blur-xl"
        }
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
          >
            <span
              className={
                theme === "dark"
                  ? "flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-400/10 text-emerald-300"
                  : "flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/60 bg-emerald-50 text-emerald-700"
              }
            >
              <Sparkles size={17} />
            </span>

            <span className="text-lg font-black font-mono">
              PeakScore
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.label === "Mi Perfil";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    active
                      ? theme === "dark"
                        ? "flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-[9px] font-black text-emerald-200 font-mono"
                        : "flex items-center gap-2 rounded-lg border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700 font-mono"
                      : theme === "dark"
                        ? "flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold text-white/50 transition hover:bg-white/[0.03] hover:text-white font-mono"
                        : "flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold text-[#65736a] transition hover:bg-[#f0f5f1] hover:text-[#17251d] font-mono"
                  }
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span
              className={
                theme === "dark"
                  ? "hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[9px] font-black text-yellow-200 font-mono sm:flex"
                  : "hidden items-center gap-1.5 rounded-lg border border-black/8 bg-white px-3 py-2 text-[9px] font-black text-yellow-700 font-mono sm:flex"
              }
            >
              <Coins size={14} />
              {formatNumber(profileData?.coins ?? 0)}
            </span>

            <span
              className={
                theme === "dark"
                  ? "hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[9px] font-black text-orange-300 font-mono sm:flex"
                  : "hidden items-center gap-1.5 rounded-lg border border-black/8 bg-white px-3 py-2 text-[9px] font-black text-orange-600 font-mono sm:flex"
              }
            >
              <Flame size={14} fill="currentColor" />
              {formatNumber(profileData?.streak ?? 0)}
            </span>

            <button
              type="button"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light",
                )
              }
              aria-label="Cambiar tema"
              className={
                theme === "dark"
                  ? "flex h-9 w-9 items-center justify-center rounded-lg border border-violet-300/25 bg-violet-500/10 text-violet-200 transition hover:border-violet-300/50"
                  : "flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/50 bg-emerald-50 text-emerald-700 transition hover:border-emerald-400"
              }
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div
              className={
                theme === "dark"
                  ? "h-9 w-9 overflow-hidden rounded-lg border border-emerald-300/35 bg-emerald-400/10"
                  : "h-9 w-9 overflow-hidden rounded-lg border border-emerald-300/60 bg-emerald-50"
              }
            >
              <Image
                src={selectedCharacter.profile}
                alt={selectedCharacter.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={"text-[9px] font-black uppercase tracking-[0.18em] " + accent + " font-mono"}>
              PEAKSCORE
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] font-mono sm:text-5xl">
              MI PERFIL
            </h1>

            <p className={"mt-1 text-xs " + muted + " font-mono"}>
              Tu progreso, personajes e insignias en un solo lugar.
            </p>
          </div>

          <div
            className={
              theme === "dark"
                ? "rounded-xl border border-emerald-300/20 bg-emerald-400/[0.04] px-4 py-2.5"
                : "rounded-xl border border-emerald-300/35 bg-emerald-50 px-4 py-2.5"
            }
          >
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300 font-mono">
              Peaky Nova
            </p>
            <p className={"mt-0.5 text-[8px] " + muted + " font-mono"}>
              Identidad visual de PeakScore
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[310px_1fr]">
          <aside className="space-y-4">
            <section className={"overflow-hidden rounded-2xl border " + surface}>
              <div className="border-b border-emerald-300/15 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300 font-mono">
                  Perfil actual
                </p>
                <h2 className="mt-1 text-lg font-black font-mono">
                  Tu personaje
                </h2>
              </div>

              <div
                className={
                  theme === "dark"
                    ? "relative flex min-h-[255px] items-end justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(168,85,247,.18),transparent_42%),linear-gradient(180deg,#140c22_0%,#090612_100%)] px-4 pt-5"
                    : "relative flex min-h-[255px] items-end justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(34,197,94,.13),transparent_42%),linear-gradient(180deg,#f0faf2_0%,#eaf1ec_100%)] px-4 pt-5"
                }
              >
                <div className="absolute inset-x-10 bottom-6 h-px bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />

                <Image
                  src={selectedCharacter.avatar}
                  alt={selectedCharacter.name}
                  width={420}
                  height={420}
                  className="relative z-10 max-h-[220px] w-auto object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,.35)]"
                />
              </div>

              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black font-mono">
                      {profileData?.fullName ?? "Mi perfil"}
                    </p>
                    <p className={"mt-1 text-[8px] " + muted + " font-mono"}>
                      Estudiante · Nivel {profileData?.level ?? 1}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[7px] font-black text-emerald-200 font-mono">
                    EQUIPADO
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-black font-mono">
                  {selectedCharacter.name}
                </h3>

                <p className={"mt-1 text-[9px] leading-4 " + muted + " font-mono"}>
                  {selectedCharacter.description}
                </p>

                <div
                  className={
                    theme === "dark"
                      ? "mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      : "mt-3 rounded-xl border border-black/7 bg-[#fbfcfb] p-3"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className={"text-[7px] uppercase tracking-[0.1em] " + muted + " font-mono"}>
                      Bonus
                    </span>
                    <Sparkles size={13} className="text-cyan-300" />
                  </div>

                  <p className="mt-1 text-[10px] font-black text-cyan-200 font-mono">
                    {selectedCatalogCharacter?.xp_bonus_percent
                      ? "+" + selectedCatalogCharacter.xp_bonus_percent + "% XP"
                      : selectedCatalogCharacter?.coin_bonus_percent
                        ? "+" + selectedCatalogCharacter.coin_bonus_percent + "% monedas"
                        : "Sin bonus"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("personajes")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className={
                    theme === "dark"
                      ? "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/[0.05] px-4 py-3 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-200 font-mono transition hover:bg-emerald-400/[0.09]"
                      : "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/45 bg-emerald-50 px-4 py-3 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700 font-mono transition hover:bg-emerald-100"
                  }
                >
                  Cambiar personaje
                  <ArrowRight size={13} />
                </button>
              </div>
            </section>

            <section className={"rounded-2xl border " + surface + " p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                    Estadísticas
                  </p>
                  <h2 className="mt-1 text-lg font-black font-mono">
                    Tu rendimiento
                  </h2>
                </div>
                <BarChart3 size={18} className={accent} />
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={"text-[9px] " + muted + " font-mono"}>XP total</span>
                  <span className="text-[10px] font-black font-mono">
                    {formatNumber(profileData?.xp ?? 0)} XP
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={"text-[9px] " + muted + " font-mono"}>Simulacros</span>
                  <span className="text-[10px] font-black font-mono">
                    {formatNumber(profileData?.simulations ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={"text-[9px] " + muted + " font-mono"}>Promedio ICFES</span>
                  <span className="text-[10px] font-black text-amber-300 font-mono">
                    {profileData?.averageScore != null
                      ? profileData.averageScore + "%"
                      : "0%"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={"text-[9px] " + muted + " font-mono"}>Racha</span>
                  <span className="text-[10px] font-black text-orange-300 font-mono">
                    {formatNumber(profileData?.streak ?? 0)} días
                  </span>
                </div>
              </div>
            </section>

            <section className={"rounded-2xl border " + surface + " p-4"}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                    Temporada
                  </p>
                  <h2 className="mt-1 text-lg font-black font-mono">
                    Tu rango
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setRankModalOpen(true)}
                  className={"text-[8px] font-black uppercase tracking-[0.08em] " + accent + " font-mono"}
                >
                  Ver rangos
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className={
                    theme === "dark"
                      ? "h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-300/40 bg-violet-400/10"
                      : "h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-400 bg-emerald-50"
                  }
                >
                  <Image
                    src={selectedCharacter.profile}
                    alt={selectedCharacter.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black font-mono">
                      {currentRank.name}
                    </p>
                    <span>{rankIcons[currentRank.id]}</span>
                  </div>

                  <p className={"mt-0.5 text-[8px] " + muted + " font-mono"}>
                    {formatNumber(currentRank.minXp)}+ XP
                  </p>

                  <div
                    className={
                      theme === "dark"
                        ? "mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                        : "mt-2 h-1.5 overflow-hidden rounded-full bg-black/8"
                    }
                  >
                    <div
                      className={
                        theme === "dark"
                          ? "h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          : "h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                      }
                      style={{ width: rankProgress + "%" }}
                    />
                  </div>
                </div>
              </div>

              <div
                className={
                  theme === "dark"
                    ? "mt-4 rounded-xl border border-violet-300/15 bg-violet-500/[0.05] p-3"
                    : "mt-4 rounded-xl border border-emerald-300/30 bg-emerald-50 p-3"
                }
              >
                <p className="text-[9px] font-black font-mono">
                  Próximo: {nextRank?.name ?? "Peak"}
                </p>

                <p className={"mt-1 text-[8px] leading-4 " + muted + " font-mono"}>
                  Al reiniciar la temporada, el rango competitivo quedará en Renacer. El reinicio mensual se conectará cuando definamos la temporada.
                </p>
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-4">
            <section className={"rounded-2xl border " + surface + " p-4"}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                    Tu identidad
                  </p>

                  <h2 className="mt-1 text-2xl font-black font-mono">
                    {profileData?.fullName ?? "Mi perfil"}
                  </h2>

                  <p className={"mt-1 text-[9px] " + muted + " font-mono"}>
                    Estudiante · Nivel {profileData?.level ?? 1}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={"text-[8px] " + muted + " font-mono"}>
                      Experiencia
                    </span>
                    <span className="text-[9px] font-black font-mono">
                      {formatNumber(profileData?.xp ?? 0)} XP
                    </span>
                  </div>

                  <div
                    className={
                      theme === "dark"
                        ? "mt-2 h-3 overflow-hidden rounded-full bg-white/10"
                        : "mt-2 h-3 overflow-hidden rounded-full bg-black/8"
                    }
                  >
                    <div
                      className={
                        theme === "dark"
                          ? "h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-300"
                          : "h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-cyan-300"
                      }
                      style={{
                        width:
                          (nextRank
                            ? Math.min(
                                100,
                                ((profileData?.xp ?? 0) /
                                  Math.max(nextRank.minXp, 1)) *
                                  100,
                              )
                            : 100) + "%",
                      }}
                    />
                  </div>
                </div>

                <div
                  className={
                    theme === "dark"
                      ? "rounded-xl border border-emerald-300/20 bg-emerald-400/[0.04] p-3"
                      : "rounded-xl border border-emerald-300/30 bg-emerald-50 p-3"
                  }
                >
                  <p className={"text-[8px] uppercase tracking-[0.12em] " + muted + " font-mono"}>
                    Rango actual
                  </p>

                  <p className="mt-1 text-xl font-black font-mono">
                    {rankIcons[currentRank.id]} {currentRank.name}
                  </p>

                  <p className={"mt-1 text-[8px] " + muted + " font-mono"}>
                    {formatNumber(currentRank.minXp)}+ XP
                  </p>
                </div>
              </div>
            </section>

            <section className={"rounded-2xl border " + surface + " p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                    Aprender
                  </p>

                  <h2 className="mt-1 text-lg font-black font-mono">
                    Mi progreso
                  </h2>

                  <p className={"mt-1 text-[9px] " + muted + " font-mono"}>
                    Espacio reservado para los mundos y niveles de Aprender.
                  </p>
                </div>

                <span
                  className={
                    theme === "dark"
                      ? "rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[8px] font-black text-violet-200 font-mono"
                      : "rounded-full border border-emerald-300/30 bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700 font-mono"
                  }
                >
                  PRÓXIMAMENTE
                </span>
              </div>

              <div
                className={
                  theme === "dark"
                    ? "mt-4 flex min-h-[210px] items-center justify-center rounded-2xl border border-dashed border-violet-300/15 bg-violet-400/[0.03]"
                    : "mt-4 flex min-h-[210px] items-center justify-center rounded-2xl border border-dashed border-emerald-300/35 bg-emerald-50/40"
                }
              >
                <div className="max-w-md px-6 text-center">
                  <BookOpen
                    size={30}
                    className={
                      theme === "dark"
                        ? "mx-auto text-violet-300/70"
                        : "mx-auto text-emerald-600/70"
                    }
                  />

                  <p className="mt-3 text-sm font-black font-mono">
                    Aquí aparecerá tu avance por mundos.
                  </p>

                  <p className={"mt-2 text-[9px] leading-4 " + muted + " font-mono"}>
                    Matemáticas, Lectura Crítica, Sociales, Ciencias Naturales e Inglés.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="personajes"
              className={"rounded-2xl border " + surface + " p-4"}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                    Colección
                  </p>

                  <h2 className="mt-1 text-lg font-black font-mono">
                    Mis personajes
                  </h2>
                </div>

                <span
                  className={
                    theme === "dark"
                      ? "rounded-full border border-emerald-300/20 bg-emerald-400/[0.05] px-2.5 py-1 text-[8px] font-black text-emerald-200 font-mono"
                      : "rounded-full border border-emerald-300/35 bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700 font-mono"
                  }
                >
                  {unlockedCharacterIds.length}/4
                </span>
              </div>

              {characterActionError && (
                <div
                  role="alert"
                  className={
                    theme === "dark"
                      ? "mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-400/[0.05] px-3 py-2 text-[9px] text-red-200 font-mono"
                      : "mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700 font-mono"
                  }
                >
                  <span>{characterActionError}</span>
                  <button
                    type="button"
                    onClick={() => setCharacterActionError(null)}
                    aria-label="Cerrar error"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {characters.map((character) => {
                  const unlocked =
                    unlockedCharacterIds.includes(character.id);
                  const equipped =
                    selectedCharacterId === character.id;

                  const catalogCharacter =
                    characterCatalog.find(
                      (item) => item.id === character.id,
                    );

                  return (
                    <button
                      key={character.id}
                      type="button"
                      disabled={characterActionLoading}
                      onClick={() => {
                        if (unlocked) {
                          void changeCharacter(character.id);
                        } else {
                          setCharacterActionError(null);
                          setPurchaseModalCharacterId(character.id);
                        }
                      }}
                      className={
                        equipped
                          ? theme === "dark"
                            ? "rounded-2xl border border-emerald-300/50 bg-emerald-400/[0.05] p-3 text-left"
                            : "rounded-2xl border border-emerald-400 bg-emerald-50 p-3 text-left"
                          : theme === "dark"
                            ? "rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:border-violet-300/30 hover:bg-white/[0.04]"
                            : "rounded-2xl border border-black/7 bg-[#fbfcfb] p-3 text-left transition hover:border-emerald-300/45 hover:bg-emerald-50"
                      }
                    >
                      <div
                        className={
                          theme === "dark"
                            ? "relative flex h-[165px] items-end justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_25%,rgba(168,85,247,.16),transparent_48%),#0b0712]"
                            : "relative flex h-[165px] items-end justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_25%,rgba(34,197,94,.12),transparent_48%),#eef5ef]"
                        }
                      >
                        {!unlocked && (
                          <span className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/25">
                            <Lock size={13} className="text-white/60" />
                          </span>
                        )}

                        <Image
                          src={character.avatar}
                          alt={character.name}
                          width={300}
                          height={300}
                          className={
                            unlocked
                              ? "max-h-[150px] w-auto object-contain"
                              : "max-h-[150px] w-auto object-contain opacity-45 grayscale"
                          }
                        />
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-black font-mono">
                            {character.name}
                          </h3>

                          {equipped && (
                            <span className="rounded-full bg-emerald-400 px-2 py-1 text-[7px] font-black text-[#07130d] font-mono">
                              EQUIPADO
                            </span>
                          )}
                        </div>

                        <p className={"mt-1 line-clamp-2 text-[8px] leading-4 " + muted + " font-mono"}>
                          {character.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          {!unlocked && catalogCharacter ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-yellow-300/20 bg-yellow-300/[0.05] px-2 py-1 text-[8px] font-black text-yellow-200 font-mono">
                              <Coins size={10} />
                              {formatNumber(
                                catalogCharacter.price_coins,
                              )}
                            </span>
                          ) : (
                            <span className={"text-[8px] " + muted + " font-mono"}>
                              Disponible
                            </span>
                          )}

                          {catalogCharacter?.xp_bonus_percent ? (
                            <span className="text-[8px] font-black text-cyan-300 font-mono">
                              +{catalogCharacter.xp_bonus_percent}% XP
                            </span>
                          ) : catalogCharacter?.coin_bonus_percent ? (
                            <span className="text-[8px] font-black text-yellow-300 font-mono">
                              +{catalogCharacter.coin_bonus_percent}% 🪙
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <section className={"rounded-2xl border " + surface + " p-4"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                      Recompensas
                    </p>

                    <h2 className="mt-1 text-lg font-black font-mono">
                      Misión del día
                    </h2>
                  </div>

                  <Flame size={18} className="text-orange-300" />
                </div>

                <p className={"mt-3 text-[9px] " + muted + " font-mono"}>
                  Completa 3 actividades hoy y obtén:
                </p>

                <div className="mt-3 flex gap-2">
                  <span
                    className={
                      theme === "dark"
                        ? "rounded-lg border border-violet-300/15 bg-violet-400/[0.05] px-3 py-2 text-[9px] font-black text-violet-200 font-mono"
                        : "rounded-lg border border-emerald-300/30 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700 font-mono"
                    }
                  >
                    +150 XP
                  </span>

                  <span className="rounded-lg border border-yellow-300/20 bg-yellow-300/[0.04] px-3 py-2 text-[9px] font-black text-yellow-200 font-mono">
                    +100 🪙
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className={"text-[8px] " + muted + " font-mono"}>
                      Progreso
                    </span>
                    <span className="text-[8px] font-black font-mono">
                      2/3
                    </span>
                  </div>

                  <div
                    className={
                      theme === "dark"
                        ? "mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                        : "mt-2 h-2 overflow-hidden rounded-full bg-black/8"
                    }
                  >
                    <div
                      className={
                        theme === "dark"
                          ? "h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          : "h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className={"text-[8px] " + muted + " font-mono"}>
                      Siguiente
                    </p>
                    <p className="mt-1 text-[10px] font-black font-mono">
                      Párrafos con P
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className={
                      theme === "dark"
                        ? "rounded-xl border border-violet-300/15 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase tracking-[0.08em] text-violet-200 opacity-70 font-mono"
                        : "rounded-xl border border-emerald-300/30 bg-emerald-50 px-3 py-2 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700 opacity-70 font-mono"
                    }
                  >
                    Próximamente
                  </button>
                </div>
              </section>

              <section
                id="insignias"
                className={"rounded-2xl border " + surface + " p-4"}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={"text-[8px] font-black uppercase tracking-[0.14em] " + accent + " font-mono"}>
                      Colección
                    </p>

                    <h2 className="mt-1 text-lg font-black font-mono">
                      Mi colección
                    </h2>

                    <p className={"mt-1 text-[9px] " + muted + " font-mono"}>
                      Insignias agrupadas por colección.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCollectionModalOpen(true)}
                    className={
                      theme === "dark"
                        ? "inline-flex items-center gap-1 text-[8px] font-black text-violet-200 font-mono"
                        : "inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 font-mono"
                    }
                  >
                    Ver colección
                    <ChevronRight size={13} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {collectionGroups.map((group) => {
                    const unlockedCount = group.items.filter((badge) =>
                      unlockedBadgeIds.includes(badge.id),
                    ).length;

                    const cover = group.items[0];

                    return (
                      <div
                        key={group.id}
                        className={
                          theme === "dark"
                            ? "rounded-xl border border-white/8 bg-white/[0.02] p-2.5"
                            : "rounded-xl border border-black/7 bg-[#fbfcfb] p-2.5"
                        }
                      >
                        <div className="flex h-[82px] items-center justify-center">
                          <Image
                            src={cover.image}
                            alt={group.label}
                            width={90}
                            height={90}
                            className={
                              unlockedCount > 0
                                ? "h-[70px] w-[70px] object-contain"
                                : "h-[70px] w-[70px] object-contain opacity-25 grayscale"
                            }
                          />
                        </div>

                        <p className="truncate text-[9px] font-black font-mono">
                          {group.icon} {group.label}
                        </p>
                        <p className={"mt-0.5 text-[8px] " + muted + " font-mono"}>
                          {unlockedCount}/{group.items.length}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>
          </section>
        </div>
      </div>

      {rankModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRankModalOpen(false);
            }
          }}
        >
          <div
            className={
              theme === "dark"
                ? "max-h-[86vh] w-full max-w-[860px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                : "max-h-[86vh] w-full max-w-[860px] overflow-hidden rounded-2xl border border-black/10 bg-white"
            }
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className={"text-[8px] font-black uppercase tracking-[0.12em] " + accent + " font-mono"}>
                  Progresión
                </p>
                <h3 className="mt-1 text-xl font-black font-mono">
                  Rangos PeakScore
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setRankModalOpen(false)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div
                className={
                  theme === "dark"
                    ? "rounded-xl border border-violet-300/15 bg-violet-400/[0.03] p-4"
                    : "rounded-xl border border-emerald-300/30 bg-emerald-50 p-4"
                }
              >
                <p className="text-[10px] font-black font-mono">
                  Renacer · reinicio mensual
                </p>

                <p className={"mt-1 text-[9px] leading-4 " + muted + " font-mono"}>
                  Esta tarjeta deja preparada la experiencia de temporada. Después del reinicio, el jugador partirá desde Renacer y avanzará por los rangos definidos de PeakScore. La automatización mensual se conectará más adelante.
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/8">
                {ranks.map((rank) => {
                  const active = rank.id === currentRank.id;

                  return (
                    <div
                      key={rank.id}
                      className={
                        active
                          ? theme === "dark"
                            ? "grid grid-cols-[1fr_.9fr_1.3fr] gap-3 border-b border-white/8 bg-violet-500/[0.08] px-4 py-3"
                            : "grid grid-cols-[1fr_.9fr_1.3fr] gap-3 border-b border-black/7 bg-emerald-50 px-4 py-3"
                          : theme === "dark"
                            ? "grid grid-cols-[1fr_.9fr_1.3fr] gap-3 border-b border-white/8 px-4 py-3"
                            : "grid grid-cols-[1fr_.9fr_1.3fr] gap-3 border-b border-black/7 px-4 py-3"
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span>{rankIcons[rank.id]}</span>
                        <span className="text-[9px] font-black font-mono">
                          {rank.name}
                        </span>
                      </div>

                      <span className="text-right text-[9px] font-black font-mono">
                        {rank.maxXp === null
                          ? formatNumber(rank.minXp) + "+"
                          : formatNumber(rank.minXp) +
                            " – " +
                            formatNumber(rank.maxXp)}
                      </span>

                      <span className={"text-[8px] " + muted + " font-mono"}>
                        {rank.identity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {collectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCollectionModalOpen(false);
            }
          }}
        >
          <div
            className={
              theme === "dark"
                ? "max-h-[86vh] w-full max-w-[980px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                : "max-h-[86vh] w-full max-w-[980px] overflow-hidden rounded-2xl border border-black/10 bg-white"
            }
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className={"text-[8px] font-black uppercase tracking-[0.12em] " + accent + " font-mono"}>
                  Mi colección
                </p>
                <h3 className="mt-1 text-xl font-black font-mono">
                  Biblioteca de insignias
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setCollectionModalOpen(false)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => {
                  const unlocked = unlockedBadgeIds.includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={
                        theme === "dark"
                          ? "rounded-2xl border border-white/8 bg-white/[0.02] p-3"
                          : "rounded-2xl border border-black/7 bg-[#fbfcfb] p-3"
                      }
                    >
                      <div
                        className={
                          theme === "dark"
                            ? "relative flex h-[175px] items-center justify-center rounded-xl bg-[#0c0815]"
                            : "relative flex h-[175px] items-center justify-center rounded-xl bg-[#eef5ef]"
                        }
                      >
                        <Image
                          src={badge.image}
                          alt={badge.name}
                          width={180}
                          height={180}
                          className={
                            unlocked
                              ? "h-[145px] w-[145px] object-contain"
                              : "h-[145px] w-[145px] object-contain opacity-20 grayscale"
                          }
                        />

                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30">
                              <Lock size={16} />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black font-mono">
                            {badge.name}
                          </p>
                          <p className={"mt-0.5 text-[8px] " + muted + " font-mono"}>
                            {badge.level}
                          </p>
                        </div>

                        <span
                          className={
                            unlocked
                              ? "rounded-full bg-emerald-400 px-2 py-1 text-[7px] font-black text-[#07130d] font-mono"
                              : "rounded-full border border-white/10 px-2 py-1 text-[7px] font-black text-white/30 font-mono"
                          }
                        >
                          {unlocked ? "DESBLOQUEADA" : "BLOQUEADA"}
                        </span>
                      </div>

                      <p className={"mt-2 text-[8px] leading-4 " + muted + " font-mono"}>
                        {badge.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {purchaseModalCharacterId &&
        selectedPurchaseCharacter &&
        selectedPurchaseCatalog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !characterActionLoading
              ) {
                setPurchaseModalCharacterId(null);
                setCharacterActionError(null);
              }
            }}
          >
            <div
              className={
                theme === "dark"
                  ? "w-full max-w-[760px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                  : "w-full max-w-[760px] overflow-hidden rounded-2xl border border-black/10 bg-white"
              }
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <p className={"text-[8px] font-black uppercase tracking-[0.12em] " + accent + " font-mono"}>
                    Personaje
                  </p>
                  <h3 className="mt-1 text-xl font-black font-mono">
                    {selectedPurchaseCharacter.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (characterActionLoading) return;
                    setPurchaseModalCharacterId(null);
                    setCharacterActionError(null);
                  }}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-[250px_1fr]">
                <div
                  className={
                    theme === "dark"
                      ? "flex min-h-[300px] items-end justify-center rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_50%_28%,rgba(168,85,247,.16),transparent_48%),#0b0712] px-4 pt-4"
                      : "flex min-h-[300px] items-end justify-center rounded-2xl border border-black/7 bg-[radial-gradient(circle_at_50%_28%,rgba(34,197,94,.12),transparent_48%),#eef5ef] px-4 pt-4"
                  }
                >
                  <Image
                    src={selectedPurchaseCharacter.avatar}
                    alt={selectedPurchaseCharacter.name}
                    width={420}
                    height={420}
                    className="max-h-[285px] w-auto object-contain"
                  />
                </div>

                <div>
                  <p className={"text-xs leading-5 " + muted + " font-mono"}>
                    {selectedPurchaseCharacter.description}
                  </p>

                  <div
                    className={
                      theme === "dark"
                        ? "mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-4"
                        : "mt-4 rounded-xl border border-black/7 bg-[#fbfcfb] p-4"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={"text-[8px] uppercase tracking-[0.12em] " + muted + " font-mono"}>
                          Precio
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-2xl font-black font-mono">
                          <Coins size={20} className="text-yellow-300" />
                          {formatNumber(purchasePrice)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={"text-[8px] uppercase tracking-[0.12em] " + muted + " font-mono"}>
                          Tu saldo
                        </p>

                        <p className="mt-1 text-lg font-black font-mono">
                          {formatNumber(profileData?.coins ?? 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {selectedPurchaseCatalog.xp_bonus_percent > 0 && (
                        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] px-3 py-2">
                          <p className="text-[8px] font-black uppercase text-cyan-300 font-mono">
                            Bonus XP
                          </p>
                          <p className="mt-1 text-sm font-black text-cyan-200 font-mono">
                            +{selectedPurchaseCatalog.xp_bonus_percent}%
                          </p>
                        </div>
                      )}

                      {selectedPurchaseCatalog.coin_bonus_percent > 0 && (
                        <div className="rounded-lg border border-yellow-300/20 bg-yellow-300/[0.04] px-3 py-2">
                          <p className="text-[8px] font-black uppercase text-yellow-300 font-mono">
                            Bonus monedas
                          </p>
                          <p className="mt-1 text-sm font-black text-yellow-200 font-mono">
                            +{selectedPurchaseCatalog.coin_bonus_percent}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={
                      hasEnoughCoins
                        ? theme === "dark"
                          ? "mt-4 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.04] p-3"
                          : "mt-4 rounded-xl border border-emerald-300/30 bg-emerald-50 p-3"
                        : theme === "dark"
                          ? "mt-4 rounded-xl border border-red-300/15 bg-red-400/[0.04] p-3"
                          : "mt-4 rounded-xl border border-red-200 bg-red-50 p-3"
                    }
                  >
                    <p className={hasEnoughCoins ? "text-[9px] font-black uppercase text-emerald-300 font-mono" : "text-[9px] font-black uppercase text-red-300 font-mono"}>
                      {hasEnoughCoins ? "Saldo listo" : "Saldo insuficiente"}
                    </p>

                    <p className={"mt-1 text-[8px] leading-4 " + muted + " font-mono"}>
                      {hasEnoughCoins
                        ? "Después de comprarlo tendrás " +
                          formatNumber(
                            (profileData?.coins ?? 0) - purchasePrice,
                          ) +
                          " monedas."
                        : "Te faltan " +
                          formatNumber(
                            purchasePrice - (profileData?.coins ?? 0),
                          ) +
                          " monedas."}
                    </p>
                  </div>

                  {characterActionError && (
                    <div className="mt-3 rounded-xl border border-red-300/20 bg-red-400/[0.05] p-3">
                      <p className="text-[8px] text-red-200 font-mono">
                        {characterActionError}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={
                        characterActionLoading ||
                        !hasEnoughCoins
                      }
                      onClick={async () => {
                        const purchased =
                          await purchaseCharacter(
                            selectedPurchaseCharacter.id,
                          );

                        if (purchased) {
                          setPurchaseModalCharacterId(null);
                        }
                      }}
                      className={
                        theme === "dark"
                          ? "rounded-xl border border-violet-300/35 bg-violet-500 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-white font-mono transition hover:bg-violet-400 disabled:opacity-35"
                          : "rounded-xl border border-emerald-400 bg-emerald-500 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-white font-mono transition hover:bg-emerald-600 disabled:opacity-35"
                      }
                    >
                      {characterActionLoading
                        ? "Desbloqueando..."
                        : hasEnoughCoins
                          ? "Desbloquear personaje"
                          : "Necesitas más monedas"}
                    </button>

                    <button
                      type="button"
                      disabled={characterActionLoading}
                      onClick={() => {
                        setPurchaseModalCharacterId(null);
                        setCharacterActionError(null);
                      }}
                      className={
                        theme === "dark"
                          ? "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/55 font-mono"
                          : "rounded-xl border border-black/8 bg-[#f7f9f7] px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-[#657168] font-mono"
                      }
                    >
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

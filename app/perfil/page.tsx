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
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/* ============================================================
   TIPOS
============================================================ */

type Theme = "light" | "dark";

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

type CharacterCatalogEntry = {
  id: string;
  name: string;
  description: string;
  price_coins: number;
  xp_bonus_percent: number;
  coin_bonus_percent: number;
  is_active: boolean;
};

type PeakCharacter = {
  id: string;
  name: string;
  description: string;
  history: string;
  ability: string;
  rarity: string;
  avatar: string;
  profile: string;
  card: string;
};

type Badge = {
  id: string;
  name: string;
  level: string;
  image: string;
  description: string;
  group: "aprendizaje" | "constante" | "racha";
};

type Rank = {
  id: string;
  name: string;
  minXp: number;
  maxXp: number | null;
  identity: string;
};

/* ============================================================
   PERSONAJES
============================================================ */

const peakCharacters: PeakCharacter[] = [
  {
    id: "peaky-nova",

    name: "Peaky Nova",

    description:
      "Guardián del conocimiento que protege el equilibrio del universo PeakScore.",

    history:
      "Nacido en el corazón del universo PeakScore, Peaky Nova recorre los mundos en busca de conocimiento. Su misión es ayudar a cada aventurero a alcanzar su máximo potencial.",

    ability:
      "SIN NINGUNA HABILIDAD",

    rarity:
      "PERSONAJE: INICIAL",

    avatar:
      "/characters/peaky-nova/peaky-nova/peaky-nova-front.png",

    profile:
      "/avatars/photo_perfil/peaky-nova.png",

    card:
      "/characters/peaky-nova/card/peaky-nova-card.png",
  },

  {
    id: "peaky-nox",

    name: "Peaky Nox",

    description:
      "La fuerza del multiverso oscuro.",

    history:
      "Peaky Nox procede de una realidad distinta dentro del universo PeakScore. Su historia está conectada con los mundos oscuros que descubriremos más adelante.",

    ability:
      "POR DEFINIR",

    rarity:
      "PERSONAJE: DESBLOQUEABLE",

    avatar:
      "/avatars/peaky-nox.webp",

    profile:
      "/avatars/photo_perfil/peaky-nox.png",

    card:
      "/avatars/peaky-nox.webp",
  },

  {
    id: "zyra",

    name: "Zyra",

    description:
      "Curiosidad, exploración y aprendizaje.",

    history:
      "Zyra representa la curiosidad que impulsa a explorar más allá de lo conocido. Su mundo y su verdadera historia serán revelados más adelante.",

    ability:
      "+10% XP",

    rarity:
      "PERSONAJE: DESBLOQUEABLE",

    avatar:
      "/avatars/zorra.webp",

    profile:
      "/avatars/photo_perfil/zyra.png",

    card:
      "/avatars/zorra.webp",
  },

  {
    id: "orby",

    name: "Orby",

    description:
      "Tecnología, precisión e inteligencia.",

    history:
      "Orby fue diseñado para analizar, aprender y detectar patrones. Su origen tecnológico todavía guarda muchos secretos.",

    ability:
      "+10% MONEDAS",

    rarity:
      "PERSONAJE: DESBLOQUEABLE",

    avatar:
      "/avatars/orby.webp",

    profile:
      "/avatars/photo_perfil/orby.png",

    card:
      "/avatars/orby.webp",
  },
];

/* ============================================================
   INSIGNIAS
============================================================ */

const badges: Badge[] = [
  {
    id: "aprendizaje-1",
    name: "Dominio",
    level: "Nivel I",
    image: "/badges/aprendizaje-1.png",
    description:
      "Completa 5 simulacros simples.",
    group: "aprendizaje",
  },

  {
    id: "aprendizaje-2",
    name: "Dominio",
    level: "Nivel II",
    image: "/badges/aprendizaje-2.png",
    description:
      "Completa 20 simulacros simples.",
    group: "aprendizaje",
  },

  {
    id: "aprendizaje-3",
    name: "Dominio",
    level: "Nivel III",
    image: "/badges/aprendizaje-3.png",
    description:
      "Completa 50 simulacros simples.",
    group: "aprendizaje",
  },

  {
    id: "constante-1",
    name: "Constancia",
    level: "Nivel I",
    image: "/badges/constante-1.png",
    description:
      "Completa 3 simulacros completos.",
    group: "constante",
  },

  {
    id: "racha-1",
    name: "Racha",
    level: "Nivel I",
    image: "/badges/racha-1.png",
    description:
      "Mantén una racha de 10 días.",
    group: "racha",
  },

  {
    id: "racha-2",
    name: "Racha",
    level: "Nivel II",
    image: "/badges/racha-2.png",
    description:
      "Mantén una racha de 20 días.",
    group: "racha",
  },

  {
    id: "racha-3",
    name: "Racha",
    level: "Nivel III",
    image: "/badges/racha-3.png",
    description:
      "Mantén una racha de 30 días.",
    group: "racha",
  },
];

/* ============================================================
   RANGOS PEAKSCORE
============================================================ */

const ranks: Rank[] = [
  {
    id: "renacer",
    name: "Renacer",
    minXp: 0,
    maxXp: 499,
    identity: "El comienzo de un nuevo ascenso",
  },

  {
    id: "aprendiz",
    name: "Aprendiz",
    minXp: 500,
    maxXp: 1499,
    identity: "Construyendo las bases",
  },

  {
    id: "explorador",
    name: "Explorador",
    minXp: 1500,
    maxXp: 2999,
    identity: "Comienza a dominar",
  },

  {
    id: "competidor",
    name: "Competidor",
    minXp: 3000,
    maxXp: 4999,
    identity: "Buen rendimiento",
  },

  {
    id: "avanzado",
    name: "Avanzado",
    minXp: 5000,
    maxXp: 7499,
    identity: "Alto nivel",
  },

  {
    id: "elite",
    name: "Élite",
    minXp: 7500,
    maxXp: 9999,
    identity: "Muy buen dominio",
  },

  {
    id: "maestro",
    name: "Maestro",
    minXp: 10000,
    maxXp: 14999,
    identity: "Dominio excepcional",
  },

  {
    id: "gran-maestro",
    name: "Gran Maestro",
    minXp: 15000,
    maxXp: 24999,
    identity: "Nivel sobresaliente",
  },

  {
    id: "peak",
    name: "Peak",
    minXp: 25000,
    maxXp: null,
    identity: "Máximo rango",
  },
];

const rankIcons: Record<string, string> = {
  renacer: "✦",
  aprendiz: "🌱",
  explorador: "⚡",
  competidor: "🔥",
  avanzado: "💎",
  elite: "🏆",
  maestro: "👑",
  "gran-maestro": "🌟",
  peak: "🚀",
};

/* ============================================================
   NAVBAR
============================================================ */

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
  },

  {
    label: "Simulacros",
    href: "/dashboard/simulacros",
    icon: Target,
  },

  {
    label: "Progreso",
    href: "/dashboard",
    icon: BarChart3,
  },

  {
    label: "Aprender",
    href: "/dashboard",
    icon: BookOpen,
  },

  {
    label: "Retos",
    href: "/dashboard",
    icon: Sparkles,
  },

  {
    label: "Comunidad",
    href: "/dashboard",
    icon: UserRound,
  },

  {
    label: "Mi Perfil",
    href: "/perfil",
    icon: UserRound,
  },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-CO").format(value);

/* ============================================================
   PAGE
============================================================ */

export default function PerfilPage() {
  const [theme, setTheme] =
    useState<Theme>("light");

  const [profileData, setProfileData] =
    useState<ProfileData | null>(null);

  const [
    characterCatalog,
    setCharacterCatalog,
  ] = useState<CharacterCatalogEntry[]>(
    [],
  );

  const [
    unlockedCharacterIds,
    setUnlockedCharacterIds,
  ] = useState<string[]>([]);

  const [
    unlockedBadgeIds,
    setUnlockedBadgeIds,
  ] = useState<string[]>([]);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    characterActionLoading,
    setCharacterActionLoading,
  ] = useState(false);

  const [
    characterActionError,
    setCharacterActionError,
  ] = useState<string | null>(null);

  const [
    characterModalOpen,
    setCharacterModalOpen,
  ] = useState(false);

  const [
    rankModalOpen,
    setRankModalOpen,
  ] = useState(false);

  const [
    collectionModalOpen,
    setCollectionModalOpen,
  ] = useState(false);

  const [
    purchaseModalCharacterId,
    setPurchaseModalCharacterId,
  ] = useState<string | null>(null);

  /* ==========================================================
     CARD HOVER
  ========================================================== */

  const cardRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const [
    cardTransform,
    setCardTransform,
  ] = useState({
    x: 0,
    y: 0,
    glowX: 50,
    glowY: 50,
  });

  /* ==========================================================
     PERSONAJE SELECCIONADO
  ========================================================== */

  const selectedCharacterId =
    profileData?.selectedCharacter ??
    "peaky-nova";

  const selectedCharacter =
    peakCharacters.find(
      (character) =>
        character.id ===
        selectedCharacterId,
    ) ?? peakCharacters[0];

  const selectedCatalogCharacter =
    characterCatalog.find(
      (character) =>
        character.id ===
        selectedCharacter.id,
    );

  /* ==========================================================
     RANGO
  ========================================================== */

  const currentRank =
    useMemo(() => {
      const xp =
        profileData?.xp ?? 0;

      return (
        ranks.find(
          (rank) =>
            xp >= rank.minXp &&
            (rank.maxXp === null ||
              xp <= rank.maxXp),
        ) ?? ranks[0]
      );
    }, [profileData?.xp]);

  const currentRankIndex =
    ranks.findIndex(
      (rank) =>
        rank.id ===
        currentRank.id,
    );

  const nextRank =
    currentRankIndex >= 0 &&
    currentRankIndex <
      ranks.length - 1
      ? ranks[
          currentRankIndex + 1
        ]
      : null;

  const rankProgress =
    useMemo(() => {
      const xp =
        profileData?.xp ?? 0;

      if (!nextRank) {
        return 100;
      }

      const total =
        nextRank.minXp -
        currentRank.minXp;

      if (total <= 0) {
        return 100;
      }

      return Math.max(
        0,
        Math.min(
          100,
          ((xp -
            currentRank.minXp) /
            total) *
            100,
        ),
      );
    }, [
      currentRank,
      nextRank,
      profileData?.xp,
    ]);

  /* ==========================================================
     COLECCIONES
  ========================================================== */

  const collectionGroups =
    useMemo(
      () => [
        {
          id: "aprendizaje",
          label: "Conocimiento",
          description:
            "Dominio académico",
          icon: "◆",
          items:
            badges.filter(
              (badge) =>
                badge.group ===
                "aprendizaje",
            ),
        },

        {
          id: "constante",
          label: "Constancia",
          description:
            "Disciplina PeakScore",
          icon: "✦",
          items:
            badges.filter(
              (badge) =>
                badge.group ===
                "constante",
            ),
        },

        {
          id: "racha",
          label: "Racha",
          description:
            "Continuidad",
          icon: "🔥",
          items:
            badges.filter(
              (badge) =>
                badge.group ===
                "racha",
            ),
        },
      ],
      [],
    );

  /* ==========================================================
     CARGA REAL DE SUPABASE
  ========================================================== */

  useEffect(() => {
    const loadProfile =
      async () => {
        try {
          setProfileLoading(
            true,
          );

          const response =
            await fetch(
              "/api/profile",
              {
                method: "GET",
                cache: "no-store",
              },
            );

          if (!response.ok) {
            throw new Error(
              "No se pudo cargar el perfil.",
            );
          }

          const data =
            await response.json();

          setProfileData(
            data.profile ??
              null,
          );

          setCharacterCatalog(
            data.characters ??
              [],
          );

          setUnlockedCharacterIds(
            data.unlockedCharacterIds ??
              [],
          );

          setUnlockedBadgeIds(
            data.unlockedBadgeIds ??
              [],
          );
        } catch (error) {
          console.error(
            "Error cargando perfil:",
            error,
          );
        } finally {
          setProfileLoading(
            false,
          );
        }
      };

    void loadProfile();
  }, []);

  /* ==========================================================
     TEMA
  ========================================================== */

  useEffect(() => {
    const storedTheme =
      window.localStorage.getItem(
        "peakscore-profile-theme",
      );

    if (
      storedTheme === "light" ||
      storedTheme === "dark"
    ) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "peakscore-profile-theme",
      theme,
    );

    document.documentElement.style.backgroundColor =
      theme === "dark"
        ? "#07040d"
        : "#ffffff";

    document.body.style.backgroundColor =
      theme === "dark"
        ? "#07040d"
        : "#ffffff";

    document.body.style.transition =
      "background-color 180ms ease";
  }, [theme]);

  /* ==========================================================
     TILT + GLOW
  ========================================================== */

  const handleCardMove = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const element =
      cardRef.current;

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left;

    const y =
      event.clientY -
      rect.top;

    const percentX =
      (x / rect.width) * 100;

    const percentY =
      (y / rect.height) * 100;

    setCardTransform({
      x:
        (50 - percentY) *
        0.06,
      y:
        (percentX - 50) *
        0.06,
      glowX: percentX,
      glowY: percentY,
    });
  };

  const resetCardMove = () => {
    setCardTransform({
      x: 0,
      y: 0,
      glowX: 50,
      glowY: 50,
    });
  };

  /* ==========================================================
     EQUIPAR
  ========================================================== */

  const changeCharacter =
    async (
      id: string,
    ) => {
      if (
        characterActionLoading ||
        id ===
          selectedCharacterId ||
        !unlockedCharacterIds.includes(
          id,
        )
      ) {
        return;
      }

      try {
        setCharacterActionLoading(
          true,
        );

        setCharacterActionError(
          null,
        );

        const response =
          await fetch(
            "/api/profile/character",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  action:
                    "equip",
                  characterId:
                    id,
                },
              ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "No se pudo equipar el personaje.",
          );
        }

        const newSelected =
          data.profile
            ?.selectedCharacter ??
          id;

        setProfileData(
          (current) =>
            current
              ? {
                  ...current,
                  selectedCharacter:
                    newSelected,
                }
              : current,
        );
      } catch (error) {
        console.error(
          "Error equipando personaje:",
          error,
        );

        setCharacterActionError(
          error instanceof
            Error
            ? error.message
            : "No se pudo equipar el personaje.",
        );
      } finally {
        setCharacterActionLoading(
          false,
        );
      }
    };

  /* ==========================================================
     COMPRAR
  ========================================================== */

  const purchaseCharacter =
    async (
      id: string,
    ) => {
      if (
        characterActionLoading ||
        unlockedCharacterIds.includes(
          id,
        )
      ) {
        return false;
      }

      try {
        setCharacterActionLoading(
          true,
        );

        setCharacterActionError(
          null,
        );

        const response =
          await fetch(
            "/api/profile/character",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  action:
                    "purchase",
                  characterId:
                    id,
                },
              ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "No se pudo comprar el personaje.",
          );
        }

        setUnlockedCharacterIds(
          (current) =>
            current.includes(id)
              ? current
              : [
                  ...current,
                  id,
                ],
        );

        if (data.profile) {
          setProfileData(
            (current) =>
              current
                ? {
                    ...current,
                    coins:
                      data.profile
                        .coins,
                    xp:
                      data.profile
                        .xp,
                    level:
                      data.profile
                        .level,
                    selectedCharacter:
                      data.profile
                        .selectedCharacter ??
                      current.selectedCharacter,
                  }
                : current,
          );
        }

        return true;
      } catch (error) {
        console.error(
          "Error comprando personaje:",
          error,
        );

        setCharacterActionError(
          error instanceof
            Error
            ? error.message
            : "No se pudo comprar el personaje.",
        );

        return false;
      } finally {
        setCharacterActionLoading(
          false,
        );
      }
    };

  const purchaseCharacterData =
    purchaseModalCharacterId
      ? peakCharacters.find(
          (character) =>
            character.id ===
            purchaseModalCharacterId,
        ) ?? null
      : null;

  const purchaseCatalog =
    purchaseModalCharacterId
      ? characterCatalog.find(
          (character) =>
            character.id ===
            purchaseModalCharacterId,
        ) ?? null
      : null;

  const purchasePrice =
    purchaseCatalog
      ?.price_coins ?? 0;

  const enoughCoins =
    (profileData?.coins ??
      0) >= purchasePrice;

  const dark =
    theme === "dark";

  /* ==========================================================
     LOADING
  ========================================================== */

  if (profileLoading) {
    return (
      <main
        className={
          dark
            ? "flex min-h-screen items-center justify-center bg-[#07040d] text-white"
            : "flex min-h-screen items-center justify-center bg-white text-[#102019]"
        }
      >
        <div className="text-center">
          <div
            className={
              dark
                ? "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10"
                : "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/50 bg-emerald-50"
            }
          >
            <Sparkles
              size={22}
              className={
                dark
                  ? "text-violet-300"
                  : "text-emerald-600"
              }
            />
          </div>

          <p className="mt-4 text-sm font-black font-mono">
            Cargando PeakScore...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={
        dark
          ? "min-h-screen bg-[#07040d] text-white"
          : "min-h-screen bg-white text-[#102019]"
      }
    >
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header
        className={
          dark
            ? "sticky top-0 z-40 border-b border-violet-400/20 bg-[#0b0713]/95 backdrop-blur-xl"
            : "sticky top-0 z-40 border-b border-emerald-300/45 bg-white/95 backdrop-blur-xl"
        }
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
          >
            <span
              className={
                dark
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
            {navItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  item.label ===
                  "Mi Perfil";

                return (
                  <Link
                    key={
                      item.label
                    }
                    href={
                      item.href
                    }
                    className={
                      active
                        ? dark
                          ? "flex items-center gap-2 rounded-xl border border-violet-300/35 bg-violet-500/10 px-3 py-2 text-[9px] font-black text-violet-200 font-mono"
                          : "flex items-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700 font-mono"
                        : dark
                          ? "flex items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-bold text-white/45 transition hover:bg-white/[0.03] hover:text-white font-mono"
                          : "flex items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-bold text-[#65736a] transition hover:bg-[#f0f5f1] hover:text-[#17251d] font-mono"
                    }
                  >
                    <Icon size={14} />

                    {
                      item.label
                    }
                  </Link>
                );
              },
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div
              className={
                dark
                  ? "hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex"
                  : "hidden items-center gap-1.5 rounded-xl border border-black/8 bg-white px-3 py-2 sm:flex"
              }
            >
              <Coins
                size={15}
                className="text-yellow-400"
              />

              <span className="text-[9px] font-black font-mono">
                {formatNumber(
                  profileData?.coins ??
                    0,
                )}
              </span>
            </div>

            <div
              className={
                dark
                  ? "hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex"
                  : "hidden items-center gap-1.5 rounded-xl border border-black/8 bg-white px-3 py-2 sm:flex"
              }
            >
              <Flame
                size={15}
                className="text-orange-400"
                fill="currentColor"
              />

              <span className="text-[9px] font-black font-mono">
                {formatNumber(
                  profileData?.streak ??
                    0,
                )}{" "}
                días
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setTheme(
                  (current) =>
                    current ===
                    "light"
                      ? "dark"
                      : "light",
                )
              }
              aria-label="Cambiar tema"
              className={
                dark
                  ? "flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/10 text-violet-200"
                  : "flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/55 bg-emerald-50 text-emerald-700"
              }
            >
              {dark ? (
                <Sun size={15} />
              ) : (
                <Moon size={15} />
              )}
            </button>

            <div
              className={
                dark
                  ? "h-9 w-9 overflow-hidden rounded-xl border border-violet-300/20 bg-violet-500/10"
                  : "h-9 w-9 overflow-hidden rounded-xl border border-emerald-300/55 bg-emerald-50"
              }
            >
              <Image
                src={
                  selectedCharacter.profile
                }
                alt={
                  selectedCharacter.name
                }
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p
            className={
              dark
                ? "text-[9px] font-black uppercase tracking-[0.18em] text-violet-300 font-mono"
                : "text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 font-mono"
            }
          >
            PEAKSCORE
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] font-mono sm:text-5xl">
            MI PERFIL
          </h1>

          <p
            className={
              dark
                ? "mt-1 text-xs text-white/40 font-mono"
                : "mt-1 text-xs text-[#707a73] font-mono"
            }
          >
            Tu progreso, tu Peak y tus recompensas.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[315px_minmax(0,1fr)]">
          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="space-y-4">
            {/* =================================================
                TU PEAK
            ================================================= */}

            <section
              className={
                dark
                  ? "overflow-hidden rounded-2xl border border-violet-300/15 bg-[#10091a]"
                  : "overflow-hidden rounded-2xl border border-black/8 bg-white"
              }
            >
              {/* SOLO EL TÍTULO */}

              <div
                className={
                  dark
                    ? "border-b border-white/8 px-4 py-4"
                    : "border-b border-black/7 px-4 py-4"
                }
              >
                <p
                  className={
                    dark
                      ? "text-[8px] font-black uppercase tracking-[0.18em] text-violet-300 font-mono"
                      : "text-[8px] font-black uppercase tracking-[0.18em] text-emerald-700 font-mono"
                  }
                >
                  TU PEAK
                </p>
              </div>

              {/* =================================================
                  TARJETA COMPLETA
              ================================================= */}

              <div className="p-2">
                <button
                  ref={cardRef}
                  type="button"
                  onClick={() =>
                    setCharacterModalOpen(
                      true,
                    )
                  }
                  onMouseMove={
                    handleCardMove
                  }
                  onMouseLeave={
                    resetCardMove
                  }
                  className="group relative block w-full cursor-pointer text-left [perspective:1400px]"
                  aria-label={`Abrir ${selectedCharacter.name}`}
                >
                  <div
                    className="relative transition-transform duration-150 ease-out"
                    style={{
                      transform: `
                        rotateX(${cardTransform.x}deg)
                        rotateY(${cardTransform.y}deg)
                      `,
                    }}
                  >
                    {/* GLOW EXTERIOR */}

                    <div
                      className="
                        pointer-events-none
                        absolute
                        -inset-4
                        rounded-[30px]
                        bg-emerald-400/0
                        blur-3xl
                        transition-all
                        duration-500
                        group-hover:bg-emerald-400/20
                      "
                    />

                    {/* IMAGEN */}

                    <div className="relative overflow-hidden rounded-xl">
                      <Image
                        src={
                          selectedCharacter.card
                        }
                        alt={
                          selectedCharacter.name
                        }
                        width={
                          700
                        }
                        height={
                          1100
                        }
                        priority
                        className="
                          block
                          h-auto
                          w-full
                          select-none
                          object-cover
                          transition-transform
                          duration-500
                          ease-out
                          group-hover:scale-[1.015]
                        "
                      />

                      {/* GLOW DEL CURSOR */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-0
                          opacity-0
                          transition-opacity
                          duration-300
                          group-hover:opacity-100
                        "
                        style={{
                          background: `radial-gradient(
                            circle 180px at ${cardTransform.glowX}% ${cardTransform.glowY}%,
                            rgba(110,255,170,0.23),
                            rgba(110,255,170,0.07) 35%,
                            transparent 73%
                          )`,
                        }}
                      />

                      {/* DESTELLO */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          -left-[65%]
                          top-[-30%]
                          z-30
                          h-[170%]
                          w-[27%]
                          rotate-[18deg]
                          bg-gradient-to-r
                          from-transparent
                          via-white/35
                          to-transparent
                          opacity-0
                          transition-all
                          duration-700
                          group-hover:left-[135%]
                          group-hover:opacity-100
                        "
                      />

                      {/* BORDE GLOW */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-0
                          rounded-xl
                          border
                          border-transparent
                          transition-all
                          duration-300
                          group-hover:border-emerald-300/50
                          group-hover:shadow-[inset_0_0_36px_rgba(52,211,153,0.16)]
                        "
                      />

                      {/* =================================================
                          DESCRIPCIÓN
                          SOLO DESCRIPCIÓN
                          SIN HABILIDAD
                          SIN RAREZA
                          SIN BOTÓN
                      ================================================= */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-x-2
                          bottom-2
                          z-40
                          translate-y-[115%]
                          rounded-xl
                          border
                          border-emerald-300/15
                          bg-[#07100c]/96
                          px-4
                          py-3
                          opacity-0
                          shadow-2xl
                          backdrop-blur-xl
                          transition-all
                          duration-300
                          ease-out
                          group-hover:translate-y-0
                          group-hover:opacity-100
                        "
                      >
                        <p className="text-[7px] font-black uppercase tracking-[0.18em] text-emerald-300 font-mono">
                          DESCRIPCIÓN
                        </p>

                        <h3 className="mt-1 text-base font-black text-white font-mono">
                          {
                            selectedCharacter.name
                          }
                        </h3>

                        <p className="mt-2 text-[8px] leading-5 text-white/65 font-mono">
                          {
                            selectedCharacter.description
                          }
                        </p>

                        <p className="mt-3 text-[6px] font-black uppercase tracking-[0.15em] text-white/25 font-mono">
                          Haz clic para conocer al personaje
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* =================================================
                RANGO
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    TEMPORADA
                  </p>

                  <h2 className="mt-1 text-lg font-black font-mono">
                    Tu rango
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setRankModalOpen(
                      true,
                    )
                  }
                  className={
                    dark
                      ? "text-[8px] font-black text-violet-200 font-mono"
                      : "text-[8px] font-black text-emerald-700 font-mono"
                  }
                >
                  Ver rangos
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {/* FOTO DEL PERSONAJE EQUIPADO */}

                <div
                  className={
                    dark
                      ? "h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-300/35 bg-violet-500/10"
                      : "h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-400 bg-emerald-50"
                  }
                >
                  <Image
                    src={
                      selectedCharacter.profile
                    }
                    alt={
                      selectedCharacter.name
                    }
                    width={
                      100
                    }
                    height={
                      100
                    }
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black font-mono">
                      {
                        currentRank.name
                      }
                    </p>

                    <span className="text-lg">
                      {
                        rankIcons[
                          currentRank.id
                        ]
                      }
                    </span>
                  </div>

                  <p
                    className={
                      dark
                        ? "mt-0.5 text-[8px] text-white/35 font-mono"
                        : "mt-0.5 text-[8px] text-[#7c867f] font-mono"
                    }
                  >
                    {formatNumber(
                      currentRank.minXp,
                    )}{" "}
                    XP+
                  </p>

                  <div
                    className={
                      dark
                        ? "mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                        : "mt-2 h-2 overflow-hidden rounded-full bg-black/8"
                    }
                  >
                    <div
                      className={
                        dark
                          ? "h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                          : "h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all duration-500"
                      }
                      style={{
                        width: `${rankProgress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                className={
                  dark
                    ? "mt-4 rounded-xl border border-violet-300/15 bg-violet-500/[0.05] p-3"
                    : "mt-4 rounded-xl border border-emerald-300/30 bg-emerald-50 p-3"
                }
              >
                <p className="text-[8px] font-black font-mono">
                  {nextRank
                    ? `Siguiente · ${nextRank.name}`
                    : "Rango máximo"}
                </p>

                <p
                  className={
                    dark
                      ? "mt-1 text-[8px] text-white/35 font-mono"
                      : "mt-1 text-[8px] text-[#78827b] font-mono"
                  }
                >
                  {nextRank
                    ? `${formatNumber(
                        Math.max(
                          0,
                          nextRank.minXp -
                            (profileData?.xp ??
                              0),
                        ),
                      )} XP para avanzar.`
                    : "Has alcanzado el máximo rango."}
                </p>
              </div>
            </section>

            {/* =================================================
                ESTADÍSTICAS
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    DATOS
                  </p>

                  <h2 className="mt-1 text-lg font-black font-mono">
                    Estadísticas
                  </h2>
                </div>

                <BarChart3
                  size={18}
                  className={
                    dark
                      ? "text-violet-300"
                      : "text-emerald-600"
                  }
                />
              </div>

              <div className="mt-4 space-y-3">
                <MiniStat
                  dark={dark}
                  label="XP Total"
                  value={`${formatNumber(
                    profileData?.xp ??
                      0,
                  )} XP`}
                  valueClass="text-cyan-400"
                />

                <MiniStat
                  dark={dark}
                  label="Simulacros"
                  value={formatNumber(
                    profileData?.simulations ??
                      0,
                  )}
                />

                <MiniStat
                  dark={dark}
                  label="Promedio ICFES"
                  value={
                    profileData?.averageScore !=
                    null
                      ? `${profileData.averageScore}%`
                      : "0%"
                  }
                  valueClass="text-yellow-400"
                />
              </div>
            </section>
          </aside>

          {/* ==================================================
              MAIN
          ================================================== */}

          <section className="min-w-0 space-y-4">
            {/* =================================================
                IDENTIDAD DEL USUARIO
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={
                      dark
                        ? "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-violet-300/20 bg-violet-500/10"
                        : "h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-emerald-300/50 bg-emerald-50"
                    }
                  >
                    <Image
                      src={
                        selectedCharacter.profile
                      }
                      alt={
                        selectedCharacter.name
                      }
                      width={
                        110
                      }
                      height={
                        110
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-[-0.04em] font-mono sm:text-3xl">
                        {profileData?.fullName ??
                          "Mi perfil"}
                      </h2>

                      <span
                        className={
                          dark
                            ? "rounded-full border border-violet-300/20 bg-violet-500/10 px-2.5 py-1 text-[7px] font-black text-violet-200 font-mono"
                            : "rounded-full border border-emerald-300/35 bg-emerald-50 px-2.5 py-1 text-[7px] font-black text-emerald-700 font-mono"
                        }
                      >
                        ESTUDIANTE
                      </span>
                    </div>

                    <p
                      className={
                        dark
                          ? "mt-1 text-[9px] text-white/35 font-mono"
                          : "mt-1 text-[9px] text-[#7a847d] font-mono"
                      }
                    >
                      Nivel{" "}
                      {profileData?.level ??
                        1}
                    </p>
                  </div>
                </div>

                {/* LEVEL */}

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-yellow-300/25
                    bg-yellow-300/[0.03]
                    px-7
                    py-3
                    text-center
                  "
                >
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent" />

                  <p className="relative text-[9px] font-black uppercase tracking-[0.25em] text-yellow-300 font-mono">
                    LEVEL
                  </p>

                  <p className="relative mt-0.5 text-2xl font-black text-yellow-300 font-mono">
                    {profileData?.level ??
                      1}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span
                    className={
                      dark
                        ? "text-[8px] text-white/35 font-mono"
                        : "text-[8px] text-[#77817f] font-mono"
                    }
                  >
                    Experiencia
                  </span>

                  <span className="text-[9px] font-black text-cyan-400 font-mono">
                    {formatNumber(
                      profileData?.xp ??
                        0,
                    )}{" "}
                    XP
                  </span>
                </div>

                <div
                  className={
                    dark
                      ? "mt-2 h-3 overflow-hidden rounded-full bg-white/10"
                      : "mt-2 h-3 overflow-hidden rounded-full bg-black/8"
                  }
                >
                  <div
                    className={
                      dark
                        ? "h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-300"
                        : "h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-cyan-300"
                    }
                    style={{
                      width: `${Math.max(
                        3,
                        Math.min(
                          100,
                          rankProgress,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                STATS
            ================================================= */}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                dark={dark}
                label="Monedas"
                value={formatNumber(
                  profileData?.coins ??
                    0,
                )}
                icon={
                  <Coins
                    size={23}
                    className="text-yellow-400"
                  />
                }
              />

              <StatCard
                dark={dark}
                label="Racha"
                value={`${formatNumber(
                  profileData?.streak ??
                    0,
                )} días`}
                icon={
                  <Image
                    src="/dashboard/racha-pixel.webp"
                    alt="Racha"
                    width={60}
                    height={60}
                    className="h-12 w-12 object-contain"
                  />
                }
              />

              <StatCard
                dark={dark}
                label="Simulacros"
                value={formatNumber(
                  profileData?.simulations ??
                    0,
                )}
                subtitle="Completados"
                icon={
                  <Image
                    src="/peaky/homepage/statslibro.png"
                    alt="Simulacros"
                    width={60}
                    height={60}
                    className="h-12 w-12 object-contain"
                  />
                }
              />

              <StatCard
                dark={dark}
                label="Promedio"
                value={
                  profileData?.averageScore !=
                  null
                    ? `${profileData.averageScore}%`
                    : "0%"
                }
                subtitle="Resultado ICFES"
                icon={
                  <Image
                    src="/dashboard/premio-pixel.webp"
                    alt="Promedio"
                    width={60}
                    height={60}
                    className="h-12 w-12 object-contain"
                  />
                }
              />
            </section>

            {/* =================================================
                AVENTURA
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    EXPLORACIÓN
                  </p>

                  <h2 className="mt-1 text-xl font-black font-mono">
                    Aventura
                  </h2>
                </div>

                <span
                  className={
                    dark
                      ? "rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[7px] font-black text-violet-200 font-mono"
                      : "rounded-full border border-emerald-300/35 bg-emerald-50 px-3 py-1 text-[7px] font-black text-emerald-700 font-mono"
                  }
                >
                  PRÓXIMAMENTE
                </span>
              </div>

              <div
                className={
                  dark
                    ? "mt-4 flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-violet-300/15 bg-[#0c0712]"
                    : "mt-4 flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-emerald-300/35 bg-[#fcfdfc]"
                }
              >
                <div className="max-w-md text-center">
                  <div
                    className={
                      dark
                        ? "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-500/10"
                        : "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-50"
                    }
                  >
                    <Sparkles
                      size={28}
                      className={
                        dark
                          ? "text-violet-300"
                          : "text-emerald-600"
                      }
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-black font-mono">
                    Tu aventura todavía está preparándose.
                  </h3>

                  <p
                    className={
                      dark
                        ? "mt-2 text-[9px] leading-5 text-white/35 font-mono"
                        : "mt-2 text-[9px] leading-5 text-[#78827b] font-mono"
                    }
                  >
                    Aquí conectaremos los mundos,
                    niveles y progreso de Aprender
                    cuando terminemos ese sistema.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                MIS PERSONAJES
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    COLECCIÓN
                  </p>

                  <h2 className="mt-1 text-xl font-black font-mono">
                    Mis personajes
                  </h2>
                </div>

                <span
                  className={
                    dark
                      ? "text-[8px] font-black text-violet-200 font-mono"
                      : "text-[8px] font-black text-emerald-700 font-mono"
                  }
                >
                  {unlockedCharacterIds.length}{" "}
                  desbloqueados
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {peakCharacters.map(
                  (character) => {
                    const unlocked =
                      unlockedCharacterIds.includes(
                        character.id,
                      );

                    const equipped =
                      character.id ===
                      selectedCharacterId;

                    const catalog =
                      characterCatalog.find(
                        (item) =>
                          item.id ===
                          character.id,
                      );

                    return (
                      <button
                        key={
                          character.id
                        }
                        type="button"
                        onClick={() => {
                          if (equipped) {
                            setCharacterModalOpen(
                              true,
                            );
                            return;
                          }

                          if (
                            unlocked
                          ) {
                            void changeCharacter(
                              character.id,
                            );
                            return;
                          }

                          if (
                            catalog
                          ) {
                            setPurchaseModalCharacterId(
                              character.id,
                            );
                          }
                        }}
                        className={
                          equipped
                            ? dark
                              ? "group rounded-2xl border border-emerald-300/40 bg-emerald-400/[0.04] p-3 text-left"
                              : "group rounded-2xl border border-emerald-400 bg-emerald-50 p-3 text-left"
                            : dark
                              ? "group rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:-translate-y-1 hover:border-violet-300/25"
                              : "group rounded-2xl border border-black/7 bg-[#fbfcfb] p-3 text-left transition hover:-translate-y-1 hover:border-emerald-300/40"
                        }
                      >
                        <div
                          className={
                            dark
                              ? "relative flex h-[175px] items-end justify-center overflow-hidden rounded-xl bg-[#0c0712]"
                              : "relative flex h-[175px] items-end justify-center overflow-hidden rounded-xl bg-[#f4faf5]"
                          }
                        >
                          <Image
                            src={
                              character.avatar
                            }
                            alt={
                              character.name
                            }
                            width={
                              250
                            }
                            height={
                              250
                            }
                            className={
                              unlocked
                                ? "max-h-[165px] w-auto object-contain transition duration-300 group-hover:scale-105"
                                : "max-h-[165px] w-auto object-contain opacity-40 grayscale"
                            }
                          />

                          {!unlocked && (
                            <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/25">
                              <Lock
                                size={
                                  12
                                }
                                className="text-white/55"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-black font-mono">
                              {
                                character.name
                              }
                            </p>

                            <p
                              className={
                                dark
                                  ? "mt-0.5 text-[8px] text-white/35 font-mono"
                                  : "mt-0.5 text-[8px] text-[#7b857e] font-mono"
                              }
                            >
                              {
                                character.rarity
                              }
                            </p>
                          </div>

                          {equipped ? (
                            <span className="rounded-full bg-emerald-400 px-2 py-1 text-[6px] font-black text-[#07130d] font-mono">
                              EQUIPADO
                            </span>
                          ) : unlocked ? (
                            <span className="text-[7px] font-black text-cyan-400 font-mono">
                              EQUIPAR
                            </span>
                          ) : catalog ? (
                            <span className="flex items-center gap-1 rounded-full border border-yellow-300/20 bg-yellow-300/[0.04] px-2 py-1 text-[7px] font-black text-yellow-300 font-mono">
                              <Coins
                                size={
                                  10
                                }
                              />
                              {formatNumber(
                                catalog.price_coins,
                              )}
                            </span>
                          ) : (
                            <span className="text-[7px] text-white/25 font-mono">
                              PRÓXIMAMENTE
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>

              {characterActionError && (
                <div className="mt-3 rounded-xl border border-red-300/20 bg-red-400/[0.05] p-3">
                  <p className="text-[8px] text-red-200 font-mono">
                    {
                      characterActionError
                    }
                  </p>
                </div>
              )}
            </section>

            {/* =================================================
                INSIGNIAS
            ================================================= */}

            <section
              id="insignias"
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    RECOMPENSAS
                  </p>

                  <h2 className="mt-1 text-xl font-black font-mono">
                    Mi colección
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCollectionModalOpen(
                      true,
                    )
                  }
                  className={
                    dark
                      ? "inline-flex items-center gap-1 text-[8px] font-black text-violet-200 font-mono"
                      : "inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 font-mono"
                  }
                >
                  Ver colección
                  <ChevronRight
                    size={13}
                  />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {collectionGroups.map(
                  (group) => {
                    const unlockedCount =
                      group.items.filter(
                        (badge) =>
                          unlockedBadgeIds.includes(
                            badge.id,
                          ),
                      ).length;

                    const cover =
                      group.items[0];

                    return (
                      <button
                        key={
                          group.id
                        }
                        type="button"
                        onClick={() =>
                          setCollectionModalOpen(
                            true,
                          )
                        }
                        className={
                          dark
                            ? "group rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:-translate-y-1 hover:border-violet-300/25"
                            : "group rounded-2xl border border-black/7 bg-[#fbfcfb] p-3 text-left transition hover:-translate-y-1 hover:border-emerald-300/40"
                        }
                      >
                        <div
                          className={
                            dark
                              ? "flex h-[150px] items-center justify-center rounded-xl bg-[#0c0712]"
                              : "flex h-[150px] items-center justify-center rounded-xl bg-[#f4faf5]"
                          }
                        >
                          <Image
                            src={
                              cover.image
                            }
                            alt={
                              group.label
                            }
                            width={
                              130
                            }
                            height={
                              130
                            }
                            className={
                              unlockedCount >
                              0
                                ? "h-[105px] w-[105px] object-contain transition duration-300 group-hover:scale-105"
                                : "h-[105px] w-[105px] object-contain opacity-20 grayscale"
                            }
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black font-mono">
                              {
                                group.icon
                              }{" "}
                              {
                                group.label
                              }
                            </p>

                            <p
                              className={
                                dark
                                  ? "mt-1 text-[8px] text-white/30 font-mono"
                                  : "mt-1 text-[8px] text-[#7b857e] font-mono"
                              }
                            >
                              {
                                group.description
                              }
                            </p>
                          </div>

                          <span
                            className={
                              dark
                                ? "text-[8px] font-black text-violet-200 font-mono"
                                : "text-[8px] font-black text-emerald-700 font-mono"
                            }
                          >
                            {
                              unlockedCount
                            }
                            /
                            {
                              group
                                .items
                                .length
                            }
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* =================================================
                MISIÓN DEL DÍA
            ================================================= */}

            <section
              className={
                dark
                  ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
                  : "rounded-2xl border border-black/8 bg-white p-4"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                    }
                  >
                    RECOMPENSA
                  </p>

                  <h2 className="mt-1 text-xl font-black font-mono">
                    Misión del día
                  </h2>
                </div>

                <Flame
                  size={19}
                  className="text-orange-400"
                  fill="currentColor"
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[9px] text-white/40 font-mono"
                        : "text-[9px] text-[#707a73] font-mono"
                    }
                  >
                    Completa 3 actividades hoy y gana:
                  </p>

                  <div className="mt-3 flex gap-2">
                    <span
                      className={
                        dark
                          ? "rounded-lg border border-violet-300/15 bg-violet-500/[0.05] px-3 py-2 text-[9px] font-black text-violet-200 font-mono"
                          : "rounded-lg border border-emerald-300/35 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700 font-mono"
                      }
                    >
                      +150 XP
                    </span>

                    <span className="rounded-lg border border-yellow-300/20 bg-yellow-300/[0.04] px-3 py-2 text-[9px] font-black text-yellow-300 font-mono">
                      +100 🪙
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          dark
                            ? "text-[8px] text-white/30 font-mono"
                            : "text-[8px] text-[#7a847d] font-mono"
                        }
                      >
                        Progreso
                      </span>

                      <span className="text-[8px] font-black font-mono">
                        2/3
                      </span>
                    </div>

                    <div
                      className={
                        dark
                          ? "mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                          : "mt-2 h-2 overflow-hidden rounded-full bg-black/8"
                      }
                    >
                      <div
                        className={
                          dark
                            ? "h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                            : "h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                        }
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={
                    dark
                      ? "rounded-2xl border border-violet-300/15 bg-violet-500/[0.04] p-4"
                      : "rounded-2xl border border-emerald-300/30 bg-emerald-50 p-4"
                  }
                >
                  <p
                    className={
                      dark
                        ? "text-[7px] uppercase tracking-[0.12em] text-white/30 font-mono"
                        : "text-[7px] uppercase tracking-[0.12em] text-[#78827b] font-mono"
                    }
                  >
                    Siguiente
                  </p>

                  <p className="mt-1 text-sm font-black font-mono">
                    Párrafos con P
                  </p>

                  <button
                    type="button"
                    disabled
                    className={
                      dark
                        ? "mt-4 w-full rounded-xl border border-violet-300/15 bg-violet-500/10 px-4 py-3 text-[8px] font-black uppercase text-violet-200 opacity-60 font-mono"
                        : "mt-4 w-full rounded-xl border border-emerald-300/30 bg-white px-4 py-3 text-[8px] font-black uppercase text-emerald-700 opacity-60 font-mono"
                    }
                  >
                    Próximamente
                  </button>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>

      {/* ======================================================
          MODAL DEL PERSONAJE
          AQUÍ SÍ VA HISTORIA + HABILIDAD + TIPO
      ====================================================== */}

      {characterModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setCharacterModalOpen(
                false,
              );
            }
          }}
        >
          <div
            className={
              dark
                ? "max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                : "max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-2xl border border-black/10 bg-white"
            }
          >
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p
                  className={
                    dark
                      ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                      : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                  }
                >
                  PERSONAJE
                </p>

                <h2 className="mt-1 text-xl font-black font-mono">
                  {
                    selectedCharacter.name
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCharacterModalOpen(
                    false,
                  )
                }
                className="rounded-xl p-2 text-white/45 transition hover:bg-white/5 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENIDO */}

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="grid gap-5 p-5 md:grid-cols-[300px_1fr]">
                <div
                  className={
                    dark
                      ? "flex min-h-[390px] items-end justify-center rounded-2xl border border-white/8 bg-[#0c0712] px-4"
                      : "flex min-h-[390px] items-end justify-center rounded-2xl border border-black/7 bg-[#f4faf5] px-4"
                  }
                >
                  <Image
                    src={
                      selectedCharacter.avatar
                    }
                    alt={
                      selectedCharacter.name
                    }
                    width={
                      450
                    }
                    height={
                      450
                    }
                    className="max-h-[370px] w-auto object-contain"
                  />
                </div>

                <div>
                  {/* DESCRIPCIÓN */}

                  <section>
                    <p
                      className={
                        dark
                          ? "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-300 font-mono"
                          : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                      }
                    >
                      DESCRIPCIÓN
                    </p>

                    <p
                      className={
                        dark
                          ? "mt-2 text-sm leading-6 text-white/60 font-mono"
                          : "mt-2 text-sm leading-6 text-[#68736c] font-mono"
                      }
                    >
                      {
                        selectedCharacter.description
                      }
                    </p>
                  </section>

                  {/* HISTORIA */}

                  <section
                    className={
                      dark
                        ? "mt-5 rounded-2xl border border-violet-300/15 bg-violet-500/[0.04] p-4"
                        : "mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-50 p-4"
                    }
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono">
                      HISTORIA
                    </p>

                    <p
                      className={
                        dark
                          ? "mt-2 text-[9px] leading-5 text-white/50 font-mono"
                          : "mt-2 text-[9px] leading-5 text-[#728077] font-mono"
                      }
                    >
                      {
                        selectedCharacter.history
                      }
                    </p>
                  </section>

                  {/* DATOS */}

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div
                      className={
                        dark
                          ? "rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.03] p-4"
                          : "rounded-2xl border border-cyan-300/30 bg-cyan-50 p-4"
                      }
                    >
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-cyan-300 font-mono">
                        HABILIDAD
                      </p>

                      <p className="mt-2 text-[9px] font-black text-cyan-200 font-mono">
                        {
                          selectedCharacter.ability
                        }
                      </p>
                    </div>

                    <div
                      className={
                        dark
                          ? "rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.03] p-4"
                          : "rounded-2xl border border-emerald-300/30 bg-emerald-50 p-4"
                      }
                    >
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-emerald-300 font-mono">
                        TIPO
                      </p>

                      <p className="mt-2 text-[9px] font-black text-emerald-200 font-mono">
                        {
                          selectedCharacter.rarity
                        }
                      </p>
                    </div>
                  </div>

                  {/* BONUS */}

                  {selectedCatalogCharacter &&
                    (selectedCatalogCharacter.xp_bonus_percent >
                      0 ||
                      selectedCatalogCharacter.coin_bonus_percent >
                        0) && (
                      <section
                        className={
                          dark
                            ? "mt-3 rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.03] p-4"
                            : "mt-3 rounded-2xl border border-yellow-300/30 bg-yellow-50 p-4"
                        }
                      >
                        <p className="text-[7px] font-black uppercase tracking-[0.14em] text-yellow-300 font-mono">
                          BONUS
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedCatalogCharacter.xp_bonus_percent >
                            0 && (
                            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[8px] font-black text-cyan-300 font-mono">
                              +
                              {
                                selectedCatalogCharacter.xp_bonus_percent
                              }
                              % XP
                            </span>
                          )}

                          {selectedCatalogCharacter.coin_bonus_percent >
                            0 && (
                            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-[8px] font-black text-yellow-300 font-mono">
                              +
                              {
                                selectedCatalogCharacter.coin_bonus_percent
                              }
                              % MONEDAS
                            </span>
                          )}
                        </div>
                      </section>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL DE RANGOS
      ====================================================== */}

      {rankModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setRankModalOpen(
                false,
              );
            }
          }}
        >
          <div
            className={
              dark
                ? "max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                : "max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-2xl border border-black/10 bg-white"
            }
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p
                  className={
                    dark
                      ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                      : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                  }
                >
                  PROGRESIÓN
                </p>

                <h2 className="mt-1 text-xl font-black font-mono">
                  Rangos PeakScore
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRankModalOpen(
                    false,
                  )
                }
                className="rounded-xl p-2 text-white/45 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-5">
              <div
                className={
                  dark
                    ? "rounded-xl border border-violet-300/15 bg-violet-500/[0.04] p-4"
                    : "rounded-xl border border-emerald-300/30 bg-emerald-50 p-4"
                }
              >
                <p className="text-[9px] font-black font-mono">
                  Reinicio mensual
                </p>

                <p
                  className={
                    dark
                      ? "mt-1 text-[8px] leading-4 text-white/40 font-mono"
                      : "mt-1 text-[8px] leading-4 text-[#78827b] font-mono"
                  }
                >
                  Cada temporada comenzará
                  nuevamente desde Renacer.
                  La automatización del reinicio
                  se conectará después.
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/8">
                {ranks.map(
                  (rank) => {
                    const active =
                      rank.id ===
                      currentRank.id;

                    return (
                      <div
                        key={
                          rank.id
                        }
                        className={
                          active
                            ? dark
                              ? "grid grid-cols-[1fr_auto_1.3fr] gap-3 border-b border-white/8 bg-violet-500/[0.08] px-4 py-3"
                              : "grid grid-cols-[1fr_auto_1.3fr] gap-3 border-b border-black/7 bg-emerald-50 px-4 py-3"
                            : dark
                              ? "grid grid-cols-[1fr_auto_1.3fr] gap-3 border-b border-white/8 px-4 py-3"
                              : "grid grid-cols-[1fr_auto_1.3fr] gap-3 border-b border-black/7 px-4 py-3"
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {
                              rankIcons[
                                rank.id
                              ]
                            }
                          </span>

                          <span className="text-[9px] font-black font-mono">
                            {
                              rank.name
                            }
                          </span>
                        </div>

                        <span className="text-right text-[9px] font-black font-mono">
                          {rank.maxXp ===
                          null
                            ? `${formatNumber(
                                rank.minXp,
                              )}+`
                            : `${formatNumber(
                                rank.minXp,
                              )} – ${formatNumber(
                                rank.maxXp,
                              )}`}
                        </span>

                        <span
                          className={
                            dark
                              ? "text-[8px] text-white/35 font-mono"
                              : "text-[8px] text-[#78827b] font-mono"
                          }
                        >
                          {
                            rank.identity
                          }
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL COLECCIÓN
      ====================================================== */}

      {collectionModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setCollectionModalOpen(
                false,
              );
            }
          }}
        >
          <div
            className={
              dark
                ? "max-h-[90vh] w-full max-w-[1000px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                : "max-h-[90vh] w-full max-w-[1000px] overflow-hidden rounded-2xl border border-black/10 bg-white"
            }
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p
                  className={
                    dark
                      ? "text-[8px] font-black uppercase tracking-[0.15em] text-violet-300 font-mono"
                      : "text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700 font-mono"
                  }
                >
                  COLECCIÓN
                </p>

                <h2 className="mt-1 text-xl font-black font-mono">
                  Biblioteca de insignias
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCollectionModalOpen(
                    false,
                  )
                }
                className="rounded-xl p-2 text-white/45 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map(
                  (badge) => {
                    const unlocked =
                      unlockedBadgeIds.includes(
                        badge.id,
                      );

                    return (
                      <div
                        key={
                          badge.id
                        }
                        className={
                          dark
                            ? "rounded-2xl border border-white/8 bg-white/[0.02] p-3"
                            : "rounded-2xl border border-black/7 bg-[#fbfcfb] p-3"
                        }
                      >
                        <div
                          className={
                            dark
                              ? "relative flex h-[175px] items-center justify-center rounded-xl bg-[#0c0712]"
                              : "relative flex h-[175px] items-center justify-center rounded-xl bg-[#f4faf5]"
                          }
                        >
                          <Image
                            src={
                              badge.image
                            }
                            alt={
                              badge.name
                            }
                            width={
                              180
                            }
                            height={
                              180
                            }
                            className={
                              unlocked
                                ? "h-[140px] w-[140px] object-contain"
                                : "h-[140px] w-[140px] object-contain opacity-20 grayscale"
                            }
                          />

                          {!unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30">
                                <Lock
                                  size={
                                    16
                                  }
                                />
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black font-mono">
                              {
                                badge.name
                              }
                            </p>

                            <p
                              className={
                                dark
                                  ? "mt-0.5 text-[8px] text-white/35 font-mono"
                                  : "mt-0.5 text-[8px] text-[#7b857e] font-mono"
                              }
                            >
                              {
                                badge.level
                              }
                            </p>
                          </div>

                          <span
                            className={
                              unlocked
                                ? "rounded-full bg-emerald-400 px-2 py-1 text-[7px] font-black text-[#07130d] font-mono"
                                : "rounded-full border border-white/10 px-2 py-1 text-[7px] font-black text-white/30 font-mono"
                            }
                          >
                            {unlocked
                              ? "DESBLOQUEADA"
                              : "BLOQUEADA"}
                          </span>
                        </div>

                        <p
                          className={
                            dark
                              ? "mt-2 text-[8px] leading-4 text-white/35 font-mono"
                              : "mt-2 text-[8px] leading-4 text-[#78827b] font-mono"
                          }
                        >
                          {
                            badge.description
                          }
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL DE COMPRA
      ====================================================== */}

      {purchaseModalCharacterId &&
        purchaseCharacterData &&
        purchaseCatalog && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onMouseDown={(
              event,
            ) => {
              if (
                event.target ===
                  event.currentTarget &&
                !characterActionLoading
              ) {
                setPurchaseModalCharacterId(
                  null,
                );
              }
            }}
          >
            <div
              className={
                dark
                  ? "w-full max-w-[760px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#10091a]"
                  : "w-full max-w-[760px] overflow-hidden rounded-2xl border border-black/10 bg-white"
              }
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <p
                    className={
                      dark
                        ? "text-[8px] font-black uppercase tracking-[0.12em] text-violet-300 font-mono"
                        : "text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700 font-mono"
                    }
                  >
                    PERSONAJE
                  </p>

                  <h3 className="mt-1 text-xl font-black font-mono">
                    {
                      purchaseCharacterData.name
                    }
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPurchaseModalCharacterId(
                      null,
                    )
                  }
                  className="rounded-xl p-2 text-white/45 hover:bg-white/5 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-[250px_1fr]">
                <div
                  className={
                    dark
                      ? "flex min-h-[320px] items-end justify-center rounded-2xl border border-white/8 bg-[#0c0712] px-4"
                      : "flex min-h-[320px] items-end justify-center rounded-2xl border border-black/7 bg-[#f4faf5] px-4"
                  }
                >
                  <Image
                    src={
                      purchaseCharacterData.avatar
                    }
                    alt={
                      purchaseCharacterData.name
                    }
                    width={
                      420
                    }
                    height={
                      420
                    }
                    className="max-h-[300px] w-auto object-contain"
                  />
                </div>

                <div>
                  <p
                    className={
                      dark
                        ? "text-xs leading-5 text-white/50 font-mono"
                        : "text-xs leading-5 text-[#69746d] font-mono"
                    }
                  >
                    {
                      purchaseCharacterData.description
                    }
                  </p>

                  <div
                    className={
                      dark
                        ? "mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4"
                        : "mt-5 rounded-2xl border border-black/7 bg-[#fbfcfb] p-4"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={
                            dark
                              ? "text-[7px] uppercase tracking-[0.12em] text-white/30 font-mono"
                              : "text-[7px] uppercase tracking-[0.12em] text-[#79837c] font-mono"
                          }
                        >
                          Precio
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-2xl font-black font-mono">
                          <Coins
                            size={
                              20
                            }
                            className="text-yellow-300"
                          />

                          {formatNumber(
                            purchasePrice,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={
                            dark
                              ? "text-[7px] uppercase tracking-[0.12em] text-white/30 font-mono"
                              : "text-[7px] uppercase tracking-[0.12em] text-[#79837c] font-mono"
                          }
                        >
                          Tu saldo
                        </p>

                        <p className="mt-1 text-lg font-black font-mono">
                          {formatNumber(
                            profileData?.coins ??
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!enoughCoins && (
                    <p className="mt-3 rounded-xl border border-red-300/15 bg-red-400/[0.05] p-3 text-[8px] text-red-200 font-mono">
                      Te faltan{" "}
                      {formatNumber(
                        purchasePrice -
                          (profileData?.coins ??
                            0),
                      )}{" "}
                      monedas.
                    </p>
                  )}

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={
                        characterActionLoading ||
                        !enoughCoins
                      }
                      onClick={async () => {
                        const purchased =
                          await purchaseCharacter(
                            purchaseCharacterData.id,
                          );

                        if (
                          purchased
                        ) {
                          setPurchaseModalCharacterId(
                            null,
                          );
                        }
                      }}
                      className={
                        dark
                          ? "rounded-xl bg-violet-500 px-4 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-violet-400 disabled:opacity-30 font-mono"
                          : "rounded-xl bg-emerald-500 px-4 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-600 disabled:opacity-30 font-mono"
                      }
                    >
                      {characterActionLoading
                        ? "Desbloqueando..."
                        : enoughCoins
                          ? "Desbloquear personaje"
                          : "Necesitas más monedas"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        characterActionLoading
                      }
                      onClick={() =>
                        setPurchaseModalCharacterId(
                          null,
                        )
                      }
                      className={
                        dark
                          ? "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-white/55 font-mono"
                          : "rounded-xl border border-black/8 bg-[#f7f9f7] px-4 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-[#657168] font-mono"
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

/* ============================================================
   COMPONENTES
============================================================ */

function MiniStat({
  dark,
  label,
  value,
  valueClass = "",
}: {
  dark: boolean;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          dark
            ? "text-[9px] text-white/40 font-mono"
            : "text-[9px] text-[#707a73] font-mono"
        }
      >
        {label}
      </span>

      <span
        className={
          "text-[10px] font-black font-mono " +
          valueClass
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  dark,
  label,
  value,
  subtitle,
  icon,
}: {
  dark: boolean;
  label: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-2xl border border-violet-300/15 bg-[#10091a] p-4"
          : "rounded-2xl border border-black/8 bg-white p-4"
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
          {icon}
        </div>

        <span
          className={
            dark
              ? "text-[7px] uppercase text-white/30 font-mono"
              : "text-[7px] uppercase text-[#7c867f] font-mono"
          }
        >
          {label}
        </span>
      </div>

      <p className="mt-4 text-2xl font-black font-mono">
        {value}
      </p>

      {subtitle && (
        <p
          className={
            dark
              ? "mt-1 text-[8px] text-white/30 font-mono"
              : "mt-1 text-[8px] text-[#7b857e] font-mono"
          }
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
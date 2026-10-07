"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Moon,
  Pencil,
  Plus,
  X,
  LampDesk,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type Character = {
  id: string;
  name: string;
  description: string;

  // Imagen EXCLUSIVA para la tarjeta de personajes
  avatar: string;

  // Imagen EXCLUSIVA para la foto de perfil
  profile: string;

  // Bioma de la tarjeta izquierda
  biome: string;

  characterPosition: string;
  characterWidth: string;
};

type Badge = {
  id: string;
  name: string;
  level: string;
  image: string;
  description: string;
  progress: number;
  target: number;
};

const characters: Character[] = [
  {
    id: "peaky-nova",
    name: "Peaky Nova",
    description: "El guardián del universo PeakScore.",

    // SOLO PERSONAJE
    avatar: "/avatars/peaky-nova.webp",

    // SOLO FOTO DE PERFIL
    profile: "/avatars/photo_perfil/peaky-nova-profile.png",

    // SOLO BIOMA
    biome: "/characters/peaky-nova.png",

    characterPosition: "bottom-[58px]",
    characterWidth: "w-[64%]",
  },

  {
    id: "peaky-nox",
    name: "Peaky Nox",
    description: "La fuerza del multiverso oscuro.",

    // SOLO PERSONAJE
    avatar: "/avatars/peaky-nox.webp",

    // SOLO FOTO DE PERFIL
    profile: "/avatars/photo_perfil/peaky-nox-profile.png",

    // SOLO BIOMA
    biome: "/characters/peaky-nox.png",

    characterPosition: "bottom-[58px]",
    characterWidth: "w-[64%]",
  },

  {
    id: "zyra",
    name: "Zyra",
    description: "Curiosidad, exploración y aprendizaje.",

    // SOLO PERSONAJE
    avatar: "/avatars/zorra.webp",

    // SOLO FOTO DE PERFIL
    profile: "/avatars/photo_perfil/zyra-profile.png",

    // SOLO BIOMA
    biome: "/characters/zyra.png",

    characterPosition: "bottom-[78px]",
    characterWidth: "w-[64%]",
  },

  {
    id: "orby",
    name: "Orby",
    description: "Tecnología, precisión e inteligencia.",

    // SOLO PERSONAJE
    avatar: "/avatars/orby.webp",

    // SOLO FOTO DE PERFIL
    profile: "/avatars/photo_perfil/orby-profile.png",

    // SOLO BIOMA
    biome: "/characters/orby.png",

    characterPosition: "bottom-[84px]",
    characterWidth: "w-[64%]",
  },
];

const lockedCharacters = 4;

const badges: Badge[] = [
  {
    id: "aprendizaje-1",
    name: "APRENDIZAJE",
    level: "Nivel I",
    image: "/badges/aprendizaje-1.png",
    description: "Completa 5 simulacros simples.",
    progress: 5,
    target: 5,
  },

  {
    id: "aprendizaje-2",
    name: "APRENDIZAJE",
    level: "Nivel II",
    image: "/badges/aprendizaje-2.png",
    description: "Completa 20 simulacros simples.",
    progress: 20,
    target: 20,
  },

  {
    id: "aprendizaje-3",
    name: "APRENDIZAJE",
    level: "Nivel III",
    image: "/badges/aprendizaje-3.png",
    description: "Completa 50 simulacros simples.",
    progress: 50,
    target: 50,
  },

  {
    id: "constante-1",
    name: "CONSTANTE",
    level: "Nivel I",
    image: "/badges/constante-1.png",
    description: "Completa 3 simulacros completos.",
    progress: 3,
    target: 3,
  },

  {
    id: "racha-1",
    name: "RACHA",
    level: "Nivel I",
    image: "/badges/racha-1.png",
    description: "Mantén una racha de 10 días.",
    progress: 10,
    target: 10,
  },

  {
    id: "racha-2",
    name: "RACHA",
    level: "Nivel II",
    image: "/badges/racha-2.png",
    description: "Mantén una racha de 20 días.",
    progress: 20,
    target: 20,
  },

  {
    id: "racha-3",
    name: "RACHA",
    level: "Nivel III",
    image: "/badges/racha-3.png",
    description: "Mantén una racha de 30 días.",
    progress: 30,
    target: 30,
  },
];

const defaultEquippedBadges = [
  "aprendizaje-3",
  "constante-1",
  "racha-3",
  "aprendizaje-2",
];

export default function PerfilPage() {
  const [theme, setTheme] = useState<Theme>("light");

  const [selectedCharacterId, setSelectedCharacterId] =
    useState("peaky-nova");

  const [description, setDescription] = useState("Date a conocer...");

  const [editingDescription, setEditingDescription] =
    useState(false);

  const [equippedBadges, setEquippedBadges] =
    useState<string[]>(defaultEquippedBadges);

  const [badgeSelectorOpen, setBadgeSelectorOpen] =
    useState(false);

  const [selectedBadgeSlot, setSelectedBadgeSlot] =
    useState<number | null>(null);

  const [allBadgesOpen, setAllBadgesOpen] = useState(false);

  /*
   * ============================================================
   * PERSONAJE SELECCIONADO
   * ============================================================
   */

  const selectedCharacter = useMemo(() => {
    return (
      characters.find(
        (character) => character.id === selectedCharacterId,
      ) ?? characters[0]
    );
  }, [selectedCharacterId]);

  /*
   * ============================================================
   * CARGAR CONFIGURACIÓN LOCAL
   * ============================================================
   */

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      "peakscore-profile-theme",
    ) as Theme | null;

    const savedCharacter = window.localStorage.getItem(
      "peakscore-profile-character",
    );

    const savedDescription = window.localStorage.getItem(
      "peakscore-profile-description",
    );

    const savedBadges = window.localStorage.getItem(
      "peakscore-profile-badges",
    );

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    if (
      savedCharacter &&
      characters.some(
        (character) => character.id === savedCharacter,
      )
    ) {
      setSelectedCharacterId(savedCharacter);
    }

    if (savedDescription) {
      setDescription(savedDescription);
    }

    if (savedBadges) {
      try {
        const parsed = JSON.parse(savedBadges);

        if (
          Array.isArray(parsed) &&
          parsed.length <= 4 &&
          parsed.every((id) => typeof id === "string")
        ) {
          setEquippedBadges(parsed);
        }
      } catch {
        // Datos corruptos: mantenemos valores por defecto.
      }
    }
  }, []);

  /*
   * ============================================================
   * GUARDAR CONFIGURACIÓN
   * ============================================================
   */

  useEffect(() => {
    window.localStorage.setItem(
      "peakscore-profile-theme",
      theme,
    );
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(
      "peakscore-profile-character",
      selectedCharacterId,
    );
  }, [selectedCharacterId]);

  useEffect(() => {
    window.localStorage.setItem(
      "peakscore-profile-description",
      description,
    );
  }, [description]);

  useEffect(() => {
    window.localStorage.setItem(
      "peakscore-profile-badges",
      JSON.stringify(equippedBadges),
    );
  }, [equippedBadges]);

  /*
   * ============================================================
   * FUNCIONES
   * ============================================================
   */

  const getBadge = (id: string) =>
    badges.find((badge) => badge.id === id);

  const selectedBadges = equippedBadges.map((id) =>
    getBadge(id),
  );

  const changeCharacter = (id: string) => {
    setSelectedCharacterId(id);
  };

  const openBadgeSelector = (slot: number) => {
    setSelectedBadgeSlot(slot);
    setBadgeSelectorOpen(true);
  };

  const equipBadge = (badgeId: string) => {
    if (selectedBadgeSlot === null) return;

    setEquippedBadges((current) => {
      const next = [...current];

      const oldIndex = next.indexOf(badgeId);

      if (
        oldIndex !== -1 &&
        oldIndex !== selectedBadgeSlot
      ) {
        next[oldIndex] = "";
      }

      next[selectedBadgeSlot] = badgeId;

      return next;
    });

    setBadgeSelectorOpen(false);
    setSelectedBadgeSlot(null);
  };

  const removeBadge = (slot: number) => {
    setEquippedBadges((current) => {
      const next = [...current];

      next[slot] = "";

      return next;
    });
  };

  /*
   * ============================================================
   * FONDOS GLOBALES
   * ============================================================
   *
   * Los dos archivos se mantienen cargados.
   * No se desmonta el fondo oscuro al estar en claro.
   *
   * El fondo se coloca directamente sobre el viewport.
   * Esto evita que una capa sólida del main tape el bioma.
   */

  const lightBiome = "/perfil/biome-profile-light.webp";
  const darkBiome = "/perfil/biome-profile-dark.webp";

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-x-hidden
        bg-[#020814]
        text-white
        isolate
      "
    >
      {/*
       * ========================================================
       * BIOMAS GLOBALES
       * ========================================================
       */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          overflow-hidden
        "
      >
        {/*
         * FONDO CLARO
         *
         * Se utiliza img nativo aquí deliberadamente para que
         * el fondo global no dependa del procesamiento de
         * next/image.
         */}

        <img
          src={lightBiome}
          alt=""
          aria-hidden="true"
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
            scale-[1.06]
            transition-opacity
            duration-500
            ${
              theme === "light"
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/*
         * FONDO OSCURO
         */}

        <img
          src={darkBiome}
          alt=""
          aria-hidden="true"
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
            scale-[1.06]
            transition-opacity
            duration-500
            ${
              theme === "dark"
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/*
         * CAPA DE LEGIBILIDAD
         */}

        <div
          className={`
            absolute
            inset-0
            ${
              theme === "light"
                ? "bg-[#031326]/30"
                : "bg-[#01030a]/58"
            }
          `}
        />

        {/*
         * VIÑETA
         */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,transparent_12%,rgba(0,0,0,.42)_100%)]
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-[#020814]/10
            via-transparent
            to-[#020814]/55
          "
        />
      </div>

      {/*
       * ========================================================
       * CONTENIDO
       * ========================================================
       */}

      <div
        className="
          relative
          z-10
          mx-auto
          min-h-screen
          w-full
          max-w-[1540px]
          px-4
          py-5
          sm:px-6
          lg:px-8
        "
      >
        {/*
         * ======================================================
         * TOP BAR
         * ======================================================
         */}

        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-white/15
              bg-[#061426]/85
              px-3
              py-2
              text-xs
              font-bold
              text-white/80
              backdrop-blur-md
              transition
              hover:border-cyan-400/50
              hover:text-white
              font-mono
            "
          >
            <ArrowLeft size={14} />

            Volver al Dashboard
          </Link>

          {/*
           * ====================================================
           * BOTÓN DE TEMA
           *
           * Claro = lámpara
           * Oscuro = luna
           * ====================================================
           */}

          <button
            type="button"
            aria-label={
              theme === "light"
                ? "Cambiar a modo oscuro"
                : "Cambiar a modo claro"
            }
            title={
              theme === "light"
                ? "Cambiar a modo oscuro"
                : "Cambiar a modo claro"
            }
            onClick={() =>
              setTheme((current) =>
                current === "light"
                  ? "dark"
                  : "light",
              )
            }
            className="
              group
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/35
              shadow-[0_8px_30px_rgba(0,0,0,.35)]
              backdrop-blur-xl
              transition-all
              duration-300
              hover:scale-105
              hover:border-white/40
            "
          >
            <span
              className={`
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                transition-all
                duration-300
                ${
                  theme === "light"
                    ? "bg-cyan-400 text-[#03101d] shadow-[0_0_18px_rgba(34,211,238,.55)]"
                    : "bg-violet-500 text-white shadow-[0_0_18px_rgba(139,92,246,.55)]"
                }
              `}
            >
              {theme === "light" ? (
                <LampDesk
                  size={18}
                  strokeWidth={2.2}
                />
              ) : (
                <Moon
                  size={17}
                  strokeWidth={2.2}
                />
              )}
            </span>
          </button>
        </div>

        {/*
         * ======================================================
         * HEADER
         * ======================================================
         */}

        <header className="mx-auto mt-6 w-full max-w-[1240px]">
          <h1
            className="
              mt-1
              text-4xl
              font-black
              tracking-[-0.04em]
              text-white
              sm:text-5xl
              font-mono
            "
          >
            MI PERFIL
          </h1>

          <p className="mt-1 text-sm text-white/75 font-mono">
            Personaliza tu identidad en PeakScore.
          </p>
        </header>

        {/*
         * ======================================================
         * GRID PRINCIPAL
         * ======================================================
         */}

        <div
          className="
            mx-auto
            mt-5
            grid
            w-full
            max-w-[1240px]
            gap-4
            lg:grid-cols-[320px_1fr]
          "
        >
          {/*
           * ====================================================
           * TARJETA IZQUIERDA
           * ====================================================
           */}

          <aside
            className="
              relative
              min-h-[700px]
              overflow-hidden
              rounded-2xl
              border
              border-white/20
              bg-[#061426]/70
              shadow-[0_20px_70px_rgba(0,0,0,.45)]
              backdrop-blur-[2px]
            "
          >
            {/*
             * BIOMA
             */}

            <div className="absolute inset-0">
              <Image
                key={selectedCharacter.biome}
                src={selectedCharacter.biome}
                alt={`${selectedCharacter.name} biome`}
                fill
                priority
                sizes="320px"
                className="
                  object-cover
                  object-center
                "
              />

              <div
                className="
                  absolute
                  inset-x-0
                  bottom-0
                  h-[34%]
                  bg-gradient-to-t
                  from-[#020814]
                  via-[#020814]/65
                  to-transparent
                "
              />
            </div>

            {/*
             * PERSONAJE
             *
             * IMPORTANTE:
             * Aquí SOLO usamos avatar.
             *
             * Nunca usamos profile.
             */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                top-0
                bottom-[92px]
                z-10
              "
            >
              <img
                key={selectedCharacter.avatar}
                src={`${selectedCharacter.avatar}?character=${selectedCharacter.id}`}
                alt={selectedCharacter.name}
                className={`
                  absolute
                  left-1/2
                  ${selectedCharacter.characterPosition}
                  ${selectedCharacter.characterWidth}
                  max-w-[270px]
                  -translate-x-1/2
                  object-contain
                  drop-shadow-[0_14px_16px_rgba(0,0,0,.65)]
                `}
              />
            </div>

            {/*
             * FOOTER
             *
             * Solo nombre + descripción.
             */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-20
                border-t
                border-white/15
                bg-[#020814]/92
                px-4
                py-4
                backdrop-blur-md
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    truncate
                    text-xl
                    font-black
                    font-mono
                  "
                >
                  {selectedCharacter.name}
                </h2>

                <p
                  className="
                    mt-1
                    truncate
                    text-[11px]
                    text-white/60
                    font-mono
                  "
                >
                  {selectedCharacter.description}
                </p>
              </div>
            </div>
          </aside>

          {/*
           * ====================================================
           * COLUMNA DERECHA
           * ====================================================
           */}

          <section className="space-y-4">
            {/*
             * ==================================================
             * DATOS DEL PERFIL
             * ==================================================
             */}

            <section
              className="
                rounded-2xl
                border
                border-white/15
                bg-[#061a31]/90
                p-5
                shadow-[0_15px_50px_rgba(0,0,0,.25)]
                backdrop-blur-md
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-5
                  sm:flex-row
                  sm:items-start
                "
              >
                {/*
                 * FOTO DE PERFIL
                 *
                 * SOLO usa profile.
                 */}

                <div
                  className="
                    relative
                    h-[76px]
                    w-[76px]
                    shrink-0
                    overflow-hidden
                    rounded-xl
                    border
                    border-fuchsia-400/50
                    bg-[#03101f]
                  "
                >
                  <Image
                    src={selectedCharacter.profile}
                    alt={selectedCharacter.name}
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                </div>

                {/*
                 * INFORMACIÓN
                 */}

                <div className="min-w-0 flex-1">
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-3
                    "
                  >
                    <h2
                      className="
                        text-2xl
                        font-black
                        sm:text-3xl
                        font-mono
                      "
                    >
                      Yostyn Aragón
                    </h2>

                    <div className="flex items-center gap-2">
                      {selectedBadges.map(
                        (badge, index) => (
                          <button
                            key={`profile-badge-${index}`}
                            type="button"
                            onClick={() =>
                              openBadgeSelector(index)
                            }
                            className="
                              group
                              relative
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-white/15
                              bg-black/20
                              transition
                              hover:scale-105
                              hover:border-fuchsia-400/60
                            "
                          >
                            {badge ? (
                              <Image
                                src={badge.image}
                                alt={badge.name}
                                width={36}
                                height={36}
                                className="
                                  h-8
                                  w-8
                                  object-contain
                                "
                              />
                            ) : (
                              <Plus
                                size={17}
                                className="
                                  text-white/40
                                  transition
                                  group-hover:text-fuchsia-300
                                "
                              />
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/*
                   * DESCRIPCIÓN
                   */}

                  <div
                    className="
                      mt-3
                      flex
                      max-w-[360px]
                      items-center
                      gap-2
                    "
                  >
                    {editingDescription ? (
                      <input
                        autoFocus
                        value={description}
                        maxLength={80}
                        onChange={(event) =>
                          setDescription(
                            event.target.value,
                          )
                        }
                        onBlur={() =>
                          setEditingDescription(false)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            setEditingDescription(
                              false,
                            );
                          }
                        }}
                        className="
                          w-full
                          rounded-md
                          border
                          border-fuchsia-400/40
                          bg-black/20
                          px-3
                          py-2
                          text-sm
                          text-white
                          outline-none
                          font-mono
                        "
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingDescription(true)
                        }
                        className="
                          group
                          flex
                          min-w-0
                          items-center
                          gap-2
                          text-left
                          text-sm
                          italic
                          text-white/60
                          transition
                          hover:text-white
                          font-mono
                        "
                      >
                        <span className="truncate">
                          {description}
                        </span>

                        <Pencil
                          size={13}
                          className="
                            opacity-50
                            group-hover:text-fuchsia-300
                          "
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/*
                 * NIVEL
                 */}

                <div
                  className="
                    flex
                    h-[82px]
                    w-[82px]
                    shrink-0
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-yellow-400/60
                    bg-yellow-400/[0.06]
                  "
                >
                  <span className="text-xl text-yellow-300">
                    ★
                  </span>

                  <span
                    className="
                      text-[8px]
                      font-black
                      tracking-wider
                      text-yellow-200
                      font-mono
                    "
                  >
                    NIVEL
                  </span>

                  <span
                    className="
                      text-2xl
                      font-black
                      leading-none
                      text-yellow-300
                      font-mono
                    "
                  >
                    12
                  </span>
                </div>
              </div>

              {/*
               * XP
               */}

              <div className="mt-5">
                <div
                  className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    text-[11px]
                    text-white/60
                    font-mono
                  "
                >
                  <span>Experiencia</span>

                  <span className="font-bold text-white/80">
                    850 / 1.200 XP
                  </span>
                </div>

                <div
                  className="
                    h-2.5
                    overflow-hidden
                    rounded-full
                    bg-white/10
                  "
                >
                  <div
                    className="
                      h-full
                      w-[71%]
                      rounded-full
                      bg-gradient-to-r
                      from-cyan-400
                      via-blue-500
                      to-violet-500
                    "
                  />
                </div>
              </div>
            </section>

            {/*
             * ==================================================
             * PERSONAJES
             * ==================================================
             */}

            <section
              id="personajes"
              className="
                rounded-2xl
                border
                border-white/15
                bg-[#061a31]/90
                p-5
                backdrop-blur-md
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-black
                      font-mono
                    "
                  >
                    PERSONAJES
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-white/55
                      font-mono
                    "
                  >
                    Elige el personaje que te
                    representará en PeakScore.
                  </p>
                </div>

                <span
                  className="
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-3
                    py-1.5
                    text-[9px]
                    font-bold
                    text-white/50
                    font-mono
                  "
                >
                  4 / 8 DISPONIBLES
                </span>
              </div>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-4
                  xl:grid-cols-8
                "
              >
                {characters.map((character) => {
                  const selected =
                    character.id ===
                    selectedCharacterId;

                  return (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() =>
                        changeCharacter(
                          character.id,
                        )
                      }
                      className={`
                        group
                        relative
                        overflow-hidden
                        rounded-xl
                        border
                        p-2
                        text-left
                        transition-all
                        ${
                          selected
                            ? "border-yellow-400 bg-yellow-400/[0.06] shadow-[0_0_20px_rgba(250,204,21,.12)]"
                            : "border-white/10 bg-[#07182c]/80 hover:border-fuchsia-400/40"
                        }
                      `}
                    >
                      {selected && (
                        <span
                          className="
                            absolute
                            left-2
                            top-2
                            z-10
                            rounded-md
                            bg-yellow-400
                            px-2
                            py-1
                            text-[7px]
                            font-black
                            text-black
                            font-mono
                          "
                        >
                          EQUIPADO
                        </span>
                      )}

                      <div
                        className="
                          relative
                          aspect-[3/4]
                          overflow-hidden
                          rounded-lg
                          bg-black/20
                        "
                      >
                        {/*
                         * IMPORTANTE:
                         *
                         * Aquí SOLO avatar.
                         * Nunca profile.
                         */}

                        <Image
                          src={character.avatar}
                          alt={character.name}
                          fill
                          sizes="150px"
                          className="
                            object-contain
                            transition
                            duration-300
                            group-hover:scale-105
                          "
                        />
                      </div>

                      <div className="mt-2 px-1 pb-1">
                        <p
                          className="
                            truncate
                            text-[12px]
                            font-black
                            font-mono
                          "
                        >
                          {character.name}
                        </p>

                        <p
                          className="
                            mt-1
                            line-clamp-2
                            text-[9px]
                            leading-tight
                            text-white/50
                            font-mono
                          "
                        >
                          {character.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/*
                 * BLOQUEADOS
                 */}

                {Array.from({
                  length: lockedCharacters,
                }).map((_, index) => (
                  <div
                    key={`locked-${index}`}
                    className="
                      relative
                      overflow-hidden
                      rounded-xl
                      border
                      border-white/[0.06]
                      bg-[#03101f]/75
                      p-2
                    "
                  >
                    <div
                      className="
                        relative
                        flex
                        aspect-[3/4]
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-white/[0.04]
                        bg-black/10
                      "
                    >
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-white/10
                          text-white/20
                        "
                      >
                        <span
                          className="
                            text-xl
                            font-black
                            font-mono
                          "
                        >
                          ?
                        </span>
                      </div>

                      <Lock
                        size={11}
                        className="
                          absolute
                          bottom-2
                          right-2
                          text-white/20
                        "
                      />
                    </div>

                    <div className="px-1 pb-1 pt-2">
                      <p
                        className="
                          text-[10px]
                          font-black
                          text-white/25
                          font-mono
                        "
                      >
                        ???
                      </p>

                      <p
                        className="
                          text-[8px]
                          text-white/20
                          font-mono
                        "
                      >
                        Próximamente
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/*
             * ==================================================
             * INSIGNIAS
             * ==================================================
             */}

            <section
              className="
                rounded-2xl
                border
                border-white/15
                bg-[#061a31]/90
                p-5
                backdrop-blur-md
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-black
                      font-mono
                    "
                  >
                    INSIGNIAS
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-white/55
                      font-mono
                    "
                  >
                    Colecciona logros y muestra tus
                    mejores insignias.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAllBadgesOpen(true)
                  }
                  className="
                    inline-flex
                    items-center
                    gap-1
                    rounded-lg
                    border
                    border-fuchsia-400/60
                    bg-fuchsia-400/[0.06]
                    px-4
                    py-2
                    text-[10px]
                    font-bold
                    text-white
                    transition
                    hover:bg-fuchsia-400/15
                    font-mono
                  "
                >
                  Ver más insignias

                  <ChevronRight size={13} />
                </button>
              </div>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-4
                "
              >
                {selectedBadges.map(
                  (badge, index) => (
                    <button
                      key={`main-badge-${index}`}
                      type="button"
                      onClick={() =>
                        openBadgeSelector(index)
                      }
                      className="
                        group
                        relative
                        flex
                        min-h-[145px]
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-xl
                        border
                        border-white/10
                        bg-gradient-to-b
                        from-[#0b233c]
                        to-[#061426]
                        transition
                        hover:border-fuchsia-400/40
                      "
                    >
                      {badge ? (
                        <>
                          <Image
                            src={badge.image}
                            alt={badge.name}
                            width={150}
                            height={150}
                            className="
                              h-[100px]
                              w-[100px]
                              object-contain
                              transition
                              group-hover:scale-105
                            "
                          />

                          <span
                            className="
                              absolute
                              bottom-2
                              left-0
                              right-0
                              text-center
                              text-[9px]
                              font-bold
                              text-white/45
                              font-mono
                            "
                          >
                            {badge.name} ·{" "}
                            {badge.level}
                          </span>
                        </>
                      ) : (
                        <div
                          className="
                            flex
                            flex-col
                            items-center
                            gap-1
                            text-white/30
                          "
                        >
                          <Plus size={22} />

                          <span
                            className="
                              text-[9px]
                              font-mono
                            "
                          >
                            Agregar insignia
                          </span>
                        </div>
                      )}
                    </button>
                  ),
                )}
              </div>

              <p
                className="
                  mt-3
                  text-center
                  text-[8px]
                  text-white/25
                  font-mono
                "
              >
                Puedes mostrar hasta 4 insignias
                junto a tu nombre.
              </p>
            </section>
          </section>
        </div>
      </div>

      {/*
       * ========================================================
       * MODAL — ELEGIR INSIGNIA
       * ========================================================
       */}

      {badgeSelectorOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setBadgeSelectorOpen(false);
              setSelectedBadgeSlot(null);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-[700px]
              overflow-hidden
              rounded-2xl
              border
              border-white/15
              bg-[#061426]
              shadow-[0_30px_100px_rgba(0,0,0,.65)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-white/10
                px-6
                py-5
              "
            >
              <div>
                <h3
                  className="
                    text-xl
                    font-black
                    font-mono
                  "
                >
                  Elegir insignia
                </h3>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-white/45
                    font-mono
                  "
                >
                  Selecciona la insignia que quieres
                  mostrar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBadgeSelectorOpen(false);
                  setSelectedBadgeSlot(null);
                }}
                className="
                  rounded-lg
                  p-2
                  text-white/50
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="
                grid
                max-h-[65vh]
                grid-cols-2
                gap-3
                overflow-y-auto
                p-5
                sm:grid-cols-3
              "
            >
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() =>
                    equipBadge(badge.id)
                  }
                  className="
                    group
                    rounded-xl
                    border
                    border-white/10
                    bg-[#081b30]
                    p-4
                    text-center
                    transition
                    hover:border-fuchsia-400/50
                  "
                >
                  <Image
                    src={badge.image}
                    alt={badge.name}
                    width={120}
                    height={120}
                    className="
                      mx-auto
                      h-[100px]
                      w-[100px]
                      object-contain
                      transition
                      group-hover:scale-105
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-[11px]
                      font-black
                      font-mono
                    "
                  >
                    {badge.name}
                  </p>

                  <span
                    className="
                      mt-1
                      inline-flex
                      rounded-full
                      border
                      border-white/10
                      px-2
                      py-1
                      text-[8px]
                      font-bold
                      text-white/60
                      font-mono
                    "
                  >
                    {badge.level}
                  </span>

                  <p
                    className="
                      mt-2
                      text-[9px]
                      leading-tight
                      text-white/40
                      font-mono
                    "
                  >
                    {badge.description}
                  </p>
                </button>
              ))}
            </div>

            {selectedBadgeSlot !== null &&
              equippedBadges[
                selectedBadgeSlot
              ] && (
                <div
                  className="
                    border-t
                    border-white/10
                    px-5
                    py-4
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      removeBadge(
                        selectedBadgeSlot,
                      );

                      setBadgeSelectorOpen(
                        false,
                      );

                      setSelectedBadgeSlot(
                        null,
                      );
                    }}
                    className="
                      w-full
                      rounded-lg
                      border
                      border-red-400/20
                      bg-red-400/[0.04]
                      py-2.5
                      text-[10px]
                      font-bold
                      text-red-300
                      hover:bg-red-400/10
                      font-mono
                    "
                  >
                    Quitar insignia de este
                    espacio
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/*
       * ========================================================
       * MODAL — TODAS LAS INSIGNIAS
       * ========================================================
       */}

      {allBadgesOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/75
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setAllBadgesOpen(false);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-[900px]
              overflow-hidden
              rounded-2xl
              border
              border-white/15
              bg-[#061426]
              shadow-[0_30px_100px_rgba(0,0,0,.7)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-white/10
                px-6
                py-5
              "
            >
              <div>
                <h3
                  className="
                    text-xl
                    font-black
                    font-mono
                  "
                >
                  Biblioteca de insignias
                </h3>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-white/45
                    font-mono
                  "
                >
                  Completa desafíos para desbloquear
                  nuevas insignias.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAllBadgesOpen(false)
                }
                className="
                  rounded-lg
                  p-2
                  text-white/50
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="
                grid
                max-h-[70vh]
                grid-cols-2
                gap-4
                overflow-y-auto
                p-6
                sm:grid-cols-3
                lg:grid-cols-4
              "
            >
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-gradient-to-b
                    from-[#0b233c]
                    to-[#061426]
                    p-4
                    text-center
                  "
                >
                  <Image
                    src={badge.image}
                    alt={badge.name}
                    width={140}
                    height={140}
                    className="
                      mx-auto
                      h-[120px]
                      w-[120px]
                      object-contain
                    "
                  />

                  <p
                    className="
                      text-[11px]
                      font-black
                      font-mono
                    "
                  >
                    {badge.name}
                  </p>

                  <span
                    className="
                      mt-1
                      inline-flex
                      rounded-full
                      border
                      border-white/10
                      px-2
                      py-1
                      text-[8px]
                      font-bold
                      text-white/60
                      font-mono
                    "
                  >
                    {badge.level}
                  </span>

                  <p
                    className="
                      mt-2
                      min-h-[30px]
                      text-[9px]
                      leading-tight
                      text-white/40
                      font-mono
                    "
                  >
                    {badge.description}
                  </p>

                  <div className="mt-4">
                    <div
                      className="
                        mb-1
                        flex
                        justify-between
                        text-[8px]
                        text-white/40
                        font-mono
                      "
                    >
                      <span>Progreso</span>

                      <span>
                        {badge.progress}/
                        {badge.target}
                      </span>
                    </div>

                    <div
                      className="
                        h-2
                        overflow-hidden
                        rounded-full
                        bg-white/10
                      "
                    >
                      <div
                        className="
                          h-full
                          w-full
                          rounded-full
                          bg-gradient-to-r
                          from-cyan-400
                          to-violet-500
                        "
                      />
                    </div>
                  </div>
                </div>
              ))}

              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={`future-badge-${index}`}
                  className="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-[#030b17]/60
                    p-4
                    text-center
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex
                      h-[120px]
                      w-[120px]
                      items-center
                      justify-center
                    "
                  >
                    <div
                      className="
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/10
                        text-3xl
                        font-black
                        text-white/20
                        font-mono
                      "
                    >
                      ?
                    </div>
                  </div>

                  <p
                    className="
                      text-[11px]
                      font-black
                      text-white/30
                      font-mono
                    "
                  >
                    PRÓXIMAMENTE
                  </p>

                  <p
                    className="
                      mt-2
                      text-[9px]
                      text-white/20
                      font-mono
                    "
                  >
                    Sigue avanzando para descubrir
                    esta insignia.
                  </p>

                  <Lock
                    size={14}
                    className="
                      mx-auto
                      mt-3
                      text-white/20
                    "
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
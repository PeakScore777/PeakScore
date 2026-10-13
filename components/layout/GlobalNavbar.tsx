
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sun,
  Upload,
  Users,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import PeakScoreMusicPlayer from "./PeakScoreMusicPlayer";
import type { GlobalTheme } from "./navbar-types";
import { supabase } from "@/lib/supabase/browser";

export type { GlobalTheme } from "./navbar-types";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  streak: number;
  coins: number;
  selectedCharacter: string | null;
  // Debe proceder de una comprobación confiable del servidor.
  isAdmin?: boolean;
};

type GlobalNavbarProps = {
  initialProfile?: ProfileData | null;
};

type DropdownName = "learn" | "community" | null;

type NavigationItem = {
  href: string;
  label: string;
  description: string;
};

const THEME_STORAGE_KEY = "peakscore-theme";
const CHARACTER_STORAGE_KEY = "peakscore-selected-character";

const CHARACTER_AVATARS: Record<string, string> = {
  "peaky-nova": "/avatars/photo_perfil/peaky-nova.png",
  "peaky-nox": "/avatars/photo_perfil/peaky-nox.png",
  zyra: "/avatars/photo_perfil/zyrap.png",
  orby: "/avatars/photo_perfil/orbyp.png",
};

const LEARN_ITEMS: NavigationItem[] = [
  {
    href: "/aprender",
    label: "Niveles",
    description: "Avanza por los mundos de PeakScore.",
  },
];

const COMMUNITY_ITEMS: NavigationItem[] = [
  {
    href: "/comunidad/ranking",
    label: "Ranking",
    description: "Consulta tu posición en la comunidad.",
  },
  {
    href: "/comunidad",
    label: "Comunidad",
    description: "Explora el espacio social de PeakScore.",
  },
];

function isGlobalTheme(value: unknown): value is GlobalTheme {
  return value === "light" || value === "dark";
}

/* ============================================================
   TEMA GLOBAL
   ============================================================ */

function subscribeTheme(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      callback();
    }
  };

  const handleThemeChange = (event: Event) => {
    const nextTheme = (event as CustomEvent<GlobalTheme>).detail;

    if (!isGlobalTheme(nextTheme)) return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // El tema también funciona durante esta sesión.
    }

    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    "peakscore-theme-change",
    handleThemeChange,
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      "peakscore-theme-change",
      handleThemeChange,
    );
  };
}

function getThemeSnapshot(): GlobalTheme {
  try {
    const savedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    );

    return isGlobalTheme(savedTheme) ? savedTheme : "dark";
  } catch {
    return "dark";
  }
}

function getServerThemeSnapshot(): GlobalTheme {
  return "dark";
}

function publishThemeChange(nextTheme: GlobalTheme) {
  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme,
    );
  } catch {
    // El tema también funciona durante esta sesión.
  }

  window.dispatchEvent(
    new CustomEvent<GlobalTheme>("peakscore-theme-change", {
      detail: nextTheme,
    }),
  );
}

/* ============================================================
   PERSONAJE SELECCIONADO
   ============================================================ */

function subscribeCharacter(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CHARACTER_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    "peakscore-selected-character-change",
    callback,
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      "peakscore-selected-character-change",
      callback,
    );
  };
}

function getCharacterSnapshot(): string | null {
  try {
    const character = window.localStorage.getItem(
      CHARACTER_STORAGE_KEY,
    );

    return character && CHARACTER_AVATARS[character]
      ? character
      : null;
  } catch {
    return null;
  }
}

function getServerCharacterSnapshot(): string | null {
  return null;
}

function publishCharacterChange(character: string) {
  try {
    window.localStorage.setItem(
      CHARACTER_STORAGE_KEY,
      character,
    );
  } catch {
    // El perfil del servidor sigue siendo la fuente principal.
  }

  window.dispatchEvent(
    new Event("peakscore-selected-character-change"),
  );
}

/* ============================================================
   UTILIDADES DE NAVEGACIÓN
   ============================================================ */

function isActivePath(pathname: string, href: string) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function GlobalNavbar({
  initialProfile = null,
}: GlobalNavbarProps) {
  const pathname = usePathname() ?? "/";
  const rootRef = useRef<HTMLElement | null>(null);

  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const cachedCharacter = useSyncExternalStore(
    subscribeCharacter,
    getCharacterSnapshot,
    getServerCharacterSnapshot,
  );

  const [profile, setProfile] = useState<ProfileData | null>(
    initialProfile,
  );

  const [openDropdown, setOpenDropdown] =
    useState<DropdownName>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const isDark = theme === "dark";

  const displayName =
    profile?.fullName?.trim() || "Estudiante";

  const email = profile?.email ?? "";

  const firstInitial =
    displayName.charAt(0).toUpperCase() || "E";

  const selectedCharacter = profile
    ? profile.selectedCharacter ?? cachedCharacter
    : null;

  const selectedCharacterAvatar = selectedCharacter
    ? CHARACTER_AVATARS[selectedCharacter] ?? null
    : null;

  /* ============================================================
     APLICAR TEMA AL DOCUMENTO
     ============================================================ */

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );
  }, [theme]);

  /* ============================================================
     CARGAR PERFIL MEDIANTE LA API EXISTENTE
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setProfile(null);
          return;
        }

        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!mounted || !data?.profile) return;

        const nextProfile: ProfileData = {
          id: data.profile.id,
          fullName: data.profile.fullName ?? null,
          email:
            data.profile.email ?? session.user.email ?? null,
          avatarUrl: data.profile.avatarUrl ?? null,
          streak: Number(data.profile.streak ?? 0),
          coins: Number(data.profile.coins ?? 0),
          selectedCharacter:
            data.profile.selectedCharacter ?? null,
          // Debe venir de una comprobación confiable del servidor.
          isAdmin: data.profile.isAdmin === true,
        };

        setProfile(nextProfile);

        const character = nextProfile.selectedCharacter;

        if (character && CHARACTER_AVATARS[character]) {
          publishCharacterChange(character);
        }
      } catch (error) {
        console.error(
          "[GlobalNavbar] Error cargando el perfil:",
          error,
        );
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     CERRAR MENÚS
     ============================================================ */

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        rootRef.current &&
        !rootRef.current.contains(target)
      ) {
        setOpenDropdown(null);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setOpenDropdown(null);
      setProfileOpen(false);
      setMobileOpen(false);
      setBugOpen(false);
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  /* ============================================================
     MODAL DE REPORTE DE BUG
     ============================================================ */

  useEffect(() => {
    if (!bugOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [bugOpen]);

  function closeMenus() {
    setOpenDropdown(null);
    setProfileOpen(false);
    setMobileOpen(false);
  }

  function toggleDropdown(
    name: Exclude<DropdownName, null>,
  ) {
    setProfileOpen(false);

    setOpenDropdown((current) =>
      current === name ? null : name,
    );
  }

  function handleThemeToggle() {
    publishThemeChange(
      theme === "dark" ? "light" : "dark",
    );
  }

  /* ============================================================
     NAVEGACIÓN A SIMULACROS
     ============================================================ */

  async function handleSimulations() {
    closeMenus();

    if (checkingAuth) return;

    setCheckingAuth(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "[GlobalNavbar] Error verificando sesión:",
          error,
        );

        window.location.href = "/login";
        return;
      }

      window.location.href = session?.user
        ? "/simulacros"
        : "/login";
    } catch (error) {
      console.error(
        "[GlobalNavbar] Error al abrir simulacros:",
        error,
      );

      window.location.href = "/login";
    } finally {
      setCheckingAuth(false);
    }
  }

  /* ============================================================
     CERRAR SESIÓN
     ============================================================ */

  async function handleLogout() {
    closeMenus();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "[GlobalNavbar] Error cerrando sesión:",
          error,
        );

        return;
      }

      setProfile(null);

      try {
        window.localStorage.removeItem(CHARACTER_STORAGE_KEY);
      } catch {
        // La sesión ya se cerró; el avatar no depende de esta caché.
      }

      window.dispatchEvent(
        new Event("peakscore-selected-character-change"),
      );

      window.location.href = "/login";
    } catch (error) {
      console.error(
        "[GlobalNavbar] Error inesperado al cerrar sesión:",
        error,
      );
    }
  }

  const baseNavClass =
    "flex h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[13px] font-extrabold transition-colors";

  const normalNavClass = isDark
    ? "text-white/75 hover:bg-white/[0.06] hover:text-white"
    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950";

  const activeNavClass = isDark
    ? "bg-violet-500/15 text-white"
    : "bg-violet-50 text-violet-800";

  return (
    <>
      <header
        ref={rootRef}
        className={`sticky top-0 z-[100] w-full border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-[#10101b]/95"
            : "border-slate-200 bg-white/95"
        }`}
      >
        <nav
          aria-label="Navegación principal"
          className="relative flex min-h-[72px] w-full items-center gap-2 px-3 sm:px-6 lg:px-8"
        >
          {/* LOGO */}
          <Link
            href="/"
            aria-label="PeakScore, inicio"
            onClick={closeMenus}
            className="group flex shrink-0 items-center gap-2"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Image
                src="/images/branding/peakscore-logo-transparente2.png"
                alt=""
                fill
                priority
                sizes="40px"
                className="object-contain"
              />
            </span>

            <span
              className={`text-[17px] font-black tracking-[-0.04em] transition-opacity group-hover:opacity-80 sm:text-[19px] ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              PeakScore
            </span>
          </Link>

          {/* NAVEGACIÓN CENTRAL */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <div className="flex items-center gap-0.5">
              {/* APRENDE */}
              <div
                className="relative after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
                onMouseEnter={() =>
                  setOpenDropdown("learn")
                }
                onMouseLeave={() => setOpenDropdown(null)}
                onFocus={() => setOpenDropdown("learn")}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("learn")}
                  aria-expanded={openDropdown === "learn"}
                  className={`${baseNavClass} ${normalNavClass}`}
                >
                  Aprende

                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-55 transition-transform ${
                      openDropdown === "learn"
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {openDropdown === "learn" && (
                  <DropdownPanel
                    dark={isDark}
                    items={LEARN_ITEMS}
                    onClose={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={() => void handleSimulations()}
                      disabled={checkingAuth}
                      className={`block w-full rounded-xl px-4 py-3 text-left transition ${
                        isDark
                          ? "hover:bg-white/[0.06]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`block text-[13px] font-black ${
                          isDark
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        Simulacros
                      </span>

                      <span
                        className={`mt-1 block text-[11px] leading-5 ${
                          isDark
                            ? "text-white/45"
                            : "text-slate-500"
                        }`}
                      >
                        Practica con preguntas tipo ICFES.
                      </span>
                    </button>
                  </DropdownPanel>
                )}
              </div>

              {/* PROGRESO */}
              <Link
                href="/progreso"
                onClick={closeMenus}
                className={`${baseNavClass} ${
                  isActivePath(pathname, "/progreso")
                    ? activeNavClass
                    : normalNavClass
                }`}
              >
                Progreso
              </Link>

              {/* RETOS */}
              <Link
                href="/retos"
                onClick={closeMenus}
                className={`${baseNavClass} ${
                  isActivePath(pathname, "/retos")
                    ? activeNavClass
                    : normalNavClass
                }`}
              >
                Retos
              </Link>

              {/* COMUNIDAD */}
              <div
                className="relative after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
                onMouseEnter={() =>
                  setOpenDropdown("community")
                }
                onMouseLeave={() => setOpenDropdown(null)}
                onFocus={() =>
                  setOpenDropdown("community")
                }
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("community")}
                  aria-expanded={
                    openDropdown === "community"
                  }
                  className={`${baseNavClass} ${normalNavClass}`}
                >
                  Comunidad

                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-55 transition-transform ${
                      openDropdown === "community"
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {openDropdown === "community" && (
                  <DropdownPanel
                    dark={isDark}
                    items={COMMUNITY_ITEMS}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>

              {/* PRECIOS */}
              <Link
                href="/precios"
                onClick={closeMenus}
                className={`${baseNavClass} font-black ${
                  isDark
                    ? "bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text text-transparent"
                }`}
              >
                Precios
              </Link>

              {/* BUG: justo al lado de PRECIOS */}
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  setBugOpen(true);
                }}
                className={`${baseNavClass} ${normalNavClass}`}
                aria-label="Reportar un bug"
                title="Reportar un bug"
              >
                Bug
              </button>
            </div>
          </div>

          {/* CONTROLES DEL LADO DERECHO */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* TEMA */}
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={
                isDark
                  ? "Cambiar a tema claro"
                  : "Cambiar a tema oscuro"
              }
              title={isDark ? "Tema claro" : "Tema oscuro"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-violet-200 hover:bg-white/[0.06] hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {isDark ? (
                <Moon className="h-[18px] w-[18px]" />
              ) : (
                <Sun className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* REPRODUCTOR GLOBAL */}
            <PeakScoreMusicPlayer
              theme={theme}
              isAuthenticated={Boolean(profile)}
            />

            {/* PERFIL */}
            <div className="relative">
              
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  setMobileOpen(false);
                  setProfileOpen((current) => !current);
                }}
                aria-label="Abrir menú de usuario"
                aria-expanded={profileOpen}
                className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition ${
                  isDark
                    ? "border-white/15 bg-white/[0.05] hover:border-violet-300/50"
                    : "border-slate-200 bg-slate-100 hover:border-violet-400"
                }`}
              >
                {selectedCharacterAvatar ? (
                  <Image
                    src={selectedCharacterAvatar}
                    alt={displayName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={displayName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className={`text-sm font-black ${
                      isDark
                        ? "text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {profile ? (
                      firstInitial
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </span>
                )}
              </button>

              {profileOpen && (
                <div
                  className={`absolute right-0 top-[50px] z-[170] w-[min(340px,calc(100vw-20px))] overflow-hidden rounded-2xl border shadow-2xl ${
                    isDark
                      ? "border-white/10 bg-[#11101f] shadow-black/50"
                      : "border-slate-200 bg-white shadow-slate-300/40"
                  }`}
                >
                  {/* CABECERA DEL PERFIL */}
                  <div
                    className={`flex items-center gap-3 border-b p-4 ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-200"
                    }`}
                  >
                    <div
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                        isDark
                          ? "bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-600"
                          : "bg-gradient-to-br from-cyan-100 via-blue-100 to-violet-100"
                      }`}
                    >
                      {selectedCharacterAvatar ? (
                        <Image
                          src={selectedCharacterAvatar}
                          alt={displayName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : profile?.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt={displayName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span
                          className={`font-black ${
                            isDark
                              ? "text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {firstInitial}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-black ${
                          isDark
                            ? "text-white"
                            : "text-slate-950"
                        }`}
                      >
                        {displayName}
                      </p>

                      <p
                        className={`mt-1 truncate text-[11px] ${
                          isDark
                            ? "text-white/45"
                            : "text-slate-500"
                        }`}
                      >
                        {email || "Tu espacio en PeakScore"}
                      </p>
                    </div>
                  </div>

                  {/* RACHA Y SALDO REAL */}
                  {profile && (
                    <div
                      className={`grid grid-cols-2 border-b ${
                        isDark
                          ? "border-white/10"
                          : "border-slate-200"
                      }`}
                    >
                      <div
                        className={`flex min-w-0 items-center gap-2 border-r px-3 py-3 ${
                          isDark
                            ? "border-white/10"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="relative h-9 w-9 shrink-0">
                          <Image
                            src="/dashboard/racha-pixel.webp"
                            alt="Racha"
                            fill
                            sizes="36px"
                            className="object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-black ${
                              isDark
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {profile.streak}
                          </p>

                          <p
                            className={`mt-0.5 text-[10px] ${
                              isDark
                                ? "text-white/45"
                                : "text-slate-500"
                            }`}
                          >
                            Días de racha
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 px-3 py-3">
                        <div className="relative h-9 w-9 shrink-0">
                          <Image
                            src="/images/currency/peakcoin.webp"
                            alt="PeakCoin"
                            fill
                            sizes="36px"
                            className="object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-black tabular-nums ${
                              isDark
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {profile.coins.toLocaleString("es-CO")}
                          </p>

                          <p
                            className={`mt-0.5 text-[10px] ${
                              isDark
                                ? "text-white/45"
                                : "text-slate-500"
                            }`}
                          >
                            PeakCoins
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPCIONES DEL PERFIL */}
                  <div className="space-y-1 p-2">
                    <ProfileMenuLink
                      href="/perfil"
                      label="Mi perfil"
                      icon={<UserRound className="h-4 w-4" />}
                      dark={isDark}
                      onClick={closeMenus}
                    />

                    <ProfileMenuLink
                      href="/cuaderno"
                      label="Mi cuaderno"
                      icon={<NotebookPen className="h-4 w-4" />}
                      dark={isDark}
                      onClick={closeMenus}
                    />

                    {/* Solo aparece si la API confirma el rol de administrador. */}
                    {profile?.isAdmin === true && (
                      <ProfileMenuLink
                        href="/dashboard/admin"
                        label="Panel de administración"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        dark={isDark}
                        onClick={closeMenus}
                      />
                    )}
                  </div>

                  {/* SESIÓN */}
                  <div
                    className={`border-t p-2 ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-200"
                    }`}
                  >
                    {profile ? (
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
                          isDark
                            ? "text-red-300 hover:bg-red-500/10"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={closeMenus}
                        className={`flex h-11 items-center rounded-xl px-3 text-sm font-bold ${
                          isDark
                            ? "text-white hover:bg-white/[0.05]"
                            : "text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        Iniciar sesión
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ MÓVIL */}
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setProfileOpen(false);
                setMobileOpen((current) => !current);
              }}
              aria-label={
                mobileOpen
                  ? "Cerrar navegación"
                  : "Abrir navegación"
              }
              aria-expanded={mobileOpen}
              className={`ml-1 flex h-10 w-10 items-center justify-center rounded-xl transition lg:hidden ${
                isDark
                  ? "text-white/80 hover:bg-white/[0.06]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        {/* NAVEGACIÓN MÓVIL */}
        {mobileOpen && (
          <div
            className={`border-t px-3 pb-4 pt-3 lg:hidden ${
              isDark
                ? "border-white/10 bg-[#10101b]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="space-y-1">
              <MobileNavLink
                href="/aprender"
                dark={isDark}
                active={isActivePath(pathname, "/aprender")}
                onClick={closeMenus}
              >
                Aprende · Niveles
              </MobileNavLink>

              <button
                type="button"
                onClick={() => void handleSimulations()}
                disabled={checkingAuth}
                className={`flex h-12 w-full items-center rounded-xl px-4 text-left text-sm font-extrabold transition ${
                  isDark
                    ? "text-white/85 hover:bg-white/[0.05]"
                    : "text-slate-800 hover:bg-slate-100"
                }`}
              >
                Simulacros
              </button>

              <MobileNavLink
                href="/progreso"
                dark={isDark}
                active={isActivePath(pathname, "/progreso")}
                onClick={closeMenus}
              >
                Progreso
              </MobileNavLink>

              <MobileNavLink
                href="/retos"
                dark={isDark}
                active={isActivePath(pathname, "/retos")}
                onClick={closeMenus}
              >
                Retos
              </MobileNavLink>

              <MobileNavLink
                href="/comunidad/ranking"
                dark={isDark}
                active={isActivePath(
                  pathname,
                  "/comunidad/ranking",
                )}
                onClick={closeMenus}
              >
                Comunidad · Ranking
              </MobileNavLink>

              <MobileNavLink
                href="/comunidad"
                dark={isDark}
                active={pathname === "/comunidad"}
                onClick={closeMenus}
              >
                Comunidad
              </MobileNavLink>

              <MobileNavLink
                href="/precios"
                dark={isDark}
                active={isActivePath(pathname, "/precios")}
                onClick={closeMenus}
                premium
              >
                Precios
              </MobileNavLink>

              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  setBugOpen(true);
                }}
                className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-extrabold transition ${
                  isDark
                    ? "text-white/70 hover:bg-white/[0.05]"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Bug className="h-4 w-4" />
                Reportar un bug
              </button>
            </div>
          </div>
        )}
      </header>

      {bugOpen && (
        <BugReportModal
          theme={theme}
          onClose={() => setBugOpen(false)}
        />
      )}
    </>
  );
}

function DropdownPanel({
  dark,
  items,
  onClose,
  children,
}: {
  dark: boolean;
  items: NavigationItem[];
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={`absolute left-1/2 top-[47px] z-[150] w-[290px] -translate-x-1/2 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
        dark
          ? "border-white/10 bg-[#11101f]/[98%] shadow-black/40"
          : "border-slate-200 bg-white/[98%] shadow-slate-300/40"
      }`}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={`block rounded-xl px-4 py-3 transition ${
            dark
              ? "hover:bg-white/[0.06]"
              : "hover:bg-slate-50"
          }`}
        >
          <span
            className={`block text-[13px] font-black ${
              dark ? "text-white" : "text-slate-900"
            }`}
          >
            {item.label}
          </span>

          <span
            className={`mt-1 block text-[11px] leading-5 ${
              dark ? "text-white/45" : "text-slate-500"
            }`}
          >
            {item.description}
          </span>
        </Link>
      ))}

      {children}
    </div>
  );
}

function ProfileMenuLink({
  href,
  label,
  icon,
  dark,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  dark: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
        dark
          ? "text-white/75 hover:bg-violet-500/10 hover:text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  dark,
  active,
  onClick,
  premium = false,
  children,
}: {
  href: string;
  dark: boolean;
  active: boolean;
  onClick: () => void;
  premium?: boolean;
  children: ReactNode;
}) {
  const classes = premium
    ? dark
      ? "bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent"
      : "bg-gradient-to-r from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text text-transparent"
    : active
      ? dark
        ? "bg-violet-500/15 text-white"
        : "bg-violet-50 text-violet-800"
      : dark
        ? "text-white/85 hover:bg-white/[0.05]"
        : "text-slate-800 hover:bg-slate-100";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex h-12 items-center rounded-xl px-4 text-sm font-extrabold transition ${classes}`}
    >
      {children}
    </Link>
  );
}

function BugReportModal({
  theme,
  onClose,
}: {
  theme: GlobalTheme;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Selecciona un archivo de imagen.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("La imagen debe pesar máximo 5 MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setScreenshot(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanDescription = description.trim();

    if (!cleanDescription || sending) return;

    setSending(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      formData.append("description", cleanDescription);
      formData.append("pageUrl", window.location.href);

      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ?? "No pudimos enviar el reporte.",
        );
      }

      setSubmitted(true);
      setDescription("");
      setScreenshot(null);
    } catch (error) {
      console.error("[BugReport] Error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos enviar el reporte. Inténtalo de nuevo.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-bug-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !sending) {
          onClose();
        }
      }}
    >
      <div
        className={`my-auto w-full max-w-[540px] overflow-hidden rounded-3xl border shadow-2xl ${
          isDark
            ? "border-violet-400/20 bg-[#0d0d20]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${
            isDark
              ? "border-white/10"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isDark
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-violet-50 text-violet-700"
              }`}
            >
              <Bug className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="global-bug-title"
                className={`text-base font-black ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }`}
              >
                Reportar un bug
              </h2>

              <p
                className={`mt-0.5 text-[11px] ${
                  isDark
                    ? "text-white/45"
                    : "text-slate-500"
                }`}
              >
                Ayúdanos a mejorar PeakScore.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Cerrar"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              isDark
                ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <Bug className="h-6 w-6" />
            </div>

            <h3
              className={`mt-4 text-lg font-black ${
                isDark
                  ? "text-white"
                  : "text-slate-950"
              }`}
            >
              Reporte enviado
            </h3>

            <p
              className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${
                isDark
                  ? "text-white/55"
                  : "text-slate-500"
              }`}
            >
              Tu reporte fue recibido correctamente. Gracias por
              ayudarnos a mejorar PeakScore.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-11 rounded-xl bg-violet-600 px-7 text-sm font-black text-white"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="global-bug-description"
                className={`block text-xs font-black ${
                  isDark
                    ? "text-white"
                    : "text-slate-800"
                }`}
              >
                Describe el problema
              </label>

              <textarea
                id="global-bug-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(0, 1000),
                  )
                }
                maxLength={1000}
                required
                rows={5}
                placeholder="¿Qué pasó y qué esperabas que pasara?"
                className={`mt-2 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none ${
                  isDark
                    ? "border-white/10 bg-[#07091c] text-white placeholder:text-white/30 focus:border-violet-400/60"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-500"
                }`}
              />

              <p
                className={`mt-1 text-right text-[10px] ${
                  isDark
                    ? "text-white/35"
                    : "text-slate-400"
                }`}
              >
                {description.length}/1000
              </p>
            </div>

            <div>
              <label
                htmlFor="global-bug-screenshot"
                className={`block text-xs font-black ${
                  isDark
                    ? "text-white"
                    : "text-slate-800"
                }`}
              >
                Captura de pantalla (opcional)
              </label>

              <label
                htmlFor="global-bug-screenshot"
                className={`mt-2 flex min-h-[105px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition ${
                  isDark
                    ? "border-white/15 bg-[#07091c]/70 hover:border-violet-400/50"
                    : "border-slate-300 bg-slate-50 hover:border-violet-500"
                }`}
              >
                <Upload
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-violet-300"
                      : "text-violet-700"
                  }`}
                />

                <span
                  className={`mt-2 text-xs font-bold ${
                    isDark
                      ? "text-white/75"
                      : "text-slate-700"
                  }`}
                >
                  {screenshot?.name ?? "Selecciona una imagen"}
                </span>

                <span
                  className={`mt-1 text-[10px] ${
                    isDark
                      ? "text-white/40"
                      : "text-slate-500"
                  }`}
                >
                  PNG, JPG o WEBP · máximo 5 MB
                </span>

                <input
                  id="global-bug-screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className={`text-xs ${
                  isDark
                    ? "text-red-300"
                    : "text-red-600"
                }`}
              >
                {errorMessage}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className={`h-11 flex-1 rounded-xl border text-sm font-black ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!description.trim() || sending}
                className="h-11 flex-[1.4] rounded-xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

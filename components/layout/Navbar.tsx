"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bug,
  ChevronDown,
  Moon,
  Sun,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { supabase } from "@/lib/supabase/browser";

export type GlobalTheme = "light" | "dark";

type NavbarProps = {
  theme: GlobalTheme;
  onThemeChange: (theme: GlobalTheme) => void;
};

type DropdownName = "learn" | "community" | null;

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  streak: number;
  coins: number;
  selectedCharacter: string | null;
};

const characterAvatars: Record<string, string> = {
  "peaky-nova": "/avatars/photo_perfil/peaky-nova.png",
  "peaky-nox": "/avatars/photo_perfil/peaky-nox.png",
  zyra: "/avatars/photo_perfil/zyrap.png",
  orby: "/avatars/photo_perfil/orbyp.png",
};

export default function Navbar({
  theme,
  onThemeChange,
}: NavbarProps) {
  const isDark = theme === "dark";

  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [cachedCharacter, setCachedCharacter] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(
        "peakscore-selected-character",
      );

      if (cached && characterAvatars[cached]) {
        setCachedCharacter(cached);
      }
    } catch {
      // La caché visual no es obligatoria.
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
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

        if (!response.ok) {
          setProfile(null);
          return;
        }

        const data = await response.json();

        if (!mounted || !data?.profile) return;

        const selectedCharacter =
          data.profile.selectedCharacter ?? null;

        setProfile({
          id: data.profile.id,
          fullName: data.profile.fullName ?? null,
          email: data.profile.email ?? session.user.email ?? null,
          avatarUrl: data.profile.avatarUrl ?? null,
          streak: Number(data.profile.streak ?? 0),
          coins: Number(data.profile.coins ?? 0),
          selectedCharacter,
        });

        if (selectedCharacter && characterAvatars[selectedCharacter]) {
          setCachedCharacter(selectedCharacter);

          try {
            window.localStorage.setItem(
              "peakscore-selected-character",
              selectedCharacter,
            );
          } catch {
            // Solo optimización visual; Supabase sigue siendo la fuente de verdad.
          }
        }
      } catch (error) {
        console.error("[Navbar] Error cargando perfil:", error);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setOpenDropdown(null);
      setProfileOpen(false);
      setMobileOpen(false);
      setBugOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (navRef.current && !navRef.current.contains(target)) {
        setOpenDropdown(null);
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = bugOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [bugOpen]);

  const displayName = useMemo(
    () => profile?.fullName?.trim() || "Estudiante",
    [profile?.fullName],
  );

  const email = profile?.email ?? "";

  const firstInitial = useMemo(
    () => displayName.charAt(0).toUpperCase() || "E",
    [displayName],
  );

  const selectedCharacter = profile?.selectedCharacter ?? cachedCharacter;

  const selectedCharacterAvatar = useMemo(() => {
    return selectedCharacter
      ? characterAvatars[selectedCharacter] ?? null
      : null;
  }, [selectedCharacter]);

  const closeMenus = () => {
    setOpenDropdown(null);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const toggleDropdown = (
    name: Exclude<DropdownName, null>,
  ) => {
    setProfileOpen(false);
    setOpenDropdown((current) => (current === name ? null : name));
  };

  const handleThemeChange = (nextTheme: GlobalTheme) => {
    if (nextTheme === theme) return;
    onThemeChange(nextTheme);
  };

  const handleSimulations = async () => {
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
          "[Navbar] Error verificando sesión:",
          error,
        );
        window.location.href = "/login";
        return;
      }

      window.location.href = session?.user
        ? "/dashboard/simulacros/new"
        : "/login";
    } catch (error) {
      console.error("[Navbar] Error inesperado:", error);
      window.location.href = "/login";
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    closeMenus();

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[Navbar] Error cerrando sesión:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  const openBugReport = () => {
    closeMenus();
    setBugOpen(true);
  };

  return (
    <>
      <header
        className={
          isDark
            ? "sticky top-0 z-[100] w-full border-b border-white/10 bg-[#10101b]/95 backdrop-blur-xl"
            : "sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl"
        }
      >
        <nav
          className="relative flex min-h-[72px] w-full items-center px-5 sm:px-7 lg:px-9 xl:px-10 2xl:px-12"
          aria-label="Navegación principal"
        >
          {/* LOGO IZQUIERDA */}

          <Link
            href="/"
            aria-label="PeakScore inicio"
            onClick={closeMenus}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span
              className={
                isDark
                  ? "relative flex h-11 w-11 items-center justify-center drop-shadow-[0_4px_18px_rgba(81,93,255,0.24)]"
                  : "relative flex h-11 w-11 items-center justify-center drop-shadow-[0_4px_18px_rgba(56,189,248,0.16)]"
              }
            >
              <Image
                src="/images/branding/peakscore-logo-transparente2.png"
                alt=""
                fill
                priority
                sizes="44px"
                className="object-contain"
              />
            </span>

            <span
              className={
                isDark
                  ? "text-[19px] font-black tracking-[-0.03em] text-white transition-opacity group-hover:opacity-85"
                  : "text-[19px] font-black tracking-[-0.03em] text-slate-950 transition-opacity group-hover:opacity-80"
              }
            >
              PeakScore
            </span>
          </Link>

          {/* NAVEGACIÓN CENTRAL EXACTAMENTE CENTRADA */}

          <div
            ref={navRef}
            className="
              absolute
              left-1/2
              top-1/2
              hidden
              -translate-x-1/2
              -translate-y-1/2
              lg:block
            "
          >
            <div className="flex items-center gap-0.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("learn")}
                  aria-expanded={openDropdown === "learn"}
                  className={
                    isDark
                      ? "flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.05] hover:text-white"
                      : "flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  }
                >
                  Aprender

                  <ChevronDown
                    className={
                      openDropdown === "learn"
                        ? "h-3.5 w-3.5 rotate-180 opacity-55 transition-transform"
                        : "h-3.5 w-3.5 opacity-55 transition-transform"
                    }
                  />
                </button>

                {openDropdown === "learn" && (
                  <LearnDropdown
                    theme={theme}
                    onClose={() => setOpenDropdown(null)}
                    onSimulations={handleSimulations}
                  />
                )}
              </div>

              <Link
                href="/progreso"
                onClick={closeMenus}
                className={
                  isDark
                    ? "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.05] hover:text-white"
                    : "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                }
              >
                Progreso
              </Link>

              <Link
                href="/retos"
                onClick={closeMenus}
                className={
                  isDark
                    ? "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.05] hover:text-white"
                    : "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                }
              >
                Retos
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("community")}
                  aria-expanded={openDropdown === "community"}
                  className={
                    isDark
                      ? "flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.05] hover:text-white"
                      : "flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  }
                >
                  Comunidad

                  <ChevronDown
                    className={
                      openDropdown === "community"
                        ? "h-3.5 w-3.5 rotate-180 opacity-55 transition-transform"
                        : "h-3.5 w-3.5 opacity-55 transition-transform"
                    }
                  />
                </button>

                {openDropdown === "community" && (
                  <CommunityDropdown
                    theme={theme}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>

              {/* PRECIOS CENTRADO CON EL RESTO */}

              <Link
                href="/precios"
                onClick={closeMenus}
                className="
                  group
                  relative
                  flex
                  h-11
                  items-center
                  overflow-hidden
                  rounded-xl
                  px-4
                  text-[13px]
                  font-black
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -inset-y-3
                    left-0
                    w-5
                    translate-x-[-180%]
                    rotate-[16deg]
                    bg-white/70
                    opacity-0
                    blur-[6px]
                    transition-all
                    duration-[1100ms]
                    ease-out
                    group-hover:translate-x-[620%]
                    group-hover:opacity-100
                  "
                />

                <span
                  className={
                    isDark
                      ? "relative z-10 bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent transition-all duration-200 group-hover:brightness-125"
                      : "relative z-10 bg-gradient-to-r from-emerald-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent transition-all duration-200 group-hover:brightness-125"
                  }
                >
                  Precios
                </span>
              </Link>

              {/* BUG */}

              <button
                type="button"
                onClick={openBugReport}
                className={
                  isDark
                    ? "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                    : "flex h-11 items-center rounded-xl px-4 text-[13px] font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                Bug
              </button>
            </div>
          </div>

          {/* DERECHA: TEMA + NOTIFICACIONES + PERFIL */}

          <div
            ref={profileRef}
            className="ml-auto flex shrink-0 items-center gap-1.5"
          >
            {/* TEMA: UN SOLO BOTÓN */}

            <button
              type="button"
              onClick={() =>
                handleThemeChange(
                  isDark ? "light" : "dark",
                )
              }
              aria-label={
                isDark
                  ? "Cambiar a tema claro"
                  : "Cambiar a tema oscuro"
              }
              title={
                isDark
                  ? "Tema oscuro · cambiar a claro"
                  : "Tema claro · cambiar a oscuro"
              }
              className={
                isDark
                  ? "flex h-11 w-11 items-center justify-center rounded-xl text-violet-200 transition hover:bg-white/[0.05] hover:text-white"
                  : "flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              }
            >
              {isDark ? (
                <Moon className="h-[18px] w-[18px]" />
              ) : (
                <Sun className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* NOTIFICACIONES */}

            <button
              type="button"
              aria-label="Notificaciones"
              className={
                isDark
                  ? "relative flex h-11 w-11 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                  : "relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              }
            >
              <Bell className="h-[18px] w-[18px]" />

              <span
                className="
                  absolute
                  right-2.5
                  top-2
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-red-500
                  shadow-[0_0_8px_rgba(239,68,68,0.7)]
                "
              />
            </button>

            {/* PERFIL */}

            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setProfileOpen((current) => !current);
              }}
              aria-label="Abrir menú de usuario"
              aria-expanded={profileOpen}
              className="
                group
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                overflow-hidden
                rounded-full
              "
            >
              {selectedCharacterAvatar ? (
                <Image
                  src={selectedCharacterAvatar}
                  alt={displayName}
                  fill
                  sizes="44px"
                  className="object-cover object-center transition-transform duration-200 group-hover:scale-105"
                />
              ) : profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={displayName}
                  fill
                  sizes="44px"
                  className="object-cover object-center"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="
                    flex
                    h-full
                    w-full
                    animate-pulse
                    items-center
                    justify-center
                    bg-gradient-to-br
                    from-slate-700
                    via-slate-800
                    to-slate-950
                  "
                />
              )}

              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
            </button>

            {profileOpen && (
              <UserMenu
                theme={theme}
                profile={profile}
                displayName={displayName}
                email={email}
                firstInitial={firstInitial}
                selectedCharacterAvatar={selectedCharacterAvatar}
                onClose={() => setProfileOpen(false)}
                onLogout={handleLogout}
              />
            )}
          </div>

          {/* MOBILE */}

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Abrir navegación"
            aria-expanded={mobileOpen}
            className={
              isDark
                ? "ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-white/75 hover:bg-white/[0.05] lg:hidden"
                : "ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            }
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <span className="text-xl leading-none">☰</span>
            )}
          </button>
        </nav>

        {/* MOBILE MENU */}

        {mobileOpen && (
          <div
            className={
              isDark
                ? "border-t border-white/10 bg-[#10101b] px-4 pb-4 pt-3 lg:hidden"
                : "border-t border-slate-200 bg-white px-4 pb-4 pt-3 lg:hidden"
            }
          >
            <div className="space-y-1">
              <MobileDropdownTrigger
                label="Aprender"
                open={openDropdown === "learn"}
                theme={theme}
                onClick={() => toggleDropdown("learn")}
              />

              {openDropdown === "learn" && (
                <div className="space-y-1 px-2">
                  <MobileLink
                    href="/aprender"
                    theme={theme}
                    onClick={closeMenus}
                  >
                    Niveles
                  </MobileLink>

                  <button
                    type="button"
                    onClick={handleSimulations}
                    className={
                      isDark
                        ? "flex h-11 w-full items-center rounded-lg px-3 text-left text-sm font-bold text-white/60 hover:bg-white/[0.04] hover:text-white"
                        : "flex h-11 w-full items-center rounded-lg px-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  >
                    Simulacros
                  </button>
                </div>
              )}

              <MobileLink
                href="/progreso"
                theme={theme}
                onClick={closeMenus}
              >
                Progreso
              </MobileLink>

              <MobileLink
                href="/retos"
                theme={theme}
                onClick={closeMenus}
              >
                Retos
              </MobileLink>

              <MobileDropdownTrigger
                label="Comunidad"
                open={openDropdown === "community"}
                theme={theme}
                onClick={() => toggleDropdown("community")}
              />

              {openDropdown === "community" && (
                <div className="space-y-1 px-2">
                  <MobileLink
                    href="/comunidad/ranking"
                    theme={theme}
                    onClick={closeMenus}
                  >
                    Ranking
                  </MobileLink>

                  <MobileLink
                    href="/comunidad"
                    theme={theme}
                    onClick={closeMenus}
                  >
                    Comunidad
                  </MobileLink>
                </div>
              )}

              <div
                className={
                  isDark
                    ? "my-2 h-px bg-white/10"
                    : "my-2 h-px bg-slate-200"
                }
              />

              <MobileLink
                href="/precios"
                theme={theme}
                onClick={closeMenus}
                premium
              >
                Precios
              </MobileLink>

              <button
                type="button"
                onClick={openBugReport}
                className={
                  isDark
                    ? "flex h-12 w-full items-center rounded-xl px-4 text-sm font-black text-white/65 hover:bg-white/[0.05] hover:text-white"
                    : "flex h-12 w-full items-center rounded-xl px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                }
              >
                Bug
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

/* ============================================================
   MOBILE DROPDOWN TRIGGER
============================================================ */

function MobileDropdownTrigger({
  label,
  open,
  theme,
  onClick,
}: {
  label: string;
  open: boolean;
  theme: GlobalTheme;
  onClick: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={
        isDark
          ? "flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-black text-white/85 hover:bg-white/[0.05]"
          : "flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-100"
      }
    >
      {label}

      <ChevronDown
        className={
          open
            ? "h-4 w-4 rotate-180 opacity-50 transition-transform"
            : "h-4 w-4 opacity-50 transition-transform"
        }
      />
    </button>
  );
}

/* ============================================================
   MOBILE LINK
============================================================ */

function MobileLink({
  href,
  theme,
  onClick,
  premium = false,
  compact = false,
  children,
}: {
  href: string;
  theme: GlobalTheme;
  onClick: () => void;
  premium?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const isDark = theme === "dark";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        premium
          ? isDark
            ? "flex h-12 items-center rounded-xl bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-300 bg-clip-text px-4 text-sm font-black text-transparent"
            : "flex h-12 items-center rounded-xl bg-gradient-to-r from-emerald-600 via-cyan-500 to-violet-500 bg-clip-text px-4 text-sm font-black text-transparent"
          : compact
            ? isDark
              ? "flex h-11 items-center rounded-lg px-3 text-sm font-bold text-white/60 hover:bg-white/[0.04] hover:text-white"
              : "flex h-11 items-center rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            : isDark
              ? "flex h-12 items-center rounded-xl px-4 text-sm font-black text-white/85 hover:bg-white/[0.05]"
              : "flex h-12 items-center rounded-xl px-4 text-sm font-black text-slate-800 hover:bg-slate-100"
      }
    >
      {children}
    </Link>
  );
}

/* ============================================================
   DROPDOWN APRENDER
============================================================ */

function LearnDropdown({
  theme,
  onClose,
  onSimulations,
}: {
  theme: GlobalTheme;
  onClose: () => void;
  onSimulations: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[52px]
        z-[140]
        w-[270px]
        -translate-x-1/2
        overflow-hidden
        rounded-2xl
        border
        p-2
        shadow-2xl
        backdrop-blur-xl
        ${
          isDark
            ? "border-white/10 bg-[#10101d]/98 shadow-black/40"
            : "border-slate-200 bg-white/98 shadow-slate-300/40"
        }
      `}
    >
      <Link
        href="/aprender"
        onClick={onClose}
        className={`
          block
          rounded-xl
          px-4
          py-3.5
          transition-colors
          ${
            isDark
              ? "hover:bg-white/[0.05]"
              : "hover:bg-slate-50"
          }
        `}
      >
        <p
          className={`
            text-[13px]
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          Niveles
        </p>

        <p
          className={`
            mt-1
            text-[11px]
            leading-5
            ${
              isDark
                ? "text-white/40"
                : "text-slate-500"
            }
          `}
        >
          Avanza por los mundos de PeakScore.
        </p>
      </Link>

      <button
        type="button"
        onClick={onSimulations}
        className={`
          block
          w-full
          rounded-xl
          px-4
          py-3.5
          text-left
          transition-colors
          ${
            isDark
              ? "hover:bg-white/[0.05]"
              : "hover:bg-slate-50"
          }
        `}
      >
        <p
          className={`
            text-[13px]
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          Simulacros
        </p>

        <p
          className={`
            mt-1
            text-[11px]
            leading-5
            ${
              isDark
                ? "text-white/40"
                : "text-slate-500"
            }
          `}
        >
          Practica con simulacros tipo ICFES.
        </p>
      </button>
    </div>
  );
}

/* ============================================================
   DROPDOWN COMUNIDAD
============================================================ */

function CommunityDropdown({
  theme,
  onClose,
}: {
  theme: GlobalTheme;
  onClose: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[52px]
        z-[140]
        w-[270px]
        -translate-x-1/2
        overflow-hidden
        rounded-2xl
        border
        p-2
        shadow-2xl
        backdrop-blur-xl
        ${
          isDark
            ? "border-white/10 bg-[#10101d]/98 shadow-black/40"
            : "border-slate-200 bg-white/98 shadow-slate-300/40"
        }
      `}
    >
      <Link
        href="/comunidad/ranking"
        onClick={onClose}
        className={`
          block
          rounded-xl
          px-4
          py-3.5
          transition-colors
          ${
            isDark
              ? "hover:bg-white/[0.05]"
              : "hover:bg-slate-50"
          }
        `}
      >
        <p
          className={`
            text-[13px]
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          Ranking
        </p>

        <p
          className={`
            mt-1
            text-[11px]
            leading-5
            ${
              isDark
                ? "text-white/40"
                : "text-slate-500"
            }
          `}
        >
          Compite y mira tu posición.
        </p>
      </Link>

      <Link
        href="/comunidad"
        onClick={onClose}
        className={`
          block
          rounded-xl
          px-4
          py-3.5
          transition-colors
          ${
            isDark
              ? "hover:bg-white/[0.05]"
              : "hover:bg-slate-50"
          }
        `}
      >
        <p
          className={`
            text-[13px]
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          Comunidad
        </p>

        <p
          className={`
            mt-1
            text-[11px]
            leading-5
            ${
              isDark
                ? "text-white/40"
                : "text-slate-500"
            }
          `}
        >
          Espacio social de PeakScore.
        </p>
      </Link>
    </div>
  );
}

/* ============================================================
   TOKEN DE MONEDAS PEAKSCORE
============================================================ */

function PeakCoin({
  value,
  theme,
}: {
  value: number;
  theme: GlobalTheme;
}) {
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <div
        className="
          relative
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          border-2
          border-cyan-200/80
          bg-gradient-to-br
          from-cyan-300
          via-sky-400
          to-violet-500
          shadow-[0_0_12px_rgba(56,189,248,0.35)]
        "
      >
        <div
          className="
            absolute
            inset-[3px]
            rounded-full
            border
            border-white/50
          "
        />

        <span className="relative z-10 text-[9px] font-black text-white drop-shadow">
          P
        </span>
      </div>

      <div>
        <p
          className={`
            text-[13px]
            font-black
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          {value.toLocaleString("es-CO")}
        </p>

        <p
          className={`
            text-[10px]
            ${
              isDark
                ? "text-white/35"
                : "text-slate-400"
            }
          `}
        >
          monedas
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MENÚ DE USUARIO
============================================================ */

function UserMenu({
  theme,
  profile,
  displayName,
  email,
  firstInitial,
  selectedCharacterAvatar,
  onClose,
  onLogout,
}: {
  theme: GlobalTheme;
  profile: ProfileData | null;
  displayName: string;
  email: string;
  firstInitial: string;
  selectedCharacterAvatar: string | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`
        absolute
        right-0
        top-[59px]
        z-[160]
        w-[332px]
        overflow-hidden
        rounded-2xl
        border
        shadow-2xl
        backdrop-blur-xl
        ${
          isDark
            ? "border-white/10 bg-[#11101f]/98 shadow-black/50"
            : "border-slate-200 bg-white/98 shadow-slate-300/40"
        }
      `}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className={`
          flex
          items-center
          gap-3
          border-b
          px-4
          py-4
          ${
            isDark
              ? "border-white/10"
              : "border-slate-200"
          }
        `}
      >
        <div
          className="
            relative
            h-12
            w-12
            shrink-0
            overflow-hidden
            rounded-xl
            bg-gradient-to-br
            from-cyan-500
            via-blue-500
            to-violet-600
          "
        >
          {selectedCharacterAvatar ? (
            <Image
              src={
                selectedCharacterAvatar
              }
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
              aria-hidden="true"
              className="
                flex
                h-full
                w-full
                animate-pulse
                items-center
                justify-center
                bg-gradient-to-br
                from-slate-700
                via-slate-800
                to-slate-950
              "
            />
          )}
        </div>

        <div className="min-w-0">
          <p
            className={`
              truncate
              text-sm
              font-black
              ${
                isDark
                  ? "text-white"
                  : "text-slate-950"
              }
            `}
          >
            {displayName}
          </p>

          <p
            className={`
              mt-0.5
              truncate
              text-[10px]
              ${
                isDark
                  ? "text-white/40"
                  : "text-slate-500"
              }
            `}
          >
            {email}
          </p>
        </div>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div
        className={`
          grid
          grid-cols-2
          border-b
          ${
            isDark
              ? "border-white/10"
              : "border-slate-200"
          }
        `}
      >
        {/* RACHA */}

        <div
          className={`
            flex
            items-center
            gap-2
            px-4
            py-3.5
            ${
              isDark
                ? "border-r border-white/10"
                : "border-r border-slate-200"
            }
          `}
        >
          <div
            className="
              relative
              h-8
              w-8
              shrink-0
            "
          >
            <Image
              src="/dashboard/racha-pixel.webp"
              alt=""
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>

          <div>
            <p
              className={`
                text-sm
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }
              `}
            >
              {profile?.streak ?? 0}
            </p>

            <p
              className={`
                text-[9px]
                ${
                  isDark
                    ? "text-white/35"
                    : "text-slate-400"
                }
              `}
            >
              días de racha
            </p>
          </div>
        </div>

        {/* MONEDAS */}

        <div className="px-4 py-3.5">
          <PeakCoin
            value={
              profile?.coins ?? 0
            }
            theme={theme}
          />
        </div>
      </div>

      {/* ======================================================
          OPCIONES
      ====================================================== */}

      <div className="p-2">
        <Link
          href="/perfil"
          onClick={onClose}
          className={`
            flex
            h-11
            items-center
            rounded-xl
            px-4
            text-sm
            font-black
            transition-colors
            ${
              isDark
                ? "text-white/75 hover:bg-violet-500/10 hover:text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }
          `}
        >
          Perfil
        </Link>

        <Link
          href="/cuaderno"
          onClick={onClose}
          className={`
            flex
            h-11
            items-center
            rounded-xl
            px-4
            text-sm
            font-black
            transition-colors
            ${
              isDark
                ? "text-white/75 hover:bg-violet-500/10 hover:text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }
          `}
        >
          Mi cuaderno
        </Link>
      </div>

      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <div
        className={`
          mx-2
          h-px
          ${
            isDark
              ? "bg-white/10"
              : "bg-slate-200"
          }
        `}
      />

      <div className="p-2">
        <button
          type="button"
          onClick={onLogout}
          className={`
            flex
            h-11
            w-full
            items-center
            rounded-xl
            px-4
            text-left
            text-sm
            font-black
            transition-colors
            ${
              isDark
                ? "text-red-300 hover:bg-red-500/10"
                : "text-red-600 hover:bg-red-50"
            }
          `}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL BUG
============================================================ */

type BugReportModalProps = {
  theme: GlobalTheme;
  onClose: () => void;
};

function BugReportModal({
  theme,
  onClose,
}: BugReportModalProps) {
  const isDark = theme === "dark";

  const [description, setDescription] =
    useState("");

  const [screenshot, setScreenshot] =
    useState<File | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  /* ==========================================================
     FILE
  ========================================================== */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setScreenshot(file);
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanDescription =
      description.trim();

    if (!cleanDescription) return;

    setSending(true);

    try {
      const formData = new FormData();

      formData.append(
        "description",
        cleanDescription,
      );

      formData.append(
        "pageUrl",
        window.location.href,
      );

      if (screenshot) {
        formData.append(
          "screenshot",
          screenshot,
        );
      }

      const response = await fetch(
        "/api/bug-reports",
        {
          method: "POST",
          body: formData,
        },
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ??
            "No pudimos enviar el reporte.",
        );
      }

      setSubmitted(true);
      setDescription("");
      setScreenshot(null);
    } catch (error) {
      console.error(
        "[BugReport] Error:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "No pudimos enviar el reporte.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[300]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-black/70
        p-4
        backdrop-blur-md
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
    >
      <div
        className={`
          relative
          my-auto
          w-full
          max-w-[560px]
          overflow-hidden
          rounded-3xl
          border
          shadow-2xl
          ${
            isDark
              ? "border-violet-400/20 bg-[#0b0d25]"
              : "border-slate-200 bg-white"
          }
        `}
      >
        {/* HEADER */}

        <div
          className={`
            flex
            items-center
            justify-between
            border-b
            px-5
            py-4
            sm:px-6
            ${
              isDark
                ? "border-white/10"
                : "border-slate-200"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                ${
                  isDark
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-lime-100 text-emerald-700"
                }
              `}
            >
              <Bug className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="bug-report-title"
                className={`
                  text-base
                  font-black
                  ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }
                `}
              >
                Reportar un Bug
              </h2>

              <p
                className={`
                  mt-0.5
                  text-[11px]
                  ${
                    isDark
                      ? "text-white/50"
                      : "text-slate-500"
                  }
                `}
              >
                Ayúdanos a mejorar PeakScore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reporte"
            className={`
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              ${
                isDark
                  ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }
            `}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENIDO */}

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div
              className={`
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                ${
                  isDark
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-lime-100 text-emerald-700"
                }
              `}
            >
              <Bug className="h-6 w-6" />
            </div>

            <h3
              className={`
                mt-5
                text-lg
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }
              `}
            >
              Reporte enviado
            </h3>

            <p
              className={`
                mx-auto
                mt-2
                max-w-sm
                text-sm
                leading-6
                ${
                  isDark
                    ? "text-white/55"
                    : "text-slate-500"
                }
              `}
            >
              Tu reporte fue recibido correctamente.
              Gracias por ayudarnos a mejorar PeakScore.
            </p>

            <button
              type="button"
              onClick={onClose}
              className={`
                mt-7
                h-11
                rounded-xl
                px-7
                text-sm
                font-black
                ${
                  isDark
                    ? "bg-violet-600 text-white"
                    : "bg-lime-400 text-slate-950"
                }
              `}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-5 py-5 sm:px-6"
          >
            {/* DESCRIPCIÓN */}

            <label
              htmlFor="bug-description"
              className={`
                block
                text-xs
                font-black
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-800"
                }
              `}
            >
              Describe el problema
            </label>

            <div className="relative mt-2">
              <textarea
                id="bug-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(
                      0,
                      1000,
                    ),
                  )
                }
                maxLength={1000}
                required
                rows={5}
                placeholder="Describe qué pasó y qué esperabas que pasara..."
                className={`
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  px-4
                  py-3
                  text-sm
                  outline-none
                  ${
                    isDark
                      ? "border-white/10 bg-[#07091c] text-white placeholder:text-white/30 focus:border-violet-400/60"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-lime-500"
                  }
                `}
              />

              <span
                className={`
                  absolute
                  bottom-3
                  right-3
                  text-[10px]
                  ${
                    isDark
                      ? "text-white/35"
                      : "text-slate-400"
                  }
                `}
              >
                {description.length}/1000
              </span>
            </div>

            {/* SCREENSHOT */}

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label
                  className={`
                    text-xs
                    font-black
                    ${
                      isDark
                        ? "text-white"
                        : "text-slate-800"
                    }
                  `}
                >
                  Captura de pantalla
                </label>

                <span
                  className={`
                    text-[10px]
                    ${
                      isDark
                        ? "text-white/40"
                        : "text-slate-400"
                    }
                  `}
                >
                  Opcional
                </span>
              </div>

              <label
                htmlFor="bug-screenshot"
                className={`
                  mt-2
                  flex
                  min-h-[125px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  px-5
                  py-5
                  text-center
                  ${
                    isDark
                      ? "border-white/15 bg-[#07091c]/70 hover:border-violet-400/50 hover:bg-violet-500/5"
                      : "border-slate-300 bg-slate-50 hover:border-lime-500 hover:bg-lime-50"
                  }
                `}
              >
                <Upload
                  className={`
                    h-6
                    w-6
                    ${
                      isDark
                        ? "text-violet-300"
                        : "text-emerald-600"
                    }
                  `}
                />

                <span
                  className={`
                    mt-2
                    text-xs
                    font-bold
                    ${
                      isDark
                        ? "text-white/75"
                        : "text-slate-700"
                    }
                  `}
                >
                  {screenshot
                    ? screenshot.name
                    : "Haz clic para subir una imagen"}
                </span>

                <span
                  className={`
                    mt-1
                    text-[10px]
                    ${
                      isDark
                        ? "text-white/35"
                        : "text-slate-400"
                    }
                  `}
                >
                  PNG, JPG o WEBP · máximo 5 MB
                </span>

                <input
                  id="bug-screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {/* ACCIONES */}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className={`
                  flex
                  h-12
                  flex-1
                  items-center
                  justify-center
                  rounded-xl
                  border
                  text-sm
                  font-black
                  ${
                    isDark
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  !description.trim() ||
                  sending
                }
                className={`
                  flex
                  h-12
                  flex-[1.4]
                  items-center
                  justify-center
                  rounded-xl
                  text-sm
                  font-black
                  transition-all
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  ${
                    isDark
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                      : "bg-lime-400 text-slate-950"
                  }
                `}
              >
                {sending
                  ? "Enviando..."
                  : "Enviar Reporte"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
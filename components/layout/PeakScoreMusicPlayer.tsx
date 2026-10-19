"use client";

import {
  Check,
  ChevronDown,
  Music2,
  Pause,
  Play,
  VolumeX,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { GlobalTheme } from "./navbar-types";

type MusicMode = "auto" | "study" | "classic" | "off";
type TrackId = "pixel" | "study" | "classic";

type TrackOption = {
  id: MusicMode;
  label: string;
  description: string;
};

type MusicPlayerProps = {
  theme: GlobalTheme;
  isAuthenticated: boolean;
};

const MUSIC_STORAGE_KEY = "peakscore-music-mode";

const TRACKS: Record<
  TrackId,
  { src: string; duration: string }
> = {
  pixel: {
    src: "/audio/pixel-gaming-beat.mp3",
    duration: "1:00",
  },
  study: {
    src: "/audio/level-up.mp3",
    duration: "2:00",
  },
  classic: {
    src: "/audio/run-it-back.mp3",
    duration: "2:00",
  },
};

const TRACK_OPTIONS: TrackOption[] = [
  {
    id: "auto",
    label: "Automático",
    description: "PeakScore elige el ambiente según la sección.",
  },
  {
    id: "study",
    label: "Level Up",
    description: "Alternative soul · Indie funk · Voz femenina",
  },
  {
    id: "classic",
    label: "Run It Back",
    description: "Hip-hop · Voz masculina",
  },
  {
    id: "off",
    label: "Desactivada",
    description: "Silenciar la música.",
  },
];

function isMusicMode(value: unknown): value is MusicMode {
  return (
    value === "auto" ||
    value === "study" ||
    value === "classic" ||
    value === "off"
  );
}

/**
 * Suscribe el componente a cambios de la preferencia musical.
 * También detecta cambios de localStorage desde otras pestañas.
 */
function subscribeMusicMode(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === MUSIC_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    "peakscore-music-mode-change",
    callback,
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      "peakscore-music-mode-change",
      callback,
    );
  };
}

function getMusicModeSnapshot(): MusicMode {
  try {
    const savedMode = window.localStorage.getItem(
      MUSIC_STORAGE_KEY,
    );

    return isMusicMode(savedMode) ? savedMode : "auto";
  } catch {
    return "auto";
  }
}

function getServerMusicModeSnapshot(): MusicMode {
  return "auto";
}

/**
 * Guarda la preferencia y notifica al reproductor.
 * Evita actualizar el estado desde un efecto de React.
 */
function saveMusicMode(nextMode: MusicMode) {
  try {
    window.localStorage.setItem(
      MUSIC_STORAGE_KEY,
      nextMode,
    );
  } catch {
    // La selección continúa disponible durante esta sesión.
  }

  window.dispatchEvent(
    new Event("peakscore-music-mode-change"),
  );
}

function matchesPath(
  pathname: string,
  prefixes: string[],
): boolean {
  return prefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`),
  );
}

function getAutomaticTrack(pathname: string): TrackId {
  // Los simulacros utilizan el hip-hop masculino.
  if (
    matchesPath(pathname, [
      "/simulacros",
      "/dashboard/simulacros",
    ])
  ) {
    return "classic";
  }

  // Los niveles utilizan Level Up.
  if (
    matchesPath(pathname, [
      "/aprender",
      "/niveles",
      "/dashboard/aprender",
      "/dashboard/niveles",
    ])
  ) {
    return "study";
  }

  // Mantener una selección automática para otras secciones.
  if (
    matchesPath(pathname, [
      "/perfil",
      "/progreso",
      "/retos",
      "/cuaderno",
    ]) ||
    pathname === "/dashboard"
  ) {
    return "classic";
  }

  return "study";
}

export default function PeakScoreMusicPlayer({
  theme,
  isAuthenticated,
}: MusicPlayerProps) {
  const pathname = usePathname() ?? "/";
  const isDark = theme === "dark";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mode = useSyncExternalStore(
    subscribeMusicMode,
    getMusicModeSnapshot,
    getServerMusicModeSnapshot,
  );

  const [enabled, setEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLandingPath = pathname === "/";

  const isSimulationPath = matchesPath(pathname, [
    "/simulacros",
    "/dashboard/simulacros",
  ]);

  const isLevelsPath = matchesPath(pathname, [
    "/aprender",
    "/niveles",
    "/dashboard/aprender",
    "/dashboard/niveles",
  ]);

  const requiresAutomaticMusic =
    isLandingPath || isSimulationPath || isLevelsPath;

  // Solo usuarios autenticados pueden cambiar la pista.
  // La landing, los niveles y los simulacros no muestran controles.
  const canChooseMusic =
    isAuthenticated && !requiresAutomaticMusic;

  const selectedTrack = useMemo<TrackId>(() => {
    if (isLandingPath) {
      return "pixel";
    }

    if (isSimulationPath || isLevelsPath) {
      return getAutomaticTrack(pathname);
    }

    if (mode === "study") {
      return "study";
    }

    if (mode === "classic") {
      return "classic";
    }

    return getAutomaticTrack(pathname);
  }, [
    pathname,
    mode,
    isLandingPath,
    isSimulationPath,
    isLevelsPath,
  ]);

  const currentTrack = TRACKS[selectedTrack];

  // Volumen máximo del reproductor.
  // Recarga el audio al cambiar de pista.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 1.0;
    audio.load();
  }, [currentTrack.src]);

  // Música de fondo desactivada en toda la plataforma.
  // Los efectos puntuales de interfaz (clic/victoria) son independientes.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const shouldAutoplay = false;

    const shouldPlay =
      isAuthenticated &&
      enabled &&
      mode !== "off" &&
      !isLandingPath &&
      !isSimulationPath &&
      !isLevelsPath;

    if (!shouldPlay) {
      audio.pause();
      return;
    }

    let cancelled = false;

    const attemptPlayback = async () => {
      try {
        await audio.play();

        if (cancelled) {
          audio.pause();
        }
      } catch {
        // El navegador puede bloquear el autoplay con sonido.
        // Si ocurre, se reintenta al interactuar con la página.
      }
    };

    const retryAfterInteraction = () => {
      if (cancelled || !audio.paused) {
        return;
      }

      void attemptPlayback();
    };

    void attemptPlayback();

    if (shouldAutoplay) {
      document.addEventListener(
        "pointerdown",
        retryAfterInteraction,
        true,
      );

      document.addEventListener(
        "keydown",
        retryAfterInteraction,
        true,
      );

      document.addEventListener(
        "touchstart",
        retryAfterInteraction,
        true,
      );
    }

    return () => {
      cancelled = true;

      document.removeEventListener(
        "pointerdown",
        retryAfterInteraction,
        true,
      );

      document.removeEventListener(
        "keydown",
        retryAfterInteraction,
        true,
      );

      document.removeEventListener(
        "touchstart",
        retryAfterInteraction,
        true,
      );
    };
  }, [
    currentTrack.src,
    requiresAutomaticMusic,
    isAuthenticated,
    enabled,
    mode,
  ]);

  // Cerrar el menú con Escape o al hacer clic fuera.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!containerRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen]);

  const handlePlaybackToggle = async () => {
    const audio = audioRef.current;

    if (!audio || !canChooseMusic) {
      return;
    }

    if (enabled) {
      setEnabled(false);
      audio.pause();
      return;
    }

    if (mode === "off") {
      saveMusicMode("auto");
    }

    setEnabled(true);

    try {
      await audio.play();
    } catch {
      setEnabled(false);
    }
  };

  const handleModeChange = (nextMode: MusicMode) => {
    if (!canChooseMusic) {
      return;
    }

    saveMusicMode(nextMode);
    setMenuOpen(false);

    if (nextMode === "off") {
      setEnabled(false);
      audioRef.current?.pause();
      return;
    }

    // Al elegir otra canción, iniciar su reproducción.
    setEnabled(true);
  };

  const activeOption =
    TRACK_OPTIONS.find((option) => option.id === mode) ??
    TRACK_OPTIONS[0];

  const statusLabel = isLandingPath
    ? "Pixel Gaming Beat"
    : isSimulationPath
      ? "Run It Back"
      : isLevelsPath
        ? "Level Up"
        : mode === "off"
          ? "Música desactivada"
          : selectedTrack === "classic"
            ? "Run It Back"
            : "Level Up";

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
    >
      <audio
        ref={audioRef}
        src={currentTrack.src}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);

          console.error(
            `[PeakScoreMusicPlayer] No se pudo cargar ${currentTrack.src}`,
          );
        }}
      />

      {!canChooseMusic ? null : (
        <>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              aria-label="Configurar música de PeakScore"
              aria-expanded={menuOpen}
              title={`Música: ${activeOption.label}`}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-violet-200 hover:bg-white/[0.07] hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Music2 className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => void handlePlaybackToggle()}
              aria-label={
                isPlaying
                  ? "Pausar música"
                  : "Reproducir música"
              }
              title={
                isPlaying
                  ? "Pausar música"
                  : "Reproducir música"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-white/75 hover:bg-white/[0.07] hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {mode === "off" ? (
                <VolumeX className="h-[18px] w-[18px]" />
              ) : isPlaying ? (
                <Pause className="h-[18px] w-[18px]" />
              ) : (
                <Play className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          {menuOpen && (
            <div
              className={`absolute right-0 top-[52px] z-[180] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
                isDark
                  ? "border-white/10 bg-[#11101f]/[98%] shadow-black/50"
                  : "border-slate-200 bg-white/[98%] shadow-slate-300/50"
              }`}
            >
              <div className="px-3 pb-3 pt-2">
                <p
                  className={`text-sm font-black ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }`}
                >
                  Música de PeakScore
                </p>

                <p
                  className={`mt-1 text-[11px] leading-5 ${
                    isDark
                      ? "text-white/45"
                      : "text-slate-500"
                  }`}
                >
                  Elige el ambiente de tu experiencia.
                </p>
              </div>

              <div className="space-y-1">
                {TRACK_OPTIONS.map((option) => {
                  const selected = mode === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleModeChange(option.id)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        selected
                          ? isDark
                            ? "bg-violet-500/15"
                            : "bg-violet-50"
                          : isDark
                            ? "hover:bg-white/[0.05]"
                            : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? isDark
                              ? "bg-violet-500/20 text-violet-200"
                              : "bg-violet-100 text-violet-700"
                            : isDark
                              ? "bg-white/[0.05] text-white/60"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {option.id === "off" ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Music2 className="h-4 w-4" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-xs font-extrabold ${
                            isDark
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {option.label}
                        </span>

                        <span
                          className={`mt-1 block text-[10px] leading-4 ${
                            isDark
                              ? "text-white/45"
                              : "text-slate-500"
                          }`}
                        >
                          {option.description}
                        </span>
                      </span>

                      {selected && (
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            isDark
                              ? "text-violet-300"
                              : "text-violet-600"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                className={`mt-2 flex items-center justify-between border-t px-3 pt-3 ${
                  isDark
                    ? "border-white/10"
                    : "border-slate-200"
                }`}
              >
                <span
                  className={`text-[10px] ${
                    isDark
                      ? "text-white/40"
                      : "text-slate-500"
                  }`}
                >
                  {statusLabel}
                </span>

                <span
                  className={`flex items-center gap-1 text-[10px] ${
                    isDark
                      ? "text-white/35"
                      : "text-slate-400"
                  }`}
                >
                  <ChevronDown className="h-3 w-3 -rotate-90" />
                  {currentTrack.duration}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
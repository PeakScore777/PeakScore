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
} from "react";

import type { GlobalTheme } from "./navbar-types";

type MusicMode = "auto" | "study" | "classic" | "off";

type TrackOption = {
  id: MusicMode;
  label: string;
  description: string;
};

const MUSIC_STORAGE_KEY = "peakscore-music-mode";

const TRACKS = {
  study: {
    src: "/audio/peakscore-study.mp3",
    duration: "3:02",
  },
  classic: {
    src: "/audio/peakscore-classic.mp3",
    duration: "6:00",
  },
} as const;

const TRACK_OPTIONS: TrackOption[] = [
  {
    id: "auto",
    label: "Automático",
    description: "La música cambia según la sección.",
  },
  {
    id: "study",
    label: "Focused Study Flow",
    description: "Ambient electrónico · 3:02",
  },
  {
    id: "classic",
    label: "PeakScore Classic",
    description: "Piano y orquesta · 6:00",
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

function getAutomaticTrack(pathname: string): "study" | "classic" {
  const isClassicSection = [
    "/perfil",
    "/progreso",
    "/retos",
    "/cuaderno",
    "/dashboard",
  ].some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return isClassicSection ? "classic" : "study";
}

export default function PeakScoreMusicPlayer({
  theme,
}: {
  theme: GlobalTheme;
}) {
  const pathname = usePathname();
  const isDark = theme === "dark";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
  }, []);

  const [mode, setMode] = useState<MusicMode>("auto");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSimulationPath = /simulacros?/i.test(pathname);

  const selectedTrack = useMemo<"study" | "classic">(() => {
    if (mode === "study") return "study";
    if (mode === "classic") return "classic";

    return getAutomaticTrack(pathname);
  }, [mode, pathname]);

  const currentTrack = TRACKS[selectedTrack];

  // Recuperar el modo elegido sin intentar reproducir audio automáticamente.
  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(MUSIC_STORAGE_KEY);

      if (isMusicMode(savedMode)) {
        setMode(savedMode);
      }
    } catch {
      // El reproductor sigue disponible sin almacenamiento local.
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  // Guardar el modo seleccionado por el usuario.
  useEffect(() => {
    if (!settingsLoaded) return;

    try {
      window.localStorage.setItem(MUSIC_STORAGE_KEY, mode);
    } catch {
      // La música continúa funcionando durante esta sesión.
    }
  }, [mode, settingsLoaded]);

  // Mantener la reproducción sincronizada con la sección actual.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (mode === "off" || !enabled || isSimulationPath) {
      audio.pause();
      return;
    }

    let cancelled = false;

    const startPlayback = async () => {
      try {
        await audio.play();

        if (cancelled) {
          audio.pause();
          return;
        }
      } catch {
        // El navegador puede exigir una interacción explícita.
        // El usuario puede volver a pulsar Reproducir.
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [mode, enabled, isSimulationPath, currentTrack.src]);

  // Cerrar el selector al hacer clic fuera de él o pulsar Escape.
  useEffect(() => {
    if (!menuOpen) return;

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

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handlePlaybackToggle = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (enabled) {
      setEnabled(false);
      audio.pause();
      return;
    }

    if (mode === "off") {
      setMode("auto");
    }

    if (isSimulationPath) return;

    setEnabled(true);

    try {
      await audio.play();
    } catch {
      // Si el navegador bloquea la reproducción, permite reintentarlo.
      setEnabled(false);
    }
  };

  const handleModeChange = (nextMode: MusicMode) => {
    setMode(nextMode);
    setMenuOpen(false);

    if (nextMode === "off") {
      setEnabled(false);
      audioRef.current?.pause();
      return;
    }

    // Elegir una pista no inicia la música por sí solo.
    // La reproducción se activa desde el botón correspondiente.
  };

  const activeOption =
    TRACK_OPTIONS.find((option) => option.id === mode) ??
    TRACK_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative shrink-0">
      <audio
        ref={audioRef}
        src={currentTrack.src}
        loop
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
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
              : isSimulationPath
                ? "La música se pausa durante los simulacros"
                : "Reproducir música"
          }
          disabled={isSimulationPath && !isPlaying}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
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
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Música de PeakScore
            </p>

            <p
              className={`mt-1 text-[11px] leading-5 ${
                isDark ? "text-white/45" : "text-slate-500"
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
                  onClick={() => handleModeChange(option.id)}
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
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </span>

                    <span
                      className={`mt-1 block text-[10px] leading-4 ${
                        isDark ? "text-white/45" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </span>
                  </span>

                  {selected && (
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        isDark ? "text-violet-300" : "text-violet-600"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            className={`mt-2 flex items-center justify-between border-t px-3 pt-3 ${
              isDark ? "border-white/10" : "border-slate-200"
            }`}
          >
            <span
              className={`text-[10px] ${
                isDark ? "text-white/40" : "text-slate-500"
              }`}
            >
              {isSimulationPath
                ? "Pausada durante el simulacro"
                : mode === "off"
                  ? "Música desactivada"
                  : selectedTrack === "classic"
                    ? "PeakScore Classic"
                    : "Focused Study Flow"}
            </span>

            <span
              className={`flex items-center gap-1 text-[10px] ${
                isDark ? "text-white/35" : "text-slate-400"
              }`}
            >
              <ChevronDown className="h-3 w-3 -rotate-90" />
              {currentTrack.duration}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
type CasoCeroTrack = {
  audio: HTMLAudioElement;
  volume: number;
};

let ambientTracks: CasoCeroTrack[] | null = null;
let pendingPrepare: Promise<void> | null = null;
let deferredStopTimer: number | null = null;
let fadeFrameId: number | null = null;
let hasRevealedAudio = false;

function getTracks(): CasoCeroTrack[] {
  if (typeof window === "undefined") return [];
  if (ambientTracks) return ambientTracks;

  ambientTracks = [
    { audio: new Audio("/audio/caso-cero/ambiente-rio-lluvia.wav"), volume: 0.34 },
    { audio: new Audio("/audio/caso-cero/lluvia-ventana.wav"), volume: 0.42 },
    { audio: new Audio("/audio/caso-cero/musica-misterio.wav"), volume: 0.14 },
  ];

  for (const { audio } of ambientTracks) {
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0;
    audio.muted = true;
  }

  return ambientTracks;
}

function cancelDeferredStop(): void {
  if (typeof window !== "undefined" && deferredStopTimer !== null) {
    window.clearTimeout(deferredStopTimer);
    deferredStopTimer = null;
  }
}

/**
 * Prepare all audio in the JUGAR click's activation window, but keep it
 * completely silent while Next.js, the server data, images, video and rain
 * effect load. Muted playback preserves the browser's user activation so the
 * ambience can be revealed later without asking for a second click.
 */
export function prepareCasoCeroAmbientAudio(): Promise<void> {
  cancelDeferredStop();

  const tracks = getTracks();
  if (tracks.length !== 3) return Promise.resolve();

  // Re-entering from the game catalog must silence any previous run before
  // navigation starts; otherwise a returning player could hear the old scene
  // underneath the loading skeleton.
  if (hasRevealedAudio) {
    hasRevealedAudio = false;
    for (const { audio } of tracks) {
      audio.volume = 0;
      audio.muted = true;
    }
  }

  if (pendingPrepare) return pendingPrepare;

  for (const { audio } of tracks) {
    audio.loop = true;
    audio.volume = 0;
    audio.muted = true;
  }

  // Call play() synchronously for every track so the JUGAR click authorizes
  // the silent media playback before navigation begins.
  const playback = tracks.map(({ audio }) => {
    if (!audio.paused) return Promise.resolve();
    return audio.play();
  });

  pendingPrepare = Promise.allSettled(playback)
    .then(() => undefined)
    .finally(() => {
      pendingPrepare = null;
    });

  return pendingPrepare;
}

/**
 * Called only after the scene reports its data and visual assets ready.
 * Fade the three ambience tracks in together for a deliberate cinematic start.
 */
export function revealCasoCeroAmbientAudio(): void {
  cancelDeferredStop();

  const tracks = getTracks();
  if (tracks.length !== 3 || hasRevealedAudio) return;
  hasRevealedAudio = true;

  if (typeof window === "undefined") return;
  if (fadeFrameId !== null) {
    window.cancelAnimationFrame(fadeFrameId);
    fadeFrameId = null;
  }

  for (const { audio } of tracks) {
    audio.volume = 0;
    audio.muted = false;

    // The click normally started these tracks silently. If the scene was
    // opened directly, try playback again after the assets are ready.
    if (audio.paused) void audio.play().catch(() => undefined);
  }

  const fadeDurationMs = 1500;
  const startedAt = window.performance.now();

  const fadeFrame = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / fadeDurationMs);
    const eased = progress * progress * (3 - 2 * progress);

    for (const { audio, volume } of tracks) {
      audio.volume = volume * eased;
    }

    if (progress < 1) {
      fadeFrameId = window.requestAnimationFrame(fadeFrame);
    } else {
      fadeFrameId = null;
    }
  };

  fadeFrameId = window.requestAnimationFrame(fadeFrame);
}

/** Stop and reset the ambience when leaving Caso Cero. */
export function stopCasoCeroAmbientAudio(): void {
  if (!ambientTracks || typeof window === "undefined") return;
  cancelDeferredStop();

  // React Strict Mode replays effects in development. A short delay lets a
  // remount cancel this cleanup instead of stopping audio during navigation.
  deferredStopTimer = window.setTimeout(() => {
    if (fadeFrameId !== null) {
      window.cancelAnimationFrame(fadeFrameId);
      fadeFrameId = null;
    }

    for (const { audio } of ambientTracks ?? []) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      audio.muted = true;
    }

    hasRevealedAudio = false;
    pendingPrepare = null;
    deferredStopTimer = null;
  }, 300);
}

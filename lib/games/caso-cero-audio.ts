type CasoCeroTrack = {
  audio: HTMLAudioElement;
  volume: number;
};

let ambientTracks: CasoCeroTrack[] | null = null;
let pendingStart: Promise<void> | null = null;

function getTracks(): CasoCeroTrack[] {
  if (typeof window === "undefined") return [];
  if (ambientTracks) return ambientTracks;

  ambientTracks = [
    { audio: new Audio("/audio/caso-cero/ambiente-rio-lluvia.wav"), volume: 0.34 },
    { audio: new Audio("/audio/caso-cero/lluvia-ventana.wav"), volume: 0.42 },
    { audio: new Audio("/audio/caso-cero/musica-misterio.wav"), volume: 0.14 },
  ];

  for (const { audio } of ambientTracks) {
    // Loading starts on the actual JUGAR click. The browser can then stream
    // the tracks as soon as its user-activation policy allows playback.
    audio.preload = "auto";
    audio.loop = true;
    audio.muted = false;
  }

  return ambientTracks;
}

/**
 * Start all Caso Cero ambience tracks in the same user-activation handler
 * that navigates from the games hub. This avoids requiring a second click
 * inside the cinematic scene on browsers that block audible autoplay.
 */
export function startCasoCeroAmbientAudio(): Promise<void> {
  const tracks = getTracks();
  if (tracks.length !== 3 || tracks.every(({ audio }) => !audio.paused)) {
    return Promise.resolve();
  }
  if (pendingStart) return pendingStart;

  // Invoke play() synchronously for all three tracks before the click
  // activation expires; do not await one track before starting the next.
  const playbackPromises = tracks.map(({ audio, volume }) => {
    audio.loop = true;
    audio.volume = volume;
    audio.muted = false;
    return audio.play();
  });

  pendingStart = Promise.all(playbackPromises)
    .then(() => undefined)
    .catch(() => {
      // If the browser rejects autoplay, leave a clean state. The scene
      // retries on its next interaction, but normal hub entry should start it.
      for (const { audio } of tracks) audio.pause();
    })
    .finally(() => {
      pendingStart = null;
    });

  return pendingStart;
}

/** Stop the ambience when leaving Caso Cero, without creating duplicate players. */
export function stopCasoCeroAmbientAudio(): void {
  if (!ambientTracks) return;
  for (const { audio } of ambientTracks) {
    audio.pause();
    audio.currentTime = 0;
  }
  pendingStart = null;
}

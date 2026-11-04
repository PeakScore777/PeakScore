const ALLOWED_ORBY_VOICES = new Set([
  "Despina",
  "Aoede",
  "Sulafat",
  "Achird",
  "Leda",
  "Kore",
  "Zephyr",
]);

const requestedVoice = process.env.ORBY_LIVE_VOICE_NAME?.trim() || "Despina";

/** Female voice identity selected for Gemini Live voice conversations. */
export const ORBY_VOICE_NAME = ALLOWED_ORBY_VOICES.has(requestedVoice)
  ? requestedVoice
  : "Despina";

/** Turn-level speech direction; kept separate from the transcript itself. */
export const ORBY_VOICE_STYLE =
  "Español colombiano natural. Voz cálida, cercana y serena de tutora; dicción nítida, cadencia conversacional y ritmo medio-ágil. Expresa curiosidad y empatía de forma sutil. No uses tono de locutora, noticiero, anuncio ni doblaje dramático. No añadas palabras que no estén en el texto.";

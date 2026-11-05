import { Buffer } from "node:buffer";

const DEFAULT_SAMPLE_RATE = 24_000;
const MAX_PCM_SAMPLE_RATE = 48_000;

function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcm.byteLength;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Gemini TTS unary responses are complete WAV files by default. Do not wrap
 * those bytes in another WAV header. Raw PCM is accepted only when the
 * provider explicitly identifies the response as PCM/L16.
 */
export function normalizeGeminiTtsAudio(
  base64Audio: string,
  mimeType?: string,
  maxBytes = 4 * 1024 * 1024,
): Buffer | null {
  if (!base64Audio || base64Audio.length > Math.ceil(maxBytes * 4 / 3) + 8) return null;

  const audio = Buffer.from(base64Audio, "base64");
  if (audio.byteLength < 256 || audio.byteLength > maxBytes) return null;

  const isWav = audio.byteLength >= 44
    && audio.toString("ascii", 0, 4) === "RIFF"
    && audio.toString("ascii", 8, 12) === "WAVE";
  if (isWav) {
    const declaredLength = audio.readUInt32LE(4) + 8;
    if (declaredLength > audio.byteLength || declaredLength < 44) return null;
    return audio.subarray(0, declaredLength);
  }

  const normalizedMime = (mimeType ?? "").split(";")[0].trim().toLowerCase();
  if (normalizedMime !== "audio/pcm" && normalizedMime !== "audio/l16") return null;
  if (audio.byteLength % 2 !== 0) return null;

  const rateMatch = mimeType?.match(/(?:rate|samplerate)=([0-9]+)/i);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : DEFAULT_SAMPLE_RATE;
  if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > MAX_PCM_SAMPLE_RATE) return null;

  return pcm16ToWav(audio, sampleRate);
}

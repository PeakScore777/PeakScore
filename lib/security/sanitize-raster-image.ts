import { createCanvas, loadImage } from "@napi-rs/canvas";

export type SupportedRasterMime = "image/png" | "image/jpeg" | "image/webp";

export interface SanitizedRasterImage {
  buffer: Buffer;
  contentType: SupportedRasterMime;
  extension: "png" | "jpg" | "webp";
  width: number;
  height: number;
}

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_EDGE = 8_192;
const MAX_IMAGE_PIXELS = 12_000_000;

function fail(message: string): never {
  throw new Error(message);
}

function dimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_IMAGE_EDGE ||
    height > MAX_IMAGE_EDGE ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    fail("La imagen tiene dimensiones superiores al límite permitido.");
  }
  return { width, height };
}

function rejectAnimatedPng(bytes: Buffer) {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const chunkSize = bytes.readUInt32BE(offset);
    const chunkType = bytes.toString("ascii", offset + 4, offset + 8);
    const chunkEnd = offset + 12 + chunkSize;
    if (chunkEnd > bytes.length) return;
    if (chunkType === "acTL" || chunkType === "fcTL" || chunkType === "fdAT") {
      fail("No se permiten imágenes animadas.");
    }
    if (chunkType === "IEND") return;
    offset = chunkEnd;
  }
}

function readPngDimensions(bytes: Buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    bytes.length < 24 ||
    !bytes.subarray(0, 8).equals(signature) ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return null;
  }

  return dimensions(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
}

function readJpegDimensions(bytes: Buffer) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);

  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;

    const marker = bytes[offset];
    offset += 1;

    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) return null;

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;

    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      return dimensions(width, height);
    }

    offset += segmentLength;
  }

  return null;
}

function readUInt24LE(bytes: Buffer, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readWebpDimensions(bytes: Buffer) {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.toString("ascii", offset, offset + 4);
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (chunkType === "ANIM" || chunkType === "ANMF") fail("No se permiten imágenes animadas.");
    const chunkEnd = dataOffset + chunkSize;
    if (chunkEnd > bytes.length) return null;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      // Animated WebP uses the animation feature bit and frame chunks.
      if ((bytes[dataOffset] & 0x02) !== 0) fail("No se permiten imágenes animadas.");
      return dimensions(
        readUInt24LE(bytes, dataOffset + 4) + 1,
        readUInt24LE(bytes, dataOffset + 7) + 1,
      );
    }

    if (chunkType === "VP8L" && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
      const b1 = bytes[dataOffset + 1];
      const b2 = bytes[dataOffset + 2];
      const b3 = bytes[dataOffset + 3];
      const b4 = bytes[dataOffset + 4];
      return dimensions(
        1 + b1 + ((b2 & 0x3f) << 8),
        1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
      );
    }

    if (
      chunkType === "VP8 " &&
      chunkSize >= 10 &&
      bytes[dataOffset + 3] === 0x9d &&
      bytes[dataOffset + 4] === 0x01 &&
      bytes[dataOffset + 5] === 0x2a
    ) {
      return dimensions(
        bytes.readUInt16LE(dataOffset + 6) & 0x3fff,
        bytes.readUInt16LE(dataOffset + 8) & 0x3fff,
      );
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  return null;
}

function inspectRasterHeader(bytes: Buffer, contentType: SupportedRasterMime) {
  const parsed =
    contentType === "image/png"
      ? readPngDimensions(bytes)
      : contentType === "image/jpeg"
        ? readJpegDimensions(bytes)
        : readWebpDimensions(bytes);

  if (!parsed) {
    fail("El contenido del archivo no coincide con una imagen PNG, JPG o WebP válida.");
  }
  return parsed;
}

/**
 * Decode and re-encode untrusted raster uploads. Only PNG/JPEG/WebP are accepted;
 * SVG, HTML, GIF and other active or animated formats are deliberately rejected.
 * Re-encoding strips metadata and any trailing/polyglot payload from stored files.
 */
export async function sanitizeRasterImage(
  input: Uint8Array,
  declaredMime: string,
  maxOutputBytes = MAX_INPUT_BYTES,
): Promise<SanitizedRasterImage> {
  if (
    declaredMime !== "image/png" &&
    declaredMime !== "image/jpeg" &&
    declaredMime !== "image/webp"
  ) {
    fail("Solo se permiten imágenes PNG, JPG o WebP.");
  }

  const bytes = Buffer.from(input);
  if (bytes.length === 0 || bytes.length > MAX_INPUT_BYTES) {
    fail("El tamaño de la imagen no es válido.");
  }

  if (declaredMime === "image/png") rejectAnimatedPng(bytes);

  const size = inspectRasterHeader(bytes, declaredMime);
  const image = await loadImage(bytes);

  if (image.width !== size.width || image.height !== size.height) {
    fail("La imagen no superó la validación de dimensiones.");
  }

  const canvas = createCanvas(size.width, size.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, size.width, size.height);

  let output: Buffer;
  if (declaredMime === "image/png") {
    output = await canvas.encode("png");
  } else if (declaredMime === "image/jpeg") {
    output = await canvas.encode("jpeg", { quality: 90 });
  } else {
    output = await canvas.encode("webp", { quality: 90 });
  }

  if (output.length === 0 || output.length > maxOutputBytes) {
    fail("La imagen optimizada supera el límite de almacenamiento.");
  }

  const contentType = declaredMime as SupportedRasterMime;
  return {
    buffer: output,
    contentType,
    extension: contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp",
    width: size.width,
    height: size.height,
  };
}

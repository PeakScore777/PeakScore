import { createCanvas, loadImage } from "@napi-rs/canvas";

export type SupportedRasterMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

export interface SanitizedRasterImage {
  buffer: Buffer;
  contentType: SupportedRasterMime;
  extension: "png" | "jpg" | "webp" | "gif";
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


function hasPersonalMetadata(bytes: Buffer, contentType: SupportedRasterMime): boolean {
  if (contentType === "image/jpeg") {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return true;
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) return true;
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) return true;
      const marker = bytes[offset++];
      if (marker === 0xda) return false;
      if (marker === 0xd9 || marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return true;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) return true;
      // APP1–APP15 may contain EXIF/GPS, XMP, IPTC, camera/vendor data;
      // COM stores user-authored comments. Canvas output should not retain them.
      if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) return true;
      offset += length;
    }
    return true;
  }

  if (contentType === "image/png") {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (bytes.length < 20 || !bytes.subarray(0, 8).equals(signature)) return true;
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const size = bytes.readUInt32BE(offset);
      const type = bytes.toString("ascii", offset + 4, offset + 8);
      const end = offset + 12 + size;
      if (end > bytes.length) return true;
      // EXIF, text/XMP, timestamps and embedded color profiles are not needed
      // for chat display and can carry identifying or unnecessary metadata.
      if (["eXIf", "tEXt", "zTXt", "iTXt", "tIME", "iCCP"].includes(type)) return true;
      if (type === "IEND") return false;
      offset = end;
    }
    return true;
  }

  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return true;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    if (end > bytes.length) return true;
    if (["EXIF", "XMP ", "ICCP"].includes(type)) return true;
    offset = end + (size % 2);
  }
  return offset !== bytes.length;
}

type GifSubBlocks = { raw: Buffer; data: Buffer; nextOffset: number };

function readGifSubBlocks(bytes: Buffer, start: number): GifSubBlocks {
  let offset = start;
  const dataParts: Buffer[] = [];
  let total = 0;
  while (offset < bytes.length) {
    const blockSize = bytes[offset++];
    if (blockSize === 0) {
      return {
        raw: bytes.subarray(start, offset),
        data: Buffer.concat(dataParts, total),
        nextOffset: offset,
      };
    }
    if (offset + blockSize > bytes.length) fail("El GIF contiene bloques incompletos.");
    total += blockSize;
    if (total > 5 * 1024 * 1024) fail("El GIF supera el tamaño descomprimido permitido.");
    dataParts.push(bytes.subarray(offset, offset + blockSize));
    offset += blockSize;
  }
  return fail("El GIF no terminó correctamente sus bloques de datos.");
}

function validateGifLzw(data: Buffer, minimumCodeSize: number, expectedPixels: number) {
  if (minimumCodeSize < 2 || minimumCodeSize > 8) fail("El GIF utiliza una compresión LZW no válida.");
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4096);
  for (let code = 0; code < clearCode; code += 1) {
    prefix[code] = -1;
    suffix[code] = code;
  }

  let bitOffset = 0;
  const readCode = (size: number) => {
    if (bitOffset + size > data.length * 8) return null;
    let value = 0;
    for (let bit = 0; bit < size; bit += 1) {
      value |= ((data[(bitOffset + bit) >> 3] >> ((bitOffset + bit) & 7)) & 1) << bit;
    }
    bitOffset += size;
    return value;
  };

  let codeSize = minimumCodeSize + 1;
  let nextCode = endCode + 1;
  let previousCode = -1;
  let pixelCount = 0;
  let ended = false;
  let iterations = 0;
  const maximumIterations = Math.min(expectedPixels + 4096, 1_100_000);

  while (iterations < maximumIterations) {
    iterations += 1;
    let code = readCode(codeSize);
    if (code === null) break;

    if (code === clearCode) {
      codeSize = minimumCodeSize + 1;
      nextCode = endCode + 1;
      previousCode = -1;
      continue;
    }
    if (code === endCode) {
      ended = true;
      break;
    }
    if (code > nextCode || code >= 4096) fail("El GIF contiene un código LZW fuera de rango.");
    if (previousCode < 0 && code >= clearCode) fail("El GIF no reinició correctamente su compresión.");

    const inputCode = code;
    let stackLength = 0;
    if (code === nextCode) {
      if (previousCode < 0) fail("El GIF contiene una secuencia LZW inválida.");
      stack[stackLength++] = suffix[previousCode];
      code = previousCode;
    }

    let guard = 0;
    while (code >= clearCode) {
      if (code >= nextCode || guard++ >= 4096 || stackLength >= 4095) {
        fail("El GIF contiene una cadena LZW inválida.");
      }
      stack[stackLength++] = suffix[code];
      code = prefix[code];
      if (code < 0) fail("El GIF contiene una referencia LZW inválida.");
    }
    const first = code;
    stack[stackLength++] = first;
    pixelCount += stackLength;
    if (pixelCount > expectedPixels) fail("Un fotograma GIF intenta descomprimir más píxeles de los permitidos.");

    if (previousCode >= 0 && nextCode < 4096) {
      prefix[nextCode] = previousCode;
      suffix[nextCode] = first;
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    }
    previousCode = inputCode;
  }

  if (!ended || pixelCount !== expectedPixels) {
    fail("El fotograma GIF está incompleto o tiene datos de píxeles no válidos.");
  }
}

function sanitizeGif(bytes: Buffer, maxOutputBytes: number): SanitizedRasterImage {
  if (
    bytes.length < 14 ||
    (bytes.toString("ascii", 0, 6) !== "GIF87a" && bytes.toString("ascii", 0, 6) !== "GIF89a")
  ) {
    fail("El contenido no es un GIF válido.");
  }

  const width = bytes.readUInt16LE(6);
  const height = bytes.readUInt16LE(8);
  if (width < 1 || height < 1 || width > 1024 || height > 1024 || width * height > 1_048_576) {
    fail("El GIF supera las dimensiones máximas permitidas para un avatar.");
  }

  const logicalScreenPacked = bytes[10];
  const hasGlobalColorTable = (logicalScreenPacked & 0x80) !== 0;
  const globalColorTableBytes = hasGlobalColorTable ? 3 * (1 << ((logicalScreenPacked & 0x07) + 1)) : 0;
  let offset = 13 + globalColorTableBytes;
  if (offset > bytes.length) fail("La paleta de colores del GIF está incompleta.");

  const output: Buffer[] = [bytes.subarray(0, offset)];
  let frameCount = 0;
  let totalFramePixels = 0;
  let totalDelayCentiseconds = 0;
  let pendingDelayCentiseconds = 0;
  let sawTrailer = false;

  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) {
      if (offset !== bytes.length) fail("El GIF contiene datos adicionales después del final.");
      sawTrailer = true;
      output.push(Buffer.from([0x3b]));
      break;
    }

    if (marker === 0x21) {
      if (offset >= bytes.length) fail("La extensión del GIF está incompleta.");
      const label = bytes[offset++];

      if (label === 0xf9) {
        if (offset + 6 > bytes.length || bytes[offset] !== 4 || bytes[offset + 5] !== 0) {
          fail("El control de animación del GIF no es válido.");
        }
        const extension = bytes.subarray(offset - 2, offset + 6);
        pendingDelayCentiseconds = bytes.readUInt16LE(offset + 2);
        output.push(extension);
        offset += 6;
        continue;
      }

      if (label === 0xff) {
        if (offset >= bytes.length) fail("La extensión de aplicación del GIF está incompleta.");
        const identifierLength = bytes[offset++];
        if (identifierLength !== 11 || offset + identifierLength > bytes.length) {
          fail("La extensión de aplicación del GIF no es válida.");
        }
        const identifier = bytes.toString("ascii", offset, offset + identifierLength);
        offset += identifierLength;
        const blocks = readGifSubBlocks(bytes, offset);
        offset = blocks.nextOffset;

        const isLoopExtension = identifier === "NETSCAPE2.0" || identifier === "ANIMEXTS1.0";
        const validLoopData = blocks.data.length === 3 && blocks.data[0] === 1;
        if (isLoopExtension && validLoopData) {
          const header = Buffer.concat([Buffer.from([0x21, 0xff, 0x0b]), Buffer.from(identifier, "ascii")]);
          output.push(header, blocks.raw);
        }
        // All other application payloads are removed: they may contain XMP,
        // vendor metadata, or application-specific binary data.
        continue;
      }

      if (label === 0x01) {
        // Plain-text extensions are not required for avatar animation and can
        // carry embedded text; discard the fixed header and its data sub-blocks.
        if (offset >= bytes.length) fail("La extensión de texto del GIF está incompleta.");
        const headerLength = bytes[offset++];
        if (headerLength !== 12 || offset + headerLength > bytes.length) {
          fail("La extensión de texto del GIF no es válida.");
        }
        offset += headerLength;
        const blocks = readGifSubBlocks(bytes, offset);
        offset = blocks.nextOffset;
        pendingDelayCentiseconds = 0;
        continue;
      }

      // Comment and unknown extension payloads are stripped.
      const blocks = readGifSubBlocks(bytes, offset);
      offset = blocks.nextOffset;
      continue;
    }

    if (marker === 0x2c) {
      if (offset + 9 > bytes.length) fail("El descriptor de fotograma GIF está incompleto.");
      const descriptorStart = offset - 1;
      const left = bytes.readUInt16LE(offset);
      const top = bytes.readUInt16LE(offset + 2);
      const frameWidth = bytes.readUInt16LE(offset + 4);
      const frameHeight = bytes.readUInt16LE(offset + 6);
      const framePacked = bytes[offset + 8];
      offset += 9;

      if (
        frameWidth < 1 || frameHeight < 1 ||
        left + frameWidth > width || top + frameHeight > height ||
        frameWidth > 1024 || frameHeight > 1024
      ) {
        fail("Un fotograma GIF excede el lienzo permitido.");
      }

      const hasLocalColorTable = (framePacked & 0x80) !== 0;
      const localColorTableBytes = hasLocalColorTable ? 3 * (1 << ((framePacked & 0x07) + 1)) : 0;
      if (offset + localColorTableBytes + 1 > bytes.length) fail("La paleta del fotograma GIF está incompleta.");
      offset += localColorTableBytes;

      const minimumCodeSize = bytes[offset++];
      const blocks = readGifSubBlocks(bytes, offset);
      offset = blocks.nextOffset;

      validateGifLzw(blocks.data, minimumCodeSize, frameWidth * frameHeight);
      frameCount += 1;
      totalFramePixels += frameWidth * frameHeight;
      totalDelayCentiseconds += pendingDelayCentiseconds;
      pendingDelayCentiseconds = 0;

      if (frameCount > 60 || totalFramePixels > 40_000_000 || totalDelayCentiseconds > 3000) {
        fail("La animación GIF supera los límites de fotogramas, duración o procesamiento.");
      }

      // Keep only the image descriptor, optional local table, LZW code-size,
      // and validated image data sub-blocks.
      output.push(bytes.subarray(descriptorStart, offset));
      if (Buffer.concat(output).length > maxOutputBytes) fail("El GIF optimizado supera el límite de almacenamiento.");
      continue;
    }

    fail("El GIF contiene un bloque desconocido o mal formado.");
  }

  if (!sawTrailer || frameCount < 1) fail("El GIF no contiene fotogramas válidos.");
  const buffer = Buffer.concat(output);
  if (buffer.length === 0 || buffer.length > maxOutputBytes) fail("El GIF optimizado supera el límite de almacenamiento.");

  return {
    buffer,
    contentType: "image/gif",
    extension: "gif",
    width,
    height,
  };
}

/**
 * Decode and re-encode untrusted PNG/JPEG/WebP uploads. GIF uploads take a strict
 * container + LZW validation path that preserves only bounded image frames and a
 * standards-based loop extension; comments, text, vendor metadata and trailing bytes are removed.
 */
export async function sanitizeRasterImage(
  input: Uint8Array,
  declaredMime: string,
  maxOutputBytes = MAX_INPUT_BYTES,
): Promise<SanitizedRasterImage> {
  if (
    declaredMime !== "image/png" &&
    declaredMime !== "image/jpeg" &&
    declaredMime !== "image/webp" &&
    declaredMime !== "image/gif"
  ) {
    fail("Solo se permiten imágenes PNG, JPG, WebP o GIF.");
  }

  const bytes = Buffer.from(input);
  if (bytes.length === 0 || bytes.length > MAX_INPUT_BYTES) {
    fail("El tamaño de la imagen no es válido.");
  }
  if (declaredMime === "image/gif") {
    return sanitizeGif(bytes, maxOutputBytes);
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
    output = await canvas.encode("jpeg", 90);
  } else {
    output = await canvas.encode("webp", 90);
  }

  if (hasPersonalMetadata(output, declaredMime)) {
    fail("No se pudo garantizar la eliminación de metadatos privados de la imagen.");
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

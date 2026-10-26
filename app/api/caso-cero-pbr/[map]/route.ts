import { NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";

export const runtime = "nodejs";
export const revalidate = 604800;

const ROPE_ARCHIVE =
  "https://ambientcg.com/get?file=Rope001_1K-JPG.zip";

const MAP_FILES: Record<string, string> = {
  "rope-color": "Rope001_1K-JPG_Color.jpg",
  "rope-normal": "Rope001_1K-JPG_NormalGL.jpg",
  "rope-roughness": "Rope001_1K-JPG_Roughness.jpg",
};

function extractZipEntry(archive: Buffer, targetName: string): Buffer | null {
  // Walk the ZIP central directory, then read the selected local file entry.
  let entryOffset = archive.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));

  while (entryOffset >= 0 && entryOffset + 46 <= archive.length) {
    if (archive.readUInt32LE(entryOffset) !== 0x02014b50) break;

    const compression = archive.readUInt16LE(entryOffset + 10);
    const compressedSize = archive.readUInt32LE(entryOffset + 20);
    const uncompressedSize = archive.readUInt32LE(entryOffset + 24);
    const nameLength = archive.readUInt16LE(entryOffset + 28);
    const extraLength = archive.readUInt16LE(entryOffset + 30);
    const commentLength = archive.readUInt16LE(entryOffset + 32);
    const localHeaderOffset = archive.readUInt32LE(entryOffset + 42);
    const entryName = archive
      .subarray(entryOffset + 46, entryOffset + 46 + nameLength)
      .toString("utf8");

    if (entryName === targetName) {
      if (uncompressedSize > 12 * 1024 * 1024) {
        throw new Error("PBR map exceeds the size limit");
      }
      if (
        localHeaderOffset + 30 > archive.length ||
        archive.readUInt32LE(localHeaderOffset) !== 0x04034b50
      ) {
        throw new Error("Invalid PBR map ZIP entry");
      }

      const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataStart < 0 || dataEnd > archive.length) {
        throw new Error("Truncated PBR map ZIP entry");
      }

      const compressed = archive.subarray(dataStart, dataEnd);
      let result: Buffer;
      if (compression === 0) result = Buffer.from(compressed);
      else if (compression === 8) result = inflateRawSync(compressed, { maxOutputLength: 12 * 1024 * 1024 });
      else throw new Error("Unsupported PBR map compression");

      if (result.length !== uncompressedSize) {
        throw new Error("PBR map checksum/size mismatch");
      }
      return result;
    }

    entryOffset += 46 + nameLength + extraLength + commentLength;
    const nextSignature = archive.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), entryOffset);
    entryOffset = nextSignature;
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ map: string }> },
) {
  const { map } = await context.params;
  const fileName = MAP_FILES[map];

  if (!fileName) {
    return new NextResponse("Unknown PBR map", { status: 404 });
  }

  try {
    const upstream = await fetch(ROPE_ARCHIVE, {
      headers: { Accept: "application/zip, application/octet-stream, */*" },
      next: { revalidate: 604800 },
    });

    if (!upstream.ok) {
      return new NextResponse("CC0 rope material unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const archive = Buffer.from(await upstream.arrayBuffer());
    const image = extractZipEntry(archive, fileName);
    if (!image) {
      return new NextResponse("Required PBR map was not found in the archive", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(image, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.warn("Caso Cero: unable to extract CC0 rope PBR map.", error);
    return new NextResponse("Unable to load CC0 rope PBR map", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

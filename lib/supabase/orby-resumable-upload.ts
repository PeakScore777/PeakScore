export type OrbyResumableUploadOptions = {
  endpoint: string;
  token: string;
  apiKey: string;
  bucketName: string;
  objectName: string;
  file: File;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

type StoredUpload = {
  documentId: string;
  objectName: string;
  uploadUrl: string;
  fileSize: number;
  lastModified: number;
};

const TUS_VERSION = "1.0.0";
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function getFingerprint(file: File): string {
  return [file.name, file.size, file.lastModified].join(":");
}

function getPendingDocumentKey(file: File): string {
  return "orby-document:" + getFingerprint(file);
}

export function getOrbyPendingDocumentId(file: File): string {
  const key = getPendingDocumentKey(file);
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
      return existing;
    }
  } catch {
    // Continue with a fresh ID when session storage is unavailable.
  }
  const id = window.crypto.randomUUID();
  try { window.sessionStorage.setItem(key, id); } catch { /* best effort */ }
  return id;
}

export function clearOrbyPendingDocumentId(file: File): void {
  try { window.sessionStorage.removeItem(getPendingDocumentKey(file)); } catch { /* best effort */ }
}

function getStoredUpload(file: File, key: string): StoredUpload | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredUpload;
    if (
      value.fileSize !== file.size
      || value.lastModified !== file.lastModified
      || typeof value.documentId !== "string"
      || typeof value.objectName !== "string"
      || typeof value.uploadUrl !== "string"
    ) return null;
    return value;
  } catch {
    return null;
  }
}

function storeUpload(key: string, value: StoredUpload): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Resumable upload still works for this tab even when session storage is unavailable.
  }
}

async function getUploadOffset(uploadUrl: string, apiKey: string): Promise<number> {
  const response = await fetch(uploadUrl, {
    method: "HEAD",
    headers: {
      "Tus-Resumable": TUS_VERSION,
      apikey: apiKey,
    },
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) throw new Error("La sesión de carga resumible expiró. Vuelve a seleccionar el PDF.");
  const offset = Number(response.headers.get("Upload-Offset"));
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Supabase no devolvió una posición de carga válida.");
  }
  return offset;
}

async function createTusUpload(options: OrbyResumableUploadOptions): Promise<{
  documentId: string;
  objectName: string;
  uploadUrl: string;
}> {
  const endpointUrl = new URL(options.endpoint);
  if (endpointUrl.protocol !== "https:") throw new Error("El endpoint de carga debe usar HTTPS.");

  const metadata = [
    ["bucketName", options.bucketName],
    ["objectName", options.objectName],
    ["contentType", "application/pdf"],
    ["cacheControl", "3600"],
  ].map(([key, value]) => key + " " + base64Utf8(value)).join(",");

  const response = await fetch(options.endpoint, {
    method: "POST",
    headers: {
      "Tus-Resumable": TUS_VERSION,
      "Upload-Length": String(options.file.size),
      "Upload-Metadata": metadata,
      "x-signature": options.token,
      apikey: options.apiKey,
    },
    cache: "no-store",
    credentials: "omit",
  });
  if (response.status !== 201) {
    throw new Error("Supabase no pudo iniciar la carga reanudable (HTTP " + response.status + ").");
  }

  const location = response.headers.get("Location");
  if (!location) throw new Error("Supabase no devolvió la dirección de carga.");
  const uploadUrl = new URL(location, options.endpoint);
  if (uploadUrl.origin !== endpointUrl.origin) {
    throw new Error("La dirección de carga no pertenece al almacenamiento esperado.");
  }

  const documentId = options.objectName.split("/").pop()?.replace(/\.pdf$/i, "") ?? "";
  return { documentId, objectName: options.objectName, uploadUrl: uploadUrl.toString() };
}

export async function uploadOrbyPdfResumable(options: OrbyResumableUploadOptions): Promise<{
  documentId: string;
  objectName: string;
}> {
  const key = "orby-tus:" + getFingerprint(options.file);
  let stored = getStoredUpload(options.file, key);
  let uploadUrl = "";

  if (stored && stored.objectName === options.objectName) {
    try {
      uploadUrl = stored.uploadUrl;
      const offset = await getUploadOffset(uploadUrl, options.apiKey);
      options.onProgress?.(offset, options.file.size);
    } catch {
      stored = null;
      uploadUrl = "";
      try { window.sessionStorage.removeItem(key); } catch { /* ignore */ }
    }
  }

  if (!stored || !uploadUrl) {
    const created = await createTusUpload(options);
    stored = {
      ...created,
      fileSize: options.file.size,
      lastModified: options.file.lastModified,
    };
    uploadUrl = created.uploadUrl;
    storeUpload(key, stored);
  }

  let offset = await getUploadOffset(uploadUrl, options.apiKey);
  options.onProgress?.(offset, options.file.size);
  let retryIndex = 0;
  const retryDelays = [0, 3000, 5000, 10000, 20000];

  while (offset < options.file.size) {
    const nextOffset = Math.min(offset + TUS_CHUNK_BYTES, options.file.size);
    try {
      const response = await fetch(uploadUrl, {
        method: "PATCH",
        headers: {
          "Tus-Resumable": TUS_VERSION,
          "Upload-Offset": String(offset),
          "Content-Type": "application/offset+octet-stream",
          apikey: options.apiKey,
        },
        body: options.file.slice(offset, nextOffset),
        cache: "no-store",
        credentials: "omit",
      });

      if (response.status !== 204) {
        if (response.status === 409) {
          offset = await getUploadOffset(uploadUrl, options.apiKey);
          options.onProgress?.(offset, options.file.size);
          continue;
        }
        throw new Error("Falló un bloque de carga (HTTP " + response.status + ").");
      }

      const savedOffset = Number(response.headers.get("Upload-Offset"));
      if (!Number.isInteger(savedOffset) || savedOffset <= offset || savedOffset > options.file.size) {
        throw new Error("Supabase devolvió un avance de carga inválido.");
      }

      offset = savedOffset;
      retryIndex = 0;
      options.onProgress?.(offset, options.file.size);
    } catch (error) {
      if (retryIndex >= retryDelays.length - 1) {
        throw error instanceof Error ? error : new Error("No se pudo continuar la carga.");
      }
      const delay = retryDelays[++retryIndex];
      await new Promise((resolve) => window.setTimeout(resolve, delay));
      offset = await getUploadOffset(uploadUrl, options.apiKey);
      options.onProgress?.(offset, options.file.size);
    }
  }

  try { window.sessionStorage.removeItem(key); } catch { /* ignore */ }
  return { documentId: stored.documentId, objectName: stored.objectName };
}

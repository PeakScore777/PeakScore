import "server-only";

import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "orby-knowledge";
const FILE_TTL_MS = 47 * 60 * 60 * 1000;
const FILE_PROCESSING_ATTEMPTS = 12;

export type OrbyGeminiDocumentFile = {
  uri: string;
  name: string;
  expiresAt: string;
};

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no está configurada para la lectura multimodal de Orby.");
  return new GoogleGenAI({ apiKey });
}

export async function ensureOrbyGeminiDocumentFile(
  documentId: string,
  storagePath: string
): Promise<OrbyGeminiDocumentFile> {
  const { data: current, error: lookupError } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .select("gemini_file_uri,gemini_file_name,gemini_file_expires_at")
    .eq("id", documentId)
    .single();
  if (lookupError || !current) throw new Error("No se pudo consultar la referencia multimodal de Orby.");

  const currentExpiry = current.gemini_file_expires_at ? new Date(current.gemini_file_expires_at).getTime() : 0;
  if (
    typeof current.gemini_file_uri === "string"
    && current.gemini_file_uri
    && currentExpiry > Date.now() + 60_000
  ) {
    return {
      uri: current.gemini_file_uri,
      name: typeof current.gemini_file_name === "string" ? current.gemini_file_name : "",
      expiresAt: new Date(currentExpiry).toISOString(),
    };
  }

  const client = getClient();
  if (typeof current.gemini_file_name === "string" && current.gemini_file_name) {
    try {
      await client.files.delete({ name: current.gemini_file_name });
    } catch {
      // Expired Files API references may already have been removed by Google.
    }
  }

  const { data: pdf, error: downloadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(storagePath);
  if (downloadError || !pdf) {
    throw new Error("No se pudo recuperar el PDF privado para la lectura multimodal.");
  }
  if (pdf.size < 8 || pdf.size > 50_000_000) {
    throw new Error("El PDF supera el límite admitido por el almacenamiento y la lectura multimodal (50 MB).");
  }

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
    throw new Error("El archivo privado no tiene una cabecera PDF válida.");
  }
  const fileBlob = new Blob([bytes], { type: "application/pdf" });
  const uploaded = await client.files.upload({
    file: fileBlob,
    config: {
      displayName: ("Orby-Document-" + documentId).slice(0, 180),
      mimeType: "application/pdf",
    },
  });

  if (!uploaded.uri || !uploaded.name) {
    throw new Error("Gemini no devolvió una referencia válida para el PDF.");
  }

  let ready = uploaded;
  for (let attempt = 0; attempt < FILE_PROCESSING_ATTEMPTS && ready.state === "PROCESSING"; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    ready = await client.files.get({ name: uploaded.name });
  }
  if (ready.state && ready.state !== "ACTIVE") {
    throw new Error("Gemini no pudo preparar el PDF para lectura multimodal (estado " + ready.state + ").");
  }

  const expiresAt = new Date(Date.now() + FILE_TTL_MS).toISOString();
  const { error: saveError } = await supabaseAdmin
    .from("orby_knowledge_documents")
    .update({
      gemini_file_uri: uploaded.uri,
      gemini_file_name: uploaded.name,
      gemini_file_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);
  if (saveError) {
    try { await client.files.delete({ name: uploaded.name }); } catch { /* best-effort cleanup */ }
    throw new Error("No se pudo guardar la referencia temporal del PDF en Orby.");
  }

  return { uri: uploaded.uri, name: uploaded.name, expiresAt };
}

export async function deleteOrbyGeminiDocumentFile(name: string | null | undefined): Promise<void> {
  if (!name) return;
  const client = getClient();
  try {
    await client.files.delete({ name });
  } catch (error) {
    console.warn("[Orby Knowledge] Gemini temporary file cleanup failed.", {
      message: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    });
  }
}

const MAX_ORBY_GENERATED_IMAGE_BYTES = 1024 * 1024;
const MAX_ORBY_IMAGE_EDGE = 1440;

/**
 * Flux output is stored as a private WebP asset rather than a data URL in the
 * message history. Resize/re-encode in the browser to stay inside the existing
 * 1 MB Supabase storage limit without introducing another image provider.
 */
export async function prepareOrbyGeneratedImageUpload(dataUrl: string): Promise<File> {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("La ilustración generada no tiene un formato de imagen válido.");
  }

  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("No se pudo leer la ilustración generada.");
  const source = await response.blob();
  if (!source.type.startsWith("image/")) throw new Error("El resultado de imagen no es válido.");

  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, MAX_ORBY_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("No se pudo preparar la ilustración para guardarla.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.84, 0.76, 0.66, 0.56, 0.46]) {
      const encoded = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });
      if (encoded && encoded.size > 0 && encoded.size <= MAX_ORBY_GENERATED_IMAGE_BYTES) {
        return new File([encoded], "orby-live-illustration.webp", {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    }

    throw new Error("La ilustración sigue superando 1 MB después de optimizarla. Puedes verla en esta clase, pero no guardarla en el historial.");
  } finally {
    bitmap.close();
  }
}

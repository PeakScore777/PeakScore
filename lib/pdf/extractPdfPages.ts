import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { pathToFileURL } from "url";

const workerPath = path.join(
  process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.mjs"
);

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pathToFileURL(workerPath).toString();

export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pages: PdfPageText[];
  totalPages: number;
  hasExtractableText: boolean;
  totalCharacters: number;
}

/**
 * Extrae el texto del PDF página por página.
 *
 * Esta función NO usa IA.
 *
 * Su objetivo es:
 * 1. Separar el documento por páginas.
 * 2. Extraer el texto disponible localmente.
 * 3. Detectar si el PDF parece escaneado.
 */
export async function extractPdfPages(
  pdfBuffer: Buffer
): Promise<PdfExtractionResult> {
  console.log(
    "[PDF Extractor] Iniciando extracción local..."
  );

  /*
   * IMPORTANTE:
   *
   * En el servidor de Next.js queremos evitar que PDF.js
   * intente resolver un Web Worker como si estuviera
   * ejecutándose en el navegador.
   */
  const loadingTask =
    pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });

  const pdf =
    await loadingTask.promise;

  const pages: PdfPageText[] = [];

  let totalCharacters = 0;

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    console.log(
      `[PDF Extractor] Extrayendo página ${pageNumber}/${pdf.numPages}`
    );

    const page =
      await pdf.getPage(pageNumber);

    const textContent =
      await page.getTextContent();

    const text =
      textContent.items
        .map((item) => {
          if (!("str" in item)) {
            return "";
          }

          /*
          * PDF.js indica mediante hasEOL cuando
          * un fragmento termina en salto de línea.
          *
          * Conservamos esa información porque luego
          * necesitamos detectar correctamente dónde
          * comienzan las preguntas.
          */
         return item.hasEOL
        ? `${item.str}\n`
        : `${item.str} `;
    })
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

    totalCharacters +=
      text.length;

    pages.push({
      pageNumber,
      text,
    });
  }

  /**
   * Un PDF escaneado normalmente tendrá muy poco
   * o ningún texto extraíble.
   */
  const hasExtractableText =
    totalCharacters >=
    pdf.numPages * 50;

  console.log(
    "[PDF Extractor] Extracción terminada."
  );

  console.log(
    `[PDF Extractor] Total páginas: ${pdf.numPages}`
  );

  console.log(
    `[PDF Extractor] Caracteres extraídos: ${totalCharacters}`
  );

  console.log(
    `[PDF Extractor] Tiene texto extraíble: ${hasExtractableText}`
  );

  return {
    pages,
    totalPages:
      pdf.numPages,
    hasExtractableText,
    totalCharacters,
  };
}
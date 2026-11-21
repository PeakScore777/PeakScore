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

const MAX_PDF_PAGES = 500;
const MAX_TEXT_PER_PAGE = 200_000;
const MAX_TOTAL_TEXT_CHARACTERS = 5_000_000;

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
 * Extract text from untrusted PDFs locally.
 *
 * Resource guards:
 * - A hard page-count ceiling prevents extreme page-count documents.
 * - A per-page and aggregate text ceiling bounds JS memory and downstream work.
 * - Pages and the PDF.js loading task are explicitly cleaned up.
 * - PDF JavaScript evaluation is disabled; this endpoint extracts text only.
 */
export async function extractPdfPages(
  pdfBuffer: Buffer
): Promise<PdfExtractionResult> {
  if (pdfBuffer.length < 8 || pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("El archivo no contiene una cabecera PDF válida.");
  }

  console.log("[PDF Extractor] Iniciando extracción local...");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useWorkerFetch: false,
    useSystemFonts: true,
    enableXfa: false,
    stopAtErrors: true,
  });

  let pdf: Awaited<typeof loadingTask.promise> | null = null;

  try {
    pdf = await loadingTask.promise;

    if (!Number.isSafeInteger(pdf.numPages) || pdf.numPages < 1 || pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(
        "El PDF supera el límite seguro de " + MAX_PDF_PAGES + " páginas."
      );
    }

    const pages: PdfPageText[] = [];
    let totalCharacters = 0;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);

      try {
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item) => {
            if (!("str" in item)) return "";
            return item.hasEOL ? `${item.str}\n` : `${item.str} `;
          })
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();

        if (text.length > MAX_TEXT_PER_PAGE) {
          throw new Error(
            "La página " + pageNumber + " supera el límite seguro de texto."
          );
        }

        totalCharacters += text.length;
        if (totalCharacters > MAX_TOTAL_TEXT_CHARACTERS) {
          throw new Error(
            "El PDF supera el límite seguro de texto extraíble."
          );
        }

        pages.push({ pageNumber, text });
      } finally {
        page.cleanup();
      }
    }

    const hasExtractableText = totalCharacters >= pdf.numPages * 50;

    console.log("[PDF Extractor] Extracción terminada.");
    console.log(
      `[PDF Extractor] Total páginas: ${pdf.numPages}; caracteres: ${totalCharacters}; texto extraíble: ${hasExtractableText}`
    );

    return {
      pages,
      totalPages: pdf.numPages,
      hasExtractableText,
      totalCharacters,
    };
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {
        // Cleanup failure must not mask a parsing result or validation error.
      }
    }

    try {
      await loadingTask.destroy();
    } catch {
      // The loading task may already have destroyed itself after a parse error.
    }
  }
}

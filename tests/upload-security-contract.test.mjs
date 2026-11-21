import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [guards, importRoute, uploadUrlRoute, knowledgeRoute, pdfExtractor, imageSanitizer] = await Promise.all([
  readFile(new URL("../lib/security/request-guards.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/import.pdf/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/admin/orby/knowledge/upload-url/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/admin/orby/knowledge/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/pdf/extractPdfPages.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/security/sanitize-raster-image.ts", import.meta.url), "utf8"),
]);

testCase("request body byte ceiling is enforced while streaming", () => {
  assert.match(guards, /export async function readBodyBytesWithinLimit[\s\S]*?request\.body\.getReader\(\)/);
  assert.match(guards, /total \+= value\.byteLength[\s\S]*?if \(total > maxBytes\)[\s\S]*?await reader\.cancel\(\)/);
  assert.match(guards, /export async function readBodyWithinLimit[\s\S]*?readBodyBytesWithinLimit\(request, maxBytes\)/);
  assert.match(guards, /export async function readFormDataWithinLimit[\s\S]*?readBodyBytesWithinLimit\(request, maxBytes\)/);
});

testCase("PDF import bounds multipart uploads before parsing", () => {
  assert.match(importRoute, /readFormDataWithinLimit\(req, MAX_FILE_SIZE \+ 256 \* 1024\)/);
  assert.doesNotMatch(importRoute, /await req\.formData\(\)/);
  assert.match(importRoute, /isSameOriginMutation\(req\)/);
});

testCase("Orby signed PDF upload endpoint is origin, size and rate limited", () => {
  assert.match(uploadUrlRoute, /isSameOriginMutation\(request\)/);
  assert.match(uploadUrlRoute, /readBodyWithinLimit\(request, 8_000\)/);
  assert.match(uploadUrlRoute, /orby_knowledge_upload_url/);
  assert.match(uploadUrlRoute, /rateState\.allowed !== true/);
});

testCase("Orby PDF ingestion is origin, size and rate limited", () => {
  assert.match(knowledgeRoute, /isSameOriginMutation\(request\)/);
  assert.match(knowledgeRoute, /readBodyWithinLimit\(request, 8_000\)/);
  assert.match(knowledgeRoute, /orby_knowledge_ingest/);
  assert.match(knowledgeRoute, /const MAX_PDF_PAGES = 500/);
  assert.match(knowledgeRoute, /extracted\.totalPages > MAX_PDF_PAGES/);
});

testCase("PDF.js extraction disables XFA and fails closed on malformed input", () => {
  assert.match(pdfExtractor, /enableXfa:\s*false/);
  assert.match(pdfExtractor, /stopAtErrors:\s*true/);
  assert.match(pdfExtractor, /pdfjsLib\.getDocument\(/);
  assert.doesNotMatch(pdfExtractor, /enableScripting:\s*true/);
});

testCase("admin image uploads bound multipart bodies before parsing", async () => {
  const [englishImage, gameImage] = await Promise.all([
    readFile(new URL("../app/api/admin/english-question-image/upload/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/game-content/upload/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(englishImage, /readFormDataWithinLimit\(request, MAX_REQUEST_BYTES\)/);
  assert.match(gameImage, /readFormDataWithinLimit\(request, MAX_REQUEST_BYTES\)/);
  assert.doesNotMatch(englishImage, /await request\.formData\(\)/);
  assert.doesNotMatch(gameImage, /await request\.formData\(\)/);
});


testCase("community image sanitizer re-encodes raster files and fails closed if personal metadata survives", () => {
  assert.match(imageSanitizer, /loadImage\(bytes\)/);
  assert.match(imageSanitizer, /createCanvas\(size\.width, size\.height\)/);
  assert.match(imageSanitizer, /canvas\.encode\("png"\)/);
  assert.match(imageSanitizer, /canvas\.encode\("jpeg", 90\)/);
  assert.match(imageSanitizer, /canvas\.encode\("webp", 90\)/);
  assert.match(imageSanitizer, /function hasPersonalMetadata[\s\S]*?EXIF[\s\S]*?XMP/);
  assert.match(imageSanitizer, /EXIF\/GPS/);
  assert.match(imageSanitizer, /hasPersonalMetadata\(output, declaredMime\)/);
  assert.match(imageSanitizer, /No se pudo garantizar la eliminación de metadatos privados/);
  assert.match(imageSanitizer, /\["eXIf", "tEXt", "zTXt", "iTXt", "tIME", "iCCP"\]/);
  assert.match(imageSanitizer, /\["EXIF", "XMP ", "ICCP"\]/);
});

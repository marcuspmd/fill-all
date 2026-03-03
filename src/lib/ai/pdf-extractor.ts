/**
 * PDF rendering using PDF.js.
 *
 * The worker URL MUST be imported statically so Vite bundles the file
 * as an extension asset and makes it reachable at chrome-extension:// origin.
 * A dynamic `new URL(…, import.meta.url)` inside an async function is NOT
 * statically analyzed by Vite and would leave the worker file out of dist/.
 */

import { createLogger } from "@/lib/logger";
// Static ?url import — Vite copies the worker to assets/ and returns its URL.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const log = createLogger("PdfExtractor");

let workerConfigured = false;

async function ensureWorker(): Promise<void> {
  if (workerConfigured) return;
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  log.debug(`PDF.js worker configurado: ${pdfWorkerUrl}`);
  workerConfigured = true;
}

/**
 * Renders the first `maxPages` pages of a PDF ArrayBuffer to JPEG data URLs
 * using PDF.js + an HTMLCanvasElement (requires DOM — popup/devtools context).
 * These data URLs can later be converted to Blobs and sent as image parts
 * to the Chrome AI Prompt API.
 *
 * @param buffer   - Raw PDF bytes
 * @param maxPages - Maximum number of pages to render (default 3)
 * @param scale    - Render scale / resolution (default 1.5)
 */
export async function renderPdfToImageDataUrls(
  buffer: ArrayBuffer,
  maxPages = 3,
  scale = 1.5,
): Promise<string[]> {
  log.debug(
    `renderPdfToImageDataUrls: buffer=${(buffer.byteLength / 1024).toFixed(1)}KB, maxPages=${maxPages}, scale=${scale}`,
  );
  await ensureWorker();

  const pdfjsLib = await import("pdfjs-dist");
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const pageCount = Math.min(totalPages, maxPages);
  log.debug(
    `PDF carregado: ${totalPages} página(s) total, renderizando ${pageCount}`,
  );

  const dataUrls: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        log.warn(
          `Página ${pageNum}: não foi possível obter contexto 2D do canvas.`,
        );
        page.cleanup();
        continue;
      }

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      log.debug(
        `Página ${pageNum} renderizada: ${canvas.width}×${canvas.height}px, ${(dataUrl.length / 1024).toFixed(1)}KB`,
      );
      dataUrls.push(dataUrl);
      page.cleanup();
    } catch (pageErr) {
      log.warn(`Falha ao renderizar página ${pageNum}:`, pageErr);
    }
  }

  await pdf.cleanup();
  log.info(
    `renderPdfToImageDataUrls concluído: ${dataUrls.length}/${pageCount} páginas renderizadas.`,
  );
  return dataUrls;
}

/**
 * Extracts all text content from a PDF ArrayBuffer.
 * Returns the concatenated text of all pages, trimmed to `maxChars`.
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer,
  maxChars = 12000,
): Promise<string> {
  log.debug(
    `extractTextFromPdf: buffer=${(buffer.byteLength / 1024).toFixed(1)}KB, maxChars=${maxChars}`,
  );
  await ensureWorker();

  const pdfjsLib = await import("pdfjs-dist");

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  log.debug(`PDF carregado para extração: ${pdf.numPages} página(s)`);
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = (content.items as Array<{ str?: string }>)
        .filter((item) => typeof item.str === "string")
        .map((item) => item.str!)
        .join(" ")
        .replace(/ {2,}/g, " ")
        .trim();

      log.debug(`Página ${pageNum}: ${pageText.length} caracteres extraidos.`);
      if (pageText) textParts.push(pageText);
      page.cleanup();
    } catch (pageErr) {
      log.warn(`Falha ao extrair texto da página ${pageNum}:`, pageErr);
    }
  }

  await pdf.cleanup();

  const result = textParts.join("\n\n").slice(0, maxChars);
  log.info(
    `extractTextFromPdf concluído: ${result.length} chars (de ${textParts.length} página(s) com texto).`,
  );
  return result;
}

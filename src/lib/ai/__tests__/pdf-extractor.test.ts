// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the static worker url import used in the module
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "worker://pdf.worker",
}));

describe("pdf-extractor", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("extractTextFromPdf returns concatenated page text", async () => {
    // Use doMock so the mock is applied before dynamic import
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: async (n: number) => ({
            getTextContent: async () => ({
              items: [{ str: `page${n}-a` }, { str: `page${n}-b` }],
            }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");

    const buf = new ArrayBuffer(8);
    const txt = await mod.extractTextFromPdf(buf, 1000);
    expect(txt).toContain("page1-a");
    expect(txt).toContain("page2-b");
  });

  it("extractTextFromPdf truncates result to maxChars", async () => {
    vi.resetModules();
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({
              items: [{ str: "A".repeat(200) }],
            }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    const txt = await mod.extractTextFromPdf(buf, 50);
    expect(txt.length).toBe(50);
  });

  it("extractTextFromPdf skips pages with empty text", async () => {
    vi.resetModules();
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: async (n: number) => ({
            getTextContent: async () => ({
              // Page 1 has only whitespace (results in empty after trim)
              // Page 2 has real text
              items: n === 1 ? [{ str: "   " }] : [{ str: "texto real" }],
            }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    const txt = await mod.extractTextFromPdf(buf, 1000);
    expect(txt).toBe("texto real");
  });

  it("extractTextFromPdf handles page extraction errors gracefully", async () => {
    vi.resetModules();
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: async (n: number) => {
            if (n === 1) throw new Error("falha na página 1");
            return {
              getTextContent: async () => ({
                items: [{ str: "página 2 OK" }],
              }),
              cleanup: () => {},
            };
          },
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    const txt = await mod.extractTextFromPdf(buf, 1000);
    // Page 1 fails but page 2 should still be extracted
    expect(txt).toContain("página 2 OK");
  });

  it("renderPdfToImageDataUrls returns data urls for pages with canvas context", async () => {
    vi.resetModules();

    // Mock canvas.getContext to return a working 2D context
    const renderMock = vi.fn().mockReturnValue({ promise: Promise.resolve() });
    const ctxMock = { fillRect: vi.fn() };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const el = origCreateElement("canvas");
        vi.spyOn(el, "getContext").mockReturnValue(ctxMock as any);
        vi.spyOn(el, "toDataURL").mockReturnValue(
          "data:image/jpeg;base64,FAKE",
        );
        return el;
      }
      return origCreateElement(tag);
    });

    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getViewport: ({ scale }: { scale: number }) => ({
              width: 10 * scale,
              height: 5 * scale,
            }),
            render: renderMock,
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");

    const buf = new ArrayBuffer(16);
    const urls = await mod.renderPdfToImageDataUrls(buf, 1, 1);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("data:image/jpeg;base64,FAKE");

    vi.restoreAllMocks();
  });

  it("renderPdfToImageDataUrls skips pages when canvas context is null", async () => {
    vi.resetModules();

    // happy-dom returns null for getContext("2d") by default (no actual rendering)
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: async () => ({
            getViewport: ({ scale }: { scale: number }) => ({
              width: 10 * scale,
              height: 5 * scale,
            }),
            render: () => ({ promise: Promise.resolve() }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(16);
    const urls = await mod.renderPdfToImageDataUrls(buf, 2, 1);
    // All pages skipped due to null context (default in happy-dom)
    expect(urls).toHaveLength(0);
  });

  it("extractTextFromPdf filters items without str property", async () => {
    vi.resetModules();
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({
              // Mix of items with and without str
              items: [
                { str: "texto válido" },
                { width: 10 },
                { markedContent: true },
                { str: "outro" },
              ],
            }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    const txt = await mod.extractTextFromPdf(buf, 1000);
    expect(txt).toContain("texto válido");
    expect(txt).toContain("outro");
  });

  it("ensureWorker is idempotent (workerConfigured early return branch)", async () => {
    vi.resetModules();
    const pdfMockFn = vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({ items: [{ str: "x" }] }),
          cleanup: () => {},
        }),
        cleanup: async () => {},
      }),
    });

    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: pdfMockFn,
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    // First call configures the worker
    await mod.extractTextFromPdf(buf, 100);
    // Second call hits the `if (workerConfigured) return;` early-return branch
    await mod.extractTextFromPdf(buf, 100);
    // Both calls succeed; pdfjs was initialised only once per module instance
    expect(pdfMockFn).toHaveBeenCalledTimes(2);
  });

  it("extractTextFromPdf uses default maxChars and renderPdfToImageDataUrls uses default maxPages/scale", async () => {
    vi.resetModules();
    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({ items: [{ str: "default" }] }),
            getViewport: ({ scale }: { scale: number }) => ({
              width: 10 * scale,
              height: 5 * scale,
            }),
            render: () => ({ promise: Promise.resolve() }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(8);
    // Call without optional arguments to cover default parameter branches
    const txt = await mod.extractTextFromPdf(buf);
    expect(txt).toContain("default");
    const urls = await mod.renderPdfToImageDataUrls(buf);
    expect(Array.isArray(urls)).toBe(true);
  });

  it("renderPdfToImageDataUrls handles page render errors gracefully", async () => {
    vi.resetModules();

    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: async (n: number) => {
            if (n === 1) throw new Error("falha render página 1");
            return {
              getViewport: ({ scale }: { scale: number }) => ({
                width: 10 * scale,
                height: 5 * scale,
              }),
              render: () => ({ promise: Promise.resolve() }),
              cleanup: () => {},
            };
          },
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");
    const buf = new ArrayBuffer(16);
    // Should not throw, even when page 1 errors
    await expect(
      mod.renderPdfToImageDataUrls(buf, 2, 1),
    ).resolves.toBeDefined();
  });
});

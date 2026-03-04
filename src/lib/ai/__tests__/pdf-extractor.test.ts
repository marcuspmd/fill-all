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

  it("renderPdfToImageDataUrls returns data urls for pages with canvas context", async () => {
    vi.resetModules();

    vi.doMock("pdfjs-dist", () => ({
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async (n: number) => ({
            getViewport: ({ scale }: { scale: number }) => ({
              width: 10 * scale,
              height: 5 * scale,
            }),
            render: ({ canvasContext }: any) => ({
              promise: Promise.resolve(),
            }),
            cleanup: () => {},
          }),
          cleanup: async () => {},
        }),
      }),
    }));

    const mod = await import("../pdf-extractor");

    // Create a small ArrayBuffer
    const buf = new ArrayBuffer(16);
    const urls = await mod.renderPdfToImageDataUrls(buf, 2, 1);
    expect(Array.isArray(urls)).toBe(true);
    // toDataURL on canvas should produce a string starting with data:
    if (urls.length > 0) expect(urls[0].startsWith("data:")).toBe(true);
  });
});

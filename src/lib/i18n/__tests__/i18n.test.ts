// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

// Reset module state between tests since i18n stores _catalog in module scope
let initI18n: (typeof import("@/lib/i18n"))["initI18n"];
let t: (typeof import("@/lib/i18n"))["t"];
let localizeHTML: (typeof import("@/lib/i18n"))["localizeHTML"];

describe("i18n", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();

    // Stub chrome.runtime.getURL
    vi.stubGlobal("chrome", {
      ...chrome,
      runtime: {
        ...chrome.runtime,
        getURL: vi.fn((path: string) => `chrome-extension://abc/${path}`),
      },
      i18n: {
        getMessage: vi.fn((key: string) => `native:${key}`),
      },
    });

    const mod = await import("@/lib/i18n");
    initI18n = mod.initI18n;
    t = mod.t;
    localizeHTML = mod.localizeHTML;
  });

  // ── initI18n ────────────────────────────────────────────────────────────────

  describe("initI18n", () => {
    it("delegates to chrome.i18n when lang is auto", async () => {
      // Arrange & Act
      await initI18n("auto");

      // Assert — t() should fall through to chrome.i18n.getMessage
      const result = t("someKey");
      expect(result).toBe("native:someKey");
    });

    it("loads catalog from _locales JSON for a specific lang", async () => {
      // Arrange
      const catalog = {
        greeting: { message: "Olá" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );

      // Act
      await initI18n("pt_BR");

      // Assert
      expect(t("greeting")).toBe("Olá");
      expect(fetch).toHaveBeenCalledWith(
        "chrome-extension://abc/_locales/pt_BR/messages.json",
      );
    });

    it("falls back to null catalog when fetch fails", async () => {
      // Arrange
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      // Act
      await initI18n("en");

      // Assert — should fall through to chrome.i18n
      expect(t("key")).toBe("native:key");
    });

    it("falls back to null catalog when response is not ok", async () => {
      // Arrange
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

      // Act
      await initI18n("es");

      // Assert
      expect(t("key")).toBe("native:key");
    });
  });

  // ── t() ─────────────────────────────────────────────────────────────────────

  describe("t", () => {
    it("returns the key itself when chrome.i18n returns empty", async () => {
      // Arrange
      (chrome.i18n.getMessage as ReturnType<typeof vi.fn>).mockReturnValue("");
      await initI18n("auto");

      // Act & Assert
      expect(t("missingKey")).toBe("missingKey");
    });

    it("resolves named placeholders from catalog", async () => {
      // Arrange
      const catalog = {
        welcome: {
          message: "Hello $name$!",
          placeholders: {
            name: { content: "$1" },
          },
        },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act & Assert
      expect(t("welcome", "World")).toBe("Hello World!");
    });

    it("resolves named placeholders with array substitutions", async () => {
      // Arrange
      const catalog = {
        info: {
          message: "$first$ and $second$",
          placeholders: {
            first: { content: "$1" },
            second: { content: "$2" },
          },
        },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act & Assert
      expect(t("info", ["A", "B"])).toBe("A and B");
    });

    it("resolves positional placeholders when no named placeholders exist", async () => {
      // Arrange
      const catalog = {
        msg: {
          message: "Item $1 of $2",
        },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act & Assert
      expect(t("msg", ["3", "10"])).toBe("Item 3 of 10");
    });

    it("keeps unresolved placeholders when substitution index is out of range", async () => {
      // Arrange
      const catalog = {
        msg: { message: "Value: $1 and $2" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act — only 1 substitution provided but 2 expected
      expect(t("msg", ["only"])).toBe("Value: only and $2");
    });

    it("returns key from catalog with no substitutions", async () => {
      // Arrange
      const catalog = {
        simple: { message: "Simple text" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act & Assert
      expect(t("simple")).toBe("Simple text");
    });

    it("falls back to chrome.i18n when key is not in catalog", async () => {
      // Arrange
      const catalog = {
        exists: { message: "I exist" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act — key not in catalog
      expect(t("notInCatalog")).toBe("native:notInCatalog");
    });

    it("keeps unresolved named placeholders when placeholder index out of range", async () => {
      // Arrange
      const catalog = {
        msg: {
          message: "Hello $name$ and $extra$",
          placeholders: {
            name: { content: "$1" },
            extra: { content: "$3" },
          },
        },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("en");

      // Act — only 1 substitution but $3 needed for extra
      expect(t("msg", ["World"])).toBe("Hello World and $extra$");
    });
  });

  // ── localizeHTML ────────────────────────────────────────────────────────────

  describe("localizeHTML", () => {
    it("sets textContent for elements with data-i18n", async () => {
      // Arrange
      const catalog = {
        title: { message: "Meu Título" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("pt_BR");

      const div = document.createElement("div");
      const h1 = document.createElement("h1");
      h1.dataset.i18n = "title";
      div.appendChild(h1);

      // Act
      localizeHTML(div);

      // Assert
      expect(h1.textContent).toBe("Meu Título");
    });

    it("sets title attribute for elements with data-i18n-title", async () => {
      // Arrange
      const catalog = {
        tip: { message: "Dica" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("pt_BR");

      const div = document.createElement("div");
      const span = document.createElement("span");
      span.dataset.i18nTitle = "tip";
      div.appendChild(span);

      // Act
      localizeHTML(div);

      // Assert
      expect(span.title).toBe("Dica");
    });

    it("sets placeholder for input elements with data-i18n-placeholder", async () => {
      // Arrange
      const catalog = {
        hint: { message: "Digite aqui" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("pt_BR");

      const div = document.createElement("div");
      const input = document.createElement("input");
      input.dataset.i18nPlaceholder = "hint";
      div.appendChild(input);

      // Act
      localizeHTML(div);

      // Assert
      expect(input.placeholder).toBe("Digite aqui");
    });

    it("sets aria-label for elements with data-i18n-aria-label", async () => {
      // Arrange
      const catalog = {
        label: { message: "Fechar" },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(catalog),
        }),
      );
      await initI18n("pt_BR");

      const div = document.createElement("div");
      const btn = document.createElement("button");
      btn.dataset.i18nAriaLabel = "label";
      div.appendChild(btn);

      // Act
      localizeHTML(div);

      // Assert
      expect(btn.getAttribute("aria-label")).toBe("Fechar");
    });
  });
});

/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  extractSmartSelectors,
  pickBestSelector,
  getStableClasses,
  buildCSSPath,
} from "@/lib/e2e-export/smart-selector";

function createElement(
  tag: string,
  attrs: Record<string, string> = {},
  parent?: Element,
): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  (parent ?? document.body).appendChild(el);
  return el;
}

describe("Smart Selector Extractor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("extractSmartSelectors", () => {
    it("prioritises data-testid over other strategies", () => {
      const el = createElement("input", {
        "data-testid": "email-field",
        id: "email",
        name: "email",
      });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("data-testid");
      expect(selectors[0].value).toContain("data-testid");
      expect(selectors[0].value).toContain("email-field");
    });

    it("supports data-test-id attribute", () => {
      const el = createElement("input", { "data-test-id": "user-name" });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("data-testid");
      expect(selectors[0].value).toContain("data-test-id");
    });

    it("supports data-cy attribute", () => {
      const el = createElement("input", { "data-cy": "submit-btn" });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("data-testid");
      expect(selectors[0].value).toContain("data-cy");
    });

    it("supports data-test attribute", () => {
      const el = createElement("input", { "data-test": "phone" });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("data-testid");
      expect(selectors[0].value).toContain("data-test");
    });

    it("extracts aria-label selector", () => {
      const el = createElement("input", { "aria-label": "First Name" });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("aria-label");
      expect(selectors[0].value).toContain("aria-label");
      expect(selectors[0].value).toContain("First");
    });

    it("extracts aria-labelledby selector", () => {
      const label = createElement("label", { id: "lbl-email" });
      label.textContent = "E-mail Address";
      const el = createElement("input", { "aria-labelledby": "lbl-email" });

      const selectors = extractSmartSelectors(el);
      expect(selectors[0].strategy).toBe("aria-label");
      expect(selectors[0].value).toContain("aria-labelledby");
    });

    it("falls through when aria-labelledby references non-existent element", () => {
      // aria-labelledby points to an id that doesn't exist in the document
      const el = createElement("input", {
        "aria-labelledby": "nonexistent-id",
        id: "my-input",
      });

      const selectors = extractSmartSelectors(el);
      // Should not produce an aria-labelledby selector; falls back to id/css
      const ariaLabelledBySelector = selectors.find((s) =>
        s.value.includes("aria-labelledby"),
      );
      expect(ariaLabelledBySelector).toBeUndefined();
      expect(selectors.length).toBeGreaterThan(0);
    });

    it("falls through when aria-labelledby element has empty text", () => {
      const label = createElement("label", { id: "lbl-empty" });
      label.textContent = "   ";
      const el = createElement("input", { "aria-labelledby": "lbl-empty" });

      const selectors = extractSmartSelectors(el);
      // Label has only whitespace, so aria-labelledby strategy should not appear
      const ariaLabelledBySelector = selectors.find((s) =>
        s.value.includes("aria-labelledby"),
      );
      expect(ariaLabelledBySelector).toBeUndefined();
    });

    it("extracts role selector with aria-label name", () => {
      const el = createElement("div", {
        role: "textbox",
        "aria-label": "Message",
      });

      const selectors = extractSmartSelectors(el);
      const roleSelector = selectors.find((s) => s.strategy === "role");
      expect(roleSelector).toBeDefined();
      expect(roleSelector!.value).toContain("role");
      expect(roleSelector!.value).toContain("textbox");
    });

    it("extracts role selector without name when aria-label and name are absent", () => {
      const el = createElement("div", { role: "combobox" });

      const selectors = extractSmartSelectors(el);
      const roleSelector = selectors.find((s) => s.strategy === "role");
      expect(roleSelector).toBeDefined();
      expect(roleSelector!.value).toBe('[role="combobox"]');
      expect(roleSelector!.description).toBe('role="combobox"');
    });

    it("extracts name attribute selector", () => {
      const el = createElement("input", { name: "username" });

      const selectors = extractSmartSelectors(el);
      const nameSelector = selectors.find((s) => s.strategy === "name");
      expect(nameSelector).toBeDefined();
      expect(nameSelector!.value).toBe('input[name="username"]');
    });

    it("extracts id selector for clean IDs", () => {
      const el = createElement("input", { id: "email-input" });

      const selectors = extractSmartSelectors(el);
      const idSelector = selectors.find((s) => s.strategy === "id");
      expect(idSelector).toBeDefined();
      expect(idSelector!.value).toBe("#email-input");
    });

    it("skips auto-generated IDs (react :r pattern)", () => {
      const el = createElement("input", { id: ":r0:" });

      const selectors = extractSmartSelectors(el);
      const idSelector = selectors.find((s) => s.strategy === "id");
      expect(idSelector).toBeUndefined();
    });

    it("extracts placeholder selector", () => {
      const el = createElement("input", { placeholder: "Digite seu CPF" });

      const selectors = extractSmartSelectors(el);
      const placeholderSel = selectors.find(
        (s) => s.strategy === "placeholder",
      );
      expect(placeholderSel).toBeDefined();
      expect(placeholderSel!.value).toContain("placeholder");
    });

    it("always includes CSS fallback as last selector", () => {
      const el = createElement("input", {});

      const selectors = extractSmartSelectors(el);
      expect(selectors.length).toBeGreaterThanOrEqual(1);
      expect(selectors[selectors.length - 1].strategy).toBe("selector-path");
    });

    it("returns multiple selectors ordered by priority", () => {
      const el = createElement("input", {
        "data-testid": "cpf",
        "aria-label": "CPF",
        name: "cpf",
        id: "cpf-field",
        placeholder: "000.000.000-00",
      });

      const selectors = extractSmartSelectors(el);
      expect(selectors.length).toBeGreaterThanOrEqual(4);

      const strategies = selectors.map((s) => s.strategy);
      const dataIdx = strategies.indexOf("data-testid");
      const ariaIdx = strategies.indexOf("aria-label");
      const nameIdx = strategies.indexOf("name");
      const idIdx = strategies.indexOf("id");

      expect(dataIdx).toBeLessThan(ariaIdx);
      expect(ariaIdx).toBeLessThan(nameIdx);
      expect(nameIdx).toBeLessThan(idIdx);
    });

    it("deduplicates selectors with same value", () => {
      const el = createElement("input", {
        "data-testid": "email",
      });

      const selectors = extractSmartSelectors(el);
      const values = selectors.map((s) => s.value);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it("builds nested CSS fallback for deep elements", () => {
      const wrapper = createElement("div", {});
      const form = createElement("form", {}, wrapper);
      const el = createElement("input", {}, form);

      const selectors = extractSmartSelectors(el);
      const fallback = selectors.find((s) => s.strategy === "selector-path");
      expect(fallback).toBeDefined();
      expect(fallback!.value).toContain(">");
    });

    it("builds CSS fallback stopping at ancestor with id", () => {
      const section = createElement("section", { id: "main-section" });
      const div = createElement("div", {}, section);
      const el = createElement("button", {}, div);

      const selectors = extractSmartSelectors(el);
      const fallback = selectors.find((s) => s.strategy === "selector-path");
      expect(fallback).toBeDefined();
      expect(fallback!.value).toContain("#main-section");
    });

    it("builds CSS fallback with nth-of-type for sibling elements", () => {
      const container = createElement("div", {});
      createElement("input", {}, container);
      const el = createElement("input", {}, container);

      const selectors = extractSmartSelectors(el);
      const fallback = selectors.find((s) => s.strategy === "selector-path");
      expect(fallback).toBeDefined();
      expect(fallback!.value).toContain("nth-of-type");
    });
  });

  describe("pickBestSelector", () => {
    it("returns first smart selector when available", () => {
      const result = pickBestSelector(
        [
          { value: '[data-testid="x"]', strategy: "data-testid" },
          { value: "#fallback", strategy: "css" },
        ],
        "#default",
      );
      expect(result).toBe('[data-testid="x"]');
    });

    it("returns fallback CSS when selectors array is empty", () => {
      const result = pickBestSelector([], "#default");
      expect(result).toBe("#default");
    });

    it("returns fallback CSS when selectors is undefined", () => {
      const result = pickBestSelector(undefined, "#default");
      expect(result).toBe("#default");
    });
  });

  // ── getStableClasses ───────────────────────────────────────────────

  describe("getStableClasses", () => {
    it("returns stable semantic classes", () => {
      const el = createElement("button", { class: "btn btn-primary" });
      expect(getStableClasses(el)).toEqual(["btn", "btn-primary"]);
    });

    it("filters out CSS-in-JS prefixes", () => {
      const el = createElement("div", {
        class: "css-1a2b3c sc-abc123 emotion-12345 my-card",
      });
      expect(getStableClasses(el)).toEqual(["my-card"]);
    });

    it("filters out underscore-prefixed (CSS modules) classes", () => {
      const el = createElement("div", {
        class: "_container _wrapper real-class",
      });
      expect(getStableClasses(el)).toEqual(["real-class"]);
    });

    it("filters out hex-like hash classes", () => {
      const el = createElement("div", { class: "a3b2c1f0 nav-bar" });
      expect(getStableClasses(el)).toEqual(["nav-bar"]);
    });

    it("returns at most 3 classes", () => {
      const el = createElement("div", {
        class: "one two three four five",
      });
      expect(getStableClasses(el)).toHaveLength(3);
    });

    it("returns empty array when no stable classes", () => {
      const el = createElement("div", { class: "css-1abc sc-xyz" });
      expect(getStableClasses(el)).toEqual([]);
    });
  });

  // ── tryClasses strategy ────────────────────────────────────────────

  describe("extracts classes selector", () => {
    it("extracts classes selector for element with stable classes", () => {
      const el = createElement("button", { class: "btn btn-submit" });

      const selectors = extractSmartSelectors(el);
      const classesSel = selectors.find((s) => s.strategy === "classes");
      expect(classesSel).toBeDefined();
      expect(classesSel!.value).toBe("button.btn.btn-submit");
    });

    it("does not extract classes selector when no stable classes exist", () => {
      const el = createElement("div", { class: "css-abc sc-xyz" });

      const selectors = extractSmartSelectors(el);
      const classesSel = selectors.find((s) => s.strategy === "classes");
      expect(classesSel).toBeUndefined();
    });

    it("classes selector appears after id and before placeholder in priority order", () => {
      const el = createElement("input", {
        id: "my-field",
        class: "form-control",
        placeholder: "Enter value",
      });

      const selectors = extractSmartSelectors(el);
      const strategies = selectors.map((s) => s.strategy);
      const idIdx = strategies.indexOf("id");
      const classesIdx = strategies.indexOf("classes");
      const placeholderIdx = strategies.indexOf("placeholder");

      expect(idIdx).toBeLessThan(classesIdx);
      expect(classesIdx).toBeLessThan(placeholderIdx);
    });
  });

  // ── buildCSSPath ───────────────────────────────────────────────────

  describe("buildCSSPath", () => {
    it("returns id selector when element has id", () => {
      const el = createElement("div", { id: "main" });
      expect(buildCSSPath(el)).toBe("#main");
    });

    it("returns path for element without id", () => {
      const parent = createElement("section", {});
      const el = createElement("button", {}, parent);
      const path = buildCSSPath(el);
      expect(path).toContain("button");
      expect(path).toContain("section");
    });

    it("returns unique nth-of-type path for sibling elements", () => {
      const container = createElement("div", {});
      createElement("button", {}, container);
      const el = createElement("button", {}, container);

      const path = buildCSSPath(el);
      expect(path).toContain("nth-of-type(2)");
    });
  });
});

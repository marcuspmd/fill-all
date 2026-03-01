/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  extractSmartSelectors,
  pickBestSelector,
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
      expect(selectors[selectors.length - 1].strategy).toBe("css");
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
      const fallback = selectors.find((s) => s.strategy === "css");
      expect(fallback).toBeDefined();
      expect(fallback!.value).toContain(">");
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
});

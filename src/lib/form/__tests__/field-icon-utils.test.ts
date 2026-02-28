// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./detectors/classifiers", () => ({
  DEFAULT_PIPELINE: {
    run: vi.fn().mockReturnValue({
      type: "email",
      method: "keyword",
      confidence: 0.9,
    }),
  },
}));

vi.mock("./extractors", () => ({
  getUniqueSelector: vi.fn().mockReturnValue("#test-input"),
  findLabel: vi.fn().mockReturnValue("Email"),
  buildSignals: vi.fn().mockReturnValue("email"),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  ALL_FIELD_TYPES,
  buildFormField,
  escHtml,
  isFillableField,
} from "../field-icon-utils";

describe("field-icon-utils", () => {
  describe("isFillableField", () => {
    it("returns true for textarea", () => {
      const el = document.createElement("textarea");
      expect(isFillableField(el)).toBe(true);
    });

    it("returns true for select", () => {
      const el = document.createElement("select");
      expect(isFillableField(el)).toBe(true);
    });

    it("returns true for text input", () => {
      const el = document.createElement("input");
      el.type = "text";
      expect(isFillableField(el)).toBe(true);
    });

    it("returns true for email input", () => {
      const el = document.createElement("input");
      el.type = "email";
      expect(isFillableField(el)).toBe(true);
    });

    it("returns true for password input", () => {
      const el = document.createElement("input");
      el.type = "password";
      expect(isFillableField(el)).toBe(true);
    });

    it("returns false for hidden input", () => {
      const el = document.createElement("input");
      el.type = "hidden";
      expect(isFillableField(el)).toBe(false);
    });

    it("returns false for submit input", () => {
      const el = document.createElement("input");
      el.type = "submit";
      expect(isFillableField(el)).toBe(false);
    });

    it("returns false for button input", () => {
      const el = document.createElement("input");
      el.type = "button";
      expect(isFillableField(el)).toBe(false);
    });

    it("returns false for disabled input", () => {
      const el = document.createElement("input");
      el.type = "text";
      el.disabled = true;
      expect(isFillableField(el)).toBe(false);
    });

    it("returns false for a plain div", () => {
      const el = document.createElement("div");
      expect(isFillableField(el)).toBe(false);
    });
  });

  describe("escHtml", () => {
    it("escapes ampersands", () => {
      expect(escHtml("a & b")).toBe("a &amp; b");
    });

    it("escapes less-than signs", () => {
      expect(escHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("escapes double quotes", () => {
      expect(escHtml('say "hello"')).toBe("say &quot;hello&quot;");
    });

    it("returns unchanged string when no special chars", () => {
      expect(escHtml("hello world")).toBe("hello world");
    });

    it("escapes multiple special chars", () => {
      expect(escHtml('<a href="x">link & more</a>')).toBe(
        "&lt;a href=&quot;x&quot;&gt;link &amp; more&lt;/a&gt;",
      );
    });
  });

  describe("ALL_FIELD_TYPES", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(ALL_FIELD_TYPES)).toBe(true);
      expect(ALL_FIELD_TYPES.length).toBeGreaterThan(0);
    });

    it("includes common field types", () => {
      expect(ALL_FIELD_TYPES).toContain("email");
      expect(ALL_FIELD_TYPES).toContain("cpf");
      expect(ALL_FIELD_TYPES).toContain("text");
    });
  });

  describe("buildFormField", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("builds a FormField from an input element", () => {
      const input = document.createElement("input");
      input.type = "email";
      input.id = "user-email";
      input.name = "email";
      document.body.appendChild(input);

      const field = buildFormField(input);

      expect(field).toMatchObject({
        selector: expect.any(String),
        fieldType: "email",
        detectionMethod: "html-type",
        detectionConfidence: 1,
      });

      document.body.removeChild(input);
    });

    it("builds a FormField from a textarea element", () => {
      const textarea = document.createElement("textarea");
      textarea.name = "description";
      document.body.appendChild(textarea);

      const field = buildFormField(textarea);

      expect(field.element).toBe(textarea);
      expect(typeof field.selector).toBe("string");

      document.body.removeChild(textarea);
    });

    it("detects custom-select when inside an ant-select container", () => {
      const container = document.createElement("div");
      container.className = "ant-select";

      const input = document.createElement("input");
      container.appendChild(input);
      document.body.appendChild(container);

      const field = buildFormField(input);

      expect(field.fieldType).toBe("select");
      expect(field.detectionMethod).toBe("custom-select");
      expect(field.detectionConfidence).toBe(1.0);

      document.body.removeChild(container);
    });

    it("detects combobox role as custom-select", () => {
      const input = document.createElement("input");
      input.setAttribute("role", "combobox");
      document.body.appendChild(input);

      const field = buildFormField(input);

      expect(field.fieldType).toBe("select");
      expect(field.detectionMethod).toBe("custom-select");

      document.body.removeChild(input);
    });
  });
});

/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FormField } from "@/types";
import type { FieldClassifierOutput } from "@/lib/ai/prompts";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockClassifyFieldViaProxy = vi.hoisted(() =>
  vi.fn<() => Promise<FieldClassifierOutput | null>>().mockResolvedValue(null),
);
const mockStoreLearnedEntry = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
const mockInvalidateClassifier = vi.hoisted(() => vi.fn());
const mockAddDatasetEntry = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);

vi.mock("@/lib/ai/chrome-ai-proxy", () => ({
  classifyFieldViaProxy: mockClassifyFieldViaProxy,
}));

vi.mock("@/lib/ai/learning-store", () => ({
  storeLearnedEntry: mockStoreLearnedEntry,
}));

vi.mock("./tensorflow-classifier", () => ({
  invalidateClassifier: mockInvalidateClassifier,
}));

vi.mock("@/lib/dataset/runtime-dataset", () => ({
  addDatasetEntry: mockAddDatasetEntry,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { chromeAiClassifier } from "../chrome-ai-classifier";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> = {}): FormField {
  const input = document.createElement("input");
  input.type = "text";
  input.name = "email";
  input.id = "email-field";

  return {
    element: input,
    type: "text",
    name: "email",
    id: "email-field",
    label: "Email",
    selector: "#email-field",
    contextSignals: "email address input",
    ...overrides,
  } as FormField;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("chromeAiClassifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Interface ───────────────────────────────────────────────────────────

  describe("interface", () => {
    it("has name 'chrome-ai'", () => {
      expect(chromeAiClassifier.name).toBe("chrome-ai");
    });

    it("exposes detect and detectAsync methods", () => {
      expect(typeof chromeAiClassifier.detect).toBe("function");
      expect(typeof chromeAiClassifier.detectAsync).toBe("function");
    });
  });

  // ── detect (sync) ──────────────────────────────────────────────────────

  describe("detect (sync)", () => {
    it("always returns null", () => {
      const field = makeField();
      expect(chromeAiClassifier.detect(field)).toBeNull();
    });
  });

  // ── detectAsync ────────────────────────────────────────────────────────

  describe("detectAsync", () => {
    it("returns null when proxy returns null", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue(null);

      const result = await chromeAiClassifier.detectAsync!(makeField());
      expect(result).toBeNull();
    });

    it("returns type and confidence on success", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue({
        fieldType: "email",
        confidence: 0.95,
        generatorType: "email",
      });

      const result = await chromeAiClassifier.detectAsync!(makeField());

      expect(result).toEqual({ type: "email", confidence: 0.95 });
    });

    it("sends elementHtml and signals to proxy", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue(null);

      const field = makeField({ contextSignals: "contact email" });
      await chromeAiClassifier.detectAsync!(field);

      expect(mockClassifyFieldViaProxy).toHaveBeenCalledWith(
        expect.objectContaining({
          elementHtml: expect.stringContaining("input"),
          signals: "contact email",
        }),
      );
    });

    it("persists to dataset when signals exist", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue({
        fieldType: "cpf",
        confidence: 0.9,
        generatorType: "cpf",
      });

      const field = makeField({ contextSignals: "cpf document" });
      await chromeAiClassifier.detectAsync!(field);

      expect(mockAddDatasetEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          signals: "cpf document",
          type: "cpf",
          source: "auto",
          difficulty: "easy",
        }),
      );
    });

    it("stores learned entry and invalidates classifier on success", async () => {
      mockStoreLearnedEntry.mockResolvedValue(undefined);

      mockClassifyFieldViaProxy.mockResolvedValue({
        fieldType: "phone",
        confidence: 0.85,
        generatorType: "phone",
      });

      const field = makeField({ contextSignals: "phone number" });
      await chromeAiClassifier.detectAsync!(field);

      expect(mockStoreLearnedEntry).toHaveBeenCalledWith(
        "phone number",
        "phone",
        "phone",
      );
    });

    it("does not persist when contextSignals is empty", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue({
        fieldType: "email",
        confidence: 0.9,
        generatorType: "email",
      });

      const field = makeField({ contextSignals: "" });
      await chromeAiClassifier.detectAsync!(field);

      expect(mockAddDatasetEntry).not.toHaveBeenCalled();
      expect(mockStoreLearnedEntry).not.toHaveBeenCalled();
    });

    it("returns null on proxy error", async () => {
      mockClassifyFieldViaProxy.mockRejectedValue(new Error("network failure"));

      const result = await chromeAiClassifier.detectAsync!(makeField());
      expect(result).toBeNull();
    });

    it("uses fallback label when label is null", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue(null);

      const field = makeField({
        label: undefined,
        contextSignals: "address",
        name: "address_field",
      });
      await chromeAiClassifier.detectAsync!(field);

      // Should not throw — uses contextSignals as fallback label
      expect(mockClassifyFieldViaProxy).toHaveBeenCalled();
    });

    it("handles context HTML from parent element", async () => {
      mockClassifyFieldViaProxy.mockResolvedValue(null);

      const wrapper = document.createElement("div");
      wrapper.className = "form-group";
      const labelEl = document.createElement("label");
      labelEl.textContent = "Nome completo";
      const input = document.createElement("input");
      input.type = "text";
      input.name = "fullname";
      wrapper.appendChild(labelEl);
      wrapper.appendChild(input);
      document.body.appendChild(wrapper);

      const field = makeField({ element: input });
      await chromeAiClassifier.detectAsync!(field);

      const calls = mockClassifyFieldViaProxy.mock.calls as unknown as Array<
        [{ contextHtml?: string }]
      >;
      const call = calls[0]?.[0];
      expect(call?.contextHtml).toBeDefined();
      expect(call?.contextHtml).toContain("form-group");

      document.body.removeChild(wrapper);
    });
  });
});

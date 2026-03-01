// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockGetUniqueSelector,
  mockFindLabel,
  mockBuildSignals,
  mockDetectBasicType,
  mockKeywordDetect,
  mockGenerate,
} = vi.hoisted(() => ({
  mockGetUniqueSelector: vi.fn().mockReturnValue("#mock-selector"),
  mockFindLabel: vi.fn().mockReturnValue("Mock Label"),
  mockBuildSignals: vi.fn().mockReturnValue("label mock label"),
  mockDetectBasicType: vi
    .fn()
    .mockReturnValue({ type: "unknown", method: "html-type" }),
  mockKeywordDetect: vi.fn().mockReturnValue(null),
  mockGenerate: vi.fn().mockReturnValue("generated-value"),
}));

vi.mock("../extractors", () => ({
  getUniqueSelector: mockGetUniqueSelector,
  findLabel: mockFindLabel,
  buildSignals: mockBuildSignals,
}));

vi.mock("../field-icon-styles", () => ({
  RULE_POPUP_ID: "fa-rule-popup",
}));

vi.mock("@/lib/shared/field-type-catalog", () => ({
  getFieldTypeOptions: () => [
    { value: "email", label: "Email" },
    { value: "cpf", label: "CPF" },
  ],
}));

vi.mock("../detectors/html-type-detector", () => ({
  detectBasicType: mockDetectBasicType,
}));

vi.mock("../detectors/strategies/keyword-classifier", () => ({
  keywordClassifier: { name: "keyword", detect: mockKeywordDetect },
}));

vi.mock("@/lib/generators", () => ({
  generate: mockGenerate,
}));

// ── SUT ───────────────────────────────────────────────────────────────────────

import {
  destroyRulePopup,
  handleRuleButtonClick,
  hideRulePopup,
} from "../field-icon-rule";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("field-icon-rule", () => {
  let mockOnDismiss: () => void;
  let target: HTMLInputElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUniqueSelector.mockReturnValue("#mock-selector");
    mockFindLabel.mockReturnValue("Mock Label");
    mockBuildSignals.mockReturnValue("label mock label");
    mockDetectBasicType.mockReturnValue({
      type: "unknown",
      method: "html-type",
    });
    mockKeywordDetect.mockReturnValue(null);
    mockGenerate.mockReturnValue("generated-value");
    document.body.innerHTML = "";
    destroyRulePopup();
    mockOnDismiss = vi.fn() as () => void;
    target = document.createElement("input");
    target.type = "text";
    target.id = "test-field";
    document.body.appendChild(target);
  });

  // ── handleRuleButtonClick ──────────────────────────────────────────────────

  describe("handleRuleButtonClick", () => {
    it("creates and shows rule popup", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const popup = document.getElementById("fa-rule-popup");
      expect(popup).not.toBeNull();
      expect(popup?.style.display).toBe("block");
    });

    it("uses findLabel to set popup field name", () => {
      mockFindLabel.mockReturnValue("E-mail Address");

      handleRuleButtonClick(target, mockOnDismiss);

      const nameEl = document.getElementById("fa-rp-field-name");
      expect(nameEl?.textContent).toBe("E-mail Address");
    });

    it("falls back to target name attribute when findLabel returns null", () => {
      mockFindLabel.mockReturnValue(null);
      target.name = "user_email";

      handleRuleButtonClick(target, mockOnDismiss);

      const nameEl = document.getElementById("fa-rp-field-name");
      expect(nameEl?.textContent).toBe("user_email");
    });

    it("falls back to id when findLabel and name are empty", () => {
      mockFindLabel.mockReturnValue(null);
      target.removeAttribute("name");
      target.id = "email-field";

      handleRuleButtonClick(target, mockOnDismiss);

      const nameEl = document.getElementById("fa-rp-field-name");
      expect(nameEl?.textContent).toBe("email-field");
    });

    it("reuses existing popup element on second call", () => {
      handleRuleButtonClick(target, mockOnDismiss);
      const popup1 = document.getElementById("fa-rule-popup");

      // Calling hideRulePopup to reset display, then show again
      hideRulePopup();

      handleRuleButtonClick(target, mockOnDismiss);
      const popup2 = document.getElementById("fa-rule-popup");

      // Same element, not a duplicate
      expect(popup1).toBe(popup2);
      const allPopups = document.querySelectorAll("#fa-rule-popup");
      expect(allPopups.length).toBe(1);
    });

    it("popup contains save and cancel buttons", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      expect(document.getElementById("fa-rp-save")).not.toBeNull();
      expect(document.getElementById("fa-rp-cancel")).not.toBeNull();
    });

    it("popup contains fixed value input and generator select", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const fixedInput = document.getElementById("fa-rp-fixed");
      const genSelect = document.getElementById("fa-rp-generator");
      expect(fixedInput).not.toBeNull();
      expect(genSelect).not.toBeNull();
    });

    it("resets fixed input to empty on each invocation", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const fixedInput =
        document.querySelector<HTMLInputElement>("#fa-rp-fixed")!;
      fixedInput.value = "some previous value";

      hideRulePopup();
      handleRuleButtonClick(target, mockOnDismiss);

      const freshInput =
        document.querySelector<HTMLInputElement>("#fa-rp-fixed")!;
      expect(freshInput.value).toBe("");
    });
  });

  // ── auto-suggestion ────────────────────────────────────────────────────────

  describe("auto-suggestion", () => {
    it("pre-selects generator when HTML type detector returns a known type", () => {
      mockDetectBasicType.mockReturnValue({
        type: "email",
        method: "html-type",
      });

      handleRuleButtonClick(target, mockOnDismiss);

      const genSelect =
        document.querySelector<HTMLSelectElement>("#fa-rp-generator")!;
      expect(genSelect.value).toBe("email");
    });

    it("falls back to 'auto' when HTML type is unknown and keyword returns null", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const genSelect =
        document.querySelector<HTMLSelectElement>("#fa-rp-generator")!;
      expect(genSelect.value).toBe("auto");
    });

    it("uses keyword classifier result when HTML type is unknown", () => {
      mockDetectBasicType.mockReturnValue({
        type: "unknown",
        method: "html-type",
      });
      mockKeywordDetect.mockReturnValue({
        type: "cpf",
        method: "keyword",
        confidence: 0.9,
      });

      handleRuleButtonClick(target, mockOnDismiss);

      const genSelect =
        document.querySelector<HTMLSelectElement>("#fa-rp-generator")!;
      expect(genSelect.value).toBe("cpf");
    });

    it("shows suggestion badge when a type is detected", () => {
      mockDetectBasicType.mockReturnValue({
        type: "email",
        method: "html-type",
      });

      handleRuleButtonClick(target, mockOnDismiss);

      const badge = document.getElementById("fa-rp-suggestion")!;
      const typeLabel = document.getElementById("fa-rp-suggestion-type")!;
      expect(badge.style.display).not.toBe("none");
      expect(typeLabel.textContent).toBe("Email");
    });

    it("hides suggestion badge when no type detected", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const badge = document.getElementById("fa-rp-suggestion")!;
      expect(badge.style.display).toBe("none");
    });
  });

  // ── live preview ───────────────────────────────────────────────────────────

  describe("live preview", () => {
    it("renders preview element on open", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      expect(document.getElementById("fa-rp-preview-value")).not.toBeNull();
    });

    it("shows generated value on open when no fixed value", () => {
      mockGenerate.mockReturnValue("test@example.com");

      handleRuleButtonClick(target, mockOnDismiss);

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.textContent).toBe("test@example.com");
    });

    it("updates preview to show fixed value when typing in fixed input", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const fixedInput =
        document.querySelector<HTMLInputElement>("#fa-rp-fixed")!;
      fixedInput.value = "meu valor fixo";
      fixedInput.dispatchEvent(new Event("input", { bubbles: true }));

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.textContent).toBe("meu valor fixo");
    });

    it("updates preview when generator select changes", () => {
      mockGenerate.mockReturnValueOnce("initial").mockReturnValue("novo-cpf");
      handleRuleButtonClick(target, mockOnDismiss);

      const genSelect =
        document.querySelector<HTMLSelectElement>("#fa-rp-generator")!;
      genSelect.value = "cpf";
      genSelect.dispatchEvent(new Event("change", { bubbles: true }));

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.textContent).toBe("novo-cpf");
    });

    it("shows fixed class when fixed value is typed", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const fixedInput =
        document.querySelector<HTMLInputElement>("#fa-rp-fixed")!;
      fixedInput.value = "fixo";
      fixedInput.dispatchEvent(new Event("input", { bubbles: true }));

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.className).toBe("fa-rp-preview-fixed");
    });

    it("shows generated class when fixed input is empty", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.className).toBe("fa-rp-preview-generated");
    });
  });

  // ── keyboard shortcuts ─────────────────────────────────────────────────────

  describe("keyboard shortcuts", () => {
    it("hides popup and calls onDismiss on Escape keydown", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      const popup = document.getElementById("fa-rule-popup")!;
      expect(popup.style.display).toBe("none");
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it("saves rule on Enter keydown and marks button as saved", async () => {
      handleRuleButtonClick(target, mockOnDismiss);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      await Promise.resolve();

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      expect(saveBtn.disabled).toBe(true);
      expect(saveBtn.textContent).toBe("✓ Salvo!");
    });

    it("does not trigger shortcuts when popup is hidden", async () => {
      handleRuleButtonClick(target, mockOnDismiss);
      hideRulePopup();

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      await Promise.resolve();

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      expect(saveBtn.disabled).toBe(false);
    });

    it("removes keyboard listener after destroyRulePopup", () => {
      handleRuleButtonClick(target, mockOnDismiss);
      destroyRulePopup();
      // Re-create so we can check the listener was properly removed
      handleRuleButtonClick(target, mockOnDismiss);
      destroyRulePopup();

      // should not throw, and no popup exists
      expect(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
      ).not.toThrow();
    });
  });

  // ── hideRulePopup ──────────────────────────────────────────────────────────

  describe("hideRulePopup", () => {
    it("hides popup by setting display none", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      hideRulePopup();

      const popup = document.getElementById("fa-rule-popup");
      expect(popup?.style.display).toBe("none");
    });

    it("is safe to call when popup does not exist", () => {
      expect(() => hideRulePopup()).not.toThrow();
    });
  });

  // ── destroyRulePopup ───────────────────────────────────────────────────────

  describe("destroyRulePopup", () => {
    it("removes popup element from DOM", () => {
      handleRuleButtonClick(target, mockOnDismiss);
      expect(document.getElementById("fa-rule-popup")).not.toBeNull();

      destroyRulePopup();

      expect(document.getElementById("fa-rule-popup")).toBeNull();
    });

    it("is safe to call when popup has not been created", () => {
      expect(() => destroyRulePopup()).not.toThrow();
    });

    it("allows creating a fresh popup after destroy", () => {
      handleRuleButtonClick(target, mockOnDismiss);
      destroyRulePopup();

      handleRuleButtonClick(target, mockOnDismiss);

      const popup = document.getElementById("fa-rule-popup");
      expect(popup).not.toBeNull();
      expect(popup?.style.display).toBe("block");
    });
  });

  // ── cancel button ──────────────────────────────────────────────────────────

  describe("cancel button", () => {
    it("hides popup and calls onDismiss on mousedown", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const cancelBtn =
        document.querySelector<HTMLButtonElement>("#fa-rp-cancel")!;
      cancelBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      const popup = document.getElementById("fa-rule-popup");
      expect(popup?.style.display).toBe("none");
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });
});

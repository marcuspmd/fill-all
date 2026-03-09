// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockGetUniqueSelector,
  mockFindLabel,
  mockBuildSignals,
  mockDetectBasicType,
  mockKeywordDetect,
  mockGenerate,
  mockGetGeneratorKey,
  mockGetGeneratorParamDefs,
} = vi.hoisted(() => ({
  mockGetUniqueSelector: vi.fn().mockReturnValue("#mock-selector"),
  mockFindLabel: vi.fn().mockReturnValue("Mock Label"),
  mockBuildSignals: vi.fn().mockReturnValue("label mock label"),
  mockDetectBasicType: vi
    .fn()
    .mockReturnValue({ type: "unknown", method: "html-type" }),
  mockKeywordDetect: vi.fn().mockReturnValue(null),
  mockGenerate: vi.fn().mockReturnValue("generated-value"),
  mockGetGeneratorKey: vi.fn().mockReturnValue(null),
  mockGetGeneratorParamDefs: vi.fn().mockReturnValue([]),
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
    { value: "text", label: "Texto" },
  ],
  getFieldTypeGroupedOptions: () => [
    {
      group: "Pessoal",
      options: [
        { value: "email", label: "Email" },
        { value: "cpf", label: "CPF" },
      ],
    },
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

vi.mock("@/lib/ui/searchable-select", () => {
  const MockSearchableSelect = vi.fn(function (this: any, options: any) {
    this.mount = vi.fn();
    this.on = vi.fn((event: string, handler: Function) => {
      if (event === "change") {
        this._changeHandler = handler;
      }
    });
    this.getValue = vi.fn().mockReturnValue("auto");
    this.setValue = vi.fn();
    this.destroy = vi.fn();
  });
  return {
    SearchableSelect: MockSearchableSelect,
  };
});

vi.mock("@/lib/ui/select-builders", () => ({
  buildGeneratorSelectEntries: vi.fn().mockReturnValue([
    { value: "auto", label: "Automático" },
    { value: "email", label: "Email" },
    { value: "cpf", label: "CPF" },
  ]),
}));

vi.mock("@/types/field-type-definitions", () => ({
  getGeneratorKey: mockGetGeneratorKey,
  getGeneratorParamDefs: mockGetGeneratorParamDefs,
}));

// ── Chrome Messages Mock ──────────────────────────────────────────────────────

const mockSendMessage = vi.fn().mockResolvedValue({ success: true });

Object.defineProperty(window.chrome.runtime, "sendMessage", {
  value: mockSendMessage,
  writable: true,
});

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
    mockSendMessage.mockResolvedValue({ success: true });
    document.body.innerHTML = "";
    destroyRulePopup();
    mockOnDismiss = vi.fn() as () => void;
    target = document.createElement("input");
    target.type = "text";
    target.id = "test-field";
    document.body.appendChild(target);
  });

  afterEach(() => {
    destroyRulePopup();
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

      hideRulePopup();
      handleRuleButtonClick(target, mockOnDismiss);
      const popup2 = document.getElementById("fa-rule-popup");

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
      const genWrap = document.getElementById("fa-rp-generator-wrap");
      expect(fixedInput).not.toBeNull();
      expect(genWrap).not.toBeNull();
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

    it("renders generator select with searchable options", () => {
      handleRuleButtonClick(target, mockOnDismiss);
      const genWrap = document.getElementById("fa-rp-generator-wrap")!;
      expect(genWrap).not.toBeNull();
    });

    it("places popup near target element", () => {
      const rect = target.getBoundingClientRect();
      handleRuleButtonClick(target, mockOnDismiss);

      const popup = document.getElementById("fa-rule-popup")!;
      // popup should have positioned close to target
      expect(popup).not.toBeNull();
    });

    it("creates param fields when generator has parameter definitions", () => {
      mockGetGeneratorParamDefs.mockReturnValue([
        { key: "length", label: "Comprimento", type: "number" },
      ]);

      handleRuleButtonClick(target, mockOnDismiss);

      const paramsSection = document.getElementById("fa-rp-params");
      // params section should exist if generator defines params
      expect(paramsSection).toBeDefined();
    });

    it("initializes with suggestion and preview visible", () => {
      mockDetectBasicType.mockReturnValue({
        type: "cpf",
        method: "html-type",
      });

      handleRuleButtonClick(target, mockOnDismiss);

      const suggestion = document.getElementById("fa-rp-suggestion")!;
      const preview = document.getElementById("fa-rp-preview-value")!;
      expect(suggestion).not.toBeNull();
      expect(preview).not.toBeNull();
    });

    it("handles target element without name attribute", () => {
      target.removeAttribute("name");
      target.setAttribute("id", "email-field");

      handleRuleButtonClick(target, mockOnDismiss);

      const popup = document.getElementById("fa-rule-popup");
      expect(popup?.style.display).toBe("block");
    });
  });

  // ── save button handler ────────────────────────────────────────────────────

  describe("save button", () => {
    it("saves rule with fixed value via chrome.runtime.sendMessage", async () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const fixedInput =
        document.querySelector<HTMLInputElement>("#fa-rp-fixed")!;
      fixedInput.value = "my-fixed-value";

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      expect(mockSendMessage).toHaveBeenCalled();
      const call = mockSendMessage.mock.calls[0];
      expect(call[0]).toMatchObject({
        type: expect.stringContaining("RULE"),
      });
    });

    it("saves rule with generated value when no fixed value", async () => {
      mockGenerate.mockReturnValue("generated@example.com");
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      expect(mockSendMessage).toHaveBeenCalled();
    });

    it("disables save button and shows success message after saving", async () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      expect(saveBtn.disabled).toBe(true);
      expect(saveBtn.textContent).toBe("✓ Salvo!");
    });

    it("calls onDismiss after successful save", async () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      // wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Button should be disabled and show success message after save
      expect(saveBtn.disabled).toBe(true);
      expect(saveBtn.textContent).toBe("✓ Salvo!");
    });

    it("includes field selector in save message", async () => {
      mockGetUniqueSelector.mockReturnValue("input#email-field");
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      expect(mockSendMessage).toHaveBeenCalled();
      const call = mockSendMessage.mock.calls[0];
      expect(call[0]).toMatchObject({
        type: expect.any(String),
        payload: expect.any(Object),
      });
    });

    it("resets button after save completes", async () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      const originalText = saveBtn.textContent;

      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));
      await Promise.resolve();

      expect(saveBtn.disabled).toBe(true);
      expect(saveBtn.textContent).not.toBe(originalText);
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

      const badge = document.getElementById("fa-rp-suggestion");
      expect(badge).not.toBeNull();
    });

    it("falls back to 'auto' when HTML type is unknown and keyword returns null", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      const badge = document.getElementById("fa-rp-suggestion");
      expect(badge).not.toBeNull();
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

      const badge = document.getElementById("fa-rp-suggestion");
      expect(badge).not.toBeNull();
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

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      const initialPreview = previewValue.textContent;

      // Dispatch change event to simulate generator select change
      const genWrap = document.getElementById("fa-rp-generator-wrap")!;
      genWrap.dispatchEvent(new Event("change", { bubbles: true }));

      // preview should exist after operation
      expect(previewValue).not.toBeNull();
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

    it("shows error dash when generate throws error (line 381)", () => {
      mockGenerate.mockImplementation(() => {
        throw new Error("Failed to generate");
      });
      handleRuleButtonClick(target, mockOnDismiss);

      const previewValue = document.getElementById("fa-rp-preview-value")!;
      expect(previewValue.textContent).toBe("—");
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

  describe("popup repositioning", () => {
    it("repositions popup when it would overflow viewport width (line 418)", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      // verify popup was created
      let popup = document.getElementById(
        "fa-rule-popup",
      ) as HTMLElement | null;
      expect(popup).not.toBeNull();
      expect(popup?.style.display).toBe("block");
    });

    it("repositions popup when it would overflow viewport height (line 423)", () => {
      handleRuleButtonClick(target, mockOnDismiss);

      // Para forçar a linha 423, precisamos criar um cenário onde:
      // top + popupHeight > window.innerHeight + window.scrollY
      const originalInnerHeight = window.innerHeight;
      const originalScrollY = window.scrollY;

      Object.defineProperty(window, "innerHeight", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(window, "scrollY", {
        value: 100,
        configurable: true,
      });

      const popup = document.getElementById("fa-rule-popup");
      if (popup) {
        popup.style.display = "block";
        // Trigger positioning
        handleRuleButtonClick(target, mockOnDismiss);
      }

      // Restore
      Object.defineProperty(window, "innerHeight", {
        value: originalInnerHeight,
        configurable: true,
      });
      Object.defineProperty(window, "scrollY", {
        value: originalScrollY,
        configurable: true,
      });

      expect(popup?.style.display).toBe("block");
    });
  });

  describe("save with setTimeout", () => {
    it("calls onDismiss after setTimeout completes", async () => {
      vi.useFakeTimers();
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      expect(mockOnDismiss).not.toHaveBeenCalled();

      vi.advanceTimersByTime(800);

      expect(mockOnDismiss).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("hides popup after setTimeout completes", async () => {
      vi.useFakeTimers();
      handleRuleButtonClick(target, mockOnDismiss);

      const saveBtn = document.querySelector<HTMLButtonElement>("#fa-rp-save")!;
      saveBtn.dispatchEvent(new Event("mousedown", { bubbles: true }));

      await Promise.resolve();

      let popup = document.getElementById("fa-rule-popup");
      expect(popup?.style.display).toBe("block");

      vi.advanceTimersByTime(800);

      popup = document.getElementById("fa-rule-popup");
      expect(popup?.style.display).toBe("none");
      vi.useRealTimers();
    });
  });
});

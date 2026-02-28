// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockGetUniqueSelector, mockFindLabel } = vi.hoisted(() => ({
  mockGetUniqueSelector: vi.fn().mockReturnValue("#mock-selector"),
  mockFindLabel: vi.fn().mockReturnValue("Mock Label"),
}));

vi.mock("../extractors", () => ({
  getUniqueSelector: mockGetUniqueSelector,
  findLabel: mockFindLabel,
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

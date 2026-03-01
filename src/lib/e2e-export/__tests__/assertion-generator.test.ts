/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  detectAssertions,
  detectNegativeAssertions,
} from "@/lib/e2e-export/assertion-generator";
import type { CapturedAction } from "@/lib/e2e-export/e2e-export.types";

describe("Assertion Generator", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("detectAssertions", () => {
    it("returns url-changed assertion when submit action is present", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "Test", actionType: "fill" },
        { selector: "#btn", value: "", actionType: "submit" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      const urlAssertion = assertions.find((a) => a.type === "url-changed");
      expect(urlAssertion).toBeDefined();
      expect(urlAssertion!.expected).toBe("https://example.com");
    });

    it("returns url-changed assertion for click action (button submit)", () => {
      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "click" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      expect(assertions.some((a) => a.type === "url-changed")).toBe(true);
    });

    it("does not include url-changed when no submit/click action", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "Test", actionType: "fill" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      expect(assertions.some((a) => a.type === "url-changed")).toBe(false);
    });

    it("detects success message container on the page", () => {
      document.body.innerHTML = '<div class="alert-success">Saved!</div>';

      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "submit" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      const visible = assertions.find((a) => a.type === "element-visible");
      expect(visible).toBeDefined();
      expect(visible!.selector).toBe(".alert-success");
    });

    it("detects toast container", () => {
      document.body.innerHTML =
        '<div class="Toastify__toast--success">OK</div>';

      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "click" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      const visible = assertions.find((a) => a.type === "element-visible");
      expect(visible).toBeDefined();
      expect(visible!.selector).toBe(".Toastify__toast--success");
    });

    it("detects form action redirect", () => {
      document.body.innerHTML =
        '<form action="/thank-you"><input name="x" /></form>';

      const actions: CapturedAction[] = [
        { selector: "input", value: "x", actionType: "fill" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      const redirect = assertions.find((a) => a.type === "redirect");
      expect(redirect).toBeDefined();
      expect(redirect!.expected).toBe("/thank-you");
    });

    it("ignores form actions with # or javascript:", () => {
      document.body.innerHTML =
        '<form action="#"><input name="x" /></form>' +
        '<form action="javascript:void(0)"><input name="y" /></form>';

      const actions: CapturedAction[] = [
        { selector: "input", value: "x", actionType: "fill" },
      ];

      const assertions = detectAssertions(actions, "https://example.com");
      expect(assertions.some((a) => a.type === "redirect")).toBe(false);
    });

    it("returns empty array when no signals found and no submit", () => {
      const assertions = detectAssertions([], "https://example.com");
      expect(assertions).toEqual([]);
    });

    it("generates response-ok assertion from captured HTTP responses", () => {
      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "submit" },
      ];
      const capturedResponses = [
        {
          url: "/api/submit",
          method: "POST",
          status: 200,
          timestamp: Date.now(),
        },
      ];

      const assertions = detectAssertions(
        actions,
        "https://example.com",
        capturedResponses,
      );
      const responseAssertion = assertions.find(
        (a) => a.type === "response-ok",
      );
      expect(responseAssertion).toBeDefined();
      expect(responseAssertion!.selector).toBe("/api/submit");
      expect(responseAssertion!.expected).toBe("200");
      expect(responseAssertion!.description).toContain("POST /api/submit");
    });

    it("generates multiple response-ok assertions for multiple captured responses", () => {
      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "submit" },
      ];
      const capturedResponses = [
        { url: "/api/users", method: "POST", status: 201, timestamp: 1 },
        { url: "/api/notify", method: "POST", status: 200, timestamp: 2 },
      ];

      const assertions = detectAssertions(
        actions,
        "https://example.com",
        capturedResponses,
      );
      const responseAssertions = assertions.filter(
        (a) => a.type === "response-ok",
      );
      expect(responseAssertions).toHaveLength(2);
    });

    it("returns no response-ok assertions when capturedResponses is empty", () => {
      const actions: CapturedAction[] = [
        { selector: "#btn", value: "", actionType: "submit" },
      ];

      const assertions = detectAssertions(actions, "https://example.com", []);
      expect(assertions.some((a) => a.type === "response-ok")).toBe(false);
    });
  });

  describe("detectNegativeAssertions", () => {
    it("returns assertions when actions have required fields", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          required: true,
        },
      ];

      const assertions = detectNegativeAssertions(actions);
      expect(assertions.length).toBeGreaterThanOrEqual(1);
      const visibleText = assertions.find((a) => a.type === "visible-text");
      expect(visibleText).toBeDefined();
    });

    it("returns empty array when no required fields", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];

      const assertions = detectNegativeAssertions(actions);
      expect(assertions).toEqual([]);
    });

    it("detects error containers on the page", () => {
      document.body.innerHTML = '<span class="invalid-feedback">Error</span>';

      const actions: CapturedAction[] = [
        {
          selector: "#email",
          value: "test@test.com",
          actionType: "fill",
          required: true,
        },
      ];

      const assertions = detectNegativeAssertions(actions);
      const fieldError = assertions.find((a) => a.type === "field-error");
      expect(fieldError).toBeDefined();
      expect(fieldError!.selector).toBe(".invalid-feedback");
    });

    it("detects MUI error helper text", () => {
      document.body.innerHTML =
        '<p class="MuiFormHelperText-root Mui-error">Required</p>';

      const actions: CapturedAction[] = [
        {
          selector: "#field",
          value: "val",
          actionType: "fill",
          required: true,
        },
      ];

      const assertions = detectNegativeAssertions(actions);
      const fieldError = assertions.find((a) => a.type === "field-error");
      expect(fieldError).toBeDefined();
    });

    it("always includes visible-text assertion for required fields", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "X",
          actionType: "fill",
          required: true,
        },
      ];

      const assertions = detectNegativeAssertions(actions);
      const visibleText = assertions.find((a) => a.type === "visible-text");
      expect(visibleText).toBeDefined();
      expect(visibleText!.description).toContain("Required");
    });
  });
});

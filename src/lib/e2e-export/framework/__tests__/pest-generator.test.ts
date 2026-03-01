import { describe, it, expect } from "vitest";
import { pestGenerator } from "@/lib/e2e-export/framework/pest-generator";
import type {
  CapturedAction,
  E2EGenerateOptions,
  RecordedStep,
  RecordingGenerateOptions,
} from "@/lib/e2e-export/e2e-export.types";

describe("pestGenerator", () => {
  it("has correct name and displayName", () => {
    expect(pestGenerator.name).toBe("pest");
    expect(pestGenerator.displayName).toBe("Pest (Laravel Dusk)");
  });

  describe("basic actions", () => {
    it("generates a valid Pest/Dusk test script with actions", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill", label: "Nome" },
        { selector: "#agree", value: "", actionType: "check" },
        { selector: "#country", value: "BR", actionType: "select" },
      ];
      const opts: E2EGenerateOptions = { pageUrl: "https://example.com" };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("<?php");
      expect(script).toContain("use Laravel\\Dusk\\Browser");
      expect(script).toContain("test('fill form'");
      expect(script).toContain("->visit('https://example.com')");
      expect(script).toContain("->type('#name', 'John')");
      expect(script).toContain("->check('#agree')");
      expect(script).toContain("->select('#country', 'BR')");
      expect(script).toContain("// Nome");
    });

    it("generates script without URL when pageUrl is omitted", () => {
      const actions: CapturedAction[] = [
        { selector: "#email", value: "a@b.com", actionType: "fill" },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).not.toContain("->visit");
      expect(script).toContain("->type('#email', 'a@b.com')");
    });

    it("generates uncheck action", () => {
      const actions: CapturedAction[] = [
        { selector: "#opt-out", value: "", actionType: "uncheck" },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).toContain("->uncheck('#opt-out')");
    });

    it("generates radio action", () => {
      const actions: CapturedAction[] = [
        { selector: "#gender-male", value: "male", actionType: "radio" },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).toContain("->radio('#gender-male', 'male')");
    });

    it("generates clear action", () => {
      const actions: CapturedAction[] = [
        { selector: "#field", value: "", actionType: "clear" },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).toContain("->clear('#field')");
    });

    it("escapes single quotes in selectors and values", () => {
      const actions: CapturedAction[] = [
        {
          selector: "[name='user']",
          value: "O'Brien",
          actionType: "fill",
        },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).toContain("[name=\\'user\\']");
      expect(script).toContain("O\\'Brien");
    });
  });

  describe("custom test name", () => {
    it("uses custom testName in test declaration", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];
      const opts: E2EGenerateOptions = { testName: "checkout flow" };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("test('checkout flow'");
    });
  });

  describe("smart selectors", () => {
    it("uses smart selectors when available and enabled", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          smartSelectors: [
            { value: '[data-testid="name-field"]', strategy: "data-testid" },
          ],
        },
      ];
      const opts: E2EGenerateOptions = { useSmartSelectors: true };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain('[data-testid="name-field"]');
    });

    it("falls back to original selector when smart selectors disabled", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          smartSelectors: [
            { value: '[data-testid="name-field"]', strategy: "data-testid" },
          ],
        },
      ];
      const opts: E2EGenerateOptions = { useSmartSelectors: false };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("->type('#name'");
    });
  });

  describe("submit actions", () => {
    it("includes submit button click in generated script", () => {
      const actions: CapturedAction[] = [
        { selector: "#email", value: "a@b.com", actionType: "fill" },
        { selector: "#btn", value: "", actionType: "click", label: "Enviar" },
      ];

      const script = pestGenerator.generate(actions);

      expect(script).toContain("// Submit");
      expect(script).toContain("->click('#btn')");
    });
  });

  describe("assertions", () => {
    it("includes assertions when enabled", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];
      const opts: E2EGenerateOptions = {
        includeAssertions: true,
        assertions: [
          { type: "url-changed", expected: "https://example.com" },
          { type: "visible-text", expected: "Saved!" },
        ],
      };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("// Assertions");
      expect(script).toContain("assertUrlIsNot('https://example.com')");
      expect(script).toContain("assertSee('Saved!')");
    });

    it("generates all assertion types", () => {
      const opts: E2EGenerateOptions = {
        includeAssertions: true,
        assertions: [
          { type: "url-changed", expected: "/old" },
          { type: "url-contains", expected: "/dash" },
          { type: "visible-text", expected: "OK" },
          { type: "element-visible", selector: ".ok" },
          { type: "element-hidden", selector: ".spinner" },
          { type: "toast-message", selector: "[role='alert']" },
          { type: "field-value", selector: "#out", expected: "42" },
          { type: "field-error", selector: ".err" },
          { type: "redirect", expected: "/thanks" },
        ],
      };

      const script = pestGenerator.generate([], opts);

      expect(script).toContain("assertUrlIsNot('/old')");
      expect(script).toContain("assertPathContains('/dash')");
      expect(script).toContain("assertSee('OK')");
      expect(script).toContain("assertVisible('.ok')");
      expect(script).toContain("assertMissing('.spinner')");
      expect(script).toContain("assertInputValue('#out', '42')");
      expect(script).toContain("assertVisible('.err')");
      expect(script).toContain("assertPathContains('/thanks')");
    });
  });

  describe("negative test", () => {
    it("generates negative test for required fields", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#email",
          value: "a@b.com",
          actionType: "fill",
          required: true,
        },
        { selector: "#submit", value: "", actionType: "click" },
      ];
      const opts: E2EGenerateOptions = {
        pageUrl: "https://example.com",
        includeNegativeTest: true,
      };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("should show validation errors");
      expect(script).toContain("->visit('https://example.com')");
      expect(script).toContain("->click('#submit')");
      expect(script).toContain("assertAttribute('#email', 'required'");
    });

    it("does not generate negative test when no required fields", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#email",
          value: "a@b.com",
          actionType: "fill",
          required: false,
        },
      ];
      const opts: E2EGenerateOptions = { includeNegativeTest: true };

      const script = pestGenerator.generate(actions, opts);

      expect(script).not.toContain("validation errors");
    });

    it("includes field-error assertions in negative test", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#email",
          value: "a@b.com",
          actionType: "fill",
          required: true,
        },
        { selector: "#submit", value: "", actionType: "click" },
      ];
      const opts: E2EGenerateOptions = {
        pageUrl: "https://example.com",
        includeNegativeTest: true,
        assertions: [{ type: "field-error", selector: ".error-message" }],
      };

      const script = pestGenerator.generate(actions, opts);

      expect(script).toContain("assertVisible('.error-message')");
    });
  });

  // ── generateFromRecording ────────────────────────────────────────

  describe("generateFromRecording", () => {
    function step(
      overrides: Partial<RecordedStep> & { type: RecordedStep["type"] },
    ): RecordedStep {
      return { timestamp: Date.now(), ...overrides };
    }

    it("generates script from recorded fill and click steps", () => {
      const steps: RecordedStep[] = [
        step({ type: "navigate", url: "https://example.com", timestamp: 1000 }),
        step({
          type: "fill",
          selector: "#name",
          value: "John",
          timestamp: 1100,
        }),
        step({
          type: "click",
          selector: ".btn-next",
          label: "Next",
          timestamp: 1200,
        }),
      ];
      const opts: RecordingGenerateOptions = {
        pageUrl: "https://example.com",
        testName: "fill and click",
      };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("test('fill and click'");
      expect(script).toContain("->visit('https://example.com')");
      expect(script).toContain("->type('#name', 'John')");
      expect(script).toContain("->click('.btn-next')");
    });

    it("inserts pause for significant delays", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#name", value: "A", timestamp: 1000 }),
        step({ type: "fill", selector: "#email", value: "B", timestamp: 5000 }),
      ];
      const opts: RecordingGenerateOptions = { minWaitThreshold: 1000 };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("User paused");
      expect(script).toContain("->pause(");
    });

    it("does not insert pause for short delays", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#a", value: "x", timestamp: 1000 }),
        step({ type: "fill", selector: "#b", value: "y", timestamp: 1100 }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).not.toContain("->pause(");
    });

    it("generates select, check, and submit steps", () => {
      const steps: RecordedStep[] = [
        step({
          type: "select",
          selector: "#country",
          value: "BR",
          timestamp: 1000,
        }),
        step({ type: "check", selector: "#agree", timestamp: 1100 }),
        step({
          type: "submit",
          selector: "#form-btn",
          label: "Submit",
          timestamp: 1200,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("select('#country', 'BR')");
      expect(script).toContain("check('#agree')");
      expect(script).toContain("->click");
    });

    it("generates press-key steps", () => {
      const steps: RecordedStep[] = [
        step({
          type: "press-key",
          selector: "#search",
          key: "Enter",
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("keys('#search', '{enter}')");
    });

    it("uses smart selectors when enabled", () => {
      const steps: RecordedStep[] = [
        step({
          type: "fill",
          selector: "#name",
          smartSelectors: [
            {
              strategy: "data-testid",
              value: '[data-testid="name-field"]',
              description: "data-testid=name-field",
            },
          ],
          value: "John",
          timestamp: 1000,
        }),
      ];
      const opts: RecordingGenerateOptions = { useSmartSelectors: true };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("data-testid");
      expect(script).toContain("name-field");
    });

    it("includes assertions when provided", () => {
      const steps: RecordedStep[] = [
        step({
          type: "fill",
          selector: "#name",
          value: "John",
          timestamp: 1000,
        }),
      ];
      const opts: RecordingGenerateOptions = {
        includeAssertions: true,
        assertions: [{ type: "element-visible", selector: "#success" }],
      };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("assertVisible('#success')");
    });

    it("respects custom test name", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#x", value: "v", timestamp: 1000 }),
      ];
      const opts: RecordingGenerateOptions = { testName: "my custom test" };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("my custom test");
    });

    it("generates wait-for-network-idle step", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-network-idle",
          waitTimeout: 10_000,
          label: "Wait for network requests to complete",
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("->pause(1000)");
    });

    it("generates wait-for-hidden step", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-hidden",
          selector: "#spinner",
          waitTimeout: 10_000,
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("waitUntilMissing('#spinner', 10)");
    });

    it("generates wait-for-element step", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-element",
          selector: "#result",
          waitTimeout: 5000,
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("waitFor('#result', 5)");
    });

    it("generates wait-for-url step", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-url",
          url: "/dashboard",
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("waitForLocation('/dashboard')");
    });

    it("generates uncheck and clear and hover steps", () => {
      const steps: RecordedStep[] = [
        step({ type: "uncheck", selector: "#opt-out", timestamp: 1000 }),
        step({ type: "clear", selector: "#field", timestamp: 1100 }),
        step({ type: "hover", selector: "#btn", timestamp: 1200 }),
      ];
      const opts: RecordingGenerateOptions = { includeHoverSteps: true };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("->uncheck('#opt-out')");
      expect(script).toContain("->clear('#field')");
      expect(script).toContain("->mouseover('#btn')");
    });

    it("generates scroll step with scrollPosition", () => {
      const steps: RecordedStep[] = [
        step({
          type: "scroll",
          selector: "#page",
          scrollPosition: { x: 100, y: 200 },
          timestamp: 1000,
        }),
      ];
      const opts: RecordingGenerateOptions = { includeScrollSteps: true };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("window.scrollTo(100, 200)");
    });

    it("generates scroll step without scrollPosition defaults to zero", () => {
      const steps: RecordedStep[] = [
        step({ type: "scroll", selector: "#page", timestamp: 1000 }),
      ];
      const opts: RecordingGenerateOptions = { includeScrollSteps: true };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("window.scrollTo(0, 0)");
    });

    it("generates assert step with assertion", () => {
      const steps: RecordedStep[] = [
        step({
          type: "assert",
          assertion: { type: "element-visible", selector: "#success" },
          timestamp: 1000,
        }),
      ];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("assertVisible('#success')");
    });

    it("generates assert step without assertion falls back to comment", () => {
      const steps: RecordedStep[] = [step({ type: "assert", timestamp: 1000 })];

      const script = pestGenerator.generateFromRecording(steps);

      expect(script).toContain("// assert");
    });

    it("filters out scroll steps when includeScrollSteps is false", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#name", value: "A", timestamp: 1000 }),
        step({
          type: "scroll",
          selector: "#page",
          scrollPosition: { x: 0, y: 500 },
          timestamp: 1100,
        }),
        step({ type: "click", selector: "#btn", timestamp: 1200 }),
      ];
      const opts: RecordingGenerateOptions = { includeScrollSteps: false };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).not.toContain("scrollTo");
      expect(script).toContain("->type");
      expect(script).toContain("->click");
    });

    it("filters out hover steps when includeHoverSteps is false", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#name", value: "A", timestamp: 1000 }),
        step({ type: "hover", selector: "#tooltip", timestamp: 1100 }),
        step({ type: "click", selector: "#btn", timestamp: 1200 }),
      ];
      const opts: RecordingGenerateOptions = { includeHoverSteps: false };

      const script = pestGenerator.generateFromRecording(steps, opts);

      expect(script).not.toContain("mouseover");
      expect(script).toContain("->type");
      expect(script).toContain("->click");
    });
  });
});

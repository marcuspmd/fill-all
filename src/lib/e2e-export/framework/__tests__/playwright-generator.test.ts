import { describe, it, expect } from "vitest";
import { playwrightGenerator } from "@/lib/e2e-export/framework/playwright-generator";
import type {
  CapturedAction,
  E2EGenerateOptions,
  RecordedStep,
  RecordingGenerateOptions,
} from "@/lib/e2e-export/e2e-export.types";

describe("playwrightGenerator", () => {
  it("has correct name and displayName", () => {
    expect(playwrightGenerator.name).toBe("playwright");
    expect(playwrightGenerator.displayName).toBe("Playwright");
  });

  describe("basic actions", () => {
    it("generates a valid Playwright test script with actions", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill", label: "Nome" },
        {
          selector: "#agree",
          value: "",
          actionType: "check",
          label: "Aceitar termos",
        },
        {
          selector: "#country",
          value: "BR",
          actionType: "select",
          label: "País",
        },
      ];
      const opts: E2EGenerateOptions = { pageUrl: "https://example.com" };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("import { test, expect }");
      expect(script).toContain("await page.goto('https://example.com')");
      expect(script).toContain("page.locator('#name').fill('John')");
      expect(script).toContain("page.locator('#agree').check()");
      expect(script).toContain("page.locator('#country').selectOption('BR')");
      expect(script).toContain("// Nome");
      expect(script).toContain("// Aceitar termos");
    });

    it("generates script without URL when pageUrl is omitted", () => {
      const actions: CapturedAction[] = [
        { selector: "#email", value: "a@b.com", actionType: "fill" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).not.toContain("page.goto");
      expect(script).toContain("page.locator('#email').fill('a@b.com')");
    });

    it("generates uncheck action", () => {
      const actions: CapturedAction[] = [
        { selector: "#opt-out", value: "", actionType: "uncheck" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("page.locator('#opt-out').uncheck()");
    });

    it("generates radio action as check", () => {
      const actions: CapturedAction[] = [
        { selector: "#gender-male", value: "male", actionType: "radio" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("page.locator('#gender-male').check()");
    });

    it("generates clear action", () => {
      const actions: CapturedAction[] = [
        { selector: "#field", value: "", actionType: "clear" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("page.locator('#field').clear()");
    });

    it("escapes single quotes in selectors and values", () => {
      const actions: CapturedAction[] = [
        {
          selector: "[name='user']",
          value: "O'Brien",
          actionType: "fill",
        },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("[name=\\'user\\']");
      expect(script).toContain("O\\'Brien");
    });

    it("generates empty test body for empty actions", () => {
      const script = playwrightGenerator.generate([]);

      expect(script).toContain("test('fill form'");
      expect(script).toContain("import { test, expect }");
    });
  });

  describe("custom test name", () => {
    it("uses custom testName in test declaration", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];
      const opts: E2EGenerateOptions = { testName: "login flow" };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("test('login flow'");
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
            { value: '[data-testid="name"]', strategy: "data-testid" },
            { value: "#name", strategy: "id" },
          ],
        },
      ];
      const opts: E2EGenerateOptions = { useSmartSelectors: true };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain('[data-testid="name"]');
      expect(script).not.toContain("page.locator('#name')");
    });

    it("falls back to original selector when smart selectors disabled", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          smartSelectors: [
            { value: '[data-testid="name"]', strategy: "data-testid" },
          ],
        },
      ];
      const opts: E2EGenerateOptions = { useSmartSelectors: false };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("page.locator('#name')");
      expect(script).not.toContain("data-testid");
    });

    it("enables smart selectors by default", () => {
      const actions: CapturedAction[] = [
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          smartSelectors: [
            { value: '[data-testid="name"]', strategy: "data-testid" },
          ],
        },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain('[data-testid="name"]');
    });
  });

  describe("submit actions", () => {
    it("includes submit button click in generated script", () => {
      const actions: CapturedAction[] = [
        { selector: "#email", value: "a@b.com", actionType: "fill" },
        {
          selector: "#submit-btn",
          value: "",
          actionType: "click",
          label: "Submit",
        },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("// Submit");
      expect(script).toContain("page.locator('#submit-btn').click()");
    });

    it("includes submit-type actions separately from fill", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
        { selector: "button.send", value: "", actionType: "submit" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).toContain("page.locator('#name').fill('John')");
      expect(script).toContain("page.locator('button.send').click()");
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
          { type: "visible-text", expected: "Success!" },
        ],
      };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("// Assertions");
      expect(script).toContain("not.toHaveURL('https://example.com')");
      expect(script).toContain("page.getByText('Success!')");
      expect(script).toContain("toBeVisible()");
    });

    it("does not include assertions when disabled", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];
      const opts: E2EGenerateOptions = {
        includeAssertions: false,
        assertions: [{ type: "url-changed", expected: "https://example.com" }],
      };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).not.toContain("// Assertions");
      expect(script).not.toContain("not.toHaveURL");
    });

    it("generates all assertion types", () => {
      const actions: CapturedAction[] = [];
      const opts: E2EGenerateOptions = {
        includeAssertions: true,
        assertions: [
          { type: "url-changed", expected: "/old" },
          { type: "url-contains", expected: "/dashboard" },
          { type: "visible-text", expected: "Saved" },
          { type: "element-visible", selector: ".success" },
          { type: "element-hidden", selector: ".loading" },
          { type: "toast-message", selector: "[role='alert']" },
          { type: "field-value", selector: "#out", expected: "42" },
          { type: "field-error", selector: ".error" },
          { type: "redirect", expected: "/thank-you" },
        ],
      };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("not.toHaveURL('/old')");
      expect(script).toContain("toHaveURL(new RegExp('/dashboard'))");
      expect(script).toContain("getByText('Saved')");
      expect(script).toContain("locator('.success')).toBeVisible()");
      expect(script).toContain("locator('.loading')).toBeHidden()");
      expect(script).toContain("locator('[role=\\'alert\\']')).toBeVisible()");
      expect(script).toContain("toHaveValue('42')");
      expect(script).toContain("locator('.error')).toBeVisible()");
      expect(script).toContain("toHaveURL(new RegExp('/thank-you'))");
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
        {
          selector: "#name",
          value: "John",
          actionType: "fill",
          required: true,
        },
        { selector: "#submit", value: "", actionType: "click" },
      ];
      const opts: E2EGenerateOptions = {
        pageUrl: "https://example.com",
        includeNegativeTest: true,
      };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain(
        "should show validation errors for empty required fields",
      );
      expect(script).toContain("page.goto('https://example.com')");
      expect(script).toContain("page.locator('#submit').click()");
      expect(script).toContain("toHaveAttribute('required'");
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

      const script = playwrightGenerator.generate(actions, opts);

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
      ];
      const opts: E2EGenerateOptions = {
        includeNegativeTest: true,
        assertions: [{ type: "field-error", selector: ".error-message" }],
      };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("locator('.error-message')).toBeVisible()");
    });
  });

  describe("page object model (POM)", () => {
    it("generates POM class when enabled", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill", label: "Name" },
        {
          selector: "#email",
          value: "j@x.com",
          actionType: "fill",
          label: "Email",
        },
        {
          selector: "#submit",
          value: "",
          actionType: "click",
          label: "Submit",
        },
      ];
      const opts: E2EGenerateOptions = { includePOM: true };

      const script = playwrightGenerator.generate(actions, opts);

      expect(script).toContain("Page Object Model");
      expect(script).toContain("class FormPage");
      expect(script).toContain("get name()");
      expect(script).toContain("get email()");
      expect(script).toContain("get submitButton()");
      expect(script).toContain("async fillForm(");
      expect(script).toContain("async submit()");
    });

    it("does not generate POM when disabled", () => {
      const actions: CapturedAction[] = [
        { selector: "#name", value: "John", actionType: "fill" },
      ];

      const script = playwrightGenerator.generate(actions);

      expect(script).not.toContain("class FormPage");
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

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("import { test, expect }");
      expect(script).toContain("await page.goto('https://example.com')");
      expect(script).toContain("page.locator('#name').fill('John')");
      expect(script).toContain("page.locator('.btn-next').click()");
    });

    it("inserts wait comments for significant delays", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#name", value: "A", timestamp: 1000 }),
        step({ type: "fill", selector: "#email", value: "B", timestamp: 5000 }),
      ];
      const opts: RecordingGenerateOptions = { minWaitThreshold: 1000 };

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("User paused");
      expect(script).toContain("waitForTimeout");
    });

    it("does not insert wait for short delays", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#a", value: "x", timestamp: 1000 }),
        step({ type: "fill", selector: "#b", value: "y", timestamp: 1100 }),
      ];

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).not.toContain("waitForTimeout");
    });

    it("generates wait-for-element steps", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-element",
          selector: "#dynamic-field",
          waitTimeout: 5000,
          timestamp: 2000,
        }),
      ];

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("waitFor");
    });

    it("generates select, check, and submit steps", () => {
      const steps: RecordedStep[] = [
        step({
          type: "select",
          selector: "#country",
          value: "BR",
          timestamp: 1000,
        }),
        step({
          type: "check",
          selector: "#agree",
          timestamp: 1100,
        }),
        step({
          type: "submit",
          selector: "#form-btn",
          label: "Submit",
          timestamp: 1200,
        }),
      ];

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("selectOption('BR')");
      expect(script).toContain(".check()");
      expect(script).toContain(".click()");
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

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("press('Enter')");
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

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain('[data-testid="name-field"]');
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

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("toBeVisible");
    });

    it("respects custom test name", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#x", value: "v", timestamp: 1000 }),
      ];
      const opts: RecordingGenerateOptions = {
        testName: "my custom test",
      };

      const script = playwrightGenerator.generateFromRecording(steps, opts);

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

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("waitForLoadState('networkidle')");
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

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("waitFor({ state: 'hidden', timeout: 10000 })");
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

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("waitFor({ state: 'visible', timeout: 5000 })");
    });

    it("generates wait-for-url step", () => {
      const steps: RecordedStep[] = [
        step({
          type: "wait-for-url",
          url: "/dashboard",
          timestamp: 1000,
        }),
      ];

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("waitForURL('/dashboard')");
    });

    it("generates uncheck and clear and hover steps", () => {
      const steps: RecordedStep[] = [
        step({ type: "uncheck", selector: "#opt-out", timestamp: 1000 }),
        step({ type: "clear", selector: "#field", timestamp: 1100 }),
        step({ type: "hover", selector: "#btn", timestamp: 1200 }),
      ];
      const opts: RecordingGenerateOptions = { includeHoverSteps: true };

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("page.locator('#opt-out').uncheck()");
      expect(script).toContain("page.locator('#field').clear()");
      expect(script).toContain("page.locator('#btn').hover()");
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

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("window.scrollTo(100, 200)");
    });

    it("generates scroll step without scrollPosition", () => {
      const steps: RecordedStep[] = [
        step({ type: "scroll", selector: "#page", timestamp: 1000 }),
      ];
      const opts: RecordingGenerateOptions = { includeScrollSteps: true };

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).toContain("// scroll");
    });

    it("generates assert step with assertion", () => {
      const steps: RecordedStep[] = [
        step({
          type: "assert",
          assertion: { type: "element-visible", selector: "#success" },
          timestamp: 1000,
        }),
      ];

      const script = playwrightGenerator.generateFromRecording(steps);

      expect(script).toContain("toBeVisible");
    });

    it("generates assert step without assertion falls back to comment", () => {
      const steps: RecordedStep[] = [step({ type: "assert", timestamp: 1000 })];

      const script = playwrightGenerator.generateFromRecording(steps);

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

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).not.toContain("scrollTo");
      expect(script).toContain("fill");
      expect(script).toContain("click");
    });

    it("filters out hover steps when includeHoverSteps is false", () => {
      const steps: RecordedStep[] = [
        step({ type: "fill", selector: "#name", value: "A", timestamp: 1000 }),
        step({ type: "hover", selector: "#tooltip", timestamp: 1100 }),
        step({ type: "click", selector: "#btn", timestamp: 1200 }),
      ];
      const opts: RecordingGenerateOptions = { includeHoverSteps: false };

      const script = playwrightGenerator.generateFromRecording(steps, opts);

      expect(script).not.toContain("hover");
      expect(script).toContain("fill");
      expect(script).toContain("click");
    });
  });
});

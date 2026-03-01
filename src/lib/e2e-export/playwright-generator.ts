/**
 * Playwright E2E code generator.
 *
 * Converts captured form-fill actions into a Playwright test script with:
 *   - Smart selectors (data-testid > aria-label > role > name > css)
 *   - Submit button click
 *   - Assertions (URL change, success elements, redirects)
 *   - Negative test generation (empty required fields)
 *   - Page Object Model (POM) class generation
 */

import type {
  CapturedAction,
  E2EAssertion,
  E2EGenerateOptions,
  E2EGenerator,
  RecordedStep,
  RecordingGenerateOptions,
} from "./e2e-export.types";
import { pickBestSelector } from "./smart-selector";

function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function resolveSelector(
  action: CapturedAction,
  useSmartSelectors: boolean,
): string {
  if (useSmartSelectors && action.smartSelectors?.length) {
    return pickBestSelector(action.smartSelectors, action.selector);
  }
  return action.selector;
}

function actionLine(
  action: CapturedAction,
  useSmartSelectors: boolean,
): string {
  const sel = escapeString(resolveSelector(action, useSmartSelectors));
  const val = escapeString(action.value);
  const comment = action.label ? `  // ${action.label}` : "";

  switch (action.actionType) {
    case "fill":
      return `  await page.locator('${sel}').fill('${val}');${comment}`;
    case "check":
      return `  await page.locator('${sel}').check();${comment}`;
    case "uncheck":
      return `  await page.locator('${sel}').uncheck();${comment}`;
    case "select":
      return `  await page.locator('${sel}').selectOption('${val}');${comment}`;
    case "radio":
      return `  await page.locator('${sel}').check();${comment}`;
    case "clear":
      return `  await page.locator('${sel}').clear();${comment}`;
    case "click":
    case "submit":
      return `  await page.locator('${sel}').click();${comment}`;
  }
}

function assertionLine(assertion: E2EAssertion): string {
  switch (assertion.type) {
    case "url-changed":
      return `  await expect(page).not.toHaveURL('${escapeString(assertion.expected ?? "")}');`;
    case "url-contains":
      return `  await expect(page).toHaveURL(new RegExp('${escapeString(assertion.expected ?? "")}'));`;
    case "visible-text":
      return assertion.expected
        ? `  await expect(page.getByText('${escapeString(assertion.expected)}')).toBeVisible();`
        : `  // Expect visible validation feedback`;
    case "element-visible":
      return `  await expect(page.locator('${escapeString(assertion.selector ?? "")}')).toBeVisible();`;
    case "element-hidden":
      return `  await expect(page.locator('${escapeString(assertion.selector ?? "")}')).toBeHidden();`;
    case "toast-message":
      return `  await expect(page.locator('${escapeString(assertion.selector ?? "[role=\\'alert\\']")}')).toBeVisible();`;
    case "field-value":
      return `  await expect(page.locator('${escapeString(assertion.selector ?? "")}')).toHaveValue('${escapeString(assertion.expected ?? "")}');`;
    case "field-error":
      return `  await expect(page.locator('${escapeString(assertion.selector ?? "")}')).toBeVisible();`;
    case "redirect":
      return `  await expect(page).toHaveURL(new RegExp('${escapeString(assertion.expected ?? "")}'));`;
  }
}

function generatePOM(
  actions: CapturedAction[],
  useSmartSelectors: boolean,
): string {
  const fieldLines = actions
    .filter((a) => a.actionType !== "click" && a.actionType !== "submit")
    .map((a) => {
      const sel = escapeString(resolveSelector(a, useSmartSelectors));
      const propName = toCamelCase(a.label ?? a.fieldType ?? "field");
      return `  get ${propName}() { return this.page.locator('${sel}'); }`;
    });

  const submitAction = actions.find(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );
  const submitLine = submitAction
    ? `  get submitButton() { return this.page.locator('${escapeString(resolveSelector(submitAction, useSmartSelectors))}'); }`
    : "";

  const fillLines = actions
    .filter((a) => a.actionType === "fill")
    .map((a) => {
      const propName = toCamelCase(a.label ?? a.fieldType ?? "field");
      return `    await this.${propName}.fill(${propName}Value);`;
    });

  const fillParams = actions
    .filter((a) => a.actionType === "fill")
    .map((a) => {
      const propName = toCamelCase(a.label ?? a.fieldType ?? "field");
      return `${propName}Value: string`;
    })
    .join(", ");

  return [
    `import type { Page } from '@playwright/test';`,
    ``,
    `export class FormPage {`,
    `  constructor(private readonly page: Page) {}`,
    ``,
    ...fieldLines,
    submitLine,
    ``,
    `  async fillForm(${fillParams}) {`,
    ...fillLines,
    `  }`,
    ``,
    submitAction
      ? `  async submit() {\n    await this.submitButton.click();\n  }`
      : "",
    `}`,
    ``,
  ]
    .filter(Boolean)
    .join("\n");
}

function generateNegativeTest(
  actions: CapturedAction[],
  options: E2EGenerateOptions,
  useSmartSelectors: boolean,
): string {
  const requiredActions = actions.filter((a) => a.required);
  if (requiredActions.length === 0) return "";

  const urlLine = options.pageUrl
    ? `  await page.goto('${escapeString(options.pageUrl)}');\n\n`
    : "";

  const submitAction = actions.find(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );

  const submitLine = submitAction
    ? `\n  await page.locator('${escapeString(resolveSelector(submitAction, useSmartSelectors))}').click();`
    : "";

  const assertionLines = (options.assertions ?? [])
    .filter((a) => a.type === "field-error")
    .map(assertionLine);

  return [
    ``,
    `test('should show validation errors for empty required fields', async ({ page }) => {`,
    urlLine + `  // Leave required fields empty and submit` + submitLine,
    ``,
    ...assertionLines,
    `  // Required fields should show validation`,
    ...requiredActions.map((a) => {
      const sel = escapeString(resolveSelector(a, useSmartSelectors));
      return `  await expect(page.locator('${sel}')).toHaveAttribute('required', '');`;
    }),
    `});`,
  ].join("\n");
}

function toCamelCase(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function generate(
  actions: CapturedAction[],
  options?: E2EGenerateOptions,
): string {
  const opts = options ?? {};
  const testName = opts.testName ?? "fill form";
  const useSmartSelectors = opts.useSmartSelectors !== false;
  const urlLine = opts.pageUrl
    ? `  await page.goto('${escapeString(opts.pageUrl)}');\n\n`
    : "";

  const fillActions = actions.filter(
    (a) => a.actionType !== "click" && a.actionType !== "submit",
  );
  const submitActions = actions.filter(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );

  const fillLines = fillActions.map((a) => actionLine(a, useSmartSelectors));
  const submitLines = submitActions.map((a) =>
    actionLine(a, useSmartSelectors),
  );

  const assertionLines =
    opts.includeAssertions && opts.assertions?.length
      ? ["\n  // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const parts = [
    `import { test, expect } from '@playwright/test';`,
    ``,
    `test('${escapeString(testName)}', async ({ page }) => {`,
    urlLine + fillLines.join("\n"),
  ];

  if (submitLines.length > 0) {
    parts.push("");
    parts.push("  // Submit");
    parts.push(submitLines.join("\n"));
  }

  if (assertionLines.length > 0) {
    parts.push(assertionLines.join("\n"));
  }

  parts.push(`});`);

  // Negative test
  if (opts.includeNegativeTest) {
    const negativeTest = generateNegativeTest(actions, opts, useSmartSelectors);
    if (negativeTest) parts.push(negativeTest);
  }

  // POM
  if (opts.includePOM) {
    parts.push("");
    parts.push("// --- Page Object Model ---");
    parts.push(generatePOM(actions, useSmartSelectors));
  }

  parts.push("");
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Recording-based generation
// ---------------------------------------------------------------------------

function recordedStepLine(
  step: RecordedStep,
  useSmartSelectors: boolean,
): string {
  const sel =
    step.smartSelectors?.length && useSmartSelectors
      ? escapeString(pickBestSelector(step.smartSelectors, step.selector ?? ""))
      : escapeString(step.selector ?? "");
  const val = escapeString(step.value ?? "");
  const comment = step.label ? `  // ${step.label}` : "";

  switch (step.type) {
    case "navigate":
      return `  await page.goto('${escapeString(step.url ?? "")}');${comment}`;
    case "fill":
      return `  await page.locator('${sel}').fill('${val}');${comment}`;
    case "click":
      return `  await page.locator('${sel}').click();${comment}`;
    case "select":
      return `  await page.locator('${sel}').selectOption('${val}');${comment}`;
    case "check":
      return `  await page.locator('${sel}').check();${comment}`;
    case "uncheck":
      return `  await page.locator('${sel}').uncheck();${comment}`;
    case "clear":
      return `  await page.locator('${sel}').clear();${comment}`;
    case "submit":
      return `  await page.locator('${sel}').click();${comment}`;
    case "hover":
      return `  await page.locator('${sel}').hover();${comment}`;
    case "press-key":
      return `  await page.keyboard.press('${escapeString(step.key ?? "")}');${comment}`;
    case "wait-for-element":
      return `  await page.locator('${sel}').waitFor({ state: 'visible', timeout: ${step.waitTimeout ?? 5000} });${comment}`;
    case "wait-for-hidden":
      return `  await page.locator('${sel}').waitFor({ state: 'hidden', timeout: ${step.waitTimeout ?? 10000} });${comment}`;
    case "wait-for-url":
      return `  await page.waitForURL('${escapeString(step.url ?? step.value ?? "")}');${comment}`;
    case "wait-for-network-idle":
      return `  await page.waitForLoadState('networkidle');${comment}`;
    case "scroll":
      return step.scrollPosition
        ? `  await page.evaluate(() => window.scrollTo(${step.scrollPosition.x}, ${step.scrollPosition.y}));${comment}`
        : `  // scroll${comment}`;
    case "assert":
      return step.assertion
        ? assertionLine(step.assertion)
        : `  // assert${comment}`;
  }
}

function shouldInsertDelay(
  current: RecordedStep,
  previous: RecordedStep,
  threshold: number,
): number | null {
  const delta = current.timestamp - previous.timestamp;
  return delta >= threshold ? delta : null;
}

function generateFromRecording(
  steps: RecordedStep[],
  options?: RecordingGenerateOptions,
): string {
  const opts = options ?? {};
  const testName = opts.testName ?? "recorded test";
  const useSmartSelectors = opts.useSmartSelectors !== false;
  const minWait = opts.minWaitThreshold ?? 1000;

  const lines: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Skip steps based on options
    if (step.type === "scroll" && !opts.includeScrollSteps) continue;
    if (step.type === "hover" && !opts.includeHoverSteps) continue;
    // Skip the initial navigate if it matches pageUrl (already in goto)
    if (i === 0 && step.type === "navigate" && opts.pageUrl) continue;

    // Insert explicit wait for significant pauses between actions
    if (i > 0) {
      const delay = shouldInsertDelay(step, steps[i - 1], minWait);
      if (delay !== null) {
        lines.push(`  // User paused for ~${Math.round(delay / 1000)}s`);
        lines.push(`  await page.waitForTimeout(${delay});`);
      }
    }

    lines.push(recordedStepLine(step, useSmartSelectors));
  }

  const urlLine = opts.pageUrl
    ? `  await page.goto('${escapeString(opts.pageUrl)}');\n\n`
    : "";

  const assertionLines =
    opts.includeAssertions && opts.assertions?.length
      ? ["\n  // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const parts = [
    `import { test, expect } from '@playwright/test';`,
    ``,
    `test('${escapeString(testName)}', async ({ page }) => {`,
    urlLine + lines.join("\n"),
  ];

  if (assertionLines.length > 0) {
    parts.push(assertionLines.join("\n"));
  }

  parts.push(`});`);
  parts.push("");
  return parts.join("\n");
}

export const playwrightGenerator: E2EGenerator = {
  name: "playwright",
  displayName: "Playwright",
  generate,
  generateFromRecording,
};

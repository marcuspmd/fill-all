/**
 * Pest (Laravel Dusk) E2E code generator.
 *
 * Converts captured form-fill actions into a Pest test script with:
 *   - Smart selectors (data-testid > aria-label > role > name > css)
 *   - Submit button click
 *   - Assertions (URL change, success elements, redirects)
 *   - Negative test generation (empty required fields)
 */

import type {
  CapturedAction,
  E2EAssertion,
  E2EGenerateOptions,
  E2EGenerator,
  RecordedStep,
  RecordingGenerateOptions,
} from "../e2e-export.types";
import { pickBestSelector } from "../smart-selector";

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
  const comment = action.label ? ` // ${action.label}` : "";

  switch (action.actionType) {
    case "fill":
      return `            ->type('${sel}', '${val}')${comment}`;
    case "check":
      return `            ->check('${sel}')${comment}`;
    case "uncheck":
      return `            ->uncheck('${sel}')${comment}`;
    case "select":
      return `            ->select('${sel}', '${val}')${comment}`;
    case "radio":
      return `            ->radio('${sel}', '${val}')${comment}`;
    case "clear":
      return `            ->clear('${sel}')${comment}`;
    case "click":
    case "submit":
      return `            ->click('${sel}')${comment}`;
  }
}

function assertionLine(assertion: E2EAssertion): string {
  switch (assertion.type) {
    case "url-changed":
      return `            ->assertUrlIsNot('${escapeString(assertion.expected ?? "")}')`;
    case "url-contains":
      return `            ->assertPathContains('${escapeString(assertion.expected ?? "")}')`;
    case "visible-text":
      return assertion.expected
        ? `            ->assertSee('${escapeString(assertion.expected)}')`
        : `            // Expect visible validation feedback`;
    case "element-visible":
      return `            ->assertVisible('${escapeString(assertion.selector ?? "")}')`;
    case "element-hidden":
      return `            ->assertMissing('${escapeString(assertion.selector ?? "")}')`;
    case "toast-message":
      return `            ->assertVisible('${escapeString(assertion.selector ?? "[role=\\'alert\\']")}')`;
    case "field-value":
      return `            ->assertInputValue('${escapeString(assertion.selector ?? "")}', '${escapeString(assertion.expected ?? "")}')`;
    case "field-error":
      return `            ->assertVisible('${escapeString(assertion.selector ?? "")}')`;
    case "redirect":
      return `            ->assertPathContains('${escapeString(assertion.expected ?? "")}')`;
    case "response-ok": {
      const url = escapeString(assertion.selector ?? "");
      const status = assertion.expected ?? "200";
      return [
        `            // HTTP response assertion: ${assertion.description ?? `${url} \u2192 ${status}`}`,
        `            // $browser->assertStatus(${status}); // use after visiting the response URL directly`,
      ].join("\n");
    }
  }
}

function generateNegativeTest(
  actions: CapturedAction[],
  options: E2EGenerateOptions,
  useSmartSelectors: boolean,
): string {
  const requiredActions = actions.filter((a) => a.required);
  if (requiredActions.length === 0) return "";

  const visitLine = options.pageUrl
    ? `            ->visit('${escapeString(options.pageUrl)}')\n`
    : "";

  const submitAction = actions.find(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );
  const submitLine = submitAction
    ? `            ->click('${escapeString(resolveSelector(submitAction, useSmartSelectors))}')\n`
    : "";

  const assertionLines = (options.assertions ?? [])
    .filter((a) => a.type === "field-error")
    .map(assertionLine);

  return [
    ``,
    `test('should show validation errors for empty required fields', function () {`,
    `    $this->browse(function (Browser $browser) {`,
    `        $browser`,
    visitLine +
      `            // Leave required fields empty and submit\n` +
      submitLine,
    ...assertionLines,
    ...requiredActions.map((a) => {
      const sel = escapeString(resolveSelector(a, useSmartSelectors));
      return `            ->assertAttribute('${sel}', 'required', '')`;
    }),
    `        ;`,
    `    });`,
    `});`,
  ].join("\n");
}

function generate(
  actions: CapturedAction[],
  options?: E2EGenerateOptions,
): string {
  const opts = options ?? {};
  const testName = opts.testName ?? "fill form";
  const useSmartSelectors = opts.useSmartSelectors !== false;
  const visitLine = opts.pageUrl
    ? `            ->visit('${escapeString(opts.pageUrl)}')\n`
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
      ? ["\n            // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const chain = [visitLine + fillLines.join("\n")];

  if (submitLines.length > 0) {
    chain.push("\n            // Submit");
    chain.push(submitLines.join("\n"));
  }

  if (assertionLines.length > 0) {
    chain.push(assertionLines.join("\n"));
  }

  const parts = [
    `<?php`,
    ``,
    `use Laravel\\Dusk\\Browser;`,
    ``,
    `test('${escapeString(testName)}', function () {`,
    `    $this->browse(function (Browser $browser) {`,
    `        $browser`,
    chain.join("\n"),
    `        ;`,
    `    });`,
    `});`,
  ];

  if (opts.includeNegativeTest) {
    const negativeTest = generateNegativeTest(actions, opts, useSmartSelectors);
    if (negativeTest) parts.push(negativeTest);
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
  const comment = step.label ? ` // ${step.label}` : "";

  switch (step.type) {
    case "navigate":
      return `            ->visit('${escapeString(step.url ?? "")}')${comment}`;
    case "fill":
      return `            ->type('${sel}', '${val}')${comment}`;
    case "click":
      return `            ->click('${sel}')${comment}`;
    case "select":
      return `            ->select('${sel}', '${val}')${comment}`;
    case "check":
      return `            ->check('${sel}')${comment}`;
    case "uncheck":
      return `            ->uncheck('${sel}')${comment}`;
    case "clear":
      return `            ->clear('${sel}')${comment}`;
    case "submit":
      return `            ->click('${sel}')${comment}`;
    case "hover":
      return `            ->mouseover('${sel}')${comment}`;
    case "press-key":
      return `            ->keys('${sel}', '{${(step.key ?? "").toLowerCase()}}')${comment}`;
    case "wait-for-element":
      return `            ->waitFor('${sel}', ${Math.round((step.waitTimeout ?? 5000) / 1000)})${comment}`;
    case "wait-for-hidden":
      return `            ->waitUntilMissing('${sel}', ${Math.round((step.waitTimeout ?? 10000) / 1000)})${comment}`;
    case "wait-for-url":
      return `            ->waitForLocation('${escapeString(step.url ?? step.value ?? "")}')${comment}`;
    case "wait-for-network-idle":
      return `            ->pause(1000)${comment}`;
    case "scroll":
      return `            ->script('window.scrollTo(${step.scrollPosition?.x ?? 0}, ${step.scrollPosition?.y ?? 0})')${comment}`;
    case "assert":
      return step.assertion
        ? assertionLine(step.assertion)
        : `            // assert${comment}`;
  }
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

    if (step.type === "scroll" && !opts.includeScrollSteps) continue;
    if (step.type === "hover" && !opts.includeHoverSteps) continue;
    if (i === 0 && step.type === "navigate" && opts.pageUrl) continue;

    if (i > 0) {
      const delta = step.timestamp - steps[i - 1].timestamp;
      if (delta >= minWait) {
        lines.push(
          `            ->pause(${delta}) // User paused for ~${Math.round(delta / 1000)}s`,
        );
      }
    }

    lines.push(recordedStepLine(step, useSmartSelectors));
  }

  const visitLine = opts.pageUrl
    ? `            ->visit('${escapeString(opts.pageUrl)}')\n`
    : "";

  const assertionLines =
    opts.includeAssertions && opts.assertions?.length
      ? ["\n            // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const chain = [visitLine + lines.join("\n")];

  if (assertionLines.length > 0) {
    chain.push(assertionLines.join("\n"));
  }

  const parts = [
    `<?php`,
    ``,
    `use Laravel\\Dusk\\Browser;`,
    ``,
    `test('${escapeString(testName)}', function () {`,
    `    $this->browse(function (Browser $browser) {`,
    `        $browser`,
    chain.join("\n"),
    `        ;`,
    `    });`,
    `});`,
    ``,
  ];

  return parts.join("\n");
}

export const pestGenerator: E2EGenerator = {
  name: "pest",
  displayName: "Pest (Laravel Dusk)",
  generate,
  generateFromRecording,
};

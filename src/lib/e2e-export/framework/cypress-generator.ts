/**
 * Cypress E2E code generator.
 *
 * Converts captured form-fill actions into a Cypress test script with:
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
  const comment = action.label ? `  // ${action.label}` : "";

  switch (action.actionType) {
    case "fill":
      return `    cy.get('${sel}').clear().type('${val}');${comment}`;
    case "check":
      return `    cy.get('${sel}').check();${comment}`;
    case "uncheck":
      return `    cy.get('${sel}').uncheck();${comment}`;
    case "select":
      return `    cy.get('${sel}').select('${val}');${comment}`;
    case "radio":
      return `    cy.get('${sel}').check();${comment}`;
    case "clear":
      return `    cy.get('${sel}').clear();${comment}`;
    case "click":
    case "submit":
      return `    cy.get('${sel}').click();${comment}`;
  }
}

function assertionLine(assertion: E2EAssertion): string {
  switch (assertion.type) {
    case "url-changed":
      return `    cy.url().should('not.eq', '${escapeString(assertion.expected ?? "")}');`;
    case "url-contains":
      return `    cy.url().should('include', '${escapeString(assertion.expected ?? "")}');`;
    case "visible-text":
      return assertion.expected
        ? `    cy.contains('${escapeString(assertion.expected)}').should('be.visible');`
        : `    // Expect visible validation feedback`;
    case "element-visible":
      return `    cy.get('${escapeString(assertion.selector ?? "")}').should('be.visible');`;
    case "element-hidden":
      return `    cy.get('${escapeString(assertion.selector ?? "")}').should('not.be.visible');`;
    case "toast-message":
      return `    cy.get('${escapeString(assertion.selector ?? "[role=\\'alert\\']")}').should('be.visible');`;
    case "field-value":
      return `    cy.get('${escapeString(assertion.selector ?? "")}').should('have.value', '${escapeString(assertion.expected ?? "")}');`;
    case "field-error":
      return `    cy.get('${escapeString(assertion.selector ?? "")}').should('be.visible');`;
    case "redirect":
      return `    cy.url().should('include', '${escapeString(assertion.expected ?? "")}');`;
    case "response-ok": {
      const url = escapeString(assertion.selector ?? "");
      const status = assertion.expected ?? "200";
      const urlFragment = url.split("/").pop() ?? url;
      return [
        `    // HTTP response assertion: ${assertion.description ?? `${url} → ${status}`}`,
        `    // To assert strictly, add before the submit action:`,
        `    //   cy.intercept('*', '*${urlFragment}*').as('apiRequest');`,
        `    //   cy.wait('@apiRequest').its('response.statusCode').should('eq', ${status});`,
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

  const urlLine = options.pageUrl
    ? `    cy.visit('${escapeString(options.pageUrl)}');\n\n`
    : "";

  const submitAction = actions.find(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );

  const submitLine = submitAction
    ? `\n    cy.get('${escapeString(resolveSelector(submitAction, useSmartSelectors))}').click();`
    : "";

  const assertionLines = (options.assertions ?? [])
    .filter((a) => a.type === "field-error")
    .map(assertionLine);

  return [
    ``,
    `  it('should show validation errors for empty required fields', () => {`,
    urlLine + `    // Leave required fields empty and submit` + submitLine,
    ``,
    ...assertionLines,
    `    // Required fields should show validation`,
    ...requiredActions.map((a) => {
      const sel = escapeString(resolveSelector(a, useSmartSelectors));
      return `    cy.get('${sel}').should('have.attr', 'required');`;
    }),
    `  });`,
  ].join("\n");
}

function generate(
  actions: CapturedAction[],
  options?: E2EGenerateOptions,
): string {
  const opts = options ?? {};
  const testName = opts.testName ?? "fill form";
  const useSmartSelectors = opts.useSmartSelectors !== false;
  const urlLine = opts.pageUrl
    ? `    cy.visit('${escapeString(opts.pageUrl)}');\n\n`
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
      ? ["\n    // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const parts = [
    `describe('${escapeString(testName)}', () => {`,
    `  it('should fill all fields', () => {`,
    urlLine + fillLines.join("\n"),
  ];

  if (submitLines.length > 0) {
    parts.push("");
    parts.push("    // Submit");
    parts.push(submitLines.join("\n"));
  }

  if (assertionLines.length > 0) {
    parts.push(assertionLines.join("\n"));
  }

  parts.push(`  });`);

  // Negative test
  if (opts.includeNegativeTest) {
    const negativeTest = generateNegativeTest(actions, opts, useSmartSelectors);
    if (negativeTest) parts.push(negativeTest);
  }

  parts.push(`});`);
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
      return `    cy.visit('${escapeString(step.url ?? "")}');${comment}`;
    case "fill":
      return `    cy.get('${sel}').clear().type('${val}');${comment}`;
    case "click":
      return `    cy.get('${sel}').click();${comment}`;
    case "select":
      return `    cy.get('${sel}').select('${val}');${comment}`;
    case "check":
      return `    cy.get('${sel}').check();${comment}`;
    case "uncheck":
      return `    cy.get('${sel}').uncheck();${comment}`;
    case "clear":
      return `    cy.get('${sel}').clear();${comment}`;
    case "submit":
      return `    cy.get('${sel}').click();${comment}`;
    case "hover":
      return `    cy.get('${sel}').trigger('mouseover');${comment}`;
    case "press-key":
      return `    cy.get('body').type('{${(step.key ?? "").toLowerCase()}}');${comment}`;
    case "wait-for-element":
      return `    cy.get('${sel}', { timeout: ${step.waitTimeout ?? 5000} }).should('be.visible');${comment}`;
    case "wait-for-hidden":
      return `    cy.get('${sel}', { timeout: ${step.waitTimeout ?? 10000} }).should('not.exist');${comment}`;
    case "wait-for-url":
      return `    cy.url().should('include', '${escapeString(step.url ?? step.value ?? "")}');${comment}`;
    case "wait-for-network-idle":
      return `    cy.intercept('**').as('requests');\n    cy.wait('@requests');${comment}`;
    case "scroll":
      return step.scrollPosition
        ? `    cy.scrollTo(${step.scrollPosition.x}, ${step.scrollPosition.y});${comment}`
        : `    // scroll${comment}`;
    case "assert":
      return step.assertion
        ? assertionLine(step.assertion)
        : `    // assert${comment}`;
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
        lines.push(`    // User paused for ~${Math.round(delta / 1000)}s`);
        lines.push(`    cy.wait(${delta});`);
      }
    }

    lines.push(recordedStepLine(step, useSmartSelectors));
  }

  const urlLine = opts.pageUrl
    ? `    cy.visit('${escapeString(opts.pageUrl)}');\n\n`
    : "";

  const assertionLines =
    opts.includeAssertions && opts.assertions?.length
      ? ["\n    // Assertions", ...opts.assertions.map(assertionLine)]
      : [];

  const parts = [
    `describe('${escapeString(testName)}', () => {`,
    `  it('should complete recorded flow', () => {`,
    urlLine + lines.join("\n"),
  ];

  if (assertionLines.length > 0) {
    parts.push(assertionLines.join("\n"));
  }

  parts.push(`  });`);
  parts.push(`});`);
  parts.push("");
  return parts.join("\n");
}

export const cypressGenerator: E2EGenerator = {
  name: "cypress",
  displayName: "Cypress",
  generate,
  generateFromRecording,
};

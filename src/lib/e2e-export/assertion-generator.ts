/**
 * Assertion Generator
 *
 * Detects potential assertions for E2E tests by analyzing the page DOM:
 *   - Submit buttons → expect URL change or success message
 *   - Required fields → expect validation errors when empty
 *   - Toast/notification containers → expect visible feedback
 *   - Form action attribute → expect redirect
 *
 * Runs in content-script context (DOM access required).
 */

import type { E2EAssertion, CapturedAction } from "./e2e-export.types";

/**
 * Detects potential success assertions for a form submit.
 * Analyzes the page for common patterns of success feedback.
 */
export function detectAssertions(
  actions: CapturedAction[],
  pageUrl: string,
): E2EAssertion[] {
  const assertions: E2EAssertion[] = [];

  // 1. If there's a submit action, expect URL might change
  const hasSubmit = actions.some(
    (a) => a.actionType === "click" || a.actionType === "submit",
  );

  if (hasSubmit) {
    assertions.push({
      type: "url-changed",
      expected: pageUrl,
      description: "URL should change after form submit",
    });
  }

  // 2. Look for common success message containers
  const successSelectors = [
    ".alert-success",
    ".toast-success",
    ".notification-success",
    "[role='alert']",
    ".success-message",
    ".flash-success",
    ".Toastify__toast--success",
    ".ant-message-success",
    ".MuiAlert-standardSuccess",
  ];

  for (const sel of successSelectors) {
    if (document.querySelector(sel)) {
      assertions.push({
        type: "element-visible",
        selector: sel,
        description: `Success element "${sel}" should be visible`,
      });
      break; // One success assertion is enough
    }
  }

  // 3. If form has action attribute with different URL, expect redirect
  const forms = document.querySelectorAll("form[action]");
  for (const form of forms) {
    const action = form.getAttribute("action");
    if (
      action &&
      action !== "#" &&
      action !== "" &&
      !action.startsWith("javascript:")
    ) {
      assertions.push({
        type: "redirect",
        expected: action,
        description: `Form should redirect to ${action}`,
      });
      break;
    }
  }

  return assertions;
}

/**
 * Generates negative-test assertions for required fields.
 * When required fields are left empty, validation errors should appear.
 */
export function detectNegativeAssertions(
  actions: CapturedAction[],
): E2EAssertion[] {
  const assertions: E2EAssertion[] = [];

  const requiredActions = actions.filter((a) => a.required);
  if (requiredActions.length === 0) return assertions;

  // Expect validation error containers
  const errorSelectors = [
    ".field-error",
    ".error-message",
    ".invalid-feedback",
    ".form-error",
    "[role='alert']",
    ".ant-form-item-explain-error",
    ".MuiFormHelperText-root.Mui-error",
    ".text-danger",
    ".text-red-500",
  ];

  for (const sel of errorSelectors) {
    if (document.querySelector(sel)) {
      assertions.push({
        type: "field-error",
        selector: sel,
        description:
          "Validation error should be visible for empty required fields",
      });
      break;
    }
  }

  // Generic: at least one required field should trigger browser validation
  assertions.push({
    type: "visible-text",
    description: "Required field validation should prevent submission",
  });

  return assertions;
}

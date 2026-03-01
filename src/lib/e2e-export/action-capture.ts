/**
 * Captures form-fill results and converts them into CapturedAction[]
 * for E2E script generation.
 *
 * Includes: smart selectors, submit button detection, field metadata.
 * Runs in the content script context (has access to DOM).
 */

import type { FormField, GenerationResult } from "@/types";
import type { ActionType, CapturedAction } from "./e2e-export.types";
import { extractSmartSelectors } from "./smart-selector";

function resolveActionType(field: FormField): ActionType {
  const el = field.element;

  if (el instanceof HTMLSelectElement) return "select";

  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox") return el.checked ? "check" : "uncheck";
    if (el.type === "radio") return "radio";
    if (el.type === "submit") return "submit";
  }

  if (el instanceof HTMLButtonElement && el.type === "submit") return "submit";

  return "fill";
}

function resolveLabel(field: FormField): string | undefined {
  return field.label ?? field.name ?? field.id ?? undefined;
}

/**
 * Converts fill results (from `fillAllFields`) into captured actions
 * that can be fed to an E2E generator.
 *
 * @param fields - Detected form fields (must include `.element`)
 * @param results - Generation results (one per filled field)
 */
export function buildCapturedActions(
  fields: FormField[],
  results: GenerationResult[],
): CapturedAction[] {
  const fieldBySelector = new Map(fields.map((f) => [f.selector, f]));
  const actions: CapturedAction[] = [];

  for (const result of results) {
    const field = fieldBySelector.get(result.fieldSelector);
    if (!field) continue;

    actions.push({
      selector: field.selector,
      smartSelectors: extractSmartSelectors(field.element),
      value: result.value,
      actionType: resolveActionType(field),
      label: resolveLabel(field),
      fieldType: field.fieldType,
      required: field.required,
    });
  }

  return actions;
}

/**
 * Detects submit buttons within or near the given form fields.
 * Looks for: button[type=submit], input[type=submit], button with submit-like text.
 */
export function detectSubmitActions(): CapturedAction[] {
  const submitActions: CapturedAction[] = [];
  const seen = new Set<Element>();

  // 1. Explicit submit buttons/inputs
  const submitElements = document.querySelectorAll(
    'button[type="submit"], input[type="submit"]',
  );

  for (const el of submitElements) {
    if (seen.has(el)) continue;
    seen.add(el);

    const label =
      el instanceof HTMLInputElement
        ? el.value || "Submit"
        : el.textContent?.trim() || "Submit";

    submitActions.push({
      selector: buildQuickSelector(el),
      smartSelectors: extractSmartSelectors(el),
      value: "",
      actionType: "click",
      label,
    });
  }

  // 2. Buttons without explicit type inside forms (default to submit)
  const forms = document.querySelectorAll("form");
  for (const form of forms) {
    const buttons = form.querySelectorAll(
      "button:not([type]), button[type='submit']",
    );
    for (const btn of buttons) {
      if (seen.has(btn)) continue;
      seen.add(btn);

      const label = btn.textContent?.trim() || "Submit";
      const text = label.toLowerCase();

      // Only capture buttons that look like submit actions
      const submitKeywords = [
        "submit",
        "enviar",
        "salvar",
        "save",
        "send",
        "cadastrar",
        "register",
        "login",
        "entrar",
        "sign",
        "criar",
        "create",
        "confirm",
        "confirmar",
        "next",
        "próximo",
        "continuar",
        "continue",
      ];

      if (
        submitKeywords.some((kw) => text.includes(kw)) ||
        !btn.getAttribute("type")
      ) {
        submitActions.push({
          selector: buildQuickSelector(btn),
          smartSelectors: extractSmartSelectors(btn),
          value: "",
          actionType: "click",
          label,
        });
      }
    }
  }

  return submitActions;
}

function buildQuickSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const testId =
    el.getAttribute("data-testid") ?? el.getAttribute("data-test-id");
  if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

  const name = el.getAttribute("name");
  if (name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;

  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");
  if (type) return `${tag}[type="${CSS.escape(type)}"]`;

  return tag;
}

/**
 * Interactive Field Detector
 *
 * Detects non-native interactive widgets that are NOT captured by the standard
 * INPUT_SELECTOR (input/select/textarea). These include date pickers, rich-text
 * editors, sliders, toggles, rating stars, CAPTCHAs, etc.
 *
 * Each detected widget produces an `InteractiveField` object compatible with
 * the FormField interface (via `interactiveFieldToFormField`).
 */

import type { FormField, InteractiveFieldType } from "@/types";
import type { Detector } from "./detector.interface";
import { createLogger } from "@/lib/logger";

const log = createLogger("InteractiveDetector");

export interface InteractiveField {
  container: HTMLElement;
  selector: string;
  interactiveType: InteractiveFieldType;
  label?: string;
  name?: string;
  id?: string;
  isInteractive: true;
}

// ── Selector groups per widget type ─────────────────────────────────────────

const INTERACTIVE_PATTERNS: Array<{
  type: InteractiveFieldType;
  selectors: string[];
}> = [
  {
    type: "date-picker",
    selectors: [
      ".flatpickr-input:not([type='hidden'])",
      "[data-flatpickr]",
      ".pikaday__input",
      ".datepicker-input",
      ".react-datepicker__input-container > input",
      ".daterangepicker-input",
      "[class*='date-picker'] input:not([type='hidden'])",
      "[class*='datepicker'] input:not([type='hidden'])",
      "[data-provide='datepicker']",
    ],
  },
  {
    type: "time-picker",
    selectors: [
      "[class*='timepicker'] input:not([type='hidden'])",
      "[data-timepicker]",
      "[class*='time-picker'] input:not([type='hidden'])",
    ],
  },
  {
    type: "rich-text",
    selectors: [
      "[contenteditable='true']:not([class*='fill-all'])",
      ".ql-editor", // Quill
      ".ProseMirror", // TipTap / ProseMirror
      ".tox-edit-area__iframe", // TinyMCE (iframe wrapper)
      ".cke_editable", // CKEditor 4
      "[data-gramm='false'][contenteditable]", // Draft.js
      ".fr-element[contenteditable]", // Froala
    ],
  },
  {
    type: "slider",
    selectors: [
      "input[type='range']",
      ".noUi-target",
      "[data-slider]",
      "[class*='slider']:not(input):not(select)",
      "[role='slider']:not(input)",
    ],
  },
  {
    type: "toggle",
    selectors: [
      "input[type='checkbox'][role='switch']",
      "[class*='toggle']:not(input):not(script):not(style)",
      "[class*='switch']:not(input):not(script):not(style)",
      "[role='switch']",
    ],
  },
  {
    type: "rating",
    selectors: [
      "[class*='rating']:not(script):not(style)",
      "[class*='star-rating']",
      "[class*='stars'][role]",
    ],
  },
  {
    type: "captcha",
    selectors: [
      ".g-recaptcha",
      ".h-captcha",
      "[data-sitekey]",
      "#recaptcha",
      "iframe[src*='recaptcha']",
      "iframe[src*='hcaptcha']",
    ],
  },
  {
    type: "color-picker",
    selectors: [
      "input[type='color']",
      "[class*='color-picker']:not(script):not(style)",
      "[class*='colorpicker']:not(script):not(style)",
    ],
  },
  {
    type: "autocomplete",
    selectors: [
      "[role='combobox']:not(input):not(select)",
      "[class*='autocomplete'] input:not([type='hidden'])",
      "[class*='typeahead'] input:not([type='hidden'])",
      "[class*='combobox'] input:not([type='hidden'])",
    ],
  },
];

// ── Label resolution for interactive widgets ─────────────────────────────────

function findInteractiveLabel(el: HTMLElement): string | undefined {
  // 1. aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();

  // 2. aria-labelledby
  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref?.textContent) return ref.textContent.trim();
  }

  // 3. label[for] — on the element or the inner input
  const idToSearch = el.id || el.querySelector<HTMLElement>("[id]")?.id || null;
  if (idToSearch) {
    const lbl = document.querySelector<HTMLElement>(
      `label[for="${CSS.escape(idToSearch)}"]`,
    );
    if (lbl?.textContent) return lbl.textContent.trim();
  }

  // 4. Parent form-group label
  const formGroup = el.closest(
    ".form-group, .form-item, .form-field, .field-wrapper, .input-wrapper, [class*='form-control']",
  );
  if (formGroup) {
    const lbl = formGroup.querySelector<HTMLElement>(
      "label, .form-label, .control-label, [class*='label']",
    );
    if (lbl?.textContent) return lbl.textContent.trim();
  }

  // 5. Closest preceding sibling with label-like text
  let sibling = el.previousElementSibling as HTMLElement | null;
  while (sibling) {
    const tag = sibling.tagName.toLowerCase();
    if (tag === "label" && sibling.textContent) {
      return sibling.textContent.trim();
    }
    if (
      ["span", "div", "p"].includes(tag) &&
      sibling.textContent &&
      sibling.textContent.trim().length < 80
    ) {
      return sibling.textContent.trim();
    }
    sibling = sibling.previousElementSibling as HTMLElement | null;
  }

  // 6. placeholder
  const placeholder =
    el.getAttribute("placeholder") ||
    el.querySelector<HTMLInputElement>("input")?.placeholder;
  if (placeholder) return placeholder.trim();

  return undefined;
}

function getInteractiveSelector(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const innerInput = el.querySelector<HTMLElement>("[id]");
  if (innerInput?.id) return `#${CSS.escape(innerInput.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body) {
    let seg = current.tagName.toLowerCase();

    if ((current as HTMLElement).id) {
      parts.unshift(`#${CSS.escape((current as HTMLElement).id)}`);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        seg += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(seg);
    current = parent;
  }

  return parts.join(" > ");
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Scans the page for interactive/custom widgets not covered by standard
 * input/select/textarea selectors.
 */
export function detectInteractiveFields(): InteractiveField[] {
  const results: InteractiveField[] = [];
  const seen = new Set<HTMLElement>();

  log.groupCollapsed(`🏛️ Detectando campos interativos...`);

  for (const pattern of INTERACTIVE_PATTERNS) {
    const selector = pattern.selectors.join(", ");

    let elements: NodeListOf<HTMLElement>;
    try {
      elements = document.querySelectorAll<HTMLElement>(selector);
    } catch {
      // Invalid selector in some edge-case browsers — skip gracefully
      continue;
    }

    for (const el of elements) {
      // Skip invisible
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      // Skip our own UI elements
      if (
        el.closest(
          "#fill-all-floating-panel, #fill-all-field-icon, #fill-all-field-inspector",
        )
      )
        continue;

      // Deduplicate — prefer the outermost match
      if (seen.has(el)) continue;

      // Mark all descendants as seen to avoid double-reporting nested matches
      seen.add(el);
      el.querySelectorAll<HTMLElement>("*").forEach((child) => seen.add(child));

      const label = findInteractiveLabel(el);
      const interactiveSelector = getInteractiveSelector(el);

      const field: InteractiveField = {
        container: el,
        selector: interactiveSelector,
        interactiveType: pattern.type,
        label,
        name:
          el.getAttribute("name") ||
          el.querySelector<HTMLInputElement>("input[name]")?.name ||
          undefined,
        id: el.id || undefined,
        isInteractive: true,
      };

      results.push(field);

      log.debug(
        `🏛️ ${pattern.type.padEnd(12)} │ selector="${interactiveSelector}" │ label="${label ?? "(sem label)"}"`,
      );
    }
  }

  if (results.length === 0) {
    log.debug("Nenhum widget interativo encontrado");
  } else {
    log.debug(`✅ ${results.length} widget(s) interativo(s) encontrado(s)`);
  }

  log.groupEnd();

  return results;
}

/** Detector object — wraps {@link detectInteractiveFields} under the common Detector contract. */
export const interactiveFieldDetector: Detector<void, InteractiveField[]> = {
  name: "interactive-fields",
  detect: () => detectInteractiveFields(),
};

/**
 * Converts an InteractiveField to a minimal FormField-compatible object
 * so it can be included in the unified field list.
 */
export function interactiveFieldToFormField(f: InteractiveField): FormField {
  // Pull a real DOM element — prefer the container itself if it's an input,
  // otherwise use the first inner input, or fall back to casting the container.
  let el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  if (
    f.container instanceof HTMLInputElement ||
    f.container instanceof HTMLSelectElement ||
    f.container instanceof HTMLTextAreaElement
  ) {
    el = f.container;
  } else {
    const inner = f.container.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    if (inner) {
      el = inner;
    } else {
      // Last resort: cast. The filler must handle `isInteractive` separately.
      el = f.container as unknown as HTMLInputElement;
    }
  }

  // Map interactive type to the closest FieldType
  const typeMap: Record<InteractiveFieldType, FormField["fieldType"]> = {
    "date-picker": "date",
    "time-picker": "date",
    "rich-text": "text",
    slider: "number",
    toggle: "checkbox",
    rating: "number",
    captcha: "unknown",
    "color-picker": "text",
    autocomplete: "unknown",
  };

  return {
    element: el,
    selector: f.selector,
    fieldType: typeMap[f.interactiveType] ?? "unknown",
    label: f.label,
    name: f.name,
    id: f.id,
    required: false,
    isInteractive: true,
    interactiveType: f.interactiveType,
    detectionMethod: "interactive",
    detectionConfidence: 1.0,
    contextSignals: [f.label, f.name, f.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

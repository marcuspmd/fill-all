/**
 * DOM Watcher — observes DOM mutations after field interactions
 * to detect new/changed form fields and re-fill them
 */

import { detectAllFields } from "./form-detector";
import { fillAllFields } from "./form-filler";

type DomWatcherCallback = (newFieldsCount: number) => void;

let observer: MutationObserver | null = null;
let isWatching = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastFieldSignature = "";
let onNewFieldsCallback: DomWatcherCallback | null = null;
let isFillingInProgress = false;

/**
 * Starts watching the DOM for form changes.
 * When new fields are detected, calls the callback and optionally re-fills.
 */
export function startWatching(
  callback?: DomWatcherCallback,
  autoRefill = false,
): void {
  if (isWatching) return;

  onNewFieldsCallback = callback ?? null;
  lastFieldSignature = getCurrentFieldSignature();
  isWatching = true;

  observer = new MutationObserver((mutations) => {
    // Ignore mutations triggered by the extension itself
    if (isFillingInProgress) return;

    // Check if any mutation is relevant (not just style/class changes on our elements)
    const isRelevant = mutations.some((m) => {
      if (
        m.type === "childList" &&
        (m.addedNodes.length > 0 || m.removedNodes.length > 0)
      ) {
        return true;
      }
      if (m.type === "attributes") {
        const target = m.target as HTMLElement;
        // Ignore our own highlight changes
        if (target.id === "fill-all-notification") return false;
        if (target.id === "fill-all-floating-panel") return false;
        // Relevant if it's a form-related attribute change
        if (
          m.attributeName === "disabled" ||
          m.attributeName === "hidden" ||
          m.attributeName === "style" ||
          m.attributeName === "class"
        ) {
          return hasFormContent(target);
        }
      }
      return false;
    });

    if (!isRelevant) return;

    // Debounce to avoid processing rapid successive changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const newSignature = getCurrentFieldSignature();
      if (newSignature !== lastFieldSignature) {
        const oldCount = lastFieldSignature.split("|").filter(Boolean).length;
        const newCount = newSignature.split("|").filter(Boolean).length;
        const diff = newCount - oldCount;

        lastFieldSignature = newSignature;

        if (diff > 0) {
          console.log(`[Fill All] Detected ${diff} new form field(s)`);

          if (onNewFieldsCallback) {
            onNewFieldsCallback(diff);
          }

          if (autoRefill) {
            await refillNewFields();
          }
        } else if (diff !== 0) {
          // Fields were removed or changed - update signature
          console.log(`[Fill All] Form structure changed (${diff} fields)`);
          if (onNewFieldsCallback) {
            onNewFieldsCallback(diff);
          }
        }
      }
    }, 600);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "hidden", "style", "class"],
  });

  console.log("[Fill All] DOM watcher started");
}

/**
 * Stops watching the DOM
 */
export function stopWatching(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  isWatching = false;
  onNewFieldsCallback = null;
  console.log("[Fill All] DOM watcher stopped");
}

/**
 * Returns whether the watcher is active
 */
export function isWatcherActive(): boolean {
  return isWatching;
}

/**
 * Marks that filling is in progress (to avoid self-triggering)
 */
export function setFillingInProgress(value: boolean): void {
  isFillingInProgress = value;
}

/**
 * Re-fills only the new fields that appeared after a DOM change
 */
async function refillNewFields(): Promise<void> {
  isFillingInProgress = true;
  try {
    await fillAllFields();
    lastFieldSignature = getCurrentFieldSignature();
  } finally {
    isFillingInProgress = false;
  }
}

/**
 * Generates a signature string from current form fields for change detection
 */
function getCurrentFieldSignature(): string {
  const { fields, customSelects } = detectAllFields();

  const fieldSigs = fields.map((f) => `${f.selector}:${f.fieldType}`);
  const csSigs = customSelects.map((cs) => `cs:${cs.selector}:${cs.framework}`);

  return [...fieldSigs, ...csSigs].sort().join("|");
}

/**
 * Checks if an element contains or is a form-related element
 */
function hasFormContent(el: HTMLElement): boolean {
  if (
    el.tagName === "INPUT" ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "FORM"
  ) {
    return true;
  }

  // Check if it's a custom select container
  if (
    el.classList.contains("ant-select") ||
    el.classList.contains("ant-form-item") ||
    el.className.includes("MuiFormControl") ||
    el.className.includes("react-select")
  ) {
    return true;
  }

  // Check if it contains form elements
  return (
    el.querySelector("input, select, textarea, .ant-select, .ant-form-item") !==
    null
  );
}

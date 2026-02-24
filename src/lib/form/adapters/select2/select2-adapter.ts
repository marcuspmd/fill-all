/**
 * Select2 Adapter
 *
 * Detects and fills Select2 v4.x components.
 * Select2 renders a custom dropdown over a hidden <select> or <input> element.
 *
 * DOM structure (v4):
 *   <span class="select2 select2-container ...">
 *     <span class="select2-selection ...">
 *       <span class="select2-selection__rendered">Displayed text</span>
 *     </span>
 *   </span>
 *   <select class="select2-hidden-accessible" ...>  ← original element (may exist)
 *
 * Detection: `.select2-container` or `.select2` root wrapper.
 * Filling: Programmatically set value on the hidden <select>, then trigger `change`.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  getUniqueSelector,
  buildSignals,
  findLabelWithStrategy,
} from "../../extractors";

export const select2Adapter: CustomComponentAdapter = {
  name: "select2",
  selector: ".select2-container, span.select2",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("select2-container") ||
      el.classList.contains("select2")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    // Find the original <select> element linked to this container
    const hiddenSelect = findOriginalSelect(wrapper);

    // Extract options from the original <select> or from the dropdown DOM
    const options = extractOptions(hiddenSelect);

    // Extract label
    const labelTarget = hiddenSelect ?? wrapper;
    const labelResult = findLabelWithStrategy(labelTarget);

    // Extract placeholder
    const placeholder = extractPlaceholder(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "unknown",
      adapterName: "select2",
      label: labelResult?.text,
      name: hiddenSelect?.name || undefined,
      id: hiddenSelect?.id || wrapper.id || undefined,
      placeholder,
      required: hiddenSelect?.required ?? false,
      options,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const hiddenSelect = findOriginalSelect(wrapper);
    if (!hiddenSelect) return false;

    const options = Array.from(hiddenSelect.options);

    // Try matching by value
    const byValue = options.find((opt) => opt.value === value);
    if (byValue) {
      hiddenSelect.value = byValue.value;
      triggerSelect2Change(hiddenSelect);
      return true;
    }

    // Try matching by text (partial, case-insensitive)
    const byText = options.find((opt) =>
      opt.text.toLowerCase().includes(value.toLowerCase()),
    );
    if (byText) {
      hiddenSelect.value = byText.value;
      triggerSelect2Change(hiddenSelect);
      return true;
    }

    // Fallback: pick a random non-empty option
    const validOptions = options.filter((opt) => opt.value);
    if (validOptions.length > 0) {
      const random =
        validOptions[Math.floor(Math.random() * validOptions.length)];
      hiddenSelect.value = random.value;
      triggerSelect2Change(hiddenSelect);
      return true;
    }

    return false;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Finds the original <select> element associated with a Select2 container.
 * Select2 stores the reference either as a sibling or via data attribute.
 */
function findOriginalSelect(wrapper: HTMLElement): HTMLSelectElement | null {
  // Select2 wraps after the <select> — look for a preceding sibling
  const prev = wrapper.previousElementSibling;
  if (prev instanceof HTMLSelectElement) return prev;

  // Some layouts place the <select> as a hidden child inside the wrapper's parent
  const parent = wrapper.parentElement;
  if (parent) {
    const select = parent.querySelector<HTMLSelectElement>(
      "select.select2-hidden-accessible, select[data-select2-id]",
    );
    if (select) return select;
  }

  // Last resort: traverse upward and search nearby
  const container = wrapper.closest(".select2-container")?.parentElement;
  if (container) {
    return container.querySelector<HTMLSelectElement>("select") ?? null;
  }

  return null;
}

function extractOptions(
  hiddenSelect: HTMLSelectElement | null,
): Array<{ value: string; text: string }> | undefined {
  if (!hiddenSelect) return undefined;

  const opts = Array.from(hiddenSelect.options)
    .filter((o) => o.value !== "")
    .map((o) => ({ value: o.value, text: o.text.trim() }));

  return opts.length > 0 ? opts : undefined;
}

function extractPlaceholder(wrapper: HTMLElement): string | undefined {
  const rendered = wrapper.querySelector<HTMLElement>(
    ".select2-selection__placeholder",
  );
  return rendered?.textContent?.trim() || undefined;
}

/**
 * Triggers Select2-specific change events.
 * Uses jQuery trigger when available (Select2 v4 depends on jQuery),
 * otherwise falls back to native events.
 */
function triggerSelect2Change(select: HTMLSelectElement): void {
  // Trigger native events
  select.dispatchEvent(new Event("change", { bubbles: true }));

  // Select2 v4 listens on jQuery events — try to trigger them
  const jq = (window as unknown as Record<string, unknown>).jQuery as
    | ((el: HTMLElement) => { trigger: (event: string) => void })
    | undefined;

  if (typeof jq === "function") {
    try {
      jq(select).trigger("change.select2");
    } catch {
      // jQuery not available or trigger failed — native event already dispatched
    }
  }
}

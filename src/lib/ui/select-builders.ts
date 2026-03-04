/**
 * Select HTML builders — shared utilities for building <select> / <optgroup>
 * HTML strings for field-type and generator selects, as well as `SelectEntry[]`
 * arrays for use with `SearchableSelect`.
 *
 * Used by options page and popup to render typed selects consistently.
 */

import { FIELD_TYPES, type FieldType } from "@/types";
import { getFieldTypeGroupedOptions } from "@/lib/shared/field-type-catalog";
import { escapeHtml } from "./html-utils";
import type { SelectEntry } from "./searchable-select";

/**
 * Builds a full set of `<optgroup>/<option>` HTML for all field types,
 * grouped by category.
 */
export function buildFieldTypeOptionsHtml(selected?: string): string {
  return getFieldTypeGroupedOptions(FIELD_TYPES)
    .map(
      (group) =>
        `<optgroup label="${escapeHtml(group.label)}">${group.options
          .map(
            (entry) =>
              `<option value="${entry.value}"${entry.value === selected ? " selected" : ""}>${escapeHtml(entry.label)}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}

/** Extra entries that appear before the grouped field types in generator selects. */
const GENERATOR_EXTRA_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "auto", label: "Automático" },
  { value: "ai", label: "Chrome AI" },
  { value: "tensorflow", label: "TensorFlow.js" },
];

/**
 * Builds the full `<option>/<optgroup>` HTML for a generator select.
 * Includes "Automático", "Chrome AI" and "TensorFlow.js" entries first.
 */
export function buildGeneratorOptionsHtml(selected = "auto"): string {
  const extras = GENERATOR_EXTRA_OPTIONS.map(
    (o) =>
      `<option value="${o.value}"${o.value === selected ? " selected" : ""}>${o.label}</option>`,
  ).join("");
  const groups = buildFieldTypeOptionsHtml(
    GENERATOR_EXTRA_OPTIONS.some((o) => o.value === selected)
      ? undefined
      : selected,
  );
  return extras + groups;
}

// ─── SearchableSelect entry builders ─────────────────────────────────────────

/**
 * Builds a `SelectEntry[]` array for all field types, grouped by category.
 * Suitable for use with `SearchableSelect`.
 */
export function buildFieldTypeSelectEntries(): SelectEntry[] {
  return getFieldTypeGroupedOptions(FIELD_TYPES).map((group) => ({
    groupLabel: group.label,
    options: group.options.map((entry) => ({
      value: entry.value,
      label: entry.label,
    })),
  }));
}

/**
 * Builds a `SelectEntry[]` for the generator select that includes
 * "Automático", "Chrome AI" and "TensorFlow.js" as flat options before
 * the grouped field types.
 */
export function buildGeneratorSelectEntries(): SelectEntry[] {
  const extras: SelectEntry[] = GENERATOR_EXTRA_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  return [...extras, ...buildFieldTypeSelectEntries()];
}

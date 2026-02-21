/**
 * Signals Builder
 *
 * Builds a normalised string of context signals for a form field,
 * combining label, name, id, placeholder and autocomplete into a
 * single lowercase string used by TF.js / Chrome AI for classification.
 */

import type { FormField } from "@/types";
import type { Detector } from "./detector.interface";

export function buildSignals(field: Partial<FormField>): string {
  return [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Detector object — wraps {@link buildSignals} under the common Detector contract. */
export const signalsBuilder: Detector<Partial<FormField>, string> = {
  name: "signals",
  detect: buildSignals,
};

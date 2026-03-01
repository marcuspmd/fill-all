/**
 * HTML-Type Detector
 *
 * Maps native HTML element types (input[type], select, textarea)
 * to the extension's internal FieldType with high confidence (1.0).
 *
 * This is always the first classification step — if the native type
 * already gives us enough signal, no further AI/TF classification is needed.
 */

import type { FieldType, DetectionMethod } from "@/types";
import type { Detector } from "./detector.interface";

export interface BasicTypeResult {
  type: FieldType;
  method: DetectionMethod;
}

/**
 * Maps an HTML form element's native type to a `FieldType`.
 * Returns `"unknown"` for ambiguous types like plain `text` or `textarea`.
 * @param element - The native form control element
 * @returns A `BasicTypeResult` with type and detection method
 */
export function detectBasicType(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): BasicTypeResult {
  if (element instanceof HTMLSelectElement)
    return { type: "select", method: "html-type" };

  if (element instanceof HTMLTextAreaElement)
    return { type: "unknown", method: "html-type" };

  const type = element.type?.toLowerCase();

  if (type === "checkbox") return { type: "checkbox", method: "html-type" };
  if (type === "radio") return { type: "radio", method: "html-type" };
  if (type === "email") return { type: "email", method: "html-type" };
  if (type === "tel") return { type: "phone", method: "html-type" };
  if (type === "password") return { type: "password", method: "html-type" };
  if (type === "number") return { type: "number", method: "html-type" };
  if (type === "date") return { type: "date", method: "html-type" };
  if (["time", "datetime-local", "month", "week"].includes(type))
    return { type: "date", method: "html-type" };
  if (type === "url") return { type: "website", method: "html-type" };
  if (type === "search") return { type: "text", method: "html-type" };
  if (type === "range") return { type: "number", method: "html-type" };

  return { type: "unknown", method: "html-type" };
}

/** Detector object — wraps {@link detectBasicType} under the common Detector contract. */
export const htmlTypeDetector: Detector<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  BasicTypeResult
> = {
  name: "html-type",
  detect: detectBasicType,
};

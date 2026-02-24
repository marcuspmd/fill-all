/**
 * HTML Fallback Classifier
 *
 * Last resort: maps a limited set of input[type] values to FieldType.
 * Always returns a result (even if "unknown") so the pipeline always terminates.
 */

import type { FieldType } from "@/types";
import type { FieldClassifier, ClassifierResult } from "../pipeline";

const HTML_FALLBACK_MAP: Record<string, FieldType> = {
  email: "email",
  tel: "phone",
  password: "password",
  number: "number",
  date: "date",
  url: "text",
};

export const htmlFallbackClassifier: FieldClassifier = {
  name: "html-fallback",
  detect(field): ClassifierResult {
    const inputType =
      "type" in field.element
        ? (field.element as HTMLInputElement).type?.toLowerCase()
        : "";
    const type: FieldType = HTML_FALLBACK_MAP[inputType] ?? "unknown";
    return { type, confidence: 0.1 };
  },
};

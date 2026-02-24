/**
 * HTML Type Classifier
 *
 * Maps input[type], <select> and <textarea> to a FieldType with 100% confidence.
 * Returns null for plain text inputs and textareas — subsequent classifiers handle them.
 */

import type { FieldClassifier, ClassifierResult } from "../pipeline";
import { detectBasicType } from "../html-type-detector";
import { isNativeFormElement } from "@/types";

export const htmlTypeClassifier: FieldClassifier = {
  name: "html-type",
  detect(field): ClassifierResult | null {
    const el = field.element;
    if (!isNativeFormElement(el as HTMLElement)) return null;
    const { type } = detectBasicType(
      el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    );
    if (type === "unknown") return null;
    return { type, confidence: 1.0 };
  },
};

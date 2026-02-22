/**
 * TensorFlow.js-based field generator
 *
 * Thin generation wrapper — classification logic lives in:
 *   src/lib/form/detectors/tensorflow-classifier.ts
 *
 * This module re-exports the lifecycle functions for backward-compatibility
 * with consumers that import from this path, and provides generateWithTensorFlow.
 */

import type { FormField } from "@/types";
import { generate } from "@/lib/generators";
import { classifyField } from "@/lib/form/detectors/tensorflow-classifier";

export {
  loadPretrainedModel,
  invalidateClassifier,
  reloadClassifier,
  classifyField,
  classifyByTfSoft,
} from "@/lib/form/detectors/tensorflow-classifier";

/**
 * Generate a value using TF.js classification + built-in generators.
 */
export async function generateWithTensorFlow(
  field: FormField,
): Promise<string> {
  const detectedType = classifyField(field);
  return generate(detectedType);
}

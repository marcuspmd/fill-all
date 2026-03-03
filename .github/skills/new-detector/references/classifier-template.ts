/**
 * Template: Field Classifier for <Pattern>
 *
 * Instructions:
 * 1. Copy to src/lib/form/detectors/strategies/<name>-classifier.ts
 * 2. Replace <pattern> and <Pattern> with actual names
 * 3. Implement detection logic
 * 4. Register in src/lib/form/detectors/classifiers.ts
 */
import type { FieldClassifier, ClassifierResult } from "@/lib/form/detectors/detector.interface";
import type { FormField } from "@/types";

/**
 * Classifier that detects fields by <pattern> analysis.
 * Returns null when confidence is insufficient.
 */
export const <pattern>Classifier: FieldClassifier = {
  name: "<pattern>-classifier",

  detect(field: FormField): ClassifierResult | null {
    try {
      const signals = field.signals ?? "";
      const label = field.label ?? "";

      // Step 1: Extract relevant signals
      // const combined = `${signals} ${label}`.toLowerCase();

      // Step 2: Match against known patterns
      // if (!combined.includes("keyword")) return null;

      // Step 3: Determine field type and confidence
      // return {
      //   type: "detected-field-type",
      //   confidence: 0.8,  // 0-1 scale
      //   method: "<pattern>-classifier",
      // };

      return null; // TODO: Implement
    } catch {
      return null; // NEVER throw
    }
  },
};

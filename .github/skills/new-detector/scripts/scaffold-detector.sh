#!/usr/bin/env bash
# Scaffolds a new field classifier for the Fill All project
set -uo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <classifier-name>"
  echo "Example: $0 pattern"
  exit 1
fi

RAW_NAME="$1"
CAMEL_NAME=$(echo "$RAW_NAME" | sed -r 's/-(\w)/\U\1/g')
FILE_PATH="src/lib/form/detectors/strategies/${RAW_NAME}-classifier.ts"
TEST_PATH="src/lib/form/detectors/__tests__/${RAW_NAME}-classifier.test.ts"

if [ -f "$FILE_PATH" ]; then
  echo "❌ Classifier already exists: $FILE_PATH"
  exit 1
fi

echo "📦 Scaffolding classifier: ${RAW_NAME}"
echo "  Object: ${CAMEL_NAME}Classifier"
echo "  File: ${FILE_PATH}"
echo "  Test: ${TEST_PATH}"
echo ""

mkdir -p "src/lib/form/detectors/strategies"
cat > "$FILE_PATH" << CLEOF
import type { FieldClassifier, ClassifierResult } from "@/lib/form/detectors/detector.interface";
import type { FormField } from "@/types";

/**
 * Classifier that detects fields by <DESCRIPTION>.
 */
export const ${CAMEL_NAME}Classifier: FieldClassifier = {
  name: "${RAW_NAME}-classifier",

  detect(field: FormField): ClassifierResult | null {
    const signals = field.signals ?? "";

    // TODO: Implement detection logic

    return null;
  },
};
CLEOF

sed -i "s/<DESCRIPTION>/${RAW_NAME}/g" "$FILE_PATH"

mkdir -p "src/lib/form/detectors/__tests__"
cat > "$TEST_PATH" << TESTEOF
import { describe, it, expect } from "vitest";
import { ${CAMEL_NAME}Classifier } from "@/lib/form/detectors/strategies/${RAW_NAME}-classifier";
import type { FormField } from "@/types";

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  selector: "input[name='test']",
  tagName: "INPUT",
  type: "text",
  signals: "",
  label: "",
  ...overrides,
} as FormField);

describe("${CAMEL_NAME}Classifier", () => {
  it("has a unique name", () => {
    expect(${CAMEL_NAME}Classifier.name).toBe("${RAW_NAME}-classifier");
  });

  it("returns null for unrecognized fields", () => {
    const result = ${CAMEL_NAME}Classifier.detect(makeField());
    expect(result).toBeNull();
  });

  it("never throws", () => {
    const fields = [
      makeField(),
      makeField({ signals: undefined as unknown as string }),
    ];
    for (const field of fields) {
      expect(() => ${CAMEL_NAME}Classifier.detect(field)).not.toThrow();
    }
  });
});
TESTEOF

echo "✅ Classifier scaffolded!"
echo ""
echo "Next steps:"
echo "  1. Implement detection logic in ${FILE_PATH}"
echo "  2. Register in src/lib/form/detectors/classifiers.ts"
echo "  3. Run: ./scripts/validate-step.sh types unit"

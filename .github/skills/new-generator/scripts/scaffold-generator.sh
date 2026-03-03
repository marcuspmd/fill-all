#!/usr/bin/env bash
# Scaffolds a new generator for the Fill All project
set -uo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <generator-name>"
  echo "Example: $0 titulo-eleitor"
  exit 1
fi

RAW_NAME="$1"
# Convert kebab-case to PascalCase for function name
PASCAL_NAME=$(echo "$RAW_NAME" | sed -r 's/(^|-)(\w)/\U\2/g')
FILE_PATH="src/lib/generators/${RAW_NAME}.ts"
TEST_PATH="src/lib/generators/__tests__/${RAW_NAME}.test.ts"

if [ -f "$FILE_PATH" ]; then
  echo "❌ Generator already exists: $FILE_PATH"
  exit 1
fi

echo "📦 Scaffolding generator: ${RAW_NAME}"
echo "  Function: generate${PASCAL_NAME}()"
echo "  File: ${FILE_PATH}"
echo "  Test: ${TEST_PATH}"
echo ""

# Create generator file
cat > "$FILE_PATH" << 'GENEOF'
/**
 * Generates a valid <DESCRIPTION>.
 * Returns formatted or raw string based on parameter.
 */
export function generate<PASCAL>(formatted = true): string {
  try {
    // TODO: Implement generation logic
    const raw = "";
    if (!formatted) return raw;
    return raw;
  } catch {
    return "";
  }
}
GENEOF

# Replace placeholders
sed -i "s/<PASCAL>/${PASCAL_NAME}/g" "$FILE_PATH"
sed -i "s/<DESCRIPTION>/${RAW_NAME}/g" "$FILE_PATH"

# Create test file
mkdir -p "src/lib/generators/__tests__"
cat > "$TEST_PATH" << TESTEOF
import { describe, it, expect } from "vitest";
import { generate${PASCAL_NAME} } from "@/lib/generators/${RAW_NAME}";

describe("generate${PASCAL_NAME}", () => {
  it("returns a non-empty string", () => {
    const result = generate${PASCAL_NAME}();
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("generates valid data across multiple iterations", () => {
    for (let i = 0; i < 30; i++) {
      const result = generate${PASCAL_NAME}();
      expect(result).toBeTruthy();
    }
  });

  it("returns unformatted value when requested", () => {
    const result = generate${PASCAL_NAME}(false);
    expect(typeof result).toBe("string");
  });

  it("never throws", () => {
    for (let i = 0; i < 50; i++) {
      expect(() => generate${PASCAL_NAME}()).not.toThrow();
    }
  });
});
TESTEOF

echo "✅ Generator scaffolded!"
echo ""
echo "Next steps:"
echo "  1. Implement logic in ${FILE_PATH}"
echo "  2. Add to generatorMap in src/lib/generators/index.ts"
echo "  3. Run: ./scripts/validate-step.sh types unit"

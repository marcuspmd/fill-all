#!/usr/bin/env bash
# Scaffolds a new module in src/lib/ for the Fill All project
set -uo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <module-name>"
  echo "Example: $0 analytics"
  exit 1
fi

MODULE_NAME="$1"
PASCAL_NAME=$(echo "$MODULE_NAME" | sed -r 's/(^|-)(\w)/\U\2/g')
MODULE_DIR="src/lib/${MODULE_NAME}"
TEST_DIR="${MODULE_DIR}/__tests__"

if [ -d "$MODULE_DIR" ]; then
  echo "❌ Module already exists: $MODULE_DIR"
  exit 1
fi

echo "📦 Scaffolding module: ${MODULE_NAME}"
echo "  Directory: ${MODULE_DIR}/"
echo "  Logger namespace: ${PASCAL_NAME}"
echo ""

mkdir -p "$TEST_DIR"

# Main file
cat > "${MODULE_DIR}/${MODULE_NAME}.ts" << MODEOF
import { createLogger } from "@/lib/logger";

const log = createLogger("${PASCAL_NAME}");

/**
 * TODO: Describe what this module does.
 */
export function process${PASCAL_NAME}(): void {
  try {
    log.debug("process${PASCAL_NAME} executed");
    // TODO: Implement
  } catch (err) {
    log.warn("Failed in process${PASCAL_NAME}:", err);
  }
}
MODEOF

# Barrel exports
cat > "${MODULE_DIR}/index.ts" << IDXEOF
export { process${PASCAL_NAME} } from "./${MODULE_NAME}";
IDXEOF

# Test file
cat > "${TEST_DIR}/${MODULE_NAME}.test.ts" << TESTEOF
import { describe, it, expect, vi, beforeEach } from "vitest";
import { process${PASCAL_NAME} } from "@/lib/${MODULE_NAME}/${MODULE_NAME}";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("process${PASCAL_NAME}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not throw", () => {
    expect(() => process${PASCAL_NAME}()).not.toThrow();
  });
});
TESTEOF

echo "✅ Module scaffolded!"
echo ""
echo "Files created:"
echo "  ${MODULE_DIR}/${MODULE_NAME}.ts"
echo "  ${MODULE_DIR}/index.ts"
echo "  ${TEST_DIR}/${MODULE_NAME}.test.ts"
echo ""
echo "Next steps:"
echo "  1. Implement logic in ${MODULE_DIR}/${MODULE_NAME}.ts"
echo "  2. Run: ./scripts/validate-step.sh types unit"

#!/usr/bin/env bash
# Scans source code for insecure patterns in the Fill All Chrome Extension
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
FOUND=0

check_pattern() {
  local pattern="$1"
  local description="$2"
  local severity="$3"
  local results
  results=$(grep -rn "$pattern" src/ --include="*.ts" 2>/dev/null || true)
  if [ -n "$results" ]; then
    echo -e "${severity} ${description}"
    echo "$results" | head -10
    echo ""
    FOUND=$((FOUND + 1))
  fi
}

echo "🔒 Fill All — Security Pattern Scanner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_pattern "eval(" "eval() usage detected" "${RED}🔴 CRITICAL:"
check_pattern "new Function(" "new Function() usage detected" "${RED}🔴 CRITICAL:"
check_pattern "document\.write(" "document.write() usage detected" "${RED}🔴 CRITICAL:"
check_pattern "innerHTML\s*=" "innerHTML assignment (verify escapeHtml usage)" "${YELLOW}🟡 WARNING:"
check_pattern "insertAdjacentHTML" "insertAdjacentHTML usage (verify sanitization)" "${YELLOW}🟡 WARNING:"
check_pattern "unsafe-eval" "unsafe-eval in CSP" "${RED}🔴 CRITICAL:"
check_pattern "unsafe-inline" "unsafe-inline in CSP" "${RED}🔴 CRITICAL:"
check_pattern "chrome\.storage\.sync" "chrome.storage.sync usage (should use .local)" "${YELLOW}🟡 WARNING:"
check_pattern "export default" "export default (should use named exports)" "${YELLOW}🟡 WARNING:"
check_pattern "console\.log" "console.log (should use createLogger)" "${YELLOW}🟡 WARNING:"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FOUND" -eq 0 ]; then
  echo -e "${GREEN}✅ No insecure patterns found!${NC}"
else
  echo -e "${RED}⚠️  Found $FOUND pattern(s) to review.${NC}"
  exit 1
fi

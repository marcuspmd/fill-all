#!/usr/bin/env bash
# Quick convention checker for Fill All project
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ISSUES=0

check() {
  local pattern="$1"
  local description="$2"
  local severity="$3"
  local count
  count=$(grep -rn "$pattern" src/ --include="*.ts" 2>/dev/null | grep -v "__tests__" | grep -v "node_modules" | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo -e "${severity} ${description} (${count} occurrences)"
    ISSUES=$((ISSUES + 1))
  fi
}

echo "📋 Fill All — Convention Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "export default" "export default found (use named exports)" "${RED}🔴"
check "console\.log(" "console.log found (use createLogger)" "${YELLOW}🟡"
check "console\.warn(" "console.warn found (use createLogger)" "${YELLOW}🟡"
check "console\.error(" "console.error found (use createLogger)" "${YELLOW}🟡"
check "\.string()\.uuid()" "z.string().uuid() found (use z.uuid())" "${YELLOW}🟡"
check "chrome\.storage\.sync" "chrome.storage.sync found (use .local)" "${RED}🔴"
check "// @ts-ignore" "@ts-ignore found (fix type errors)" "${YELLOW}🟡"
check "as any" "'as any' found (avoid type assertions)" "${YELLOW}🟡"
check "schema\.parse(" "schema.parse() found (use safeParse)" "${RED}🔴"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ISSUES" -eq 0 ]; then
  echo -e "${GREEN}✅ All conventions OK!${NC}"
else
  echo -e "${YELLOW}⚠️  Found $ISSUES convention issue(s) to review.${NC}"
fi

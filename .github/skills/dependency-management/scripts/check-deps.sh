#!/usr/bin/env bash
# Check dependency health for Fill All project
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Fill All — Dependency Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Checking for vulnerabilities..."
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)
VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
if [ "$VULNS" = "0" ]; then
  echo -e "  ${GREEN}✅ No vulnerabilities found${NC}"
else
  echo -e "  ${RED}⚠️  $VULNS vulnerability(ies) found${NC}"
  echo "  Run: npm audit for details"
fi
echo ""

echo "🔄 Checking for outdated packages..."
OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
OUTDATED_COUNT=$(echo "$OUTDATED" | grep -c '"current"' || echo "0")
if [ "$OUTDATED_COUNT" = "0" ]; then
  echo -e "  ${GREEN}✅ All packages up to date${NC}"
else
  echo -e "  ${YELLOW}📋 $OUTDATED_COUNT package(s) have updates available${NC}"
  npm outdated 2>/dev/null || true
fi
echo ""

echo "📋 Dependency summary:"
PROD_DEPS=$(node -e "const p=require('./package.json'); console.log(Object.keys(p.dependencies||{}).length)" 2>/dev/null || echo "?")
DEV_DEPS=$(node -e "const p=require('./package.json'); console.log(Object.keys(p.devDependencies||{}).length)" 2>/dev/null || echo "?")
echo "  production: $PROD_DEPS, dev: $DEV_DEPS"
echo "  node_modules size: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

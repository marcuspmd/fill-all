#!/usr/bin/env bash
# =============================================================================
# scripts/validate-step.sh — Validação step-by-step do projeto Fill All
#
# Uso:
#   ./scripts/validate-step.sh                  # Roda todos os steps
#   ./scripts/validate-step.sh types            # Só type-check
#   ./scripts/validate-step.sh types unit       # Type-check + testes unitários
#   ./scripts/validate-step.sh build e2e        # Build + E2E
#
# Steps disponíveis:
#   types   — Type-check (tsc --noEmit)
#   unit    — Testes unitários (vitest run)
#   build   — Build de produção (vite build)
#   e2e     — Testes E2E (playwright test) — requer build
#   coverage — Testes com coverage (vitest run --coverage)
#   all     — Todos os steps em ordem
# =============================================================================

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULTS=()

# ─── Funções auxiliares ──────────────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Fill All — Validação Step-by-Step${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

run_step() {
  local step_name="$1"
  local step_cmd="$2"
  local step_desc="$3"

  echo -e "${YELLOW}▶ Step: ${step_name}${NC} — ${step_desc}"
  echo -e "  Comando: ${step_cmd}"
  echo ""

  if eval "$step_cmd"; then
    echo ""
    echo -e "  ${GREEN}✅ ${step_name} — PASSOU${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS+=("${GREEN}✅ ${step_name}${NC}")
  else
    echo ""
    echo -e "  ${RED}❌ ${step_name} — FALHOU${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS+=("${RED}❌ ${step_name}${NC}")
    return 1
  fi

  echo ""
}

print_summary() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Resumo da Validação${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  for result in "${RESULTS[@]}"; do
    echo -e "  $result"
  done
  echo ""
  echo -e "  Passou: ${GREEN}${PASS_COUNT}${NC} | Falhou: ${RED}${FAIL_COUNT}${NC} | Pulou: ${YELLOW}${SKIP_COUNT}${NC}"
  echo ""

  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "  ${RED}⚠️  Validação FALHOU — corrija os erros acima antes de continuar.${NC}"
    return 1
  else
    echo -e "  ${GREEN}🎉 Validação completa — todos os steps passaram!${NC}"
  fi
  echo ""
}

# ─── Definição dos Steps ────────────────────────────────────────────────────

step_types() {
  run_step "types" "npm run type-check" "Verificação de tipos TypeScript (tsc --noEmit)"
}

step_unit() {
  run_step "unit" "npm test" "Testes unitários (Vitest)"
}

step_build() {
  run_step "build" "npm run build" "Build de produção (Vite)"
}

step_e2e() {
  run_step "e2e" "npm run test:e2e" "Testes E2E (Playwright + Chrome)"
}

step_coverage() {
  run_step "coverage" "npm run test:coverage" "Testes com relatório de coverage"
}

# ─── Main ────────────────────────────────────────────────────────────────────

print_header

STEPS=("$@")

# Se nenhum step foi especificado, rodar todos
if [ ${#STEPS[@]} -eq 0 ] || [ "${STEPS[0]}" = "all" ]; then
  STEPS=("types" "unit" "build")
fi

FAILED=false

for step in "${STEPS[@]}"; do
  case "$step" in
    types)    step_types    || FAILED=true ;;
    unit)     step_unit     || FAILED=true ;;
    build)    step_build    || FAILED=true ;;
    e2e)      step_e2e      || FAILED=true ;;
    coverage) step_coverage || FAILED=true ;;
    all)
      step_types    || FAILED=true
      step_unit     || FAILED=true
      step_build    || FAILED=true
      ;;
    *)
      echo -e "${RED}Step desconhecido: ${step}${NC}"
      echo "Steps disponíveis: types, unit, build, e2e, coverage, all"
      exit 1
      ;;
  esac
done

print_summary

if [ "$FAILED" = true ]; then
  exit 1
fi

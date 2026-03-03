#!/usr/bin/env bash
# =============================================================================
# scripts/snapshot-health.sh — Captura snapshot de saúde do projeto Fill All
#
# Uso:
#   ./scripts/snapshot-health.sh              # Captura snapshot e exibe
#   ./scripts/snapshot-health.sh --save       # Captura e salva em /tmp/fill-all-health-before.json
#   ./scripts/snapshot-health.sh --compare    # Compara com snapshot salvo anteriormente
#
# Métricas capturadas:
#   - Contagem de testes unitários (passando/falhando)
#   - Status do type-check (erros)
#   - Status do build
#   - Contagem de arquivos .ts no src/
#   - Contagem de arquivos de teste
# =============================================================================

set -uo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SNAPSHOT_FILE="/tmp/fill-all-health-before.json"

# ─── Funções de Captura ─────────────────────────────────────────────────────

capture_ts_file_count() {
  find src -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*" | wc -l | tr -d ' '
}

capture_test_file_count() {
  find src -name "*.test.ts" -not -name "*.test.e2e.ts" | wc -l | tr -d ' '
}

capture_e2e_test_file_count() {
  find src -name "*.test.e2e.ts" | wc -l | tr -d ' '
}

capture_type_errors() {
  local output
  output=$(npm run type-check 2>&1) || true
  # Strip ANSI codes and count
  local clean_output
  clean_output=$(echo "$output" | sed 's/\x1b\[[0-9;]*m//g')
  local errors
  errors=$(echo "$clean_output" | grep -c "error TS" 2>/dev/null) || errors="0"
  echo "$errors"
}

capture_unit_test_results() {
  local output
  output=$(npm test 2>&1) || true

  # Strip ANSI escape codes for reliable parsing
  local clean_output
  clean_output=$(echo "$output" | sed 's/\x1b\[[0-9;]*m//g')

  local passed failed
  # Vitest output: "      Tests  1708 passed (1708)"
  local tests_line
  tests_line=$(echo "$clean_output" | grep "Tests " | grep -v "Test Files" | tail -1)
  passed=$(echo "$tests_line" | sed -n 's/.*\s\([0-9]\+\)\s\+passed.*/\1/p')
  failed=$(echo "$tests_line" | sed -n 's/.*\s\([0-9]\+\)\s\+failed.*/\1/p')

  if [ -z "$passed" ]; then passed="0"; fi
  if [ -z "$failed" ]; then failed="0"; fi

  echo "${passed}:${failed}"
}

capture_build_status() {
  if npm run build > /dev/null 2>&1; then
    echo "pass"
  else
    echo "fail"
  fi
}

# ─── Captura Completa ────────────────────────────────────────────────────────

capture_snapshot() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" >&2
  echo -e "${BLUE}  Fill All — Snapshot de Saúde do Projeto${NC}" >&2
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" >&2
  echo "" >&2

  echo -e "${CYAN}📁 Contando arquivos...${NC}" >&2
  local ts_files
  ts_files=$(capture_ts_file_count)
  local test_files
  test_files=$(capture_test_file_count)
  local e2e_files
  e2e_files=$(capture_e2e_test_file_count)
  echo -e "  Arquivos .ts (src): ${ts_files}" >&2
  echo -e "  Testes unitários: ${test_files}" >&2
  echo -e "  Testes E2E: ${e2e_files}" >&2
  echo "" >&2

  echo -e "${CYAN}🔍 Verificando tipos...${NC}" >&2
  local type_errors
  type_errors=$(capture_type_errors)
  if [ "$type_errors" = "0" ]; then
    echo -e "  Type-check: ${GREEN}✅ zero erros${NC}" >&2
  else
    echo -e "  Type-check: ${RED}❌ ${type_errors} erros${NC}" >&2
  fi
  echo "" >&2

  echo -e "${CYAN}🧪 Rodando testes unitários...${NC}" >&2
  local test_results
  test_results=$(capture_unit_test_results)
  local tests_passed tests_failed
  tests_passed=$(echo "$test_results" | cut -d: -f1)
  tests_failed=$(echo "$test_results" | cut -d: -f2)
  echo -e "  Passaram: ${GREEN}${tests_passed}${NC}" >&2
  echo -e "  Falharam: ${RED}${tests_failed}${NC}" >&2
  echo "" >&2

  echo -e "${CYAN}🏗️  Verificando build...${NC}" >&2
  local build_status
  build_status=$(capture_build_status)
  if [ "$build_status" = "pass" ]; then
    echo -e "  Build: ${GREEN}✅ OK${NC}" >&2
  else
    echo -e "  Build: ${RED}❌ FALHOU${NC}" >&2
  fi
  echo "" >&2

  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # JSON output goes to stdout (only)
  cat <<EOF
{
  "timestamp": "${timestamp}",
  "ts_files": ${ts_files},
  "test_files": ${test_files},
  "e2e_files": ${e2e_files},
  "type_errors": ${type_errors},
  "tests_passed": ${tests_passed},
  "tests_failed": ${tests_failed},
  "build_status": "${build_status}"
}
EOF
}

# ─── Salvar Snapshot ─────────────────────────────────────────────────────────

save_snapshot() {
  capture_snapshot > "$SNAPSHOT_FILE"
  echo ""
  echo -e "${GREEN}💾 Snapshot salvo em: ${SNAPSHOT_FILE}${NC}"
}

# ─── Comparar Snapshots ─────────────────────────────────────────────────────

compare_snapshots() {
  if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo -e "${RED}❌ Nenhum snapshot anterior encontrado em ${SNAPSHOT_FILE}${NC}"
    echo "   Execute primeiro: ./scripts/snapshot-health.sh --save"
    exit 1
  fi

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Fill All — Comparação de Saúde (Antes vs Agora)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Ler snapshot anterior (simplificado — sem jq)
  # Usa sed para extrair o valor numérico após a chave
  local before_ts before_tests before_e2e before_type_errors before_passed before_failed before_build
  before_ts=$(sed -n 's/.*"ts_files":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_tests=$(sed -n 's/.*"test_files":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_e2e=$(sed -n 's/.*"e2e_files":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_type_errors=$(sed -n 's/.*"type_errors":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_passed=$(sed -n 's/.*"tests_passed":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_failed=$(sed -n 's/.*"tests_failed":\s*\([0-9]*\).*/\1/p' "$SNAPSHOT_FILE")
  before_build=$(sed -n 's/.*"build_status":\s*"\([^"]*\)".*/\1/p' "$SNAPSHOT_FILE")

  # Capturar agora
  echo -e "${CYAN}Capturando estado atual...${NC}"
  echo ""

  local now_ts now_tests now_e2e now_type_errors now_test_results now_passed now_failed now_build
  now_ts=$(capture_ts_file_count)
  now_tests=$(capture_test_file_count)
  now_e2e=$(capture_e2e_test_file_count)
  now_type_errors=$(capture_type_errors)
  now_test_results=$(capture_unit_test_results)
  now_passed=$(echo "$now_test_results" | cut -d: -f1)
  now_failed=$(echo "$now_test_results" | cut -d: -f2)
  now_build=$(capture_build_status)

  # Comparar
  local REGRESSION=false

  compare_metric() {
    local name="$1" before="$2" now="$3" direction="$4"
    local diff=$((now - before))
    local sign=""
    local color="$NC"

    if [ "$diff" -gt 0 ]; then sign="+"; fi

    if [ "$direction" = "up_good" ]; then
      if [ "$diff" -gt 0 ]; then color="$GREEN"; fi
      if [ "$diff" -lt 0 ]; then color="$RED"; REGRESSION=true; fi
    elif [ "$direction" = "down_good" ]; then
      if [ "$diff" -lt 0 ]; then color="$GREEN"; fi
      if [ "$diff" -gt 0 ]; then color="$RED"; REGRESSION=true; fi
    fi

    printf "  %-25s %6s → %6s  ${color}(%s%s)${NC}\n" "$name" "$before" "$now" "$sign" "$diff"
  }

  echo -e "${CYAN}Comparação:${NC}"
  echo ""

  compare_metric "Arquivos .ts" "$before_ts" "$now_ts" "neutral"
  compare_metric "Testes unitários (arq)" "$before_tests" "$now_tests" "up_good"
  compare_metric "Testes E2E (arq)" "$before_e2e" "$now_e2e" "up_good"
  compare_metric "Erros de tipo" "$before_type_errors" "$now_type_errors" "down_good"
  compare_metric "Testes passando" "$before_passed" "$now_passed" "up_good"
  compare_metric "Testes falhando" "$before_failed" "$now_failed" "down_good"

  echo ""

  # Build comparison
  if [ "$before_build" = "$now_build" ]; then
    echo -e "  Build: ${before_build} → ${now_build} ${GREEN}(sem mudança)${NC}"
  elif [ "$now_build" = "fail" ]; then
    echo -e "  Build: ${before_build} → ${RED}${now_build} (REGRESSÃO!)${NC}"
    REGRESSION=true
  else
    echo -e "  Build: ${before_build} → ${GREEN}${now_build} (melhorou!)${NC}"
  fi

  echo ""

  if [ "$REGRESSION" = true ]; then
    echo -e "  ${RED}⚠️  REGRESSÃO DETECTADA — verifique os itens acima.${NC}"
    exit 1
  else
    echo -e "  ${GREEN}🎉 Nenhuma regressão detectada!${NC}"
  fi
  echo ""
}

# ─── Main ────────────────────────────────────────────────────────────────────

case "${1:-}" in
  --save)
    save_snapshot
    ;;
  --compare)
    compare_snapshots
    ;;
  *)
    capture_snapshot
    ;;
esac

#!/usr/bin/env bash
# scripts/hooks/post-tool-audit.sh
#
# Hook PostToolUse: registra conclusão de ferramentas relevantes no audit.log
#
# Apenas ferramentas críticas são logadas para manter o audit conciso.

INPUT=$(cat)

# Fallback seguro se jq não estiver disponível
if ! command -v jq &>/dev/null; then
  echo '{"continue": true}'
  exit 0
fi

TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
TS=$(echo "$INPUT" | jq -r '.timestamp // ""')
SESSION=$(echo "$INPUT" | jq -r '.sessionId // ""' | cut -c1-8)

# Registra apenas ferramentas relevantes (evita ruído de buscas/leituras)
case "$TOOL" in
  editFiles|create_file|replace_string_in_file|multi_replace_string_in_file|\
  run_in_terminal|runInTerminal|runTests|runSubagent)
    mkdir -p .github/hooks/logs 2>/dev/null || true
    echo "[$TS] POST_TOOL session=$SESSION tool=$TOOL status=completed" \
      >> .github/hooks/logs/audit.log 2>/dev/null || true
    ;;
esac

echo '{"continue": true}'
exit 0

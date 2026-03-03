#!/usr/bin/env bash
# scripts/hooks/user-prompt-audit.sh
#
# Hook UserPromptSubmit: registra prompts do usuário no audit.log para rastreabilidade.
# Loga apenas os primeiros 200 caracteres do prompt.

INPUT=$(cat)

# Fallback seguro se jq não estiver disponível
if ! command -v jq &>/dev/null; then
  echo '{"continue": true}'
  exit 0
fi

TS=$(echo "$INPUT" | jq -r '.timestamp // ""')
SESSION=$(echo "$INPUT" | jq -r '.sessionId // ""' | cut -c1-8)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""' | head -c 2000 | tr '\n' ' ')

mkdir -p .github/hooks/logs 2>/dev/null || true
echo "[$TS] USER_PROMPT session=$SESSION prompt=${PROMPT}" \
  >> .github/hooks/logs/audit.log 2>/dev/null || true

echo '{"continue": true}'
exit 0

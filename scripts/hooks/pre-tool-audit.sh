#!/usr/bin/env bash
# scripts/hooks/pre-tool-audit.sh
#
# Hook PreToolUse: auditoria de ferramentas + segurança + verificação de plano
#
# Comportamento:
#   - Registra toda invocação de ferramenta no audit.log
#   - Bloqueia comandos destrutivos no terminal (rm -rf, DROP TABLE, etc.)
#   - Bloqueia inicialização de servidores de desenvolvimento
#   - Injeta lembrete de planejamento antes de edições de arquivo
#   - Injeta conteúdo do plano ativo (.github/current-plan.md) se existir
#
# Exit codes:
#   0 = sucesso (parseia stdout como JSON)
#   2 = erro bloqueante

INPUT=$(cat)

# Fallback seguro se jq não estiver disponível
if ! command -v jq &>/dev/null; then
  echo '{"continue": true}'
  exit 0
fi

TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
TS=$(echo "$INPUT" | jq -r '.timestamp // ""')
SESSION=$(echo "$INPUT" | jq -r '.sessionId // ""' | cut -c1-8)

# --- AUDITORIA: registra a invocação da ferramenta --------------------------
mkdir -p .github/hooks/logs 2>/dev/null || true
echo "[$TS] PRE_TOOL session=$SESSION tool=$TOOL" >> .github/hooks/logs/audit.log 2>/dev/null || true

# --- SEGURANÇA: bloqueia comandos perigosos no terminal ---------------------
if [[ "$TOOL" == "run_in_terminal" || "$TOOL" == "runInTerminal" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

  # Bloqueia operações destrutivas
  if echo "$COMMAND" | grep -qiE '(rm[[:space:]]+-rf[[:space:]]+/|DROP[[:space:]]+TABLE|TRUNCATE[[:space:]]+TABLE|format[[:space:]]+[A-Za-z]:)'; then
    jq -n --arg reason "Comando destrutivo bloqueado pelo hook de segurança: $COMMAND" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
      }
    }'
    exit 0
  fi

  # Bloqueia servidores de desenvolvimento
  if echo "$COMMAND" | grep -qE '(npm[[:space:]]+run[[:space:]]+(dev|start|serve|start:dev|start:prod)|php[[:space:]]+artisan[[:space:]]+serve|symfony.*server:start|yarn[[:space:]]+(dev|start)|python.*runserver)'; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Iniciar servidores de desenvolvimento está desabilitado pelas regras do projeto. Use isBackground:true se realmente necessário."
      }
    }'
    exit 0
  fi
fi

# --- VERIFICAÇÃO DE PLANO: lembrete antes de edições de arquivo -------------
case "$TOOL" in
  editFiles|create_file|replace_string_in_file|multi_replace_string_in_file)
    REMINDER="[AUDIT] Verificação de plano antes de editar arquivo:"
    REMINDER+=$'\n'"- Esta edição está no seu todo list ativo (manage_todo_list)?"
    REMINDER+=$'\n'"- O TODO correspondente está marcado como in-progress?"
    REMINDER+=$'\n'"- Para tarefas multi-arquivo: skill task-breakdown foi carregada?"

    # Injeta plano ativo se existir
    if [ -f ".github/current-plan.md" ]; then
      REMINDER+=$'\n\n'"=== PLANO ATIVO (.github/current-plan.md) ==="
      REMINDER+=$'\n'"$(head -40 .github/current-plan.md)"
    fi

    jq -n --arg ctx "$REMINDER" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: $ctx
      }
    }'
    exit 0
    ;;
esac

echo '{"continue": true}'
exit 0

#!/usr/bin/env bash
# scripts/hooks/session-context.sh
#
# Hook SessionStart: injeta contexto do projeto e regras obrigatórias de planejamento
# na conversa do agente a cada nova sessão.
#
# Output: JSON com additionalContext (SessionStart format)

# Fallback seguro se jq não estiver disponível
if ! command -v jq &>/dev/null; then
  echo '{"continue": true}'
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "desconhecida")
NODE=$(node --version 2>/dev/null || echo "desconhecido")
COMMIT=$(git log --oneline -1 --pretty=format:"%h %s" 2>/dev/null || echo "desconhecido")
TS=$(date '+%Y-%m-%d %H:%M:%S')

# Cria diretório de logs (silencioso)
mkdir -p .github/hooks/logs 2>/dev/null || true
echo "[$TS] SESSION_START branch=$BRANCH node=$NODE" >> .github/hooks/logs/audit.log 2>/dev/null || true

# Monta contexto principal
CONTEXT="=== FILL ALL — CONTEXTO DO PROJETO ==="$'\n'
CONTEXT+="Branch: $BRANCH | Node: $NODE | Último commit: $COMMIT"$'\n\n'
CONTEXT+="=== FLUXO OBRIGATÓRIO DE TRABALHO ==="$'\n'
CONTEXT+="1. SEMPRE use manage_todo_list antes de qualquer tarefa multi-etapa"$'\n'
CONTEXT+="2. Marque TODO como in-progress ANTES de começar; completed IMEDIATAMENTE ao terminar"$'\n'
CONTEXT+="3. JAMAIS edite arquivos sem ter um plano/todo ativo"$'\n'
CONTEXT+="4. Para tarefas que tocam múltiplos arquivos: carregue a skill task-breakdown"$'\n\n'
CONTEXT+="=== REGRAS DO PROJETO ==="$'\n'
CONTEXT+="- Nunca export default | Nunca heredoc/cat/echo/printf para escrever arquivos"$'\n'
CONTEXT+="- Nunca npm run dev/start/serve (servidores bloqueados pelo hook pre-tool)"$'\n'
CONTEXT+="- Sempre createLogger(\"Namespace\"), nunca console.log direto"$'\n'
CONTEXT+="- Zod v4: z.uuid() — NÃO z.string().uuid() (deprecated)"

# Injeta plano ativo se o arquivo existir
if [ -f ".github/current-plan.md" ]; then
  CONTEXT+=$'\n\n'"=== PLANO ATIVO (.github/current-plan.md) ==="
  CONTEXT+=$'\n'"$(head -50 .github/current-plan.md)"
fi

jq -n --arg ctx "$CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: $ctx
  }
}'
exit 0

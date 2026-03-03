---
applyTo: '**'
description: 'Skill principal para decompor qualquer tarefa em steps ordenados, executar cada step com scripts de validação e garantir progresso incremental.'
---

# Skill: Task Breakdown — Decomposição e Execução Step-by-Step

## Objetivo

Decompor qualquer tarefa (feature, bug fix, refactor, migração) em steps atômicos e ordenados, cada um com **script de validação** para garantir que o passo foi executado corretamente antes de avançar.

## Quando Usar

- Implementar uma nova feature completa
- Refatorar módulo existente
- Migrar schemas/storage
- Resolver bug complexo com múltiplas alterações
- Qualquer tarefa com mais de 3 arquivos afetados

## Processo

### Fase 1: Análise e Decomposição

Antes de tocar em qualquer código, decompor a tarefa em steps:

```markdown
## Task: <Nome da Tarefa>

### Steps

1. **[Preparação]** Capturar baseline de saúde do projeto
2. **[Análise]** Identificar arquivos e módulos afetados
3. **[Implementação]** Step-by-step de código (1 step por responsabilidade)
4. **[Testes]** Criar/atualizar testes para código novo
5. **[Validação]** Executar scripts de validação
6. **[Integração]** Verificar integração com módulos adjacentes
7. **[Finalização]** Review final e cleanup
```

### Fase 2: Template de Step

Cada step deve ter esta estrutura:

```markdown
### Step N: <Nome do Step>

**Objetivo**: O que este step faz (1 frase)
**Arquivos**: Lista de arquivos a criar/modificar
**Depende de**: Steps anteriores necessários

#### Ações
1. Ação específica 1
2. Ação específica 2

#### Validação
\```bash
# Script para validar que o step foi feito corretamente
./scripts/validate-step.sh types unit
\```

#### Critério de Sucesso
- [ ] Critério específico 1
- [ ] Critério específico 2
```

## Scripts de Validação

### Script Principal: `validate-step.sh`

Validação step-by-step com feedback colorido:

```bash
# Validar apenas tipos (rápido, após cada mudança)
./scripts/validate-step.sh types

# Validar tipos + testes unitários
./scripts/validate-step.sh types unit

# Validar tipos + testes + build
./scripts/validate-step.sh types unit build

# Validação completa (tipos + unit + build + E2E)
./scripts/validate-step.sh types unit build e2e

# Validação com coverage
./scripts/validate-step.sh types unit coverage
```

**Steps disponíveis**:

| Step | Comando | Tempo | Quando usar |
|------|---------|-------|-------------|
| `types` | `npm run type-check` | ~5s | Após cada mudança em .ts |
| `unit` | `npm test` | ~10s | Após criar/alterar lógica |
| `build` | `npm run build` | ~15s | Antes de testar E2E ou entregar |
| `e2e` | `npm run test:e2e` | ~60s | Após mudanças no DOM/content script |
| `coverage` | `npm run test:coverage` | ~20s | Para verificar thresholds (≥ 85%) |

### Script de Saúde: `snapshot-health.sh`

Capturar baseline ANTES de começar e comparar DEPOIS:

```bash
# ANTES de começar a tarefa — salvar snapshot
./scripts/snapshot-health.sh --save

# DEPOIS de completar — comparar com baseline
./scripts/snapshot-health.sh --compare
```

**Métricas capturadas**:
- Contagem de arquivos .ts
- Contagem de testes (unitários + E2E)
- Erros de type-check
- Testes passando/falhando
- Status do build

## Exemplo Completo: Criar Novo Gerador

### Step 1: Preparação — Capturar Baseline

```bash
# Salvar estado atual do projeto
./scripts/snapshot-health.sh --save
```

✅ **Critério**: Snapshot salvo sem erros

---

### Step 2: Criar Arquivo do Gerador

**Arquivos**: `src/lib/generators/<nome>.ts`

```typescript
export function generate<Nome>(formatted = true): string {
  // Implementação
  return resultado;
}
```

```bash
# Validar tipos após criar o arquivo
./scripts/validate-step.sh types
```

✅ **Critério**: Type-check passa

---

### Step 3: Registrar no Index

**Arquivos**: `src/lib/generators/index.ts`

```typescript
export { generate<Nome> } from "./<nome>";
// + adicionar no generatorMap
```

```bash
# Validar tipos + build
./scripts/validate-step.sh types build
```

✅ **Critério**: Type-check + build passam

---

### Step 4: Criar Testes

**Arquivos**: `src/lib/generators/__tests__/<nome>.test.ts`

```bash
# Validar tipos + rodar testes
./scripts/validate-step.sh types unit
```

✅ **Critério**: Type-check + todos os testes passam

---

### Step 5: Validação Final

```bash
# Validação completa
./scripts/validate-step.sh types unit build

# Comparar com baseline
./scripts/snapshot-health.sh --compare
```

✅ **Critério**: Nenhuma regressão, testes passando ≥ baseline

## Exemplo Completo: Resolver Bug

### Step 1: Reproduzir o Bug

```bash
# Salvar baseline
./scripts/snapshot-health.sh --save

# Rodar teste que reproduz o bug (se existir)
npx vitest run <caminho-do-teste> --reporter=verbose
```

✅ **Critério**: Bug reproduzido (teste falhando ou comportamento documentado)

---

### Step 2: Criar Teste de Regressão

**Arquivos**: `src/lib/<modulo>/__tests__/<bug>.test.ts`

Criar teste que FALHA com o bug e PASSA com a correção:

```bash
# Confirmar que o teste falha (esperado neste step)
npx vitest run src/lib/<modulo>/__tests__/<bug>.test.ts || echo "✅ Bug reproduzido no teste"
```

✅ **Critério**: Teste criado e falhando (confirmando o bug)

---

### Step 3: Corrigir o Bug

**Arquivos**: Arquivo(s) com a correção

```bash
# Validar correção — teste deve passar agora
./scripts/validate-step.sh types unit
```

✅ **Critério**: Teste de regressão passando + demais testes OK

---

### Step 4: Validação de Regressão

```bash
# Validação completa + comparação
./scripts/validate-step.sh types unit build
./scripts/snapshot-health.sh --compare
```

✅ **Critério**: Zero regressão, bug corrigido, teste novo passando

## Regras de Decomposição

### ✅ Boas Práticas

| Prática | Detalhe |
|---------|---------|
| **1 responsabilidade por step** | Cada step faz UMA coisa (criar arquivo, registrar, testar) |
| **Validação após cada step** | Nunca acumular 3+ steps sem validar |
| **Steps independentes** | Se um step falha, os anteriores continuam válidos |
| **Documentar dependências** | Indicar "Depende de: Step N" quando necessário |
| **Commit por step** | Cada step validado pode ser um commit atômico |

### ❌ Anti-Padrões

| Anti-Padrão | Problema |
|-------------|----------|
| Step gigante ("implementar tudo") | Impossível validar incrementalmente |
| Sem validação | Erros se acumulam e ficam difíceis de debugar |
| Steps interdependentes | Falha em 1 step cascata para todos |
| Pular baseline | Não sabe se houve regressão |

## Fluxo Visual

```
Tarefa
  │
  ├─ 📊 Capturar Baseline (snapshot-health.sh --save)
  │
  ├─ Step 1: Preparação
  │     └─ ✅ validate-step.sh types
  │
  ├─ Step 2: Implementação Core
  │     └─ ✅ validate-step.sh types unit
  │
  ├─ Step 3: Testes
  │     └─ ✅ validate-step.sh types unit
  │
  ├─ Step 4: Integração
  │     └─ ✅ validate-step.sh types unit build
  │
  ├─ Step 5: Validação Final
  │     └─ ✅ validate-step.sh types unit build e2e
  │
  └─ 📊 Comparar (snapshot-health.sh --compare)
        └─ 🎉 Zero regressão → Task completa!
```

## Comandos Rápidos

```bash
# Ciclo rápido de desenvolvimento (após cada mudança)
./scripts/validate-step.sh types

# Ciclo médio (antes de commit)
./scripts/validate-step.sh types unit

# Ciclo completo (antes de PR/merge)
./scripts/validate-step.sh types unit build

# Ciclo com E2E (mudanças no DOM)
./scripts/validate-step.sh types unit build e2e

# Ciclo completo com baseline
./scripts/snapshot-health.sh --save     # antes
# ... fazer alterações ...
./scripts/validate-step.sh types unit build
./scripts/snapshot-health.sh --compare  # depois
```

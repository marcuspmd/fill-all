---
name: debug-investigation
description: 'Skill para investigação e debug sistemático de bugs — reproduzir, isolar, corrigir e validar com scripts.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: debugging
---

# Skill: Debug & Investigação Sistemática

## Objetivo

Processo estruturado para investigar e resolver bugs de forma sistemática, com scripts de validação em cada etapa para garantir que a correção é completa e sem regressões.

## Quando Usar

- Bug reportado por usuário ou detectado em teste
- Comportamento inesperado em produção
- Teste falhando sem causa óbvia
- Regressão detectada pelo `snapshot-health.sh --compare`

## Processo de 6 Etapas

### Etapa 1: Documentar o Bug 📝

Antes de investigar, documentar o que se sabe:

```markdown
### Bug Report

**Comportamento esperado**: <o que deveria acontecer>
**Comportamento atual**: <o que está acontecendo>
**Módulo afetado**: <módulo(s) suspeito(s)>
**Reproduzível**: Sempre | Às vezes | Raro
**Severidade**: 🔴 Crítico | 🟡 Importante | 🟢 Menor
```

---

### Etapa 2: Capturar Baseline 📊

```bash
# Salvar estado atual
./scripts/snapshot-health.sh --save
```

---

### Etapa 3: Reproduzir o Bug 🔄

#### Para bugs em lógica pura (generators, parsers, storage):

```bash
# Rodar testes do módulo afetado com verbose
npx vitest run src/lib/<modulo> --reporter=verbose

# Se não tem teste que reproduz, criar um:
# src/lib/<modulo>/__tests__/<bug-description>.test.ts
```

```typescript
import { describe, it, expect } from "vitest";
import { funcaoComBug } from "@/lib/<modulo>/<arquivo>";

describe("Bug: <descrição curta>", () => {
  it("should <comportamento esperado>", () => {
    // Arrange: setup que reproduz o bug
    const input = /* dados que causam o bug */;

    // Act
    const result = funcaoComBug(input);

    // Assert: o que DEVERIA retornar
    expect(result).toBe(/* valor esperado */);
  });
});
```

```bash
# Confirmar que o teste FALHA (bug reproduzido)
npx vitest run src/lib/<modulo>/__tests__/<bug>.test.ts || echo "✅ Bug reproduzido no teste"
```

#### Para bugs no DOM / content script:

```bash
# Build necessário
npm run build

# Rodar E2E com UI para debug visual
npx playwright test --ui

# Ou com trace
npx playwright test --trace on
npx playwright show-report
```

#### Para bugs no background / messaging:

```bash
# Verificar handlers
npx vitest run src/background --reporter=verbose

# Verificar validators
npx vitest run src/lib/messaging --reporter=verbose
```

---

### Etapa 4: Isolar a Causa 🔬

#### Estratégia: Bisect por Módulo

```bash
# Testar módulos isoladamente para encontrar o culpado
npx vitest run src/lib/generators --reporter=verbose
npx vitest run src/lib/storage --reporter=verbose
npx vitest run src/lib/messaging --reporter=verbose
npx vitest run src/lib/form/detectors --reporter=verbose
npx vitest run src/lib/dataset --reporter=verbose
npx vitest run src/lib/rules --reporter=verbose
```

#### Estratégia: Buscar Padrão

```bash
# Buscar o padrão problemático no código
grep -rn "<padrão-suspeito>" src/ --include="*.ts"

# Buscar mudanças recentes em arquivo suspeito
git log --oneline -10 -- src/lib/<modulo>/<arquivo>.ts

# Ver diff da última mudança
git diff HEAD~1 -- src/lib/<modulo>/<arquivo>.ts
```

#### Estratégia: Verificar Tipos

```bash
# Erros de tipo podem indicar a causa
npm run type-check 2>&1 | grep -i "error"

# Verificar se há 'any' implícitos
npm run type-check 2>&1 | grep "implicit"
```

#### Árvore de Decisão

```
Bug reportado
  │
  ├─ Teste existente falha?
  │     ├─ Sim → Ir para Etapa 5 (corrigir)
  │     └─ Não → Criar teste que reproduz
  │
  ├─ Bug é em lógica pura?
  │     ├─ Sim → Rodar vitest com verbose
  │     └─ Não → É DOM/UI?
  │               ├─ Sim → Rodar E2E com trace
  │               └─ Não → É messaging?
  │                         ├─ Sim → Verificar validators + handlers
  │                         └─ Não → É storage?
  │                                   └─ Sim → Verificar mocks + chaves
  │
  └─ Causa isolada? → Etapa 5
```

---

### Etapa 5: Corrigir o Bug 🛠️

#### Regra de Ouro: Corrigir com Teste

1. **Teste de regressão** existe e FALHA antes da correção
2. Aplicar correção mínima
3. Teste passa após correção
4. Nenhum outro teste quebrou

```bash
# Após a correção — teste do bug deve passar
npx vitest run src/lib/<modulo>/__tests__/<bug>.test.ts

# Todos os testes do módulo devem continuar passando
npx vitest run src/lib/<modulo>

# Validação rápida
./scripts/validate-step.sh types unit
```

#### Padrões de Correção por Tipo

| Tipo de Bug | Correção Comum | Validação |
|-------------|----------------|-----------|
| Generator retorna inválido | Lógica de cálculo | `vitest run generators` + 30 iterações |
| Parser lança exceção | `safeParse()` + return null | `vitest run messaging` |
| Storage retorna undefined | Fallback + validação Zod | `vitest run storage` |
| Classificador com confidence errada | Ajustar threshold/lógica | `vitest run detectors` + dataset |
| Import não encontrado | Barrel export esquecido | `type-check` + `build` |
| Evento DOM não disparado | Dispatch event correto | E2E test |

---

### Etapa 6: Validação Final ✅

```bash
# Validação completa
./scripts/validate-step.sh types unit build

# Comparar com baseline — deve ter MAIS testes (o de regressão)
./scripts/snapshot-health.sh --compare
```

**Critérios de sucesso**:

| Critério | Esperado |
|----------|----------|
| Teste de regressão | Passando |
| Testes existentes | Todos passando |
| Testes passando (total) | ≥ baseline + 1 |
| Type-check | Zero erros |
| Build | OK |
| Coverage | ≥ 85% |

## Comandos de Diagnóstico Rápido

```bash
# ─── Investigação ─────────────────────────────────────

# Rodar teste específico com detalhes
npx vitest run <path> --reporter=verbose

# Rodar teste em modo watch (re-executa ao salvar)
npx vitest <path>

# E2E com debug visual
npx playwright test --ui

# E2E com trace completo
npx playwright test --trace on && npx playwright show-report

# ─── Busca no Código ─────────────────────────────────

# Buscar string no código fonte
grep -rn "<texto>" src/ --include="*.ts"

# Buscar em testes
grep -rn "<texto>" src/ --include="*.test.ts"

# Buscar consumers de uma função
grep -rn "import.*<funcao>" src/ --include="*.ts"

# ─── Histórico ────────────────────────────────────────

# Últimas mudanças em arquivo
git log --oneline -10 -- <arquivo>

# Diff desde último commit
git diff HEAD -- <arquivo>

# Quem alterou uma linha específica
git blame <arquivo> | grep "<texto>"

# ─── Validação ────────────────────────────────────────

# Ciclo rápido
./scripts/validate-step.sh types unit

# Ciclo completo
./scripts/validate-step.sh types unit build

# Comparar saúde
./scripts/snapshot-health.sh --compare
```

## Checklist de Resolução

```markdown
### Bug: <descrição>

- [ ] Bug documentado (comportamento esperado vs atual)
- [ ] Baseline salva (`snapshot-health.sh --save`)
- [ ] Bug reproduzido (teste que FALHA)
- [ ] Causa isolada e documentada
- [ ] Correção aplicada (mudança mínima)
- [ ] Teste de regressão PASSA
- [ ] Testes existentes PASSAM
- [ ] `./scripts/validate-step.sh types unit build` OK
- [ ] `./scripts/snapshot-health.sh --compare` sem regressão
- [ ] Testes passando ≥ baseline + 1
```

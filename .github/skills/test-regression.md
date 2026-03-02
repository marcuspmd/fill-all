---
applyTo: '**'
description: 'Skill para validação de regressão em testes — verificar que mudanças não quebraram funcionalidades existentes.'
---

# Skill: Validação de Regressão em Testes

## Objetivo

Garantir que qualquer alteração no código não quebre funcionalidades existentes. Esta skill define o processo completo de validação de regressão usando testes unitários (Vitest) e E2E (Playwright).

## Processo de Validação

### 1. Antes de Alterar Código

```bash
# Executar testes unitários para ter baseline
npm test

# Verificar coverage atual
npm run test:coverage

# Verificar tipos
npm run type-check

# Build limpo
npm run build
```

> ⚠️ Anotar número de testes passando e percentuais de coverage ANTES de fazer alterações.

### 2. Após Alterar Código

```bash
# Verificação rápida — tipos + unitários
npm run type-check && npm test

# Verificação completa — tipos + unitários + E2E
npm run type-check && npm run build && npm run test:all

# Verificação com coverage — comparar com baseline
npm run test:coverage
```

### 3. Critérios de Aprovação

| Critério | Esperado | Comando |
|----------|----------|---------|
| Type-check | Zero erros | `npm run type-check` |
| Testes unitários | Todos passando | `npm test` |
| Testes E2E | Todos passando | `npm run test:e2e` |
| Coverage linhas | ≥ 85% (configurado em `vitest.config.ts`) | `npm run test:coverage` |
| Coverage statements | ≥ 85% (configurado em `vitest.config.ts`) | `npm run test:coverage` |
| Coverage funções | ≥ 85% (configurado em `vitest.config.ts`) | `npm run test:coverage` |
| Coverage branches | ≥ 85% (configurado em `vitest.config.ts`) | `npm run test:coverage` |
| Build | Sem erros | `npm run build` |

## Checklist de Regressão por Tipo de Mudança

### Mudança em Generators (`src/lib/generators/`)

```bash
# Testes específicos
npx vitest run src/lib/generators

# Verificar que dados gerados são válidos (CPF, CNPJ, etc.)
# Testes devem rodar 30+ iterações para detectar aleatoriedade
```

- [ ] Generators existentes continuam retornando dados válidos
- [ ] `generatorMap` em `index.ts` mapeia corretamente
- [ ] Nenhum generator faz `throw` — retorna fallback

### Mudança em Detectors/Classifiers (`src/lib/form/detectors/`)

```bash
# Testes específicos
npx vitest run src/lib/form/detectors

# Validação do dataset
npx vitest run src/lib/dataset
```

- [ ] Pipeline `DEFAULT_PIPELINE` não foi alterada sem necessidade
- [ ] Classificadores retornam `null` quando sem confiança
- [ ] Confidence entre 0–1
- [ ] Dataset accuracy não caiu (comparar com `evaluateClassifier()`)

### Mudança em Storage (`src/lib/storage/`)

```bash
npx vitest run src/lib/storage
```

- [ ] Operações atômicas usando `updateStorageAtomically()`
- [ ] Chaves com prefixo `fill_all_` via `STORAGE_KEYS`
- [ ] Sem `throw` — retorna fallback
- [ ] Testes mockam `chrome.storage.local`

### Mudança em Messaging (`src/lib/messaging/`)

```bash
npx vitest run src/lib/messaging
```

- [ ] Schemas Zod usam `safeParse()` → retorna `null` em falha
- [ ] Light validators usam apenas `typeof`
- [ ] Nenhum parser faz `throw`

### Mudança em Content Script / DOM

```bash
# Build necessário antes dos E2E
npm run build

# E2E específicos
npx playwright test src/lib/form/__tests__/e2e/
```

- [ ] Form detection funciona em formulários HTML padrão
- [ ] Form filling preenche campos corretamente
- [ ] Eventos `input`/`change`/`blur` são disparados
- [ ] DOM watcher detecta novos campos
- [ ] Floating panel abre/fecha/minimiza

### Mudança em Background/Handlers

```bash
npx vitest run src/background
```

- [ ] Handler registry despacha mensagens corretamente
- [ ] Context menu funciona
- [ ] CRUD de regras funciona

## Comandos de Diagnóstico

### Testes falhando — como investigar

```bash
# Rodar teste específico com verbose
npx vitest run <caminho-do-teste> --reporter=verbose

# Rodar teste específico em modo watch (re-executa ao salvar)
npx vitest <caminho-do-teste>

# Rodar E2E com UI interativa (debug visual)
npx playwright test --ui

# Rodar E2E com trace para debug
npx playwright test --trace on

# Ver relatório de testes E2E
npx playwright show-report
```

### Coverage caiu — como investigar

```bash
# Coverage detalhado por arquivo
npm run test:coverage

# Abrir relatório HTML
open .coverage/unit/index.html

# Coverage combinado (unit + E2E)
npm run coverage:all
open coverage/index.html
```

## Padrões de Regressão Comuns

### ❌ Regressões Frequentes

| Sintoma | Causa Comum | Solução |
|---------|-------------|---------|
| Import não encontrado | Barrel export não atualizado | Adicionar export em `index.ts` |
| Type error após refactor | Tipo alterado sem atualizar consumers | Verificar usages com `tsc --noEmit` |
| Teste falhando sem mudança | Mock global alterado em `setup.ts` | Isolar mocks por teste com `vi.clearAllMocks()` |
| E2E timeout | Build desatualizado | Rodar `npm run build` antes |
| Coverage caiu | Novo código sem testes | Adicionar testes para código novo |
| Generator retorna inválido | Lógica de dígito verificador quebrada | Rodar 30+ iterações no teste |

### ✅ Boas Práticas Anti-Regressão

- Sempre rodar `npm run type-check && npm test` antes de commit
- Manter testes independentes (sem dependência de ordem)
- Usar `vi.clearAllMocks()` no `beforeEach`
- Não alterar mocks globais em `setup.ts` sem necessidade
- Adicionar testes para cada bug fix (prevenir reintrodução)
- Comparar coverage antes/depois de cada PR

## Automação

### Script de Validação Completa

```bash
# Validação completa pre-commit
npm run type-check && npm run build && npm run test:all
```

### Ordem Recomendada para CI

1. `npm run type-check` — Rápido, detecta erros de tipo
2. `npm test` — Testes unitários (segundos)
3. `npm run build` — Build de produção
4. `npm run test:e2e` — Testes E2E (mais lento, requer build)
5. `npm run test:coverage` — Coverage (opcional, para relatório)

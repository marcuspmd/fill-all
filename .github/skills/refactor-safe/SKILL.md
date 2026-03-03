---
name: refactor-safe
description: 'Skill para refatorações seguras com scripts de validação antes/depois — garantindo zero regressão.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: development-workflow
---

# Skill: Refatoração Segura

## Objetivo

Realizar refatorações de código com segurança, usando scripts de validação antes e depois para detectar regressões. Cada refatoração segue um processo de 5 fases com validação automática.

## Quando Usar

- Renomear funções, tipos ou módulos
- Extrair código para novo módulo
- Reorganizar estrutura de diretórios
- Mudar interfaces/tipos compartilhados
- Migrar padrões (ex: classe → objeto `const`)
- Atualizar dependências com breaking changes

## Processo de 5 Fases

### Fase 1: Baseline 📊

Capturar estado completo do projeto ANTES de qualquer mudança:

```bash
# Salvar snapshot de saúde
./scripts/snapshot-health.sh --save

# Rodar validação completa — tudo deve passar
./scripts/validate-step.sh types unit build
```

**Registrar**:
- Número de testes passando
- Zero erros de tipo
- Build OK
- Coverage atual

> ⚠️ **NÃO iniciar refatoração se a baseline já tem falhas.** Corrija os problemas primeiro usando a skill [Debug & Investigação](../debug-investigation/SKILL.md) ou rode `./scripts/validate-step.sh types unit build` para identificar as falhas.

---

### Fase 2: Análise de Impacto 🔍

Antes de alterar código, mapear o raio de explosão:

```bash
# Encontrar todos os consumers de uma função/tipo
grep -r "nomeDaFuncao" src/ --include="*.ts" -l

# Encontrar imports de um módulo
grep -r "from.*modulo" src/ --include="*.ts" -l

# Encontrar usages de um tipo
grep -r "NomeDoTipo" src/ --include="*.ts" -l
```

**Documentar**:

```markdown
### Análise de Impacto

**O que muda**: <descrição>
**Arquivos afetados**: <lista>
**Testes afetados**: <lista>
**Consumers**: <lista de módulos que usam o código>
**Risco**: 🟢 Baixo | 🟡 Médio | 🔴 Alto
```

---

### Fase 3: Execução Incremental 🛠️

Executar a refatoração em steps atômicos:

#### Padrão: Rename de Função

```bash
# Step 1: Criar nova função com novo nome
# (manter a antiga como alias)
./scripts/validate-step.sh types unit

# Step 2: Atualizar consumers para novo nome
./scripts/validate-step.sh types unit

# Step 3: Remover função antiga
./scripts/validate-step.sh types unit

# Step 4: Atualizar testes
./scripts/validate-step.sh types unit
```

#### Padrão: Extrair Módulo

```bash
# Step 1: Criar novo arquivo com código extraído
./scripts/validate-step.sh types

# Step 2: Exportar do novo módulo
./scripts/validate-step.sh types

# Step 3: Atualizar imports no módulo original
./scripts/validate-step.sh types unit

# Step 4: Atualizar barrel exports (index.ts)
./scripts/validate-step.sh types unit build

# Step 5: Atualizar imports nos consumers
./scripts/validate-step.sh types unit
```

#### Padrão: Mudar Interface/Tipo

```bash
# Step 1: Adicionar novo campo (opcional) ao tipo
./scripts/validate-step.sh types

# Step 2: Atualizar implementações para usar novo campo
./scripts/validate-step.sh types unit

# Step 3: Migrar consumers para novo formato
./scripts/validate-step.sh types unit

# Step 4: Tornar campo obrigatório / remover campo antigo
./scripts/validate-step.sh types unit build
```

---

### Fase 4: Validação Completa ✅

Após completar todos os steps:

```bash
# Validação completa
./scripts/validate-step.sh types unit build

# Comparar com baseline
./scripts/snapshot-health.sh --compare
```

**Critérios de aprovação**:

| Critério | Esperado |
|----------|----------|
| Type-check | Zero erros |
| Testes unitários | Todos passando (≥ baseline) |
| Build | OK |
| Testes falhando | 0 (≤ baseline) |
| Novos erros de tipo | 0 |

---

### Fase 5: Cleanup 🧹

```bash
# Verificar se sobrou código morto
grep -r "TODO\|FIXME\|HACK" src/ --include="*.ts" | grep -i "refactor"

# Verificar imports não utilizados
npm run type-check

# Verificar que barrel exports estão atualizados
grep -r "export.*from" src/lib/generators/index.ts
grep -r "export.*from" src/lib/dataset/index.ts
```

## Exemplos de Refatorações Comuns

### Renomear Módulo de Storage

```markdown
### Análise
- **O que muda**: `src/lib/storage/forms.ts` → `src/lib/storage/saved-forms.ts`
- **Consumers**: 8 arquivos importam de `forms.ts`
- **Risco**: 🟡 Médio (muitos consumers)

### Steps
1. Criar `saved-forms.ts` com re-exports de `forms.ts` → validate types
2. Atualizar consumers um a um → validate types unit (após cada grupo)
3. Mover implementação para `saved-forms.ts` → validate types unit
4. Remover `forms.ts` → validate types unit build
5. Atualizar barrel exports → validate types unit build
```

### Migrar Classe → Objeto Const

```markdown
### Análise
- **O que muda**: `class MyDetector` → `const myDetector: FieldClassifier`
- **Convenção**: Classificadores são objetos, não classes
- **Risco**: 🟢 Baixo (interface mantida)

### Steps
1. Criar objeto `const myDetector` com mesma lógica → validate types
2. Atualizar exports → validate types
3. Atualizar consumers (new MyDetector() → myDetector) → validate types unit
4. Remover classe → validate types unit build
```

## Checklist de Segurança

```markdown
### Antes de Iniciar
- [ ] Baseline salva (`./scripts/snapshot-health.sh --save`)
- [ ] Validação passa (`./scripts/validate-step.sh types unit build`)
- [ ] Análise de impacto documentada
- [ ] Steps planejados

### Durante a Execução
- [ ] Validação após cada step (`./scripts/validate-step.sh types unit`)
- [ ] Nenhum step acumula 3+ mudanças sem validar
- [ ] Testes existentes não foram alterados (exceto se necessário)

### Após Completar
- [ ] Comparação com baseline OK (`./scripts/snapshot-health.sh --compare`)
- [ ] Zero regressão em testes
- [ ] Zero novos erros de tipo
- [ ] Build OK
- [ ] Barrel exports atualizados
- [ ] Código morto removido
```

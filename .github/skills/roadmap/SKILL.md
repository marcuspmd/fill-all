---
name: roadmap
description: 'Skill para planejamento de roadmap, gestão de features, milestones e priorização de tarefas do projeto Fill All.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: planning
---

# Skill: Roadmap & Planejamento

## Objetivo

Auxiliar no planejamento, organização e acompanhamento do roadmap do projeto Fill All — desde a concepção de features até a entrega.

## Estrutura de Features

Toda nova feature deve seguir o template abaixo ao ser planejada:

```markdown
## Feature: <Nome da Feature>

**Prioridade**: 🔴 Alta | 🟡 Média | 🟢 Baixa
**Módulo**: Background | Content Script | Popup | Options | DevTools | Lib
**Estimativa**: P (pequena) | M (média) | G (grande)
**Dependências**: Listar features ou módulos que precisam estar prontos

### Descrição
Resumo claro do que a feature faz e qual problema resolve.

### Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Testes unitários adicionados
- [ ] Testes E2E adicionados (se DOM-heavy)
- [ ] Documentação atualizada

### Impacto
- **Arquivos afetados**: listar módulos/arquivos
- **Breaking changes**: sim/não + detalhes
- **Performance**: impacto esperado no content script
```

## Categorias do Roadmap

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| 🧠 AI & ML | Chrome AI, TensorFlow.js, learning store | Novo classificador, fine-tuning, accuracy |
| 📝 Formulários | Detecção, preenchimento, adapters | Novo adapter UI, novo tipo de campo |
| 🔧 Geradores | Dados brasileiros, internacionais | Novo gerador, validação de dados |
| 🎨 UI/UX | Popup, options, DevTools | Nova aba, melhorias visuais |
| ⚙️ Infraestrutura | Build, testes, CI/CD, storage | Pipeline, coverage, performance |
| 🔒 Segurança | CSP, permissões, sanitização | Audit, correções |
| 📖 Documentação | Instructions, skills, AGENTS.md | Novas convenções, guias |

## Processo de Priorização

### Matriz de Prioridade

```
                    IMPACTO
              Baixo    │    Alto
         ┌───────────┼───────────┐
  Baixo  │  Backlog  │  Quick    │
ESFORÇO  │           │  Win 🎯   │
         ├───────────┼───────────┤
  Alto   │  Evitar   │  Planejar │
         │           │  Sprint   │
         └───────────┴───────────┘
```

- **Quick Win**: Implementar imediatamente (baixo esforço + alto impacto)
- **Planejar Sprint**: Agendar para próximo ciclo (alto esforço + alto impacto)
- **Backlog**: Manter no backlog (baixo esforço + baixo impacto)
- **Evitar**: Não priorizar (alto esforço + baixo impacto)

## Checklist de Entrega de Feature

Antes de considerar uma feature como "pronta":

```markdown
### Checklist de Entrega

- [ ] Código implementado seguindo convenções do projeto
- [ ] Named exports apenas (nunca `export default`)
- [ ] Logger com `createLogger("Namespace")` (nunca `console.log`)
- [ ] Error handling: sem throws em storage/parsers/generators
- [ ] Testes unitários com Vitest (coverage ≥ 85%)
- [ ] Testes E2E com Playwright (se DOM-heavy)
- [ ] Type-check passa (`npm run type-check`)
- [ ] Build passa (`npm run build`)
- [ ] Testes passam (`npm run test:all`)
- [ ] Instructions/skills atualizados (se nova convenção)
- [ ] Barrel exports atualizados (`index.ts`)
```

## Versionamento

| Tipo de Mudança | Incremento | Exemplo |
|-----------------|------------|---------|
| Bug fix, correção | Patch (0.0.x) | 1.1.0 → 1.1.1 |
| Nova feature, gerador, detector | Minor (0.x.0) | 1.1.0 → 1.2.0 |
| Breaking change, migração de storage | Major (x.0.0) | 1.1.0 → 2.0.0 |

## Acompanhamento

### Métricas de Progresso

- **Coverage unitário**: meta ≥ 85% (linhas, statements, funções, branches)
- **Coverage E2E**: cobertura dos fluxos críticos (form-fill, panel, icons)
- **Type-check**: zero erros (`npm run type-check`)
- **Build**: zero warnings (`npm run build`)
- **Accuracy do classificador**: reportado por `evaluateClassifier()` no dataset

### Scripts de Validação

```bash
# Validação step-by-step (selecione os steps necessários)
./scripts/validate-step.sh types unit build

# Capturar baseline antes de iniciar uma feature
./scripts/snapshot-health.sh --save

# Comparar após entregar a feature
./scripts/snapshot-health.sh --compare
```

### Revisão de Roadmap

Revisar o roadmap periodicamente verificando:

1. Features entregues vs planejadas
2. Bugs reportados vs resolvidos
3. Evolução de coverage e accuracy
4. Feedback de usuários (issues abertas)
5. Débito técnico acumulado

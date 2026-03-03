---
name: dependency-management
description: 'Skill para gerenciamento seguro de dependências npm — auditoria, atualização, lock files e breaking changes.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: maintenance
---

# Skill: Gerenciamento de Dependências

## Objetivo

Gerenciar dependências npm do projeto Fill All de forma segura e controlada — auditar vulnerabilidades, atualizar pacotes sem regressão e manter o lock file saudável.

## Quando Atualizar

| Situação | Ação | Urgência |
|----------|------|----------|
| Vulnerabilidade crítica (`npm audit`) | Atualizar imediatamente | 🔴 Alta |
| Dependência com breaking change | Planejar migração com skill [Refatoração Segura](../refactor-safe/SKILL.md) | 🟡 Média |
| Nova versão minor/patch | Atualizar em lote, com validação | 🟢 Baixa |
| Dependência deprecated | Buscar alternativa e migrar | 🟡 Média |
| Nova feature precisa de pacote | Avaliar necessidade, instalar com validação | 🟡 Média |

## Verificação de Saúde

### Script Automatizado

```bash
# Verificação completa de saúde das dependências
.github/skills/dependency-management/scripts/check-deps.sh
```

### Verificação Manual

```bash
# Verificar vulnerabilidades
npm audit

# Verificar pacotes desatualizados
npm outdated

# Verificar tamanho do node_modules
du -sh node_modules

# Verificar pacotes não utilizados (manualmente)
grep -r "from \"<pacote>\"" src/ --include="*.ts" -l
```

## Processo de Atualização Segura

### 1. Capturar Baseline

```bash
# Salvar estado antes de atualizar
./scripts/snapshot-health.sh --save

# Garantir que tudo funciona antes
./scripts/validate-step.sh types unit build
```

### 2. Atualizar UM Pacote por Vez

```bash
# ❌ Nunca atualizar tudo de uma vez
npm update  # PERIGOSO — pode causar múltiplas regressões

# ✅ Atualizar um pacote por vez
npm install <pacote>@latest

# Validar após cada atualização
./scripts/validate-step.sh types unit build
```

### 3. Validar Após Cada Atualização

```bash
# Verificar tipos — breaking changes em tipos são comuns
npm run type-check

# Rodar testes unitários
npm test

# Build de produção
npm run build

# Se mudou algo no DOM/content script
npm run test:e2e
```

### 4. Comparar com Baseline

```bash
./scripts/snapshot-health.sh --compare
```

## Gerenciamento do Lock File

### Regras

| Regra | Detalhe |
|-------|---------|
| **Sempre commitar** `package-lock.json` | Garante builds reproduzíveis |
| **Nunca editar manualmente** | Usar `npm install` para atualizar |
| **Resolver conflitos com cuidado** | Em caso de merge conflict, rodar `npm install` após resolver `package.json` |
| **Usar `npm ci` em CI** | Instalação limpa a partir do lock file |

### Resolver Conflitos no Lock File

```bash
# Após resolver conflitos no package.json
rm -rf node_modules
rm package-lock.json
npm install
```

## Tratamento de Breaking Changes

### Processo

1. **Identificar** as mudanças no CHANGELOG do pacote
2. **Avaliar impacto** usando análise de imports:
   ```bash
   grep -r "from \"<pacote>\"" src/ --include="*.ts" -l
   ```
3. **Criar branch** dedicada para a migração
4. **Seguir skill** [Refatoração Segura](../refactor-safe/SKILL.md) para a migração
5. **Validar completamente** antes de merge

### Dependências Críticas

| Pacote | Impacto | Cuidados na Atualização |
|--------|---------|------------------------|
| `vite` | Build inteiro | Testar build + extensão no Chrome |
| `@crxjs/vite-plugin` | Manifest + build | Verificar compatibilidade com Vite |
| `vitest` | Todos os testes | Rodar suite completa |
| `zod` | Validators + parsers | Verificar schemas e safeParse |
| `@playwright/test` | Testes E2E | Rodar E2E completo |
| `@anthropic-ai/sdk` | AI features | Verificar API compatibility |

## Adicionando Nova Dependência

### Checklist

- [ ] **Necessidade real** — não existe solução nativa ou já incluída?
- [ ] **Tamanho** — verificar bundle size (`npm pack --dry-run` ou bundlephobia.com)
- [ ] **Manutenção** — pacote ativamente mantido? Último release recente?
- [ ] **Vulnerabilidades** — `npm audit` limpo após instalar?
- [ ] **Licença** — compatível com MIT?
- [ ] **TypeScript** — tem tipos incluídos ou `@types/*` disponível?
- [ ] **Dev vs Prod** — `--save-dev` para ferramentas de build/teste

```bash
# Dependência de produção
npm install <pacote>

# Dependência de desenvolvimento
npm install --save-dev <pacote>

# Após instalar — validar
./scripts/validate-step.sh types unit build
```

## Comandos Úteis

```bash
# ─── Auditoria ─────────────────────────────────

# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente (quando possível)
npm audit fix

# Forçar correções (pode causar breaking changes)
npm audit fix --force  # ⚠️ Usar com cuidado!

# ─── Atualização ───────────────────────────────

# Ver pacotes desatualizados
npm outdated

# Atualizar pacote específico
npm install <pacote>@latest

# Atualizar para versão específica
npm install <pacote>@<versão>

# ─── Limpeza ───────────────────────────────────

# Reinstalar tudo do zero
rm -rf node_modules && npm ci

# Verificar pacotes duplicados
npm dedupe

# ─── Informação ────────────────────────────────

# Ver árvore de dependências
npm ls --depth=0

# Ver detalhes de um pacote
npm info <pacote>

# Ver por que um pacote está instalado
npm explain <pacote>
```

## Checklist de Manutenção

```markdown
### Revisão de Dependências

- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] `npm outdated` revisado — pacotes críticos atualizados
- [ ] `package-lock.json` commitado e atualizado
- [ ] `./scripts/validate-step.sh types unit build` passa
- [ ] Nenhuma dependência deprecated sem plano de migração
- [ ] Bundle size verificado — sem pacotes desnecessários
```

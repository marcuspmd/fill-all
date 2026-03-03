---
name: new-module
description: 'Skill para criar um novo módulo em src/lib/ do zero — scaffolding, estrutura, testes, barrel exports e validação.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: scaffolding
---

# Skill: Criar Novo Módulo

## Objetivo

Guia step-by-step para criar um novo módulo em `src/lib/`, seguindo a estrutura padrão do projeto com testes, exports e validação.

## Estrutura Padrão de um Módulo

```
src/lib/<nome-modulo>/
  ├── <arquivo-principal>.ts     # Lógica principal
  ├── <arquivo-secundario>.ts    # (opcional) Lógica adicional
  ├── index.ts                   # Barrel exports (se múltiplos arquivos)
  └── __tests__/
      ├── <arquivo>.test.ts      # Testes unitários
      └── e2e/                   # (opcional) Testes E2E
          └── <arquivo>.test.e2e.ts
```

## Passo a Passo com Validação

### Step 1: Preparação — Capturar Baseline

```bash
./scripts/snapshot-health.sh --save
```

✅ Baseline salva

---

### Step 2: Criar Estrutura de Diretórios

```bash
# Criar diretórios
mkdir -p src/lib/<nome-modulo>/__tests__
```

---

### Step 3: Criar Arquivo Principal

**Arquivo**: `src/lib/<nome-modulo>/<arquivo>.ts`

```typescript
import { createLogger } from "@/lib/logger";

const log = createLogger("<NomeModulo>");

/**
 * <Descrição do que o módulo faz>
 */
export function <funcaoPrincipal>(<params>): <ReturnType> {
  try {
    // Implementação
    log.debug("<funcaoPrincipal> executado com sucesso");
    return resultado;
  } catch (err) {
    log.warn("Falha em <funcaoPrincipal>:", err);
    return fallback; // NUNCA throw
  }
}
```

**Regras**:
- Named exports apenas
- Logger com `createLogger`
- Sem `throw` — retornar fallback
- Funções com naming `verbNoun`

```bash
./scripts/validate-step.sh types
```

✅ Type-check passa

---

### Step 4: Criar Barrel Exports (se múltiplos arquivos)

**Arquivo**: `src/lib/<nome-modulo>/index.ts`

```typescript
export { <funcaoPrincipal> } from "./<arquivo>";
export { <outraFuncao> } from "./<outro-arquivo>";

// Exportar tipos com `export type`
export type { <MeuTipo> } from "./<tipos>";
```

```bash
./scripts/validate-step.sh types
```

✅ Type-check passa

---

### Step 5: Criar Testes Unitários

**Arquivo**: `src/lib/<nome-modulo>/__tests__/<arquivo>.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { <funcaoPrincipal> } from "@/lib/<nome-modulo>/<arquivo>";

// Mock do logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("<funcaoPrincipal>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns expected result for valid input", () => {
    // Arrange
    const input = /* ... */;

    // Act
    const result = <funcaoPrincipal>(input);

    // Assert
    expect(result).toBeDefined();
  });

  it("returns fallback for invalid input", () => {
    const result = <funcaoPrincipal>(null as unknown as any);
    expect(result).toBe(/* fallback */);
  });

  it("never throws", () => {
    expect(() => <funcaoPrincipal>(undefined as unknown as any)).not.toThrow();
    expect(() => <funcaoPrincipal>(null as unknown as any)).not.toThrow();
    expect(() => <funcaoPrincipal>("" as unknown as any)).not.toThrow();
  });
});
```

```bash
./scripts/validate-step.sh types unit
```

✅ Type-check + testes passam

---

### Step 6: Integrar com Módulos Existentes (se aplicável)

Se o módulo precisa ser chamado por outros:

```typescript
// No consumer:
import { <funcaoPrincipal> } from "@/lib/<nome-modulo>";
```

```bash
./scripts/validate-step.sh types unit build
```

✅ Type-check + testes + build passam

---

### Step 7: Validação Final

```bash
# Validação completa
./scripts/validate-step.sh types unit build

# Comparar com baseline — verificar zero regressão
./scripts/snapshot-health.sh --compare
```

✅ Nenhuma regressão, módulo funcional

## Módulos com Storage

Se o módulo persiste dados em `chrome.storage.local`:

```typescript
import { getFromStorage, setToStorage, updateStorageAtomically } from "@/lib/storage/core";
import { STORAGE_KEYS } from "@/lib/storage/storage-keys";

// Adicionar chave no STORAGE_KEYS:
// STORAGE_KEYS.<MODULO>_DATA = "fill_all_<modulo>_data"

export async function get<Modulo>Data(): Promise<ModuloData[]> {
  return getFromStorage<ModuloData[]>(STORAGE_KEYS.<MODULO>_DATA, []);
}

export async function save<Modulo>Data(data: ModuloData[]): Promise<void> {
  await setToStorage(STORAGE_KEYS.<MODULO>_DATA, data);
}
```

**Regras de Storage**:
- Chaves com prefixo `fill_all_` via `STORAGE_KEYS`
- `chrome.storage.local` — nunca `sync`
- Operações atômicas com `updateStorageAtomically()`
- Sem throw — retornar fallback

## Módulos com Messaging

Se o módulo precisa de comunicação via mensagens:

1. Adicionar tipo de mensagem em `src/types/index.ts`
2. Adicionar validador em `src/lib/messaging/validators.ts`
3. Adicionar handler em `src/background/handlers/`
4. (Se content script) Adicionar light validator em `light-validators.ts`

## Checklist Final

```markdown
### Módulo Criado
- [ ] Diretório `src/lib/<nome-modulo>/` criado
- [ ] Arquivo principal com named exports
- [ ] Logger com `createLogger("<NomeModulo>")`
- [ ] Sem `throw` — retorna fallback
- [ ] Barrel exports (`index.ts`) se múltiplos arquivos
- [ ] Testes em `__tests__/<arquivo>.test.ts`
- [ ] Logger mockado nos testes
- [ ] `vi.clearAllMocks()` no `beforeEach`
- [ ] Padrão AAA (Arrange/Act/Assert)
- [ ] `./scripts/validate-step.sh types unit build` passa
- [ ] `./scripts/snapshot-health.sh --compare` sem regressão
- [ ] Coverage ≥ 85%
```

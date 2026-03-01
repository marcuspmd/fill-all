---
applyTo: 'src/**/__tests__/**/*.test.ts'
description: 'Convenções para testes unitários com Vitest no projeto Fill All.'
---

# Fill All — Testes Unitários

## Ferramenta

- **Vitest** com `globals: true` e ambiente `node` (padrão) ou `happy-dom` (para módulos DOM)
- Arquivo de setup: `src/__tests__/setup.ts`
- Coverage: `vitest run --coverage` → `coverage/` (V8, HTML)

## Localização

```
src/lib/<modulo>/__tests__/<arquivo>.test.ts
```

Nunca criar testes fora de `__tests__/`. Nunca usar sufixo `.test.e2e.ts` — este é exclusivo do Playwright.

## Estrutura do Arquivo

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { funcaoTestada } from "@/lib/<modulo>/<arquivo>";

describe("<funcaoTestada>", () => {
  it("<should + comportamento esperado>", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

- Usar `import { ... } from "vitest"` explicitamente (globals habilitado, mas imports documentam dependências)
- Padrão AAA: **Arrange / Act / Assert** dentro de cada `it`
- `describe` aninhados para agrupar por função/comportamento
- Nomes de `it` em inglês: `"returns formatted CPF by default"`, `"throws when input is null"`

## Ambiente happy-dom

Para módulos que usam DOM (MutationObserver, document, window):

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
```

Adicionar o comentário `// @vitest-environment happy-dom` na **primeira linha** do arquivo.

## Mocks

```typescript
// Mock de módulo inteiro
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock de chrome APIs (já configurado no setup.ts)
// Usar vi.fn() para substituir comportamentos específicos
const mockGet = vi.fn().mockResolvedValue({ key: "value" });
```

- Sempre mockar `createLogger` em módulos que o utilizam
- Mockar `chrome.*` via setup global — não reimplementar por arquivo
- Usar `vi.clearAllMocks()` no `beforeEach` para reset entre testes

## O que testar com Vitest

| ✅ Testar | ❌ Não testar |
|-----------|--------------|
| Generators (`generateCpf`, `generateEmail`, ...) | Arquivos DOM-heavy (`form-filler.ts`, `floating-panel.ts`) |
| Parsers Zod (`parseRulePayload`, ...) | Arquivos de estilo (`field-icon-styles.ts`) |
| Storage CRUD (`getRules`, `saveRule`, ...) | Runtime TensorFlow (`runtime-trainer.ts`) |
| Rule Engine (`resolveRule`, ...) | Content Script completo |
| Classifiers (`htmlTypeDetector.detect`, ...) | Background Service Worker completo |
| Light validators (`isValidMessage`, ...) | |
| URL matchers (`matchUrlPattern`, ...) | |

Arquivos DOM-heavy são cobertos pelos testes E2E com Playwright.

## Cobertura Mínima

Thresholds configurados no `vitest.config.ts`:

```
lines:      80%
statements: 80%
functions:  80%
branches:   70%
```

## Exemplos de Padrões Comuns

### Gerador com validação

```typescript
it("always generates a valid CPF", () => {
  for (let i = 0; i < 30; i++) {
    expect(validateCpf(generateCpf(false))).toBe(true);
  }
});
```

### Parser Zod retorna null em falha

```typescript
it("returns null for invalid payload", () => {
  expect(parseRulePayload({ invalid: true })).toBeNull();
});
```

### Mock de storage atômico

```typescript
vi.mock("@/lib/storage/core", () => ({
  getFromStorage: vi.fn().mockResolvedValue([]),
  setToStorage: vi.fn().mockResolvedValue(undefined),
  updateStorageAtomically: vi.fn().mockImplementation(async (_k, def, updater) => updater(def)),
}));
```

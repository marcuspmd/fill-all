---
name: new-generator
description: 'Skill para criar novos geradores de dados seguindo as convenções do projeto Fill All.'
applyTo: 'src/lib/generators/**'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: scaffolding
allowed-tools: Read Write Bash
---

# Skill: Criar Novo Gerador de Dados

## Objetivo

Guia passo a passo para criar um novo gerador de dados no projeto Fill All, seguindo todas as convenções de naming, exports, testes e registro.

## Pré-Requisitos

- Entender o tipo de dado a ser gerado
- Verificar se o `FieldType` correspondente já existe em `src/types/index.ts`
- Verificar se já não existe um gerador similar em `src/lib/generators/`

## Passo a Passo

### 1. Criar o Arquivo do Gerador

> **Nota**: Nos exemplos abaixo, `<nome>` e `<Nome>` são placeholders. Substitua pelo nome real do gerador (ex: `cpf`/`Cpf`, `email`/`Email`, `phone`/`Phone`).

```
src/lib/generators/<nome>.ts
```

```typescript
// ✅ Estrutura padrão de um gerador

/**
 * Gera um <descrição do dado>.
 * Retorna string formatada/não formatada conforme parâmetro.
 */
export function generate<Nome>(formatted = true): string {
  // Lógica de geração
  // NUNCA throw — retornar string vazia como fallback
  return resultado;
}
```

#### Regras Obrigatórias

| Regra | Detalhe |
|-------|---------|
| Função pura | Sem side effects, sem async, sem dependências externas |
| Síncrona | Sempre `() → string`, nunca `async` |
| Sem throw | Retornar `""` ou fallback em caso de erro |
| Named export | Nunca `export default` |
| Naming | `generate<Nome>()` — verbo + substantivo |
| Dados brasileiros | Dígitos verificadores corretos (CPF, CNPJ, etc.) |

### 2. Registrar no Index

Arquivo: `src/lib/generators/index.ts`

```typescript
// Adicionar re-export
export { generate<Nome> } from "./<nome>";

// Adicionar no generatorMap (mapeia FieldType → função geradora)
const generatorMap: Record<string, () => string> = {
  // ... existentes
  "<field-type>": generate<Nome>,
};
```

### 3. Adicionar FieldType (se novo)

Arquivo: `src/types/index.ts`

```typescript
export type FieldType =
  | "existing-type"
  // ... existentes
  | "<novo-tipo>"  // Adicionar aqui
  ;
```

### 4. Criar Testes Unitários

```
src/lib/generators/__tests__/<nome>.test.ts
```

```typescript
import { describe, it, expect } from "vitest";
import { generate<Nome> } from "@/lib/generators/<nome>";

describe("generate<Nome>", () => {
  it("returns a non-empty string", () => {
    const result = generate<Nome>();
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("generates valid data across multiple iterations", () => {
    for (let i = 0; i < 30; i++) {
      const result = generate<Nome>();
      expect(result).toBeTruthy();
      // Adicionar validação específica do formato
    }
  });

  it("returns formatted value by default", () => {
    const result = generate<Nome>();
    // Verificar formatação esperada (pontos, traços, etc.)
    expect(result).toMatch(/padrão-regex/);
  });

  it("returns unformatted value when requested", () => {
    const result = generate<Nome>(false);
    // Verificar que não tem formatação
    expect(result).toMatch(/^\d+$/);
  });

  it("never throws", () => {
    for (let i = 0; i < 50; i++) {
      expect(() => generate<Nome>()).not.toThrow();
    }
  });
});
```

### 5. Validar

```bash
# Validação rápida com script do projeto
./scripts/validate-step.sh types unit

# Ou comandos individuais:

# Verificar tipos
npm run type-check

# Rodar testes do gerador
npx vitest run src/lib/generators/__tests__/<nome>.test.ts

# Rodar todos os testes de geradores
npx vitest run src/lib/generators

# Verificar coverage
npm run test:coverage
```

## Exemplos de Referência

### Gerador com Dígito Verificador (CPF)

```typescript
export function generateCpf(formatted = true): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  // Cálculo do primeiro dígito verificador
  const d1 = calcDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  digits.push(d1);

  // Cálculo do segundo dígito verificador
  const d2 = calcDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  digits.push(d2);

  const raw = digits.join("");
  return formatted
    ? `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`
    : raw;
}
```

### Gerador Simples (Email)

```typescript
export function generateEmail(): string {
  const user = generateRandomString(8);
  const domains = ["gmail.com", "outlook.com", "yahoo.com.br"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${user}@${domain}`;
}
```

## Checklist Final

- [ ] Arquivo criado em `src/lib/generators/<nome>.ts`
- [ ] Função exportada como named export: `export function generate<Nome>()`
- [ ] Função é pura e síncrona
- [ ] Nunca faz `throw` — retorna fallback
- [ ] Registrada no `generatorMap` em `index.ts`
- [ ] Re-exportada no barrel `index.ts`
- [ ] `FieldType` adicionado (se novo tipo)
- [ ] Testes unitários criados com 30+ iterações
- [ ] Testes verificam formato, validade e ausência de throw
- [ ] `npm run type-check` passa
- [ ] `npm test` passa
- [ ] Coverage mantido ≥ 85%

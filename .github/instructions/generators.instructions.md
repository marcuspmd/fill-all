---
applyTo: 'src/lib/generators/**'
---

# Generator Conventions

## Padrões

- Funções puras e síncronas: `generate*() → string`
- Nunca throw — retornar string vazia ou fallback
- Geradores brasileiros devem produzir dados válidos (CPF/CNPJ com dígitos verificadores corretos)
- Registry central em `index.ts` mapeia `FieldType → () => string`

## Naming

```typescript
export function generateCpf(formatted?: boolean): string { ... }
export function generateEmail(): string { ... }
export function generateFullName(): string { ... }
```

## Novo Gerador

1. Criar arquivo `src/lib/generators/<nome>.ts`
2. Exportar função(ões) `generate*`
3. Registrar no `generatorMap` em `index.ts`
4. Adicionar tipo correspondente em `FieldType` (`src/types/index.ts`) se novo

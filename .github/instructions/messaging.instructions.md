---
applyTo: 'src/lib/messaging/**'
---

# Messaging & Validation Conventions

## Duas Camadas de Validação

| Camada | Arquivo | Onde usar | Como |
|--------|---------|-----------|------|
| Full Zod | `validators.ts` | Background, options, caminhos críticos | Schema Zod + `safeParse()` |
| Light | `light-validators.ts` | Content script (hot paths) | Apenas `typeof` checks |

## Rules

- Sempre `safeParse()` → retornar `null` em falha, nunca re-throw
- `.strict()` para validação exata, `.partial().strict()` para updates parciais
- Zod v4: usar `z.uuid()` (NÃO `z.string().uuid()`)

```typescript
export function parseRulePayload(input: unknown): FieldRule | null {
  const result = fieldRuleSchema.safeParse(input);
  return result.success ? result.data : null;
}
```

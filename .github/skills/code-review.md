---
applyTo: '**'
description: 'Skill para realizar code reviews alinhados com as convenções e padrões de qualidade do projeto Fill All.'
---

# Skill: Code Review

## Objetivo

Realizar code reviews consistentes e alinhados com as convenções do projeto Fill All, garantindo qualidade, segurança e manutenibilidade do código.

## Checklist de Review

### 1. Convenções Gerais

- [ ] **Named exports apenas** — sem `export default`
- [ ] **Imports com `@/*`** — não usar aliases granulares (`@lib/*`, `@form/*`)
- [ ] **Logger**: `createLogger("Namespace")` — sem `console.log` direto
- [ ] **Naming**: funções `verbNoun`, tipos `PascalCase`, constantes `UPPER_SNAKE_CASE`
- [ ] **TypeScript strict**: sem `any` implícito, sem `// @ts-ignore` desnecessário

### 2. Error Handling

- [ ] **Storage/Parsers/Generators**: sem `throw` — retorna fallback ou `null`
- [ ] **Parsers Zod**: usa `safeParse()` → retorna `null` em falha
- [ ] **Async**: tem `try-catch` com log contextual via `createLogger`
- [ ] **Sem exceções silenciosas**: erros são logados com `log.warn` ou `log.error`

```typescript
// ✅ Correto
export function parsePayload(input: unknown): MyType | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

// ❌ Errado
export function parsePayload(input: unknown): MyType {
  return schema.parse(input); // Pode lançar exceção
}
```

### 3. Validação

- [ ] **Background/Options**: usa Zod completo (`validators.ts`)
- [ ] **Content Script**: usa light validators (`light-validators.ts`) — apenas `typeof`
- [ ] **Zod v4**: usa `z.uuid()` (não `z.string().uuid()`)
- [ ] **Schemas**: `.strict()` para validação exata

### 4. Storage

- [ ] **Operações atômicas**: usa `updateStorageAtomically()` com updater puro
- [ ] **Chaves**: usa `STORAGE_KEYS` (prefixo `fill_all_`)
- [ ] **API**: `chrome.storage.local` (nunca `sync`)
- [ ] **Sem throw**: retorna fallback em caso de erro

### 5. Pipeline & Classificadores

- [ ] **Imutável**: `.with()`, `.without()`, `.withOrder()` retornam NOVA instância
- [ ] **Classificadores**: objeto `const` com `.name` + `.detect()` (nunca classe)
- [ ] **Confidence**: entre 0–1, retorna `null` quando sem confiança
- [ ] **Nome único**: `.name` não conflita com existentes

### 6. Geradores

- [ ] **Função pura**: síncrona, sem side effects
- [ ] **Dados válidos**: CPF/CNPJ com dígitos verificadores corretos
- [ ] **Sem throw**: retorna `""` ou fallback
- [ ] **Registrado**: no `generatorMap` em `index.ts`

### 7. Testes

- [ ] **Novos testes**: código novo tem testes correspondentes
- [ ] **Testes existentes**: não foram removidos ou alterados sem necessidade
- [ ] **Coverage**: mantido ≥ 85%
- [ ] **Localização**: `src/lib/<modulo>/__tests__/<arquivo>.test.ts`
- [ ] **Padrão AAA**: Arrange / Act / Assert
- [ ] **Isolados**: `vi.clearAllMocks()` no `beforeEach`
- [ ] **Logger mockado**: módulos com logger têm mock de `createLogger`

### 8. Performance (Content Script)

- [ ] **Hot paths**: sem operações pesadas no content script
- [ ] **Validação light**: content script usa `typeof` checks (não Zod)
- [ ] **DOM**: MutationObserver debounced (600ms)
- [ ] **Async**: operações pesadas são assíncronas

### 9. Segurança

- [ ] **Sem `eval()`**: nunca usar `eval()` ou `new Function()`
- [ ] **Sem `innerHTML`**: usar `textContent` ou DOM API segura
- [ ] **Input sanitization**: `escapeHtml()` para dados de usuário exibidos
- [ ] **URL validation**: padrões de URL validados antes de uso
- [ ] **CSP compliance**: compatível com Content Security Policy do Manifest V3

## Severidade de Problemas

| Severidade | Ação | Exemplos |
|------------|------|----------|
| 🔴 **Blocker** | Deve corrigir antes de merge | Throw em generator, `eval()`, segurança, build quebrado |
| 🟡 **Warning** | Deve corrigir, pode ser em follow-up | `console.log` direto, sem teste, naming incorreto |
| 🟢 **Suggestion** | Opcional, melhoria de qualidade | Refactor sugerido, comentário mais claro |

## Template de Comentário de Review

```markdown
**[🔴/🟡/🟢] <Categoria>**: <Descrição do problema>

<Explicação do porquê e referência à convenção>

```suggestion
// Código sugerido
```
```

### Exemplos

```markdown
**[🔴 Blocker] Error Handling**: Parser usa `schema.parse()` que pode lançar exceção.

Convenção do projeto: parsers nunca fazem throw. Usar `safeParse()` e retornar `null`.

**[🟡 Warning] Naming**: Função `doStuff()` não segue padrão `verbNoun`.

Sugestão: renomear para `processFieldData()` ou similar.

**[🟢 Suggestion] Testes**: Considerar adicionar teste para edge case com campo vazio.
```

## Fluxo de Review

1. **Ler a descrição** do PR — entender o objetivo da mudança
2. **Verificar testes** — novos testes existem? Existentes passam?
3. **Revisar código** — seguir checklist acima
4. **Testar localmente** (se necessário):
   ```bash
   # Validação rápida
   ./scripts/validate-step.sh types unit

   # Validação completa
   ./scripts/validate-step.sh types unit build

   # Comparar com baseline (se havia snapshot salvo)
   ./scripts/snapshot-health.sh --compare
   ```
5. **Deixar feedback** — usar template de comentário com severidade
6. **Aprovar ou solicitar mudanças** — baseado na severidade encontrada

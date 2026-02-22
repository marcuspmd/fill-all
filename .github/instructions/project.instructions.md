---
applyTo: '**'
description: 'Use when working on any file in the Fill All Chrome Extension project. Covers architecture, conventions, error handling, naming, imports, and communication patterns.'
---

# Fill All — Project Conventions

## Visão Geral

Extensão Chrome (Manifest V3) para preenchimento automático de formulários com AI (Chrome Built-in AI / Gemini Nano), TensorFlow.js e geradores de dados brasileiros válidos.

**Stack**: TypeScript strict · Vite + @crxjs/vite-plugin · Zod v4 · TensorFlow.js · Chrome APIs

## Arquitetura

```
Popup/Options ──▶ Background (service-worker) ◀── Content Script
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
       Storage       Rules Engine   AI Modules
                                       │
                              ┌────────┴────────┐
                          Chrome AI        TensorFlow.js
```

- **Background**: Hub central de mensagens. Nunca acessa DOM de páginas.
- **Content Script**: Opera no DOM da página. Hot path — performance é prioridade.
- **Popup/Options**: UI da extensão. Pode rodar operações pesadas (ex: treinar modelo).

## Imports

- Preferir `@/*` sobre aliases granulares (`@lib/*`, `@form/*` etc.)
- Nunca `export default` — apenas named exports
- Barrel exports (`index.ts`) para módulos com muitos arquivos (`dataset/`, `generators/`)

```typescript
// ✅ Correto
import { generateCpf } from "@/lib/generators";
import type { FormField } from "@/types";

// ❌ Errado
import generateCpf from "@/lib/generators/cpf";
import { generateCpf } from "@generators/cpf";
```

## Naming

| Categoria | Padrão | Exemplos |
|-----------|--------|----------|
| Detectores/Classificadores | Objetos `const` (NÃO classes) | `htmlTypeDetector`, `tensorflowClassifier` |
| Funções | `verbNoun` | `detectBasicType()`, `buildSignals()`, `generateCpf()` |
| Storage | `get*`, `save*`, `delete*`, `*ForUrl` | `getRulesForUrl()`, `updateStorageAtomically()` |
| Tipos | `PascalCase` | `FieldType`, `FormField`, `ClassifierResult` |
| Constantes | `UPPER_SNAKE_CASE` | `STORAGE_KEYS`, `DEFAULT_PIPELINE` |
| Parsers | `parse*Payload()` | `parseRulePayload()`, `parseSaveFieldCachePayload()` |
| Logger | `createLogger("Namespace")` | `const log = createLogger("FormFiller")` |

## Error Handling

- **Nunca throw** em: storage, parsers, generators — retornar fallback ou `null`
- **Parsers Zod**: `safeParse()` → retornar `null` em falha, nunca re-throw
- **Async**: sempre `try-catch` + log contextual com `createLogger`

```typescript
// ✅ Parser
export function parseRulePayload(input: unknown): FieldRule | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

// ✅ Async com log
try {
  await loadModel();
} catch (err) {
  log.warn("Failed to load model:", err);
}
```

## Validação (Duas Camadas)

| Camada | Onde | Como |
|--------|------|------|
| Full Zod (`validators.ts`) | Background, options, caminhos críticos | Schema Zod + `safeParse()` |
| Light (`light-validators.ts`) | Content script (hot paths) | Apenas `typeof` checks |

- Zod v4: usar `z.uuid()` (NÃO `z.string().uuid()` — deprecated)

## Comunicação

- Background ↔ Content: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
- Storage: sempre `chrome.storage.local` (nunca `sync`)
- Operações atômicas: `updateStorageAtomically()` com updater puro `(current: T) => T`

## Pipeline & Classificadores

- Pipelines são **imutáveis** — `.with()`, `.without()`, `.withOrder()` retornam NOVA instância
- Classificadores implementam `FieldClassifier`: objeto com `.name` + `.detect()`
- Retornar `null` quando não tiver confiança — nunca forçar resultado
- `confidence` entre 0–1 (1 = certeza absoluta)

## Logger

Usar `createLogger` em todo módulo. Nunca `console.log` direto.

```typescript
import { createLogger } from "@/lib/logger";
const log = createLogger("MeuModulo");

log.debug("detalhe interno");
log.info("operação concluída");
log.warn("fallback ativado");
log.error("falha crítica", err);
```

## Geradores

- Funções puras e síncronas: `generate*() → string`
- Dados brasileiros devem ser válidos (CPF/CNPJ com dígitos verificadores)
- Novos geradores: criar arquivo, exportar `generate*`, registrar no `generatorMap` em `index.ts`

## Fluxo de Preenchimento (Prioridade)

1. Valor fixo (regra com `fixedValue`)
2. Formulário salvo (template)
3. Chrome AI (se habilitado e disponível)
4. TensorFlow.js (classifica campo → gerador)
5. Gerador padrão (tipo detectado por HTML/keyword)

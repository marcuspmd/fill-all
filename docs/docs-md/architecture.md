# Arquitetura — Fill All

## Visão Geral

Fill All segue a arquitetura padrão de extensões Chrome (Manifest V3), onde cada contexto de execução tem responsabilidades bem definidas e se comunica via **message passing**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Chrome Browser                             │
│                                                                     │
│  ┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐ │
│  │  Popup UI   │────▶│    Background     │◀────│  Content Script  │ │
│  │  (popup.ts) │     │  (Service Worker) │     │ (content-        │ │
│  └─────────────┘     └────────┬─────────┘     │  script.ts)      │ │
│                               │                └────────┬─────────┘ │
│  ┌─────────────┐    ┌────────┼─────────┐     ┌─────────┼────────┐ │
│  │  Options    │    │        │         │     │         │        │ │
│  │   Page      │    ▼        ▼         ▼     ▼         ▼        │ │
│  └─────────────┘  Storage  Rules     AI    Form      DOM       │ │
│                     │      Engine   Modules Detector  Watcher   │ │
│  ┌─────────────┐    │               │                          │ │
│  │  DevTools   │    │      ┌────────┴────────┐                 │ │
│  │   Panel     │    │      ▼                 ▼                 │ │
│  └─────────────┘    │  Chrome AI      TensorFlow.js            │ │
│                     │  (Gemini Nano)   (Classifier)            │ │
│                     │      │                 │                 │ │
│                     │      └──► Learning ◄───┘                 │ │
│                     │           Store                          │ │
│                     └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Contextos de Execução

### Background (Service Worker)

O **Service Worker** é o hub central da extensão. Ele **nunca acessa DOM** de páginas e é responsável por:

- **Roteamento de mensagens** — recebe mensagens de todos os contextos e despacha para handlers de domínio
- **Context menu** — setup e handling de itens no menu do botão direito
- **Atalhos de teclado** — `Alt+Shift+F` (Mac: `Cmd+Shift+F`)
- **Storage** — operações de leitura/escrita via handlers
- **Broadcast** — enviar mensagens para todas as tabs

**Padrão de handlers:**

```typescript
interface MessageHandler {
  supportedTypes: ReadonlyArray<MessageType>;
  handle(message: ExtensionMessage): Promise<unknown>;
}
```

Cada handler de domínio (rules, storage, cache, learning, dataset) é registrado no `handler-registry.ts` e processa mensagens de forma isolada.

### Content Script

Opera **dentro das páginas web** e é responsável por toda interação com o DOM:

- **Detecção de campos** via `form-detector` + adaptadores
- **Classificação** via pipeline de detectores (HTML → Keyword → TensorFlow → Chrome AI)
- **Preenchimento** de campos com disparo de eventos (`input`, `change`, `blur`)
- **DOM Watcher** — MutationObserver debounced (600ms) para detectar novos campos em SPAs
- **Floating Panel** — painel flutuante de controle in-page
- **Field Icons** — badges visuais nos campos com informações de classificação

> ⚡ **Performance é prioridade** no content script. Por isso, usa light-validators (typeof) em vez de Zod.

### Popup UI

Interface de controle rápido acessível pelo ícone da extensão:

- **Abas**: Actions (preencher/salvar) e Generators (gerar dados manualmente)
- Indicador de status do Chrome AI
- Gerenciamento rápido de formulários salvos
- Geradores de dados com parâmetros configuráveis

### Options Page

Configuração completa da extensão:

- **Settings** — configurações globais (AI, pipeline, comportamento)
- **Rules** — CRUD de regras por site (URL pattern + seletor CSS)
- **Forms** — gerenciamento de formulários salvos
- **Cache** — inspeção e limpeza de cache de detecção
- **Dataset** — editor de dataset de treinamento + treinamento de modelos

### DevTools Panel

Painel "Fill All" no Chrome DevTools para desenvolvedores:

- **Actions** — fill, watch, toggle panel
- **Fields** — inspeção em tempo real de campos detectados com scoring
- **Forms** — formulários salvos para a página atual
- **Log** — log detalhado de operações

## Comunicação entre Contextos

Toda comunicação é feita via **message passing** do Chrome:

```
Popup ──chrome.runtime.sendMessage──▶ Background
Background ──chrome.tabs.sendMessage──▶ Content Script
Content Script ──chrome.runtime.sendMessage──▶ Background
```

### Fluxo de uma ação típica

```
1. Popup: usuário clica "Preencher Tudo"
2. Popup → Background: sendMessage({ type: "FILL_ALL_FIELDS" })
3. Background → Content Script: tabs.sendMessage(tabId, { type: "FILL_ALL_FIELDS" })
4. Content Script: detecta campos, classifica, preenche
5. Content Script → Background: sendMessage({ type: "SAVE_FIELD_CACHE", payload })
6. Background: salva cache via handler
```

### Validação de Mensagens (Duas Camadas)

| Camada | Local | Método | Quando usar |
|--------|-------|--------|-------------|
| **Full Zod** | `messaging/validators.ts` | Schema Zod + `safeParse()` | Background, options, caminhos críticos |
| **Light** | `messaging/light-validators.ts` | Apenas `typeof` checks | Content script (hot paths de performance) |

## Storage

Toda persistência usa `chrome.storage.local` (nunca `sync`):

| Store | Descrição | Chave |
|-------|-----------|-------|
| **Rules** | Regras por site | `fill_all_rules` |
| **Forms** | Formulários salvos | `fill_all_saved_forms` |
| **Settings** | Configurações globais | `fill_all_settings` |
| **Ignored** | Campos ignorados | `fill_all_ignored_fields` |
| **Cache** | Cache de detecção | `fill_all_field_cache` |
| **Learned** | Aprendizado contínuo | `fill_all_learned_entries` |
| **Dataset** | Dataset de treino | `fill_all_dataset` |
| **Runtime Model** | Modelo TF.js treinado | `fill_all_runtime_model` |

### Operações Atômicas

Para evitar race conditions em escritas concorrentes:

```typescript
updateStorageAtomically<T>(key, defaultValue, updater: (current: T) => T): Promise<T>
```

Implementado via **fila sequencial por chave** — cada chave de storage tem sua própria queue de escritas.

## Pipeline de Detecção

O pipeline é o coração da classificação de campos. É **imutável** e **composável**:

```typescript
const pipeline = DEFAULT_PIPELINE
  .withOrder(["html-type", "keyword", "tensorflow"])
  .without("chrome-ai");

const result = await pipeline.runAsync(field);
```

### Classificadores (em ordem de prioridade)

| # | Nome | Tipo | Descrição |
|---|------|------|-----------|
| 1 | `html-type` | Síncrono | Mapeamento nativo HTML → FieldType (confidence 1.0) |
| 2 | `keyword` | Síncrono | Matching de keywords em português nos sinais |
| 3 | `tensorflow` | Síncrono | MLP TensorFlow.js (classificação soft) |
| 4 | `chrome-ai` | Assíncrono | Gemini Nano via Chrome Prompt API |
| 5 | `html-fallback` | Síncrono | Last-resort baseado em `input[type]` |

O pipeline para no **primeiro resultado com confidence suficiente** e retorna um `PipelineResult` com trace completo de decisão.

## Padrões de Design

### Detectors como Objetos (não classes)

```typescript
// ✅ Correto — objeto imutável
export const htmlTypeDetector: FieldClassifier = {
  name: "html-type",
  detect(field: FormField): ClassifierResult | null { /* ... */ }
};

// ❌ Errado — não usar classes
class HtmlTypeDetector implements FieldClassifier { /* ... */ }
```

### Geradores como Funções Puras

```typescript
// ✅ Correto — síncrono, sem side effects
export function generateCpf(formatted = true): string { /* ... */ }

// ❌ Errado — não usar async em geradores
async function generateCpf(): Promise<string> { /* ... */ }
```

### Pipelines Imutáveis

```typescript
// ✅ Correto — cada operação retorna nova instância
const custom = DEFAULT_PIPELINE.without("chrome-ai").with(myClassifier);

// ❌ Errado — nunca mutar pipeline existente
DEFAULT_PIPELINE.classifiers.push(myClassifier);
```

### Error Handling

```typescript
// ✅ Storage/Parsers — nunca throw, retornar fallback
export function parseRulePayload(input: unknown): FieldRule | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

// ✅ Async — sempre try-catch com log contextual
try {
  await loadModel();
} catch (err) {
  log.warn("Failed to load model:", err);
}
```

## Diagrama de Dependências

```
types/ ◀──────────────────── (todos os módulos)
  │
  ├── lib/shared/ ◀───────── lib/form/, lib/dataset/, lib/ai/
  │
  ├── lib/storage/ ◀──────── background/handlers/, lib/form/, lib/ai/
  │
  ├── lib/generators/ ◀───── lib/form/form-filler.ts
  │
  ├── lib/rules/ ◀────────── lib/form/form-filler.ts, background/handlers/
  │
  ├── lib/form/
  │   ├── detectors/ ◀────── form-detector.ts, form-filler.ts
  │   ├── extractors/ ◀───── detectors/, form-detector.ts
  │   └── adapters/ ◀─────── form-detector.ts
  │
  ├── lib/ai/ ◀───────────── lib/form/detectors/strategies/
  │
  ├── lib/dataset/ ◀──────── background/handlers/dataset-handler.ts
  │
  └── lib/messaging/ ◀────── background/, content/, popup/, options/
```

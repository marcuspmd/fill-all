# AGENTS.md — Fill All Chrome Extension

Extensão Chrome (Manifest V3) para preenchimento automático inteligente de formulários com Chrome Built-in AI (Gemini Nano), TensorFlow.js e geradores de dados brasileiros válidos.

---

## Build & Dev

```bash
npm install          # Instalar dependências
npm run dev          # Build com HMR (Vite + @crxjs/vite-plugin)
npm run build        # Build de produção → dist/
npm run type-check   # Verificação de tipos (tsc --noEmit)
npm run clean        # Limpa dist/
npm run train:model  # Treina modelo TensorFlow (tsx scripts/train-model.ts)
npm run import:rules # Importa regras exportadas para dataset
```

Carregar no Chrome: `chrome://extensions/` → Modo de desenvolvedor → Carregar sem compactação → selecionar `dist/`.

---

## Testes

```bash
npm test                  # Testes unitários (vitest run)
npm run test:watch        # Unitários em modo watch
npm run test:coverage     # Unitários + relatório de coverage HTML
npm run test:e2e          # Testes E2E com Playwright (abre Chrome real)
npm run test:e2e:ui       # Testes E2E com UI interativa do Playwright
npm run test:all          # Unitários → E2E em sequência
```

### Estrutura de Arquivos de Teste

```
src/
  lib/
    <modulo>/
      __tests__/
        <arquivo>.test.ts           # Teste unitário → roda com Vitest
        e2e/
          <arquivo>.test.e2e.ts     # Teste E2E → roda com Playwright
```

### Regras de Nomenclatura

| Tipo | Sufixo | Ferramenta | Exemplo |
|------|--------|-----------|---------|
| Unitário | `.test.ts` | Vitest | `cpf.test.ts` |
| E2E | `.test.e2e.ts` | Playwright | `form-fill.test.e2e.ts` |

### Coverage

- Coverage unitário: Vitest + V8 → `.coverage/unit/`
- Coverage E2E: Playwright CDP → `.coverage/e2e/` (um JSON por teste)
- Coverage combinado: merge Istanbul → `coverage/` (HTML + LCOV + text)
- Arquivos DOM-heavy excluídos do coverage unitário (cobertos pelos E2E):
  - `dom-watcher.ts`, `form-filler.ts`, `floating-panel.ts`, `field-icon.ts`

```bash
npm run test:coverage          # Unitários + coverage → .coverage/unit/
npm run test:e2e:coverage      # Build + E2E + coverage → .coverage/e2e/
npm run coverage:merge         # Merge ambos → coverage/index.html
npm run coverage:all           # Os 3 acima em sequência
```

#### Fixture de Coverage E2E

Testes E2E que queiram ter coverage rastreado devem importar de:

```typescript
import { test, expect } from "@/__tests__/e2e/fixtures";
```

O fixture `_coverage` é `auto: true` — roda automaticamente para cada teste que usar este `test`, sem chamada explícita. Coleta cobertura de scripts `chrome-extension://` via CDP e salva JSON Istanbul em `.coverage/e2e/`.

---

## Code Style & Conventions

- **TypeScript strict** — `strict: true`, target ES2022, sem `any` implícito
- **Named exports apenas** — nunca `export default`
- **Barrel exports** para módulos com muitos arquivos (`dataset/index.ts`, `generators/index.ts`)
- **Constantes** em UPPERCASE: `STORAGE_KEYS`, `DEFAULT_PIPELINE`, `KEYWORD_RULES`
- **Detectors/Classifiers** são objetos imutáveis com `.name` + `.detect()`, não classes
- **Pipelines** são imutáveis — transformações criam novas instâncias
- **Zod v4** para validação de schemas — usar `z.uuid()` (NÃO `z.string().uuid()`)
- **Path aliases**: preferir `@/*` sobre aliases granulares (`@lib/*`, `@form/*` etc.)
- **Logger**: sempre `createLogger("Namespace")`, nunca `console.log` direto

### Naming

| Categoria | Padrão | Exemplos |
|-----------|--------|----------|
| Objetos detector | `camelCase` + sufixo semântico | `htmlTypeDetector`, `keywordClassifier` |
| Funções | `verbNoun` | `detectBasicType()`, `buildSignals()`, `generateCpf()` |
| Storage | `get*`, `save*`, `delete*`, `*ForUrl` | `getRulesForUrl()`, `updateStorageAtomically()` |
| Tipos | `PascalCase` | `FieldType`, `FormField`, `ClassifierResult` |
| Constantes | `UPPER_SNAKE_CASE` | `STORAGE_KEYS`, `DEFAULT_PIPELINE` |
| Parsers | `parse*Payload()` | `parseRulePayload()`, `parseSaveFieldCachePayload()` |

### Error Handling

- **Nunca throw** em: storage, parsers, generators — retornar fallback ou `null`
- **Parsers Zod**: usar `safeParse()` → retornar `null` em falha, nunca re-throw
- **Async**: sempre `try-catch` + log contextual (`log.warn("Failed to fill field ${field.selector}:", err)`)

### Validation (Duas camadas)

- **Full Zod** (`messaging/validators.ts`) — Background, options, caminhos críticos
- **Light validators** (`messaging/light-validators.ts`) — Content script (hot paths), apenas `typeof` checks

---

## 🏗️ Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Popup UI   │────▶│    Background     │◀────│  Content Script  │
│  (popup.ts) │     │  (service-        │     │ (content-        │
└─────────────┘     │   worker.ts)      │     │  script.ts)      │
                    └────────┬──────────┘     └────────┬─────────┘
┌─────────────┐              │                         │
│  Options    │    ┌─────────┼─────────┐     ┌─────────┼─────────┐
│   Page      │    ▼         ▼         ▼     ▼         ▼         │
└─────────────┘  Storage   Rules    AI     Form      DOM         │
                   │       Engine  Modules  Detector  Watcher    │
┌─────────────┐    │                │                            │
│  DevTools   │    │       ┌────────┴────────┐                   │
│   Panel     │    │       ▼                 ▼                   │
└─────────────┘    │   Chrome AI      TensorFlow.js              │
                   │  (Gemini Nano)    (Classifier)              │
                   │       │                 │                   │
                   │       └──► Learning ◄───┘                   │
                   │            Store                            │
                   └─────────────────────────────────────────────┘
```

---

## 📦 Módulos

### 1. Background Service Worker (`src/background/`)

| Arquivo | Descrição |
|---------|-----------|
| `service-worker.ts` | Ponto central: context menu, atalhos, roteamento de mensagens |
| `handler-registry.ts` | Dispatcher para handlers de domínio (padrão `MessageHandler`) |
| `context-menu.ts` | Setup e handlers do menu de contexto |
| `broadcast.ts` | Broadcast de mensagens para todas as tabs |

#### Handlers (`src/background/handlers/`)

| Handler | Mensagens | Descrição |
|---------|----------|-----------|
| `rules-handler.ts` | `GET_RULES`, `SAVE_RULE`, `DELETE_RULE`, `GET_RULES_FOR_URL` | CRUD de regras |
| `storage-handler.ts` | Storage CRUD genérico | Forms, settings, ignored fields |
| `cache-handler.ts` | Cache CRUD | Cache de detecção de campos |
| `learning-handler.ts` | `GET_LEARNED_ENTRIES`, `CLEAR_LEARNED_ENTRIES`, `RETRAIN_LEARNING_DATABASE` | Learning store + retrain |
| `dataset-handler.ts` | `GET_DATASET`, `ADD_DATASET_ENTRY`, `IMPORT_DATASET`, `SEED_DATASET`, etc. | Dataset CRUD + modelo runtime |

### 2. Content Script (`src/content/content-script.ts`)
- Opera dentro das páginas web
- Detecta campos, preenche formulários, salva dados
- Gerencia DOM watcher, floating panel, field icons
- Recebe mensagens: `FILL_ALL_FIELDS`, `SAVE_FORM`, `DETECT_FIELDS`, `TOGGLE_PANEL`, etc.

### 3. Popup UI (`src/popup/`)
- Interface de controle rápido (abas: actions, generators)
- Módulos: `popup-actions.ts`, `popup-generators.ts`, `popup-chrome-ai.ts`, `popup-detect.ts`, `popup-forms.ts`, `popup-ignored.ts`, `popup-messaging.ts`

### 4. Options Page (`src/options/`)
- Configuração completa (abas: settings, rules, forms, cache, dataset)
- Módulos: `settings-section.ts`, `rules-section.ts`, `forms-section.ts`, `cache-section.ts`, `dataset-section.ts`

### 5. DevTools Panel (`src/devtools/`)
- Painel "Fill All" no Chrome DevTools
- Abas: actions, fields (inspeção real-time), forms, log
- Módulos: `devtools.ts`, `panel.ts`

---

## 🔧 Bibliotecas (src/lib/)

### AI (`src/lib/ai/`)

| Arquivo | Descrição |
|---------|-----------|
| `chrome-ai.ts` | Integração Chrome Built-in AI (Gemini Nano): `isAvailable()`, `generateFieldValue()` |
| `learning-store.ts` | Store de aprendizado contínuo (max 500 entries, dedup, FIFO) |
| `runtime-trainer.ts` | Treinador TF.js in-browser: MLP 256→128→N, 80 epochs, early stopping |
| `tensorflow-generator.ts` | Re-exports de classificação + `generateWithTensorFlow()` |

### Form (`src/lib/form/`)

| Arquivo | Descrição |
|---------|-----------|
| `form-detector.ts` | Entry point: `detectAllFields()`, `detectAllFieldsAsync()` |
| `form-filler.ts` | Orquestrador: `fillAllFields()`, `captureFormValues()`, `applyTemplate()` |
| `dom-watcher.ts` | MutationObserver debounced (600ms) com auto-refill |
| `floating-panel.ts` | Painel flutuante in-page (abas, resize, minimize) |
| `field-icon.ts` | Ícones/badges em campos com detalhes de classificação |
| `field-overlay.ts` | Overlays visuais em campos |
| `field-icon-rule.ts` | Popup de regra para configurar campo |
| `field-icon-styles.ts` | Estilos CSS dos ícones |
| `field-icon-utils.ts` | Utilitários para ícones |

#### Detectors (`src/lib/form/detectors/`)

| Arquivo | Descrição |
|---------|-----------|
| `pipeline.ts` | `DetectionPipeline` imutável e composável |
| `detector.interface.ts` | `Detector<TInput, TResult>`, `FieldClassifier`, `PageDetector` |
| `classifiers.ts` | Registry: `ALL_CLASSIFIERS`, `DEFAULT_PIPELINE`, `buildClassifiersFromSettings()` |
| `html-type-detector.ts` | Mapeamento nativo HTML → FieldType (confidence 1.0) |
| `strategies/` | Implementações concretas: `keywordClassifier`, `tensorflowClassifier`, `chromeAiClassifier`, custom-select, interactive-field |

#### Extractors (`src/lib/form/extractors/`)

| Arquivo | Descrição |
|---------|-----------|
| `label-extractor.ts` | 9 estratégias para encontrar labels (aria, parent, sibling, fieldset, etc.) |
| `selector-extractor.ts` | Gera seletores CSS únicos e estáveis |
| `signals-extractor.ts` | Constrói texto de sinais normalizados |
| `field-processing-chain.ts` | Chain-of-responsibility para features estruturadas |

#### Adapters (`src/lib/form/adapters/`)
Suporte a componentes UI custom: Select2, Ant Design (AutoComplete, Cascader, Checkbox, Datepicker, Input, Radio, Rate, Select, Slider, Switch, Transfer, TreeSelect)

### Generators (`src/lib/generators/`)

| Arquivo | Dados Gerados |
|---------|---------------|
| `cpf.ts` | CPFs válidos (com dígitos verificadores) |
| `cnpj.ts` | CNPJs válidos (com dígitos verificadores) |
| `rg.ts` | RG, CNH, PIS, Passaporte |
| `email.ts` | E-mails aleatórios realistas |
| `phone.ts` | Telefones brasileiros com DDD |
| `name.ts` | Nomes completos, empresas |
| `address.ts` | Endereços, CEPs, cidades, estados |
| `date.ts` | Datas, datas de nascimento, datas futuras |
| `finance.ts` | Cartão de crédito, PIX, valores monetários |
| `misc.ts` | Senhas, usernames, OTP, textos |
| `adaptive.ts` | Geração com constraints (min/max, pattern) |
| `index.ts` | Registry central: `generate(type, params)` |

### Dataset (`src/lib/dataset/`)

| Arquivo | Descrição |
|---------|-----------|
| `training-data.ts` | Amostras builtin para treino (signals + type + difficulty) |
| `validation-data.ts` | Set de validação + `evaluateClassifier()` |
| `test-data.ts` | Set de teste final + `runTestEvaluation()` |
| `runtime-dataset.ts` | Entries curadas pelo usuário (CRUD em chrome.storage) |
| `dataset-config.ts` | Config: normalização, augmentation, health check |
| `field-dictionary.ts` | Dicionário canônico de field types com keywords |
| `integration.ts` | Bridge dataset ↔ classifier: `syncLearnedToDataset()`, accuracy reports |

### Storage (`src/lib/storage/`)

| Módulo | Exports Principais |
|--------|-------------------|
| Core | `getFromStorage()`, `setToStorage()`, `updateStorageAtomically()` |
| Rules | `getRules()`, `saveRule()`, `deleteRule()`, `getRulesForUrl()` |
| Forms | `getSavedForms()`, `saveForm()`, `getSavedFormsForUrl()` |
| Settings | `getSettings()`, `saveSettings()` |
| Ignored | `getIgnoredFields()`, `addIgnoredField()`, `removeIgnoredField()` |
| Cache | `getFieldDetectionCache()`, `saveFieldDetectionCacheForUrl()`, `clearFieldDetectionCache()` |

### Outros Módulos

| Módulo | Caminho | Descrição |
|--------|---------|-----------|
| Rules Engine | `src/lib/rules/rule-engine.ts` | Resolução de regras por URL pattern e seletor CSS |
| Messaging | `src/lib/messaging/` | Validadores Zod (full) e light (typeof) para mensagens |
| Logger | `src/lib/logger/` | `createLogger("Namespace")` com buffer, config via Storage |
| URL | `src/lib/url/match-url-pattern.ts` | URL glob matching (sem ReDoS) |
| UI | `src/lib/ui/` | Rendering helpers: badges, tables, cores, `escapeHtml()` |
| Chrome | `src/lib/chrome/active-tab-messaging.ts` | `sendToActiveTab()`, `sendToTabWithInjection()` |
| Shared | `src/lib/shared/` | `buildFeatureText()`, `ngram.ts`, `field-type-catalog.ts` |

---

## 🔑 Tipos (`src/types/`)

| Arquivo | Descrição |
|---------|-----------|
| `index.ts` | `FieldType` (80+ tipos), `FormField`, `FieldRule`, `SavedForm`, `Settings`, `ExtensionMessage`, `DetectionMethod` |
| `interfaces.ts` | `MessageHandler`, `StorageRepository`, `UIModule`, `FieldIconComponent` |
| `field-type-definitions.ts` | `FIELD_TYPE_DEFINITIONS`: metadata, generators, params por tipo |
| `chrome-ai.d.ts` | Declarações para Chrome AI API |
| `global.d.ts` | Augmentação de `Window` para Chrome AI |
| `css.d.ts` | Declarações de módulos CSS |

---

## 🔄 Fluxo de Preenchimento (Prioridade)

1. Usuário aciona (popup, atalho `Alt+Shift+F`, ou menu de contexto)
2. Background envia mensagem para content script
3. Content script detecta campos (`form-detector` + adapters + extractors)
4. Para cada campo, hierarquia de resolução:
   1. **Campo ignorado** → Skip
   2. **fixedValue** (regra com valor fixo) → Usa o valor
   3. **Formulário salvo** → Usa template
   4. **Chrome AI** (se habilitado e disponível) → Gera via Gemini Nano
   5. **TensorFlow.js** → Classifica + gera valor
   6. **Gerador padrão** → Gerador aleatório por tipo detectado
5. Campos preenchidos + eventos `input`/`change`/`blur` disparados
6. Predições salvas no learning store (aprendizado contínuo)

---

## 📋 Convenções

- **Linguagem**: TypeScript strict (ES2022)
- **Bundler**: Vite 7.3 + @crxjs/vite-plugin
- **Manifest**: V3 (minimum Chrome 128)
- **Storage**: `chrome.storage.local` (nunca `sync`)
- **Comunicação**: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
- **Operações atômicas**: `updateStorageAtomically()` com updater puro `(current: T) => T`
- **Pipeline**: Imutável — `.with()`, `.without()`, `.withOrder()` retornam NOVA instância
- **Classificadores**: Objetos com `.name` + `.detect()`, retornar `null` sem confiança
- **Geradores**: Funções puras e síncronas `generate*() → string`

# Módulos — Fill All

Referência completa de todos os módulos da extensão, com exports principais, responsabilidades e detalhes de implementação.

---

## Sumário

- [Background Service Worker](#background-service-worker)
- [Content Script](#content-script)
- [Popup UI](#popup-ui)
- [Options Page](#options-page)
- [DevTools Panel](#devtools-panel)
- [Storage](#storage)
- [Form Detection](#form-detection)
- [Extractors](#extractors)
- [Adapters](#adapters)
- [AI](#ai)
- [Generators](#generators)
- [Dataset](#dataset)
- [Rules Engine](#rules-engine)
- [Messaging](#messaging)
- [Logger](#logger)
- [Shared](#shared)
- [UI Renderers](#ui-renderers)
- [URL Matching](#url-matching)
- [Chrome Helpers](#chrome-helpers)
- [Types](#types)

---

## Background Service Worker

**Caminho**: `src/background/`

Hub central da extensão — roteamento de mensagens, context menu e atalhos.

| Arquivo | Descrição |
|---------|-----------|
| `service-worker.ts` | Ponto de entrada: registra handlers, context menu, atalhos de teclado |
| `handler-registry.ts` | Dispatcher que mapeia `MessageType` → `MessageHandler` especializado |
| `context-menu.ts` | Setup de itens no menu de contexto do Chrome |
| `broadcast.ts` | `broadcastToAllTabs()` — envia mensagens para todas as tabs abertas |

### Handlers (`src/background/handlers/`)

| Handler | Mensagens | Responsabilidade |
|---------|-----------|-----------------|
| `rules-handler.ts` | `GET_RULES`, `SAVE_RULE`, `DELETE_RULE`, `GET_RULES_FOR_URL` | CRUD de regras de preenchimento |
| `storage-handler.ts` | Forms, settings, ignored fields | Storage CRUD genérico para múltiplas entidades |
| `cache-handler.ts` | Cache CRUD | Cache de detecção de campos por URL |
| `learning-handler.ts` | `GET_LEARNED_ENTRIES`, `CLEAR_LEARNED_ENTRIES`, `RETRAIN_LEARNING_DATABASE` | Learning store + retrain do modelo |
| `dataset-handler.ts` | `GET_DATASET`, `ADD_DATASET_ENTRY`, `IMPORT_DATASET`, `SEED_DATASET` | Dataset CRUD + treinamento runtime |

---

## Content Script

**Caminho**: `src/content/content-script.ts`

Opera **dentro das páginas web** — toda interação com DOM acontece aqui.

**Responsabilidades:**
- Detecta campos de formulário (incluindo componentes custom via adapters)
- Classifica campos via pipeline de detectores
- Preenche campos com disparo de eventos nativos (`input`, `change`, `blur`)
- Gerencia DOM watcher para detectar novos campos em SPAs
- Renderiza floating panel e field icons
- Responde a mensagens: `FILL_ALL_FIELDS`, `SAVE_FORM`, `DETECT_FIELDS`, `TOGGLE_PANEL`

> Performance é prioridade — usa light-validators em vez de Zod.

---

## Popup UI

**Caminho**: `src/popup/`

Interface de controle rápido via ícone da extensão.

| Módulo | Responsabilidade |
|--------|-----------------|
| `popup-actions.ts` | Ações principais (preencher, salvar, detectar) |
| `popup-generators.ts` | Geradores de dados individuais |
| `popup-chrome-ai.ts` | Status e controle do Chrome AI |
| `popup-detect.ts` | Detecção de campos na aba ativa |
| `popup-forms.ts` | Gerenciamento de formulários salvos |
| `popup-ignored.ts` | Campos ignorados |
| `popup-messaging.ts` | Bridge de mensagens popup ↔ background |

---

## Options Page

**Caminho**: `src/options/`

Configuração completa com abas especializadas.

| Módulo | Aba | Funcionalidade |
|--------|-----|---------------|
| `settings-section.ts` | Settings | Configurações globais (AI, pipeline, comportamento) |
| `rules-section.ts` | Rules | CRUD visual de regras por site |
| `forms-section.ts` | Forms | Gerenciamento de formulários salvos |
| `cache-section.ts` | Cache | Inspeção e limpeza de cache de detecção |
| `dataset-section.ts` | Dataset | Editor de dataset + treinamento de modelos |

---

## DevTools Panel

**Caminho**: `src/devtools/`

Painel "Fill All" integrado ao Chrome DevTools.

| Módulo | Descrição |
|--------|-----------|
| `devtools.ts` | Registra o painel no DevTools |
| `panel.ts` | Interface com abas: actions, fields (inspeção real-time), forms, log |

---

## Storage

**Caminho**: `src/lib/storage/`

Wrapper tipado sobre `chrome.storage.local` com operações atômicas.

| Arquivo | Exports Principais | Descrição |
|---------|-------------------|-----------|
| `core.ts` | `STORAGE_KEYS`, `getFromStorage()`, `setToStorage()`, `updateStorageAtomically()` | Core com fila de escrita por chave (writeQueues) e timeout de 30s |
| `rules-storage.ts` | `getRules()`, `saveRule()`, `deleteRule()`, `getRulesForUrl()` | CRUD de regras com upsert por ID e filtragem por URL + prioridade |
| `forms-storage.ts` | `getSavedForms()`, `saveForm()`, `deleteForm()`, `getSavedFormsForUrl()` | CRUD de formulários salvos com filtragem por URL pattern |
| `settings-storage.ts` | `getSettings()`, `saveSettings()` | Settings com merge parcial via `Partial<Settings>` |
| `ignored-storage.ts` | `getIgnoredFields()`, `addIgnoredField()`, `removeIgnoredField()` | Campos ignorados com dedup por `urlPattern + selector` |
| `cache-storage.ts` | `getFieldDetectionCache()`, `saveFieldDetectionCacheForUrl()`, `clearFieldDetectionCache()` | Cache LRU com lookup por URL exata ou origin+path (max 100 entries) |
| `storage.ts` | (barrel) | Re-exports de compatibilidade |

### Operações Atômicas

```typescript
// Fila sequencial por chave — evita race conditions
updateStorageAtomically<T>(key, defaultValue, updater: (current: T) => T): Promise<T>
```

Cada chave tem sua própria queue de escritas. O updater é uma **função pura**.

---

## Form Detection

**Caminho**: `src/lib/form/`

### Core

| Arquivo | Exports | Descrição |
|---------|---------|-----------|
| `form-detector.ts` | `detectAllFields()`, `detectAllFieldsAsync()` | Entry point — coordena extractors e adapters |
| `form-filler.ts` | `fillAllFields()`, `captureFormValues()`, `applyTemplate()` | Orquestrador de preenchimento |
| `dom-watcher.ts` | `startDomWatcher()`, `stopDomWatcher()` | MutationObserver debounced (600ms) com auto-refill |
| `floating-panel.ts` | `createFloatingPanel()`, `destroyFloatingPanel()` | Painel flutuante in-page com abas, resize e minimize |
| `field-icon.ts` | `showFieldIcons()`, `hideFieldIcons()` | Badges visuais em campos com info de classificação |
| `field-overlay.ts` | `showFieldOverlay()`, `hideFieldOverlay()` | Overlays temporários em campos |
| `field-icon-rule.ts` | `showFieldRulePopup()` | Popup para configurar regra diretamente no campo |

### Pipeline (`src/lib/form/detectors/`)

| Arquivo | Exports | Descrição |
|---------|---------|-----------|
| `pipeline.ts` | `DetectionPipeline` | Pipeline imutável e composável de classificadores |
| `detector.interface.ts` | `Detector<T,R>`, `FieldClassifier`, `PageDetector` | Interfaces genéricas de detecção |
| `classifiers.ts` | `ALL_CLASSIFIERS`, `DEFAULT_PIPELINE`, `buildClassifiersFromSettings()` | Registry central + factory |

### Classificadores (`src/lib/form/detectors/strategies/`)

| Classificador | Tipo | Confidence | Descrição |
|---------------|------|------------|-----------|
| `htmlTypeClassifier` | Síncrono | 1.0 | Mapeamento nativo HTML → FieldType |
| `keywordClassifier` | Síncrono | 1.0 | Keywords pt-BR nos sinais do campo |
| `tensorflowClassifier` | Síncrono | 0.2+ | MLP TensorFlow.js com softmax |
| `chromeAiClassifier` | Assíncrono | 0.6+ | Gemini Nano via Chrome Prompt API |
| `htmlFallbackClassifier` | Síncrono | 0.1 | Last-resort por `input[type]` |

**Thresholds:**
- TensorFlow softmax mínimo: **0.2**
- TensorFlow learned cosine similarity: **0.5**
- Chrome AI confidence mínima: **0.6**
- HTML fallback: **0.1** (sempre retorna resultado)

---

## Extractors

**Caminho**: `src/lib/form/extractors/`

Extraem informações de campos para alimentar classificadores.

| Arquivo | Exports | Descrição |
|---------|---------|-----------|
| `label-extractor.ts` | `findLabel()`, `findLabelWithStrategy()` | 10 estratégias hierárquicas para encontrar labels |
| `selector-extractor.ts` | `getUniqueSelector()` | Gera seletores CSS únicos e estáveis |
| `signals-extractor.ts` | `buildSignals()` | Compõe texto de sinais normalizados para classificação |
| `field-processing-chain.ts` | `processField()` | Chain-of-responsibility para features estruturadas |

### Estratégias de Label (em ordem de prioridade)

| # | Estratégia | Método |
|---|-----------|--------|
| 1 | `labelForStrategy` | `<label for="id">` — associação explícita |
| 2 | `parentLabelStrategy` | Campo dentro de `<label>` |
| 3 | `ariaLabelStrategy` | Atributo `aria-label` |
| 4 | `ariaLabelledByStrategy` | Referência `aria-labelledby` |
| 5 | `prevLabelStrategy` | Sibling anterior é `<label>` |
| 6 | `titleStrategy` | Atributo HTML `title` |
| 7 | `fieldsetLegendStrategy` | `<fieldset>` / `<legend>` mais próximo |
| 8 | `formGroupLabelStrategy` | `.form-group` / label de framework CSS |
| 9 | `prevSiblingTextStrategy` | Nó de texto curto adjacente |
| 10 | `placeholderStrategy` | `placeholder` do input (último recurso) |

---

## Adapters

**Caminho**: `src/lib/form/adapters/`

Suporte a componentes UI custom que não são inputs HTML nativos.

**Interface**: `CustomComponentAdapter` com `name`, `selector`, `matches()`, `buildField()`, `fill()`

| Adapter | Componente |
|---------|------------|
| `select2Adapter` | Select2 v4.x |
| `antdAutoCompleteAdapter` | Ant Design AutoComplete |
| `antdCascaderAdapter` | Ant Design Cascader |
| `antdCheckboxAdapter` | Ant Design Checkbox |
| `antdDatepickerAdapter` | Ant Design DatePicker |
| `antdInputAdapter` | Ant Design Input |
| `antdRadioAdapter` | Ant Design Radio |
| `antdRateAdapter` | Ant Design Rate |
| `antdSelectAdapter` | Ant Design Select |
| `antdSliderAdapter` | Ant Design Slider |
| `antdSwitchAdapter` | Ant Design Switch |
| `antdTransferAdapter` | Ant Design Transfer |
| `antdTreeSelectAdapter` | Ant Design TreeSelect |

**Ordem de resolução**: Select2 primeiro → Ant Design específicos → Ant Design genéricos (primeiro match vence).

---

## AI

**Caminho**: `src/lib/ai/`

| Arquivo | Exports | Descrição |
|---------|---------|-----------|
| `chrome-ai.ts` | `isAvailable()`, `generateFieldValue()` | Chrome Built-in AI (Gemini Nano, Chrome 131+) |
| `learning-store.ts` | `storeLearnedEntry()`, `getLearnedEntries()`, `retrainLearnedFromRules()` | Store de aprendizado contínuo (max 500, FIFO, dedup por signals) |
| `runtime-trainer.ts` | `trainModelFromDataset()`, `loadRuntimeModel()`, `hasRuntimeModel()` | Treinador TF.js in-browser |
| `tensorflow-generator.ts` | `generateWithTensorFlow()` | Bridge classificação → geração |

### Modelo TensorFlow.js

**Arquitetura MLP:**
```
Input (trigram vectors)
  → Dense(256, relu, L2=1e-4) → Dropout(0.3)
  → Dense(128, relu, L2=1e-4) → Dropout(0.2)
  → Dense(NUM_CLASSES, softmax)
```

**Hiperparâmetros:** Adam (lr=0.001), batch 32, max 80 epochs, early stopping (patience 20).

**Persistência:** Modelo serializado como topology + weights Base64 no `chrome.storage.local`.

### Learning Store

- **Max entries**: 500 (FIFO)
- **Dedup** por signals normalizados
- **Sources**: `"auto"` (orgânico) ou `"rule"` (importado)
- `retrainLearnedFromRules()` reconstrói entries a partir de regras existentes

---

## Generators

**Caminho**: `src/lib/generators/`

Funções **puras e síncronas** que geram dados brasileiros válidos.

| Arquivo | Função | Dados |
|---------|--------|-------|
| `cpf.ts` | `generateCpf()` | CPFs válidos com dígitos verificadores |
| `cnpj.ts` | `generateCnpj()` | CNPJs válidos com dígitos verificadores |
| `rg.ts` | `generateRg()`, `generateCnh()`, `generatePis()`, `generatePassport()` | Documentos de identidade |
| `email.ts` | `generateEmail()` | E-mails realistas |
| `phone.ts` | `generatePhone()`, `generateCellPhone()` | Telefones brasileiros com DDD |
| `name.ts` | `generateFullName()`, `generateFirstName()`, `generateCompanyName()` | Nomes e empresas |
| `address.ts` | `generateAddress()`, `generateCep()`, `generateCity()`, `generateState()` | Endereços completos |
| `date.ts` | `generateDate()`, `generateBirthDate()`, `generateFutureDate()` | Datas em formatos BR |
| `finance.ts` | `generateCreditCard()`, `generatePixKey()`, `generateMonetaryValue()` | Dados financeiros |
| `misc.ts` | `generatePassword()`, `generateUsername()`, `generateOtp()`, `generateText()` | Dados genéricos |
| `adaptive.ts` | `generateAdaptive()` | Geração com constraints (min/max, pattern regex) |
| `index.ts` | `generate(type, params)` | Registry central `FieldType → GeneratorFn` |

> Para mais detalhes sobre como criar novos geradores, veja [docs/generators.md](./generators.md).

---

## Dataset

**Caminho**: `src/lib/dataset/`

Dados de treinamento e avaliação do modelo TensorFlow.js.

| Arquivo | Descrição |
|---------|-----------|
| `training-data.ts` | Amostras builtin (signals + type + difficulty) |
| `validation-data.ts` | Set de validação + `evaluateClassifier()` |
| `test-data.ts` | Set de teste final + `runTestEvaluation()` |
| `runtime-dataset.ts` | Entries curadas pelo usuário (CRUD via chrome.storage) |
| `user-samples.ts` | Array para samples importadas via `npm run import:rules` |
| `dataset-config.ts` | Config: normalização, augmentation, health check |
| `field-dictionary.ts` | Dicionário canônico de field types com keywords |
| `integration.ts` | Bridge dataset ↔ classifier: `syncLearnedToDataset()`, accuracy reports |

### Thresholds de Accuracy

| Métrica | Valor |
|---------|-------|
| Global mínimo | 85% |
| Por tipo mínimo | 70% |
| Max taxa de "unknown" | 15% |

### Data Augmentation

| Função | Descrição |
|--------|-----------|
| `augmentShuffle()` | Embaralha ordem das palavras |
| `augmentDrop()` | Remove palavras aleatórias (20%) |
| `augmentTypo()` | Simula typos (swap de caracteres adjacentes) |

### Health Check

`checkDatasetHealth()` detecta:
- Tipos sub-representados (< 3 amostras)
- Tipos ausentes em relação ao enum `FieldType`
- Data leakage entre splits (train/validation/test)

---

## Rules Engine

**Caminho**: `src/lib/rules/rule-engine.ts`

Motor de resolução de regras por URL pattern e seletor CSS.

**Hierarquia de resolução:**
1. Campo ignorado → Skip
2. `fixedValue` na regra → Valor direto
3. Formulário salvo → Template
4. Chrome AI → Geração via Gemini Nano
5. TensorFlow.js → Classificação + gerador
6. Gerador padrão → Por tipo detectado

---

## Messaging

**Caminho**: `src/lib/messaging/`

| Arquivo | Camada | Onde usar | Método |
|---------|--------|-----------|--------|
| `validators.ts` | Full Zod | Background, options | Schema Zod + `safeParse()` |
| `light-validators.ts` | Light | Content script | Apenas `typeof` checks |

Parsers seguem padrão `parse*Payload()` e retornam `T | null` (nunca throw).

---

## Logger

**Caminho**: `src/lib/logger/`

| Export | Descrição |
|--------|-----------|
| `createLogger(namespace)` | Cria logger com namespace (ex: `createLogger("FormFiller")`) |
| `initLogger()` | Inicializa config via chrome.storage + listener de mudanças |

**Características:**
- Buffer de logs antes da inicialização
- Reconfiguração em tempo real via `chrome.storage.onChanged`
- Níveis: `debug`, `info`, `warn`, `error`
- Nunca usar `console.log` direto

---

## Shared

**Caminho**: `src/lib/shared/`

| Arquivo | Exports | Descrição |
|---------|---------|-----------|
| `ngram.ts` | `charNgrams()`, `vectorize()`, `dotProduct()` | Trigrams + vetorização TF L2-normalizada |
| `structured-signals.ts` | `buildFeatureText()`, `structuredSignalsFromField()` | Sinais em 3 tiers (primary 3x, secondary 2x, structural 1x) com tokens de metadata |
| `field-type-catalog.ts` | `getFieldTypeLabel()`, `getFieldTypeOptions()` | Labels pt-BR para FieldTypes |

### Sinais Estruturados

Os sinais são organizados em tiers com pesos diferentes:

| Tier | Peso | Fontes |
|------|------|--------|
| Primary | 3x | label, name, id, placeholder |
| Secondary | 2x | autocomplete |
| Structural | 1x | inputType, required, pattern |

Tokens de metadata adicionados: `__cat_*`, `__lang_*`, `__input_*`, `__has_pattern`, `__maxlen_*`.

---

## UI Renderers

**Caminho**: `src/lib/ui/`

Renderizadores de HTML compartilhados entre popup, options, devtools e floating panel.

| Export | Descrição |
|--------|-----------|
| `renderTypeBadge(type)` | Badge colorido por field type |
| `renderMethodBadge(method)` | Badge por método de detecção |
| `renderConfidenceBadge(value)` | Barra visual + percentual (verde ≥80%, amarelo ≥50%, vermelho) |
| `renderFieldsTableHeader()` | Header de tabela de campos |
| `renderFieldRow(field)` | Linha da tabela de campos |
| `renderFormCard(form)` | Card de formulário salvo |
| `renderLogEntry(entry)` | Entrada de log formatada |
| `escapeHtml(str)` | Sanitização de HTML |
| `TYPE_COLORS` | Mapa de cores para ~30 field types |
| `METHOD_COLORS` | Cores por método de detecção |

---

## URL Matching

**Caminho**: `src/lib/url/match-url-pattern.ts`

| Export | Descrição |
|--------|-----------|
| `matchUrlPattern(url, pattern)` | Glob matching com wildcard `*` |

**Seguro contra ReDoS** — usa segment-based matching em vez de regex dinâmica. Case-insensitive.

---

## Chrome Helpers

**Caminho**: `src/lib/chrome/active-tab-messaging.ts`

| Export | Descrição |
|--------|-----------|
| `sendToActiveTab(message)` | Envia mensagem para a tab ativa |
| `sendToTabWithInjection(tabId, message)` | Envia com injeção do content script se necessário |

---

## Types

**Caminho**: `src/types/`

| Arquivo | Exports Principais |
|---------|-------------------|
| `index.ts` | `FieldType` (80+ tipos), `FormField`, `FieldRule`, `SavedForm`, `Settings`, `ExtensionMessage`, `DetectionMethod` |
| `interfaces.ts` | `MessageHandler`, `StorageRepository`, `UIModule`, `FieldIconComponent` |
| `field-type-definitions.ts` | `FIELD_TYPE_DEFINITIONS` — metadata, generators e params por tipo |
| `chrome-ai.d.ts` | Declarações da Chrome AI API |
| `global.d.ts` | Augmentação de `Window` para Chrome AI |
| `css.d.ts` | Declarações de módulos CSS |

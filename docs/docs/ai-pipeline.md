# Pipeline de AI — Fill All

Documentação do sistema de inteligência artificial para classificação e preenchimento de campos.

---

## Visão Geral

O Fill All usa **dois motores de AI** complementares para classificar campos de formulário:

| Motor | Tecnologia | Contexto | Quando Usa |
|-------|-----------|----------|------------|
| **TensorFlow.js** | MLP (Multi-Layer Perceptron) | Offline, rápido | Sempre disponível |
| **Chrome AI** | Gemini Nano (Prompt API) | LLM on-device | Chrome 131+, se habilitado |

Ambos alimentam a **pipeline de detecção**, que decide o tipo de cada campo e qual gerador usar.

---

## Pipeline de Detecção

A pipeline é **imutável** — transformações criam novas instâncias via `.with()`, `.without()`, `.withOrder()`.

### Ordem Padrão

```
Campo HTML
  │
  ├─ 1. htmlTypeClassifier    (confidence: 1.0)   ← Mapeamento nativo HTML
  ├─ 2. keywordClassifier     (confidence: 1.0)   ← Keywords pt-BR nos sinais
  ├─ 3. tensorflowClassifier  (confidence: 0.2+)  ← MLP TensorFlow.js
  ├─ 4. chromeAiClassifier    (confidence: 0.6+)  ← Gemini Nano
  └─ 5. htmlFallbackClassifier(confidence: 0.1)   ← Último recurso
```

A pipeline para no **primeiro classificador com confiança acima do threshold**. Se nenhum atingir, usa o fallback.

### Thresholds de Confiança

| Classificador | Threshold Mínimo | Observação |
|---------------|-----------------|------------|
| HTML Type | 1.0 | Certeza absoluta por tipo nativo |
| Keyword | 1.0 | Match exato de keywords |
| TensorFlow (softmax) | 0.2 | Top-1 do softmax |
| TensorFlow (learned) | 0.5 | Cosine similarity com entries aprendidas |
| Chrome AI | 0.6 | Confiança da resposta do LLM |
| HTML Fallback | 0.1 | Sempre retorna resultado |

### Customização

```typescript
// Reordenar classificadores
const pipeline = DEFAULT_PIPELINE.withOrder(["html-type", "tensorflow"]);

// Remover classificadores
const noAi = DEFAULT_PIPELINE.without("chrome-ai");

// Adicionar classificador custom
const custom = DEFAULT_PIPELINE.with(meuClassifier);

// Inserir antes de outro
const injected = DEFAULT_PIPELINE.insertBefore("tensorflow", meuClassifier);
```

---

## TensorFlow.js — MLP Classifier

### Arquitetura do Modelo

```
Input (trigram vectors, dimensão = vocab_size)
  │
  ├─ Dense(256, relu, L2 regularization 1e-4)
  ├─ Dropout(0.3)
  │
  ├─ Dense(128, relu, L2 regularization 1e-4)
  ├─ Dropout(0.2)
  │
  └─ Dense(NUM_CLASSES, softmax)
       │
       └─ Probabilidades por FieldType
```

### Feature Engineering

1. **Sinais extraídos** do campo: label, name, id, placeholder, autocomplete, type
2. **Sinais estruturados** em 3 tiers com pesos:
   - Primary (3x): label, name, id, placeholder
   - Secondary (2x): autocomplete
   - Structural (1x): inputType, required, pattern
3. **Tokens de metadata**: `__cat_personal`, `__lang_pt`, `__input_text`, `__has_pattern`
4. **Trigrams** extraídos do texto normalizado
5. **Vetorização TF** L2-normalizada

### Dois Modelos

| Modelo | Origem | Armazenamento | Quando Carrega |
|--------|--------|---------------|----------------|
| **Bundled** | Script offline (`npm run train:model`) | `public/model/` | Sempre |
| **Runtime** | Treinado in-browser | `chrome.storage.local` | Se existir, tem prioridade |

### Treinamento Offline

```bash
npm run train:model
```

Usa `scripts/train-model.ts` com dataset de `src/lib/dataset/training-data.ts`. Gera:
- `public/model/model.json` — topologia
- `public/model/labels.json` — array de FieldTypes
- `public/model/vocab.json` — mapa de trigrams

### Treinamento Runtime (In-Browser)

Disparado pela options page ou via mensagem `RETRAIN_LEARNING_DATABASE`:

```typescript
const result = await trainModelFromDataset(entries, (progress) => {
  console.log(`Epoch ${progress.epoch}/${progress.totalEpochs}`);
  console.log(`Loss: ${progress.loss}, Accuracy: ${progress.accuracy}`);
});
```

**Hiperparâmetros:**
- Optimizer: Adam (lr = 0.001)
- Batch size: 32
- Max epochs: 80
- Early stopping: patience 20 (restaura melhores pesos)
- Mínimo: 10 amostras, 2+ tipos diferentes

**Persistência no Storage:**
- `fill_all_runtime_model` — topology + weights (Base64)
- `fill_all_runtime_vocab` — mapa de trigrams
- `fill_all_runtime_labels` — array de FieldTypes
- `fill_all_runtime_meta` — métricas de treinamento

---

## Chrome AI — Gemini Nano

### Requisitos

- Chrome 131+
- Flag `chrome://flags/#optimization-guide-on-device-model` → Enabled
- Modelo Gemini Nano baixado (~1.7GB)

### Funcionamento

1. **Verifica disponibilidade** via `LanguageModel.availability()`
2. **Cria sessão** com system prompt especializado
3. **Envia contexto do campo** (label, name, type, placeholder, autocomplete)
4. **Recebe valor gerado** ou **classificação do tipo**

### System Prompt

```
You are a form field value generator. When given information about a form field
(its label, name, type, placeholder), you generate a single realistic test value.
Rules:
- Return ONLY the value, no explanations
- Use Brazilian Portuguese when generating names, addresses, etc.
- Generate valid CPFs, CNPJs when asked
- For dates, use ISO format (YYYY-MM-DD)
- For emails, use realistic-looking addresses
- Keep values concise and appropriate for the field
```

### Sessão Reutilizável

A sessão é criada uma vez e reutilizada para múltiplos campos, reduzindo latência.

---

## Learning Store

Sistema de aprendizado contínuo que melhora a classificação ao longo do tempo.

### Como Funciona

```
Preenchimento correto → storeLearnedEntry()
                              │
                              ▼
                    chrome.storage.local
                    (max 500 entries, FIFO)
                              │
                              ▼
                    tensorflowClassifier consulta
                    entries aprendidas via cosine
                    similarity (threshold 0.5)
```

### Características

| Propriedade | Valor |
|-------------|-------|
| Max entries | 500 |
| Eviction | FIFO (mais antigos removidos primeiro) |
| Dedup | Por sinais normalizados (mesmo texto → atualiza em vez de duplicar) |
| Sources | `"auto"` (uso orgânico) ou `"rule"` (importado de regras) |

### Retrain via Regras

`retrainLearnedFromRules()` converte regras existentes em entries de aprendizado, permitindo que o modelo aprenda com configurações manuais do usuário.

---

## Dataset

Dados estruturados para treinamento e avaliação do modelo.

### Splits

| Split | Arquivo | Finalidade |
|-------|---------|-----------|
| Training | `training-data.ts` | Treinar o modelo |
| Validation | `validation-data.ts` | Ajustar hiperparâmetros + `evaluateClassifier()` |
| Test | `test-data.ts` | Avaliação final + `runTestEvaluation()` |
| Runtime | `runtime-dataset.ts` | Entries curadas pelo usuário (CRUD) |

### Formato de Entry

```typescript
interface DatasetEntry {
  id: string;
  type: FieldType;        // "cpf", "email", "full-name", etc.
  signals: string;        // Texto concatenado de sinais do campo
  difficulty?: "easy" | "medium" | "hard";
  source?: string;        // "builtin", "user", "imported"
}
```

### Data Augmentation

| Função | Efeito |
|--------|--------|
| `augmentShuffle()` | Embaralha ordem das palavras |
| `augmentDrop()` | Remove 20% das palavras aleatoriamente |
| `augmentTypo()` | Simula typos (swap de caracteres adjacentes) |

### Health Check

```typescript
const health = checkDatasetHealth(entries);
// → { underRepresented: ["passport"], missing: ["titulo-eleitor"], leakage: false }
```

Detecta:
- Tipos com < 3 amostras (sub-representados)
- Tipos ausentes do enum `FieldType`
- Data leakage entre splits

### Thresholds de Qualidade

| Métrica | Threshold |
|---------|-----------|
| Accuracy global | ≥ 85% |
| Accuracy por tipo | ≥ 70% |
| Taxa de "unknown" | ≤ 15% |

---

## Fluxo Completo de Classificação

```
1. Usuário aciona preenchimento (popup / atalho / context menu)
        │
2. Background envia FILL_ALL_FIELDS para content script
        │
3. Content script detecta campos:
   ├─ form-detector.ts → detectAllFields()
   ├─ Adapters (Select2, Ant Design) detectam componentes custom
   └─ Extractors (label, selector, signals) extraem metadados
        │
4. Para cada campo, pipeline executa classificadores na ordem:
   ├─ htmlTypeClassifier  → Mapeamento HTML nativo
   ├─ keywordClassifier   → Keywords nos sinais
   ├─ tensorflowClassifier:
   │   ├─ Consulta learned entries (cosine similarity ≥ 0.5)
   │   └─ Modelo MLP (softmax ≥ 0.2)
   ├─ chromeAiClassifier  → Gemini Nano (se disponível)
   └─ htmlFallbackClassifier → input[type] como último recurso
        │
5. Resultado: { type: FieldType, confidence: number, method: string }
        │
6. form-filler.ts resolve o valor (prioridade):
   ├─ fixedValue (regra com valor fixo)
   ├─ Formulário salvo (template)
   ├─ Chrome AI (gera valor via LLM)
   ├─ Generator padrão (por tipo classificado)
   └─ generateText() (fallback)
        │
7. Valor preenchido + eventos disparados (input/change/blur)
        │
8. Resultado salvo no learning store (aprendizado contínuo)
```

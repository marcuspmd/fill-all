# AGENTS.md — Fill All Chrome Extension

Extensão Chrome (Manifest V3) para preenchimento automático de formulários com AI, TensorFlow.js e geradores de dados brasileiros válidos.

---

## Build & Dev

```bash
npm install          # Instalar dependências
npm run dev          # Build com HMR (Vite + @crxjs/vite-plugin)
npm run build        # Build de produção → dist/
npm run type-check   # Verificação de tipos (tsc --noEmit)
npm run clean        # Limpa dist/
npm run train:model  # Treina modelo TensorFlow (tsx scripts/train-model.ts)
```

Carregar no Chrome: `chrome://extensions/` → Modo de desenvolvedor → Carregar sem compactação → selecionar `dist/`.

---

## Code Style & Conventions

- **TypeScript strict** — `strict: true`, sem `any` implícito
- **Named exports apenas** — nunca `export default`
- **Barrel exports** para módulos com muitos arquivos (`dataset/index.ts`, `generators/index.ts`)
- **Constantes** em UPPERCASE: `STORAGE_KEYS`, `DEFAULT_PIPELINE`, `KEYWORD_RULES`
- **Detectors/Classifiers** são objetos imutáveis com `.name` + `.detect()`, não classes
- **Pipelines** são imutáveis — transformações criam novas instâncias
- **Zod v4** para validação de schemas — usar `z.uuid()` (NÃO `z.string().uuid()`)
- **Path aliases**: preferir `@/*` sobre aliases granulares (`@lib/*`, `@form/*` etc.)

### Naming

| Categoria | Padrão | Exemplos |
|-----------|--------|----------|
| Objetos detector | `camelCase` + sufixo semântico | `htmlTypeDetector`, `keywordClassifier` |
| Funções | `verbNoun` | `detectBasicType()`, `buildSignals()`, `generateCpf()` |
| Storage | `get*`, `save*`, `delete*`, `*ForUrl` | `getRulesForUrl()`, `updateStorageAtomically()` |
| Tipos | `PascalCase` | `FieldType`, `FormField`, `ClassifierResult` |
| Constantes | `UPPER_SNAKE_CASE` | `STORAGE_KEYS`, `DEFAULT_PIPELINE` |

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
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Popup UI  │────▶│  Background  │◀────│  Content Script  │
│  (popup.ts) │     │  (service-   │     │ (content-        │
└─────────────┘     │   worker.ts) │     │  script.ts)      │
                    └──────┬───────┘     └────────┬─────────┘
                           │                      │
              ┌────────────┼────────────┐         │
              ▼            ▼            ▼         ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Storage  │ │  Rules   │ │    AI    │ │   Form   │
        │  Module  │ │  Engine  │ │ Modules  │ │ Detector │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘
                                       │
                           ┌───────────┼───────────┐
                           ▼                       ▼
                    ┌─────────────┐         ┌─────────────┐
                    │  Chrome AI  │         │ TensorFlow  │
                    │ (Gemini Nano)│        │    (.js)    │
                    └─────────────┘         └─────────────┘
```

---

## 📦 Módulos

### 1. Background Service Worker (`src/background/service-worker.ts`)
- **Responsabilidade**: Ponto central de comunicação da extensão
- **Funções**: Context menu, atalhos de teclado, roteamento de mensagens
- **Escuta mensagens**: `FILL_FORM`, `SAVE_FORM`, `GET_RULES`, `SAVE_RULE`, `DELETE_RULE`, `GET_SETTINGS`, `SAVE_SETTINGS`, `LOAD_SAVED_FORM`

### 2. Content Script (`src/content/content-script.ts`)
- **Responsabilidade**: Opera dentro das páginas web
- **Funções**: Detectar campos, preencher formulários, salvar dados fixos
- **Injeta**: Listeners para mensagens do background

### 3. Popup UI (`src/popup/`)
- **Responsabilidade**: Interface principal de controle rápido
- **Funções**: Preencher/salvar form da aba ativa, status de conexão AI

### 4. Options Page (`src/options/`)
- **Responsabilidade**: Configurações detalhadas da extensão
- **Funções**: Gerenciar regras por site, configurações globais, formulários salvos

---

## 🔧 Bibliotecas (src/lib/)

### Generators (`src/lib/generators/`)
Geradores de dados válidos para preenchimento de formulários:

| Arquivo | Descrição |
|---------|-----------|
| `cpf.ts` | Gera CPFs válidos (com dígitos verificadores) |
| `cnpj.ts` | Gera CNPJs válidos (com dígitos verificadores) |
| `email.ts` | Gera e-mails aleatórios |
| `phone.ts` | Gera telefones brasileiros válidos |
| `name.ts` | Gera nomes completos, primeiros nomes e sobrenomes |
| `address.ts` | Gera endereços, CEPs, cidades e estados |
| `date.ts` | Gera datas e datas de nascimento |
| `rg.ts` | Gera números de RG |
| `misc.ts` | Gera senhas, usernames, números e textos |
| `index.ts` | Registry central de geradores |

### AI (`src/lib/ai/`)
| Arquivo | Descrição |
|---------|-----------|
| `chrome-ai.ts` | Integração com Chrome Built-in AI (Gemini Nano) |
| `tensorflow-generator.ts` | Classificação de campos e geração via TensorFlow.js |

### Form (`src/lib/form/`)
| Arquivo | Descrição |
|---------|-----------|
| `form-detector.ts` | Detecta e analisa campos de formulário na página |
| `form-filler.ts` | Preenche os campos de acordo com regras e geradores |
| `detectors/pipeline.ts` | Pipeline de classificação imutável e composável |
| `detectors/*.ts` | Classificadores individuais (html-type, keyword, tensorflow, chrome-ai) |
| `dom-watcher.ts` | Observa mutações DOM para detectar novos campos |
| `field-icon.ts` / `field-overlay.ts` | UI de feedback visual nos campos |
| `floating-panel.ts` | Painel flutuante de controles |

### Storage (`src/lib/storage/`)
| Arquivo | Descrição |
|---------|-----------|
| `storage.ts` | Wrapper sobre Chrome Storage API para regras, forms e settings |

### Rules (`src/lib/rules/`)
| Arquivo | Descrição |
|---------|-----------|
| `rule-engine.ts` | Motor de resolução de regras por URL e seletor |

---

## 🔑 Tipos (`src/types/`)

| Arquivo | Descrição |
|---------|-----------|
| `index.ts` | Tipos principais: `FieldRule`, `SavedForm`, `Settings`, `FieldType`, `ExtensionMessage` |
| `chrome-ai.d.ts` | Declarações de tipo para Chrome AI API |
| `global.d.ts` | Augmentação do tipo `Window` para Chrome AI |
| `css.d.ts` | Declarações de módulos CSS |

---

## 🔄 Fluxo de Preenchimento

1. Usuário clica em "Preencher" (popup) ou usa atalho `Ctrl+Shift+F`
2. Background envia mensagem `FILL_FORM` para content script
3. Content script detecta campos na página (`form-detector`)
4. Para cada campo, verifica hierarquia:
   - **Valor fixo** (regra com `fixedValue`) → Usa o valor fixo
   - **Formulário salvo** → Usa dados salvos
   - **Chrome AI** (se habilitado e disponível) → Gera via Gemini Nano
   - **TensorFlow.js** → Classifica o campo e gera valor
   - **Gerador padrão** → Usa gerador aleatório baseado no tipo detectado
5. Campos são preenchidos e eventos `input`/`change` são disparados

---

## 📋 Convenções

- **Linguagem**: TypeScript strict
- **Bundler**: Vite + @crxjs/vite-plugin
- **Manifest**: V3
- **Storage**: `chrome.storage.local`
- **Comunicação**: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`

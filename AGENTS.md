# AGENTS.md — Fill All Chrome Extension

## Agentes e Módulos do Projeto

Este projeto é uma extensão Chrome para preenchimento automático de formulários.
Abaixo estão os agentes (módulos) do sistema e suas responsabilidades.

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
- **Bundler**: Webpack
- **Manifest**: V3
- **Storage**: `chrome.storage.local`
- **Comunicação**: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`

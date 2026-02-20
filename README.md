# Fill All — Chrome Extension

> Extensão Chrome para preenchimento automático de formulários com AI, TensorFlow.js e geradores de dados brasileiros válidos.

## ✨ Features

- **Preenchimento automático** de formulários com um clique ou atalho
- **Chrome Built-in AI** (Gemini Nano) para análise inteligente de campos
- **TensorFlow.js** como fallback para classificação de campos
- **Geradores de dados brasileiros válidos**: CPF, CNPJ, RG, CEP, telefone, etc.
- **Regras por site**: configure comportamentos diferentes para cada site
- **Formulários salvos**: salve dados fixos para reutilização
- **Atalho de teclado**: `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`)
- **Menu de contexto**: clique direito → "Fill All"

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Build de desenvolvimento (com HMR)
npm run dev

# Build de produção
npm run build
```

### Carregar no Chrome

1. Abra `chrome://extensions/`
2. Ative o **Modo de desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `dist/`

## 🏗️ Estrutura do Projeto

```
fill-all/
├── public/
│   ├── manifest.json          # Chrome Extension Manifest V3
│   └── icons/                 # Ícones da extensão
├── src/
│   ├── background/            # Service Worker
│   ├── content/               # Content Script
│   ├── popup/                 # Popup UI (HTML/TS/CSS)
│   ├── options/               # Options Page (HTML/TS/CSS)
│   ├── lib/
│   │   ├── generators/        # Geradores de dados (CPF, CNPJ, etc.)
│   │   ├── ai/                # Chrome AI + TensorFlow.js
│   │   ├── form/              # Detecção e preenchimento de forms
│   │   ├── rules/             # Motor de regras
│   │   └── storage/           # Chrome Storage wrapper
│   └── types/                 # Type definitions
├── AGENTS.md                  # Documentação dos módulos
├── webpack.config.js          # Webpack config
├── tsconfig.json              # TypeScript config
└── package.json
```

## 🔄 Fluxo de Preenchimento

1. Usuário aciona o preenchimento (popup, atalho ou menu de contexto)
2. Content script detecta todos os campos do formulário
3. Para cada campo, segue a hierarquia de resolução:
   - **Valor fixo** (regra com `fixedValue`) → Usa o valor configurado
   - **Formulário salvo** → Usa dados salvos previamente
   - **Chrome AI** (se disponível) → Gera via Gemini Nano
   - **TensorFlow.js** → Classifica e gera valor
   - **Gerador padrão** → Gerador aleatório baseado no tipo do campo

## ⚙️ Configuração

### Regras por Site

Na página de opções, você pode criar regras específicas:

- **Padrão de URL**: `https://meusite.com/*`
- **Seletor CSS**: `#cpf`, `input[name="documento"]`
- **Tipo do campo**: CPF, CNPJ, Email, Telefone, etc.
- **Gerador**: Automático, Chrome AI, TensorFlow, ou gerador específico
- **Valor fixo**: Define um valor que será sempre usado
- **Prioridade**: Valores maiores têm precedência

### Formulários Salvos

Você pode salvar o estado atual de um formulário e reutilizar os mesmos dados:
1. Preencha o formulário manualmente
2. Clique em "Salvar Form" no popup
3. Na próxima visita, o formulário será preenchido com os mesmos dados

## 🛠️ Tecnologias

- **TypeScript** (strict mode)
- **Webpack** (bundling)
- **Chrome Extension Manifest V3**
- **Chrome Built-in AI** (Gemini Nano)
- **TensorFlow.js**
- **Chrome Storage API**

## 📋 Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Build de produção |
| `npm run dev` | Build com watch mode |
| `npm run type-check` | Verificação de tipos |

## 📄 Licença

MIT

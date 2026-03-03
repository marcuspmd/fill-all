---
name: i18n-localization
description: 'Skill para gerenciamento de internacionalização (i18n) — traduções, chaves de locale, chrome.i18n API e boas práticas.'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: localization
---

# Skill: Internacionalização (i18n)

## Objetivo

Gerenciar traduções e internacionalização do projeto Fill All usando o sistema nativo de i18n do Chrome Extensions, garantindo consistência entre locales e cobertura de todas as strings visíveis ao usuário.

## Como Funciona o i18n em Chrome Extensions

### Estrutura de Diretórios

```
_locales/
  ├── en/
  │   └── messages.json    # Inglês (locale padrão)
  ├── pt_BR/
  │   └── messages.json    # Português (Brasil)
  └── es/
      └── messages.json    # Espanhol (se adicionado)
```

### Formato do `messages.json`

```json
{
  "extensionName": {
    "message": "Fill All",
    "description": "Nome da extensão exibido na Chrome Web Store"
  },
  "extensionDescription": {
    "message": "Auto-fill forms with AI-powered field detection",
    "description": "Descrição da extensão na Chrome Web Store"
  },
  "buttonFillAll": {
    "message": "Fill All Fields",
    "description": "Texto do botão principal no popup"
  },
  "settingsTitle": {
    "message": "Settings",
    "description": "Título da página de configurações"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `message` | string | ✅ Sim | Texto traduzido |
| `description` | string | 🟡 Recomendado | Contexto para tradutores |
| `placeholders` | object | ❌ Opcional | Variáveis dinâmicas |

### Usando Placeholders

```json
{
  "fieldsDetected": {
    "message": "Detected $COUNT$ fields on this page",
    "description": "Mensagem após detectar campos",
    "placeholders": {
      "count": {
        "content": "$1",
        "example": "5"
      }
    }
  }
}
```

## Acessando Traduções no Código

### Em TypeScript (Background, Content Script, Popup)

```typescript
// ✅ Usar chrome.i18n.getMessage()
const title = chrome.i18n.getMessage("extensionName");
const msg = chrome.i18n.getMessage("fieldsDetected", ["5"]);

// ❌ Nunca hardcodar strings visíveis ao usuário
const title = "Fill All"; // ERRADO — não é internacionalizável
```

### Em HTML

```html
<!-- Usar __MSG_chave__ em arquivos HTML -->
<h1>__MSG_extensionName__</h1>
<p>__MSG_extensionDescription__</p>

<!-- No manifest.json -->
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__"
}
```

### Em CSS

```css
/* Mensagens i18n NÃO funcionam em CSS */
/* Usar JavaScript para aplicar traduções em elementos dinâmicos */
```

## Adicionando Nova Chave de Tradução

### Processo

1. **Adicionar no locale padrão** (`_locales/en/messages.json`)
2. **Adicionar em todos os locales** existentes
3. **Usar no código** com `chrome.i18n.getMessage()`
4. **Verificar consistência** com script de validação

### Exemplo Passo a Passo

```bash
# Step 1: Adicionar chave em _locales/en/messages.json
# Step 2: Adicionar chave em _locales/pt_BR/messages.json
# Step 3: Usar no código
# Step 4: Verificar consistência
```

```typescript
// No código TypeScript
const label = chrome.i18n.getMessage("newFeatureLabel");
element.textContent = label;
```

## Convenções de Naming para Chaves

| Padrão | Exemplo | Uso |
|--------|---------|-----|
| `extensionName` | `extensionName` | Nome da extensão |
| `button<Action>` | `buttonFillAll`, `buttonSave` | Botões |
| `label<Element>` | `labelCpf`, `labelEmail` | Labels de campos |
| `title<Section>` | `titleSettings`, `titleRules` | Títulos de seções |
| `message<Context>` | `messageSuccess`, `messageError` | Mensagens ao usuário |
| `tooltip<Element>` | `tooltipFillAll`, `tooltipDetect` | Tooltips |
| `placeholder<Field>` | `placeholderSearch`, `placeholderUrl` | Placeholders de input |
| `error<Type>` | `errorInvalidCpf`, `errorNetworkFail` | Mensagens de erro |

### Regras de Naming

- **camelCase** para todas as chaves
- **Prefixo semântico** indicando o tipo de string
- **Descrição obrigatória** para contexto ao tradutor
- **Sem abreviações** — usar nomes completos e descritivos

## Verificação de Consistência

### Script de Validação

```bash
# Verificar se todas as chaves existem em todos os locales
node scripts/check-i18n.js
```

### Verificação Manual

```bash
# Listar todas as chaves do locale padrão
cat _locales/en/messages.json | grep -o '"[^"]*":' | sort

# Comparar chaves entre locales
diff <(cat _locales/en/messages.json | grep -o '"[^"]*":' | sort) \
     <(cat _locales/pt_BR/messages.json | grep -o '"[^"]*":' | sort)

# Buscar chaves usadas no código
grep -r "getMessage(\"" src/ --include="*.ts" -o | sort -u

# Buscar chaves usadas em HTML
grep -r "__MSG_" src/ --include="*.html" -o | sort -u
```

## Boas Práticas

### ✅ Fazer

| Prática | Detalhe |
|---------|---------|
| **Sempre usar `chrome.i18n.getMessage()`** | Para todas as strings visíveis ao usuário |
| **Incluir `description`** | Ajuda tradutores a entender o contexto |
| **Usar placeholders** | Para valores dinâmicos (contagens, nomes) |
| **Manter sincronizado** | Mesmas chaves em todos os locales |
| **Testar com outro locale** | Mudar idioma do Chrome para verificar |
| **Strings curtas** | UI de extensão tem espaço limitado |

### ❌ Evitar

| Anti-Padrão | Problema |
|-------------|----------|
| Strings hardcoded no código | Não internacionalizável |
| Concatenar traduções | Ordem das palavras varia entre idiomas |
| Chaves genéricas (`text1`, `text2`) | Difícil manter e traduzir |
| Traduções no código | Centralizar em `messages.json` |
| Ignorar pluralização | Tratar singular/plural com chaves separadas |

### Pluralização

O Chrome i18n não tem suporte nativo a plural. Usar chaves separadas:

```json
{
  "fieldCountSingular": {
    "message": "$COUNT$ field detected",
    "description": "Quando apenas 1 campo é detectado",
    "placeholders": {
      "count": { "content": "$1", "example": "1" }
    }
  },
  "fieldCountPlural": {
    "message": "$COUNT$ fields detected",
    "description": "Quando múltiplos campos são detectados",
    "placeholders": {
      "count": { "content": "$1", "example": "5" }
    }
  }
}
```

```typescript
const key = count === 1 ? "fieldCountSingular" : "fieldCountPlural";
const message = chrome.i18n.getMessage(key, [String(count)]);
```

## Adicionando Novo Locale

### Processo

1. Criar diretório `_locales/<locale>/`
2. Copiar `messages.json` do locale padrão
3. Traduzir todas as mensagens
4. Verificar com script de consistência
5. Testar no Chrome com o idioma correspondente

```bash
# Criar novo locale (ex: espanhol)
mkdir -p _locales/es
cp _locales/en/messages.json _locales/es/messages.json
# Traduzir mensagens no arquivo copiado
```

### Códigos de Locale Suportados

O Chrome usa códigos baseados no padrão BCP 47:
- `en` — Inglês
- `pt_BR` — Português (Brasil)
- `es` — Espanhol
- `fr` — Francês
- `de` — Alemão
- `ja` — Japonês
- `zh_CN` — Chinês Simplificado

## Checklist de i18n

```markdown
### Revisão de Internacionalização

- [ ] Todas as strings visíveis usam `chrome.i18n.getMessage()`
- [ ] Chaves existem em todos os locales
- [ ] Campos `description` preenchidos para contexto
- [ ] Placeholders usados para valores dinâmicos
- [ ] Naming segue convenção (`button*`, `label*`, `title*`, etc.)
- [ ] Pluralização tratada com chaves separadas
- [ ] Script de verificação passa (`node scripts/check-i18n.js`)
- [ ] Testado com locale alternativo no Chrome
```

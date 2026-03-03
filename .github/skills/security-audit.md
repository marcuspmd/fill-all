---
applyTo: '**'
description: 'Skill para auditoria de segurança em código de extensão Chrome — CSP, permissões, sanitização, storage e comunicação.'
---

# Skill: Auditoria de Segurança

## Objetivo

Garantir que o código da extensão Chrome Fill All está seguro contra vulnerabilidades comuns em extensões do navegador, incluindo XSS, injection, privilege escalation e data leaks.

## Áreas de Auditoria

### 1. Content Security Policy (CSP)

O Manifest V3 impõe CSP rigorosa. Verificar:

- [ ] **Sem `eval()`**: nunca usar `eval()`, `new Function()`, `setTimeout(string)`
- [ ] **Sem inline scripts**: nunca injetar `<script>` tags no DOM da página
- [ ] **Sem `unsafe-eval`**: CSP do manifest não inclui `unsafe-eval`
- [ ] **Sem `unsafe-inline`**: CSP não inclui `unsafe-inline` para scripts

```typescript
// ❌ Violação de CSP
eval("code");
new Function("return " + data);
setTimeout("alert(1)", 0);
element.innerHTML = `<script>code</script>`;

// ✅ Seguro
const fn = () => { /* código direto */ };
setTimeout(() => alert(1), 0);
element.textContent = data;
```

### 2. Cross-Site Scripting (XSS)

Content scripts operam no DOM de páginas não confiáveis. Verificar:

- [ ] **`innerHTML` proibido com dados externos**: usar `textContent` ou DOM API
- [ ] **`escapeHtml()`**: sanitizar antes de inserir dados de usuário no DOM
- [ ] **Templates literais**: não interpolar dados não confiáveis em HTML
- [ ] **`document.createElement`**: preferir criação programática de elementos

```typescript
// ❌ Vulnerável a XSS
element.innerHTML = `<span>${userInput}</span>`;
container.insertAdjacentHTML("beforeend", userInput);

// ✅ Seguro
element.textContent = userInput;

const span = document.createElement("span");
span.textContent = userInput;
container.appendChild(span);

// ✅ Quando HTML é necessário
import { escapeHtml } from "@/lib/ui";
element.innerHTML = `<span>${escapeHtml(userInput)}</span>`;
```

### 3. Comunicação entre Contextos

Mensagens entre background, content script e popup:

- [ ] **Validar mensagens recebidas**: toda mensagem deve ser validada antes de processar
- [ ] **Não confiar em `sender`**: content scripts podem ser spoofados
- [ ] **Schemas Zod**: usar `safeParse()` para validar payloads
- [ ] **Sem dados sensíveis**: não enviar credenciais em mensagens
- [ ] **Origem verificada**: validar `sender.id` quando necessário

```typescript
// ✅ Validar mensagem antes de processar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const parsed = parseMessagePayload(message);
  if (!parsed) {
    log.warn("Invalid message received:", message);
    return;
  }
  // Processar mensagem validada
});
```

### 4. Storage

- [ ] **Sem dados sensíveis em plaintext**: nunca armazenar senhas/tokens
- [ ] **Validar ao ler**: dados do storage podem ser corrompidos — validar com Zod
- [ ] **Chaves com prefixo**: `STORAGE_KEYS` com prefixo `fill_all_` para evitar colisão
- [ ] **`chrome.storage.local`**: nunca `sync` (dados podem exceder limite)
- [ ] **Operações atômicas**: `updateStorageAtomically()` para prevenir race conditions

### 5. Permissões do Manifest

- [ ] **Princípio do menor privilégio**: solicitar apenas permissões necessárias
- [ ] **Sem `<all_urls>` desnecessário**: limitar host permissions
- [ ] **`activeTab` preferido**: sobre `tabs` quando possível
- [ ] **Permissões opcionais**: usar `optional_permissions` para não-essenciais
- [ ] **Content scripts**: `matches` o mais restrito possível

### 6. Injeção de Código

- [ ] **Sem `chrome.scripting.executeScript` com strings**: usar arquivos
- [ ] **Sem `document.write()`**: proibido em extensões MV3
- [ ] **Templates confiáveis**: HTML de UI vem de arquivos estáticos, não de dados
- [ ] **URLs validadas**: `matchUrlPattern()` sem ReDoS

### 7. Dados Gerados

Geradores produzem dados fictícios que podem ser sensíveis:

- [ ] **CPFs/CNPJs gerados**: são fictícios mas válidos — não confundir com reais
- [ ] **Dados não persistem**: gerados sob demanda, não cached em storage
- [ ] **Sem envio externo**: dados gerados nunca são enviados para servidores
- [ ] **Sem correlação**: dados gerados são aleatórios entre sessões

## Checklist de Auditoria Rápida

### Para cada PR, verificar:

```markdown
## Segurança
- [ ] Sem `eval()`, `new Function()`, `setTimeout(string)`
- [ ] Sem `innerHTML` com dados não confiáveis
- [ ] Mensagens validadas com Zod antes de processar
- [ ] Sem dados sensíveis em storage ou mensagens
- [ ] URLs validadas com `matchUrlPattern()`
- [ ] Permissões do manifest mínimas
- [ ] `escapeHtml()` usado para dados exibidos no DOM
```

## Vulnerabilidades Comuns em Extensões Chrome

| Vulnerabilidade | Vetor de Ataque | Prevenção |
|-----------------|-----------------|-----------|
| XSS no popup/options | Dados de storage renderizados sem escape | `escapeHtml()` ou `textContent` |
| XSS via content script | Página maliciosa manipula DOM compartilhado | Shadow DOM, `textContent`, validação |
| Message spoofing | Página envia mensagem falsa para background | Validar `sender.id`, schemas Zod |
| Privilege escalation | Content script acessa API restrita | Separar privilégios por contexto |
| Data exfiltration | Extensão envia dados para servidor externo | Sem fetch para URLs externas |
| ReDoS | URL pattern com regex exponencial | `matchUrlPattern()` com proteção |
| Storage poisoning | Dados corrompidos no storage | Validar com Zod ao ler |

## Ferramentas de Verificação

```bash
# Validação completa do projeto com script
./scripts/validate-step.sh types unit build

# Type-check encontra uso incorreto de tipos
npm run type-check

# Buscar padrões inseguros no código
grep -r "innerHTML" src/ --include="*.ts" | grep -v "escapeHtml"
grep -r "eval(" src/ --include="*.ts"
grep -r "new Function" src/ --include="*.ts"
grep -r "document.write" src/ --include="*.ts"
grep -r "unsafe-eval" . --include="*.json"

# Verificar permissões do manifest
cat manifest.json | grep -A 20 "permissions"
```

## Processo de Auditoria

1. **Revisar manifest.json** — permissões mínimas?
2. **Buscar padrões inseguros** — grep por `innerHTML`, `eval`, etc.
3. **Revisar content script** — XSS, DOM manipulation
4. **Revisar messaging** — validação de mensagens
5. **Revisar storage** — dados sensíveis, validação
6. **Revisar UI** — escape de HTML, sanitização
7. **Verificar dependências** — vulnerabilidades conhecidas em `npm audit`

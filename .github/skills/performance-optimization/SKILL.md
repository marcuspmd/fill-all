---
name: performance-optimization
description: 'Skill para otimização de performance em content scripts de extensão Chrome — hot paths, DOM, MutationObserver e memória.'
applyTo: 'src/content/**'
license: MIT
compatibility: 'Node.js 18+, TypeScript 5.x, Chrome Extension Manifest V3'
metadata:
  author: marcusp
  version: "1.0"
  project: fill-all
  category: performance
allowed-tools: Read Write Bash
---

# Skill: Otimização de Performance

## Objetivo

Otimizar a performance do content script e componentes DOM-heavy da extensão Fill All, garantindo que a extensão não impacte negativamente a experiência do usuário nas páginas web.

## Princípios

| Princípio | Detalhe |
|-----------|---------|
| **Content script é hot path** | Código roda em TODAS as páginas — cada ms conta |
| **Mínimo impacto no DOM** | Extensão não deve atrasar renderização da página |
| **Lazy loading** | Carregar recursos pesados apenas quando necessário |
| **Debounce operações** | Agrupar operações frequentes (MutationObserver, resize) |
| **Validação light** | Content script usa `typeof` checks, não Zod completo |

## Identificando Hot Paths

### O que é Hot Path

Código executado frequentemente ou em momentos críticos de performance:

| Hot Path | Frequência | Impacto |
|----------|-----------|---------|
| Content script init | Cada página carregada | Alto — bloqueia DOM |
| MutationObserver callback | Cada mutação DOM | Alto — pode ser chamado centenas de vezes |
| Field detection | Cada campo no formulário | Médio — O(n) por campo |
| Message validation | Cada mensagem recebida | Médio — frequente |
| Event handlers (input/change) | Cada interação do usuário | Baixo — mas deve ser responsivo |

### Como Identificar

```typescript
// ✅ Instrumentar com performance.now()
const start = performance.now();
detectAllFields(document);
const elapsed = performance.now() - start;
log.debug(`Field detection took ${elapsed.toFixed(2)}ms`);
```

## MutationObserver — Padrão de Debounce

O DOM watcher usa MutationObserver com debounce de **600ms** para evitar cascata de processamento:

```typescript
// ✅ Padrão correto — debounce de 600ms
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver((mutations) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    processNewFields(mutations);
  }, 600);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

### Por que 600ms?

| Valor | Problema |
|-------|----------|
| < 200ms | Processamento excessivo em páginas SPA dinâmicas |
| 200-400ms | Pode reagir a mutações intermediárias |
| **600ms** | ✅ Equilibrio entre responsividade e eficiência |
| > 1000ms | Usuário percebe atraso no preenchimento |

### Regras do Observer

- [ ] **Sempre debounce** — nunca processar cada mutação individualmente
- [ ] **Filtrar mutações** — ignorar mutações da própria extensão
- [ ] **Limitar escopo** — observar apenas `document.body`, não `document`
- [ ] **Disconnect** quando não necessário — `observer.disconnect()`

## Validação Light vs Full Zod

### Content Script — Light Validators

```typescript
// ✅ Light validator — apenas typeof checks
export function isValidFillMessage(msg: unknown): msg is FillMessage {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return typeof m.type === "string" && m.type === "FILL_ALL_FIELDS";
}
```

### Background — Full Zod

```typescript
// ✅ Full Zod — schemas completos com safeParse
const result = fillMessageSchema.safeParse(message);
if (!result.success) return null;
return result.data;
```

### Comparação de Performance

| Abordagem | Tempo (~) | Onde usar |
|-----------|-----------|----------|
| `typeof` check | ~0.001ms | Content script (hot path) |
| Zod `safeParse()` | ~0.1-0.5ms | Background, options |
| Zod `parse()` + try/catch | ~0.1-0.5ms + overhead | ❌ Nunca usar |

## Operações Assíncronas para Tarefas Pesadas

### Padrão: Offload para Background

```typescript
// ✅ Content script — delegar trabalho pesado ao background
chrome.runtime.sendMessage({ type: "CLASSIFY_FIELDS", fields }, (response) => {
  applyClassification(response);
});

// ❌ Nunca fazer classificação pesada no content script
const result = await heavyClassification(fields); // BLOQUEIA a página
```

### Padrão: requestIdleCallback

```typescript
// ✅ Para operações não-urgentes no content script
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    updateFieldIcons();
  }, { timeout: 2000 });
} else {
  setTimeout(() => {
    updateFieldIcons();
  }, 100);
}
```

### Padrão: Chunking de Arrays

```typescript
// ✅ Processar campos em chunks para não bloquear
async function processFieldsInChunks(fields: FormField[], chunkSize = 10): Promise<void> {
  for (let i = 0; i < fields.length; i += chunkSize) {
    const chunk = fields.slice(i, i + chunkSize);
    await processChunk(chunk);
    // Yield para o event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
```

## Manipulação de DOM — Boas Práticas

### ✅ Fazer

| Prática | Detalhe |
|---------|---------|
| **Batch DOM reads/writes** | Agrupar leituras antes de escritas |
| **DocumentFragment** | Montar múltiplos elementos antes de inserir |
| **`textContent`** | Mais rápido que `innerHTML` + mais seguro |
| **CSS classes** | Alternar classes em vez de mudar estilos inline |
| **Event delegation** | Um listener no container, não um por campo |
| **`display: none`** | Esconder antes de múltiplas mudanças, mostrar depois |

### ❌ Evitar

| Anti-Padrão | Problema |
|-------------|----------|
| Layout thrashing (ler+escrever alternado) | Força recálculo de layout repetido |
| `innerHTML` com dados dinâmicos | Lento + risco de XSS |
| Listeners em cada campo | Vazamento de memória em formulários grandes |
| `getComputedStyle()` em loop | Força layout síncrono |
| Criar Shadow DOM por campo | Overhead de memória |

### Exemplo: Batch DOM Updates

```typescript
// ❌ Layout thrashing
fields.forEach((field) => {
  const height = field.element.offsetHeight; // LEITURA → força layout
  field.element.style.height = `${height + 10}px`; // ESCRITA → invalida layout
});

// ✅ Batch: todas as leituras primeiro, depois todas as escritas
const heights = fields.map((f) => f.element.offsetHeight); // LEITURAS
fields.forEach((field, i) => {
  field.element.style.height = `${heights[i] + 10}px`; // ESCRITAS
});
```

## Prevenção de Memory Leaks

### Fontes Comuns de Leak em Extensões

| Fonte | Causa | Prevenção |
|-------|-------|-----------|
| Event listeners | Listeners não removidos após uso | `removeEventListener` ou `AbortController` |
| MutationObserver | Observer não desconectado | `observer.disconnect()` quando desnecessário |
| Closures | Referências a elementos DOM removidos | Usar WeakRef ou WeakMap |
| Timers | `setInterval` sem `clearInterval` | Limpar timers no cleanup |
| Message listeners | `chrome.runtime.onMessage` sem cleanup | Registrar uma vez, reutilizar |

### Padrão: AbortController para Cleanup

```typescript
// ✅ Cleanup automático com AbortController
const controller = new AbortController();

document.addEventListener("click", handler, { signal: controller.signal });
document.addEventListener("input", handler2, { signal: controller.signal });

// Cleanup — remove todos os listeners de uma vez
controller.abort();
```

### Padrão: WeakMap para Metadados de Elementos

```typescript
// ✅ WeakMap — referência fraca, GC coleta quando elemento é removido
const fieldMetadata = new WeakMap<HTMLElement, FieldData>();

function processField(element: HTMLElement): void {
  if (fieldMetadata.has(element)) return; // já processado
  const data = detectField(element);
  fieldMetadata.set(element, data);
}
```

## Medindo Performance

### Performance API

```typescript
// Marcar início e fim de operações
performance.mark("fill-start");
await fillAllFields();
performance.mark("fill-end");
performance.measure("fill-duration", "fill-start", "fill-end");

const measure = performance.getEntriesByName("fill-duration")[0];
log.info(`Fill took ${measure.duration.toFixed(2)}ms`);
```

### Chrome DevTools

1. **Performance tab** — gravar timeline durante preenchimento
2. **Memory tab** — verificar heap snapshots antes/depois
3. **Coverage tab** — identificar código não utilizado
4. **Lighthouse** — auditar impacto da extensão na página

### Métricas Alvo

| Métrica | Alvo | Medição |
|---------|------|---------|
| Content script init | < 50ms | `performance.now()` |
| Field detection (10 campos) | < 100ms | `performance.measure()` |
| Form fill (10 campos) | < 200ms | `performance.measure()` |
| MutationObserver callback | < 50ms | `performance.now()` |
| Memory footprint | < 10MB | Chrome Task Manager |

## Checklist de Performance

```markdown
### Revisão de Performance

- [ ] Content script não bloqueia renderização da página
- [ ] MutationObserver com debounce de 600ms
- [ ] Light validators no content script (typeof, não Zod)
- [ ] Operações pesadas delegadas ao background
- [ ] DOM updates em batch (sem layout thrashing)
- [ ] Event listeners com cleanup (AbortController ou removeEventListener)
- [ ] Sem memory leaks (WeakMap/WeakRef para referências DOM)
- [ ] Timers limpos no cleanup (clearTimeout/clearInterval)
- [ ] Performance medida com performance.now() ou Performance API
- [ ] Formulários com 50+ campos não causam travamento
```

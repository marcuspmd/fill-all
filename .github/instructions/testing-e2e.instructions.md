---
applyTo: 'src/**/__tests__/e2e/*.test.e2e.ts'
description: 'Convenções para testes E2E com Playwright no projeto Fill All.'
---

# Fill All — Testes E2E

## Ferramenta

- **Playwright** com Chrome real (não headless por padrão)
- Extensão carregada de `dist/` — sempre rodar `npm run build` antes dos E2E
- Servidor de páginas HTML: `e2e/server.js` na porta `8765` (iniciado automaticamente pelo Playwright)

## Localização

```
src/lib/<modulo>/__tests__/e2e/<arquivo>.test.e2e.ts
```

Obrigatório o sufixo `.test.e2e.ts`. O Vitest exclui este padrão — nunca será executado por engano.

## Páginas HTML de Teste

Páginas HTML usadas nos testes ficam em `e2e/pages/`:

```
e2e/
  pages/
    test-form.html          # Página padrão (rota /)
    <funcionalidade>.html   # Páginas específicas
  server.js                 # Servidor estático porta 8765
```

Acessar via `page.goto("http://localhost:8765/<pagina>.html")` ou via `baseURL` do config.

## Estrutura do Arquivo

```typescript
import { test, expect, chromium } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.join(process.cwd(), "dist");

test.describe("<funcionalidade>", () => {
  test("<should + comportamento esperado>", async ({ page }) => {
    // Arrange: navegar para a página de teste
    await page.goto("/test-form.html");

    // Act: interagir com a extensão ou o formulário
    // ...

    // Assert: verificar resultado no DOM
    await expect(page.locator("input[name='cpf']")).not.toBeEmpty();
  });
});
```

## Fixture da Extensão

Para testes que precisam abrir o popup ou acessar a extensão via `chrome-extension://`:

```typescript
import { test as base, chromium, type BrowserContext } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.join(process.cwd(), "dist");

const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

export { test, expect };
```

Centralizar a fixture em `src/__tests__/e2e/fixtures/extension.ts` e importar nos testes.

## Fixture de Coverage

Para coletar coverage de scripts da extensão durante os testes E2E, use a fixture de coverage em vez do `test` padrão do Playwright:

```typescript
import { test, expect } from "@/__tests__/e2e/fixtures";
```

O fixture `_coverage` é `auto: true` — roda automaticamente para **todo** teste que importar este `test`, sem chamada explícita:

- **Antes** do teste: inicia coleta de JS coverage via CDP (`page.coverage.startJSCoverage()`)
- **Após** o teste: para a coleta, converte de V8 → Istanbul e salva `.coverage/e2e/<nome-do-teste>.json`
- Apenas scripts com URL `chrome-extension://` são rastreados
- Requer `sourcemap: true` no build (já configurado em `vite.config.ts`)

> **Quando usar**: em qualquer teste E2E que exercite lógica de código TypeScript da extensão (content script, background, popup). Não é necessário quando o teste verifica apenas comportamento visual/DOM externo.

## O que testar com Playwright

| ✅ Testar | ❌ Não testar |
|-----------|--------------|
| Preenchimento de formulários HTML reais | Lógica pura de generators |
| Floating panel (abrir, fechar, redimensionar) | Parsers Zod |
| Field icons e overlays no DOM | Storage CRUD isolado |
| MutationObserver e auto-refill | Classifiers sem DOM |
| Context menu da extensão | |
| Popup UI (ações, abas) | |
| Integração extensão → content script → DOM | |

## Seletores

- Preferir `page.locator('[data-testid="..."]')` para elementos da extensão
- Para campos de formulário: `page.locator("input[name='cpf']")`, `page.getByLabel("CPF")`
- Evitar seletores frágeis por posição (`:nth-child`) ou texto dinâmico

## Waiters e Timeouts

```typescript
// ✅ Aguardar estado visível
await expect(page.locator(".fill-all-panel")).toBeVisible();

// ✅ Aguardar preenchimento
await expect(page.locator("input[name='cpf']")).not.toBeEmpty();

// ✅ Aguardar navegação
await page.waitForLoadState("domcontentloaded");
```

Nunca usar `page.waitForTimeout()` — usar esperas baseadas em estado.

## Boas Práticas

- Cada `test` deve ser **independente** — não depender de ordem de execução
- Usar `test.beforeEach` para resetar estado (recarregar página, limpar storage)
- Workers fixados em `1` no `playwright.config.ts` — testes Chrome extension rodam sequencialmente
- Retries: `0` local, `2` em CI (`process.env.CI`)
- Traces e vídeos gravados `on-first-retry` para debug de falhas

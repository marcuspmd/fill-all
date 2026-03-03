# Roadmap — Fill All

Este documento lista as funcionalidades planejadas e melhorias futuras para o **Fill All**.

> Status: `🔲 Planejado` · `🚧 Em Progresso` · `✅ Concluído`

---

## 🌐 Internacionalização (i18n)

**Status**: ✅ Concluído

Suporte a múltiplos idiomas na interface da extensão (Popup, Options Page, DevTools Panel e Floating Panel).

- ✅ Separar todas as strings de UI em arquivos de localização
- ✅ Suporte a: Português (BR), English, Español
- ✅ Detectar idioma do navegador automaticamente
- ✅ Permitir troca manual via Settings

---

## 🕳️ Fill Emptys — Preencher Apenas Campos Vazios

**Status**: ✅ Concluído

Adicionar modo de preenchimento seletivo que ignora campos que já possuem valor, evitando sobrescrever dados já inseridos pelo usuário.

- ✅ Nova opção no Popup: toggle "Preencher apenas campos vazios"
- ✅ Configuração persistente via Settings
- ✅ Compatível com todos os adaptadores de UI (Ant Design, Select2, etc.)

---

## ⚙️ Melhoria na Opção de Adicionar Regras no Input

**Status**: ✅ Concluído

Melhorar a experiência de criação de regras diretamente ao clicar no ícone do campo (field icon), tornando o fluxo mais intuitivo e completo.

- ✅ Preview em tempo real do valor gerado pela regra (fixo ou por gerador)
- ✅ Sugestão automática do gerador mais adequado ao campo (via HTML type + keyword classifier)
- ✅ Badge visual indicando o tipo sugerido com botão de refresh
- ✅ Atalhos de teclado: Enter para salvar, Escape para cancelar
- ✅ Hint de atalho visível no rodapé do popup

---

## 🎛️ Customizar Parâmetros dos Geradores via Regras

**Status**: ✅ Concluído

Permitir que o usuário configure parâmetros específicos para cada gerador ao criar uma regra — por exemplo, definir faixa de datas, formato de telefone, tipo de CPF (formatado ou não), etc.

- ✅ Interface de configuração de parâmetros por tipo de gerador (Options Page + field-icon popup)
- ✅ Parâmetros disponíveis de acordo com o gerador selecionado (`GENERATOR_PARAM_DEFS`)
- ✅ Integração com o schema Zod de validação de regras (`generatorParamsSchema`)
- ✅ Suporte a parâmetros: `min`, `max`, `formatted`, `length`, `dateFormat`, `onlyLetters` e outros por gerador
- ✅ Preview em tempo real com os parâmetros customizados no field-icon popup
- ✅ Persistência via `FieldRule.generatorParams` no `chrome.storage.local`

---

## 👁️ Melhorar Modo Watch (DOM Watcher)

**Status**: ✅ Concluído

Aprimorar o comportamento do `DOMWatcher` para lidar melhor com SPAs complexas, modais dinâmicos e campos com carregamento assíncrono.

- ✅ Debounce configurável via Settings (padrão 600ms)
- ✅ Opção para habilitar/desabilitar auto-refill de novos campos
- ✅ Suporte a observação dentro de Shadow DOM (configurável)
- ✅ Refill inteligente: preenche apenas campos novos (não re-preenche existentes)
- ✅ Opção para pausar/retomar o watcher via Popup
- ✅ Sincronização de status do watcher entre DevTools e Popup
- ✅ Card de configuração no Options Page com todas as opções do watcher
- ✅ i18n completo para todas as strings do watcher

---

## 📋 Melhorar Sistema de Log

**Status**: ✅ Concluído

Evoluir o sistema de logging centralizado para facilitar o diagnóstico de problemas e o acompanhamento do comportamento da extensão.

- ✅ Timestamps e níveis de severidade no DevTools Panel (`LogEntry.ts` ISO + exibição formatada)
- ✅ Filtros por namespace e nível (toolbar com botões All/Debug/Info/Warn/Error + busca por texto)
- ✅ Exportar logs como texto (copiar para clipboard via botão no viewer)
- ✅ Rotação de buffer com FIFO eviction (max 1000 entradas, persistência via `chrome.storage.session`)
- ✅ Componente `log-viewer` reutilizável nos contextos DevTools, Options e Floating Panel
- ✅ Filtro por intervalo de tempo (date/time range picker no toolbar)
- ✅ Exportar logs como JSON (download de arquivo `.json` com todos os campos)
- ✅ Tamanho máximo do buffer configurável via Settings (padrão 1000, range 100–10000)
- ✅ Log de auditoria de preenchimentos realizados (campo tipo, gerador usado, valor mascarado)
- ✅ Nível de severidade "Audit" para rastreamento transparente de operações

---

## 🤖 Gerar Preenchimento Completo do Formulário com Chrome Built-in AI (Gemini Nano)

**Status**: 🔲 Planejado

Adicionar modo onde o Gemini Nano analisa o formulário como um todo e gera valores coerentes para todos os campos de forma contextualizada, em vez de classificar campo por campo individualmente.

- Nova opção no forms icon: "Preencher com AI (contextual)" ou "por upload de documento/foto" ou upload de csv/excel/json com dados estruturados.
- Enviar sinais de todos os campos como contexto único para o Gemini Nano
- Gerar valores coerentes entre si (ex: nome + e-mail + empresa do mesmo perfil)
- Fallback automático para pipeline padrão caso a AI não esteja disponível
- Compatível com Chrome 131+ (`#prompt-api-for-gemini-nano`)

---

## 🧪 Implementação de Testes Unitários

**Status**: ✅ Concluído

Cobertura de testes unitários e E2E implementada com Vitest + Playwright, garantindo confiabilidade nas funcionalidades principais.

- ✅ Vitest configurado com V8 coverage (`.coverage/unit/`)
- ✅ Playwright configurado para E2E com Chrome real (`.coverage/e2e/`)
- ✅ Chrome APIs mockadas (`chrome.storage`, `chrome.runtime`, `chrome.tabs`)
- ✅ 70+ arquivos de teste cobrindo: geradores, parsers Zod, rule engine, pipeline de detecção, storage, adapters Ant Design/Select2, extractors, i18n, logger, UI
- ✅ Testes E2E para: form-filler, form-detector, dom-watcher, field-icon, floating-panel
- ✅ Coverage merge combinando unitários + E2E (`npm run coverage:all`)
- ✅ Scripts: `npm test`, `npm run test:e2e`, `npm run test:coverage`, `npm run coverage:all`

---

## 🧾 Exportar Preenchimento como Script E2E (Playwright / Cypress / Pest)

**Status**: ✅ Concluído

Transformar o Fill All em um acelerador de engenharia de testes: ao preencher um formulário, a extensão captura os campos e valores utilizados e gera automaticamente um script E2E pronto para uso nos principais frameworks — sem nenhuma chamada externa, 100% client-side, preservando a privacidade dos dados.

- ✅ Captura o melhor seletor de cada campo durante o preenchimento (prioridade: `#id` → `[data-testid]` → `[name]` → fallback genérico)
- ✅ Armazena as ações como array de `{ selector, value, type }` no content script
- ✅ Gera código para os frameworks suportados via padrão **Strategy**:
  - ✅ **Playwright**: `page.locator(selector).fill(value)` / `.check()`
  - ✅ **Cypress**: `cy.get(selector).type(value)` / `.check()`
  - ✅ **Pest/Dusk (PHP)**: `$browser->type(selector, value)` / `->check()` / `->radio()`
- ✅ Seção **"Export to E2E"** no Popup com `<select>` de framework e download do script
- ✅ Botão "Copiar para área de transferência" com feedback visual
- ✅ Gravação interativa no DevTools: start/stop/pause/resume, edição de steps, otimização com Chrome AI
- ✅ Geração de asserções automáticas por tipo de campo
- ✅ Zero dependências externas — execução 100% local, compatível com ambientes corporativos e dados sensíveis

---

## 💬 Melhorar Feedback ao Usar Gemini Nano

**Status**: ✅ Concluído

Adicionar feedback visual durante e após o preenchimento com Gemini Nano, garantindo que o usuário saiba o que está acontecendo e quais campos foram processados pela IA.

- ✅ Toast/notificação ao concluir o preenchimento (com contagem de campos + campos via AI)
- ✅ Badge visual `✨ AI` nos campos preenchidos via Gemini Nano (removível com clique)
- ✅ Timeout configurável em Settings (padrão 30s, ajustável de 5s a 120s)
- ✅ Fallback transparente para o pipeline padrão caso AI timeout ou indisponível
- ✅ Todos os controles no Options Page, card "AI Feedback" com toggles para toast/badge e slider de timeout

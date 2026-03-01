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

**Status**: 🔲 Planejado

Melhorar a experiência de criação de regras diretamente ao clicar no ícone do campo (field icon), tornando o fluxo mais intuitivo e completo.

- Preview em tempo real do valor gerado pela regra
- Sugestão automática do gerador mais adequado ao campo
- Validação inline com feedback visual
- Atalhos de teclado para confirmar/cancelar

---

## 🎛️ Customizar Parâmetros dos Geradores via Regras

**Status**: 🔲 Planejado

Permitir que o usuário configure parâmetros específicos para cada gerador ao criar uma regra — por exemplo, definir faixa de datas, formato de telefone, tipo de CPF (formatado ou não), etc.

- Interface de configuração de parâmetros por tipo de gerador
- Parâmetros disponíveis de acordo com o gerador selecionado
- Integração com o schema Zod de validação de regras
- Suporte a parâmetros: `min`, `max`, `format`, `mask`, `locale` e outros por gerador

---

## 👁️ Melhorar Modo Watch (DOM Watcher)

**Status**: 🔲 Planejado

Aprimorar o comportamento do `DOMWatcher` para lidar melhor com SPAs complexas, modais dinâmicos e campos com carregamento assíncrono.

- Reduzir falsos positivos no debounce (atualmente 600ms fixo)
- Adicionar opção para configurar o intervalo de debounce nas Settings
- Detectar corretamente campos dentro de Shadow DOM
- Melhorar detecção de remoção de formulários sem reprocessar toda a página
- Opção para pausar/retomar o watcher via Popup

---

## 📋 Melhorar Sistema de Log

**Status**: 🔲 Planejado

Evoluir o sistema de logging centralizado para facilitar o diagnóstico de problemas e o acompanhamento do comportamento da extensão.

- Timestamps e níveis de severidade no DevTools Panel
- Filtros por namespace, nível e intervalo de tempo
- Exportar logs como JSON ou texto
- Limitar rotação de buffer com controle configurável de tamanho máximo
- Log de auditoria de preenchimentos realizados (campo, gerador usado, valor mascarado)

---

## 🤖 Gerar Preenchimento Completo do Formulário com Chrome Built-in AI (Gemini Nano)

**Status**: 🔲 Planejado

Adicionar modo onde o Gemini Nano analisa o formulário como um todo e gera valores coerentes para todos os campos de forma contextualizada, em vez de classificar campo por campo individualmente.

- Nova opção no Popup: "Preencher com AI (contextual)"
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

**Status**: 🔲 Planejado

Atualmente o usuário não recebe nenhum retorno visual enquanto o Gemini Nano está processando, o que pode dar a impressão de que a extensão travou.

- Indicador de loading no Popup e no Floating Panel durante geração com AI
- Mensagem de status: "Gerando com Gemini Nano…"
- Toast/notificação ao concluir ou em caso de falha
- Indicar visualmente quais campos foram preenchidos via AI (badge diferenciado)
- Timeout configurável com fallback transparente para o pipeline padrão

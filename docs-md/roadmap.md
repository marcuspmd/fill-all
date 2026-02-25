# Roadmap — Fill All

Este documento lista as funcionalidades planejadas e melhorias futuras para o **Fill All**.

> Status: `🔲 Planejado` · `🚧 Em Progresso` · `✅ Concluído`

---

## 🌐 Internacionalização (i18n)

**Status**: 🔲 Planejado

Suporte a múltiplos idiomas na interface da extensão (Popup, Options Page, DevTools Panel e Floating Panel).

- Separar todas as strings de UI em arquivos de localização
- Suporte inicial a: Português (BR), English, Español
- Detectar idioma do navegador automaticamente
- Permitir troca manual via Settings

---

## 🕳️ Fill Emptys — Preencher Apenas Campos Vazios

**Status**: 🔲 Planejado

Adicionar modo de preenchimento seletivo que ignora campos que já possuem valor, evitando sobrescrever dados já inseridos pelo usuário.

- Nova opção no Popup: toggle "Preencher apenas campos vazios"
- Configuração persistente via Settings
- Compatível com todos os adaptadores de UI (Ant Design, Select2, etc.)

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

## 💬 Melhorar Feedback ao Usar Gemini Nano

**Status**: 🔲 Planejado

Atualmente o usuário não recebe nenhum retorno visual enquanto o Gemini Nano está processando, o que pode dar a impressão de que a extensão travou.

- Indicador de loading no Popup e no Floating Panel durante geração com AI
- Mensagem de status: "Gerando com Gemini Nano…"
- Toast/notificação ao concluir ou em caso de falha
- Indicar visualmente quais campos foram preenchidos via AI (badge diferenciado)
- Timeout configurável com fallback transparente para o pipeline padrão

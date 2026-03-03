
### Política de Privacidade — Fill All

**Última atualização**: fevereiro de 2026

#### Resumo

O Fill All não coleta, armazena em servidores, transmite nem compartilha nenhum dado pessoal do usuário. Todo processamento ocorre exclusivamente no dispositivo do usuário.

#### Dados armazenados localmente

A extensão armazena os seguintes dados **apenas localmente** no `chrome.storage.local` do dispositivo do usuário:

- Configurações e preferências da extensão
- Regras de preenchimento configuradas pelo usuário
- Templates de formulários salvos pelo usuário
- Cache de detecção de campos por URL
- Dataset de treinamento customizado (se o usuário adicionar amostras)
- Modelo TensorFlow.js treinado (se o usuário realizar treinamento)

Esses dados **nunca** são enviados para servidores externos, nunca são acessados por terceiros e só podem ser acessados pela própria extensão Fill All no dispositivo onde foram criados.

#### Dados que a extensão NÃO coleta

- Histórico de navegação
- Conteúdo das páginas visitadas
- Dados digitados pelo usuário
- Informações pessoais de qualquer natureza
- Localização geográfica
- Qualquer dado de telemetria ou Analytics

#### Inteligência Artificial

O Fill All usa dois sistemas de IA, ambos rodando 100% localmente:

- **TensorFlow.js**: Modelo incluído no pacote da extensão, executado no browser
- **Chrome Built-in AI (Gemini Nano)**: Modelo gerenciado pelo próprio Google Chrome, executado localmente sem conexão com internet

Nenhum dado é enviado para APIs externas de IA.

#### Permissões utilizadas

- `storage`: Salvar configurações localmente no dispositivo
- `activeTab`: Acessar a aba ativa quando o usuário aciona o preenchimento
- `scripting`: Injetar content script para detectar e preencher campos
- `contextMenus`: Adicionar opção no menu de botão direito
- `tabs`: Obter ID e URL da aba ativa para roteamento de mensagens
- `<all_urls>` (host): Operar em qualquer site onde o usuário acionar o preenchimento

#### Contato

Para dúvidas sobre privacidade: [github.com/marcuspmd/fill-all/issues](https://github.com/marcuspmd/fill-all/issues)
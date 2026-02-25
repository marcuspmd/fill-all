# Fill All — Chega de Perder Tempo Preenchendo Formulário

> **A extensão gratuita para Chrome que preenche qualquer formulário automaticamente em menos de 1 segundo — com dados brasileiros válidos, inteligência artificial e zero configuração.**

---

## Você já perdeu tempo assim?

Imagina a cena: você está tentando criar uma conta num site, testar um sistema, ou cadastrar algo pela décima vez hoje. O formulário aparece na tela com dezenas de campos:

- Nome completo
- CPF
- Data de nascimento
- Endereço completo
- CEP
- Telefone com DDD
- E-mail
- Senha
- Confirmar senha
- …e mais 15 campos.

Você suspira. Começa a digitar. Erra o CPF (o sistema rejeita CPFs inválidos). Volta. Digita de novo. Esquece o DDD. Volta. Descobre que o CEP precisa de hífen. Até terminar, passou 4 minutos em algo que deveria levar 10 segundos.

**Isso acaba agora.**

Com o Fill All, você aperta **um único botão** — ou usa o atalho de teclado — e todos os campos do formulário são preenchidos instantaneamente, com dados válidos, no formato certo, sem você digitar uma única letra.

---

## O que é o Fill All?

Fill All é uma **extensão gratuita para o navegador Google Chrome** que preenche formulários web automaticamente usando inteligência artificial.

Diferente de soluções genéricas que apenas "memorizam" o que você digitou antes, o Fill All é inteligente: ele **lê o formulário**, entende o que cada campo precisa, e **gera os dados corretos** para aquela situação — CPF com dígito verificador válido, telefone com DDD real, CNPJ que passa na validação, endereço com CEP no formato certo.

Tudo isso sem você precisar fazer nada além de clicar uma vez.

É como ter um assistente invisível que fica ao seu lado o tempo todo, pronto para preencher qualquer formulário no lugar de você, a qualquer momento.

---

## Para quem é o Fill All?

### Você usa computador no trabalho? Fill All é para você.

Qualquer pessoa que passa parte do dia preenchendo formulários online vai sentir a diferença imediatamente. Não importa a área nem o nível técnico — se você usa o Chrome e preenche formulários, o Fill All vai te poupar tempo todo dia.

---

### Desenvolvedores e Programadores

Se você desenvolve sistemas web, sabe como é: você cria uma tela de cadastro, precisa testar se está funcionando, e tem que preencher o mesmo formulário 20, 30, 50 vezes durante o desenvolvimento.

Com o Fill All, esse processo virou uma questão de um atalho de teclado. `Alt+Shift+F` e pronto — o formulário inteiro está preenchido com dados válidos, pronto para clicar em "Enviar" e ver se o sistema funciona.

**Quantas horas por semana você gasta preenchendo formulários de teste?** Com o Fill All, esse número vai a zero.

---

### QAs e Testadores de Software

Profissionais de qualidade de software (QA) são talvez os maiores beneficiados do Fill All. Um QA que está validando um sistema de e-commerce pode precisar criar 50 pedidos de teste em um dia. Com o Fill All:

- Cada pedido leva segundos para preencher
- Os dados são sempre válidos (sem erros de validação que atrapalham o teste)
- É possível configurar regras específicas — por exemplo, "nesse sistema, o CPF de teste sempre é esse"
- A equipe inteira usa os mesmos dados padronizados

---

### Empreendedores e Donos de Negócio

Você precisa cadastrar sua empresa em portais de fornecedores, preencher formulários de contratação, registrar produtos em marketplaces, fazer cadastros em sistemas governamentais... A lista não acaba.

O Fill All preenche esses formulários por você. Para os dados fixos (seu CNPJ, seu endereço, seu telefone), você salva uma vez e reutiliza em qualquer site com um clique.

---

### Estudantes e Pesquisadores

Precisando criar múltiplas contas para testar alguma coisa? Preenchendo formulários de pesquisa repetidamente? O Fill All elimina a fricção de qualquer processo que envolva formulários web.

---

### Qualquer Pessoa que Usa a Internet

Cadastros em sites de e-commerce, portais governamentais, aplicativos de delivery, sistemas bancários, formulários de contato — o Fill All funciona em **qualquer formulário web** aberto no Chrome.

---

## Como funciona? (Explicado de forma simples)

Você não precisa entender nada de tecnologia para usar o Fill All. Mas se você quer entender o que acontece "por baixo dos panos", aqui está uma explicação sem jargões:

### Passo 1: Você abre um formulário qualquer

Um formulário de cadastro, uma página de checkout, um sistema de RH — qualquer coisa com campos para preencher.

### Passo 2: O Fill All "lê" o formulário

Assim como um humano olha para um campo e pensa "esse é o campo de CPF", o Fill All analisa cada campo automaticamente. Ele olha para o texto do label ("Informe seu CPF"), o nome do campo no código ("cpf", "document"), o tipo do campo (numérico, texto, etc.) e várias outras pistas.

Essa análise usa **inteligência artificial com TensorFlow.js** — a mesma tecnologia usada em reconhecimento de voz e imagens, adaptada para entender formulários. Toda essa análise acontece no seu próprio computador, sem enviar nada para a internet.

### Passo 3: O Fill All gera os dados certos

Para cada campo identificado, o Fill All gera automaticamente um dado válido:

- Campo de CPF? Gera um CPF com dígito verificador matematicamente correto.
- Campo de telefone? Gera um número com DDD real de uma cidade brasileira.
- Campo de endereço? Gera uma rua, número, bairro, cidade e estado coerentes.
- Campo de e-mail? Gera um endereço de e-mail realista.

### Passo 4: Os campos são preenchidos instantaneamente

Em menos de um segundo, todos os campos do formulário estão preenchidos, prontos para você verificar e enviar.

É só isso. Um clique, tudo preenchido.

---

## Por que os dados precisam ser "válidos"?

Essa é uma pergunta importante. Não basta colocar "12345678901" num campo de CPF — a maioria dos sistemas brasileiros valida o CPF usando um algoritmo matemático específico da Receita Federal.

Se o CPF não tiver os dois dígitos verificadores calculados corretamente, o sistema rejeita imediatamente com um erro. O mesmo vale para CNPJ, PIS, e outros documentos brasileiros.

O Fill All **calcula corretamente os dígitos verificadores** de todos esses documentos, garantindo que os dados gerados passem nas validações dos sistemas. Não é magia — é matemática, aplicada automaticamente para você.

Da mesma forma:

- **Telefones** são gerados com DDDs que realmente existem no Brasil (os códigos de área são atribuídos pela ANATEL)
- **CEPs** seguem os intervalos reais por estado
- **Nomes** são nomes brasileiros reais, não sequências aleatórias de letras
- **E-mails** têm formato válido com domínios reais
- **Datas** são datas que existem no calendário, com dia/mês/ano coerentes

---

## Inteligência Artificial: o cérebro do Fill All

O que diferencia o Fill All de qualquer outra solução de preenchimento automático é a inteligência com que ele identifica o que cada campo espera receber.

### O problema que a IA resolve

Imagine um campo assim:

```
[ Insira seu documento ] _______________
```

Esse campo pode ser CPF, CNPJ, RG, CNH, Título de Eleitor — qualquer documento. Um simples autocomplete que memoriza o que você digitou antes não tem como saber o que inserir. Mas o Fill All analisa o contexto ao redor do campo, o texto do label, outros campos do mesmo grupo, e usa inteligência artificial para entender que provavelmente é um campo de CPF ou CNPJ — e escolhe o mais adequado.

### Três camadas de inteligência

O Fill All usa três níveis de análise, do mais simples ao mais sofisticado:

**1. Análise do HTML** — A primeira coisa que o Fill All faz é verificar os atributos nativos do campo. Um desenvolvedor que escreveu `type="email"` está dizendo explicitamente que aquele campo é de e-mail. O Fill All respeita isso com certeza absoluta.

**2. Análise por palavras-chave** — O Fill All tem um dicionário extenso de palavras-chave em português e inglês associadas a cada tipo de campo. "CPF", "CNPJ", "nascimento", "celular", "cep", "senha" — quando essas palavras aparecem no label ou no código do formulário, o Fill All identifica o campo imediatamente.

**3. Rede Neural com TensorFlow.js** — Para campos ambíguos, onde as pistas simples não são suficientes, o Fill All usa uma rede neural treinada com centenas de exemplos de formulários brasileiros reais. Essa rede aprende padrões sutis que um simples dicionário de palavras não conseguiria capturar.

**4. Chrome Built-in AI (Gemini Nano)** — Para quem usa Chrome 131 ou superior, é possível ativar o Gemini Nano — um modelo de linguagem que roda diretamente no seu computador (sem internet). Ele entende linguagem natural e consegue classificar até os campos mais ambíguos com alta precisão.

### Tudo acontece no seu computador

É importante deixar claro: **toda a inteligência artificial do Fill All roda localmente no seu computador**. Nenhum dado do formulário é enviado para servidores externos, nenhuma informação sai do seu navegador. Sua privacidade está completamente protegida.

---

## Funcionalidades em Detalhes

### Preenchimento com Um Clique ou Atalho

A forma mais rápida de usar o Fill All é pelo atalho de teclado:

- **Windows/Linux**: `Alt + Shift + F`
- **Mac**: `Cmd + Shift + F`

Pressione o atalho em qualquer página com formulário e o Fill All age imediatamente. Você também pode clicar no ícone da extensão na barra do Chrome e usar os botões da interface.

---

### Formulários Salvos — Seus Dados, Sempre à Mão

Você tem dados que usa com frequência? Seu CPF, seu endereço, seu e-mail de trabalho? Configure uma vez, e o Fill All guarda tudo para você.

Funciona assim:
1. Preencha um formulário com seus dados reais (ou os dados que você usa frequentemente)
2. Clique em "Salvar Formulário" no Fill All
3. Da próxima vez que visitar uma página similar, seu formulário salvo aparece como opção

É como um gerenciador de senhas, mas para formulários inteiros. E tudo fica guardado localmente no seu computador, nunca sai para a nuvem.

---

### Regras por Site — Controle Completo

Para casos onde você precisa de um comportamento específico em um determinado site, o Fill All oferece um sistema de regras. Você pode, por exemplo:

- "Nesse site específico, o campo CPF sempre deve ter o valor 123.456.789-09"
- "Nesse campo específico, sempre usar um CNPJ em vez de CPF"
- "Esse campo aqui deve ser ignorado — nunca preencher automaticamente"

As regras funcionam por padrão de URL (o site) e por seletor do campo. Uma vez configurada, a regra é aplicada automaticamente toda vez que você visita aquele site.

Isso é especialmente valioso para **empresas que usam o Fill All em equipe**: todas as pessoas do time podem ter as mesmas regras configuradas, garantindo dados padronizados nos testes.

---

### Campos Inteligentes para SPAs e Aplicativos Modernos

Os aplicativos web modernos (feitos com React, Vue, Angular e similares) funcionam diferente dos sites antigos: os formulários aparecem e desaparecem dinamicamente conforme você interage, sem recarregar a página.

O Fill All tem um **detector automático de novos campos** que monitora a página em tempo real. Quando um formulário aparece após um clique ou carregamento, o Fill All detecta imediatamente e pode preenchê-lo automaticamente — sem você precisar apertar o botão de novo.

---

### Suporte a Componentes de Design Modernos

Muitos sistemas usam componentes de interface sofisticados que não são os campos padrão do navegador — seletores estilizados, calendários customizados, sliders visuais. Esses componentes normalmente "enganam" ferramentas de preenchimento automático simples.

O Fill All tem suporte especializado para os componentes mais populares do mercado, incluindo toda a biblioteca **Ant Design** (amplamente usada em sistemas corporativos brasileiros) e **Select2**. Isso garante funcionamento mesmo em sistemas internos complexos.

---

### Painel de Controle In-Page

Além do ícone na barra do Chrome, o Fill All oferece um **painel flutuante que aparece diretamente na página**. Esse painel pode ser movido para qualquer canto da tela, minimizado quando não está sendo usado, e permite:

- Preencher todos os campos com um clique
- Ver quais campos foram detectados e com que tipo
- Aplicar um formulário salvo
- Ver o log de operações da sessão

Especialmente útil para quem usa o Fill All intensivamente e precisa de controle rápido sem abrir o popup da extensão.

---

### Painel de Desenvolvedor (DevTools)

Para usuários mais avançados, o Fill All adiciona uma aba no **Chrome DevTools** (a ferramenta de desenvolvimento que você abre com F12). Nessa aba, você vê:

- Todos os campos detectados com seus tipos e scores de confiança
- Qual método de inteligência artificial foi usado em cada campo
- Log detalhado de todas as operações
- Ferramentas para inspecionar e corrigir classificações incorretas

---

## Dados que o Fill All Gera

Aqui está uma amostra dos tipos de dados que o Fill All gera automaticamente:

### Documentos Brasileiros

| Tipo | Exemplo |
|------|---------|
| CPF | 234.567.890-12 |
| CNPJ | 12.345.678/0001-95 |
| RG | 12.345.678-9 |
| CNH | 12345678901 |
| PIS/PASEP | 123.45678.90-1 |
| Passaporte | AB123456 |

*Todos com cálculo correto de dígitos verificadores — passam em qualquer validação.*

---

### Dados Pessoais

| Tipo | Exemplo |
|------|---------|
| Nome completo | João Carlos Silva |
| Primeiro nome | Maria |
| Sobrenome | Oliveira |
| Nome de empresa | TechSol Soluções LTDA |

*Nomes realistas da cultura brasileira — não parecem inventados.*

---

### Contato

| Tipo | Exemplo |
|------|---------|
| E-mail | joao.silva42@gmail.com |
| Celular | (11) 98765-4321 |
| Telefone fixo | (11) 3456-7890 |
| WhatsApp | (21) 99876-5432 |

*Telefones com DDDs reais, e-mails com formato válido.*

---

### Endereço

| Tipo | Exemplo |
|------|---------|
| Rua | Rua das Flores |
| Número | 1234 |
| Complemento | Apto 501 |
| Bairro | Centro |
| Cidade | São Paulo |
| Estado | SP |
| CEP | 01234-567 |

*CEPs no intervalo real da UF, cidades e estados coerentes.*

---

### Financeiro

| Tipo | Exemplo |
|------|---------|
| Número do cartão | 4532 1234 5678 9012 |
| Validade | 12/28 |
| CVV | 123 |
| Chave PIX | joao.silva@email.com |
| Valor monetário | R$ 1.234,56 |

*Números de cartão válidos pelo algoritmo Luhn (padrão internacional).*

---

### Datas

| Tipo | Exemplo |
|------|---------|
| Data de nascimento (adulto) | 1985-07-22 |
| Data de vencimento (futuro) | 2028-06-15 |
| Data genérica | 15/03/2024 |

---

### Autenticação

| Tipo | Exemplo |
|------|---------|
| Senha | aB3$xK9!mP2@ |
| Username | joao_silva_42 |
| Código OTP | 847291 |
| Código de verificação | 583017 |

---

### Mais de 80 Tipos de Campo

No total, o Fill All reconhece e preenche mais de **80 tipos diferentes de campos**, incluindo URLs, IPs, códigos de produto (SKU), cupons de desconto, cargos profissionais, departamentos, textos genéricos, e muito mais.

---

## Comparando Fill All com Outras Opções

### Por que não usar o autocomplete do navegador?

O autocomplete nativo do Chrome memoriza o que você digitou antes e sugere repetir. Funciona bem para *seus* dados pessoais. Mas:

- Ele não gera dados novos — só repete o que você já colocou
- Para testes, você precisa de dados *diferentes* a cada vez
- Ele não entende contexto — às vezes sugere e-mail onde deveria ir CPF
- Para dados como CPF e CNPJ, ele não valida se o dado é matematicamente correto

### Por que não usar um gerador online de CPF/CNPJ?

Existem sites que geram CPF, CNPJ e outros documentos. Mas:

- Você precisa abrir um site separado
- Preencher um campo de cada vez, copiando e colando
- Para um formulário com 20 campos, são 20 visitas a diferentes sites geradores
- Você continua digitando manualmente

O Fill All faz tudo de uma vez, sem sair da página.

### Por que não usar extensões de autocomplete genéricas?

Extensões que memorizam formulários e preenchem automaticamente geralmente:

- Só funcionam em sites onde você já preencheu antes
- Não geram dados novos
- Não entendem formulários que nunca viram
- Não geram documentos brasileiros válidos

O Fill All foi feito especificamente para o contexto brasileiro, com geração de dados, não apenas memorização.

---

## Segurança e Privacidade

Sabemos que a palavra "preenchimento automático" pode levantar preocupações sobre segurança. Por isso, o Fill All foi construído com privacidade como prioridade máxima.

### Seus Dados Nunca Saem do Seu Computador

**Nenhum dado é enviado para a internet.** O Fill All funciona 100% offline:

- A inteligência artificial (TensorFlow.js) roda no seu próprio computador
- O Gemini Nano (Chrome AI) roda localmente, sem conexão com servidores Google
- Seus formulários salvos ficam no seu Chrome, não em nenhum servidor externo
- Suas regras e configurações ficam localmente no seu navegador

### Permissões Mínimas

O Fill All solicita apenas as permissões estritamente necessárias:

- **Armazenamento local**: para salvar suas configurações, regras e formulários
- **Aba ativa**: para preencher o formulário na página que você está visitando
- **Menu de contexto**: para adicionar a opção "Fill All" no clique direito
- **Atalhos de teclado**: para o atalho `Alt+Shift+F`

O Fill All **não tem permissão** para ler dados de outras abas, acessar suas senhas salvas no Chrome, fazer requisições para servidores externos, ou acessar qualquer coisa além do formulário na aba atual.

### Código Aberto

O código-fonte completo do Fill All está disponível publicamente no GitHub. Qualquer pessoa com conhecimento técnico pode inspecionar exatamente o que a extensão faz — não há nada escondido. A transparência total é nossa política de privacidade mais forte.

---

## Instalação em 3 Passos

### É mais fácil do que parece

**Passo 1**: Acesse o repositório do projeto no GitHub e faça o download dos arquivos

**Passo 2**: Abra o Chrome e acesse `chrome://extensions/` na barra de endereços

**Passo 3**: Ative o "Modo do desenvolvedor" (canto superior direito), clique em "Carregar sem compactação" e selecione a pasta baixada

Pronto. O ícone do Fill All aparecerá na barra de ferramentas do Chrome.

### Não precisa de conta, não precisa de e-mail, não precisa pagar nada.

A extensão é **100% gratuita** e de código aberto. Sem assinaturas, sem planos premium, sem limitações de uso. É uma ferramenta feita pela comunidade, para a comunidade.

---

## Começando a usar: seu primeiro preenchimento

Após instalar, veja como usar pela primeira vez:

### Opção 1 — O atalho mais rápido

1. Abra qualquer site com um formulário
2. Pressione `Alt+Shift+F` (Windows/Linux) ou `Cmd+Shift+F` (Mac)
3. Veja o formulário ser preenchido automaticamente

### Opção 2 — Pelo ícone da extensão

1. Abra qualquer site com um formulário
2. Clique no ícone do Fill All na barra do Chrome
3. Clique em "Fill All Fields"

### Opção 3 — Menu de contexto (botão direito)

1. Abra qualquer site com um formulário
2. Clique com o botão direito em qualquer parte da página
3. Clique em "Fill All — Preencher Formulário"

---

## Configurações Avançadas (para quando você quiser ir mais fundo)

O Fill All funciona muito bem sem nenhuma configuração. Mas para quem quer personalizar, a **Options Page** oferece controle total:

### Configurações Gerais

- **Habilitar/desabilitar Chrome AI**: Escolha se quer usar o Gemini Nano para campos ambíguos
- **Pipeline de detecção**: Escolha quais métodos de detecção usar e em que ordem
- **Auto-fill em novos campos**: Preencher automaticamente quando um formulário aparece na tela (útil para SPAs)
- **Mostrar ícones nos campos**: Ativar/desativar os badges visuais de tipo de campo

### Regras por Site

Configure comportamentos específicos para sites específicos:

1. Clique na aba "Rules" na Options Page
2. Clique em "Nova Regra"
3. Informe o padrão de URL (ex: `https://sistema.empresa.com/*`)
4. Escolha o campo (pelo seletor CSS gerado automaticamente)
5. Configure o comportamento: valor fixo, gerador específico, ou ignorar

### Formulários Salvos

1. Preencha manualmente um formulário com os dados que você quer salvar
2. Clique no ícone do Fill All
3. Clique em "Save Form" e dê um nome ao template
4. Da próxima vez no mesmo site, selecione o template no popup

---

## Para Equipes e Empresas

O Fill All pode ser usado individualmente ou como ferramenta de equipe. Em ambientes corporativos, o uso em equipe traz benefícios adicionais:

### Padronização de Dados de Teste

Em times de desenvolvimento e QA, uma das maiores fontes de inconsistência nos testes é cada pessoa usando dados diferentes. Com o Fill All, é possível exportar as regras configuradas e compartilhar com toda a equipe via JSON. Assim, todos usam os mesmos CPFs de teste, os mesmos endereços padronizados, e os mesmos conjuntos de dados.

### Onboarding Acelerado

Novos membros da equipe que precisam testar sistemas complexos geralmente passam horas descobrindo "qual CPF usar nesse campo" ou "qual formato o CEP precisa ter nesse sistema". Com as regras do Fill All compartilhadas, o onboarding fica muito mais rápido.

### Cobertura de Testes Mais Ampla

Com o preenchimento de formulários reduzido a um clique, fica muito mais fácil testar com dados variados. O Fill All gera dados diferentes a cada uso (quando não há valor fixo configurado), o que significa que cada teste usa um conjunto de dados novo — cobrindo mais casos de uso automaticamente.

### Treinamento de Modelo Customizado

Para empresas com sistemas muito específicos, o Fill All oferece a possibilidade de treinar um modelo de inteligência artificial personalizado com exemplos do próprio sistema da empresa. Isso melhora ainda mais a precisão da classificação de campos nos sistemas internos.

---

## Casos de Uso Populares

### "Preciso testar meu sistema de cadastro de clientes"

**Sem o Fill All**: Preencher manualmente dezenas de campos, inventar CPFs válidos, conferir se os formatos estão certos, repetir para cada teste.

**Com o Fill All**: `Alt+Shift+F`. Pronto. Repita quantas vezes precisar em segundos.

---

### "Preciso criar 50 pedidos de teste no nosso sistema de e-commerce"

**Sem o Fill All**: Meia hora de digitação monótona, dados inconsistentes entre pedidos, risco de erros de digitação.

**Com o Fill All**: Configure uma regra com o CPF de teste padrão da empresa, deixe o resto ser gerado automaticamente. 50 pedidos em 5 minutos, dados consistentes.

---

### "Preciso me cadastrar em vários fornecedores com os dados da minha empresa"

**Sem o Fill All**: Digite seu CNPJ, razão social, endereço, telefone, e-mail repetidamente em cada portal.

**Com o Fill All**: Salve seus dados empresariais uma vez como "Formulário Empresa". Em cada portal de fornecedor, aplique o template salvo com um clique.

---

### "Faço testes de penetração e preciso testar validações de formulários"

**Sem o Fill All**: Geração manual de payloads de teste, necessidade de ferramentas especializadas.

**Com o Fill All**: Geração automatizada de dados válidos de várias categorias para teste rápido de múltiplos campos. (Para uso ético e autorizado.)

---

### "Preciso preencher formulários governamentais regularmente"

**Sem o Fill All**: Mesmos dados digitados repetidamente em cada sistema diferente.

**Com o Fill All**: Um template por tipo de formulário. Aplicação imediata em qualquer portal.

---

### "Tenho um startup e preciso popular meu banco de dados com dados de teste"

**Sem o Fill All**: Geração manual de seeds, scripts customizados, dados não realistas.

**Com o Fill All**: Formulário de cadastro preenchido automaticamente com dados realistas. Popule seu banco de dados de desenvolvimento de forma rápida e eficiente.

---

## Perguntas Frequentes

### O Fill All funciona em qualquer site?

Sim. O Fill All funciona em qualquer site aberto no Chrome que tenha campos de formulário — seja um marketplace, sistema bancário, portal governamental, sistema interno ou qualquer outra página web.

Alguns sites têm proteções específicas que podem dificultar ou impedir o preenchimento automático. Isso é incomum, mas pode acontecer em sistemas com segurança muito reforçada.

---

### O Fill All funciona com formulários de login (usuário e senha)?

Sim, o Fill All detecta campos de senha e pode preenchê-los com uma senha gerada. No entanto, para formulários de login em sistemas reais (não de teste), o ideal é usar junto com um gerenciador de senhas — o Fill All complementa, não substitui.

---

### Os dados gerados são reais? Posso usá-los para criar cadastros reais?

**Não.** Os dados são matematicamente válidos (passam nas validações dos sistemas) mas são completamente sintéticos. Um CPF gerado pelo Fill All não existe na base da Receita Federal, um endereço gerado não corresponde a nenhum endereço real dos Correios.

O Fill All é feito para testes, desenvolvimento e automação de formulários onde dados reais não são necessários. Usar dados gerados para criar cadastros fraudulentos em sistemas reais é ilegal e não autorizado.

---

### Precisa de internet para funcionar?

Não. O Fill All funciona 100% offline. A IA, os geradores de dados e todas as funcionalidades funcionam sem nenhuma conexão com a internet.

A única exceção é o download inicial do modelo Gemini Nano (para quem ativa o Chrome AI), que é feito pelo próprio Chrome no primeiro uso e depois fica armazenado localmente.

---

### O Fill All vai preencher senhas e dados bancários que estou digitando normalmente?

Não. O Fill All **só age quando você manda** — pelo botão no popup, pelo atalho de teclado, ou pelo menu de contexto. Ele nunca preenche campos automaticamente sem sua instrução (a menos que você configure explicitamente o auto-fill, que fica desabilitado por padrão).

---

### Funciona com formulários que têm captcha?

O Fill All preenche os campos do formulário, mas não resolve captchas — isso seria contra as políticas de serviço da maioria dos sites. O Fill All preenche os campos de dados normalmente; o captcha continua sendo sua responsabilidade.

---

### Posso configurar para nunca preencher um campo específico?

Sim. A funcionalidade de "Ignored Fields" permite marcar qualquer campo para ser sempre ignorado. O campo de aceite de termos de uso, por exemplo, é algo que a maioria dos usuários prefere marcar manualmente após ler — o Fill All respeita isso.

---

### Funciona no Arc, Brave, Edge?

O Fill All foi desenvolvido especificamente para o Google Chrome com Manifest V3. Navegadores baseados no Chromium (como Brave e Edge) geralmente são compatíveis, mas o suporte oficial é para o Chrome. O Arc browser tem suporte a extensões Chrome, mas pode haver limitações.

---

### E se o Fill All classificar um campo errado?

Se um campo for classificado com o tipo errado, você pode:

1. Clicar no badge visual do campo e corrigir o tipo
2. Configurar uma regra para esse campo específico nesse site
3. Reportar a classificação incorreta para que o modelo melhore

A maioria dos campos comuns é classificada corretamente. Campos ambíguos ou incomuns podem ocasionalmente precisar de ajuste manual.

---

### Posso importar/exportar minhas configurações?

Sim. As regras e os formulários salvos podem ser exportados em formato JSON pela Options Page e importados em outro computador ou compartilhados com colegas.

---

## Requisitos Técnicos

Para usar o Fill All, você precisa de:

- **Google Chrome 128 ou superior** (já inclui a grande maioria das versões atuais)
- **Sistema operacional**: Windows 10+, macOS 10.15+ ou Linux
- Nenhum software adicional — nenhuma instalação de Python, Java ou qualquer outra dependência

Para a funcionalidade de Chrome Built-in AI (opcional):
- **Google Chrome 131 ou superior**
- Computador com hardware suficiente para rodar modelos de linguagem localmente (geralmente 8GB+ de RAM)

---

## Roadmap — O que vem por aí

O Fill All está em desenvolvimento ativo. Aqui estão algumas funcionalidades planejadas para versões futuras:

### Em Desenvolvimento

- **Sincronização via GitHub Gist**: Para quem quer ter suas configurações em múltiplos computadores, com controle total
- **Modo empresa**: Configurações centralizadas distribuídas para toda a equipe via arquivo de configuração compartilhado
- **Histórico de preenchimentos**: Ver e reverter o que foi preenchido em uma sessão anterior
- **Integração com APIs de geração**: Para quem precisa de dados ainda mais realistas e vinculados a banco de dados reais de teste

### Planejado

- **Suporte a mais bibliotecas de UI**: Material-UI, Chakra UI, Shadcn/ui, PrimeNG
- **Gerador de UUID**: Para campos de ID técnico
- **Dados internacionais**: Suporte a documentos e formatos de outros países (para produtos globais)
- **Plugin para Firefox**: Versão para Mozilla Firefox

---

## Contribuindo com o Projeto

O Fill All é um projeto de código aberto e crescimento colaborativo. Você pode contribuir de várias formas, mesmo sem saber programar:

### Como Usuário Comum

- **Reporte bugs**: Se algo não funcionar como esperado, abra uma issue no GitHub
- **Sugira melhorias**: Tem uma ideia de funcionalidade? Abra uma issue com sua sugestão
- **Compartilhe**: Indique o Fill All para colegas desenvolvedores e testadores
- **Estrele no GitHub**: Ajuda o projeto a ganhar visibilidade

### Como Desenvolvedor

- **Corrija bugs**: Veja as issues abertas e contribua com correções
- **Adicione geradores**: Crie geradores para novos tipos de dados
- **Adicione adaptadores**: Suporte a novas bibliotecas de UI
- **Melhore o dataset**: Adicione exemplos de campos para melhorar a IA
- **Melhore a documentação**: Ajude mais pessoas a entenderem e usarem o projeto

### Como QA / Tester

- **Teste em sistemas variados**: Reporte formulários que não funcionam
- **Contribua com o dataset**: Adicione exemplos de campos específicos do seu contexto
- **Documente casos de uso**: Escreva casos de uso para diferentes tipos de sistema

---

## Histórias de Uso Real

### "Economizei 2 horas hoje"

Um desenvolvedor que trabalha em um sistema de gestão escolar relata: "Nosso sistema tem um cadastro de aluno com 35 campos. Antes do Fill All, eu passava em média 4 minutos em cada cadastro de teste. Hoje fiz 30 cadastros enquanto testava um bug e levei menos de 5 minutos no total. São 2 horas que eu teria passado digitando CPF, nome, endereço, responsável, e mais 30 campos repetidamente."

### "Minha equipe de QA agora testa 3x mais"

Uma coordenadora de QA em uma fintech: "A gente tem 12 testadores. Cada um fazia em média uns 50 testes por dia que envolviam preenchimento de formulários. Hoje, com o Fill All, esse número passou para uns 150. Não mudou nada no nosso processo além de instalar a extensão."

### "Finalmente consigo demonstrar o sistema para clientes"

Um dono de software house: "Quando vou demonstrar o sistema para clientes, eu precisava ter dados pré-prontos ou ficava parecendo amador digitando lentamente durante a demo. Agora eu encho qualquer tela de cadastro em um segundo e o cliente fica impressionado. Parece que o sistema já está cheio de dados."

---

## Comparação de Tempo: Antes e Depois

### Formulário de Cadastro Simples (15 campos)

| Ação | Sem Fill All | Com Fill All |
|------|-------------|-------------|
| Preencher todos os campos | ~3 minutos | ~1 segundo |
| Conferir se dados são válidos | ~1 minuto | 0 (automático) |
| Segunda tentativa (com dados diferentes) | ~3 minutos | ~1 segundo |
| **Total para 10 testes** | **~40 minutos** | **~10 segundos** |

### Formulário Complexo (40 campos — checkout de e-commerce)

| Ação | Sem Fill All | Com Fill All |
|------|-------------|-------------|
| Preencher todos os campos | ~8 minutos | ~1 segundo |
| Retrabalho por dados inválidos | ~2 minutos | 0 |
| **Total para 10 testes** | **~100 minutos** | **~10 segundos** |

---

## A Matemática do Tempo Poupado

Se você preenche formulários apenas **10 minutos por dia** (uma estimativa conservadora para desenvolvedores e testadores), em um ano de trabalho isso soma:

- **10 min/dia × 22 dias úteis × 12 meses = 2.640 minutos = 44 horas por ano**

São **44 horas de trabalho** gastas digitando formulários. Uma semana e meia inteira de trabalho, todo ano.

Com o Fill All, esse tempo vai a praticamente zero. E o melhor: um clique em vez de 8 minutos significa que você pode testar mais cenários, com mais variações, sem o cansaço mental de ter que digitar tudo de novo.

---

## Stack Tecnológica (Para os Curiosos)

Se você quer saber com quais tecnologias o Fill All foi construído:

| O que faz | Tecnologia |
|-----------|-----------|
| Linguagem de programação | TypeScript (modo strict) |
| Build | Vite 7.3 |
| Inteligência Artificial no browser | TensorFlow.js 4.22 |
| IA de Linguagem Natural | Chrome Prompt API (Gemini Nano) |
| Validação de dados | Zod v4 |
| Plataforma | Chrome Extension Manifest V3 |
| Código | 100% aberto no GitHub |

---

## Por Que o Fill All é Diferente

Existem outras extensões de preenchimento automático para Chrome. Aqui está por que o Fill All se destaca:

**1. Feito para o Brasil**: Documentos brasileiros com validação real, endereços em ABNT, telefones com DDDs brasileiros. Não é uma ferramenta genérica internacional adaptada — é feita do zero para o contexto BR.

**2. Inteligência Artificial Real**: Não é um autocomplete glorificado. É uma rede neural treinada + opcionalmente um LLM local que entende contexto e semântica de formulários.

**3. Gera dados novos, não repete velhos**: Cada preenchimento pode ter dados diferentes. Ideal para testes onde você não quer sempre o mesmo conjunto de dados.

**4. Privacidade total**: Zero dados saem do seu computador. A IA roda localmente. Seu histórico de formulários é só seu.

**5. Personalizável até o limite**: Sistema de regras, formulários salvos, modelo treinável, pipeline configurável. Para quem precisa de controle total, está tudo disponível.

**6. Gratuito e aberto**: Sem assinatura, sem limitações, sem dados coletados. Código 100% visível no GitHub.

---

## Licença e Uso Responsável

O Fill All é distribuído sob a **Licença MIT**, uma das licenças de software livre mais permissivas. Isso significa:

- Você pode usar livremente, sem pagar nada
- Você pode modificar para suas necessidades
- Você pode usar em projetos comerciais
- Você não precisa compartilhar suas modificações

**Uso responsável**: O Fill All é uma ferramenta para produtividade legítima — desenvolvimento, testes e automação pessoal autorizada. Use-o de forma ética e dentro das políticas de uso de cada site que você visita.

---

## Comece Agora

O Fill All está a um download de distância. Sem cadastro, sem cartão de crédito, sem nenhuma burocracia.

1. Acesse o repositório no GitHub: **github.com/marcuspmd/fill-all**
2. Faça o build (se quiser a versão mais recente) ou baixe o release
3. Instale no Chrome em menos de 2 minutos
4. Pressione `Alt+Shift+F` na próxima vez que você ver um formulário

**Seu próximo formulário será o último que você vai preencher manualmente.**

---

## Sobre o Projeto

Fill All é um projeto de código aberto desenvolvido e mantido por Marcus PMD, com contribuições da comunidade de desenvolvedores. O projeto nasceu da frustração pessoal com o tempo perdido preenchendo formulários durante desenvolvimento e testes de sistemas.

O objetivo do projeto é simples: **eliminar o trabalho manual de preenchimento de formulários** para desenvolvedores, testadores e todos que passam tempo considerável interagindo com sistemas web.

Se o Fill All te ajudou a economizar tempo, considere:
- Deixar uma estrela no repositório GitHub
- Compartilhar com colegas que podem se beneficiar
- Contribuir com código, documentação ou relatos de bugs

Juntos, construímos uma ferramenta melhor para toda a comunidade.

---

*Fill All — Porque seu tempo vale mais do que digitar CPF pela milésima vez.*

---

> **Links Importantes**
>
> - Repositório: [github.com/marcuspmd/fill-all](https://github.com/marcuspmd/fill-all)
> - Issues e Sugestões: [github.com/marcuspmd/fill-all/issues](https://github.com/marcuspmd/fill-all/issues)
> - Licença: MIT (gratuito para qualquer uso)

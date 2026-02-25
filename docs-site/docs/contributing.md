# Contribuindo — Fill All

Obrigado por considerar contribuir com o Fill All! Este guia vai te ajudar a configurar o ambiente e entender nossas convenções.

---

## Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** 9+
- **Google Chrome** 128+ (para testar a extensão)
- **Chrome 131+** se quiser testar Chrome AI (Gemini Nano)

---

## Setup do Ambiente

```bash
# 1. Clone o repositório
git clone https://github.com/user/fill-all.git
cd fill-all

# 2. Instale dependências
npm install

# 3. Build de desenvolvimento (com HMR)
npm run dev

# 4. Carregue no Chrome
# → chrome://extensions/
# → Ative "Modo de desenvolvedor" (toggle no canto superior direito)
# → "Carregar sem compactação"
# → Selecione a pasta dist/
```

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Dev | `npm run dev` | Build com HMR via Vite |
| Build | `npm run build` | Build de produção → `dist/` |
| Type Check | `npm run type-check` | Verificação de tipos (tsc --noEmit) |
| Clean | `npm run clean` | Remove `dist/` |
| Train Model | `npm run train:model` | Treina modelo TensorFlow.js |
| Import Rules | `npm run import:rules` | Importa regras exportadas para dataset |

---

## Estrutura do Projeto

```
src/
├── background/      # Service Worker (hub de mensagens)
│   └── handlers/    # Handlers de domínio (rules, storage, cache, etc.)
├── content/         # Content script (opera no DOM das páginas)
├── popup/           # Popup UI (interface rápida)
├── options/         # Options page (configurações completas)
├── devtools/        # Painel DevTools
├── lib/             # Bibliotecas core
│   ├── ai/          # Chrome AI + TensorFlow.js + learning
│   ├── form/        # Detecção e preenchimento de formulários
│   │   ├── detectors/   # Pipeline + classificadores
│   │   ├── extractors/  # Label, selector, signals extractors
│   │   └── adapters/    # Select2, Ant Design adapters
│   ├── generators/  # Geradores de dados brasileiros
│   ├── dataset/     # Dados de treinamento e avaliação
│   ├── storage/     # Wrapper sobre chrome.storage.local
│   ├── rules/       # Motor de regras
│   ├── messaging/   # Validação de mensagens (Zod + light)
│   ├── logger/      # Logger centralizado
│   ├── shared/      # N-grams, sinais estruturados, catálogo
│   ├── ui/          # Renderizadores HTML compartilhados
│   ├── url/         # URL glob matching
│   └── chrome/      # Helpers Chrome API
├── types/           # Tipos TypeScript
└── docs/            # Documentação
```

---

## Convenções de Código

### TypeScript

- **Strict mode** ativado (`strict: true`, target ES2022)
- **Sem `any` implícito** — tipagem explícita obrigatória
- Usar `@/*` para imports (ex: `import { generateCpf } from "@/lib/generators"`)
- **Nunca `export default`** — apenas named exports

### Naming

| Categoria | Padrão | Exemplo |
|-----------|--------|---------|
| Detectores/classificadores | Objetos `const` (NÃO classes) | `htmlTypeDetector` |
| Funções | `verbNoun` | `detectBasicType()`, `generateCpf()` |
| Storage | `get*`, `save*`, `delete*` | `getRulesForUrl()` |
| Tipos | `PascalCase` | `FieldType`, `FormField` |
| Constantes | `UPPER_SNAKE_CASE` | `STORAGE_KEYS`, `DEFAULT_PIPELINE` |
| Parsers | `parse*Payload()` | `parseRulePayload()` |

### Error Handling

```typescript
// ✅ Parsers — retornar null, nunca throw
export function parseRulePayload(input: unknown): FieldRule | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

// ✅ Async — sempre try-catch com logger
try {
  await loadModel();
} catch (err) {
  log.warn("Failed to load model:", err);
}

// ❌ Nunca fazer isso em storage/parsers/generators
throw new Error("Invalid data");
```

### Logger

Sempre usar `createLogger` — nunca `console.log` direto:

```typescript
import { createLogger } from "@/lib/logger";
const log = createLogger("MeuModulo");

log.debug("detalhe interno");
log.info("operação concluída");
log.warn("fallback ativado");
log.error("falha crítica", err);
```

### Validação

| Camada | Onde usar | Método |
|--------|-----------|--------|
| **Full Zod** | Background, options, caminhos críticos | Schema Zod + `safeParse()` |
| **Light** | Content script (hot paths) | Apenas `typeof` checks |

- Zod v4: usar `z.uuid()` (nunca `z.string().uuid()` — deprecated)

---

## Como Contribuir

### Novo Gerador de Dados

1. Crie o arquivo em `src/lib/generators/` (ex: `titulo-eleitor.ts`)
2. Exporte funções `generate*()` — devem ser **puras e síncronas**
3. Registre no `generatorMap` em `src/lib/generators/index.ts`
4. Adicione o tipo em `FieldType` (`src/types/index.ts`) se necessário

```typescript
// src/lib/generators/titulo-eleitor.ts
export function generateTituloEleitor(formatted = true): string {
  // Gerar título de eleitor válido
  // Retornar string formatada ou apenas dígitos
}
```

> Veja [docs/generators.md](./generators.md) para detalhes completos.

### Novo Classificador

1. Crie em `src/lib/form/detectors/strategies/`
2. Implemente a interface `FieldClassifier` como **objeto** (não classe)
3. Retorne `null` quando não tiver confiança
4. Registre em `classifiers.ts`

```typescript
// Classificador como objeto imutável
export const meuClassifier: FieldClassifier = {
  name: "meu-classifier",
  detect(field: FormField): ClassifierResult | null {
    // Retornar null se não tiver confiança
    return { type: "cpf", confidence: 0.95, method: "meu-classifier" };
  }
};
```

### Novo Adapter de Componente

1. Crie em `src/lib/form/adapters/`
2. Implemente `CustomComponentAdapter`
3. Registre no `ADAPTER_REGISTRY` em `adapter-registry.ts`

### Bug Fixes e Melhorias

1. Fork o repositório
2. Crie uma branch descritiva: `fix/campo-select-nao-preenchido` ou `feat/gerador-titulo-eleitor`
3. Faça suas alterações seguindo as convenções
4. Rode `npm run type-check` para garantir que não há erros de tipagem
5. Abra um Pull Request com descrição clara do que foi alterado

---

## Validação

Antes de enviar um PR, certifique-se de:

```bash
# Verificação de tipos
npm run type-check

# Build de produção (verifica se compila)
npm run build
```

---

## Dicas de Desenvolvimento

### Hot Reload

Com `npm run dev`, o Vite + CRXJS faz HMR automático. Porém, algumas mudanças exigem reload manual:

- **Service Worker** (`src/background/`) → Clique em "Atualizar" na página de extensões
- **Content Script** (`src/content/`) → Recarregue a página
- **Popup/Options** → Feche e reabra

### Debugging

- **Background**: `chrome://extensions/` → "Inspecionar views: service worker"
- **Content Script**: DevTools da página → Console (contexto "Fill All")
- **DevTools Panel**: DevTools → aba "Fill All"

### Chrome AI (Gemini Nano)

Para testar funcionalidades de Chrome AI:
1. Chrome 131+ necessário
2. Acesse `chrome://flags/#optimization-guide-on-device-model`
3. Defina como "Enabled BypassPerfRequirement"
4. Reinicie o Chrome e aguarde download do modelo (~1.7GB)

---

## Arquitetura de Decisão

Se a contribuição impacta arquitetura ou padrões existentes, documente:

- **O que** está mudando e **por quê**
- **Alternativas** consideradas
- **Impacto** em módulos existentes

Para mudanças significativas, abra uma Issue primeiro para discutir a abordagem.

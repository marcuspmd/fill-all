---
applyTo: 'src/lib/form/detectors/**'
description: 'Skill para criar novos detectores e classificadores de campo seguindo as convenções do projeto Fill All.'
---

# Skill: Criar Novo Detector / Classificador

## Objetivo

Guia passo a passo para criar um novo detector ou classificador de campos no projeto Fill All, seguindo a interface `FieldClassifier`, pipeline imutável e convenções de confiança.

## Conceitos

| Conceito | Descrição |
|----------|-----------|
| `Detector` | Interface genérica `Detector<TInput, TResult>` com `.name` + `.detect()` |
| `FieldClassifier` | Subtipo que classifica `FormField` → `ClassifierResult \| null` |
| `PageDetector` | Subtipo que detecta contexto da página |
| `DetectionPipeline` | Pipeline imutável que roda classificadores em ordem |
| `confidence` | Valor 0–1 indicando certeza (1 = absoluta) |

## Passo a Passo

### 1. Criar o Classificador

> **Nota**: Nos exemplos abaixo, `<nome>` é um placeholder. Substitua pelo nome real do classificador (ex: `keyword`, `tensorflow`, `chromeAi`, `pattern`).

```
src/lib/form/detectors/strategies/<nome>-classifier.ts
```

```typescript
import type { FieldClassifier, ClassifierResult } from "@/lib/form/detectors/detector.interface";
import type { FormField } from "@/types";

/**
 * Classificador que detecta <descrição>.
 * Analisa <sinais utilizados>.
 */
export const <nome>Classifier: FieldClassifier = {
  name: "<nome>-classifier",

  detect(field: FormField): ClassifierResult | null {
    // 1. Extrair sinais do campo
    const signals = field.signals ?? "";

    // 2. Analisar sinais
    // ...

    // 3. Retornar null se sem confiança
    if (!match) {
      return null;
    }

    // 4. Retornar resultado com confidence
    return {
      type: "<field-type>",
      confidence: 0.8,
      method: "<nome>-classifier",
    };
  },
};
```

#### Regras Obrigatórias

| Regra | Detalhe |
|-------|---------|
| Objeto `const` | Nunca classe — usar objeto com `.name` + `.detect()` |
| Nome único | `.name` é usado pela pipeline para reordenação |
| Retornar `null` | Quando não tiver confiança — nunca forçar resultado |
| Confidence 0–1 | 0 = nenhuma, 0.5 = moderada, 0.8 = alta, 1.0 = certeza absoluta |
| Sem side effects | `.detect()` é puro — sem I/O, sem mutação |
| Sem throw | Retornar `null` em caso de erro |
| Named export | Nunca `export default` |

### 2. Registrar no Registry de Classificadores

Arquivo: `src/lib/form/detectors/classifiers.ts`

```typescript
import { <nome>Classifier } from "./strategies/<nome>-classifier";

// Adicionar ao array ALL_CLASSIFIERS
export const ALL_CLASSIFIERS: FieldClassifier[] = [
  // ... existentes
  <nome>Classifier,
];
```

### 3. (Opcional) Adicionar à Pipeline Padrão

Se o classificador deve ser parte do pipeline padrão:

```typescript
// Em classifiers.ts — adicionar ao DEFAULT_PIPELINE
export const DEFAULT_PIPELINE = new DetectionPipeline([
  htmlTypeDetector,
  // ... existentes
  <nome>Classifier,  // Posição importa — pipeline roda em ordem
]);
```

> ⚠️ A posição na pipeline define prioridade. Classificadores mais específicos devem vir antes dos genéricos.

### 4. (Opcional) Suporte Async

Se o classificador precisa de operações assíncronas (ex: Chrome AI, API):

```typescript
export const <nome>Classifier: FieldClassifier = {
  name: "<nome>-classifier",

  detect(field: FormField): ClassifierResult | null {
    // Fallback síncrono (usado quando async não disponível)
    return null;
  },

  async detectAsync(field: FormField): Promise<ClassifierResult | null> {
    try {
      // Operação assíncrona
      const result = await someAsyncOperation(field);
      return result ? { type: result.type, confidence: result.score, method: "<nome>-classifier" } : null;
    } catch {
      return null;
    }
  },
};
```

### 5. Criar Testes Unitários

```
src/lib/form/detectors/__tests__/<nome>-classifier.test.ts
```

```typescript
import { describe, it, expect } from "vitest";
import { <nome>Classifier } from "@/lib/form/detectors/strategies/<nome>-classifier";
import type { FormField } from "@/types";

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  selector: "input[name='test']",
  tagName: "INPUT",
  type: "text",
  signals: "",
  label: "",
  ...overrides,
});

describe("<nome>Classifier", () => {
  it("has a unique name", () => {
    expect(<nome>Classifier.name).toBe("<nome>-classifier");
  });

  it("returns null for unrecognized fields", () => {
    const result = <nome>Classifier.detect(makeField());
    expect(result).toBeNull();
  });

  it("detects <tipo esperado> with correct confidence", () => {
    const field = makeField({
      signals: "<sinais relevantes>",
      label: "<label relevante>",
    });
    const result = <nome>Classifier.detect(field);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("<field-type>");
    expect(result!.confidence).toBeGreaterThanOrEqual(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });

  it("returns confidence in valid range", () => {
    const field = makeField({ signals: "<sinais>" });
    const result = <nome>Classifier.detect(field);
    if (result) {
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("never throws", () => {
    const fields = [
      makeField(),
      makeField({ signals: undefined as unknown as string }),
      makeField({ type: undefined as unknown as string }),
    ];
    for (const field of fields) {
      expect(() => <nome>Classifier.detect(field)).not.toThrow();
    }
  });
});
```

### 6. Validar

```bash
# Verificar tipos
npm run type-check

# Rodar testes do classificador
npx vitest run src/lib/form/detectors/__tests__/<nome>-classifier.test.ts

# Rodar todos os testes de detectors
npx vitest run src/lib/form/detectors

# Verificar accuracy geral (se registrou no pipeline)
npx vitest run src/lib/dataset
```

## Pipeline — Como Funciona

```
Campo HTML → Pipeline.detect(field)
              │
              ├─ Classificador 1 → resultado ou null
              ├─ Classificador 2 → resultado ou null
              ├─ Classificador 3 → resultado ou null
              └─ ... (roda em ordem até encontrar confiante)
              │
              └─ Retorna melhor resultado (maior confidence)
```

- Pipeline é **imutável** — `.with()`, `.without()`, `.withOrder()` retornam NOVA instância
- Classificadores são executados em **ordem de registro**
- O resultado com **maior confidence** é selecionado
- Se nenhum classificador tiver confiança, retorna `null`

## Checklist Final

- [ ] Arquivo criado em `src/lib/form/detectors/strategies/<nome>-classifier.ts`
- [ ] Objeto `const` com `.name` único + `.detect()` (nunca classe)
- [ ] Retorna `null` quando sem confiança
- [ ] Confidence entre 0–1
- [ ] Sem side effects, sem throw
- [ ] Named export (nunca `export default`)
- [ ] Registrado em `ALL_CLASSIFIERS` em `classifiers.ts`
- [ ] (Se necessário) Adicionado à `DEFAULT_PIPELINE` na posição correta
- [ ] Testes unitários criados
- [ ] Testes verificam: nome, detecção, null para desconhecido, range de confidence, ausência de throw
- [ ] `npm run type-check` passa
- [ ] `npm test` passa
- [ ] Accuracy do dataset não caiu

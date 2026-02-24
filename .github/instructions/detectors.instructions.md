---
applyTo: 'src/lib/form/detectors/**'
---

# Detector & Classifier Conventions

## Interface

Classificadores implementam `Detector<TInput, TResult>` — objetos imutáveis com `.name` + `.detect()`, nunca classes.
Subtipos: `FieldClassifier` (classifica `FormField` → `ClassifierResult | null`), `PageDetector`.

```typescript
export const myClassifier: FieldClassifier = {
  name: "my-classifier",
  detect(field: FormField): ClassifierResult | null {
    // retornar null se não conseguir classificar
  },
};
```

## Pipeline

- `DEFAULT_PIPELINE` é imutável — `.with()`, `.without()`, `.withOrder()` retornam NOVA instância
- Classificadores async usam `.detectAsync?()` (opcional, usado por Chrome AI)
- Pipeline roda classificadores em ordem até encontrar resultado confiante

## Rules

- Novo classificador precisa de `.name` único (usado por pipeline para reordenação)
- Retornar `null` quando não tiver confiança — nunca forçar resultado
- `confidence` entre 0–1 (1 = certeza absoluta, ex: `type="email"`)

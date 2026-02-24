import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_SKU: TrainingSample[] = [
  {
    signals: { primary: ["SKU"], secondary: [], structural: ["Produto"] },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["SKU"], secondary: [], structural: ["Product"] },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Código SKU"],
      secondary: [],
      structural: ["Estoque"],
    },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Stock Keeping Unit"],
      secondary: [],
      structural: ["Inventory"],
    },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["sku"], secondary: [], structural: [] },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Código do Produto"],
      secondary: ["Identificador único"],
      structural: ["Cadastro de Produto"],
    },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Product Code"],
      secondary: ["Unique identifier"],
      structural: ["Catalog Management"],
    },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Referência"],
      secondary: ["Código interno do item"],
      structural: [],
    },
    category: "ecommerce",
    type: "sku",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

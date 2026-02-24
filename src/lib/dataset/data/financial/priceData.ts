import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRICE: TrainingSample[] = [
  {
    signals: { primary: ["Preço"], secondary: [], structural: ["Produto"] },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Price"], secondary: [], structural: ["Product"] },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Preço Unitário"],
      secondary: [],
      structural: ["Itens"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Unit Price"], secondary: [], structural: ["Items"] },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["price"], secondary: [], structural: [] },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Preço de Venda"],
      secondary: ["R$"],
      structural: ["Cadastro de Produto"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Sale Price"],
      secondary: ["$"],
      structural: ["Edit Product"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor do Item"],
      secondary: ["Quanto custa?"],
      structural: [],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

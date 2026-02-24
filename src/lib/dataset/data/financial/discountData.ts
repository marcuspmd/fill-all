import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_DISCOUNT: TrainingSample[] = [
  {
    signals: {
      primary: ["Desconto"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Discount"], secondary: [], structural: ["Payment"] },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Desconto (%)"],
      secondary: [],
      structural: ["Financeiro"],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Discount Rate"],
      secondary: [],
      structural: ["Pricing"],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["discount_value"], secondary: [], structural: [] },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Percentual de Desconto"],
      secondary: ["0% a 100%"],
      structural: ["Pedido"],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Valor do Desconto"],
      secondary: ["R$"],
      structural: ["Carrinho"],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Abatimento"],
      secondary: ["Valor a descontar"],
      structural: [],
    },
    category: "financial",
    type: "discount",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_MONEY: TrainingSample[] = [
  {
    signals: { primary: ["Valor"], secondary: [], structural: ["Pagamento"] },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Money"], secondary: [], structural: ["Payment"] },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor (R$)"],
      secondary: [],
      structural: ["Financeiro"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Amount ($)"],
      secondary: [],
      structural: ["Billing"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor Monetário"],
      secondary: [],
      structural: ["Transação"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Valor em Reais"],
      secondary: ["R$ 0,00"],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Currency Amount"],
      secondary: ["$0.00"],
      structural: ["Transaction"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Montante"],
      secondary: ["Informe o valor"],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_AMOUNT: TrainingSample[] = [
  {
    signals: {
      primary: ["Quantia"],
      secondary: [],
      structural: ["Transferência"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Amount"], secondary: [], structural: ["Transfer"] },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor Total"],
      secondary: [],
      structural: ["Resumo"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Total Amount"],
      secondary: [],
      structural: ["Summary"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["amount"], secondary: [], structural: [] },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor da Transação"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Transaction Amount"],
      secondary: ["Enter amount"],
      structural: ["Payment"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor a Pagar"],
      secondary: ["Saldo devedor"],
      structural: [],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

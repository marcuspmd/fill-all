import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CREDIT_CARD_NUMBER: TrainingSample[] = [
  {
    signals: {
      primary: ["Número do Cartão"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Card Number"],
      secondary: [],
      structural: ["Payment"],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Credit Card Number"],
      secondary: [],
      structural: ["Billing"],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["card_number"], secondary: [], structural: [] },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nº do Cartão de Crédito"],
      secondary: ["0000 0000 0000 0000"],
      structural: ["Checkout"],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Card"],
      secondary: ["Enter your card number"],
      structural: ["Payment Method"],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Cartão"],
      secondary: ["Número impresso no cartão"],
      structural: [],
    },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: { primary: ["Número do Cartão"], secondary: [], structural: [] },
    category: "financial",
    type: "credit-card-number",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { maxLength: 19, inputType: "tel" },
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CREDIT_CARD_CVV: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (CVV explícito no contexto de cartão)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CVV"],
      secondary: ["Código do cartão"],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CVV"],
      secondary: ["Card security code"],
      structural: ["Payment"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Security Code"],
      secondary: ["3 digits on back of card"],
      structural: ["Card Details"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["CVC"],
      secondary: ["Card verification code"],
      structural: ["Payment Method"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["cvv"],
      secondary: [],
      structural: ["credit_card"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (checkout / billing)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código de Segurança"],
      secondary: ["3 dígitos no verso do cartão"],
      structural: ["Checkout"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Card Verification Value"],
      secondary: ["3-4 digits on back"],
      structural: ["Billing"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["CVV/CVC"],
      secondary: ["Verso do cartão de crédito"],
      structural: ["Dados do Cartão"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["CVV2"],
      secondary: ["Security number"],
      structural: ["Card Information"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Código CVV"],
      secondary: ["Impresso no cartão"],
      structural: ["Pagamento com Cartão"],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código"],
      secondary: ["Verso do cartão"],
      structural: [],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["CVV"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "credit-card-cvv",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
    domFeatures: { maxLength: 4, inputType: "tel" },
  },
];

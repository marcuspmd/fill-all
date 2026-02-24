import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_AMOUNT: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (transação / pagamento / saldo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Quantia"],
      secondary: ["Valor a transferir"],
      structural: ["Transferência"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Amount"],
      secondary: ["Amount to transfer"],
      structural: ["Transfer"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor Total"],
      secondary: ["Total do pedido"],
      structural: ["Resumo do Pedido"],
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
      secondary: ["Order total"],
      structural: ["Order Summary"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["amount"],
      secondary: [],
      structural: ["checkout"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (transação / pagamento específico)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Valor da Transação"],
      secondary: ["Quanto deseja pagar"],
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
      primary: ["Valor do Pagamento"],
      secondary: [],
      structural: ["Boleto"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Subtotal"],
      secondary: [],
      structural: ["Carrinho"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Subtotal"],
      secondary: [],
      structural: ["Cart"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor da Compra"],
      secondary: ["Total da compra"],
      structural: [],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Purchase Amount"],
      secondary: ["Total purchase"],
      structural: [],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
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
  {
    signals: {
      primary: ["Saldo"],
      secondary: ["Valor do saldo"],
      structural: ["Conta"],
    },
    category: "financial",
    type: "amount",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

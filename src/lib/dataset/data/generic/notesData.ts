import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_NOTES: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (observações / comentários opcionais)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Observações"],
      secondary: ["Opcional"],
      structural: ["Formulário"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Notes"],
      secondary: ["Optional"],
      structural: ["Form"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Notas"],
      secondary: ["Observações do pedido"],
      structural: ["Pedido"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Comments"],
      secondary: ["Order comments"],
      structural: ["Order"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["notes"],
      secondary: [],
      structural: ["order"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (contexto de checkout / entrega)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Observações Adicionais"],
      secondary: ["Alguma informação extra?"],
      structural: ["Checkout"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Additional Notes"],
      secondary: ["Any special instructions?"],
      structural: ["Delivery"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Instruções Especiais"],
      secondary: ["Há alguma instrução para entrega?"],
      structural: ["Entrega"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Special Instructions"],
      secondary: ["Delivery notes"],
      structural: ["Shipping"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Observação Interna"],
      secondary: ["Nota interna"],
      structural: ["Atendimento"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Internal Notes"],
      secondary: ["Staff only"],
      structural: ["Admin"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Anotações"],
      secondary: ["Suas anotações"],
      structural: ["Cadastro"],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Comentários"],
      secondary: ["Mensagem para o vendedor"],
      structural: [],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Observações"],
      secondary: [],
      structural: [],
    },
    category: "generic",
    type: "notes",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
    domFeatures: { inputType: "text" },
  },
];

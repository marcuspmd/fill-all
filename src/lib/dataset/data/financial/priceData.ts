import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRICE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (preço unitário / por produto)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Preço"],
      secondary: ["Preço do produto"],
      structural: ["Produto"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Price"],
      secondary: ["Product price"],
      structural: ["Product"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Preço Unitário"],
      secondary: ["Valor por unidade"],
      structural: ["Itens"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Unit Price"],
      secondary: ["Price per unit"],
      structural: ["Items"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["price"],
      secondary: [],
      structural: ["product"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (contexto de venda / catálogo)
  // ─────────────────────────────────────────────
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
      primary: ["Preço de Custo"],
      secondary: ["Custo unitário"],
      structural: ["Estoque"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cost Price"],
      secondary: ["Unit cost"],
      structural: ["Inventory"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Preço Promocional"],
      secondary: ["Desconto"],
      structural: ["Vitrine"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Discount Price"],
      secondary: ["Promo price"],
      structural: ["Store"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Tarifa"],
      secondary: ["Valor da tarifa"],
      structural: ["Serviço"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
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
  {
    signals: {
      primary: ["Custo"],
      secondary: [],
      structural: ["Produto"],
    },
    category: "financial",
    type: "price",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

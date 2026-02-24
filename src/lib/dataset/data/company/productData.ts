import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRODUCT: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome do Produto"],
      secondary: [],
      structural: ["Cadastro de Produto"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Produto"],
      secondary: [],
      structural: ["Estoque"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Product Name"],
      secondary: [],
      structural: ["Product Details"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Product"],
      secondary: [],
      structural: ["Inventory"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações reais)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Título do Produto"],
      secondary: [],
      structural: [],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Descrição do Produto"],
      secondary: ["Nome comercial"],
      structural: ["Cadastro"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["product_name"],
      secondary: [],
      structural: [],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Item Name"],
      secondary: [],
      structural: ["Add New Item"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo com name)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Produto a ser cadastrado"],
      structural: ["Estoque"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome"],
      secondary: [],
      structural: ["Cadastro de Produto"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Título"],
      secondary: [],
      structural: ["Produto"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Name"],
      secondary: [],
      structural: ["Product Registration"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // ERP / SISTEMA INTERNO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Produto"],
      secondary: ["Cadastro interno"],
      structural: ["Sistema ERP"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome do Item"],
      secondary: [],
      structural: ["Gestão de Estoque"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CHECKOUT (evitar confusão com name)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Produto Selecionado"],
      secondary: [],
      structural: ["Carrinho"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Selected Product"],
      secondary: [],
      structural: ["Checkout"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Produtoo"],
      secondary: [],
      structural: ["Estoque"],
    },
    category: "ecommerce",
    type: "product",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["P R O D U T O"],
      secondary: [],
      structural: [],
    },
    category: "ecommerce",
    type: "product",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
];

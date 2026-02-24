import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRODUCT: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito — contexto ERP/sistema/select)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Produto"],
      secondary: ["Selecione o produto"],
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
      primary: ["Product"],
      secondary: ["Choose a product"],
      structural: ["Inventory"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Produto"],
      secondary: [],
      structural: ["Cadastro de Produto"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { inputType: "select" },
  },
  {
    signals: {
      primary: ["Product"],
      secondary: [],
      structural: ["Catalog"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: { inputType: "select" },
  },

  // ─────────────────────────────────────────────
  // MEDIUM (ERP / sistema interno / seleção)
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
      primary: ["Item"],
      secondary: ["Selecione o item"],
      structural: ["Gestão de Estoque"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Produto"],
      secondary: ["Buscar produto"],
      structural: ["Pedido"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Product"],
      secondary: ["Search product"],
      structural: ["Order"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
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
  {
    signals: {
      primary: ["Mercadoria"],
      secondary: ["Escolha a mercadoria"],
      structural: ["Nota Fiscal"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Goods"],
      secondary: ["Select goods"],
      structural: ["Invoice"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Serviço/Produto"],
      secondary: [],
      structural: ["Faturamento"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Item"],
      secondary: [],
      structural: ["Pedido de Compra"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Item"],
      secondary: [],
      structural: ["Purchase Order"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // EXTRA — Contexto de seleção/catálogo (sem texto livre)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Produto"],
      secondary: ["Selecione"],
      structural: ["Pedido de Venda"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
    domFeatures: { inputType: "select" },
  },
  {
    signals: {
      primary: ["Product"],
      secondary: ["Select from list"],
      structural: ["Sales Order"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
    domFeatures: { inputType: "select" },
  },
  {
    signals: {
      primary: ["Produto/Serviço"],
      secondary: ["Escolha"],
      structural: ["NF-e"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
    domFeatures: { inputType: "select" },
  },
  {
    signals: {
      primary: ["Item do Pedido"],
      secondary: ["Selecione o produto"],
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
      primary: ["Order Item"],
      secondary: ["Choose product"],
      structural: ["Cart"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Código do Item"],
      secondary: ["Buscar no catálogo"],
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
      primary: ["Produto Cadastrado"],
      secondary: [],
      structural: ["ERP"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registered Product"],
      secondary: [],
      structural: ["ERP System"],
    },
    category: "ecommerce",
    type: "product",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
];

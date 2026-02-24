import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRODUCT_NAME: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito — nome exibido do produto)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome do Produto"],
      secondary: ["Nome que aparece no anúncio"],
      structural: ["Cadastro"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Product Name"],
      secondary: ["Display name"],
      structural: ["Product Details"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["product_name"],
      secondary: [],
      structural: ["Listing"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Item Name"],
      secondary: ["Name shown to customers"],
      structural: ["Catalog"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (exibição / marketplace / anúncio)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Título do Anúncio"],
      secondary: ["Nome público do produto"],
      structural: ["Marketplace"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Título do Produto"],
      secondary: ["Título para exibição"],
      structural: ["Loja Virtual"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome Comercial"],
      secondary: ["Nome de exibição"],
      structural: ["E-commerce"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Product Title"],
      secondary: ["Title for listing"],
      structural: ["E-commerce"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Listing Title"],
      secondary: ["Product display name"],
      structural: ["Store"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome do Item"],
      secondary: ["Nome para catálogo"],
      structural: ["Vitrine"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Nome do item à venda"],
      structural: ["Produto"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Title"],
      secondary: ["Product title for display"],
      structural: ["Listing"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // EXTRA — texto livre / título de exibição
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome do Produto"],
      secondary: ["Informe o nome"],
      structural: ["Cadastro de Produto"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { inputType: "text" },
  },
  {
    signals: {
      primary: ["Product Name"],
      secondary: ["Enter the name"],
      structural: ["Product Registration"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: { inputType: "text" },
  },
  {
    signals: {
      primary: ["Título"],
      secondary: ["Título do produto"],
      structural: ["Anúncio"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Display Name"],
      secondary: ["Name shown on website"],
      structural: ["Product Page"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome de Exibição"],
      secondary: ["Aparece na loja"],
      structural: ["Vitrine"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Descrição Curta"],
      secondary: ["Nome resumido do produto"],
      structural: ["Cadastro"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Short Title"],
      secondary: ["Brief product name"],
      structural: ["Listing"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["product_title"],
      secondary: ["titulo"],
      structural: ["E-commerce"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
];

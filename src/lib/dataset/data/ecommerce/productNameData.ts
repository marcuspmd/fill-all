import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PRODUCT_NAME: TrainingSample[] = [
  {
    signals: {
      primary: ["Nome do Produto"],
      secondary: [],
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
      secondary: [],
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
      primary: ["Descrição do Produto"],
      secondary: [],
      structural: ["Estoque"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Item Name"], secondary: [], structural: ["Catalog"] },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["product_name"], secondary: [], structural: [] },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Nome do item à venda"],
      structural: ["Produto"],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "medium",
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
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Título do Anúncio"],
      secondary: ["Nome público do produto"],
      structural: [],
    },
    category: "ecommerce",
    type: "product-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

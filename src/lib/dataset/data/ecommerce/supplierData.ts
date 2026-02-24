import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_SUPPLIER: TrainingSample[] = [
  {
    signals: {
      primary: ["Fornecedor"],
      secondary: [],
      structural: ["Compras"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Supplier"],
      secondary: [],
      structural: ["Procurement"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome do Fornecedor"],
      secondary: [],
      structural: ["Cadastro de Fornecedor"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Vendor"],
      secondary: [],
      structural: ["Supplier Info"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["supplier"], secondary: [], structural: [] },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Empresa Fornecedora"],
      secondary: ["Razão social do fornecedor"],
      structural: ["Pedido de Compra"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Supplier Name"],
      secondary: ["Enter supplier company name"],
      structural: ["Purchase Order"],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Distribuidor"],
      secondary: ["Nome do distribuidor"],
      structural: [],
    },
    category: "ecommerce",
    type: "supplier",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

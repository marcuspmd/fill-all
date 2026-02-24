import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_COMPANY: TrainingSample[] = [
  {
    signals: { primary: ["Empresa"], secondary: [], structural: ["Cadastro"] },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Company"],
      secondary: [],
      structural: ["Registration"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Razão Social"],
      secondary: [],
      structural: ["Dados da Empresa"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Company Name"],
      secondary: [],
      structural: ["Business Info"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["company"], secondary: [], structural: [] },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome da Empresa"],
      secondary: ["Razão social ou nome fantasia"],
      structural: ["Cadastro Empresarial"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Organization"],
      secondary: ["Your company or organization"],
      structural: ["Account Setup"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome Fantasia"],
      secondary: ["Nome comercial"],
      structural: [],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Firma"],
      secondary: ["Nome da firma ou empresa"],
      structural: ["Registro"],
    },
    category: "ecommerce",
    type: "company",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CEP: TrainingSample[] = [
  {
    signals: { primary: ["CEP"], secondary: [], structural: ["Endereço"] },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Código Postal"],
      secondary: [],
      structural: ["Endereço"],
    },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["cep"], secondary: [], structural: [] },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CEP de Entrega"],
      secondary: [],
      structural: ["Entrega"],
    },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["CEP de Cobrança"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Informe o CEP"],
      secondary: ["00000-000"],
      structural: ["Cadastro"],
    },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Código de Endereçamento Postal"],
      secondary: [],
      structural: [],
    },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: { primary: ["CEP"], secondary: [], structural: [] },
    category: "address",
    type: "cep",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { maxLength: 9, inputType: "tel" },
  },
];

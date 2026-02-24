import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_COMPLEMENT: TrainingSample[] = [
  {
    signals: {
      primary: ["Complemento"],
      secondary: [],
      structural: ["Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Complement"],
      secondary: [],
      structural: ["Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Address Line 2"],
      secondary: [],
      structural: ["Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["complement"], secondary: [], structural: [] },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Comp."],
      secondary: ["Apto, Bloco, Sala"],
      structural: ["Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Apartamento / Bloco"],
      secondary: [],
      structural: ["Dados do Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Suite/Apt"],
      secondary: [],
      structural: ["Shipping Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Referência"],
      secondary: ["Complemento do endereço"],
      structural: [],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Ponto de Referência"],
      secondary: [],
      structural: ["Endereço de Entrega"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_NEIGHBORHOOD: TrainingSample[] = [
  {
    signals: { primary: ["Bairro"], secondary: [], structural: ["Endereço"] },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Neighborhood"],
      secondary: [],
      structural: ["Address"],
    },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["District"], secondary: [], structural: ["Location"] },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["neighborhood"], secondary: [], structural: [] },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome do Bairro"],
      secondary: [],
      structural: ["Dados do Endereço"],
    },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Bairro / Distrito"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Suburb"],
      secondary: [],
      structural: ["Delivery Address"],
    },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Localidade"],
      secondary: ["Bairro ou distrito"],
      structural: [],
    },
    category: "address",
    type: "neighborhood",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CITY: TrainingSample[] = [
  {
    signals: { primary: ["Cidade"], secondary: [], structural: ["Endereço"] },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["City"], secondary: [], structural: ["Address"] },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Município"],
      secondary: [],
      structural: ["Localização"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["city_name"], secondary: [], structural: [] },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Cidade / Município"],
      secondary: [],
      structural: ["Dados do Endereço"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Town/City"],
      secondary: [],
      structural: ["Shipping"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Sua Cidade"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Localidade"],
      secondary: ["Nome da cidade"],
      structural: [],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

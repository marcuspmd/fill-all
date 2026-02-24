import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_COUNTRY: TrainingSample[] = [
  {
    signals: { primary: ["País"], secondary: [], structural: ["Endereço"] },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Country"], secondary: [], structural: ["Address"] },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nacionalidade"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["country"], secondary: [], structural: [] },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["País de Origem"],
      secondary: [],
      structural: ["Cadastro Internacional"],
    },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Country/Region"],
      secondary: [],
      structural: ["Shipping Details"],
    },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Selecione o País"],
      secondary: [],
      structural: ["Endereço"],
    },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nação"],
      secondary: ["País ou território"],
      structural: [],
    },
    category: "address",
    type: "country",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

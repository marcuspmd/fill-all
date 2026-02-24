import { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_FULL_NAME: TrainingSample[] = [
  // EASY
  {
    signals: {
      primary: ["Nome Completo"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Full Name"],
      secondary: [],
      structural: ["Registration"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome e Sobrenome"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome completo do titular"],
      secondary: [],
      structural: ["Conta"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // HARD
  {
    signals: {
      primary: ["Titular"],
      secondary: ["Nome como consta no documento"],
      structural: ["Identificação"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Digite seu nome completo"],
      structural: [],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

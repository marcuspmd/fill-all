import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_FIRST_NAME: TrainingSample[] = [
  // EASY
  {
    signals: {
      primary: ["Primeiro Nome"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Somente o primeiro nome"],
      structural: [],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["First Name"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["given_name"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // MEDIUM
  {
    signals: {
      primary: ["Nome do Titular"],
      secondary: ["Primeiro nome apenas"],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Não inclua sobrenome"],
      structural: [],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // HARD
  {
    signals: {
      primary: ["Nome"],
      secondary: [],
      structural: ["Step 1: Personal Info"],
    },
    category: "personal",
    type: "first-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

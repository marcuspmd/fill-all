import { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_LAST_NAME: TrainingSample[] = [
  // EASY
  {
    signals: {
      primary: ["Sobrenome"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Último Nome"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Last Name"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["family_name"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // MEDIUM
  {
    signals: {
      primary: ["Sobrenome do Cliente"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome de Família"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // HARD
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Apenas sobrenome"],
      structural: ["Dados Complementares"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

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

  // COMPOUND / HYPHENATED FORMS
  {
    signals: {
      primary: ["nome-completo"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["full_name"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome Inteiro"],
      secondary: ["Nome e sobrenome"],
      structural: ["Identificação"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Legal Name"],
      secondary: ["As it appears on your ID"],
      structural: ["Account"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome Completo do Responsável"],
      secondary: [],
      structural: ["Responsável"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Complete Name"],
      secondary: [],
      structural: ["Profile"],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Nome Completo"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "full-name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { inputType: "text" },
  },
];

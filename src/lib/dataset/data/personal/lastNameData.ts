import { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_LAST_NAME: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (sobrenome explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Sobrenome"],
      secondary: ["Nome de família"],
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
      secondary: ["Sobrenome"],
      structural: ["Cadastro"],
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
      secondary: ["Family Name"],
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
      primary: ["Surname"],
      secondary: ["Last Name"],
      structural: ["Account"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["family_name"],
      secondary: ["last_name"],
      structural: ["Registration"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Sobrenome do Cliente"],
      secondary: ["Informe o sobrenome"],
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
      secondary: ["Último nome"],
      structural: ["Perfil"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Sobrenome do Responsável"],
      secondary: [],
      structural: ["Dados do Responsável"],
    },
    category: "personal",
    type: "last-name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
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

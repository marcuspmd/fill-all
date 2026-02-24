import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_BIRTH_DATE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Data de Nascimento"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nascimento"],
      secondary: ["DD/MM/AAAA"],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Date of Birth"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Birth Date"],
      secondary: [],
      structural: ["Registration"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["data_nascimento"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Dt. Nascimento"],
      secondary: [],
      structural: ["Dados do Titular"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nascido em"],
      secondary: [],
      structural: ["Informações Pessoais"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Data Nasc."],
      secondary: ["Formato: dd/mm/aaaa"],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Birthday"],
      secondary: [],
      structural: ["Profile"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["DOB"],
      secondary: ["MM/DD/YYYY"],
      structural: ["Personal Details"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["birthdate"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Aniversário"],
      secondary: [],
      structural: ["Perfil"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Data"],
      secondary: ["Informe sua data de nascimento"],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Date"],
      secondary: ["When were you born?"],
      structural: ["Sign Up"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Idade"],
      secondary: ["Data de nascimento do titular"],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nascimento do Responsável"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Dt Nascimento"],
      secondary: [],
      structural: ["dados pessoais"],
    },
    category: "personal",
    type: "birth-date",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["data nascimento"],
      secondary: ["campo obrigatório"],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nascimento"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
    domFeatures: {
      inputType: "date",
    },
  },
  {
    signals: {
      primary: ["Data de Nascimento"],
      secondary: ["dd/mm/aaaa"],
      structural: [],
    },
    category: "personal",
    type: "birth-date",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 10,
      pattern: "\\d{2}/\\d{2}/\\d{4}",
    },
  },
];

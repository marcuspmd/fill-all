import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_MOBILE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Celular"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Mobile"],
      secondary: [],
      structural: ["Contact"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Mobile Phone"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Número do Celular"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["mobile_phone"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["cell_phone"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Cel."],
      secondary: ["(00) 00000-0000"],
      structural: ["Contato"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Telefone Celular"],
      secondary: ["Com DDD"],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cell Phone"],
      secondary: [],
      structural: ["Contact Details"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Celular do Titular"],
      secondary: [],
      structural: ["Dados da Conta"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Smartphone"],
      secondary: [],
      structural: ["Contato"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Telefone"],
      secondary: ["Informe o celular"],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Celular com DDD"],
      structural: ["Dados Pessoais"],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Phone"],
      secondary: ["Mobile number"],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["celular"],
      secondary: [],
      structural: ["contato"],
    },
    category: "contact",
    type: "mobile",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Celular"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "mobile",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      inputType: "tel",
      maxLength: 15,
    },
  },
];

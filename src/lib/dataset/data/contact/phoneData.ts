import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PHONE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Telefone"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Phone"],
      secondary: [],
      structural: ["Contact Information"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Phone Number"],
      secondary: [],
      structural: ["Personal Details"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Número de Telefone"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["phone_number"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Telefone Fixo"],
      secondary: [],
      structural: ["Contato"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Tel. Comercial"],
      secondary: ["Com DDD"],
      structural: ["Dados da Empresa"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Telefone Residencial"],
      secondary: [],
      structural: ["Endereço"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Home Phone"],
      secondary: [],
      structural: ["Address"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Work Phone"],
      secondary: [],
      structural: ["Employment"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Fone"],
      secondary: ["(00) 0000-0000"],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Tel"],
      secondary: ["Inclua o DDD"],
      structural: ["Contato"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Contato"],
      secondary: ["Número de telefone"],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Telefone para contato"],
      structural: ["Dados Pessoais"],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Contact"],
      secondary: ["Phone number"],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["telefone"],
      secondary: [],
      structural: ["contato"],
    },
    category: "contact",
    type: "phone",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Fone:"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Telefone"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      inputType: "tel",
      maxLength: 15,
    },
  },
  {
    signals: {
      primary: ["Phone"],
      secondary: ["(000) 000-0000"],
      structural: [],
    },
    category: "contact",
    type: "phone",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: {
      inputType: "tel",
    },
  },
];

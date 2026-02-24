import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PIS: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["PIS"],
      secondary: [],
      structural: ["Dados Trabalhistas"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["PIS/PASEP"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do PIS"],
      secondary: [],
      structural: ["Cadastro Trabalhista"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["NIT/PIS"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["pis_pasep"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["PASEP"],
      secondary: [],
      structural: ["Dados do Servidor"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["NIT"],
      secondary: ["Número de Identificação do Trabalhador"],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["PIS do Funcionário"],
      secondary: [],
      structural: ["RH"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número de Identificação Social"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registro Trabalhista"],
      secondary: ["PIS/PASEP/NIT"],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Número"],
      secondary: ["Informe o PIS/PASEP"],
      structural: ["Dados do Funcionário"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Registro trabalhista"],
      structural: ["RH"],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registro"],
      secondary: ["Previdência Social"],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Pis"],
      secondary: [],
      structural: ["dados trabalhistas"],
    },
    category: "document",
    type: "pis",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["P I S"],
      secondary: ["Número do PIS"],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["PIS"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "pis",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 11,
    },
  },
];

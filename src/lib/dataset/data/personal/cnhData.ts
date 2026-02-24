import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CNH: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CNH"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Carteira de Motorista"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número da CNH"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Carteira Nacional de Habilitação"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["cnh_motorista"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Habilitação"],
      secondary: [],
      structural: ["Dados do Motorista"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Driver's License"],
      secondary: [],
      structural: ["Documents"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Driving License"],
      secondary: [],
      structural: ["Personal Documents"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Nº da Habilitação"],
      secondary: ["Apenas números"],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registro da CNH"],
      secondary: [],
      structural: ["Cadastro de Motorista"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Categoria CNH"],
      secondary: ["A, B, AB, C, D, E"],
      structural: ["Habilitação"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Carteira de habilitação"],
      structural: ["Motorista"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Informe a habilitação"],
      structural: ["Dados do Condutor"],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registro"],
      secondary: ["CNH do motorista"],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Cnh"],
      secondary: [],
      structural: ["documentos"],
    },
    category: "document",
    type: "cnh",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["C N H"],
      secondary: ["Número da habilitação"],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CNH"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cnh",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 11,
    },
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_NATIONAL_ID: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["National ID"],
      secondary: [],
      structural: ["Identification"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["National ID Number"],
      secondary: [],
      structural: ["Personal Documents"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Documento Nacional"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["national_id"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["ID Nacional"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Government ID"],
      secondary: [],
      structural: ["Identity Verification"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["ID Card Number"],
      secondary: [],
      structural: ["Documents"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Documento de Identidade Nacional"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cédula de Identidade"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identification Number"],
      secondary: ["Government issued"],
      structural: [],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["ID"],
      secondary: ["National identification number"],
      structural: [],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Identidade nacional"],
      structural: [],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Documento de identidade"],
      structural: ["Identificação"],
    },
    category: "document",
    type: "national-id",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PASSPORT: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Passaporte"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do Passaporte"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Passport"],
      secondary: [],
      structural: ["Travel Documents"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Passport Number"],
      secondary: [],
      structural: ["Identification"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["passport_number"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nº do Passaporte"],
      secondary: [],
      structural: ["Documentos de Viagem"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento de Viagem"],
      secondary: ["Número do passaporte"],
      structural: [],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Travel Document"],
      secondary: ["Passport ID"],
      structural: ["Immigration"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Passaporte do Titular"],
      secondary: [],
      structural: ["Check-in"],
    },
    category: "document",
    type: "passport",
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
      secondary: ["Informe o número do passaporte"],
      structural: ["Viagem Internacional"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Passaporte válido"],
      structural: [],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["ID"],
      secondary: ["Passport or national ID"],
      structural: ["Booking"],
    },
    category: "document",
    type: "passport",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["passaporte"],
      secondary: [],
      structural: ["documentos"],
    },
    category: "document",
    type: "passport",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Passporte"],
      secondary: ["Número do documento"],
      structural: [],
    },
    category: "document",
    type: "passport",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
];

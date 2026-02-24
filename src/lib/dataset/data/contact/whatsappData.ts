import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_WHATSAPP: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["WhatsApp"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do WhatsApp"],
      secondary: [],
      structural: ["Contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["WhatsApp Number"],
      secondary: [],
      structural: ["Contact"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["whatsapp_number"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Wpp"],
      secondary: [],
      structural: ["Contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Zap"],
      secondary: ["Número do WhatsApp"],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["WhatsApp para Contato"],
      secondary: ["Com DDD"],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Celular (WhatsApp)"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["WhatsApp Business"],
      secondary: [],
      structural: ["Empresa"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Celular"],
      secondary: ["WhatsApp"],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Telefone"],
      secondary: ["Número com WhatsApp"],
      structural: ["Contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["Informe seu WhatsApp"],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["whatsapp"],
      secondary: [],
      structural: ["contato"],
    },
    category: "contact",
    type: "whatsapp",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Whats App"],
      secondary: ["número para contato"],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["WhatsApp"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "whatsapp",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      inputType: "tel",
      maxLength: 15,
    },
  },
];

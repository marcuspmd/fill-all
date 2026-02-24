import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_DESCRIPTION: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (descrição explícita de entidade)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Descrição"],
      secondary: ["Descrição do item"],
      structural: ["Cadastro"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Description"],
      secondary: ["Item description"],
      structural: ["Form"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Descrição do Item"],
      secondary: ["Descreva o item"],
      structural: ["Produto"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Details"],
      secondary: ["Product details"],
      structural: ["Product"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["description"],
      secondary: [],
      structural: ["product"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (formulários de cadastro / listagem)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Descreva"],
      secondary: ["Informe uma descrição detalhada"],
      structural: ["Formulário"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Summary"],
      secondary: ["Provide a brief description"],
      structural: ["Listing"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Descrição do Serviço"],
      secondary: ["Descreva o serviço prestado"],
      structural: ["Serviço"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Short Description"],
      secondary: ["Brief summary"],
      structural: ["Catalog"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Descrição do Problema"],
      secondary: ["Descreva o problema encontrado"],
      structural: ["Chamado"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Bio"],
      secondary: ["Tell us about yourself"],
      structural: ["Profile"],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Detalhes"],
      secondary: ["Informações do produto"],
      structural: [],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Descrição"],
      secondary: [],
      structural: [],
    },
    category: "generic",
    type: "description",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
    domFeatures: { inputType: "text" },
  },
];

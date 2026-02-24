import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_SELECT: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (dropdown / seleção explícita)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Selecione"],
      secondary: ["Selecionar"],
      structural: ["Formulário"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Select"],
      secondary: ["Choose an option"],
      structural: ["Form"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Escolha uma opção"],
      secondary: ["Selecione abaixo"],
      structural: ["Cadastro"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Choose"],
      secondary: ["Pick from list"],
      structural: ["Dropdown"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["select"],
      secondary: ["option"],
      structural: [],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações de dropdown)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Selecione uma opção"],
      secondary: ["Clique para abrir"],
      structural: ["Campo"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Pick One"],
      secondary: ["Select from the list"],
      structural: ["Options"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["-- Selecione --"],
      secondary: [],
      structural: ["Formulário"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["-- Select --"],
      secondary: [],
      structural: ["Form"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Tipo"],
      secondary: ["Selecione o tipo"],
      structural: ["Cadastro"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Opção"],
      secondary: ["Escolha abaixo"],
      structural: [],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

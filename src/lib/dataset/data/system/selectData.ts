import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_SELECT: TrainingSample[] = [
  {
    signals: {
      primary: ["Selecione"],
      secondary: [],
      structural: ["Formulário"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Select"], secondary: [], structural: ["Form"] },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Escolha uma opção"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Choose"], secondary: [], structural: ["Dropdown"] },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["select"], secondary: [], structural: [] },
    category: "system",
    type: "select",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
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

import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_TEXT: TrainingSample[] = [
  {
    signals: { primary: ["Texto"], secondary: [], structural: ["Formulário"] },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Text"], secondary: [], structural: ["Form"] },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Texto Livre"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Free Text"], secondary: [], structural: ["Input"] },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["text"], secondary: [], structural: [] },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Informação Adicional"],
      secondary: ["Digite aqui"],
      structural: ["Detalhes"],
    },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Additional Info"],
      secondary: ["Type here"],
      structural: ["Details"],
    },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Campo de Texto"],
      secondary: ["Informação extra"],
      structural: [],
    },
    category: "generic",
    type: "text",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

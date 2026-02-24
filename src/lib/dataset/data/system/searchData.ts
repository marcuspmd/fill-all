import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_SEARCH: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (busca/pesquisa explícita)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Buscar"],
      secondary: ["Pesquisar"],
      structural: ["Pesquisa"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { inputType: "search" },
  },
  {
    signals: {
      primary: ["Search"],
      secondary: ["Search..."],
      structural: ["Search"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: { inputType: "search" },
  },
  {
    signals: {
      primary: ["Pesquisar"],
      secondary: ["Buscar"],
      structural: ["Barra de Pesquisa"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: { inputType: "search" },
  },
  {
    signals: {
      primary: ["Search..."],
      secondary: ["Type to search"],
      structural: ["Header"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["search"],
      secondary: ["query"],
      structural: [],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: { inputType: "search" },
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["O que você procura?"],
      secondary: ["Digite para buscar"],
      structural: ["Topo"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Find"],
      secondary: ["Type to search products"],
      structural: ["Navigation"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Filtrar"],
      secondary: ["Buscar por nome"],
      structural: ["Listagem"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Search products"],
      secondary: ["Filter results"],
      structural: ["Catalog"],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Localizar"],
      secondary: ["Procure por nome ou código"],
      structural: [],
    },
    category: "system",
    type: "search",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

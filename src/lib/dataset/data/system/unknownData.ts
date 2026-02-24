import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_UNKNOWN: TrainingSample[] = [
  {
    signals: { primary: ["Campo 1"], secondary: [], structural: [] },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Field 1"], secondary: [], structural: [] },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["input_01"], secondary: [], structural: [] },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: [""], secondary: [], structural: [] },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: { primary: ["custom_field"], secondary: [], structural: [] },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Dados"],
      secondary: ["Preencha este campo"],
      structural: [],
    },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Other"],
      secondary: ["Enter value"],
      structural: ["Misc"],
    },
    category: "system",
    type: "unknown",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
];

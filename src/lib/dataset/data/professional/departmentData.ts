import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_DEPARTMENT: TrainingSample[] = [
  {
    signals: {
      primary: ["Departamento"],
      secondary: [],
      structural: ["Dados Profissionais"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Department"],
      secondary: [],
      structural: ["Professional Info"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Setor"],
      secondary: [],
      structural: ["Cadastro de Funcionário"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Division"],
      secondary: [],
      structural: ["Organization"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["department"], secondary: [], structural: [] },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Setor / Departamento"],
      secondary: [],
      structural: ["Dados do Funcionário"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Área de Atuação"],
      secondary: ["Em qual setor você trabalha?"],
      structural: ["RH"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Team"],
      secondary: ["Select your department"],
      structural: ["Employee Profile"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Área"],
      secondary: ["Departamento ou setor"],
      structural: [],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

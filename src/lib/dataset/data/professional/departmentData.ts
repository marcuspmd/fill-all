import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_DEPARTMENT: TrainingSample[] = [
  {
    signals: {
      primary: ["Departamento"],
      secondary: ["Setor de trabalho"],
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
      secondary: ["Work department"],
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
      secondary: ["Departamento"],
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
      secondary: ["Department"],
      structural: ["Organization"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["department"],
      secondary: ["division"],
      structural: ["employee"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Setor / Departamento"],
      secondary: ["Área da empresa"],
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

  // ─────────────────────────────────────────────
  // HARD (sinais com "unidade"/"business" — NÃO é employee-count)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Unidade de Negócio"],
      secondary: ["Em qual unidade você trabalha?"],
      structural: ["Dados Profissionais"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Business Unit"],
      secondary: ["Select your business unit"],
      structural: ["Employee"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Lotação"],
      secondary: ["Setor de lotação"],
      structural: ["Funcionário"],
    },
    category: "professional",
    type: "department",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

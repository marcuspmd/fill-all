import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_EMPLOYEE_COUNT: TrainingSample[] = [
  {
    signals: {
      primary: ["Número de Funcionários"],
      secondary: [],
      structural: ["Empresa"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Employee Count"],
      secondary: [],
      structural: ["Company Info"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Quantidade de Colaboradores"],
      secondary: [],
      structural: ["Dados da Empresa"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Number of Employees"],
      secondary: [],
      structural: ["Organization"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["employee_count"], secondary: [], structural: [] },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Porte da Empresa"],
      secondary: ["Quantidade de empregados"],
      structural: ["Cadastro Empresarial"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Company Size"],
      secondary: ["How many employees?"],
      structural: ["Business Profile"],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Tamanho do Time"],
      secondary: ["Total de colaboradores"],
      structural: [],
    },
    category: "professional",
    type: "employee-count",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

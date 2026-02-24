import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_JOB_TITLE: TrainingSample[] = [
  {
    signals: {
      primary: ["Cargo"],
      secondary: [],
      structural: ["Dados Profissionais"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Job Title"],
      secondary: [],
      structural: ["Professional Info"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Profissão"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Position"],
      secondary: [],
      structural: ["Employment"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["job_title"], secondary: [], structural: [] },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Cargo / Função"],
      secondary: [],
      structural: ["Dados do Funcionário"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Ocupação"],
      secondary: ["Qual seu cargo atual?"],
      structural: ["Perfil Profissional"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Role"],
      secondary: ["Your current position"],
      structural: ["Career"],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Função"],
      secondary: ["Cargo na empresa"],
      structural: [],
    },
    category: "professional",
    type: "job-title",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

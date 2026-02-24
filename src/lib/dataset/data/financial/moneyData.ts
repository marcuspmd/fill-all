import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_MONEY: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (valor monetário genérico com símbolo de moeda)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Valor (R$)"],
      secondary: ["Informe o valor"],
      structural: ["Financeiro"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Amount ($)"],
      secondary: ["Enter value"],
      structural: ["Billing"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor em Reais"],
      secondary: ["R$ 0,00"],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Valor Monetário"],
      secondary: [],
      structural: ["Transação"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Currency Amount"],
      secondary: ["$0.00"],
      structural: ["Transaction"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (renda / salário / investimento)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Salário"],
      secondary: ["Valor em R$"],
      structural: ["Dados Profissionais"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Renda Mensal"],
      secondary: ["Valor mensal"],
      structural: ["Financeiro"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Monthly Income"],
      secondary: ["Monthly salary"],
      structural: ["Financial"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Valor do Investimento"],
      secondary: ["Aplicação"],
      structural: ["Financeiro"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Investment Amount"],
      secondary: ["Investment value"],
      structural: ["Finance"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Salary"],
      secondary: ["Annual salary"],
      structural: ["Employment"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Renda Familiar"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Faturamento"],
      secondary: ["Faturamento mensal"],
      structural: ["Empresa"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Valor"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Montante"],
      secondary: ["Informe o valor"],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Receita"],
      secondary: ["Valor da receita"],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

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

  // ─────────────────────────────────────────────
  // RENDA / INCOME (sinais comuns em cadastros)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["income_value"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["income_value"],
      secondary: ["Informe sua renda"],
      structural: ["Dados Financeiros"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Renda"],
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
      primary: ["Renda"],
      secondary: ["Valor em R$"],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Income"],
      secondary: ["Enter your income"],
      structural: ["Financial Information"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Income"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Renda Bruta"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Renda Líquida"],
      secondary: ["Informe o valor líquido"],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Valor da Renda"],
      secondary: [],
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
      primary: ["income"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["renda_mensal"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["renda"],
      secondary: [],
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
      primary: ["Renda Comprovada"],
      secondary: ["Comprovação de renda"],
      structural: ["Análise de Crédito"],
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
      secondary: [],
      structural: ["Loan Application"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Annual Income"],
      secondary: ["Gross annual income"],
      structural: ["Credit"],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Gross Income"],
      secondary: [],
      structural: [],
    },
    category: "financial",
    type: "money",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
];

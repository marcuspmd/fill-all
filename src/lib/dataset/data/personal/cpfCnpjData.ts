import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CPF_CNPJ: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPF/CNPJ"],
      secondary: [],
      structural: ["Dados do Cliente"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF ou CNPJ"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF / CNPJ"],
      secondary: ["Digite CPF ou CNPJ"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["cpf_cnpj"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Documento (CPF/CNPJ)"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do Documento"],
      secondary: ["CPF ou CNPJ"],
      structural: ["Cliente"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["documento_fiscal"],
      secondary: ["Informe CPF ou CNPJ"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF/CNPJ do Titular"],
      secondary: [],
      structural: ["Dados da Conta"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento Fiscal"],
      secondary: ["Pessoa Física ou Jurídica"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Informe CPF ou CNPJ"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número"],
      secondary: ["CPF para pessoa física, CNPJ para jurídica"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identificação"],
      secondary: ["Aceita CPF ou CNPJ"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPF/CNPJ"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 18,
    },
  },
  {
    signals: {
      primary: ["Documento"],
      secondary: ["000.000.000-00 ou 00.000.000/0001-00"],
      structural: [],
    },
    category: "document",
    type: "cpf-cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
    domFeatures: {
      maxLength: 18,
    },
  },
];

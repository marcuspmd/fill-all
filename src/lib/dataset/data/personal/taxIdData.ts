import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_TAX_ID: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Tax ID"],
      secondary: [],
      structural: ["Tax Information"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Tax Identification Number"],
      secondary: [],
      structural: ["Financial Documents"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Inscrição Estadual"],
      secondary: [],
      structural: ["Dados Fiscais"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Inscrição Municipal"],
      secondary: [],
      structural: ["Dados Fiscais"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["tax_id"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["TIN"],
      secondary: ["Taxpayer Identification Number"],
      structural: [],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Número Fiscal"],
      secondary: [],
      structural: ["Empresa"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["SSN"],
      secondary: [],
      structural: ["Tax Filing"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Social Security Number"],
      secondary: [],
      structural: ["Employment"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["EIN"],
      secondary: ["Employer Identification Number"],
      structural: [],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Registro Fiscal"],
      secondary: [],
      structural: ["Cadastro Empresarial"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["IE"],
      secondary: ["Inscrição Estadual"],
      structural: ["Dados da Empresa"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Número"],
      secondary: ["Identificação fiscal"],
      structural: ["Empresa"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["ID"],
      secondary: ["Tax identification"],
      structural: ["Financials"],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Registro"],
      secondary: ["Documento fiscal da empresa"],
      structural: [],
    },
    category: "document",
    type: "tax-id",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["inscricao estadual"],
      secondary: [],
      structural: ["dados fiscais"],
    },
    category: "document",
    type: "tax-id",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
];

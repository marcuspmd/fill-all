import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CNPJ: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CNPJ"],
      secondary: [],
      structural: ["Dados da Empresa"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CNPJ da Empresa"],
      secondary: ["Digite apenas números"],
      structural: ["Cadastro Empresarial"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["cnpj_empresa", "00.000.000/0001-00"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cadastro Nacional da Pessoa Jurídica"],
      secondary: [],
      structural: ["Identificação da Empresa"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações e abreviações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Documento (CNPJ)"],
      secondary: [],
      structural: ["Empresa"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["doc_empresa"],
      secondary: ["Informe o CNPJ"],
      structural: ["Dados Empresariais"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do Documento"],
      secondary: ["Pessoa Jurídica"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["cnpjTitular"],
      secondary: [],
      structural: ["Dados da Conta Empresarial"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento da Empresa"],
      secondary: [],
      structural: ["Pessoa Jurídica"],
    },
    category: "document",
    type: "cnpj",
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
      secondary: ["Informe o documento da empresa"],
      structural: ["Pessoa Jurídica"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identificação"],
      secondary: ["Somente números"],
      structural: ["Empresa"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Código"],
      secondary: ["Documento empresarial"],
      structural: ["Cadastro PJ"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["doc"],
      secondary: [],
      structural: ["Pessoa Jurídica"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CPF/CNPJ COMBINADO (separação importante)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPF / CNPJ"],
      secondary: ["Pessoa Jurídica"],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF ou CNPJ"],
      secondary: ["Empresa"],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CNPj"],
      secondary: [],
      structural: ["dados da empresa"],
    },
    category: "document",
    type: "cnpj",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["C N P J"],
      secondary: ["Digite o documento"],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM MÁSCARA
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CNPJ", "00.000.000/0001-00"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 18,
    },
  },
  {
    signals: {
      primary: ["CNPJ"],
      secondary: ["Formato: 00.000.000/0001-00"],
      structural: [],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CASOS MAIS REALISTAS
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["cnpj_cadastro"],
      secondary: ["Campo obrigatório"],
      structural: ["Novo Fornecedor"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento do Estabelecimento"],
      secondary: [],
      structural: ["Pessoa Jurídica"],
    },
    category: "document",
    type: "cnpj",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

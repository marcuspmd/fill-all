import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CPF: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPF"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF do Cliente"],
      secondary: ["Digite apenas números"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["cpf_cliente", "000.000.000-00"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cadastro de Pessoa Física - CPF"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (abreviações / variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Documento (CPF)"],
      secondary: [],
      structural: ["Informações do Cliente"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["doc_number"],
      secondary: ["Informe seu CPF"],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do Documento"],
      secondary: ["CPF obrigatório"],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["cpfTitular"],
      secondary: [],
      structural: ["Titular da Conta"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Pessoa Física"],
      structural: ["Identificação"],
    },
    category: "document",
    type: "cpf",
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
      secondary: ["Informe o documento do titular"],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identificação"],
      secondary: ["Somente números"],
      structural: ["Dados da Pessoa Física"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Código"],
      secondary: ["Documento do cliente"],
      structural: ["Cadastro PF"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["doc"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO (importante p/ robustez)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPf"],
      secondary: [],
      structural: ["dados pessoais"],
    },
    category: "document",
    type: "cpf",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["C P F"],
      secondary: ["Digite seu documento"],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF:"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CASOS MAIS REALISTAS (quase produção)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["cpf_cadastro"],
      secondary: ["Campo obrigatório"],
      structural: ["Novo Cliente"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento do Responsável"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["CPF / CNPJ"],
      secondary: ["Pessoa Física"],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // VARIAÇÕES COM MÁSCARA
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["CPF", "000.000.000-00"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      maxLength: 14,
    },
  },
  {
    signals: {
      primary: ["CPF"],
      secondary: ["Formato: 000.000.000-00"],
      structural: [],
    },
    category: "document",
    type: "cpf",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
];

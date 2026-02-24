import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_RG: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["RG"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["RG do Cliente"],
      secondary: ["Número da identidade"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Registro Geral"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número do RG"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações e termos alternativos)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Identidade"],
      secondary: [],
      structural: ["Dados do Titular"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento de Identidade"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["rg_cliente"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identificação"],
      secondary: ["Número da identidade"],
      structural: ["Cadastro PF"],
    },
    category: "document",
    type: "rg",
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
      secondary: ["Identidade do titular"],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Documento"],
      secondary: ["Número da identidade"],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Código"],
      secondary: ["Documento de identidade"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // Órgão emissor (contexto importante)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["RG"],
      secondary: ["Órgão emissor SSP"],
      structural: ["Identificação"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Número da Identidade"],
      secondary: ["SSP/MG"],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Rg"],
      secondary: [],
      structural: ["dados pessoais"],
    },
    category: "document",
    type: "rg",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["R G"],
      secondary: ["Número da identidade"],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CASOS REALISTAS
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["documento_identidade"],
      secondary: ["Informe seu RG"],
      structural: ["Novo Cliente"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identidade do Responsável"],
      secondary: [],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // document_number (input genérico)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["document_number"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["document_number"],
      secondary: ["Número do documento"],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["document_number"],
      secondary: ["Informe o número do RG"],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Document Number"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Número do Documento"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["document_number"],
      secondary: ["Ex: 12.345.678-9"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nº do Documento"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["numero_documento"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Doc Number"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["ID Number"],
      secondary: [],
      structural: ["Personal"],
    },
    category: "document",
    type: "rg",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
];

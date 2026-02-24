import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_DOCUMENT_ISSUER: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Órgão Expedidor"],
      secondary: [],
      structural: ["Documentos"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão Emissor"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão Expedidor do RG"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão Emissor do Documento"],
      secondary: [],
      structural: ["Identificação"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["document_issuer"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Issuing Authority"],
      secondary: [],
      structural: ["Personal Documents"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["document_issuer"],
      secondary: ["Ex: SSP/SP"],
      structural: ["Cadastro"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["orgao_expedidor"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["orgao_emissor"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Expedidor"],
      secondary: ["Órgão que emitiu o documento"],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Emissor"],
      secondary: ["SSP, SDS, DETRAN..."],
      structural: ["Documentação"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Issuing Body"],
      secondary: [],
      structural: ["Documents"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Issued By"],
      secondary: [],
      structural: ["ID Information"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Órgão Expedidor/UF"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão Exp."],
      secondary: [],
      structural: ["RG"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Org. Expedidor"],
      secondary: [],
      structural: ["Identidade"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Expedidor"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Emissor"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["issuer"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Órgão"],
      secondary: ["Documento expedido por"],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["UF Expedição"],
      secondary: [],
      structural: ["Documentos Pessoais"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CASOS REALISTAS
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["document_issuer"],
      secondary: ["Informe o órgão expedidor"],
      structural: ["Dados do Cliente"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão Expedidor do Documento"],
      secondary: ["Ex: SSP"],
      structural: ["Pessoa Física"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["rg_orgao_emissor"],
      secondary: [],
      structural: [],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Órgão que expediu a Identidade"],
      secondary: [],
      structural: ["Cadastro Pessoal"],
    },
    category: "document",
    type: "document-issuer",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
];

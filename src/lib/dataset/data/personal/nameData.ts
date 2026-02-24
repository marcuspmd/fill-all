import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_NAME: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome"],
      secondary: [],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome Completo"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["name"],
      secondary: [],
      structural: ["Personal Information"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["full_name"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome do Cliente"],
      secondary: [],
      structural: ["Informações do Cliente"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Nome do Titular"],
      secondary: [],
      structural: ["Dados da Conta"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Seu Nome"],
      secondary: [],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Applicant Name"],
      secondary: [],
      structural: ["Registration Form"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Customer Name"],
      secondary: [],
      structural: ["Checkout"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nome"],
      secondary: ["Como aparece no documento"],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Identificação"],
      secondary: ["Informe seu nome completo"],
      structural: ["Dados Pessoais"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Titular"],
      secondary: ["Nome do responsável"],
      structural: ["Pessoa Física"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Holder"],
      secondary: ["Full name as printed on card"],
      structural: ["Payment Information"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Nme"],
      secondary: ["Digite seu nome"],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["N O M E"],
      secondary: [],
      structural: ["dados pessoais"],
    },
    category: "personal",
    type: "name",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // CASOS REALISTAS
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["nome_cliente"],
      secondary: [],
      structural: ["Novo Pedido"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["nomeResponsavel"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Contact Name"],
      secondary: [],
      structural: ["Contact Information"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ── MISTO pt/en e ABREVIAÇÕES ──
  {
    signals: {
      primary: ["name_input"],
      secondary: ["nome"],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["your-name"],
      secondary: [],
      structural: ["Personal"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["nome_field"],
      secondary: ["name"],
      structural: [],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["inp_nome"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["nome_paciente"],
      secondary: ["paciente"],
      structural: ["Saúde"],
    },
    category: "personal",
    type: "name",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
];

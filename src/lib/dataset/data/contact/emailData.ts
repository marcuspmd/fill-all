import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_EMAIL: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["E-mail"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Email"],
      secondary: [],
      structural: ["Contact Information"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Endereço de E-mail"],
      secondary: [],
      structural: ["Cadastro"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Email Address"],
      secondary: [],
      structural: ["Sign Up"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["email_address"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Seu E-mail"],
      secondary: ["exemplo@email.com"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["E-mail do Cliente"],
      secondary: [],
      structural: ["Informações do Cliente"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["E-mail Corporativo"],
      secondary: [],
      structural: ["Dados Empresariais"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Work Email"],
      secondary: [],
      structural: ["Employment"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["E-mail para contato"],
      secondary: ["Informe um e-mail válido"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Confirmar E-mail"],
      secondary: ["Repita o e-mail"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Personal Email"],
      secondary: [],
      structural: ["Profile"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["user_email"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Contato"],
      secondary: ["Informe seu e-mail"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Login"],
      secondary: ["Use seu endereço de e-mail"],
      structural: ["Entrar"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Usuário"],
      secondary: ["Digite seu e-mail"],
      structural: ["Login"],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM RUÍDO / TYPO
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["email"],
      secondary: [],
      structural: ["contato"],
    },
    category: "contact",
    type: "email",
    source: "augmented",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["E - mail"],
      secondary: ["endereço eletrônico"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "augmented",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["E-mail"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
    domFeatures: {
      inputType: "email",
    },
  },
  {
    signals: {
      primary: ["Email"],
      secondary: ["name@example.com"],
      structural: [],
    },
    category: "contact",
    type: "email",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: {
      inputType: "email",
      maxLength: 255,
    },
  },
];

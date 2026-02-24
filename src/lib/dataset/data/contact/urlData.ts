import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_URL: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["URL"],
      secondary: [],
      structural: ["Links"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Link"],
      secondary: [],
      structural: ["Configurações"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Endereço URL"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["url_link"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Link do Perfil"],
      secondary: ["https://"],
      structural: ["Redes Sociais"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Profile URL"],
      secondary: [],
      structural: ["Social Media"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["LinkedIn URL"],
      secondary: [],
      structural: ["Perfil Profissional"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["URL de Callback"],
      secondary: ["Webhook"],
      structural: ["Configurações"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Redirect URL"],
      secondary: [],
      structural: ["API Settings"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Endereço"],
      secondary: ["Cole o link aqui"],
      structural: [],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Caminho"],
      secondary: ["URL completa"],
      structural: ["Configuração"],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["URL"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "url",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: {
      inputType: "url",
    },
  },
];

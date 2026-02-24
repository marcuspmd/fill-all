import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_WEBSITE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Website"],
      secondary: [],
      structural: ["Dados de Contato"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Site"],
      secondary: [],
      structural: ["Informações da Empresa"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Website URL"],
      secondary: [],
      structural: ["Company Details"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["website_url"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Homepage"],
      secondary: [],
      structural: ["Profile"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Site da Empresa"],
      secondary: ["https://"],
      structural: ["Dados Empresariais"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Página Web"],
      secondary: [],
      structural: ["Contato"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Company Website"],
      secondary: [],
      structural: ["Business Information"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Seu Site"],
      secondary: ["www.exemplo.com.br"],
      structural: [],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Blog"],
      secondary: ["URL do blog"],
      structural: ["Perfil"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Endereço"],
      secondary: ["URL do site"],
      structural: ["Empresa"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Link"],
      secondary: ["Website ou portfolio"],
      structural: [],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // COM domFeatures
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Website"],
      secondary: [],
      structural: [],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: {
      inputType: "url",
    },
  },

  // ─────────────────────────────────────────────
  // HARD (sinais que contêm "address"/"endereco" mas são website)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Web Address"],
      secondary: ["Enter your website"],
      structural: ["Contact"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["Endereço Web"],
      secondary: ["URL"],
      structural: ["Contato"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Endereço do Site"],
      secondary: ["https://"],
      structural: ["Perfil"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Internet Address"],
      secondary: ["Website URL"],
      structural: ["Profile"],
    },
    category: "contact",
    type: "website",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
];

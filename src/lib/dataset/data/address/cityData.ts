import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_CITY: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (cidade/município explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Cidade"],
      secondary: ["Nome da cidade"],
      structural: ["Endereço"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["City"],
      secondary: ["City name"],
      structural: ["Address"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Município"],
      secondary: ["Cidade"],
      structural: ["Localização"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["city_name"],
      secondary: ["city"],
      structural: ["address"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (variações com contexto de entrega/frete)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Cidade / Município"],
      secondary: ["Informe sua cidade"],
      structural: ["Dados do Endereço"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Town/City"],
      secondary: ["Enter your city"],
      structural: ["Shipping Address"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Sua Cidade"],
      secondary: ["Cidade de residência"],
      structural: ["Endereço de Entrega"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cidade de Entrega"],
      secondary: [],
      structural: ["Endereço de Entrega"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Billing City"],
      secondary: [],
      structural: ["Billing Address"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Localidade"],
      secondary: ["Nome da cidade"],
      structural: [],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (naturalidade / cidade natal — NÃO é birth-date)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Naturalidade"],
      secondary: ["Cidade de nascimento"],
      structural: ["Dados Pessoais"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Cidade Natal"],
      secondary: ["Município de nascimento"],
      structural: ["Cadastro"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Birthplace"],
      secondary: ["City of birth"],
      structural: ["Personal Info"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: {
      primary: ["birth_city"],
      secondary: ["naturalidade"],
      structural: [],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Local de Nascimento"],
      secondary: ["Cidade onde nasceu"],
      structural: ["Identificação"],
    },
    category: "address",
    type: "city",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

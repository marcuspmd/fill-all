import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_PIX_KEY: TrainingSample[] = [
  {
    signals: {
      primary: ["Chave PIX"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["PIX Key"], secondary: [], structural: ["Payment"] },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Chave Pix"],
      secondary: [],
      structural: ["Transferência"],
    },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["pix_key"], secondary: [], structural: [] },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Informe sua Chave PIX"],
      secondary: ["CPF, e-mail, telefone ou chave aleatória"],
      structural: ["Recebimento"],
    },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["PIX"],
      secondary: ["Chave de recebimento"],
      structural: ["Dados Bancários"],
    },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Chave de Transferência"],
      secondary: ["Pix ou TED"],
      structural: [],
    },
    category: "financial",
    type: "pix-key",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

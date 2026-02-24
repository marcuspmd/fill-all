import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_COMPLEMENT: TrainingSample[] = [
  {
    signals: {
      primary: ["Complemento"],
      secondary: ["Apto, Bloco, Sala"],
      structural: ["Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Complement"],
      secondary: ["Apt, Suite, Floor"],
      structural: ["Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Address Line 2"],
      secondary: ["Apartment, suite, unit"],
      structural: ["Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["complement"],
      secondary: ["address_line_2"],
      structural: ["address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Comp."],
      secondary: ["Apto, Bloco, Sala"],
      structural: ["Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Apartamento / Bloco"],
      secondary: ["Número do apartamento"],
      structural: ["Dados do Endereço"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Suite/Apt"],
      secondary: ["Unit number, floor"],
      structural: ["Shipping Address"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Referência"],
      secondary: ["Complemento do endereço"],
      structural: [],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Ponto de Referência"],
      secondary: [],
      structural: ["Endereço de Entrega"],
    },
    category: "address",
    type: "complement",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

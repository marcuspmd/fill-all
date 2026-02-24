import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_COUPON: TrainingSample[] = [
  {
    signals: { primary: ["Cupom"], secondary: [], structural: ["Checkout"] },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: { primary: ["Coupon"], secondary: [], structural: ["Checkout"] },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Código do Cupom"],
      secondary: [],
      structural: ["Pagamento"],
    },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Promo Code"],
      secondary: [],
      structural: ["Payment"],
    },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["coupon_code"], secondary: [], structural: [] },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Cupom de Desconto"],
      secondary: ["Insira seu cupom aqui"],
      structural: ["Finalizar Compra"],
    },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Discount Code"],
      secondary: ["Enter your discount code"],
      structural: ["Order Summary"],
    },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Voucher"],
      secondary: ["Código promocional"],
      structural: [],
    },
    category: "ecommerce",
    type: "coupon",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
];

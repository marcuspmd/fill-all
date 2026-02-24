import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_ZIP_CODE: TrainingSample[] = [
  {
    signals: { primary: ["Zip Code"], secondary: [], structural: ["Address"] },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Postal Code"],
      secondary: [],
      structural: ["Shipping"],
    },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["ZIP"],
      secondary: [],
      structural: ["Address Details"],
    },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: { primary: ["zip_code"], secondary: [], structural: [] },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Postcode"],
      secondary: [],
      structural: ["Delivery Address"],
    },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["ZIP/Postal Code"],
      secondary: ["Enter your zip"],
      structural: ["Billing"],
    },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Postal"],
      secondary: ["Zip or postal code"],
      structural: ["Checkout"],
    },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
  },
  {
    signals: { primary: ["Zip Code"], secondary: [], structural: [] },
    category: "address",
    type: "zip-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
    domFeatures: { maxLength: 10, inputType: "tel" },
  },
];

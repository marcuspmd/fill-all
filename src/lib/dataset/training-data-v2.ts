import { FieldCategory, FieldType } from "@/types";

export interface StructuredSignals {
  primary: string[];
  secondary: string[];
  structural: string[];
}

export interface TrainingSample {
  signals: StructuredSignals;
  category: FieldCategory;
  type: FieldType;
  source: "synthetic" | "real-world" | "augmented" | "learned";
  /** Optional: original URL domain (real-world samples) */
  domain?: string;
  /** Curriculum difficulty */
  difficulty: "easy" | "medium" | "hard";
  /** Optional language tag (helps multilingual training) */
  language?: "pt" | "en" | "es";
  /** Optional DOM hints for advanced training */
  domFeatures?: {
    inputType?: string;
    maxLength?: number;
    pattern?: string;
  };
}

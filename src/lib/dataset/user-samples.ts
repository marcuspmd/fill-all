/**
 * User-generated training samples — populated by `npm run import:rules`.
 *
 * Do NOT edit manually; export rules from the extension options page
 * (Cache & Treino → "Exportar Regras para Dataset"), then run:
 *
 *   npm run import:rules path/to/fill-all-rules.json
 *
 * After importing, retrain and rebuild:
 *   npm run train:model
 *   npm run build
 */

import type {
  FieldType,
  TrainingDifficulty,
  TrainingSampleSource,
} from "@/types";

interface UserTrainingSample {
  signals: string;
  type: FieldType;
  source: TrainingSampleSource;
  difficulty: TrainingDifficulty;
  domain?: string;
}

export const USER_SAMPLES: UserTrainingSample[] = [
  // populated by: npm run import:rules [path/to/fill-all-rules.json]
];

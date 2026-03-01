/**
 * E2E Generator Registry — maps framework names to generators.
 */

import type {
  CapturedAction,
  E2EFramework,
  E2EGenerateOptions,
  E2EGenerator,
  RecordedStep,
  RecordingGenerateOptions,
} from "./e2e-export.types";
import { playwrightGenerator } from "./framework/playwright-generator";
import { cypressGenerator } from "./framework/cypress-generator";
import { pestGenerator } from "./framework/pest-generator";

export const E2E_GENERATORS: ReadonlyArray<E2EGenerator> = [
  playwrightGenerator,
  cypressGenerator,
  pestGenerator,
];

const registryMap = new Map<E2EFramework, E2EGenerator>(
  E2E_GENERATORS.map((g) => [g.name, g]),
);

export function getE2EGenerator(framework: E2EFramework): E2EGenerator | null {
  return registryMap.get(framework) ?? null;
}

export function generateE2EScript(
  framework: E2EFramework,
  actions: CapturedAction[],
  options?: E2EGenerateOptions,
): string | null {
  const generator = getE2EGenerator(framework);
  return generator ? generator.generate(actions, options) : null;
}

export function generateE2EFromRecording(
  framework: E2EFramework,
  steps: RecordedStep[],
  options?: RecordingGenerateOptions,
): string | null {
  const generator = getE2EGenerator(framework);
  return generator ? generator.generateFromRecording(steps, options) : null;
}

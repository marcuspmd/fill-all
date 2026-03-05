/**
 * Zod schemas for FlowScript validation.
 *
 * Used when importing/exporting flow scripts (JSON files) and for
 * message payload validation in the background context.
 */

import { z } from "zod";
import { FIELD_TYPES } from "@/types";
import type {
  FlowScript,
  FlowStep,
  FlowMetadata,
  ReplayConfig,
  FlowAssertion,
  FlowValueSource,
  ScreenRecordOptions,
} from "./demo.types";

// ── Primitives ────────────────────────────────────────────────────────────

const fieldTypeSchema = z.enum(FIELD_TYPES);

const replaySpeedSchema = z.enum(["instant", "fast", "normal", "slow"]);

const flowActionTypeSchema = z.enum([
  "navigate",
  "fill",
  "click",
  "select",
  "check",
  "uncheck",
  "clear",
  "wait",
  "scroll",
  "press-key",
  "assert",
]);

const assertOperatorSchema = z.enum([
  "equals",
  "contains",
  "visible",
  "hidden",
  "url-equals",
  "url-contains",
  "exists",
]);

const selectorStrategySchema = z.enum([
  "data-testid",
  "aria-label",
  "role",
  "name",
  "id",
  "placeholder",
  "css",
]);

// ── Composite schemas ─────────────────────────────────────────────────────

const smartSelectorSchema = z.object({
  value: z.string(),
  strategy: selectorStrategySchema,
  description: z.string().optional(),
});

const flowAssertionSchema: z.ZodType<FlowAssertion> = z.object({
  operator: assertOperatorSchema,
  expected: z.string().optional(),
});

const generatorParamsSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    formatted: z.boolean().optional(),
    length: z.number().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  })
  .passthrough();

const flowValueSourceSchema: z.ZodType<FlowValueSource> = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("generator"),
      fieldType: fieldTypeSchema,
      params: generatorParamsSchema.optional(),
    }),
    z.object({
      type: z.literal("fixed"),
      value: z.string(),
    }),
  ],
);

const flowStepSchema: z.ZodType<FlowStep> = z.object({
  id: z.string().min(1),
  action: flowActionTypeSchema,

  selector: z.string().optional(),
  smartSelectors: z.array(smartSelectorSchema).optional(),
  selectorStrategy: selectorStrategySchema.optional(),

  valueSource: flowValueSourceSchema.optional(),

  url: z.string().url().optional(),

  selectIndex: z.number().int().min(0).optional(),
  selectText: z.string().optional(),

  key: z.string().optional(),

  waitTimeout: z.number().int().positive().optional(),

  scrollPosition: z.object({ x: z.number(), y: z.number() }).optional(),

  assertion: flowAssertionSchema.optional(),

  delayBefore: z.number().min(0).optional(),
  delayAfter: z.number().min(0).optional(),

  label: z.string().optional(),
  optional: z.boolean().optional(),
});

const replayConfigSchema: z.ZodType<ReplayConfig> = z.object({
  speed: replaySpeedSchema,
  typingDelay: z.number().min(0),
  stepDelay: z.number().min(0),
  useRecordedTimings: z.boolean(),
  highlightDuration: z.number().min(0),
  showCursor: z.boolean(),
});

const flowMetadataSchema: z.ZodType<FlowMetadata> = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.union([z.string().url(), z.literal("")]),
  seed: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number().int().positive(),
  tags: z.array(z.string()).optional(),
});

export const flowScriptSchema: z.ZodType<FlowScript> = z.object({
  id: z.string().min(1),
  metadata: flowMetadataSchema,
  replayConfig: replayConfigSchema,
  steps: z.array(flowStepSchema).min(1),
});

export const screenRecordOptionsSchema: z.ZodType<ScreenRecordOptions> =
  z.object({
    includeAudio: z.boolean(),
    codec: z.enum(["vp8", "vp9"]),
    videoBitrate: z.number().int().positive(),
  });

// ── Parse helpers ─────────────────────────────────────────────────────────

/**
 * Parse and validate an imported FlowScript JSON payload.
 * Returns `null` on validation failure (never throws).
 */
export function parseFlowScript(input: unknown): FlowScript | null {
  const result = flowScriptSchema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Parse a single FlowStep from unknown input.
 * Returns `null` on validation failure.
 */
export function parseFlowStep(input: unknown): FlowStep | null {
  const result = flowStepSchema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Parse replay configuration from unknown input.
 * Returns `null` on validation failure.
 */
export function parseReplayConfig(input: unknown): ReplayConfig | null {
  const result = replayConfigSchema.safeParse(input);
  return result.success ? result.data : null;
}

// ── Individual schema exports for testing ─────────────────────────────────

export {
  flowStepSchema,
  replayConfigSchema,
  flowMetadataSchema,
  flowActionTypeSchema,
  flowValueSourceSchema,
  flowAssertionSchema,
  smartSelectorSchema,
  replaySpeedSchema,
};

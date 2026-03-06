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
import type { StepEffect, CaptionConfig } from "./effects";

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
  "caption",
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

// ── Effects schemas ────────────────────────────────────────────────────────

const labelEffectSchema = z.object({
  kind: z.literal("label"),
  text: z.string(),
  duration: z.number().min(0).optional(),
  position: z.enum(["above", "below", "left", "right"]).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const growEffectSchema = z.object({
  kind: z.literal("grow"),
  scale: z.number().positive().optional(),
  duration: z.number().min(0).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const zoomEffectSchema = z.object({
  kind: z.literal("zoom"),
  scale: z.number().positive().optional(),
  duration: z.number().min(0).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const pinEffectSchema = z.object({
  kind: z.literal("pin"),
  note: z.string().optional(),
  duration: z.number().min(0).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const shakeEffectSchema = z.object({
  kind: z.literal("shake"),
  intensity: z.number().positive().optional(),
  duration: z.number().min(0).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const confettiEffectSchema = z.object({
  kind: z.literal("confetti"),
  count: z.number().int().positive().optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const spotlightEffectSchema = z.object({
  kind: z.literal("spotlight"),
  opacity: z.number().min(0).max(1).optional(),
  duration: z.number().min(0).optional(),
  timing: z.enum(["before", "during", "after"]).optional(),
});

const stepEffectSchema: z.ZodType<StepEffect> = z.discriminatedUnion("kind", [
  labelEffectSchema,
  growEffectSchema,
  zoomEffectSchema,
  pinEffectSchema,
  shakeEffectSchema,
  confettiEffectSchema,
  spotlightEffectSchema,
]);

const captionConfigSchema: z.ZodType<CaptionConfig> = z.object({
  text: z.string(),
  position: z.enum(["top", "middle", "bottom"]).optional(),
  duration: z.number().min(0).optional(),
});

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

  url: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),

  selectIndex: z.number().int().min(0).optional(),
  selectText: z.string().optional(),

  key: z.string().optional(),

  waitTimeout: z.number().int().min(0).optional(),

  scrollPosition: z.object({ x: z.number(), y: z.number() }).optional(),

  assertion: flowAssertionSchema.optional(),

  delayBefore: z.number().min(0).optional(),
  delayAfter: z.number().min(0).optional(),

  caption: captionConfigSchema.optional(),
  effects: z.array(stepEffectSchema).optional(),

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
  if (!result.success) {
    // Log structured error for debugging in background console
    // eslint-disable-next-line no-console
    console.warn(
      "[FlowScript] Validation failed:",
      JSON.stringify(result.error.issues, null, 2),
    );
  }
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

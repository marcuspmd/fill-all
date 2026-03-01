/**
 * Full Zod validators for extension messages.
 *
 * Used in the background service worker and options page where strict
 * schema validation is acceptable. Content script should use
 * `light-validators.ts` instead for performance.
 */

import { z } from "zod";
import type { FieldRule, SavedForm, Settings } from "@/types";
import type { DetectedFieldSummary } from "@/types";
import { FIELD_TYPES } from "@/types";

const messageSchema = z.object({
  type: z.string().min(1),
  payload: z.unknown().optional(),
});

const settingsSchema = z
  .object({
    autoFillOnLoad: z.boolean(),
    defaultStrategy: z.enum(["ai", "tensorflow", "random"]),
    useChromeAI: z.boolean(),
    forceAIFirst: z.boolean(),
    shortcut: z.string(),
    locale: z.enum(["pt-BR", "en-US"]),
    uiLanguage: z.enum(["auto", "en", "pt_BR", "es"]),
    highlightFilled: z.boolean(),
    cacheEnabled: z.boolean(),
    showFieldIcon: z.boolean(),
    fieldIconPosition: z.enum(["above", "inside", "below"]),
    showPanel: z.boolean(),
    fillEmptyOnly: z.boolean(),
    detectionPipeline: z
      .array(z.object({ name: z.string().min(1), enabled: z.boolean() }))
      .optional(),
    debugLog: z.boolean(),
    logLevel: z.enum(["debug", "info", "warn", "error"]),
    watcherEnabled: z.boolean(),
    watcherAutoRefill: z.boolean(),
    watcherShadowDOM: z.boolean(),
    watcherDebounceMs: z.number().int().min(100).max(5000),
  })
  .partial()
  .strict();

const fieldRuleSchema = z
  .object({
    id: z.string().min(1),
    urlPattern: z.string().min(1),
    fieldSelector: z.string().min(1),
    fieldName: z.string().optional(),
    fieldType: z.enum(FIELD_TYPES),
    fixedValue: z.string().optional(),
    generator: z.enum(["auto", "ai", "tensorflow", ...FIELD_TYPES]),
    aiPrompt: z.string().optional(),
    selectOptionIndex: z.number().optional(),
    priority: z.number().min(0).max(100),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .strict();

const ignoredFieldPayloadSchema = z
  .object({
    urlPattern: z.string().min(1),
    selector: z.string().min(1),
    label: z.string(),
  })
  .strict();

const detectedFieldSummarySchema = z
  .object({
    selector: z.string().min(1),
    fieldType: z.string().min(1),
    label: z.string(),
    name: z.string().optional(),
    id: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    contextualType: z.string().optional(),
    detectionMethod: z.string().optional(),
    options: z
      .array(
        z.object({
          value: z.string(),
          text: z.string(),
        }),
      )
      .optional(),
    checkboxValue: z.string().optional(),
    checkboxChecked: z.boolean().optional(),
  })
  .strict();

const saveFieldCachePayloadSchema = z
  .object({
    url: z.string().min(1),
    fields: z.array(detectedFieldSummarySchema),
  })
  .strict();

const templateFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string(),
    mode: z.enum(["fixed", "generator"]),
    fixedValue: z.string().optional(),
    generatorType: z.enum(FIELD_TYPES).optional(),
    matchByFieldType: z.enum(FIELD_TYPES).optional(),
  })
  .strict();

const savedFormSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    urlPattern: z.string().min(1),
    fields: z.record(z.string(), z.string()),
    templateFields: z.array(templateFieldSchema).optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .strict();

const startWatchingSchema = z
  .object({
    autoRefill: z.boolean().optional(),
    debounceMs: z.number().int().min(100).max(5000).optional(),
    shadowDOM: z.boolean().optional(),
  })
  .strict();

/**
 * Parses and validates a raw extension message envelope.
 * @param input - Raw message from `chrome.runtime.onMessage`
 * @returns Parsed `{ type, payload }` or `null` if invalid
 */
export function parseIncomingMessage(
  input: unknown,
): { type: string; payload?: unknown } | null {
  const result = messageSchema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Parses and validates a field rule payload against the strict Zod schema.
 * @param input - Raw payload from a `SAVE_RULE` message
 * @returns Validated `FieldRule` or `null` if validation fails
 */
export function parseRulePayload(input: unknown): FieldRule | null {
  const result = fieldRuleSchema.safeParse(input);
  return result.success ? (result.data as FieldRule) : null;
}

/**
 * Parses and validates a partial settings payload.
 * @param input - Raw settings object from a `SAVE_SETTINGS` message
 * @returns Validated partial `Settings` or `null`
 */
export function parseSettingsPayload(input: unknown): Partial<Settings> | null {
  const result = settingsSchema.safeParse(input);
  return result.success ? (result.data as Partial<Settings>) : null;
}

/**
 * Parses and validates an ignored-field payload.
 * @param input - Raw payload from an `ADD_IGNORED_FIELD` message
 * @returns Validated object or `null`
 */
export function parseIgnoredFieldPayload(
  input: unknown,
): { urlPattern: string; selector: string; label: string } | null {
  const result = ignoredFieldPayloadSchema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Parses and validates a field detection cache payload.
 * @param input - Raw payload containing URL and detected field summaries
 * @returns Validated cache payload or `null`
 */
export function parseSaveFieldCachePayload(
  input: unknown,
): { url: string; fields: DetectedFieldSummary[] } | null {
  const result = saveFieldCachePayloadSchema.safeParse(input);
  return result.success
    ? (result.data as { url: string; fields: DetectedFieldSummary[] })
    : null;
}

/**
 * Parses and validates a saved form payload.
 * @param input - Raw payload from a `SAVE_FORM` message
 * @returns Validated `SavedForm` or `null`
 */
export function parseSavedFormPayload(input: unknown): SavedForm | null {
  const result = savedFormSchema.safeParse(input);
  return result.success ? (result.data as SavedForm) : null;
}

/**
 * Parses a template-apply payload (same schema as saved form).
 * @param input - Raw payload from an `APPLY_TEMPLATE` message
 * @returns Validated `SavedForm` or `null`
 */
export function parseApplyTemplatePayload(input: unknown): SavedForm | null {
  return parseSavedFormPayload(input);
}

/**
 * Parses the optional payload for `START_WATCHING` messages.
 * @param input - Raw payload (may be `undefined`)
 * @returns Object with optional `autoRefill` flag, or `null` if invalid
 */
export function parseStartWatchingPayload(
  input: unknown,
): { autoRefill?: boolean; debounceMs?: number; shadowDOM?: boolean } | null {
  const result = startWatchingSchema.safeParse(input ?? {});
  return result.success ? result.data : null;
}

/**
 * Parses a payload expected to be a non-empty string.
 * @param input - Raw payload value
 * @returns The string, or `null` if not a valid non-empty string
 */
export function parseStringPayload(input: unknown): string | null {
  const result = z.string().min(1).safeParse(input);
  return result.success ? result.data : null;
}

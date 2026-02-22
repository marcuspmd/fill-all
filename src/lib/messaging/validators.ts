import { z } from "zod";
import type { FieldRule, SavedForm, Settings } from "@/types";
import type { DetectedFieldSummary } from "@/types";

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
    highlightFilled: z.boolean(),
    moneyMin: z.number(),
    moneyMax: z.number(),
    numberMin: z.number(),
    numberMax: z.number(),
  })
  .partial()
  .strict();

const fieldRuleSchema = z
  .object({
    id: z.string().min(1),
    urlPattern: z.string().min(1),
    fieldSelector: z.string().min(1),
    fieldName: z.string().optional(),
    fieldType: z.string().min(1),
    fixedValue: z.string().optional(),
    generator: z.string().min(1),
    aiPrompt: z.string().optional(),
    moneyMin: z.number().optional(),
    moneyMax: z.number().optional(),
    numberMin: z.number().optional(),
    numberMax: z.number().optional(),
    selectOptionIndex: z.number().optional(),
    priority: z.number(),
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

const savedFormSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    urlPattern: z.string().min(1),
    fields: z.record(z.string(), z.string()),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .strict();

const startWatchingSchema = z
  .object({
    autoRefill: z.boolean().optional(),
  })
  .strict();

export function parseIncomingMessage(
  input: unknown,
): { type: string; payload?: unknown } | null {
  const result = messageSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function parseRulePayload(input: unknown): FieldRule | null {
  const result = fieldRuleSchema.safeParse(input);
  return result.success ? (result.data as FieldRule) : null;
}

export function parseSettingsPayload(input: unknown): Partial<Settings> | null {
  const result = settingsSchema.safeParse(input);
  return result.success ? (result.data as Partial<Settings>) : null;
}

export function parseIgnoredFieldPayload(
  input: unknown,
): { urlPattern: string; selector: string; label: string } | null {
  const result = ignoredFieldPayloadSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function parseSaveFieldCachePayload(
  input: unknown,
): { url: string; fields: DetectedFieldSummary[] } | null {
  const result = saveFieldCachePayloadSchema.safeParse(input);
  return result.success
    ? (result.data as { url: string; fields: DetectedFieldSummary[] })
    : null;
}

export function parseSavedFormPayload(input: unknown): SavedForm | null {
  const result = savedFormSchema.safeParse(input);
  return result.success ? (result.data as SavedForm) : null;
}

export function parseStartWatchingPayload(
  input: unknown,
): { autoRefill?: boolean } | null {
  const result = startWatchingSchema.safeParse(input ?? {});
  return result.success ? result.data : null;
}

export function parseStringPayload(input: unknown): string | null {
  const result = z.string().min(1).safeParse(input);
  return result.success ? result.data : null;
}

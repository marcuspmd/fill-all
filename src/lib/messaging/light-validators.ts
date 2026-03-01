/**
 * Lightweight message validators using only `typeof` checks.
 *
 * Designed for the content script hot path where Zod overhead
 * is unacceptable. For strict validation, use `validators.ts`.
 */

import type { SavedForm } from "@/types";

/**
 * Lightweight message envelope parser — `typeof` checks only.
 * @param input - Raw message from `chrome.runtime.onMessage`
 * @returns Parsed `{ type, payload }` or `null` if invalid
 */
export function parseIncomingMessage(
  input: unknown,
): { type: string; payload?: unknown } | null {
  if (!input || typeof input !== "object") return null;
  const value = input as { type?: unknown; payload?: unknown };
  if (typeof value.type !== "string" || !value.type) return null;
  return { type: value.type, payload: value.payload };
}

/**
 * Lightweight non-empty string parser.
 * @param input - Raw payload value
 * @returns The string, or `null` if not a valid non-empty string
 */
export function parseStringPayload(input: unknown): string | null {
  return typeof input === "string" && input.length > 0 ? input : null;
}

/**
 * Lightweight start-watching payload parser.
 * @param input - Raw payload (may be `undefined`)
 * @returns Object with optional `autoRefill` flag, or `null` if invalid
 */
export function parseStartWatchingPayload(
  input: unknown,
): { autoRefill?: boolean } | null {
  if (input === undefined) return {};
  if (!input || typeof input !== "object") return null;
  const payload = input as { autoRefill?: unknown };
  if (
    payload.autoRefill !== undefined &&
    typeof payload.autoRefill !== "boolean"
  ) {
    return null;
  }
  return { autoRefill: payload.autoRefill };
}

/**
 * Lightweight saved-form payload parser — `typeof` checks only.
 * @param input - Raw payload from a `SAVE_FORM` or `APPLY_TEMPLATE` message
 * @returns Reconstructed `SavedForm` or `null` if invalid
 */
export function parseSavedFormPayload(input: unknown): SavedForm | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<SavedForm>;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.urlPattern !== "string" ||
    typeof value.createdAt !== "number" ||
    typeof value.updatedAt !== "number" ||
    !value.fields ||
    typeof value.fields !== "object"
  ) {
    return null;
  }

  const entries = Object.entries(value.fields as Record<string, unknown>);
  const allStringValues = entries.every(
    ([k, v]) => typeof k === "string" && typeof v === "string",
  );
  if (!allStringValues) return null;

  return {
    id: value.id,
    name: value.name,
    urlPattern: value.urlPattern,
    fields: value.fields as Record<string, string>,
    templateFields: Array.isArray(value.templateFields)
      ? value.templateFields
      : undefined,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

/**
 * Lightweight template-apply payload parser (delegates to `parseSavedFormPayload`).
 * @param input - Raw payload from an `APPLY_TEMPLATE` message
 * @returns Validated `SavedForm` or `null`
 */
export function parseApplyTemplatePayload(input: unknown): SavedForm | null {
  return parseSavedFormPayload(input);
}

/**
 * Lightweight E2E export payload parser.
 * @param input - Raw payload from an `EXPORT_E2E` message
 * @returns Object with `framework` string, or `null` if invalid
 */
export function parseExportE2EPayload(
  input: unknown,
): { framework: string } | null {
  if (!input || typeof input !== "object") return null;
  const value = input as { framework?: unknown };
  if (typeof value.framework !== "string" || !value.framework) return null;
  return { framework: value.framework };
}

/**
 * Lightweight EXPORT_RECORDING payload parser.
 * @param input - Raw payload from an `EXPORT_RECORDING` message
 * @returns Object with `framework` and optional `testName`, or `null` if invalid
 */
export function parseExportRecordingPayload(
  input: unknown,
): { framework: string; testName?: string } | null {
  if (!input || typeof input !== "object") return null;
  const value = input as { framework?: unknown; testName?: unknown };
  if (typeof value.framework !== "string" || !value.framework) return null;
  const result: { framework: string; testName?: string } = {
    framework: value.framework,
  };
  if (typeof value.testName === "string" && value.testName) {
    result.testName = value.testName;
  }
  return result;
}

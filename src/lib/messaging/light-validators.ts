import type { SavedForm } from "@/types";

export function parseIncomingMessage(
  input: unknown,
): { type: string; payload?: unknown } | null {
  if (!input || typeof input !== "object") return null;
  const value = input as { type?: unknown; payload?: unknown };
  if (typeof value.type !== "string" || !value.type) return null;
  return { type: value.type, payload: value.payload };
}

export function parseStringPayload(input: unknown): string | null {
  return typeof input === "string" && input.length > 0 ? input : null;
}

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
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

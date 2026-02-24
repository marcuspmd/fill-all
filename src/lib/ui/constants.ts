/**
 * Shared constants for UI rendering across all three surfaces
 * (popup, devtools panel, floating panel).
 */

/** Color map for field type badges (dark theme) */
export const TYPE_COLORS: Record<string, string> = {
  cpf: "#dc2626",
  cnpj: "#b91c1c",
  "cpf-cnpj": "#c53030",
  rg: "#ef4444",
  email: "#2563eb",
  phone: "#7c3aed",
  "full-name": "#15803d",
  "first-name": "#16a34a",
  "last-name": "#4ade80",
  name: "#22c55e",
  address: "#d97706",
  street: "#b45309",
  city: "#a16207",
  state: "#854d0e",
  cep: "#ca8a04",
  "zip-code": "#92400e",
  date: "#0891b2",
  "birth-date": "#0e7490",
  password: "#6d28d9",
  username: "#8b5cf6",
  company: "#9333ea",
  money: "#16a34a",
  number: "#475569",
  text: "#64748b",
  select: "#06b6d4",
  checkbox: "#0891b2",
  radio: "#0e7490",
  website: "#0369a1",
  product: "#a21caf",
  supplier: "#9333ea",
  "employee-count": "#475569",
  "job-title": "#6d28d9",
  unknown: "#94a3b8",
};

/** Color map for detection method badges */
export const METHOD_COLORS: Record<string, string> = {
  "html-type": "#f59e0b",
  keyword: "#22c55e",
  tensorflow: "#6366f1",
  "chrome-ai": "#a855f7",
  "html-fallback": "#ef4444",
  "custom-select": "#06b6d4",
  interactive: "#0ea5e9",
  "user-override": "#f97316",
};

/** Confidence thresholds and their associated colors */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "#4ade80";
  if (confidence >= 0.5) return "#fbbf24";
  return "#f87171";
}

/** Shared tab definitions */
export const SHARED_TAB_IDS = ["actions", "fields", "forms", "log"] as const;
export type SharedTabId = (typeof SHARED_TAB_IDS)[number];

export const SHARED_TAB_LABELS: Record<SharedTabId, string> = {
  actions: "⚡ Ações",
  fields: "🔍 Campos",
  forms: "📄 Forms",
  log: "📋 Log",
};

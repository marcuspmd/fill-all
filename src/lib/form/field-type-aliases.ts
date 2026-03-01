/**
 * Smart field-type alias derivations.
 *
 * When a saved form template has a value for a related field type but not the
 * exact one detected on the page, these functions derive the best possible value.
 *
 * Example: template has "full-name: João Silva" → first-name: "João", last-name: "Silva"
 */

import type { FieldType } from "@/types";

type DerivationFn = (values: Map<FieldType, string>) => string | null;

/**
 * Maps each target FieldType to a derivation function that receives
 * all available template values and returns a derived value (or null).
 *
 * Priority within each group is determined by the order of `values.get()` calls.
 */
export const FIELD_TYPE_DERIVATIONS: Partial<Record<FieldType, DerivationFn>> =
  {
    // --- Name group ---
    "first-name": (values) => {
      const full = values.get("full-name") ?? values.get("name");
      if (!full) return null;
      return full.trim().split(/\s+/)[0] ?? null;
    },

    "last-name": (values) => {
      const full = values.get("full-name") ?? values.get("name");
      if (!full) return null;
      const parts = full.trim().split(/\s+/);
      return parts.length > 1 ? parts.slice(1).join(" ") : null;
    },

    "full-name": (values) => {
      const name = values.get("name");
      if (name) return name;
      const first = values.get("first-name");
      const last = values.get("last-name");
      if (first && last) return `${first} ${last}`;
      return first ?? null;
    },

    name: (values) => {
      const full = values.get("full-name");
      if (full) return full;
      const first = values.get("first-name");
      const last = values.get("last-name");
      if (first && last) return `${first} ${last}`;
      return first ?? null;
    },

    // --- Phone group ---
    phone: (values) => values.get("mobile") ?? values.get("whatsapp") ?? null,
    mobile: (values) => values.get("phone") ?? values.get("whatsapp") ?? null,
    whatsapp: (values) =>
      values.get("mobile") ?? values.get("phone") ?? null,

    // --- Authentication ---
    "confirm-password": (values) => values.get("password") ?? null,

    // --- Postal code ---
    "zip-code": (values) => values.get("cep") ?? null,
    cep: (values) => values.get("zip-code") ?? null,

    // --- Financial ---
    price: (values) => values.get("money") ?? values.get("amount") ?? null,
    money: (values) => values.get("price") ?? values.get("amount") ?? null,
    amount: (values) => values.get("money") ?? values.get("price") ?? null,

    // --- Date variants ---
    "birth-date": (values) => values.get("date") ?? null,
    "start-date": (values) => values.get("date") ?? null,
    "end-date": (values) => values.get("date") ?? null,
    "due-date": (values) => values.get("date") ?? null,

    // --- Product ---
    "product-name": (values) => values.get("product") ?? null,
    product: (values) => values.get("product-name") ?? null,

    // --- Company ---
    supplier: (values) => values.get("company") ?? null,
    company: (values) => values.get("supplier") ?? null,

    // --- Document ---
    "cpf-cnpj": (values) => values.get("cpf") ?? values.get("cnpj") ?? null,
  };

/**
 * Tries to derive a value for `targetType` from the available template values.
 *
 * @param targetType - The field type we need a value for
 * @param templateValues - All fixed values already present in the template, keyed by FieldType
 * @returns The derived value string, or `null` if no derivation is possible
 */
export function deriveFieldValueFromTemplate(
  targetType: FieldType,
  templateValues: Map<FieldType, string>,
): string | null {
  const deriveFn = FIELD_TYPE_DERIVATIONS[targetType];
  if (!deriveFn) return null;
  return deriveFn(templateValues);
}

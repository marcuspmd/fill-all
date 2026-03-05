/**
 * Value-to-Generator Mapper
 *
 * Maps recorded typed values to a `FlowValueSource` so that replays produce
 * fresh, valid data from a generator instead of hard-coded strings.
 *
 * Falls back to `{ type: "fixed", value }` when no FieldType was detected
 * for the field.
 */

import type { FieldType, GeneratorParams } from "@/types";
import type { FlowValueSource } from "./demo.types";

/**
 * Build a `FlowValueSource` for a fill step.
 *
 * When the field was classified with a FieldType the replay will call the
 * generator each time (producing fresh data). Otherwise the original value
 * is stored as a fixed literal.
 */
export function mapValueToSource(
  recordedValue: string,
  fieldType: FieldType | null | undefined,
  params?: GeneratorParams,
): FlowValueSource {
  if (!fieldType) {
    return { type: "fixed", value: recordedValue };
  }

  const source: FlowValueSource = {
    type: "generator",
    fieldType,
  };

  if (params && Object.keys(params).length > 0) {
    return { ...source, params };
  }

  return source;
}

/**
 * Resolve a `FlowValueSource` to a concrete string value.
 *
 * For `fixed` sources the original value is returned.
 * For `generator` sources the external `generate` function is invoked.
 *
 * @param source  - The value source definition
 * @param generateFn - Generator function (`generate` from `@/lib/generators`)
 */
export function resolveValueSource(
  source: FlowValueSource,
  generateFn: (fieldType: FieldType, params?: GeneratorParams) => string,
): string {
  if (source.type === "fixed") {
    return source.value;
  }
  return generateFn(source.fieldType, source.params);
}

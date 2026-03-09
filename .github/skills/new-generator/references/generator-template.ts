/**
 * Template: Generator for <DataType>
 *
 * Instructions:
 * 1. Copy this file to src/lib/generators/<name>.ts
 * 2. Replace <DataType> and <Name> with actual names
 * 3. Implement the generation logic
 * 4. Register in src/lib/generators/index.ts
 */

/**
 * Generates a valid <DataType>.
 * @param formatted - If true, returns formatted string (default: true)
 * @returns Generated string, or empty string on failure
 */
export function generate<Name>(formatted = true): string {
  try {
    // Step 1: Generate raw digits/data
    const raw = generateRawData();

    // Step 2: Apply validation (e.g., check digits for CPF/CNPJ)
    // const validated = applyCheckDigits(raw);

    // Step 3: Format if requested
    if (!formatted) return raw;
    return formatData(raw);
  } catch {
    return ""; // NEVER throw — return empty string as fallback
  }
}

function generateRawData(): string {
  return Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

function formatData(raw: string): string {
  // Example format: XX.XXX.XXX-X
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}-${raw.slice(8)}`;
}

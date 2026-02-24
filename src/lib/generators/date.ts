/**
 * Date generator — powered by faker
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

function formatDate(date: Date, format: "iso" | "br" | "us"): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  switch (format) {
    case "iso":
      return `${yyyy}-${mm}-${dd}`;
    case "us":
      return `${mm}/${dd}/${yyyy}`;
    case "br":
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

/**
 * Generates a random past date.
 * @param format - Output format: `"iso"` (`YYYY-MM-DD`), `"br"` (`DD/MM/YYYY`), or `"us"` (`MM/DD/YYYY`)
 * @returns Formatted date string
 */
export function generateDate(format: "iso" | "br" | "us" = "br"): string {
  const date = faker.date.past({ years: 5 });
  return formatDate(date, format);
}

/**
 * Generates a random birth date in ISO format (`YYYY-MM-DD`).
 * @param minAge - Minimum age in years (default: `18`)
 * @param maxAge - Maximum age in years (default: `65`)
 */
export function generateBirthDate(minAge = 18, maxAge = 65): string {
  const date = faker.date.birthdate({ min: minAge, max: maxAge, mode: "age" });
  return formatDate(date, "iso");
}

/**
 * Generates a random future date in ISO format (`YYYY-MM-DD`).
 * @param maxDaysAhead - Maximum number of days into the future (default: `365`)
 */
export function generateFutureDate(maxDaysAhead = 365): string {
  const now = new Date();
  const refDate = new Date(now.getTime() + maxDaysAhead * 86_400_000);
  const date = faker.date.between({ from: now, to: refDate });
  return formatDate(date, "iso");
}

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

export function generateDate(format: "iso" | "br" | "us" = "br"): string {
  const date = faker.date.past({ years: 5 });
  return formatDate(date, format);
}

export function generateBirthDate(minAge = 18, maxAge = 65): string {
  const date = faker.date.birthdate({ min: minAge, max: maxAge, mode: "age" });
  return formatDate(date, "iso");
}

export function generateFutureDate(maxDaysAhead = 365): string {
  const now = new Date();
  const refDate = new Date(now.getTime() + maxDaysAhead * 86_400_000);
  const date = faker.date.between({ from: now, to: refDate });
  return formatDate(date, "iso");
}

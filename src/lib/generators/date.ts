/**
 * Date generator — powered by faker
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/** Supported date output formats. */
export type DateFormat = "iso" | "br" | "us";

export function formatDate(date: Date, format: DateFormat): string {
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
 * Detects the expected date format for a field from its HTML attributes.
 *
 * Priority order:
 * 1. `inputType === "date"` → ISO (native browser date picker requires YYYY-MM-DD)
 * 2. `placeholder` text hinting at the format (e.g. "DD/MM/YYYY" → "br")
 * 3. `pattern` attribute structure hints
 * 4. Default: "iso"
 *
 * @param field - Subset of FormField attributes to inspect
 * @returns The detected date format
 */
export function detectDateFormat(field: {
  inputType?: string;
  placeholder?: string;
  pattern?: string;
}): DateFormat {
  // Native <input type="date"> always requires YYYY-MM-DD
  if (field.inputType === "date") return "iso";

  const ph = (field.placeholder ?? "").toUpperCase();
  if (ph.length > 0) {
    const ddPos = ph.indexOf("DD");
    const mmPos = ph.indexOf("MM");
    const yyyyPos = Math.max(ph.indexOf("YYYY"), ph.indexOf("AAAA"));

    // YYYY/AAAA appears first → ISO (e.g. "YYYY-MM-DD")
    if (yyyyPos >= 0 && (mmPos < 0 || yyyyPos < mmPos)) return "iso";

    // DD appears before MM → BR (e.g. "DD/MM/YYYY" or "dd/mm/aaaa")
    if (ddPos >= 0 && mmPos >= 0 && ddPos < mmPos) return "br";

    // MM appears before DD → US (e.g. "MM/DD/YYYY")
    if (ddPos >= 0 && mmPos >= 0 && mmPos < ddPos) return "us";
  }

  // Inspect HTML `pattern` attribute for structural clues
  const pat = field.pattern ?? "";
  if (pat) {
    // Starts with 4-digit year: \d{4} or [0-9]{4} → ISO
    if (/^(\\d\{4\}|\[0-9\]\{4\})/.test(pat)) return "iso";
    // Year at end: \d{4}$ → likely BR or US, default to BR (Brazilian context)
    if (/(\\d\{4\}|\[0-9\]\{4\})\s*$/.test(pat)) return "br";
  }

  return "iso";
}

/**
 * Reformats an ISO date string (`YYYY-MM-DD`) into the specified format.
 * Returns the original string unchanged if it cannot be parsed as ISO.
 *
 * @param isoDate - Date string in `YYYY-MM-DD` format
 * @param format - Target output format
 */
export function reformatDate(isoDate: string, format: DateFormat): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const [, yyyy, mm, dd] = match;
  switch (format) {
    case "br":
      return `${dd}/${mm}/${yyyy}`;
    case "us":
      return `${mm}/${dd}/${yyyy}`;
    case "iso":
      return isoDate;
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

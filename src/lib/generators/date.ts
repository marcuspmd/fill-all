/**
 * Date generator for various formats
 */

export function generateDate(format: "iso" | "br" | "us" = "br"): string {
  const year = 1960 + Math.floor(Math.random() * 50); // 1960-2010
  const month = Math.floor(Math.random() * 12) + 1;
  const maxDay = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * maxDay) + 1;

  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");

  switch (format) {
    case "iso":
      return `${year}-${mm}-${dd}`;
    case "us":
      return `${mm}/${dd}/${year}`;
    case "br":
    default:
      return `${dd}/${mm}/${year}`;
  }
}

export function generateBirthDate(minAge = 18, maxAge = 65): string {
  const now = new Date();
  const year =
    now.getFullYear() - minAge - Math.floor(Math.random() * (maxAge - minAge));
  const month = Math.floor(Math.random() * 12) + 1;
  const maxDay = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * maxDay) + 1;

  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");

  return `${year}-${mm}-${dd}`;
}

export function generateFutureDate(maxDaysAhead = 365): string {
  const now = new Date();
  const futureMs =
    now.getTime() + Math.floor(Math.random() * maxDaysAhead * 86400000);
  const future = new Date(futureMs);

  const dd = String(future.getDate()).padStart(2, "0");
  const mm = String(future.getMonth() + 1).padStart(2, "0");
  const yyyy = future.getFullYear();

  return `${yyyy}-${mm}-${dd}`;
}

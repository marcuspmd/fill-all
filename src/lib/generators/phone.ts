/**
 * Brazilian phone number generator
 */

/** Valid Brazilian DDD area codes organized by state */
const DDD_CODES = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19", // SP
  "21",
  "22",
  "24", // RJ
  "27",
  "28", // ES
  "31",
  "32",
  "33",
  "34",
  "35",
  "37",
  "38", // MG
  "41",
  "42",
  "43",
  "44",
  "45",
  "46", // PR
  "47",
  "48",
  "49", // SC
  "51",
  "53",
  "54",
  "55", // RS
  "61", // DF
  "62",
  "64", // GO
  "63", // TO
  "65",
  "66", // MT
  "67", // MS
  "68", // AC
  "69", // RO
  "71",
  "73",
  "74",
  "75",
  "77", // BA
  "79", // SE
  "81",
  "87", // PE
  "82", // AL
  "83", // PB
  "84", // RN
  "85",
  "88", // CE
  "86",
  "89", // PI
  "91",
  "93",
  "94", // PA
  "92",
  "97", // AM
  "95", // RR
  "96", // AP
  "98",
  "99", // MA
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(count: number): string {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

/**
 * Generates a random Brazilian phone number with valid DDD area code.
 * @param formatted - Whether to format as `(XX) XXXXX-XXXX` (default: `true`)
 * @param mobile - Whether to generate a mobile number with 9-digit prefix (default: `true`)
 * @returns A Brazilian phone number string
 */
export function generatePhone(formatted = true, mobile = true): string {
  const ddd = randomItem(DDD_CODES);
  const prefix = mobile ? "9" : String(Math.floor(Math.random() * 5) + 2);
  const number = prefix + randomDigits(mobile ? 8 : 7);

  if (!formatted) return `${ddd}${number}`;

  return `(${ddd}) ${number.slice(0, mobile ? 5 : 4)}-${number.slice(mobile ? 5 : 4)}`;
}

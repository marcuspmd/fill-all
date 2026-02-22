/**
 * Field Detection Overlay
 *
 * Renders ephemeral type-badge annotations on detected form fields,
 * providing real-time visual feedback during streaming detection.
 *
 * Usage:
 *   for await (const field of streamAllFields()) {
 *     showDetectionBadge(field.element, field.fieldType, field.detectionMethod);
 *   }
 *   // badges auto-fade — or call clearAllBadges() to remove immediately
 */

const BADGE_ATTR = "data-fill-all-badge";
const STYLE_ID = "fill-all-overlay-styles";
const BADGE_LIFETIME_MS = 3500;

/** Color per field type — maps to the same palette used in the inspect modal. */
const TYPE_COLOR: Record<string, string> = {
  cpf: "#dc2626",
  cnpj: "#b91c1c",
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
  unknown: "#94a3b8",
};

/** Small icon indicating which classifier detected the type. */
const METHOD_ICON: Partial<Record<string, string>> = {
  "html-type": "⚡",
  keyword: "🔑",
  tensorflow: "🧠",
  "chrome-ai": "✨",
  "html-fallback": "❓",
  "custom-select": "📋",
  interactive: "🎛",
  "user-override": "👤",
};

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${BADGE_ATTR}] {
      position: fixed;
      z-index: 2147483645;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
      padding: 2px 5px 3px;
      border-radius: 3px;
      color: #fff;
      pointer-events: none;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    [${BADGE_ATTR}].fa-badge-in] {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Shows a colored type badge anchored just above the top-right corner of the
 * given element. The badge fades out automatically after BADGE_LIFETIME_MS.
 */
export function showDetectionBadge(
  element: Element,
  fieldType: string,
  method?: string,
): void {
  ensureStyles();

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const badge = document.createElement("div");
  badge.setAttribute(BADGE_ATTR, "");
  badge.style.background = TYPE_COLOR[fieldType] ?? "#64748b";

  const icon = method ? (METHOD_ICON[method] ?? "") : "";
  badge.textContent = icon ? `${icon} ${fieldType}` : fieldType;

  // Anchor: just above the top-right corner of the field
  badge.style.top = `${Math.max(0, rect.top - 20)}px`;
  badge.style.left = `${rect.right}px`;
  badge.style.transform = "translateX(-100%)";

  document.body.appendChild(badge);

  // Animate in on next frame
  requestAnimationFrame(() => {
    badge.style.opacity = "1";
  });

  // Auto-fade and remove
  setTimeout(() => {
    badge.style.transition = "opacity 0.3s ease";
    badge.style.opacity = "0";
    setTimeout(() => badge.remove(), 320);
  }, BADGE_LIFETIME_MS);
}

/**
 * Immediately removes all active detection badges from the page.
 */
export function clearAllBadges(): void {
  document.querySelectorAll(`[${BADGE_ATTR}]`).forEach((el) => el.remove());
}

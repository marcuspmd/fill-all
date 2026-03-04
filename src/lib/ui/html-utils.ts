/**
 * Shared HTML utility functions used across popup and devtools panel.
 */

/** Escapes HTML entities to prevent XSS when inserting user-supplied text. */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escapes HTML entities using regex — safe for attribute values and innerHTML.
 * Escapes &, <, >, and " (but not '). Use in content scripts (no DOM required).
 */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapes characters for use inside HTML attribute values. */
export function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

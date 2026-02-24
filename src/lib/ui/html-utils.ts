/**
 * Shared HTML utility functions used across popup, devtools panel, and floating panel.
 */

/** Escapes HTML entities to prevent XSS when inserting user-supplied text. */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

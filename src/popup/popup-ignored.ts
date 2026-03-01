/**
 * Popup — ignored fields section
 */

import type { IgnoredField } from "@/types";
import { t } from "@/lib/i18n";
import { sendToBackground, escapeHtml } from "./popup-messaging";

export async function loadIgnoredFields(): Promise<void> {
  const ignored = (await sendToBackground({ type: "GET_IGNORED_FIELDS" })) as
    | IgnoredField[]
    | null;
  const list = document.getElementById("ignored-fields-list");
  const section = document.getElementById("section-ignored");
  if (!list || !section) return;

  list.innerHTML = "";
  if (!Array.isArray(ignored) || ignored.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";

  for (const field of ignored) {
    const item = document.createElement("div");
    item.className = "list-item";

    let displayUrl = field.urlPattern;
    try {
      displayUrl = new URL(field.urlPattern).hostname;
    } catch {
      // keep original
    }

    item.innerHTML = `
      <div class="field-info">
        <span class="field-label">${escapeHtml(field.label)}</span>
        <span class="ignored-url">${escapeHtml(displayUrl)}</span>
      </div>
      <button class="btn btn-sm btn-delete" title="${t("stopIgnoring")}">✕</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await sendToBackground({
        type: "REMOVE_IGNORED_FIELD",
        payload: field.id,
      });
      await loadIgnoredFields();
    });

    list.appendChild(item);
  }
}

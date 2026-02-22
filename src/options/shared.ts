/**
 * Shared utilities for the Options page.
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(".tab"));
  const contents = Array.from(
    document.querySelectorAll<HTMLElement>(".tab-content"),
  );

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) t.classList.remove("active");
      for (const c of contents) c.classList.remove("active");

      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      if (!tabId) return;
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add("active");
    });
  }
}

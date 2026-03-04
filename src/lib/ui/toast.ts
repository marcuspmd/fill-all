/**
 * Toast notification utility — shows a temporary message in the UI.
 * Framework-agnostic, works in popup, options and devtools panel.
 */

export type ToastType = "success" | "error" | "info" | "warning";

export function showToast(message: string, type: ToastType = "success"): void {
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

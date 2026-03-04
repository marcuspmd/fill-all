/**
 * Tab navigation utility — activates/deactivates native HTML tab elements.
 * Works with any element that has `.tab` and `.tab-content` CSS classes.
 */

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

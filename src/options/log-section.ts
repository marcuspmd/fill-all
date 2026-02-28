/**
 * Options page — Log tab section.
 *
 * Renders a persistent log viewer using the shared log-viewer component.
 */

import type { LogViewer } from "@/lib/logger/log-viewer";
import { createLogViewer, getLogViewerStyles } from "@/lib/logger/log-viewer";

let viewer: LogViewer | null = null;

export function initLogTab(): void {
  // Inject log viewer styles once
  const style = document.createElement("style");
  style.textContent = getLogViewerStyles("options");
  document.head.appendChild(style);

  // Observe when the log tab becomes visible to init the viewer
  const tabContent = document.getElementById("tab-log");
  if (!tabContent) return;

  const observer = new MutationObserver(() => {
    if (tabContent.classList.contains("active")) {
      setupViewer();
      observer.disconnect();
    }
  });

  observer.observe(tabContent, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Also check if already active (e.g. deep link)
  if (tabContent.classList.contains("active")) {
    setupViewer();
    observer.disconnect();
  }
}

function setupViewer(): void {
  if (viewer) return;

  const container = document.getElementById("options-log-viewer");
  if (!container) return;

  viewer = createLogViewer({ container, variant: "options" });
  void viewer.refresh();
}

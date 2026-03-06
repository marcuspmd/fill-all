/**
 * Log Tab — Renders the embedded log viewer in the DevTools panel.
 *
 * Responsibilities:
 * - Mount and unmount the LogViewer component into the panel content area
 * - Dispose previous instances to avoid memory leaks on tab switches
 */

import { panelState } from "../panel-state";
import { renderTo, LogTabView } from "@/lib/ui/components";

// ── Render ────────────────────────────────────────────────────────────────────

export function renderLogTab(): void {
  const content = document.getElementById("content");

  // Provide a proxy ref so LogTabView stores its instance back into panelState
  const viewerRef = {
    get current() {
      return panelState.logViewerInstance;
    },
    set current(v) {
      panelState.logViewerInstance = v;
    },
  };

  renderTo(content, <LogTabView viewerRef={viewerRef} />);
}

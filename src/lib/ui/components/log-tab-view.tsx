/**
 * LogTabView — Preact component for the DevTools Log tab.
 *
 * Renders a container div and mounts the LogViewer instance into it
 * via useEffect, disposing any previous instance on cleanup.
 */

import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { createLogViewer, type LogViewer } from "@/lib/logger/log-viewer";

// ── Component ─────────────────────────────────────────────────────────────────

export interface LogTabViewProps {
  /** Pass the current viewer instance (or null) so the component can dispose it. */
  viewerRef: { current: LogViewer | null };
}

export function LogTabView({ viewerRef }: LogTabViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (viewerRef.current) {
      viewerRef.current.dispose();
      viewerRef.current = null;
    }

    const viewer = createLogViewer({ container, variant: "devtools" });
    viewerRef.current = viewer;
    void viewer.refresh();

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="devtools-log-viewer"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    />
  );
}

/**
 * Panel State — Shared mutable state for all DevTools panel modules.
 *
 * All tab modules read/write this object. It is the single source of truth
 * for panel-level state, avoiding prop-drilling and module-level variable sprawl.
 */

import type { DetectedFieldSummary, SavedForm } from "@/types";
import type { FieldEditorSavePayload } from "@/lib/ui/components/field-editor-modal";
import type { LogViewer } from "@/lib/logger/log-viewer";

// ── Types ────────────────────────────────────────────────────────────────────

export type TabId = "actions" | "fields" | "forms" | "record" | "log";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export type RecordStep = {
  type: string;
  selector?: string;
  value?: string;
  waitMs?: number;
  url?: string;
  label?: string;
  assertion?: Record<string, unknown>;
};

// ── Shared State Object ───────────────────────────────────────────────────────

export const panelState = {
  inspectedTabId: chrome.devtools.inspectedWindow.tabId,

  // UI state
  activeTab: "actions" as TabId,

  // Fields
  detectedFields: [] as DetectedFieldSummary[],
  ignoredSelectors: new Set<string>(),
  watcherActive: false,
  isDetecting: false,

  // Forms
  savedForms: [] as SavedForm[],
  formsLoaded: false,

  // Recording
  recordingState: "idle" as RecordingState,
  recordedStepsPreview: [] as RecordStep[],
  optimizeWithAI: false,
  isOptimizing: false,
  readyScript: null as { script: string; framework: string } | null,

  // Log viewer
  logViewerInstance: null as LogViewer | null,

  // Field editor modal
  editingField: null as DetectedFieldSummary | null,
  editingFieldExistingRule: null as FieldEditorSavePayload | null,
};

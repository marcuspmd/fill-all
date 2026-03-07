/**
 * Panel State — Shared mutable state for all DevTools panel modules.
 *
 * All tab modules read/write this object. It is the single source of truth
 * for panel-level state, avoiding prop-drilling and module-level variable sprawl.
 */

import type { DetectedFieldSummary, SavedForm } from "@/types";
import type { FieldEditorSavePayload } from "@/lib/ui/components/field-editor-modal";
import type { LogViewer } from "@/lib/logger/log-viewer";
import type {
  FlowScript,
  ReplayProgress,
  ReplayStatus,
  ReplaySpeed,
} from "@/lib/demo";

// ── Types ────────────────────────────────────────────────────────────────────

export type TabId = "actions" | "fields" | "forms" | "record" | "demo" | "log";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export type PanelTheme = "dark" | "light" | "system";

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
  theme: ((): PanelTheme => {
    const stored = localStorage.getItem("panel-theme");
    return stored === "light" || stored === "system" ? stored : "dark";
  })() as PanelTheme,

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

  // Demo
  demoFlows: [] as FlowScript[],
  demoFlowsLoaded: false,
  demoReplayStatus: "idle" as ReplayStatus,
  demoReplayProgress: null as ReplayProgress | null,
  demoActiveFlowId: null as string | null,
  demoNameInput: "",
  demoSeedInput: "demo",
  demoReplaySpeed: "normal" as ReplaySpeed,
  demoShowCursor: true,
  demoEditingFlowId: null as string | null,
  demoEditingStepIdx: null as number | null,
  // Video recording state (managed entirely in DevTools panel)
  videoRecording: false,
  videoMediaRecorder: null as MediaRecorder | null,
  videoChunks: [] as Blob[],
  videoBlob: null as Blob | null,
  // Per-demo video tracking: which flow is being recorded / has a ready blob
  videoRecordingForFlowId: null as string | null,
  videoReadyForFlowId: null as string | null,
};

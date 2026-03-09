/**
 * DevTools Panel — Coordinator
 *
 * Orchestrates tab rendering, UI lifecycle, and chrome event listeners.
 * All implementation details live in dedicated modules:
 *  - panel-state.ts   : Shared mutable state
 *  - panel-messaging.ts: Chrome runtime + inspected page communication
 *  - panel-utils.ts   : Pure helper functions (addLog, updateStatusBar, …)
 *  - tabs/actions-tab.tsx, fields-tab.tsx, forms-tab.tsx, record-tab.tsx, log-tab.tsx
 */

import { h } from "preact";
import "../lib/ui/searchable-select.css";
import "../lib/ui/components/field-editor-modal.css";
import { initI18n } from "@/lib/i18n";
import { getLogViewerStyles } from "@/lib/logger/log-viewer";
import type { TabId, RecordStep, PanelTheme } from "./panel-state";
import { panelState } from "./panel-state";
import { sendToPage } from "./panel-messaging";
import { addLog, updateStatusBar } from "./panel-utils";
import { renderTo, AppShell } from "@/lib/ui/components";
import { renderActionsTab } from "./tabs/actions-tab";
import { renderFieldsTab } from "./tabs/fields-tab";
import { renderFormsTab, loadForms } from "./tabs/forms-tab";
import { renderRecordTab } from "./tabs/record-tab";
import { renderLogTab } from "./tabs/log-tab";
import {
  renderDemoTab,
  loadDemoFlows,
  applyReplayProgress,
  applyReplayComplete,
} from "./tabs/demo-tab";
import type { ReplayProgress } from "@/lib/demo";

// ── Theme ────────────────────────────────────────────────────────────────────

const THEME_CYCLE: Record<PanelTheme, PanelTheme> = {
  dark: "light",
  light: "system",
  system: "dark",
};

function applyTheme(theme: PanelTheme): void {
  document.body.dataset.theme = theme;
}

function toggleTheme(): void {
  panelState.theme = THEME_CYCLE[panelState.theme];
  localStorage.setItem("panel-theme", panelState.theme);
  applyTheme(panelState.theme);
  renderShell();
}

// ── App Shell ─────────────────────────────────────────────────────────────────

function renderShell(): void {
  const app = document.getElementById("app");
  renderTo(
    app,
    h(AppShell, {
      activeTab: panelState.activeTab,
      onTabSwitch: switchTab,
      theme: panelState.theme,
      onThemeToggle: toggleTheme,
      onOptions: () => {
        chrome.runtime.openOptionsPage();
        addLog("Opening options…", "info");
      },
    }),
  );
}

function renderApp(): void {
  renderShell();
  renderActiveTab();
}

function switchTab(tab: TabId): void {
  panelState.activeTab = tab;
  renderShell(); // re-render toolbar to update active-tab class
  renderActiveTab(); // re-render content area
}

function renderActiveTab(): void {
  switch (panelState.activeTab) {
    case "actions":
      renderActionsTab();
      break;
    case "fields":
      renderFieldsTab();
      break;
    case "forms":
      renderFormsTab();
      void loadForms();
      break;
    case "record":
      renderRecordTab();
      break;
    case "demo":
      renderDemoTab();
      void loadDemoFlows();
      break;
    case "log":
      renderLogTab();
      break;
  }
}

// ── Recording Listener ────────────────────────────────────────────────────────

const runtimeMessageListener = (
  message: { type?: string; payload?: Record<string, unknown> },
  sender: chrome.runtime.MessageSender,
) => {
  if (sender.tab?.id !== panelState.inspectedTabId) return;

  if (message.type === "RECORDING_RESTORED") {
    const p = message.payload as { steps?: RecordStep[] } | undefined;
    if (Array.isArray(p?.steps)) {
      panelState.recordedStepsPreview = p.steps;
      renderRecordTab();
    }
  }

  if (message.type === "RECORDING_STEP_ADDED") {
    const p = message.payload as { step?: RecordStep } | undefined;
    if (p?.step) {
      panelState.recordedStepsPreview.push(p.step);
      renderRecordTab();
    }
  }

  if (message.type === "RECORDING_STEP_UPDATED") {
    const p = message.payload as
      | { step?: RecordStep; index?: number }
      | undefined;
    if (
      p?.step &&
      typeof p.index === "number" &&
      panelState.recordedStepsPreview[p.index]
    ) {
      panelState.recordedStepsPreview[p.index] = p.step;
      renderRecordTab();
    }
  }

  if (message.type === "DEMO_REPLAY_PROGRESS") {
    applyReplayProgress(message.payload as unknown as ReplayProgress);
  }

  if (message.type === "DEMO_REPLAY_COMPLETE") {
    const p = message.payload as
      | { status?: "completed" | "failed" }
      | undefined;
    applyReplayComplete(p?.status ?? "completed");
  }
};

chrome.runtime.onMessage.addListener(runtimeMessageListener);

/**
 * Cleanup function to be called when the panel is destroyed.
 */
export function destroyPanel(): void {
  try {
    chrome.runtime.onMessage.removeListener(runtimeMessageListener);
  } catch {
    // Ignore cleanup errors
  }
}

// ── Navigation Listener ───────────────────────────────────────────────────────

chrome.devtools.network.onNavigated.addListener(() => {
  panelState.detectedFields = [];
  panelState.watcherActive = false;
  // When recording is active, preserve recorded steps — RECORDING_RESTORED will
  // arrive from the content script with the full list (including the new navigate
  // step and any network assert). When stopped, clear so the panel is fresh.
  if (
    panelState.recordingState === "stopped" ||
    panelState.recordingState === "idle"
  ) {
    panelState.recordedStepsPreview = [];
  }
  if (
    panelState.recordingState !== "recording" &&
    panelState.recordingState !== "paused" &&
    panelState.recordingState !== "stopped"
  ) {
    panelState.recordingState = "idle";
  }
  panelState.ignoredSelectors.clear();
  renderActiveTab();
  updateStatusBar();
});

// ── Init ──────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const settings = (await chrome.runtime.sendMessage({
    type: "GET_SETTINGS",
  })) as { uiLanguage?: "auto" | "en" | "pt_BR" } | null;
  await initI18n(settings?.uiLanguage ?? "auto");

  // Apply saved theme
  applyTheme(panelState.theme);

  // Sync watcher state from content script
  const watcherStatus = (await sendToPage({ type: "GET_WATCHER_STATUS" }).catch(
    () => null,
  )) as { watching: boolean } | null;
  panelState.watcherActive = watcherStatus?.watching ?? false;

  // Inject log viewer styles
  const lvStyle = document.createElement("style");
  lvStyle.textContent = getLogViewerStyles("devtools");
  document.head.appendChild(lvStyle);

  renderApp();
}

void init();

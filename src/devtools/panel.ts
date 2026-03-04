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
import { initI18n } from "@/lib/i18n";
import { getLogViewerStyles } from "@/lib/logger/log-viewer";
import type { TabId, RecordStep } from "./panel-state";
import { panelState } from "./panel-state";
import { sendToPage } from "./panel-messaging";
import { addLog, updateStatusBar } from "./panel-utils";
import { renderTo } from "./components";
import { AppShell } from "@/lib/ui/components";
import { renderActionsTab } from "./tabs/actions-tab";
import { renderFieldsTab } from "./tabs/fields-tab";
import { renderFormsTab, loadForms } from "./tabs/forms-tab";
import { renderRecordTab, renderRecordStepsTable } from "./tabs/record-tab";
import { renderLogTab } from "./tabs/log-tab";

// ── App Shell ─────────────────────────────────────────────────────────────────

function renderShell(): void {
  const app = document.getElementById("app");
  renderTo(
    app,
    h(AppShell, {
      activeTab: panelState.activeTab,
      onTabSwitch: switchTab,
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
    case "log":
      renderLogTab();
      break;
  }
}

// ── Recording Listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: { type?: string; payload?: Record<string, unknown> }, sender) => {
    if (sender.tab?.id !== panelState.inspectedTabId) return;

    if (message.type === "RECORDING_RESTORED") {
      const p = message.payload as { steps?: RecordStep[] } | undefined;
      if (Array.isArray(p?.steps)) {
        panelState.recordedStepsPreview = p.steps;
        renderRecordStepsTable();
      }
    }

    if (message.type === "RECORDING_STEP_ADDED") {
      const p = message.payload as { step?: RecordStep } | undefined;
      if (p?.step) {
        panelState.recordedStepsPreview.push(p.step);
        renderRecordStepsTable();
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
        renderRecordStepsTable();
      }
    }
  },
);

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

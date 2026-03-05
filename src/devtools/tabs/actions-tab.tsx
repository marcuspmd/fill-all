/**
 * Actions Tab — Main action cards for the DevTools panel.
 *
 * Responsibilities:
 * - Render the actions grid (fill, watch, save, detect)
 * - Toggle DOM watcher state
 */

import { t } from "@/lib/i18n";
import { panelState } from "../panel-state";
import { sendToPage } from "../panel-messaging";
import { addLog } from "../panel-utils";
import { renderTo, ActionsTabView } from "@/lib/ui/components";
import {
  detectFields,
  fillAll,
  fillOnlyEmpty,
  fillContextualAI,
} from "./fields-tab";
import { saveCurrentForm } from "./forms-tab";

// ── Watcher ───────────────────────────────────────────────────────────────────

export async function toggleWatch(): Promise<void> {
  if (panelState.watcherActive) {
    await sendToPage({ type: "STOP_WATCHING" });
    panelState.watcherActive = false;
    addLog(t("logWatchDeactivated"), "info");
  } else {
    await sendToPage({ type: "START_WATCHING", payload: { autoRefill: true } });
    panelState.watcherActive = true;
    addLog(t("logWatchActivated"), "success");
  }
  renderActionsTab();
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderActionsTab(): void {
  const content = document.getElementById("content");
  renderTo(
    content,
    <ActionsTabView
      watcherActive={panelState.watcherActive}
      detectedCount={panelState.detectedFields.length}
      onFillAll={() => void fillAll()}
      onFillEmpty={() => void fillOnlyEmpty()}
      onFillContextualAI={() => void fillContextualAI()}
      onSave={() => void saveCurrentForm()}
      onToggleWatch={() => void toggleWatch()}
      onDetect={() => void detectFields()}
    />,
  );
}

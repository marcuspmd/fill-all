/**
 * Record Tab — E2E recording controls, step preview, and script export.
 *
 * Responsibilities:
 * - Start / stop / pause / resume recording
 * - Display recorded steps in real-time
 * - Allow inline editing / removal of steps
 * - Export recorded script (Playwright, Cypress, Pest/Dusk) with optional AI optimisation
 */

import { t } from "@/lib/i18n";
import { panelState } from "../panel-state";
import {
  sendToPage,
  sendToBackground,
  getInspectedPageInfo,
} from "../panel-messaging";
import { addLog } from "../panel-utils";
import { renderTo, RecordTabView } from "@/lib/ui/components";

// ── Recording Controls ────────────────────────────────────────────────────────

export async function startRecording(): Promise<void> {
  try {
    await sendToPage({ type: "START_RECORDING" });
    panelState.recordingState = "recording";
    panelState.recordedStepsPreview = [];
    addLog(t("logRecordStarted"), "success");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

export async function stopRecording(): Promise<void> {
  try {
    await sendToPage({ type: "STOP_RECORDING" });
    panelState.recordingState = "stopped";
    addLog(t("logRecordStopped"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

export async function pauseRecording(): Promise<void> {
  try {
    await sendToPage({ type: "PAUSE_RECORDING" });
    panelState.recordingState = "paused";
    addLog(t("logRecordPaused"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

export async function resumeRecording(): Promise<void> {
  try {
    await sendToPage({ type: "RESUME_RECORDING" });
    panelState.recordingState = "recording";
    addLog(t("logRecordResumed"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

export async function clearRecording(): Promise<void> {
  try {
    await sendToPage({ type: "CLEAR_RECORDING" });
    panelState.recordedStepsPreview = [];
    panelState.recordingState = "idle";
    addLog(t("logRecordStopped"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

// ── Step Editing ──────────────────────────────────────────────────────────────

async function removeRecordStep(index: number): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "REMOVE_RECORDING_STEP",
      payload: { index },
    })) as { success?: boolean };
    if (result?.success) {
      panelState.recordedStepsPreview.splice(index, 1);
      renderRecordTab();
    }
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function updateRecordStep(index: number, value: string): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "UPDATE_RECORDING_STEP",
      payload: { index, patch: { value } },
    })) as { success?: boolean };
    if (result?.success) {
      panelState.recordedStepsPreview[index].value = value;
      renderRecordTab();
    }
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

export async function refreshRecordPreview(): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "GET_RECORDING_STEPS",
    })) as {
      steps?: Array<{
        type: string;
        selector?: string;
        value?: string;
        waitMs?: number;
        url?: string;
      }>;
    };
    if (result?.steps) {
      panelState.recordedStepsPreview = result.steps;
    }
  } catch {
    // silent
  }
  renderRecordTab();
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportRecording(framework: string): Promise<void> {
  if (panelState.isOptimizing) return;

  try {
    const result = (await sendToPage({
      type: "EXPORT_RECORDING",
      payload: {
        framework,
        options: {
          includeAssertions: true,
          smartSelectors: true,
          smartWaits: true,
        },
      },
    })) as { script?: string; error?: string };

    if (!result?.script) {
      addLog(result?.error ?? t("logRecordExportError"), "error");
      return;
    }

    let finalScript = result.script;
    let wasOptimized = false;

    if (panelState.optimizeWithAI) {
      panelState.isOptimizing = true;
      renderRecordTab();
      addLog(t("logRecordOptimizing"), "info");

      try {
        const [pageUrl, pageTitle] = await getInspectedPageInfo();

        const optimized = (await sendToBackground({
          type: "AI_OPTIMIZE_SCRIPT",
          payload: {
            script: result.script,
            framework,
            pageUrl,
            pageTitle,
            pageContext: undefined,
          },
        })) as string | null;

        if (optimized) {
          finalScript = optimized;
          wasOptimized = true;
          addLog(`${t("logRecordOptimized")} (${framework})`, "success");
        } else {
          addLog(t("logRecordOptimizeFailed"), "warn");
        }
      } finally {
        panelState.isOptimizing = false;
      }
    }

    panelState.readyScript = {
      script: finalScript,
      framework: `${framework}${wasOptimized ? " ✨" : ""}`,
    };
    renderRecordTab();
  } catch (err) {
    panelState.isOptimizing = false;
    renderRecordTab();
    addLog(`${t("logRecordExportError")}: ${err}`, "error");
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderRecordTab(): void {
  const content = document.getElementById("content");
  renderTo(
    content,
    <RecordTabView
      recordingState={panelState.recordingState}
      steps={panelState.recordedStepsPreview}
      optimizeWithAI={panelState.optimizeWithAI}
      isOptimizing={panelState.isOptimizing}
      readyScript={panelState.readyScript}
      onStart={() => void startRecording()}
      onStop={() => void stopRecording()}
      onPause={() => void pauseRecording()}
      onResume={() => void resumeRecording()}
      onClear={() => void clearRecording()}
      onExport={(fw) => void exportRecording(fw)}
      onCopyScript={() => {
        if (!panelState.readyScript) return;
        void navigator.clipboard
          .writeText(panelState.readyScript.script)
          .then(() => {
            addLog(
              `${t("logRecordExported")} (${panelState.readyScript!.framework})`,
              "success",
            );
          });
      }}
      onDismissScript={() => {
        panelState.readyScript = null;
        renderRecordTab();
      }}
      onToggleOptimizeAI={(checked) => {
        panelState.optimizeWithAI = checked;
      }}
      onRemoveStep={(index) => void removeRecordStep(index)}
      onUpdateStep={(index, value) => void updateRecordStep(index, value)}
    />,
  );
}

/**
 * @deprecated Use renderRecordTab() — Preact handles partial updates.
 * Kept for backward-compatible callers in panel.ts.
 */
export function renderRecordStepsTable(): void {
  renderRecordTab();
}

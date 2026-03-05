/**
 * Demo Tab — UI for the Auto Demo Generator feature.
 *
 * Responsibilities:
 * - Convert the current recording (from the Record tab) into a named FlowScript
 * - Manage the library of saved demo flows
 * - Start / pause / resume / stop flow replay in the inspected tab
 * - Show real-time replay progress
 * - Export a FlowScript as a JSON file
 */

import { t } from "@/lib/i18n";
import { panelState } from "../panel-state";
import { sendToBackground } from "../panel-messaging";
import { addLog } from "../panel-utils";
import { renderTo } from "../components";
import type { FlowScript, FlowStep, ReplayProgress } from "@/lib/demo";
import { DEFAULT_REPLAY_CONFIG, SPEED_PRESETS } from "@/lib/demo";

// ── Render entrypoint ─────────────────────────────────────────────────────────

export function renderDemoTab(): void {
  const content = document.getElementById("content");
  renderTo(content, <DemoTabView />);
}

// ── Demo Tab Component ────────────────────────────────────────────────────────

function DemoTabView() {
  return (
    <div class="demo-tab">
      <ConvertSection />
      <DemoReplayOptions />
      <DemoLibrary />
      <ReplayStatus />
    </div>
  );
}

// ── Section 1: Convert Recording → Demo ──────────────────────────────────────

function ConvertSection() {
  const hasSteps = panelState.recordedStepsPreview.length > 0;

  if (!hasSteps) {
    return (
      <section class="demo-section">
        <h3 class="demo-section-title">🎬 {t("demoConvertTitle")}</h3>
        <p class="demo-hint">{t("demoConvertHint")}</p>
      </section>
    );
  }

  return (
    <section class="demo-section">
      <h3 class="demo-section-title">🎬 {t("demoConvertTitle")}</h3>
      <p class="demo-hint">
        {t(
          "demoConvertHintReady",
          String(panelState.recordedStepsPreview.length),
        )}
      </p>
      <div class="demo-form-row">
        <label class="demo-label">{t("demoFlowName")}</label>
        <input
          class="demo-input"
          type="text"
          value={panelState.demoNameInput}
          placeholder={t("demoFlowNamePlaceholder")}
          onInput={(e) => {
            panelState.demoNameInput = (e.target as HTMLInputElement).value;
          }}
        />
      </div>
      <div class="demo-form-row">
        <label class="demo-label">{t("demoSeed")}</label>
        <input
          class="demo-input"
          type="text"
          value={panelState.demoSeedInput}
          placeholder="demo"
          onInput={(e) => {
            panelState.demoSeedInput = (e.target as HTMLInputElement).value;
          }}
        />
      </div>
      <button
        class="btn btn-primary"
        onClick={() => void saveRecordingAsDemo()}
      >
        💾 {t("demoSaveAsDemo")}
      </button>
    </section>
  );
}

// ── Section 2: Replay Options ─────────────────────────────────────────────────

const SPEED_LABELS: Record<string, string> = {
  instant: "⚡ Instant",
  fast: "🐇 Rápido",
  normal: "🚶 Normal",
  slow: "🐢 Lento",
};

function DemoReplayOptions() {
  return (
    <section class="demo-section demo-replay-options">
      <h3 class="demo-section-title">⚙️ {t("demoReplayOptionsTitle")}</h3>
      <div class="demo-replay-options-row">
        <label class="demo-label">{t("demoReplaySpeed")}</label>
        <select
          class="demo-select"
          value={panelState.demoReplaySpeed}
          onChange={(e) => {
            panelState.demoReplaySpeed = (e.target as HTMLSelectElement)
              .value as typeof panelState.demoReplaySpeed;
            renderDemoTab();
          }}
        >
          {(["instant", "fast", "normal", "slow"] as const).map((s) => (
            <option key={s} value={s}>
              {SPEED_LABELS[s]}
            </option>
          ))}
        </select>

        <label class="demo-label demo-label-inline">
          <input
            type="checkbox"
            checked={panelState.demoShowCursor}
            onChange={(e) => {
              panelState.demoShowCursor = (
                e.target as HTMLInputElement
              ).checked;
              renderDemoTab();
            }}
          />
          {t("demoShowCursor")}
        </label>
      </div>
    </section>
  );
}

// ── Section 3: Demo Library ───────────────────────────────────────────────────

function DemoLibrary() {
  return (
    <section class="demo-section">
      <div class="demo-section-header">
        <h3 class="demo-section-title">📂 {t("demoLibraryTitle")}</h3>
        <div class="demo-section-header-actions">
          <button
            class="btn btn-sm"
            onClick={() => void handleUploadFlow()}
            title="Carregar script JSON"
          >
            📤 Upload
          </button>
          <button
            class="btn btn-sm"
            onClick={() => void loadDemoFlows()}
            title={t("demoRefresh")}
          >
            🔄
          </button>
        </div>
      </div>

      {!panelState.demoFlowsLoaded ? (
        <p class="demo-hint">{t("demoLibraryLoading")}</p>
      ) : panelState.demoFlows.length === 0 ? (
        <p class="demo-hint">{t("demoLibraryEmpty")}</p>
      ) : (
        <table class="demo-table">
          <thead>
            <tr>
              <th>{t("demoColName")}</th>
              <th>{t("demoColSteps")}</th>
              <th>{t("demoColCreated")}</th>
              <th>{t("demoColActions")}</th>
            </tr>
          </thead>
          <tbody>
            {panelState.demoFlows.map((flow) => (
              <>
                <DemoFlowRow key={flow.id} flow={flow} />
                {panelState.demoEditingFlowId === flow.id && (
                  <DemoFlowEditRow key={`edit-${flow.id}`} flow={flow} />
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function DemoFlowRow({ flow }: { flow: FlowScript }) {
  const isActive = panelState.demoActiveFlowId === flow.id;
  const isRunning = isActive && panelState.demoReplayStatus === "running";
  const isPaused = isActive && panelState.demoReplayStatus === "paused";
  const isBusy = isRunning || isPaused;

  const isRecordingVideo = panelState.videoRecordingForFlowId === flow.id;
  const hasVideoBlob =
    panelState.videoReadyForFlowId === flow.id && panelState.videoBlob !== null;
  const anyVideoRecording = panelState.videoRecording;

  return (
    <tr class={isActive ? "demo-row-active" : ""}>
      <td>
        <span class="demo-flow-name">{flow.metadata.name}</span>
        {flow.metadata.description && (
          <span class="demo-flow-desc">{flow.metadata.description}</span>
        )}
      </td>
      <td class="demo-col-center">{flow.steps.length}</td>
      <td class="demo-col-center">
        {new Date(flow.metadata.createdAt).toLocaleDateString()}
      </td>
      <td class="demo-col-actions">
        {/* Replay controls */}
        {!isBusy ? (
          <button
            class="btn btn-sm btn-success"
            title={t("demoReplay")}
            onClick={() => void startReplay(flow)}
          >
            ▶
          </button>
        ) : isRunning ? (
          <>
            <button
              class="btn btn-sm btn-warning"
              title={t("demoPause")}
              onClick={() => void pauseReplay()}
            >
              ⏸
            </button>
            <button
              class="btn btn-sm btn-danger"
              title={t("demoStop")}
              onClick={() => void stopReplay()}
            >
              ⏹
            </button>
          </>
        ) : (
          <>
            <button
              class="btn btn-sm btn-success"
              title={t("demoResume")}
              onClick={() => void resumeReplay()}
            >
              ▶
            </button>
            <button
              class="btn btn-sm btn-danger"
              title={t("demoStop")}
              onClick={() => void stopReplay()}
            >
              ⏹
            </button>
          </>
        )}

        {/* Video controls */}
        {isRecordingVideo ? (
          <button
            class="btn btn-sm btn-danger demo-video-recording-btn"
            title={t("demoVideoStop")}
            onClick={() => stopVideoRecording()}
          >
            🔴 {t("demoVideoStop")}
          </button>
        ) : hasVideoBlob ? (
          <div class="demo-video-actions">
            <button
              class="btn btn-sm btn-success"
              title={t("demoVideoDownload")}
              onClick={() => downloadVideoBlob()}
            >
              📥 {t("demoVideoDownload")}
            </button>
            <button
              class="btn btn-sm"
              title="Descartar gravação"
              onClick={() => discardVideoBlob()}
            >
              🗑️
            </button>
            <button
              class="btn btn-sm btn-video-record"
              title="Gravar novamente"
              disabled={anyVideoRecording}
              onClick={() => void startVideoAndReplay(flow)}
            >
              🔁
            </button>
          </div>
        ) : (
          <button
            class="btn btn-sm btn-video-record"
            title={t("demoVideoRecordAndReplay")}
            disabled={anyVideoRecording || isBusy}
            onClick={() => void startVideoAndReplay(flow)}
          >
            🎥 {t("demoVideoRecord")}
          </button>
        )}

        {/* JSON export & delete */}
        <button
          class="btn btn-sm"
          title={t("demoEditSteps")}
          onClick={() => {
            panelState.demoEditingFlowId =
              panelState.demoEditingFlowId === flow.id ? null : flow.id;
            renderDemoTab();
          }}
        >
          ✏️
        </button>
        <button
          class="btn btn-sm"
          title={t("demoExportJson")}
          onClick={() => exportFlowJson(flow)}
        >
          📥
        </button>
        <button
          class="btn btn-sm btn-danger"
          title={t("demoDelete")}
          onClick={() => void deleteFlow(flow.id)}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}

// ── Demo Step Editor ──────────────────────────────────────────────────────────

function DemoFlowEditRow({ flow }: { flow: FlowScript }) {
  async function saveStepEdits() {
    await sendToBackground({ type: "DEMO_SAVE_FLOW", payload: flow });
    panelState.demoEditingFlowId = null;
    addLog(`Steps de "${flow.metadata.name}" salvos`, "success");
    renderDemoTab();
  }

  function cancelEdit() {
    panelState.demoEditingFlowId = null;
    void loadDemoFlows().then(() => renderDemoTab());
  }

  return (
    <tr class="demo-row-edit-steps">
      <td colspan={4}>
        <div class="demo-steps-editor">
          <p class="demo-steps-editor-title">
            {t("demoEditSteps")}: <strong>{flow.metadata.name}</strong>
          </p>
          <table class="demo-steps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("demoColAction")}</th>
                <th>{t("demoColLabel")}</th>
                <th>{t("demoColTarget")}</th>
                <th>{t("demoColDelayBefore")}</th>
                <th>{t("demoColDelayAfter")}</th>
                <th>{t("demoColOptional")}</th>
              </tr>
            </thead>
            <tbody>
              {flow.steps.map((step, idx) => (
                <DemoStepEditRow
                  key={step.id}
                  step={step}
                  idx={idx}
                  flow={flow}
                />
              ))}
            </tbody>
          </table>
          <div class="demo-steps-actions">
            <button
              class="btn btn-sm btn-primary"
              onClick={() => void saveStepEdits()}
            >
              💾 {t("demoSaveSteps")}
            </button>
            <button class="btn btn-sm" onClick={cancelEdit}>
              ✕ {t("demoCancelEdit")}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function DemoStepEditRow({
  step,
  idx,
  flow,
}: {
  step: FlowStep;
  idx: number;
  flow: FlowScript;
}) {
  function updateStep<K extends keyof FlowStep>(key: K, value: FlowStep[K]) {
    (flow.steps[idx] as unknown as Record<string, unknown>)[key as string] =
      value;
  }

  const hasSelector = step.action !== "navigate" && step.action !== "wait";
  const hasUrl = step.action === "navigate";

  return (
    <tr class="demo-step-edit-row">
      <td class="demo-step-idx">{idx + 1}</td>
      <td>
        <span class={`demo-step-badge demo-step-badge-${step.action}`}>
          {step.action}
        </span>
      </td>
      <td>
        <input
          type="text"
          class="demo-step-input"
          value={step.label ?? ""}
          onInput={(e) => {
            updateStep(
              "label",
              (e.target as HTMLInputElement).value || undefined,
            );
          }}
        />
      </td>
      <td>
        {hasSelector && (
          <input
            type="text"
            class="demo-step-input demo-step-input-selector"
            value={step.selector ?? ""}
            onInput={(e) => {
              updateStep(
                "selector",
                (e.target as HTMLInputElement).value || undefined,
              );
            }}
          />
        )}
        {hasUrl && (
          <input
            type="text"
            class="demo-step-input demo-step-input-selector"
            value={(step as { url?: string }).url ?? ""}
            onInput={(e) => {
              updateStep(
                "url" as keyof FlowStep,
                (e.target as HTMLInputElement).value as never,
              );
            }}
          />
        )}
      </td>
      <td>
        <input
          type="number"
          class="demo-step-input demo-step-input-delay"
          value={step.delayBefore ?? 0}
          min={0}
          step={100}
          onInput={(e) => {
            updateStep(
              "delayBefore",
              Number((e.target as HTMLInputElement).value),
            );
          }}
        />
      </td>
      <td>
        <input
          type="number"
          class="demo-step-input demo-step-input-delay"
          value={step.delayAfter ?? 0}
          min={0}
          step={100}
          onInput={(e) => {
            updateStep(
              "delayAfter",
              Number((e.target as HTMLInputElement).value),
            );
          }}
        />
      </td>
      <td class="demo-step-optional">
        <input
          type="checkbox"
          checked={step.optional ?? false}
          onChange={(e) => {
            updateStep("optional", (e.target as HTMLInputElement).checked);
          }}
        />
      </td>
    </tr>
  );
}

// ── Section 3: Video recording (per-demo, tied to replay) ────────────────────

/**
 * Start recording a video while replaying the given demo.
 * Uses chrome.tabCapture.getMediaStreamId when available (no picker),
 * falling back to getDisplayMedia (shows a system screen picker).
 */
async function startVideoAndReplay(flow: FlowScript): Promise<void> {
  if (panelState.videoRecording) return;

  const tabId = panelState.inspectedTabId;
  if (!tabId) {
    addLog(t("demoVideoErrorNoTab"), "error");
    return;
  }

  try {
    const stream = await captureTabStream(tabId);
    if (!stream) return; // error already logged inside captureTabStream

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    panelState.videoChunks = [];
    panelState.videoBlob = null;
    panelState.videoReadyForFlowId = null;
    panelState.videoMediaRecorder = recorder;

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) panelState.videoChunks.push(e.data);
    };

    recorder.onstop = () => {
      panelState.videoBlob = new Blob(panelState.videoChunks, {
        type: mimeType,
      });
      panelState.videoReadyForFlowId = panelState.videoRecordingForFlowId;
      panelState.videoMediaRecorder = null;
      panelState.videoRecording = false;
      panelState.videoRecordingForFlowId = null;
      stream.getTracks().forEach((t) => t.stop());
      addLog(t("demoVideoStopped"), "success");
      renderDemoTab();
    };

    recorder.start(1000);
    panelState.videoRecording = true;
    panelState.videoRecordingForFlowId = flow.id;
    addLog(t("demoVideoStarted"), "info");
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoVideoErrorStream")}: ${err}`, "error");
    panelState.videoRecording = false;
    panelState.videoRecordingForFlowId = null;
    renderDemoTab();
    return;
  }

  // Start replay after recording started successfully
  await startReplay(flow);
}

/**
 * Obtain a MediaStream capturing the given tab.
 * Requests a tabCapture streamId from the background service worker
 * (only background can call chrome.tabCapture in DevTools context),
 * then uses getUserMedia locally with that id.
 */
async function captureTabStream(tabId: number): Promise<MediaStream | null> {
  const response = (await sendToBackground({
    type: "DEMO_GET_STREAM_ID",
    payload: { tabId },
  })) as { streamId?: string; error?: string } | undefined;

  const streamId = response?.streamId;
  if (!streamId) {
    addLog(
      `${t("demoVideoErrorStream")}: ${response?.error ?? "no streamId returned from background"}`,
      "error",
    );
    return null;
  }

  try {
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    addLog(`${t("demoVideoErrorStream")}: ${err}`, "error");
    return null;
  }
}

// ── Section 4: Replay progress ────────────────────────────────────────────────

function ReplayStatus() {
  const status = panelState.demoReplayStatus;
  const progress = panelState.demoReplayProgress;

  if (status === "idle" || status === "completed" || status === "failed") {
    return null;
  }

  const pct = progress
    ? Math.round(((progress.stepIndex + 1) / progress.total) * 100)
    : 0;

  return (
    <section class="demo-section demo-replay-status">
      <h3 class="demo-section-title">
        {status === "running" ? "▶ " : "⏸ "}
        {t("demoReplayStatusTitle")}
      </h3>
      {progress && (
        <>
          <div class="demo-progress-bar-wrap">
            <div class="demo-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <p class="demo-progress-text">
            {t("demoReplayStep", [
              String(progress.stepIndex + 1),
              String(progress.total),
            ])}
            {" — "}
            {progress.currentAction}
          </p>
        </>
      )}
      <div class="demo-replay-controls">
        {status === "running" && (
          <button
            class="btn btn-sm btn-warning"
            onClick={() => void pauseReplay()}
          >
            ⏸ {t("demoPause")}
          </button>
        )}
        {status === "paused" && (
          <button
            class="btn btn-sm btn-success"
            onClick={() => void resumeReplay()}
          >
            ▶ {t("demoResume")}
          </button>
        )}
        <button class="btn btn-sm btn-danger" onClick={() => void stopReplay()}>
          ⏹ {t("demoStop")}
        </button>
      </div>
    </section>
  );
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function loadDemoFlows(): Promise<void> {
  try {
    const flows = (await sendToBackground({
      type: "DEMO_GET_FLOWS",
    })) as FlowScript[] | null;
    panelState.demoFlows = Array.isArray(flows) ? flows : [];
    panelState.demoFlowsLoaded = true;
  } catch (err) {
    addLog(`${t("demoErrorLoad")}: ${err}`, "error");
    panelState.demoFlowsLoaded = true;
  }
  renderDemoTab();
}

async function handleUploadFlow(): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const result = (await sendToBackground({
        type: "DEMO_SAVE_FLOW",
        payload: raw,
      })) as { error?: string } | null;
      if (result?.error) {
        addLog(`Erro ao importar script: ${result.error}`, "error");
        return;
      }
      addLog(`Script "${file.name}" importado com sucesso`, "info");
      await loadDemoFlows();
    } catch (err) {
      addLog(`Erro ao importar script: ${err}`, "error");
      renderDemoTab();
    }
  };
  input.click();
}

async function saveRecordingAsDemo(): Promise<void> {
  const name = panelState.demoNameInput.trim();
  if (!name) {
    addLog(t("demoErrorNoName"), "warn");
    return;
  }
  if (panelState.recordedStepsPreview.length === 0) {
    addLog(t("demoErrorNoSteps"), "warn");
    return;
  }

  try {
    const result = (await sendToBackground({
      type: "DEMO_CONVERT_RECORDING",
      payload: {
        steps: panelState.recordedStepsPreview,
        name,
        seed: panelState.demoSeedInput.trim() || "demo",
      },
    })) as { success?: boolean; error?: string };

    if (!result?.success) {
      addLog(`${t("demoErrorSave")}: ${result?.error ?? "unknown"}`, "error");
      return;
    }

    addLog(t("demoSaveSuccess", name), "success");
    panelState.demoNameInput = "";
    void loadDemoFlows();
  } catch (err) {
    addLog(`${t("demoErrorSave")}: ${err}`, "error");
  }
}

async function startReplay(flow: FlowScript): Promise<void> {
  try {
    const result = (await sendToBackground({
      type: "DEMO_REPLAY_START",
      payload: {
        flowId: flow.id,
        tabId: panelState.inspectedTabId,
        config: {
          ...DEFAULT_REPLAY_CONFIG,
          ...SPEED_PRESETS[panelState.demoReplaySpeed],
          speed: panelState.demoReplaySpeed,
          showCursor: panelState.demoShowCursor,
        },
      },
    })) as { success?: boolean; error?: string };

    if (!result?.success) {
      addLog(`${t("demoErrorReplay")}: ${result?.error ?? "unknown"}`, "error");
      return;
    }

    panelState.demoActiveFlowId = flow.id;
    panelState.demoReplayStatus = "running";
    panelState.demoReplayProgress = null;
    addLog(t("demoReplayStarted", flow.metadata.name), "info");
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoErrorReplay")}: ${err}`, "error");
  }
}

async function pauseReplay(): Promise<void> {
  try {
    await sendToBackground({ type: "DEMO_REPLAY_PAUSE" });
    panelState.demoReplayStatus = "paused";
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoErrorReplay")}: ${err}`, "error");
  }
}

async function resumeReplay(): Promise<void> {
  try {
    await sendToBackground({ type: "DEMO_REPLAY_RESUME" });
    panelState.demoReplayStatus = "running";
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoErrorReplay")}: ${err}`, "error");
  }
}

async function stopReplay(): Promise<void> {
  try {
    await sendToBackground({ type: "DEMO_REPLAY_STOP" });
    panelState.demoReplayStatus = "idle";
    panelState.demoActiveFlowId = null;
    panelState.demoReplayProgress = null;
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoErrorReplay")}: ${err}`, "error");
  }
}

async function deleteFlow(flowId: string): Promise<void> {
  try {
    await sendToBackground({
      type: "DEMO_DELETE_FLOW",
      payload: flowId,
    });
    panelState.demoFlows = panelState.demoFlows.filter((f) => f.id !== flowId);
    if (panelState.demoActiveFlowId === flowId) {
      panelState.demoActiveFlowId = null;
      panelState.demoReplayStatus = "idle";
    }
    addLog(t("demoDeleteSuccess"), "info");
    renderDemoTab();
  } catch (err) {
    addLog(`${t("demoErrorDelete")}: ${err}`, "error");
  }
}

function stopVideoRecording(): void {
  panelState.videoMediaRecorder?.stop();
}

function discardVideoBlob(): void {
  panelState.videoBlob = null;
  panelState.videoReadyForFlowId = null;
  panelState.videoChunks = [];
  addLog("Gravação descartada", "info");
  renderDemoTab();
}

function downloadVideoBlob(): void {
  const blob = panelState.videoBlob;
  if (!blob) return;

  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fill-all-demo-${Date.now()}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  addLog(t("demoVideoDownloaded"), "success");
}

function exportFlowJson(flow: FlowScript): void {
  const json = JSON.stringify(flow, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${flow.metadata.name.replace(/\s+/g, "-").toLowerCase()}.demo.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog(t("demoExportSuccess", flow.metadata.name), "info");
}

// ── Progress update (called from panel.ts listener) ───────────────────────────

export function applyReplayProgress(progress: ReplayProgress): void {
  panelState.demoReplayStatus = progress.status;
  panelState.demoReplayProgress = progress;
  renderDemoTab();
}

export function applyReplayComplete(status: "completed" | "failed"): void {
  panelState.demoReplayStatus = status === "completed" ? "completed" : "failed";
  panelState.demoActiveFlowId = null;
  panelState.demoReplayProgress = null;

  // Auto-stop video recording if it was started alongside this replay
  if (panelState.videoRecording && panelState.videoMediaRecorder) {
    panelState.videoMediaRecorder.stop();
  }

  addLog(
    status === "completed" ? t("demoReplayComplete") : t("demoReplayFailed"),
    status === "completed" ? "success" : "error",
  );
  void loadDemoFlows();
}

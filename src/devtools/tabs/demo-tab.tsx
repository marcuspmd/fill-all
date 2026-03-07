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
import { renderTo } from "@/lib/ui/components";
import type {
  FlowScript,
  FlowStep,
  ReplayProgress,
  FlowActionType,
  StepEffect,
  CaptionConfig,
  EffectKind,
  EffectTiming,
  AssertOperator,
  FlowValueSource,
} from "@/lib/demo";
import type {
  LabelEffect,
  GrowEffect,
  ZoomEffect,
  PinEffect,
  ShakeEffect,
  ConfettiEffect,
  SpotlightEffect,
} from "@/lib/demo/effects";
import type { FieldType } from "@/types";
import {
  DEFAULT_REPLAY_CONFIG,
  SPEED_PRESETS,
  DEFAULT_EFFECT_TIMING,
} from "@/lib/demo";

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
        <h3 class="demo-section-title">
          <span class="material-icons-round">movie</span>
          {t("demoConvertTitle")}
        </h3>
        <p class="demo-hint">{t("demoConvertHint")}</p>
      </section>
    );
  }

  return (
    <section class="demo-section">
      <h3 class="demo-section-title">
        <span class="material-icons-round">movie</span>
        {t("demoConvertTitle")}
      </h3>
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
        <span class="material-icons-round">save</span>
        {t("demoSaveAsDemo")}
      </button>
    </section>
  );
}

// ── Section 2: Replay Options ─────────────────────────────────────────────────

const SPEED_LABELS: Record<string, string> = {
  instant: "Instant",
  fast: "Rápido",
  normal: "Normal",
  slow: "Lento",
};

function DemoReplayOptions() {
  return (
    <section class="demo-section demo-replay-options">
      <h3 class="demo-section-title">
        <span class="material-icons-round">tune</span>
        {t("demoReplayOptionsTitle")}
      </h3>
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
        <h3 class="demo-section-title">
          <span class="material-icons-round">folder_open</span>
          {t("demoLibraryTitle")}
        </h3>
        <div class="demo-section-header-actions">
          <button
            class="btn btn-sm"
            onClick={() => void handleUploadFlow()}
            title="Carregar script JSON"
          >
            <span class="material-icons-round">upload</span>
            Upload
          </button>
          <button
            class="btn btn-sm"
            onClick={() => void loadDemoFlows()}
            title={t("demoRefresh")}
          >
            <span class="material-icons-round">refresh</span>
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
            <span class="material-icons-round">play_arrow</span>
          </button>
        ) : isRunning ? (
          <>
            <button
              class="btn btn-sm btn-warning"
              title={t("demoPause")}
              onClick={() => void pauseReplay()}
            >
              <span class="material-icons-round">pause</span>
            </button>
            <button
              class="btn btn-sm btn-danger"
              title={t("demoStop")}
              onClick={() => void stopReplay()}
            >
              <span class="material-icons-round">stop</span>
            </button>
          </>
        ) : (
          <>
            <button
              class="btn btn-sm btn-success"
              title={t("demoResume")}
              onClick={() => void resumeReplay()}
            >
              <span class="material-icons-round">play_arrow</span>
            </button>
            <button
              class="btn btn-sm btn-danger"
              title={t("demoStop")}
              onClick={() => void stopReplay()}
            >
              <span class="material-icons-round">stop</span>
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
            <span class="material-icons-round">stop_circle</span>
            {t("demoVideoStop")}
          </button>
        ) : hasVideoBlob ? (
          <div class="demo-video-actions">
            <button
              class="btn btn-sm btn-success"
              title={t("demoVideoDownload")}
              onClick={() => downloadVideoBlob()}
            >
              <span class="material-icons-round">download</span>
              {t("demoVideoDownload")}
            </button>
            <button
              class="btn btn-sm"
              title="Descartar gravação"
              onClick={() => discardVideoBlob()}
            >
              <span class="material-icons-round">delete</span>
            </button>
            <button
              class="btn btn-sm btn-video-record"
              title="Gravar novamente"
              disabled={anyVideoRecording}
              onClick={() => void startVideoAndReplay(flow)}
            >
              <span class="material-icons-round">replay</span>
            </button>
          </div>
        ) : (
          <button
            class="btn btn-sm btn-video-record"
            title={t("demoVideoRecordAndReplay")}
            disabled={anyVideoRecording || isBusy}
            onClick={() => void startVideoAndReplay(flow)}
          >
            <span class="material-icons-round">videocam</span>
            {t("demoVideoRecord")}
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
          <span class="material-icons-round">edit</span>
        </button>
        <button
          class="btn btn-sm"
          title={t("demoExportJson")}
          onClick={() => exportFlowJson(flow)}
        >
          <span class="material-icons-round">download</span>
        </button>
        <button
          class="btn btn-sm btn-danger"
          title={t("demoDelete")}
          onClick={() => void deleteFlow(flow.id)}
        >
          <span class="material-icons-round">delete</span>
        </button>
      </td>
    </tr>
  );
}

// ── Demo Step Editor ──────────────────────────────────────────────────────────

function DemoFlowEditRow({ flow }: { flow: FlowScript }) {
  async function saveStepEdits() {
    const res = (await sendToBackground({
      type: "DEMO_SAVE_FLOW",
      payload: flow,
    })) as { success?: boolean; error?: string } | undefined;
    if (res?.error) {
      addLog(`Erro ao salvar: ${res.error}`, "error");
      // eslint-disable-next-line no-alert
      alert(`Erro ao salvar flow:\n\n${res.error}`);
      return;
    }
    panelState.demoEditingFlowId = null;
    panelState.demoEditingStepIdx = null;
    addLog(`Steps de "${flow.metadata.name}" salvos`, "success");
    renderDemoTab();
  }

  function cancelEdit() {
    panelState.demoEditingFlowId = null;
    panelState.demoEditingStepIdx = null;
    void loadDemoFlows().then(() => renderDemoTab());
  }

  function addStep(type: FlowActionType) {
    const newStep: FlowStep = {
      id: `step-${Date.now()}`,
      action: type,
      label: "",
      selector:
        type === "navigate" || type === "wait" || type === "caption"
          ? undefined
          : "",
      delayBefore: 0,
      delayAfter: 0,
      optional: false,
      ...(type === "caption"
        ? { caption: { text: "", position: "bottom" } }
        : {}),
    } as FlowStep;
    flow.steps.push(newStep);
    panelState.demoEditingStepIdx = flow.steps.length - 1;
    renderDemoTab();
  }

  function deleteStep(idx: number) {
    flow.steps.splice(idx, 1);
    if (panelState.demoEditingStepIdx !== null) {
      if (panelState.demoEditingStepIdx === idx) {
        panelState.demoEditingStepIdx = null;
      } else if (panelState.demoEditingStepIdx > idx) {
        panelState.demoEditingStepIdx--;
      }
    }
    renderDemoTab();
  }

  function moveStep(idx: number, direction: "up" | "down") {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= flow.steps.length) return;
    [flow.steps[idx], flow.steps[newIdx]] = [
      flow.steps[newIdx],
      flow.steps[idx],
    ];
    if (panelState.demoEditingStepIdx === idx) {
      panelState.demoEditingStepIdx = newIdx;
    } else if (panelState.demoEditingStepIdx === newIdx) {
      panelState.demoEditingStepIdx = idx;
    }
    renderDemoTab();
  }

  const ALL_ACTIONS: FlowActionType[] = [
    "click",
    "fill",
    "select",
    "check",
    "uncheck",
    "clear",
    "navigate",
    "wait",
    "scroll",
    "press-key",
    "assert",
    "caption",
  ];

  const editingIdx = panelState.demoEditingStepIdx;
  const editingStep = editingIdx !== null ? flow.steps[editingIdx] : null;

  return (
    <tr class="demo-row-edit-steps">
      <td colspan={4}>
        <div class="demo-steps-editor">
          <p class="demo-steps-editor-title">
            {t("demoEditSteps")}: <strong>{flow.metadata.name}</strong>
          </p>

          {/* Compact step card list */}
          <div class="demo-step-list">
            {flow.steps.map((step, idx) => (
              <DemoStepCard
                key={step.id}
                step={step}
                idx={idx}
                onEdit={() => {
                  panelState.demoEditingStepIdx = idx;
                  renderDemoTab();
                }}
                onDelete={() => deleteStep(idx)}
                onMoveUp={idx > 0 ? () => moveStep(idx, "up") : undefined}
                onMoveDown={
                  idx < flow.steps.length - 1
                    ? () => moveStep(idx, "down")
                    : undefined
                }
              />
            ))}
            {flow.steps.length === 0 && (
              <p class="demo-hint">{t("demoNoSteps")}</p>
            )}
          </div>

          {/* Add step bar */}
          <div class="demo-steps-add">
            <select id="demo-add-step-type" class="demo-step-select">
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              class="btn btn-sm btn-secondary"
              onClick={() => {
                const sel = document.getElementById(
                  "demo-add-step-type",
                ) as HTMLSelectElement;
                addStep(sel.value as FlowActionType);
              }}
            >
              <span class="material-icons-round">add</span>
              {t("demoAddStep")}
            </button>
          </div>

          {/* Save / Cancel */}
          <div class="demo-steps-actions">
            <button class="btn btn-sm" onClick={cancelEdit}>
              <span class="material-icons-round">close</span>
              {t("demoCancelEdit")}
            </button>
            <button
              class="btn btn-sm btn-primary"
              onClick={() => void saveStepEdits()}
            >
              <span class="material-icons-round">save</span>
              {t("demoSaveSteps")}
            </button>
          </div>
        </div>

        {/* Step edit modal — fixed overlay, rendered outside table layout */}
        {editingStep !== null && editingIdx !== null && (
          <StepEditModal
            step={editingStep}
            idx={editingIdx}
            flow={flow}
            onClose={() => {
              panelState.demoEditingStepIdx = null;
              renderDemoTab();
            }}
          />
        )}
      </td>
    </tr>
  );
}

// ── Effect constants ─────────────────────────────────────────────────────────

const ALL_EFFECT_KINDS: EffectKind[] = [
  "label",
  "grow",
  "zoom",
  "pin",
  "shake",
  "confetti",
  "spotlight",
];

/** Kinds shown in the dropdown — "none" is a placeholder meaning "no effect" */
const ALL_EFFECT_KINDS_WITH_NONE = ["none", ...ALL_EFFECT_KINDS] as const;

const CAPTION_POSITIONS = ["top", "middle", "bottom"] as const;

// ── Step effects inline editor ────────────────────────────────────────────────

const EFFECT_ICONS: Record<EffectKind, string> = {
  label: "label",
  grow: "trending_up",
  zoom: "zoom_in",
  pin: "push_pin",
  shake: "vibration",
  confetti: "celebration",
  spotlight: "highlight",
};

function EffectsEditor({
  step,
  onUpdate,
}: {
  step: FlowStep;
  onUpdate: () => void;
}) {
  const effects = step.effects ?? [];

  function addEffect(kind: EffectKind | "none") {
    if (kind === "none") return;
    const base: StepEffect =
      kind === "label" ? { kind: "label", text: "" } : ({ kind } as StepEffect);
    step.effects = [...(step.effects ?? []), base];
    onUpdate();
  }

  function removeEffect(idx: number) {
    const next = [...(step.effects ?? [])];
    next.splice(idx, 1);
    step.effects = next.length > 0 ? next : undefined;
    onUpdate();
  }

  function patchEffect(idx: number, patch: Partial<StepEffect>) {
    const next = [...(step.effects ?? [])];
    next[idx] = { ...next[idx], ...patch } as StepEffect;
    step.effects = next;
    onUpdate();
  }

  return (
    <div class="demo-effects-editor">
      {effects.length > 0 && (
        <div class="demo-effects-cards">
          {effects.map((eff, i) => (
            <div
              key={i}
              class={`demo-effect-card demo-effect-card-${eff.kind}`}
            >
              <div class="demo-effect-card-header">
                <span class={`demo-effect-badge demo-effect-badge-${eff.kind}`}>
                  <span class="material-icons-round">
                    {EFFECT_ICONS[eff.kind]}
                  </span>
                  {eff.kind}
                </span>
                <div class="demo-effect-header-timing">
                  <label class="demo-effect-label-txt">
                    {t("demoEffectTiming")}
                  </label>
                  <select
                    class="demo-step-select demo-step-select-sm"
                    value={eff.timing ?? DEFAULT_EFFECT_TIMING[eff.kind]}
                    onChange={(e) =>
                      patchEffect(i, {
                        timing: (e.target as HTMLSelectElement)
                          .value as EffectTiming,
                      })
                    }
                  >
                    <option value="before">
                      {t("demoEffectTimingBefore")}
                    </option>
                    <option value="during">
                      {t("demoEffectTimingDuring")}
                    </option>
                    <option value="after">{t("demoEffectTimingAfter")}</option>
                  </select>
                </div>
                <button
                  class="demo-effect-remove-btn"
                  title={t("demoDeleteStep")}
                  onClick={() => removeEffect(i)}
                >
                  <span class="material-icons-round">close</span>
                </button>
              </div>
              <div class="demo-effect-card-body">
                <EffectFieldsEditor
                  effect={eff}
                  onPatch={(patch) => patchEffect(i, patch)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div class="demo-effects-add-row">
        <select
          id={`demo-effect-kind-${step.id}`}
          class="demo-step-select demo-step-select-sm"
        >
          {ALL_EFFECT_KINDS_WITH_NONE.map((k) => (
            <option key={k} value={k}>
              {k === "none" ? `── ${t("demoEffectNone")} ──` : k}
            </option>
          ))}
        </select>
        <button
          class="btn btn-xs btn-secondary"
          onClick={() => {
            const sel = document.getElementById(
              `demo-effect-kind-${step.id}`,
            ) as HTMLSelectElement;
            addEffect(sel.value as EffectKind | "none");
          }}
        >
          <span class="material-icons-round">add</span>
          {t("demoAddEffect")}
        </button>
      </div>
    </div>
  );
}

function EffectFieldsEditor({
  effect,
  onPatch,
}: {
  effect: StepEffect;
  onPatch: (patch: Partial<StepEffect>) => void;
}) {
  if (effect.kind === "label") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field demo-effect-field-wide">
          <label class="demo-effect-label-txt">{t("demoEffectText")}</label>
          <input
            type="text"
            class="demo-step-input"
            placeholder={t("demoLabelText")}
            value={effect.text}
            onInput={(e) =>
              onPatch({
                text: (e.target as HTMLInputElement).value,
              } as Partial<LabelEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectPosition")}</label>
          <select
            class="demo-step-select demo-step-select-sm"
            value={effect.position ?? "above"}
            onChange={(e) =>
              onPatch({
                position: (e.target as HTMLSelectElement)
                  .value as LabelEffect["position"],
              } as Partial<LabelEffect>)
            }
          >
            <option value="above">↑ {t("demoPositionAbove")}</option>
            <option value="below">↓ {t("demoPositionBelow")}</option>
            <option value="left">← {t("demoPositionLeft")}</option>
            <option value="right">→ {t("demoPositionRight")}</option>
          </select>
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectDuration")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="2000"
            value={effect.duration ?? 2000}
            min={100}
            step={100}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<LabelEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "grow") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectScale")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="1.15"
            value={effect.scale ?? 1.15}
            min={1}
            max={3}
            step={0.05}
            onInput={(e) =>
              onPatch({
                scale: Number((e.target as HTMLInputElement).value),
              } as Partial<GrowEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectDuration")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="400"
            value={effect.duration ?? 400}
            min={50}
            step={50}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<GrowEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "zoom") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectScale")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="1.4"
            value={effect.scale ?? 1.4}
            min={1}
            max={5}
            step={0.1}
            onInput={(e) =>
              onPatch({
                scale: Number((e.target as HTMLInputElement).value),
              } as Partial<ZoomEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">
            {t("demoEffectDuration")} (0 = {t("demoEffectPermanent")})
          </label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="1200"
            value={effect.duration ?? 1200}
            min={0}
            step={100}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<ZoomEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "pin") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field demo-effect-field-wide">
          <label class="demo-effect-label-txt">{t("demoEffectNote")}</label>
          <input
            type="text"
            class="demo-step-input"
            placeholder={t("demoEffectNotePlaceholder")}
            value={effect.note ?? ""}
            onInput={(e) =>
              onPatch({
                note: (e.target as HTMLInputElement).value,
              } as Partial<PinEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">
            {t("demoEffectDuration")} (0 = {t("demoEffectKeep")})
          </label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="2000"
            value={effect.duration ?? 2000}
            min={0}
            step={100}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<PinEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "shake") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">
            {t("demoEffectIntensity")}
          </label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="3"
            value={effect.intensity ?? 3}
            min={1}
            max={10}
            step={1}
            onInput={(e) =>
              onPatch({
                intensity: Number((e.target as HTMLInputElement).value),
              } as Partial<ShakeEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectDuration")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="500"
            value={effect.duration ?? 500}
            min={100}
            step={100}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<ShakeEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "confetti") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectCount")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="60"
            value={effect.count ?? 60}
            min={1}
            max={200}
            step={10}
            onInput={(e) =>
              onPatch({
                count: Number((e.target as HTMLInputElement).value),
              } as Partial<ConfettiEffect>)
            }
          />
        </div>
      </div>
    );
  }

  if (effect.kind === "spotlight") {
    return (
      <div class="demo-effect-fields">
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">{t("demoEffectOpacity")}</label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="0.6"
            value={effect.opacity ?? 0.6}
            min={0}
            max={1}
            step={0.05}
            onInput={(e) =>
              onPatch({
                opacity: Number((e.target as HTMLInputElement).value),
              } as Partial<SpotlightEffect>)
            }
          />
        </div>
        <div class="demo-effect-field">
          <label class="demo-effect-label-txt">
            {t("demoEffectDuration")} (0 = {t("demoEffectKeep")})
          </label>
          <input
            type="number"
            class="demo-step-input demo-step-input-delay"
            placeholder="2000"
            value={effect.duration ?? 2000}
            min={0}
            step={100}
            onInput={(e) =>
              onPatch({
                duration: Number((e.target as HTMLInputElement).value),
              } as Partial<SpotlightEffect>)
            }
          />
        </div>
      </div>
    );
  }

  return null;
}

// ── Caption editor ────────────────────────────────────────────────────────────

function CaptionEditor({
  step,
  onUpdate,
}: {
  step: FlowStep;
  onUpdate: () => void;
}) {
  const cap: CaptionConfig = step.caption ?? { text: "", position: "bottom" };

  function updateCaption(patch: Partial<CaptionConfig>) {
    step.caption = { ...cap, ...patch };
    onUpdate();
  }

  return (
    <div class="demo-caption-editor">
      <input
        type="text"
        class="demo-step-input"
        placeholder={t("demoCaptionText")}
        value={cap.text}
        onInput={(e) => {
          updateCaption({ text: (e.target as HTMLInputElement).value });
        }}
      />
      <select
        class="demo-step-select demo-step-select-sm"
        value={cap.position ?? "bottom"}
        onChange={(e) => {
          updateCaption({
            position: (e.target as HTMLSelectElement)
              .value as CaptionConfig["position"],
          });
        }}
      >
        {CAPTION_POSITIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        type="number"
        class="demo-step-input demo-step-input-delay"
        placeholder="ms"
        value={cap.duration ?? 3000}
        min={500}
        step={500}
        onInput={(e) => {
          updateCaption({
            duration: Number((e.target as HTMLInputElement).value),
          });
        }}
      />
    </div>
  );
}

// ── Compact step card (read-only summary row with edit/delete buttons) ────────

function getStepPreview(step: FlowStep): string {
  if (step.action === "navigate") return (step as { url?: string }).url ?? "—";
  if (step.action === "caption") return step.caption?.text ?? "—";
  if (step.action === "wait") return `${step.waitTimeout ?? 10000} ms`;
  if (step.action === "press-key") return step.key ?? "—";
  if (step.selector) {
    const s = step.selector;
    return s.length > 52 ? s.slice(0, 49) + "…" : s;
  }
  return "—";
}

function DemoStepCard({
  step,
  idx,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: FlowStep;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const preview = getStepPreview(step);
  const effects = step.effects ?? [];

  return (
    <div class="demo-step-card">
      <div class="demo-step-move-btns">
        <button
          class="btn btn-xs demo-step-move-btn"
          disabled={!onMoveUp}
          title={t("demoMoveStepUp")}
          onClick={onMoveUp}
        >
          <span class="material-icons-round">arrow_upward</span>
        </button>
        <button
          class="btn btn-xs demo-step-move-btn"
          disabled={!onMoveDown}
          title={t("demoMoveStepDown")}
          onClick={onMoveDown}
        >
          <span class="material-icons-round">arrow_downward</span>
        </button>
      </div>
      <span class="demo-step-card-idx">{idx + 1}</span>
      <span class={`demo-step-badge demo-step-badge-${step.action}`}>
        {step.action}
      </span>
      <div class="demo-step-card-info">
        {step.label && <span class="demo-step-card-label">{step.label}</span>}
        <span class="demo-step-card-preview" title={preview}>
          {preview}
        </span>
      </div>
      {effects.length > 0 && (
        <div class="demo-step-card-effects">
          {effects.map((e, i) => (
            <span
              key={i}
              class={`demo-effect-badge demo-effect-badge-${e.kind}`}
            >
              {e.kind}
            </span>
          ))}
        </div>
      )}
      <div class="demo-step-card-actions">
        <button class="btn btn-xs" title={t("demoEditStep")} onClick={onEdit}>
          <span class="material-icons-round">edit</span>
        </button>
        <button
          class="btn btn-xs btn-danger"
          title={t("demoDeleteStep")}
          onClick={onDelete}
        >
          <span class="material-icons-round">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Step edit modal ──────────────────────────────────────────────────────────

const ALL_ASSERT_OPERATORS: AssertOperator[] = [
  "equals",
  "contains",
  "visible",
  "hidden",
  "url-equals",
  "url-contains",
  "exists",
];

function StepEditModal({
  step,
  idx,
  flow,
  onClose,
}: {
  step: FlowStep;
  idx: number;
  flow: FlowScript;
  onClose: () => void;
}) {
  function updateStep<K extends keyof FlowStep>(key: K, value: FlowStep[K]) {
    (flow.steps[idx] as unknown as Record<string, unknown>)[key as string] =
      value;
    renderDemoTab();
  }

  const ALL_ACTIONS: FlowActionType[] = [
    "click",
    "fill",
    "select",
    "check",
    "uncheck",
    "clear",
    "navigate",
    "wait",
    "scroll",
    "press-key",
    "assert",
    "caption",
  ];

  const isCaption = step.action === "caption";
  const isNavigate = step.action === "navigate";
  const isWait = step.action === "wait";
  const isPressKey = step.action === "press-key";
  const isSelect = step.action === "select";
  const isAssert = step.action === "assert";
  const isScroll = step.action === "scroll";
  const isFill = step.action === "fill";
  const hasSelector = !isCaption && !isNavigate && !isWait;

  const valueSource = step.valueSource as FlowValueSource | undefined;
  const assertOp = step.assertion?.operator ?? "equals";
  const assertNeedsExpected =
    assertOp === "equals" ||
    assertOp === "contains" ||
    assertOp === "url-equals" ||
    assertOp === "url-contains";

  return (
    <div
      class="demo-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="demo-modal">
        {/* Header */}
        <div class="demo-modal-header">
          <h3 class="demo-modal-title">
            <span class={`demo-step-badge demo-step-badge-${step.action}`}>
              {step.action}
            </span>
            &nbsp;{t("demoEditStep")} #{idx + 1}
          </h3>
          <button class="demo-modal-close" title="Fechar" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div class="demo-modal-body">
          {/* ── General ── */}
          <div class="demo-modal-section">
            <h4 class="demo-modal-section-title">Geral</h4>
            <div class="demo-modal-row">
              <div class="demo-modal-field">
                <label class="demo-modal-label">Ação</label>
                <select
                  class="demo-step-select"
                  value={step.action}
                  onChange={(e) => {
                    updateStep(
                      "action",
                      (e.target as HTMLSelectElement).value as FlowActionType,
                    );
                  }}
                >
                  {ALL_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div class="demo-modal-field demo-modal-field-grow">
                <label class="demo-modal-label">Label</label>
                <input
                  type="text"
                  class="demo-step-input"
                  value={step.label ?? ""}
                  placeholder="Descrição do step…"
                  onInput={(e) => {
                    updateStep(
                      "label",
                      (e.target as HTMLInputElement).value || undefined,
                    );
                  }}
                />
              </div>
            </div>
            <div class="demo-modal-field">
              <label class="demo-modal-label demo-modal-label-inline">
                <input
                  type="checkbox"
                  checked={step.optional ?? false}
                  onChange={(e) => {
                    updateStep(
                      "optional",
                      (e.target as HTMLInputElement).checked,
                    );
                  }}
                />
                Opcional (pular em caso de falha)
              </label>
            </div>
          </div>

          {/* ── Target selector ── */}
          {hasSelector && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Alvo</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Seletor CSS</label>
                <input
                  type="text"
                  class="demo-step-input demo-modal-input-full"
                  value={step.selector ?? ""}
                  placeholder="#id, .class, [name=campo]"
                  onInput={(e) => {
                    updateStep(
                      "selector",
                      (e.target as HTMLInputElement).value || undefined,
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Navigate ── */}
          {isNavigate && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Navegação</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">URL</label>
                <input
                  type="text"
                  class="demo-step-input demo-modal-input-full"
                  value={(step as { url?: string }).url ?? ""}
                  placeholder="https://…"
                  onInput={(e) => {
                    updateStep(
                      "url" as keyof FlowStep,
                      ((e.target as HTMLInputElement).value ||
                        undefined) as never,
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Fill value source ── */}
          {isFill && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Valor</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Fonte do valor</label>
                <select
                  class="demo-step-select"
                  value={valueSource?.type ?? "generator"}
                  onChange={(e) => {
                    const type = (e.target as HTMLSelectElement).value as
                      | "generator"
                      | "fixed";
                    if (type === "fixed") {
                      updateStep("valueSource", { type: "fixed", value: "" });
                    } else {
                      updateStep("valueSource", {
                        type: "generator",
                        fieldType: "text" as FieldType,
                      });
                    }
                  }}
                >
                  <option value="generator">Gerador automático</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </div>
              {valueSource?.type === "fixed" && (
                <div class="demo-modal-field">
                  <label class="demo-modal-label">Valor fixo</label>
                  <input
                    type="text"
                    class="demo-step-input demo-modal-input-full"
                    value={
                      (valueSource as { type: "fixed"; value: string }).value
                    }
                    placeholder="Valor a preencher"
                    onInput={(e) => {
                      updateStep("valueSource", {
                        type: "fixed",
                        value: (e.target as HTMLInputElement).value,
                      });
                    }}
                  />
                </div>
              )}
              {(valueSource?.type === "generator" || !valueSource) && (
                <div class="demo-modal-field">
                  <label class="demo-modal-label">Tipo de campo</label>
                  <input
                    type="text"
                    class="demo-step-input"
                    value={
                      (
                        valueSource as
                          | { type: "generator"; fieldType: FieldType }
                          | undefined
                      )?.fieldType ?? ""
                    }
                    placeholder="text, email, cpf, phone…"
                    onInput={(e) => {
                      updateStep("valueSource", {
                        type: "generator",
                        fieldType: (e.target as HTMLInputElement)
                          .value as FieldType,
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Select options ── */}
          {isSelect && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Seleção</h4>
              <div class="demo-modal-row">
                <div class="demo-modal-field">
                  <label class="demo-modal-label">Índice (0-based)</label>
                  <input
                    type="number"
                    class="demo-step-input demo-step-input-delay"
                    value={step.selectIndex ?? 0}
                    min={0}
                    onInput={(e) => {
                      updateStep(
                        "selectIndex",
                        Number((e.target as HTMLInputElement).value),
                      );
                    }}
                  />
                </div>
                <div class="demo-modal-field demo-modal-field-grow">
                  <label class="demo-modal-label">Texto da opção</label>
                  <input
                    type="text"
                    class="demo-step-input"
                    value={step.selectText ?? ""}
                    placeholder="Texto a selecionar"
                    onInput={(e) => {
                      updateStep(
                        "selectText",
                        (e.target as HTMLInputElement).value || undefined,
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Press key ── */}
          {isPressKey && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Tecla</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Key</label>
                <input
                  type="text"
                  class="demo-step-input"
                  value={step.key ?? ""}
                  placeholder="Enter, Tab, Escape, ArrowDown…"
                  onInput={(e) => {
                    updateStep(
                      "key",
                      (e.target as HTMLInputElement).value || undefined,
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Wait timeout ── */}
          {isWait && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Espera</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Timeout (ms)</label>
                <input
                  type="number"
                  class="demo-step-input demo-step-input-delay"
                  value={step.waitTimeout ?? 10000}
                  min={100}
                  step={500}
                  onInput={(e) => {
                    updateStep(
                      "waitTimeout",
                      Number((e.target as HTMLInputElement).value),
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Scroll position ── */}
          {isScroll && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Scroll</h4>
              <div class="demo-modal-row">
                <div class="demo-modal-field">
                  <label class="demo-modal-label">X (px)</label>
                  <input
                    type="number"
                    class="demo-step-input demo-step-input-delay"
                    value={step.scrollPosition?.x ?? 0}
                    onInput={(e) => {
                      updateStep("scrollPosition", {
                        x: Number((e.target as HTMLInputElement).value),
                        y: step.scrollPosition?.y ?? 0,
                      });
                    }}
                  />
                </div>
                <div class="demo-modal-field">
                  <label class="demo-modal-label">Y (px)</label>
                  <input
                    type="number"
                    class="demo-step-input demo-step-input-delay"
                    value={step.scrollPosition?.y ?? 0}
                    onInput={(e) => {
                      updateStep("scrollPosition", {
                        x: step.scrollPosition?.x ?? 0,
                        y: Number((e.target as HTMLInputElement).value),
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Assert ── */}
          {isAssert && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Asserção</h4>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Operador</label>
                <select
                  class="demo-step-select"
                  value={step.assertion?.operator ?? "equals"}
                  onChange={(e) => {
                    const op = (e.target as HTMLSelectElement)
                      .value as AssertOperator;
                    updateStep("assertion", {
                      ...step.assertion,
                      operator: op,
                    });
                  }}
                >
                  {ALL_ASSERT_OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              {assertNeedsExpected && (
                <div class="demo-modal-field">
                  <label class="demo-modal-label">Valor esperado</label>
                  <input
                    type="text"
                    class="demo-step-input demo-modal-input-full"
                    value={step.assertion?.expected ?? ""}
                    placeholder="Valor esperado…"
                    onInput={(e) => {
                      updateStep("assertion", {
                        operator: step.assertion?.operator ?? "equals",
                        expected:
                          (e.target as HTMLInputElement).value || undefined,
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Caption ── */}
          {isCaption && (
            <div class="demo-modal-section">
              <h4 class="demo-modal-section-title">Legenda</h4>
              <CaptionEditor step={step} onUpdate={() => renderDemoTab()} />
            </div>
          )}

          {/* ── Timing ── */}
          <div class="demo-modal-section">
            <h4 class="demo-modal-section-title">Temporização</h4>
            <div class="demo-modal-row">
              <div class="demo-modal-field">
                <label class="demo-modal-label">Delay antes (ms)</label>
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
              </div>
              <div class="demo-modal-field">
                <label class="demo-modal-label">Delay depois (ms)</label>
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
              </div>
            </div>
          </div>

          {/* ── Effects ── */}
          <div class="demo-modal-section">
            <h4 class="demo-modal-section-title">Efeitos Visuais</h4>
            <EffectsEditor step={step} onUpdate={() => renderDemoTab()} />
          </div>
        </div>

        {/* Footer */}
        <div class="demo-modal-footer">
          <button class="btn btn-sm btn-primary" onClick={onClose}>
            ✓ Fechar
          </button>
        </div>
      </div>
    </div>
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
    alert(t("demoVideoErrorPermission"));
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
        <span class="material-icons-round">
          {status === "running" ? "play_arrow" : "pause"}
        </span>
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
            <span class="material-icons-round">pause</span>
            {t("demoPause")}
          </button>
        )}
        {status === "paused" && (
          <button
            class="btn btn-sm btn-success"
            onClick={() => void resumeReplay()}
          >
            <span class="material-icons-round">play_arrow</span>
            {t("demoResume")}
          </button>
        )}
        <button class="btn btn-sm btn-danger" onClick={() => void stopReplay()}>
          <span class="material-icons-round">stop</span>
          {t("demoStop")}
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

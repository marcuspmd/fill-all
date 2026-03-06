/**
 * RecordTabView — Preact component for the DevTools Record tab.
 *
 * Handles recording controls, steps table with inline value editing,
 * export section with optional AI optimization, and the ready-script state.
 */

import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import type { RecordStep, RecordingState } from "@/devtools/panel-state";
import { t } from "@/lib/i18n";
import { STEP_ICONS } from "@/devtools/panel-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecordTabCallbacks {
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onExport: (framework: string) => void;
  onCopyScript: () => void;
  onDismissScript: () => void;
  onToggleOptimizeAI: (checked: boolean) => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, value: string) => void;
}

export interface RecordTabViewProps extends RecordTabCallbacks {
  recordingState: RecordingState;
  steps: RecordStep[];
  optimizeWithAI: boolean;
  isOptimizing: boolean;
  readyScript: { script: string; framework: string } | null;
}

// ── Step row with inline editing ──────────────────────────────────────────────

interface StepRowProps {
  step: RecordStep;
  index: number;
  editing: boolean;
  onEdit: (index: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

function StepRow({
  step,
  index,
  editing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}: StepRowProps) {
  const [editValue, setEditValue] = useState(step.value ?? "");
  const icon = STEP_ICONS[step.type] ?? "help_outline";
  const displayValue =
    step.value ?? step.label ?? (step.waitMs ? `${step.waitMs}ms` : "-");

  return (
    <tr>
      <td class="cell-num">{index + 1}</td>
      <td>
        <span
          class="material-icons-round"
          style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}
        >
          {icon}
        </span>
        {step.type}
      </td>
      <td class="cell-mono">{step.selector ?? step.url ?? "-"}</td>
      <td class="cell-value">
        {editing ? (
          <Fragment>
            <input
              type="text"
              class="edit-input step-edit-input"
              value={editValue}
              onInput={(e) =>
                setEditValue((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(index, editValue);
                else if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
            />
            <button
              class="icon-btn step-edit-save"
              title="Salvar"
              onClick={() => onSaveEdit(index, editValue)}
            >
              <span class="material-icons-round">check</span>
            </button>
            <button
              class="icon-btn step-edit-cancel"
              title="Cancelar"
              onClick={onCancelEdit}
            >
              <span class="material-icons-round">close</span>
            </button>
          </Fragment>
        ) : (
          <span class="step-value-text" title={t("actionEdit")}>
            {displayValue}
          </span>
        )}
      </td>
      <td class="cell-actions">
        <button
          class="icon-btn"
          title={t("actionEdit")}
          onClick={() => onEdit(index)}
        >
          <span class="material-icons-round">edit</span>
        </button>
        <button
          class="icon-btn"
          title={t("btnDelete") ?? "Remover"}
          onClick={() => onRemove(index)}
        >
          <span class="material-icons-round">delete</span>
        </button>
      </td>
    </tr>
  );
}

// ── RecordTabView ─────────────────────────────────────────────────────────────

export function RecordTabView({
  recordingState,
  steps,
  optimizeWithAI,
  isOptimizing,
  readyScript,
  onStart,
  onStop,
  onPause,
  onResume,
  onClear,
  onExport,
  onCopyScript,
  onDismissScript,
  onToggleOptimizeAI,
  onRemoveStep,
  onUpdateStep,
}: RecordTabViewProps) {
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const isIdle = recordingState === "idle";
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isStopped = recordingState === "stopped";
  const hasSteps = steps.length > 0;

  const statusText = isRecording
    ? t("recordStatusRecording")
    : isPaused
      ? t("recordStatusPaused")
      : isStopped
        ? (t("recordStatusStopped") ?? t("recordStatusIdle"))
        : t("recordStatusIdle");

  const indicatorClass = isRecording
    ? "recording"
    : isPaused
      ? "paused"
      : isStopped
        ? "stopped"
        : "";

  const showTable = !isIdle || hasSteps;
  const showExport = (isStopped || isPaused) && hasSteps;

  function handleSaveEdit(index: number, value: string): void {
    onUpdateStep(index, value);
    setEditingStepIndex(null);
  }

  function handleCancelEdit(): void {
    setEditingStepIndex(null);
  }

  return (
    <div class="record-section">
      {/* Controls */}
      <div class="record-controls">
        {isIdle ? (
          <button class="action-card primary" onClick={onStart}>
            <span class="card-icon material-icons-round">
              radio_button_checked
            </span>
            <span class="card-label">{t("recordStart")}</span>
            <span class="card-desc">{t("recordStartDesc")}</span>
          </button>
        ) : isRecording || isPaused ? (
          <Fragment>
            <button class="action-card btn-danger" onClick={onStop}>
              <span class="card-icon material-icons-round">stop</span>
              <span class="card-label">{t("recordStop")}</span>
            </button>
            <button
              class="action-card secondary"
              onClick={isPaused ? onResume : onPause}
            >
              <span class="card-icon material-icons-round">
                {isPaused ? "play_arrow" : "pause"}
              </span>
              <span class="card-label">
                {isPaused ? t("recordResume") : t("recordPause")}
              </span>
            </button>
          </Fragment>
        ) : (
          <Fragment>
            <button class="action-card primary" onClick={onStart}>
              <span class="card-icon material-icons-round">
                radio_button_checked
              </span>
              <span class="card-label">{t("recordStart")}</span>
              <span class="card-desc">{t("recordStartDesc")}</span>
            </button>
            {hasSteps && (
              <button class="action-card btn-danger" onClick={onClear}>
                <span class="card-icon material-icons-round">delete</span>
                <span class="card-label">{t("recordClear") ?? "Limpar"}</span>
              </button>
            )}
          </Fragment>
        )}
      </div>

      {/* Status */}
      <div class="record-status">
        <span class={`record-indicator ${indicatorClass}`} />
        <span>{statusText}</span>
        <span class="fields-count">
          {steps.length} {t("recordStepCount")}
        </span>
      </div>

      {/* Steps table */}
      <div class="table-wrap">
        {showTable ? (
          <table class="fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("recordColAction")}</th>
                <th>{t("recordColSelector")}</th>
                <th>{t("recordColValue")}</th>
                <th>{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody>
              {steps.length === 0 ? (
                <tr>
                  <td colspan={5} class="empty">
                    {t("recordNoSteps")}
                  </td>
                </tr>
              ) : (
                steps.map((step, i) => (
                  <StepRow
                    key={i}
                    step={step}
                    index={i}
                    editing={editingStepIndex === i}
                    onEdit={setEditingStepIndex}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onRemove={onRemoveStep}
                  />
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div class="empty">{t("recordClickStart")}</div>
        )}
      </div>

      {/* Export section */}
      {showExport && (
        <div class="record-export">
          {readyScript ? (
            <Fragment>
              <div class="record-export-title">
                {t("recordScriptReady")} ({readyScript.framework})
              </div>
              <div class="record-export-buttons">
                <button class="btn btn-copy-script" onClick={onCopyScript}>
                  <span class="material-icons-round">content_copy</span>{" "}
                  {t("recordCopyScript")}
                </button>
                <button
                  class="btn btn-dismiss-script"
                  onClick={onDismissScript}
                >
                  <span class="material-icons-round">close</span>
                </button>
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <div class="record-export-title">{t("recordExportTitle")}</div>
              <label class="record-ai-toggle" title={t("recordOptimizeAIDesc")}>
                <input
                  type="checkbox"
                  checked={optimizeWithAI}
                  disabled={isOptimizing}
                  onChange={(e) =>
                    onToggleOptimizeAI((e.target as HTMLInputElement).checked)
                  }
                />
                <span>✨ {t("recordOptimizeAI")}</span>
              </label>
              <div class="record-export-buttons">
                {isOptimizing ? (
                  <div class="export-loading-overlay">
                    <div class="export-loading-spinner" />
                    <span>{t("logRecordOptimizing")}</span>
                  </div>
                ) : (
                  <Fragment>
                    <button
                      class="btn"
                      disabled={isOptimizing}
                      onClick={() => onExport("playwright")}
                    >
                      🎭 Playwright
                    </button>
                    <button
                      class="btn"
                      disabled={isOptimizing}
                      onClick={() => onExport("cypress")}
                    >
                      🌲 Cypress
                    </button>
                    <button
                      class="btn"
                      disabled={isOptimizing}
                      onClick={() => onExport("pest")}
                    >
                      🐘 Pest/Dusk
                    </button>
                  </Fragment>
                )}
              </div>
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
}

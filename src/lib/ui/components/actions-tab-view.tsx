/**
 * ActionsTabView — Preact component for the DevTools Actions tab.
 *
 * Renders the six action cards (fill, fill-empty, contextual AI, save, watch,
 * detect) plus the fields status bar.
 */

import { h } from "preact";
import { t } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActionsTabViewProps {
  watcherActive: boolean;
  detectedCount: number;
  onFillAll: () => void;
  onFillEmpty: () => void;
  onFillContextualAI: () => void;
  onSave: () => void;
  onToggleWatch: () => void;
  onDetect: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActionsTabView({
  watcherActive,
  detectedCount,
  onFillAll,
  onFillEmpty,
  onFillContextualAI,
  onSave,
  onToggleWatch,
  onDetect,
}: ActionsTabViewProps) {
  return (
    <div>
      <div class="actions-grid">
        <button class="action-card primary" onClick={onFillAll}>
          <span class="card-icon material-icons-round">bolt</span>
          <span class="card-label">{t("fillAll")}</span>
          <span class="card-desc">{t("fillAllDesc")}</span>
        </button>
        <button class="action-card secondary" onClick={onFillEmpty}>
          <span class="card-icon material-icons-round">filter_list</span>
          <span class="card-label">{t("fillOnlyEmpty")}</span>
          <span class="card-desc">{t("fillOnlyEmptyDesc")}</span>
        </button>
        <button class="action-card ai" onClick={onFillContextualAI}>
          <span class="card-icon material-icons-round">smart_toy</span>
          <span class="card-label">{t("fillContextualAI")}</span>
          <span class="card-desc">{t("fillContextualAIDesc")}</span>
        </button>
        <button class="action-card secondary" onClick={onSave}>
          <span class="card-icon material-icons-round">save</span>
          <span class="card-label">{t("saveForm")}</span>
          <span class="card-desc">{t("saveFormDesc")}</span>
        </button>
        <button
          class={`action-card outline${watcherActive ? " active" : ""}`}
          onClick={onToggleWatch}
        >
          <span class="card-icon material-icons-round">
            {watcherActive ? "stop" : "visibility"}
          </span>
          <span class="card-label">
            {watcherActive ? t("stopWatch") : t("watch")}
          </span>
          <span class="card-desc">
            {watcherActive ? t("stopWatchDesc") : t("watchDesc")}
          </span>
        </button>
        <button class="action-card outline" onClick={onDetect}>
          <span class="card-icon material-icons-round">manage_search</span>
          <span class="card-label">{t("detectFields")}</span>
          <span class="card-desc">{t("detectFieldsDesc")}</span>
        </button>
      </div>
      <div class="status-bar" id="status-bar">
        {detectedCount > 0
          ? `${detectedCount} ${t("fieldsDetected")}`
          : t("noFieldsDetected")}
      </div>
    </div>
  );
}

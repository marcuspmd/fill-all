/**
 * FieldsTabView — Preact component for the DevTools Fields tab.
 *
 * Supports both the initial loading state (during streaming detection)
 * and the static idle state (after detection is complete).
 */

import { h } from "preact";
import { t } from "@/lib/i18n";
import type { DetectedFieldSummary } from "@/types";
import { TypeBadge, MethodBadge, ConfidenceBadge } from "./badges";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FieldsTabCallbacks {
  onDetect: () => void;
  onFillAll: () => void;
  onFillEmpty: () => void;
  onClearDetected: () => void;
  onClearForm: () => void;
  onFillField: (selector: string) => void;
  onInspectField: (selector: string) => void;
  onToggleIgnore: (selector: string, label: string) => void;
}

export interface FieldsTabViewProps extends FieldsTabCallbacks {
  fields: DetectedFieldSummary[];
  ignoredSelectors: Set<string>;
  detecting: boolean;
}

// ── FieldRow ──────────────────────────────────────────────────────────────────

interface FieldRowProps {
  field: DetectedFieldSummary;
  index: number;
  ignored: boolean;
  onFill: (selector: string) => void;
  onInspect: (selector: string) => void;
  onToggleIgnore: (selector: string, label: string) => void;
}

function FieldRow({
  field,
  index,
  ignored,
  onFill,
  onInspect,
  onToggleIgnore,
}: FieldRowProps) {
  const displayType = field.contextualType || field.fieldType;
  const method = field.detectionMethod || "-";
  const label = field.label || field.name || field.id || field.selector;

  return (
    <tr class={ignored ? "row-ignored" : ""}>
      <td class="cell-num">{index}</td>
      <td>
        <TypeBadge type={displayType} />
      </td>
      <td>
        <MethodBadge method={method} />
      </td>
      <td>
        <ConfidenceBadge confidence={field.detectionConfidence} />
      </td>
      <td class="cell-mono">{field.id || field.name || "-"}</td>
      <td>{field.label || "-"}</td>
      <td class="cell-actions">
        <button
          class="icon-btn"
          title={t("actionFill")}
          onClick={() => onFill(field.selector)}
        >
          ⚡
        </button>
        <button
          class="icon-btn"
          title={t("actionInspect")}
          onClick={() => onInspect(field.selector)}
        >
          🔎
        </button>
        <button
          class={`icon-btn${ignored ? " icon-btn-off" : ""}`}
          title={ignored ? t("actionReactivate") : t("actionIgnore")}
          onClick={() => onToggleIgnore(field.selector, label)}
        >
          {ignored ? "🚫" : "👁️"}
        </button>
      </td>
    </tr>
  );
}

// ── FieldsTabView ─────────────────────────────────────────────────────────────

export function FieldsTabView({
  fields,
  ignoredSelectors,
  detecting,
  onDetect,
  onFillAll,
  onFillEmpty,
  onClearDetected,
  onClearForm,
  onFillField,
  onInspectField,
  onToggleIgnore,
}: FieldsTabViewProps) {
  const hasFields = fields.length > 0;

  return (
    <div>
      <div class="fields-toolbar">
        <button
          class="btn"
          id="btn-detect-fields"
          disabled={detecting}
          onClick={onDetect}
        >
          {detecting
            ? `🔄 ${t("detectFields")} ...`
            : `🔍 ${t("detectFields")}`}
        </button>
        <button
          class="btn"
          id="btn-fill-all-fields"
          disabled={detecting && !hasFields}
          onClick={onFillAll}
        >
          ⚡ {t("fillAll")}
        </button>
        <button
          class="btn"
          id="btn-fill-empty-fields"
          disabled={detecting && !hasFields}
          onClick={onFillEmpty}
        >
          🟦 {t("fillOnlyEmpty")}
        </button>
        <button
          class="btn btn-danger"
          id="btn-clear-fields"
          disabled={!hasFields}
          onClick={onClearDetected}
        >
          🗑️ Limpar Detectados
        </button>
        <button
          class="btn btn-danger"
          id="btn-clear-form"
          onClick={onClearForm}
        >
          🧹 Limpar Form
        </button>
        <span class="fields-count">
          {fields.length} {t("fieldCount")}
        </span>
      </div>
      <div class="table-wrap">
        {detecting && !hasFields ? (
          <table class="fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("columnType")}</th>
                <th>{t("columnMethod")}</th>
                <th>{t("columnConf")}</th>
                <th>{t("columnIdName")}</th>
                <th>{t("columnLabel")}</th>
                <th>{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-loading">
                <td
                  colspan={7}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  ⏳ Detectando campos...
                </td>
              </tr>
            </tbody>
          </table>
        ) : !hasFields ? (
          <div class="empty">{t("clickToDetect")}</div>
        ) : (
          <table class="fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("columnType")}</th>
                <th>{t("columnMethod")}</th>
                <th>{t("columnConf")}</th>
                <th>{t("columnIdName")}</th>
                <th>{t("columnLabel")}</th>
                <th>{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <FieldRow
                  key={field.selector}
                  field={field}
                  index={i + 1}
                  ignored={ignoredSelectors.has(field.selector)}
                  onFill={onFillField}
                  onInspect={onInspectField}
                  onToggleIgnore={onToggleIgnore}
                />
              ))}
              {detecting && (
                <tr class="row-loading">
                  <td
                    colspan={7}
                    style={{ textAlign: "center", padding: "10px" }}
                  >
                    ⏳ {t("detectFields")}...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

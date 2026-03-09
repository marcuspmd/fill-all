/**
 * FieldEditorModal — Preact modal for editing a field's fill rule in DevTools.
 *
 * Allows the user to:
 * - Override the detected field type
 * - Choose a generator ("auto", "ai", "tensorflow", or a specific FieldType)
 * - Set a fixed value
 * - Set a custom AI prompt
 * - Configure generator params (min, max, formatted, etc.) dynamically
 * - Save or delete the override rule
 */

import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import type { DetectedFieldSummary, FieldType, GeneratorParams } from "@/types";
import {
  getGeneratorParamDefs,
  getGeneratorKey,
} from "@/types/field-type-definitions";
import { t } from "@/lib/i18n";
import { SearchableSelectPreact } from "@/lib/ui/searchable-select-preact";
import {
  buildFieldTypeSelectEntries,
  buildGeneratorSelectEntries,
} from "@/lib/ui/select-builders";
import type { GeneratorParamDef } from "@/types/field-type-definitions";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GeneratorOption = "auto" | "ai" | "tensorflow" | FieldType;

export interface FieldEditorSavePayload {
  fieldType: FieldType;
  generator: GeneratorOption;
  fixedValue: string;
  aiPrompt: string;
  generatorParams: GeneratorParams;
}

export interface FieldEditorModalProps {
  field: DetectedFieldSummary;
  existingRule: FieldEditorSavePayload | null;
  onSave: (payload: FieldEditorSavePayload) => void;
  onDelete: () => void;
  onClose: () => void;
  onRedetect?: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPECIAL_GENERATORS = new Set(["auto", "ai", "tensorflow"]);

/** Returns the param defs for a given generator option. */
export function resolveParamDefs(
  gen: GeneratorOption,
): readonly GeneratorParamDef[] {
  if (SPECIAL_GENERATORS.has(gen)) return [];
  const key = getGeneratorKey(gen as FieldType) ?? gen;
  return getGeneratorParamDefs(key);
}

/** Builds initial params from param defs, merging existing values. */
export function buildInitialParams(
  defs: readonly GeneratorParamDef[],
  existing: GeneratorParams,
): GeneratorParams {
  const result: Record<string, unknown> = {};
  for (const def of defs) {
    const k = def.key as string;
    result[k] = k in existing ? existing[k] : def.defaultValue;
  }
  return result as GeneratorParams;
}

// ── Sub-Component: Generator Params ──────────────────────────────────────────

export interface GeneratorParamsSectionProps {
  defs: readonly GeneratorParamDef[];
  params: GeneratorParams;
  onChange: (params: GeneratorParams) => void;
}

export function GeneratorParamsSection({
  defs,
  params,
  onChange,
}: GeneratorParamsSectionProps) {
  if (defs.length === 0) return null;

  function update(key: string, value: unknown) {
    onChange({ ...params, [key]: value } as GeneratorParams);
  }

  return (
    <div class="editor-params-section">
      <span class="editor-params-title">{t("paramSectionTitle")}</span>

      {defs.map((def) => {
        const k = def.key as string;
        const currentValue =
          k in params ? params[k as keyof GeneratorParams] : def.defaultValue;

        if (def.type === "boolean") {
          return (
            <label key={k} class="editor-row editor-row--checkbox">
              <input
                type="checkbox"
                checked={!!currentValue}
                onChange={(e) =>
                  update(k, (e.target as HTMLInputElement).checked)
                }
              />
              <span class="editor-label">
                {t(def.labelKey as Parameters<typeof t>[0])}
              </span>
            </label>
          );
        }

        if (def.type === "number") {
          return (
            <label key={k} class="editor-row">
              <span class="editor-label">
                {t(def.labelKey as Parameters<typeof t>[0])}:
              </span>
              <input
                class="editor-input editor-input--number"
                type="number"
                value={currentValue as number}
                min={def.min}
                max={def.max}
                step={def.step ?? 1}
                onInput={(e) =>
                  update(k, Number((e.target as HTMLInputElement).value))
                }
              />
            </label>
          );
        }

        if (def.type === "text") {
          return (
            <label key={k} class="editor-row">
              <span class="editor-label">
                {t(def.labelKey as Parameters<typeof t>[0])}:
              </span>
              <input
                class="editor-input"
                type="text"
                value={currentValue as string}
                placeholder={
                  def.placeholder
                    ? t(def.placeholder as Parameters<typeof t>[0])
                    : undefined
                }
                onInput={(e) => update(k, (e.target as HTMLInputElement).value)}
              />
            </label>
          );
        }

        if (def.type === "select" && def.selectOptions) {
          const nativeEntries = def.selectOptions.map((o) => ({
            value: o.value,
            label: t(o.labelKey as Parameters<typeof t>[0]),
          }));
          return (
            <label key={k} class="editor-row">
              <span class="editor-label">
                {t(def.labelKey as Parameters<typeof t>[0])}:
              </span>
              <SearchableSelectPreact
                entries={nativeEntries}
                value={currentValue as string}
                onChange={(v) => update(k, v)}
                placeholder={t(def.labelKey as Parameters<typeof t>[0])}
                className="editor-select"
              />
            </label>
          );
        }

        return null;
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FieldEditorModal({
  field,
  existingRule,
  onSave,
  onDelete,
  onClose,
  onRedetect,
}: FieldEditorModalProps) {
  const displayLabel = field.label || field.name || field.id || field.selector;

  const [fieldType, setFieldType] = useState<FieldType>(
    existingRule?.fieldType ?? field.fieldType,
  );
  const [generator, setGenerator] = useState<GeneratorOption>(
    existingRule?.generator ?? "auto",
  );
  const [fixedValue, setFixedValue] = useState(existingRule?.fixedValue ?? "");
  const [aiPrompt, setAiPrompt] = useState(existingRule?.aiPrompt ?? "");

  const paramDefs = useMemo(() => resolveParamDefs(generator), [generator]);

  const [generatorParams, setGeneratorParams] = useState<GeneratorParams>(() =>
    buildInitialParams(paramDefs, existingRule?.generatorParams ?? {}),
  );

  const [isRedetecting, setIsRedetecting] = useState(false);

  // When generator changes, rebuild params with defaults (preserving compatible keys)
  function handleGeneratorChange(value: string) {
    const newGen = value as GeneratorOption;
    const newDefs = resolveParamDefs(newGen);
    setGenerator(newGen);
    setGeneratorParams(buildInitialParams(newDefs, generatorParams));
  }

  const fieldTypeEntries = useMemo(() => buildFieldTypeSelectEntries(), []);
  const generatorEntries = useMemo(() => buildGeneratorSelectEntries(), []);

  function handleSave() {
    onSave({ fieldType, generator, fixedValue, aiPrompt, generatorParams });
  }

  async function handleRedetect() {
    if (!onRedetect || isRedetecting) return;
    setIsRedetecting(true);
    try {
      await onRedetect();
    } finally {
      setIsRedetecting(false);
    }
  }

  return (
    <div
      class="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="modal-box" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <span class="modal-title">
            <span
              class="material-icons-round"
              style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}
            >
              edit
            </span>
            {t("editFieldRule")}
          </span>
          <button class="modal-close" onClick={onClose}>
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="editor-field-info">
            <span class="editor-label">{t("columnLabel")}:</span>
            <span class="editor-value">{displayLabel}</span>
          </div>
          <div class="editor-field-info">
            <span class="editor-label">{t("columnIdName")}:</span>
            <span class="editor-value editor-mono">{field.selector}</span>
          </div>

          <hr class="modal-divider" />

          <div class="editor-row">
            <span class="editor-label">{t("columnType")}:</span>
            <SearchableSelectPreact
              entries={fieldTypeEntries}
              value={fieldType}
              onChange={(v) => setFieldType(v as FieldType)}
              placeholder={t("columnType")}
              className="editor-select"
            />
          </div>

          <div class="editor-row">
            <span class="editor-label">{t("editorGenerator")}:</span>
            <SearchableSelectPreact
              entries={generatorEntries}
              value={generator}
              onChange={handleGeneratorChange}
              placeholder={t("editorGenerator")}
              className="editor-select"
            />
          </div>

          <GeneratorParamsSection
            defs={paramDefs}
            params={generatorParams}
            onChange={setGeneratorParams}
          />

          <label class="editor-row">
            <span class="editor-label">{t("editorFixedValue")}:</span>
            <input
              class="editor-input"
              type="text"
              placeholder={t("editorFixedValuePlaceholder")}
              value={fixedValue}
              onInput={(e) =>
                setFixedValue((e.target as HTMLInputElement).value)
              }
            />
          </label>

          <label class="editor-row">
            <span class="editor-label">{t("editorAiPrompt")}:</span>
            <input
              class="editor-input"
              type="text"
              placeholder={t("editorAiPromptPlaceholder")}
              value={aiPrompt}
              onInput={(e) => setAiPrompt((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class="modal-footer">
          {onRedetect && (
            <button
              class="btn btn-secondary"
              onClick={handleRedetect}
              disabled={isRedetecting}
            >
              <span class="material-icons-round">search</span>{" "}
              {isRedetecting ? t("editorRedetecting") : t("editorRedetect")}
            </button>
          )}
          {existingRule && (
            <button class="btn btn-danger" onClick={onDelete}>
              <span class="material-icons-round">delete</span>{" "}
              {t("editorDeleteRule")}
            </button>
          )}
          <button class="btn" onClick={onClose}>
            {t("editorCancel")}
          </button>
          <button class="btn btn-primary" onClick={handleSave}>
            💾 {t("editorSave")}
          </button>
        </div>
      </div>
    </div>
  );
}

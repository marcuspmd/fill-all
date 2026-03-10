/**
 * Generators tab — configure per-type default generator parameters.
 *
 * Renders a section for each FieldType that has configurable params,
 * loads saved defaults from storage, and lets the user save them.
 */

import type { FieldType } from "@/types";
import {
  GENERATOR_PARAM_DEFS,
  FIELD_TYPE_DEFINITIONS,
} from "@/types/field-type-definitions";
import {
  collectGeneratorParams,
  renderGeneratorParamFields,
  showToast,
} from "./shared";
import { t } from "@/lib/i18n";
import {
  getGeneratorDefaults,
  saveAllGeneratorDefaults,
  type GeneratorDefaults,
} from "@/lib/storage/generator-defaults-storage";

/** Keys that have at least one configurable param. */
const CONFIGURABLE_KEYS = Object.keys(GENERATOR_PARAM_DEFS) as FieldType[];

/**
 * Returns the human-readable label for a given FieldType,
 * falling back to the key itself.
 */
function getFieldTypeLabel(fieldType: FieldType): string {
  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === fieldType);
  return def?.description ?? fieldType;
}

function renderDefaultsSection(
  fieldType: FieldType,
  savedDefaults: GeneratorDefaults,
): string {
  const paramDefs = GENERATOR_PARAM_DEFS[fieldType];
  if (!paramDefs || paramDefs.length === 0) return "";

  const label = getFieldTypeLabel(fieldType);
  const existingParams = savedDefaults[fieldType];
  const fields = renderGeneratorParamFields(paramDefs, existingParams, {
    prefix: `gen-default-${fieldType}-`,
  });

  return `
    <div class="generator-default-section" data-field-type="${fieldType}">
      <h3 class="generator-default-title">${label}</h3>
      <div class="form-row generator-default-params">${fields}</div>
    </div>
  `;
}

function collectAllDefaults(): GeneratorDefaults {
  const defaults: GeneratorDefaults = {};
  const sections = document.querySelectorAll<HTMLElement>(
    ".generator-default-section",
  );

  for (const section of sections) {
    const fieldType = section.dataset.fieldType as FieldType | undefined;
    if (!fieldType) continue;

    const paramDefs = GENERATOR_PARAM_DEFS[fieldType];
    if (!paramDefs || paramDefs.length === 0) continue;

    const params = collectGeneratorParams(section);
    if (params && Object.keys(params).length > 0) {
      defaults[fieldType] = params;
    }
  }

  return defaults;
}

async function loadGeneratorsSection(): Promise<void> {
  const container = document.getElementById("generators-defaults-list");
  if (!container) return;

  const savedDefaults = await getGeneratorDefaults();

  container.innerHTML = CONFIGURABLE_KEYS.map((fieldType) =>
    renderDefaultsSection(fieldType, savedDefaults),
  ).join("");
}

function bindGeneratorsEvents(): void {
  document
    .getElementById("btn-save-generator-defaults")
    ?.addEventListener("click", async () => {
      const defaults = collectAllDefaults();
      await saveAllGeneratorDefaults(defaults);

      const msg = document.getElementById("generators-defaults-msg");
      if (msg) {
        msg.textContent = t("msgGeneratorDefaultsSaved");
        msg.style.display = "block";
        setTimeout(() => {
          msg.style.display = "none";
        }, 3000);
      }

      showToast(t("msgGeneratorDefaultsSaved"), "success");
    });
}

export async function initGeneratorsSection(): Promise<void> {
  await loadGeneratorsSection();
  bindGeneratorsEvents();
}

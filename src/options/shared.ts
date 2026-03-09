/**
 * Shared utilities for the Options page.
 * Re-exports common UI utilities from @/lib/ui and provides SearchableSelect
 * instances for the rule-type, rule-generator and dataset-type fields.
 */

import {
  buildFieldTypeSelectEntries,
  buildGeneratorSelectEntries,
} from "@/lib/ui/select-builders";
import { SearchableSelect } from "@/lib/ui/searchable-select";

export {
  escapeHtml,
  showToast,
  initTabs,
  collectGeneratorParams,
  renderGeneratorParamFields,
} from "@/lib/ui";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── SearchableSelect instances ────────────────────────────────────────────

export let ruleTypeSelect: SearchableSelect;
export let ruleGeneratorSelect: SearchableSelect;
export let datasetTypeSelect: SearchableSelect;

/**
 * Mounts the three SearchableSelect components into their container elements.
 * Must be called after the DOM is ready and before any tab section init.
 */
export function initSearchableSelects(): void {
  const ruleTypeContainer = document.getElementById("rule-type-container");
  const ruleGeneratorContainer = document.getElementById(
    "rule-generator-container",
  );
  const datasetTypeContainer = document.getElementById(
    "dataset-type-container",
  );

  if (ruleTypeContainer) {
    ruleTypeSelect = new SearchableSelect({
      entries: buildFieldTypeSelectEntries(),
      placeholder: "Selecione o tipo…",
    });
    ruleTypeSelect.mount(ruleTypeContainer);
  }

  if (ruleGeneratorContainer) {
    ruleGeneratorSelect = new SearchableSelect({
      entries: buildGeneratorSelectEntries(),
      placeholder: "Selecione o gerador…",
      value: "auto",
    });
    ruleGeneratorSelect.mount(ruleGeneratorContainer);
  }

  if (datasetTypeContainer) {
    datasetTypeSelect = new SearchableSelect({
      entries: buildFieldTypeSelectEntries(),
      placeholder: "Selecione o tipo…",
    });
    datasetTypeSelect.mount(datasetTypeContainer);
  }
}

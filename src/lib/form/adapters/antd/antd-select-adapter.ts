/**
 * Ant Design Select Adapter
 *
 * Detects and fills `<Select>`, `<TreeSelect>`, `<Cascader>`, and `<AutoComplete>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-select ant-select-single ...">
 *     <div class="ant-select-selector">
 *       <span class="ant-select-selection-search">
 *         <input role="combobox" class="ant-select-selection-search-input" />
 *       </span>
 *       <span class="ant-select-selection-placeholder">Placeholder</span>
 *       <span class="ant-select-selection-item">Selected text</span>
 *     </div>
 *   </div>
 *
 * Filling: Opens dropdown, searches for the value, clicks matching option.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  findAntName,
  isAntRequired,
  simulateClick,
  getUniqueSelector,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdSelectAdapter: CustomComponentAdapter = {
  name: "antd-select",
  selector: ".ant-select",

  matches(el: HTMLElement): boolean {
    // Must have the ant-select class and not be disabled
    return (
      el.classList.contains("ant-select") &&
      !el.classList.contains("ant-select-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const placeholder = wrapper
      .querySelector<HTMLElement>(".ant-select-selection-placeholder")
      ?.textContent?.trim();

    const options = extractDropdownOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "select",
      adapterName: "antd-select",
      label: findAntLabel(wrapper),
      name: findAntName(wrapper),
      id: findAntId(wrapper),
      placeholder,
      required: isAntRequired(wrapper),
      options,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    // Open the dropdown
    const selector = wrapper.querySelector<HTMLElement>(".ant-select-selector");
    if (!selector) return false;

    simulateClick(selector);

    // Wait a tick for the dropdown to render, then pick an option
    return selectOption(wrapper, value);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDropdownOptions(
  wrapper: HTMLElement,
): Array<{ value: string; text: string }> | undefined {
  // Antd renders options in a portal — try to find them via the dropdown ID
  const listboxId = wrapper
    .querySelector<HTMLElement>("[role='combobox']")
    ?.getAttribute("aria-controls");

  if (listboxId) {
    const listbox = document.getElementById(listboxId);
    if (listbox) {
      const items = listbox.querySelectorAll<HTMLElement>("[role='option']");
      const opts = Array.from(items)
        .map((item) => ({
          value: item.getAttribute("title") ?? item.textContent?.trim() ?? "",
          text: item.textContent?.trim() ?? "",
        }))
        .filter((o) => o.value);

      if (opts.length > 0) return opts;
    }
  }

  return undefined;
}

function selectOption(wrapper: HTMLElement, value: string): boolean {
  // Search input inside the select
  const searchInput = wrapper.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input",
  );

  if (searchInput) {
    // Type the value to filter options
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(searchInput, value);
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Try to find and click the matching option from visible dropdowns
  const dropdowns = document.querySelectorAll<HTMLElement>(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  for (const dropdown of dropdowns) {
    const options = dropdown.querySelectorAll<HTMLElement>(
      ".ant-select-item-option",
    );

    // Try exact match by title attribute
    for (const opt of options) {
      const title = opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
      if (title.toLowerCase() === value.toLowerCase()) {
        simulateClick(opt);
        return true;
      }
    }

    // Try partial match
    for (const opt of options) {
      const title = opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
      if (title.toLowerCase().includes(value.toLowerCase())) {
        simulateClick(opt);
        return true;
      }
    }

    // Fallback: pick the first non-disabled option
    const firstValid = dropdown.querySelector<HTMLElement>(
      ".ant-select-item-option:not(.ant-select-item-option-disabled)",
    );
    if (firstValid) {
      simulateClick(firstValid);
      return true;
    }
  }

  return false;
}

/**
 * Ant Design Select Adapter
 *
 * Detects and fills `<Select>`, `<TreeSelect>`, `<Cascader>`, and `<AutoComplete>` components.
 *
 * DOM structure — Single (antd v5 classic):
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
 * DOM structure — Single (antd v5 CSS-var / v5.17+):
 *   <div class="ant-select ant-select-single ant-select-css-var ...">
 *     <div class="ant-select-content">
 *       <div class="ant-select-placeholder">Placeholder</div>
 *       <input class="ant-select-input" role="combobox" type="search" />
 *     </div>
 *     <div class="ant-select-suffix">...</div>
 *   </div>
 *
 * DOM structure — Multiple (antd v5):
 *   <div class="ant-select ant-select-multiple ...">
 *     <div class="ant-select-content">
 *       <div class="ant-select-content-item">
 *         <span class="ant-select-selection-item">Tag selecionada</span>
 *       </div>
 *       <div class="ant-select-content-item ant-select-content-item-suffix">
 *         <input class="ant-select-input" role="combobox" type="search" />
 *       </div>
 *     </div>
 *   </div>
 *
 * Filling: Opens dropdown, searches for the value, clicks matching option.
 * Multiple mode: selects 1–3 options randomly (or matches comma-separated values).
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
  waitForElement,
} from "./antd-utils";
import { buildSignals } from "../../extractors";
import { createLogger } from "@/lib/logger";

const log = createLogger("AntdSelect");

export const antdSelectAdapter: CustomComponentAdapter = {
  name: "antd-select",
  // Exclude auto-complete: it also has .ant-select but has its own adapter that
  // comes after this one in the registry. Without the exclusion, auto-complete
  // elements would be claimed here before antdAutoCompleteAdapter runs.
  selector:
    ".ant-select:not(.ant-select-auto-complete):not(.ant-select-disabled)",

  matches(el: HTMLElement): boolean {
    // Must have the ant-select class, not disabled, and not an AutoComplete
    // (AutoComplete also has .ant-select — its dedicated adapter handles it).
    return (
      el.classList.contains("ant-select") &&
      !el.classList.contains("ant-select-disabled") &&
      !el.classList.contains("ant-select-auto-complete")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    // Old antd v5 uses .ant-select-selection-placeholder; new CSS-var structure uses .ant-select-placeholder
    const placeholder = (
      wrapper.querySelector<HTMLElement>(".ant-select-selection-placeholder") ??
      wrapper.querySelector<HTMLElement>(".ant-select-placeholder")
    )?.textContent?.trim();

    const isMultiple = wrapper.classList.contains("ant-select-multiple");
    const options = extractDropdownOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: isMultiple ? "multiselect" : "select",
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

  async fill(wrapper: HTMLElement, value: string): Promise<boolean> {
    const isMultiple = wrapper.classList.contains("ant-select-multiple");
    const wrapperSelector = getUniqueSelector(wrapper);

    const combobox = wrapper.querySelector<HTMLInputElement>(
      "input[role='combobox'], .ant-select-selection-search-input, .ant-select-input",
    );

    // Old antd v5 classic: has .ant-select-selector wrapping the search input.
    // New antd v5 CSS-var / v5.17+: no .ant-select-selector; the input is a direct
    // child of .ant-select-content and IS the toggle trigger.
    // IMPORTANT: for the new structure, we must NOT fire mousedown on BOTH the
    // input and its parent — two consecutive mousedowns on the same React handler
    // chain cause an open/close toggle leaving the dropdown closed.
    const selectorEl = wrapper.querySelector<HTMLElement>(
      ".ant-select-selector",
    );

    if (!selectorEl && !combobox) {
      log.warn(`Container do select não encontrado em: ${wrapperSelector}`);
      return false;
    }

    if (selectorEl) {
      // Old structure: focus + mousedown on search input, then simulateClick selector.
      if (combobox) {
        combobox.focus();
        combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      }
      simulateClick(selectorEl);
    } else {
      // New CSS-var structure: dispatch mousedown ONLY on the input.
      // A full simulateClick (mousedown → mouseup → click) would cause React to
      // process the 'click' handler and toggle the dropdown closed immediately
      // after the 'mousedown' handler opened it.
      if (combobox) {
        combobox.focus();
        combobox.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
        );
      } else {
        // Fallback: trigger via the content wrapper
        const contentEl = wrapper.querySelector<HTMLElement>(
          ".ant-select-content",
        );
        if (contentEl) {
          contentEl.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
          );
        }
      }
    }

    // Wait for the dropdown to render
    const dropdown = await waitForElement(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
      800,
    );

    if (!dropdown) {
      // Last attempt: pointerdown on the direct trigger (single event, no double-fire)
      const triggerEl = selectorEl ?? combobox ?? wrapper;
      triggerEl.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
      );
      await new Promise((r) => setTimeout(r, 300));

      const retryDropdown = document.querySelector<HTMLElement>(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
      );
      if (!retryDropdown) {
        log.warn(
          `Dropdown .ant-select-dropdown não apareceu para: ${wrapperSelector}`,
        );
        return false;
      }
    }

    if (isMultiple) {
      return await selectMultipleOptions(wrapper, value);
    }

    return await selectOption(wrapper, value);
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

async function selectOption(
  wrapper: HTMLElement,
  value: string,
): Promise<boolean> {
  // Search input inside the select — supports both single and multiple DOM variants.
  const searchInput = wrapper.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input, .ant-select-input",
  );

  // Only type into the search box when we have a real search value.
  // Typing an empty string can trigger React to re-render/close the dropdown
  // before we get a chance to click an option.
  if (searchInput && value) {
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

  // Wait for options to appear. Handles both regular re-renders and AJAX/server-side
  // selects that load options asynchronously after the search input event fires.
  let hasOptions = await waitForElement(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
    2000,
  );

  // If no options appeared after typing (AJAX returned no results or hasn't loaded
  // yet), clear the search and wait again — many AJAX selects show their default
  // list when the query is empty.
  if (!hasOptions && searchInput) {
    const clearSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    if (clearSetter) {
      clearSetter.call(searchInput, "");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    hasOptions = await waitForElement(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
      1500,
    );
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

/**
 * Selects multiple options from an open ant-select-multiple dropdown.
 *
 * Strategy:
 * 1. If `value` contains comma-separated strings, try to match each one.
 * 2. Otherwise, pick 1–3 random non-selected options from the dropdown.
 * 3. Close the dropdown by pressing Escape after all selections.
 */
async function selectMultipleOptions(
  wrapper: HTMLElement,
  value: string,
): Promise<boolean> {
  // Wait for options to load before attempting to click — handles AJAX-loaded selects.
  await waitForElement(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
    2000,
  );

  const dropdowns = document.querySelectorAll<HTMLElement>(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  let selected = false;

  for (const dropdown of dropdowns) {
    const allOptions = Array.from(
      dropdown.querySelectorAll<HTMLElement>(
        ".ant-select-item-option:not(.ant-select-item-option-disabled)",
      ),
    );

    if (allOptions.length === 0) continue;

    // Collect desired values from comma-separated input (e.g. "Option A, Option B")
    const desiredValues = value
      ? value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    const optionsToClick: HTMLElement[] = [];

    if (desiredValues.length > 0) {
      // Try to find each desired value
      for (const desired of desiredValues) {
        const match = allOptions.find((opt) => {
          const title =
            opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
          return (
            title.toLowerCase() === desired.toLowerCase() ||
            title.toLowerCase().includes(desired.toLowerCase())
          );
        });
        if (match) optionsToClick.push(match);
      }
    }

    // If nothing matched (or no value provided), pick 1–3 random options
    if (optionsToClick.length === 0) {
      const count = Math.min(
        Math.floor(Math.random() * 3) + 1,
        allOptions.length,
      );
      const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
      optionsToClick.push(...shuffled.slice(0, count));
    }

    for (const opt of optionsToClick) {
      simulateClick(opt);
      selected = true;
    }

    break;
  }

  // Close the dropdown by pressing Escape on the search input
  const searchInput = wrapper.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input, .ant-select-input",
  );
  if (searchInput) {
    searchInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
      }),
    );
  }

  return selected;
}

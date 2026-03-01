/**
 * Ant Design Select Adapter
 *
 * Detects and fills `<Select>`, `<TreeSelect>`, `<Cascader>`, and `<AutoComplete>` components.
 *
 * DOM structure — Single (antd v5):
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

    // Open the dropdown — try multiple trigger strategies for React/antd compatibility.
    // Multiple mode uses `.ant-select-content`; single mode uses `.ant-select-selector`.
    const clickTarget = wrapper.querySelector<HTMLElement>(
      ".ant-select-selector, .ant-select-content",
    );
    const combobox = wrapper.querySelector<HTMLInputElement>(
      "input[role='combobox'], .ant-select-selection-search-input, .ant-select-input",
    );

    if (!clickTarget) {
      log.warn(`Container do select não encontrado em: ${wrapperSelector}`);
      return false;
    }

    // Strategy 1: focus the inner combobox input (React registers this reliably)
    if (combobox) {
      combobox.focus();
      combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    }
    // Strategy 2: click the selector/content container
    simulateClick(clickTarget);

    // Wait for the dropdown to render
    const dropdown = await waitForElement(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
      800,
    );

    if (!dropdown) {
      // Last attempt: try pointerdown which some antd versions listen to
      wrapper.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
      );
      clickTarget.dispatchEvent(
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
      return selectMultipleOptions(wrapper, value);
    }

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
function selectMultipleOptions(wrapper: HTMLElement, value: string): boolean {
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

/**
 * Ant Design Cascader Adapter
 *
 * Detects and fills `<Cascader>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-select ant-cascader ...">
 *     <div class="ant-select-selector">
 *       <span class="ant-select-selection-search">
 *         <input ... role="combobox" />
 *       </span>
 *       <span class="ant-select-selection-placeholder">Please select</span>
 *     </div>
 *   </div>
 *
 * After open:
 *   <div class="ant-cascader-dropdown ...">
 *     <div class="ant-cascader-menus">
 *       <ul class="ant-cascader-menu">
 *         <li class="ant-cascader-menu-item" title="Option1">...</li>
 *       </ul>
 *     </div>
 *   </div>
 *
 * Filling: Opens the cascader and clicks a random option at each level.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  isAntRequired,
  simulateClick,
  getUniqueSelector,
  waitForElement,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdCascaderAdapter: CustomComponentAdapter = {
  name: "antd-cascader",
  selector: ".ant-cascader:not(.ant-select-disabled)",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-cascader") &&
      el.classList.contains("ant-select") &&
      !el.classList.contains("ant-select-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "select",
      adapterName: "antd-cascader",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      placeholder: getPlaceholder(wrapper),
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  async fill(wrapper: HTMLElement, _value: string): Promise<boolean> {
    // Open the cascader dropdown
    const selector = wrapper.querySelector<HTMLElement>(".ant-select-selector");
    if (!selector) return false;

    simulateClick(selector);

    // Wait for dropdown to appear
    const dropdown = await waitForElement(".ant-cascader-dropdown", 500);
    if (!dropdown) return false;

    // Navigate through cascader levels
    return selectCascaderLevels(dropdown);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlaceholder(wrapper: HTMLElement): string | undefined {
  const el = wrapper.querySelector<HTMLElement>(
    ".ant-select-selection-placeholder",
  );
  return el?.textContent?.trim() || undefined;
}

async function selectCascaderLevels(dropdown: HTMLElement): Promise<boolean> {
  const MAX_LEVELS = 5;
  let level = 0;

  while (level < MAX_LEVELS) {
    const menus = dropdown.querySelectorAll<HTMLElement>(".ant-cascader-menu");
    const currentMenu = menus[level];
    if (!currentMenu) break;

    const items = currentMenu.querySelectorAll<HTMLElement>(
      ".ant-cascader-menu-item:not(.ant-cascader-menu-item-disabled)",
    );
    if (items.length === 0) break;

    // Pick a random item
    const idx = Math.floor(Math.random() * items.length);
    simulateClick(items[idx]);

    // Check if this item is a leaf (no expand icon)
    const isLeaf =
      !items[idx].querySelector(".ant-cascader-menu-item-expand-icon") ||
      items[idx].classList.contains("ant-cascader-menu-item-leaf");

    if (isLeaf) return true;

    // Wait for next menu to render
    await new Promise((r) => setTimeout(r, 100));
    level++;
  }

  return level > 0;
}

/**
 * Ant Design TreeSelect Adapter
 *
 * Detects and fills `<TreeSelect>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-select ant-tree-select ...">
 *     <div class="ant-select-selector">
 *       <span class="ant-select-selection-search">
 *         <input role="combobox" ... />
 *       </span>
 *       <span class="ant-select-selection-placeholder">Please select</span>
 *     </div>
 *   </div>
 *
 * After open:
 *   <div class="ant-tree-select-dropdown ...">
 *     <div class="ant-select-tree">
 *       <div class="ant-select-tree-treenode">
 *         <span class="ant-select-tree-title">Node text</span>
 *       </div>
 *     </div>
 *   </div>
 *
 * Filling: Opens the dropdown and clicks a random tree node.
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
import { createLogger } from "@/lib/logger";

const log = createLogger("AntdTreeSelect");

export const antdTreeSelectAdapter: CustomComponentAdapter = {
  name: "antd-tree-select",
  selector: ".ant-tree-select:not(.ant-select-disabled)",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-tree-select") &&
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
      adapterName: "antd-tree-select",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      placeholder: getPlaceholder(wrapper),
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  async fill(wrapper: HTMLElement, _value: string): Promise<boolean> {
    // Open the tree select dropdown
    const selector = wrapper.querySelector<HTMLElement>(".ant-select-selector");
    if (!selector) {
      log.warn(
        `Seletor .ant-select-selector não encontrado em: ${getUniqueSelector(wrapper)}`,
      );
      return false;
    }

    simulateClick(selector);

    // Wait for the dropdown to appear
    const dropdown = await waitForElement(".ant-tree-select-dropdown", 500);
    if (!dropdown) {
      log.warn(
        `Dropdown .ant-tree-select-dropdown não apareceu (timeout 500ms) para: ${getUniqueSelector(wrapper)}`,
      );
      return false;
    }

    // Find leaf nodes (nodes without children that can be selected)
    const nodes = dropdown.querySelectorAll<HTMLElement>(
      ".ant-select-tree-treenode:not(.ant-select-tree-treenode-disabled)",
    );
    if (nodes.length === 0) {
      log.warn(
        `Nenhum nó disponível no tree-select dropdown para: ${getUniqueSelector(wrapper)}`,
      );
      return false;
    }

    // Pick a random node
    const idx = Math.floor(Math.random() * nodes.length);
    const titleEl = nodes[idx].querySelector<HTMLElement>(
      ".ant-select-tree-title",
    );

    if (titleEl) {
      simulateClick(titleEl);
      return true;
    }

    simulateClick(nodes[idx]);
    return true;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlaceholder(wrapper: HTMLElement): string | undefined {
  const el = wrapper.querySelector<HTMLElement>(
    ".ant-select-selection-placeholder",
  );
  return el?.textContent?.trim() || undefined;
}

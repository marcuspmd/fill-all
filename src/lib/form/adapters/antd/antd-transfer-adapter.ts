/**
 * Ant Design Transfer Adapter
 *
 * Detects and fills `<Transfer>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-transfer ...">
 *     <div class="ant-transfer-list">           ← source
 *       <div class="ant-transfer-list-body">
 *         <ul class="ant-transfer-list-content">
 *           <li class="ant-transfer-list-content-item">
 *             <label class="ant-checkbox-wrapper">
 *               <span class="ant-checkbox"><input type="checkbox" /></span>
 *             </label>
 *             <span class="ant-transfer-list-content-item-text">Item</span>
 *           </li>
 *         </ul>
 *       </div>
 *     </div>
 *     <div class="ant-transfer-operation">
 *       <button ... class="ant-btn">></button>
 *       <button ... class="ant-btn"><</button>
 *     </div>
 *     <div class="ant-transfer-list">           ← target
 *       ...
 *     </div>
 *   </div>
 *
 * Filling: Selects items from the source list and clicks the transfer button.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  isAntRequired,
  simulateClick,
  getUniqueSelector,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdTransferAdapter: CustomComponentAdapter = {
  name: "antd-transfer",
  selector: ".ant-transfer",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-transfer") &&
      !el.classList.contains("ant-transfer-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const options = extractTransferOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "select",
      adapterName: "antd-transfer",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      options,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, _value: string): boolean {
    const lists = wrapper.querySelectorAll<HTMLElement>(".ant-transfer-list");
    if (lists.length < 2) return false;

    const sourceList = lists[0];
    const sourceItems = sourceList.querySelectorAll<HTMLElement>(
      ".ant-transfer-list-content-item:not(.ant-transfer-list-content-item-disabled)",
    );

    if (sourceItems.length === 0) return false;

    // Select a random subset of items (at least 1, up to half)
    const count = Math.max(
      1,
      Math.floor(Math.random() * Math.ceil(sourceItems.length / 2)),
    );
    const indices = new Set<number>();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * sourceItems.length));
    }

    // Click each selected item's checkbox
    for (const idx of indices) {
      const checkbox = sourceItems[idx].querySelector<HTMLElement>(
        ".ant-checkbox-wrapper:not(.ant-checkbox-wrapper-checked)",
      );
      if (checkbox) {
        simulateClick(checkbox);
      }
    }

    // Click the "move to target" button (first button in operation area)
    const operationArea = wrapper.querySelector<HTMLElement>(
      ".ant-transfer-operation",
    );
    if (operationArea) {
      const moveBtn = operationArea.querySelector<HTMLButtonElement>(
        "button:not([disabled])",
      );
      if (moveBtn) {
        simulateClick(moveBtn);
        return true;
      }
    }

    return false;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTransferOptions(
  wrapper: HTMLElement,
): Array<{ value: string; text: string }> | undefined {
  const items = wrapper.querySelectorAll<HTMLElement>(
    ".ant-transfer-list:first-child .ant-transfer-list-content-item-text",
  );

  const opts = Array.from(items)
    .map((item) => ({
      value: item.textContent?.trim() ?? "",
      text: item.textContent?.trim() ?? "",
    }))
    .filter((o) => o.text);

  return opts.length > 0 ? opts : undefined;
}

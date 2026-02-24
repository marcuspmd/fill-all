/**
 * Ant Design Checkbox Group Adapter
 *
 * Detects and fills `<Checkbox.Group>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-checkbox-group">
 *     <label class="ant-checkbox-wrapper">
 *       <span class="ant-checkbox"><input type="checkbox" /></span>
 *       <span>Option text</span>
 *     </label>
 *     ...
 *   </div>
 *
 * Filling: Clicks a random unchecked checkbox (or matches by value/text).
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

export const antdCheckboxAdapter: CustomComponentAdapter = {
  name: "antd-checkbox",
  selector: ".ant-checkbox-group",

  matches(el: HTMLElement): boolean {
    return el.classList.contains("ant-checkbox-group");
  },

  buildField(wrapper: HTMLElement): FormField {
    const options = extractCheckboxOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "unknown",
      adapterName: "antd-checkbox",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      options,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const labels = wrapper.querySelectorAll<HTMLElement>(
      ".ant-checkbox-wrapper",
    );

    // Try matching by value or text
    for (const label of labels) {
      const input = label.querySelector<HTMLInputElement>(
        "input[type='checkbox']",
      );
      const text = label.textContent?.trim() ?? "";

      if (
        input?.value === value ||
        text.toLowerCase() === value.toLowerCase() ||
        text.toLowerCase().includes(value.toLowerCase())
      ) {
        if (!label.classList.contains("ant-checkbox-wrapper-checked")) {
          simulateClick(label);
        }
        return true;
      }
    }

    // Fallback: check the first unchecked checkbox
    const unchecked = wrapper.querySelector<HTMLElement>(
      ".ant-checkbox-wrapper:not(.ant-checkbox-wrapper-checked)",
    );
    if (unchecked) {
      simulateClick(unchecked);
      return true;
    }

    return false;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCheckboxOptions(
  wrapper: HTMLElement,
): Array<{ value: string; text: string }> | undefined {
  const labels = wrapper.querySelectorAll<HTMLElement>(".ant-checkbox-wrapper");

  const opts = Array.from(labels)
    .map((label) => {
      const input = label.querySelector<HTMLInputElement>(
        "input[type='checkbox']",
      );
      const text = label.textContent?.trim() ?? "";
      return {
        value: input?.value || text,
        text,
      };
    })
    .filter((o) => o.text);

  return opts.length > 0 ? opts : undefined;
}

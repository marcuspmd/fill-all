/**
 * Ant Design Radio Group Adapter
 *
 * Detects and fills `<Radio.Group>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-radio-group ...">
 *     <label class="ant-radio-wrapper">
 *       <span class="ant-radio"><input type="radio" /></span>
 *       <span>Option text</span>
 *     </label>
 *     ...
 *   </div>
 *
 * Also handles `<Radio.Button>` style:
 *   <div class="ant-radio-group ant-radio-group-solid">
 *     <label class="ant-radio-button-wrapper">...
 *
 * Filling: Clicks the matching radio option.
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

export const antdRadioAdapter: CustomComponentAdapter = {
  name: "antd-radio",
  selector: ".ant-radio-group",

  matches(el: HTMLElement): boolean {
    return el.classList.contains("ant-radio-group");
  },

  buildField(wrapper: HTMLElement): FormField {
    const options = extractRadioOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "radio",
      adapterName: "antd-radio",
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
      ".ant-radio-wrapper, .ant-radio-button-wrapper",
    );

    // Try matching by value on the underlying input
    for (const label of labels) {
      const input = label.querySelector<HTMLInputElement>(
        "input[type='radio']",
      );
      if (input?.value === value) {
        simulateClick(label);
        return true;
      }
    }

    // Try matching by text
    for (const label of labels) {
      const text = label.textContent?.trim() ?? "";
      if (text.toLowerCase() === value.toLowerCase()) {
        simulateClick(label);
        return true;
      }
    }

    // Partial text match
    for (const label of labels) {
      const text = label.textContent?.trim() ?? "";
      if (text.toLowerCase().includes(value.toLowerCase())) {
        simulateClick(label);
        return true;
      }
    }

    // Fallback: click the first unchecked option
    const first = wrapper.querySelector<HTMLElement>(
      ".ant-radio-wrapper:not(.ant-radio-wrapper-checked), .ant-radio-button-wrapper:not(.ant-radio-button-wrapper-checked)",
    );
    if (first) {
      simulateClick(first);
      return true;
    }

    return false;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractRadioOptions(
  wrapper: HTMLElement,
): Array<{ value: string; text: string }> | undefined {
  const labels = wrapper.querySelectorAll<HTMLElement>(
    ".ant-radio-wrapper, .ant-radio-button-wrapper",
  );

  const opts = Array.from(labels)
    .map((label) => {
      const input = label.querySelector<HTMLInputElement>(
        "input[type='radio']",
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

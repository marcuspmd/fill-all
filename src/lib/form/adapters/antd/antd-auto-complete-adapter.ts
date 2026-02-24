/**
 * Ant Design AutoComplete Adapter
 *
 * Detects and fills `<AutoComplete>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-select ant-select-auto-complete ...">
 *     <div class="ant-select-selector">
 *       <span class="ant-select-selection-search">
 *         <input role="combobox" class="ant-select-selection-search-input" ... />
 *       </span>
 *     </div>
 *   </div>
 *
 * Filling: Types into the input using React-compatible events.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  isAntRequired,
  setReactInputValue,
  getUniqueSelector,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdAutoCompleteAdapter: CustomComponentAdapter = {
  name: "antd-auto-complete",
  selector: ".ant-select-auto-complete:not(.ant-select-disabled)",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-select-auto-complete") &&
      !el.classList.contains("ant-select-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const input = wrapper.querySelector<HTMLInputElement>(
      ".ant-select-selection-search-input",
    );

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "unknown",
      adapterName: "antd-auto-complete",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      placeholder: input?.placeholder || undefined,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const input = wrapper.querySelector<HTMLInputElement>(
      ".ant-select-selection-search-input",
    );
    if (!input) return false;

    input.focus();
    setReactInputValue(input, value);

    return true;
  },
};

/**
 * Ant Design DatePicker / TimePicker Adapter
 *
 * Detects and fills:
 *   - `<DatePicker>` → `.ant-picker` (not `.ant-picker-time`)
 *   - `<DatePicker.RangePicker>` → `.ant-picker-range`
 *   - `<TimePicker>` → `.ant-picker` with time panel
 *
 * DOM structure (antd v5):
 *   <div class="ant-picker ...">
 *     <div class="ant-picker-input">
 *       <input placeholder="Select date" />
 *     </div>
 *   </div>
 *
 * Filling: Sets value on the inner <input>, dispatches events, then
 * simulates Enter to confirm the selection.
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

export const antdDatepickerAdapter: CustomComponentAdapter = {
  name: "antd-datepicker",
  selector: ".ant-picker",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-picker") &&
      !el.classList.contains("ant-picker-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const input = wrapper.querySelector<HTMLInputElement>("input");

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "unknown",
      adapterName: "antd-datepicker",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper) ?? input?.id ?? undefined,
      placeholder: input?.placeholder || undefined,
      required: isAntRequired(wrapper),
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const input = wrapper.querySelector<HTMLInputElement>("input");
    if (!input) return false;

    // Open the picker
    simulateClick(input);

    // Set the value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    // Simulate Enter key to confirm
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    return true;
  },
};

/**
 * Ant Design Switch Adapter
 *
 * Detects and fills `<Switch>` components.
 *
 * DOM structure (antd v5):
 *   <button role="switch" class="ant-switch ..." aria-checked="false">
 *     <div class="ant-switch-handle"></div>
 *     <span class="ant-switch-inner">
 *       <span class="ant-switch-inner-checked">On</span>
 *       <span class="ant-switch-inner-unchecked">Off</span>
 *     </span>
 *   </button>
 *
 * Filling: Clicks the switch to toggle it on.
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

export const antdSwitchAdapter: CustomComponentAdapter = {
  name: "antd-switch",
  selector: "button.ant-switch",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-switch") &&
      !el.classList.contains("ant-switch-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "unknown",
      adapterName: "antd-switch",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const isChecked = wrapper.classList.contains("ant-switch-checked");
    const shouldBeOn =
      value === "true" || value === "1" || value === "on" || value === "yes";

    // Toggle only if current state doesn't match desired state
    if (shouldBeOn !== isChecked) {
      simulateClick(wrapper);
    }

    return true;
  },
};

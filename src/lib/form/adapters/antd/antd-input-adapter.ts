/**
 * Ant Design Input / InputNumber / TextArea / Mentions Adapter
 *
 * Detects and fills:
 *   - `<Input>` → `.ant-input`
 *   - `<Input.TextArea>` → `.ant-input` (textarea)
 *   - `<InputNumber>` → `.ant-input-number`
 *   - `<Mentions>` → `.ant-mentions`
 *
 * These are thin wrappers over native <input>/<textarea>, but the wrapper
 * div is what receives Antd-specific styles and validation states.
 *
 * Filling: Sets value via native setter + dispatches React synthetic events.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  findAntName,
  isAntRequired,
  setReactInputValue,
  getUniqueSelector,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdInputAdapter: CustomComponentAdapter = {
  name: "antd-input",
  selector: ".ant-input-affix-wrapper, .ant-input-number, .ant-mentions",

  matches(el: HTMLElement): boolean {
    return (
      (el.classList.contains("ant-input-affix-wrapper") ||
        el.classList.contains("ant-input-number") ||
        el.classList.contains("ant-mentions")) &&
      !el.classList.contains("ant-input-disabled") &&
      !el.classList.contains("ant-input-number-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const input = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    );

    // ant-input-number always wraps a numeric spinbutton — classify it directly
    // so downstream classifiers never misidentify it as select or text.
    const isInputNumber = wrapper.classList.contains("ant-input-number");

    const nativeType =
      input instanceof HTMLInputElement ? input.type : undefined;
    const autocomplete =
      input instanceof HTMLInputElement
        ? (input.getAttribute("autocomplete") ?? undefined)
        : undefined;

    // Only resolve fieldType for unambiguous native HTML types (confidence 1.0).
    // Everything else stays "unknown" so TF.js / keyword / Chrome-AI classifiers
    // can use contextSignals (label + name + placeholder + autocomplete) properly.
    const resolvedFieldType = ((): FormField["fieldType"] => {
      if (isInputNumber) return "number";
      if (nativeType === "email") return "email";
      if (nativeType === "tel") return "phone";
      if (nativeType === "url") return "website";
      if (nativeType === "password") return "password";
      if (nativeType === "number") return "number";
      if (nativeType === "date") return "date";
      if (
        nativeType &&
        ["time", "datetime-local", "month", "week"].includes(nativeType)
      )
        return "date";
      return "unknown";
    })();

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: resolvedFieldType,
      adapterName: "antd-input",
      label: findAntLabel(wrapper),
      name: findAntName(wrapper) ?? input?.name ?? undefined,
      id: findAntId(wrapper) ?? input?.id ?? undefined,
      placeholder: input?.placeholder || undefined,
      // Expose autocomplete so buildSignals includes it in contextSignals,
      // giving TF.js / keyword classifier a strong classification signal.
      autocomplete: autocomplete || undefined,
      required: isAntRequired(wrapper),
      inputType: nativeType,
      pattern:
        input instanceof HTMLInputElement && input.pattern
          ? input.pattern
          : undefined,
      maxLength: input && input.maxLength > 0 ? input.maxLength : undefined,
      minLength: input && input.minLength > 0 ? input.minLength : undefined,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const input = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    );
    if (!input) return false;

    setReactInputValue(input, value);
    return true;
  },
};

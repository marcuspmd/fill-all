/**
 * Custom Select Handler — detects and interacts with custom select components
 * (Ant Design, Material UI, React Select, etc.)
 */

import type { FormField, FieldType } from "@/types";
import type { Detector } from "./detector.interface";

/** Describes a detected custom select component */
export interface CustomSelectField {
  /** The container element of the custom select */
  container: HTMLElement;
  /** The hidden or search input element (if any) */
  inputElement: HTMLInputElement | null;
  /** The framework/library type detected */
  framework: "antd" | "mui" | "react-select" | "generic";
  /** Unique selector for this component */
  selector: string;
  /** Label text associated with the select */
  label?: string;
  /** Field name/id */
  name?: string;
  id?: string;
  /** Whether the field is required */
  required: boolean;
}

interface SelectOption {
  value: string;
  text: string;
  element?: HTMLElement;
}

// -------- Detection --------

const CUSTOM_SELECT_SELECTORS = [
  // Ant Design
  ".ant-select:not(.fill-all-processed)",
  // Material UI
  '.MuiSelect-root:not(.fill-all-processed), [class*="MuiAutocomplete"]:not(.fill-all-processed)',
  // React Select
  '[class*="react-select"]:not(.fill-all-processed), [class$="-container"][class*="css-"]:not(.fill-all-processed)',
  // Generic custom selects
  '[role="combobox"]:not(input):not(.fill-all-processed), [role="listbox"]:not(.fill-all-processed)',
];

export function detectCustomSelects(): CustomSelectField[] {
  const selector = CUSTOM_SELECT_SELECTORS.join(", ");
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const fields: CustomSelectField[] = [];

  for (const el of elements) {
    // Skip invisible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    // Avoid duplicates (nested matching)
    if (el.closest(".fill-all-processed")) continue;

    const field = identifyCustomSelect(el);
    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

/** Detector object — wraps {@link detectCustomSelects} under the common Detector contract. */
export const customSelectDetector: Detector<void, CustomSelectField[]> = {
  name: "custom-select",
  detect: () => detectCustomSelects(),
};

function identifyCustomSelect(el: HTMLElement): CustomSelectField | null {
  // Ant Design Select
  if (el.classList.contains("ant-select")) {
    return createAntdField(el);
  }

  // Material UI Select
  if (
    el.classList.contains("MuiSelect-root") ||
    el.className.includes("MuiAutocomplete")
  ) {
    return createMuiField(el);
  }

  // React Select
  if (
    el.className.includes("react-select") ||
    el.querySelector('[class*="indicatorContainer"]')
  ) {
    return createReactSelectField(el);
  }

  // Generic combobox/listbox
  if (
    el.getAttribute("role") === "combobox" ||
    el.getAttribute("role") === "listbox"
  ) {
    return createGenericField(el);
  }

  return null;
}

function createAntdField(el: HTMLElement): CustomSelectField {
  const input = el.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input",
  );
  const label = findCustomSelectLabel(el, input);

  return {
    container: el,
    inputElement: input,
    framework: "antd",
    selector: getCustomSelectSelector(el),
    label,
    name: input?.name || undefined,
    id: input?.id || undefined,
    required:
      input?.getAttribute("aria-required") === "true" ||
      input?.required ||
      false,
  };
}

function createMuiField(el: HTMLElement): CustomSelectField {
  const input = el.querySelector<HTMLInputElement>("input");
  const label = findCustomSelectLabel(el, input);

  return {
    container: el,
    inputElement: input,
    framework: "mui",
    selector: getCustomSelectSelector(el),
    label,
    name: input?.name || undefined,
    id: input?.id || undefined,
    required: input?.required || false,
  };
}

function createReactSelectField(el: HTMLElement): CustomSelectField {
  const input = el.querySelector<HTMLInputElement>("input");
  const label = findCustomSelectLabel(el, input);

  return {
    container: el,
    inputElement: input,
    framework: "react-select",
    selector: getCustomSelectSelector(el),
    label,
    name: input?.name || undefined,
    id: input?.id || undefined,
    required: input?.required || false,
  };
}

function createGenericField(el: HTMLElement): CustomSelectField {
  const input = el.querySelector<HTMLInputElement>("input");
  const label = findCustomSelectLabel(el, input);

  return {
    container: el,
    inputElement: input,
    framework: "generic",
    selector: getCustomSelectSelector(el),
    label,
    name: input?.name || el.getAttribute("name") || undefined,
    id: input?.id || el.id || undefined,
    required:
      el.getAttribute("aria-required") === "true" || input?.required || false,
  };
}

function findCustomSelectLabel(
  container: HTMLElement,
  input: HTMLInputElement | null,
): string | undefined {
  // 1. Check input's associated label
  if (input?.id) {
    const label = document.querySelector(
      `label[for="${CSS.escape(input.id)}"]`,
    );
    if (label?.textContent) return label.textContent.trim();
  }

  // 2. Check parent form-item label (Ant Design pattern)
  const formItem = container.closest(
    ".ant-form-item, .ant-row, .MuiFormControl-root, [class*='form-group'], [class*='form-item']",
  );
  if (formItem) {
    const label = formItem.querySelector(
      "label, .ant-form-item-label, .MuiFormLabel-root, .MuiInputLabel-root",
    );
    if (label?.textContent) return label.textContent.trim();
  }

  // 3. aria-label
  const ariaLabel =
    container.getAttribute("aria-label") || input?.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // 4. aria-labelledby
  const ariaLabelledBy =
    container.getAttribute("aria-labelledby") ||
    input?.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref?.textContent) return ref.textContent.trim();
  }

  // 5. Placeholder text
  const placeholder = container.querySelector(
    ".ant-select-selection-placeholder, [class*='placeholder']",
  );
  if (placeholder?.textContent) return placeholder.textContent.trim();

  return undefined;
}

function getCustomSelectSelector(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const input = el.querySelector<HTMLInputElement>("input[id]");
  if (input?.id) return `#${CSS.escape(input.id)}`;

  // Build a unique path
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

// -------- Interaction --------

/**
 * Opens a custom select dropdown and returns available options
 */
async function openAndGetOptions(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  switch (field.framework) {
    case "antd":
      return openAntdSelect(field);
    case "mui":
      return openMuiSelect(field);
    case "react-select":
      return openReactSelect(field);
    default:
      return openGenericSelect(field);
  }
}

async function openAntdSelect(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  const selectorEl = field.container.querySelector<HTMLElement>(
    ".ant-select-selector",
  );
  if (selectorEl) {
    // Dispatch the full mouse event sequence Ant Design expects
    selectorEl.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    selectorEl.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    selectorEl.click();
  }

  // Also trigger on the search input for 'showSearch' variant
  if (field.inputElement) {
    field.inputElement.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    field.inputElement.click();
  }

  await waitForDropdown(500);

  // Find dropdown options via aria-controls (most reliable)
  const listboxId =
    field.inputElement?.getAttribute("aria-controls") ||
    field.inputElement?.getAttribute("aria-owns");
  let options: HTMLElement[] = [];

  if (listboxId) {
    const listbox = document.getElementById(listboxId);
    if (listbox) {
      options = Array.from(
        listbox.querySelectorAll<HTMLElement>(
          ".ant-select-item-option:not(.ant-select-item-option-disabled)",
        ),
      );
    }
  }

  // Fallback: find the most recently visible dropdown
  if (options.length === 0) {
    const dropdowns = Array.from(
      document.querySelectorAll<HTMLElement>(".ant-select-dropdown"),
    );
    for (const dropdown of dropdowns) {
      const computed = window.getComputedStyle(dropdown);
      if (computed.display === "none" || computed.visibility === "hidden")
        continue;
      if (dropdown.getAttribute("style")?.includes("display: none")) continue;
      const items = Array.from(
        dropdown.querySelectorAll<HTMLElement>(
          ".ant-select-item-option:not(.ant-select-item-option-disabled)",
        ),
      );
      if (items.length > 0) {
        options = items;
        break;
      }
    }
  }

  return options.map((opt) => ({
    value:
      opt.getAttribute("data-value") ||
      opt.getAttribute("title") ||
      opt.textContent?.trim() ||
      "",
    text: opt.textContent?.trim() || "",
    element: opt,
  }));
}

async function openMuiSelect(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  const trigger =
    field.container.querySelector<HTMLElement>("[role='button']") ||
    field.container;
  trigger.click();

  await waitForDropdown();

  const options = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".MuiMenu-list [role='option'], .MuiAutocomplete-option, .MuiMenuItem-root",
    ),
  );

  return options.map((opt) => ({
    value: opt.getAttribute("data-value") || opt.textContent?.trim() || "",
    text: opt.textContent?.trim() || "",
    element: opt,
  }));
}

async function openReactSelect(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  const control =
    field.container.querySelector<HTMLElement>('[class*="control"]');
  if (control) {
    control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  }

  await waitForDropdown();

  const options = Array.from(
    field.container.querySelectorAll<HTMLElement>('[class*="option"]'),
  );

  // Fallback: check portaled menu
  if (options.length === 0) {
    const portaled = document.querySelectorAll<HTMLElement>(
      '[class*="menu"] [class*="option"]',
    );
    return Array.from(portaled).map((opt) => ({
      value: opt.textContent?.trim() || "",
      text: opt.textContent?.trim() || "",
      element: opt,
    }));
  }

  return options.map((opt) => ({
    value: opt.textContent?.trim() || "",
    text: opt.textContent?.trim() || "",
    element: opt,
  }));
}

async function openGenericSelect(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  field.container.click();
  await waitForDropdown();

  const options = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="option"], [role="listbox"] > *',
    ),
  );

  return options.map((opt) => ({
    value: opt.getAttribute("data-value") || opt.textContent?.trim() || "",
    text: opt.textContent?.trim() || "",
    element: opt,
  }));
}

function waitForDropdown(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Selects an option in a custom select component.
 * If targetValue is provided, tries to match it. Otherwise picks a random option.
 */
export async function selectCustomOption(
  field: CustomSelectField,
  targetValue?: string,
): Promise<string> {
  const options = await openAndGetOptions(field);

  if (options.length === 0) {
    closeDropdown(field);
    return "";
  }

  let selectedOption: SelectOption | undefined;

  if (targetValue) {
    // Exact match first
    selectedOption = options.find(
      (opt) => opt.value.toLowerCase() === targetValue.toLowerCase(),
    );

    // Partial match
    if (!selectedOption) {
      selectedOption = options.find(
        (opt) =>
          opt.text.toLowerCase().includes(targetValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(targetValue.toLowerCase()),
      );
    }
  }

  // Random selection if no targetValue or no match found
  if (!selectedOption) {
    selectedOption = options[Math.floor(Math.random() * options.length)];
  }

  // Click the option element to select it
  if (selectedOption?.element) {
    const optEl = selectedOption.element;
    // Dispatch mousedown first to prevent blur (required by Ant Design / react-select)
    optEl.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    optEl.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    optEl.click();
    await new Promise((resolve) => setTimeout(resolve, 150));
  } else if (field.inputElement && selectedOption) {
    // Fallback: type the value into the search input
    simulateTyping(field.inputElement, selectedOption.text);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Click the first matching option that appears
    const newOptions = await getVisibleOptions(field);
    if (newOptions.length > 0 && newOptions[0].element) {
      newOptions[0].element.click();
    }
  }

  closeDropdown(field);
  return selectedOption?.text || "";
}

function simulateTyping(input: HTMLInputElement, text: string): void {
  input.focus();

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(input, text);
  } else {
    input.value = text;
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function getVisibleOptions(
  field: CustomSelectField,
): Promise<SelectOption[]> {
  switch (field.framework) {
    case "antd": {
      const listboxId = field.inputElement?.getAttribute("aria-controls");
      if (listboxId) {
        const listbox = document.getElementById(listboxId);
        if (listbox) {
          return Array.from(
            listbox.querySelectorAll<HTMLElement>(".ant-select-item-option"),
          ).map((opt) => ({
            value: opt.getAttribute("title") || opt.textContent?.trim() || "",
            text: opt.textContent?.trim() || "",
            element: opt,
          }));
        }
      }
      return [];
    }
    default:
      return [];
  }
}

function closeDropdown(field: CustomSelectField): void {
  // Press Escape to close any open dropdown
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );

  // Also click outside to close
  document.body.click();
}

/**
 * Gets the currently selected value of a custom select
 */
export function getCustomSelectValue(field: CustomSelectField): string {
  switch (field.framework) {
    case "antd": {
      const selected = field.container.querySelector(
        ".ant-select-selection-item",
      );
      return selected?.textContent?.trim() || "";
    }
    case "mui": {
      const selected = field.container.querySelector(
        ".MuiSelect-select, .MuiAutocomplete-input",
      );
      return (
        (selected as HTMLInputElement)?.value ||
        selected?.textContent?.trim() ||
        ""
      );
    }
    case "react-select": {
      const selected = field.container.querySelector(
        '[class*="singleValue"], [class*="multiValue"]',
      );
      return selected?.textContent?.trim() || "";
    }
    default: {
      const selected = field.container.querySelector('[aria-selected="true"]');
      return selected?.textContent?.trim() || "";
    }
  }
}

/**
 * Converts a CustomSelectField to a FormField for compatibility
 */
export function customSelectToFormField(field: CustomSelectField): FormField {
  const fakeElement = (field.inputElement ||
    document.createElement("input")) as HTMLInputElement;

  return {
    element: fakeElement,
    selector: field.selector,
    fieldType: "select" as FieldType,
    label: field.label,
    name: field.name,
    id: field.id,
    placeholder: undefined,
    autocomplete: undefined,
    required: field.required,
  };
}

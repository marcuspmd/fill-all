/**
 * Ant Design Shared Utilities
 *
 * Helpers shared across all Ant Design component adapters:
 *   - Label extraction from `.ant-form-item-label`
 *   - Event dispatching that React picks up
 *   - Placeholder extraction
 */

import { getUniqueSelector, findLabelWithStrategy } from "../../extractors";

/**
 * Extracts the label text from the nearest `.ant-form-item` wrapper.
 * Falls back to the standard label extractor.
 */
export function findAntLabel(wrapper: HTMLElement): string | undefined {
  const formItem = wrapper.closest(".ant-form-item");
  if (formItem) {
    const labelEl = formItem.querySelector<HTMLElement>(
      ".ant-form-item-label label",
    );
    if (labelEl?.textContent?.trim()) {
      return labelEl.textContent.trim();
    }
  }
  // Fallback to standard label extraction
  const result = findLabelWithStrategy(wrapper);
  return result?.text;
}

/**
 * Extracts the id from Ant Design's form item.
 * Antd assigns id to the inner control based on `name` prop.
 */
export function findAntId(wrapper: HTMLElement): string | undefined {
  const input = wrapper.querySelector<HTMLElement>(
    "input, textarea, [role='combobox'], [role='listbox']",
  );
  return input?.id || wrapper.id || undefined;
}

/**
 * Extracts the name from Ant Design's inner control.
 */
export function findAntName(wrapper: HTMLElement): string | undefined {
  const input = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    "input, textarea",
  );
  return input?.name || undefined;
}

/**
 * Checks if the component is required by looking for the asterisk in the form item.
 */
export function isAntRequired(wrapper: HTMLElement): boolean {
  const formItem = wrapper.closest(".ant-form-item");
  if (formItem) {
    return formItem.querySelector(".ant-form-item-required") !== null;
  }
  return false;
}

/**
 * Dispatches React-compatible input events.
 * Antd uses React synthetic events — we need to set the value via
 * the native setter and dispatch properly.
 */
export function setReactInputValue(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (input instanceof HTMLInputElement && nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else if (
    input instanceof HTMLTextAreaElement &&
    nativeTextAreaValueSetter
  ) {
    nativeTextAreaValueSetter.call(input, value);
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Simulates a mouse click on an element (used to open dropdowns).
 */
export function simulateClick(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

/**
 * Waits for an element matching the selector to appear in the DOM.
 * Returns `null` if the element doesn't appear within the timeout.
 */
export function waitForElement(
  selector: string,
  timeoutMs = 500,
): Promise<HTMLElement | null> {
  const existing = document.querySelector<HTMLElement>(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

export { getUniqueSelector };

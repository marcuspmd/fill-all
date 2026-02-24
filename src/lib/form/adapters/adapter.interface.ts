/**
 * Custom Component Adapter Interface
 *
 * Contract for adapters that detect and fill non-native form components
 * (e.g. Select2, Ant Design, Material UI).
 *
 * Adapters handle three concerns:
 *   1. **Detection** — find custom component wrappers on the page
 *   2. **Field building** — convert a wrapper element into a FormField stub
 *   3. **Filling** — apply a value using the component's own API/events
 *
 * Classification (FieldType) is NOT the adapter's job — it goes through
 * the standard DetectionPipeline after field building.
 *
 * Usage:
 *   const adapter: CustomComponentAdapter = { ... };
 *   const wrappers = adapter.detect();
 *   const fields = wrappers.map(adapter.buildField);
 *   // fields are classified by the pipeline, then filled:
 *   adapter.fill(wrapper, "some value");
 */

import type { FormField } from "@/types";

/** Identifies which adapter produced a given FormField. */
export type AdapterName =
  | "select2"
  | "antd-select"
  | "antd-input"
  | "antd-datepicker"
  | "antd-cascader"
  | "antd-radio"
  | "antd-checkbox"
  | "antd-switch"
  | "antd-slider"
  | "antd-rate"
  | "antd-transfer"
  | "antd-tree-select"
  | "antd-auto-complete"
  | "antd-mentions"
  | "antd-input-number"
  | "antd-time-picker";

export interface CustomComponentAdapter {
  /** Unique adapter name — stored in FormField.adapterName for fill-time lookup. */
  readonly name: AdapterName;

  /**
   * CSS selector that matches the component's root/wrapper element.
   * Used by the adapter registry to batch-query the DOM.
   */
  readonly selector: string;

  /**
   * Checks whether a DOM element actually belongs to this adapter.
   * Called after querySelectorAll(selector) to filter false positives.
   * Return `true` to claim the element for this adapter.
   */
  matches(element: HTMLElement): boolean;

  /**
   * Converts a matched wrapper element into a FormField stub.
   * Must set: element, selector, category, fieldType (as "unknown"),
   * and any relevant DOM metadata (label, options, placeholder, etc.).
   *
   * Classification is done downstream by the DetectionPipeline.
   */
  buildField(wrapper: HTMLElement): FormField;

  /**
   * Applies a value to the custom component.
   * Must trigger the component's own change events so frameworks (React, Vue, etc.)
   * pick up the change.
   *
   * Returns `true` if the value was successfully applied, `false` otherwise.
   * May be async for components that need to wait for dropdowns/panels to render.
   */
  fill(wrapper: HTMLElement, value: string): boolean | Promise<boolean>;
}

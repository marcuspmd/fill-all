/**
 * Ant Design Slider Adapter
 *
 * Detects and fills `<Slider>` components.
 *
 * DOM structure (antd v5):
 *   <div class="ant-slider ...">
 *     <div class="ant-slider-rail"></div>
 *     <div class="ant-slider-track" style="left: 0%; width: N%"></div>
 *     <div class="ant-slider-step"></div>
 *     <div class="ant-slider-handle" role="slider"
 *          aria-valuenow="N" aria-valuemin="0" aria-valuemax="100"
 *          tabindex="0" style="left: N%"></div>
 *   </div>
 *
 * Filling: Sets the slider handle position via ARIA attributes and dispatches events.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  isAntRequired,
  getUniqueSelector,
} from "./antd-utils";
import { buildSignals } from "../../extractors";

export const antdSliderAdapter: CustomComponentAdapter = {
  name: "antd-slider",
  selector: ".ant-slider",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-slider") &&
      !el.classList.contains("ant-slider-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle");
    const min = handle?.getAttribute("aria-valuemin") ?? "0";
    const max = handle?.getAttribute("aria-valuemax") ?? "100";

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "number",
      adapterName: "antd-slider",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      placeholder: `${min}–${max}`,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle");
    if (!handle) return false;

    const min = parseFloat(handle.getAttribute("aria-valuemin") ?? "0");
    const max = parseFloat(handle.getAttribute("aria-valuemax") ?? "100");

    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      // Generate a random value within the range
      numericValue = min + Math.random() * (max - min);
    }

    // Clamp to range
    numericValue = Math.max(min, Math.min(max, numericValue));

    // Calculate percentage position
    const percent = ((numericValue - min) / (max - min)) * 100;

    // Update the handle
    handle.setAttribute("aria-valuenow", String(Math.round(numericValue)));
    handle.style.left = `${percent}%`;

    // Update the track
    const track = wrapper.querySelector<HTMLElement>(".ant-slider-track");
    if (track) {
      track.style.width = `${percent}%`;
    }

    // Simulate mouse events to trigger React state updates
    const rect = wrapper.getBoundingClientRect();
    const clientX = rect.left + (rect.width * percent) / 100;
    const clientY = rect.top + rect.height / 2;

    handle.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, clientX, clientY }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX, clientY }),
    );
    document.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, clientX, clientY }),
    );

    return true;
  },
};

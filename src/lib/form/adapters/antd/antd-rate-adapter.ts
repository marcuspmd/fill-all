/**
 * Ant Design Rate Adapter
 *
 * Detects and fills `<Rate>` components (star rating).
 *
 * DOM structure (antd v5):
 *   <ul class="ant-rate ..." role="radiogroup">
 *     <li class="ant-rate-star ant-rate-star-zero|half|full">
 *       <div role="radio" aria-checked="..." aria-posinset="N" tabindex="0">
 *         <div class="ant-rate-star-first"><span class="anticon ...">☆</span></div>
 *         <div class="ant-rate-star-second"><span class="anticon ...">★</span></div>
 *       </div>
 *     </li>
 *     ...
 *   </ul>
 *
 * Filling: Clicks the N-th star (0-indexed) via `.ant-rate-star-second`.
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

export const antdRateAdapter: CustomComponentAdapter = {
  name: "antd-rate",
  selector: "ul.ant-rate",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("ant-rate") &&
      !el.classList.contains("ant-rate-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    const total = wrapper.querySelectorAll(".ant-rate-star").length;

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: "number",
      adapterName: "antd-rate",
      label: findAntLabel(wrapper),
      id: findAntId(wrapper),
      required: isAntRequired(wrapper),
      placeholder: `1–${total}`,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  fill(wrapper: HTMLElement, value: string): boolean {
    const stars = wrapper.querySelectorAll<HTMLElement>(".ant-rate-star");
    if (stars.length === 0) return false;

    let target = parseInt(value, 10);
    if (isNaN(target) || target < 1) {
      // Random value between 3 and total
      target = Math.max(3, Math.floor(Math.random() * stars.length) + 1);
    }

    // Clamp to range
    target = Math.min(target, stars.length);

    // Click the target star (1-indexed → 0-indexed)
    const star = stars[target - 1];
    const clickTarget = star.querySelector<HTMLElement>(
      ".ant-rate-star-second",
    );
    if (clickTarget) {
      simulateClick(clickTarget);
      return true;
    }

    simulateClick(star);
    return true;
  },
};

/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";

import {
  labelForStrategy,
  parentLabelStrategy,
  ariaLabelStrategy,
  ariaLabelledByStrategy,
  prevLabelStrategy,
  titleStrategy,
  fieldsetLegendStrategy,
  formGroupLabelStrategy,
  prevSiblingTextStrategy,
  placeholderStrategy,
} from "../index";

describe("Extractors Strategies", () => {
  it("should return null for empty element", () => {
    const el = document.createElement("input");
    el.id = "test";
    document.body.appendChild(el);

    expect(labelForStrategy.find(el)).toBeNull();
    expect(parentLabelStrategy.find(el)).toBeNull();
    expect(ariaLabelStrategy.find(el)).toBeNull();
    expect(ariaLabelledByStrategy.find(el)).toBeNull();
    expect(prevLabelStrategy.find(el)).toBeNull();
    expect(titleStrategy.find(el)).toBeNull();
    expect(fieldsetLegendStrategy.find(el)).toBeNull();
    expect(formGroupLabelStrategy.find(el)).toBeNull();
    expect(prevSiblingTextStrategy.find(el)).toBeNull();
    expect(placeholderStrategy.find(el)).toBeNull();

    document.body.removeChild(el);
  });
});

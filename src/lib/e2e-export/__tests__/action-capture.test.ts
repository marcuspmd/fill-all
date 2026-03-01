// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { buildCapturedActions } from "@/lib/e2e-export/action-capture";
import type { FormField, GenerationResult } from "@/types";

function makeField(
  overrides: Partial<FormField> & { selector: string },
): FormField {
  return {
    element: document.createElement("input"),
    fieldType: "text",
    category: "text",
    required: false,
    ...overrides,
  } as FormField;
}

function makeResult(fieldSelector: string, value: string): GenerationResult {
  return { fieldSelector, value, source: "generator" };
}

describe("buildCapturedActions", () => {
  it("maps results to actions with correct selectors and values", () => {
    const fields = [
      makeField({ selector: "#name", label: "Nome" }),
      makeField({ selector: "#email", label: "E-mail" }),
    ];
    const results = [
      makeResult("#name", "John"),
      makeResult("#email", "john@example.com"),
    ];

    const actions = buildCapturedActions(fields, results);

    expect(actions).toHaveLength(2);
    expect(actions[0].selector).toBe("#name");
    expect(actions[0].value).toBe("John");
    expect(actions[0].label).toBe("Nome");
    expect(actions[0].actionType).toBe("fill");
    expect(actions[1].selector).toBe("#email");
    expect(actions[1].value).toBe("john@example.com");
  });

  it("skips results that have no matching field", () => {
    const fields = [makeField({ selector: "#name" })];
    const results = [
      makeResult("#name", "John"),
      makeResult("#missing", "value"),
    ];

    const actions = buildCapturedActions(fields, results);

    expect(actions).toHaveLength(1);
    expect(actions[0].selector).toBe("#name");
  });

  it("returns empty array when no results provided", () => {
    const fields = [makeField({ selector: "#name" })];
    const actions = buildCapturedActions(fields, []);

    expect(actions).toEqual([]);
  });

  it("detects select action type for HTMLSelectElement", () => {
    const selectEl = document.createElement("select");
    const field = {
      ...makeField({ selector: "#country" }),
      element: selectEl,
    } as FormField;
    const results = [makeResult("#country", "BR")];

    const actions = buildCapturedActions([field], results);

    expect(actions[0].actionType).toBe("select");
  });

  it("detects check/uncheck for checkboxes", () => {
    const checkedBox = document.createElement("input");
    checkedBox.type = "checkbox";
    checkedBox.checked = true;

    const uncheckedBox = document.createElement("input");
    uncheckedBox.type = "checkbox";
    uncheckedBox.checked = false;

    const fields = [
      {
        ...makeField({ selector: "#agree" }),
        element: checkedBox,
      } as FormField,
      {
        ...makeField({ selector: "#opt-out" }),
        element: uncheckedBox,
      } as FormField,
    ];
    const results = [makeResult("#agree", "on"), makeResult("#opt-out", "")];

    const actions = buildCapturedActions(fields, results);

    expect(actions[0].actionType).toBe("check");
    expect(actions[1].actionType).toBe("uncheck");
  });

  it("detects radio action type", () => {
    const radioEl = document.createElement("input");
    radioEl.type = "radio";

    const field = {
      ...makeField({ selector: "#gender-male" }),
      element: radioEl,
    } as FormField;
    const results = [makeResult("#gender-male", "male")];

    const actions = buildCapturedActions([field], results);

    expect(actions[0].actionType).toBe("radio");
  });

  it("resolves label from name or id when label is missing", () => {
    const field1 = makeField({
      selector: "#f1",
      label: undefined,
      name: "user_name",
      id: "f1",
    });
    const field2 = makeField({
      selector: "#f2",
      label: undefined,
      name: undefined,
      id: "f2",
    });
    const field3 = makeField({
      selector: ".f3",
      label: undefined,
      name: undefined,
      id: undefined,
    });

    const results = [
      makeResult("#f1", "a"),
      makeResult("#f2", "b"),
      makeResult(".f3", "c"),
    ];

    const actions = buildCapturedActions([field1, field2, field3], results);

    expect(actions[0].label).toBe("user_name");
    expect(actions[1].label).toBe("f2");
    expect(actions[2].label).toBeUndefined();
  });

  it("includes fieldType from the detected field", () => {
    const field = makeField({ selector: "#cpf", fieldType: "cpf" });
    const results = [makeResult("#cpf", "123.456.789-00")];

    const actions = buildCapturedActions([field], results);

    expect(actions[0].fieldType).toBe("cpf");
  });
});

// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  INPUT_SELECTOR,
  CUSTOM_SELECT_ANCESTOR,
  isVisible,
  isNotCustomSelect,
  buildNativeField,
} from "../native-input-config";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRect(el: HTMLElement, width: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

// ── INPUT_SELECTOR ────────────────────────────────────────────────────────────

describe("INPUT_SELECTOR", () => {
  it("is a non-empty string", () => {
    expect(INPUT_SELECTOR).toBeTruthy();
    expect(typeof INPUT_SELECTOR).toBe("string");
  });
});

// ── CUSTOM_SELECT_ANCESTOR ────────────────────────────────────────────────────

describe("CUSTOM_SELECT_ANCESTOR", () => {
  it("is a non-empty string", () => {
    expect(CUSTOM_SELECT_ANCESTOR).toBeTruthy();
  });
});

// ── isVisible ─────────────────────────────────────────────────────────────────

describe("isVisible", () => {
  it("returns true when width > 0", () => {
    const el = document.createElement("input");
    mockRect(el, 100, 0);
    expect(isVisible(el)).toBe(true);
  });

  it("returns true when height > 0", () => {
    const el = document.createElement("input");
    mockRect(el, 0, 50);
    expect(isVisible(el)).toBe(true);
  });

  it("returns false when both width and height are 0", () => {
    const el = document.createElement("input");
    mockRect(el, 0, 0);
    expect(isVisible(el)).toBe(false);
  });
});

// ── isNotCustomSelect ─────────────────────────────────────────────────────────

describe("isNotCustomSelect", () => {
  it("returns true for input not inside custom component", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    expect(isNotCustomSelect(el)).toBe(true);
    el.remove();
  });

  it("returns false for input inside .ant-select", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select";
    const el = document.createElement("input");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    expect(isNotCustomSelect(el)).toBe(false);
    wrapper.remove();
  });

  it("returns false for input inside .ant-picker", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-picker";
    const el = document.createElement("input");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    expect(isNotCustomSelect(el)).toBe(false);
    wrapper.remove();
  });
});

// ── buildNativeField ──────────────────────────────────────────────────────────

describe("buildNativeField", () => {
  it("extracts inputType for HTMLInputElement", () => {
    const el = document.createElement("input");
    el.type = "text";
    el.name = "username";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.inputType).toBe("text");
    expect(field.name).toBe("username");
    el.remove();
  });

  it("inputType is undefined for HTMLSelectElement", () => {
    const el = document.createElement("select");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.inputType).toBeUndefined();
    el.remove();
  });

  it("inputType is undefined for HTMLTextAreaElement", () => {
    const el = document.createElement("textarea");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.inputType).toBeUndefined();
    el.remove();
  });

  it("extracts pattern from input with pattern", () => {
    const el = document.createElement("input");
    el.pattern = "[0-9]{5}";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.pattern).toBe("[0-9]{5}");
    el.remove();
  });

  it("pattern is undefined when input has no pattern", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.pattern).toBeUndefined();
    el.remove();
  });

  it("pattern is undefined for non-input elements", () => {
    const el = document.createElement("textarea");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.pattern).toBeUndefined();
    el.remove();
  });

  it("extracts maxLength when > 0 from input", () => {
    const el = document.createElement("input");
    el.maxLength = 100;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.maxLength).toBe(100);
    el.remove();
  });

  it("extracts maxLength when > 0 from textarea", () => {
    const el = document.createElement("textarea");
    el.maxLength = 500;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.maxLength).toBe(500);
    el.remove();
  });

  it("maxLength is undefined when not set (defaults to -1)", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.maxLength).toBeUndefined();
    el.remove();
  });

  it("maxLength is undefined for select element", () => {
    const el = document.createElement("select");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.maxLength).toBeUndefined();
    el.remove();
  });

  it("extracts minLength when > 0 from input", () => {
    const el = document.createElement("input");
    el.minLength = 5;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.minLength).toBe(5);
    el.remove();
  });

  it("extracts minLength when > 0 from textarea", () => {
    const el = document.createElement("textarea");
    el.minLength = 10;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.minLength).toBe(10);
    el.remove();
  });

  it("minLength is undefined when not set", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.minLength).toBeUndefined();
    el.remove();
  });

  it("extracts options from select element", () => {
    const el = document.createElement("select");
    const opt1 = document.createElement("option");
    opt1.value = "";
    opt1.text = "-- Select --";
    const opt2 = document.createElement("option");
    opt2.value = "br";
    opt2.text = "Brazil";
    const opt3 = document.createElement("option");
    opt3.value = "us";
    opt3.text = "USA";
    el.appendChild(opt1);
    el.appendChild(opt2);
    el.appendChild(opt3);
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.options).toEqual([
      { value: "br", text: "Brazil" },
      { value: "us", text: "USA" },
    ]);
    el.remove();
  });

  it("options is undefined for input element", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.options).toBeUndefined();
    el.remove();
  });

  it("extracts checkbox metadata for checkbox input", () => {
    const el = document.createElement("input");
    el.type = "checkbox";
    el.value = "agree";
    el.checked = true;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.checkboxValue).toBe("agree");
    expect(field.checkboxChecked).toBe(true);
    el.remove();
  });

  it("extracts radio metadata for radio input", () => {
    const el = document.createElement("input");
    el.type = "radio";
    el.value = "male";
    el.checked = false;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.checkboxValue).toBe("male");
    expect(field.checkboxChecked).toBe(false);
    el.remove();
  });

  it("checkboxValue is undefined when checkbox has no value", () => {
    const el = document.createElement("input");
    el.type = "checkbox";
    el.value = "";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.checkboxValue).toBeUndefined();
    el.remove();
  });

  it("checkbox fields are undefined for non-checkable inputs", () => {
    const el = document.createElement("input");
    el.type = "text";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.checkboxValue).toBeUndefined();
    expect(field.checkboxChecked).toBeUndefined();
    el.remove();
  });

  it("extracts placeholder from input", () => {
    const el = document.createElement("input");
    el.placeholder = "Enter your name";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.placeholder).toBe("Enter your name");
    el.remove();
  });

  it("placeholder is undefined when empty", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.placeholder).toBeUndefined();
    el.remove();
  });

  it("extracts id and sets it", () => {
    const el = document.createElement("input");
    el.id = "myField";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.id).toBe("myField");
    el.remove();
  });

  it("id is undefined when element has no id", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.id).toBeUndefined();
    el.remove();
  });

  it("name is undefined when element has no name", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.name).toBeUndefined();
    el.remove();
  });

  it("autocomplete is undefined when not set", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.autocomplete).toBeUndefined();
    el.remove();
  });

  it("extracts autocomplete when set", () => {
    const el = document.createElement("input");
    el.autocomplete = "email";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.autocomplete).toBe("email");
    el.remove();
  });

  it("extracts required flag", () => {
    const el = document.createElement("input");
    el.required = true;
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.required).toBe(true);
    el.remove();
  });

  it("sets category and fieldType as unknown", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.category).toBe("unknown");
    expect(field.fieldType).toBe("unknown");
    el.remove();
  });

  it("generates contextSignals", () => {
    const el = document.createElement("input");
    el.name = "email";
    el.placeholder = "Enter email";
    document.body.appendChild(el);
    const field = buildNativeField(el);
    expect(field.contextSignals).toBeTruthy();
    el.remove();
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildCapturedActions,
  detectSubmitActions,
} from "@/lib/e2e-export/action-capture";
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

  it("detects submit action type for input[type=submit]", () => {
    const inputSubmit = document.createElement("input");
    inputSubmit.type = "submit";

    const field = {
      ...makeField({ selector: "#sub" }),
      element: inputSubmit,
    } as FormField;
    const results = [makeResult("#sub", "")];

    const actions = buildCapturedActions([field], results);

    expect(actions[0].actionType).toBe("submit");
  });

  it("detects submit action type for button[type=submit]", () => {
    const btnSubmit = document.createElement("button");
    btnSubmit.type = "submit";

    const field = {
      ...makeField({ selector: "#btn" }),
      element: btnSubmit,
    } as FormField;
    const results = [makeResult("#btn", "")];

    const actions = buildCapturedActions([field], results);

    expect(actions[0].actionType).toBe("submit");
  });
});

describe("detectSubmitActions", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty array when no submit elements exist", () => {
    document.body.innerHTML = "<form><input type='text' /></form>";
    expect(detectSubmitActions()).toEqual([]);
  });

  it("detects explicit button[type=submit]", () => {
    document.body.innerHTML =
      "<form><button id='btn-send' type='submit'>Enviar</button></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].actionType).toBe("click");
    expect(actions[0].label).toBe("Enviar");
    expect(actions[0].selector).toBe("#btn-send");
  });

  it("detects input[type=submit] with value as label", () => {
    document.body.innerHTML =
      "<form><input id='sub' type='submit' value='Cadastrar' /></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Cadastrar");
    expect(actions[0].selector).toBe("#sub");
  });

  it("detects input[type=submit] with fallback label when value is empty", () => {
    document.body.innerHTML =
      "<form><input type='submit' name='go' value='' /></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Submit");
  });

  it("detects button without explicit type inside form with submit keyword", () => {
    document.body.innerHTML = "<form><button>Login</button></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Login");
  });

  it("captures button without type when no submit keyword (default submit behavior)", () => {
    document.body.innerHTML = "<form><button>Click me</button></form>";
    const actions = detectSubmitActions();
    // Buttons with no type attribute inside forms should be captured
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Click me");
  });

  it("does not duplicate button with both explicit type=submit and inside form", () => {
    document.body.innerHTML =
      "<form><button id='s' type='submit'>Salvar</button></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].selector).toBe("#s");
  });

  it("sets selector to tag when element has no id, testid, name, or type", () => {
    document.body.innerHTML = "<form><button>Criar</button></form>";
    const actions = detectSubmitActions();
    expect(actions[0].selector).toBe("button");
  });

  it("sets selector to [data-testid] when present", () => {
    document.body.innerHTML =
      "<form><button data-testid='sub-btn' type='submit'>Submit</button></form>";
    const actions = detectSubmitActions();
    expect(actions[0].selector).toBe('[data-testid="sub-btn"]');
  });

  it("uses [name] selector when element has name but no id", () => {
    document.body.innerHTML =
      "<form><button name='submit-form' type='submit'>Go</button></form>";
    const actions = detectSubmitActions();
    expect(actions[0].selector).toBe('button[name="submit-form"]');
  });

  it("falls back to 'Submit' label when button[type=submit] has empty text content", () => {
    // Covers binary-expr fallback on el.textContent?.trim() || "Submit" for non-input elements
    document.body.innerHTML =
      "<form><button id='btn-empty' type='submit'></button></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Submit");
  });

  it("falls back to 'Submit' label when form button without type has empty text content", () => {
    // Covers binary-expr fallback on btn.textContent?.trim() || "Submit" in form loop
    document.body.innerHTML =
      "<form><button id='btn-no-label'></button></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("Submit");
  });

  it("uses [type] selector when element has type attribute but no id, testid, or name", () => {
    // Covers the `if (type) return` branch in buildQuickSelector
    document.body.innerHTML = "<form><input type='submit' value='Go' /></form>";
    const actions = detectSubmitActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].selector).toBe('input[type="submit"]');
  });
});

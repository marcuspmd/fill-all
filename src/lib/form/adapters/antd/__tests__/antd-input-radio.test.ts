/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { antdInputAdapter } from "../antd-input-adapter";
import { antdRadioAdapter } from "../antd-radio-adapter";

vi.mock("../../extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => `#${el.id || "el"}`),
  buildSignals: vi.fn(() => "mock signals"),
  findLabelWithStrategy: vi.fn(() => null),
}));

beforeEach(() => {
  document.body.innerHTML = "";
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAffixWrapper(
  type = "text",
  opts: {
    disabled?: boolean;
    placeholder?: string;
    name?: string;
    id?: string;
  } = {},
) {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-input-affix-wrapper";
  if (opts.disabled) wrapper.classList.add("ant-input-disabled");

  const input = document.createElement("input");
  input.type = type;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.name) input.name = opts.name;
  if (opts.id) input.id = opts.id;

  wrapper.appendChild(input);
  return { wrapper, input };
}

function makeInputNumber(disabled = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-input-number";
  if (disabled) wrapper.classList.add("ant-input-number-disabled");

  const input = document.createElement("input");
  input.type = "number";
  wrapper.appendChild(input);
  return { wrapper, input };
}

function makeRadioGroup(
  options: Array<{ value: string; text: string; checked?: boolean }>,
  buttonStyle = false,
) {
  const group = document.createElement("div");
  group.className = "ant-radio-group";

  for (const opt of options) {
    const label = document.createElement("label");
    const baseClass = buttonStyle
      ? "ant-radio-button-wrapper"
      : "ant-radio-wrapper";
    label.className = `${baseClass}${opt.checked ? ` ${baseClass}-checked` : ""}`;

    const span = document.createElement("span");
    const innerClass = buttonStyle ? "ant-radio-button" : "ant-radio";
    span.className = innerClass;

    const input = document.createElement("input");
    input.type = "radio";
    input.value = opt.value;

    span.appendChild(input);
    const textSpan = document.createElement("span");
    textSpan.textContent = opt.text;
    label.appendChild(span);
    label.appendChild(textSpan);
    group.appendChild(label);
  }

  return group;
}

// ─── Input Adapter ──────────────────────────────────────────────────────────

describe("antdInputAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdInputAdapter.name).toBe("antd-input");
    expect(antdInputAdapter.selector).toContain("ant-input-affix-wrapper");
    expect(antdInputAdapter.selector).toContain("ant-input-number");
    expect(antdInputAdapter.selector).toContain("ant-mentions");
  });

  it("matches retorna true para .ant-input-affix-wrapper", () => {
    const { wrapper } = makeAffixWrapper();
    expect(antdInputAdapter.matches(wrapper)).toBe(true);
  });

  it("matches retorna true para .ant-input-number", () => {
    const { wrapper } = makeInputNumber();
    expect(antdInputAdapter.matches(wrapper)).toBe(true);
  });

  it("matches retorna false para .ant-input-disabled", () => {
    const { wrapper } = makeAffixWrapper("text", { disabled: true });
    expect(antdInputAdapter.matches(wrapper)).toBe(false);
  });

  it("matches retorna false para .ant-input-number-disabled", () => {
    const { wrapper } = makeInputNumber(true);
    expect(antdInputAdapter.matches(wrapper)).toBe(false);
  });

  it("matches retorna false para elemento sem classes corretas", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(antdInputAdapter.matches(el)).toBe(false);
  });

  it("matches retorna true para .ant-mentions", () => {
    const el = document.createElement("div");
    el.className = "ant-mentions";
    expect(antdInputAdapter.matches(el)).toBe(true);
  });

  it("buildField extrai placeholder do input", () => {
    const { wrapper } = makeAffixWrapper("text", {
      placeholder: "Digite aqui",
    });
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.placeholder).toBe("Digite aqui");
    expect(field.adapterName).toBe("antd-input");
    expect(field.fieldType).toBe("unknown");
  });

  it("buildField retorna fieldType 'number' para .ant-input-number", () => {
    const { wrapper } = makeInputNumber();
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("number");
    expect(field.adapterName).toBe("antd-input");
  });

  it("buildField extrai name, id e inputType", () => {
    const { wrapper } = makeAffixWrapper("email", {
      name: "email",
      id: "email-field",
    });
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.name).toBe("email");
    expect(field.id).toBe("email-field");
    expect(field.inputType).toBe("email");
    expect(field.fieldType).toBe("email");
  });

  it("buildField retorna fieldType 'website' para type='url'", () => {
    const { wrapper } = makeAffixWrapper("url", {
      placeholder: "https://www.empresa.com.br",
    });
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("website");
    expect(field.inputType).toBe("url");
  });

  it("buildField retorna fieldType 'website' para autocomplete='url'", () => {
    const { wrapper, input } = makeAffixWrapper("text", {
      placeholder: "https://www.empresa.com.br",
    });
    input.setAttribute("autocomplete", "url");
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    // autocomplete é preservado para os classificadores downstream (TF.js / keyword)
    expect(field.autocomplete).toBe("url");
    // fieldType fica unknown para que o pipeline classifique corretamente
    expect(field.fieldType).toBe("unknown");
  });

  it("buildField retorna fieldType 'phone' para type='tel'", () => {
    const { wrapper } = makeAffixWrapper("tel");
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("phone");
  });

  it("buildField retorna fieldType 'password' para type='password'", () => {
    const { wrapper } = makeAffixWrapper("password");
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("password");
  });

  it("buildField retorna fieldType 'date' para type='date'", () => {
    const { wrapper } = makeAffixWrapper("date");
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("date");
  });

  it.each([
    ["organization", "company"],
    ["name", "full-name"],
    ["given-name", "first-name"],
    ["family-name", "last-name"],
    ["username", "username"],
    ["postal-code", "cep"],
    ["country", "country"],
    ["address-level1", "state"],
    ["address-level2", "city"],
    ["street-address", "street"],
    ["cc-number", "credit-card-number"],
    ["cc-exp", "credit-card-expiration"],
    ["cc-csc", "credit-card-cvv"],
    ["bday", "birth-date"],
    ["current-password", "password"],
    ["new-password", "password"],
  ] as [string, string][])(
    "buildField preserva autocomplete='%s' no campo para classificadores downstream",
    (ac) => {
      const { wrapper, input } = makeAffixWrapper("text");
      input.setAttribute("autocomplete", ac);
      document.body.appendChild(wrapper);

      const field = antdInputAdapter.buildField(wrapper);
      expect(field.autocomplete).toBe(ac);
      // fieldType é "unknown" — deixado para TF.js / keyword classifier
      expect(field.fieldType).toBe("unknown");

      wrapper.remove();
    },
  );

  it("buildField extrai pattern e maxLength do input", () => {
    const { wrapper, input } = makeAffixWrapper("text");
    input.pattern = "[0-9]+";
    input.maxLength = 10;
    input.minLength = 2;
    document.body.appendChild(wrapper);

    const field = antdInputAdapter.buildField(wrapper);
    expect(field.pattern).toBe("[0-9]+");
    expect(field.maxLength).toBe(10);
    expect(field.minLength).toBe(2);
  });

  it("fill define valor no input interno", () => {
    const { wrapper, input } = makeAffixWrapper();
    document.body.appendChild(wrapper);

    const inputEvent = vi.fn();
    input.addEventListener("input", inputEvent);

    const result = antdInputAdapter.fill(wrapper, "teste valor");
    expect(result).toBe(true);
    expect(inputEvent).toHaveBeenCalled();
  });

  it("fill define valor em textarea dentro do wrapper", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-input-affix-wrapper";
    const textarea = document.createElement("textarea");
    wrapper.appendChild(textarea);
    document.body.appendChild(wrapper);

    const inputEvent = vi.fn();
    textarea.addEventListener("input", inputEvent);

    const result = antdInputAdapter.fill(wrapper, "texto longo");
    expect(result).toBe(true);
    expect(inputEvent).toHaveBeenCalled();
  });

  it("fill retorna false quando não há input ou textarea", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-input-affix-wrapper";
    document.body.appendChild(wrapper);

    const result = antdInputAdapter.fill(wrapper, "valor");
    expect(result).toBe(false);
  });
});

// ─── Radio Adapter ───────────────────────────────────────────────────────────

describe("antdRadioAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdRadioAdapter.name).toBe("antd-radio");
    expect(antdRadioAdapter.selector).toBe(".ant-radio-group");
  });

  it("matches retorna true para .ant-radio-group", () => {
    const el = document.createElement("div");
    el.className = "ant-radio-group";
    expect(antdRadioAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para outro elemento", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(antdRadioAdapter.matches(el)).toBe(false);
  });

  it("buildField cria campo do tipo radio com opções", () => {
    const group = makeRadioGroup([
      { value: "m", text: "Masculino" },
      { value: "f", text: "Feminino" },
    ]);
    document.body.appendChild(group);

    const field = antdRadioAdapter.buildField(group);
    expect(field.fieldType).toBe("radio");
    expect(field.adapterName).toBe("antd-radio");
    expect(field.options).toHaveLength(2);
    expect(field.options![0].value).toBe("m");
    expect(field.options![1].text).toBe("Feminino");
  });

  it("buildField retorna options undefined quando não há opções", () => {
    const group = document.createElement("div");
    group.className = "ant-radio-group";
    document.body.appendChild(group);

    const field = antdRadioAdapter.buildField(group);
    expect(field.options).toBeUndefined();
  });

  it("fill por value: clica na opção com radio.value correspondente", () => {
    const group = makeRadioGroup([
      { value: "sim", text: "Sim" },
      { value: "nao", text: "Não" },
    ]);
    document.body.appendChild(group);

    let clickCount = 0;
    group.querySelectorAll<HTMLElement>(".ant-radio-wrapper").forEach((el) => {
      el.addEventListener("click", () => clickCount++);
    });

    const result = antdRadioAdapter.fill(group, "sim");
    expect(result).toBe(true);
    expect(clickCount).toBeGreaterThanOrEqual(1);
  });

  it("fill por texto (case-insensitive): clica na label correspondente", () => {
    const group = makeRadioGroup([
      { value: "1", text: "Opção A" },
      { value: "2", text: "Opção B" },
    ]);
    document.body.appendChild(group);

    let clickCount = 0;
    group.querySelectorAll<HTMLElement>(".ant-radio-wrapper").forEach((el) => {
      el.addEventListener("click", () => clickCount++);
    });

    const result = antdRadioAdapter.fill(group, "OPÇÃO A");
    expect(result).toBe(true);
    expect(clickCount).toBeGreaterThanOrEqual(1);
  });

  it("fill por texto parcial", () => {
    const group = makeRadioGroup([{ value: "1", text: "Texto Longo" }]);
    document.body.appendChild(group);

    const result = antdRadioAdapter.fill(group, "Longo");
    expect(result).toBe(true);
  });

  it("fill fallback: clica no primeiro não-selecionado quando não há match", () => {
    const group = makeRadioGroup([
      { value: "a", text: "A" },
      { value: "b", text: "B" },
    ]);
    document.body.appendChild(group);

    let clickCount = 0;
    group.querySelectorAll<HTMLElement>(".ant-radio-wrapper").forEach((el) => {
      el.addEventListener("click", () => clickCount++);
    });

    const result = antdRadioAdapter.fill(group, "nao-existe");
    expect(result).toBe(true);
    expect(clickCount).toBeGreaterThanOrEqual(1);
  });

  it("fill retorna false quando todos os options estão checked e não há match", () => {
    const group = makeRadioGroup([
      { value: "a", text: "A", checked: true },
      { value: "b", text: "B", checked: true },
    ]);
    document.body.appendChild(group);

    const result = antdRadioAdapter.fill(group, "nao-existe");
    expect(result).toBe(false);
  });

  it("fill funciona com radio-button-wrapper style", () => {
    const group = makeRadioGroup(
      [
        { value: "list", text: "Lista" },
        { value: "table", text: "Tabela" },
      ],
      true,
    );
    document.body.appendChild(group);

    let clickCount = 0;
    group
      .querySelectorAll<HTMLElement>(".ant-radio-button-wrapper")
      .forEach((el) => {
        el.addEventListener("click", () => clickCount++);
      });

    const result = antdRadioAdapter.fill(group, "list");
    expect(result).toBe(true);
    expect(clickCount).toBeGreaterThanOrEqual(1);
  });
});

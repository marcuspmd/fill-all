/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { antdCheckboxAdapter } from "../antd-checkbox-adapter";
import { antdSwitchAdapter } from "../antd-switch-adapter";
import { antdRateAdapter } from "../antd-rate-adapter";

vi.mock("../../extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => `#${el.id || "el"}`),
  buildSignals: vi.fn(() => "mock signals"),
  findLabelWithStrategy: vi.fn(() => null),
}));

function makeCheckboxGroup(
  options: Array<{ value: string; text: string; checked?: boolean }>,
) {
  const group = document.createElement("div");
  group.className = "ant-checkbox-group";

  for (const opt of options) {
    const label = document.createElement("label");
    label.className = `ant-checkbox-wrapper${opt.checked ? " ant-checkbox-wrapper-checked" : ""}`;
    const span = document.createElement("span");
    span.className = "ant-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
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

function makeSwitch(checked = false, disabled = false) {
  const btn = document.createElement("button");
  btn.className = "ant-switch";
  if (checked) btn.classList.add("ant-switch-checked");
  if (disabled) btn.classList.add("ant-switch-disabled");
  btn.setAttribute("role", "switch");
  btn.setAttribute("aria-checked", checked ? "true" : "false");
  btn.id = "switch-1";
  return btn;
}

function makeRate(stars = 5, disabled = false) {
  const ul = document.createElement("ul");
  ul.className = "ant-rate";
  if (disabled) ul.classList.add("ant-rate-disabled");
  ul.setAttribute("role", "radiogroup");

  for (let i = 1; i <= stars; i++) {
    const li = document.createElement("li");
    li.className = "ant-rate-star ant-rate-star-zero";
    const radio = document.createElement("div");
    radio.setAttribute("role", "radio");
    radio.setAttribute("aria-posinset", String(i));
    const second = document.createElement("div");
    second.className = "ant-rate-star-second";
    radio.appendChild(second);
    li.appendChild(radio);
    ul.appendChild(li);
  }

  return ul;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

// ─── Checkbox Adapter ───────────────────────────────────────────────────────

describe("antdCheckboxAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdCheckboxAdapter.name).toBe("antd-checkbox");
    expect(antdCheckboxAdapter.selector).toBe(".ant-checkbox-group");
  });

  it("matches retorna true para .ant-checkbox-group", () => {
    const el = document.createElement("div");
    el.className = "ant-checkbox-group";
    expect(antdCheckboxAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para outro elemento", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(antdCheckboxAdapter.matches(el)).toBe(false);
  });

  it("buildField cria campo do tipo checkbox com opções", () => {
    const group = makeCheckboxGroup([
      { value: "a", text: "Opção A" },
      { value: "b", text: "Opção B" },
    ]);
    document.body.appendChild(group);

    const field = antdCheckboxAdapter.buildField(group);

    expect(field.fieldType).toBe("checkbox");
    expect(field.adapterName).toBe("antd-checkbox");
    expect(field.options).toHaveLength(2);
    expect(field.options![0].value).toBe("a");
    expect(field.options![1].text).toBe("Opção B");
  });

  it("buildField retorna options undefined quando não há itens", () => {
    const group = document.createElement("div");
    group.className = "ant-checkbox-group";
    document.body.appendChild(group);

    const field = antdCheckboxAdapter.buildField(group);
    expect(field.options).toBeUndefined();
  });

  it("fill por valor: marca checkbox com value correspondente", () => {
    const group = makeCheckboxGroup([
      { value: "sim", text: "Sim" },
      { value: "nao", text: "Não" },
    ]);
    document.body.appendChild(group);

    const clicked: HTMLElement[] = [];
    group
      .querySelectorAll<HTMLElement>(".ant-checkbox-wrapper")
      .forEach((el) => {
        el.addEventListener("click", () => clicked.push(el));
      });

    const result = antdCheckboxAdapter.fill(group, "sim");
    expect(result).toBe(true);
  });

  it("fill por texto (case-insensitive): clica no label correspondente", () => {
    const group = makeCheckboxGroup([
      { value: "1", text: "Opção A" },
      { value: "2", text: "Opção B" },
    ]);
    document.body.appendChild(group);

    const result = antdCheckboxAdapter.fill(group, "OPÇÃO A");
    expect(result).toBe(true);
  });

  it("fill por texto parcial: clica no label que contém o valor", () => {
    const group = makeCheckboxGroup([
      { value: "1", text: "Longa Opção Texto" },
    ]);
    document.body.appendChild(group);

    const result = antdCheckboxAdapter.fill(group, "Longa");
    expect(result).toBe(true);
  });

  it("fill fallback: marca primeiro checkbox não marcado quando não há match", () => {
    const group = makeCheckboxGroup([
      { value: "x", text: "X" },
      { value: "y", text: "Y" },
    ]);
    document.body.appendChild(group);

    const result = antdCheckboxAdapter.fill(group, "nao-existe");
    expect(result).toBe(true);
  });

  it("fill retorna false quando todos os checkboxes estão marcados e não há match", () => {
    const group = makeCheckboxGroup([
      { value: "x", text: "X", checked: true },
      { value: "y", text: "Y", checked: true },
    ]);
    document.body.appendChild(group);

    const result = antdCheckboxAdapter.fill(group, "nao-existe");
    expect(result).toBe(false);
  });

  it("fill não reclica checkbox já marcado com valor correspondente", () => {
    const group = makeCheckboxGroup([
      { value: "sim", text: "Sim", checked: true },
    ]);
    document.body.appendChild(group);

    let clicked = 0;
    group
      .querySelector<HTMLElement>(".ant-checkbox-wrapper")!
      .addEventListener("click", () => clicked++);

    antdCheckboxAdapter.fill(group, "sim");
    expect(clicked).toBe(0);
  });
});

// ─── Switch Adapter ──────────────────────────────────────────────────────────

describe("antdSwitchAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdSwitchAdapter.name).toBe("antd-switch");
    expect(antdSwitchAdapter.selector).toBe("button.ant-switch");
  });

  it("matches retorna true para .ant-switch não-disabled", () => {
    const btn = makeSwitch();
    expect(antdSwitchAdapter.matches(btn)).toBe(true);
  });

  it("matches retorna false para .ant-switch-disabled", () => {
    const btn = makeSwitch(false, true);
    expect(antdSwitchAdapter.matches(btn)).toBe(false);
  });

  it("matches retorna false para elemento sem classe ant-switch", () => {
    const el = document.createElement("button");
    expect(antdSwitchAdapter.matches(el)).toBe(false);
  });

  it("buildField cria campo do tipo checkbox", () => {
    const btn = makeSwitch();
    document.body.appendChild(btn);

    const field = antdSwitchAdapter.buildField(btn);

    expect(field.fieldType).toBe("checkbox");
    expect(field.adapterName).toBe("antd-switch");
    expect(field.element).toBe(btn);
  });

  it("fill: liga switch desligado quando value é 'true'", () => {
    const btn = makeSwitch(false);
    document.body.appendChild(btn);

    let clicked = 0;
    btn.addEventListener("click", () => clicked++);

    const result = antdSwitchAdapter.fill(btn, "true");
    expect(result).toBe(true);
    expect(clicked).toBe(1);
  });

  it("fill: não faz nada quando já está ligado e value é 'true'", () => {
    const btn = makeSwitch(true);
    document.body.appendChild(btn);

    let clicked = 0;
    btn.addEventListener("click", () => clicked++);

    antdSwitchAdapter.fill(btn, "true");
    expect(clicked).toBe(0);
  });

  it("fill: desliga switch ligado quando value é 'false'", () => {
    const btn = makeSwitch(true);
    document.body.appendChild(btn);

    let clicked = 0;
    btn.addEventListener("click", () => clicked++);

    antdSwitchAdapter.fill(btn, "false");
    expect(clicked).toBe(1);
  });

  it("fill: aceita 'on', '1', 'yes' como true", () => {
    for (const val of ["on", "1", "yes"]) {
      const btn = makeSwitch(false);
      document.body.appendChild(btn);

      let clicked = 0;
      btn.addEventListener("click", () => clicked++);

      antdSwitchAdapter.fill(btn, val);
      expect(clicked).toBe(1);
      document.body.removeChild(btn);
    }
  });

  it("fill sempre retorna true (mesmo sem toggle)", () => {
    const btn = makeSwitch(true);
    document.body.appendChild(btn);
    expect(antdSwitchAdapter.fill(btn, "true")).toBe(true);
  });
});

// ─── Rate Adapter ────────────────────────────────────────────────────────────

describe("antdRateAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdRateAdapter.name).toBe("antd-rate");
    expect(antdRateAdapter.selector).toBe("ul.ant-rate");
  });

  it("matches retorna true para .ant-rate não-disabled", () => {
    const ul = makeRate();
    expect(antdRateAdapter.matches(ul)).toBe(true);
  });

  it("matches retorna false para .ant-rate-disabled", () => {
    const ul = makeRate(5, true);
    expect(antdRateAdapter.matches(ul)).toBe(false);
  });

  it("buildField cria campo do tipo number com placeholder correto", () => {
    const ul = makeRate(5);
    document.body.appendChild(ul);

    const field = antdRateAdapter.buildField(ul);

    expect(field.fieldType).toBe("number");
    expect(field.adapterName).toBe("antd-rate");
    expect(field.placeholder).toBe("1–5");
  });

  it("fill clica na estrela pelo índice", () => {
    const ul = makeRate(5);
    document.body.appendChild(ul);

    const stars = ul.querySelectorAll<HTMLElement>(".ant-rate-star");
    const clicks: number[] = [];
    stars.forEach((star, i) => {
      const second = star.querySelector<HTMLElement>(".ant-rate-star-second")!;
      second.addEventListener("click", () => clicks.push(i + 1));
    });

    const result = antdRateAdapter.fill(ul, "3");
    expect(result).toBe(true);
    expect(clicks).toContain(3);
  });

  it("fill clica na estrela com .ant-rate-star-second quando disponível", () => {
    const ul = makeRate(5);
    document.body.appendChild(ul);

    let clickCount = 0;
    ul.querySelectorAll<HTMLElement>(".ant-rate-star-second").forEach((el) => {
      el.addEventListener("click", () => clickCount++);
    });

    antdRateAdapter.fill(ul, "4");
    expect(clickCount).toBe(1);
  });

  it("fill usa fallback aleatório quando value é inválido (>= 3)", () => {
    const ul = makeRate(5);
    document.body.appendChild(ul);

    // Should not throw even with invalid value
    const result = antdRateAdapter.fill(ul, "abc");
    expect(result).toBe(true);
  });

  it("fill retorna false quando não há estrelas", () => {
    const ul = document.createElement("ul");
    ul.className = "ant-rate";
    document.body.appendChild(ul);

    const result = antdRateAdapter.fill(ul, "3");
    expect(result).toBe(false);
  });

  it("fill clipa o valor ao máximo de estrelas", () => {
    const ul = makeRate(3);
    document.body.appendChild(ul);

    let clickCount = 0;
    ul.querySelectorAll<HTMLElement>(".ant-rate-star-second").forEach((el) => {
      el.addEventListener("click", () => clickCount++);
    });

    antdRateAdapter.fill(ul, "100");
    expect(clickCount).toBe(1);
  });
});

/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findAntLabel,
  findAntId,
  findAntName,
  isAntRequired,
  setReactInputValue,
  simulateClick,
  waitForElement,
  getUniqueSelector,
} from "../antd-utils";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => el.tagName.toLowerCase()),
  findLabelWithStrategy: vi.fn(() => null),
  buildSignals: vi.fn(() => "signals"),
}));

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("findAntLabel", () => {
  it("extrai label do .ant-form-item-label", () => {
    document.body.innerHTML = `
      <div class="ant-form-item">
        <div class="ant-form-item-label"><label>Nome</label></div>
        <div class="ant-select" id="wrapper"></div>
      </div>`;
    const wrapper = document.getElementById("wrapper") as HTMLElement;
    expect(findAntLabel(wrapper)).toBe("Nome");
  });

  it("retorna undefined quando não há label", () => {
    document.body.innerHTML = `<div id="wrapper"></div>`;
    const wrapper = document.getElementById("wrapper") as HTMLElement;
    expect(findAntLabel(wrapper)).toBeUndefined();
  });

  it("ignora label vazia no form item", () => {
    document.body.innerHTML = `
      <div class="ant-form-item">
        <div class="ant-form-item-label"><label>   </label></div>
        <div id="wrapper"></div>
      </div>`;
    const wrapper = document.getElementById("wrapper") as HTMLElement;
    expect(findAntLabel(wrapper)).toBeUndefined();
  });
});

describe("findAntId", () => {
  it("retorna id do input interno", () => {
    document.body.innerHTML = `
      <div id="wrapper">
        <input id="field-id" />
      </div>`;
    const wrapper = document.getElementById("wrapper") as HTMLElement;
    expect(findAntId(wrapper)).toBe("field-id");
  });

  it("retorna id do wrapper quando não há input", () => {
    document.body.innerHTML = `<div id="wrapper-id"></div>`;
    const wrapper = document.getElementById("wrapper-id") as HTMLElement;
    expect(findAntId(wrapper)).toBe("wrapper-id");
  });

  it("retorna undefined quando não há id", () => {
    document.body.innerHTML = `<div id="x"><span></span></div>`;
    const wrapper = document.getElementById("x") as HTMLElement;
    wrapper.removeAttribute("id");
    expect(findAntId(wrapper)).toBeUndefined();
  });

  it("encontra input role=combobox", () => {
    document.body.innerHTML = `
      <div id="w">
        <input role="combobox" id="combo-id" />
      </div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(findAntId(wrapper)).toBe("combo-id");
  });
});

describe("findAntName", () => {
  it("retorna name do input interno", () => {
    document.body.innerHTML = `<div id="w"><input name="email" /></div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(findAntName(wrapper)).toBe("email");
  });

  it("retorna undefined quando não há input", () => {
    document.body.innerHTML = `<div id="w"></div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(findAntName(wrapper)).toBeUndefined();
  });

  it("retorna undefined quando input não tem name", () => {
    document.body.innerHTML = `<div id="w"><input /></div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(findAntName(wrapper)).toBeUndefined();
  });
});

describe("isAntRequired", () => {
  it("retorna true para campo obrigatório", () => {
    document.body.innerHTML = `
      <div class="ant-form-item">
        <label class="ant-form-item-required"></label>
        <div id="w"></div>
      </div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(isAntRequired(wrapper)).toBe(true);
  });

  it("retorna false para campo não obrigatório", () => {
    document.body.innerHTML = `
      <div class="ant-form-item">
        <label></label>
        <div id="w"></div>
      </div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(isAntRequired(wrapper)).toBe(false);
  });

  it("retorna false quando não há .ant-form-item pai", () => {
    document.body.innerHTML = `<div id="w"></div>`;
    const wrapper = document.getElementById("w") as HTMLElement;
    expect(isAntRequired(wrapper)).toBe(false);
  });
});

describe("setReactInputValue", () => {
  it("define valor no input e dispara eventos", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const inputListener = vi.fn();
    const changeListener = vi.fn();
    input.addEventListener("input", inputListener);
    input.addEventListener("change", changeListener);

    setReactInputValue(input, "novo valor");

    expect(input.value).toBe("novo valor");
    expect(inputListener).toHaveBeenCalledTimes(1);
    expect(changeListener).toHaveBeenCalledTimes(1);
  });

  it("define valor em textarea e dispara eventos", () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    const inputListener = vi.fn();
    textarea.addEventListener("input", inputListener);

    setReactInputValue(textarea, "texto na textarea");

    expect(textarea.value).toBe("texto na textarea");
    expect(inputListener).toHaveBeenCalledTimes(1);
  });
});

describe("simulateClick", () => {
  it("dispara mousedown, mouseup e click", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const mousedown = vi.fn();
    const mouseup = vi.fn();
    const click = vi.fn();

    el.addEventListener("mousedown", mousedown);
    el.addEventListener("mouseup", mouseup);
    el.addEventListener("click", click);

    simulateClick(el);

    expect(mousedown).toHaveBeenCalledTimes(1);
    expect(mouseup).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe("waitForElement", () => {
  it("retorna elemento existente imediatamente", async () => {
    document.body.innerHTML = `<div class="target"></div>`;
    const result = await waitForElement(".target");
    expect(result).not.toBeNull();
  });

  it("retorna null após timeout quando elemento não existe", async () => {
    const result = await waitForElement(".nao-existe", 50);
    expect(result).toBeNull();
  });

  it("encontra elemento adicionado dinamicamente", async () => {
    const promise = waitForElement(".dynamic-el", 200);

    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "dynamic-el";
      document.body.appendChild(el);
    }, 30);

    const result = await promise;
    expect(result).not.toBeNull();
  });
});

describe("getUniqueSelector (re-export)", () => {
  it("é re-exportado sem modificação", () => {
    expect(typeof getUniqueSelector).toBe("function");
  });
});

/** @vitest-environment happy-dom */

/**
 * Testes para antdSelectAdapter, antdDatepickerAdapter, antdSliderAdapter
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn(
    (el: HTMLElement) => el.tagName.toLowerCase() + "-unique",
  ),
  findLabelWithStrategy: vi.fn(() => null),
  buildSignals: vi.fn(() => "signals"),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock waitForElement para não precisar de timers reais nos testes unitários.
// Retorna o primeiro elemento que corresponde ao seletor, ou null se não existir.
vi.mock("../antd-utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("../antd-utils")>();
  return {
    ...original,
    waitForElement: vi.fn(
      (selector: string): Promise<HTMLElement | null> =>
        Promise.resolve(document.querySelector<HTMLElement>(selector)),
    ),
  };
});

import { antdSelectAdapter } from "../antd-select-adapter";
import { antdDatepickerAdapter } from "../antd-datepicker-adapter";
import { antdSliderAdapter } from "../antd-slider-adapter";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSelect(options?: {
  disabled?: boolean;
  placeholder?: string;
  hasOptions?: boolean;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-select ant-select-single";
  if (options?.disabled) wrapper.classList.add("ant-select-disabled");

  const selector = document.createElement("div");
  selector.className = "ant-select-selector";

  const searchSpan = document.createElement("span");
  searchSpan.className = "ant-select-selection-search";

  const input = document.createElement("input");
  input.setAttribute("role", "combobox");
  input.className = "ant-select-selection-search-input";

  if (options?.placeholder) {
    const placeholder = document.createElement("span");
    placeholder.className = "ant-select-selection-placeholder";
    placeholder.textContent = options.placeholder;
    selector.appendChild(placeholder);
  }

  searchSpan.appendChild(input);
  selector.appendChild(searchSpan);
  wrapper.appendChild(selector);

  if (options?.hasOptions) {
    // Create a fake listbox with aria-controls
    const listboxId = "antd-listbox-test";
    input.setAttribute("aria-controls", listboxId);

    const listbox = document.createElement("ul");
    listbox.id = listboxId;
    listbox.setAttribute("role", "listbox");

    const opt1 = document.createElement("li");
    opt1.setAttribute("role", "option");
    opt1.setAttribute("title", "Opção 1");
    opt1.textContent = "Opção 1";

    const opt2 = document.createElement("li");
    opt2.setAttribute("role", "option");
    opt2.setAttribute("title", "Opção 2");
    opt2.textContent = "Opção 2";

    listbox.appendChild(opt1);
    listbox.appendChild(opt2);
    document.body.appendChild(listbox);
  }

  return wrapper;
}

/**
 * Helpers para nova estrutura CSS-var do antd v5.17+ (sem .ant-select-selector).
 * O input .ant-select-input é filho direto de .ant-select-content e é o trigger.
 */
function makeNewCssVarSelect(options?: {
  disabled?: boolean;
  placeholder?: string;
  multiple?: boolean;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = options?.multiple
    ? "ant-select ant-select-multiple ant-select-css-var"
    : "ant-select ant-select-single ant-select-css-var";
  if (options?.disabled) wrapper.classList.add("ant-select-disabled");

  const content = document.createElement("div");
  content.className = "ant-select-content";

  const placeholder = document.createElement("div");
  placeholder.className = "ant-select-placeholder";
  placeholder.textContent = options?.placeholder ?? "";

  const input = document.createElement("input");
  input.className = "ant-select-input";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-haspopup", "listbox");
  input.type = "search";

  content.appendChild(placeholder);
  content.appendChild(input);
  wrapper.appendChild(content);

  const suffix = document.createElement("div");
  suffix.className = "ant-select-suffix";
  wrapper.appendChild(suffix);

  return wrapper;
}

function makeDatepicker(options?: { disabled?: boolean }): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-picker";
  if (options?.disabled) wrapper.classList.add("ant-picker-disabled");

  const inputDiv = document.createElement("div");
  inputDiv.className = "ant-picker-input";

  const input = document.createElement("input");
  input.placeholder = "Selecione a data";

  inputDiv.appendChild(input);
  wrapper.appendChild(inputDiv);

  return wrapper;
}

function makeTimePicker(options?: { disabled?: boolean }): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-picker ant-picker-time";
  if (options?.disabled) wrapper.classList.add("ant-picker-disabled");

  const inputDiv = document.createElement("div");
  inputDiv.className = "ant-picker-input";

  const input = document.createElement("input");
  input.placeholder = "Select time";

  inputDiv.appendChild(input);
  wrapper.appendChild(inputDiv);

  return wrapper;
}

function makeSlider(options?: {
  disabled?: boolean;
  min?: number;
  max?: number;
  value?: number;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-slider";
  if (options?.disabled) wrapper.classList.add("ant-slider-disabled");

  const rail = document.createElement("div");
  rail.className = "ant-slider-rail";

  const track = document.createElement("div");
  track.className = "ant-slider-track";
  track.style.width = "0%";

  const handle = document.createElement("div");
  handle.className = "ant-slider-handle";
  handle.setAttribute("role", "slider");
  handle.setAttribute("aria-valuemin", String(options?.min ?? 0));
  handle.setAttribute("aria-valuemax", String(options?.max ?? 100));
  handle.setAttribute("aria-valuenow", String(options?.value ?? 0));
  handle.setAttribute("tabindex", "0");
  handle.style.left = "0%";

  wrapper.append(rail, track, handle);
  return wrapper;
}

// ─── antdSelectAdapter ───────────────────────────────────────────────────────

describe("antdSelectAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("name está correto", () => {
    expect(antdSelectAdapter.name).toBe("antd-select");
  });

  it("selector está correto", () => {
    expect(antdSelectAdapter.selector).toBe(
      ".ant-select:not(.ant-select-auto-complete):not(.ant-select-disabled)",
    );
  });

  it("matches: retorna true para .ant-select sem disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select";
    expect(antdSelectAdapter.matches(el)).toBe(true);
  });

  it("matches: retorna false para .ant-select-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-select-disabled";
    expect(antdSelectAdapter.matches(el)).toBe(false);
  });

  it("matches: retorna false para elemento sem ant-select", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(antdSelectAdapter.matches(el)).toBe(false);
  });

  it("matches: retorna false para .ant-select-auto-complete (tem adapter próprio)", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-select-auto-complete";
    expect(antdSelectAdapter.matches(el)).toBe(false);
  });

  it("buildField: retorna FormField com fieldType select", () => {
    const wrapper = makeSelect({ placeholder: "Escolha uma opção" });
    document.body.appendChild(wrapper);

    const field = antdSelectAdapter.buildField(wrapper);

    expect(field.fieldType).toBe("select");
    expect(field.adapterName).toBe("antd-select");
    expect(field.placeholder).toBe("Escolha uma opção");
  });

  it("buildField: lê opções do listbox quando disponível", () => {
    const wrapper = makeSelect({ hasOptions: true });
    document.body.appendChild(wrapper);

    const field = antdSelectAdapter.buildField(wrapper);
    expect(field.options).toBeDefined();
    expect(field.options!.length).toBeGreaterThan(0);
  });

  it("buildField: options undefined quando não há listbox", () => {
    const wrapper = makeSelect();
    document.body.appendChild(wrapper);

    const field = antdSelectAdapter.buildField(wrapper);
    expect(field.options).toBeUndefined();
  });

  it("fill: retorna false quando não há .ant-select-selector", async () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select";
    document.body.appendChild(wrapper);

    const result = await antdSelectAdapter.fill(wrapper, "valor");
    expect(result).toBe(false);
  });

  // ─── Nova estrutura CSS-var antd v5.17+ ─────────────────────────────────────

  describe("nova estrutura CSS-var (antd v5.17+)", () => {
    it("matches: retorna true para .ant-select-css-var", () => {
      const wrapper = makeNewCssVarSelect();
      expect(antdSelectAdapter.matches(wrapper)).toBe(true);
    });

    it("matches: retorna false para .ant-select-css-var disabled", () => {
      const wrapper = makeNewCssVarSelect({ disabled: true });
      expect(antdSelectAdapter.matches(wrapper)).toBe(false);
    });

    it("buildField: extrai placeholder de .ant-select-placeholder", () => {
      const wrapper = makeNewCssVarSelect({
        placeholder: "Selecione o estado",
      });
      document.body.appendChild(wrapper);

      const field = antdSelectAdapter.buildField(wrapper);
      expect(field.placeholder).toBe("Selecione o estado");
      expect(field.fieldType).toBe("select");
      expect(field.adapterName).toBe("antd-select");
    });

    it("fill: retorna false quando sem selector E sem combobox", async () => {
      const wrapper = document.createElement("div");
      wrapper.className = "ant-select ant-select-css-var";
      document.body.appendChild(wrapper);

      const result = await antdSelectAdapter.fill(wrapper, "valor");
      expect(result).toBe(false);
    });

    it("fill: dispara click no input, não diretamente no content div", async () => {
      const wrapper = makeNewCssVarSelect({ placeholder: "Selecione" });
      document.body.appendChild(wrapper);

      const input = wrapper.querySelector<HTMLInputElement>("input")!;
      const contentDiv = wrapper.querySelector<HTMLElement>(
        ".ant-select-content",
      )!;

      const inputMousedowns: number[] = [];
      const contentDirectMousedowns: number[] = [];

      input.addEventListener("mousedown", (e) => {
        if (e.target === input) inputMousedowns.push(1);
      });
      contentDiv.addEventListener("mousedown", (e) => {
        // Conta apenas mousedowns com target=contentDiv (direto, não bubbled do input)
        if (e.target === contentDiv) contentDirectMousedowns.push(1);
      });

      const dropdown = document.createElement("div");
      dropdown.className = "ant-select-dropdown";
      const option = document.createElement("div");
      option.className = "ant-select-item-option";
      option.setAttribute("title", "Opção A");
      option.textContent = "Opção A";
      dropdown.appendChild(option);
      document.body.appendChild(dropdown);

      await antdSelectAdapter.fill(wrapper, "Opção A");

      expect(inputMousedowns.length).toBeGreaterThan(0);
      expect(contentDirectMousedowns.length).toBe(0);
    });

    it("fill: seleciona opção no dropdown para nova estrutura", async () => {
      const wrapper = makeNewCssVarSelect({ placeholder: "Selecione" });
      document.body.appendChild(wrapper);

      const dropdown = document.createElement("div");
      dropdown.className = "ant-select-dropdown";
      const option = document.createElement("div");
      option.className = "ant-select-item-option";
      option.setAttribute("title", "São Paulo");
      option.textContent = "São Paulo";
      dropdown.appendChild(option);
      document.body.appendChild(dropdown);

      let clicked = false;
      option.addEventListener("click", () => (clicked = true));

      const result = await antdSelectAdapter.fill(wrapper, "São Paulo");
      expect(result).toBe(true);
      expect(clicked).toBe(true);
    });
  });

  it("fill: seleciona opção correspondente no dropdown visível", async () => {
    const wrapper = makeSelect();
    document.body.appendChild(wrapper);

    // Criar dropdown visível
    const dropdown = document.createElement("div");
    dropdown.className = "ant-select-dropdown";

    const option = document.createElement("div");
    option.className = "ant-select-item-option";
    option.setAttribute("title", "Opção Alvo");
    option.textContent = "Opção Alvo";
    dropdown.appendChild(option);
    document.body.appendChild(dropdown);

    let clicked = false;
    option.addEventListener("click", () => (clicked = true));

    const result = await antdSelectAdapter.fill(wrapper, "Opção Alvo");
    expect(result).toBe(true);
    expect(clicked).toBe(true);
  });

  it("fill: faz match parcial quando exato não encontrado", async () => {
    const wrapper = makeSelect();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-select-dropdown";

    const option = document.createElement("div");
    option.className = "ant-select-item-option";
    option.setAttribute("title", "Texto Completo da Opção");
    option.textContent = "Texto Completo da Opção";
    dropdown.appendChild(option);
    document.body.appendChild(dropdown);

    let clicked = false;
    option.addEventListener("click", () => (clicked = true));

    const result = await antdSelectAdapter.fill(wrapper, "Completo");
    expect(result).toBe(true);
    expect(clicked).toBe(true);
  });

  it("fill: usa fallback para primeiro option não-desabilitado", async () => {
    const wrapper = makeSelect();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-select-dropdown";

    const option = document.createElement("div");
    option.className = "ant-select-item-option";
    option.textContent = "Qualquer Opção";
    dropdown.appendChild(option);
    document.body.appendChild(dropdown);

    const result = await antdSelectAdapter.fill(wrapper, "valor-inexistente");
    expect(result).toBe(true);
  });

  it("fill: ignora dropdown hidden", async () => {
    const wrapper = makeSelect();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-select-dropdown ant-select-dropdown-hidden";
    dropdown.innerHTML = '<div class="ant-select-item-option">Opção</div>';
    document.body.appendChild(dropdown);

    const result = await antdSelectAdapter.fill(wrapper, "algum-valor");
    expect(result).toBe(false);
  });
});

// ─── antdDatepickerAdapter ──────────────────────────────────────────────────

describe("antdDatepickerAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("name está correto", () => {
    expect(antdDatepickerAdapter.name).toBe("antd-datepicker");
  });

  it("selector está correto", () => {
    expect(antdDatepickerAdapter.selector).toBe(".ant-picker");
  });

  it("matches: retorna true para .ant-picker não-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-picker";
    expect(antdDatepickerAdapter.matches(el)).toBe(true);
  });

  it("matches: retorna false para .ant-picker-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-picker ant-picker-disabled";
    expect(antdDatepickerAdapter.matches(el)).toBe(false);
  });

  it("matches: retorna false para elemento sem ant-picker", () => {
    const el = document.createElement("div");
    el.className = "other";
    expect(antdDatepickerAdapter.matches(el)).toBe(false);
  });

  it("buildField: retorna FormField com fieldType date", () => {
    const wrapper = makeDatepicker();
    document.body.appendChild(wrapper);

    const field = antdDatepickerAdapter.buildField(wrapper);

    expect(field.fieldType).toBe("date");
    expect(field.adapterName).toBe("antd-datepicker");
    expect(field.placeholder).toBe("Selecione a data");
    expect(field.isInteractive).toBe(true);
    expect(field.interactiveType).toBe("date-picker");
  });

  it("buildField: retorna interactiveType 'time-picker' para .ant-picker-time", () => {
    const wrapper = makeTimePicker();
    document.body.appendChild(wrapper);

    const field = antdDatepickerAdapter.buildField(wrapper);

    expect(field.fieldType).toBe("date");
    expect(field.isInteractive).toBe(true);
    expect(field.interactiveType).toBe("time-picker");
    expect(field.adapterName).toBe("antd-datepicker");
  });

  it("matches: retorna true para .ant-picker-time (TimePicker)", () => {
    const wrapper = makeTimePicker();
    expect(antdDatepickerAdapter.matches(wrapper)).toBe(true);
  });

  it("buildField: sem input, placeholder fica undefined", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-picker";
    document.body.appendChild(wrapper);

    const field = antdDatepickerAdapter.buildField(wrapper);
    expect(field.placeholder).toBeUndefined();
  });

  it("fill: retorna false sem input dentro do wrapper", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-picker";
    document.body.appendChild(wrapper);

    const result = antdDatepickerAdapter.fill(wrapper, "2024-01-15");
    expect(result).toBe(false);
  });

  it("fill: retorna true e preenche o input com o valor", () => {
    const wrapper = makeDatepicker();
    document.body.appendChild(wrapper);
    const input = wrapper.querySelector<HTMLInputElement>("input")!;

    const events: string[] = [];
    input.addEventListener("input", () => events.push("input"));
    input.addEventListener("change", () => events.push("change"));

    const result = antdDatepickerAdapter.fill(wrapper, "2024-06-15");
    expect(result).toBe(true);
    expect(events).toContain("input");
    expect(events).toContain("change");
  });

  it("fill: dispara keydown Enter para confirmar seleção", () => {
    const wrapper = makeDatepicker();
    document.body.appendChild(wrapper);
    const input = wrapper.querySelector<HTMLInputElement>("input")!;

    let enterFired = false;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") enterFired = true;
    });

    antdDatepickerAdapter.fill(wrapper, "2024-01-01");
    expect(enterFired).toBe(true);
  });

  it("fill: funciona sem nativeInputValueSetter", () => {
    const wrapper = makeDatepicker();
    document.body.appendChild(wrapper);

    const result = antdDatepickerAdapter.fill(wrapper, "2024-03-20");
    expect(result).toBe(true);
  });
});

// ─── antdSliderAdapter ──────────────────────────────────────────────────────

describe("antdSliderAdapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("name está correto", () => {
    expect(antdSliderAdapter.name).toBe("antd-slider");
  });

  it("selector está correto", () => {
    expect(antdSliderAdapter.selector).toBe(".ant-slider");
  });

  it("matches: retorna true para .ant-slider não-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-slider";
    expect(antdSliderAdapter.matches(el)).toBe(true);
  });

  it("matches: retorna false para .ant-slider-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-slider ant-slider-disabled";
    expect(antdSliderAdapter.matches(el)).toBe(false);
  });

  it("matches: retorna false para elemento sem ant-slider", () => {
    const el = document.createElement("div");
    el.className = "other";
    expect(antdSliderAdapter.matches(el)).toBe(false);
  });

  it("buildField: retorna FormField com fieldType number", () => {
    const wrapper = makeSlider({ min: 0, max: 100 });
    document.body.appendChild(wrapper);

    const field = antdSliderAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("number");
    expect(field.adapterName).toBe("antd-slider");
    expect(field.placeholder).toBe("0–100");
  });

  it("buildField: usa defaults 0-100 quando sem handle", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-slider";
    document.body.appendChild(wrapper);

    const field = antdSliderAdapter.buildField(wrapper);
    expect(field.placeholder).toBe("0–100");
  });

  it("buildField: reflete min/max customizados", () => {
    const wrapper = makeSlider({ min: 10, max: 500 });
    document.body.appendChild(wrapper);

    const field = antdSliderAdapter.buildField(wrapper);
    expect(field.placeholder).toBe("10–500");
  });

  it("fill: retorna false quando não há handle", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-slider";
    document.body.appendChild(wrapper);

    const result = antdSliderAdapter.fill(wrapper, "50");
    expect(result).toBe(false);
  });

  it("fill: define aria-valuenow com valor numérico", () => {
    const wrapper = makeSlider({ min: 0, max: 100 });
    document.body.appendChild(wrapper);
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle")!;

    const result = antdSliderAdapter.fill(wrapper, "75");
    expect(result).toBe(true);
    expect(handle.getAttribute("aria-valuenow")).toBe("75");
  });

  it("fill: clamp valor abaixo do mínimo para o mínimo", () => {
    const wrapper = makeSlider({ min: 20, max: 80 });
    document.body.appendChild(wrapper);
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle")!;

    antdSliderAdapter.fill(wrapper, "5");
    expect(parseInt(handle.getAttribute("aria-valuenow")!)).toBe(20);
  });

  it("fill: clamp valor acima do máximo para o máximo", () => {
    const wrapper = makeSlider({ min: 0, max: 50 });
    document.body.appendChild(wrapper);
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle")!;

    antdSliderAdapter.fill(wrapper, "200");
    expect(parseInt(handle.getAttribute("aria-valuenow")!)).toBe(50);
  });

  it("fill: usa valor aleatório para NaN", () => {
    const wrapper = makeSlider({ min: 0, max: 100 });
    document.body.appendChild(wrapper);
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle")!;

    const result = antdSliderAdapter.fill(wrapper, "nao-e-numero");
    expect(result).toBe(true);
    const val = parseInt(handle.getAttribute("aria-valuenow")!);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  it("fill: atualiza a track width proporcional ao valor", () => {
    const wrapper = makeSlider({ min: 0, max: 100 });
    document.body.appendChild(wrapper);
    const track = wrapper.querySelector<HTMLElement>(".ant-slider-track")!;

    antdSliderAdapter.fill(wrapper, "50");
    expect(track.style.width).toBe("50%");
  });

  it("fill: atualiza o left do handle", () => {
    const wrapper = makeSlider({ min: 0, max: 100 });
    document.body.appendChild(wrapper);
    const handle = wrapper.querySelector<HTMLElement>(".ant-slider-handle")!;

    antdSliderAdapter.fill(wrapper, "25");
    expect(handle.style.left).toBe("25%");
  });
});

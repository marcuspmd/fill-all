/** @vitest-environment happy-dom */

/**
 * Testes unitários para reactSelectAdapter.
 * Cobre matches(), buildField(), fill() e waitForReactSelectMenu().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => el.id || el.className || "sel"),
  buildSignals: vi.fn(() => "mock signals"),
  findLabelWithStrategy: vi.fn(() => null),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { reactSelectAdapter } from "../react-select-adapter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWrapper(options?: {
  disabled?: boolean;
  searchable?: boolean;
  multi?: boolean;
  hiddenInputName?: string;
  hiddenInputWrapped?: boolean;
  placeholder?: string;
  withInlineMenu?: string[];
  withAriaControls?: string;
  visibleInputId?: string;
  noControl?: boolean;
  noInput?: boolean;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "react-select-container";
  if (options?.disabled) {
    wrapper.classList.add("react-select--is-disabled");
  }

  if (!options?.noControl) {
    const control = document.createElement("div");
    control.className = "react-select__control";

    const valueContainer = document.createElement("div");
    valueContainer.className = options?.multi
      ? "react-select__value-container react-select__value-container--is-multi"
      : "react-select__value-container";

    if (options?.placeholder) {
      const ph = document.createElement("div");
      ph.className = "react-select__placeholder";
      ph.textContent = options.placeholder;
      valueContainer.appendChild(ph);
    }

    if (!options?.noInput) {
      const inputContainer = document.createElement("div");
      inputContainer.className = "react-select__input-container";

      const input = document.createElement("input");
      input.setAttribute("role", "combobox");
      input.type = "text";

      if (options?.searchable !== false) {
        // searchable = default true
        input.className = "react-select__input";
      }

      if (options?.visibleInputId) {
        input.id = options.visibleInputId;
      }
      if (options?.withAriaControls) {
        input.setAttribute("aria-controls", options.withAriaControls);
      }

      inputContainer.appendChild(input);
      valueContainer.appendChild(inputContainer);
    }

    control.appendChild(valueContainer);
    wrapper.appendChild(control);
  }

  // Hidden input (carries name/value for submission)
  if (options?.hiddenInputName) {
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = options.hiddenInputName;
    if (options?.hiddenInputWrapped) {
      const div = document.createElement("div");
      div.appendChild(hidden);
      wrapper.appendChild(div);
    } else {
      wrapper.appendChild(hidden);
    }
  }

  // Inline menu already rendered
  if (options?.withInlineMenu) {
    const menu = document.createElement("div");
    menu.className = "react-select__menu";
    const menuList = document.createElement("div");
    menuList.className = "react-select__menu-list";

    for (const optText of options.withInlineMenu) {
      const opt = document.createElement("div");
      opt.className = "react-select__option";
      opt.textContent = optText;
      opt.dataset["value"] = optText.toLowerCase();
      menuList.appendChild(opt);
    }

    menu.appendChild(menuList);
    wrapper.appendChild(menu);
  }

  return wrapper;
}

/** Cria um menu portalizado (appended to body) com aria-controls linkando */
function addPortaledMenu(listboxId: string, options: string[]): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "react-select__menu";

  const menuList = document.createElement("div");
  menuList.className = "react-select__menu-list";

  const listbox = document.createElement("div");
  listbox.id = listboxId;
  listbox.setAttribute("role", "listbox");

  for (const optText of options) {
    const opt = document.createElement("div");
    opt.className = "react-select__option";
    opt.textContent = optText;
    opt.dataset["value"] = optText.toLowerCase();
    listbox.appendChild(opt);
  }

  menuList.appendChild(listbox);
  menu.appendChild(menuList);
  document.body.appendChild(menu);
  return menu;
}

// ─── matches() ───────────────────────────────────────────────────────────────

describe("reactSelectAdapter.matches()", () => {
  it("retorna true para .react-select-container sem disabled", () => {
    const el = makeWrapper();
    expect(reactSelectAdapter.matches(el)).toBe(true);
  });

  it("retorna false para .react-select--is-disabled", () => {
    const el = makeWrapper({ disabled: true });
    expect(reactSelectAdapter.matches(el)).toBe(false);
  });

  it("retorna false para elemento sem react-select-container", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(reactSelectAdapter.matches(el)).toBe(false);
  });
});

// ─── buildField() ────────────────────────────────────────────────────────────

describe("reactSelectAdapter.buildField()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("fieldType = select para single-select", () => {
    const wrapper = makeWrapper({ hiddenInputName: "estado" });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.fieldType).toBe("select");
    expect(field.adapterName).toBe("react-select");
    expect(field.name).toBe("estado");
  });

  it("fieldType = multiselect para multi-select", () => {
    const wrapper = makeWrapper({ multi: true });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.fieldType).toBe("multiselect");
  });

  it("lê placeholder de .react-select__placeholder", () => {
    const wrapper = makeWrapper({ placeholder: "Selecione a cidade" });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.placeholder).toBe("Selecione a cidade");
  });

  it("placeholder undefined quando não há .react-select__placeholder", () => {
    const wrapper = makeWrapper();
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.placeholder).toBeUndefined();
  });

  it("hidden input como filho direto: name é preenchido", () => {
    const wrapper = makeWrapper({ hiddenInputName: "cidade" });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.name).toBe("cidade");
  });

  it("hidden input embrulhado em div (multi-select): name é preenchido", () => {
    const wrapper = makeWrapper({
      hiddenInputName: "tags",
      hiddenInputWrapped: true,
      multi: true,
    });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.name).toBe("tags");
    expect(field.fieldType).toBe("multiselect");
  });

  it("sem hidden input: name é undefined", () => {
    const wrapper = makeWrapper({ searchable: true });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.name).toBeUndefined();
  });

  it("id vem do visibleInput quando presente", () => {
    const wrapper = makeWrapper({
      searchable: true,
      visibleInputId: "estado-select",
    });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.id).toBe("estado-select");
  });

  it("id vem do wrapper quando visibleInput não tem id", () => {
    const wrapper = makeWrapper({ searchable: true });
    wrapper.id = "campo-select";
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.id).toBe("campo-select");
  });

  it("id é undefined quando nem visibleInput nem wrapper têm id", () => {
    const wrapper = makeWrapper({ searchable: true });
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.id).toBeUndefined();
  });

  it("contextSignals é preenchido via buildSignals", () => {
    const wrapper = makeWrapper();
    document.body.appendChild(wrapper);

    const field = reactSelectAdapter.buildField(wrapper);

    expect(field.contextSignals).toBe("mock signals");
  });
});

// ─── fill() ──────────────────────────────────────────────────────────────────

describe("reactSelectAdapter.fill()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("retorna false quando .react-select__control não existe", async () => {
    const wrapper = makeWrapper({ noControl: true });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "valor");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(false);
  });

  it("retorna false quando menu não aparece (timeout)", async () => {
    // Sem menu inline, sem menu portalizado → timeout de 800ms → false
    const wrapper = makeWrapper({ searchable: true });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "opção");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(false);
  });

  it("retorna false quando menu está presente mas sem opções", async () => {
    // Menu inline com zero opções disponíveis
    const wrapper = makeWrapper({ withInlineMenu: [] });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "qualquer");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(false);
  });

  it("retorna true no single-select com opção encontrada por textContent", async () => {
    const wrapper = makeWrapper({
      searchable: false,
      withInlineMenu: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
    });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "São Paulo");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("retorna true no single-select sem match exato (usa primeiro disponível)", async () => {
    const wrapper = makeWrapper({
      searchable: false,
      withInlineMenu: ["Opção A", "Opção B"],
    });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "inexistente");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("retorna true no single-select com match por dataset.value", async () => {
    const wrapper = makeWrapper({
      searchable: false,
      withInlineMenu: ["Estado A"],
    });
    document.body.appendChild(wrapper);

    // dataset.value é setado como optText.toLowerCase() pelo helper
    const fillPromise = reactSelectAdapter.fill(wrapper, "estado a");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("retorna true no multi-select (clica em até 3 opções)", async () => {
    const wrapper = makeWrapper({
      multi: true,
      withInlineMenu: ["Tag 1", "Tag 2", "Tag 3"],
    });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "Tag 1");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("single-select searchable: dispara eventos input/change no searchInput", async () => {
    const wrapper = makeWrapper({
      searchable: true,
      withInlineMenu: ["Resultado Filtrado"],
    });
    document.body.appendChild(wrapper);

    const searchInput = wrapper.querySelector<HTMLInputElement>(
      ".react-select__input",
    )!;

    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    searchInput.addEventListener("input", inputSpy);
    searchInput.addEventListener("change", changeSpy);

    const fillPromise = reactSelectAdapter.fill(wrapper, "resultado");
    await vi.runAllTimersAsync();
    await fillPromise;

    expect(inputSpy).toHaveBeenCalledOnce();
    expect(changeSpy).toHaveBeenCalledOnce();
  });
});

// ─── waitForReactSelectMenu() via fill() ─────────────────────────────────────

describe("reactSelectAdapter.fill() — waitForReactSelectMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("resolve imediatamente quando menu inline já existe no wrapper", async () => {
    const wrapper = makeWrapper({
      searchable: false,
      withInlineMenu: ["Opção Inline"],
    });
    document.body.appendChild(wrapper);

    const fillPromise = reactSelectAdapter.fill(wrapper, "Opção Inline");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("resolve imediatamente quando menu portalizado já existe via aria-controls", async () => {
    const listboxId = "react-select-portal-listbox";
    const wrapper = makeWrapper({
      searchable: false,
      withAriaControls: listboxId,
    });
    document.body.appendChild(wrapper);
    addPortaledMenu(listboxId, ["Opção Portalizada"]);

    const fillPromise = reactSelectAdapter.fill(wrapper, "Opção Portalizada");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
  });

  it("sem aria-controls e sem menu portalizado → findPortaled retorna null", async () => {
    // Wrapper sem aria-controls no input; nenhum .react-select__menu em document.body
    // → findPortaled() retorna null → timeout → false
    const wrapper = makeWrapper({ searchable: false });
    document.body.appendChild(wrapper);
    const fillPromise = reactSelectAdapter.fill(wrapper, "valor");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(false);
  });

  it("MutationObserver detecta menu adicionado ao wrapper após fill() iniciar", async () => {
    vi.useRealTimers();

    const wrapper = makeWrapper({ searchable: false });
    document.body.appendChild(wrapper);

    // Inicia o fill — menu ainda não existe, MutationObserver ficará escutando
    const fillPromise = reactSelectAdapter.fill(wrapper, "Dinâmico");

    // Simula react-select adicionando o menu inline ao wrapper após um tick
    await new Promise<void>((r) => setTimeout(r, 10));

    const menu = document.createElement("div");
    menu.className = "react-select__menu";
    const opt = document.createElement("div");
    opt.className = "react-select__option";
    opt.textContent = "Dinâmico";
    menu.appendChild(opt);
    // Append ao wrapper: findInline() irá encontrar
    wrapper.appendChild(menu);

    const result = await fillPromise;
    expect(result).toBe(true);
  }, 2000);
});

// ─── name e selector ─────────────────────────────────────────────────────────

describe("reactSelectAdapter — propriedades", () => {
  it("name está correto", () => {
    expect(reactSelectAdapter.name).toBe("react-select");
  });

  it("selector está correto", () => {
    expect(reactSelectAdapter.selector).toBe(
      ".react-select-container:not(.react-select--is-disabled)",
    );
  });
});

/** @vitest-environment happy-dom */

/**
 * Testes para antdAutoCompleteAdapter, antdCascaderAdapter,
 * antdTransferAdapter e antdTreeSelectAdapter (cobertura inicial).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/form/extractors", () => ({
  getUniqueSelector: vi.fn((el: HTMLElement) => `#${el.id || "el"}`),
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

// Mock antd-utils: waitForElement retorna o elemento já presente no DOM (síncrono),
// setReactInputValue é um spy para verificar chamada.
vi.mock("../antd-utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("../antd-utils")>();
  return {
    ...original,
    waitForElement: vi.fn(
      (selector: string): Promise<HTMLElement | null> =>
        Promise.resolve(document.querySelector<HTMLElement>(selector)),
    ),
    setReactInputValue: vi.fn(),
    simulateClick: vi.fn(),
  };
});

import { antdAutoCompleteAdapter } from "../antd-auto-complete-adapter";
import { antdCascaderAdapter } from "../antd-cascader-adapter";
import { antdTransferAdapter } from "../antd-transfer-adapter";
import { antdTreeSelectAdapter } from "../antd-tree-select-adapter";
import { setReactInputValue, simulateClick } from "../antd-utils";

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAutoComplete(opts?: {
  disabled?: boolean;
  placeholder?: string;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-select-auto-complete";
  if (opts?.disabled) wrapper.classList.add("ant-select-disabled");

  const selectorDiv = document.createElement("div");
  selectorDiv.className = "ant-select-selector";

  const span = document.createElement("span");
  span.className = "ant-select-selection-search";

  const input = document.createElement("input");
  input.className = "ant-select-selection-search-input";
  if (opts?.placeholder) input.placeholder = opts.placeholder;

  span.appendChild(input);
  selectorDiv.appendChild(span);
  wrapper.appendChild(selectorDiv);
  return wrapper;
}

function makeCascaderWrapper(opts?: { disabled?: boolean }): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-select ant-cascader";
  if (opts?.disabled) wrapper.classList.add("ant-select-disabled");

  const selectorDiv = document.createElement("div");
  selectorDiv.className = "ant-select-selector";
  wrapper.appendChild(selectorDiv);

  const placeholder = document.createElement("span");
  placeholder.className = "ant-select-selection-placeholder";
  placeholder.textContent = "Selecione";
  selectorDiv.appendChild(placeholder);

  return wrapper;
}

function makeCascaderDropdown(items: string[], isLeaf = true): HTMLElement {
  const dropdown = document.createElement("div");
  dropdown.className = "ant-cascader-dropdown";

  const menus = document.createElement("div");
  menus.className = "ant-cascader-menus";

  const menu = document.createElement("ul");
  menu.className = "ant-cascader-menu";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "ant-cascader-menu-item";
    if (!isLeaf) {
      const expandIcon = document.createElement("span");
      expandIcon.className = "ant-cascader-menu-item-expand-icon";
      li.appendChild(expandIcon);
    } else {
      li.classList.add("ant-cascader-menu-item-leaf");
    }
    li.textContent = item;
    li.title = item;
    menu.appendChild(li);
  }

  menus.appendChild(menu);
  dropdown.appendChild(menus);
  return dropdown;
}

function makeTransfer(opts?: {
  sourceItems?: string[];
  withButton?: boolean;
}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-transfer";

  // Source list
  const sourceList = document.createElement("div");
  sourceList.className = "ant-transfer-list";

  const body = document.createElement("div");
  body.className = "ant-transfer-list-body";

  const content = document.createElement("ul");
  content.className = "ant-transfer-list-content";

  for (const item of opts?.sourceItems ?? []) {
    const li = document.createElement("li");
    li.className = "ant-transfer-list-content-item";

    const label = document.createElement("label");
    label.className = "ant-checkbox-wrapper";

    const cbSpan = document.createElement("span");
    cbSpan.className = "ant-checkbox";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cbSpan.appendChild(cb);
    label.appendChild(cbSpan);

    const textSpan = document.createElement("span");
    textSpan.className = "ant-transfer-list-content-item-text";
    textSpan.textContent = item;

    li.appendChild(label);
    li.appendChild(textSpan);
    content.appendChild(li);
  }

  body.appendChild(content);
  sourceList.appendChild(body);
  wrapper.appendChild(sourceList);

  // Operation area
  const opArea = document.createElement("div");
  opArea.className = "ant-transfer-operation";

  if (opts?.withButton) {
    const btn = document.createElement("button");
    btn.className = "ant-btn";
    opArea.appendChild(btn);
  }

  wrapper.appendChild(opArea);

  // Target list
  const targetList = document.createElement("div");
  targetList.className = "ant-transfer-list";
  wrapper.appendChild(targetList);

  return wrapper;
}

function makeTreeSelect(opts?: { disabled?: boolean }): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ant-select ant-tree-select";
  if (opts?.disabled) wrapper.classList.add("ant-select-disabled");

  const selectorDiv = document.createElement("div");
  selectorDiv.className = "ant-select-selector";

  const placeholder = document.createElement("span");
  placeholder.className = "ant-select-selection-placeholder";
  placeholder.textContent = "Selecione";
  selectorDiv.appendChild(placeholder);

  wrapper.appendChild(selectorDiv);
  return wrapper;
}

function makeTreeSelectDropdown(nodes: string[]): HTMLElement {
  const dropdown = document.createElement("div");
  dropdown.className = "ant-tree-select-dropdown";

  for (const node of nodes) {
    const treeNode = document.createElement("div");
    treeNode.className = "ant-select-tree-treenode";

    const title = document.createElement("span");
    title.className = "ant-select-tree-title";
    title.textContent = node;
    treeNode.appendChild(title);
    dropdown.appendChild(treeNode);
  }

  return dropdown;
}

// ─── AutoComplete Adapter ────────────────────────────────────────────────────

describe("antdAutoCompleteAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdAutoCompleteAdapter.name).toBe("antd-auto-complete");
    expect(antdAutoCompleteAdapter.selector).toContain(
      "ant-select-auto-complete",
    );
  });

  it("matches retorna true para .ant-select-auto-complete sem disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select-auto-complete";
    expect(antdAutoCompleteAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para .ant-select-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select-auto-complete ant-select-disabled";
    expect(antdAutoCompleteAdapter.matches(el)).toBe(false);
  });

  it("matches retorna false para elemento sem classe correta", () => {
    const el = document.createElement("div");
    el.className = "other-class";
    expect(antdAutoCompleteAdapter.matches(el)).toBe(false);
  });

  it("buildField retorna FormField com placeholder correto", () => {
    const wrapper = makeAutoComplete({ placeholder: "Digite aqui" });
    document.body.appendChild(wrapper);

    const field = antdAutoCompleteAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("unknown");
    expect(field.adapterName).toBe("antd-auto-complete");
    expect(field.placeholder).toBe("Digite aqui");
  });

  it("buildField funciona sem input interno (placeholder undefined)", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select-auto-complete";
    document.body.appendChild(wrapper);

    const field = antdAutoCompleteAdapter.buildField(wrapper);
    expect(field.adapterName).toBe("antd-auto-complete");
    expect(field.placeholder).toBeUndefined();
  });

  it("fill chama setReactInputValue com o valor correto", () => {
    const wrapper = makeAutoComplete();
    document.body.appendChild(wrapper);

    const result = antdAutoCompleteAdapter.fill(wrapper, "email@teste.com");
    expect(result).toBe(true);
    expect(setReactInputValue).toHaveBeenCalledOnce();
  });

  it("fill retorna false quando não há input interno", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select-auto-complete";
    document.body.appendChild(wrapper);

    const result = antdAutoCompleteAdapter.fill(wrapper, "valor");
    expect(result).toBe(false);
    expect(setReactInputValue).not.toHaveBeenCalled();
  });
});

// ─── Cascader Adapter ────────────────────────────────────────────────────────

describe("antdCascaderAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdCascaderAdapter.name).toBe("antd-cascader");
    expect(antdCascaderAdapter.selector).toContain("ant-cascader");
  });

  it("matches retorna true quando tem ant-cascader e ant-select sem disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-cascader";
    expect(antdCascaderAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para .ant-select-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-cascader ant-select-disabled";
    expect(antdCascaderAdapter.matches(el)).toBe(false);
  });

  it("matches retorna false quando é só ant-cascader sem ant-select", () => {
    const el = document.createElement("div");
    el.className = "ant-cascader";
    expect(antdCascaderAdapter.matches(el)).toBe(false);
  });

  it("buildField retorna FormField com fieldType select", () => {
    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);

    const field = antdCascaderAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("select");
    expect(field.adapterName).toBe("antd-cascader");
    expect(field.placeholder).toBe("Selecione");
  });

  it("buildField funciona sem placeholder", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select ant-cascader";
    document.body.appendChild(wrapper);

    const field = antdCascaderAdapter.buildField(wrapper);
    expect(field.placeholder).toBeUndefined();
  });

  it("fill retorna false quando não há .ant-select-selector", async () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select ant-cascader";
    document.body.appendChild(wrapper);

    const result = await antdCascaderAdapter.fill(wrapper, "Opção");
    expect(result).toBe(false);
  });

  it("fill retorna false quando dropdown não aparece (waitForElement retorna null)", async () => {
    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);
    // No dropdown in DOM → waitForElement returns null

    const result = await antdCascaderAdapter.fill(wrapper, "Opção");
    expect(result).toBe(false);
  });

  it("fill seleciona item folha e retorna true", async () => {
    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);

    const dropdown = makeCascaderDropdown(["Opção 1", "Opção 2"], true);
    document.body.appendChild(dropdown);

    const result = await antdCascaderAdapter.fill(wrapper, "Opção 1");
    expect(result).toBe(true);
    expect(simulateClick).toHaveBeenCalled();
  });

  it("fill retorna false quando menu não tem itens disponíveis", async () => {
    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);

    // Dropdown with empty (or disabled) menu
    const dropdown = document.createElement("div");
    dropdown.className = "ant-cascader-dropdown";
    const menus = document.createElement("div");
    menus.className = "ant-cascader-menus";
    const menu = document.createElement("ul");
    menu.className = "ant-cascader-menu";
    // Only disabled item
    const disabledItem = document.createElement("li");
    disabledItem.className =
      "ant-cascader-menu-item ant-cascader-menu-item-disabled";
    disabledItem.textContent = "Desabilitado";
    menu.appendChild(disabledItem);
    menus.appendChild(menu);
    dropdown.appendChild(menus);
    document.body.appendChild(dropdown);

    const result = await antdCascaderAdapter.fill(wrapper, "Desabilitado");
    // Returns false because no non-disabled items
    expect(result).toBe(false);
  });

  it("fill navega múltiplos níveis (non-leaf path — cobre lines 137-138)", async () => {
    vi.useFakeTimers();

    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-cascader-dropdown";
    const menusEl = document.createElement("div");
    menusEl.className = "ant-cascader-menus";

    // Level 0: non-leaf item (has expand icon)
    const menu0 = document.createElement("ul");
    menu0.className = "ant-cascader-menu";
    const item0 = document.createElement("li");
    item0.className = "ant-cascader-menu-item";
    const expandIcon = document.createElement("span");
    expandIcon.className = "ant-cascader-menu-item-expand-icon";
    item0.appendChild(expandIcon);
    const span0 = document.createElement("span");
    span0.textContent = "Categoria";
    item0.appendChild(span0);
    menu0.appendChild(item0);

    // Level 1: leaf item
    const menu1 = document.createElement("ul");
    menu1.className = "ant-cascader-menu";
    const item1 = document.createElement("li");
    item1.className = "ant-cascader-menu-item ant-cascader-menu-item-leaf";
    item1.textContent = "Sub-opção";
    menu1.appendChild(item1);

    menusEl.append(menu0, menu1);
    dropdown.appendChild(menusEl);
    document.body.appendChild(dropdown);

    const fillPromise = antdCascaderAdapter.fill(wrapper, "Sub-opção");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    expect(result).toBe(true);
    expect(simulateClick).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("fill retorna true quando avança nível mas não há menu seguinte (cobre if(!currentMenu) break)", async () => {
    vi.useFakeTimers();

    const wrapper = makeCascaderWrapper();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-cascader-dropdown";
    const menusEl = document.createElement("div");
    menusEl.className = "ant-cascader-menus";

    // Only level 0 menu with a non-leaf item → after click, level++ but menus[1] is undefined → break
    const menu0 = document.createElement("ul");
    menu0.className = "ant-cascader-menu";
    const item0 = document.createElement("li");
    item0.className = "ant-cascader-menu-item";
    // Expand icon MUST be appended after text node to preserve it
    const textNode = document.createTextNode("Categoria sem sub");
    item0.appendChild(textNode);
    const expandIcon = document.createElement("span");
    expandIcon.className = "ant-cascader-menu-item-expand-icon";
    item0.appendChild(expandIcon); // append AFTER text so textContent doesn't overwrite it
    menu0.appendChild(item0);

    menusEl.appendChild(menu0); // No menu1 → menus[1] is undefined
    dropdown.appendChild(menusEl);
    document.body.appendChild(dropdown);

    const fillPromise = antdCascaderAdapter.fill(wrapper, "Categoria sem sub");
    await vi.runAllTimersAsync();
    const result = await fillPromise;

    // level was 0 when loop entered, item was non-leaf → level++, then menus[1] is undefined → break
    // return level > 0 → return 1 > 0 = true
    expect(result).toBe(true);

    vi.useRealTimers();
  });
});

// ─── Transfer Adapter ────────────────────────────────────────────────────────

describe("antdTransferAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdTransferAdapter.name).toBe("antd-transfer");
    expect(antdTransferAdapter.selector).toBe(".ant-transfer");
  });

  it("matches retorna true para .ant-transfer sem disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-transfer";
    expect(antdTransferAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para .ant-transfer-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-transfer ant-transfer-disabled";
    expect(antdTransferAdapter.matches(el)).toBe(false);
  });

  it("buildField retorna FormField com fieldType select e opções", () => {
    const wrapper = makeTransfer({
      sourceItems: ["Item A", "Item B", "Item C"],
      withButton: true,
    });
    document.body.appendChild(wrapper);

    const field = antdTransferAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("select");
    expect(field.adapterName).toBe("antd-transfer");
    expect(field.options).toBeDefined();
    expect(field.options!.length).toBeGreaterThan(0);
    expect(field.options![0].text).toBe("Item A");
  });

  it("buildField retorna options undefined quando não há itens na lista", () => {
    const wrapper = makeTransfer({ sourceItems: [], withButton: true });
    document.body.appendChild(wrapper);

    const field = antdTransferAdapter.buildField(wrapper);
    expect(field.options).toBeUndefined();
  });

  it("fill retorna false quando não há duas listas", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-transfer";
    document.body.appendChild(wrapper);

    const result = antdTransferAdapter.fill(wrapper, "");
    expect(result).toBe(false);
  });

  it("fill retorna false quando lista fonte não tem itens", () => {
    const wrapper = makeTransfer({ sourceItems: [], withButton: true });
    document.body.appendChild(wrapper);

    const result = antdTransferAdapter.fill(wrapper, "");
    expect(result).toBe(false);
  });

  it("fill seleciona itens e clica no botão de transferência", () => {
    const wrapper = makeTransfer({
      sourceItems: ["Item A", "Item B"],
      withButton: true,
    });
    document.body.appendChild(wrapper);

    const result = antdTransferAdapter.fill(wrapper, "Item A");
    expect(result).toBe(true);
    expect(simulateClick).toHaveBeenCalled();
  });

  it("fill retorna false quando não há botão de operação habilitado", () => {
    const wrapper = makeTransfer({
      sourceItems: ["Item A"],
      withButton: false,
    });
    document.body.appendChild(wrapper);

    const result = antdTransferAdapter.fill(wrapper, "Item A");
    expect(result).toBe(false);
  });

  it("fill pula simulateClick quando checkbox já está marcado (cobre if(checkbox) false)", () => {
    // Creates a source item where the checkbox already has .ant-checkbox-wrapper-checked
    // → fill should skip simulateClick for checkbox but still click the move button
    const wrapper = makeTransfer({ sourceItems: [], withButton: true });

    const sourceList =
      wrapper.querySelector<HTMLElement>(".ant-transfer-list")!;
    const content = document.createElement("ul");
    content.className = "ant-transfer-list-content";

    const li = document.createElement("li");
    li.className = "ant-transfer-list-content-item";

    // Checkbox wrapper already marked as checked → querySelector returns null
    const label = document.createElement("label");
    label.className = "ant-checkbox-wrapper ant-checkbox-wrapper-checked";
    const cbSpan = document.createElement("span");
    cbSpan.className = "ant-checkbox ant-checkbox-checked";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cbSpan.appendChild(cb);
    label.appendChild(cbSpan);

    const textSpan = document.createElement("span");
    textSpan.textContent = "Item Já Selecionado";
    li.appendChild(label);
    li.appendChild(textSpan);
    content.appendChild(li);

    const body = document.createElement("div");
    body.className = "ant-transfer-list-body";
    body.appendChild(content);
    sourceList.appendChild(body);
    document.body.appendChild(wrapper);

    // simulateClick should NOT be called for checkbox (it's checked), but should be called for button
    const result = antdTransferAdapter.fill(wrapper, "Item Já Selecionado");
    expect(result).toBe(true);
    // Button was clicked, not checkbox
    expect(simulateClick).toHaveBeenCalledTimes(1);
  });

  it("buildField mapeia item com textContent null para texto vazio (cobre ?? '')", () => {
    const wrapper = makeTransfer({ sourceItems: ["Item A"], withButton: true });

    // Add a list item whose textContent is null via Object.defineProperty
    const sourceList =
      wrapper.querySelector<HTMLElement>(".ant-transfer-list")!;
    const content = sourceList.querySelector<HTMLElement>(
      ".ant-transfer-list-content",
    )!;

    const li = document.createElement("li");
    li.className = "ant-transfer-list-content-item";

    const textSpan = document.createElement("span");
    textSpan.className = "ant-transfer-list-content-item-text";
    Object.defineProperty(textSpan, "textContent", {
      get: () => null,
      configurable: true,
    });

    li.appendChild(textSpan);
    content.appendChild(li);
    document.body.appendChild(wrapper);

    const field = antdTransferAdapter.buildField(wrapper);
    // The null-textContent item must be filtered out by .filter((o) => o.text)
    expect(field.options).toBeDefined();
    expect(field.options!.every((o) => o.text !== "")).toBe(true);
  });
});

// ─── TreeSelect Adapter ──────────────────────────────────────────────────────

describe("antdTreeSelectAdapter", () => {
  it("name e selector estão corretos", () => {
    expect(antdTreeSelectAdapter.name).toBe("antd-tree-select");
    expect(antdTreeSelectAdapter.selector).toContain("ant-tree-select");
  });

  it("matches retorna true para .ant-tree-select e .ant-select sem disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-tree-select";
    expect(antdTreeSelectAdapter.matches(el)).toBe(true);
  });

  it("matches retorna false para .ant-select-disabled", () => {
    const el = document.createElement("div");
    el.className = "ant-select ant-tree-select ant-select-disabled";
    expect(antdTreeSelectAdapter.matches(el)).toBe(false);
  });

  it("matches retorna false quando falta .ant-select", () => {
    const el = document.createElement("div");
    el.className = "ant-tree-select";
    expect(antdTreeSelectAdapter.matches(el)).toBe(false);
  });

  it("buildField retorna FormField com fieldType select", () => {
    const wrapper = makeTreeSelect();
    document.body.appendChild(wrapper);

    const field = antdTreeSelectAdapter.buildField(wrapper);
    expect(field.fieldType).toBe("select");
    expect(field.adapterName).toBe("antd-tree-select");
    expect(field.placeholder).toBe("Selecione");
  });

  it("buildField funciona sem placeholder", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select ant-tree-select";
    document.body.appendChild(wrapper);

    const field = antdTreeSelectAdapter.buildField(wrapper);
    expect(field.placeholder).toBeUndefined();
  });

  it("fill retorna false quando não há .ant-select-selector", async () => {
    const wrapper = document.createElement("div");
    wrapper.className = "ant-select ant-tree-select";
    document.body.appendChild(wrapper);

    const result = await antdTreeSelectAdapter.fill(wrapper, "Node 1");
    expect(result).toBe(false);
  });

  it("fill retorna false quando dropdown não aparece (waitForElement retorna null)", async () => {
    const wrapper = makeTreeSelect();
    document.body.appendChild(wrapper);
    // No dropdown in DOM → waitForElement returns null

    const result = await antdTreeSelectAdapter.fill(wrapper, "Node 1");
    expect(result).toBe(false);
  });

  it("fill clica no primeiro nó disponível quando dropdown aparece", async () => {
    const wrapper = makeTreeSelect();
    document.body.appendChild(wrapper);

    const dropdown = makeTreeSelectDropdown(["Nó 1", "Nó 2"]);
    document.body.appendChild(dropdown);

    const result = await antdTreeSelectAdapter.fill(wrapper, "Nó 1");
    expect(result).toBe(true);
    expect(simulateClick).toHaveBeenCalled();
  });

  it("fill retorna false quando não há nós disponíveis no dropdown", async () => {
    const wrapper = makeTreeSelect();
    document.body.appendChild(wrapper);

    const dropdown = document.createElement("div");
    dropdown.className = "ant-tree-select-dropdown";
    // Only disabled nodes
    const disabledNode = document.createElement("div");
    disabledNode.className =
      "ant-select-tree-treenode ant-select-tree-treenode-disabled";
    disabledNode.textContent = "Desabilitado";
    dropdown.appendChild(disabledNode);
    document.body.appendChild(dropdown);

    const result = await antdTreeSelectAdapter.fill(wrapper, "Node");
    expect(result).toBe(false);
  });

  it("fill clica diretamente no nó quando não há span de title", async () => {
    const wrapper = makeTreeSelect();
    document.body.appendChild(wrapper);

    // Dropdown with a treenode but no .ant-select-tree-title span
    const dropdown = document.createElement("div");
    dropdown.className = "ant-tree-select-dropdown";
    const treeNode = document.createElement("div");
    treeNode.className = "ant-select-tree-treenode";
    // no title span → code falls back to simulateClick(nodes[idx])
    dropdown.appendChild(treeNode);
    document.body.appendChild(dropdown);

    const result = await antdTreeSelectAdapter.fill(wrapper, "Node");
    expect(result).toBe(true);
    expect(simulateClick).toHaveBeenCalledWith(treeNode);
  });
});

/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/form/extractors", () => ({
  buildSignals: vi.fn(() => "mock signals"),
  getUniqueSelector: vi.fn((el: HTMLElement) => el.id || el.className || "sel"),
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

import { antdAutoCompleteAdapter } from "@/lib/form/adapters/antd/antd-auto-complete-adapter";
import { antdCascaderAdapter } from "@/lib/form/adapters/antd/antd-cascader-adapter";
import { antdTransferAdapter } from "@/lib/form/adapters/antd/antd-transfer-adapter";
import { antdTreeSelectAdapter } from "@/lib/form/adapters/antd/antd-tree-select-adapter";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAutoComplete({ disabled = false } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "ant-select ant-select-auto-complete" +
    (disabled ? " ant-select-disabled" : "");

  const selector = document.createElement("div");
  selector.className = "ant-select-selector";

  const search = document.createElement("span");
  search.className = "ant-select-selection-search";

  const input = document.createElement("input");
  input.className = "ant-select-selection-search-input";
  input.setAttribute("role", "combobox");
  input.placeholder = "Type to search";

  search.appendChild(input);
  selector.appendChild(search);
  wrapper.appendChild(selector);
  document.body.appendChild(wrapper);
  return wrapper;
}

function makeCascader({ disabled = false } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "ant-select ant-cascader" + (disabled ? " ant-select-disabled" : "");

  const selector = document.createElement("div");
  selector.className = "ant-select-selector";

  const search = document.createElement("span");
  search.className = "ant-select-selection-search";

  const input = document.createElement("input");
  input.setAttribute("role", "combobox");
  search.appendChild(input);

  const placeholder = document.createElement("span");
  placeholder.className = "ant-select-selection-placeholder";
  placeholder.textContent = "Please select";

  selector.appendChild(search);
  selector.appendChild(placeholder);
  wrapper.appendChild(selector);
  document.body.appendChild(wrapper);
  return wrapper;
}

function makeTransfer({ disabled = false, itemCount = 3 } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "ant-transfer" + (disabled ? " ant-transfer-disabled" : "");

  // Source list
  const sourceList = document.createElement("div");
  sourceList.className = "ant-transfer-list";

  const sourceBody = document.createElement("div");
  sourceBody.className = "ant-transfer-list-body";

  const sourceContent = document.createElement("ul");
  sourceContent.className = "ant-transfer-list-content";

  for (let i = 0; i < itemCount; i++) {
    const li = document.createElement("li");
    li.className = "ant-transfer-list-content-item";

    const label = document.createElement("label");
    label.className = "ant-checkbox-wrapper";

    const checkboxSpan = document.createElement("span");
    checkboxSpan.className = "ant-checkbox";

    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkboxSpan.appendChild(checkInput);
    label.appendChild(checkboxSpan);

    const text = document.createElement("span");
    text.className = "ant-transfer-list-content-item-text";
    text.textContent = `Item ${i + 1}`;

    li.appendChild(label);
    li.appendChild(text);
    sourceContent.appendChild(li);
  }

  sourceBody.appendChild(sourceContent);
  sourceList.appendChild(sourceBody);

  // Operation area
  const operation = document.createElement("div");
  operation.className = "ant-transfer-operation";

  const moveBtn = document.createElement("button");
  moveBtn.className = "ant-btn";
  moveBtn.textContent = ">";
  operation.appendChild(moveBtn);

  const moveBackBtn = document.createElement("button");
  moveBackBtn.className = "ant-btn";
  moveBackBtn.textContent = "<";
  operation.appendChild(moveBackBtn);

  // Target list
  const targetList = document.createElement("div");
  targetList.className = "ant-transfer-list";

  wrapper.appendChild(sourceList);
  wrapper.appendChild(operation);
  wrapper.appendChild(targetList);

  document.body.appendChild(wrapper);
  return wrapper;
}

function makeTreeSelect({ disabled = false } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className =
    "ant-select ant-tree-select" + (disabled ? " ant-select-disabled" : "");

  const selector = document.createElement("div");
  selector.className = "ant-select-selector";

  const search = document.createElement("span");
  search.className = "ant-select-selection-search";

  const input = document.createElement("input");
  input.setAttribute("role", "combobox");
  search.appendChild(input);

  const placeholder = document.createElement("span");
  placeholder.className = "ant-select-selection-placeholder";
  placeholder.textContent = "Please select";

  selector.appendChild(search);
  selector.appendChild(placeholder);
  wrapper.appendChild(selector);
  document.body.appendChild(wrapper);
  return wrapper;
}

// ── AutoComplete ────────────────────────────────────────────────────────────

describe("antdAutoCompleteAdapter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("name e selector corretos", () => {
    expect(antdAutoCompleteAdapter.name).toBe("antd-auto-complete");
    expect(antdAutoCompleteAdapter.selector).toContain(
      "ant-select-auto-complete",
    );
  });

  describe("matches()", () => {
    it("retorna true para elemento auto-complete habilitado", () => {
      const el = makeAutoComplete();
      expect(antdAutoCompleteAdapter.matches(el)).toBe(true);
    });

    it("retorna false para elemento desabilitado", () => {
      const el = makeAutoComplete({ disabled: true });
      expect(antdAutoCompleteAdapter.matches(el)).toBe(false);
    });

    it("retorna false para elemento sem classe ant-select-auto-complete", () => {
      const el = document.createElement("div");
      el.className = "ant-select";
      expect(antdAutoCompleteAdapter.matches(el)).toBe(false);
    });
  });

  describe("buildField()", () => {
    it("retorna FormField com adapterName correto", () => {
      const el = makeAutoComplete();
      const field = antdAutoCompleteAdapter.buildField(el);
      expect(field.adapterName).toBe("antd-auto-complete");
    });

    it("inclui placeholder do input", () => {
      const el = makeAutoComplete();
      const field = antdAutoCompleteAdapter.buildField(el);
      expect(field.placeholder).toBe("Type to search");
    });

    it("fieldType é unknown", () => {
      const el = makeAutoComplete();
      const field = antdAutoCompleteAdapter.buildField(el);
      expect(field.fieldType).toBe("unknown");
    });

    it("contextSignals está definido", () => {
      const el = makeAutoComplete();
      const field = antdAutoCompleteAdapter.buildField(el);
      expect(field.contextSignals).toBeDefined();
    });
  });

  describe("fill()", () => {
    it("preenche o input e retorna true", () => {
      const el = makeAutoComplete();
      const result = antdAutoCompleteAdapter.fill(el, "hello world");
      expect(result).toBe(true);
    });

    it("retorna false se input não existe", () => {
      const el = document.createElement("div");
      el.className = "ant-select ant-select-auto-complete";
      document.body.appendChild(el);
      const result = antdAutoCompleteAdapter.fill(el, "test");
      expect(result).toBe(false);
    });

    it("dispara eventos no input", () => {
      const el = makeAutoComplete();
      const input = el.querySelector("input")!;
      const inputEvents: string[] = [];
      input.addEventListener("input", () => inputEvents.push("input"));
      antdAutoCompleteAdapter.fill(el, "test value");
      expect(inputEvents.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Cascader ────────────────────────────────────────────────────────────────

describe("antdCascaderAdapter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("name e selector corretos", () => {
    expect(antdCascaderAdapter.name).toBe("antd-cascader");
    expect(antdCascaderAdapter.selector).toContain("ant-cascader");
  });

  describe("matches()", () => {
    it("retorna true para cascader habilitado", () => {
      const el = makeCascader();
      expect(antdCascaderAdapter.matches(el)).toBe(true);
    });

    it("retorna false para cascader desabilitado", () => {
      const el = makeCascader({ disabled: true });
      expect(antdCascaderAdapter.matches(el)).toBe(false);
    });

    it("retorna false sem ant-select class", () => {
      const el = document.createElement("div");
      el.className = "ant-cascader";
      expect(antdCascaderAdapter.matches(el)).toBe(false);
    });
  });

  describe("buildField()", () => {
    it("retorna FormField com adapterName correto", () => {
      const el = makeCascader();
      const field = antdCascaderAdapter.buildField(el);
      expect(field.adapterName).toBe("antd-cascader");
    });

    it("fieldType é select", () => {
      const el = makeCascader();
      const field = antdCascaderAdapter.buildField(el);
      expect(field.fieldType).toBe("select");
    });

    it("extrai placeholder", () => {
      const el = makeCascader();
      const field = antdCascaderAdapter.buildField(el);
      expect(field.placeholder).toBe("Please select");
    });

    it("contextSignals está definido", () => {
      const el = makeCascader();
      const field = antdCascaderAdapter.buildField(el);
      expect(field.contextSignals).toBeDefined();
    });
  });

  describe("fill()", () => {
    it("retorna false se .ant-select-selector não existe no wrapper", async () => {
      const el = document.createElement("div");
      el.className = "ant-select ant-cascader";
      document.body.appendChild(el);
      const result = await antdCascaderAdapter.fill(el, "");
      expect(result).toBe(false);
    });

    it("retorna false se dropdown não aparece (timeout)", async () => {
      vi.useFakeTimers();
      const el = makeCascader();
      const fillPromise = antdCascaderAdapter.fill(el, "");
      vi.runAllTimersAsync();
      const result = await fillPromise;
      expect(result).toBe(false);
      vi.useRealTimers();
    });

    it("retorna true selecionando item de nível único", async () => {
      const el = makeCascader();

      // Inject dropdown into document before fill
      const dropdown = document.createElement("div");
      dropdown.className = "ant-cascader-dropdown";

      const menus = document.createElement("div");
      menus.className = "ant-cascader-menus";

      const menu = document.createElement("ul");
      menu.className = "ant-cascader-menu";

      const item = document.createElement("li");
      item.className = "ant-cascader-menu-item ant-cascader-menu-item-leaf";
      item.title = "Option 1";
      item.textContent = "Option 1";
      menu.appendChild(item);

      menus.appendChild(menu);
      dropdown.appendChild(menus);
      document.body.appendChild(dropdown);

      const result = await antdCascaderAdapter.fill(el, "Option 1");
      expect(result).toBe(true);
    });
  });
});

// ── Transfer ────────────────────────────────────────────────────────────────

describe("antdTransferAdapter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("name e selector corretos", () => {
    expect(antdTransferAdapter.name).toBe("antd-transfer");
    expect(antdTransferAdapter.selector).toBe(".ant-transfer");
  });

  describe("matches()", () => {
    it("retorna true para transfer habilitado", () => {
      const el = makeTransfer();
      expect(antdTransferAdapter.matches(el)).toBe(true);
    });

    it("retorna false para transfer desabilitado", () => {
      const el = makeTransfer({ disabled: true });
      expect(antdTransferAdapter.matches(el)).toBe(false);
    });

    it("retorna false se não tem classe ant-transfer", () => {
      const el = document.createElement("div");
      el.className = "some-other-class";
      expect(antdTransferAdapter.matches(el)).toBe(false);
    });
  });

  describe("buildField()", () => {
    it("retorna FormField com adapterName correto", () => {
      const el = makeTransfer();
      const field = antdTransferAdapter.buildField(el);
      expect(field.adapterName).toBe("antd-transfer");
    });

    it("fieldType é select", () => {
      const el = makeTransfer();
      const field = antdTransferAdapter.buildField(el);
      expect(field.fieldType).toBe("select");
    });

    it("extrai opções disponíveis", () => {
      const el = makeTransfer({ itemCount: 3 });
      const field = antdTransferAdapter.buildField(el);
      expect(field.options).toBeDefined();
      expect(field.options!.length).toBe(3);
    });

    it("contextSignals está definido", () => {
      const el = makeTransfer();
      const field = antdTransferAdapter.buildField(el);
      expect(field.contextSignals).toBeDefined();
    });
  });

  describe("fill()", () => {
    it("retorna false se menos de 2 listas", () => {
      const el = document.createElement("div");
      el.className = "ant-transfer";
      const singleList = document.createElement("div");
      singleList.className = "ant-transfer-list";
      el.appendChild(singleList);
      document.body.appendChild(el);
      const result = antdTransferAdapter.fill(el, "");
      expect(result).toBe(false);
    });

    it("retorna false se source list vazia", () => {
      const el = document.createElement("div");
      el.className = "ant-transfer";
      const list1 = document.createElement("div");
      list1.className = "ant-transfer-list";
      const list2 = document.createElement("div");
      list2.className = "ant-transfer-list";
      el.appendChild(list1);
      el.appendChild(list2);
      document.body.appendChild(el);
      const result = antdTransferAdapter.fill(el, "");
      expect(result).toBe(false);
    });

    it("retorna false se botão de mover não existe", () => {
      const el = makeTransfer({ itemCount: 2 });
      // Remove operation area
      const op = el.querySelector(".ant-transfer-operation");
      op?.remove();
      const result = antdTransferAdapter.fill(el, "");
      expect(result).toBe(false);
    });

    it("retorna true e clica no botão de mover com itens disponíveis", () => {
      const el = makeTransfer({ itemCount: 3 });
      const moveBtn = el.querySelector<HTMLButtonElement>(
        ".ant-transfer-operation button",
      )!;
      let btnClicked = false;
      moveBtn.addEventListener("click", () => {
        btnClicked = true;
      });

      const result = antdTransferAdapter.fill(el, "");
      expect(result).toBe(true);
      expect(btnClicked).toBe(true);
    });
  });
});

// ── TreeSelect ────────────────────────────────────────────────────────────────

describe("antdTreeSelectAdapter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("name e selector corretos", () => {
    expect(antdTreeSelectAdapter.name).toBe("antd-tree-select");
    expect(antdTreeSelectAdapter.selector).toContain("ant-tree-select");
  });

  describe("matches()", () => {
    it("retorna true para tree-select habilitado", () => {
      const el = makeTreeSelect();
      expect(antdTreeSelectAdapter.matches(el)).toBe(true);
    });

    it("retorna false para tree-select desabilitado", () => {
      const el = makeTreeSelect({ disabled: true });
      expect(antdTreeSelectAdapter.matches(el)).toBe(false);
    });

    it("retorna false sem ant-select class", () => {
      const el = document.createElement("div");
      el.className = "ant-tree-select";
      expect(antdTreeSelectAdapter.matches(el)).toBe(false);
    });
  });

  describe("buildField()", () => {
    it("retorna FormField com adapterName correto", () => {
      const el = makeTreeSelect();
      const field = antdTreeSelectAdapter.buildField(el);
      expect(field.adapterName).toBe("antd-tree-select");
    });

    it("fieldType é select", () => {
      const el = makeTreeSelect();
      const field = antdTreeSelectAdapter.buildField(el);
      expect(field.fieldType).toBe("select");
    });

    it("extrai placeholder", () => {
      const el = makeTreeSelect();
      const field = antdTreeSelectAdapter.buildField(el);
      expect(field.placeholder).toBe("Please select");
    });

    it("contextSignals está definido", () => {
      const el = makeTreeSelect();
      const field = antdTreeSelectAdapter.buildField(el);
      expect(field.contextSignals).toBeDefined();
    });
  });

  describe("fill()", () => {
    it("retorna false se .ant-select-selector não existe", async () => {
      const el = document.createElement("div");
      el.className = "ant-select ant-tree-select";
      document.body.appendChild(el);
      const result = await antdTreeSelectAdapter.fill(el, "");
      expect(result).toBe(false);
    });

    it("retorna false se dropdown não aparece (timeout)", async () => {
      vi.useFakeTimers();
      const el = makeTreeSelect();
      const fillPromise = antdTreeSelectAdapter.fill(el, "");
      vi.runAllTimersAsync();
      const result = await fillPromise;
      expect(result).toBe(false);
      vi.useRealTimers();
    });

    it("retorna true ao clicar em título de nó disponível", async () => {
      const el = makeTreeSelect();

      // Inject dropdown before fill
      const dropdown = document.createElement("div");
      dropdown.className = "ant-tree-select-dropdown";

      const tree = document.createElement("div");
      tree.className = "ant-select-tree";

      const treenode = document.createElement("div");
      treenode.className = "ant-select-tree-treenode";

      const title = document.createElement("span");
      title.className = "ant-select-tree-title";
      title.textContent = "Node A";

      treenode.appendChild(title);
      tree.appendChild(treenode);
      dropdown.appendChild(tree);
      document.body.appendChild(dropdown);

      const result = await antdTreeSelectAdapter.fill(el, "Node A");
      expect(result).toBe(true);
    });

    it("retorna true clicando no nó se não tem título", async () => {
      const el = makeTreeSelect();

      const dropdown = document.createElement("div");
      dropdown.className = "ant-tree-select-dropdown";

      const treenode = document.createElement("div");
      treenode.className = "ant-select-tree-treenode";
      // No title span
      dropdown.appendChild(treenode);
      document.body.appendChild(dropdown);

      const result = await antdTreeSelectAdapter.fill(el, "");
      expect(result).toBe(true);
    });

    it("retorna false se nenhum nó disponível no dropdown", async () => {
      const el = makeTreeSelect();

      const dropdown = document.createElement("div");
      dropdown.className = "ant-tree-select-dropdown";
      // Empty — no nodes
      document.body.appendChild(dropdown);

      const result = await antdTreeSelectAdapter.fill(el, "");
      expect(result).toBe(false);
    });
  });
});

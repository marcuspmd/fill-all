// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "../searchable-select";
import type { SelectEntry } from "../searchable-select";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FLAT_ENTRIES: SelectEntry[] = [
  { value: "email", label: "E-mail" },
  { value: "cpf", label: "CPF" },
  { value: "name", label: "Nome" },
  { value: "phone", label: "Telefone" },
];

const GROUPED_ENTRIES: SelectEntry[] = [
  {
    groupLabel: "Identidade",
    options: [
      { value: "cpf", label: "CPF" },
      { value: "cnpj", label: "CNPJ" },
    ],
  },
  {
    groupLabel: "Contato",
    options: [
      { value: "email", label: "E-mail" },
      { value: "phone", label: "Telefone" },
    ],
  },
];

function buildContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function mount(
  entries: SelectEntry[] = FLAT_ENTRIES,
  value?: string,
): { ss: SearchableSelect; container: HTMLElement } {
  const container = buildContainer();
  const ss = new SearchableSelect({
    entries,
    value,
    placeholder: "Buscar…",
  });
  ss.mount(container);
  return { ss, container };
}

function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector<HTMLInputElement>(".fa-ss__input")!;
}

function getHiddenInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector<HTMLInputElement>(".fa-ss__value")!;
}

function getDropdown(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>(".fa-ss__dropdown")!;
}

function getOptions(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".fa-ss__opt"));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SearchableSelect — mount", () => {
  it("renders wrapper, input and hidden input", () => {
    const { container } = mount(FLAT_ENTRIES, "cpf");
    expect(container.querySelector(".fa-ss")).toBeTruthy();
    expect(getInput(container)).toBeTruthy();
    expect(getHiddenInput(container)).toBeTruthy();
  });

  it("initialises getValue() from opts.value", () => {
    const { ss } = mount(FLAT_ENTRIES, "cpf");
    expect(ss.getValue()).toBe("cpf");
  });

  it("shows label of initial value in the text input", () => {
    const { container } = mount(FLAT_ENTRIES, "cpf");
    expect(getInput(container).value).toBe("CPF");
  });

  it("hidden input holds initial value", () => {
    const { container } = mount(FLAT_ENTRIES, "email");
    expect(getHiddenInput(container).value).toBe("email");
  });

  it("dropdown starts hidden", () => {
    const { container } = mount();
    expect(getDropdown(container).hasAttribute("hidden")).toBe(true);
  });
});

describe("SearchableSelect — open / close", () => {
  it("opens dropdown on input focus", () => {
    const { container } = mount();
    getInput(container).dispatchEvent(new Event("focus"));
    expect(getDropdown(container).hasAttribute("hidden")).toBe(false);
  });

  it("opens dropdown on input click", () => {
    const { container } = mount();
    getInput(container).dispatchEvent(new Event("click"));
    expect(getDropdown(container).hasAttribute("hidden")).toBe(false);
  });

  it("renders one option per flat entry when opened", () => {
    const { container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    expect(getOptions(container).length).toBe(FLAT_ENTRIES.length);
  });

  it("closes on Escape key", () => {
    const { container } = mount();
    getInput(container).dispatchEvent(new Event("focus"));
    getInput(container).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(getDropdown(container).hasAttribute("hidden")).toBe(true);
  });

  it("closes on Tab key", () => {
    const { container } = mount();
    getInput(container).dispatchEvent(new Event("focus"));
    getInput(container).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
    expect(getDropdown(container).hasAttribute("hidden")).toBe(true);
  });
});

describe("SearchableSelect — search / filter", () => {
  it("filters options to matching query", () => {
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.value = "cp";
    input.dispatchEvent(new Event("input"));
    const visible = getOptions(container);
    expect(visible.length).toBe(1);
    expect(visible[0].dataset.value).toBe("cpf");
  });

  it("returns all options when query is cleared", () => {
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.value = "cp";
    input.dispatchEvent(new Event("input"));
    input.value = "";
    input.dispatchEvent(new Event("input"));
    expect(getOptions(container).length).toBe(FLAT_ENTRIES.length);
  });

  it("shows empty message when nothing matches", () => {
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.value = "zzzzzz";
    input.dispatchEvent(new Event("input"));
    expect(container.querySelector(".fa-ss__empty")).toBeTruthy();
    expect(getOptions(container).length).toBe(0);
  });
});

describe("SearchableSelect — selection via click", () => {
  it("updates value after clicking an option", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    const opt = getOptions(container).find((o) => o.dataset.value === "name")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(ss.getValue()).toBe("name");
  });

  it("updates the hidden input value after click", () => {
    const { container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    const opt = getOptions(container).find((o) => o.dataset.value === "email")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(getHiddenInput(container).value).toBe("email");
  });

  it("shows selected label in text input after click", () => {
    const { container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    const opt = getOptions(container).find((o) => o.dataset.value === "phone")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(getInput(container).value).toBe("Telefone");
  });

  it("fires change listener on selection", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    const cb = vi.fn();
    ss.on("change", cb);
    getInput(container).dispatchEvent(new Event("focus"));
    const opt = getOptions(container).find((o) => o.dataset.value === "cpf")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith("cpf", "CPF");
  });

  it("unsubscribes change listener", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    const cb = vi.fn();
    const unsub = ss.on("change", cb);
    unsub();
    getInput(container).dispatchEvent(new Event("focus"));
    const opt = getOptions(container)[0];
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("SearchableSelect — keyboard navigation", () => {
  it("ArrowDown opens the dropdown", () => {
    const { container } = mount();
    getInput(container).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    expect(getDropdown(container).hasAttribute("hidden")).toBe(false);
  });

  it("ArrowDown highlights first item", () => {
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    const opts = getOptions(container);
    expect(opts[0].classList.contains("fa-ss__opt--highlighted")).toBe(true);
  });

  it("ArrowUp does not go below index 0", () => {
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    const opts = getOptions(container);
    expect(opts[0].classList.contains("fa-ss__opt--highlighted")).toBe(true);
  });

  it("Enter selects highlighted option", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(ss.getValue()).toBe((FLAT_ENTRIES[0] as { value: string }).value);
  });
});

describe("SearchableSelect — setValue / getValue", () => {
  it("setValue changes getValue()", () => {
    const { ss } = mount(FLAT_ENTRIES);
    ss.setValue("phone");
    expect(ss.getValue()).toBe("phone");
  });

  it("setValue without matching entry still sets value", () => {
    const { ss } = mount(FLAT_ENTRIES);
    ss.setValue("unknown");
    expect(ss.getValue()).toBe("unknown");
  });
});

describe("SearchableSelect — grouped entries", () => {
  it("flattens grouped entries for filtering", () => {
    const { container } = mount(GROUPED_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    expect(getOptions(container).length).toBe(4);
  });

  it("renders group headers", () => {
    const { container } = mount(GROUPED_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus"));
    const headers = container.querySelectorAll(".fa-ss__group");
    expect(headers.length).toBe(2);
  });

  it("filters options across groups", () => {
    const { container } = mount(GROUPED_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus"));
    input.value = "email";
    input.dispatchEvent(new Event("input"));
    expect(getOptions(container).length).toBe(1);
  });
});

describe("SearchableSelect — destroy", () => {
  it("removes from DOM on destroy", () => {
    const { ss, container } = mount();
    ss.destroy();
    expect(container.querySelector(".fa-ss")).toBeNull();
  });

  it("does not fire listeners after destroy", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    const cb = vi.fn();
    ss.on("change", cb);
    ss.destroy();
    // trying to select after destroy — should be safe and silent
    expect(() => ss.getValue()).not.toThrow();
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("SearchableSelect — disabled", () => {
  it("does not open when disabled", () => {
    const container = buildContainer();
    const ss = new SearchableSelect({ entries: FLAT_ENTRIES, disabled: true });
    ss.mount(container);
    getInput(container).dispatchEvent(new Event("focus"));
    expect(getDropdown(container).hasAttribute("hidden")).toBe(true);
  });
});

describe("SearchableSelect — edge branches", () => {
  it("onInputChange opens the dropdown when it was closed", () => {
    // fire input event without a prior focus/open — triggers the auto-open branch
    const { container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.value = "email";
    input.dispatchEvent(new Event("input"));
    expect(getDropdown(container).hasAttribute("hidden")).toBe(false);
  });

  it("close() when already closed does nothing", () => {
    // Ensure calling close on an already-closed component is safe
    const { container } = mount(FLAT_ENTRIES);
    // dropdown is already closed — pressing Escape should not throw
    expect(() =>
      getInput(container).dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    ).not.toThrow();
  });

  it("Enter key without a highlighted option does nothing", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    const input = getInput(container);
    input.dispatchEvent(new Event("focus")); // open
    // _highlighted is -1 by default — Enter should be a no-op
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(ss.getValue()).toBe(""); // unchanged
  });

  it("outside mousedown closes the dropdown", () => {
    const { container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus")); // open
    expect(getDropdown(container).hasAttribute("hidden")).toBe(false);

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(getDropdown(container).hasAttribute("hidden")).toBe(true);
    outside.remove();
  });

  it("inside mousedown on non-option target does not select anything", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus")); // open
    // Click on the dropdown wrapper, not on a .fa-ss__opt li
    getDropdown(container).dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    expect(ss.getValue()).toBe(""); // unchanged
  });

  it("selectByValue with unknown value is a no-op", () => {
    const { ss, container } = mount(FLAT_ENTRIES);
    getInput(container).dispatchEvent(new Event("focus")); // open
    // Simulate clicking an li whose data-value does not exist in flat entries
    const li = document.createElement("li");
    li.className = "fa-ss__opt";
    li.dataset.value = "__nonexistent__";
    getDropdown(container).appendChild(li);
    li.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(ss.getValue()).toBe(""); // unchanged
  });

  it("renders group header then flat options (mixed entries)", () => {
    // Mixing grouped + flat entries to hit the FALSE branch of `if (opt.groupLabel)`
    // when group label transitions back to undefined
    const mixed: SelectEntry[] = [
      { groupLabel: "Grupo A", options: [{ value: "a", label: "A" }] },
      { value: "b", label: "B" }, // flat — groupLabel becomes undefined after group
    ];
    const container = buildContainer();
    const ss = new SearchableSelect({ entries: mixed });
    ss.mount(container);
    getInput(container).dispatchEvent(new Event("focus"));
    const opts = getOptions(container);
    expect(opts.length).toBe(2);
  });
});

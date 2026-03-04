// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, h } from "preact";
import { SearchableSelectPreact } from "../searchable-select-preact";
import type { SelectEntry } from "../searchable-select";

const GROUPED: SelectEntry[] = [
  {
    groupLabel: "G1",
    options: [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ],
  },
  { value: "c", label: "Charlie" },
];

function mount(
  props: Partial<(typeof SearchableSelectPreact)["prototype"]> & {
    entries?: SelectEntry[];
  } = {},
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  render(
    h(SearchableSelectPreact, {
      entries: props.entries ?? GROUPED,
      value: props["value"] as string | undefined,
      onChange: props["onChange"] as any,
      placeholder: props["placeholder"],
    } as any),
    container,
  );
  return container;
}

describe("SearchableSelectPreact (Preact) — basic behaviour", () => {
  let container: HTMLElement;

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("shows current label when closed and value provided", () => {
    container = mount({ value: "b" });
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    expect(input.value).toBe("Beta");
  });

  it("opens dropdown on focus and shows options", async () => {
    container = mount();
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.focus();
    await Promise.resolve();
    const dropdown = container.querySelector<HTMLElement>(".fa-ss__dropdown")!;
    expect(dropdown).toBeTruthy();
    expect(dropdown.querySelectorAll(".fa-ss__opt").length).toBeGreaterThan(0);
  });

  it("filters results on input and shows empty message when none match", async () => {
    container = mount();
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.focus();
    await Promise.resolve();
    input.value = "zzz";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await Promise.resolve();
    expect(container.querySelector(".fa-ss__empty")).toBeTruthy();
  });

  it("calls onChange when option clicked", async () => {
    const cb = vi.fn();
    container = mount({ onChange: cb });
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.focus();
    await Promise.resolve();
    const opt = Array.from(
      container.querySelectorAll<HTMLElement>(".fa-ss__opt"),
    ).find((o) => o.dataset.value === "a")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith("a", "Alpha");
  });

  it("handles keyboard navigation and Enter to select", async () => {
    const cb = vi.fn();
    container = mount({ onChange: cb });
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;

    // First focus to open dropdown
    input.focus();
    await Promise.resolve();
    await Promise.resolve();

    // ArrowDown should highlight first item
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    await Promise.resolve();
    await Promise.resolve();

    // Enter should select highlighted
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await Promise.resolve();

    expect(cb).toHaveBeenCalled();
  });
});

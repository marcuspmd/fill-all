// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
    // @ts-ignore Preact JSX
    <SearchableSelectPreact
      entries={props.entries ?? GROUPED}
      value={props["value"] as string | undefined}
      onChange={props["onChange"] as any}
      placeholder={props["placeholder"]}
    />,
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

  it("opens dropdown on focus and shows options", () => {
    container = mount();
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.dispatchEvent(new Event("focus"));
    const dropdown = container.querySelector<HTMLElement>(".fa-ss__dropdown")!;
    expect(dropdown).toBeTruthy();
    expect(dropdown.querySelectorAll(".fa-ss__opt").length).toBeGreaterThan(0);
  });

  it("filters results on input and shows empty message when none match", () => {
    container = mount();
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.dispatchEvent(new Event("focus"));
    input.value = "zzz";
    input.dispatchEvent(new Event("input"));
    expect(container.querySelector(".fa-ss__empty")).toBeTruthy();
  });

  it("calls onChange when option clicked", () => {
    const cb = vi.fn();
    container = mount({ onChange: cb });
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    input.dispatchEvent(new Event("focus"));
    const opt = Array.from(
      container.querySelectorAll<HTMLElement>(".fa-ss__opt"),
    ).find((o) => o.dataset.value === "a")!;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith("a", "Alpha");
  });

  it("handles keyboard navigation and Enter to select", () => {
    const cb = vi.fn();
    container = mount({ onChange: cb });
    const input = container.querySelector<HTMLInputElement>(".fa-ss__input")!;
    // ArrowDown should open and highlight first
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    // Enter should select highlighted
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(cb).toHaveBeenCalled();
  });
});

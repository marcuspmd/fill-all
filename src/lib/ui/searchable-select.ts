/**
 * SearchableSelect — vanilla DOM component that replaces a `<select>` with
 * a searchable dropdown. Framework-agnostic; works in content scripts, popup
 * and options page.
 *
 * API:
 *   const ss = new SearchableSelect(options);
 *   ss.mount(container);      // renders into a given HTMLElement
 *   ss.getValue()             // → current value
 *   ss.setValue(v)            // programmatically set value
 *   ss.destroy()              // remove DOM + listeners
 *   ss.on("change", cb)       // subscribe to selection changes
 */

import { escHtml } from "./html-utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  groupLabel: string;
  options: SelectOption[];
}

export type SelectEntry = SelectOption | SelectOptionGroup;

function isGroup(entry: SelectEntry): entry is SelectOptionGroup {
  return "groupLabel" in entry;
}

export interface SearchableSelectOptions {
  /** Options or grouped list of options. */
  entries: SelectEntry[];
  /** Initial selected value. */
  value?: string;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** CSS class(es) to add to the root wrapper. */
  className?: string;
  /** Whether to disable the component. */
  disabled?: boolean;
}

type ChangeListener = (value: string, label: string) => void;

/** Builds a flat searchable list from entries */
function flattenEntries(
  entries: SelectEntry[],
): Array<SelectOption & { groupLabel?: string }> {
  const result: Array<SelectOption & { groupLabel?: string }> = [];
  for (const entry of entries) {
    if (isGroup(entry)) {
      for (const o of entry.options) {
        result.push({ ...o, groupLabel: entry.groupLabel });
      }
    } else {
      result.push(entry);
    }
  }
  return result;
}

export class SearchableSelect {
  private root: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private dropdown: HTMLElement | null = null;
  private hiddenInput: HTMLInputElement | null = null;

  private _value: string;
  private _label: string = "";
  private _open = false;
  private _highlighted: number = -1;

  private readonly flat: Array<SelectOption & { groupLabel?: string }>;
  private _listeners: ChangeListener[] = [];

  private boundHandleOutsideClick: (e: MouseEvent) => void;
  private boundInputFocus: (() => void) | null = null;
  private boundInputClick: (() => void) | null = null;
  private boundInputChange: (() => void) | null = null;
  private boundInputKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundDropdownMouseDown: ((e: MouseEvent) => void) | null = null;

  constructor(private readonly opts: SearchableSelectOptions) {
    this.flat = flattenEntries(opts.entries);
    this._value = opts.value ?? "";
    const found = this.flat.find((o) => o.value === this._value);
    this._label = found?.label ?? "";
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
  }

  /** Subscribe to value changes. Returns unsubscribe function. */
  on(event: "change", cb: ChangeListener): () => void {
    if (event === "change") {
      this._listeners.push(cb);
    }
    return () => {
      this._listeners = this._listeners.filter((l) => l !== cb);
    };
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: string): void {
    const found = this.flat.find((o) => o.value === value);
    this._value = value;
    this._label = found?.label ?? value;
    if (this.input) this.input.value = this._label;
    if (this.hiddenInput) this.hiddenInput.value = this._value;
  }

  /** Mount the component inside `container`. */
  mount(container: HTMLElement): this {
    const wrapper = document.createElement("div");
    wrapper.className = [
      "fa-ss",
      this.opts.className ?? "",
      this.opts.disabled ? "fa-ss--disabled" : "",
    ]
      .filter(Boolean)
      .join(" ");

    wrapper.innerHTML = `
      <div class="fa-ss__input-wrap">
        <input
          type="text"
          class="fa-ss__input"
          autocomplete="off"
          spellcheck="false"
          placeholder="${escHtml(this.opts.placeholder ?? "Pesquisar…")}"
          value="${escHtml(this._label)}"
          ${this.opts.disabled ? "disabled" : ""}
          aria-haspopup="listbox"
          aria-expanded="false"
          role="combobox"
        />
        <span class="fa-ss__arrow" aria-hidden="true">▾</span>
      </div>
      <div class="fa-ss__dropdown" role="listbox" hidden></div>
      <input type="hidden" class="fa-ss__value" value="${escHtml(this._value)}" />
    `;

    this.root = wrapper;
    this.input = wrapper.querySelector<HTMLInputElement>(".fa-ss__input")!;
    this.dropdown = wrapper.querySelector<HTMLElement>(".fa-ss__dropdown")!;
    this.hiddenInput =
      wrapper.querySelector<HTMLInputElement>(".fa-ss__value")!;

    this.bindEvents();
    container.appendChild(wrapper);
    return this;
  }

  destroy(): void {
    // Remove all event listeners
    if (this.input) {
      if (this.boundInputFocus)
        this.input.removeEventListener("focus", this.boundInputFocus);
      if (this.boundInputClick)
        this.input.removeEventListener("click", this.boundInputClick);
      if (this.boundInputChange)
        this.input.removeEventListener("input", this.boundInputChange);
      if (this.boundInputKeyDown)
        this.input.removeEventListener("keydown", this.boundInputKeyDown);
    }
    if (this.dropdown && this.boundDropdownMouseDown) {
      this.dropdown.removeEventListener(
        "mousedown",
        this.boundDropdownMouseDown,
      );
    }
    document.removeEventListener("mousedown", this.boundHandleOutsideClick);

    // Clear references
    this.root?.remove();
    this.root = null;
    this.input = null;
    this.dropdown = null;
    this.hiddenInput = null;
    this._listeners = [];
    this.boundInputFocus = null;
    this.boundInputClick = null;
    this.boundInputChange = null;
    this.boundInputKeyDown = null;
    this.boundDropdownMouseDown = null;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private bindEvents(): void {
    if (!this.input || !this.dropdown) return;

    this.boundInputFocus = () => this.open();
    this.boundInputClick = () => this.open();
    this.boundInputChange = () => this.onInputChange();
    this.boundInputKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
    this.boundDropdownMouseDown = (e: MouseEvent) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>(".fa-ss__opt");
      if (!li || li.dataset.disabled) return;
      e.preventDefault();
      this.selectByValue(li.dataset.value!);
    };

    this.input.addEventListener("focus", this.boundInputFocus);
    this.input.addEventListener("click", this.boundInputClick);
    this.input.addEventListener("input", this.boundInputChange);
    this.input.addEventListener("keydown", this.boundInputKeyDown);
    this.dropdown.addEventListener("mousedown", this.boundDropdownMouseDown);
    document.addEventListener("mousedown", this.boundHandleOutsideClick);
  }

  private open(): void {
    if (this._open || this.opts.disabled) return;
    this._open = true;
    this._highlighted = -1;
    this.input!.value = "";
    this.input!.setAttribute("aria-expanded", "true");
    this.renderOptions(this.flat);
    this.dropdown!.removeAttribute("hidden");
  }

  private close(restoreLabel = true): void {
    if (!this._open) return;
    this._open = false;
    this.input!.setAttribute("aria-expanded", "false");
    this.dropdown!.setAttribute("hidden", "");
    if (restoreLabel && this.input) {
      this.input.value = this._label;
    }
  }

  private onInputChange(): void {
    if (!this._open) this.open();
    const query = this.input!.value.toLowerCase();
    const filtered = this.flat.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.value.toLowerCase().includes(query),
    );
    this._highlighted = -1;
    this.renderOptions(filtered);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const items = this.dropdown
      ? Array.from(this.dropdown.querySelectorAll<HTMLElement>(".fa-ss__opt"))
      : [];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!this._open) {
        this.open();
        return;
      }
      this._highlighted = Math.min(this._highlighted + 1, items.length - 1);
      this.highlightItem(items, this._highlighted);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._highlighted = Math.max(this._highlighted - 1, 0);
      this.highlightItem(items, this._highlighted);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[this._highlighted];
      if (item) {
        this.selectByValue(item.dataset.value!);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      this.close();
    }
  }

  private highlightItem(items: HTMLElement[], index: number): void {
    for (const item of items) item.classList.remove("fa-ss__opt--highlighted");
    const target = items[index];
    if (target) {
      target.classList.add("fa-ss__opt--highlighted");
      target.scrollIntoView({ block: "nearest" });
    }
  }

  private selectByValue(value: string): void {
    const found = this.flat.find((o) => o.value === value);
    if (!found) return;
    this._value = found.value;
    this._label = found.label;
    if (this.hiddenInput) this.hiddenInput.value = this._value;
    this.close(false);
    if (this.input) this.input.value = this._label;
    for (const cb of this._listeners) cb(this._value, this._label);
  }

  private renderOptions(
    filtered: Array<SelectOption & { groupLabel?: string }>,
  ): void {
    if (!this.dropdown) return;

    if (filtered.length === 0) {
      this.dropdown.innerHTML = `<li class="fa-ss__empty" role="option">Nenhum resultado</li>`;
      return;
    }

    const html: string[] = [];
    let lastGroup: string | undefined = undefined;

    for (const opt of filtered) {
      if (opt.groupLabel !== lastGroup) {
        lastGroup = opt.groupLabel;
        if (opt.groupLabel) {
          html.push(
            `<li class="fa-ss__group" role="presentation">${escHtml(opt.groupLabel)}</li>`,
          );
        }
      }
      const selected = opt.value === this._value;
      html.push(
        `<li class="fa-ss__opt${selected ? " fa-ss__opt--selected" : ""}"
             role="option"
             aria-selected="${selected}"
             data-value="${escHtml(opt.value)}"
         >${escHtml(opt.label)}</li>`,
      );
    }

    this.dropdown.innerHTML = html.join("");
  }

  private handleOutsideClick(e: MouseEvent): void {
    if (!this._open) return;
    if (this.root && !this.root.contains(e.target as Node)) {
      this.close();
    }
  }
}

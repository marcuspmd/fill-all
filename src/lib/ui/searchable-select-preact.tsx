/**
 * SearchableSelectPreact — versão Preact do SearchableSelect vanilla.
 *
 * Componente controlado: aceita `value` e `onChange` externos.
 * A mesma API de entries/grupos do componente vanilla.
 *
 * Uso:
 *   <SearchableSelectPreact
 *     entries={entries}
 *     value={value}
 *     onChange={(v, label) => setValue(v)}
 *     placeholder="Pesquisar…"
 *   />
 */

import { h } from "preact";
import { useState, useRef, useEffect, useCallback } from "preact/hooks";
import type {
  SelectEntry,
  SelectOption,
  SelectOptionGroup,
} from "./searchable-select";

export type { SelectEntry, SelectOption, SelectOptionGroup };

export interface SearchableSelectPreactProps {
  entries: SelectEntry[];
  value?: string;
  onChange?: (value: string, label: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function isGroup(entry: SelectEntry): entry is SelectOptionGroup {
  return "groupLabel" in entry;
}

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

function findLabel(
  flat: Array<SelectOption & { groupLabel?: string }>,
  value: string,
): string {
  return flat.find((o) => o.value === value)?.label ?? value;
}

export function SearchableSelectPreact({
  entries,
  value = "",
  onChange,
  placeholder = "Pesquisar…",
  className,
  disabled = false,
  id,
}: SearchableSelectPreactProps) {
  const flat = flattenEntries(entries);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLabel = findLabel(flat, value);

  const filtered = query
    ? flat.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.value.toLowerCase().includes(query.toLowerCase()),
      )
    : flat;

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlighted(-1);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setHighlighted(-1);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlighted(-1);
  }, []);

  const selectOption = useCallback(
    (opt: SelectOption) => {
      onChange?.(opt.value, opt.label);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) {
          openDropdown();
          return;
        }
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[highlighted];
        if (item) selectOption(item);
      } else if (e.key === "Escape" || e.key === "Tab") {
        closeDropdown();
      }
    },
    [open, filtered, highlighted, openDropdown, closeDropdown, selectOption],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted < 0) return;
    const items = rootRef.current?.querySelectorAll<HTMLElement>(".fa-ss__opt");
    const target = items?.[highlighted];
    target?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const rootClass = [
    "fa-ss",
    className ?? "",
    disabled ? "fa-ss--disabled" : "",
    open ? "fa-ss--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div class={rootClass} ref={rootRef} id={id}>
      <div class="fa-ss__input-wrap">
        <input
          ref={inputRef}
          type="text"
          class="fa-ss__input"
          autocomplete="off"
          spellcheck={false}
          placeholder={placeholder}
          value={open ? query : currentLabel}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          role="combobox"
          onFocus={openDropdown}
          onClick={openDropdown}
          onInput={(e) => {
            setQuery((e.target as HTMLInputElement).value);
            setHighlighted(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        <span class="fa-ss__arrow" aria-hidden="true">
          ▾
        </span>
      </div>

      {open && (
        <ul class="fa-ss__dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li class="fa-ss__empty" role="option">
              Nenhum resultado
            </li>
          ) : (
            renderOptions(filtered, value, highlighted, selectOption)
          )}
        </ul>
      )}

      <input type="hidden" class="fa-ss__value" value={value} />
    </div>
  );
}

function renderOptions(
  filtered: Array<SelectOption & { groupLabel?: string }>,
  currentValue: string,
  highlighted: number,
  onSelect: (opt: SelectOption) => void,
): h.JSX.Element[] {
  const elements: h.JSX.Element[] = [];
  let lastGroup: string | undefined = undefined;

  filtered.forEach((opt, i) => {
    if (opt.groupLabel !== lastGroup) {
      lastGroup = opt.groupLabel;
      if (opt.groupLabel) {
        elements.push(
          <li
            key={`group-${opt.groupLabel}`}
            class="fa-ss__group"
            role="presentation"
          >
            {opt.groupLabel}
          </li>,
        );
      }
    }

    const isSelected = opt.value === currentValue;
    const isHighlighted = i === highlighted;

    elements.push(
      <li
        key={opt.value}
        class={[
          "fa-ss__opt",
          isSelected ? "fa-ss__opt--selected" : "",
          isHighlighted ? "fa-ss__opt--highlighted" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="option"
        aria-selected={isSelected}
        data-value={opt.value}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(opt);
        }}
        onMouseEnter={() => {}}
      >
        {opt.label}
      </li>,
    );
  });

  return elements;
}

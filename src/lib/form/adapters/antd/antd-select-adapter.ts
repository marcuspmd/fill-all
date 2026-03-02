/**
 * Ant Design Select Adapter
 *
 * Detects and fills `<Select>`, `<TreeSelect>`, `<Cascader>`, and `<AutoComplete>` components.
 *
 * DOM structure — Single (antd v5 classic):
 *   <div class="ant-select ant-select-single ...">
 *     <div class="ant-select-selector">
 *       <span class="ant-select-selection-search">
 *         <input role="combobox" class="ant-select-selection-search-input" />
 *       </span>
 *       <span class="ant-select-selection-placeholder">Placeholder</span>
 *       <span class="ant-select-selection-item">Selected text</span>
 *     </div>
 *   </div>
 *
 * DOM structure — Single (antd v5 CSS-var / v5.17+):
 *   <div class="ant-select ant-select-single ant-select-css-var ...">
 *     <div class="ant-select-content">
 *       <div class="ant-select-placeholder">Placeholder</div>
 *       <input class="ant-select-input" role="combobox" type="search" />
 *     </div>
 *     <div class="ant-select-suffix">...</div>
 *   </div>
 *
 * DOM structure — Multiple (antd v5):
 *   <div class="ant-select ant-select-multiple ...">
 *     <div class="ant-select-content">
 *       <div class="ant-select-content-item">
 *         <span class="ant-select-selection-item">Tag selecionada</span>
 *       </div>
 *       <div class="ant-select-content-item ant-select-content-item-suffix">
 *         <input class="ant-select-input" role="combobox" type="search" />
 *       </div>
 *     </div>
 *   </div>
 *
 * Filling: Opens dropdown, searches for the value, clicks matching option.
 * Multiple mode: selects 1–3 options randomly (or matches comma-separated values).
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  findAntLabel,
  findAntId,
  findAntName,
  isAntRequired,
  simulateClick,
  getUniqueSelector,
  waitForElement,
} from "./antd-utils";
import { buildSignals } from "../../extractors";
import { createLogger } from "@/lib/logger";

const log = createLogger("AntdSelect");

export const antdSelectAdapter: CustomComponentAdapter = {
  name: "antd-select",
  // Exclude auto-complete: it also has .ant-select but has its own adapter that
  // comes after this one in the registry. Without the exclusion, auto-complete
  // elements would be claimed here before antdAutoCompleteAdapter runs.
  selector:
    ".ant-select:not(.ant-select-auto-complete):not(.ant-select-disabled)",

  matches(el: HTMLElement): boolean {
    // Must have the ant-select class, not disabled, and not an AutoComplete
    // (AutoComplete also has .ant-select — its dedicated adapter handles it).
    return (
      el.classList.contains("ant-select") &&
      !el.classList.contains("ant-select-disabled") &&
      !el.classList.contains("ant-select-auto-complete")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    // Old antd v5 uses .ant-select-selection-placeholder; new CSS-var structure uses .ant-select-placeholder
    const placeholder = (
      wrapper.querySelector<HTMLElement>(".ant-select-selection-placeholder") ??
      wrapper.querySelector<HTMLElement>(".ant-select-placeholder")
    )?.textContent?.trim();

    const isMultiple = wrapper.classList.contains("ant-select-multiple");
    const options = extractDropdownOptions(wrapper);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: isMultiple ? "multiselect" : "select",
      adapterName: "antd-select",
      label: findAntLabel(wrapper),
      name: findAntName(wrapper),
      id: findAntId(wrapper),
      placeholder,
      required: isAntRequired(wrapper),
      options,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  async fill(wrapper: HTMLElement, value: string): Promise<boolean> {
    const isMultiple = wrapper.classList.contains("ant-select-multiple");
    const wrapperSelector = getUniqueSelector(wrapper);

    const combobox = wrapper.querySelector<HTMLInputElement>(
      "input[role='combobox'], .ant-select-selection-search-input, .ant-select-input",
    );

    // Old antd v5 classic: has .ant-select-selector wrapping the search input.
    // New antd v5 CSS-var / v5.17+: no .ant-select-selector; the input is a direct
    // child of .ant-select-content and IS the toggle trigger.
    // IMPORTANT: for the new structure, we must NOT fire mousedown on BOTH the
    // input and its parent — two consecutive mousedowns on the same React handler
    // chain cause an open/close toggle leaving the dropdown closed.
    const selectorEl = wrapper.querySelector<HTMLElement>(
      ".ant-select-selector",
    );

    if (!selectorEl && !combobox) {
      log.warn(`Container do select não encontrado em: ${wrapperSelector}`);
      return false;
    }

    if (selectorEl) {
      // Old structure: focus + mousedown on search input, then simulateClick selector.
      if (combobox) {
        combobox.focus();
        combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      }
      simulateClick(selectorEl);
    } else {
      // New CSS-var structure: dispatch mousedown ONLY on the input.
      // A full simulateClick (mousedown → mouseup → click) would cause React to
      // process the 'click' handler and toggle the dropdown closed immediately
      // after the 'mousedown' handler opened it.
      if (combobox) {
        combobox.focus();
        combobox.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
        );
      } else {
        // Fallback: trigger via the content wrapper
        const contentEl = wrapper.querySelector<HTMLElement>(
          ".ant-select-content",
        );
        if (contentEl) {
          contentEl.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
          );
        }
      }
    }

    // Wait for the dropdown to render
    const dropdown = await waitForElement(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
      800,
    );

    if (!dropdown) {
      // Last attempt: pointerdown on the direct trigger (single event, no double-fire)
      const triggerEl = selectorEl ?? combobox ?? wrapper;
      triggerEl.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
      );
      await new Promise((r) => setTimeout(r, 300));

      const retryDropdown = document.querySelector<HTMLElement>(
        ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
      );
      if (!retryDropdown) {
        log.warn(
          `Dropdown .ant-select-dropdown não apareceu para: ${wrapperSelector}`,
        );
        return false;
      }
    }

    // Extract listboxId here (before passing to helpers) so both single and
    // multiple paths can scope their dropdown queries to THIS wrapper's portal.
    const listboxId = combobox?.getAttribute("aria-controls") ?? null;

    if (isMultiple) {
      return await selectMultipleOptions(wrapper, value, listboxId);
    }

    return await selectOption(wrapper, value);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDropdownOptions(
  wrapper: HTMLElement,
): Array<{ value: string; text: string }> | undefined {
  // Antd renders options in a portal — try to find them via the dropdown ID
  const listboxId = wrapper
    .querySelector<HTMLElement>("[role='combobox']")
    ?.getAttribute("aria-controls");

  if (listboxId) {
    const listbox = document.getElementById(listboxId);
    if (listbox) {
      const items = listbox.querySelectorAll<HTMLElement>("[role='option']");
      const opts = Array.from(items)
        .map((item) => ({
          value: item.getAttribute("title") ?? item.textContent?.trim() ?? "",
          text: item.textContent?.trim() ?? "",
        }))
        .filter((o) => o.value);

      if (opts.length > 0) return opts;
    }
  }

  return undefined;
}

async function selectOption(
  wrapper: HTMLElement,
  value: string,
): Promise<boolean> {
  const searchInput = wrapper.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input, .ant-select-input",
  );

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;

  // aria-controls on the combobox input points to the listbox ID managed by
  // this specific <Select> instance. We use it to scope ALL dropdown queries
  // to the correct portal element, preventing cross-contamination when another
  // select's dropdown is still animating closed (race condition).
  const listboxId = searchInput?.getAttribute("aria-controls") ?? null;

  const OPTION_SELECTOR =
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option";

  /**
   * Returns the dropdown portal that belongs to THIS select wrapper.
   * Primary: resolves via aria-controls → listbox element → closest dropdown.
   * Fallback: first visible dropdown (legacy / SSR builds that omit aria attrs).
   */
  function getOwnDropdown(): HTMLElement | null {
    if (listboxId) {
      const lb = document.getElementById(listboxId);
      if (lb) {
        const dd = lb.closest<HTMLElement>(".ant-select-dropdown");
        if (dd && !dd.classList.contains("ant-select-dropdown-hidden"))
          return dd;
      }
    }
    // Fallback: first visible dropdown
    return document.querySelector<HTMLElement>(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
    );
  }

  /**
   * Waits until THIS select's dropdown is fully closed (or max ~600 ms).
   * Prevents subsequent selects from picking options from a lingering portal.
   */
  async function waitForDropdownClose(): Promise<void> {
    const deadline = Date.now() + 600;
    while (Date.now() < deadline) {
      const dd = listboxId
        ? document
            .getElementById(listboxId)
            ?.closest<HTMLElement>(".ant-select-dropdown")
        : null;
      if (
        !dd ||
        dd.classList.contains("ant-select-dropdown-hidden") ||
        !document.contains(dd)
      )
        return;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  /**
   * Try to find an option matching `val` in THIS wrapper's dropdown.
   * Strategy: exact match first, then word-boundary prefix match.
   * Word-boundary avoids false positives like "TO" matching "Mato Grosso".
   */
  function findMatchingOption(val: string): HTMLElement | null {
    if (!val) return null;
    const norm = val.toLowerCase();
    const prefixRe = new RegExp(
      `\\b${val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
    const dd = getOwnDropdown();
    if (!dd) return null;
    const options = dd.querySelectorAll<HTMLElement>(".ant-select-item-option");
    for (const opt of options) {
      const t = opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
      if (t.toLowerCase() === norm) return opt;
    }
    for (const opt of options) {
      const t = opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
      if (prefixRe.test(t)) return opt;
    }
    return null;
  }

  /** Pick a random non-disabled option from THIS wrapper's dropdown. */
  function pickRandomOption(): HTMLElement | null {
    const dd = getOwnDropdown();
    if (!dd) return null;
    const options = Array.from(
      dd.querySelectorAll<HTMLElement>(
        ".ant-select-item-option:not(.ant-select-item-option-disabled)",
      ),
    );
    if (options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
    return null;
  }

  /** Clear the search input so the full option list is restored. */
  function clearSearchInput(): void {
    if (searchInput && !searchInput.readOnly && nativeInputValueSetter) {
      nativeInputValueSetter.call(searchInput, "");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // Phase 1 — Check options that are already visible right after the dropdown opens
  // (static selects). waitForElement resolves immediately when the element exists,
  // so this adds no delay for already-rendered dropdowns.
  await waitForElement(OPTION_SELECTOR, 800);

  const match1 = findMatchingOption(value);
  if (match1) {
    simulateClick(match1);
    await waitForDropdownClose();
    return true;
  }

  // Phase 2 — For AJAX / searchable selects: type the value to trigger server-side
  // filtering or lazy-loading. Only done when Phase 1 found no match.
  if (searchInput && value && !searchInput.readOnly && nativeInputValueSetter) {
    nativeInputValueSetter.call(searchInput, value);
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.dispatchEvent(new Event("change", { bubbles: true }));

    await waitForElement(OPTION_SELECTOR, 2000);

    const match2 = findMatchingOption(value);
    if (match2) {
      simulateClick(match2);
      await waitForDropdownClose();
      return true;
    }
  }

  // Phase 3 — No match found. Clear any typed search to restore the full option
  // list, then pick a random valid option so the field always ends up with a
  // legitimate value from the actual select options.
  clearSearchInput();
  await waitForElement(OPTION_SELECTOR, 1500);

  const random = pickRandomOption();
  if (random) {
    const randomText =
      random.getAttribute("title") ?? random.textContent?.trim() ?? "";
    log.debug(
      `Fase 3 — nenhuma opção correspondeu a "${value}"; selecionando aleatório: "${randomText}"`,
    );
    simulateClick(random);
    await waitForDropdownClose();
    return true;
  }

  log.warn(
    `Fase 3 — dropdown aberto mas nenhuma opção encontrada (.ant-select-item-option)`,
  );
  return false;
}

/**
 * Selects multiple options from an open ant-select-multiple dropdown.
 *
 * Strategy:
 * 1. If `value` contains comma-separated strings, try to match each one.
 * 2. Otherwise, pick 1–3 random non-selected options from the dropdown.
 * 3. Close the dropdown by pressing Escape after all selections.
 *
 * `listboxId` — the value of `aria-controls` on the combobox input. Used to
 * scope ALL dropdown queries to THIS wrapper's portal so concurrent fills of
 * multiple <Select multiple> fields don't accidentally click options in each
 * other's dropdowns (race condition).
 */
async function selectMultipleOptions(
  wrapper: HTMLElement,
  value: string,
  listboxId: string | null = null,
): Promise<boolean> {
  // Wait for options to load before attempting to click — handles AJAX-loaded selects.
  await waitForElement(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option",
    2000,
  );

  /**
   * Returns the dropdown portal that belongs to THIS wrapper.
   * Primary: resolves via aria-controls → listbox element → closest dropdown.
   * Fallback: first visible dropdown (legacy / SSR builds that omit aria attrs).
   * Scoping here prevents the race condition where a previous select's dropdown
   * is still animating closed when this fill begins.
   */
  function getOwnDropdown(): HTMLElement | null {
    if (listboxId) {
      const lb = document.getElementById(listboxId);
      if (lb) {
        const dd = lb.closest<HTMLElement>(".ant-select-dropdown");
        if (dd && !dd.classList.contains("ant-select-dropdown-hidden"))
          return dd;
      }
    }
    return document.querySelector<HTMLElement>(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
    );
  }

  const dropdown = getOwnDropdown();

  if (!dropdown) {
    log.warn(
      `selectMultipleOptions — dropdown não encontrado para: ${getUniqueSelector(wrapper)}`,
    );
    return false;
  }

  const allOptions = Array.from(
    dropdown.querySelectorAll<HTMLElement>(
      ".ant-select-item-option:not(.ant-select-item-option-disabled)",
    ),
  );

  let selected = false;

  if (allOptions.length > 0) {
    // Collect desired values from comma-separated input (e.g. "Option A, Option B")
    const desiredValues = value
      ? value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    const optionsToClick: HTMLElement[] = [];

    if (desiredValues.length > 0) {
      // Try to find each desired value
      for (const desired of desiredValues) {
        const match = allOptions.find((opt) => {
          const title =
            opt.getAttribute("title") ?? opt.textContent?.trim() ?? "";
          return (
            title.toLowerCase() === desired.toLowerCase() ||
            title.toLowerCase().includes(desired.toLowerCase())
          );
        });
        if (match) optionsToClick.push(match);
      }
    }

    // If nothing matched (or no value provided), pick 1–3 random options
    if (optionsToClick.length === 0) {
      const count = Math.min(
        Math.floor(Math.random() * 3) + 1,
        allOptions.length,
      );
      const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
      optionsToClick.push(...shuffled.slice(0, count));
    }

    for (const opt of optionsToClick) {
      simulateClick(opt);
      selected = true;
    }
  }

  // Close the dropdown by pressing Escape on the search input
  const searchInput = wrapper.querySelector<HTMLInputElement>(
    ".ant-select-selection-search-input, .ant-select-input",
  );
  if (searchInput) {
    searchInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
      }),
    );
  }

  return selected;
}

/**
 * React-Select Adapter
 *
 * Detects and fills react-select v5.x components.
 *
 * DOM structure (searchable):
 *   <div class="react-select-container [css-*-container]">
 *     <div class="react-select__control [css-...]">
 *       <div class="react-select__value-container">
 *         <div class="react-select__placeholder">Placeholder</div>
 *         <div class="react-select__input-container" data-value="">
 *           <input class="react-select__input" role="combobox" type="text" id="..." />
 *         </div>
 *       </div>
 *       <div class="react-select__indicators">...</div>
 *     </div>
 *     <input type="hidden" name="state" value="" />
 *   </div>
 *
 * DOM structure (non-searchable — dummyInput):
 *   Same outer structure, but the inner input has `inputmode="none"` and no
 *   `.react-select__input` class. The input is a DummyInput used only for
 *   accessibility — not for text entry.
 *
 * DOM structure (multi-select):
 *   Hidden input wrapped in a div: <div><input type="hidden" .../></div>
 *   Value container has `.react-select__value-container--is-multi`.
 *
 * Disabled: `.react-select--is-disabled` on the container root.
 *
 * Filling strategy:
 *   1. Focus the combobox input so react-select sets isFocused=true.
 *   2. Click the dropdown indicator (preferred) or control to open the menu.
 *   3. Fallback: ArrowDown key event to guarantee menu opens.
 *   4. Wait for `.react-select__menu` to appear (inline or portaled).
 *   5. For searchable fields: type the value to filter; if no match clear and
 *      fall back to the full unfiltered list.
 *   6. For single-select: click the matching option or the first available one.
 *   7. For multi-select: click up to 3 random options.
 */

import type { FormField } from "@/types";
import type { CustomComponentAdapter } from "../adapter.interface";
import {
  getUniqueSelector,
  buildSignals,
  findLabelWithStrategy,
} from "../../extractors";
import { createLogger } from "@/lib/logger";

const log = createLogger("ReactSelect");

export const reactSelectAdapter: CustomComponentAdapter = {
  name: "react-select",
  selector: ".react-select-container:not(.react-select--is-disabled)",

  matches(el: HTMLElement): boolean {
    return (
      el.classList.contains("react-select-container") &&
      !el.classList.contains("react-select--is-disabled")
    );
  },

  buildField(wrapper: HTMLElement): FormField {
    // Hidden input carries name + value for form submission
    const hiddenInput = wrapper.querySelector<HTMLInputElement>(
      ":scope > input[type='hidden'], :scope > div > input[type='hidden']",
    );

    // Visible input: searchable react-select uses .react-select__input; non-searchable
    // uses a DummyInput (inputmode="none") — both have role="combobox"
    const visibleInput = wrapper.querySelector<HTMLInputElement>(
      ".react-select__input, input[role='combobox']",
    );

    const placeholder = wrapper
      .querySelector<HTMLElement>(".react-select__placeholder")
      ?.textContent?.trim();

    const isMulti =
      wrapper.querySelector(".react-select__value-container--is-multi") !==
      null;

    // Use the visible input as the label anchor first (it likely has an id that
    // a <label for="..."> points to); fall back to the hidden input or wrapper.
    const labelSource = visibleInput ?? hiddenInput ?? wrapper;
    const labelResult = findLabelWithStrategy(labelSource);

    const field: FormField = {
      element: wrapper,
      selector: getUniqueSelector(wrapper),
      category: "unknown",
      fieldType: isMulti ? "multiselect" : "select",
      adapterName: "react-select",
      label: labelResult?.text,
      name: hiddenInput?.name || visibleInput?.name || undefined,
      id: visibleInput?.id || wrapper.id || undefined,
      placeholder,
      required: false,
    };

    field.contextSignals = buildSignals(field);
    return field;
  },

  extractValue(wrapper: HTMLElement): string | null {
    // hidden input usually holds the real value(s)
    const hidden = wrapper.querySelector<HTMLInputElement>(
      ":scope > input[type='hidden'], :scope > div > input[type='hidden']",
    );
    if (hidden && hidden.value) return hidden.value;

    // multi-select labels
    const tags = wrapper.querySelectorAll<HTMLElement>(
      ".react-select__multi-value__label",
    );
    if (tags.length > 0) {
      return Array.from(tags)
        .map((t) => t.textContent?.trim() ?? "")
        .filter((t) => t)
        .join(",");
    }

    return null;
  },

  async fill(wrapper: HTMLElement, value: string): Promise<boolean> {
    const wrapperSelector = getUniqueSelector(wrapper);

    const control = wrapper.querySelector<HTMLElement>(
      ".react-select__control",
    );
    if (!control) {
      log.warn(`Control não encontrado em: ${wrapperSelector}`);
      return false;
    }

    const isMulti =
      wrapper.querySelector(".react-select__value-container--is-multi") !==
      null;

    // Searchable: has .react-select__input (real text input, not dummyInput)
    const searchInput = wrapper.querySelector<HTMLInputElement>(
      ".react-select__input",
    );
    const isSearchable = searchInput !== null;

    // The accessible combobox input for focus/keyboard events
    const comboboxInput =
      wrapper.querySelector<HTMLInputElement>("input[role='combobox']") ??
      searchInput;

    // Step 1: Focus the input so react-select sets isFocused=true.
    // Without this, the first mousedown only focuses (doesn't open the menu).
    comboboxInput?.focus();
    await new Promise<void>((r) => setTimeout(r, 30));

    // Step 2: Prefer clicking the dropdown indicator — its onMouseDown always
    // calls openMenu() directly, unlike the control which first checks isFocused.
    const indicator = wrapper.querySelector<HTMLElement>(
      ".react-select__dropdown-indicator",
    );
    const trigger = indicator ?? control;
    trigger.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
    trigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Step 3: ArrowDown on the focused input opens the menu in react-select v5
    // regardless of onMouseDown outcome — acts as a reliable fallback.
    comboboxInput?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        keyCode: 40,
        bubbles: true,
        cancelable: true,
      }),
    );

    // Step 4: Wait for the menu to render (may be portaled to document.body)
    const menu = await waitForReactSelectMenu(wrapper, 1500);
    if (!menu) {
      log.warn(`Menu react-select não apareceu para: ${wrapperSelector}`);
      return false;
    }

    // Step 5: For searchable fields — type the value to filter options
    // For async-loaded options (API calls), we need to poll until they appear.
    if (isSearchable && searchInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter
        ? nativeSetter.call(searchInput, value)
        : (searchInput.value = value);
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));

      // Poll for options to appear (local or async-loaded)
      await waitForAsyncOptions(menu, 2500);
    }

    let available = Array.from(
      menu.querySelectorAll<HTMLElement>(
        ".react-select__option:not(.react-select__option--is-disabled)",
      ),
    );

    // Step 6: If filtering removed all options, clear the input so the full
    // list is restored and we can still pick the closest match.
    if (available.length === 0 && isSearchable && searchInput) {
      log.debug(
        `Nenhuma opção após filtro — limpando input para: ${wrapperSelector}`,
      );
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeSetter
        ? nativeSetter.call(searchInput, "")
        : (searchInput.value = "");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait for full list to re-populate (async or local)
      await waitForAsyncOptions(menu, 1500);

      available = Array.from(
        menu.querySelectorAll<HTMLElement>(
          ".react-select__option:not(.react-select__option--is-disabled)",
        ),
      );
    }

    if (available.length === 0) {
      log.warn(`Nenhuma opção disponível para: ${wrapperSelector}`);
      // Close dropdown
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      return false;
    }

    if (isMulti) {
      const count = Math.min(3, available.length);
      const shuffled = [...available]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
      for (const opt of shuffled) {
        opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        opt.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise<void>((r) => setTimeout(r, 60));
      }
      // Close the menu if still open after multi selection
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      return true;
    }

    // Single-select: prefer option whose text matches the desired value
    const lower = value.toLowerCase();
    const matched =
      available.find(
        (opt) =>
          opt.textContent?.toLowerCase().includes(lower) ||
          opt.dataset["value"]?.toLowerCase() === lower,
      ) ?? available[0];

    matched.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    matched.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return true;
  },
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Waits for react-select's dropdown menu to appear.
 *
 * react-select renders the menu either:
 *   a) inline — directly inside the container wrapper, OR
 *   b) portaled — appended to `document.body` (menuPortalTarget).
 *
 * Portal detection: react-select sets `aria-controls` on the search input
 * ONLY while the menu is open, so we must read it dynamically (each check),
 * not once at call time.
 *
 * Fallback: scan `document.body` for `.react-select__menu` elements not
 * contained within this wrapper — handles the portal case even without
 * `aria-controls`.
 */
function waitForReactSelectMenu(
  wrapper: HTMLElement,
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const findInline = () =>
    wrapper.querySelector<HTMLElement>(".react-select__menu");

  // Re-read aria-controls on every check because react-select only sets it
  // while the menu is open (aria-expanded="true").
  const findPortaled = (): HTMLElement | null => {
    const input = wrapper.querySelector<HTMLInputElement>(
      "input[aria-controls]",
    );
    const listboxId = input?.getAttribute("aria-controls") ?? null;
    if (listboxId) {
      const listbox = document.getElementById(listboxId);
      const byAriaControls =
        listbox?.closest<HTMLElement>(".react-select__menu") ?? null;
      if (byAriaControls) return byAriaControls;
    }

    // Broader fallback: any .react-select__menu in the document that is NOT
    // a child of this wrapper (i.e. a portaled one).
    const allMenus = Array.from(
      document.querySelectorAll<HTMLElement>(".react-select__menu"),
    );
    return allMenus.find((m) => !wrapper.contains(m)) ?? null;
  };

  const existing = findInline() ?? findPortaled();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const found = findInline() ?? findPortaled();
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(findInline() ?? findPortaled());
    }, timeoutMs);
  });
}

/**
 * Waits for react-select options to appear after a search/filter.
 *
 * Handles both:
 *   - Local filtering (quick, 50–100ms)
 *   - Async-loaded options via API (slow, 500–2000ms)
 *
 * Polls for:
 *   1. Actual `.react-select__option` elements to appear
 *   2. Loading indicators (`.react-select__loading-message`) to disappear
 *   3. No-options message appearing as final state
 *
 * Returns when options are ready OR timeout expires.
 */
async function waitForAsyncOptions(
  menu: HTMLElement,
  timeoutMs: number,
): Promise<void> {
  const startTime = Date.now();
  const pollIntervalMs = 100;

  const hasOptions = () =>
    menu.querySelector<HTMLElement>(
      ".react-select__option:not(.react-select__option--is-disabled)",
    ) !== null;

  const isLoading = () =>
    menu.querySelector<HTMLElement>(".react-select__loading-message") !== null;

  const hasNoOptions = () =>
    menu.querySelector<HTMLElement>(".react-select__menu-notice") !== null;

  // Quick check: are options already there?
  if (hasOptions() || hasNoOptions()) {
    log.debug("Opções já presentes no menu react-select");
    return;
  }

  // Poll until options appear, loading completes, or timeout
  while (Date.now() - startTime < timeoutMs) {
    if (hasOptions() || hasNoOptions()) {
      log.debug(
        `Opções assincronamente carregadas após ${Date.now() - startTime}ms`,
      );
      return;
    }

    if (!isLoading()) {
      // No longer loading but no options either — likely a "no results" state
      // Give it a bit more time to render the notice
      await new Promise<void>((r) => setTimeout(r, 100));
      if (hasNoOptions() || hasOptions()) {
        log.debug("Menu estabilizou (sem resultados ou com opções)");
        return;
      }
    }

    await new Promise<void>((r) => setTimeout(r, pollIntervalMs));
  }

  log.warn(
    `Timeout aguardando opções assincronamente carregadas (${timeoutMs}ms)`,
  );
}

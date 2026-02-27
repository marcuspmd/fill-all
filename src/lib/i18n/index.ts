/**
 * i18n utility — supports both Chrome's native i18n API and a user-selected
 * language override loaded from `_locales/{lang}/messages.json`.
 *
 * Usage:
 *   import { initI18n, t, localizeHTML } from "@/lib/i18n";
 *
 *   // At app startup (once, before any t() or localizeHTML() calls):
 *   await initI18n(settings.uiLanguage); // "auto" | "en" | "pt_BR" | "es"
 *
 *   // In TypeScript:
 *   const label = t("fillAll"); // → "Preencher Tudo" (pt_BR) | "Fill All" (en)
 *
 *   // In HTML — add data-i18n attribute, then call localizeHTML() once:
 *   // <h1 data-i18n="optionsHeader"></h1>
 *   localizeHTML(document);
 */

type MessageEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

type MessageCatalog = Record<string, MessageEntry>;

/** Active override catalog. `null` means use chrome.i18n.getMessage (auto). */
let _catalog: MessageCatalog | null = null;

/**
 * Initialises the i18n catalog for the given language.
 * Must be called once at app startup, before any `t()` or `localizeHTML()` calls.
 * Passing "auto" (default) delegates to Chrome's native locale resolution.
 */
export async function initI18n(
  lang: "auto" | "en" | "pt_BR" | "es" = "auto",
): Promise<void> {
  if (lang === "auto") {
    _catalog = null;
    return;
  }
  try {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const res = await fetch(url);
    if (!res.ok) {
      _catalog = null;
      return;
    }
    _catalog = (await res.json()) as MessageCatalog;
  } catch {
    _catalog = null;
  }
}

function resolveFromCatalog(
  key: string,
  substitutions?: string | string[],
): string | null {
  if (!_catalog) return null;
  const entry = _catalog[key];
  if (!entry) return null;

  let msg = entry.message;
  const subs = substitutions
    ? Array.isArray(substitutions)
      ? substitutions
      : [substitutions]
    : [];

  if (subs.length > 0) {
    if (entry.placeholders) {
      // Named placeholder format: $name$ resolved via placeholders map
      const resolved: Record<string, string> = {};
      for (const [name, { content }] of Object.entries(entry.placeholders)) {
        const match = content.match(/^\$(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10) - 1;
          if (idx < subs.length) resolved[name.toLowerCase()] = subs[idx];
        }
      }
      msg = msg.replace(
        /\$(\w+)\$/g,
        (_, name: string) => resolved[name.toLowerCase()] ?? `$${name}$`,
      );
    } else {
      // Simple positional format: $1, $2, …
      msg = msg.replace(/\$(\d+)/g, (_, n: string) => {
        const idx = parseInt(n, 10) - 1;
        return idx < subs.length ? subs[idx] : `$${n}`;
      });
    }
  }

  return msg || null;
}

/**
 * Returns the localized message for the given key.
 * Falls back to the key itself if the message is not found (useful during development).
 */
export function t(key: string, substitutions?: string | string[]): string {
  if (_catalog) {
    const resolved = resolveFromCatalog(key, substitutions);
    if (resolved !== null) return resolved;
  }
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * Processes all elements with i18n data attributes in `root` and replaces their
 * content/attributes with the localized strings.
 *
 * Supported attributes:
 *   data-i18n             → sets element.textContent
 *   data-i18n-title       → sets element.title
 *   data-i18n-placeholder → sets (element as HTMLInputElement).placeholder
 *   data-i18n-aria-label  → sets element.ariaLabel
 */
export function localizeHTML(root: Document | Element = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const msg = t(el.dataset.i18n!);
    if (msg) el.textContent = msg;
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const msg = t(el.dataset.i18nTitle!);
    if (msg) el.title = msg;
  });

  root
    .querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("[data-i18n-placeholder]")
    .forEach((el) => {
      const msg = t((el as HTMLElement).dataset.i18nPlaceholder!);
      if (msg) el.placeholder = msg;
    });

  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
    const msg = t(el.dataset.i18nAriaLabel!);
    if (msg) el.setAttribute("aria-label", msg);
  });
}

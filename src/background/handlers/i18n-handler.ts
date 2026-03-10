/**
 * i18n Handler — background-resident localization management
 *
 * Persistence optimization: keeps i18n catalogs in the service worker's memory
 * to avoid reloading messages.json on every page navigation.
 *
 * Content scripts request the catalog via GET_I18N_CATALOG and cache locally,
 * but the background retains and shares the cached catalog across all pages.
 *
 * Flow:
 *   1. Background loads catalog once (on first GET_I18N_CATALOG)
 *   2. Send to content script
 *   3. Content script uses locally until page reload
 *   4. Future page loads: skip fetch, use cached background state
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("I18nHandler");

const SUPPORTED: ReadonlyArray<MessageType> = ["GET_I18N_CATALOG"];

// ── Background-resident i18n state (persists across content script reloads) ──

type MessageEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

type MessageCatalog = Record<string, MessageEntry>;

interface CachedI18nCatalog {
  lang: string;
  catalog: MessageCatalog;
}

let _cachedCatalog: CachedI18nCatalog | null = null;
let _catalogLoadPromise: Promise<CachedI18nCatalog | null> | null = null;

// ── Load i18n catalog (non-blocking, deduped) ────────────────────────────────

/**
 * Loads i18n messages from bundled _locales/{lang}/messages.json.
 * Only called once per language — subsequent requests return cached state.
 */
async function loadI18nCatalog(
  lang: "auto" | "en" | "pt_BR" | "es",
): Promise<CachedI18nCatalog | null> {
  // If already cached and same language, return immediately
  if (_cachedCatalog && _cachedCatalog.lang === lang) {
    return _cachedCatalog;
  }

  // If different language requested and still loading, wait
  if (_catalogLoadPromise) {
    return _catalogLoadPromise;
  }

  _catalogLoadPromise = (async () => {
    try {
      // "auto" means use Chrome's native locale — return empty catalog
      if (lang === "auto") {
        _cachedCatalog = {
          lang: "auto",
          catalog: {},
        };
        log.debug("i18n catalog: using Chrome native locale (auto)");
        return _cachedCatalog;
      }

      const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
      const res = await fetch(url);

      if (!res.ok) {
        log.warn(`Failed to fetch i18n catalog for ${lang}: ${res.status}`);
        return null;
      }

      const catalog = (await res.json()) as MessageCatalog;

      if (!catalog || Object.keys(catalog).length === 0) {
        log.warn(`i18n catalog for ${lang} is empty`);
        return null;
      }

      _cachedCatalog = {
        lang,
        catalog,
      };

      log.info(
        `i18n catalog loaded (background): ${lang} with ${Object.keys(catalog).length} entries`,
      );

      return _cachedCatalog;
    } catch (err) {
      log.error(`Failed to load i18n catalog for ${lang}:`, err);
      return null;
    } finally {
      _catalogLoadPromise = null;
    }
  })();

  return _catalogLoadPromise;
}

// ── Message handler ────────────────────────────────────────────────────────────

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_I18N_CATALOG": {
      const payload = message.payload as { lang?: string };
      const lang = (payload?.lang ?? "auto") as "auto" | "en" | "pt_BR" | "es";

      const cached = await loadI18nCatalog(lang);
      if (!cached) {
        log.warn(`i18n catalog not available for ${lang}`);
        return null;
      }

      return {
        lang: cached.lang,
        catalog: cached.catalog,
      };
    }

    default:
      return { error: `Unhandled type in i18nHandler: ${message.type}` };
  }
}

export const i18nHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};

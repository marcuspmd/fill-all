/**
 * Options page — orchestrator that initialises all tab modules.
 */

import "./options.css";
import { initTabs, syncFieldTypeOptionsInOptionsPage } from "./shared";
import { initSettingsTab } from "./settings-section";
import { initRulesTab } from "./rules-section";
import { initFormsTab } from "./forms-section";
import { initCacheTab } from "./cache-section";
import { initDatasetTab } from "./dataset-section";
import { initLogTab } from "./log-section";
import { initI18n, localizeHTML } from "@/lib/i18n";
import type { Settings } from "@/types";

async function main(): Promise<void> {
  const settings = (await chrome.runtime
    .sendMessage({ type: "GET_SETTINGS" })
    .catch(() => null)) as Settings | null;
  await initI18n(settings?.uiLanguage ?? "auto");
  localizeHTML();

  initTabs();
  syncFieldTypeOptionsInOptionsPage();
  initSettingsTab();
  initRulesTab();
  initFormsTab();
  initCacheTab();
  initDatasetTab();
  initLogTab();
}

void main();
